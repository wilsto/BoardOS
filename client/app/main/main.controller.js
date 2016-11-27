'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function($scope, $http, myLibrary, Auth) {

    $scope.Math = window.Math;
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;

      $scope.loadKPIs();
      $scope.loadTasks();
      $scope.loadMetrics();
      $scope.loadDashBoards();
    });


    $scope.loadKPIs = function() {
      $http.get('/api/KPIs/list').success(function(KPIs) {
        $scope.KPIs = KPIs;
        $scope.dataKPIs = [{
          values: []
        }];
        $scope.predataKPIs = myLibrary.getByMonth(KPIs, 'date', 'value');
        $scope.dataKPIs[0].values = $scope.predataKPIs;
      });
    };

    $scope.loadTasks = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id
        }
      };

      $http.get('/api/taskCompletes/', myparams).success(function(tasks) {
        $scope.tasksToNotify = _.filter(tasks, function(task) {
          if (typeof task.lastmetric === 'undefined' || task.lastmetric.status === 'In Progress' || task.lastmetric.status === 'Not Started') {
            return true;
          }
        });
      });

      $http.get('/api/tasks/countByMonth').success(function(tasks) {
        $scope.dataTasks = [{
          values: []
        }];
        $scope.tasksNb = tasks.reduce(function(pv, cv) {
          return pv + cv.value;
        }, 0);
        $scope.dataTasks[0].values = myLibrary.displayLastYear(tasks, '_id', 'value', true);
      });
    };

    $scope.loadMetrics = function() {

      $http.get('/api/metrics/countByMonth').success(function(metrics) {
        $scope.dataMetrics = [{
          values: []
        }];
        $scope.dataConfidence = [{
          values: []
        }];
        $scope.metricsNb = metrics.reduce(function(pv, cv) {
          return pv + cv.value.count;
        }, 0);

        _.each(metrics, function(metric) {
          metric.count = metric.value.count;
          metric.trust = parseInt(metric.value.trust / metric.value.count);
        });
        $scope.dataMetrics[0].values = myLibrary.displayLastYear(metrics, '_id', 'count', true);
        $scope.dataConfidence[0].values = myLibrary.displayLastYear(metrics, '_id', 'trust', true);
        $scope.confidenceMean = _.last($scope.dataConfidence[0].values).count;
      });
    };

    $scope.loadDashBoards = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id,
          quick: true
        }
      };
      $http.get('/api/dashboardCompletes/', myparams).success(function(dashboards) {
        $scope.dashboards = dashboards;
      });
    };

    $scope.goalColor = function(value) {
      return {
        color: myLibrary.giveMeMyColor(value)
      };
    };
    $scope.goalBgColor = function(value) {
      return {
        background: myLibrary.giveMeMyColor(value)
      };
    };
    $scope.alertColor = function(value) {
      return {
        color: myLibrary.giveMeMyColor(value, 'Alert')
      };
    };

    $scope.options = {
      chart: {
        type: 'discreteBarChart',
        height: 40,
        margin: {
          top: 0,
          right: 0,
          bottom: 2,
          left: 0
        },
        showYAxis: false,
        color: [
          '#1f77b4'
        ],
        x: function(d) {
          return d.label;
        },
        y: function(d) {
          return d.count;
        },
        showValues: false,
        transitionDuration: 500
      }
    };

    $scope.optionsTasks = angular.copy($scope.options);
    $scope.optionsTasks.chart.color = ['#9467bd'];

    $scope.optionsMetrics = angular.copy($scope.options);
    $scope.optionsMetrics.chart.color = ['#87CEEB'];

    $scope.optionsAlerts = angular.copy($scope.options);
    $scope.optionsAlerts.chart.color = ['#CB4B16'];
    $scope.optionsAlerts.chart.y = function(d) {
      return d.sum;
    };

    $scope.optionsGoals = angular.copy($scope.options);
    $scope.optionsGoals.chart.color = function(d) {
      return myLibrary.giveMeMyColor(d.mean);
    };
    $scope.optionsGoals.chart.y = function(d) {
      return d.mean;
    };
    $scope.optionsConfidence = angular.copy($scope.options);
    $scope.optionsConfidence.chart.color = ['#bcbd22'];

  });
