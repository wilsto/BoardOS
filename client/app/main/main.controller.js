'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function($scope, $rootScope, $http, myLibrary, Auth, $timeout, dateRangeService, $location, calendarConfig, Notification) {

    $scope.Math = window.Math;
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;
      $scope.loadTasks();
      $scope.loadAnomalies();
    });

    $scope.$on('dateRangeService:updated', function(event, data) {
      $scope.datediff = 7;
      if (data) {
        switch (data) {
          case 'Last 7 Days':
            dateRangeService.rangeDate = 'last7';
            $scope.datediff = 7;
            break;
          case 'Last 14 Days':
            dateRangeService.rangeDate = 'last14';
            $scope.datediff = 14;
            break;
          case 'Last 30 Days':
            dateRangeService.rangeDate = 'last30';
            $scope.datediff = 30;
            break;
          case 'Last 90 Days':
            dateRangeService.rangeDate = 'last90';
            $scope.datediff = 90;
            break;
          case 'Last 180 Days':
            dateRangeService.rangeDate = 'last180';
            $scope.datediff = 180;
            break;
          case 'Last 365 Days':
            dateRangeService.rangeDate = 'last365';
            $scope.datediff = 365;
            break;
          case 'All':
            dateRangeService.rangeDate = 'task';
            $scope.datediff = 5000;
            break;
        }
      }
      $scope.rangeDate = dateRangeService.rangeDate;
      $timeout(function() {
        $scope.$apply(function() {



          $scope.events = [];

          _.each($scope.myTasks, function(task) {
            task.taskSuffIcon = '';
            switch (task.metrics[task.metrics.length - 1].status) {
              case 'In Progress':
                task.taskIcon = '<i class="fa fa-spinner" aria-hidden="true"></i>&nbsp;&nbsp; ';
                task.taskColor = calendarConfig.colorTypes.info;
                break;
              case 'Finished':
                if (task.reviewTask === true) {
                  task.taskIcon = '<i class="fa fa-bookmark-o text-success" aria-hidden="true"></i>&nbsp;&nbsp; ';
                  task.taskColor = calendarConfig.colorTypes.success;

                } else {
                  task.taskIcon = '<i class="fa fa-check-square-o" aria-hidden="true"></i>&nbsp;&nbsp; ';
                  task.taskColor = calendarConfig.colorTypes.success;
                }
                if (task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined) {
                  task.taskSuffIcon = ' <i class="fa fa-question-circle-o text-danger" aria-hidden="true"></i>&nbsp;&nbsp;';
                }
                break;
              default:
                task.taskIcon = '<i class="fa fa-square-o " aria-hidden="true"></i>&nbsp;&nbsp; ';
                task.taskColor = '';
            }

            $scope.events.push({
              title: task.taskIcon + task.taskSuffIcon + task.name,
              eventType: 'task',
              eventId: task._id,
              displayEventTimes: false, // Indicates whether need to show time or not.
              startsAt: moment(task.metrics[task.metrics.length - 1].startDate || task.metrics[task.metrics.length - 1].targetstartDate).set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
              }).toDate(),
              endsAt: moment(task.metrics[task.metrics.length - 1].endDate || task.metrics[task.metrics.length - 1].targetEndDate).set({
                hour: 2,
                minute: 0,
                second: 0,
                millisecond: 0
              }).toDate(),
              color: task.taskColor,
              draggable: false
            });
          });


          $scope.filteredPlanTasks = _.filter($scope.myTasks, function(task) {
            var a = moment(new Date()).add($scope.datediff, 'days');
            var b = moment(new Date(task.metrics[task.metrics.length - 1].targetstartDate));
            return task.metrics[task.metrics.length - 1].status === 'Not Started';
          });
          $scope.filteredPlanTasksLoad = _.reduce($scope.filteredPlanTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);
          $scope.filteredInProgressTasks = _.filter($scope.myTasks, function(task) {
            var a = moment(new Date()).add($scope.datediff, 'days');
            var b = moment(new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[task.metrics.length - 1].targetstartDate));
            return task.metrics[task.metrics.length - 1].status === 'In Progress';
          });
          $scope.filteredInProgressTasksLoad = _.reduce($scope.filteredInProgressTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);
          $scope.filteredFinishedTasks = _.filter($scope.myTasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === undefined || task.reviewTask === false);
          });
          $scope.filteredFinishedTasksLoad = _.reduce($scope.filteredFinishedTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);
          $scope.filteredReviewedTasks = _.filter($scope.myTasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === true);
          });
          $scope.filteredReviewedTasksLoad = _.reduce($scope.filteredReviewedTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);


          _.each($scope.myAnomalies, function(anomalie) {
            if (anomalie.actor._id === $scope.currentUser._id) {
              $scope.events.push({
                title: '<i class="fa fa-bell-o" aria-hidden="true"></i>&nbsp;&nbsp; ' + anomalie.name, // The title of the event
                eventType: 'anomalie',
                eventId: anomalie._id,
                startsAt: moment(anomalie.date).toDate(),
                color: calendarConfig.colorTypes.important,
              });
            }
          });
        });
      });
    });



    $scope.eventTimesChanged = function(calendarEvent, calendarNewEventStart, calendarNewEventEnd) {
      var updatedEvent = _.filter($scope.myTasks, function(task) {
        return task._id === calendarEvent.eventId;
      });
      if (updatedEvent.length > 0) {


        var dayDiff = moment(calendarNewEventStart).diff(moment(updatedEvent[0].metrics[0].targetstartDate), 'days');

        updatedEvent[0].metrics[0].targetstartDate = moment(updatedEvent[0].metrics[0].targetstartDate).add(dayDiff, 'days').toDate();
        updatedEvent[0].metrics[0].targetEndDate = moment(updatedEvent[0].metrics[0].targetEndDate).add(dayDiff, 'days').toDate();



        $scope.myPromise = $http.put('/api/taskFulls/' + calendarEvent.eventId + '/' + false, updatedEvent[0]).success(function(data) {
          var logInfo = 'Task "' + updatedEvent[0].name + '" was updated';
          Notification.success(logInfo);
        });

      }
    };


    // Charger les taches
    // ------------------
    $scope.loadTasks = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id
        }
      };

      $http.get('/api/taskFulls/', myparams).success(function(tasks) {
        $scope.myTasks = tasks;
        $scope.$broadcast('dateRangeService:updated', 'last7');
      });
    };

    // Charger les anomalies
    // ------------------
    $scope.loadAnomalies = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id
        }
      };

      $http.get('/api/anomalies/', myparams).success(function(anomalies) {
        $scope.myAnomalies = anomalies;

      });
    };

    // Charger les dashboards
    // ------------------
    $scope.dashboards = $rootScope.dashboards;

    $rootScope.$watch('dashboards', function() {
      $scope.dashboards = $rootScope.dashboards;
    });


    // Attribution des couleurs pour les KPIs
    // ------------------
    $scope.goalColor = function(value) {
      return {
        color: myLibrary.giveMeMyColor(value)
      };
    };
    $scope.goalBgColor = function(value) {
      return {
        background: myLibrary.giveMeMyColor(value)
      };
    };
    $scope.alertColor = function(value) {
      return {
        color: myLibrary.giveMeMyColor(value, 'Alert')
      };
    };


    // calendar
    // **********
    //
    $scope.viewDate = new Date();
    $scope.calendarView = 'week';
    $scope.eventClicked = function(calendarEvent) {
      $location.path('/' + calendarEvent.eventType + '/' + calendarEvent.eventId);
    };
  });
