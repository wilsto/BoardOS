'use strict';

angular.module('boardOsApp')
  .directive('dashboardTab', function () {
    return {
		templateUrl: 'app/dashboardTab/dashboardTab.html',
		restrict: 'EA',
		scope: { dashboardType: '@', data: '=dashboardData' },
      	link: function (scope, element, attrs) {
      	  console.log( scope.data);
      	  console.log( scope.dashboardType);
		  scope.dataTable = scope.data[scope.dashboardType];
      }
    };
  });