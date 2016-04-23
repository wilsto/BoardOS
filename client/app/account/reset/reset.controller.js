'use strict';

angular.module('boardOsApp')
    .controller('ResetCtrl', function($rootScope, $scope, $http, $stateParams ) {
        $scope.user = {};
        $scope.reset = function(form) {
            var token = $stateParams.token;
            console.log('token',token);

            if ($scope.user.password && $scope.user.confirm) {
                $http.get('/auth/reset', {
                    params: {
                        password: $scope.user.password,
                        confirm: $scope.user.confirm,
                        token:token
                    }
                }).success(function(data) {
                    $scope.message=data;
                });
            } else {
                    $scope.message='Please enter the same password twice';
            }
        };


    });