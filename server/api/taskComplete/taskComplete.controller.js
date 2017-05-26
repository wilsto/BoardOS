'use strict';

var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');
var schedule = require('node-schedule');

var TaskComplete = require('./taskComplete.model');
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

KPI.find({}, '-__v').lean().exec(function(err, mKPI) {
  kpis = mKPI;
})

function calcBusinessDays(dDate1, dDate2) { // input given as Date objects
  var iWeeks, iDateDiff, iAdjust = 0;
  if (dDate2 < dDate1) return -1; // error code if dates transposed
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

function createAllCompleteTask() {
  TaskComplete.remove({}, function(err, numberRemoved) {
    Task.find({}, '-__v').lean().exec(function(err, tasks) {
      _.each(tasks, function(task, index) { // pour chaque tache
        createCompleteTask(task._id, false, function(data) {});
      });
    });
  });

}

var j = schedule.scheduleJob({
  hour: 0,
  minute: 30
}, function() {

  createAllCompleteTask()
});
createAllCompleteTask();
process.on('metricChanged', function(taskId, refreshDashboard) {
  refreshDashboard = (refreshDashboard === undefined) ? true : refreshDashboard;
  createCompleteTask(taskId, refreshDashboard, function(data) {});
});

process.on('taskRemoved', function(task) {
  TaskComplete.remove({
    _id: task._id
  }, function(err, numberRemoved) {});
});

// createCompleteTask('5900b09fbad4d30400ea771c', false, function() {
//   console.log('end task 5900b09fbad4d30400ea771c');
// });

function createCompleteTask(taskId, refreshDashboard, callback) {

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
          delete task.actor.provider;
          delete task.actor.last_connection_date;
          delete task.actor.active;
          delete task.actor.location;
          delete task.actor.create_date;
          delete task.actor.email;
          delete task.actor.role;
          task.watchersId = task.watchers;
          task.actors = [];
          task.watchers = [];
          // ajout du owner
          task.actors.push({
            name: task.actor.name,
            __v: 0,
            _id: task.actor._id
          });
          _.each(task.watchersId, function(watcher) {
            var name = _.pluck(_.filter(usersList, function(user) {
              return (watcher === user._id.toString())
            }), 'name').toString()
            // ajout des metrics
            task.actors.push({
              name: name,
              __v: 0,
              _id: watcher
            });
            // ajout des watchers
            task.watchers.push({
              name: name,
              __v: 0,
              _id: watcher
            });
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
            task.dashboards.push(mydashboard);
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
        _.each(metrics, function(metric, index) { // pour chaque metric
          metric.taskId = task._id;
          // si c'est la première métric, on crèe l'objet
          if (typeof task.metrics === 'undefined') {
            task.metrics = []
          }

          // ajouter calcul auto
          metric.startDate = new Date(metric.startDate);
          metric.endDate = new Date(metric.endDate);
          metric.date = new Date(metric.date);
          task.endDate = new Date(task.endDate);

          // nombre de jours séparant la date de début, fin, entre les deux
          metric.duration = calcBusinessDays(metric.startDate, metric.endDate);
          //  metric.timeToBegin = moment(metric.startDate).diff(moment(), 'days');
          //  metric.timeToEnd = moment(metric.endDate).diff(moment(), 'days');

          // convert to numeric
          metric.timeSpent = parseFloat(String(metric.timeSpent).replace(',', '.'));

          // predictedCharge
          metric.projectedWorkload = (metric.progress > 0) ? Math.round(1000 * metric.timeSpent * 100 / parseFloat(metric.progress)) / 1000 : metric.load;

          // progressStatus
          delete metric.progressStatus;
          if (moment(dateNow).isAfter(task.endDate, 'day')) { // On est post la date de fin engagé
            var maxLastEndDate;
            if (metric.status === 'In Progress' || metric.status === 'Not Started') {
              maxLastEndDate = Math.max(metric.endDate, metric.date);
            } else {
              maxLastEndDate = Math.max(metric.endDate);
            }
            var maxEndDate = Math.max(task.endDate);
            if (moment(maxLastEndDate).isAfter(maxEndDate, 'day')) {
              metric.progressStatus = 'Late';
            } else {
              metric.progressStatus = 'On Time';
            }
          } else { // On est avant la date de fin engagé
            if (moment(metric.endDate).isAfter(task.endDate, 'day')) {
              metric.progressStatus = 'At Risk';
            } else {
              metric.progressStatus = 'On Time';
            }
          }

          // ajouter information par mois
          metric.groupTimeByValue = moment(metric.date).format("YYYY-MM");

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

          // on calcule les temps d'écarts
          var oneDay = 24 * 60 * 60 * 1000;
          var d = new Date(task.startDate);
          var dateStart = d.setDate(d.getDate() - timetowait);
          var firstDate = (new Date(metric.date) > new Date(task.startDate)) ? new Date(metric.date) : new Date(dateStart);
          var currentDate = new Date();
          task.timewaited = Math.round((currentDate.getTime() - firstDate.getTime()) / (oneDay));
          task.needToFeed = (metric.status === 'In Progress' || metric.status === 'Not Started') && task.timewaited > timetowait;
          delete task.timewaited;
          metric.fromNow = moment(metric.date).fromNow();

          //on ajoute l'acteur ou les watchers
          if (metric.actor) {
            task.actors.push(metric.actor);
          }

          delete metric.__v;
          delete metric.taskname;
          delete metric.activity;
          delete metric.context;
          if (metric.actor) {
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

          //on l'ajoute à la liste
          task.metrics.push(metric);
          task.lastmetric = metric;

        });
        task.actors = _.map(_.groupBy(task.actors, function(doc) {
          return doc._id;
        }), function(grouped) {
          return grouped[0];
        });
        deferred.resolve(task);
      })
      return deferred.promise;
    })


    .then(function(task) {
      //logger.trace("Start Calculer les KPI par taches");
      // Calculer les KPI par taches
      var deferred = Q.defer();
      // pour chaque tache
      task.kpis = [];
      task.alerts = [];
      // kpis
      _.each(kpis, function(kpi, index) {
        var mKPI = {};

        // on ajoute des caractéristiques aux KPI
        //##############################################
        //mKPI.metricsGroupBy = {};
        mKPI.calcul = {};
        mKPI._id = kpi._id;
        mKPI.name = kpi.name;
        mKPI.category = kpi.category;
        mKPI.constraint = kpi.constraint;
        //mKPI.metricsGroupBy.Time = tools.groupMultiBy(task.metrics, ['groupTimeByValue']);
        var filteredMetrics = _.filter(task.metrics, function(metric) {
          return (kpi.category === 'Alert') ? metric.groupTimeByValue === moment(new Date()).format("YYYY-MM") : _.last(metric.groupTimeByValue); //filtrer par le mois en cours
        });

        mKPI.calcul.task = tools.calculKPI(filteredMetrics, kpi);
        // mKPI.calcul.taskTime = _.map(mKPI.metricsGroupBy.Time, function(value, key) {
        //   return {
        //     month: key,
        //     value: tools.calculKPI(value, kpi)
        //   };
        // });

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

      TaskComplete.findById(taskId, function(err, taskComplete) {
        // si non existant
        if (!taskComplete) {
          TaskComplete.create(task, function(err, CreatedtaskComplete) {
            if (refreshDashboard) {
              process.emit('taskChanged', task);
            }
            callback(CreatedtaskComplete);
            return true;
          });
        } else {
          //si existant
          taskComplete.actor = task.actor;
          taskComplete.actors = task.actors;
          taskComplete.watchers = task.watchers;
          taskComplete.metrics = task.metrics;
          taskComplete.lastmetric = task.lastmetric;
          taskComplete.kpis = task.kpis;
          taskComplete.kpis = task.kpis;
          taskComplete.alerts = task.alerts;
          taskComplete.dashboards = task.dashboards;
          var updated = _.merge(taskComplete, task);
          updated.markModified('actor');
          updated.markModified('actors');
          updated.markModified('watchers');
          updated.markModified('metrics');
          updated.markModified('lastmetric');
          updated.markModified('kpis');
          updated.markModified('alerts');
          updated.markModified('dashboards');
          updated.save(function(err) {
            if (err) {

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
// Get list of dashboardCompletes
exports.execute = function(req, res) {
  createAllCompleteTask();
};

// Get list of dashboardCompletes
exports.executeId = function(req, res) {
  createCompleteTask(req.params.taskId, true, function(callbackTask) {
    return res.status(200).json(callbackTask);
  });
};


// Get list of taskCompletes
exports.index = function(req, res) {
  var filterUser = (req.query.userId) ? {
    "actors._id": req.query.userId
  } : {};

  TaskComplete.find(filterUser, {
    __v: false,
    metrics: false,
    alerts: false,
    kpis: false,
    "actor.last_connection_date": false,
    "actor.create_date": false,
    "actor.provider": false,
    "actor.email": false,
    "actor.role": false,
    "actor.active": false,
    "actor.location": false
  }, function(err, taskCompletes) {
    if (err) {


      return handleError(res, err);
    }
    return res.status(200).json(taskCompletes);
  });
};

// Get a single taskComplete
exports.show = function(req, res) {
  TaskComplete.findById(req.params.id, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskComplete) {
      return res.status(404).send('Not Found');
    }
    return res.json(taskComplete);
  });
};

// Creates a new taskComplete in the DB.
exports.create = function(req, res) {
  TaskComplete.create(req.body, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(taskComplete);
  });
};

// Updates an existing taskComplete in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  TaskComplete.findById(req.params.id, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskComplete) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(taskComplete, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(taskComplete);
    });
  });
};

// Deletes a taskComplete from the DB.
exports.destroy = function(req, res) {
  TaskComplete.findById(req.params.id, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskComplete) {
      return res.status(404).send('Not Found');
    }
    taskComplete.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};


function handleError(res, err) {
  return res.status(500).send(err);
}
