'use strict';

angular.module('boardOsApp')
  .controller('ObeyaCtrl', function($scope, $http, Notification, $stateParams) {

    $scope.obeyaMOde = 'week';

    if ($stateParams.id) {
      $scope.myPromise = $http.get('/api/dashboardCompletes/' + $stateParams.id).success(function(obeya) {
        console.log('obeya', obeya);
        $scope.obeya = obeya;
      });

    }

  });
