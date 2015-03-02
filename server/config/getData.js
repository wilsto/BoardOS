/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');

var KPI = require('../api/KPI/KPI.model');
var Q = require('q');
var Dashboard = require('../api/dashboard/dashboard.model');
var Task = require('../api/task/task.model');
var Metric = require('../api/metric/metric.model');
var Hierarchies = require('../api/hierarchy/hierarchy.model');
var hierarchyValues = {};

var mKPI = {};
var tools = require('./tools');


module.exports = {
    KPIById: function(req, callback) {

        Q()
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
                Task.find({}, function(err, task) {
                    _.each(task, function(rowdata, index) {
                        if (mKPI.tasks && rowdata.context.indexOf(mKPI.context) >= 0 && rowdata.activity.indexOf(mKPI.activity) >= 0) {
                            mKPI.tasks.push(rowdata.toObject());
                        }
                    });
                    deferred.resolve(mKPI);
                })
                return deferred.promise;
            })
            .then(function() {
                // Get related metrics
                var deferred = Q.defer();
                mKPI.metrics = [];
                Metric.find({}, function(err, metric) {
                    _.each(metric, function(rowdata, index) {
                        if (mKPI.metrics && rowdata.context.indexOf(mKPI.context) >= 0 && rowdata.activity.indexOf(mKPI.activity) >= 0) {
                            mKPI.metrics.push(rowdata.toObject());
                        }
                    });
                    deferred.resolve(mKPI);
                })
                return deferred.promise;
            })
            .then(function() {
                var deferred = Q.defer();

                // ajouter les propriétés des métriques
                //##############################################  
                _.each(mKPI.metrics, function(metric) {

                    // ajouter calcul auto
                    // nombre de jours séparant la date de début, fin, entre les deux
                    metric.duration = moment(metric.endDate).diff(metric.startDate, 'days');
                    metric.timeToBegin = moment(metric.startDate).diff(moment(), 'days');
                    metric.timeToEnd = moment(metric.endDate).diff(moment(), 'days');

                    // predictedCharge
                    metric.projectedWorkload = (metric.progress > 0) ? parseInt(parseInt(metric.timeSpent) * 100 / parseInt(metric.progress)) : metric.load;

                    // ajouter information par mois 
                    metric.groupTimeByValue = moment(metric.date).format("YYYY.MM");

                    //metric.taskname = []; à vérifier qu'il n'y est qu'une tache avec le meme context, activity
                    _.forEach(mKPI.tasks, function(task) {
                        if (metric.context === task.context && metric.activity === task.activity) {
                            metric.taskname = task.name;
                        }
                    });

                    // ajout des couleurs
                    if (typeof metric[mKPI.metricTaskField] === 'string') {
                        var Value = _.filter(hierarchyValues, function(item) {
                            return mKPI.metricTaskField && item.text.toLowerCase() === metric[mKPI.metricTaskField].toLowerCase();
                        });
                        if (Value.length > 0) {
                            metric.color = Value[0].color;
                            metric.value = Value[0].value;
                            metric.description = Value[0].description;
                        }
                    }
                });

                // on ajoute des caractéristiques aux KPI
                //##############################################
                module.exports.addCalculToKPI(mKPI);

                deferred.resolve(mKPI);
                return deferred.promise;
            })
            .then(function() {
                callback(mKPI);
            })
            .then(null, console.error);
    },
    addCalculToKPI: function(mKPI) {
        // on ajoute des caractéristiques aux KPI
        //##############################################
        mKPI.metricsGroupBy = {};
        mKPI.metricsGroupBy.Task = tools.groupMultiBy(mKPI.metrics, ['taskname']);
        mKPI.metricsGroupBy.TaskTime = tools.groupMultiBy(mKPI.metrics, ['taskname', 'groupTimeByValue']);
        mKPI.metricsGroupBy.Field = tools.groupMultiBy(mKPI.metrics, [mKPI.metricTaskField]);
        mKPI.metricsGroupBy.FieldTime = tools.groupMultiBy(mKPI.metrics, [mKPI.metricTaskField, 'groupTimeByValue']);
        mKPI.metricsGroupBy.Time = tools.groupMultiBy(mKPI.metrics, ['groupTimeByValue']);


        // a changer pour les bars
        mKPI.metricsGroupBy.oldTime = tools.groupByTime(tools.groupMultiBy(mKPI.metrics, ['groupTimeByValue', 'taskname']), 'date', mKPI.metricTaskField);

        mKPI.calcul = {};
        mKPI.calcul.time = _.map(mKPI.metricsGroupBy.Time, function(value, key) {
            return {
                month: key,
                valueKPI: tools.calculKPI(value, mKPI)
            };
        });
        mKPI.calcul.task = _.map(mKPI.metricsGroupBy.Task, function(value, key) {
            return {
                task: key,
                valueKPI: tools.calculKPI(value, mKPI)
            };
        });
        mKPI.calcul.taskTime = _.map(mKPI.metricsGroupBy.TaskTime, function(value, key) {
            return {
                task: key,
                time: _.map(value, function(value2, key2) {
                    return {
                        month: key2,
                        valueKPI: tools.calculKPI(value2, mKPI)
                    };
                })
            };
        });

        // la liste des acteurs
        mKPI.actors = _.map(_.countBy(mKPI.metrics, 'actor'), function(value, key) {
            return {
                name: key,
                count: value
            };
        });

        // graphics
        mKPI.graphs = [];

        var myChart0 = tools.buildChart(mKPI, 'hBullet');
        var myChart1 = tools.buildChart(mKPI, 'Bar');
        var myChart2 = tools.buildChart(mKPI, 'Bubble');
        mKPI.graphs.push(myChart0);
        mKPI.graphs.push(myChart1);
        mKPI.graphs.push(myChart2);

    },
    shrinkPerimeterOfKPI: function(kpi, perimeter) {
        //shrink metrics
        var metrics = kpi.metrics;
        delete kpi.metrics;
        kpi.metrics = _.filter(metrics, function(rowdata) {
            return (rowdata.context.indexOf(perimeter.context) >= 0) && (rowdata.activity.indexOf(perimeter.activity) >= 0);
        });

        //reinit kpi
        kpi.metricsGroupBy = {};
        kpi.metricsGroupBy = {};
        kpi.graphs = {};

        // recalcul kpi
        module.exports.addCalculToKPI(kpi);

        return kpi;
    }
};