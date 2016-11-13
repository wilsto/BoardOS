/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /metrics              ->  index
 * POST    /metrics              ->  create
 * GET     /metrics/:id          ->  show
 * PUT     /metrics/:id          ->  update
 * DELETE  /metrics/:id          ->  destroy
 */

'use strict';


var _ = require('lodash');
var Q = require('q');
var moment = require('moment');

var Metric = require('./metric.model');
var metrics = [];

// Get list of metrics
exports.index = function(req, res) {
  Metric.find(function(err, metrics) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(200, metrics);
  });
};


// Get count of metrics which start
// + confidence
exports.countByMonth = function(req, res) {
  var o = {};
  o.map = function() {
    emit((new Date(this.date)).getFullYear() + '.' + ((new Date(this.date)).getMonth() + 1), {
      count: 1,
      trust: this.trust
    });
  };
  o.reduce = function(k, val) {
    var reducedVal = {
      count: 0,
      trust: 0
    };
    for (var i = 0; i < val.length; i++) {
      reducedVal.count += val[i].count;
      reducedVal.trust += parseInt(val[i].trust);
    }
    return reducedVal;
  };
  o.query = {
    activity: new RegExp(req.query.activity),
    context: new RegExp(req.query.context)
  };
  Metric.mapReduce(o, function(err, results) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(results);
  });
};

// Get list of metrics
exports.list = function(req, res) {
  Q()
    .then(function() {
      // Get related rowtask
      var deferred = Q.defer();
      Metric.find({}).lean().exec(function(err, rowtask) {
        metrics = [];
        _.each(rowtask, function(rowdata, index) {
          if (typeof req.query.context !== 'undefined' && typeof req.query.activity !== 'undefined') {
            if (rowdata.context.indexOf(req.query.context) >= 0 && rowdata.activity.indexOf(req.query.activity) >= 0) {
              metrics.push(rowdata);
            }
          } else {
            metrics.push(rowdata);
          }
        });
        deferred.resolve(metrics);
      });
      return deferred.promise;
    })
    .then(function() {
      return res.json(200, metrics);
    });
};

// Get a single metric
exports.show = function(req, res) {
  Metric.findById(req.params.id, function(err, metric) {
    if (err) {
      return handleError(res, err);
    }
    if (!metric) {
      return res.send(404);
    }
    return res.json(metric);
  });
};

// Creates a new metric in the DB.
exports.create = function(req, res) {
  var newMetric = new Metric(req.body, false);
  process.emit('metricChanged', req.body.taskId);
  newMetric.save(function(err) {
    res.send(200);
  });
};

// Updates an existing metric in the DB.
exports.update = function(req, res) {
  process.emit('metricChanged', req.body.taskId);
  if (req.body._id) {
    delete req.body._id;
  }
  if (req.body.taskId) {
    delete req.body.taskId;
  }
  Metric.findById(req.params.id, function(err, metric) {
    if (err) {
      return handleError(res, err);
    }
    if (!metric) {
      return res.send(404);
    }
    var updated = _.merge(metric, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, metric);
    });
  });
};

// Deletes a metric from the DB.
exports.destroy = function(req, res) {
  process.emit('metricChanged', req.params.taskId);
  console.log('req.params.taskId', req.params.taskId);
  Metric.findById(req.params.id, function(err, metric) {
    if (err) {
      return handleError(res, err);
    }
    if (!metric) {
      return res.send(404);
    }
    metric.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
