'use strict';

angular.module('boardOsApp').controller('ObeyaCtrl', function($scope, $http, $window, Notification, $location, $stateParams, $rootScope, dateRangeService, VisDataSet, $timeout, Milestones, Tasks, Anomalies, generator, graphGenerator, dataGenerator, myLibrary) {

  function arrayAverage(arr) {
    return _.reduce(arr, function(memo, num) {
      return memo + num;
    }, null) / (arr.length === 0 ? 1 : arr.length);
  }

  function arraySum(arr) {
    return _.reduce(arr, function(memo, num) {
      return memo + num;
    }, 0);
  }

  $scope.walls = [{
    id: 0,
    title: 'Summary',
    name: 'Summary'
  }, {
    id: 1,
    title: 'People',
    name: 'People'
  }, {
    id: 2,
    title: 'News',
    name: 'News'
  }, {
    id: 3,
    title: 'Process',
    name: 'Process'
  }, {
    id: 4,
    title: 'Engagements',
    name: 'Milestones'
  }, {
    id: 5,
    title: 'Tasks',
    name: 'Tasks'
  }, {
    id: 6,
    title: 'Performance',
    name: 'Performance'
  }, {
    id: 7,
    title: 'ProblemSolving',
    name: 'ProblemSolving'
  }, {
    id: 8,
    title: 'Properties',
    name: 'Properties'
  }];

  $scope.obeyaMode = 'all';
  $scope.filters = '';
  $scope.groupPerformance = 'none';

  $scope.viewMode = {};
  var viewModeSession = $window.sessionStorage.getItem('viewMode');
  viewModeSession = (viewModeSession === 'undefined' || viewModeSession === null) ? {} : JSON.parse(viewModeSession);
  $scope.viewMode.Milestones = (typeof viewModeSession.Milestones !== 'undefined') ? viewModeSession.Milestones : 'List';
  $scope.viewMode.Tasks = (typeof viewModeSession.Tasks !== 'undefined') ? viewModeSession.Tasks : 'PDCA';
  $scope.viewMode.Performance = (typeof viewModeSession.Performance !== 'undefined') ? viewModeSession.Performance : 'MasterOverview';
  $scope.viewMode.Anomalies = (typeof viewModeSession.Anomalies !== 'undefined') ? viewModeSession.Anomalies : 'List';
  $scope.viewMode.Process = (typeof viewModeSession.Process !== 'undefined') ? viewModeSession.Process : 'Workflow';

  $scope.propertiesToshow = 'Name';
  $scope.milestonesTypeToshow = 'All';
  $scope.anomaliesTypeToshow = 'To correct';

  /**
   * loadObeya
   * @return {[type]} [description]
   */
  $scope.loadObeya = function() {
    if ($stateParams.id) {
      // ouverture de l'obeya
      $scope.myPromise = $http.get('/api/dashboardCompletes/' + $stateParams.id).success(function(obeya) {
        $scope.obeya = obeya;
        $scope.obeya.milestones = new Milestones($scope.obeya);
        $scope.obeya.anomalies = new Anomalies($scope.obeya);
        $scope.obeya.tasks = new Tasks($scope.obeya);
        $rootScope.obeyaPerimeter = $scope.obeya.perimeter;

        console.log('$SCOPE.OBEYA', $scope.obeya)

        $scope.activeWall = _.filter($scope.walls, function(wall) {
          return wall.id === 0;
        })[0];

        var activeWallId = ($window.sessionStorage.getItem('activeWallId')) ? parseInt($window.sessionStorage.getItem('activeWallId')) : 0;
        $scope.NavCaroussel(activeWallId);
        $scope.showCard($scope.activeWall.name);

        // recherche des processus
        $timeout(function() {
          convertTasksInProcessFlow();
        }, 3000);

      });
    }
  };
  $scope.loadObeya();

  $scope.$watch('viewMode', function() {
    $window.sessionStorage.setItem('viewMode', JSON.stringify($scope.viewMode));
  }, true);

  $scope.$watch('filters', function() {
    $window.sessionStorage.setItem('viewMode', JSON.stringify($scope.filters));
  }, true);

  /**
   * NavCarroussel
   * // Effet sur le carrousel
   * @param  {[type]} increment [description]
   * @return {[type]}           [description]
   */
  $scope.NavCaroussel = function(increment) {
    var carousel = document.getElementById('carousel');
    var panelCount = carousel.children.length;
    var theta = 0;
    var prevWallId = $scope.activeWall.id;
    var wallId = $scope.activeWall.id;
    if (increment === 0) {
      wallId = 0;
    } else if (($scope.activeWall.id > -1 && increment > 0 && $scope.activeWall.id < 8) || ($scope.activeWall.id > 0 && increment < 0 && $scope.activeWall.id < 8)) {
      wallId += increment;
    } else {
      if (wallId === 8) {
        wallId = 0;
      } else if (wallId === 0) {
        wallId = 8;
      }
    }
    $scope.activeWall = _.filter($scope.walls, function(wall) {
      return wall.id === wallId;
    })[0];
    $window.sessionStorage.setItem('activeWallId', $scope.activeWall.id);

    theta += (360 / panelCount) * $scope.activeWall.id * -1;
    carousel.style.transform = 'translateZ( -288px ) rotateY(' + theta + 'deg)';
  };



  /**
   * ShowCard
   * @param  {[type]} card    [description]
   * @param  {[type]} filters [description]
   * @return {[type]} Nothing [description]
   */
  $scope.showCard = function(card, filters) {
    $scope.filters = filters;
    var nextWall = _.filter($scope.walls, function(wall) {
      return wall.name === card;
    })[0];
    var incrementTo = nextWall.id;
    if (incrementTo !== $scope.activeWall.id) {
      $scope.NavCaroussel(incrementTo - $scope.activeWall.id);
    }
    $rootScope.$broadcast('obeya:searchContext', $scope.obeya);
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

  $scope.$on('dateRangeService:updated', function(event, data) {

    $scope.obeya.tasks = new Tasks($scope.obeya);

    $timeout(function() {
      var items = new VisDataSet();
      var arrGroups = [];
      var arrSubGroups = [];
      var groups = new VisDataSet();

      // pour chaque groupe // MILESTONE
      var milestones = $scope.obeya.milestones.selectedAndApplicable();
      _.each(milestones, function(milestone) {
        // on ajoute les subgroups à la liste des groupes
        groups.add({
          id: milestone.id,
          content: milestone.longname
        });
        if (milestone.milestone && milestone.milestone.dueDate) {
          items.add({
            id: milestone.id,
            group: milestone.id,
            content: '<img src="assets/images/milestone.png" style="width:20px;height:20px;" alt="" > ',
            start: milestone.milestone.dueDate
          });
        }
      });

      groups.add({
        id: 'NOGROUP',
        content: 'WITHOUT MILESTONE'
      });


      _.each($scope.obeya.tasks.filterPlan, function(task) {
        var group = _.filter(milestones, function(milestone) {
          return task.context.indexOf(milestone.longname) > -1;
        });
        group = (group.length > 0) ? group[0].id : 'NOGROUP';

        items.add({
          id: task._id,
          group: group,
          content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (
            task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
          start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
          end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
          className: 'label label-default'
        });
      });

      _.each($scope.obeya.tasks.filterInProgress, function(task) {
        var group = _.filter(milestones, function(milestone) {
          return task.context.indexOf(milestone.longname) > -1;
        });
        group = (group.length > 0) ? group[0].id : 'NOGROUP';

        items.add({
          id: task._id,
          group: group,
          content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (
            task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
          start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
          end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
          className: 'label label-info '
        });
      });

      _.each($scope.obeya.tasks.filterFinished, function(task) {
        var group = _.filter(milestones, function(milestone) {
          return task.context.indexOf(milestone.longname) > -1;
        });
        group = (group.length > 0) ? group[0].id : 'NOGROUP';

        items.add({
          id: task._id,
          group: group,
          content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (
            task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
          start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
          end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
          className: 'label label-success '
        });
      });

      _.each($scope.obeya.tasks.filterReviewed, function(task) {

        var group = _.filter(milestones, function(milestone) {
          return task.context.indexOf(milestone.longname) > -1;
        });
        group = (group.length > 0) ? group[0].id : 'NOGROUP';

        items.add({
          id: task._id,
          group: group,
          content: '<a href="/task/' + task._id + '"">' + '<img alt="" src="' + (
            task.actors[0].avatar || 'assets/images/avatars/avatar.png') + '" class="img-circle" style="width:25px;height:25px;" err-src="assets/images/avatars/avatar.png"/> ' + task.name + '</a>',
          start: new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[0].targetstartDate),
          end: new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[0].targetEndDate),
          className: 'label label-success '
        });
      });

      $timeout(function() {
        // create visualization
        $scope.timelineOptions = {
          orientation: 'both',
          start: moment().subtract(30, 'days'),
          end: moment().add(60, 'days'),
          showCurrentTime: true,
          zoomKey: 'ctrlKey',
          zoomMin: 1000 * 60 * 60 * 24, // one day in milliseconds
          zoomMax: 1000 * 60 * 60 * 24 * 31 * 4 // about three months in milliseconds
        };

        $scope.timelineDataTasks = {
          items: items,
          groups: groups
        };

        $scope.timelineLoaded = true;
      }, 0);
    });
  });

  // recherche des engagement en cours
  $scope.$on('obeya:searchContext', function(event, data) {

    switch ($scope.filters) {

      // milestone
      case 'toForecast':
        $scope.milestonesToshow = $scope.obeya.milestones.toForecast();
        break;
      case 'ToPlan':
        $scope.milestonesToshow = $scope.obeya.milestones.toPlan();
        break;
      case 'ToEngage':
        $scope.milestonesToshow = $scope.obeya.milestones.toEngage();
        break;
      case 'ToAchieve':
        $scope.milestonesToshow = $scope.obeya.milestones.toAchieve();
        break;

        // properties
      case 'Name':
        $scope.propertiesToshow = 'Name';
        break;
      case 'Perimeter':
        $scope.propertiesToshow = 'Perimeter';
        break;
      case 'Roles':
        $scope.propertiesToshow = 'Roles';
        break;

        //all
      default:
        $scope.milestonesToshow = $scope.obeya.milestones.selected();
    }
    $scope.loadTimeline();

  });

  /**
   * [description]
   * @param  {Boolean} thisMilestone [description]
   * @param  {[type]}  activities    [description]
   * @return {[type]}                [description]
   */
  $scope.updateActivities = function(thisMilestone, activities) {
    if (!thisMilestone.milestone) {
      thisMilestone.milestone = {
        activities: []
      };
    }
    if (thisMilestone.milestone.activities) {
      var allActivities = thisMilestone.milestone.activities;
      if (allActivities.indexOf(activities) > -1) {
        allActivities = _.reject(allActivities, function(a) {
          return a === activities;
        });
        thisMilestone.milestone.activities = _.uniq(allActivities);
      } else {
        allActivities.push(activities);
        thisMilestone.milestone.activities = _.uniq(allActivities);
      }
    } else {
      thisMilestone.milestone.activities = [];
      thisMilestone.milestone.activities.push(activities);
    }
    $scope.obeya.milestones.update(thisMilestone);
  };

  /**
   * [description]
   * @param  {Boolean} thisMilestone [description]
   * @param  {[type]}  activities    [description]
   * @return {[type]}                [description]
   */
  $scope.updateStatus = function(thisMilestone, status) {
    if (!thisMilestone.milestone) {
      thisMilestone.milestone = {
        activities: []
      };
    }
    if (thisMilestone.milestone.status) {
      if (thisMilestone.milestone.status === status) {
        delete thisMilestone.milestone.status;
      } else {
        thisMilestone.milestone.status = status;
      }
    } else {
      thisMilestone.milestone.status = status;
    }
    $scope.obeya.milestones.update(thisMilestone);
  };


  /**
   * [description]
   * @param  {Boolean} thisMilestone [description]
   * @param  {[type]}  activities    [description]
   * @return {[type]}                [description]
   */
  $scope.updateObeyaRoles = function(role) {
    if (!$scope.obeya.roles) {
      $scope.obeya.roles = [];
    }
    if ($scope.obeya.roles.indexOf(role) > -1) {
      $scope.obeya.roles = _.reject($scope.obeya.roles, function(arrayRole) {
        return role === arrayRole;
      });
    } else {
      $scope.obeya.roles.push(role);
    }
  };

  /**
   * loadTimeline
   * @return {[type]} [description]
   */
  $scope.loadTimeline = function() {
    // create visualization
    var itemsMilestones = new VisDataSet({
      type: {
        start: 'ISODate'
      }
    });

    // Filter milestones with dates
    var arrayMilestonesWithDate = _.filter($scope.milestonesToshow, function(milestone) {
      return milestone.milestone && milestone.milestone.dueDate;
    });

    //Add milestone to timeline arrayData
    var index = 0;

    var arrayMilestones = _.map(arrayMilestonesWithDate, function(milestone) {
      index++;
      var iconMilestone;
      var colorMilestone;
      switch (milestone.milestone.status) {
        case 'Forecasted':
          iconMilestone = '<img src="assets/images/plan.png" alt="" style="width:20px;height:20px"> ';
          colorMilestone = 'bg-gray';
          break;
        default:
          iconMilestone = '';
          colorMilestone = '';
      }
      return {
        id: index,
        idjson: milestone.id,
        content: iconMilestone + milestone.longname,
        start: milestone.milestone.dueDate,
        className: colorMilestone
      };
    });

    $timeout(function() {
      // add arrayData to the DataSet
      itemsMilestones.add(arrayMilestones);

      $scope.timelineOptions2 = {
        orientation: 'both',
        start: '2018-03-01',
        end: '2018-07-01',
        showCurrentTime: true,
        // allow manipulation of items
        editable: true,
        zoomMin: 1000 * 60 * 60 * 24, // one day in milliseconds
        zoomMax: 1000 * 60 * 60 * 24 * 31 * 4 // about three months in milliseconds
      };

      $scope.timelineDataMilestones = {
        items: itemsMilestones
      };
    }, 0);

    $timeout(function() {
      itemsMilestones.on('*', function(event, properties) {
        if (event === 'update') {
          bootbox.confirm('Are you sure to move ' + properties.data[0].content + ' to ' + properties.data[0].start + ' ?', function(result) {
            if (result) {
              var thisMilestone = _.filter($scope.obeya.milestones.list, function(m) {
                return m.id === properties.data[0].idjson;
              })[0];
              thisMilestone.milestone.dueDate = properties.data[0].start;
              thisMilestone.milestone.updateDate = new Date();
              thisMilestone.milestone.updateUser = $rootScope.thisUser;

              $scope.obeya.milestones.update(thisMilestone);

            }
          });
        }
        if (event === 'add') {
          //milestone dans la timeline avec la bonne date
          var objectMilestone = itemsMilestones._data[properties.items[0]];
          //milestone de la liste avec le bon id
          var thisMilestone = _.filter($scope.obeya.milestones.list, function(m) {
            return m.longname === objectMilestone.content;
          });
          if (thisMilestone.length > 0) {
            thisMilestone = thisMilestone[0];
            thisMilestone.milestone = {
              dueDate: objectMilestone.start,
              status: objectMilestone.status,
              updateDate: objectMilestone.updateDate,
              updateUser: objectMilestone.updateUser
            };
          }
          $scope.obeya.milestones.update(thisMilestone);
        }
        if (event === 'remove') {
          bootbox.confirm('Are you sure to unplan ' + properties.oldData[0].content + ' ?', function(result) {
            if (result) {
              //milestone dans la timeline avec la bonne date
              var objectMilestone = properties.oldData[0];
              //milestone de la liste avec le bon id
              var thisMilestone = _.filter($scope.obeya.milestones.list, function(m) {
                return m.id === objectMilestone.idjson;
              });
              if (thisMilestone.length > 0) {
                thisMilestone = thisMilestone[0];
                thisMilestone.milestone = {
                  updateDate: objectMilestone.updateDate,
                  updateUser: objectMilestone.updateUser
                };
              }
              $scope.obeya.milestones.update(thisMilestone);

            }
          });
        }
      });
    }, 1000);


    $scope.handleDragStart = function(event) {
      event.dataTransfer.effectAllowed = 'move';
      var item = {
        id: new Date(),
        type: 'point',
        status: 'Forecasted',
        content: event.target.innerHTML.trim(),
        updateDate: new Date(),
        updateUser: $rootScope.thisUser
      };
      event.dataTransfer.setData('text', JSON.stringify(item));
    };


    $timeout(function() { //Move code up the callstack to tell Angular to watch this
      var items = document.querySelectorAll('.items-panel .item');

      for (var i = items.length - 1; i >= 0; i--) {
        var item = items[i];
        item.addEventListener('dragstart', $scope.handleDragStart.bind(this), false);
      }

    }, 25);


  };

  var scoreQualityOnQCT = {
    value: 30
  };
  var scoreCostOnQCT = {
    value: 20
  };
  var scoreTimeOnQCT = {
    value: 40
  };

  $scope.gridsterOptions = {
    margins: [
      20, 20
    ],
    columns: 4,
    //mobileBreakPoint: 1000,
    mobileModeEnabled: false,
    draggable: {
      handle: 'h3'
    },
    resizable: {
      enabled: true,
      handles: [
        'n',
        'e',
        's',
        'w',
        'ne',
        'se',
        'sw',
        'nw'
      ],

      // optional callback fired when resize is started
      start: function(event, $element, widget) {},

      // optional callback fired when item is resized,
      resize: function(event, $element, widget) {
        if (widget.chart.api) {
          widget.chart.api.update();
        }
      },

      // optional callback fired when item is finished resizing
      stop: function(event, $element, widget) {
        $timeout(function() {
          if (widget.chart.api) {
            widget.chart.api.update();
          }
        }, 400);
      }
    }
  };
  //var initializing = true;
  $scope.newPerimeterValue = {};
  $scope.timelineLoaded = false;


  $scope.refreshDashboard = function() {
    $scope.myPromise = $http.get('/api/dashboardCompletes/executeId/' + $stateParams.id).success(function(response) {
      $scope.checked = !$scope.checked;
      $scope.loadCompleteDashboard();
    });
  };


  // *******************
  // update an obeya
  // *******************
  $scope.update = function() {
    delete $scope.obeya.tasks;
    delete $scope.obeya.kpis;
    delete $scope.obeya.alerts;

    if ($scope.newPerimeterValue.activity || $scope.newPerimeterValue.context) {
      $scope.obeya.perimeter.push({
        activity: $scope.newPerimeterValue.activity,
        context: $scope.newPerimeterValue.context
      });
    }
    $scope.myPromise = $http.put('/api/dashboardCompletes/' + $scope.obeya._id, $scope.obeya).success(function() {
      var logInfo = 'Obeya "' + $scope.obeya.name + '" was updated';
      Notification.success(logInfo);
      $scope.newPerimeterValue = {};
      $scope.showNewPerimeter = false;
      $scope.loadObeya();
    });
  };


  $scope.dashboard = {
    widgets: [{
      col: 0,
      row: 0,
      sizeY: 1,
      sizeX: 1,
      name: 'Quantitative Over Time',
      type: 'lineChart',
      chart: {
        options: graphGenerator.quantitativeOverTime.options()
      }
    }, {
      col: 1,
      row: 0,
      sizeY: 1,
      sizeX: 1,
      name: 'Quantitative',
      type: 'discreteBarChart',
      chart: {
        options: graphGenerator.quantitative.options()
      }
    }, {
      col: 2,
      row: 0,
      sizeY: 1,
      sizeX: 1,
      name: 'Qualitative Over Time',
      type: 'lineChart',
      chart: {
        options: graphGenerator.qualitativeOverTime.options()
      }
    }, {
      col: 3,
      row: 0,
      sizeY: 1,
      sizeX: 1,
      name: 'Qualitative',
      type: 'vbullet',
      chart: {
        options: generator.qualiChart.options()
      }
    }, {
      col: 0,
      row: 1,
      sizeY: 1,
      sizeX: 2,
      name: 'Activity Performance',
      type: 'treemap',
      chart: {
        options: generator.treemap.options()
      }
    }, {
      col: 2,
      row: 1,
      sizeY: 1,
      sizeX: 2,
      name: 'Context Performance',
      type: 'treemap',
      chart: {
        options: generator.treemap.options()
      }
    }]
  };

  // widget events
  $scope.events = {
    resize: function(e, scope) {
      $timeout(function() {
        if (scope.api && scope.api.update) {
          scope.api.update();
        }
      }, 200);
    }
  };

  $scope.config = {
    visible: false
  };

  $scope.colorKPI = function(number) {
    var color;
    if (number <= 0) {
      color = 'lightgrey';
    }
    if (number > 0 && number < 70) {
      color = 'red';
    }
    if (number >= 70 && number < 90) {
      color = 'orange';
    }
    if (number >= 90 && number < 110) {
      color = 'green';
    }
    if (number >= 110 && number < 130) {
      color = 'orange';
    }
    if (number >= 130) {
      color = 'red';
    }
    return color;
  };

  $scope.colorBgKPI = function(number) {
    var color;
    if (number <= 0) {
      color = 'bg-lightgrey';
    }
    if (number > 0 && number < 70) {
      color = 'bg-red';
    }
    if (number >= 70 && number < 90) {
      color = 'bg-orange';
    }
    if (number >= 90 && number < 110) {
      color = 'bg-green';
    }
    if (number >= 110 && number < 130) {
      color = 'bg-orange';
    }
    if (number >= 130) {
      color = 'bg-red';
    }
    return color;
  };

  //make chart visible after grid have been created
  $scope.$on('obeya:refreshPerformance', function(event, data) {

    $scope.config.visible = true;
    $scope.chartData = [];

    // FIRST
    dataGenerator.quantitativeOverTime.data().then(function(lineChart) {
      var data1 = lineChart.data.slice(-13);
      var dataLast = data1.slice(-2, -1);
      dataLast = _.map(dataLast, function(d) {
        return [{
          label: 'Tasks',
          value: d.value.count
        }, {
          label: 'Workload',
          value: d.value.qty
        }];
      })[0];
      $scope.chartData[1] = [{
        key: 'Tasks',
        values: dataLast
      }];


      data1 = data1.slice(0, 12);
      var data2 = _.map(_.cloneDeep(data1), function(d) {
        d.value.count = d.value.qty;
        return d;
      });
      $scope.chartData[0] = [{
        key: 'Tasks',
        strokeWidth: 2,
        classed: 'dashed',
        values: data1
      }, {
        key: 'Workload',
        area: true,
        values: data2
      }];
    });

    // THIRD
    $scope.dataCost = myLibrary.displayLastYearKPI($scope.obeya.tasks.list, '_id', 'kpis', 'Cost');
    $scope.dataQuality = myLibrary.displayLastYearKPI($scope.obeya.tasks.list, '_id', 'kpis', 'Quality');
    $scope.dataTime = myLibrary.displayLastYearKPI($scope.obeya.tasks.list, '_id', 'kpis', 'Time');

    $scope.tasksNb = arraySum(_.compact(_.map($scope.dataTasks, 'value')));
    $scope.metricsNb = arraySum(_.compact(_.map($scope.dataMetrics, 'value')));
    $scope.costNb = arrayAverage(_.compact(_.map($scope.dataCost, 'value')));
    $scope.qualityNb = arrayAverage(_.compact(_.map($scope.dataQuality, 'value')));
    $scope.timeNb = arrayAverage(_.compact(_.map($scope.dataTime, 'value')));

    $scope.chartData[2] = [{
      key: 'Quality',
      values: $scope.dataQuality
    }, {
      key: 'Cost',
      values: $scope.dataCost
    }, {
      key: 'Time',
      values: $scope.dataTime
    }];

  });

  //subscribe widget on window resize event
  angular.element(window).on('resize', function(e) {
    $scope.$broadcast('resize');
  });

  // calendar
  // **********
  //
  $scope.viewDate = new Date();
  $scope.calendarView = 'week';
  $scope.eventClicked = function(calendarEvent) {
    $window.open('/' + calendarEvent.eventType + '/' + calendarEvent.eventId, '_blank');
  };

  $scope.eventTimesChanged = function(calendarEvent, calendarNewEventStart, calendarNewEventEnd) {
    var updatedEvent = _.filter($scope.myTasks, function(task) {
      return task._id === calendarEvent.eventId;
    });
    if (updatedEvent.length > 0) {


      var dayDiff = moment(calendarNewEventStart).diff(moment(updatedEvent[0].metrics[0].targetstartDate), 'days');

      updatedEvent[0].metrics[0].targetstartDate = moment(updatedEvent[0].metrics[0].targetstartDate).add(dayDiff, 'days').toDate();
      updatedEvent[0].metrics[0].targetEndDate = moment(updatedEvent[0].metrics[0].targetEndDate).add(dayDiff, 'days').toDate();

      $scope.myPromise = $http.put('/api/taskFulls/' + calendarEvent.eventId + '/' + false, updatedEvent[0]).success(function(data) {

        var logInfo = 'Task "' + updatedEvent[0].name + '" was updated';
        Notification.success(logInfo);
      });

    }
  };

  // Process Matrix
  var alltasks = {};
  var allhierarchies = {};

  var convertTasksInProcessFlow = function() {

    console.log('$SCOPE.OBEYA.TASKS.PROCESSLIST', $scope.obeya.tasks.processList)
    $scope.processFocus = _.filter($scope.obeya.tasks.processList, function(path) {
      return path.longname === $scope.obeya.perimeter[0].activity;
    })[0];
    console.log('  $SCOPE.PROCESSFOCUS', $scope.processFocus)

    $scope.processFlowLevel = $scope.processFocus.level + 1;
    $scope.processFocusName = $scope.processFocus.longname;
    $scope.processFocusKey = $scope.processFocus.id || $scope.processFocus.longname;

    var processFlow = [];
    var processLinks = [];
    if ($scope.processFocus.processFlow) {
      processFlow = $scope.processFocus.processFlow.nodeDataArray;
      processLinks = $scope.processFocus.processFlow.linkDataArray;
    }

    if (processFlow.length === 0 || _.filter(processFlow, ['key', -5]).length === 0) {
      processFlow.push({
        'key': -5,
        'category': 'Comment',
        'text': $scope.processFocusName + '    -    Flow of level ' + $scope.processFlowLevel,
        'loc': '280 -40'
      });
    }
    if (processFlow.length === 0 || _.filter(processFlow, ['key', -1]).length === 0) {
      processFlow.push({
        'key': -1,
        'category': 'Start',
        'loc': '175 0',
        'text': 'Start'
      });
    }

    if (processFlow.length === 0 || _.filter(processFlow, ['key', -2]).length === 0) {
      processFlow.push({
        'key': -2,
        'category': 'End',
        'loc': '175 660',
        'text': 'End!'
      });
    }

    _.each($scope.obeya.tasks.processList, function(path, index) {
      var newSubProcess = {};
      if (processFlow.length === 0 || _.filter(processFlow, ['key', path.id || path.longname]).length === 0) {
        if (path.level === $scope.processFlowLevel) {
          newSubProcess.category = 'Process';
          newSubProcess.key = path.id || path.longname;
          newSubProcess.name = path.longname.replace($scope.processFocusName + '.', '');
          newSubProcess.color = 'white';
          processFlow.push(newSubProcess);
        }
      }
    });

    // PROCESS flow
    $scope.model = new go.GraphLinksModel(
      processFlow,
      processLinks
    );

  };

  $scope.countDot = function count(s1) {
    return (s1.match(new RegExp('\\.', 'g')) || []).length;
  };


  $scope.saveDiagram = function() {
    $scope.$broadcast('saveDiagram');
  };

  $rootScope.$watch('processFlowJson', function() {
    if ($scope.processFocusKey) {
      $http.patch('/api/hierarchies/Activity/' + $scope.processFocusKey, $rootScope.processFlowJson).success(function(hierarchies) {
        Notification.success('ProcessFlow "' + $scope.processFocusName + '" was updated');
      });
    }
  }, true);

  $scope.loadDiagram = function() {
    $scope.$broadcast('loadDiagram');
  };
  $scope.printDiagram = function() {
    $scope.$broadcast('printDiagram');
  };
});
