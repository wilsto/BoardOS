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
    "plotarea":{
        "background-color":"transparent",
        "margin":"0px 20px 20px 20px"
    },    
    "plot":{
         "goal":{
            "background-color":"#859900",
            "border-width":0
         }
    },
    "series":[
        {
            "values":[80],
            "background-color":"#169ef4",
            "goals":[100]
        }
    ]
    }
]
};

var myChart1={
"graphset":[
    {
        "type":"pie",
        "height":"50%",
        "width":"100%",
        "background-color":"transparent",
        "value-box":{
            "visible":true
        },
        "plot":{
            "slice":50,
            "ref-angle":270,
            "detach":true,
            "hover-state":{
                "visible":false
            },
            "value-box":{
                "visible":true,
                "type":"first",
                "connected":false,
                "placement":"in",
                "text":"%v",
                "rules":[
                    {
                        "rule":"%v < 50",
                        "visible":false
                    }
                ],
                "font-color":"#000000",
                "font-size":"20px",
                "font-family":"arial",
                "offset-x":"-30%",
                "offset-y":"-50%"
            },
            "tooltip":{
                "rules":[
                    {
                        "rule":"%i == 0",
                        "text":"%v %t Completed",
                        "shadow":false,
                        "border-radius":4
                    },
                    {
                        "rule":"%i == 1",
                        "text":"%v Remaining",
                        "shadow":false,
                        "border-radius":4
                    }
                ]
            },
            "animation":{
                "delay":0,
                "effect":2,
                "speed":"600",
                "method":"0",
                "sequence":"1"
            }
        },
        "series":[
            {
                "values":[52],
                "text":"Steps",
                "background-color":"#169ef4",
                "border-width":"0px",
                "shadow":0
            },
            {
                "values":[11],
                "background-color":"#dadada",
                "alpha":"0.5",
                "border-color":"#dadada",
                "border-width":"1px",
                "shadow":0
            }
        ]
    },
    {
        "type":"bar",
        "height":"50%",
        "width":"94%",
        "x":"3%",
        "y":"53%",
        "background-color":"#ffffff",
        "border-radius":4,
        "title":{
            "text":"Step Tracker",
            "text-align":"left",
            "font-size":"13px",
            "font-color":"#000000",
            "font-family":"Arial",
            "background-color":"none",
            "offset-x":"10%",
            "offset-y":"10%"
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
        "tooltip":{
            "text":"%t<br><strong>%v</strong>",
            "font-family":"arial",
            "font-weight":"normal",
            "font-size":"12px",
            "border-radius":4,
            "shadow":false,
            "callout":true,
            "padding":"5 10"
        },
        "plot":{
            "background-color":"#000000",
            "animation":{
                "effect":"4"
            }
        },
        "plotarea":{
            "margin":"35% 3.5% 20% 7.5%"
        },
        "scale-x":{
            "values":["12AM","2AM","4AM","6AM","8AM","10AM","<strong>NOON</strong>","2PM","4PM","6PM","8PM","10PM","12AM"],
            "line-color":"#adadad",
            "line-width":"1px",
            "item":{
                "font-size":"10px",
                "font-family":"arial",
                "offset-y":"-2%"
            },
            "guide":{
                "visible":false
            },
            "tick":{
                "visible":false
            }
        },
        "scale-y":{
            "values":"0:300:100",
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
                "text":"Light",
                "background-color":"#FABE28",
                "description":"< 3 Miles / Hour",
                "hover-state":{
                    "background-color":"#FFC942"
                },
                "values":[null,null,null,170,220,240,260,250,20,10,5]
            },
            {
                "text":"Moderate",
                "values":[null,null,null,30,50,40,104,34,8,15,5,0],
                "background-color":"#FF8A00",
                "description":"> 3 Miles / Hour < 5 Miles / Hour",
                "hover-state":{
                    "background-color":"#FF9619"
                }
            },
            {
                "text":"Intense",
                "values":[null,null,null,33,22,17,11,8,200,100,50],
                "background-color":"#88C100",
                "description":"> 5 Miles / Hour",
                "hover-state":{
                    "background-color":"#91CE00"
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
                    "background-color":"#B58900 #B58900",
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
        data:myChart0,
        height:100,
        width:"100%"
    });

 zingchart.render({
        id:"myChartDiv1",
        data:myChart1,
        height:400,
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
