'use strict';

angular.module('boardOsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('hierarchies', {
        url: '/hierarchies',
        templateUrl: 'app/hierarchies/hierarchies.html',
        controller: 'hierarchiesCtrl',
        authenticate: true
      });
  });