'use strict';

angular.module('boardOsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('process', {
        url: '/process',
        templateUrl: 'app/process/process.html',
        controller: 'ProcessCtrl'
      });
  });