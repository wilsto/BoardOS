/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

 'use strict';
 var _ = require('lodash');

function giveMeMyColor (value) {
        switch (value) {
            //status
            case 'Finished' : return '#859900';break;
            case 'In Progress' : return '#337ab7';break;

            //progreStatus
            case 'On time' : return '#859900';break;
            case 'At Risk' : return '#FFC942';break;
            case 'Late' : return '#CB4B16';break;
            default: return '#cccccc';
        };
}

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
                                    "values":[mKPI.percentObjectif],
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

                _.forEach(mKPI.metricsGroupBy, function(item, key) {
                    mySeries.push( {
                        "text":key,
                        "values":_.pluck(item,'count'),
                        "background-color":giveMeMyColor(key),
                        "alpha":"0.7",
                        "description":"<= Scheduled deadline"
                    })
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
                        "visible":true
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

                console.log('mKPI.metricsGroupByTask',mKPI.metricsGroupByTask)
                _.forEach(mKPI.metricsGroupByTask, function(item, key) {
                    mySeries.push( item)
                });
                console.log('mySeries',mySeries)

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
                                "placement":"bottom"
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
    groupByMonth: function(metrics, fieldDate, field) {
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        var dateResult = [];
        var i;
        var yourDate = new Date();
        for (i=0;i<12;i++){
            dateResult.push(new Date(yourDate.getFullYear(), yourDate.getMonth() - i, 1));
        }

        var map_result = _.map(dateResult, function (item) {
          var d = new Date(new Number(new Date(item)));
          var month = d.getFullYear()  + ", " +  monthNames[d.getMonth()];
          return {
              "label": month,
              "count": null
              //,
              //"sum": null,
              //"mean":null
            };
        });

        map_result.reverse() // par ordre croissant
        var myGroup = {};

        _.forEach(metrics, function (item) {
            var d = new Date(new Number(new Date(item[fieldDate])));
            var month = d.getFullYear()  + ", " +  monthNames[d.getMonth()];

            if (typeof myGroup[item[field]] === 'undefined') {
                myGroup[item[field]] = _.clone(map_result,true);           
            }

            _.forEach(myGroup[item[field]], function (itemMap) {
                if (itemMap.label === month) {
                    itemMap.count += 1;
                }
            });
        });

        return myGroup;
    },
    groupByTask: function(metrics, tasks, field) {

        console.log(metrics)
        console.log(tasks)
        console.log(field)
        var myGroup = {};
        _.forEach(tasks, function (item) {
            console.log(item.name)
            if (typeof myGroup[item.name] === 'undefined') {
                myGroup[item.name] = {
                     "values":[
                                  [3,9,40]
                      ],
                    "text":item.name,
                    "marker":{
                        "background-color":"#859900",
                        "alpha":"0.6"
                    }
                };
            }
        })
        console.log(myGroup)
        return myGroup;
    }
};

