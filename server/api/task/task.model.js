'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TaskSchema = new Schema({
    name: String,
    activity: String,
    context: String,
    actor: Schema.Types.Mixed,
    tags: String,
    load: String,
    budget: String,
    impact: String,
    deliverables: String,
    risks: String,
    startDate: String,
    endDate: String,
    previous: String,
    date: {
        type: Date,
        default: Date.now
    }
}, {
    strict: false
});

module.exports = mongoose.model('Task', TaskSchema);