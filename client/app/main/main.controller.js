'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function($scope, $rootScope, $http, myLibrary, Auth, $timeout, dateRangeService, $location, calendarConfig) {

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

          $scope.events = [];
          _.each($scope.myTasks, function(task) {
            if (task.metrics[task.metrics.length - 1].status !== 'Finished') {

              
              
              
              $scope.events.push({
                title: '<i class="fa fa-wrench" aria-hidden="true"></i>&nbsp;&nbsp; ' + task.name,
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
                draggable: true
              });
            } else {

              $scope.events.push({
                title: '<i class="fa fa-wrench" aria-hidden="true"></i>&nbsp;&nbsp; ' + task.name,
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
        });
      });
    });

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
