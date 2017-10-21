'use strict';

angular.module('boardOsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('anomalie', {
        url: '/anomalie/:id',
        templateUrl: 'app/anomalie/anomalie.html',
        controller: 'AnomalieCtrl',
        authenticate: true
      });
  });
