/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('DashboardsCtrl', function ($scope, $http, categoryKPI) {
    $scope.dashboards = [];
    $scope.dashboard = {};
    $scope.config = {tab1: true, tab2: false};

    $scope.load = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
        $scope.dashboards = dashboards.dashboards;
      });
    };

    $scope.save = function() {
    
      if (typeof $scope.dashboard._id === 'undefined') {
        $http.post('/api/dashboards', $scope.dashboard);
        $.growl({  icon: 'fa fa-info-circle',  message:'Dashboard "' + $scope.dashboard.name + '" was created'});
      } else {
        $http.put('/api/dashboards/'+ $scope.dashboard._id, $scope.dashboard);
        $.growl({  icon: 'fa fa-info-circle',  message:'Dashboard "' + $scope.dashboard.name + '" was updated'});
      }
      $scope.load();
      $scope.config = {tab1: true, tab2: false};
    };

    $scope.edit = function(dashboard) {
      
      $scope.dashboard = dashboard;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.delete = function(dashboard,index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/dashboards/' + dashboard._id).success(function () {
              $scope.dashboards.splice(index, 1);
              $.growl({  icon: 'fa fa-info-circle',  message:'Dashboard "' + dashboard.name + '" was deleted'});
          });
        }
      }); 
    }; 

    $scope.load();



});
