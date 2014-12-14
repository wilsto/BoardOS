/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /KPIs              ->  index
 * POST    /KPIs              ->  create
 * GET     /KPIs/:id          ->  show
 * PUT     /KPIs/:id          ->  update
 * DELETE  /KPIs/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var KPI = require('./KPI.model');
var Q = require('q');
var Dashboard = require('../dashboard/dashboard.model');
var Task = require('../task/task.model');
var Metric = require('../metric/metric.model');
var mKPI = {};

// Get list of KPIs
exports.index = function(req, res) {
  KPI.find(function (err, KPIs) {
    if(err) { return handleError(res, err); }
    return res.json(200, KPIs);
  });
};

// Get a single kpi
exports.show = function(req, res) {
Q()
  .then(function () {
    // Get a single kpi
    var deferred = Q.defer();
    KPI.findById(req.params.id, function (err, kpi) {
      if(err) { return handleError(res, err); }
      if(!kpi) { return res.send(404); }
      mKPI = kpi.toObject();
      deferred.resolve(mKPI);
    })
    return deferred.promise;
  })
  .then(function () {
      // Get related dashboards
      var deferred = Q.defer();
      mKPI.dashboards = [];
      Dashboard.find({}, function (err, dashboard) {
        _.each(dashboard, function(rowdata, index) { 
          if (rowdata.context.indexOf(mKPI.context) >=0 && rowdata.activity.indexOf(mKPI.activity) >=0 ) {
            mKPI.dashboards.push (rowdata);
          }
        });
        deferred.resolve(mKPI);
      })
      return deferred.promise;
    })
  .then(function () {
      // Get related Tasks
      var deferred = Q.defer();
      mKPI.tasks = [];
      Task.find({}, function (err, task) {
        _.each(task, function(rowdata, index) { 
          if (rowdata.context.indexOf(mKPI.context) >=0 && rowdata.activity.indexOf(mKPI.activity) >=0 ) {
            mKPI.tasks.push (rowdata);
          }
        });
        deferred.resolve(mKPI);
      })
      return deferred.promise;
    })  
  .then( function () {
    // Get related metrics
    var deferred = Q.defer();
    mKPI.metrics = [];
    Metric.find({}, function (err, metric) {
      _.each(metric, function(rowdata, index) {  
        if (rowdata.context.indexOf(mKPI.context) >=0 && rowdata.activity.indexOf(mKPI.activity) >=0 ) {
          mKPI.metrics.push (rowdata);
        }
      });
      deferred.resolve(mKPI);
    })
    return deferred.promise;
    })
  .then(function () {
    var deferred = Q.defer();
    return res.json(mKPI);
    deferred.resolve(mKPI);
    return deferred.promise;
  });
};

// Creates a new kpi in the DB.
exports.create = function(req, res) {
    var newKPI = new KPI(req.body, false);
    newKPI.save(function(err) {
      res.send(200);
    });
};

// Updates an existing kpi in the DB.
exports.update = function(req, res) {
  console.log(req.body);
  if(req.body._id) { delete req.body._id; }
  KPI.findById(req.params.id, function (err, kpi) {
    if (err) { return handleError(res, err); }
    if(!kpi) { return res.send(404); }
    var updated = _.merge(kpi, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, kpi);
    });
  });
};

// Deletes a kpi from the DB.
exports.destroy = function(req, res) {
  KPI.findById(req.params.id, function (err, kpi) {
    if(err) { return handleError(res, err); }
    if(!kpi) { return res.send(404); }
    kpi.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}