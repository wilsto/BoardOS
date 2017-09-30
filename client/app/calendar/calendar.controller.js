'use strict';

angular.module('boardOsApp')
  .controller('CalendarCtrl', function($scope, $http, $rootScope, $location, calendarConfig) {
    $scope.eventSources = [];
    $scope.filterNotification = 'Only For Me';

    $scope.uiConfig = {
      calendar: {
        height: 450,
        editable: false,
        header: {
          left: 'month basicWeek basicDay',
          center: 'title',
          right: 'today prev,next'
        },
        eventLimit: true,
        firstDay: 1
      }
    };

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
          if (task.metrics[task.metrics.length - 1].status !== 'Finished') {

            $scope.events.push({
              title: '<i class="fa fa-wrench" aria-hidden="true"></i>&nbsp;&nbsp; ' + task.name,
              eventType: 'task',
              eventId: task._id,
              displayEventTimes: false, // Indicates whether need to show time or not.
              startsAt: moment(task.metrics[task.metrics.length - 1].startDate || task.metrics[task.metrics.length - 1].targetstartDate).toDate(),
              endsAt: moment(task.metrics[task.metrics.length - 1].endDate || task.metrics[task.metrics.length - 1].targetEndDate).toDate(),
              draggable: true
            });
          } else {

            $scope.events.push({
              title: '<i class="fa fa-wrench" aria-hidden="true"></i>&nbsp;&nbsp; ' + task.name,
              eventType: 'task',
              eventId: task._id,
              displayEventTimes: false, // Indicates whether need to show time or not.
              startsAt: moment(task.metrics[task.metrics.length - 1].startDate || task.metrics[task.metrics.length - 1].targetstartDate).toDate(),
              endsAt: moment(task.metrics[task.metrics.length - 1].endDate || task.metrics[task.metrics.length - 1].targetEndDate).toDate(),
              color: calendarConfig.colorTypes.success,
              draggable: true
            });
          }
        });

        _.each($scope.myAnomalies, function(anomalie) {
          $scope.events.push({
            title: '<i class="fa fa-bell-o" aria-hidden="true"></i>&nbsp;&nbsp; ' + anomalie.name, // The title of the event
            eventType: 'anomalie',
            eventId: anomalie._id,
            startsAt: moment(anomalie.date).toDate(),
            color: calendarConfig.colorTypes.important,
          });
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
          var actors = _.pluck(task.actors, '_id');
          if (actors.indexOf($scope.currentUser._id) > -1) {
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
      var myparams = {
        params: {
          userId: $scope.currentUser._id
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
    $scope.calendarView = 'week';
    $scope.eventClicked = function(calendarEvent) {
      $location.path('/' + calendarEvent.eventType + '/' + calendarEvent.eventId);
    };

  });
