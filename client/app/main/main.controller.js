'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.loadDashBoard = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
        $scope.dashboards = dashboards;
      });
    };

    $scope.loadDashBoard();
  });
