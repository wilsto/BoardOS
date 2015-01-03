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

 var KPI = require('./KPI.model');
 var Q = require('q');
 var Dashboard = require('../dashboard/dashboard.model');
 var Task = require('../task/task.model');
 var Metric = require('../metric/metric.model');
 var Hierarchies = require('../hierarchy/hierarchy.model');
var hierarchyValues = {};
 var tools = require('../../config/tools');

 var mKPI = {};
 var myGroup  = [];

// Get list of KPIs
exports.index = function(req, res) {
  KPI.find(function (err, KPIs) {
    if(err) { return handleError(res, err); }
    return res.json(200, KPIs);
  });
};

// Get a single kpi
exports.show = function(req, res) {
  Q()
  .then(function () {
    // Get a single kpi
    var deferred = Q.defer();
    KPI.findById(req.params.id, function (err, kpi) {
      if(err) { return handleError(res, err); }
      if(!kpi) { return res.send(404); }
      mKPI = kpi.toObject();
      if (typeof mKPI.context === 'undefined' || mKPI.context === '')  { mKPI.context = (typeof req.query.context === 'undefined') ? '':req.query.context; mKPI.originalContext = ''};
      if (typeof mKPI.activity === 'undefined' || mKPI.activity === '')  {mKPI.activity = (typeof req.query.activity === 'undefined') ? '':req.query.activity; mKPI.originalActivity = ''};
      deferred.resolve(mKPI);
    })
    return deferred.promise;
  })
  .then(function () {
    // Get a single hierarchy
    var deferred = Q.defer();
    Hierarchies.find({name:'Task'}, function (err, hierarchy) {
      if(err) { return handleError(res, err); }
      hierarchyValues = hierarchy[0].list;
      deferred.resolve(mKPI);
    })
    return deferred.promise;
  })  
  .then(function () {
      // Get related dashboards
      var deferred = Q.defer();
      mKPI.dashboards = [];
      Dashboard.find({}, function (err, dashboard) {
        _.each(dashboard, function(rowdata, index) { 
          if (typeof rowdata.context === 'undefined' || rowdata.context === '')  { rowdata.context = mKPI.context};
          if (typeof rowdata.activity === 'undefined' || rowdata.activity === '')  { rowdata.activity = mKPI.activity};  
          if (mKPI.context.indexOf(rowdata.context) >=0 && mKPI.activity.indexOf(rowdata.activity) >=0 ) {
            mKPI.dashboards.push (rowdata.toObject());
          }
        });
        deferred.resolve(mKPI);
      })
      return deferred.promise;
    })
  .then(function () {
      // Get related Tasks
      var deferred = Q.defer();
      mKPI.tasks = [];
      Task.find({}, function (err, task) {
        _.each(task, function(rowdata, index) { 
          if (rowdata.context.indexOf(mKPI.context) >=0 && rowdata.activity.indexOf(mKPI.activity) >=0 ) {
            mKPI.tasks.push (rowdata.toObject());
          }
        });
        deferred.resolve(mKPI);
      })
      return deferred.promise;
    })  
  .then( function () {
    // Get related metrics
    var deferred = Q.defer();
    mKPI.metrics = [];
    Metric.find({}, function (err, metric) {
      _.each(metric, function(rowdata, index) {  
        if (rowdata.context.indexOf(mKPI.context) >=0 && rowdata.activity.indexOf(mKPI.activity) >=0 ) {
          mKPI.metrics.push (rowdata.toObject());
        }
      });
      deferred.resolve(mKPI);
    })
    return deferred.promise;
  })
  .then(function () {
    var deferred = Q.defer();

      //Valeurs
      if (typeof mKPI.metricTaskValues !== "undefined" && mKPI.metricTaskValues.length > 0) {
        var checksType = mKPI.metricTaskValues.split(' + ');
      }
      if (typeof mKPI.refMetricTaskValues !== "undefined" &&  mKPI.refMetricTaskValues.length > 0) {
        var refChecksType = mKPI.refMetricTaskValues.split(' + ');
      }

      // on ajoute des caractéristiques aux métriques
      //##############################################
      //Value for calculation
      mKPI.metricValues = [];
      mKPI.refMetricValues = [];
      _.each(mKPI.metrics, function(metric){ 

        // valeurs principales
        if (typeof checksType !== "undefined" ) {
          _.each(checksType, function(check) {
           if (metric[mKPI.metricTaskField] === check) { 
            mKPI.metricValues.push({value:metric[mKPI.metricTaskField],date:metric.date});
               } // avec indexOf pour le like
             });
        } else {
          mKPI.metricValues.push({value:metric[mKPI.metricTaskField],date:metric.date});
        }

        // valeurs références
        if (mKPI.refChecksType !== 'undefined'  ) {
          if (mKPI.refMetricTaskField === 'constant') {
            mKPI.refMetricValues.push({value:mKPI.refMetricTaskValues,date:metric.date});
          } else {
            _.each(refChecksType, function(check) {
             if (metric[mKPI.metricTaskField] === check) { 
              mKPI.refMetricValues.push({value:metric[mKPI.metricTaskField],date:metric.date});
               }  // avec indexOf pour le like
             });
          }
        } else {
          mKPI.refMetricValues.push({value:metric[mKPI.metricTaskField],date:metric.date});
        }

        // ajouter les propriétés des métriques
        var Value = _.filter(hierarchyValues, function(item) { return  item.text.toLowerCase() === metric[mKPI.metricTaskField].toLowerCase(); });
        if (Value.length > 0 ) {
          metric.color = Value[0].color;
          metric.value = Value[0].value;
          metric.description = Value[0].description;          
        }

        // grouper par mois 
        var d = new Date(new Number(new Date(metric.date)));
        metric.month = d.getFullYear()  + "." + ("0" + d.getMonth()).slice(-2) ;

        //metric.taskname = []; à vérifier qu'il n'y est qu'une tache avec le meme context, activity
        _.forEach(mKPI.tasks, function (task) {
            if (metric.context === task.context && metric.activity === task.activity) {
                metric.taskname = task.name;
            }
        }); 

        // nombre de jours séparant la date de fin
        metric.daysToDeadline = moment(metric.endDate).diff(moment(),'days');

      });


    // Réaliser des calculs
    switch(mKPI.action) {
      case 'count':
        mKPI.metricValuesCal = mKPI.metricValues.length;
        mKPI.refMetricValuesCal = mKPI.refMetricValues.length;
        break;
      case 'Mean':
        var sumMetricValuesCal = 0;
        var sumRefMetricValuesCal = 0;
        for( var i = 0; i < mKPI.metricValues.length; i++ ){
              sumMetricValuesCal += parseInt( mKPI.metricValues[i].value, 10 ); //don't forget to add the base
              sumRefMetricValuesCal += parseInt( mKPI.refMetricValues[i].value, 10 ); //don't forget to add the base
        }
        mKPI.metricValuesCal = sumMetricValuesCal/ mKPI.metrics.length;
        mKPI.refMetricValuesCal = sumRefMetricValuesCal/ mKPI.refMetricValues.length;
        break;
        default :
        if (typeof mKPI.metrics[mKPI.metrics.length - 1] !== "undefined") { mKPI.metricValues = mKPI.metrics[mKPI.metrics.length - 1][mKPI.type];}
        if (typeof mKPI.metrics[mKPI.metrics.length - 2] !== "undefined") { mKPI.metricPrevVal = mKPI.metrics[mKPI.metrics.length - 2][mKPI.type];}
        mKPI.refMetricValues = 100;                              
    }

      //calcul de l'age de la dernière metric
/*      if (typeof mKPI.metrics[metrics.length - 1] !== "undefined") {
        var date1 = new Date(mKPI.metrics[metrics.length - 1].date);                               
        var date2 = new Date();
        var diff = dateDiff(date1, date2);
        mKPI.ageVal = diff.day ;
      }*/

      mKPI.percentObjectif = (mKPI.metricValuesCal / mKPI.refMetricValuesCal) * 100;

      mKPI.metricsGroupBy = tools.groupByMonth(mKPI.metrics,'date',mKPI.metricTaskField);
      mKPI.metricsGroupByTask = tools.groupByTask(mKPI.metrics, mKPI.tasks, mKPI.metricTaskField);
      var test = "e" ;

      // graphics
      mKPI.graphs = [];
      var myChart0 = tools.buildChart(mKPI,'hBullet');
      var myChart1 = tools.buildChart(mKPI,'Bar');
      var myChart2 = tools.buildChart(mKPI,'Bubble');
      mKPI.graphs.push(myChart0);
      mKPI.graphs.push(myChart1);
      mKPI.graphs.push(myChart2);

    var actorsObject = _.countBy(mKPI.metrics,'actor');
    mKPI.actors = _.map(actorsObject, function(value, key) {
      return {name: key, count:value};
    });


      deferred.resolve(mKPI);
      return deferred.promise;
    })
.then(function () {

  return res.json(mKPI);
});
};

// Creates a new kpi in the DB.
exports.create = function(req, res) {
  var newKPI = new KPI(req.body, false);
  newKPI.save(function(err) {
    res.send(200);
  });
};

// Updates an existing kpi in the DB.
exports.update = function(req, res) {
  console.log(req.body);
  if(req.body._id) { delete req.body._id; }
  KPI.findById(req.params.id, function (err, kpi) {
    if (err) { return handleError(res, err); }
    if(!kpi) { return res.send(404); }
    var updated = _.merge(kpi, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, kpi);
    });
  });
};

// Deletes a kpi from the DB.
exports.destroy = function(req, res) {
  KPI.findById(req.params.id, function (err, kpi) {
    if(err) { return handleError(res, err); }
    if(!kpi) { return res.send(404); }
    kpi.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}


function dateDiff(date1, date2){
    var diff = {}                           // Initialisation du retour
    var tmp = date2 - date1;

    tmp = Math.floor(tmp/1000);             // Nombre de secondes entre les 2 dates
    diff.sec = tmp % 60;                    // Extraction du nombre de secondes

    tmp = Math.floor((tmp-diff.sec)/60);    // Nombre de minutes (partie entière)
    diff.min = tmp % 60;                    // Extraction du nombre de minutes

    tmp = Math.floor((tmp-diff.min)/60);    // Nombre d'heures (entières)
    diff.hour = tmp % 24;                   // Extraction du nombre d'heures

    tmp = Math.floor((tmp-diff.hour)/24);   // Nombre de jours restants
    diff.day = tmp;

    return diff;
  }