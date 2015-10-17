'use strict';

angular.module('boardOsApp')
    .controller('CalendarCtrl', function($scope, $http, $rootScope) {
        $scope.eventSources = [];
        $scope.filterNotification = 'Only For Me';

        $scope.uiConfig = {
            calendar: {
                height: 450,
                editable: false,
                header: {
                    left: 'month basicWeek basicDay',
                    center: 'title',
                    right: 'today prev,next'
                },
                eventLimit: true,
                firstDay: 1
            }
        };

        $scope.loadTaskToNotify = function() {
            if (typeof $scope.allTasks !== 'undefined') {
                $scope.alltasksToNotify = $scope.allTasks.length;
                $scope.myTasks = $scope.filterTask($scope.allTasks, $scope.filterNotification);
                if ($scope.filterNotification === 'Only For Me') {
                    $scope.tasksToNotify = $scope.myTasks;
                } else {
                    $scope.tasksToNotify = $scope.allTasks;
                }
                $scope.mytasksToNotify = $scope.myTasks.length;

                $scope.events = _.map($scope.tasksToNotify, function(task) {
                    return {
                        allDay: true,
                        title: task.name,
                        start: task.startDate,
                        end: task.endDate,
                        url: '/task/' + task._id,
                        color: '#69a4e0'
                    };
                });
                $scope.eventSources.push($scope.events);
            }
        };

        $scope.$watch('filterNotification', function() {
            $scope.eventSources.splice(0, $scope.eventSources.length);
            $scope.loadTaskToNotify();
        });


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
                if (typeof task.lastmetric !== 'undefined') {
                    if ($scope.currentUser._id === task.lastmetric.actor._id) {
                        return true;
                    }
                }
                // si watcher
                if (_.intersection([$scope.currentUser._id], _.pluck(task.watchers, '_id')).length > 0) {
                    return true;
                }

            });
            return filtertasks;
        };

        $http.get('/api/tasks').success(function(tasks) {
            $scope.allTasks = tasks.tasks;
            $scope.loadTaskToNotify();
        });

    });