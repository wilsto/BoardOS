'use strict';

angular.module('boardOsApp')
  .controller('SettingsCtrl', function ($scope, Auth, $http) {
    $scope.errors = {};
    $scope.currentUser= Auth.getCurrentUser();

    $scope.dashboards = [];

    $scope.load = function() {
      $http.get('/api/dashboards/user/'+$scope.currentUser._id).success(function(dashboards) {
        $scope.dashboards = dashboards.dashboards;
        $scope.tasks = dashboards.tasks;
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

  $scope.deleteDashboard = function(dashboard,index) {
    bootbox.confirm('Are you sure?', function(result) {
      if (result) {
        $http.delete('/api/dashboards/' + dashboard._id).success(function () {
          $scope.dashboards.splice(index, 1);
          $.growl({  icon: 'fa fa-info-circle',  message:'Dashboard "' + dashboard.name + '" was deleted'});
        });
      }
    }); 
  }; 

  });
