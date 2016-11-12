'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function($scope, $http, myLibrary, Auth) {

    $scope.Math = window.Math;
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;
      /*            if ($scope.currentUser.role === 'user') {
          $scope.filterNotification = 'Actor view';
      } else {
          $scope.filterNotification = 'Manager view';
      }*/

      $scope.filterNotification = 'Actor view';
      //$scope.loadKPIs();
      $scope.loadTasks();
      // $scope.loadMetrics();
      //$scope.loadTaskToNotify();
      $scope.loadDashBoards();
    });

    //$scope.loadLog();

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
        console.log('$scope.tasksToNotify', $scope.tasksToNotify);
      });

      // $http.get('/api/tasks/countByMonth').success(function(tasks) {
      //   $scope.dataTasks = [{
      //     values: []
      //   }];
      //   $scope.tasksNb = tasks.reduce(function(pv, cv) {
      //     return pv + cv.value;
      //   }, 0);
      //   $scope.dataTasks[0].values = myLibrary.displayLastYear(tasks, '_id', 'value', true);
      // });
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
        console.log('dashboards opt', dashboards);
        $scope.dashboards = dashboards;
      });
    };

    $scope.loadLog = function() {
      $http.get('/api/logs').success(function(logs) {
        $scope.logs = logs;
      });
    };


    $scope.loadTaskToNotify = function() {
      var myparams;
      if ($scope.filterNotification === 'Actor view') {
        myparams = {
          params: {
            userId: $scope.currentUser._id,
            status: 'Open',
          }
        };
      } else {
        if ($scope.filterNotification === 'Manager view') {
          myparams = {
            params: {
              userId: $scope.currentUser._id,
              dashboardFilter: true,
              status: 'Open',
            }
          };
        } else {
          myparams = {
            params: {
              status: 'Open',
            }
          };
        }
      }

      // $http.get('/api/tasks/list', myparams).success(function(tasks) {
      //   $scope.tasksToNotify = tasks;
      // });
    };

    $scope.loadTaskToNotify2 = function() {
      if (typeof $scope.dataDashboards !== 'undefined') {

        var openTasks = _.filter($scope.dataDashboards.tasks, function(task) {
          if (typeof task.lastmetric === 'undefined' || task.lastmetric.status === 'In Progress' || task.lastmetric.status === 'Not Started') {
            return true;
          }
        });
        $scope.alltasksToNotify = openTasks.length;
        $scope.myTasks = $scope.filterTask(openTasks, $scope.filterNotification);

        if ($scope.filterNotification === 'Only For Me') {
          $scope.tasksToNotify = $scope.myTasks;
        } else {
          $scope.tasksToNotify = openTasks;
        }
        $scope.mytasksToNotify = $scope.myTasks.length;
      }
    };

    $scope.$watch('filterNotification', function() {
      $scope.loadTaskToNotify();
    });

    $scope.filterTask = function(tasks, filter) {
      var filtertasks;
      // si pas de filtrer alors on retourne le tout
      if (typeof filter === 'undefined') {
        return tasks;
      }
      filtertasks = _.filter(tasks, function(task) {
        // si owner
        if (task.actor._id === $scope.currentUser._id) {
          return true;
        }
        // si actor (metrics)
        if (typeof task.lastmetric !== 'undefined') {
          if ($scope.currentUser._id === task.lastmetric.actor._id) {
            return true;
          }
        }
        // si watcher
        if (_.intersection([$scope.currentUser._id], _.pluck(task.watchers, '_id')).length > 0) {
          return true;
        }

      });
      return filtertasks;
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

    /*        $(function() {
            $('.dropdown-menu > li > a.trigger').on('click', function(e) {
                var current = $(this).next();
                var grandparent = $(this).parent().parent();
                if ($(this).hasClass('left-caret') || $(this).hasClass('right-caret'))
                    $(this).toggleClass('right-caret left-caret');
                grandparent.find('.left-caret').not(this).toggleClass('right-caret left-caret');
                grandparent.find('.sub-menu:visible').not(current).hide();
                current.toggle();
                e.stopPropagation();
            });
            $('.dropdown-menu > li > a:not(.trigger)').on('click', function() {
                var root = $(this).closest('.dropdown');
                root.find('.left-caret').toggleClass('right-caret left-caret');
                root.find('.sub-menu:visible').hide();
            });
        });*/

  });
