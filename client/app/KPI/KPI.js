'use strict';

angular.module('boardOsApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('KPI', {
                url: '/KPI/:id',
                params: {
                    type: null,
                    typeid: null
                },
                templateUrl: 'app/KPI/KPI.html',
                controller: 'KPICtrl',
                authenticate: true
            });
    });
