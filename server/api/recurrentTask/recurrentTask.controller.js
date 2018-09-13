/*jshint loopfunc: true */
'use strict';

var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');
var schedule = require('node-schedule');

var RecurrentTask = require('./recurrentTask.model');
var TaskFull = require('../taskFull/taskFull.model');

var getData = require('../../config/getData');
var tools = require('../../config/tools');
var logger = require('../../config/logger');

var hierarchyValues = {};
var kpis = {};
var usersList = {};
var timetowait = 7;

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


function createTaskFromRecurrent(startSundayDate) {
  console.log('startSundayDate', startSundayDate);
  var workday;

  RecurrentTask.find({})
    .lean().exec(function(err, recurrentTasks) {
      _.each(recurrentTasks, function(recurrentTask) {
        // daily
        if (recurrentTask.repeats.value === 1) {
          for (workday = 1; workday < 6; workday++) {
            var newTask = _.clone(recurrentTask);
            delete newTask._id;
            delete newTask._v;
            newTask.date = new Date();
            newTask.auto = true;
            newTask.metrics[0].targetstartDate = moment(startSundayDate).add(workday, 'days').hours(0).minutes(0).seconds(0).toDate();
            newTask.metrics[0].targetEndDate = moment(startSundayDate).add(workday + recurrentTask.repeatEndAfter, 'days').hours(0).minutes(0).seconds(1).toDate();
            newTask.name = newTask.name + ' - ' + moment(newTask.metrics[0].targetstartDate).format('YYYY.MM.DD');
            newTask.context = newTask.context + '.' + moment(newTask.metrics[0].targetstartDate).format('YYYY.MM.DD');
            newTask.comments = [];

            TaskFull.update({
              activity: newTask.activity,
              context: newTask.context
            }, newTask, {
              overwrite: true,
              upsert: true
            }, function(err, tasks) {
              if (err) {
                console.log('err', err);
                return err;
              }
            });
          }
        }

        // weekly
        if (recurrentTask.repeats.value === 2) {
          for (workday = 1; workday < 6; workday++) {
            var newTaskWeek = _.clone(recurrentTask);
            if (newTaskWeek.repeatOn.indexOf(workday) >= 0) {
              delete newTaskWeek._id;
              delete newTaskWeek._v;
              newTaskWeek.date = new Date();
              newTaskWeek.auto = true;
              newTaskWeek.metrics[0].targetstartDate = moment(startSundayDate).add(workday, 'days').hours(0).minutes(0).seconds(0).toDate();
              newTaskWeek.metrics[0].targetEndDate = moment(startSundayDate).add(workday + recurrentTask.repeatEndAfter, 'days').hours(0).minutes(0).seconds(1).toDate();
              newTaskWeek.name = newTaskWeek.name + ' - ' + moment(newTaskWeek.metrics[0].targetstartDate).format('YYYY.MM.DD');
              newTaskWeek.context = newTaskWeek.context + '.' + moment(newTaskWeek.metrics[0].targetstartDate).format('YYYY.MM.DD');
              newTaskWeek.comments = [];

              TaskFull.update({
                activity: newTaskWeek.activity,
                context: newTaskWeek.context
              }, newTaskWeek, {
                overwrite: true,
                upsert: true
              }, function(err, tasks) {
                if (err) {
                  console.log('err', err);
                  return err;
                }
              });
            }
          }
        }
      });
    });
}

var j = schedule.scheduleJob({
  dayOfWeek: 0,
  hour: 6,
  minute: 30
}, function() {
  logger.info('+recurrentTask: scheduled task : ' + new Date());
  createTaskFromRecurrent(new Date());
});


// Get list of recurrentTasks
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

  RecurrentTask.find(myFilter, {
      __v: false,
      alerts: false,
      kpis: false,
      comments: false
    })
    .populate('actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    //.populate('followers', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    //.populate('comments.user', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .lean().exec(function(err, recurrentTasks) {
      if (err) {
        return handleError(res, err);
      }
      _.each(recurrentTasks, function(recurrentTask) {
        _.each(recurrentTask.actors, function(actor) {
          actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
        });
      });
      //console.log('recurrentTasks', recurrentTasks);
      return res.status(200).json(recurrentTasks);
    });
};

// Get list of recurrentTasks
exports.list = function(req, res) {
  var filterUser = (req.params.userId || req.query.userId) ? {
    'actors.0': req.params.userId || req.query.userId
  } : {};
  RecurrentTask.find(filterUser, '-__v').sort({
    name: 1
  }).lean().exec(function(err, recurrentTasks) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(recurrentTasks);
  });
};

// Get list of recurrentTasks
exports.toggleOne = function(req, res) {
  var toggleType = req.params.type;
  var filterTask = {
    _id: req.params.rtaskId
  };
  RecurrentTask.update(filterTask, {
      $set: {
        active: (toggleType === 'true')
      }
    },
    function(err, recurrentTasks) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(recurrentTasks);
    });
};

// Get list of recurrentTasks
exports.toggleAll = function(req, res) {
  var toggleType = req.params.type;
  var filterUser = (req.params.userId || req.query.userId) ? {
    'actors.0': req.params.userId || req.query.userId
  } : {};
  RecurrentTask.updateMany(filterUser, {
      $set: {
        active: (toggleType === 'all')
      }
    },
    function(err, recurrentTasks) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(recurrentTasks);
    });
};


// Get a single recurrentTask
exports.show = function(req, res) {
  RecurrentTask.findById(req.params.id)
    .populate('actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('followers', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .lean().exec(function(err, recurrentTask) {
      if (err) {
        return handleError(res, err);
      }
      if (!recurrentTask) {
        return res.status(404).send('Not Found');
      }

      _.each(recurrentTask.actors, function(actor) {
        actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
      });
      _.each(recurrentTask.followers, function(follower) {
        follower.avatar = (follower.avatar) ? follower.avatar : 'assets/images/avatars/' + follower._id + '.png';
      });
      return res.status(200).json(recurrentTask);
    });
};

// Creates a new recurrentTask in the DB.
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

  RecurrentTask.create(task, function(err, recurrentTask) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(recurrentTask);
  });
};

process.on('PrevTaskToUpdate', function(links) {
  RecurrentTask.update({
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

// Updates an existing recurrentTask in the DB.
exports.update = function(req, res) {
  var task = req.body;

  if (task._id) {
    delete task._id;
  }

  RecurrentTask.findById(req.params.id, function(err, recurrentTask) {
    if (err) {
      return handleError(res, err);
    }
    if (!recurrentTask) {
      return res.status(404).send('Not Found');
    }

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

    /** Mise en majuscule des axes */
    if (task.activity) {
      task.activity = task.activity.toUpperCase();
    }
    if (task.context) {
      task.context = task.context.toUpperCase();
    }

    var updated = _.merge(recurrentTask, task);
    updated.markModified('actors');
    updated.markModified('followers');
    updated.markModified('metrics');
    updated.markModified('comments');
    updated.markModified('todos');
    updated.markModified('repeats');
    updated.markModified('repeatOn');
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(task);
    });

  });
};


// Updates an existing recurrentTask in the DB.
exports.updateAllTask = function(req, res) {

  RecurrentTask.find({}, function(err, recurrentTasks) {
    if (err) {
      return handleError(res, err);
    }
    if (!recurrentTasks) {
      return res.status(404).send('Not Found');
    }

    _.each(recurrentTasks, function(task) {

      if (task.actors) {
        task.actors = _.compact(task.actors);
      }

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

        metric.targetstartDate = moment(metric.targetstartDate).add(3, 'hours').hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
        metric.targetEndDate = moment(metric.targetEndDate).add(3, 'hours').hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
        metric.startDate = moment(metric.startDate).add(3, 'hours').hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();
        metric.endDate = moment(metric.endDate).add(3, 'hours').hours(0).minutes(0).seconds(0).milliseconds(0).toISOString();

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

// Deletes a recurrentTask from the DB.
exports.destroy = function(req, res) {
  RecurrentTask.findById(req.params.id, function(err, recurrentTask) {
    if (err) {
      return handleError(res, err);
    }
    if (!recurrentTask) {
      return res.status(404).send('Not Found');
    }
    //process.emit('taskChanged', recurrentTask);
    recurrentTask.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

// Get list of recurring tasks
exports.search = function(req, res) {
  RecurrentTask.find({
    activity: req.query.activity,
    context: req.query.context
  }, function(err, tasks) {
    console.log('err', err);
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(tasks);
  });
};

// Get list of recurring tasks
exports.standardPERT = function(req, res) {
  RecurrentTask.find({
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
      return res.status(200).json(tasks);
    });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
