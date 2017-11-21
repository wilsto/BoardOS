/*jshint sub:true*/
'use strict';
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');
var schedule = require('node-schedule');

var Obeya = require('./obeya.model');
var TaskFull = require('../taskFull/taskFull.model');

var tools = require('../../config/tools');
var getData = require('../../config/getData');
var logger = require('../../config/logger');

// Get list of obeyas
exports.index = function(req, res) {
  var filterUser = {};
  var removeFields = '';
  Obeya.find(filterUser, removeFields, function(err, obeyas) {
    if (err) {
      return handleError(res, err);
    }

    return res.status(200).json(obeyas);
  });
};

// Get a single obeya
exports.show = function(req, res) {
  console.log('req.params.id', req.params.id);
  Obeya.findById(req.params.id)
    .lean().exec(function(err, obeya) {
      console.log('obeya', obeya);
      if (err) {
        return handleError(res, err);
      }

      if (!obeya) {
        return res.status(404).send('Not Found');
      }

      return res.status(200).json(obeya);
    });
};


// Creates a new obeya in the DB.
exports.create = function(req, res) {
  // req.body
  var filter = {
    perimeter: req.body.perimeter
  };
  Obeya.find(filter, function(err, obeyas) {
    if (err) {
      return handleError(res, err);
    }
    if (obeyas.length > 0) {
      var updated = obeyas[0];
      // on ajoute le user au dashboard déjà existant
      var users = updated.users || [];
      var userlist = _.map(users, '_id');
      var userindex = -1;
      _.each(userlist, function(data, idx) {
        // égalité imparfaite car id
        if (data.toString() === req.body.users[0]._id.toString()) {
          userindex = idx;
          return;
        }
      });
      if (userindex === -1) {
        users.push({
          _id: req.body.users[0]._id,
          dashboardName: req.body.users[0].dashboardName
        });
      }
      updated.users = users;
      updated.markModified('users');
      updated.save(function(err) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(200).json(updated);
      });

    } else {
      Obeya.create(req.body, function(err, obeya) {
        if (err) {
          return handleError(res, err);
        }
        process.emit('dashboardChanged', obeya);
        return res.status(201).json(obeya);
      });
    }
  });
};

// Updates an existing obeya in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Obeya.findById(req.params.id, function(err, obeya) {
    if (err) {
      return handleError(res, err);
    }
    if (!obeya) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(obeya, req.body);
    updated.users = req.body.users;
    updated.tasks = req.body.tasks;
    updated.kpis = req.body.kpis;
    updated.alerts = req.body.alerts;
    updated.perimeter = req.body.perimeter;
    updated.categories = req.body.categories;
    updated.markModified('perimeter');
    updated.markModified('categories');
    updated.markModified('tasks');
    updated.markModified('kpis');
    updated.markModified('alerts');
    updated.markModified('users');

    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      process.emit('dashboardChanged', updated);
      return res.status(200).json(obeya);
    });
  });
};

// Deletes a obeya from the DB.
exports.destroy = function(req, res) {
  Obeya.findById(req.params.id, function(err, obeya) {
    if (err) {
      return handleError(res, err);
    }
    if (!obeya) {
      return res.status(404).send('Not Found');
    }
    obeya.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
