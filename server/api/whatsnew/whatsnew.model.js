'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var WhatsnewSchema = new Schema({
  title: String,
  type: String,
  resume: String,
  info: String,
  active: Boolean,
  date: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
});

module.exports = mongoose.model('Whatsnew', WhatsnewSchema);
