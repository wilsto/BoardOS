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

    // socket.on('taskComplete:save', function(data) {
    //   $scope.loadTask();
    // });

    $rootScope.$on('reloadTask', function(event, data) {
      
      $scope.loadTask();
    });

    $scope.refreshTask = function() {
      $scope.myPromise = $http.get('/api/taskCompletes/executeId/' + $scope.currentTask._id).success(function(response) {
        $scope.loadTask();
        
      });
    };

    $scope.loadTask = function() {
      $scope.currentTask = {};
      if ($stateParams.id) {
        $scope.myPromise = $http.get('/api/taskCompletes/' + $stateParams.id).success(function(task) {
          $scope.task = task;

          $scope.currentTask = task;
          $scope.task.activity_old = task.activity;
          $scope.task.context_old = task.context;

          $scope.updateWatch();

          //detect if late
          $scope.lateStart = new Date($scope.task.lastmetric.startDate).setHours(0, 0, 0, 0) > new Date($scope.task.startDate).setHours(0, 0, 0, 0);
          $scope.lateEnd = new Date($scope.task.lastmetric.endDate).setHours(0, 0, 0, 0) > new Date($scope.task.endDate).setHours(0, 0, 0, 0);

          // calcul des alertes
          var alertValue = _.pluck(_.pick(_.pluck(task.alerts, function(kpi) { // valeurs existantes
            return kpi.calcul.task;
          }), _.isNumber));
          var alertSum = _.reduce(alertValue, function(alertSum, kpicalcul) { // sum
            return alertSum + kpicalcul;
          });
          $scope.alertsNb = alertSum;

          // calcul des kpis
          var goalsValue = _.pluck(_.pick(_.pluck(task.kpis, function(kpi) { // valeurs existantes
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

    $scope.changeTab = function(e, tabNb) {
      $('.ver-inline-menu li').removeClass('active');
      $(e.target).closest('li').addClass('active');
      $scope.activeTab = tabNb;
    };

    $scope.watchThisTask = function() {
      $scope.myPromise = $http.post('/api/tasks/watch/' + $scope.currentTask._id + '/' + $scope.currentUser._id).success(function(data) {
        $scope.currentTask.watchers = data.watchers;
        var logInfo = 'Task watch "' + $scope.currentTask.name + '" was updated by ' + $scope.currentUser.name;
        $http.post('/api/logs', {
          info: logInfo,
          actor: $scope.currentUser
        });
        $scope.loadTask();
        Notification.success(logInfo);
      });
    };

    $scope.save = function(form) {
      $scope.submitted = true;

      // si la form est valide
      if (form.$valid) {
        delete $scope.task.__v;
        delete $scope.task.kpis;
        delete $scope.task.metrics;
        delete $scope.task.tasks;

        $scope.task.actor = $scope.currentUser;
        $scope.task.date = Date.now();

        if ($scope.task._id === undefined) {
          // Nouvelle tache
          $http.get('/api/tasks/search', {
            params: {
              activity: $scope.task.activity,
              context: $scope.task.context
            }
          }).success(function(alreadyExit) {
            // si cela n'existe pas
            if (alreadyExit.length === 0) {
              $http.post('/api/tasks', $scope.task).success(function(data) {
                var logInfo = 'Task "' + $scope.task.name + '" was created';
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
          $scope.task.activity_old = $scope.task.activity_old;
          $scope.task.context_old = $scope.task.context_old;
          $http.put('/api/tasks/' + $scope.task._id, $scope.task).success(function(data) {
            var logInfo = 'Task "' + $scope.task.name + '" was updated';
            $http.post('/api/logs', {
              info: logInfo,
              actor: $scope.currentUser
            });
            $scope.refreshTask();
            Notification.success(logInfo);
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

    $scope.withdraw = function() {
      var withdrawnmetric = _.clone($scope.currentTask.lastmetric);
      Auth.getCurrentUser(function(data) {
        delete withdrawnmetric._id;
        withdrawnmetric.status = 'Withdrawn';
        withdrawnmetric.comments = 'Finally Withdrawn';
        withdrawnmetric.actor = data;
        withdrawnmetric.date = new Date();

        bootbox.confirm('Are you sure to withdraw and close this task ?', function(result) {
          if (result) {
            $http.post('/api/metrics', withdrawnmetric).success(function(data) {
              var logInfo = 'The Task "' + $scope.currentTask.name + '" was withdrawn';

              $http.post('/api/logs', {
                info: logInfo,
                actor: $scope.currentUser
              });

              Notification.success(logInfo);
              $scope.loadTask();
            });
          }
        });
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
