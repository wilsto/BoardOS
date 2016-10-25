'use strict';

angular.module('boardOsApp')
  .controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $location, Auth, Notification) {

    $scope.activeTab = 1;
    $scope.errors = {};
    $scope.task = {};
    $scope.taskAlreadyExist = {
      id: null,
      name: null
    };

    $scope.isAdmin = false;
    Auth.isAdmin(function(data) {
      $scope.isAdmin = data;
    });

    $scope.isManager = false;
    Auth.isManager(function(data) {
      $scope.isManager = data;
    });

    $scope.loadTask = function() {
      $scope.currentTask = {};
      if ($stateParams.id) {
        $http.get('/api/tasks/' + $stateParams.id).success(function(data) {
          $scope.task = data;

          $scope.currentTask = data.tasks[0];

          _.sortBy($scope.currentTask.metrics, 'date');
          $scope.task.activity_old = data.activity;
          $scope.task.context_old = data.context;
          $scope.updateWatch();

          // calcul des Kpis
          var kpis = data.kpis;

          // calcul des alertes
          var alertKPI = _.filter(kpis, function(kpi) { // filtre
            return kpi.category === 'Alert';
          });
          var alertValue = _.pluck(_.pick(_.pluck(alertKPI, function(kpi) { // valeurs existantes
            return kpi.calcul.task;
          }), _.isNumber));
          var alertSum = _.reduce(alertValue, function(alertSum, kpicalcul) { // sum
            return alertSum + kpicalcul;
          });
          $scope.alertsNb = alertSum;

          // calcul des objectifs
          var goalsKPI = _.filter(kpis, function(kpi) { // filtre
            return kpi.category === 'Goal';
          });
          var goalsValue = _.pluck(_.pick(_.pluck(goalsKPI, function(kpi) { // valeurs existantes
            return kpi.calcul.task;
          }), _.isNumber));
          var goalsSum = _.reduce(goalsValue, function(goalsSum, kpicalcul) { // sum
            return goalsSum + kpicalcul;
          });
          $scope.goalsNb = parseInt(goalsSum / goalsValue.length); // moyenne
        });
      }
    };

    $scope.updateWatch = function() {
      $scope.taskIsWatched = (_.intersection([$scope.currentUser._id], _.pluck($scope.currentTask.watchers, '_id')).length > 0) ? 'YES' : 'NO';
    };

    $scope.loadTask();

    $rootScope.$on('reloadTask', function(data) {
      $scope.loadTask();
    });

    $scope.changeTab = function(e, tabNb) {
      $('.ver-inline-menu li').removeClass('active');
      $(e.target).closest('li').addClass('active');
      $scope.activeTab = tabNb;
    };

    $scope.watchThisTask = function() {
      console.log('$SCOPE.CURRENTTASK', $scope.currentTask);
      console.log('$SCOPE.task', $scope.task);
      $http.post('/api/tasks/watch/' + $scope.currentTask._id + '/' + $scope.currentUser._id).success(function(data) {
        $scope.currentTask.watchers = data.watchers;
        var logInfo = 'Task watch "' + $scope.currentTask.name + '" was updated by ' + $scope.currentUser.name;
        $http.post('/api/logs', {
          info: logInfo,
          actor: $scope.currentUser
        });
        Notification.success(logInfo);
        $scope.loadTask();
      });
    };

    $scope.save = function(form) {
      $scope.submitted = true;

      // si la form est valide
      if (form.$valid) {


        delete $scope.currentTask.__v;
        delete $scope.currentTask.kpis;
        delete $scope.currentTask.metrics;
        delete $scope.currentTask.tasks;

        $scope.currentTask.actor = $scope.currentUser;
        $scope.currentTask.date = Date.now();

        if (typeof $scope.currentTask._id === 'undefined') {
          // Nouvelle tache
          $http.get('/api/tasks/search', {
            params: {
              activity: $scope.currentTask.activity,
              context: $scope.currentTask.context
            }
          }).success(function(alreadyExit) {
            // si cela n'existe pas
            if (alreadyExit.length === 0) {
              $http.post('/api/tasks', $scope.currentTask).success(function(data) {
                var logInfo = 'Task "' + $scope.currentTask.name + '" was created';
                $http.post('/api/logs', {
                  info: logInfo,
                  actor: $scope.currentUser
                });
                Notification.success(logInfo);

                $location.path('/task/' + data._id);
              });
            } else {
              $scope.taskAlreadyExist.id = alreadyExit[0]._id;
              $scope.taskAlreadyExist.name = alreadyExit[0].name;
            }
          });
        } else {
          // tache déjà existante en cours de modification
          $scope.currentTask.activity_old = $scope.task.activity_old;
          $scope.currentTask.context_old = $scope.task.context_old;
          $http.put('/api/tasks/' + $scope.currentTask._id, $scope.currentTask).success(function(data) {
            var logInfo = 'Task "' + $scope.currentTask.name + '" was updated';
            $http.post('/api/logs', {
              info: logInfo,
              actor: $scope.currentUser
            });
            Notification.success(logInfo);

            $scope.loadTask();
          });
        }
      }
    };

    $scope.delete = function() {
      bootbox.confirm('Are you sure to delete this task and all associated metrics ? It can NOT be undone.', function(result) {
        if (result) {
          $http.delete('/api/tasks/' + $scope.task._id).success(function() {
            var logInfo = 'Task "' + $scope.task.name + '" was deleted';
            $http.post('/api/logs', {
              info: logInfo,
              actor: $scope.currentUser
            });
            Notification.success(logInfo);

            $location.path('/tasks');
          });
        }
      });
    };


    $scope.showWeeks = true;

    $scope.today = function() {
      $scope.date = new Date();
    };
    $scope.today();

    $scope.toggleWeeks = function() {
      $scope.showWeeks = !$scope.showWeeks;
    };

    $scope.clear = function() {
      $scope.date = null;
    };

    // Disable weekend selection
    $scope.disabled = function(date, mode) {
      return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
    };

    $scope.toggleMin = function() {
      $scope.minDate = ($scope.minDate) ? null : new Date();
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

    $scope.dateOptions = {
      'year-format': '"yyyy"',
      'starting-day': 1
    };

    $scope.format = 'dd-MMMM-yyyy';

  });
