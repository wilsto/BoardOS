'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KPISchema = new Schema({

  name: String,
  refContexte: String,
  refActivity: String,
  refAxe: String,
  action:String,
  type:String,
  groupBy:String,
  refresh:Number,
  category:String,
  reftype:String,
  reftypedetails:Number
});

module.exports = mongoose.model('KPI', KPISchema);