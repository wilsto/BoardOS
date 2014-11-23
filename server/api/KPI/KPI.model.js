'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KPISchema = new Schema({
  name: String,
  activity: String,
  context: String,
  axe: String,
  tags:String,
  action:String,
  type:String,
  groupBy:String,
  refresh:Number,
  category:String,
  reftype:String,
  reftypedetails:Number,
  username:String,
  date:{ type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('KPI', KPISchema);