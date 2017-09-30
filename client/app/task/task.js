'use strict';

angular.module('boardOsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('task', {
        url: '/task/:id/:context/:activity/:actionPlan/:previousId',
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
          },
          actionPlan: {
            value: null,
            squash: true
          },
          previousId: {
            value: null,
            squash: true
          }
        }
      })
      .state('recurrentTask', {
        url: '/recurrentTask/:id',
        templateUrl: 'app/task/task.html',
        controller: 'TaskCtrl',
        authenticate: true
      });
  });
