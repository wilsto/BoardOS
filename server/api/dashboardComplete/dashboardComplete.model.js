'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var DashboardCompleteSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  perimeter: Schema.Types.Mixed,
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
  sublist: Schema.Types.Mixed,
  tasksNb: Number,
  openTasksNb: Number,
  toFeedTasksNb: Number,
  category: String,
  tags: String,
  roles: Schema.Types.Mixed,
  owner: Schema.Types.Mixed,
  actors: Schema.Types.Mixed,
  users: Schema.Types.Mixed,
  date: {
    type: Date,
    default: Date.now
  }
}, {
  strict: false
});

module.exports = mongoose.model('DashboardComplete', DashboardCompleteSchema);
