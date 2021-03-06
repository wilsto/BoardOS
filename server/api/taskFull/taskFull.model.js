'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TaskFullSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  date: {
    type: Date,
    default: Date.now
  },
  modifdate: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: false
  },
  description: String,
  hypothesis: String,
  risks: String,
  success: String,
  metrics: Schema.Types.Mixed,
  rework: Schema.Types.Mixed,
  alerts: Schema.Types.Mixed,
  kpis: Schema.Types.Mixed,
  dashboards: Schema.Types.Mixed,
  todos: Schema.Types.Mixed,
  reviewTask: {
    type: Boolean,
    default: false
  },
  reviewPeriodic: {
    type: Boolean,
    default: false
  },
  nextTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],
  actionPlan: {
    type: Boolean,
    default: false
  },
  previousTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],
  previousAnomalies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anomalie'
  }],
  anomalies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anomalie'
  }],
  comments: Schema.Types.Mixed,
  actors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  strict: false
});

module.exports = mongoose.model('TaskFull', TaskFullSchema);
