'use strict';

angular.module('boardOsApp')
  .controller('ObeyaCtrl', function($scope, $http, Notification, $stateParams, $rootScope, dateRangeService, VisDataSet, $timeout, Milestones, Tasks) {

    $scope.walls = [{
      id: 0,
      title: 'Summary',
      name: 'Summary'
    }, {
      id: 1,
      title: 'News & People',
      name: 'News'
    }, {
      id: 2,
      title: 'Engagements',
      name: 'Milestones'
    }, {
      id: 3,
      title: 'Tasks',
      name: 'Tasks'
    }, {
      id: 4,
      title: 'Performance',
      name: 'Performance'
    }, {
      id: 5,
      title: 'ProblemSolving',
      name: 'ProblemSolving'
    }, {
      id: 6,
      title: 'Process',
      name: 'Process'
    }, {
      id: 7,
      title: 'Properties',
      name: 'Properties'
    }];

    $scope.activeWall = _.filter($scope.walls, function(wall) {
      return wall.id === 0;
    })[0];

    $scope.obeyaMode = 'all';
    $scope.filters = '';

    $scope.viewMode = {};
    $scope.viewMode.Milestones = 'Timeline';
    $scope.viewMode.Tasks = 'PDCA';



    if ($stateParams.id) {
      // ouverture de l'obeya
      $scope.myPromise = $http.get('/api/dashboardCompletes/' + $stateParams.id).success(function(obeya) {
        $scope.obeya = obeya;

        $scope.obeya.milestones = new Milestones($scope.obeya);
        $scope.obeya.tasks = new Tasks($scope.obeya);

        // appel des activités en cours
        $rootScope.$broadcast('obeya:searchTasks', $scope.obeya);
      });
    }

    $scope.NavCaroussel = function(increment) {

      // Effet sur le carrousel
      var carousel = document.getElementById('carousel');
      var panelCount = carousel.children.length;
      var theta = 0;
      var wallId = $scope.activeWall.id;
      if ($scope.activeWall.id > -1 && $scope.activeWall.id < 8) {
        wallId += increment;
      } else {
        if (wallId > 0) {
          wallId = 0;
        } else {
          wallId = 7;
        }
      }
      $scope.activeWall = _.filter($scope.walls, function(wall) {
        return wall.id === wallId;
      })[0];
      theta += (360 / panelCount) * $scope.activeWall.id * -1;
      carousel.style.transform = 'translateZ( -288px ) rotateY(' + theta + 'deg)';

      // Effet sur les murs
      // var wall = document.getElementById('Wall-' + $scope.activeWall.id);
      // var currdeg = 0;
      // if (increment > 0) {
      //   currdeg = currdeg - 60;
      // } else {
      //   currdeg = currdeg + 60;
      // }
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
        case 'Tasks':
          incrementTo = 3;
          break;
        default:
          incrementTo = 0;
      }
      $scope.NavCaroussel(incrementTo - $scope.activeWall.id);
    };

    $scope.hideCard = function(card) {
      $scope.blnShowCard[card] = false;
      $('#card' + card).toggleClass('fullscreen');
    };

    $scope.showContext = function(context) {
      $scope.milestone = context;
    };
    $scope.hideContext = function(context) {
      $scope.milestone = undefined;
    };





    // recherche des activités en cours
    $scope.$on('obeya:searchTasks', function(event, data) {
      $http.get('/api/dashboardCompletes/showTasks/' + $stateParams.id).success(function(tasks) {


        // Appel des classes de taches
        $rootScope.$broadcast('dateRangeService:updated', dateRangeService.rangeDateTxt);

        // Appel des engagement en cours
        $rootScope.$broadcast('obeya:searchContext', $scope.obeya);
      });

    });

    $scope.$on('dateRangeService:updated', function(event, data) {
      console.log('data', data);
      $scope.datediff = dateRangeService.datediff;
      $scope.rangeDate = dateRangeService.rangeDate;
      $timeout(function() {
        var items = new VisDataSet();
        var arrGroups = [];
        var arrSubGroups = [];
        var groups = new VisDataSet();

        $scope.$apply(function() {




          //Action Plan
          $scope.filteredActionPlanTasks = _.filter($scope.obeya.tasks, function(task) {
            return task.actionPlan === true;
          });
          $scope.filteredActionPlanTasksLoad = _.reduce($scope.filteredActionPlanTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);

          _.each($scope.filteredPlanTasks, function(task) {
            var level0 = task.context.substring(0, task.context.indexOf('.'));
            var suffixe = task.context.substring(task.context.indexOf('.') + 1);
            var level1 = suffixe.substring(0, suffixe.indexOf('.'));
            if (arrGroups.indexOf(level0) === -1) {
              arrGroups.push(level0);
              arrSubGroups[level0] = {
                subgroup: []
              };
            }
            if (arrSubGroups[level0].subgroup.indexOf(level1) === -1) {
              arrSubGroups[level0].subgroup.push(level0 + '.' + level1);
            }

            items.add({
              id: task._id,
              group: level0 + '.' + level1,
              content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
              start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
              end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
              className: 'label label-default'
            });
          });

          _.each($scope.filteredInProgressTasks, function(task) {
            var level0 = task.context.substring(0, task.context.indexOf('.'));
            var suffixe = task.context.substring(task.context.indexOf('.') + 1);
            var level1 = suffixe.substring(0, suffixe.indexOf('.'));
            if (arrGroups.indexOf(level0) === -1) {
              arrGroups.push(level0);
              arrSubGroups[level0] = {
                subgroup: []
              };
            }
            if (arrSubGroups[level0].subgroup.indexOf(level1) === -1) {
              arrSubGroups[level0].subgroup.push(level0 + '.' + level1);
            }

            items.add({
              id: task._id,
              group: level0 + '.' + level1,
              content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
              start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
              end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
              className: 'label label-info '
            });
          });

          _.each($scope.filteredFinishedTasks, function(task) {
            var level0 = task.context.substring(0, task.context.indexOf('.'));
            var suffixe = task.context.substring(task.context.indexOf('.') + 1);
            var level1 = suffixe.substring(0, suffixe.indexOf('.'));
            if (arrGroups.indexOf(level0) === -1) {
              arrGroups.push(level0);
              arrSubGroups[level0] = {
                subgroup: []
              };
            }
            if (arrSubGroups[level0].subgroup.indexOf(level1) === -1) {
              arrSubGroups[level0].subgroup.push(level0 + '.' + level1);
            }

            items.add({
              id: task._id,
              group: level0 + '.' + level1,
              content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
              start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
              end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
              className: 'label label-success '
            });
          });

          _.each($scope.filteredReviewedTasks, function(task) {
            var level0 = task.context.substring(0, task.context.indexOf('.'));
            var suffixe = task.context.substring(task.context.indexOf('.') + 1);
            var level1 = suffixe.substring(0, suffixe.indexOf('.'));
            if (arrGroups.indexOf(level0) === -1) {
              arrGroups.push(level0);
              arrSubGroups[level0] = {
                subgroup: []
              };
            }
            if (arrSubGroups[level0].subgroup.indexOf(level1) === -1) {
              arrSubGroups[level0].subgroup.push(level0 + '.' + level1);
            }

            items.add({
              id: task._id,
              group: level0 + '.' + level1,
              content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
              start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
              end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
              className: 'label label-success '
            });
          });

          // pour chaque groupe de level0
          _.each(arrGroups, function(group) {

            _.each(arrSubGroups[group], function(subgroups) {

              subgroups = _.compact(_.uniq(subgroups));

              if (subgroups.length === 0) {
                groups.add({
                  id: group,
                  content: group
                });
              } else {

                // on ajoute les subgroups à la liste des groupes
                _.each(subgroups, function(subgroup) {
                  groups.add({
                    id: subgroup,
                    content: subgroup.split('.')[1]
                  });
                });

                groups.add({
                  id: group,
                  content: group,
                  nestedGroups: subgroups
                });
              }

            });
          });
          // create visualization
          $scope.timelineOptions = {
            orientation: 'top',
            autoResize: true,
            showCurrentTime: true,
            zoomKey: 'ctrlKey',
            end: '2018-05-01',

            groupOrder: 'content' // groupOrder can be a property name or a sorting function
          };
          $scope.groups = groups;
          $scope.timelineData = {
            items: items,
            groups: $scope.groups
          };
          $scope.timelineLoaded = true;

        });
      });
    });



    // recherche des engagement en cours
    $scope.$on('obeya:searchContext', function(event, data) {

      switch ($scope.filters) {
        case 'ToEngage':
          $scope.milestonesToshow = $scope.obeya.milestones.toEngage();
          break;
        default:
          $scope.milestonesToshow = $scope.obeya.milestones.selected();
      }

      // create visualization
      var itemsMilestones = new VisDataSet({
        type: {
          start: 'ISODate'
        }
      });
      // add items to the DataSet
      itemsMilestones.add([{
          id: 1,
          content: 'subgroup0_1',
          start: '2018-01-23',
          className: 'green',
          group: 'QUALITY.MOP'
        },
        {
          id: 3,
          content: 'subgroup1_1',
          start: '2018-01-27',
          className: '',
          group: 'FONCTIONNEMENT.CBI'
        }
      ]);

      $timeout(function() {

        $scope.timelineOptions2 = {
          orientation: 'top',
          start: '2018-01-01',
          end: '2018-05-01',
          showCurrentTime: true,
          zoomMin: 1000 * 60 * 60 * 24, // one day in milliseconds
          zoomMax: 1000 * 60 * 60 * 24 * 31 * 4 // about three months in milliseconds
        };

        $scope.timelineDataMilestones = {
          items: itemsMilestones,
          groups: $scope.groups
        };
      }, 0);

    });

  });
