'use strict';

angular.module('boardOsApp')
.controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $location, Auth){

  $scope.activeTab = 1;

  $scope.load = function() {      
    if ($stateParams.id) {
      $http.get('/api/tasks/'+$stateParams.id).success(function (data) { 
        $scope.task = data;
        $.growl({  icon: "fa fa-paw",  message: 'Task "' + $scope.task.name + '" loaded'});
      });
    } else {
     $scope.task = {};
   }
 };

 $scope.load();

 $scope.changeTab = function (e, tabNb) {
  $('.ver-inline-menu li').removeClass('active');
  $(e.target).closest('li').addClass('active');
  $scope.activeTab = tabNb;
}

$scope.save = function() {

  delete $scope.task.__v;
  delete $scope.task.kpis;
  delete $scope.task.metrics;
  delete $scope.task.tasks;

  $scope.task.actor = $scope.currentUser;
  $scope.task.date = Date.now();

  if (typeof $scope.task._id === 'undefined') {
    $http.post('/api/tasks', $scope.task).success(function(data){
      var logInfo = 'Task "' + $scope.task.name + '" was created';
      $http.post('/api/logs', {info:logInfo, actor:$scope.currentUser});
      $.growl({  icon: "fa fa-paw",  message:logInfo});
      $location.path('/task/'+data._id);

    });
  } else {
    $http.put('/api/tasks/'+ $scope.task._id , $scope.task).success(function(data){
      var logInfo = 'Task "' + $scope.task.name + '" was updated';
      $http.post('/api/logs', {info:logInfo, actor:$scope.currentUser});
      $.growl({  icon: "fa fa-paw",  message:logInfo});
    });
  }
};

$scope.delete = function() {
  bootbox.confirm('Are you sure?', function(result) {
    if (result) {
      $http.delete('/api/tasks/' + $scope.task._id).success(function () {
        $.growl({  icon: "fa fa-paw",  message:'task "' + $scope.task.name + '" was deleted'});
        $location.path('/tasks');
      });
    }
  }); 
}; 

});