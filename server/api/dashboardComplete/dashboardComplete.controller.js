'use strict';
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');
var schedule = require('node-schedule');

var DashboardComplete = require('./dashboardComplete.model');
var TaskFull = require('../taskFull/taskFull.model');
var Hierarchies = require('../hierarchy/hierarchy.model');
var KPI = require('../KPI/KPI.model');
var User = require('../user/user.model');

var tools = require('../../config/tools');
var getData = require('../../config/getData');

var hierarchyValues = {};
var usersList = {};
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

User.find({}, '-salt -hashedPassword', function(err, user) {
  usersList = user;
})

process.on('taskChanged', function(task) {
  var alldashboards;
  setTimeout(function() {
    Q()
      // Get a single task
      .then(function() {
        var deferred = Q.defer();
        DashboardComplete.find({}, '-__v').lean().exec(function(err, dashboards) {
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
  }, function(err, numberRemoved) {});
});
//createAllCompleteDashboard();

function createAllCompleteDashboard() {
  console.log('Start Calculating Dashboards');

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
      DashboardComplete.find({}, '-__v').lean().exec(function(err, dashboards) {
        console.log('dashboards', dashboards.length);
        alldashboards = [];
        _.each(dashboards, function(dashboard) {
          if (!dashboard.activity) {
            dashboard.activity = '';
          }
          if (!dashboard.context) {
            dashboard.context = '';
          }

          var value = _.where(alldashboards, function(groupdashboard) {
            var bln = ((dashboard.activity === groupdashboard.activity) && (dashboard.context === groupdashboard.context));
            return bln;
          });

          if (value.length === 0) {
            var newdashboard = {
              _id: dashboard._id,
              date: dashboard.date,
              activity: dashboard.activity,
              context: dashboard.context,
              users: []
            };
            if (dashboard.owner) {
              newdashboard.users.push({
                _id: dashboard.owner._id,
                dashboardName: dashboard.name
              });
            }
            alldashboards.push(newdashboard);
          } else {
            _.each(alldashboards, function(thisdashboard) {
              if (thisdashboard._id.toString() === value[0]._id.toString() && dashboard.owner) {
                var userindex = -1;
                var users = thisdashboard.users || [];
                var userlist = _.pluck(users, '_id');
                _.each(userlist, function(data, idx) {
                  // égalité imparfaite car id
                  if (data !== undefined && data.toString() === dashboard.owner._id.toString()) {
                    userindex = idx;
                  }
                });
                if (userindex < 0) {
                  thisdashboard.users.push({
                    _id: dashboard.owner._id,
                    dashboardName: dashboard.name
                  });
                }
              }
              return thisdashboard;
            });
          }
        });
        deferred.resolve(alldashboards);
      });
      return deferred.promise;
    })
    .then(function() {
      var deferred = Q.defer();
      async.each(alldashboards, function(dashboard, callback) {
        process.emit('dashboardCompletestart', dashboard._id);
        createCompleteDashboard(dashboard._id, dashboard.users, function(data) {
          process.emit('dashboardCompleterun', data._id);
          callback();
        });
      }, function(err) {
        if (err) {
          console.log('A file failed to process');
        } else {
          console.log('All files have been processed successfully');
        }
      });
      deferred.resolve(alldashboards);
      return deferred.promise;
    });
}

// createCompleteDashboard('59229550349959a8807aa2be', function() {
//   console.log('end dashboard 59229550349959a8807aa2be');
// });
//createAllCompleteDashboard()

function createCompleteDashboard(dashboardId, users, callback) {
  Q()
    // Get a single task
    .then(function() {
      var deferred = Q.defer();
      if (typeof dashboardId === 'undefined') {

      } else {
        DashboardComplete.findById(dashboardId, {
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
        dashboard.users = users;

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
          if (task.metrics && task.metrics.length > 0) {

            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].startDate));
            var c = moment(new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[task.metrics.length - 1].targetEndDate));

            _.each(task.kpis, function(kpi, index2) { // list kpi
              if (!kpisSumBy[kpi._id]) {
                kpisSumBy[kpi._id] = {
                  last7: 0,
                  last14: 0,
                  last30: 0,
                  last90: 0,
                  last180: 0,
                  last365: 0,
                  lastAll: 0
                };
              }
              if (!kpisNbBy[kpi._id]) {
                kpisNbBy[kpi._id] = {
                  last7: 0,
                  last14: 0,
                  last30: 0,
                  last90: 0,
                  last180: 0,
                  last365: 0,
                  lastAll: 0
                };
              }

              if (task.metrics[task.metrics.length - 1].status === 'Finished') {

                kpisSumBy[kpi._id].lastAll += parseInt(kpi.calcul.task || 0);
                if ((7 >= a.diff(c, 'days'))) {
                  kpisSumBy[kpi._id].last7 += parseInt(kpi.calcul.task || 0)
                }
                if ((14 >= a.diff(c, 'days'))) {
                  kpisSumBy[kpi._id].last14 += parseInt(kpi.calcul.task || 0);
                }
                if ((30 >= a.diff(c, 'days'))) {
                  kpisSumBy[kpi._id].last30 += parseInt(kpi.calcul.task || 0);
                }
                if ((90 >= a.diff(c, 'days'))) {
                  kpisSumBy[kpi._id].last90 += parseInt(kpi.calcul.task || 0);
                }
                if ((180 >= a.diff(c, 'days'))) {
                  kpisSumBy[kpi._id].last180 += parseInt(kpi.calcul.task || 0);
                }
                if ((365 >= a.diff(c, 'days'))) {
                  kpisSumBy[kpi._id].last365 += parseInt(kpi.calcul.task || 0);
                }

                kpisNbBy[kpi._id].lastAll += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
                if ((7 >= a.diff(c, 'days'))) {
                  kpisNbBy[kpi._id].last7 += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
                }
                if ((14 >= a.diff(c, 'days'))) {
                  kpisNbBy[kpi._id].last14 += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
                }
                if ((30 >= a.diff(c, 'days'))) {
                  kpisNbBy[kpi._id].last30 += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
                }
                if ((90 >= a.diff(c, 'days'))) {
                  kpisNbBy[kpi._id].last90 += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
                }
                if ((180 >= a.diff(c, 'days'))) {
                  kpisNbBy[kpi._id].last180 += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
                }
                if ((365 >= a.diff(c, 'days'))) {
                  kpisNbBy[kpi._id].last365 += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
                }

                kpisSum += parseInt(kpi.calcul.task || 0);
                kpisNb += (kpi.calcul.task !== null && kpi.calcul.task !== undefined && !isNaN(kpi.calcul.task)) ? 1 : 0;
              }
              // if (kpi.name === 'Deliver On Time') {
              //   console.log('task', task.metrics[task.metrics.length - 1].startDate);
              //   console.log('kpi.calcul.task', kpi.calcul.task);
              // }
            })
            _.each(task.alerts, function(alert, index2) { // list alert
              if (!alertsSumBy[alert._id]) {
                alertsSumBy[alert._id] = {
                  last7: 0,
                  last14: 0,
                  last30: 0,
                  last90: 0,
                  last180: 0,
                  last365: 0,
                  lastAll: 0
                };
              }

              if (task.metrics[task.metrics.length - 1].status === 'In Progress') {
                alertsSumBy[alert._id].lastAll += parseInt(alert.calcul.task || 0);
                if ((7 >= a.diff(b, 'days')) || (7 >= a.diff(c, 'days'))) {
                  alertsSumBy[alert._id].last7 += parseInt(alert.calcul.task || 0);
                }
                if ((14 >= a.diff(b, 'days')) || (14 >= a.diff(c, 'days'))) {
                  alertsSumBy[alert._id].last14 += parseInt(alert.calcul.task || 0);
                }
                if ((30 >= a.diff(b, 'days')) || (30 >= a.diff(c, 'days'))) {
                  alertsSumBy[alert._id].last30 += parseInt(alert.calcul.task || 0);
                }
                if ((90 >= a.diff(b, 'days')) || (90 >= a.diff(c, 'days'))) {
                  alertsSumBy[alert._id].last90 += parseInt(alert.calcul.task || 0);
                }
                if ((180 >= a.diff(b, 'days')) || (180 >= a.diff(c, 'days'))) {
                  alertsSumBy[alert._id].last180 += parseInt(alert.calcul.task || 0);
                }
                if ((365 >= a.diff(b, 'days')) || (365 >= a.diff(c, 'days'))) {
                  alertsSumBy[alert._id].last365 += parseInt(alert.calcul.task || 0);
                }
                dashboard.alertsValue += parseInt(alert.calcul.task || 0);
              }
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
                  description: mKPI.description,
                  suggestion: mKPI.suggestion,
                  calcul: {
                    task: parseInt(value.lastAll / kpisNbBy[key].lastAll),
                    last7: parseInt(value.last7 / kpisNbBy[key].last7),
                    last14: parseInt(value.last14 / kpisNbBy[key].last14),
                    last30: parseInt(value.last30 / kpisNbBy[key].last30),
                    last90: parseInt(value.last90 / kpisNbBy[key].last90),
                    last180: parseInt(value.last180 / kpisNbBy[key].last180),
                    last365: parseInt(value.last365 / kpisNbBy[key].last365),
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
                  description: mKPI.description,
                  suggestion: mKPI.suggestion,
                  calcul: {
                    task: value.lastAll,
                    last7: value.last7,
                    last14: value.last14,
                    last30: value.last30,
                    last90: value.last90,
                    last180: value.last180,
                    last365: value.last365,
                  }
                });
              });
              if (kpisNb > 0) {
                dashboard.kpisValue = parseInt(kpisSum / kpisNb);
              }
            }
          }
        });
        deferred.resolve(dashboard);
      });
      return deferred.promise;
    })

    // Save a single dashboard complete
    .then(function(dashboard) {

      if (dashboard.owner) {
        delete dashboard.owner;
      }
      if (dashboard.actors) {
        delete dashboard.actors;
      }
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
          dashboardComplete.categories = dashboard.categories;
          var updated = _.merge(dashboardComplete, dashboard);
          updated.markModified('categories');
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
    'users._id': req.params.userId || req.query.userId
  } : {};
  var removeFields = (req.query.quick) ? '-tasks -kpis -alerts' : '-tasks';
  DashboardComplete.find(filterUser, removeFields, function(err, dashboardCompletes) {
    if (err) {
      return handleError(res, err);
    }

    _.each(dashboardCompletes, function(dashboard) {
      var actors = [];
      _.each(dashboard.users, function(actor) {
        var thisuser = _.filter(usersList, function(user) {
          return user._id.toString() === actor._id.toString();
        });
        if (thisuser.length > 0 && thisuser[0].active) {
          actors.push({
            _id: actor._id,
            avatar: (thisuser[0].avatar) ? thisuser[0].avatar : 'assets/images/avatars/' + thisuser[0]._id + '.png',
            name: thisuser[0].name,
            dashboardname: actor.dashboardName
          });
        }
      });
      dashboard.users = actors;
    });

    return res.status(200).json(dashboardCompletes);
  });
};

// Get a single dashboardComplete
exports.show = function(req, res) {
  DashboardComplete.findById(req.params.id)
    //.populate('users.user', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('tasks', ' -watchers -dashboards -kpis -alerts -version')
    .populate('tasks.actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .lean().exec(function(err, dashboardComplete) {
      if (err) {
        console.log('err', err);
        return handleError(res, err);
      }

      var actors = [];
      _.each(dashboardComplete.users, function(actor) {
        var thisuser = _.filter(usersList, function(user) {
          return user._id.toString() === actor._id.toString();
        });
        if (thisuser.length > 0) {
          actors.push({
            _id: actor._id,
            avatar: (thisuser[0].avatar) ? thisuser[0].avatar : 'assets/images/avatars/' + thisuser[0]._id + '.png',
            name: thisuser[0].name,
            dashboardname: actor.dashboardName
          });
        }
      });
      dashboardComplete.users = actors;

      _.each(dashboardComplete.tasks, function(task) {
        var actors = [];
        _.each(task.actors, function(actor) {
          var thisuser = _.filter(usersList, function(user) {
            return user._id.toString() === actor.toString();
          });
          if (thisuser.length > 0) {
            actors.push({
              _id: actor,
              avatar: (thisuser[0].avatar) ? thisuser[0].avatar : 'assets/images/avatars/' + thisuser[0]._id + '.png',
              name: thisuser[0].name
            });
          }
        });
        task.actors = actors;
      });

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
    process.emit('dashboardChanged', dashboardComplete);
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
      process.emit('dashboardChanged', updated);
      return res.status(200).json(dashboardComplete);
    });
  });
};

// Updates an existing dashboardComplete in the DB.
exports.subscribe = function(req, res) {
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!dashboardComplete) {
      return res.status(404).send('Not Found');
    }
    var users = dashboardComplete.users || [];
    users.push({
      _id: req.body._id,
      dashboardname: dashboardComplete.name
    });
    dashboardComplete.users = users;
    var updated = dashboardComplete;
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(dashboardComplete);
    });
  });
};

exports.unsubscribe = function(req, res) {
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!dashboardComplete) {
      return res.status(404).send('Not Found');
    }
    var userindex = -1;
    var users = dashboardComplete.users || [];
    var userlist = _.pluck(users, '_id');
    _.each(userlist, function(data, idx) {
      // égalité imparfaite car id
      if (data.toString() === req.body._id.toString()) {
        userindex = idx;
        return;
      }
    });
    if (userindex >= 0) {
      users.splice(userindex, 1);
    }
    dashboardComplete.users = users;
    var updated = dashboardComplete;
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
