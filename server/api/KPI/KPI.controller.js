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

var Dashboard = require('../dashboardComplete/dashboardComplete.model');
var KPI = require('./KPI.model');
var TaskFull = require('../taskFull/taskFull.model');
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
                console.log('mKPI', mKPI);
                deferred.resolve(mKPI);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get related tasks
            var deferred = Q.defer();

            var taskFilter = {};
            var cutoff = new Date();
            if (typeof req.query.rangedate === 'undefined') {
                req.query.rangedate = 1;
            }
            cutoff = new Date(cutoff.setDate(cutoff.getDate() - req.query.rangedate - 1)).toISOString();
            if (typeof req.query.taskFilter !== 'undefined') {
                if (req.query.rangedate !== 1) {
                    taskFilter = {
                        _id: req.query.taskFilter,
                        'metrics': {
                            $elemMatch: {
                                endDate: {
                                    $gte: cutoff
                                }
                            }
                        }
                    }
                } else {
                    taskFilter = {
                        _id: req.query.taskFilter
                    }
                }
            } else {
                if (req.query.rangedate !== 1) {
                    taskFilter = {
                        'metrics': {
                            $elemMatch: {
                                endDate: {
                                    $gte: cutoff
                                }
                            }
                        }
                    }
                }
            }
            TaskFull.find(taskFilter)
                .populate('actors', '-__v -create_date -email -hashedPassword -last_connection_date -provider -role -salt -active -location')
                .lean().exec(function(err, tasks) {
                    console.log('tasks', tasks.length);
                    mTasks = [];
                    _.each(tasks, function(rowdata, index) {

                        if (rowdata.context.indexOf(mKPI.context) >= 0 && rowdata.activity.indexOf(mKPI.activity) >= 0) {
                            mTasks.push(rowdata);
                        }
                        _.each(rowdata.actors, function(actor) {
                            actor.avatar = (actor.avatar) ? actor.avatar : 'assets/images/avatars/' + actor._id + '.png';
                        });

                    });
                    deferred.resolve(mTasks);
                });
            return deferred.promise;
        })
        .then(function() {
            var deferred = Q.defer();
            _.each(mTasks, function(rowTask, index) {
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
