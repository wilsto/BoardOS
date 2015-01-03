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
var moment = require('moment');

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
    if (typeof req.params.id === 'undefined') {
      Dashboard.find(function (err, dashboard) {
        if(err) { return handleError(res, err); }
        if(!dashboard) { return res.send(404); }
        mDashboard = {context:'',activity:''};
        mDashboard.list = dashboard;
        deferred.resolve(mDashboard);
      })
    } else {
      Dashboard.findById(req.params.id, function (err, dashboard) {
        if(err) { return handleError(res, err); }
        if(!dashboard) { return res.send(404); }
        mDashboard = dashboard.toObject();
        deferred.resolve(mDashboard);
      })
    }

    return deferred.promise;
  })
  .then(function () {
      // Get related KPIs
      var deferred = Q.defer();
      mDashboard.kpis = [];
      KPI.find({}, function (err, kpi) {
        _.each(kpi, function(rowdata, index) { 
          if (typeof mDashboard.context === 'undefined' )  { mDashboard.context = ''};
          if (typeof mDashboard.activity === 'undefined' )  { mDashboard.activity = ''};
          if (typeof rowdata.context === 'undefined' || rowdata.context === '')  { rowdata.context = mDashboard.context};
          if (typeof rowdata.activity === 'undefined' || rowdata.activity === '')  { rowdata.activity = mDashboard.activity};         
          if (rowdata.context.indexOf(mDashboard.context) >=0  && rowdata.activity.indexOf(mDashboard.activity) >=0 ) {
            mDashboard.kpis.push (rowdata.toObject());
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
          rowdata =rowdata.toObject()
         if (rowdata.context.indexOf(mDashboard.context) >=0  && rowdata.activity.indexOf(mDashboard.activity) >=0 ) {

          // get last kpis metrics
          _.each(mDashboard.kpis, function(kpidata, index) {  
              if (rowdata.context.indexOf(kpidata.context) >=0  && rowdata.activity.indexOf(kpidata.activity) >=0 ) {
                  rowdata.timetowait = Math.min((typeof kpidata.refresh === 'undefined') ? Infinity : kpidata.refresh , (typeof rowdata.timetowait === 'undefined') ? Infinity : rowdata.timetowait );
              }
          });

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
    Metric.find({},{}, {sort:{
        date: 1 //Sort by Date Added DESC
    }},function (err, metric) {
      _.each(metric, function(rowdata, index) {  
        if (rowdata.context.indexOf(mDashboard.context) >=0  && rowdata.activity.indexOf(mDashboard.activity) >=0 ) {
          // get last tasks metrics
          _.each(mDashboard.tasks, function(taskdata, index) {  
              if (rowdata.context === taskdata.context  && rowdata.activity === taskdata.activity ) { // pour la tache
                  var oneDay = 24*60*60*1000; 
                  var firstDate = new Date(rowdata.date);
                  var secondDate = new Date();
                  taskdata.timewaited = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
                  taskdata.timebetween =  taskdata.timetowait - taskdata.timewaited;
                  taskdata.lastmetric = rowdata;
              }
          });
          mDashboard.metrics.push (rowdata.toObject());
        }
      });
      deferred.resolve(mDashboard);
    })
    return deferred.promise;
    })
  .then(function () {
    var actorsObject = _.countBy(mDashboard.metrics,'actor');
    mDashboard.actors = _.map(actorsObject, function(value, key) {
      return {name: key, count:value};
    });
    return res.json(mDashboard);
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