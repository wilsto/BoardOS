'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ObeyaSchema = new Schema({
  name: String,
  perimeter: Schema.Types.Mixed,
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

module.exports = mongoose.model('Obeya', ObeyaSchema);
