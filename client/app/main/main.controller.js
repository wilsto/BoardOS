'use strict';

angular.module('boardOsApp').controller('MainCtrl', function($scope, $rootScope, $http, myLibrary, Auth, $timeout, dateRangeService, $location, calendarConfig, Notification) {

  Auth.getCurrentUser(function(data) {
    $scope.currentUser = data;
  });

  // Charger les dashboards
  // ------------------
  $scope.dashboards = $rootScope.dashboards;

  $rootScope.$watch('dashboards', function() {
    $scope.dashboards = $rootScope.dashboards;
  });

  $scope.openObeya = function(id) {
    $location.path('/obeya/' + id);
  };

});
