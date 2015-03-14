'use strict';

angular.module('boardOsApp')
    .controller('NavbarCtrl', function($scope, $rootScope, $location, Auth, $http) {

        $scope.load = function() {
            $http.get('/api/tasks').success(function(tasks) {
                $scope.allNavBarTasks = tasks.tasks;
                $scope.navBarTasks = _.filter(tasks.tasks, function(task) {
                    return task.lastmetric && task.lastmetric.status !== 'Finished';
                });
                $scope.navBarTasksAlerts = _.filter(tasks.tasks, function(task) {
                    return task.lastmetric && task.lastmetric.progressStatus !== 'On time' && task.lastmetric.status !== 'Finished';
                });

            });
        };

        $scope.load();

        $scope.logout = function() {
            Auth.logout();
            $scope.$emit('UserLogChange');
            $location.path('/login');
        };

        $scope.isActive = function(route) {
            return route === $location.path();
        };
    });