'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MetricSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  comments: String,
  date: String,
  endDate: String,
  load: String,
  progress: String,
  progressStatus: String,
  startDate: String,
  status: String,
  trust: String,
  username: String
}, { strict: false });

module.exports = mongoose.model('Metric', MetricSchema);