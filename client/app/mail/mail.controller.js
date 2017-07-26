'use strict';

angular.module('boardOsApp')
  .controller('MailCtrl', function($scope, $http, socket, $interval) {

    $scope.sendMail = function() {
      $http.get('/api/mails').success(function(response) {
        $scope.message = response;
      });
    };

    /** TASK **/
    $scope.taskDoneNb = 0;
    $scope.taskStarted = [];
    $scope.taskEnded = [];

    $http.get('/api/taskFulls').success(function(data) {
      $scope.taskNb = data.length;
    });

    function updateNumber() {
      $scope.number++;
    }

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

    $scope.exportTasks = function() {

      $http.get('/api/taskFulls/exportXLS', {
        timeout: 60000
      }).success(function(response) {
        
        $scope.messageExportTask = 'Execution Done';
      }).error(function(data) {
        
      });
    };


    socket.on('taskFull:start', function(data) {
      $scope.taskStarted.push(data);
      $scope.taskNb = $scope.taskStarted.length;
    });

    socket.on('taskFull:run', function(data) {
      $scope.taskEnded.push(data);
      $scope.taskDoneNb = $scope.taskEnded.length;
    });

    /** DASHBOARD **/
    $scope.dashboardDoneNb = 0;
    $scope.dashboardStarted = [];
    $scope.dashboardEnded = [];

    $http.get('/api/dashboardCompletes').success(function(data) {
      $scope.dashboardNb = data.length;
    });

    function updateNumberDashboard() {
      $scope.numberDashboard++;
    }

    $scope.calculateDashboards = function() {
      $scope.dashboardDoneNb = 0;
      $scope.dashboardStarted = [];
      $scope.dashboardEnded = [];
      $scope.messageDashboard = 'Execution in progress ... please wait';
      $scope.numberDashboard = 0;
      var timer = $interval(updateNumberDashboard, 1000);
      $http.get('/api/dashboardCompletes/execute', {
        timeout: 60000
      }).success(function(response) {
        $scope.messageDashboard = 'Execution Done';
        $interval.cancel(timer);
        $scope.numberDashboard = 0;
        var diff = _.difference($scope.dashboardStarted, $scope.dashboardEnded);


      }).error(function(data) {

        $interval.cancel(timer);
        $scope.numberDashboard = 0;
        $scope.messageDashboard = 'Execution Done';
        var diff = _.difference($scope.dashboardStarted, $scope.dashboardEnded);


      });

    };

    socket.on('dashboardComplete:start', function(data) {
      $scope.dashboardStarted.push(data);
      $scope.dashboardNb = $scope.dashboardStarted.length;
    });

    socket.on('dashboardComplete:run', function(data) {
      $scope.dashboardEnded.push(data);
      $scope.dashboardDoneNb = $scope.dashboardEnded.length;
    });
  });
