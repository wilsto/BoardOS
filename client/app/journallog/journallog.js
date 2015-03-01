'use strict';

angular.module('boardOsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('journallog', {
        url: '/journallog',
        templateUrl: 'app/journallog/journallog.html',
        controller: 'JournallogCtrl'
      });
  });