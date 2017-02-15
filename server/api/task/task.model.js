'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TaskSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  version: {
    type: Number,
    default: 1
  },
  actor: Schema.Types.Mixed,
  watchers: Schema.Types.Mixed,
  description: String,
  tags: String,
  load: Number,
  budget: String,
  confidence: Number,
  impact: String,
  deliverables: String,
  risks: String,
  startDate: Date,
  endDate: Date,
  previous: String,
  date: {
    type: Date,
    default: Date.now
  }
}, {
  strict: false
});

module.exports = mongoose.model('Task', TaskSchema);
