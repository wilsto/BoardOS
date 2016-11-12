'use strict';
var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');

var DashboardComplete = require('./dashboardComplete.model');
var Dashboard = require('../dashboard/dashboard.model');
var TaskComplete = require('../taskComplete/taskComplete.model');
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
  hierarchyValues = hierarchy[0].list;
});

KPI.find({}, '-__v').lean().exec(function(err, mKPI) {
  kpis = _.where(mKPI, {
    category: 'Goal'
  });
  alerts = _.where(mKPI, {
    category: 'Alert'
  });
})


function createAllCompleteDashboard() {
  Dashboard.find({}, '-__v').lean().exec(function(err, dashboards) {
    console.log('# dashboards updated', dashboards.length);
    _.each(dashboards, function(dashboard, index) { // pour chaque tache
      createCompleteDashboard(dashboard._id);
    });
  });
}
// createAllCompleteDashboard();
// createCompleteDashboard("54e3db715ef9d41100cb44ed");
// createCompleteDashboard('5623d6c4b292ab1100acc9e7');
// createCompleteDashboard("5506b222b7228311003ef67a");
// createCompleteDashboard("5506b30eb7228311003ef67e");
// createCompleteDashboard('5506b234b7228311003ef67c');
// createCompleteDashboard("58274b9898876e1c61a5dd60");

function createCompleteDashboard(dashboardId) {
  console.log('createCompleteDashboard: ' + dashboardId);
  console.time('Start - ' + dashboardId);
  Q()
    // Get a single task
    .then(function() {
      var deferred = Q.defer();
      if (typeof dashboardId === 'undefined') {
        console.log('Error');
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
    var dateNow = new Date();
    dashboard.tasks = [];
    // Get related tasks
    var deferred = Q.defer();
    TaskComplete.find({
      activity: {
        '$regex': dashboard.activity || '',
        $options: '-i'
      },
      context: {
        '$regex': dashboard.context || '',
        $options: '-i'
      }
    }, '-__v').sort({
      date: 'asc'
    }).lean().exec(function(err, findtasks) {
      tasks = findtasks;
      dashboard.openTasksNb = _.where(findtasks, function(task) {
        return task.lastmetric && (task.lastmetric.status === 'In Progress' || task.lastmetric.status === 'Not Started');
      }).length;
      dashboard.toFeedTasksNb = _.where(findtasks, function(task) {
        return task.needToFeed;
      }).length;

      _.each(findtasks, function(task) {
        dashboard.tasks.push({
          taskId: task._id
        });
      })
      dashboard.tasksNb = dashboard.tasks.length;
      deferred.resolve(dashboard);
    });
    return deferred.promise;
  })

  .then(function(dashboard) {
    // Get related Tasks
    var deferred = Q.defer();
    //logger.trace("Add calculs");
    dashboard.kpis = [];
    dashboard.kpisValue = null;
    dashboard.alerts = [];
    dashboard.alertsValue = 0;
    var kpisSum = 0;
    var kpisNb = 0;
    _.each(tasks, function(task, index) {
      _.each(task.kpis, function(kpi, index2) { // list kpi
        dashboard.kpis.push({
          kpiId: kpi._id,
          value: parseInt(kpi.calcul.task || 0)
        });
        kpisSum += parseInt(kpi.calcul.task || 0);
        kpisNb += (parseInt(kpi.calcul.task) > 0) ? 1 : 0;
      })
      _.each(task.alerts, function(alert, index2) { // list alert
        dashboard.alerts.push({
          kpiId: alert._id,
          value: parseInt(alert.calcul.task || 0)
        });
        dashboard.alertsValue += parseInt(alert.calcul.task || 0);
      });
    });
    dashboard.kpisValue = parseInt(kpisSum / kpisNb);

    deferred.resolve(dashboard);
    return deferred.promise;

  })

  // Save a single dashboard complete
  .then(function(dashboard) {
    DashboardComplete.findById(dashboardId, function(err, dashboardComplete) {
      if (err) {
        console.log('error :', err);
      }

      // si non existant
      if (!dashboardComplete) {
        DashboardComplete.create(dashboard, function(err, CreateddashboardComplete) {
          if (err) {
            console.log('error :', err);
          }
          return true;
        });
      } else {
        //si existant
        delete dashboardComplete.tasks;
        delete dashboardComplete.kpis;
        delete dashboardComplete.alerts;
        var updated = _.merge(dashboardComplete, dashboard);
        updated.markModified('owner');
        updated.markModified('categories');
        updated.markModified('actors');
        updated.markModified('tasks');
        updated.markModified('kpis');
        updated.markModified('alerts');
        updated.save(function(err) {
          if (err) {
            console.log('error :', err);
          }
          console.timeEnd('Start - ' + dashboardId);
          return true;
        });
      }
    });

  })

}

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
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
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
