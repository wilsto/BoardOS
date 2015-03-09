'use strict';

angular.module('boardOsApp')
    .directive('tabDashboard', function() {
        return {
            templateUrl: 'app/tabDashboard/tabDashboard.html',
            restrict: 'EA',
            scope: {
                data: '='
            },
            link: function(scope, element, attrs) {
                if (typeof scope.data !== 'undefined') {
                    scope.dashboards = scope.data.tasks[0].dashboards;
                }
            }
        };
    });