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
 var KPI = require('./KPI.model');
 var Q = require('q');
 var Dashboard = require('../dashboard/dashboard.model');
 var Task = require('../task/task.model');
 var Metric = require('../metric/metric.model');
 var mKPI = {};

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
      // Get related dashboards
      var deferred = Q.defer();
      mKPI.dashboards = [];
      Dashboard.find({}, function (err, dashboard) {
        _.each(dashboard, function(rowdata, index) { 
          if (typeof rowdata.context === 'undefined' || rowdata.context === '')  { rowdata.context = mKPI.context};
          if (typeof rowdata.activity === 'undefined' || rowdata.activity === '')  { rowdata.activity = mKPI.activity};  
          if (rowdata.context.indexOf(mKPI.context) >=0 && rowdata.activity.indexOf(mKPI.activity) >=0 ) {
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

      // graphics
      mKPI.graphs = [];
      var myChart0=
          {
          "graphset":[
              {
              "type":"hbullet",
              "title":{
                      "text":"KPI This " + mKPI.groupTimeBy+ " (Base 100)",
                      "text-align":"left",
                      "font-size":"13px",
                      "font-color":"#000000",
                      "font-family":"Arial",
                      "background-color":"none"
              },
              "plotarea":{
                  "background-color":"transparent",
                  "margin":"35px 20px 20px 20px"
              },    
              "plot":{
                   "goal":{
                      "background-color":"#169ef4",
                      "border-width":0
                   }
              },
              "series":[
                  {
                      "values":[mKPI.percentObjectif],
                      "background-color":"#859900",
                      "alpha":"0.6",
                      "goals":[100]
                  }
              ]
              }
          ]
          };

      mKPI.graphs.push(myChart0);

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