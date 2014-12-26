'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function ($scope, $http, calLibrary) {
    $scope.loadDashBoard = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
      $scope.dashboards = dashboards.list;
      $scope.dataDashboards = dashboards;

      $scope.dataKPIs = [{values: [] }];
      $scope.dataTasks = [{values: [] }];
      $scope.dataMetrics = [{values: [] }];

      $scope.predataKPIs = calLibrary.getByMonth(dashboards.kpis, 'date','value');
      $scope.predataTasks = calLibrary.getByMonth(dashboards.tasks, 'date','value');
      $scope.predataMetrics = calLibrary.getByMonth(dashboards.metrics, 'date','value');

      $scope.dataKPIs[0].values = $scope.predataKPIs;
      $scope.dataTasks[0].values = $scope.predataTasks;
      $scope.dataMetrics[0].values = $scope.predataMetrics;
        
      });
    };

    $scope.loadDashBoard();


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



      $scope.optionsDonut = {
        chart: {
          type: 'pieChart',
          height: 150,
          donut: true,
          x: function(d){return d.key;},
          y: function(d){return d.y;},
          showLabels: false,
          pie: {
            startAngle: function(d) { return d.startAngle -Math.PI ;},
            endAngle: function(d) { return d.endAngle -Math.PI ;}
          },
          transitionDuration: 500
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
