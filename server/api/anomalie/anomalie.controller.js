/*jshint multistr: true */
/*jshint sub:true*/
'use strict';

var _ = require('lodash');


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

      var xml = anomalie.fiveWhy;
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
    if (!sourceTask._id && sourceTask) {
      sourceTasks.push(sourceTask);
    } else {
      sourceTasks.push(sourceTask._id);
    }
  });
  newAno.sourceTasks = _.compact(_.uniq(sourceTasks));

  var correctiveActions = [];
  var blnCATaskNotStarted = false;
  var blnCATaskIP = false;
  var blnCATaskEnd = false;
  _.each(newAno.correctiveActions, function(correctiveAction) {
    if (!correctiveAction._id && correctiveAction) {
      correctiveActions.push(correctiveAction);
    } else {
      correctiveActions.push(correctiveAction._id);
    }
    if (correctiveAction.metrics) {
      if (correctiveAction.metrics[correctiveAction.metrics.length - 1].status === 'Not Started') {
        blnCATaskNotStarted = true;
      }
      if (correctiveAction.metrics[correctiveAction.metrics.length - 1].status === 'In Progress') {
        blnCATaskIP = true;
      }
      if (correctiveAction.metrics[correctiveAction.metrics.length - 1].status === 'Finished') {
        blnCATaskEnd = true;
      }
    }
  });
  newAno.correctiveActions = _.compact(_.uniq(correctiveActions));
  if (blnCATaskIP === false && blnCATaskEnd === false) {
    newAno.statusCA = 'Not Started';
  }
  if (blnCATaskIP === true || (blnCATaskNotStarted === true && (blnCATaskIP === true || blnCATaskEnd === true))) {
    newAno.statusCA = 'In Progress';
  }
  if (blnCATaskEnd === true && blnCATaskNotStarted === false && blnCATaskIP === false) {
    newAno.statusCA = 'Finished';
  }


  var rootCauseAnalysisTasks = [];
  var blnRCATaskNotStarted = false;
  var blnRCATaskIP = false;
  var blnRCATaskEnd = false;
  _.each(newAno.rootCauseAnalysisTasks, function(rootCauseAnalysisTask) {
    if (!rootCauseAnalysisTask._id && rootCauseAnalysisTask) {
      rootCauseAnalysisTasks.push(rootCauseAnalysisTask);
    } else {
      rootCauseAnalysisTasks.push(rootCauseAnalysisTask._id);
    }
    if (rootCauseAnalysisTask.metrics) {
      if (rootCauseAnalysisTask.metrics[rootCauseAnalysisTask.metrics.length - 1].status === 'Not Started') {
        blnRCATaskNotStarted = true;
      }
      if (rootCauseAnalysisTask.metrics[rootCauseAnalysisTask.metrics.length - 1].status === 'In Progress') {
        blnRCATaskIP = true;
      }
      if (rootCauseAnalysisTask.metrics[rootCauseAnalysisTask.metrics.length - 1].status === 'Finished') {
        blnRCATaskEnd = true;
      }
    }
  });
  newAno.rootCauseAnalysisTasks = _.compact(_.uniq(rootCauseAnalysisTasks));
  if (blnRCATaskIP === false && blnRCATaskEnd === false) {
    newAno.statusRCA = 'Not Started';
  }
  if (blnRCATaskIP === true || (blnRCATaskNotStarted === true && (blnRCATaskIP === true || blnRCATaskEnd === true))) {
    newAno.statusRCA = 'In Progress';
  }
  if (blnRCATaskEnd === true && blnRCATaskNotStarted === false && blnRCATaskIP === false) {
    newAno.statusRCA = 'Finished';
  }

  var preventiveActions = [];
  var blnPATaskNotStarted = false;
  var blnPATaskIP = false;
  var blnPATaskEnd = false;
  _.each(newAno.preventiveActions, function(preventiveAction) {
    if (!preventiveAction._id && preventiveAction) {
      preventiveActions.push(preventiveAction);
    } else {
      preventiveActions.push(preventiveAction._id);
    }
    if (preventiveAction.metrics) {
      if (preventiveAction.metrics[preventiveAction.metrics.length - 1].status === 'Not Started') {
        blnPATaskNotStarted = true;
      }
      if (preventiveAction.metrics[preventiveAction.metrics.length - 1].status === 'In Progress') {
        blnPATaskIP = true;
      }
      if (preventiveAction.metrics[preventiveAction.metrics.length - 1].status === 'Finished') {
        blnPATaskEnd = true;
      }
    }

  });
  newAno.preventiveActions = _.compact(_.uniq(preventiveActions));
  if (blnPATaskIP === false && blnPATaskEnd === false) {
    newAno.statusPA = 'Not Started';
  }
  if (blnPATaskIP === true || (blnPATaskNotStarted === true && (blnPATaskIP === true || blnPATaskEnd === true))) {
    newAno.statusPA = 'In Progress';
  }
  if (blnPATaskEnd === true && blnPATaskNotStarted === false && blnPATaskIP === false) {
    newAno.statusPA = 'Finished';
  }

  if (newAno.actor) {
    newAno.actor = newAno.actor._id;
  }

  Anomalie.findById(req.params.id, function(err, anomalie) {
    if (err) {
      return handleError(res, err);
    }
    if (!anomalie) {
      return res.send(404);
    }

    var updated = _.merge(anomalie, newAno);
    updated.markModified('fiveWhy');
    updated.markModified('sourceTasks');
    updated.markModified('correctiveActions');
    updated.correctiveActions = newAno.correctiveActions;
    updated.markModified('preventiveActions');
    updated.preventiveActions = newAno.preventiveActions;
    updated.markModified('rootCauseAnalysisTasks');
    updated.rootCauseAnalysisTasks = newAno.rootCauseAnalysisTasks;
    updated.markModified('category');
    updated.category = newAno.category;
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, updated);
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
