'use strict';

angular.module('boardOsApp')
  .controller('CalendarCtrl', function($scope, $http, $rootScope, $location, calendarConfig, Notification, $window) {
    $scope.eventSources = [];
    $scope.filterNotification = 'Only For Me';

    $scope.loadTaskToNotify = function() {
      if (typeof $scope.allTasks !== 'undefined') {
        $scope.alltasksToNotify = $scope.allTasks.length;
        $scope.myTasks = $scope.filterTask($scope.allTasks, $scope.filterNotification);

        if ($scope.filterNotification === 'Only For Me') {

          $scope.tasksToNotify = $scope.myTasks;
        } else {
          $scope.tasksToNotify = $scope.allTasks;
        }
        $scope.mytasksToNotify = $scope.myTasks.length;

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
            draggable: (task.metrics[task.metrics.length - 1].status !== 'Finished')
          });
        });

        _.each($scope.myAnomalies, function(anomalie) {
          if ($scope.currentUser && anomalie.actor._id === $scope.currentUser._id) {
            $scope.events.push({
              title: '<i class="fa fa-bell-o" aria-hidden="true"></i>&nbsp;&nbsp; ' + anomalie.name, // The title of the event
              eventType: 'anomalie',
              eventId: anomalie._id,
              startsAt: moment(anomalie.date).toDate(),
              color: calendarConfig.colorTypes.important,
            });
          }
        });
        $scope.eventSources.push($scope.events);
      }
    };

    $scope.$watch('filterNotification', function() {
      $scope.eventSources.splice(0, $scope.eventSources.length);
      $scope.loadTaskToNotify();
    });


    $scope.filterTask = function(tasks, filter) {
      var filtertasks;
      // si pas de filtrer alors on retourne le tout
      if (typeof filter === 'undefined') {
        return tasks;
      }

      filtertasks = _.filter(tasks, function(task) {
        // si actor (metrics)
        if (typeof task.actors !== 'undefined') {
          var actors = _.map(task.actors, '_id');
          if ($scope.currentUser && actors.indexOf($scope.currentUser._id) > -1) {
            return true;
          }
        }
      });
      return filtertasks;
    };

    $http.get('/api/taskFulls').success(function(tasks) {
      $scope.allTasks = tasks;
      $scope.loadTaskToNotify();
    });


    // Charger les anomalies
    // ------------------
    $scope.loadAnomalies = function() {
      var currentUser_id = ($scope.currentUser) ? $scope.currentUser._id : undefined;

      var myparams = {
        params: {
          userId: currentUser_id
        }
      };

      $http.get('/api/anomalies/', myparams).success(function(anomalies) {
        $scope.myAnomalies = anomalies;

      });
    };

    $scope.loadAnomalies();

    // calendar
    // **********
    //
    $scope.viewDate = new Date();
    $scope.calendarView = 'month';
    $scope.eventClicked = function(calendarEvent) {
      $window.open('/' + calendarEvent.eventType + '/' + calendarEvent.eventId, '_blank');
    };

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

  });