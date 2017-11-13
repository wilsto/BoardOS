'use strict';
/*jshint loopfunc:true */

angular.module('boardOsApp')
  .controller('TaskCtrl', function($rootScope, $scope, $http, $state, $stateParams, $location, $window, Auth, Notification, myLibrary, $filter, $timeout, $mdpDatePicker, $uibModal, focus) {

    // initializing
    var initializing = true;
    $scope.checked = false;
    $scope.size = '100px';
    $scope.parseFloat = parseFloat;
    $scope.forceExit = false;

    $scope.opened = {};


    Auth.getCurrentUser(function(data) {
      $scope.currentUser = Auth.getCurrentUser();
    });

    $scope.toggle = function() {
      $scope.checked = !$scope.checked;
    };

    $scope.sortme = {
      snap: true,
      revert: true,
      start: function(event, ui) {
        $scope.showTrash = true;
        $scope.$apply();
      },
      stop: function(event, ui) {
        $timeout(function() {
          $scope.showTrash = false;
        }, 3000);
      },
      remove: function(event, ui) {},
      sort: function(e) {},
      connectWith: '#trash-can'
    };

    $scope.trashcan = {
      update: function(event, ui) {
        //
        //$(ui.draggable).fadeOut(1000);
      }
    };

    // Mettre les informations transversales en mémoire
    $http.get('/api/hierarchies/listContext').success(function(contexts) {
      $rootScope.contexts = [];
      _.each(contexts, function(context) {
        $rootScope.contexts.push({
          longname: context
        });
      });
    });

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (fromState.name === 'task' && toState.name !== 'task' && !$scope.forceExit) {
        if ($scope.needToSave) {
          event.preventDefault();
          bootbox.confirm({
            message: 'Are you sure you want to exit task without saving ? All changed will be lost ',
            buttons: {
              confirm: {
                label: 'Yes',
                className: 'btn-danger'
              },
              cancel: {
                label: 'Oh No Thank You ',
                className: 'btn-success'
              }
            },
            callback: function(result) {
              if (result) {
                $scope.forceExit = true;
                $state.go(toState.name, toParams);
              }
            }
          });
        }
      }
    });

    // recherche des membres
    $http.get('/api/users/members').success(function(members) {
      $scope.members = members;
    });

    $scope.createNewTask = function(data) {
      switch (data) {
        case 'context':
          $location.path('/task//' + $scope.task.context);
          break;
        case 'activity':
          $location.path('/task///' + $scope.task.activity);
          break;
        case 'both':
          $location.path('/task//' + $scope.task.context + '/' + $scope.task.activity);
          break;
      }
    };

    //todoList
    //***************
    $scope.show = 'All';
    $scope.currentShow = 0;
    $scope.filterToDo = '';
    $scope.filterComments = '';
    $scope.filterAudit = '';
    $scope.openedPERT = false;
    $scope.filterCommentType = {
      auto: false,
      manual: true
    };
    $scope.filterByAutoManual = function(comment) {
      return ($scope.filterCommentType.auto === true && comment.auto === true) || ($scope.filterCommentType.manual === true && comment.auto === false);
    };
    $scope.newTodo = {
      text: ''
    }; // ng-model need object to sync
    var blnexecuteDashboard = false;


    $scope.createActionPlan = function() {
      var path = $location.protocol() + '://' + location.host + '/task////task/' + $scope.task._id;
      $window.open(path, '_blank');
    };

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

    $scope.changeStatusReviewTask = function() {
      $scope.task.reviewTask = !$scope.task.reviewTask;
    };

    $scope.markTaskAsSuccess = function() {
      if ($scope.task.success) {
        $scope.task.success = '';
      } else {
        bootbox.prompt({
          title: 'Please Enter a short sentence of this success',
          callback: function(result) {

            if (result) {
              $scope.task.success = result;
              $scope.$apply();

            }
          }
        });
      }
    };


    $scope.markAsDone = function() {
      $scope.task.metrics[0].startDate = $scope.task.metrics[0].targetstartDate;
      $scope.task.metrics[0].endDate = $scope.task.metrics[0].targetEndDate;
      $scope.task.metrics[0].timeSpent = $scope.task.metrics[0].targetLoad;
      $scope.task.metrics[0].progress = 100;

    };

    $scope.$watch('task.metrics', function(newVal, oldVal) {
      if (!initializing) {
        _.each(newVal, function(metric) {
          // status
          if (metric.progress >= 100) {
            metric.status = 'Finished';
          } else if (metric.progress < 100 && metric.progress > 0) {
            metric.status = 'In Progress';
            if (metric.startDate === undefined) {
              metric.startDate = new Date();
            }
          } else {
            metric.status = 'Not Started';
          }
        });
      }
    }, true);

    $scope.$watch('task', function(newMap, previousMap) {

      $scope.needToSave = !angular.equals($scope.currentTask, $scope.task);
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
                    if (property === 'metrics') {
                      blnexecuteDashboard = true;
                    }
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
      var currentUserId = $scope.currentUser._id;
      var userid = ($scope.task._id) ? {
        _id: currentUserId
      } : currentUserId;

      $scope.task.comments.push({
        text: text,
        auto: true,
        date: maintenant,
        user: userid
      });
    };

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
      //$scope.update();
    };


    $scope.giveMeMyColor = function(value, category) {
      return myLibrary.giveMeMyColor(value, category);
    };

    $scope.open = function($event, elementOpened) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened[elementOpened] = !$scope.opened[elementOpened];
    };

    $scope.reopen = function() {
      var modalInstance = $uibModal.open({
        templateUrl: 'reOpenModal.html',
        controller: 'ModalInstanceCtrl',
        backdrop: 'static',
        keyboard: false
      });

      modalInstance.result.then(function(result) {

        var maintenant = new Date().toISOString();
        $scope.task.comments.push({
          text: result.comment,
          auto: false,
          date: maintenant,
          user: {
            _id: $scope.currentUser._id
          }
        });
        $scope.task.metrics.push({
          reworkReason: result.reworkReason,
          targetstartDate: result.targetstartDate,
          targetEndDate: result.targetEndDate,
          targetLoad: result.targetLoad,
          trust: result.trust,
          progress: 0
        });

      });

    };


    $scope.createAnomaly = function() {
      var modalInstance = $uibModal.open({
        templateUrl: 'reOpenAnomaly.html',
        controller: 'ModalAnoInstanceCtrl',
        backdrop: 'static',
        keyboard: false
      });

      modalInstance.result.then(function(result) {
        var anomalie = {
          name: result.name,
          category: result.category,
          categoryDetails: result.categoryDetails,
          impact: result.impact,
          impactWorkload: result.impactWorkload,
          details: result.details,
          dueDate: result.dueDate
        };

        anomalie.sourceTasks = [];
        anomalie.sourceTasks.push($scope.task._id);
        anomalie.context = $scope.task.context;
        anomalie.activity = $scope.task.activity;

        anomalie.actor = $scope.currentUser._id;

        $scope.myPromise = $http.post('/api/anomalies', anomalie).success(function(data) {
          if (!$scope.task.anomalies) {
            $scope.task.anomalies = [];
          }
          $scope.AnomalyIsExpanded = true;
          $scope.task.anomalies.push(data);

          $scope.myPromise = $http.put('/api/taskFulls/' + $scope.task._id + '/false', $scope.task).success(function(dataTask) {
            $timeout(function() {
              initializing = true;
              blnexecuteDashboard = false;
              $scope.loadTask();
              var logInfo = 'Anomalie "' + data.name + '" was created';
              Notification.success(logInfo);

            }, 100);
          });
        });
      });

    };

    $rootScope.$on('reloadTask', function(event, data) {
      $scope.loadTask();
    });


    $scope.repeats = [{
        value: 1,
        text: 'Daily (Monday to Friday)',
        label: 'day(s)'
      },
      {
        value: 2,
        text: 'Weekly',
        label: 'week(s)'
      },
      {
        value: 3,
        text: 'Monthly',
        label: 'month(s)'
      },
      {
        value: 4,
        text: 'Yearly',
        label: 'year(s)'
      }
    ];
    $scope.repeatOn = [{
        value: 1,
        text: 'MO',
        label: 'Monday'
      },
      {
        value: 2,
        text: 'TU',
        label: 'Tuesday'
      },
      {
        value: 3,
        text: 'WE',
        label: 'Wednesday'
      },
      {
        value: 4,
        text: 'TH',
        label: 'Thursday'
      },
      {
        value: 5,
        text: 'FR',
        label: 'Friday'
      }
    ];

    $scope.showRepeatOn = function() {
      var selected = [];
      _.each($scope.repeatOn, function(s) {
        if ($scope.task.repeatOn && $scope.task.repeatOn.indexOf(s.value) >= 0) {
          selected.push(s.label);
        }
      });
      return selected.length ? selected.join(', ') : 'Not set';
    };


    // *******************
    // Load a task
    // ******************
    $scope.loadTask = function() {
      $scope.task = {};
      $scope.trash = [];
      $scope.showTrash = false;

      var taskId = $stateParams.id || $scope.task._id;

      $scope.TeamIsExpanded = (taskId === undefined);
      $scope.TeamIsExpanded = true;
      $scope.AnomalyIsExpanded = true;
      $scope.blnAddActor = false;
      $scope.actorselected = null;
      $scope.blnAddFollower = false;
      $scope.blnAssignSubtaskActor = false;
      $scope.OptionIsExpanded = (taskId === undefined);
      $scope.CommentIsExpanded = (taskId !== undefined);
      $scope.ActionPlanIsExpanded = (taskId !== undefined);
      $scope.blnRecurrence = $location.path().indexOf('/recurrentTask/') >= 0;

      if (taskId) {
        if (!$scope.blnRecurrence) {

          $scope.myPromise = $http.get('/api/taskFulls/' + taskId).success(function(task) {

            blnexecuteDashboard = false;
            $scope.task = task;
            $timeout(function() {
              initializing = false;
              $('#inactive').bootstrapToggle();
              $('#inactive').change(function() {
                $scope.task.active = !$scope.task.active;
                $scope.autoComment('set active to ' + !$scope.task.active);
              });
            }, 5);
            //detect if late
            $scope.task.metrics.forEach(function(metric) {
              metric.lateStart = new Date(metric.startDate).setHours(0, 0, 0, 0) > new Date(metric.targetstartDate).setHours(0, 0, 0, 0);
              metric.lateEnd = new Date(metric.endDate).setHours(0, 0, 0, 0) > new Date(metric.targetEndDate).setHours(0, 0, 0, 0);
            });
            if ($scope.task.active === undefined) {
              $scope.task.active = false;
            }

            $scope.currentTask = _.cloneDeep($scope.task);
            $rootScope.currentTaskName = {
              name: $scope.task.name,
              activity: $scope.task.activity,
              context: $scope.task.context
            };

            $scope.mePresentInActors = _.filter($scope.task.actors, function(actor) {
              return actor._id === $scope.currentUser._id;
            }).length > 0;

            $scope.mePresentInFollowers = _.filter($scope.task.followers, function(actor) {
              return actor._id === $scope.currentUser._id;
            }).length > 0;

            $scope.KPIIsExpanded = (task.metrics[0].status === 'Finished' || task.metrics[0].status === 'Withdrawn');
            $scope.ReviewIsExpanded = (task.metrics[0].status === 'Finished' || task.metrics[0].status === 'Withdrawn');

            $scope.manualComments = _.filter($scope.task.comments, function(comment) {
              return ($scope.filterCommentType.manual === true && comment.auto === false);
            });

          });
        } else {
          // Recurrent task to load
          $scope.myPromise = $http.get('/api/recurrentTasks/' + taskId).success(function(task) {
            $scope.task = task;
            $scope.currentTask = _.cloneDeep($scope.task);

          });
        }
      } else {
        $timeout(function() {
          // si cela n'existe pas
          $scope.task.context = $stateParams.context;
          $scope.task.activity = $stateParams.activity;
          $scope.task.actionPlan = $stateParams.actionPlan !== null && $stateParams.actionPlan !== undefined;

          if ($scope.blnRecurrence) {
            $scope.task.repeats = $scope.repeats[1];
            $scope.task.repeatEvery = 1;
            $scope.task.repeatOn = [1];
            $scope.task.repeatEndAfter = 0;
          }

          $scope.task.previousTasks = [];
          $scope.task.anomalies = [];
          if ($stateParams.actionPlan === 'task') {
            $scope.task.previousTasks.push($stateParams.previousId);
          }
          if ($stateParams.actionPlan === 'anomaly') {
            $scope.task.anomalies.push($stateParams.previousId);
          }
          if ($stateParams.actionPlan === 'dashboard') {
            // nothing
          }

          $scope.task.nextTasks = [];
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
          $scope.task.actors = [{
            _id: $scope.currentUser._id,
            name: $scope.currentUser.name,
            avatar: $scope.currentUser.avatar
          }];
          $scope.task.followers = [];
          $scope.errors = {};
          $scope.taskAlreadyExist = {
            id: null,
            name: null
          };
          $scope.currentTask = _.cloneDeep($scope.task);


        }, 500);

        $timeout(function() {
          initializing = false;
        }, 800);
      }
    };

    $scope.loadTask();

    // *******************
    // create a new task
    // *******************
    $scope.create = function() {
      if ($scope.blnRecurrence === false) {

        // Nouvelle tache
        $scope.myPromise = $http.get('/api/taskFulls/search', {
          params: {
            activity: $scope.task.activity,
            context: $scope.task.context
          }
        }).success(function(alreadyExit) {
          if (alreadyExit.length === 0) {
            $scope.myPromise = $http.post('/api/taskFulls', $scope.task).success(function(data) {
              var logInfo = 'Task "' + $scope.task.name + '" was created';
              blnexecuteDashboard = false;
              Notification.success(logInfo);
              $location.path('/task/' + data._id);
            });
          } else {
            $scope.taskAlreadyExist.id = alreadyExit[0]._id;
            $scope.taskAlreadyExist.name = alreadyExit[0].name;
            $scope.messageCreation = 'This task (WBS) already exist, you must change either the activity or the context';
          }
        });
      } else {
        // Nouvelle recurrence de tache

        $scope.myPromise = $http.post('/api/recurrentTasks', $scope.task).success(function(data) {
          var logInfo = 'Recurring Task "' + $scope.task.name + '" was created';
          blnexecuteDashboard = false;
          Notification.success(logInfo);
          $location.path('/recurrentTask/' + data._id);
        });

      }

    };

    // *******************
    // update a task
    // *******************
    $scope.update = function() {
      if (!$scope.blnRecurrence) {
        $scope.myPromise = $http.put('/api/taskFulls/' + $scope.task._id + '/' + blnexecuteDashboard, $scope.task).success(function(data) {
          var logInfo = 'Task "' + $scope.task.name + '" was updated';
          $timeout(function() {
            initializing = true;
            blnexecuteDashboard = false;
            $scope.loadTask();
          }, 100);
          Notification.success(logInfo);
        });
      } else {
        $scope.myPromise = $http.put('/api/recurrentTasks/' + $scope.task._id, $scope.task).success(function(data) {
          var logInfo = 'Recurring Task "' + $scope.task.name + '" was updated';
          $timeout(function() {
            initializing = true;
            blnexecuteDashboard = false;
            $scope.loadTask();
          }, 100);
          Notification.success(logInfo);
        });
      }
    };

    $scope.refreshTask = function() {
      $scope.myPromise = $http.put('/api/taskFulls/' + $scope.task._id + '/true', $scope.task).success(function(data) {
        var logInfo = 'Task "' + $scope.task.name + '" was recalculated';
        $timeout(function() {
          initializing = true;
          blnexecuteDashboard = false;
          $scope.loadTask();
        }, 500);
        Notification.success(logInfo);
      });
    };

    $scope.delete = function() {
      $scope.checked = false;
      if (!$scope.blnRecurrence) {

        bootbox.confirm('Are you sure to delete this task ? It can NOT be undone.', function(result) {
          if (result) {
            $scope.myPromise = $http.delete('/api/taskFulls/' + $scope.task._id).success(function() {
              var logInfo = 'Task "' + $scope.task.name + '" was deleted';
              Notification.success(logInfo);
              $location.path('/');
            });
          }
        });
      } else {
        // Nouvelle recurrence de tache
        bootbox.confirm('Are you sure to delete this recurring task ? It can NOT be undone.', function(result) {
          if (result) {
            $scope.myPromise = $http.delete('/api/recurrentTasks/' + $scope.task._id).success(function() {
              var logInfo = 'Recurring Task "' + $scope.task.name + '" was deleted';
              Notification.success(logInfo);
              $location.path('/settings');
            });
          }
        });
      }
    };

    $scope.withdraw = function() {
      bootbox.confirm('Are you sure to withdraw and close the task "' + $scope.task.name + '" ?', function(result) {
        if (result) {
          $scope.task.metrics[$scope.task.metrics.length - 1].status = 'Withdrawn';
          $http.put('/api/taskFulls/' + $scope.task._id + '/true', $scope.task).success(function(data) {
            var logInfo = 'Task "' + $scope.task.name + '" was withdrawn';
            $timeout(function() {
              initializing = true;
              $scope.loadTask();
            }, 500);
            Notification.success(logInfo);
          });
        }
      });
    };

    $scope.standardPERT = function() {
      $scope.openedPERT = !$scope.openedPERT;
      // Nouvelle tache
      $http.get('/api/taskFulls/standardPERT', {
        params: {
          activity: $scope.task.activity,
          context: $scope.task.context
        }
      }).success(function(pertTasks) {

        $scope.pertTasks = pertTasks;
      });
    };


    // *******************
    // add an actor
    // *******************
    //

    $scope.memberNamesWith = function(member, viewValue) {
      if (typeof member.name !== 'undefined') {
        return member.name.toLowerCase().indexOf(viewValue.toLowerCase()) >= 0;
      }
    };

    $scope.openAddActorBox = function() {
      focus('actorselected');
      $scope.blnAddActor = true;
    };

    $scope.closeAddActorBox = function() {
      $scope.actorselected = null;
      $scope.blnAddActor = false;
    };


    $scope.addActor = function(member) {
      var index = _.indexOf(_.pluck($scope.task.actors, '_id'), member._id);
      if (index < 0) {
        $scope.task.actors.push(member);
        $scope.blnAddActor = false;
        $scope.actorselected = null;
      } else {
        Notification.warning('Actor "' + member.name + '" already present in list');
      }
    };

    $scope.addMeToActor = function() {
      var member = _.filter($scope.members, function(member) {
        return member._id === $scope.currentUser._id;
      })[0];
      $scope.task.actors.push(member);
      $scope.blnAddActor = false;
      $scope.actorselected = null;

    };

    $scope.removeMeToActor = function() {
      $scope.task.actors = _.without($scope.task.actors, _.findWhere($scope.task.actors, {
        _id: $scope.currentUser._id
      }));
      //$scope.update();
    };

    $scope.removeActor = function(data, index) {


      $scope.task.actors.splice(index, 1);
    };

    // *******************
    // add a follower
    // *******************
    //
    $scope.openAddFollowerBox = function() {
      focus('followerselected');
      $scope.blnAddFollower = true;
    };

    $scope.closeAddFollowerBox = function() {
      $scope.blnAddFollower = false;
      $scope.followerselected = null;
    };

    $scope.addFollower = function(member) {
      var index = _.indexOf(_.pluck($scope.task.followers, '_id'), member._id);
      if (index < 0) {
        $scope.task.followers.push(member);
        $scope.blnAddFollower = false;
        $scope.followerselected = null;
      } else {
        Notification.warning('Follower "' + member.name + '" already present in list');
      }
    };

    $scope.addMeToFollower = function() {
      var member = _.filter($scope.members, function(member) {
        return member._id === $scope.currentUser._id;
      })[0];
      $scope.task.followers.push(member);
      $scope.blnAddFollower = false;
      $scope.followerselected = null;
    };

    $scope.removeMeToFollower = function() {
      $scope.task.followers = _.without($scope.task.followers, _.findWhere($scope.task.followers, {
        _id: $scope.currentUser._id
      }));
      //$scope.update();
      $scope.loadTask();
    };


    // *******************
    // add a subtaskactor
    // *******************
    $scope.AssignSubtTaskActor = function(todo) {
      $scope.blnAssignSubtaskActor = true;
      $scope.currentTodo = todo;
    };

    $scope.addSubTaskActor = function(member) {
      $scope.currentTodo.actor = member;
      $scope.blnAssignSubtaskActor = false;
    };

    $scope.addMeToSubTaskActor = function() {
      var member = _.filter($scope.members, function(member) {
        return member._id === $scope.currentUser._id;
      })[0];
      $scope.currentTodo.actor = member;
      $scope.blnAssignSubtaskActor = false;
    };

    $scope.showTodoDatePicker = function(todo, ev) {
      var currentdate = (todo.date) ? new Date(todo.date) : new Date();
      $mdpDatePicker(currentdate, {
        targetEvent: ev
      }).then(function(selectedDate) {
        todo.date = selectedDate.toISOString();
      });
    };

    $scope.showDatePicker = function(item, datename, ev) {
      var currentdate = (item[datename]) ? new Date(item[datename]) : new Date();
      $mdpDatePicker(currentdate, {
        targetEvent: ev
      }).then(function(selectedDate) {
        item[datename] = selectedDate.toISOString();

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

    function average(arr) {
      return _.reduce(arr, function(memo, num) {
        return memo + num;
      }, 0) / (arr.length === 0 ? 1 : arr.length);
    }

    $scope.calcAverage = function(tasks, item) {
      var test = _.chain(tasks)
        .pluck('metrics')
        .flatten()
        .pluck('timeSpent')
        .unique()
        .value();

      return {
        average: parseFloat(average(test).toFixed(2)),
        min: parseFloat(_.min(test).toFixed(2)),
        max: parseFloat(_.max(test).toFixed(2))
      };
    };


  })
  .controller('ModalInstanceCtrl', function($scope, $mdpDatePicker, $uibModalInstance) {
    $scope.selected = {
      reworkReason: null,
      comment: null,
      targetstartDate: null,
      targetEndDate: null,
      targetload: null,
    };

    $scope.showDatePicker = function(item, datename, ev) {
      var currentdate = (item[datename]) ? new Date(item[datename]) : new Date();
      $mdpDatePicker(currentdate, {
        targetEvent: ev
      }).then(function(selectedDate) {
        item[datename] = selectedDate.toISOString();
      });
    };

    $scope.ok = function() {
      $uibModalInstance.close($scope.selected);
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })
  .controller('ModalAnoInstanceCtrl', function($scope, $mdpDatePicker, $uibModalInstance, $filter) {
    $scope.selected = {
      impact: null,
      category: null,
      dueDate: undefined
    };

    $scope.showDatePicker = function(item, datename, ev) {
      var currentdate = (item[datename]) ? new Date(item[datename]) : new Date();
      $mdpDatePicker(currentdate, {
        targetEvent: ev
      }).then(function(selectedDate) {
        item[datename] = selectedDate.toISOString();
      });
    };

    $scope.ok = function() {
      $uibModalInstance.close($scope.selected);
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };


    $scope.impacts = [{
        value: 'Blocking',
        text: 'Blocking'
      },
      {
        value: 'Critic',
        text: 'Critic'
      },
      {
        value: 'Irritating',
        text: 'Irritating'
      }
    ];

    $scope.showImpacts = function() {
      var selected = $filter('filter')($scope.impacts, {
        value: $scope.selected.impact
      });
      return ($scope.selected.impact && selected.length) ? selected[0].text : 'Not set';
    };

    $scope.categories = [{
        value: 'Process',
        text: 'Process'
      },
      {
        value: 'RACI',
        text: 'RACI'
      },
      {
        value: 'Tools',
        text: 'Tools'
      },
      {
        value: 'Competencies',
        text: 'Competencies'
      },
      {
        value: 'Communication',
        text: 'Communication'
      }
    ];

    $scope.showCategories = function() {
      var checklist = [];
      _.each($scope.categories, function(s) {
        if ($scope.selected.category && $scope.selected.category.indexOf(s.value) >= 0) {
          checklist.push(s.text);
        }
      });
      return checklist.length ? checklist.join(', ') : 'Not set';
    };

  });
