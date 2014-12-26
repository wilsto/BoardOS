'use strict';

angular.module('boardOsApp')
.controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $modal, ngToast){

  $scope.load = function() {      
    $http.get('/api/tasks/'+$stateParams.id).success(function (data) { 
      console.log(data);
      $scope.task = data;
    });
 };

 $scope.load();

$scope.save = function() {

  delete $scope.task.__v;
  delete $scope.task.kpis;
  delete $scope.task.metrics;
  delete $scope.task.tasks;

  if (typeof $scope.task._id === 'undefined') {
    $http.post('/api/tasks', $scope.task);
    ngToast.create('task "' + $scope.task.name + '" was created');
  } else {
    $http.put('/api/tasks/'+ $scope.task._id , $scope.task);
    ngToast.create('task "' + $scope.task.name + '" was updated');
  }

  $scope.load();
};

  /**
   * Modal
   */

   $scope.openMesure = function (task, mesure, newItem) {
    $rootScope.mesure = mesure;
    $rootScope.task = task;
    $rootScope.newItem = newItem;

    var modalInstance = $modal.open({
      templateUrl: 'myMesureContent.html',
      controller: MesureInstanceCtrl
    });
  };

  // Please note that $modalInstance represents a modal window (instance) dependency. It is not the same as the $modal service used above.
  var MesureInstanceCtrl = function ($rootScope, $scope, $modalInstance) {
    $scope.formData = $rootScope.mesure;
    console.log( $scope.formData );
    console.log( $scope.task );

    if (typeof $scope.formData === 'undefined') {
      $scope.formData = {};
      $scope.formData.activity = $rootScope.task.activity; 
      $scope.formData.context = $rootScope.task.context;
    }

    $scope.today = function() {
      $scope.date = new Date();
    };
    $scope.today();

    $scope.showWeeks = true;
    $scope.toggleWeeks = function () {
      $scope.showWeeks = ! $scope.showWeeks;
    };

    $scope.clear = function () {
      $scope.date = null;
    };

    // Disable weekend selection
    $scope.disabled = function(date, mode) {
      return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.toggleMin = function() {
      $scope.minDate = ( $scope.minDate ) ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open1 = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened1 = true;
    };

    $scope.open2 = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened2 = true;
    };

    $scope.open3 = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened3 = true;
    };

    $scope.dateOptions = {
      'year-format': '"yyyy"',
      'starting-day': 1
    };

    $scope.format = 'dd-MMMM-yyyy';

    $scope.setContextId = function(parent) {
      $scope.formData.refContexte = parent.id;
    };

    $scope.setActivityId = function(parent) {
      $scope.formData.refActivity = parent.id;
    };

    $scope.ok = function () {
      $modalInstance.close();
      if ($rootScope.newItem === false) {
        $http.put('/api/metrics/'+$scope.formData._id, $scope.formData)
        .success(function(data) {
        });
      }else{
        $http.post('/api/metrics', $scope.formData)
        .success(function(data) {
        });
      }

    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };
});