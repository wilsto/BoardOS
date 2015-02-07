'use strict';

angular.module('boardOsApp')
    .controller('GlobalCtrl', function($scope, Auth) {

        $scope.reLoadUser = function() {
            Auth.isLoggedIn(function(data) {
                $scope.isLoggedIn = data;
            });
            Auth.isAdmin(function(data) {
                $scope.isAdmin = data;
            });
            Auth.getCurrentUser(function(data) {
                $scope.currentUser = data;
            });
        };

        $scope.reLoadUser();

        $scope.$on('UserLogChange', function() {
            $scope.reLoadUser();
        });
    });