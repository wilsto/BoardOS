'use strict';

angular.module('boardOsApp')
  .controller('NavbarCtrl', function ($scope, $rootScope, $location, Auth,  $http) {

    $http.get('/api/tasks').success(function(tasks) {
      $scope.navBarTasks = tasks.tasks;
      $scope.navBarTasks = _.filter(tasks.tasks, function(task) {return task.lastmetric.progress < 100 ; });
      $scope.navBarTasksAlerts = _.filter(tasks.tasks, function(task) {return task.timebetween <= 0 ; });
      console.log('tasks',tasks);
    });

    $scope.login = function() {
      $rootScope.isLoggedIn = Auth.isLoggedIn();
      $rootScope.isAdmin = Auth.isAdmin();
      $rootScope.currentUser = Auth.getCurrentUser();
    };

    $scope.login();

    $scope.$on('UserLoggedIn', function() { console.log('mass');     
      $rootScope.isLoggedIn = Auth.isLoggedIn();
      $rootScope.isAdmin = Auth.isAdmin();
      $rootScope.currentUser = Auth.getCurrentUser();
    });

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });