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

function createAllFullTask() {
  TaskFull.remove({}, function(err, numberRemoved) {
    Task.find({}, '-__v').lean().exec(function(err, tasks) {
      _.each(tasks, function(task, index) { // pour chaque tache
        process.emit('taskFullstart', task._id);
        createFullTask(task._id, false, function(data) {
          process.emit('taskFullrun', data._id);
          //console.log('fulltask', data._id);
        });
      });
    });
  });
}

//createAllFullTask();

// TaskFull.remove({
//   _id: '54f6d8482961711100fea6cf'
// }, function(err, numberRemoved) {
//   console.log('*******************start fulltask 54f6d8482961711100fea6cf');
//   createFullTask('54f6d8482961711100fea6cf', false, function() {
//     console.log('*******************end fulltask 54f6d8482961711100fea6cf');
//   });
// });

function createFullTask(taskId, refreshDashboard, callback) {
  Q()
    .then(function() {
      // Get a single user
      var deferred = Q.defer();
      User.find({}, '-salt -hashedPassword', function(err, user) {
        usersList = user;
        deferred.resolve();
      })
      return deferred.promise;
    })

    // Get a single task
    .then(function() {
      var deferred = Q.defer();
      if (typeof taskId === 'undefined') {

      } else {

        Task.findById(taskId, {
          __v: false
        }).lean().exec(function(err, task) {
          task.actors = [];
          task.followers = [];
          // ajout du owner
          if (task.actor._id !== undefined && task.actor._id !== 'undefined') {
            task.actors.push(task.actor._id);
          }
          // ajout des followers
          _.each(task.watchers, function(watcher) {
            if (watcher !== undefined && watcher !== 'undefined') {
              task.followers.push(watcher);
            }
          });
          deferred.resolve(task);
        })
      }
      return deferred.promise;
    })

    // Start dashboards
    .then(function(task) {
      // Get a single user
      var deferred = Q.defer();
      Dashboard.find({}, '-__v', function(err, dashboards) {
        task.dashboards = [];
        _.each(dashboards, function(dashboard, index) {
          if ((dashboard.context === undefined || task.context.indexOf(dashboard.context) >= 0) && (dashboard.activity === undefined || task.activity.indexOf(dashboard.activity) >= 0)) {
            var mydashboard = dashboard.toObject();
            delete mydashboard.date;
            if (mydashboard.owner) {
              delete mydashboard.owner.email;
              delete mydashboard.owner.last_connection_date;
              delete mydashboard.owner.provider;
              delete mydashboard.owner.active;
              delete mydashboard.owner.role;
            }
            //TODO enlever le commentaire
            //task.dashboards.push(mydashboard);
          }
        });
        deferred.resolve(task);
      })
      return deferred.promise;
    })

    // Start metrics
    .then(function(task) {
      //
      var dateNow = new Date();
      //var dateNow = d2.toISOString();
      // Get related metrics
      var deferred = Q.defer();
      Metric.find({
        activity: task.activity,
        context: task.context
      }, '-__v').sort({
        date: 'asc'
      }).lean().exec(function(err, metrics) {
        var lastComment = '';
        var mainstart = null;
        var targetEndDate = null;
        var reworkstart = null;
        var reworkspent = 0;
        _.each(metrics, function(metric, index) { // pour chaque metric
          // si c'est la première métric, on crèe l'objet
          if (typeof task.metrics === 'undefined') {
            task.metrics = []
            task.comments = []
            task.comments.push({
              text: 'create task',
              user: metric.actor._id,
              date: metric.date,
              auto: true
            });
            task.comments.push({
              text: 'set name to ' + task.name,
              user: metric.actor._id,
              date: moment(metric.date).add(moment.duration(1, 'seconds')),
              auto: true
            });
            task.comments.push({
              text: 'set activity to ' + task.activity,
              user: metric.actor._id,
              date: moment(metric.date).add(moment.duration(2, 'seconds')),
              auto: true
            });
            task.comments.push({
              text: 'set context to ' + task.context,
              user: metric.actor._id,
              date: moment(metric.date).add(moment.duration(3, 'seconds')),
              auto: true
            });
            task.comments.push({
              text: 'set targetstartDate to ' + moment(task.startDate).format('MMM DD, YYYY'),
              user: metric.actor._id,
              date: moment(metric.date).add(moment.duration(4, 'seconds')),
              auto: true
            });
            task.comments.push({
              text: 'set targetEndDate to ' + moment(task.endDate).format('MMM DD, YYYY'),
              user: metric.actor._id,
              date: moment(metric.date).add(moment.duration(5, 'seconds')),
              auto: true
            });
            task.comments.push({
              text: 'set targetLoad to ' + task.load,
              user: metric.actor._id,
              date: moment(metric.date).add(moment.duration(6, 'seconds')),
              auto: true
            });
          } else {
            if (metric.comments !== undefined && metric.comments !== '' && lastComment !== metric.comments) {
              var currentComment = (lastComment.length > 0) ? metric.comments.replace(lastComment, '').trim() : metric.comments.trim();
              lastComment = currentComment;
              task.comments.push({
                text: currentComment,
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(6, 'seconds')),
                auto: false
              });
            }
          }

          // target
          metric.targetstartDate = new Date(moment(task.startDate).startOf('day'));
          metric.targetEndDate = new Date(moment(task.endDate).startOf('day'));
          metric.targetLoad = task.load;

          // in progress
          metric.startDate = (reworkstart) ? reworkstart : new Date(moment(metric.startDate).startOf('day'));
          metric.endDate = new Date(moment(metric.endDate).startOf('day'));
          metric.timeSpent = parseFloat(String(metric.timeSpent).replace(',', '.')) - reworkspent;

          //convert to number
          metric.progress = parseFloat(metric.progress);
          metric.actorSatisfaction = parseFloat(metric.actorSatisfaction);
          metric.userSatisfaction = parseFloat(metric.userSatisfaction);
          metric.deliverableStatus = parseFloat(metric.deliverableStatus);
          metric.trust = parseFloat(metric.trust);

          var startDate = (metric.startDate) ? metric.startDate : metric.targetstartDate;
          var endDate = (metric.endDate) ? metric.endDate : metric.targetEndDate;

          if (index === 0) {
            mainstart = metric.startDate;
            targetEndDate = metric.targetEndDate;
          }

          // nombre de jours séparant la date de début, fin, entre les deux
          metric.duration = calcBusinessDays(mainstart, endDate);
          metric.delay = calcBusinessDays(targetEndDate, endDate) - 1;

          // predictedCharge
          metric.projectedWorkload = (metric.progress > 0) ? reworkspent + Math.round(1000 * metric.timeSpent * 100 / parseFloat(metric.progress)) / 1000 : metric.targetLoad;
          if (metric.duration === 1) {
            metric.duration = metric.projectedWorkload;
          }

          // progressStatus
          if (moment(metric.endDate).isAfter(targetEndDate, 'day')) {
            metric.progressStatus = 'Late';
          } else {
            metric.progressStatus = 'On Time';
          }

          // comments
          if (index > 0) {
            if (moment(metric.startDate).isAfter(metrics[index - 1].startDate, 'day')) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set startDate to ' + moment(metric.startDate).format('MMM DD, YYYY'),
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
            if (metric.progress !== metrics[index - 1].progress) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set progress to ' + metric.progress + '%',
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
            if (metric.timeSpent !== metrics[index - 1].timeSpent) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set timeSpent to ' + metric.timeSpent,
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
            if (moment(metric.endDate).isAfter(metrics[index - 1].endDate, 'day')) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set endDate to ' + moment(metric.endDate).format('MMM DD, YYYY'),
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
            if (metric.trust !== metrics[index - 1].trust) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set trust to ' + metric.trust,
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
            if (metric.userSatisfaction !== metrics[index - 1].userSatisfaction) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set userSatisfaction to ' + metric.userSatisfaction,
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
            if (metric.actorSatisfaction !== metrics[index - 1].actorSatisfaction) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set actorSatisfaction to ' + metric.actorSatisfaction,
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
            if (metric.deliverableStatus !== metrics[index - 1].deliverableStatus) { // On est post la date de fin engagé
              task.comments.push({
                text: 'set deliverableStatus to ' + metric.deliverableStatus,
                user: metric.actor._id,
                date: moment(metric.date).add(moment.duration(4, 'seconds')),
                auto: true
              });
            }
          }

          // kpis
          _.each(kpis, function(kpi, index) {
            // ajout des couleurs
            if (typeof metric[kpi.metricTaskField] === 'string') {
              var Value = _.filter(hierarchyValues, function(item) {
                return kpi.metricTaskField && item.text.toLowerCase() === metric[kpi.metricTaskField].toLowerCase();
              });
              if (Value.length > 0) {
                metric.color = Value[0].color;
                metric.value = Value[0].value;
                metric.description = Value[0].description;
              }
            }
          });

          delete metric.__v;
          delete metric._id;
          delete metric.taskname;
          delete metric.activity;
          delete metric.context;
          if (metric.actor) {
            task.actors.push(metric.actor._id);
            delete metric.actor.email;
            delete metric.actor.provider;
            delete metric.actor.location;
            delete metric.actor.active;
            delete metric.actor.last_connection_date;
            delete metric.actor.create_date;
            delete metric.actor.role;
          }
          delete metric.color;
          delete metric.description;
          delete metric.timeToBegin;
          delete metric.timeToEnd;
          delete metric.date;
          delete metric.comments;
          delete metric.dateNow;
          delete metric.fromNow;
          delete metric.taskId;
          delete metric.groupTimeByValue;
          delete metric.value;
          delete metric.actor;

          //on l'ajoute à la liste
          if (metric.progress === 100 || index === metrics.length - 1 || metric.status === 'Finished') {
            reworkstart = metric.endDate;
            reworkspent += metric.timeSpent;
            task.metrics.push(metric);
          }
        });
        deferred.resolve(task);
      })
      return deferred.promise;
    })

    .then(function(task) {

      if (task.comments) {
        task.comments = _.sortBy(task.comments, function(comment) {
          return -comment.date;
        });
      }

      task.actors = task.actors.reduce(function(a, b) {
        if (a.indexOf(b) < 0) a.push(b);
        return a;
      }, []);

      //logger.trace("Start Calculer les KPI par taches");
      // Calculer les KPI par taches
      //

      if (!task.metrics) {
        task.metrics = [];
      }

      var deferred = Q.defer();
      // pour chaque tache
      task.kpis = [];
      task.alerts = [];
      // kpis
      //
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

      deferred.resolve(task);
      return deferred.promise;
    })

    // Save a single task complete
    .then(function(task) {
      delete task.actor;
      delete task.lastmetric;
      delete task.startDate;
      delete task.endDate;
      delete task.load;
      delete task.version;

      TaskFull.findById(taskId, function(err, taskFull) {
        // si non existant
        if (!taskFull) {
          TaskFull.create(task, function(err, CreatedtaskFull) {
            if (err) {
              console.log('task', task);
              console.log('err', err);
            }
            if (refreshDashboard) {
              process.emit('taskChanged', task);
            }
            callback(CreatedtaskFull);
            return true;
          });
        } else {
          //si existant
          var updated = _.merge(taskFull, task);
          taskFull.actors = task.actors;
          taskFull.followers = task.followers;
          taskFull.metrics = task.metrics;
          taskFull.comments = task.comments;
          taskFull.todos = task.todos;
          taskFull.kpis = task.kpis;
          taskFull.alerts = task.alerts;
          taskFull.dashboards = task.dashboards;
          updated.markModified('actors');
          updated.markModified('followers');
          updated.markModified('metrics');
          updated.markModified('comments');
          updated.markModified('todos');
          updated.markModified('kpis');
          updated.markModified('alerts');
          updated.markModified('dashboards');
          updated.save(function(err) {
            if (err) {
              console.log('err', err);
            }
            if (refreshDashboard) {
              process.emit('taskChanged', task);
            }
            callback(updated);
            return true;
          });
        }
      });

    })
}
// Get list of dashboardFulls
exports.execute = function(req, res) {
  createAllFullTask();
};

// Get list of dashboardFulls
exports.executeId = function(req, res) {
  createFullTask(req.params.taskId, true, function(callbackTask) {
    return res.status(200).json(callbackTask);
  });
};


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
    .lean().exec(function(err, taskFull) {
      if (err) {
        return handleError(res, err);
      }
      if (!taskFull) {
        return res.status(404).send('Not Found');
      }
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
      _.each(taskFull.actors, function(actor) {
        actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
      });
      _.each(taskFull.followers, function(follower) {
        follower.avatar = (follower.avatar) ? follower.avatar : 'assets/images/avatars/' + follower._id + '.png';
      });
      _.each(taskFull.comments, function(comment) {
        comment.user.avatar = (comment.user.avatar) ? comment.user.avatar : 'assets/images/avatars/' + comment.user._id + '.png';
      });
      return res.json(taskFull);
    });
};


// Get count of tasks which start
exports.countByMonth = function(req, res) {
  var o = {};
  o.map = function() {
    emit((new Date(this.date)).getFullYear() + '.' + ((new Date(this.date)).getMonth() + 1), {
      count: 1,
      qty: (this.comments) ? this.comments.length : 0
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
  o.query = {
    activity: new RegExp(req.query.activity),
    context: new RegExp(req.query.context)
  };
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



// Creates a new taskFull in the DB.
exports.create = function(req, res) {
  var task = req.body;

  // mise à jour des acteurs
  var actors = [];
  _.each(task.actors, function(actor) {
    actors.push(actor._id);
  });
  task.actors = actors;

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
      return handleError(res, err);
    }
    process.emit('taskChanged', taskFull);
    return res.status(201).json(taskFull);
  });
};

// Updates an existing taskFull in the DB.
exports.update = function(req, res) {
  var task = req.body;
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

    var actors = [];
    _.each(task.actors, function(actor) {
      actors.push(actor._id);
    });
    _.each(task.todos, function(todo) {
      actors.push(todo.actor._id);
    });
    task.actors = _.uniq(actors);

    var followers = [];
    _.each(task.followers, function(follower) {
      followers.push(follower._id);
    });
    task.followers = followers;

    _.each(task.comments, function(comment) {
      comment.user = comment.user._id;
    });

    var mainstart = null;
    var targetEndDate = null;
    var reworkstart = null;
    var reworkspent = 0;
    var dateNow = new Date();
    _.each(task.metrics, function(metric, index) { // pour chaque metric

      var startDate = (metric.startDate) ? metric.startDate : metric.targetstartDate;
      var endDate = (metric.endDate) ? metric.endDate : (metric.startDate) ? metric.startDate : metric.targetEndDate;
      metric.endDate = endDate;

      if (index === 0) {
        mainstart = metric.startDate;
        targetEndDate = metric.targetEndDate;
      }

      // nombre de jours séparant la date de début, fin, entre les deux
      metric.duration = calcBusinessDays(mainstart, endDate);
      console.log('endDate', endDate);
      console.log('mainstart', mainstart);
      metric.delay = calcBusinessDays(targetEndDate, endDate) - 1;

      // predictedCharge
      metric.projectedWorkload = (metric.progress > 0) ? reworkspent + Math.round(1000 * metric.timeSpent * 100 / parseFloat(metric.progress)) / 1000 : metric.targetLoad;
      console.log('metric.duration', metric.duration);
      if (metric.duration === 1) {
        metric.duration = metric.projectedWorkload;
      }

      console.log('metric.projectedWorkload', metric.projectedWorkload);
      console.log('metric.duration', metric.duration);
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

    var updated = _.merge(taskFull, task);
    taskFull.actors = task.actors;
    taskFull.followers = task.followers;
    taskFull.metrics = task.metrics;
    taskFull.comments = task.comments;
    taskFull.todos = task.todos;
    taskFull.kpis = task.kpis;
    taskFull.alerts = task.alerts;
    taskFull.dashboards = task.dashboards;
    updated.markModified('actors');
    updated.markModified('followers');
    updated.markModified('metrics');
    updated.markModified('comments');
    updated.markModified('todos');
    updated.markModified('kpis');
    updated.markModified('alerts');
    updated.markModified('dashboards');
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      process.emit('taskChanged', taskFull);
      return res.status(200).json(taskFull);
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
    return res.json(200, tasks);
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
      return res.json(200, tasks);
    });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
