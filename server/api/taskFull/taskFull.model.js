'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TaskFullSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  date: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: false
  },
  description: String,
  hypothesis: String,
  risks: String,
  metrics: Schema.Types.Mixed,
  rework: Schema.Types.Mixed,
  previous: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fulltask'
  },
  alerts: Schema.Types.Mixed,
  kpis: Schema.Types.Mixed,
  dashboards: Schema.Types.Mixed,
  todos: [{
    text: String,
    date: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isDone: Boolean
  }],
  comments: [{
    text: String,
    date: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    auto: Boolean
  }],
  actors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  strict: false
});

module.exports = mongoose.model('TaskFull', TaskFullSchema);
