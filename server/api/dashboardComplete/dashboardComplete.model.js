'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var DashboardCompleteSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  axis: String,
  categories: Schema.Types.Mixed,
  kpis: Schema.Types.Mixed,
  tasks: Schema.Types.Mixed,
  category: String,
  tags: String,
  owner: Schema.Types.Mixed,
  date: {
    type: Date,
    default: Date.now
  }
}, {
  strict: false
});

module.exports = mongoose.model('DashboardComplete', DashboardCompleteSchema);
