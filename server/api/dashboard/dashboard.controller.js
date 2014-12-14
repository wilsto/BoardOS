/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /dashboards              ->  index
 * POST    /dashboards              ->  create
 * GET     /dashboards/:id          ->  show
 * PUT     /dashboards/:id          ->  update
 * DELETE  /dashboards/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Q = require('q');
var Dashboard = require('./dashboard.model');
var KPI = require('../KPI/KPI.model');
var Task = require('../task/task.model');
var Metric = require('../metric/metric.model');
var mDashboard = {};

// Get list of dashboards
exports.index = function(req, res) {
  Dashboard.find(function (err, dashboards) {
    if(err) { return handleError(res, err); }
    return res.json(200, dashboards);
  });
};

// Get a single dashboard
exports.show = function(req, res) {
  Q()
  .then(function () {
    // Get a single dashboard
    var deferred = Q.defer();
    Dashboard.findById(req.params.id, function (err, dashboard) {
      if(err) { return handleError(res, err); }
      if(!dashboard) { return res.send(404); }
      mDashboard = dashboard.toObject();
      deferred.resolve(mDashboard);
    })
    return deferred.promise;
  })
  .then(function () {
      // Get related KPIs
      var deferred = Q.defer();
      mDashboard.kpis = [];
      KPI.find({}, function (err, kpi) {
        _.each(kpi, function(rowdata, index) { 
          if (rowdata.context.indexOf(mDashboard.context) >=0 && rowdata.activity.indexOf(mDashboard.activity) >=0 ) {
            mDashboard.kpis.push (rowdata);
          }
        });
        deferred.resolve(mDashboard);
      })
      return deferred.promise;
    })
  .then(function () {
      // Get related Tasks
      var deferred = Q.defer();
      mDashboard.tasks = [];
      Task.find({}, function (err, task) {
        _.each(task, function(rowdata, index) { 
          if (rowdata.context.indexOf(mDashboard.context) >=0 && rowdata.activity.indexOf(mDashboard.activity) >=0 ) {
            mDashboard.tasks.push (rowdata);
          }
        });
        deferred.resolve(mDashboard);
      })
      return deferred.promise;
    })  
  .then( function () {
    // Get related metrics
    var deferred = Q.defer();
    mDashboard.metrics = [];
    Metric.find({}, function (err, metric) {
      _.each(metric, function(rowdata, index) {  
        if (rowdata.context.indexOf(mDashboard.context) >=0 && rowdata.activity.indexOf(mDashboard.activity) >=0 ) {
          mDashboard.metrics.push (rowdata);
        }
      });
      deferred.resolve(mDashboard);
    })
    return deferred.promise;
    })
  .then(function () {
    var deferred = Q.defer();
    return res.json(mDashboard);
    deferred.resolve(mDashboard);
    return deferred.promise;
  });
};

// Creates a new dashboard in the DB.
exports.create = function(req, res) {
    console.log(req.body);
    var newDashboard = new Dashboard(req.body, false);
    newDashboard.save(function(err) {
      res.send(200);
    });

};

// Updates an existing dashboard in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Dashboard.findById(req.params.id, function (err, dashboard) {
    if (err) { return handleError(res, err); }
    if(!dashboard) { return res.send(404); }
    var updated = _.merge(dashboard, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, dashboard);
    });
  });
};

// Deletes a dashboard from the DB.
exports.destroy = function(req, res) {
  Dashboard.findById(req.params.id, function (err, dashboard) {
    if(err) { return handleError(res, err); }
    if(!dashboard) { return res.send(404); }
    dashboard.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}