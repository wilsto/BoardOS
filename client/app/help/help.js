'use strict';

angular.module('boardOsApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('help', {
                url: '/help/:id',
                templateUrl: 'app/help/help.html',
                controller: 'helpCtrl',
                authenticate: true
            });
    });