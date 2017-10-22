'use strict';

var _ = require('lodash');
var Help = require('./help.model');

// Get list of helps
exports.index = function(req, res) {
  Help.find(function (err, helps) {
    if(err) { return handleError(res, err); }
    return res.status(200).json( helps);
  });
};

// Get a single help
exports.show = function(req, res) {
  Help.findById(req.params.id, function (err, help) {
    if(err) { return handleError(res, err); }
    if(!help) { return res.send(404); }
    return res.status(200).json(help);
  });
};

// Creates a new help in the DB.
exports.create = function(req, res) {
  Help.create(req.body, function(err, help) {
    if(err) { return handleError(res, err); }
    return res.status(201).json( help);
  });
};

// Updates an existing help in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Help.findById(req.params.id, function (err, help) {
    if (err) { return handleError(res, err); }
    if(!help) { return res.send(404); }
    var updated = _.merge(help, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json( help);
    });
  });
};

// Deletes a help from the DB.
exports.destroy = function(req, res) {
  Help.findById(req.params.id, function (err, help) {
    if(err) { return handleError(res, err); }
    if(!help) { return res.send(404); }
    help.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}