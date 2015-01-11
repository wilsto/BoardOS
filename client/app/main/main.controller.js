'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function ($scope, $http, calLibrary) {

    $scope.Math = window.Math;
    
    $scope.loadDashBoard = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
      $scope.dashboards = dashboards.list;
      $scope.dataDashboards = dashboards;

      $scope.dataKPIs = [{values: [] }];
      $scope.dataTasks = [{values: [] }];
      $scope.dataMetrics = [{values: [] }];
      $scope.dataGoals = [{values: [] }];

      $scope.predataKPIs = calLibrary.getByMonth(dashboards.kpis, 'date','value');
      $scope.predataTasks = calLibrary.getByMonth(dashboards.tasks, 'date','value');
      $scope.predataMetrics = calLibrary.getByMonth(dashboards.metrics, 'date','value');

     var dataGoals = [];
      _.forEach(dashboards.kpis, function(kpi, key) {
         if (kpi.category ==='Goal')  {dataGoals.push(_.pluck(calLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI'),'value'))};
      });

      $scope.dataKPIs[0].values = $scope.predataKPIs;
      $scope.dataTasks[0].values = $scope.predataTasks;
      $scope.dataMetrics[0].values = $scope.predataMetrics;
      $scope.dataGoals[0].values = calLibrary.getCalculByMonth(dataGoals);     
        
      });
    };

    $scope.loadLog = function() {
      $http.get('/api/logs').success(function(logs) {
        $scope.logs = logs;
      });
    };

    $scope.loadDashBoard();
    $scope.loadLog();


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
  $scope.optionsMetrics.chart.color =  ['#87CEEB'];

  $scope.optionsAlerts = angular.copy($scope.options);
  $scope.optionsAlerts.chart.color =  ['#d62728'];

  $scope.optionsGoals = angular.copy($scope.options);
  $scope.optionsGoals.chart.color =  function(d){  return  calLibrary.giveMeMyColor(d.count); };

  $scope.optionsTrust = angular.copy($scope.options);
  $scope.optionsTrust.chart.color =  ['#bcbd22'];

  });
