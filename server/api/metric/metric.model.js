'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MetricSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  username: String,
  date: String
}, { strict: false });

module.exports = mongoose.model('Metric', MetricSchema);