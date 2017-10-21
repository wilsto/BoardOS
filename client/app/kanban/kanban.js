'use strict';

angular.module('boardOsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('kanban', {
        url: '/kanban',
        templateUrl: 'app/kanban/kanban.html',
        controller: 'KanBanCtrl',
        authenticate: true
      });
  });
