'use strict';
/*jshint loopfunc:true */

angular.module('boardOsApp')
  .controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $location, Auth, Notification, myLibrary, $filter, $timeout, $mdpDatePicker, $uibModal, focus) {

    $scope.parseFloat = parseFloat;

    var initializing = true;
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = Auth.getCurrentUser();
    });

    // Mettre les informations transversales en mémoire
    $http.get('/api/hierarchies/listContext').success(function(contexts) {
      $rootScope.contexts = [];
      _.each(contexts, function(context) {
        $rootScope.contexts.push({
          longname: context
        });
      });
    });

    // recherche des membres
    $http.get('/api/users/members').success(function(members) {
      $scope.members = members;
    });


    $scope.isAdmin = false;
    Auth.isAdmin(function(data) {
      $scope.isAdmin = data;
    });

    $scope.isManager = false;
    Auth.isManager(function(data) {
      $scope.isManager = data;
    });

    $scope.opened = {};

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

    function calcBusinessDays(dDate1, dDate2) { // input given as Date objects
      dDate1 = new Date(dDate1);
      dDate2 = new Date(dDate2);

      var iWeeks, iDateDiff, iAdjust = 0;
      if (dDate2 < dDate1) {
        return -1;
      } // error code if dates transposed
      var iWeekday1 = dDate1.getDay(); // day of week
      var iWeekday2 = dDate2.getDay();
      iWeekday1 = (iWeekday1 === 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
      iWeekday2 = (iWeekday2 === 0) ? 7 : iWeekday2;
      if ((iWeekday1 > 5) && (iWeekday2 > 5)) {
        iAdjust = 1; // adjustment if both days on weekend
      }
      iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
      iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;

      // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
      iWeeks = Math.floor((dDate2.getTime() - dDate1.getTime()) / 604800000);

      if (iWeekday1 <= iWeekday2) {
        iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1);
      } else {
        iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2);
      }

      iDateDiff -= iAdjust; // take into account both days on weekend

      return (iDateDiff + 1); // add 1 because dates are inclusive
    }

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

          // // reestimated workload
          // metric.projectedWorkload = (metric.progress > 0) ? Math.round(1000 * metric.timeSpent * 100 / parseFloat(metric.progress)) / 1000 : metric.targetLoad;
          // metric.duration = calcBusinessDays(metric.startDate || metric.targetstartDate, metric.endDate || metric.targetEndDate);

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
      $rootScope.currentTaskName = {
        name: newMap.name,
        activity: newMap.activity,
        context: newMap.context
      };
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
          if ($scope.task._id !== undefined) {
            $scope.update();
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

    $scope.reopen = function() {

      var ModalInstanceCtrl = function($scope, $uibModalInstance) {
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
      };

      var modalInstance = $uibModal.open({
        templateUrl: 'reOpenModal.html',
        controller: ModalInstanceCtrl,
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
          progress: 0
        });

      });

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
    // ******************
    $scope.loadTask = function() {
      $scope.task = {};
      $scope.currentTask = {};
      var taskId = $stateParams.id || $scope.task._id;
      $scope.TeamIsExpanded = (taskId === undefined);
      $scope.TeamIsExpanded = true;
      $scope.blnAddActor = false;
      $scope.actorselected = null;
      $scope.blnAddFollower = false;
      $scope.blnAssignSubtaskActor = false;
      $scope.OptionIsExpanded = (taskId === undefined);
      $scope.CommentIsExpanded = (taskId !== undefined);
      if (taskId) {
        $scope.myPromise = $http.get('/api/taskFulls/' + taskId).success(function(task) {
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
          $scope.mePresentInActors = _.filter($scope.task.actors, function(actor) {
            return actor._id === $scope.currentUser._id;
          }).length > 0;

          $scope.mePresentInFollowers = _.filter($scope.task.followers, function(actor) {
            return actor._id === $scope.currentUser._id;
          }).length > 0;

          $scope.KPIIsExpanded = (task.metrics[0].status === 'Finished' || task.metrics[0].status === 'Withdrawn');
          $scope.ReviewIsExpanded = (task.metrics[0].status === 'Finished' || task.metrics[0].status === 'Withdrawn');
          $scope.ActionPlanIsExpanded = (task.metrics[0].status === 'Finished' || task.metrics[0].status === 'Withdrawn');
        });
      } else {
        // si cela n'existe pas
        $scope.task.context = $stateParams.context;
        $scope.task.activity = $stateParams.activity;
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
      $http.get('/api/taskFulls/search', {
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
    // update a task
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
      $scope.update();
      $scope.loadTask();
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
      $scope.update();
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
    };

    $scope.addMeToSubTaskActor = function() {
      var member = _.filter($scope.members, function(member) {
        return member._id === $scope.currentUser._id;
      })[0];
      $scope.currentTodo.actor = member;
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




    $scope.save = function(form) {

      // si la form est valide
      delete $scope.task.__v;
      delete $scope.task.kpis;
      delete $scope.task.tasks;
      $scope.task.date = Date.now();

      if ($scope.task._id === undefined && $scope.task.activity !== undefined && $scope.task.context !== undefined) {
        // Nouvelle tache
        $http.get('/api/taskFulls/search', {
          params: {
            activity: $scope.task.activity,
            context: $scope.task.context
          }
        }).success(function(alreadyExit) {
          // si cela n'existe pas
          if (alreadyExit.length === 0) {
            $http.post('/api/taskFulls', $scope.task).success(function(data) {
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
        $http.put('/api/taskFulls/' + $scope.task._id, $scope.task).success(function(data) {
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
      bootbox.confirm('Are you sure to delete this task ? It can NOT be undone.', function(result) {
        if (result) {
          $http.delete('/api/taskFulls/' + $scope.task._id).success(function() {
            var logInfo = 'Task "' + $scope.task.name + '" was deleted';
            Notification.success(logInfo);
            $location.path('/');
          });
        }
      });
    };

    $scope.withdraw = function() {
      bootbox.confirm('Are you sure to withdraw and close the task "' + $scope.task.name + '" ?', function(result) {

        if (result) {
          $scope.task.metrics[$scope.task.metrics.length - 1].status = 'Withdrawn';

          $http.put('/api/taskFulls/' + $scope.task._id, $scope.task).success(function(data) {

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


  });
