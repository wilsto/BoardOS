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
var Metric = require('../metric/metric.model');
var Hierarchies = require('../hierarchy/hierarchy.model');
var getData = require('../../config/getData');
var tools = require('../../config/tools');
var hierarchyValues = {};

var mKPIs = {};
var mTasks = [];
var mMetrics = [];
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
            mKPIs = {};
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
            return res.json(mKPI);
        });
};


// Get a single kpi
exports.tasksList = function(req, res) {
    Q()
        .then(function() {
            // Get a single kpi
            var deferred = Q.defer();
            mKPIs = {};
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
            // Get related tasks
            var deferred = Q.defer();
            Task.find({}).lean().exec(function(err, tasks) {
                mTasks = [];
                _.each(tasks, function(rowdata, index) {
                    if (rowdata.context.indexOf(req.query.context + '.') >= 0 && rowdata.activity.indexOf(req.query.activity + '.') >= 0) {
                        mTasks.push(rowdata);
                    }
                });
                deferred.resolve(mTasks);
            });
            return deferred.promise;
        })
        .then(function() {
            // Get related metrics
            var deferred = Q.defer();
            Metric.find({}).sort({
                date: 'asc'
            }).lean().exec(function(err, Metrics) {
                mMetrics = [];
                _.each(Metrics, function(rowdata, index) {
                    if (rowdata.context.indexOf(req.query.context + '.') >= 0 && rowdata.activity.indexOf(req.query.activity + '.') >= 0) {
                        mMetrics.push(rowdata);
                    }
                });
                deferred.resolve(mMetrics);
            });
            return deferred.promise;
        })
        .then(function() {
            // Get related metrics
            var deferred = Q.defer();
            _.each(mTasks, function(rowTask, index) {
                rowTask.metrics = [];
                _.each(mMetrics, function(rowMetric, index) {
                    if (rowTask.context === rowMetric.context && rowTask.activity === rowMetric.activity) {

                        // ajouter calcul auto
                        rowMetric.taskname = rowTask.name;

                        // nombre de jours séparant la date de début, fin, entre les deux
                        rowMetric.duration = moment(rowMetric.endDate).diff(rowMetric.startDate, 'days');
                        rowMetric.timeToBegin = moment(rowMetric.startDate).diff(moment(), 'days');
                        rowMetric.timeToEnd = moment(rowMetric.endDate).diff(moment(), 'days');
                        rowMetric.fromNow = moment(rowMetric.date).fromNow();

                        // predictedCharge
                        rowMetric.projectedWorkload = (rowMetric.progress > 0) ? Math.round(1000 * parseFloat(rowMetric.timeSpent.replace(',', '.')) * 100 / parseFloat(rowMetric.progress)) / 1000 : rowMetric.load;

                        // progressStatus
                        if (rowMetric.endDate > rowTask.endDate) {
                            switch (rowMetric.status) {
                                case 'Withdrawn':
                                case 'Finished':
                                    rowMetric.progressStatus = 'Late';
                                    break;
                                default:
                                    var d2 = new Date();
                                    var dateNow = d2.toISOString();
                                    if (dateNow < rowMetric.endDate) {
                                        rowMetric.progressStatus = 'At Risk';
                                    } else {
                                        rowMetric.progressStatus = 'Late';
                                    }
                            }
                        } else {
                            rowMetric.progressStatus = 'On Time';
                        }

                        rowTask.metrics.push(rowMetric);
                        rowTask.lastmetric = rowMetric;
                    }
                });
                rowTask.KPI = tools.calculKPI(rowTask.metrics, mKPI);
            });
            deferred.resolve(mTasks);
            return deferred.promise;
        })
        .then(function() {
            return res.json(mTasks);
        });
};

// Get a single kpi
exports.show33 = function(req, res) {
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