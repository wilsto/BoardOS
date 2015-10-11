/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /dashboards              ->  index
 * POST    /dashboards              ->  create
 * GET     /dashboards/:id          ->  show
 * PUT     /dashboards/:id          ->  update
 * DELETE  /dashboards/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Q = require('q');
var moment = require('moment');
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('TRACE');

var Dashboard = require('./dashboard.model');
var KPI = require('../KPI/KPI.model');
var Task = require('../task/task.model');
var Metric = require('../metric/metric.model');
var Hierarchies = require('../hierarchy/hierarchy.model');

var tools = require('../../config/tools');
var getData = require('../../config/getData');
var hierarchyValues = {};
var mDashboard = {};
var mkpis = {};

// Get list of dashboards
exports.index = function(req, res) {
    Dashboard.find(function(err, dashboards) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(dashboards);
    });
};

// Get list of dashboards
exports.list = function(req, res) {
    Dashboard.find(function(err, dashboards) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(dashboards);
    });
};

// Get list of dashboards
exports.quick = function(req, res) {
    Dashboard.findById(req.params.id).lean().exec(function(err, dashboard) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(dashboard);
    });
};


// Get a single dashboard
exports.show = function(req, res) {
    //logger.trace("Start response");
    Q()
        .then(function() {
            // Get a single dashboard
            var deferred = Q.defer();
            //logger.trace("Loading dashboards");
            if (typeof req.params.id === 'undefined') {
                var filterUser = (req.params.userId) ? {
                    'owner._id': req.params.userId
                } : null;
                Dashboard.find(filterUser).lean().exec(function(err, dashboard) {
                    if (err) {
                        return handleError(res, err);
                    }
                    if (!dashboard) {
                        return res.send(404);
                    }
                    mDashboard = {
                        context: '',
                        activity: ''
                    };
                    mDashboard.dashboards = dashboard;
                    deferred.resolve(mDashboard);
                })
            } else {
                Dashboard.findById(req.params.id).lean().exec(function(err, dashboard) {
                    if (err) {
                        return handleError(res, err);
                    }
                    if (!dashboard) {
                        return res.send(404);
                    }
                    mDashboard = dashboard;

                    if (typeof mDashboard.context === 'undefined') {
                        mDashboard.context = ''
                    }
                    if (typeof mDashboard.activity === 'undefined') {
                        mDashboard.activity = ''
                    }
                    deferred.resolve(mDashboard);
                })
            }
            return deferred.promise;
        })
        .then(function() {
            // Get related KPIs
            var deferred = Q.defer();
            //logger.trace("Loading Kpis");
            KPI.find({}).lean().exec(function(err, kpis) {
                mkpis = kpis;
                deferred.resolve(mDashboard);
            });
            return deferred.promise;
        })
        .then(function() {
            // Get related Tasks
            var deferred = Q.defer();
            //logger.trace("Loading tasks");
            mDashboard.tasks = [];

            var cloneReq = _.clone(req);
            delete cloneReq.params.id;
            //logger.trace("End clone");
            getData.fromTask(cloneReq, function(myTasks) {
                //logger.trace("start filter task");
                mDashboard.tasks = _.filter(myTasks.tasks, function(task) {
                    return (task.context.indexOf(mDashboard.context + '.') >= 0 && task.activity.indexOf(mDashboard.activity + '.') >= 0);
                });
                //logger.trace("End filter task");
                _.each(mDashboard.dashboards, function(dashboard) {
                    if (typeof dashboard.context === 'undefined') {
                        dashboard.context = ''
                    }
                    if (typeof dashboard.activity === 'undefined') {
                        dashboard.activity = ''
                    }
                    dashboard.tasks = _.filter(myTasks.tasks, function(task) {
                        return (task.context.indexOf(dashboard.context + '.') >= 0 && task.activity.indexOf(dashboard.activity + '.') >= 0);
                    });
                    //logger.trace("End filter dashboard");
                });
                deferred.resolve(mDashboard);
            });
            return deferred.promise;
        })
        .then(function() {
            // Si plusieurs dashboards
            var deferred = Q.defer();
            //logger.trace("Merge tasks");
            var clonemkpis = _.cloneDeep(mkpis);
            if (typeof mDashboard.dashboards !== 'undefined' && mDashboard.dashboards.length !== 0) {
                _.each(mDashboard.dashboards, function(dashboard, index) {
                    getData.addCalculToKPI(clonemkpis, dashboard.tasks, function(kpis) {
                        dashboard.kpis = _.cloneDeep(kpis);
                        if (index === mDashboard.dashboards.length - 1) {
                            deferred.resolve(mDashboard)
                        }
                    });
                });
            } else {
                deferred.resolve(mDashboard);
            }
            return deferred.promise;
        })
        .then(function() {
            // Get related Tasks
            var deferred = Q.defer();
            //logger.trace("Add calculs");
            var clonemkpis = mkpis;
            getData.addCalculToKPI(clonemkpis, mDashboard.tasks, function(kpis) {
                mDashboard.kpis = kpis;
                deferred.resolve(mDashboard)
            });
            return deferred.promise;
        })
        .then(function() {
            //logger.trace("End reponse");
            _.each(mDashboard.dashboards, function(dashboard, index) {
                _.each(dashboard.tasks, function(task, index) {
                    delete task.dashboards;
                    delete task.metrics;
                });
            });
            _.each(mDashboard.tasks, function(task, index) {
                delete task.dashboards;
                delete task.metrics;
                delete task.kpis;
            });
            return res.status(200).json(mDashboard);
        });
};

// Creates a new dashboard in the DB.
exports.create = function(req, res) {
    var newDashboard = new Dashboard(req.body, false);
    newDashboard.save(function(err, doc) {
        res.send(200, doc);
    });

};

// Updates an existing dashboard in the DB.
exports.update = function(req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    Dashboard.findById(req.params.id, function(err, dashboard) {
        if (err) {
            return handleError(res, err);
        }
        if (!dashboard) {
            return res.send(404);
        }
        var updated = _.merge(dashboard, req.body);
        updated.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json(dashboard);
        });
    });
};

// Deletes a dashboard from the DB.
exports.destroy = function(req, res) {
    Dashboard.findById(req.params.id, function(err, dashboard) {
        if (err) {
            return handleError(res, err);
        }
        if (!dashboard) {
            return res.send(404);
        }
        dashboard.remove(function(err) {
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