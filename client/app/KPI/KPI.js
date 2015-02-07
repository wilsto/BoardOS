'use strict';

angular.module('boardOsApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('KPI', {
                url: '/KPI/:id',
                templateUrl: 'app/KPI/KPI.html',
                controller: 'KPICtrl',
                authenticate: true
            });
    });