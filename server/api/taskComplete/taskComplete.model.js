'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TaskCompleteSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  version: {
    type: Number,
    default: 1
  },
  actor: Schema.Types.Mixed,
  watchers: Schema.Types.Mixed,
  metrics: Schema.Types.Mixed,
  lastmetric: Schema.Types.Mixed,
  kpis: Schema.Types.Mixed,
  alerts: Schema.Types.Mixed,
  tags: String,
  load: String,
  budget: String,
  impact: String,
  deliverables: String,
  risks: String,
  startDate: Date,
  endDate: Date,
  previous: String,
  date: {
    type: Date,
    default: Date.now
  },
  timewaited: Number,
  timebetween: Number
}, {
  strict: false
});

module.exports = mongoose.model('TaskComplete', TaskCompleteSchema);
