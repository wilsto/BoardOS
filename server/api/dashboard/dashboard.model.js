'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DashboardSchema = new Schema({

  refContexte: String,
  refActivity: String,
  refAxe: String,
  name: String,
  category: String,
  activity: String,
  contexte: String,
  axe: String,
  username: String,
  date: String
});

module.exports = mongoose.model('Dashboard', DashboardSchema);