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

function calcBusinessDays(dDate1, dDate2) { // input given as Date objects
    var iWeeks, iDateDiff, iAdjust = 0;
    if (dDate2 < dDate1) return -1; // error code if dates transposed
    var iWeekday1 = dDate1.getDay(); // day of week
    var iWeekday2 = dDate2.getDay();
    iWeekday1 = (iWeekday1 === 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
    iWeekday2 = (iWeekday2 === 0) ? 7 : iWeekday2;
    if ((iWeekday1 > 5) && (iWeekday2 > 5)) iAdjust = 1; // adjustment if both days on weekend
    iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
    iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;

    // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
    iWeeks = Math.floor((dDate2.getTime() - dDate1.getTime()) / 604800000)

    if (iWeekday1 <= iWeekday2) {
        iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1)
    } else {
        iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2)
    }

    iDateDiff -= iAdjust // take into account both days on weekend

    return (iDateDiff + 1); // add 1 because dates are inclusive
}

// Get list of KPIs
exports.index = function(req, res) {
    KPI.find(function(err, KPIs) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(KPIs);
    });
};

// Get list of KPIs
exports.list = function(req, res) {
    KPI.find(function(err, KPIs) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(KPIs);
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
                deferred.resolve(mKPI);
            })
            return deferred.promise;
        })
        .then(function() {
            return res.status(200).json(mKPI);
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
            var taskFilter = (typeof req.query.taskFilter === 'undefined') ? {} : { _id: req.query.taskFilter };
            Task.find(taskFilter).lean().exec(function(err, tasks) {
                mTasks = [];
                _.each(tasks, function(rowdata, index) {

                    if (rowdata.context.indexOf(mKPI.context) >= 0 && rowdata.activity.indexOf(mKPI.activity) >= 0) {
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
                    if (rowdata.context.indexOf(mKPI.context) >= 0 && rowdata.activity.indexOf(mKPI.activity) >= 0) {
                        mMetrics.push(rowdata);
                    }
                });
                deferred.resolve(mMetrics);
            });
            return deferred.promise;
        })
        .then(function() {
            // Get related metrics
            var dateNow = new Date();

            var deferred = Q.defer();
            console.log('mTasks', mTasks.length);
            _.each(mTasks, function(rowTask, index) {
                rowTask.metrics = [];
                _.each(mMetrics, function(rowMetric, index2) {
                    if (rowTask.context === rowMetric.context && rowTask.activity === rowMetric.activity) {

                        // ajouter calcul auto
                        rowMetric.taskname = rowTask.name;
                        rowMetric.startDate = new Date(rowMetric.startDate);
                        rowMetric.endDate = new Date(rowMetric.endDate);
                        rowMetric.date = new Date(rowMetric.date);
                        rowTask.endDate = new Date(rowTask.endDate);

                        // nombre de jours séparant la date de début, fin, entre les deux
                        rowMetric.duration = calcBusinessDays(rowMetric.startDate, rowMetric.endDate);
                        rowMetric.timeToBegin = moment(rowMetric.startDate).diff(moment(), 'days');
                        rowMetric.timeToEnd = moment(rowMetric.endDate).diff(moment(), 'days');
                        rowMetric.fromNow = moment(rowMetric.date).fromNow();

                        // convert to numeric
                        rowMetric.timeSpent = parseFloat(rowMetric.timeSpent.replace(',', '.'));

                        // predictedCharge
                        rowMetric.projectedWorkload = (rowMetric.progress > 0) ? Math.round(1000 * rowMetric.timeSpent * 100 / parseFloat(rowMetric.progress)) / 1000 : rowMetric.load;
                        delete rowMetric.progressStatus;
                        // progressStatus
                        if (moment(dateNow).isAfter(rowTask.endDate,'day')) {
                            if ((moment(rowMetric.endDate).isAfter(rowTask.endDate,'day') || (moment(dateNow).isAfter(rowMetric.endDate,'day') && moment(rowMetric.date).isAfter(rowMetric.endDate,'day'))) && (rowMetric.status === 'In Progress' || rowMetric.status === 'Not Started')) {
                                rowMetric.progressStatus = 'Late';
                            } else {
                                rowMetric.progressStatus = 'On Time';
                            }
                        } else {
                            if (moment(rowMetric.endDate).isAfter(rowTask.endDate,'day')) {
                                rowMetric.progressStatus = 'At Risk';
                            } else {
                                rowMetric.progressStatus = 'On Time';
                            }
                        }

                        rowTask.metrics.push(rowMetric);
                        rowTask.lastmetric = rowMetric;
                        if (moment(dateNow).isAfter(rowTask.lastmetric.endDate,'day') && moment(dateNow).isAfter(rowTask.endDate,'day') && (rowTask.lastmetric.status === 'In Progress' || rowTask.lastmetric.status === 'Not Started')) {
                                rowTask.lastmetric.progressStatus = 'Late';
                        } 
                    }
                });
                rowTask.KPI = tools.calculKPI(rowTask.metrics, mKPI);
            });
            deferred.resolve(mTasks);
            return deferred.promise;
        })
        .then(function() {

            return res.status(200).json(mTasks);
        });
};

function workday_count(start, end) {
    var first = start.clone().endOf('week'); // end of first week
    var last = end.clone().startOf('week'); // start of last week
    var days = last.diff(first, 'days') * 5 / 7; // this will always multiply of 7
    var wfirst = first.day() - start.day(); // check first week
    if (start.day() === 0) --wfirst; // -1 if start with sunday 
    var wlast = end.day() - last.day(); // check last week
    if (end.day() === 6) --wlast; // -1 if end with saturday
    return wfirst + days + wlast; // get the total
}

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
            return res.status(200).json(mKPI);
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
            return res.status(200).json(kpi);
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
