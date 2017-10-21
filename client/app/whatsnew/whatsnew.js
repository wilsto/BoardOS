'use strict';

angular.module('boardOsApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('whatsnew', {
        url: '/whatsnew',
        templateUrl: 'app/whatsnew/whatsnew.html',
        controller: 'WhatsnewCtrl',
        authenticate: true
      });
  });
