/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('TasksCtrl', function($rootScope, $scope, $http, statusTask, progressStatusTask, Notification, $timeout) {
    $scope.alltasks = [];
    $scope.tasks = [];
    $scope.showTasks = [];
    $scope.task = {};
    $scope.filterStatus = 'Not Finished';
    $scope.filterProgressStatus = 'All';
    $scope.filterActors = 'All';
    $scope.searchName = '';
    $scope.searchActor = '';
    $scope.searchContext = '';
    $scope.searchStatus = '';
    $scope.searchStart = '';
    $scope.searchEnd = '';
    $scope.blnReview = '';
    $scope.blnSuffix = '';
    $scope.orderByField = 'date';
    $scope.reverseSort = true;
    $scope.today = new Date().toISOString();

    $rootScope.taskStatus = statusTask;
    $rootScope.progressStatus = progressStatusTask;


    $scope.IntroOptionsFull = {
      steps: [{
          element: '#step1',
          intro: 'This is the full tooltip.'
        },
        {
          element: '#step2',
          intro: '<strong>You</strong> can also <em>include</em> HTML',
          position: 'right'
        },
        {
          element: '#step3',
          intro: 'More features, more fun.',
          position: 'left'
        },
        {
          element: '#step4',
          intro: 'Another step.',
          position: 'bottom'
        },
        {
          element: '#step5',
          intro: 'Get it, use it.'
        }
      ],
      showStepNumbers: true,
      showBullets: true,
      exitOnOverlayClick: true,
      exitOnEsc: true,
      nextLabel: '<span style="color:green">next</span>',
      prevLabel: 'Previous',
      skipLabel: 'Exit',
      doneLabel: 'Thanks'
    };

    $scope.IntroOptions = {
      steps: [{
          element: '#step1',
          intro: '<strong class="text-primary">New !</strong> in this version<br> <br> You can now action multiple tasks at the same time. ',
          position: 'bottom'
        },
        {
          element: '.styled',
          intro: '<strong>Select</strong> one or more tasks and execute action above.',
          position: 'right'
        },
        {
          element: '#stepFinal',
          intro: '<strong>Select</strong> one or more tasks and execute action above.',
          position: 'right'
        }
      ],
      showStepNumbers: true,
      showBullets: true,
      exitOnOverlayClick: true,
      exitOnEsc: true,
      nextLabel: '<span style="color:green">next</span>',
      prevLabel: 'Previous',
      skipLabel: 'Exit',
      doneLabel: 'I got it !'
    };

    $scope.filterTasks = function(data) {
      var searchName = ($scope.searchName) ? $scope.searchName.toLowerCase() : '';
      var searchActor = ($scope.searchActor) ? $scope.searchActor.toLowerCase() : '';
      var searchContext = ($scope.searchContext) ? $scope.searchContext.toLowerCase() : '';
      var searchStatus = ($scope.searchStatus) ? $scope.searchStatus.toLowerCase() : '';

      return _.filter(data, function(task) {
        var lastMetric = task.metrics[task.metrics.length - 1];

        var blnActor = (searchActor.length === 0) ? true : false;
        _.each(task.actors, function(actor) {
          if (actor.name.toLowerCase().indexOf(searchActor) >= 0) {
            blnActor = true;
          }
        });
        var blnName = (searchName.length === 0) ? true : (task.name && task.name.toLowerCase().indexOf(searchName) >= 0) || (task.activity && task.activity.toLowerCase().indexOf(searchName) >= 0);
        var blnContext = (searchContext.length === 0) ? true : (task.context && task.context.toLowerCase().indexOf(searchContext) >= 0);
        var blnStart = ($scope.searchStart.length === 0) ? true : (typeof task.metrics === 'undefined') ? false : lastMetric.targetstartDate && lastMetric.targetstartDate.toString().indexOf($scope.searchStart) >= 0;
        var blnEnd = ($scope.searchEnd.length === 0) ? true : (typeof task.metrics === 'undefined') ? false : lastMetric.targetEndDate && lastMetric.targetEndDate.toString().indexOf($scope.searchEnd) >= 0;
        var blnStatus = ($scope.searchStatus.length === 0) ? true : (typeof task.metrics === 'undefined') ? false : lastMetric.status && lastMetric.status.toLowerCase().indexOf(searchStatus) >= 0;
        var blnReview = ($scope.blnReview.length > 0) ? task.taskIcon : true;
        var blnMissing = ($scope.blnSuffix.length > 0) ? task.taskSuffIcon : true;
        var blnReturn = blnName && blnActor && blnStatus && blnContext && blnStart && blnEnd && blnMissing && blnReview;
        return blnReturn;
      });
    };

    $scope.$watchGroup(['searchName', 'searchActor', 'searchStart', 'searchEnd', 'searchStatus', 'searchContext', 'reverseSort', 'blnSuffix', 'blnReview'], function(newValues, oldValues) {
      $scope.reloadTasks();
    });

    $scope.Load = function() {
      $http.get('/api/taskFulls').success(function(data) {
        $scope.alltasks = data;

        // Cleaning Tasks once
        _.each($scope.alltasks, function(task) {
          if (typeof task.name === 'undefined') {
            task.name = 'No Name Defined - This is an Error';
          }
          if (typeof task.activity === 'undefined') {
            task.activity = undefined;
          }
          if (typeof task.context === 'undefined') {
            task.context = undefined;
          }
          if (typeof task.metrics === 'undefined') {
            task.metrics = [{
              targetstartDate: undefined,
              targetEndDate: undefined,
              status: undefined
            }];
          }
        });

        // Suffix task once
        $scope.suffixTask($scope.alltasks);

        //Filter and Order
        $scope.reloadTasks();
        $timeout(function() {
          $scope.CallMe();
          console.log('ghdsfgqsjd');
        }, 1000);
      });
    };

    $scope.reloadTasks = function() {
      $scope.tasks = $scope.filterTasks($scope.alltasks);
      $scope.tasks = _.sortBy($scope.tasks, function(task) {
        switch ($scope.orderByField) {
          case 'date':
            return task.date;
          case 'actor':
            return task.actors[0].name;
          case 'name':
            return task.name;
          case 'activity':
            return task.activity;
          case 'context':
            return task.context;
          case 'startDate':
            return task.metrics[task.metrics.length - 1].targetstartDate;
          case 'endDate':
            return task.metrics[task.metrics.length - 1].targetEndDate;
          case 'status':
            return task.metrics[task.metrics.length - 1].status;
        }
      });

      if ($scope.reverseSort) {
        $scope.tasks.reverse();
      }
      $scope.showTasks = $scope.tasks.slice(0, 15);
    };

    $scope.suffixTask = function(tasks) {
      _.each(tasks, function(task) {
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
    };


    $scope.getMoreData = function() {
      var tasks = $scope.filterTasks($scope.alltasks);
      tasks = _.sortBy(tasks, $scope.orderByField);
      if ($scope.reverseSort) {
        tasks.reverse();
      }
      $scope.showTasks = tasks.slice(0, $scope.showTasks.length + 15);
      $scope.suffixTask($scope.showTasks);
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

  });