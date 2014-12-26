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
          type: 'multiBarChart',
          height: 350,
          margin : {
            top: 20,
            right: 20,
            bottom: 20,
            left: 65
          },
          x: function(d){ return d[0]; },
          y: function(d){ return d[1]; },
          average: function(d) { return d.mean ;},

          transitionDuration: 500,
          useInteractiveGuideline: true,

          xAxis: {
            axisLabel: 'Dates',
            tickFormat: function(d) {
              return d3.time.format('%m/%d/%y')(new Date(d));
            },
            showMaxMin: false,
            staggerLabels: false
          },

          yAxis: {
            axisLabel: $scope.KPI.action,
            showMaxMin: false,
            axisLabelDistance: 20
          }
        }
      };

      $scope.data = calLibrary.getSumCumul($scope.KPI.refMetricValues, $scope.KPI.metricValues);

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
