'use strict';
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');
var schedule = require('node-schedule');

var DashboardComplete = require('./dashboardComplete.model');
var Dashboard = require('../dashboard/dashboard.model');
var TaskFull = require('../taskFull/taskFull.model');
var Hierarchies = require('../hierarchy/hierarchy.model');
var KPI = require('../KPI/KPI.model');

var tools = require('../../config/tools');
var getData = require('../../config/getData');

var hierarchyValues = {};
var kpis = {};
var alerts = {};
var tasks = {};

// permanent
Hierarchies.find({
  name: 'Task'
}, '-__v', function(err, hierarchy) {
  if (hierarchy[0]) {
    hierarchyValues = hierarchy[0].list;
  }
});

KPI.find({}, '-__v').lean().exec(function(err, mKPI) {
  kpis = _.where(mKPI, {
    category: 'Goal'
  });
  alerts = _.where(mKPI, {
    category: 'Alert'
  });
})

process.on('taskChanged', function(task) {

  var alldashboards;
  setTimeout(function() {
    Q()
      // Get a single task
      .then(function() {
        var deferred = Q.defer();

        Dashboard.find({}, '-__v').lean().exec(function(err, dashboards) {
          alldashboards = dashboards;
          deferred.resolve(alldashboards);
        });
        return deferred.promise;

      })
      .then(function() {
        var deferred = Q.defer();
        _.each(alldashboards, function(dashboard, index) {
          if ((dashboard.context === undefined || task.context.indexOf(dashboard.context) >= 0) && (dashboard.activity === undefined || task.activity.indexOf(dashboard.activity) >= 0)) {

            createCompleteDashboard(dashboard._id, function(data) {});
          }
          deferred.resolve(dashboard);
        });
        return deferred.promise;
      });
  }, 1000);
});

process.on('dashboardChanged', function(dashboard) {
  createCompleteDashboard(dashboard._id, function(data) {});
});

process.on('dashboardRemoved', function(dashboard) {

  DashboardComplete.remove({
    _id: dashboard._id
  }, function(err, numberRemoved) {

  });
});

var j = schedule.scheduleJob({
  hour: 1,
  minute: 0
}, function() {

});


function createAllCompleteDashboard() {
  var alldashboards;

  Q()
    // Get a single task
    .then(function() {
      var deferred = Q.defer();
      DashboardComplete.remove({}, function(err, numberRemoved) {
        console.log('numberRemoved', numberRemoved);
        deferred.resolve(numberRemoved);
      });
      return deferred.promise;
    })
    .then(function() {
      var deferred = Q.defer();
      Dashboard.find({}, '-__v').lean().exec(function(err, dashboards) {
        console.log('dashboards', dashboards.length);
        alldashboards = dashboards;
        deferred.resolve(alldashboards);
      });
      return deferred.promise;
    })
    .then(function() {
      var deferred = Q.defer();
      // assuming openFiles is an array of file names
      async.each(alldashboards, function(dashboard, callback) {
        // Perform operation on file here.
        createCompleteDashboard(dashboard._id, function(data) {
          callback();
        });
      }, function(err) {
        // if any of the file processing produced an error, err would equal that error
        if (err) {
          // One of the iterations produced an error.
          // All processing will now stop.
          console.log('A file failed to process');
        } else {
          console.log('All files have been processed successfully');
        }
      });
      deferred.resolve(alldashboards);
      return deferred.promise;
    });
}

createCompleteDashboard('5852cfed1738410400b26117', function() {
  console.log('end dashboard 5852cfed1738410400b26117');
});

function createCompleteDashboard(dashboardId, callback) {
  Q()
    // Get a single task
    .then(function() {
      var deferred = Q.defer();
      if (typeof dashboardId === 'undefined') {

      } else {
        Dashboard.findById(dashboardId, {
          __v: false
        }).lean().exec(function(err, dashboard) {
          deferred.resolve(dashboard);
        })
      }
      return deferred.promise;
    })

    // Start tasks
    .then(function(dashboard) {
      // Get related tasks
      var deferred = Q.defer();
      dashboard.tasks = [];
      TaskFull.find({
        activity: {
          '$regex': dashboard.activity || '',
          $options: '-i'
        },
        context: {
          '$regex': dashboard.context || '',
          $options: '-i'
        }
      }, 'metrics needToFeed kpis alerts').sort({
        date: 'asc'
      }).lean().exec(function(err, findtasks) {
        _.each(findtasks, function(task) {
          dashboard.tasks.push(task._id);
        });

        dashboard.openTasksNb = _.where(findtasks, function(task) {
          return task.metrics[task.metrics.length - 1] && (task.metrics[task.metrics.length - 1].status === 'In Progress' || task.metrics[task.metrics.length - 1].status === 'Not Started');
        }).length;
        dashboard.toFeedTasksNb = _.where(findtasks, function(task) {
          return task.needToFeed;
        }).length;
        dashboard.tasksNb = dashboard.tasks.length;

        dashboard.kpis = [];
        dashboard.kpisValue = null;
        dashboard.alerts = [];
        dashboard.alertsValue = 0;
        var alertsSumBy = {};
        var kpisSumBy = {};
        var kpisNbBy = {};
        var kpisSum = 0;
        var kpisNb = 0;
        _.each(findtasks, function(task, index) {
          _.each(task.kpis, function(kpi, index2) { // list kpi
            if (!kpisSumBy[kpi._id]) {
              kpisSumBy[kpi._id] = 0;
            }
            if (!kpisNbBy[kpi._id]) {
              kpisNbBy[kpi._id] = 0;
            }
            kpisSumBy[kpi._id] += parseInt(kpi.calcul.task || 0);
            kpisNbBy[kpi._id] += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
            kpisSum += parseInt(kpi.calcul.task || 0);
            kpisNb += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
            // if (kpi.name === 'Deliver On Time') {
            //   console.log('task', task.metrics[task.metrics.length - 1].startDate);
            //   console.log('kpi.calcul.task', kpi.calcul.task);
            // }
          })
          _.each(task.alerts, function(alert, index2) { // list alert
            if (!alertsSumBy[alert._id]) {
              alertsSumBy[alert._id] = 0;
            }
            alertsSumBy[alert._id] += parseInt(alert.calcul.task || 0);
            dashboard.alertsValue += parseInt(alert.calcul.task || 0);
          });

          if (index === findtasks.length - 1) {
            _.each(kpisSumBy, function(value, key) {
              var mKPI = _.filter(kpis, function(kpi) {
                return kpi._id.toString() === key;
              })[0];
              // if (mKPI.name === 'Deliver On Time') {
              //   console.log('dashboard.name', dashboard.name);
              //   console.log('kpi.name', mKPI.name);
              //   console.log('value', value);
              //   console.log('kpisNbBy[key]', kpisNbBy[key]);
              //   console.log('parseInt(value / kpisNbBy[key]', parseInt(value / kpisNbBy[key]));
              // }
              dashboard.kpis.push({
                kpiId: key,
                name: mKPI.name,
                constraint: mKPI.constraint,
                category: mKPI.category,
                calcul: {
                  task: parseInt(value / kpisNbBy[key])
                }
              });
            });
            _.each(alertsSumBy, function(value, key) {
              var mKPI = _.filter(alerts, function(alert) {
                return alert._id.toString() === key;
              })[0];
              dashboard.alerts.push({
                alertId: key,
                name: mKPI.name,
                constraint: mKPI.constraint,
                category: mKPI.category,
                calcul: {
                  task: value
                }
              });
            });
            if (kpisNb > 0) {
              dashboard.kpisValue = parseInt(kpisSum / kpisNb);
            }
          }
        });
        deferred.resolve(dashboard);
      });
      return deferred.promise;
    })

    // Save a single dashboard complete
    .then(function(dashboard) {
      DashboardComplete.findById(dashboardId, function(err, dashboardComplete) {
        // si non existant
        if (!dashboardComplete) {
          DashboardComplete.create(dashboard, function(err, CreateddashboardComplete) {
            callback(CreateddashboardComplete);
            return true;
          });
        } else {
          //si existant
          dashboardComplete.tasks = dashboard.tasks;
          dashboardComplete.kpis = dashboard.kpis;
          dashboardComplete.alerts = dashboard.alerts;
          dashboardComplete.owner = dashboard.owner;
          dashboardComplete.categories = dashboard.categories;
          dashboardComplete.actors = dashboard.actors;
          var updated = _.merge(dashboardComplete, dashboard);
          updated.markModified('owner');
          updated.markModified('categories');
          updated.markModified('actors');
          updated.markModified('tasks');
          updated.markModified('kpis');
          updated.markModified('alerts');
          updated.save(function(err) {
            callback(dashboardComplete);
            return true;
          });
        }
      });

    })
}

// Get list of dashboardCompletes
exports.execute = function(req, res) {
  createAllCompleteDashboard();
};

// Get list of dashboardCompletes
exports.executeId = function(req, res) {
  createCompleteDashboard(req.params.dashboardId, function(callbackDashboard) {
    return res.status(200).json(callbackDashboard);
  });
};

// Get list of dashboardCompletes
exports.index = function(req, res) {
  var filterUser = (req.params.userId || req.query.userId) ? {
    'owner._id': req.params.userId || req.query.userId
  } : {};
  var removeFields = (req.query.quick) ? '-tasks -kpis -alerts' : '-tasks';
  DashboardComplete.find(filterUser, removeFields, function(err, dashboardCompletes) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(dashboardCompletes);
  });
};

// Get a single dashboardComplete
exports.show = function(req, res) {
  DashboardComplete.findById(req.params.id)
    .populate('tasks', ' -watchers -dashboards -kpis -alerts -version')
    .populate('tasks.actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .lean().exec(function(err, dashboardComplete) {
      if (err) {
        return handleError(res, err);
      }
      if (!dashboardComplete) {
        return res.status(404).send('Not Found');
      }
      return res.json(dashboardComplete);
    });
};

// Creates a new dashboardComplete in the DB.
exports.create = function(req, res) {
  DashboardComplete.create(req.body, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(dashboardComplete);
  });
};

// Updates an existing dashboardComplete in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!dashboardComplete) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(dashboardComplete, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(dashboardComplete);
    });
  });
};

// Deletes a dashboardComplete from the DB.
exports.destroy = function(req, res) {
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!dashboardComplete) {
      return res.status(404).send('Not Found');
    }
    dashboardComplete.remove(function(err) {
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
