'use strict';

var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');

var TaskComplete = require('./taskComplete.model');
var Task = require('../task/task.model');
var Metric = require('../metric/metric.model');
var Hierarchies = require('../hierarchy/hierarchy.model');
var KPI = require('../KPI/KPI.model');

var getData = require('../../config/getData');
var tools = require('../../config/tools');

var hierarchyValues = {};
var kpis = {};

// permanent
Hierarchies.find({
  name: 'Task'
}, '-__v', function(err, hierarchy) {
  hierarchyValues = hierarchy[0].list;
});

KPI.find({}, '-__v').lean().exec(function(err, mKPI) {
  kpis = mKPI;
})

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

function createAllCompleteTask() {
  Task.find({}, '-__v').lean().exec(function(err, tasks) {
    _.each(tasks, function(task, index) { // pour chaque tache
      createCompleteTask(task._id);
    });
  });
}
createAllCompleteTask();

function createCompleteTask(taskId) {
  Q()
    // Get a single task
    .then(function() {
      var deferred = Q.defer();
      if (typeof taskId === 'undefined') {
        console.log('Error');
      } else {
        Task.findById(taskId, {
          __v: false
        }).lean().exec(function(err, task) {
          deferred.resolve(task);
        })
      }
      return deferred.promise;
    })

  // Start metrics
  .then(function(task) {
    //
    var dateNow = new Date();
    //var dateNow = d2.toISOString();
    // Get related metrics
    var deferred = Q.defer();
    Metric.find({
      activity: task.activity,
      context: task.context
    }, '-__v').sort({
      date: 'asc'
    }).lean().exec(function(err, metrics) {
      _.each(metrics, function(metric, index) { // pour chaque metric

        delete metric.__v;
        delete metric.taskname;
        delete metric._id;
        delete metric.activity;
        delete metric.context;
        delete metric.actor.email;
        delete metric.actor.provider;
        delete metric.actor.last_connection_date;
        delete metric.actor.create_date;
        delete metric.actor.role;

        // si c'est la première métric, on crèe l'objet
        if (typeof task.metrics === 'undefined') {
          task.metrics = []
        }

        // ajouter calcul auto
        metric.startDate = new Date(metric.startDate);
        metric.endDate = new Date(metric.endDate);
        metric.date = new Date(metric.date);
        task.endDate = new Date(task.endDate);

        // nombre de jours séparant la date de début, fin, entre les deux
        metric.duration = calcBusinessDays(metric.startDate, metric.endDate);
        metric.timeToBegin = moment(metric.startDate).diff(moment(), 'days');
        metric.timeToEnd = moment(metric.endDate).diff(moment(), 'days');

        // convert to numeric
        metric.timeSpent = parseFloat(String(metric.timeSpent).replace(',', '.'));

        // predictedCharge
        metric.projectedWorkload = (metric.progress > 0) ? Math.round(1000 * metric.timeSpent * 100 / parseFloat(metric.progress)) / 1000 : metric.load;

        // progressStatus
        delete metric.progressStatus;
        if (moment(dateNow).isAfter(task.endDate, 'day')) {
          if ((moment(metric.endDate).isAfter(task.endDate, 'day') || (moment(dateNow).isAfter(metric.endDate, 'day') && moment(metric.date).isAfter(metric.endDate, 'day'))) && (metric.status === 'In Progress' || metric.status === 'Not Started')) {
            metric.progressStatus = 'Late';
          } else {
            metric.progressStatus = 'On Time';
          }
        } else {
          if (moment(metric.endDate).isAfter(task.endDate, 'day')) {
            metric.progressStatus = 'At Risk';
          } else {
            metric.progressStatus = 'On Time';
          }
        }

        // ajouter information par mois
        metric.groupTimeByValue = moment(metric.date).format("YYYY-MM");

        // kpis
        _.each(kpis, function(kpi, index) {

          // on calcule le time to wait par rapport aux KPIs
          if (task.context.indexOf(kpi.context) >= 0 && task.activity.indexOf(kpi.activity) >= 0) {
            task.timetowait = Math.min((typeof kpi.refresh === 'undefined') ? Infinity : kpi.refresh, (typeof task.timetowait === 'undefined') ? Infinity : task.timetowait);
          }

          // ajout des couleurs
          if (typeof metric[kpi.metricTaskField] === 'string') {
            var Value = _.filter(hierarchyValues, function(item) {
              return kpi.metricTaskField && item.text.toLowerCase() === metric[kpi.metricTaskField].toLowerCase();
            });
            if (Value.length > 0) {
              metric.color = Value[0].color;
              metric.value = Value[0].value;
              metric.description = Value[0].description;
            }
          }
        });

        // on calcule les temps d'écarts
        var oneDay = 24 * 60 * 60 * 1000;
        var d = new Date(task.startDate);
        var dateStart = d.setDate(d.getDate() - task.timetowait);
        var firstDate = (new Date(metric.date) > new Date(task.startDate)) ? new Date(metric.date) : new Date(dateStart);
        var currentDate = new Date();
        task.timewaited = Math.round((firstDate.getTime() - currentDate.getTime()) / (oneDay));
        task.timebetween = (metric.status === 'In Progress' || metric.status === 'Not Started') ? task.timetowait + task.timewaited : null;
        metric.fromNow = moment(metric.date).fromNow();

        //on l'ajoute à la liste
        task.metrics.push(metric);
        task.lastmetric = metric;
      });
      deferred.resolve(task);
    })
    return deferred.promise;
  })


  .then(function(task) {
    //logger.trace("Start Calculer les KPI par taches");
    // Calculer les KPI par taches
    var deferred = Q.defer();
    // pour chaque tache
    task.kpis = [];
    task.alerts = [];
    // kpis
    _.each(kpis, function(kpi, index) {
      var mKPI = {};

      // on ajoute des caractéristiques aux KPI
      //##############################################
      mKPI.metricsGroupBy = {};
      mKPI.calcul = {};
      mKPI.metricsGroupBy.Time = tools.groupMultiBy(task.metrics, ['groupTimeByValue']);
      var filteredMetrics = _.filter(task.metrics, function(metric) {
        return (task.category === 'Alert') ? metric.groupTimeByValue === moment(new Date()).format("YYYY-MM") : _.last(metric.groupTimeByValue); //filtrer par le mois en cours
      });
      mKPI.calcul.task = tools.calculKPI(filteredMetrics, kpi);
      mKPI.calcul.taskTime = _.map(mKPI.metricsGroupBy.Time, function(value, key) {
        return {
          month: key,
          valueKPI: tools.calculKPI(value, kpi)
        };
      });

      if (kpi.category === 'Alert') {
        task.alerts.push(mKPI);
      } else {
        task.kpis.push(mKPI);
      }
    });

    deferred.resolve(task);
    return deferred.promise;
  })

  // Save a single task complete
  .then(function(task) {

    TaskComplete.findById(taskId, function(err, taskComplete) {
      if (err) {
        console.log('error :', err);
      }

      // si non existant
      if (!taskComplete) {
        TaskComplete.create(task, function(err, CreatedtaskComplete) {
          if (err) {
            console.log('error :', err);
          }
          console.log('CreatedtaskComplete ', task.name);
          return true;
        });
      } else {
        //si existant
        var updated = _.merge(taskComplete, task);
        updated.markModified('actor');
        updated.markModified('metrics');
        updated.markModified('lastmetric');
        updated.markModified('kpis');
        updated.markModified('alerts');
        updated.save(function(err) {
          if (err) {
            console.log('error :', err);
          }
          console.log('UpdatedtaskComplete ', task.name);
          return true;
        });
      }
    });

  })
}


// Get list of taskCompletes
exports.index = function(req, res) {
  TaskComplete.find({}, {
    __v: false,
    metrics: false,
    alerts: false,
    kpis: false,
    "actor.last_connection_date": false,
    "actor.create_date": false,
    "actor.provider": false,
    "actor.email": false,
    "actor.role": false,
    "actor.active": false,
    "actor.location": false
  }, function(err, taskCompletes) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(taskCompletes);
  });
};

// Get a single taskComplete
exports.show = function(req, res) {
  TaskComplete.findById(req.params.id, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskComplete) {
      return res.status(404).send('Not Found');
    }
    return res.json(taskComplete);
  });
};

// Creates a new taskComplete in the DB.
exports.create = function(req, res) {
  TaskComplete.create(req.body, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(taskComplete);
  });
};

// Updates an existing taskComplete in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  TaskComplete.findById(req.params.id, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskComplete) {
      return res.status(404).send('Not Found');
    }
    var updated = _.merge(taskComplete, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(taskComplete);
    });
  });
};

// Deletes a taskComplete from the DB.
exports.destroy = function(req, res) {
  TaskComplete.findById(req.params.id, function(err, taskComplete) {
    if (err) {
      return handleError(res, err);
    }
    if (!taskComplete) {
      return res.status(404).send('Not Found');
    }
    taskComplete.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
