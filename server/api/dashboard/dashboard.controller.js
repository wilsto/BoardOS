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
var moment = require('moment');

var Dashboard = require('./dashboard.model');
var KPI = require('../KPI/KPI.model');
var Task = require('../task/task.model');
var Metric = require('../metric/metric.model');
var Hierarchies = require('../hierarchy/hierarchy.model');

var tools = require('../../config/tools');

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
    // Get a single hierarchy
    var deferred = Q.defer();
    Hierarchies.find({name:'Task'}, function (err, hierarchy) {
      if(err) { return handleError(res, err); }
      hierarchyValues = hierarchy[0].list;
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
    var deferred = Q.defer();

      // ajouter les propriétés des métriques
      //##############################################  
      _.each(mDashboard.metrics, function(metric){ 
       
        // ajouter information par mois 
        metric.groupTimeByValue = moment(metric.date).format("YYYY.MM");

        //metric.taskname = []; à vérifier qu'il n'y est qu'une tache avec le meme context, activity
        _.forEach(mDashboard.tasks, function (task) {
            if (metric.context === task.context && metric.activity === task.activity) {
                metric.taskname = task.name;
            }
        }); 

        // nombre de jours séparant la date de fin
        metric.daysToDeadline = moment(metric.endDate).diff(moment(),'days');

      });

      // on ajoute des caractéristiques aux KPI
      //##############################################
      mDashboard.metricsGroupBy ={};
      mDashboard.metricsGroupBy.KPI = tools.groupMultiBy(mDashboard.metrics, ['name']);
      mDashboard.metricsGroupBy.TaskTime = tools.groupMultiBy(mDashboard.metrics, ['taskname','groupTimeByValue']);
      mDashboard.metricsGroupBy.Field = tools.groupMultiBy(mDashboard.metrics, [mDashboard.metricTaskField]);
      mDashboard.metricsGroupBy.FieldTime = tools.groupMultiBy(mDashboard.metrics, [mDashboard.metricTaskField,'groupTimeByValue']);
      mDashboard.metricsGroupBy.Time = tools.groupMultiBy(mDashboard.metrics, ['groupTimeByValue']);


      // a changer pour les bars
      mDashboard.metricsGroupBy.oldTime = tools.groupByTime(tools.groupMultiBy(mDashboard.metrics, ['groupTimeByValue','taskname']),'date',mDashboard.metricTaskField);
    
      mDashboard.calcul = {};
      mDashboard.calcul.time = _.map( mDashboard.metricsGroupBy.Time, function(value, key) {        return {month: key, valueKPI:tools.calculKPI(value,mDashboard)};      });
      mDashboard.calcul.task = _.map( mDashboard.metricsGroupBy.Task, function(value, key) {        return {task: key, valueKPI:tools.calculKPI(value,mDashboard)};      });
      mDashboard.calcul.taskTime = _.map( mDashboard.metricsGroupBy.TaskTime, function(value, key) {     
         return {task: key, time:_.map( value, function(value2, key2) {        return {month: key2, valueKPI:tools.calculKPI(value2,mDashboard)};      }) };
     });

      // graphics
      mDashboard.graphs = [];
      var myChart0 = tools.buildChart(mDashboard,'hBullet');
      var myChart1 = tools.buildChart(mDashboard,'Bar');
      var myChart2 = tools.buildChart(mDashboard,'Bubble');
      mDashboard.graphs.push(myChart0);
      mDashboard.graphs.push(myChart1);
      mDashboard.graphs.push(myChart2);

      // la liste des acteurs
      mDashboard.actors = _.map( _.countBy(mDashboard.metrics,'actor'), function(value, key) {
        return {name: key, count:value};
      });

      deferred.resolve(mDashboard);
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