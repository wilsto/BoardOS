/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');

var Hierarchies = require('../api/hierarchy/hierarchy.model');
var KPI = require('../api/KPI/KPI.model');
var events = require('events');
var hierarchyEmitter = new events.EventEmitter();
var hierarchyValues = {};
var kpis = {};

KPI.find({}, '-__v').lean().exec(function(err, mKPI) {
  kpis = mKPI;
})

function groupByMulti(obj, values, context) {
  if (!values.length)
    return obj;
  var byFirst = _.groupBy(obj, values[0], context),
    rest = values.slice(1);
  for (var prop in byFirst) {
    byFirst[prop] = groupByMulti(byFirst[prop], rest, context);
  }
  return byFirst;
}

module.exports = {
  buildChart: function(mKPI, KPIType) {
    var myChart;
    var mySeries = [];
    var myValues = _.last(mKPI.calcul.time) && _.last(mKPI.calcul.time).valueKPI;
    switch (KPIType) {
      case 'hBullet':
        myChart = {
          "graphset": [{
            "type": "hbullet",
            "background-color": "#ffffff",
            "title": {
              "text": "KPI This " + mKPI.groupTimeBy + " (Base 100)",
              "text-align": "left",
              "font-size": "13px",
              "font-color": "#000000",
              "font-family": "Arial",
              "background-color": "none"
            },
            "plotarea": {
              "background-color": "none",
              "margin": "35px 20px 20px 20px"
            },
            "plot": {
              "goal": {
                "background-color": "#169ef4", // blue if goal
                "border-width": 0
              }
            },
            "series": [{
              "values": [myValues],
              "background-color": "#859900",
              "alpha": "0.6",
              "goals": [100]
            }]
          }]
        };
        break;
      case 'Bar':

        _.forEach(mKPI.metricsGroupBy.oldTime, function(item, key) {
          mySeries.push({
            "text": key,
            "values": _.pluck(item, 'count'),
            "background-color": _.compact(_.uniq(_.pluck(item, 'color'))),
            "alpha": "0.7",
            "description": "<= Scheduled deadline"
          })
          var myLabels = _.pluck(item, 'label');
        });

        myChart = {
          "graphset": [{
            "type": "bar",
            "height": "100%",
            "width": "100%",
            "background-color": "#ffffff",
            "border-radius": 4,
            "title": {
              "text": "Metrics History",
              "text-align": "left",
              "font-size": "13px",
              "font-color": "#000000",
              "font-family": "Arial",
              "background-color": "none"
            },
            "legend": {
              "toggle-action": "remove",
              "layout": "x3",
              "x": "52.5%",
              "shadow": false,
              "border-color": "none",
              "background-color": "none",
              "item": {
                "font-color": "#000000"
              },
              "marker": {
                "type": "circle",
                "alpha": "0.6",
                "border-width": 0
              },
              "tooltip": {
                "text": "%plot-description",
                "visible": true
              }
            },
            "crosshair-x": {},
            "tooltip": {
              "visible": true,
            },
            "plot": {
              "stacked": true,
              "background-color": "#000000",
              "animation": {
                "effect": "4"
              }
            },
            "plotarea": {

            },
            "scale-x": {
              "values": ["-11", "-10", "-9", "-8", "-7", "-6", "-5", "-4", "-3", "-2", "-1", "Now"],
              "line-color": "#adadad",
              "line-width": "1px",
              "item": {
                "font-size": "10px",
                "font-family": "arial",
                "offset-y": "-2%"
              },
              "guide": {
                "visible": true
              },
              "tick": {
                "visible": false
              }
            },
            "scale-y": {
              "line-color": "none",
              "item": {
                "font-size": "10px",
                "font-family": "arial",
                "offset-x": "2%"
              },
              "guide": {
                "line-style": "solid",
                "line-color": "#adadad"
              },
              "tick": {
                "visible": false
              }
            },
            "series": mySeries

          }]
        };
        break;
      case 'Line':
        myChart = {
          "graphset": [{
            "type": "line",
            "title": {
              "text": "Line"
            },
            "series": [{
              "values": [16, 7, 14, 11, 24, 42, 26, 13, 32, 12]
            }, {
              "values": [35, 22, 35, 30, 46, 45, 33, 26, 23, 27]
            }]
          }]
        };
        break;
      case 'Bubble':
        _.forEach(mKPI.metricsGroupBy.TaskTime, function(item, key) { // pour chaque tache
          var lastMonth = _.chain(item).pairs().sortBy(function(item) {
            return item[0];
          }).last().value(); // on prend le derniere mois avec une mesure
          var lastMetric = _.chain(lastMonth[1]).sortBy('date').last().value();

          if (lastMetric.status !== 'Finished') { // not finished
            mySeries.push({
              "values": [
                [lastMetric.value, lastMetric.timeToEnd, lastMetric.load]
              ],
              "text": lastMetric.taskname || 'No task',
              "marker": {
                "background-color": lastMetric.color,
                "alpha": "0.6"
              }
            });
          }
        });

        myChart = {
          "graphset": [{
            "type": "bubble",
            "background-color": "#ffffff",
            "plotarea": {
              "background-color": "none",
              "margin": "0px 0px 50px 50px"
            },
            "scale-y": {
              "label": {
                "text": "Delivery Deadline (days)"
              }
            },
            "scale-x": {
              "labels": ["Late", "At Risk", "On Time"],
              "label": {
                "text": "Vs scheduled"
              },
              "values": "1:3:1"
            },
            "plot": {
              "size-factor": 3,
              "value-box": {
                "type": "all",
                "text": "%t",
                "placement": "right"
              }
            },
            "series": mySeries
          }]
        };
    } // fin switch
    return myChart;

  },
  buildHierarchy: function(arry, type) {

    var roots = [],
      children = {},
      list = [],
      i, len;

    // find the top level nodes and hash the children based on parent
    for (i = 0, len = arry.length; i < len; ++i) {
      var item = arry[i];
      var p = item.parent;
      var target = (p === '#') ? roots : (children[p] || (children[p] = []));
      item.longname = item.text;
      target.push({
        value: item
      });
    }

    // function to recursively build the tree
    var findChildren = function(parent, longName) {
      if (children[parent.value.id]) {
        parent.children = children[parent.value.id];
        for (i = 0, len = parent.children.length; i < len; ++i) {
          parent.children[i].value.longname = parent.value.longname + '.' + parent.children[i].value.text;
          list.push({
            text: parent.children[i].value.text,
            longName: parent.children[i].value.longname,
            id: parent.children[i].value.id
          });
          findChildren(parent.children[i], parent.value.longname);
        }
      }
    };

    // enumerate through to handle the case where there are multiple roots
    for (i = 0, len = roots.length; i < len; ++i) {
      list.push({
        text: roots[i].value.longname,
        id: roots[i].value.id
      });
      findChildren(roots[i]);
    }
    if (type === 'list') {
      return list
    }
    if (type === 'Treeview') {
      return roots
    }
  },
  groupByTime: function(metrics, fieldDate, field) {


    var dateResult = [];
    var i;
    var yourDate = new Date();
    for (i = 0; i < 12; i++) {
      dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
    }

    var map_result = _.map(dateResult, function(item) {
      return {
        "label": moment(item).format("YYYY.MM"),
        "count": null
        //,
        //"sum": null,
        //"mean":null
      };
    });

    map_result.reverse() // par ordre croissant
    var myGroup = {};

    _.forEach(metrics, function(task, key) {
      var month = key;
      _.forEach(task, function(metrics, key) { // pour chaque tache

        var metric = _.chain(metrics).sortBy('date').last().value(); // prendre la dernière metric

        if (typeof myGroup[metric[field]] === 'undefined') {
          myGroup[metric[field]] = _.clone(map_result, true);
        }

        _.forEach(myGroup[metric[field]], function(itemMap) {
          if (itemMap.label === month) {
            itemMap.count += 1;

            itemMap.color = metric.color;
            itemMap.value = metric.value;
            itemMap.description = metric.description;

          }
        });
      });
    });
    return myGroup;
  },
  groupMultiBy: function(metrics, fields) {
    var myGroup = {};
    var sortMetrics = _.sortBy(metrics, fields[0]); // on trie
    var groupMetrics = groupByMulti(sortMetrics, fields) // on groupe
    return groupMetrics;
  },
  calculKPI: function(metrics, kpi) {

    var completekpi = _.filter(kpis, function(thiskpi) {
      return thiskpi._id.toString() === kpi._id.toString();
    })[0];

    var calcul = null;
    var calculMain, calculRef, filteredMetrics, filteredRefMetrics;
    var action = completekpi.action.toLowerCase();
    var values = completekpi.metricTaskValues && completekpi.metricTaskValues.split(' + ');
    var refValues = completekpi.refMetricTaskValues && completekpi.refMetricTaskValues.split(' + ');
    var field = completekpi.metricTaskField;
    var refField = completekpi.refMetricTaskField;
    var listValues = completekpi.listValues;
    var refListValues = completekpi.refListValues;

    if (metrics.length > 0) { // si metric existe

      // filtrer par Liste (first, last, all)
      switch (listValues) {
        case 'AllValues':
        case 'UniqueValues':
        case 'LastValue':
          filteredMetrics = [_.last(metrics)];
          break;
        case 'FirstValue':
          filteredMetrics = [_.first(metrics)];
          break;
        case 'ValuesLessThan':
        case 'ValuesMoreThan':
      }
      // filtrer reference par Liste (first, last, all)
      switch (refListValues) {
        case 'AllValues':
        case 'UniqueValues':
        case 'LastValue':
          filteredRefMetrics = [_.last(metrics)];
          break;
        case 'FirstValue':
          filteredRefMetrics = [_.first(metrics)];
          break;
        case 'ValuesLessThan':
        case 'ValuesMoreThan':
      }

      // filtrer par where
      if (kpi.whereField) {
        filteredMetrics = _.filter(filteredMetrics, function(metric) {
          return metric[kpi.whereField] === kpi.whereValues;
        })
      }

      // filtrer par valeur
      filteredMetrics = _.filter(filteredMetrics, function(metric) {
        var metricFieldValue = (typeof metric[field] === 'undefined' || metric[field].length === 0) ? 'null' : metric[field];
        return (typeof values === 'undefined' || values.length === 0 || typeof metric[field] === 'undefined') ? 1 : _.contains(values, metricFieldValue);
      });
      filteredRefMetrics = (refField.toLowerCase() === 'constant') ? refValues : _.filter(filteredRefMetrics, function(metric) {
        return (typeof refValues === 'undefined' || refValues.length === 0 || typeof metric[refField] === 'undefined') ? 1 : _.contains(refValues, metric[refField]);
      });


      // Réaliser des calculs
      switch (action) {
        case 'count':
          calculMain = filteredMetrics.length;
          calculRef = (refField.toLowerCase() === 'constant') ? metrics.length : filteredRefMetrics.length;
          break;
        case 'comparedate':
          var dateValue = _.pluck(filteredMetrics, field);
          var dateRefValue = _.pluck(filteredRefMetrics, refField)[0];

          calculMain = new Date(dateValue);
          calculRef = new Date(dateRefValue);
          break;
        case 'mean':
          var arrayValues = _.compact(_.pluck(filteredMetrics, field).map(Number));
          if (arrayValues.length) {
            calculMain = math.mean(arrayValues)
          }
          var arrayRefValues = _.compact(_.pluck(filteredRefMetrics, refField).map(Number));

          if (arrayRefValues.length) {
            calculRef = math.mean(arrayRefValues)
          } else {
            if (refField.toLowerCase() === 'constant') {
              calculRef = parseInt(refValues)
            }
          }
          break;
      }
      switch (kpi.category) {
        case 'Goal':
          calcul = parseInt((calculMain / calculRef) * 100);
          break;
        case 'Alert':
          calcul = (calculMain - calculRef > 0) ? 1 : 0;
          break;
      }
    }
    return calcul;

  }
};
