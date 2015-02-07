/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
    .controller('TasksCtrl', function($rootScope, $scope, $http, statusTask, progressStatusTask) {
        $scope.tasks = [];
        $scope.task = {};

        $scope.debug = false;

        $rootScope.taskStatus = statusTask;
        $rootScope.progressStatus = progressStatusTask;

        $scope.Load = function() {
            $http.get('/api/tasks').success(function(data) {
                $scope.tasks = data.tasks;
            });
        };

        $scope.save = function() {
            delete $scope.task.__v;


            if (typeof $scope.task._id === 'undefined') {
                $http.post('/api/tasks', $scope.task);
                $.growl({
                    icon: 'fa fa-info-circle',
                    message: 'Task "' + $scope.task.name + '" was created'
                });
            } else {
                $http.put('/api/tasks/' + $scope.task._id, $scope.task);
                $.growl({
                    icon: 'fa fa-info-circle',
                    message: 'Task "' + $scope.task.name + '" was updated'
                });
            }
            $scope.load();
        };

        $scope.edit = function(task) {
            $scope.task = {};
            $scope.task = task;
        };

        $scope.reset = function() {
            $scope.task = {};
        };

        $scope.delete = function(task, index) {
            bootbox.confirm('Are you sure?', function(result) {
                if (result) {
                    $http.delete('/api/tasks/' + task._id).success(function() {
                        $scope.tasks.splice(index, 1);
                        $.growl({
                            icon: 'fa fa-info-circle',
                            message: 'task "' + task.name + '" was deleted'
                        });
                    });
                }
            });
        };

        $scope.Load();

    });