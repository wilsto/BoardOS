'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TaskSchema = new Schema({
  name: String,
  activity: String,
  context: String,
  username: String,
  tags: String,
  date: String
}, { strict: false });

module.exports = mongoose.model('Task', TaskSchema);