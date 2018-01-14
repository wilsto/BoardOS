'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var RecurrentTaskSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  date: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  },
  pauseTime: {
    type: Date
  },
  description: String,
  hypothesis: String,
  risks: String,
  metrics: Schema.Types.Mixed,
  todos: Schema.Types.Mixed,
  comments: Schema.Types.Mixed,
  actors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  repeats: Schema.Types.Mixed,
  repeatEvery: Number,
  repeatOn: Schema.Types.Mixed,
  repeatEndAfter: Number,
}, {
  strict: false
});

module.exports = mongoose.model('RecurrentTask', RecurrentTaskSchema);