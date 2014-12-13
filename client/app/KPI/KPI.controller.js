/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('KPICtrl', function ($scope, $http, socket, ngToast,actionKPI,categoryKPI,groupByKPI,metricTaskFields, $stateParams) {

    $scope.load = function() {
      $http.get('/api/KPIs/' + $stateParams.id).success(function(KPI) {
        $scope.KPI = KPI;
      });
    };

    $scope.save = function() {
      delete $scope.KPI.__v;
      console.log($scope.KPI );

      if (typeof $scope.KPI._id === 'undefined') {
        $http.post('/api/KPIs', $scope.KPI);
        ngToast.create('KPI "' + $scope.KPI.name + '" was created');
      } else {
        $http.put('/api/KPIs/'+ $scope.KPI._id , $scope.KPI);
        ngToast.create('KPI "' + $scope.KPI.name + '" was updated');
      }
      $scope.load();
      $scope.config = {tab1: true, tab2: false};
    };

    $scope.edit = function(KPI) {
      $scope.KPI = {};
      $scope.KPI = KPI;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.reset = function() {
      $scope.KPI = {};
    };

    $scope.delete = function(KPI,index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/KPIs/' + KPI._id).success(function () {
              $scope.KPIs.splice(index, 1);
              ngToast.create('KPI "' + KPI.name + '" was deleted');
          });
        }
      }); 
    }; 

    $scope.load();

});
