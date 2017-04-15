/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('TasksCtrl', function($rootScope, $scope, $http, statusTask, progressStatusTask, Notification) {
    $scope.tasks = [];
    $scope.task = {};
    $scope.filterStatus = 'Not Finished';
    $scope.filterProgressStatus = 'All';
    $scope.searchText = '';
    $scope.orderByField = 'metrics[task.metrics.length - 1].date';
    $scope.reverseSort = true;
    $scope.today = new Date().toISOString();

    $rootScope.taskStatus = statusTask;
    $rootScope.progressStatus = progressStatusTask;

    $scope.Load = function() {
      $http.get('/api/taskFulls').success(function(data) {
        
        $scope.alltasks = data;
        $scope.tasks = data;
        $scope.filterTasks();
      });
    };

    $scope.save = function() {
      delete $scope.task.__v;


      if (typeof $scope.task._id === 'undefined') {
        $http.post('/api/tasks', $scope.task);
        Notification.success('Task "' + $scope.task.name + '" was created');
      } else {
        $http.put('/api/tasks/' + $scope.task._id, $scope.task);
        Notification.success('Task "' + $scope.task.name + '" was updated');

      }
      $scope.load();
    };

    $scope.edit = function(task) {
      $scope.task = {};
      $scope.task = task;
    };

    $scope.reset = function() {
      $scope.task = {};
    };

    $scope.delete = function(task, index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/tasks/' + task._id).success(function() {
            $scope.tasks.splice(index, 1);
            Notification.success('Task "' + $scope.task.name + '" was deleted');
          });
        }
      });
    };

    $scope.Load();

    $scope.$watch('searchText', function() {
      $scope.filterTasks();
    });

    $scope.$watch('filterStatus', function() {
      $scope.filterTasks();
    });

    $scope.$watch('filterProgressStatus', function() {
      $scope.filterTasks();
    });

    $scope.watchTask = function(task) {
      bootbox.confirm('Are you sure to watch this task?', function(result) {
        if (result) {
          $http.post('/api/tasks/watch/' + task._id + '/' + $scope.currentUser._id).success(function(data) {
            $scope.Load();

            var logInfo = 'Task watch "' + task.name + '" was updated by ' + $scope.currentUser.name;
            $http.post('/api/logs', {
              info: logInfo,
              actor: $scope.currentUser
            });
            Notification.success(logInfo);
          });
        }
      });
    };

    $scope.filterTasks = function() {
      $scope.tasks = _.filter($scope.alltasks, function(task) {
        var blnSearchText = ($scope.searchText.length === 0) ? true : task.name.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0 || task.activity.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0 || task.context.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0;
        var blnStatus = (typeof task.metrics === 'undefined') ? false : task.metrics[task.metrics.length - 1].status.toLowerCase().indexOf($scope.filterStatus.replace('All', '').replace('Not Finished', 'o').toLowerCase()) >= 0;
        var blnProgressStatus = (typeof task.metrics === 'undefined') ? false : task.metrics[task.metrics.length - 1].progressStatus.toLowerCase().indexOf($scope.filterProgressStatus.replace('All', '').toLowerCase()) >= 0;
        return blnSearchText && blnProgressStatus && blnStatus;
      });
    };
  });
