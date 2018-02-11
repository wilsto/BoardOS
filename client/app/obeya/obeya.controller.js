'use strict';

angular.module('boardOsApp')
  .controller('ObeyaCtrl', function($scope, $http, Notification, $stateParams, $rootScope, dateRangeService, VisDataSet, $timeout, Milestones) {

    $scope.obeyaMode = 'all';
    $scope.blnShowCard = {};
    $scope.blnShowCard.Milestones = false;
    $scope.blnShowCard.Milestone = false;
    $scope.filters = '';

    $scope.viewMode = {};
    $scope.viewMode.Task = 'Timeline';

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
      // var wall = document.getElementById('Wall-' + $scope.incrementSave);
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
      $scope.NavCaroussel(incrementTo - $scope.incrementSave);
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
        $scope.obeya.tasks = tasks;
        $scope.obeya.alltasksNb = $scope.obeya.tasks.length;
        $scope.obeya.openTasksNb = _.filter($scope.obeya.tasks, function(task) {
          return task.metrics[task.metrics.length - 1].status !== 'Finished';
        }).length;

        // Appel des classes de taches
        $rootScope.$broadcast('dateRangeService:updated', dateRangeService.rangeDateTxt);

        // Appel des engagement en cours
        $rootScope.$broadcast('obeya:searchContext', $scope.obeya);
        console.log('obeya', $scope.obeya);
      });

    });

    $scope.$on('dateRangeService:updated', function(event, data) {
      console.log('data', data);
      $scope.datediff = 7;
      if (data) {
        switch (data) {
          case 'Last 7 Days':
            dateRangeService.rangeDate = 'last7';
            dateRangeService.rangeDateTxt = 'Last 7 Days';
            $scope.datediff = 7;
            break;
          case 'Last 14 Days':
            dateRangeService.rangeDate = 'last14';
            dateRangeService.rangeDateTxt = 'Last 14 Days';
            $scope.datediff = 14;
            break;
          case 'Last 30 Days':
            dateRangeService.rangeDate = 'last30';
            dateRangeService.rangeDateTxt = 'Last 30 Days';
            $scope.datediff = 30;
            break;
          case 'Last 90 Days':
            dateRangeService.rangeDate = 'last90';
            dateRangeService.rangeDateTxt = 'Last 90 Days';
            $scope.datediff = 90;
            break;
          case 'Last 180 Days':
            dateRangeService.rangeDate = 'last180';
            dateRangeService.rangeDateTxt = 'Last 180 Days';
            $scope.datediff = 180;
            break;
          case 'Last 365 Days':
            dateRangeService.rangeDate = 'last365';
            dateRangeService.rangeDateTxt = 'Last 365 Days';
            $scope.datediff = 365;
            break;
          case 'All':
            dateRangeService.rangeDate = 'All';
            dateRangeService.rangeDateTxt = 'All';
            $scope.datediff = 5000;
            break;
        }
      }
      $scope.rangeDate = dateRangeService.rangeDate;
      $timeout(function() {
        var items = new VisDataSet();
        var arrGroups = [];
        var arrSubGroups = [];
        var groups = new VisDataSet();

        $scope.$apply(function() {

          _.each($scope.obeya.tasks, function(task) {
            task.taskSuffIcon = '';
            if (task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined) {
              task.taskSuffIcon = ' <i class="fa fa-question-circle-o text-danger" aria-hidden="true"></i>&nbsp;&nbsp;';
            }
          });
          $scope.filteredPlanTasks = _.filter($scope.obeya.tasks, function(task) {
            return task.metrics[task.metrics.length - 1].status === 'Not Started';
          });
          $scope.filteredPlanTasksLoad = _.reduce($scope.filteredPlanTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);

          $scope.filteredInProgressTasks = _.filter($scope.obeya.tasks, function(task) {
            return task.metrics[task.metrics.length - 1].status === 'In Progress';
          });
          $scope.filteredInProgressTasksLoad = _.reduce($scope.filteredInProgressTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);

          $scope.filteredFinishedTasks = _.filter($scope.obeya.tasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === undefined || task.reviewTask === false);
          });
          $scope.filteredFinishedTasksLoad = _.reduce($scope.filteredFinishedTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);

          $scope.filteredReviewedTasks = _.filter($scope.obeya.tasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === true);
          });
          $scope.filteredReviewedTasksLoad = _.reduce($scope.filteredReviewedTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);

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

      $scope.obeya.milestones = new Milestones($scope.obeya);

      switch ($scope.filters) {
        case 'ToEngage':
          $scope.hierarchiesToshow = $scope.obeya.milestones.toEngage();
          break;
        default:
          $scope.hierarchiesToshow = $scope.obeya.milestones.selected();
      }

      $http.get('/api/hierarchies/list/Context/obeya/' + $scope.obeya._id).success(function(hierarchies) {


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
