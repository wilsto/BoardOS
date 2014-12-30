'use strict';

angular.module('boardOsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('KPIs', {
        url: '/KPIs',
        templateUrl: 'app/KPIs/KPIs.html',
        controller: 'KPIsCtrl',
        authenticate: true
      });
  });