/*jshint sub:true*/
'use strict';

var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');
var schedule = require('node-schedule');
var json2csv = require('json2csv');

var TaskFull = require('./taskFull.model');
var Task = require('../task/task.model');
var Metric = require('../metric/metric.model');
var Hierarchies = require('../hierarchy/hierarchy.model');
var KPI = require('../KPI/KPI.model');
var Dashboard = require('../dashboard/dashboard.model');
var User = require('../user/user.model');
var Anomalie = require('../anomalie/anomalie.model');

var getData = require('../../config/getData');
var tools = require('../../config/tools');

var hierarchyValues = {};
var kpis = {};
var usersList = {};
var timetowait = 7;

// permanent
Hierarchies.find({
  name: 'Task'
}, '-__v', function(err, hierarchy) {
  if (hierarchy[0]) {
    hierarchyValues = hierarchy[0].list;
  }
});

KPI.find({}, '-__v').sort({
  constraint: 1,
  name: 1
}).lean().exec(function(err, mKPI) {
  kpis = mKPI;
})

function calcBusinessDays(dDate1, dDate2) { // input given as Date objects
  var iWeeks, iDateDiff, iAdjust = 0;
  if (dDate2 < dDate1) return 1; // error code if dates transposed
  dDate1 = new Date(dDate1);
  dDate2 = new Date(dDate2);
  var iWeekday1 = dDate1.getDay(); // day of week
  var iWeekday2 = dDate2.getDay();
  iWeekday1 = (iWeekday1 === 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
  iWeekday2 = (iWeekday2 === 0) ? 7 : iWeekday2;
  if ((iWeekday1 > 5) && (iWeekday2 > 5)) iAdjust = 1; // adjustment if both days on weekend
  iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
  iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;

  // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
  iWeeks = Math.floor((dDate2.getTime() - dDate1.getTime()) / 604800000)

  if (iWeekday1 <= iWeekday2) {
    iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1)
  } else {
    iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2)
  }

  iDateDiff -= iAdjust // take into account both days on weekend

  return (iDateDiff + 1); // add 1 because dates are inclusive
}

// Get list of taskFulls
exports.index = function(req, res) {
  var myFilter = (req.query.status) ? {
    $or: [{
      'metrics.status': 'Not Started'
    }, {
      'metrics.status': 'In Progress'
    }]
  } : {};

  if (req.query.userId) {
    myFilter.actors = {
      "$in": [req.query.userId]
    }
  }

  TaskFull.find(myFilter, {
      __v: false,
      alerts: false,
      kpis: false,
      comments: false
    })
    .populate('actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    //.populate('followers', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    //.populate('comments.user', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .lean().exec(function(err, taskFulls) {
      if (err) {
        return handleError(res, err);
      }
      _.each(taskFulls, function(taskFull) {
        _.each(taskFull.actors, function(actor) {
          actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
        });
      });
      //console.log('taskFulls', taskFulls);
      return res.status(200).json(taskFulls);
    });
};

// Get list of hierarchies of taskFulls
exports.listHierarchies = function(req, res) {
  TaskFull.find({}, {
    _id: true,
    context: true,
    activity: true
  }, function(err, taskFulls) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(taskFulls);
  });
};

// Get a single taskFull
exports.show = function(req, res) {
  TaskFull.findById(req.params.id)
    .populate('actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('followers', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('comments.user', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('previousTasks', '_id name actors context activity metrics.status')
    .populate('nextTasks', '_id name actors context activity metrics')
    .populate('anomalies')
    .populate('previousAnomalies', '_id name')
    .lean().exec(function(err, taskFulls) {
      if (err) {
        return handleError(res, err);
      }
      if (!taskFulls) {
        return res.status(404).send('Not Found');
      }
      TaskFull.populate(taskFulls, [{
          path: 'nextTasks.actors',
          model: 'User'
        }, {
          path: 'anomalies.correctiveActions',
          model: 'TaskFull',
          select: '_id name metrics'
        }, {
          path: 'anomalies.preventiveActions',
          model: 'TaskFull',
          select: '_id name metrics'
        }, {
          path: 'anomalies.sourceTasks',
          model: 'TaskFull',
          select: '_id name metrics'
        }],
        function(err, taskFull) {
          _.each(taskFull.kpis, function(kpi) {
            var completekpi = _.filter(kpis, function(thiskpi) {
              return thiskpi._id.toString() === kpi._id.toString();
            })[0];
            kpi.description = completekpi.description;
            kpi.suggestion = completekpi.suggestion;
          });
          _.each(taskFull.alerts, function(alert) {
            var completekpi = _.filter(kpis, function(thiskpi) {
              return thiskpi._id.toString() === alert._id.toString();
            })[0];
            alert.description = completekpi.description;
            alert.suggestion = completekpi.suggestion;
          });
          _.each(taskFull.nextTasks, function(nextTask) {
            _.each(nextTask.actors, function(actor) {
              actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
            });
          });
          _.each(taskFull.actors, function(actor) {
            actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
          });
          _.each(taskFull.followers, function(follower) {
            follower.avatar = (follower.avatar) ? follower.avatar : 'assets/images/avatars/' + follower._id + '.png';
          });
          _.each(taskFull.comments, function(comment) {
            if (comment.user) {
              comment.user.avatar = (comment.user.avatar) ? comment.user.avatar : 'assets/images/avatars/' + comment.user._id + '.png';
            }
          });
          return res.status(200).json(taskFull);
        });
    });
};


// Get count of tasks which start
exports.countByMonth = function(req, res) {
  var o = {};
  o.map = function() {
    emit((new Date(this.metrics[0].targetEndDate)).getFullYear() + '.' + ((new Date(this.metrics[0].targetEndDate)).getMonth() + 1), {
      count: 1,
      qty: this.metrics[0].projectedWorkload || this.metrics[0].targetLoad
    });
  };
  o.reduce = function(k, values) {
    var total = {
      count: 0,
      qty: 0
    };
    for (var i in values) {
      total.qty += values[i].qty;
      total.count += values[i].count;
    }

    return total;
  };

  o.query = JSON.parse(req.query.filterPerimeter.toString().replace('?', '\?'));
  TaskFull.mapReduce(o, function(err, results) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(results);
  });
};



// Get count of tasks which start
exports.countByActivity = function(req, res) {

  var o = {};
  o.map = function() {
    emit(this.activity, // Or put a GROUP BY key here
      {
        sum: this.metrics[0].timeSpent, // the field you want stats for
        min: this.metrics[0].timeSpent,
        max: this.metrics[0].timeSpent,
        count: 1,
        diff: 0, // M2,n:  sum((val-mean)^2)
      });
  };

  o.reduce = function(key, values) {
    var a = values[0]; // will reduce into here
    for (var i = 1 /*!*/ ; i < values.length; i++) {
      var b = values[i]; // will merge 'b' into 'a'


      // temp helpers
      var delta = a.sum / a.count - b.sum / b.count; // a.mean - b.mean
      var weight = (a.count * b.count) / (a.count + b.count);

      // do the reducing
      a.diff += b.diff + delta * delta * weight;
      a.sum += b.sum;
      a.count += b.count;
      a.min = Math.min(a.min, b.min);
      a.max = Math.max(a.max, b.max);
    }

    return a;
  };

  o.finalize = function(key, value) {
    value.sum = parseFloat(value.sum).toFixed(2);
    value.min = parseFloat(value.min).toFixed(2);
    value.max = parseFloat(value.max).toFixed(2);
    value.avg = parseFloat(value.sum / value.count).toFixed(2);
    value.variance = parseFloat(value.diff / value.count).toFixed(2);
    value.stddev = parseFloat(Math.sqrt(value.variance)).toFixed(2);
    value.diff = parseFloat(value.diff).toFixed(2);
    return value;
  };

  o.query = {
    'metrics.status': 'Finished',
    'metrics.endDate': {
      '$gte': new Date('2017-04-01T00:00:00.000Z')
    },
    'metrics.startDate': {
      '$gte': new Date('2017-04-01T00:00:00.000Z')
    }
  };

  TaskFull.mapReduce(o, function(err, results) {
    if (err) {
      return handleError(res, err);
    }
    _.sortBy(results, '_id');
    var mydata = [];
    _.each(results, function(r) {
      mydata.push({
        activity: r._id,
        count: parseFloat(r.value.count),
        min: parseFloat(r.value.min),
        max: parseFloat(r.value.max),
        avg: parseFloat(r.value.avg),
        stddev: parseFloat(r.value.stddev),
        variance: parseFloat(r.value.variance)
      })
    });
    json2csv({
      data: mydata
    }, function(err, csv) {
      res.setHeader('Content-disposition', 'attachment; filename=data.csv');
      res.set('Content-Type', 'text/csv');
      return res.status(200).send(csv);
    });
  });
};


// Get count of tasks which start
exports.exportXLS = function(req, res) {

  TaskFull.find({}, {
      __v: false,
      todo: false,
      watchers: false,
      followers: false,
      alerts: false,
      kpis: false,
      comments: false,
      risks: false,
      reviewTask: false,
      reviewPeriodic: false,
      active: false,
      dashboards: false,
      hypothesis: false,
      description: false,
      todos: false,
      date: false
    })
    .populate('actors', 'name')
    .lean().exec(function(err, taskFulls) {

      _.each(taskFulls, function(taskFull) {
        if (taskFull.actors.length > 0) {
          taskFull.firstActor = taskFull.actors[0].name;
        }
        taskFull.status = taskFull.metrics[taskFull.metrics.length - 1].status;
        taskFull.trust = taskFull.metrics[0].trust;
        taskFull.startDate = taskFull.metrics[0].startDate || new Date(taskFull.metrics[0].targetstartDate);
        taskFull.endDate = taskFull.metrics[taskFull.metrics.length - 1].endDate || new Date(taskFull.metrics[0].targetEndDate);
        taskFull.workload = 0;
        _.each(taskFull.metrics, function(metric) {
          if (typeof metric.projectedWorkload !== 'undefined') {
            taskFull.workload += metric.projectedWorkload;
          } else {
            taskFull.workload += metric.targetLoad;
          }
        });
        delete taskFull.actors;
        delete taskFull.metrics;
      });
      if (err) {
        return handleError(res, err);
      }
      json2csv({
        data: taskFulls
      }, function(err, csv) {
        res.setHeader('Content-disposition', 'attachment; filename=data.csv');
        res.set('Content-Type', 'text/csv');
        return res.status(200).send(csv);
      });
    });
};

// Creates a new taskFull in the DB.
exports.create = function(req, res) {
  var task = req.body;

  // mise à jour des acteurs
  var actors = [];
  _.each(task.actors, function(actor) {
    actors.push(actor._id);
  });
  task.actors = actors;

  // mise à jour des followers
  var followers = [];
  _.each(task.followers, function(follower) {
    followers.push(follower._id);
  });
  task.followers = followers;

  /** Mise en majuscule des axes */
  if (task.activity) {
    task.activity = task.activity.toUpperCase();
  }
  if (task.context) {
    task.context = task.context.toUpperCase();
  }

  // mise à jour des kpis
  task.kpis = [];
  task.alerts = [];
  _.each(kpis, function(kpi, index) {
    var mKPI = {};
    // on ajoute des caractéristiques aux KPI
    //##############################################
    mKPI.calcul = {};
    mKPI._id = kpi._id;
    mKPI.name = kpi.name;
    mKPI.category = kpi.category;
    mKPI.constraint = kpi.constraint;
    mKPI.calcul.task = tools.calculKPI(task.metrics, kpi);
    if (kpi.category === 'Alert') {
      task.alerts.push(mKPI);
    } else {
      task.kpis.push(mKPI);
    }
  });

  TaskFull.create(task, function(err, taskFull) {
    if (err) {
      console.log('err', err);
      return handleError(res, err);
    }
    if (task.previousTasks.length > 0) {
      _.each(task.previousTasks, function(prevTask) {
        process.emit('PrevTaskToUpdate', {
          current: prevTask,
          next: taskFull._id
        });
      });
    }
    process.emit('taskChanged', taskFull);
    return res.status(201).json(taskFull);
  });
};

process.on('PrevTaskToUpdate', function(links) {
  TaskFull.update({
      _id: links.current
    }, {
      $addToSet: {
        nextTasks: links.next
      }
    }, {},
    function(err, result) {
      if (err) {
        console.log('UPDATE', err);
        return;
      }
      if (result) {
        //console.log('result', result);
      }
    });
});

// Updates an existing taskFull in the DB.
exports.update = function(req, res) {
  var task = req.body;
  var blnexecuteDashboard = (req.params.blnexecuteDashboard === 'true');

  if (task._id) {
    delete task._id;
  }

  TaskFull.findById(req.params.id, function(err, taskFull) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskFull) {
      return res.status(404).send('Not Found');
    }

    // date de modification
    task.modifdate = Date();

    var actors = [];
    _.each(task.actors, function(actor) {
      actors.push(actor._id);
    });
    _.each(task.todos, function(todo) {
      if (todo.actor) {
        actors.push(todo.actor._id);
      }
    });
    task.actors = _.compact(_.uniq(actors));

    var followers = [];
    _.each(task.followers, function(follower) {
      followers.push(follower._id);
    });
    task.followers = _.compact(_.uniq(followers));


    var nextTasks = [];
    _.each(task.nextTasks, function(nextTask) {
      nextTasks.push(nextTask._id);
    });
    task.nextTasks = _.compact(_.uniq(nextTasks));

    var previousTasks = [];
    _.each(task.previousTasks, function(previousTask) {
      if (!previousTask._id && previousTask) {
        previousTasks.push(previousTask);
      } else {
        previousTasks.push(previousTask._id);
      }
    });
    task.previousTasks = _.compact(_.uniq(previousTasks));

    var previousAnomalies = [];
    _.each(task.previousAnomalies, function(previousAnomalie) {
      if (!previousAnomalie._id && previousAnomalie) {
        previousAnomalies.push(previousAnomalie);
      } else {
        previousAnomalies.push(previousAnomalie._id);
      }
    });
    task.previousAnomalies = _.compact(_.uniq(previousAnomalies));

    // Suppression des commentaires incomplets
    // var commentsOk = [];
    // _.each(task.comments, function(comment) {
    //   if (comment.user !== null) {
    //     comment.user = comment.user._id;
    //     commentsOk.push(comment);
    //   }
    // });
    // task.comments = commentsOk;

    /** Mise en majuscule des axes */
    if (task.activity) {
      task.activity = task.activity.toUpperCase();
    }
    if (task.context) {
      task.context = task.context.toUpperCase();
    }

    var mainstart = null;
    var targetEndDate = null;
    var reworkstart = null;
    var reworkspent = 0;
    var dateNow = new Date();
    _.each(task.metrics, function(metric, index) { // pour chaque metric

      var startDate = (metric.startDate) ? metric.startDate : metric.targetstartDate;
      var endDate = (metric.endDate) ? metric.endDate : (metric.startDate && index > 0) ? metric.startDate : metric.targetEndDate;
      metric.endDate = endDate;

      metric.targetstartDate = moment(metric.targetstartDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
      metric.targetEndDate = moment(metric.targetEndDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();

      if (metric.startDate) {
        metric.startDate = moment(metric.startDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
      }
      if (metric.endDate) {
        metric.endDate = moment(metric.endDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
      }

      if (index === 0) {
        mainstart = startDate;
        targetEndDate = metric.targetEndDate;
      }

      // nombre de jours séparant la date de début, fin, entre les deux
      metric.duration = Math.max(calcBusinessDays(mainstart, endDate), 0);
      metric.delay = Math.max(calcBusinessDays(targetEndDate, endDate) - 1, 0);

      // predictedCharge
      metric.projectedWorkload = (metric.progress > 0) ? reworkspent + Math.round(1000 * metric.timeSpent * 100 / parseFloat(metric.progress)) / 1000 : metric.targetLoad;
      if (metric.duration === 1 && metric.projectedWorkload <= 1) {
        metric.duration = metric.projectedWorkload;
      }

      // status
      if (metric.status !== 'Withdrawn') {
        if (metric.progress >= 100) {
          metric.status = 'Finished';
        } else if (metric.progress < 100 && metric.progress > 0) {
          metric.status = 'In Progress';
          if (metric.startDate === undefined) {
            metric.startDate = new Date();
          }
        } else {
          metric.status = 'Not Started';
        }
      }

      // progressStatus
      if (moment(metric.endDate).isAfter(targetEndDate, 'day')) {
        metric.progressStatus = 'Late';
      } else {
        metric.progressStatus = 'On Time';
      }

      //on l'ajoute à la liste
      if (metric.progress === 100 || index === task.metrics.length - 1 || metric.status === 'Finished') {
        reworkstart = metric.endDate;
        reworkspent += metric.timeSpent;
      }
    });


    // mise à jour des kpis
    task.kpis = [];
    task.alerts = [];
    _.each(kpis, function(kpi, index) {
      var mKPI = {};
      // on ajoute des caractéristiques aux KPI
      //##############################################
      mKPI.calcul = {};
      mKPI._id = kpi._id;
      mKPI.name = kpi.name;
      mKPI.category = kpi.category;
      mKPI.constraint = kpi.constraint;
      mKPI.calcul.task = tools.calculKPI(task.metrics, kpi);
      if (kpi.category === 'Alert') {
        task.alerts.push(mKPI);
      } else {
        task.kpis.push(mKPI);
      }
    });
    //cumul des anomalies
    Anomalie.find({
      sourceTasks: req.params.id
    }).lean().exec(function(err, findAnomalies) {
      if (err) {
        return handleError(res, err);
      }
      var anomalies = _.map(findAnomalies, function(ano) {
        return ano._id.toString();
      });
      _.each(task.anomalies, function(anomalie) {
        anomalies.push(anomalie._id.toString());
      });
      task.anomalies = _.compact(_.uniq(anomalies));
      var updated = _.merge(taskFull, task);
      updated.markModified('actors');
      updated.markModified('followers');
      updated.markModified('metrics');
      updated.markModified('todos');
      updated.markModified('comments');
      updated.markModified('kpis');
      updated.markModified('alerts');
      updated.markModified('reviewTask');
      updated.markModified('anomalies');
      updated.markModified('previousTasks');
      updated.markModified('previousAnomalies');

      updated.save(function(err) {
        if (err) {
          console.log('err', err);
          return handleError(res, err);
        }
        if (blnexecuteDashboard === true) {
          process.emit('taskChanged', taskFull);
        }
        TaskFull.find({
          previousTasks: req.params.id
        }, function(err, tasksWithPrevious) {
          if (err) {
            return handleError(res, err);
          }
          if (!tasksWithPrevious) {
            return res.status(404).send('Not Found');
          }
          _.each(tasksWithPrevious, function(taskWithPrevious) {
            process.emit('PrevTaskToUpdate', {
              current: req.params.id,
              next: taskWithPrevious._id
            });
            if (updated.nextTasks.indexOf(taskWithPrevious._id.toString()) === -1) {
              updated.nextTasks.push(taskWithPrevious._id.toString());
            }
          });
          updated.nextTasks = _.compact(_.uniq(updated.nextTasks));
          updated.markModified('nextTasks');
          updated.save(function(err) {
            if (err) {
              return handleError(res, err);
            }
            return res.status(200).json(updated);
          });
        });
      });
    });

  });
};


// Updates an existing taskFull in the DB.
exports.updateAllTask = function(req, res) {

  TaskFull.find({}, function(err, taskFulls) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskFulls) {
      return res.status(404).send('Not Found');
    }

    _.each(taskFulls, function(task) {

      // var actors = [];
      // _.each(task.actors, function(actor) {
      //   actors.push(actor._id);
      // });
      // _.each(task.todos, function(todo) {
      //   if (todo.actor) {
      //     actors.push(todo.actor._id);
      //   }
      // });
      if (task.actors) {
        task.actors = _.compact(task.actors);
      }
      //
      // var followers = [];
      // _.each(task.followers, function(follower) {
      //   followers.push(follower._id);
      // });
      // task.followers = followers;
      //
      // _.each(task.comments, function(comment) {
      //   comment.user = comment.user._id;
      // });

      /** Mise en majuscule des axes */
      if (task.activity) {
        task.activity = task.activity.toUpperCase();
      }
      if (task.context) {
        task.context = task.context.toUpperCase();
      }

      var mainstart = null;
      var targetEndDate = null;
      var reworkstart = null;
      var reworkspent = 0;
      var dateNow = new Date();
      _.each(task.metrics, function(metric, index) { // pour chaque metric

        metric.targetstartDate = moment(metric.targetstartDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
        metric.targetEndDate = moment(metric.targetEndDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
        metric.startDate = moment(metric.startDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
        metric.endDate = moment(metric.endDate).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();

        var startDate = (metric.startDate) ? metric.startDate : metric.targetstartDate;
        var endDate = (metric.endDate) ? metric.endDate : (metric.startDate && index > 0) ? metric.startDate : metric.targetEndDate;

        metric.endDate = endDate;

        if (index === 0) {
          mainstart = metric.startDate;
          targetEndDate = metric.targetEndDate;
        }

        // nombre de jours séparant la date de début, fin, entre les deux
        metric.duration = Math.max(calcBusinessDays(mainstart, endDate), 0);
        metric.delay = Math.max(calcBusinessDays(targetEndDate, endDate) - 1, 0);

        // predictedCharge
        metric.projectedWorkload = (metric.progress > 0) ? reworkspent + Math.round(1000 * metric.timeSpent * 100 / parseFloat(metric.progress)) / 1000 : metric.targetLoad;
        if (metric.duration === 1) {
          metric.duration = metric.projectedWorkload;
        }

        // status
        if (metric.status !== 'Withdrawn') {
          if (metric.progress >= 100) {
            metric.status = 'Finished';
          } else if (metric.progress < 100 && metric.progress > 0) {
            metric.status = 'In Progress';
            if (metric.startDate === undefined) {
              metric.startDate = new Date();
            }
          } else {
            metric.status = 'Not Started';
          }
        }

        // progressStatus
        if (moment(metric.endDate).isAfter(targetEndDate, 'day')) {
          metric.progressStatus = 'Late';
        } else {
          metric.progressStatus = 'On Time';
        }

        //on l'ajoute à la liste
        if (metric.progress === 100 || index === task.metrics.length - 1 || metric.status === 'Finished') {
          reworkstart = metric.endDate;
          reworkspent += metric.timeSpent;
        }
      });


      // mise à jour des kpis
      task.kpis = [];
      task.alerts = [];
      _.each(kpis, function(kpi, index) {
        var mKPI = {};
        // on ajoute des caractéristiques aux KPI
        //##############################################
        mKPI.calcul = {};
        mKPI._id = kpi._id;
        mKPI.name = kpi.name;
        mKPI.category = kpi.category;
        mKPI.constraint = kpi.constraint;
        mKPI.calcul.task = tools.calculKPI(task.metrics, kpi);
        if (kpi.category === 'Alert') {
          task.alerts.push(mKPI);
        } else {
          task.kpis.push(mKPI);
        }
      });

      var updated = _.merge(task, task);
      updated.markModified('actors');
      updated.markModified('followers');
      updated.markModified('metrics');
      updated.markModified('comments');
      updated.markModified('todos');
      updated.markModified('kpis');
      updated.markModified('alerts');
      updated.markModified('dashboards');
      updated.markModified('reviewTask');
      task.save(function(err) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(200).json(task);
      });
    });
  });
};

// Deletes a taskFull from the DB.
exports.destroy = function(req, res) {
  TaskFull.findById(req.params.id, function(err, taskFull) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskFull) {
      return res.status(404).send('Not Found');
    }
    process.emit('taskChanged', taskFull);
    taskFull.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

// Get list of tasks
exports.search = function(req, res) {
  TaskFull.find({
    activity: req.query.activity,
    context: req.query.context
  }, function(err, tasks) {
    console.log('err', err);
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json( tasks);
  });
};

// Get list of tasks
exports.standardPERT = function(req, res) {
  TaskFull.find({
      activity: {
        '$regex': req.query.activity || '',
        $options: '-i'
      },
      'metrics.status': 'Finished'
    }, 'context activity actors name metrics').sort({
      context: 'asc'
    })
    .populate('actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .lean().exec(function(err, tasks) {
      _.each(tasks, function(task) {
        var tokens1 = task.context.split('.').slice(0, 1);
        var result1 = tokens1.join('.');
        var tokens2 = task.context.split('.').slice(0, 2);
        var result2 = tokens2.join('.');
        var tokens3 = task.context.split('.').slice(0, 3);
        var result3 = tokens3.join('.');
        var tokens4 = task.context.split('.').slice(0, 4);
        var result4 = tokens4.join('.');
        task.subContext1 = result1;
        task.subContext2 = result2;
        task.subContext3 = result3;
        task.subContext4 = result4;

        _.each(task.actors, function(actor) {
          actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
        });

      });
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json( tasks);
    });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
