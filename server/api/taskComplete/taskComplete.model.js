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
  actors: Schema.Types.Mixed,
  watchers: Schema.Types.Mixed,
  metrics: Schema.Types.Mixed,
  lastmetric: Schema.Types.Mixed,
  kpis: Schema.Types.Mixed,
  alerts: Schema.Types.Mixed,
  dashboards: Schema.Types.Mixed,
  description: String,
  tags: String,
  load: Number,
  confidence: Number,
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
  needToFeed: Boolean
}, {
  strict: false
});

module.exports = mongoose.model('TaskComplete', TaskCompleteSchema);
