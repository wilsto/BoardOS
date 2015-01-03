'use strict';

angular.module('boardOsApp')
.controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $modal, ngToast){

  $scope.load = function() {      
    if ($stateParams.id) {
        $http.get('/api/tasks/'+$stateParams.id).success(function (data) { 
          $scope.task = data;
          console.log($scope.task);
        });
    } else {
       $scope.task = {};
    }
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

    var logInfo = 'Task "' + $scope.task.name + '" was created';
    $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
    ngToast.create(logInfo);

  } else {
    $http.put('/api/tasks/'+ $scope.task._id , $scope.task);
    
    var logInfo = 'Task "' + $scope.task.name + '" was updated';
    $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
    ngToast.create(logInfo);

  }

  $scope.load();
};


});