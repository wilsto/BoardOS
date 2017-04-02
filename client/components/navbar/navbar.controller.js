'use strict';

angular.module('boardOsApp')
  .controller('NavbarCtrl', function($scope, $rootScope, $location, Auth, $http) {
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;
      $scope.load();
      $scope.loadDashBoards();
    });

    $scope.load = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id
        }
      };

      $http.get('/api/taskFulls/', myparams).success(function(tasks) {
        $scope.navBarTasks = _.filter(tasks, function(task) {
          if (typeof task.metrics[task.metrics.length - 1] === 'undefined' || task.metrics[task.metrics.length - 1].status === 'In Progress' || task.metrics[task.metrics.length - 1].status === 'Not Started') {
            return true;
          }
        });
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

    $scope.logout = function() {
      Auth.logout();
      $scope.$emit('UserLogChange');
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

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
        if (typeof task.metrics[task.metrics.length - 1] !== 'undefined') {
          if ($scope.currentUser._id === task.metrics[task.metrics.length - 1].actor._id) {
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
    /*        jQuery(document).ready(function($) {
        $('#header_notification_bar').on('show.bs.dropdown', function() {

        });

        $('.dropdown').on('show.bs.dropdown', function() {

        });
    });*/
  });
