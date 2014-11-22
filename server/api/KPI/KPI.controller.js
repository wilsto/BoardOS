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

// Get list of KPIs
exports.index = function(req, res) {
  KPI.find(function (err, KPIs) {
    if(err) { return handleError(res, err); }
    return res.json(200, KPIs);
  });
};

// Get a single kpi
exports.show = function(req, res) {
  KPI.findById(req.params.id, function (err, kpi) {
    if(err) { return handleError(res, err); }
    if(!kpi) { return res.send(404); }
    return res.json(kpi);
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