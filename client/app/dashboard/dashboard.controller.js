'use strict';

angular.module('boardOsApp')
  .controller('DashboardCtrl', function ($scope, $http, socket, $stateParams, calLibrary) {
    $scope.dashboard = [];

    $http.get('/api/dashboards/'+$stateParams.id).success(function(dashboard) {
      $scope.dashboard = dashboard;

$scope.dataKPIs = [{values: [] }];
$scope.dataTasks = [{values: [] }];
$scope.dataMetrics = [{values: [] }];

      $scope.predataKPIs = calLibrary.getCountByMonth($scope.dashboard.kpis, 'date');
      $scope.predataTasks = calLibrary.getCountByMonth($scope.dashboard.tasks, 'date');
      $scope.predataMetrics = calLibrary.getCountByMonth($scope.dashboard.metrics, 'date');

$scope.dataKPIs[0].values = $scope.predataKPIs;
$scope.dataTasks[0].values = $scope.predataTasks;
$scope.dataMetrics[0].values = $scope.predataMetrics;

console.log('KPIByMonth',$scope.KPIByMonth);
console.log('dataKPIByMonth',$scope.data);
console.log(JSON.stringify($scope.data)) 
    });

$scope.options = {
    chart: {
        type: 'discreteBarChart',
        height: 40,
        margin : {
            top: 0,
            right: 0,
            bottom: 2,
            left: 0
        },
        showYAxis : false,
    color: [
      "#1f77b4"
    ],
        x: function(d){ return d.label; },
        y: function(d){ return d.value; },
        showValues: false,
        transitionDuration: 500
    }
};

$scope.optionsTasks = angular.copy($scope.options);
$scope.optionsTasks.chart.color =  ["#9467bd"];

$scope.optionsMetrics = angular.copy($scope.options);
$scope.optionsMetrics.chart.color =  ["#ff7f0e"];

$scope.optionsAlerts = angular.copy($scope.options);
$scope.optionsAlerts.chart.color =  ["#d62728"];

$scope.optionsGoals = angular.copy($scope.options);
$scope.optionsGoals.chart.color =  ["#2ca02c"];

$scope.optionsTrust = angular.copy($scope.options);
$scope.optionsTrust.chart.color =  ["#bcbd22"];

  });
