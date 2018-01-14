'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var WhatsnewSchema = new Schema({
  page: String,
  hints: Schema.Types.Mixed,
  active: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Whatsnew', WhatsnewSchema);