'use strict';

angular.module('boardOsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('task', {
        url: '/task/:id',
        templateUrl: 'app/task/task.html',
        controller: 'TaskCtrl'
      });
  });