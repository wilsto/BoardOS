'use strict';

angular.module('boardOsApp')
.controller('DashboardCtrl', function ($scope,  $rootScope, $http, $stateParams, calLibrary, ngToast, $cookieStore) {
  
  $scope.load = function() {
    if ($stateParams.id) {
    $http.get('/api/dashboards/'+$stateParams.id).success(function(dashboard) {
      $scope.dashboard = dashboard;

      $rootScope.perimeter.name = dashboard.name;
      $rootScope.perimeter.id = dashboard._id;
      $rootScope.perimeter.activity = dashboard.activity;
      $rootScope.perimeter.context = dashboard.context;
      $rootScope.perimeter.axis = dashboard.axis;
      $rootScope.perimeter.category = dashboard.category;
      $cookieStore.put('perimeter',$rootScope.perimeter);

      $scope.dataKPIs = [{values: [] }];
      $scope.dataTasks = [{values: [] }];
      $scope.dataMetrics = [{values: [] }];

      $scope.predataKPIs = calLibrary.getByMonth($scope.dashboard.kpis, 'date','value');
      $scope.predataTasks = calLibrary.getByMonth($scope.dashboard.tasks, 'date','value');
      $scope.predataMetrics = calLibrary.getByMonth($scope.dashboard.metrics, 'date','value');

      $scope.dataKPIs[0].values = $scope.predataKPIs;
      $scope.dataTasks[0].values = $scope.predataTasks;
      $scope.dataMetrics[0].values = $scope.predataMetrics;

    });
    } else {
       $scope.dashboard = {name:''};
    }

  };

  $scope.load();

$scope.save = function() {

  delete $scope.dashboard.__v;
  delete $scope.dashboard.kpis;
  delete $scope.dashboard.metrics;
  delete $scope.dashboard.tasks;

console.log($scope.dashboard);
  if (typeof $scope.dashboard._id === 'undefined') {
    $http.post('/api/dashboards', $scope.dashboard);

    var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was created';
    $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
    ngToast.create(logInfo);
  } else {
    $http.put('/api/dashboards/'+ $scope.dashboard._id , $scope.dashboard);

    var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was updated';
    $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
    ngToast.create(logInfo);
  }

  $scope.load();
};


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
      '#1f77b4'
      ],
      x: function(d){ return d.label; },
      y: function(d){ return d.count; },
      showValues: false,
      transitionDuration: 500
    }
  };

  $scope.optionsTasks = angular.copy($scope.options);
  $scope.optionsTasks.chart.color =  ['#9467bd'];

  $scope.optionsMetrics = angular.copy($scope.options);
  $scope.optionsMetrics.chart.color =  ['#ff7f0e'];

  $scope.optionsAlerts = angular.copy($scope.options);
  $scope.optionsAlerts.chart.color =  ['#d62728'];

  $scope.optionsGoals = angular.copy($scope.options);
  $scope.optionsGoals.chart.color =  ['#2ca02c'];

  $scope.optionsTrust = angular.copy($scope.options);
  $scope.optionsTrust.chart.color =  ['#bcbd22'];

});
