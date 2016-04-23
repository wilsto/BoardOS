'use strict';

angular.module('boardOsApp')
    .controller('ForgotCtrl', function($rootScope, $scope, $http) {
        $scope.user = {};
        $scope.message = null;

        $scope.forgot = function(form) {
            if ($scope.user.email) {
                $http.get('/auth/forgot', {
                    params: {
                        email: $scope.user.email,
                    }
                }).success(function(data) {
                    $scope.message=data;
                });
            }
        };

    });