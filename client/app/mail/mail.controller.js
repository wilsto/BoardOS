'use strict';

angular.module('boardOsApp')
  .controller('MailCtrl', function($scope, $http) {

    $scope.sendMail = function() {
      $http.get('/api/mails').success(function(response) {
        $scope.message = response;
      });
    };
    $scope.calculateTasks = function() {
      $http.get('/api/taskFulls/execute').success(function(response) {
        $scope.message = response;
      });
    };
    $scope.calculateDashboards = function() {
      $http.get('/api/dashboardCompletes/execute').success(function(response) {
        $scope.message = response;
      });
    };
  });
