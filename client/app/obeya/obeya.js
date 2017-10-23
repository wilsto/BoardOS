'use strict';

angular.module('boardOsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('obeya', {
        url: '/obeya/:id',
        templateUrl: 'app/obeya/obeya.html',
        controller: 'ObeyaCtrl',
        authenticate: true
      });
  });
