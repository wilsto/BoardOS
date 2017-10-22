/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('TasksCtrl', function($rootScope, $scope, $http, statusTask, progressStatusTask, Notification) {
    $scope.alltasks = [];
    $scope.tasks = [];
    $scope.showTasks = [];
    $scope.task = {};
    $scope.filterStatus = 'Not Finished';
    $scope.filterProgressStatus = 'All';
    $scope.filterActors = 'All';
    $scope.searchText = '';
    $scope.orderByField = 'date';
    $scope.reverseSort = true;
    $scope.today = new Date().toISOString();

    $rootScope.taskStatus = statusTask;
    $rootScope.progressStatus = progressStatusTask;

    var searchTxt = $scope.searchText.toLowerCase();
    var filterStatusTxt = $scope.filterStatus.replace('All', '').replace('Not Finished', '').toLowerCase();
    var filterProgressStatusTxt = $scope.filterProgressStatus.replace('All', '').toLowerCase();
    var filterTasks = function(data) {
      return _.filter(data, function(task) {
        var lasMetric = task.metrics[task.metrics.length - 1];

        var blnSearchText = (searchTxt === 0) ? true : (task.name && task.name.toLowerCase().indexOf(searchTxt) >= 0) || (task.activity && task.activity.toLowerCase().indexOf(searchTxt) >= 0) || (task.context && task.context.toLowerCase().indexOf(searchTxt) >= 0);
        var blnStatus = (typeof task.metrics === 'undefined') ? false : lasMetric.status && lasMetric.status.toLowerCase().indexOf(filterStatusTxt) >= 0;
        var blnProgressStatus = (typeof task.metrics === 'undefined') ? false : lasMetric.progressStatus && lasMetric.progressStatus.toLowerCase().indexOf(filterProgressStatusTxt) >= 0;

        var blnActors;
        if ($scope.filterActors === 'All') {
          blnActors = true;
        } else {
          blnActors = false;
          _.each(task.actors, function(actor) {
            if (actor._id.toString() === $scope.currentUser._id.toString()) {
              blnActors = true;
            }
          });
        }

        return blnSearchText && blnProgressStatus && blnStatus && blnActors;
      });
    };

    $scope.Load = function() {
      $http.get('/api/taskFulls').success(function(data) {
        $scope.alltasks = _.sortBy(data, 'date').reverse();

        _.each($scope.alltasks, function(task) {
          task.taskSuffIcon = '';
          task.taskIcon = '';
          switch (task.metrics[task.metrics.length - 1].status) {
            case 'Finished':
              if (task.reviewTask === true) {
                task.taskIcon = '<i class="fa fa-bookmark-o text-success" aria-hidden="true"></i>&nbsp;&nbsp; ';
              }
              if (task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined) {
                task.taskSuffIcon = ' <i class="fa fa-question-circle-o text-danger" aria-hidden="true"></i>&nbsp;&nbsp;';
              }
              break;
            default:
              task.taskIcon = '';
          }
          task.icons = task.taskIcon + task.taskSuffIcon;
        });

        $scope.tasks = filterTasks($scope.alltasks);
        $scope.showTasks = $scope.tasks.slice(0, 15);
      });
    };

    $scope.reloadTasks = function() {
      $scope.tasks = filterTasks($scope.alltasks);
      $scope.showTasks = $scope.tasks.slice(0, 15);
    };


    $scope.getMoreData = function() {
      var tasks = filterTasks($scope.alltasks);
      $scope.showTasks = tasks.slice(0, $scope.showTasks.length + 15);
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
      $scope.reloadTasks();
    });

    $scope.$watch('filterStatus', function() {
      $scope.reloadTasks();
    });

    $scope.$watch('filterProgressStatus', function() {
      $scope.reloadTasks();
    });

    $scope.$watch('filterActors', function() {
      $scope.reloadTasks();
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

  });
