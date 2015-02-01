/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /hierarchies              ->  index
 * POST    /hierarchies              ->  create
 * GET     /hierarchies/:id          ->  show
 * PUT     /hierarchies/:id          ->  update
 * DELETE  /hierarchies/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Hierarchy = require('./hierarchy.model');
var tools = require('../../config/tools');

// Get list of hierarchies
exports.index = function(req, res) {
  Hierarchy.find(function (err, hierarchies) {
    if(err) { return handleError(res, err); }
    return res.json(200, hierarchies);
  });
};

// Get a single hierarchy
exports.show = function(req, res) {
  Hierarchy.findById(req.params.id, function (err, hierarchy) {
    if(err) { return handleError(res, err); }
    if(!hierarchy) { return res.send(404); }
    return res.json(hierarchy);
  });
};

// Get a single hierarchy
exports.list = function(req, res) {
  Hierarchy.find({name:req.params.id}, function (err, hierarchy) {
    if(err) { return handleError(res, err); }
    if(!hierarchy) { return res.send(404)}
    //if(hierarchy[0]) {tools.buildHierarchy(hierarchy[0].list,'list')}
    return res.json(hierarchy[0]);
  });
};

// Creates a new hierarchy in the DB.
exports.create = function(req, res) {
    var newHierarchy = new Hierarchy(req.body, false);
    newHierarchy.save(function(err, doc) {
      res.send(200, doc);
    });
};

// Updates an existing hierarchy in the DB.
exports.update = function(req, res) {
  var upsertData= {name:req.params.id, list: req.body};
  Hierarchy.update({name:req.params.id}, upsertData, {upsert: true}, function (err, hierarchy) {
    return res.json(200, hierarchy);
  });
};

// Deletes a hierarchy from the DB.
exports.destroy = function(req, res) {
  Hierarchy.findById(req.params.id, function (err, hierarchy) {
    if(err) { return handleError(res, err); }
    if(!hierarchy) { return res.send(404); }
    hierarchy.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}