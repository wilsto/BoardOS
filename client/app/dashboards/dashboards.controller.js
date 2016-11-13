/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('DashboardsCtrl', function($scope, $http, categoryKPI, Notification) {
    $scope.dashboards = [];
    $scope.dashboard = {};
    $scope.searchText = '';
    $scope.config = {
      tab1: true,
      tab2: false
    };

    $scope.load = function() {
      var myparams = {
        params: {
          quick: true
        }
      };

      $http.get('/api/dashboardCompletes/', myparams).success(function(dashboards) {
        $scope.alldashboards = dashboards;
        $scope.dashboards = dashboards;

      });
    };

    $scope.save = function() {

      if (typeof $scope.dashboard._id === 'undefined') {
        $http.post('/api/dashboards', $scope.dashboard);
        Notification.success('Dashboard "' + $scope.dashboard.name + '" was created');
      } else {
        $http.put('/api/dashboards/' + $scope.dashboard._id, $scope.dashboard);
        Notification.success('Dashboard "' + $scope.dashboard.name + '" was updated');
      }
      $scope.load();
      $scope.config = {
        tab1: true,
        tab2: false
      };
    };

    $scope.pinDashboard = function(dashboard) {
      dashboard.owner = $scope.currentUser;
      delete dashboard._id;
      delete dashboard.__v;
      delete dashboard.kpis;
      $http.post('/api/dashboards', dashboard);
      Notification.success('Dashboard "' + $scope.dashboard.name + '" was pinned to your dashboards');
      $scope.load();
    };

    $scope.$watch('searchText', function() {
      $scope.dashboards = ($scope.searchText.length === 0) ? $scope.alldashboards : _.filter($scope.alldashboards, function(dashboard) {
        dashboard.name = dashboard.name || '';
        dashboard.activity = dashboard.activity || '';
        dashboard.context = dashboard.context || '';
        return dashboard.name.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0 || dashboard.activity.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0 || dashboard.context.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0;
      });
    });

    $scope.delete = function(dashboard, index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/dashboards/' + dashboard._id).success(function() {
            $scope.dashboards.splice(index, 1);
            Notification.success('Dashboard "' + $scope.dashboard.name + '" was deleted');
          });
        }
      });
    };

    $scope.load();
  });
