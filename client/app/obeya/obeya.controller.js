'use strict';

angular.module('boardOsApp')
  .controller('ObeyaCtrl', function($scope, $http, Notification, $stateParams, $rootScope, dateRangeService) {

    $scope.obeyaMode = 'all';
    $scope.blnShowCard = {};
    $scope.blnShowCard.Milestones = false;
    $scope.blnShowCard.Milestone = false;
    $scope.filters = '';

    if ($stateParams.id) {
      // ouverture de l'obeya
      $scope.myPromise = $http.get('/api/dashboardCompletes/' + $stateParams.id).success(function(obeya) {
        $scope.obeya = obeya;

        // appel des activités en cours
        $rootScope.$broadcast('obeya:searchTasks', $scope.obeya);
      });
    }
    $scope.incrementSave = 0;

    $scope.NavCaroussel = function(increment) {

      // Effet sur le carrousel
      var carousel = document.getElementById('carousel');
      var panelCount = carousel.children.length;
      var theta = 0;
      if ($scope.incrementSave > -1 && $scope.incrementSave < 8) {
        $scope.incrementSave += increment;
      } else {
        if ($scope.incrementSave > 0) {
          $scope.incrementSave = 0;
        } else {
          $scope.incrementSave = 7;
        }
      }
      theta += (360 / panelCount) * $scope.incrementSave * -1;
      carousel.style.transform = 'translateZ( -288px ) rotateY(' + theta + 'deg)';

      // Effet sur les murs
      var wall = document.getElementById('Wall-' + $scope.incrementSave);
      var currdeg = 0;
      if (increment > 0) {
        currdeg = currdeg - 60;
      } else {
        currdeg = currdeg + 60;
      }
      // wall.css({
      //   '-webkit-transform': '1.0s rotateY(' + currdeg + 'deg)',
      //   '-moz-transform': '1.0s rotateY(' + currdeg + 'deg)',
      //   '-o-transform': '1.0s rotateY(' + currdeg + 'deg)',
      //   'transform': '1.0s rotateY(' + currdeg + 'deg)'
      // });;
    };

    $scope.showCard = function(card, filters) {

      $scope.filters = filters;
      $rootScope.$broadcast('obeya:searchContext', $scope.obeya);

      var incrementTo;
      switch (card) {
        case 'Milestones':
          incrementTo = 2;
          break;
        default:
          incrementTo = 0;
      }
      $scope.NavCaroussel(incrementTo - $scope.incrementSave);
    };

    $scope.hideCard = function(card) {
      $scope.blnShowCard[card] = false;
      $('#card' + card).toggleClass('fullscreen');
    };

    $scope.showContext = function(context) {
      console.log('context', context);
      $scope.milestone = context;
    };
    $scope.hideContext = function(context) {
      console.log('context', context);
      $scope.milestone = undefined;
    };

    // recherche des activités en cours
    $scope.$on('obeya:searchTasks', function(event, data) {
      $http.get('/api/dashboardCompletes/showTasks/' + $stateParams.id).success(function(tasks) {
        $scope.obeya.tasks = tasks;
        $scope.obeya.alltasksNb = $scope.obeya.tasks.length;
        $scope.obeya.openTasksNb = _.filter($scope.obeya.tasks, function(task) {
          return task.metrics[task.metrics.length - 1].status !== 'Finished';
        }).length;

        // Appel des engagement en cours
        $rootScope.$broadcast('obeya:searchContext', $scope.obeya);

        console.log('obeya', $scope.obeya);
      });

    });

    // recherche des engagement en cours
    $scope.$on('obeya:searchContext', function(event, data) {
      $http.get('/api/hierarchies/list/Context/obeya/' + $scope.obeya._id).success(function(hierarchies) {
        console.log('hierarchies', hierarchies);

        $scope.hierarchies = hierarchies;
        $scope.hierarchiesSelected = _.filter(hierarchies, function(hierarchie) {
          return hierarchie.longname.indexOf('FONCTIONNEMENT') > -1;
        });
        $scope.hierarchiesThisWeek = _.filter($scope.hierarchiesSelected, function(hierarchie) {
          return hierarchie.duedate > -1;
        });
        $scope.hierarchiesToEngage = _.filter($scope.hierarchiesSelected, function(hierarchie) {
          return hierarchie.status !== 'Engaged' && hierarchie.status !== 'Achieved' && hierarchie.status !== 'N/A';
        });
        $scope.hierarchiesWithAlerts = _.filter($scope.hierarchiesSelected, function(hierarchie) {
          return hierarchie.alerts > 0;
        });

        switch ($scope.filters) {
          case 'ToEngage':
            $scope.hierarchiesToshow = $scope.hierarchiesToEngage;
            break;
          default:
            $scope.hierarchiesToshow = $scope.hierarchies;
        }
        console.log('$scope.filters', $scope.filters);
        console.log('$scope.hierarchiesToshow', $scope.hierarchiesToshow);

      });
    });

    // Plan
    // ######

    $scope.createNode = function(data) {
      bootbox.prompt({
        title: 'Please Enter Name of this hierarchy',
        callback: function(result) {
          if (result) {
            $scope.hierarchies.push({
              id: 'ajson' + (Math.round(Math.random() * 100000)).toString(),
              parent: '#',
              text: result,
              longname: result
            });
            $scope.hierarchies = _.sortBy($scope.hierarchies, 'longname');
            $scope.$apply();
          }
        }
      });
    };

    $scope.newSubItem = function(hierarchy, index) {
      bootbox.prompt({
        title: 'Please Enter Name of this hierarchy',
        value: hierarchy.longname,
        callback: function(result) {
          if (result) {
            $scope.hierarchies.push({
              id: 'ajson' + (Math.round(Math.random() * 100000)).toString(),
              parent: hierarchy.id,
              text: result,
              longname: result
            });
            $scope.hierarchies = _.sortBy($scope.hierarchies, 'longname');
            Notification.success('Milestones ' + result + 'was created');
            $scope.saveMilestones();
          }
        }
      });
    };

    $scope.delete = function(hierarchy, index) {
      bootbox.confirm('Are you sure to remove "' + hierarchy.longname + '" ?', function(result) {
        if (result) {
          $scope.hierarchies.splice(index, 1);
          $scope.saveMilestones();
          Notification.success('Hierarchy "' + hierarchy.longname + '" was deleted');
        }
      });
    };

    $scope.saveMilestones = function() {
      $http.put('/api/hierarchies/Context', $scope.hierarchies).success(function(hierarchies) {
        $rootScope.$broadcast('obeya:searchContext', $scope.obeya);
      });
    };

    $scope.updateStatusMilestone = function(milestone, status) {
      _.each($scope.hierarchies, function(hierarchy) {
        if (hierarchy.id === milestone.id) {
          if (hierarchy.status === status) {
            delete hierarchy.status;
          } else {
            hierarchy.status = status;
          }

        }
      });
      Notification.success('Milestones ' + milestone.longname + ' was updated');
      $scope.saveMilestones();

    };

  });
