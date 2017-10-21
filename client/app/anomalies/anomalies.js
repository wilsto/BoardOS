'use strict';

angular.module('boardOsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('anomalies', {
        url: '/anomalies',
        templateUrl: 'app/anomalies/anomalies.html',
        controller: 'AnomaliesCtrl',
        authenticate: true
      });
  });
