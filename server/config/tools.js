/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

 'use strict';
var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');

var Hierarchies = require('../api/hierarchy/hierarchy.model');
var events = require('events');
var hierarchyEmitter = new events.EventEmitter();

function groupByMulti (obj, values, context) {
    if (!values.length)
        return obj;
    var byFirst = _.groupBy(obj, values[0], context),
        rest = values.slice(1);
    for (var prop in byFirst) {
        byFirst[prop] = groupByMulti(byFirst[prop], rest, context);
    }
    return byFirst;
};

 module.exports = {
    giveMeMyColor: function (value) {
        return giveMeMyColor(value);
    },
    buildChart: function (mKPI, KPIType) {
        switch  (KPIType) {
            case 'hBullet' :
            var myChart=
                {
                  "graphset":
                    [
                        {
                        "type":"hbullet",
                        "title":
                            {
                              "text":"KPI This " + mKPI.groupTimeBy+ " (Base 100)",
                              "text-align":"left",
                              "font-size":"13px",
                              "font-color":"#000000",
                              "font-family":"Arial",
                              "background-color":"none"
                            },
                          "plotarea":
                            {
                              "background-color":"none",
                              "margin":"35px 20px 20px 20px"
                            },    
                          "plot":
                            {
                             "goal":
                                {
                                    "background-color":"#169ef4", // blue if goal
                                    "border-width":0
                                }
                            },
                            "series":
                            [
                                {
                                    "values":[_.last(mKPI.calcul.time).valueKPI],
                                    "background-color":"#859900",
                                    "alpha":"0.6",
                                    "goals":[100]
                                }
                            ]
                        }
                    ]
                };
              break;
              case 'Bar' :
                var mySeries = [];
                _.forEach(mKPI.metricsGroupBy.oldTime, function(item, key) {
                    mySeries.push( {
                        "text":key,
                        "values":_.pluck(item,'count'),
                        "background-color":_.compact(_.uniq(_.pluck(item,'color'))),
                        "alpha":"0.7",
                        "description":"<= Scheduled deadline"
                    })
                    var myLabels = _.pluck(item,'label');
                });

              var myChart={
                "graphset":[
                {
                    "type":"bar",
                    "height":"100%",
                    "width":"100%",
                    "background-color":"#ffffff",
                    "border-radius":4,
                    "title":{
                        "text":"Metrics History",
                        "text-align":"left",
                        "font-size":"13px",
                        "font-color":"#000000",
                        "font-family":"Arial",
                        "background-color":"none"        
                    },
                    "legend":{
                        "toggle-action":"remove",
                        "layout":"x3",
                        "x":"52.5%",
                        "shadow":false,
                        "border-color":"none",
                        "background-color":"none",
                        "item":{
                            "font-color":"#000000"
                        },
                        "marker":{
                            "type":"circle",
                            "alpha":"0.6",
                            "border-width":0
                        },
                        "tooltip":{
                            "text":"%plot-description",
                            "visible":true
                        }
                    },
                    "crosshair-x":{},
                    "tooltip":{
                        "visible":true,
                    },
                    "plot":{
                        "stacked":true,
                        "background-color":"#000000",
                        "animation":{
                            "effect":"4"
                        }
                    },
                    "plotarea":{

                    },
                    "scale-x":{
                        "values":["-11","-10","-9","-8","-7","-6","-5","-4","-3","-2","-1","Now"],
                        "line-color":"#adadad",
                        "line-width":"1px",
                        "item":{
                            "font-size":"10px",
                            "font-family":"arial",
                            "offset-y":"-2%"
                        },
                        "guide":{
                            "visible":true
                        },
                        "tick":{
                            "visible":false
                        }
                    },
                    "scale-y":{
                        "line-color":"none",
                        "item":{
                            "font-size":"10px",
                            "font-family":"arial",
                            "offset-x":"2%"
                        },
                        "guide":{
                            "line-style":"solid",
                            "line-color":"#adadad"
                        },
                        "tick":{
                            "visible":false
                        }
                    },
                    "series": mySeries

                }
                ]
            };
            break;
            case 'Bubble' :
            var mySeries = [];
                _.forEach(mKPI.metricsGroupBy.TaskTime, function(item, key) { // pour chaque tache
                    var lastMonth = _.chain(item).pairs().sortBy(function(item) { return item[0]; }).last().value(); // on prend le derniere mois avec une mesure
                    var lastMetric = _.chain(lastMonth[1]).sortBy('date').last().value();
                    
                    if (lastMetric.status !== 'Finished') {// not finished
                        mySeries.push( {
                             "values":[
                                          [lastMetric.value, lastMetric.daysToDeadline, lastMetric.load]
                              ],
                            "text":lastMetric.taskname || 'No task',
                            "marker":{
                                "background-color":lastMetric.color,
                                "alpha":"0.6"
                            }
                        } );
                    }
                });

            var myChart=
                {
                "graphset":[
                    {
                        "type":"bubble",
                        "plotarea":{
                            "background-color":"none",
                            "margin":"0px 0px 50px 50px"
                        },
                        "scale-y":{
                            "label":{
                                "text":"Delivery Deadline (days)"
                            }
                        },
                        "scale-x":{
                            "labels":["Late","At Risk","On Time"],
                            "label":{
                                "text":"Vs scheduled"
                            },
                            "values":"1:3:1"
                        },
                        "plot":{
                            "size-factor":3,
                            "value-box":{
                                "type":"all",
                                "text":"%t",
                                "placement":"right"
                            }
                        },
                        "series":mySeries
                    }
                ]
                };
    } // fin switch
    return myChart;

    },
    buildHierarchy: function (arry, type) {

        var roots = [], children = {}, list = [];

        // find the top level nodes and hash the children based on parent
        for (var i = 0, len = arry.length; i < len; ++i) {
            var item = arry[i];
            var p = item.parent;
            var target = (p == '#') ? roots : (children[p] || (children[p] = []));
            item.longname = item.text;
            target.push({ value: item });
        }

        // function to recursively build the tree
        var findChildren = function(parent,longname) {
            if (children[parent.value.id]) {
                parent.children = children[parent.value.id];
                for (var i = 0, len = parent.children.length; i < len; ++i) {
                    parent.children[i].value.longname = parent.value.longname+'.'+parent.children[i].value.text;
                    list.push({text:parent.children[i].value.text, longName:parent.children[i].value.longname,id:parent.children[i].value.id});
                    findChildren(parent.children[i],parent.value.longname);
                }
            }
        };

        // enumerate through to handle the case where there are multiple roots
        for (var i = 0, len = roots.length; i < len; ++i) {
            list.push({text:roots[i].value.longname,id:roots[i].value.id});
            findChildren(roots[i]);
        }
        if (type='list') {return list};
        if (type='Treeview') {return roots};        
    },
    groupByTime: function(metrics, fieldDate, field) {


        var dateResult = [];
        var i;
        var yourDate = new Date();
        for (i=0;i<12;i++){
            dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
        }

        var map_result = _.map(dateResult, function (item) {
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

        _.forEach(metrics, function (task,key) { 
            var month = key;
            _.forEach(task, function (metrics,key) {// pour chaque tache

                var metric = _.chain(metrics).sortBy('date').last().value(); // prendre la dernière metric

                if (typeof myGroup[metric[field]] === 'undefined') {
                    myGroup[metric[field]] = _.clone(map_result,true);           
                }

                _.forEach(myGroup[metric[field]], function (itemMap) {
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
        var sortMetrics = _.sortBy(metrics, fields[0]);// on trie
        var groupMetrics = groupByMulti(sortMetrics,fields)   // on groupe
        return groupMetrics;
    },
    calculKPI: function(metrics, kpi) {

        var calcul, calculMain, calculRef;
        var action = kpi.action;
        var values = kpi.metricTaskValues && kpi.metricTaskValues.split(' + ');
        var refValues = kpi.refMetricTaskValues && kpi.refMetricTaskValues.split(' + ');
        var field = kpi.metricTaskField;
        var refField = kpi.refMetricTaskField;

        var filteredMetrics = _.filter(metrics,function (metric) {return (typeof values === 'undefined')? 1 : _.contains(values,metric[field]);});
        var filteredRefMetrics = (refField === 'constant') ? refValues :_.filter(metrics,function (metric) {return _.contains(refValues,metric[refField]);});

/*        console.log('kpi',kpi)
        console.log('field',field)
        console.log('values',values)
        console.log('filteredMetrics',filteredMetrics)
        console.log('filteredRefMetrics',filteredRefMetrics)*/

console.log('metrics',metrics);
        // Réaliser des calculs
        switch(action) {
          case 'count':
            calculMain = filteredMetrics.length;
            calculRef =  (refField === 'constant') ? metrics.length : filteredRefMetrics.length;
            break;                             
          case 'mean':       
            calculMain = math.mean(_.pluck(filteredMetrics,field).map(Number));
            calculRef = 100;
            break;        
        }
        //console.log( calculMain)

        calcul = parseInt((calculMain / calculRef) *100);

        return calcul;
    }
};

