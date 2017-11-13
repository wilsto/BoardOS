'use strict';
var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');
var Q = require('q');

var KPI = require('../api/KPI/KPI.model');
var DashboardComplete = require('../api/dashboardComplete/dashboardComplete.model');
var TaskFull = require('../api/taskFull/taskFull.model');
var Hierarchies = require('../api/hierarchy/hierarchy.model');
var User = require('../api/user/user.model');

var hierarchyValues = {};
var mTask = {};
var usersList = [];
var dashboards = [];
var mKPI = {};

var tools = require('./tools');

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

module.exports = {
  filterTasks: function(tasks, req, callback) {
    var filteredTasks = [];
    Q()
      .then(function() {
        var deferred = Q.defer();
        _.each(tasks, function(taskdata) { // pour chaque tache
          var oktopush = false;
          if (typeof req.query.status !== 'undefined' && typeof taskdata.lastmetric !== 'undefined') {
            if (taskdata.lastmetric.status === 'In Progress' || taskdata.lastmetric.status === 'Not Started') {
              oktopush = true;
            }
          } else {
            oktopush = true;
          }
          if (oktopush) {
            filteredTasks.push(taskdata);
          }
        });
        deferred.resolve(filteredTasks);
        return deferred.promise;
      })
      .then(function() {
        callback(filteredTasks);
      })
      .then(null, console.error);
  },
  addCalculToKPI: function(kpis, tasks, callback) {

    // on ajoute des caractéristiques aux KPI
    //##############################################
    _.each(kpis, function(kpi, index) {
      kpi.calcul = {};
      kpi.calcul.details = _.map(tasks, function(task) {
        return task.kpis[index].calcul;
      });

      // calcul par tache
      var kpicalculValues = _.filter(_.map(kpi.calcul.details, function(calcul) {
        return calcul.task;
      }), function(data) {
        return !isNaN(parseInt(data));
      });
      var sum = _.reduce(kpicalculValues, function(sum, kpicalcul) { // sum
        return sum + kpicalcul;
      });
      kpi.calcul.task = (kpi.category === 'Alert') ? sum : parseInt(sum / kpicalculValues.length);

      // calcul par tache et temps
      kpicalculValues = _.filter(_.map(kpi.calcul.details, function(calcul) {
        return calcul.taskTime;
      }), function(data) {
        return (data[0]) ? !isNaN(parseInt(data[0].valueKPI)) : true;
      });
      var kpiValuesByMonth = _.groupBy(_.flatten(kpicalculValues), function(data) {
        return data.month;
      });
      kpi.calcul.taskTime = _.map(kpiValuesByMonth, function(data) {
        sum = _.reduce(_.map(data, 'valueKPI'), function(sum, kpicalcul) { // sum
          return sum + kpicalcul;
        });
        var number = _.map(_.pick(_.map(data, 'valueKPI'), _.isNumber)).length;
        return {
          month: data[0].month,
          sum: sum,
          number: number,
          value: (kpi.category === 'Alert') ? sum : (number === 0) ? null : parseInt(sum / number)
        };
      });

    });
    callback(kpis);
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
