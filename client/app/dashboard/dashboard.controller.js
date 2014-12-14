'use strict';

angular.module('boardOsApp')
  .controller('DashboardCtrl', function ($scope, $http, socket, $stateParams) {
    $scope.dashboard = [];

    $http.get('/api/dashboards/'+$stateParams.id).success(function(dashboard) {
      $scope.dashboard = dashboard;
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

$scope.data = [{
    values: [
        { "label" : "May" , "value" : 2 },
        { "label" : "Jun" , "value" : 0 },
        { "label" : "Jul" , "value" : 3 },
        { "label" : "Aug" , "value" : 1 },
        { "label" : "Sep" , "value" : 0 },
        { "label" : "Oct" , "value" : 0 },
        { "label" : "Nov" , "value" : 1 },
        { "label" : "Dec" , "value" : 1 }
        ]
    }];

$scope.optionsTasks = angular.copy($scope.options);
$scope.optionsTasks .chart.color =  ["#9467bd"];

$scope.optionsMetrics = angular.copy($scope.options);
$scope.optionsMetrics.chart.color =  ["#ff7f0e"];

$scope.optionsAlerts = angular.copy($scope.options);
$scope.optionsAlerts.chart.color =  ["#d62728"];

$scope.optionsGoals = angular.copy($scope.options);
$scope.optionsGoals.chart.color =  ["#2ca02c"];

$scope.optionsTrust = angular.copy($scope.options);
$scope.optionsTrust.chart.color =  ["#bcbd22"];

  });
