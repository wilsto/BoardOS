'use strict';

angular.module('boardOsApp')
  .controller('NavbarCtrl', function ($scope, $rootScope, $location, Auth,  $http) {

    $http.get('/api/tasks').success(function(tasks) {
      $scope.navBarTasks = tasks.tasks;
      $scope.navBarTasks = _.filter(tasks.tasks, function(task) {return task.lastmetric && task.lastmetric.progress < 100 ; });
      $scope.navBarTasksAlerts = _.filter(tasks.tasks, function(task) {return task.timebetween <= 0 ; });
      
    });

    $scope.logout = function() {
      Auth.logout();
      $scope.$emit ('UserLogChange');
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });