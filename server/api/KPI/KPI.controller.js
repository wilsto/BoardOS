/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /KPIs              ->  index
 * POST    /KPIs              ->  create
 * GET     /KPIs/:id          ->  show
 * PUT     /KPIs/:id          ->  update
 * DELETE  /KPIs/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var moment = require('moment');
var Q = require('q');

var Dashboard = require('../dashboard/dashboard.model');
var KPI = require('./KPI.model');
var Task = require('../task/task.model');
var Hierarchies = require('../hierarchy/hierarchy.model');
var getData = require('../../config/getData');
var hierarchyValues = {};

var mKPIs = {};
var mKPI = {};
var myGroup = [];
var keepKPI;
// Get list of KPIs
exports.index = function(req, res) {
    KPI.find(function(err, KPIs) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, KPIs);
    });
};

// Get a single kpi
exports.show = function(req, res) {
    Q()
        .then(function() {
            // Get a single kpi
            var deferred = Q.defer();
            KPI.find({}).lean().exec(function(err, kpis) {
                mKPIs = kpis;
                deferred.resolve(mKPIs);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get a single kpi
            var deferred = Q.defer();
            KPI.findById(req.params.id, function(err, kpi) {
                mKPI = kpi.toObject();
                if (typeof mKPI.context === 'undefined' || mKPI.context === '') {
                    mKPI.context = (typeof req.query.context === 'undefined') ? '' : req.query.context;
                    mKPI.originalContext = ''
                }
                if (typeof mKPI.activity === 'undefined' || mKPI.activity === '') {
                    mKPI.activity = (typeof req.query.activity === 'undefined') ? '' : req.query.activity;
                    mKPI.originalActivity = ''
                }
                deferred.resolve(mKPI);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get index of 
            var deferred = Q.defer();


            _.each(mKPIs, function(kpi, index) {
                if (kpi._id.toString() === mKPI._id.toString()) {
                    keepKPI = index;
                }
            });
            console.log('task.name', keepKPI);
            deferred.resolve(mKPI);
            return deferred.promise;
        })
        .then(function() {
            // Get a single hierarchy
            var deferred = Q.defer();
            Hierarchies.find({
                name: 'Task'
            }, function(err, hierarchy) {
                hierarchyValues = hierarchy[0].list;
                deferred.resolve(mKPI);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get related dashboards
            var deferred = Q.defer();
            mKPI.dashboards = [];
            Dashboard.find({}, function(err, dashboard) {
                _.each(dashboard, function(rowdata, index) {
                    if (typeof rowdata.context === 'undefined' || rowdata.context === '') {
                        rowdata.context = mKPI.context
                    }
                    if (typeof rowdata.activity === 'undefined' || rowdata.activity === '') {
                        rowdata.activity = mKPI.activity
                    }
                    if (mKPI.dashboards && mKPI.context.indexOf(rowdata.context) >= 0 && mKPI.activity.indexOf(rowdata.activity) >= 0) {
                        mKPI.dashboards.push(rowdata.toObject());
                    }
                });
                deferred.resolve(mKPI);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get related Tasks
            var deferred = Q.defer();
            mKPI.tasks = [];
            var cloneReq = _.clone(req);
            delete cloneReq.params.id;
            getData.fromTask(cloneReq, function(myTasks) {
                mKPI.tasks = _.filter(myTasks.tasks, function(task) {
                    return (task.context.indexOf(mKPI.context) >= 0 && task.activity.indexOf(mKPI.activity) >= 0);
                });
                _.each(mKPI.dashboards, function(dashboard) {
                    if (typeof dashboard.context === 'undefined') {
                        dashboard.context = ''
                    }
                    if (typeof dashboard.activity === 'undefined') {
                        dashboard.activity = ''
                    }
                    dashboard.tasks = _.filter(myTasks.tasks, function(task) {
                        return (task.context.indexOf(dashboard.context) >= 0 && task.activity.indexOf(dashboard.activity) >= 0);
                    });
                });
                _.each(mKPI.tasks, function(task) {
                    task.kpis = task.kpis.slice(keepKPI, keepKPI + 1);
                });
                deferred.resolve(mKPI);
            });
            return deferred.promise;
        })
        .then(function() {
            // Get related Tasks
            var deferred = Q.defer();
            getData.addCalculToKPI([mKPI], mKPI.tasks, function(kpis) {
                mKPI.kpis = _.cloneDeep(kpis);
                deferred.resolve(mKPI)
            });
            return deferred.promise;
        })
        .then(function() {
            return res.json(mKPI);
        });
};

// Creates a new kpi in the DB.
exports.create = function(req, res) {
    var newKPI = new KPI(req.body, false);
    newKPI.save(function(err, doc) {
        res.send(200, doc);
    });
};

// Updates an existing kpi in the DB.
exports.update = function(req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    KPI.findById(req.params.id, function(err, kpi) {
        if (err) {
            return handleError(res, err);
        }
        if (!kpi) {
            return res.send(404);
        }
        var updated = _.merge(kpi, req.body);
        updated.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, kpi);
        });
    });
};

// Deletes a kpi from the DB.
exports.destroy = function(req, res) {
    KPI.findById(req.params.id, function(err, kpi) {
        if (err) {
            return handleError(res, err);
        }
        if (!kpi) {
            return res.send(404);
        }
        kpi.remove(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.send(204);
        });
    });
};

function handleError(res, err) {
    return res.send(500, err);
}