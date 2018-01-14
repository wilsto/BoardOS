'use strict';

angular.module('boardOsApp')
  .controller('LoginCtrl', function($rootScope, $scope, Auth, $location, $window, $http) {
    $scope.user = {};
    $scope.errors = {};

    $http.get('/api/things/32').success(function(data) {

    });

    $scope.login = function(form) {
      $scope.submitted = true;

      if (form.$valid) {
        Auth.login({
            email: $scope.user.email,
            password: $scope.user.password
          })
          .then(function() {
            // Logged in, redirect to home
            $scope.$emit('UserLogChange');
            $location.path('/');
          })
          .catch(function(err) {
            $scope.errors.other = err.message;
          });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };
  });