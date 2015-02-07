'use strict';

angular.module('boardOsApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('tasks', {
                url: '/tasks',
                templateUrl: 'app/tasks/tasks.html',
                controller: 'TasksCtrl',
                authenticate: true
            });
    });