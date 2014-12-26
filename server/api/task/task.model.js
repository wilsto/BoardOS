'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TaskSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  actor: String,
  tags: String,
  date:{ type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('Task', TaskSchema);