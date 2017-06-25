'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var AnomalieSchema = new Schema({
  date: {
    type: Date,
    default: Date.now
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sourceTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],
  activity: String,
  context: String,

  /** Problem **/
  name: String,
  details: String,
  impact: String,
  impactWorkload: Number,
  category: String,
  categoryDetails: String,
  facts: String,
  targets: [String],

  dueDate: Date,
  correctiveActions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],

  /** Analyses **/
  fiveWhy: String,
  counterMeasures: String,
  rootCauseAnalysisTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],

  /** Solutions **/
  preventiveActions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }]
}, {
  strict: false
});

module.exports = mongoose.model('Anomalie', AnomalieSchema);
