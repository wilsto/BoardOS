'use strict';

angular.module('boardOsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('task', {
        url: '/task/:id/:context/:activity',
        templateUrl: 'app/task/task.html',
        controller: 'TaskCtrl',
        authenticate: true,
        params: {
          context: {
            value: null,
            squash: true
          },
          activity: {
            value: null,
            squash: true
          }
        }
      });
  });
