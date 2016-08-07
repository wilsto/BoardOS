'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MetricSchema = new Schema({
    name: String,
    activity: String,
    context: String,
    comments: String,
    date: Date,
    endDate: Date,
    load: String,
    timeSpent: String,
    progress: String,
    progressStatus: String,
    startDate: Date,
    status: String,
    deliverableStatus: String,
    userSatisfaction: String,
    actorSatisfaction: String,
    reworkReason: String,
    trust: String,
    actor: Schema.Types.Mixed
}, {
    strict: false
});

module.exports = mongoose.model('Metric', MetricSchema);
