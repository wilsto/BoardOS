'use strict';

var _ = require('lodash');
var DashboardComplete = require('./dashboardComplete.model');
var Dashboard = require('../dashboard/dashboard.model');


function CreateOrUpdateDashboardComplete(dashboard) {

  DashboardComplete.findById(dashboard._id, function(err, dashboardComplete) {
    if (err) {
      console.log('error :', err);
    }

    // si non existant
    if (!dashboardComplete) {
      DashboardComplete.create(dashboardComplete, function(err, CreateddashboardComplete) {
        if (err) {
          console.log('error :', err);
        }
        console.log('CreateddashboardComplete ', dashboard.name);
        return true;
      });
    } else {
      //si existant
      var updated = _.merge(dashboardComplete, dashboard);
      updated.save(function(err) {
        if (err) {
          console.log('error :', err);
        }
        console.log('UpdateddashboardComplete ', dashboard.name);
        return true;
      });
    }
  });
}

// Get list of dashboardCompletes
exports.index = function(req, res) {
  DashboardComplete.find({}, '', function(err, dashboardCompletes) {
    if (err) {
      return handleError(res, err);
    }

    return res.status(200).json(dashboardCompletes);
  });
};

// Get a single dashboardComplete
exports.show = function(req, res) {
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!dashboardComplete) {
      return res.status(404).send('Not Found');
    }
    return res.json(dashboardComplete);
  });
};

// Creates a new dashboardComplete in the DB.
exports.create = function(req, res) {
  DashboardComplete.create(req.body, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(dashboardComplete);
  });
};

// Updates an existing dashboardComplete in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!dashboardComplete) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(dashboardComplete, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(dashboardComplete);
    });
  });
};

// Deletes a dashboardComplete from the DB.
exports.destroy = function(req, res) {
  DashboardComplete.findById(req.params.id, function(err, dashboardComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!dashboardComplete) {
      return res.status(404).send('Not Found');
    }
    dashboardComplete.remove(function(err) {
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
