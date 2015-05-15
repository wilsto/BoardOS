'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MailSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Mail', MailSchema);