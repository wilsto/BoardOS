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
var Hierarchies = require('../hierarchy/hierarchy.model');

var tools = require('../../config/tools');
 var getData = require('../../config/getData');
var hierarchyValues = {};
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
      var filterUser = (req.params.userId) ? {owner:req.params.userId}: null;
      Dashboard.find(filterUser).lean().exec(function (err, dashboard) {
        if(err) { return handleError(res, err); }
        if(!dashboard) { return res.send(404); }
        mDashboard = {context:'',activity:''};
        mDashboard.dashboards = dashboard;
        deferred.resolve(mDashboard);
      })
    } else {
      Dashboard.findById(req.params.id).lean().exec(function (err, dashboard) {
        if(err) { return handleError(res, err); }
        if(!dashboard) { return res.send(404); }
        mDashboard = dashboard;
        deferred.resolve(mDashboard);
      })
    }

    return deferred.promise;
  })
  .then(function () {
        // Get related KPIs
        var deferred = Q.defer();


        KPI.find({}, function (err, kpis) {

           mDashboard.kpis = [];
           var promises = [];

          if (typeof mDashboard.context === 'undefined' )  { mDashboard.context = ''}
          if (typeof mDashboard.activity === 'undefined' )  { mDashboard.activity = ''}
          
          _.each(kpis, function(rowdata, index) { 
                if ((typeof rowdata.context === 'undefined' || rowdata.context === '' || rowdata.context.indexOf(mDashboard.context) >=0)  && (typeof rowdata.activity === 'undefined' || rowdata.activity === '' || rowdata.activity.indexOf(mDashboard.activity) >=0 )) {
                  var mKPI = rowdata.toObject();

                  var KPIInfo = {params:{},query:{}};
                  KPIInfo.params.id = mKPI._id;
                  KPIInfo.query.context = mDashboard.context;
                  KPIInfo.query.activity = mDashboard.activity;
                  KPIInfo.query.url = 'Dashboard';
                  // Get a single kpi
                  promises.push(KPIInfo);
                }
          });

            var lastPromise = promises.reduce(function(promise, KPIToGet) {
                return promise.then( function() {
                  getData.KPIById(KPIToGet, function(newKPI){
                      mDashboard.kpis.push(newKPI);
                  })
                  return Q.delay(50);
                }

                  );
            }, Q.resolve());

            lastPromise
              .then(function() {

                  // si multi dashboards, on recolle chaque KPIs dans chaque dashboard
                  if (typeof req.params.id === 'undefined') {
                      _.each(mDashboard.dashboards, function(thisDashboard, index) { 
                          if (typeof thisDashboard.context === 'undefined' )  { thisDashboard.context = ''}
                          if (typeof thisDashboard.activity === 'undefined' )  { thisDashboard.activity = ''}

                          var dashboardInfo = {};
                          dashboardInfo.context = thisDashboard.context;
                          dashboardInfo.activity = thisDashboard.activity;   
                          thisDashboard.kpis = [];

                          _.each(mDashboard.kpis, function(rowdata, index) { 
                              if ((typeof rowdata.context === 'undefined' || rowdata.context === '' || rowdata.context.indexOf(thisDashboard.context) >=0)  && (typeof rowdata.activity === 'undefined' || rowdata.activity === '' || rowdata.activity.indexOf(thisDashboard.activity) >=0 )) {
                                thisDashboard.kpis.push(getData.shrinkPerimeterOfKPI(_.clone(rowdata), dashboardInfo));
                              }
                          });
                      });
                  }

                  deferred.resolve(mDashboard);
            });

        });

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
    var newDashboard = new Dashboard(req.body, false);
    console.log('newDashboard',newDashboard);
    newDashboard.save(function(err, doc) {
      res.send(200, doc);
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