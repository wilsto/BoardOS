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


        $scope.getCurrentMonthName = function() {
            var d = new Date();
            var month = [];
            month[0] = 'January';
            month[1] = 'February';
            month[2] = 'March';
            month[3] = 'April';
            month[4] = 'May';
            month[5] = 'June';
            month[6] = 'July';
            month[7] = 'August';
            month[8] = 'September';
            month[9] = 'October';
            month[10] = 'November';
            month[11] = 'December';
            return month[d.getMonth()];
        };


    });