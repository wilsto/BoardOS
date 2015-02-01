/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /tasks              ->  index
 * POST    /tasks              ->  create
 * GET     /tasks/:id          ->  show
 * PUT     /tasks/:id          ->  update
 * DELETE  /tasks/:id          ->  destroy
 */

 'use strict';

 var _ = require('lodash');
 var Q = require('q');
 var Task = require('./task.model');
 var Metric = require('../metric/metric.model');
 var KPI = require('../KPI/KPI.model');
 var Dashboard = require('../dashboard/dashboard.model');
 var Hierarchies = require('../hierarchy/hierarchy.model');
 var hierarchyValues = {};
 var mTask = {};
 
// Get list of tasks
exports.index = function(req, res) {
  Task.find(function (err, tasks) {
    if(err) { return handleError(res, err); }
    return res.json(200, tasks);
  });
};

// Get list of tasks
exports.search = function(req, res) {
  console.log('req.query',req.query.activity);
  Task.find({activity:req.query.activity, context:req.query.context},function (err, tasks) {
    if(err) { return handleError(res, err); }
    return res.json(200, tasks);
  });
};

// Get a single task
exports.show = function(req, res) {

  Q()
  .then(function () {
    // Get a single task
    var deferred = Q.defer();
    if (typeof req.params.id === 'undefined') {
      Task.find().lean().exec(function (err, task) {
        if(err) { return handleError(res, err); }
        if(!task) { return res.send(404); }
        mTask = {context:'',activity:''};
        mTask.tasks = task;
        deferred.resolve(mTask);
      })
    } else {
      Task.findById(req.params.id).lean().exec(function (err, task) {
        if(err) { return handleError(res, err); }
        if(!task) { return res.send(404); }
        mTask = task;
        deferred.resolve(mTask);
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
      deferred.resolve(mTask);
    })
    return deferred.promise;
  })
  .then(function () {
      // Get related dashboards
      var deferred = Q.defer();
      mTask.dashboards = [];
      Dashboard.find({}, function (err, dashboard) {
        _.each(dashboard, function(rowdata, index) { 
          if (typeof rowdata.context === 'undefined' || rowdata.context === '')  { rowdata.context = mTask.context}
          if (typeof rowdata.activity === 'undefined' || rowdata.activity === '')  { rowdata.activity = mTask.activity}
          if (typeof rowdata.context === 'undefined' || mTask.context.indexOf(rowdata.context) >=0 && typeof rowdata.activity === 'undefined' || mTask.activity.indexOf(rowdata.activity) >=0 ) {
            mTask.dashboards.push (rowdata.toObject());
          }
        });
        deferred.resolve(mTask);
      })
      return deferred.promise;
  })  
  .then(function () {
      // Get related KPIs
      var deferred = Q.defer();
      mTask.kpis = [];
      KPI.find({}, function (err, kpi) {
        _.each(kpi, function(rowdata, index) { 
          if (typeof mTask.context === 'undefined' )  { mTask.context = ''}
          if (typeof mTask.activity === 'undefined' )  { mTask.activity = ''}
          if (typeof rowdata.context === 'undefined' || rowdata.context === '')  { rowdata.context = mTask.context}
          if (typeof rowdata.activity === 'undefined' || rowdata.activity === '')  { rowdata.activity = mTask.activity}     
          if (rowdata.context.indexOf(mTask.context) >=0  && rowdata.activity.indexOf(mTask.activity) >=0 ) {
            mTask.kpis.push (rowdata.toObject());
          }
        });
        deferred.resolve(mTask);
      })
      return deferred.promise;
    })
  .then( function () {
    // Get related metrics
    var deferred = Q.defer();
    mTask.metrics = [];
    Metric.find({}, function (err, metric) {
        _.each(metric, function(rowdata, index) {  // pour chaque enregistrement
          if (rowdata.context.indexOf(mTask.context) >=0 && rowdata.activity.indexOf(mTask.activity) >=0 ) {
            mTask.metrics.push (rowdata);
            var listOfTasks = (typeof req.params.id === 'undefined') ? mTask.tasks: [mTask];

            _.each(listOfTasks, function(taskdata, index) {  
                // get last kpis metrics
                _.each(mTask.kpis, function(kpidata, index) {  
                    if (taskdata.context.indexOf(kpidata.context) >=0  && taskdata.activity.indexOf(kpidata.activity) >=0 ) {
                        taskdata.timetowait = Math.min((typeof kpidata.refresh === 'undefined') ? Infinity : kpidata.refresh , (typeof taskdata.timetowait === 'undefined') ? Infinity : taskdata.timetowait );
                    }
                });

                if (rowdata.context === taskdata.context  && rowdata.activity === taskdata.activity ) { // pour la tache
                    var oneDay = 24*60*60*1000; 
                    var firstDate = new Date(rowdata.date);
                    var secondDate = new Date();
                    taskdata.timewaited = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
                    taskdata.timebetween =  taskdata.timetowait - taskdata.timewaited;
                    taskdata.lastmetric = rowdata;
                }
            });
          }
        });
      deferred.resolve(mTask);
    })
    return deferred.promise;
  })
  .then(function () {
    var actorsObject = _.countBy(mTask.metrics,'actor');
    mTask.actors = _.map(actorsObject, function(value, key) {
      return {name: key, count:value};
    });    
    return res.json(mTask);
  });
};

// Creates a new task in the DB.
exports.create = function(req, res) {
  var newTask = new Task(req.body, false);
  newTask.save(function(err,doc) {
    res.send(200,doc);
  });

};

// Updates an existing task in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Task.findById(req.params.id, function (err, task) {
    if (err) { return handleError(res, err); }
    if(!task) { return res.send(404); }
    var updated = _.merge(task, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, task);
    });
  });
};

// Deletes a task from the DB.
exports.destroy = function(req, res) {
  Task.findById(req.params.id, function (err, task) {
    if(err) { return handleError(res, err); }
    if(!task) { return res.send(404); }
    task.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}