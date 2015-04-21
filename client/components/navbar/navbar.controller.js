'use strict';

angular.module('boardOsApp')
    .controller('NavbarCtrl', function($scope, $rootScope, $location, Auth, $http) {
        Auth.getCurrentUser(function(data) {
            $scope.currentUser = data;
        });

        $scope.load = function() {
            $http.get('/api/tasks').success(function(tasks) {
                $scope.allNavBarTasks = tasks.tasks;
                $scope.myTasks = $scope.filterTask($scope.allNavBarTasks, 'Me');
                $scope.navBarTasks = _.filter($scope.myTasks, function(task) {
                    return task.lastmetric && task.lastmetric.status !== 'Finished';
                });
                $scope.navBarTasksAlerts = _.filter($scope.myTasks, function(task) {
                    return task.lastmetric && task.lastmetric.status !== 'Finished' && (task.lastmetric.progressStatus !== 'On Time' || task.timebetween < 0);
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


        $scope.filterTask = function(tasks, filter) {
            var filtertasks;
            // si pas de filtrer alors on retourne le tout
            if (typeof filter === 'undefined') {
                return tasks;
            }
            filtertasks = _.filter(tasks, function(task) {
                // si owner
                if (task.actor._id === $scope.currentUser._id) {
                    return true;
                }
                // si actor (metrics)
                if (_.intersection([$scope.currentUser._id], _.pluck(task.metricActors, '_id')).length > 0) {
                    return true;
                }
                // si watcher
                if (_.intersection([$scope.currentUser._id], _.pluck(task.watchers, '_id')).length > 0) {
                    return true;
                }

            });
            return filtertasks;
        };
    });