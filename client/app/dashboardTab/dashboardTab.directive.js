'use strict';

angular.module('boardOsApp')
  .directive('dashboardTab', function () {
    return {
		templateUrl: 'app/dashboardTab/dashboardTab.html',
		restrict: 'EA',
		scope: { dashboardType: '@', data: '=dashboardData' },
    link: function (scope, element, attrs) {
		  scope.dataTable = scope.data[scope.dashboardType];


    scope.open = function (a,b,c) {
        scope.$apply(attrs.enter);scope.openMesure(a, b,c);
    };

      }
    };
  });