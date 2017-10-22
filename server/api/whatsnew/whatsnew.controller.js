/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /infos              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Whatsnew = require('./whatsnew.model');

// Get list of infos
exports.index = function(req, res) {
  Whatsnew.find({})
    .populate('owner', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('viewers', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .lean().exec(function(err, infos) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json( infos);
    });
};

// Get a single thing
exports.show = function(req, res) {
  Whatsnew.findById(req.params.id, function(err, info) {
    if (err) {
      return handleError(res, err);
    }
    if (!info) {
      return res.send(404);
    }
    return res.status(200).json(info);
  });
};

// Creates a new info in the DB.
exports.create = function(req, res) {
  Whatsnew.create(req.body, function(err, info) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json( info);
  });
};

// Updates an existing info in the DB.
exports.updateViewer = function(req, res) {
  Whatsnew.find({}, function(err, infos) {
    if (err) {
      return handleError(res, err);
    }
    if (!infos) {
      return res.send(404);
    }

    _.each(infos, function(info) {
      var existviewer = false;
      _.each(info.viewers, function(viewer) {
        if (viewer.toString() === req.params.id) {
          existviewer = true;
        }
      });
      if (!existviewer) {
        info.viewers.push(req.params.id);
      }

      info.save(function(err) {
        if (err) {
          return handleError(res, err);
        }

      });
    });
    return res.status(200).json( infos);
  });
};

// Updates an existing info in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Whatsnew.findById(req.params.id, function(err, info) {
    if (err) {
      return handleError(res, err);
    }
    if (!info) {
      return res.send(404);
    }
    delete req.body.owner;
    delete req.body.viewers;
    var updated = _.merge(info, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json( info);
    });
  });
};

// Deletes a info from the DB.
exports.destroy = function(req, res) {
  Whatsnew.findById(req.params.id, function(err, info) {
    if (err) {
      return handleError(res, err);
    }
    if (!info) {
      return res.send(404);
    }
    info.remove(function(err) {
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
