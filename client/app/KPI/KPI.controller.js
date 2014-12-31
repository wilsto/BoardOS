/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
.controller('KPICtrl', function ($scope,$rootScope, Auth, $http, ngToast,actionKPI,categoryKPI,groupByKPI,metricTaskFields, $stateParams, calLibrary) {

  $scope.actionKPI = actionKPI;
  $scope.categoryKPI = categoryKPI;
  $scope.groupByKPI = groupByKPI;
  $scope.metricTaskFields = metricTaskFields;

  $scope.load = function() {
    $http.get('/api/KPIs/'+$stateParams.id, {params:{activity: $rootScope.perimeter.activity, context: $rootScope.perimeter.context}}).success(function(KPI) {
      $scope.KPI = KPI;

      //$scope.KPIByMonth = calLibrary.getByMonth($scope.KPI.metricValues, 'date', 'value');
      //$scope.KPIRefByMonth = calLibrary.getByMonth($scope.KPI.refMetricValues, 'date', 'value');
      
      //$scope.data = calLibrary.getSumCumul($scope.KPI.refMetricValues, $scope.KPI.metricValues);

var myChart0=
{
"graphset":[
    {
    "type":"hbullet",
    "title":{
            "text":"KPI Now (Base 100)",
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
            "values":[80],
            "background-color":"#859900",
            "alpha":"0.6",
            "goals":[100]
        }
    ]
    }
]
};

var myChart1={
"graphset":[
    {
        "type":"bar",
        "height":"100%",
        "width":"100%",
        "background-color":"#ffffff",
        "border-radius":4,
        "title":{
            "text":"KPI History",
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
                "border-width":0
            },
            "tooltip":{
                "text":"%plot-description"
            }
        },
        "crosshair-x":{},
        "tooltip":{
  "visible":"false"
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
            "values":["-12","-11","-10","-9","-8","-7","-6","-5","-4","-3","-2","-1","Now"],
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
        "series":[
            {
                "text":"On Time",
                "values":[null,null,null,3,2,7,11,8,20,10,5,5,4],
                "background-color":"#859900",
                "alpha":"0.7",
                "description":"> 5 Miles / Hour",
                "hover-state":{
                    "background-color":"#859900"
                }
            },
            {
                "text":"At Risk",
                "background-color":"#FABE28",
                                "alpha":"0.7",
                "description":"< 3 Miles / Hour",
                "hover-state":{
                    "background-color":"#FFC942"
                },
                "values":[null,null,null,7,2,4,6,5,1,1,5,1,2]
            },
            {
                "text":"Late",
                "values":[null,null,null,3,5,4,1,4,1,1,5,1,0],
                "background-color":"#CB4B16",
                "alpha":"0.7",
                "description":"> 3 Miles / Hour < 5 Miles / Hour",
                "hover-state":{
                    "background-color":"#CB4B16"
                }
            }
        ]
    }
]
};

var myChart2=
{
"graphset":[
    {
        "type":"bubble",
        "plotarea":{
            "background-color":"transparent",
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
        "series":[
            {
                "values":[
                  [2,40,22]
                ],
                "text":"Define needs",
                "marker":{
                    "background-color":"#FF9619 #FF9619",
                    "alpha":"0.6"
                }
            },
            {
                "values":[
                  [1,30,18]
                ],
                "text":"Portal",
                "marker":{
                    "background-color":"#CB4B16  #CB4B16",
                    "alpha":"0.6"
                }
            },
            {
                "values":[
                  [1,10,8]
                ],
                "text":"Dashboard",
                "marker":{
                    "background-color":"#CB4B16  #CB4B16",
                    "alpha":"0.6"
                }
            },
            {
                "values":[
                  [3,9,40]
                ],
                "text":"Define cartography",
                "marker":{
                    "background-color":"#859900 #859900",
                    "alpha":"0.6"
                }
            }

        ]
    }
]
};

 zingchart.render({
        id:"myChartDiv0",
        data:$scope.KPI.graphs[0],
        height:100,
        width:"100%"
    });

 zingchart.render({
        id:"myChartDiv1",
        data:myChart1,
        height:300,
        width:"100%"
    });

 zingchart.render({
        id:"myChartDiv2",
        data:myChart2,
        height:400,
        width:"100%"
    });

    });
};

$scope.save = function() {

  //clean KPI
  $scope.KPI.activity = ($scope.KPI.originalActivity === '') ? '' : $scope.KPI.activity;
  $scope.KPI.context = ($scope.KPI.originalContext === '') ? '' : $scope.KPI.context;
  delete $scope.KPI.__v;
  delete $scope.KPI.originalActivity;
  delete $scope.KPI.originalContext;
  delete $scope.KPI.dashboards;
  delete $scope.KPI.metrics;
  delete $scope.KPI.tasks;
  delete $scope.KPI.kpis;
  delete $scope.KPI.categories;
  delete $scope.KPI.metricValues;
  delete $scope.KPI.metricValuesCal;
  delete $scope.KPI.percentObjectif;
  delete $scope.KPI.refMetricValues;
  delete $scope.KPI.refMetricValuesCal;

  $scope.KPI.actor = $rootScope.currentUser.name;
  $scope.KPI.date = Date.now();

  if (typeof $scope.KPI._id === 'undefined') {
    $http.post('/api/KPIs', $scope.KPI);
    ngToast.create('KPI "' + $scope.KPI.name + '" was created');
  } else {
    $http.put('/api/KPIs/'+ $scope.KPI._id , $scope.KPI);
    ngToast.create('KPI "' + $scope.KPI.name + '" was updated');
  }
  $scope.load();
};

$scope.edit = function(KPI) {
  $scope.KPI = {};
  $scope.KPI = KPI;
  $scope.config = {tab1: false, tab2: true};
};

$scope.reset = function() {
  $scope.KPI = {};
};

$scope.delete = function(KPI,index) {
  bootbox.confirm('Are you sure?', function(result) {
    if (result) {
      $http.delete('/api/KPIs/' + KPI._id).success(function () {
        $scope.KPIs.splice(index, 1);
        ngToast.create('KPI "' + KPI.name + '" was deleted');
      });
    }
  }); 
}; 

$scope.load();

});
