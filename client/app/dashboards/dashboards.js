'use strict';

angular.module('boardOsApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('dashboards', {
                url: '/dashboards',
                templateUrl: 'app/dashboards/dashboards.html',
                controller: 'DashboardsCtrl',
                authenticate: true
            });
    });