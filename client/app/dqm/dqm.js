'use strict';

angular.module('boardOsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('dqm', {
        url: '/dqm',
        templateUrl: 'app/dqm/dqm.html',
        controller: 'DqmCtrl'
      });
  });