'use strict';

var _ = require('lodash');
var Anomalie = require('./anomalie.model');
var moment = require('moment');

// Get list of anomalies
exports.index = function(req, res) {
  Anomalie.find().sort({
    date: 'desc'
  }).lean().exec(function(err, anomalies) {
    if (err) {
      return handleError(res, err);
    }
    _.each(anomalies, function(rowdata, index) {
      rowdata.moment = moment(rowdata.date).fromNow();
    });
    return res.json(200, anomalies);
  });
};

// Get a single anomalie
exports.show = function(req, res) {
  Anomalie.findById(req.params.id)
    .populate('actor', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('sourceTasks', '_id name')
    .populate('correctiveActions', '_id name metrics.status')
    .populate('rootCauseAnalysisTasks', '_id name metrics.status')
    .populate('preventiveActions', '_id name metrics.status')
    .lean().exec(function(err, anomalie) {
      if (err) {
        return handleError(res, err);
      }
      if (!anomalie) {
        return res.send(404);
      }
      return res.json(anomalie);
    });
};

// Creates a new anomalie in the DB.
exports.create = function(req, res) {
  Anomalie.create(req.body, function(err, anomalie) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(201, anomalie);
  });
};

// Updates an existing anomalie in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Anomalie.findById(req.params.id, function(err, anomalie) {
    if (err) {
      return handleError(res, err);
    }
    if (!anomalie) {
      return res.send(404);
    }
    var updated = _.merge(anomalie, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, anomalie);
    });
  });
};

// Deletes a anomalie from the DB.
exports.destroy = function(req, res) {
  Anomalie.findById(req.params.id, function(err, anomalie) {
    if (err) {
      return handleError(res, err);
    }
    if (!anomalie) {
      return res.send(404);
    }
    anomalie.remove(function(err) {
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
