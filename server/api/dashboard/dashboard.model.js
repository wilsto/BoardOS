'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DashboardSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  axis: String,
  category: String,
  tags: String,
  username: String,
  date: String
}, { strict: false });

module.exports = mongoose.model('Dashboard', DashboardSchema);