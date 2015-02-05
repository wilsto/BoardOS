'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DashboardSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  axis: String,
  categories: Schema.Types.Mixed,
  category: String,
  tags: String,
  owner: String,
  date:{ type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('Dashboard', DashboardSchema);