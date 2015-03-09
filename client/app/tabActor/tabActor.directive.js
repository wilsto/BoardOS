'use strict';

angular.module('boardOsApp')
    .directive('tabActor', function() {
        return {
            templateUrl: 'app/tabActor/tabActor.html',
            restrict: 'EA',
            scope: {
                data: '='
            },
            link: function(scope, element, attrs) {
                if (typeof scope.data !== 'undefined') {
                    scope.owner = [scope.data.tasks[0].actor] || null;
                    scope.actors = scope.data.tasks[0].actors || null;
                    scope.watchers = scope.data.tasks[0].watchers || null;
                }
            }
        };
    });