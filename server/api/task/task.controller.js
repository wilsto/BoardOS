/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /tasks              ->  index
 * POST    /tasks              ->  create
 * GET     /tasks/:id          ->  show
 * PUT     /tasks/:id          ->  update
 * DELETE  /tasks/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Q = require('q');
var moment = require('moment');

var Task = require('./task.model');
var Metric = require('../metric/metric.model');
var KPI = require('../KPI/KPI.model');
var User = require('../user/user.model');
var Dashboard = require('../dashboard/dashboard.model');
var Hierarchies = require('../hierarchy/hierarchy.model');
var hierarchyValues = {};
var mTasks = [];
var mTask = {};
var usersList = [];

var getData = require('../../config/getData');

// Get list of tasks
exports.index = function(req, res) {
    Task.find(function(err, tasks) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, tasks);
    });
};


// Get list of tasks
exports.list = function(req, res) {
    Q()
        .then(function() {
            // Get related tasks

            var perimeterFilter = true
            var userFilter = true;

            var deferred = Q.defer();
            Task.find({}, '-__v').sort({
                date: 'asc'
            }).lean().exec(function(err, tasks) {
                mTasks = [];
                _.each(tasks, function(rowdata, index) {

                    // Si la query restreint le périmètre
                    if (typeof req.query.context !== 'undefined' && typeof req.query.activity !== 'undefined') {
                        // activation du filtre
                        perimeterFilter = false;
                        if (rowdata.context.indexOf(req.query.context) >= 0 && rowdata.activity.indexOf(req.query.activity) >= 0) {
                            perimeterFilter = true;
                        }
                    }

                    // Si la query restreint le user
                    //console.log('req.query.userId', req.query.userId);
                    if (typeof req.query.userId !== 'undefined') {
                        userFilter = false;
                        if (rowdata.actor._id === req.query.userId) {
                            userFilter = true;
                        }
                    }

                    if (perimeterFilter && userFilter) {
                        mTasks.push(rowdata);
                    }
                });



                deferred.resolve(mTasks);
            });
            return deferred.promise;
        })

    // aller chercher la last métrique
    .then(function() {
        getData.addLastMetric(mTasks, function(mTasks) {
            getData.filterTasks(mTasks, req, function(mTasks) {
                return res.status(200).json(mTasks);
            })
        })
    })

};


// Get count of tasks which start
exports.countByMonth = function(req, res) {
    var o = {};
    o.map = function() {
        emit((new Date(this.date)).getFullYear() + '.' + ((new Date(this.date)).getMonth() + 1), 1);
    };
    o.reduce = function(k, val) {
        return Array.sum(val)
    };
    o.query = {
        activity: new RegExp(req.query.activity),
        context: new RegExp(req.query.context)
    };
    Task.mapReduce(o, function(err, results) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(results);
    });
};

// Get list of tasks
exports.search = function(req, res) {
    Task.find({
        activity: req.query.activity,
        context: req.query.context
    }, function(err, tasks) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, tasks);
    });
};

// Get list of tasks
exports.watch = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (typeof task.watchers === 'undefined') {
            task.watchers = [];
        }
        if (_.contains(task.watchers, req.params.userId)) {
            task.watchers = _.xor(task.watchers, [req.params.userId]);
        } else {
            task.watchers.push(req.params.userId);
        }
        task.markModified('watchers');
        task.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, task);
        });
    });
};


// Get a single task
exports.show = function(req, res) {
    getData.fromTask(req, function(myTasks) {
        getData.addCalculToKPI(myTasks.kpis, myTasks.tasks, function(kpis) {
            myTasks.kpis = kpis;
            return res.json(200, myTasks);
        });

    });
};

// Get a single task
exports.showList = function(req, res) {
    getData.fromTask(req, function(myTasks) {
        _.each(myTasks.tasks, function(rowtask, index) {
            delete rowtask.dashboards;
            delete rowtask.kpis;
            delete rowtask.metrics;
            delete rowtask.secondDate;
            delete rowtask.actor;
            if (rowtask.watchers.length < 1) {
                delete rowtask.watchers;
            }
            if (rowtask.lastmetric) {
                delete rowtask.lastmetric._id;
                delete rowtask.lastmetric.context;
                delete rowtask.lastmetric.activity;
                delete rowtask.lastmetric.actor;
                delete rowtask.lastmetric.taskname;
            }
        });
        return res.json(200, myTasks.tasks);
    });
};


// Get a single task
exports.show2 = function(req, res) {

    Q()
        .then(function() {
            // Get a single task
            var deferred = Q.defer();

            if (typeof req.params.id === 'undefined') {
                Task.find().sort({
                    date: 'desc'
                }).lean().exec(function(err, task) {
                    if (err) {
                        return handleError(res, err);
                    }
                    if (!task) {
                        return res.send(404);
                    }
                    mTask = {
                        _id: null,
                        name: null,
                        context: '',
                        activity: ''
                    };
                    mTask.tasks = task;
                    deferred.resolve(mTask);
                })
            } else {
                Task.findById(req.params.id).lean().exec(function(err, task) {
                    if (err) {
                        return handleError(res, err);
                    }
                    if (!task) {
                        return res.send(404);
                    }
                    mTask = {
                        _id: task._id,
                        name: task.name,
                        context: task.context,
                        activity: task.activity
                    };
                    mTask.tasks = task;
                    deferred.resolve(mTask);
                })
            }
            return deferred.promise;
        })
        .then(function() {
            // Get a single user
            var deferred = Q.defer();
            User.find({}, '-salt -hashedPassword', function(err, user) {
                if (err) {
                    return handleError(res, err);
                }
                usersList = user;
                deferred.resolve(mTask);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get a single hierarchy
            var deferred = Q.defer();
            Hierarchies.find({
                name: 'Task'
            }, function(err, hierarchy) {
                if (err) {
                    return handleError(res, err);
                }
                hierarchyValues = hierarchy[0].list;
                deferred.resolve(mTask);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get related dashboards // A revoir car ne marche pas avec plusieurs taches
            var deferred = Q.defer();
            mTask.dashboards = [];
            Dashboard.find({}, function(err, dashboard) {
                _.each(dashboard, function(rowdata, index) {
                    if (typeof rowdata.context === 'undefined' || rowdata.context === '') {
                        rowdata.context = mTask.context
                    }
                    if (typeof rowdata.activity === 'undefined' || rowdata.activity === '') {
                        rowdata.activity = mTask.activity
                    }
                    if (typeof rowdata.context === 'undefined' || mTask.context.indexOf(rowdata.context) >= 0 && typeof rowdata.activity === 'undefined' || mTask.activity.indexOf(rowdata.activity) >= 0) {
                        if (typeof mTask.dashboards !== 'undefined') {
                            mTask.dashboards.push(rowdata.toObject());
                        }
                    }
                });
                deferred.resolve(mTask);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get related KPIs
            var deferred = Q.defer();
            mTask.kpis = [];
            KPI.find({}, function(err, kpi) {
                _.each(kpi, function(rowdata, index) {
                    if (typeof mTask.context === 'undefined') {
                        mTask.context = ''
                    }
                    if (typeof mTask.activity === 'undefined') {
                        mTask.activity = ''
                    }
                    if (typeof rowdata.context === 'undefined' || rowdata.context === '') {
                        rowdata.context = mTask.context
                    }
                    if (typeof rowdata.activity === 'undefined' || rowdata.activity === '') {
                        rowdata.activity = mTask.activity
                    }
                    if (rowdata.context.indexOf(mTask.context) >= 0 && rowdata.activity.indexOf(mTask.activity) >= 0) {
                        if (typeof mTask.metrics !== 'undefined') {
                            mTask.kpis.push(rowdata.toObject());
                        }
                    }
                });
                deferred.resolve(mTask);
            })
            return deferred.promise;
        })
        .then(function() {
            // Get related metrics
            var deferred = Q.defer();
            Metric.find().sort({
                date: 'asc'
            }).lean().exec(function(err, metric) {
                _.each(metric, function(metricdata, index) { // pour chaque metric

                    _.each(mTask.tasks, function(taskdata, index) { // pour chaque tache
                        taskdata.metrics = [];
                        if (metricdata.context === mTask.context && metricdata.activity === mTask.activity) {
                            metricdata.fromNow = moment(metricdata.date).fromNow();
                            if (typeof taskdata.metrics !== 'undefined') {
                                taskdata.metrics.push(metricdata);
                            }

                            // get last kpis metrics
                            _.each(mTask.kpis, function(kpidata, index) {
                                if (taskdata.context.indexOf(kpidata.context) >= 0 && taskdata.activity.indexOf(kpidata.activity) >= 0) {
                                    taskdata.timetowait = Math.min((typeof kpidata.refresh === 'undefined') ? Infinity : kpidata.refresh, (typeof taskdata.timetowait === 'undefined') ? Infinity : taskdata.timetowait);
                                }
                            });

                            if (metricdata.context === taskdata.context && metricdata.activity === taskdata.activity) { // pour la tache
                                var oneDay = 24 * 60 * 60 * 1000;
                                var firstDate = new Date(metricdata.date);
                                var secondDate = new Date();
                                taskdata.timewaited = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                                taskdata.timebetween = taskdata.timetowait - taskdata.timewaited;
                                taskdata.lastmetric = metricdata;
                            }

                        }
                    });
                });
                deferred.resolve(mTask);
            })
            return deferred.promise;
        })
        .then(function() {
            var actorsObject = _.countBy(mTask.metrics, function(metric) {
                return metric.actor._id;
            });
            mTask.actors = _.map(actorsObject, function(value, key) {
                return {
                    _id: key,
                    count: value,
                    name: _.pluck(_.filter(usersList, function(user) {
                        return (key === user._id.toString())
                    }), 'name').toString()
                };
            });
            return res.json(mTask);
        });
};

// Creates a new task in the DB.
exports.create = function(req, res) {
    var cleanTask = req.body;
    delete cleanTask.activity_old;
    delete cleanTask.context_old;
    var newTask = new Task(cleanTask, false);
    newTask.save(function(err, task) {
        var date = new Date();
        var cleanMetric = {
            context: cleanTask.context,
            activity: cleanTask.activity,
            date: date.toISOString(),
            actor: cleanTask.actor,
            status: 'Not Started',
            startDate: cleanTask.startDate,
            endDate: cleanTask.endDate,
            load: cleanTask.load,
            timeSpent: 0,
            progress: 0,
            progressStatus: 'On Time',
            trust: 100
        };

        var mewMetric = new Metric(cleanMetric, false);
        mewMetric.save(function(err, metric) {
            res.send(200, task);
        });
    });
};

// Updates an existing task in the DB.
exports.update = function(req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }
        if (!task) {
            return res.send(404);
        }

        // sauvegarder le précédent perimètre pour modifier les métriques
        var context_old = req.body.context_old;
        var activity_old = req.body.activity_old;
        delete req.body.activity_old;
        delete req.body.context_old;
        var updated = _.merge(task, req.body);
        updated.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            // modifier les metrics correspondants
            if (context_old !== req.body.context || activity_old !== req.body.activity) {
                Metric.update({
                    'context': context_old,
                    'activity': activity_old
                }, {
                    'context': req.body.context,
                    'activity': req.body.activity
                }, {
                    multi: true
                }, function(err, metrics) {
                    if (err) return handleError(err);
                    return res.send(201);
                });
            }
        });
    });
};

// Updates an existing task in the DB.
exports.globalChange = function(req, res) {
    console.log('req.query', req.query);
    var query = {};
    var HierarchyType = req.query.HierarchyType
    var regex = req.query.textFilter;
    var patt;
    var pattOption;
    if (regex && regex.indexOf('/') >= 0) {
        var regexMatch = regex.match(/^\/(.*)\/([^\/]*)$/);
        patt = new RegExp(regexMatch[1], regexMatch[2]);
    } else {
        patt = new RegExp(regex);
    }
    query[HierarchyType] = patt;

    Task.find(
        query, function(err, tasks) {
            if (err) {
                return handleError(res, err);
            }
            if (!tasks) {
                return res.send(404);
            }

            // sauvegarder le précédent perimètre pour modifier les métriques
            var newValue = {};
            var updated;
            var updatedMetric;
            _.each(tasks, function(task) {
                newValue[HierarchyType] = task[HierarchyType].replace(patt, req.query.textReplace);
                updated = _.merge(task, newValue);
                updated.save(function(err) {
                    if (err) {
                        return handleError(res, err);
                    }

                    Metric.find(
                        query, function(err, metrics) {
                            _.each(metrics, function(metric) {
                                updatedMetric = _.merge(metric, newValue);
                                updatedMetric.save(function(err) {
                                    if (err) {
                                        return handleError(res, err);
                                    }
                                });
                            });
                        }
                    );
                });
            });
            return res.send(201);
        });
};

// Deletes a task from the DB.
exports.destroy = function(req, res) {
    Task.findById(req.params.id, function(err, task) {
        if (err) {
            return handleError(res, err);
        }

        if (!task) {
            return res.send(404);
        }

        task.remove(function(err) {
            if (err) {
                return handleError(res, err);
            }
            // supprimer les metrics correspondants
            Metric.find({
                'context': task.context,
                'activity': task.activity
            }).remove(function(err) {
                if (err) {
                    return handleError(res, err);
                }
                return res.send(204);
            });
        });
    });
};

function handleError(res, err) {
    return res.send(500, err);
}