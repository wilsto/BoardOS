'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KPISchema = new Schema({
    name: String,
    activity: String,
    context: String,
    axe: String,
    tags: String,
    description: String,
    suggestion: String,
    category: String,
    constraint: String,
    refresh: Number,
    action: String,
    listValues: String,
    metricTaskField: String,
    metricTaskValues: String,
    refListValues: String,
    refMetricTaskField: String,
    refMetricTaskValues: String,
    whereField: String,
    whereOperator: String,
    whereValues: String,
    groupBy: String,
    groupTimeBy: String,
    actor: Schema.Types.Mixed,
    date: {
        type: Date,
        default: Date.now
    }
}, {
    strict: false
});

module.exports = mongoose.model('KPI', KPISchema);