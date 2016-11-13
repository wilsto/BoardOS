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
          scope.owner = [scope.data.actor] || null;
          scope.actors = scope.data.actors || null;
          scope.watchers = scope.data.watchers || null;
        }
      }
    };
  });
