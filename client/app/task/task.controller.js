'use strict';

angular.module('boardOsApp')
.controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $modal, ngToast){

  $scope.load = function() {      
    $http.get('/api/tasks/'+$stateParams.id).success(function (data) { 
      $scope.task = data;
    });
 };

 $scope.load();

$scope.save = function() {

  delete $scope.task.__v;
  delete $scope.task.kpis;
  delete $scope.task.metrics;
  delete $scope.task.tasks;

  $scope.task.actor = $rootScope.currentUser.name;
  $scope.task.date = Date.now();
      console.log($scope.task);

  if (typeof $scope.task._id === 'undefined') {
    $http.post('/api/tasks', $scope.task);
    ngToast.create('task "' + $scope.task.name + '" was created');
  } else {
    $http.put('/api/tasks/'+ $scope.task._id , $scope.task);
    ngToast.create('task "' + $scope.task.name + '" was updated');
  }

  $scope.load();
};


});