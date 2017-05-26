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
  kpisValue: Number,
  alerts: Schema.Types.Mixed,
  alertsValue: Number,
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFull'
  }],
  tasksNb: Number,
  openTasksNb: Number,
  toFeedTasksNb: Number,
  category: String,
  tags: String,
  owner: Schema.Types.Mixed,
  actors: Schema.Types.Mixed,
  users: [{
    dashboardName: String,
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  date: {
    type: Date,
    default: Date.now
  }
}, {
  strict: false
});

module.exports = mongoose.model('DashboardComplete', DashboardCompleteSchema);
