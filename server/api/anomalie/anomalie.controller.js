/*jshint multistr: true */
/*jshint sub:true*/
'use strict';

var _ = require('lodash');
var x2js = require('x2js');


var Anomalie = require('./anomalie.model');
var TaskFull = require('../taskFull/taskFull.model');
var moment = require('moment');

// Get list of anomalies
exports.index = function(req, res) {

  var filterPerimeter = {
    $or: []
  };

  filterPerimeter['$or'].push({
    activity: {
      '$regex': req.query.activity || '',
      $options: '-im'
    },
    context: {
      '$regex': req.query.context || '',
      $options: '-im'
    }
  });

  Anomalie.find(filterPerimeter).sort({
      date: 'desc'
    })
    .populate('actor', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
    .populate('sourceTasks', '_id name')
    .populate('correctiveActions', '_id name metrics.status')
    .populate('rootCauseAnalysisTasks', '_id name metrics.status')
    .populate('preventiveActions', '_id name metrics.status')
    .lean().exec(function(err, anomalies) {
      if (err) {
        return handleError(res, err);
      }
      _.each(anomalies, function(anomalie) {
        anomalie.actor.avatar = (anomalie.actor.avatar) ? anomalie.actor.avatar : 'assets/images/avatars/' + anomalie.actor._id + '.png';
      });

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

// Get a single anomalie
exports.exportFiveWhyXml = function(req, res) {

  Anomalie.findById(req.params.id)
    .lean().exec(function(err, anomalie) {
      if (err) {
        return handleError(res, err);
      }
      if (!anomalie) {
        return res.send(404);
      }

      // var xml = anomalie.fiveWhy;
      var xml = '<?xml version="1.0" encoding="UTF-8"?><to></to></xml>';
      res.set({
        'Content-Disposition': 'attachment; filename=data.xml',
        'Content-Type': 'application/xml'
      });
      return res.status(200).send(xml);

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

  var newAno = req.body;
  if (newAno._id) {
    delete newAno._id;
  }
  var sourceTasks = [];
  _.each(newAno.sourceTasks, function(sourceTask) {
    sourceTasks.push(sourceTask._id);
  });
  newAno.sourceTasks = _.compact(_.uniq(sourceTasks));
  newAno.actor = newAno.actor._id;
  console.log('newAno', newAno);


  Anomalie.findById(req.params.id, function(err, anomalie) {
    if (err) {
      return handleError(res, err);
    }
    if (!anomalie) {
      return res.send(404);
    }

    // Recherche de la tache en anomalie
    TaskFull.find({
      previousAnomalies: anomalie._id
    }, function(err, tasksWithPrevious) {
      if (err) {
        return handleError(res, err);
      }
      console.log('tasksWithPrevious', tasksWithPrevious);
      if (tasksWithPrevious) {
        console.log('CONDITION PASSED');
        anomalie.correctiveActions.push(tasksWithPrevious._id);
      }
      anomalie.correctiveActions = _.compact(_.uniq(anomalie.correctiveActions));

      var updated = _.merge(anomalie, newAno);
      updated.markModified('fiveWhy');
      updated.markModified('sourceTasks');
      updated.save(function(err) {
        if (err) {
          return handleError(res, err);
        }
        return res.json(200, anomalie);
      });

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
