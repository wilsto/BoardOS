'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var HelpSchema = new Schema({
  title: String,
  info: String,
  category: String,
  active: Boolean
});

module.exports = mongoose.model('Help', HelpSchema);