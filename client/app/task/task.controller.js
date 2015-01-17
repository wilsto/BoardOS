'use strict';

angular.module('boardOsApp')
.controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, ngToast, $location){

  $scope.load = function() {      
    if ($stateParams.id) {
      $http.get('/api/tasks/'+$stateParams.id).success(function (data) { 
        $scope.task = data;
            ngToast.create('Task "' + $scope.task.name + '" loaded');
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

  if (typeof $scope.task._id === 'undefined') {
    $http.post('/api/tasks', $scope.task).success(function(data){
      var logInfo = 'Task "' + $scope.task.name + '" was created';
      $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
      ngToast.create(logInfo);
      $location.path('/task/'+data._id);

    });
  } else {
    $http.put('/api/tasks/'+ $scope.task._id , $scope.task).success(function(data){
      var logInfo = 'Task "' + $scope.task.name + '" was updated';
      $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
      ngToast.create(logInfo);
    });
  }
};

$('#ver-inline-menu a').click(function (e) {
  e.preventDefault();
  $(this).tab('show');
});

});