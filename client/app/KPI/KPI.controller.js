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

      $scope.KPIByMonth = calLibrary.getByMonth($scope.KPI.metricValues, 'date', 'value');
      $scope.KPIRefByMonth = calLibrary.getByMonth($scope.KPI.refMetricValues, 'date', 'value');
      
      $scope.options = {
        chart: {
          type: 'scatterChart',
          width: 350,
          height: 250,
          margin : {
            top: 20,
            right: 20,
            bottom: 20,
            left: 65
          },
          showLabels: true,
          transitionDuration: 500,
          useInteractiveGuideline: true,
          x: function(d){return d.x;},
          y: function(d){return d.y;},
          xAxis: {
            axisLabel: 'Dates',
            tickFormat: function(d) {
              return "On time";
            },
            showMaxMin: true,
            staggerLabels: true
          },

          yAxis: {
            axisLabel: 'Confidence in futur',
            showMaxMin: true,
                        tickFormat: function(d) {
              return "High";
            },
            staggerLabels: true,
            axisLabelDistance: 20
          }
        }
      };

      $scope.data = calLibrary.getSumCumul($scope.KPI.refMetricValues, $scope.KPI.metricValues);

      $scope.optionsGoal = {
        chart: {
          type: 'bulletChart',
          height: 70,
          transitionDuration: 500
        }
      };

      $scope.dataGoal = {
        "title":$scope.KPI.name,
        "ranges": [33,66,100],
        "measures": [$scope.KPI.percentObjectif.replace('%','')],
        "markers": [80]
      }


      $scope.optionsDonut = {
        chart: {
          type: 'pieChart',
          height: 250,
          donut: true,
          x: function(d){return d.key;},
          y: function(d){return d.y;},
          showLabels: true,
          pie: {
            startAngle: function(d) { return d.startAngle/2 -Math.PI/2 ;},
            endAngle: function(d) { return d.endAngle/2 -Math.PI/2 ;}
          },
          transitionDuration: 500,
          legend: {
            margin: {
              top: 5,
              right: 5,
              bottom: 5,
              left: 0
            }
          }
        }
      };

      $scope.dataDonut = [
      {
        key: 'Late',
        y: 2
      },
      {
        key: 'On time',
        y: 3
      }
      ];

      $scope.dataScatter = [
          {"key":"Ontime + High Confidence",
              "values":[{"x":0.8,"y":80,"size":20},{"x":0.8,"y":92,"size":20}]
          },
         {"key":"On time + Low Confidence",
            "values":[{"x":0.7,"y":20,"size":20},{"x":0.9,"y":30,"size":20}]
          },
         {"key":"Late + High Confidence",
             "values":[{"x":-0.8,"y":0,"size":8},{"x":-0.4,"y":23,"size":15}]
        },
          {"key":"Late + Low Confidence",
            "values":[{"x":-0.5,"y":50,"size":10},{"x":-0.7,"y":26,"size":35}]
         }
     ];


var myChart=
{
"graphset":[
    {
        "type":"bubble",
        "plotarea":{
            "background-color":"#fff",
            "alpha":0.9,
            "margin":"50px 40px 50px 50px"
        },
        "scale-y":{
            "label":{
                "text":"Confidence in futur"
            },
            "values":"0:100:20",
            "line-color":"#aaadb3",
            "shadow":0,
            "tick":{
                "line-color":"#aaadb3"
            },
            "minor-ticks":1,
            "minor-tick":{
                "visible":false,
                "line-color":"#aaadb3",
                "shadow":0
            },
            "guide":{
                "line-color":"#aaadb3",
                "alpha":0.3,
                "line-style":"solid"
            },
            "minor-guide":{
                "line-color":"#aaadb3",
                "alpha":0.2,
                "line-style":"dashed"
            },
            "item":{
                "padding-right":"5px",
                "font-family":"Arial",
                "font-size":"11px",
                "font-color":"#676b72"
            }
        },
        "scale-x":{
            "labels":["Late","At Risk","On Time"],
            "label":{
                "text":"Deliveries"
            },
            "line-color":"#aaadb3",
            "shadow":0,
            "tick":{
                "line-color":"#aaadb3"
            },
            "minor-ticks":1,
            "minor-tick":{
                "visible":false,
                "line-color":"#aaadb3",
                "shadow":0
            },
            "guide":{
                "line-color":"#aaadb3",
                "alpha":0.3,
                "line-style":"solid"
            },
            "minor-guide":{
                "line-color":"#aaadb3",
                "alpha":0.2,
                "line-style":"dashed"
            },
            "item":{
                "padding-top":"5px",
                "font-family":"Arial",
                "font-size":"11px",
                "font-color":"#676b72"
            }
        },
        "plot":{
            "size-factor":3,
            "value-box":{
                "type":"all",
                "text":"%t",
                "font-color":"#000"
            }
        },
        "series":[
            {
                "values":[
                [1,100,8],
                [2,40,2],
                [3,70,1]
                ],
                "text":"Define cartography",
                "marker":{
                    "background-color":"#1F77B4    #1F77B4",
                    "border-width":"1px",
                    "border-color":"#4682B4   ",
                    "fill-type":"linear",
                    "shadow":true,
                    "shadow-distance":"2px",
                    "shadow-blur":0,
                    "shadow-angle":90,
                    "shadow-color":"#000000",
                    "shadow-alpha":0.1
                },
                "hover-marker":{
                    "background-color":"#1F77B4 #1F77B4",
                    "border-color":"#4682B4   "
                },
                "tooltip":{
                    "shadow":true,
                    "background-color":"#1F77B4",
                    "border-radius":"8px",
                    "padding":"5px 10px",
                    "shadow-distance":"2px",
                    "shadow-blur":0,
                    "shadow-angle":90,
                    "shadow-color":"#000000",
                    "shadow-alpha":0.1
                }
            }
        ]
    }
]
};

 zingchart.render({
        id:"myChartDiv",
        data:myChart,
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
