'use strict';

angular.module('boardOsApp')
  .controller('DashboardsCtrl', function ($scope, $http, socket, ngToast) {
    $scope.dashboards = [];
    $scope.dashboard = {};
    $scope.config = {tab1: true, tab2: false};

    $scope.loadDashBoard = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
        $scope.dashboards = dashboards;
      });
    };

    $scope.saveDashBoard = function() {
      if (typeof $scope.dashboard._id == 'undefined') {
        $http.post('/api/dashboards', $scope.dashboard);
        ngToast.create('Dashboard "' + $scope.dashboard.name + '" was created');
      } else {
        $http.post('/api/dashboards', $scope.dashboard);
        ngToast.create('Dashboard "' + $scope.dashboard.name + '" was updated');
      }
      $scope.loadDashBoard();
      $scope.config = {tab1: true, tab2: false};
    };

    $scope.editDashBoard = function(dashboard) {
      console.log(dashboard);
      $scope.dashboard = dashboard;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.deleteDashBoard = function(dashboard,index) {
      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          $http.delete('/api/dashboards/' + dashboard._id).success(function () {
              $scope.dashboards.splice(index, 1);
              ngToast.create('Dashboard "' + dashboard.name + '" was deleted');
          });
        }
      }); 
    }; 

    $scope.loadDashBoard();
});
