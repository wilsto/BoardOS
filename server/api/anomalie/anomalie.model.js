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
  statusCA: {
    type: String,
    default: 'Not Started'
  },
  statusRCA: {
    type: String,
    default: 'Not Started'
  },
  statusPA: {
    type: String,
    default: 'Not Started'
  },
  status: {
    type: String,
    default: 'Not Started'
  },


  /** Problem **/
  name: String,
  details: String,
  category: Schema.Types.Mixed,
  impact: String,
  impactWorkload: Number,
  facts: String,
  targets: [String],

  dueDate: Date,
  correctiveActions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],

  /** Analyses **/
  fiveWhy: Schema.Types.Mixed,
  counterMeasures: String,
  rootCauseAnalysisTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],

  /** Solutions **/
  preventiveActions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],
  textEffect: String
}, {
  strict: false
});

module.exports = mongoose.model('Anomalie', AnomalieSchema);
