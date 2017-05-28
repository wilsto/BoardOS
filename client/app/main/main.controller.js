'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function($scope, $rootScope, $http, myLibrary, Auth, $timeout, dateRangeService) {

    $scope.Math = window.Math;
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;
      $scope.loadTasks();
      $scope.loadDashBoards();
    });

    $scope.$on('dateRangeService:updated', function(event, data) {
      $scope.datediff = 7;
      if (data) {
        switch (data) {
          case 'Last 7 Days':
            dateRangeService.rangeDate = 'last7';
            $scope.datediff = 7;
            break;
          case 'Last 14 Days':
            dateRangeService.rangeDate = 'last14';
            $scope.datediff = 14;
            break;
          case 'Last 30 Days':
            dateRangeService.rangeDate = 'last30';
            $scope.datediff = 30;
            break;
          case 'Last 90 Days':
            dateRangeService.rangeDate = 'last90';
            $scope.datediff = 90;
            break;
          case 'Last 180 Days':
            dateRangeService.rangeDate = 'last180';
            $scope.datediff = 180;
            break;
          case 'Last 365 Days':
            dateRangeService.rangeDate = 'last365';
            $scope.datediff = 365;
            break;
          case 'All':
            dateRangeService.rangeDate = 'task';
            $scope.datediff = 5000;
            break;
        }
      }
      $scope.rangeDate = dateRangeService.rangeDate;
      $timeout(function() {
        $scope.$apply(function() {
          $scope.filteredPlanTasks = _.filter($scope.myTasks, function(task) {
            return task.metrics[task.metrics.length - 1].status === 'Not Started';
          });
          $scope.filteredInProgressTasks = _.filter($scope.myTasks, function(task) {
            return task.metrics[task.metrics.length - 1].status === 'In Progress';
          });
          $scope.filteredFinishedTasks = _.filter($scope.myTasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === undefined || task.reviewTask === false);
          });
          $scope.filteredReviewedTasks = _.filter($scope.myTasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === true);
          });

        });
      });
    });

    $scope.loadTasks = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id
        }
      };

      $http.get('/api/taskFulls/', myparams).success(function(tasks) {
        $scope.myTasks = tasks;
        $scope.$broadcast('dateRangeService:updated', 'last7');
      });

      $http.get('/api/taskFulls/countByMonth').success(function(tasks) {
        $scope.dataTasks = [{
          values: []
        }];
        $scope.tasksNb = tasks.reduce(function(pv, cv) {
          return pv + cv.value.count;
        }, 0);

        $scope.dataMetrics = [{
          values: []
        }];
        $scope.metricsNb = tasks.reduce(function(pv, cv) {
          return pv + cv.value.qty;
        }, 0);

        $scope.dataTasks[0].values = myLibrary.displayLastYear(tasks, '_id', 'count', true);
        $scope.dataMetrics[0].values = myLibrary.displayLastYear(tasks, '_id', 'qty', true);

      });
    };

    $scope.loadDashBoards = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id,
          quick: true
        }
      };
      // $http.get('/api/dashboardCompletes/', myparams).success(function(dashboards) {
      //   $scope.dashboards = dashboards;
      // });
    };

    $scope.dashboards = $rootScope.dashboards;


    $rootScope.$watch('dashboards', function() {
      $scope.dashboards = $rootScope.dashboards;
    });

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
