'use strict';

angular.module('boardOsApp')
  .controller('SettingsCtrl', function ($scope, User, Auth,$http) {
    $scope.errors = {};
    $scope.currentUser= Auth.getCurrentUser();

    $scope.dashboards = [];
    $scope.dashboard = {};
    $scope.config = {tab1: true, tab2: false};

    $scope.load = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
        $scope.dashboards = dashboards;
        console.log($scope.dashboards );
      });
    };

$scope.load();

    $scope.changePassword = function(form) {
      $scope.submitted = true;
      if(form.$valid) {
        Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
        .then( function() {
          $scope.message = 'Password successfully changed.';
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
          $scope.message = '';
        });
      }
		};
  });
