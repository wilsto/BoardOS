'use strict';

angular.module('boardOsApp')
  .controller('MailCtrl', function($scope, $http, socket, $interval) {
    $scope.taskDoneNb = 0;
    $scope.taskStarted = [];
    $scope.taskEnded = [];

    function updateNumber() {
      $scope.number++;
    }

    $scope.sendMail = function() {
      $http.get('/api/mails').success(function(response) {
        $scope.message = response;
      });
    };
    $scope.calculateTasks = function() {
      $scope.taskDoneNb = 0;
      $scope.taskStarted = [];
      $scope.taskEnded = [];
      $scope.messageTask = 'Execution in progress ... please wait';
      $scope.number = 0;
      var timer = $interval(updateNumber, 1000);
      $http.get('/api/taskFulls/execute', {
        timeout: 60000
      }).success(function(response) {
        $scope.messageTask = 'Execution Done';
        $interval.cancel(timer);
        $scope.number = 0;
        var diff = _.difference($scope.taskStarted, $scope.taskEnded);
        
      }).error(function(data) {
        
        $interval.cancel(timer);
        $scope.number = 0;
        $scope.messageTask = 'Execution Done';
        var diff = _.difference($scope.taskStarted, $scope.taskEnded);
        
      });
    };

    $http.get('/api/taskFulls').success(function(data) {
      $scope.taskNb = data.length;
    });

    socket.on('taskFull:start', function(data) {
      $scope.taskStarted.push(data);
      $scope.taskNb = $scope.taskStarted.length;
    });

    socket.on('taskFull:run', function(data) {
      $scope.taskEnded.push(data);
      $scope.taskDoneNb = $scope.taskEnded.length;
    });

    $scope.calculateDashboards = function() {
      $http.get('/api/dashboardCompletes/execute').success(function(response) {
        $scope.message = response;
      });
    };
  })
  .filter('timeFilter', function() {
    return function(number) {
      var seconds;
      var minutes;
      var hours;

      if (number < 60) {
        seconds = number;
      } else if (number >= 60 && number <= 3600) {
        minutes = Math.floor(number / 60);
        seconds = number % 60;
      } else {
        hours = Math.floor(number / 3600);
        minutes = Math.floor((number % 3600) / 60);
        seconds = Math.floor((number % 3600) % 60);
      }
      seconds = seconds < 10 ? '0' + seconds : seconds;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      hours = hours < 10 ? '0' + hours : hours;

      return hours + ':' + minutes + ':' + seconds;
    };
  });
