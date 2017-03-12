'use strict';
/*jshint loopfunc:true */

angular.module('boardOsApp')
  .controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $location, Auth, Notification, myLibrary, $filter, $timeout) {

    var initializing = true;
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = Auth.getCurrentUser();
    });

    // si cela n'existe pas
    $scope.task = {};
    $scope.task.date = Date.now();
    $scope.task.comments = [{
      text: 'create task',
      date: Date.now(),
      user: $scope.currentUser._id,
      auto: true
    }];
    $scope.task.metrics = [];
    $scope.task.metrics.push({
      progress: 0,
      timeSpent: 0,
      status: 'Not Started'
    });
    $scope.task.todos = [];
    $scope.task.actors = [$scope.currentUser._id];
    $scope.errors = {};
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

    $scope.opened = {};

    //todoList
    //***************
    $scope.show = 'All';
    $scope.currentShow = 0;
    $scope.filterToDo = '';
    $scope.filterComments = '';

    $scope.filterCommentType = {
      auto: true,
      manual: true
    };
    $scope.filterByAutoManual = function(comment) {
      return ($scope.filterCommentType.auto === true && comment.auto === true) || ($scope.filterCommentType.manual === true && comment.auto === false);
    };
    $scope.newTodo = {
      text: ''
    }; // ng-model need object to sync

    $scope.addTodo = function() {
      $scope.task.todos.push({
        text: $scope.newTodo.text,
        isDone: false
      });
      $scope.newTodo.text = ''; //Reset the text field.
    };
    $scope.changeStatusTodo = function(index) {
      $scope.task.todos[index].isDone = !$scope.task.todos[index].isDone;
    };


    $scope.$watch('task.metrics', function(newVal, oldVal) {
      if (!initializing) {
        _.each(newVal, function(metric) {

          // reestimated workload
          metric.projectedWorkload = metric.progress * metric.timeSpent / 100;

          // status
          if (metric.progress >= 100) {
            metric.status = 'Finished';
          } else if (metric.progress < 100 && metric.progress > 0) {
            metric.status = 'In Progress';
          } else {
            metric.status = 'Not Started';
          }
        });
      }
    }, true);

    /* Filter Function for All | Incomplete | Complete */
    $scope.showFn = function(todo) {
      if ($scope.show === 'All') {
        return true;
      } else if (todo.isDone && $scope.show === 'Complete') {
        return true;
      } else if (!todo.isDone && $scope.show === 'Incomplete') {
        return true;
      } else {
        return false;
      }
    };

    //comments
    //***************
    $scope.comment = {};
    $scope.addComment = function() {
      var maintenant = new Date().toISOString();
      $scope.task.comments.push({
        text: $scope.comment.text,
        auto: false,
        date: maintenant,
        user: {
          _id: $scope.currentUser._id
        }
      });
      $scope.comment.text = ''; //Reset the text field.
      $scope.update();
    };


    $scope.giveMeMyColor = function(value, category) {
      return myLibrary.giveMeMyColor(value, category);
    };

    $scope.open = function($event, elementOpened) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened[elementOpened] = !$scope.opened[elementOpened];
    };


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

    // *******************
    // Load a task
    // *******************
    $scope.loadTask = function() {
      $scope.currentTask = {};
      var taskId = $stateParams.id || $scope.task._id;
      if (taskId) {
        $scope.myPromise = $http.get('/api/taskFulls/' + taskId).success(function(task) {
          $scope.task = task;
          $timeout(function() {
            initializing = false;
          }, 500);
          //detect if late
          $scope.task.metrics.forEach(function(metric) {
            metric.lateStart = new Date(metric.startDate).setHours(0, 0, 0, 0) > new Date(metric.targetstartDate).setHours(0, 0, 0, 0);
            metric.lateEnd = new Date(metric.endDate).setHours(0, 0, 0, 0) > new Date(metric.targetEndDate).setHours(0, 0, 0, 0);
          });
        });
      } else {
        $timeout(function() {
          initializing = false;
        }, 500);
      }
    };

    $scope.loadTask();

    // *******************
    // create a new task
    // *******************
    $scope.create = function() {
      // Nouvelle tache
      $http.get('/api/tasks/search', {
        params: {
          activity: $scope.task.activity,
          context: $scope.task.context
        }
      }).success(function(alreadyExit) {
        if (alreadyExit.length === 0) {
          $http.post('/api/taskFulls', $scope.task).success(function(data) {
            var logInfo = 'Task "' + $scope.task.name + '" was created';
            Notification.success(logInfo);
            $location.path('/task/' + data._id);
          });
        } else {
          $scope.taskAlreadyExist.id = alreadyExit[0]._id;
          $scope.taskAlreadyExist.name = alreadyExit[0].name;
          $scope.messageCreation = 'This task (WBS) already exist, you must change either the activity or the context';
        }
      });
    };

    // *******************
    // create a new task
    // *******************
    $scope.update = function() {
      $http.put('/api/taskFulls/' + $scope.task._id, $scope.task).success(function(data) {
        var logInfo = 'Task "' + $scope.task.name + '" was updated';
        $timeout(function() {
          initializing = true;
          $scope.loadTask();
        }, 500);
        Notification.success(logInfo);
      });
    };

    $scope.$watch('task', function(newMap, previousMap) {
      if (initializing) {
        $timeout(function() {
          initializing = true;
        });
      } else {
        if (newMap !== previousMap) {
          var newObject = newMap;
          var previousObject = previousMap;
          for (var property in newObject) {
            // pour les non objects
            if (typeof newObject[property] !== 'object' && property !== '_id' && property !== '__v' && property !== 'date' && !angular.equals(newObject[property], previousObject[property])) {
              $scope.autoComment('set ' + property + ' to ' + newObject[property]);
            }
            // pour les objects
            if (typeof newObject[property] === 'object' && property !== 'comments' && !angular.equals(newObject[property], previousObject[property])) {
              angular.forEach(newObject[property], function(value, key) {
                var previousValue = previousObject[property][key];
                for (var subproperty in value) {
                  if (subproperty !== '$$hashKey' && subproperty !== '_id' && (!previousValue || !angular.equals(value[subproperty], previousValue[subproperty]))) {
                    if (subproperty.toLowerCase().indexOf('date') > -1) {
                      $scope.autoComment('set ' + subproperty + ' to ' + $filter('date')(value[subproperty], 'mediumDate') + '              [' + property + ':' + key.toString() + ']');
                    } else {
                      $scope.autoComment('set ' + subproperty + ' to ' + value[subproperty] + '              [' + property + ':' + key.toString() + ']');
                    }
                  }
                }
              });
            }
          }
        }
      }
    }, true);


    $scope.autoComment = function(text) {
      var maintenant = new Date().toISOString();
      $scope.task.comments.push({
        text: text,
        auto: true,
        date: maintenant,
        user: {
          _id: $scope.currentUser._id
        }
      });
      $scope.update();
    };

    $scope.save = function(form) {

      // si la form est valide
      delete $scope.task.__v;
      delete $scope.task.kpis;
      delete $scope.task.tasks;
      $scope.task.date = Date.now();

      if ($scope.task._id === undefined && $scope.task.activity !== undefined && $scope.task.context !== undefined) {
        // Nouvelle tache
        $http.get('/api/tasks/search', {
          params: {
            activity: $scope.task.activity,
            context: $scope.task.context
          }
        }).success(function(alreadyExit) {
          // si cela n'existe pas
          if (alreadyExit.length === 0) {
            $http.post('/api/fulltasks', $scope.task).success(function(data) {
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
    };


    $scope.delete = function() {
      bootbox.confirm('Are you sure to delete this task and all associated metrics ? It can NOT be undone.', function(result) {
        if (result) {
          $http.delete('/api/taskFulls/' + $scope.task._id).success(function() {
            var logInfo = 'Task "' + $scope.task.name + '" was deleted';
            Notification.success(logInfo);
            $location.path('/tasks');
          });
        }
      });
    };

    $scope.withdraw = function() {
      var withdrawnmetric = _.clone($scope.currentTask.metrics);
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
