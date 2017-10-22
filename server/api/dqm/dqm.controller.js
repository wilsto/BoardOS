'use strict';

var _ = require('lodash');
var Dqm = require('./dqm.model');

// Get list of dqms
exports.index = function(req, res) {
  Dqm.find(function (err, dqms) {
    if(err) { return handleError(res, err); }
    return res.status(200).json( dqms);
  });
};

// Get a single dqm
exports.show = function(req, res) {
  Dqm.findById(req.params.id, function (err, dqm) {
    if(err) { return handleError(res, err); }
    if(!dqm) { return res.send(404); }
    return res.status(200).json(dqm);
  });
};

// Creates a new dqm in the DB.
exports.create = function(req, res) {
  Dqm.create(req.body, function(err, dqm) {
    if(err) { return handleError(res, err); }
    return res.status(201).json( dqm);
  });
};

// Updates an existing dqm in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Dqm.findById(req.params.id, function (err, dqm) {
    if (err) { return handleError(res, err); }
    if(!dqm) { return res.send(404); }
    var updated = _.merge(dqm, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json( dqm);
    });
  });
};

// Deletes a dqm from the DB.
exports.destroy = function(req, res) {
  Dqm.findById(req.params.id, function (err, dqm) {
    if(err) { return handleError(res, err); }
    if(!dqm) { return res.send(404); }
    dqm.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}