'use strict';

angular.module('boardOsApp')
  .controller('KPIsCtrl', function ($scope, $http, socket, ngToast) {
    $scope.KPIs = [];
    $scope.KPI = {};
    $scope.config = {tab1: true, tab2: false};

    $scope.load = function() {
      $http.get('/api/KPIs').success(function(KPIs) {
        $scope.KPIs = KPIs;
      });
    };

    $scope.save = function() {
      if (typeof $scope.KPI._id == 'undefined') {
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
      $scope.KPI = KPI;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.reset = function() {
      $scope.KPI = {};
    };

    $scope.delete = function(KPI,index) {
      bootbox.confirm("Are you sure?", function(result) {
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
