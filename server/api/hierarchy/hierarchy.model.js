'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var HierarchySchema = new Schema({
  name: String,
  list: Schema.Types.Mixed,
}, { strict: false });

module.exports = mongoose.model('Hierarchy', HierarchySchema);