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
 var mTask = {};
// Get list of tasks
exports.index = function(req, res) {
  Task.find(function (err, tasks) {
    if(err) { return handleError(res, err); }
    return res.json(200, tasks);
  });
};

// Get a single task
exports.show = function(req, res) {

  Q()
  .then(function () {
    var deferred = Q.defer();
    Task.findById(req.params.id, function (err, task) {
      if(err) { return handleError(res, err); }
      if(!task) { return res.send(404); }
      mTask = task.toObject();
      mTask.metrics = [];
      Metric.find({}, function (err, metric) {
        _.each(metric, function(rowdata, index) {  // pour chaque enregistrement
          if (rowdata.context.indexOf(mTask.context) >=0 && rowdata.activity.indexOf(mTask.activity) >=0 ) {
            mTask.metrics.push (rowdata);
          }
        });
        deferred.resolve(mTask);
      })
    })
    return deferred.promise;
  })
  .then(function () {
    console.log(mTask);
    var deferred = Q.defer();
    return res.json(mTask);
    deferred.resolve(mTask);
    return deferred.promise;
  });
};

// Creates a new task in the DB.
exports.create = function(req, res) {
  console.log(req.body);
  var newTask = new Task(req.body, false);
  newTask.save(function(err) {
    res.send(200);
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