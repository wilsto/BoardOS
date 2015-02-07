'use strict';

angular.module('boardOsApp')
    .directive('dashboardWidget', function() {
        return {
            templateUrl: 'app/dashboardWidget/dashboardWidget.html',
            restrict: 'EA',
            link: function(scope, element, attrs) {}
        };
    });