/*jshint sub:true*/
'use strict';

angular.module('boardOsApp')
  .controller('DashboardCtrl', function($scope, $rootScope, $http, $stateParams, myLibrary, $cookieStore, $location, Notification, $timeout, dateRangeService, $window, VisDataSet, $uibModal, Auth) {
    $scope.Math = window.Math;

    Auth.getCurrentUser(function(data) {
      $scope.currentUser = Auth.getCurrentUser();
    });

    // create visualization
    $scope.timelineOptions = {
      orientation: 'top',
      autoResize: true,
      showCurrentTime: true,
      zoomKey: 'ctrlKey',
      groupOrder: 'content' // groupOrder can be a property name or a sorting function
    };

    $scope.timelineLoaded = true;

    $scope.onRangeChanged = function(period) {

    };

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


    var initializing = true;
    $scope.newPerimeterValue = {};


    $scope.refreshDashboard = function() {
      $scope.myPromise = $http.get('/api/dashboardCompletes/executeId/' + $stateParams.id).success(function(response) {
        $scope.checked = !$scope.checked;
        $scope.loadCompleteDashboard();
      });
    };


    $scope.checked = false;
    $scope.size = '100px';
    $scope.dashboardSlide = 'Home';
    $scope.blnshowConfig = false;
    $scope.viewMode = {
      blnPerf: true
    };

    $scope.toggle = function() {
      $scope.checked = !$scope.checked;
    };

    $scope.showConfig = function() {
      $scope.blnshowConfig = !$scope.blnshowConfig;
      $scope.checked = !$scope.checked;
    };

    $scope.showHome = function() {
      $scope.dashboardSlide = 'Home';
      $scope.checked = !$scope.checked;
    };

    $scope.showHistory = function(subs) {
      $scope.subHierarchies = [];
      if (!subs) {
        subs = 'Activity';
      }
      $scope.subs = subs;
      $scope.dashboardSlide = 'History';
      $scope.checked = false;

      $http.get('/api/taskFulls/countByMonth', {
        params: {
          filterPerimeter: $scope.filterPerimeter
        }
      }).success(function(tasks) {
        $scope.dataTasks = [{
          values: []
        }];

        $scope.dataMetrics = [{
          values: []
        }];
        $scope.dataCost = [{
          values: []
        }];
        $scope.dataQuality = [{
          values: []
        }];
        $scope.dataTime = [{
          values: []
        }];
        $scope.allmetricsNb = parseInt(tasks.reduce(function(pv, cv) {
          return pv + cv.value.qty;
        }, 0));

        $scope.dataTasks[0].values = myLibrary.displayLastYear(tasks, '_id', 'count', true);
        $scope.dataMetrics[0].values = myLibrary.displayLastYear(tasks, '_id', 'qty', true);
        $scope.dataCost[0].values = myLibrary.displayLastYearKPI($scope.dashboard.tasks, '_id', 'kpis', 'Cost');
        $scope.dataQuality[0].values = myLibrary.displayLastYearKPI($scope.dashboard.tasks, '_id', 'kpis', 'Quality');
        $scope.dataTime[0].values = myLibrary.displayLastYearKPI($scope.dashboard.tasks, '_id', 'kpis', 'Time');


        $scope.tasksNb = arraySum(_.compact(_.map($scope.dataTasks[0].values, 'value')));
        $scope.metricsNb = arraySum(_.compact(_.map($scope.dataMetrics[0].values, 'value')));
        $scope.costNb = arrayAverage(_.compact(_.map($scope.dataCost[0].values, 'value')));
        $scope.qualityNb = arrayAverage(_.compact(_.map($scope.dataQuality[0].values, 'value')));
        $scope.timeNb = arrayAverage(_.compact(_.map($scope.dataTime[0].values, 'value')));
      });

      $http.get('/api/hierarchies/sublist/' + $scope.subs + '/dashboard/' + $scope.dashboard._id).success(function(hierarchies) {

        $scope.subHierarchies = _.sortBy(hierarchies, ['root', 'name']);

        $scope.dataTasksSub = [];
        $scope.dataUOMetricsSub = [];
        $scope.dataUODiffMetricsSub = [];
        $scope.dataUOPerfMetricsSub = [];
        $scope.dataMetricsSub = [];
        $scope.dataCostSub = [];
        $scope.dataQualitySub = [];
        $scope.dataTimeSub = [];

        $scope.dataTasksSubNb = [];
        $scope.dataUOMetricsSubNb = [];
        $scope.dataUODiffMetricsSubNb = [];
        $scope.dataUOPerfMetricsSubNb = [];
        $scope.dataMetricsSubNb = [];
        $scope.dataQualitySubNb = [];
        $scope.dataCostSubNb = [];
        $scope.dataTimeSubNb = [];

        $scope.dataSubKPIs = [];

        $scope.subTasks = [];
        $scope.blnShowTasks = [];
        $scope.blnShowKpis = [];
        $scope.dataKpis = [];
        $scope.blnShowAllTasks = false;
        $scope.showEmptyRow = false;
        $scope.dataQualitySubKPIs = [];

        _.each($scope.subHierarchies, function(subHierarchy) {

          $scope.dataTasksSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataUOMetricsSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataUODiffMetricsSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataUOPerfMetricsSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataMetricsSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataCostSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataQualitySub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataTimeSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataTimeSub[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataKpis[subHierarchy.root + subHierarchy.name] = [{
            values: []
          }];

          $scope.dataSubKPIs[subHierarchy.root + subHierarchy.name] = {
            'Cost': [],
            'Quality': [],
            'Time': []
          };

          $scope.subTasks[subHierarchy.root + subHierarchy.name] = _.sortBy(_.filter($scope.dashboard.tasks, function(task) {
            var blnReturn = false;

            _.each($scope.dashboard.perimeter, function(perimeter) {

              var subActivityFilter = perimeter.activity || '';
              var subContextFilter = perimeter.context || '';

              subActivityFilter = subActivityFilter.replace('^', '');
              subContextFilter = subContextFilter.replace('^', '');

              if ($scope.subs === 'Activity' && (subHierarchy.root + subHierarchy.name).indexOf(subActivityFilter) > -1) {
                if (!blnReturn) {
                  blnReturn = ((subHierarchy.root + subHierarchy.name) !== subActivityFilter && (task.activity.indexOf(subActivityFilter) === 0 && task.activity.indexOf(subHierarchy.root + subHierarchy.name) === 0 || task.activity + '$' === subHierarchy.root + subHierarchy.name) && task.context.indexOf(subContextFilter) === 0 && task.metrics[task.metrics.length - 1].status === 'Finished');
                }
              }

              if ($scope.subs === 'Context' && (subHierarchy.root + subHierarchy.name).indexOf(subContextFilter) === 0) {
                if (!blnReturn) {
                  blnReturn = ((subHierarchy.root + subHierarchy.name) !== subContextFilter && (task.context.indexOf(subContextFilter) === 0 && task.context.indexOf(subHierarchy.root + subHierarchy.name) === 0 || task.context + '$' === subHierarchy.root + subHierarchy.name) && task.activity.indexOf(subActivityFilter) > -1 && task.metrics[task.metrics.length - 1].status === 'Finished');
                }
              }
            });

            return blnReturn;
          }), function(task) {
            return task.metrics[0].targetEndDate;
          }).reverse();

          $scope.blnShowTasks[subHierarchy.root + subHierarchy.name] = false;
          $scope.blnShowKpis[subHierarchy.root + subHierarchy.name] = false;

          $scope.dataTasksSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearTask($scope.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'count');
          $scope.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearTask($scope.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'qty');
          
          $scope.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values = _.map(_.cloneDeep($scope.dataTasksSub[subHierarchy.root + subHierarchy.name][0].values), function(v) {
            v.value = v.count * (subHierarchy.value || 0);
            v.count = v.count * subHierarchy.value;
            return v;
          });
          $scope.dataUODiffMetricsSub[subHierarchy.root + subHierarchy.name][0].values = _.map(_.cloneDeep($scope.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values), function(v, k) {
            v.value = v.count - $scope.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values[k].count;
            v.count = v.count - $scope.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values[k].count;
            return v;
          });
          $scope.dataUOPerfMetricsSub[subHierarchy.root + subHierarchy.name][0].values = _.map(_.cloneDeep($scope.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values), function(v, k) {
            v.value = v.count / $scope.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values[k].count * 100;
            v.count = v.count / $scope.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values[k].count * 100;
            return v;
          });
          $scope.dataCostSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearKPI($scope.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', 'Cost');
          $scope.dataQualitySub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearKPI($scope.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', 'Quality');
          $scope.dataTimeSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearKPI($scope.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', 'Time');

          $scope.dataQualitySubKPIs[subHierarchy.root + subHierarchy.name] = [];
          _.each($scope.dashboard.kpis, function(kpi) {
            $scope.dataSubKPIs[subHierarchy.root + subHierarchy.name][kpi.constraint][kpi.name] = [{
              values: []
            }];
            $scope.dataSubKPIs[subHierarchy.root + subHierarchy.name][kpi.constraint][kpi.name][0].values = myLibrary.displayLastYearKPI($scope.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', kpi.constraint, kpi.name);
          });

          $scope.dataTasksSubNb[subHierarchy.root + subHierarchy.name] = arraySum(_.compact(_.map($scope.dataTasksSub[subHierarchy.root + subHierarchy.name][0].values, 'value')));
          $scope.dataUOMetricsSubNb[subHierarchy.root + subHierarchy.name] = arraySum(_.compact(_.map($scope.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values, 'value')));
          $scope.dataUODiffMetricsSubNb[subHierarchy.root + subHierarchy.name] = arraySum(_.compact(_.map($scope.dataUODiffMetricsSub[subHierarchy.root + subHierarchy.name][0].values, 'value')));
          $scope.dataMetricsSubNb[subHierarchy.root + subHierarchy.name] = arraySum(_.compact(_.map($scope.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values, 'value')));
          $scope.dataCostSubNb[subHierarchy.root + subHierarchy.name] = arrayAverage(_.compact(_.map($scope.dataCostSub[subHierarchy.root + subHierarchy.name][0].values, 'value')));
          $scope.dataQualitySubNb[subHierarchy.root + subHierarchy.name] = arrayAverage(_.compact(_.map($scope.dataQualitySub[subHierarchy.root + subHierarchy.name][0].values, 'value')));
          $scope.dataTimeSubNb[subHierarchy.root + subHierarchy.name] = arrayAverage(_.compact(_.map($scope.dataTimeSub[subHierarchy.root + subHierarchy.name][0].values, 'value')));

        });

      });

      $scope.options = {
        chart: {
          type: 'discreteBarChart',
          height: 40,
          margin: {
            top: 0,
            right: 0,
            bottom: 2,
            left: 0
          },
          showYAxis: false,
          showXAxis: false,
          color: [
            '#1f77b4'
          ],
          x: function(d) {
            return d.label;
          },
          y: function(d) {
            return d.count;
          },
          showValues: true,
          valueFormat: function(d) {
            return d3.format('.0f')(d);
          },
          transitionDuration: 500,
          discretebar: {
            dispatch: {
              chartClick: function(e) {

              },
              elementClick: function(e) {

              }
            }
          }
        }
      };

      $scope.optionsTasks = angular.copy($scope.options);
      $scope.optionsTasks.chart.color = ['#9467bd'];

      $scope.optionsUOLoad = angular.copy($scope.options);
      $scope.optionsUOLoad.chart.color = ['#2e5463'];

      $scope.optionsUODiff = angular.copy($scope.options);
      $scope.optionsUOLoad.chart.color = ['#2cece6'];

      $scope.optionsLoad = angular.copy($scope.options);
      $scope.optionsLoad.chart.color = ['#87CEEB'];

      $scope.optionsCosts = angular.copy($scope.options);
      $scope.optionsCosts.chart.color = ['#2ecc71'];

    };

    $scope.showRevieuw = function() {
      $scope.dashboardSlide = 'Review';
      $scope.checked = !$scope.checked;
    };

    $scope.showTimeline = function() {
      $scope.dashboardSlide = 'Timeline';
      $scope.checked = !$scope.checked;
    };


    $scope.createNewTask = function(data) {
      var path;
      switch (data) {
        case 'context':
          path = '/task//' + $scope.dashboard.perimeter[0].context;
          break;
        case 'activity':
          path = '/task///' + $scope.dashboard.perimeter[0].activity;
          break;
        case 'both':
          path = '/task//' + $scope.dashboard.perimeter[0].context + '/' + $scope.dashboard.perimeter[0].activity;
          break;
        case 'actionplan':
          if ($scope.dashboard.perimeter[0].context && $scope.dashboard.perimeter[0].activity) {
            path = '/task//' + $scope.dashboard.perimeter[0].context + '/' + $scope.dashboard.perimeter[0].activity;
          }
          if ($scope.dashboard.perimeter[0].context && !$scope.dashboard.perimeter[0].activity) {
            path = '/task//' + $scope.dashboard.perimeter[0].context;
          }
          if (!$scope.dashboard.perimeter[0].context && $scope.dashboard.perimeter[0].activity) {
            path = '/task///' + $scope.dashboard.perimeter[0].activity;
          }
          break;
      }
      if (path) {
        $window.open(path, '_blank');
      }
    };

    $scope.loadTasks = function() {
      var filterPerimeter = {
        $or: [],
        metrics: {
          $elemMatch: {
            status: 'Finished'
          }
        }
      };
      _.each($scope.dashboard.perimeter, function(perimeter) {
        if (perimeter.activity && perimeter.context) {
          filterPerimeter['$or'].push({
            activity: {
              '$regex': perimeter.activity || '',
              $options: '-i'
            },
            context: {
              '$regex': perimeter.context || '',
              $options: '-i'
            }
          });
        } else if (!perimeter.context) {
          filterPerimeter['$or'].push({
            activity: {
              '$regex': perimeter.activity || '',
              $options: '-i'
            }
          });
        } else if (!perimeter.activity) {
          filterPerimeter['$or'].push({
            context: {
              '$regex': perimeter.context || '',
              $options: '-i'
            }
          });
        }
        $scope.filterPerimeter = filterPerimeter;

      });


    };

    $scope.giveMeMyColor = function(value, category) {
      return myLibrary.giveMeMyColor(value, category);
    };

    $scope.$on('dateRangeService:updated', function(event, data) {
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

          _.each($scope.dashboard.tasks, function(task) {
            task.taskSuffIcon = '';
            if (task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined) {
              task.taskSuffIcon = ' <i class="fa fa-question-circle-o text-danger" aria-hidden="true"></i>&nbsp;&nbsp;';
            }
          });
          $scope.filteredPlanTasks = _.filter($scope.dashboard.tasks, function(task) {
            return task.metrics[task.metrics.length - 1].status === 'Not Started';
          });
          $scope.filteredPlanTasksLoad = _.reduce($scope.filteredPlanTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);
          $scope.filteredInProgressTasks = _.filter($scope.dashboard.tasks, function(task) {
            return task.metrics[task.metrics.length - 1].status === 'In Progress';
          });
          $scope.filteredInProgressTasksLoad = _.reduce($scope.filteredInProgressTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);
          $scope.filteredFinishedTasks = _.filter($scope.dashboard.tasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === undefined || task.reviewTask === false);
          });
          $scope.filteredFinishedTasksLoad = _.reduce($scope.filteredFinishedTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);
          $scope.filteredReviewedTasks = _.filter($scope.dashboard.tasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === true);
          });
          $scope.filteredReviewedTasksLoad = _.reduce($scope.filteredReviewedTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);

          //Action Plan
          $scope.filteredActionPlanTasks = _.filter($scope.dashboard.tasks, function(task) {
            return task.actionPlan === true;
          });
          $scope.filteredActionPlanTasksLoad = _.reduce($scope.filteredActionPlanTasks, function(s, task) {
            return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
          }, 0).toFixed(1);
        });
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

        $scope.timelineData = {
          items: items,
          groups: groups
        };
      });
    });

    $scope.loadCompleteDashboard = function() {
      if ($stateParams.id) {
        $scope.myPromise = $http.get('/api/dashboardCompletes/' + $stateParams.id).success(function(dashboard) {

          $http.get('/api/dashboardCompletes/showTasks/' + $stateParams.id).success(function(tasks) {
            dashboard.tasks = tasks;
            $scope.alltasksNb = dashboard.tasks.length;
            $rootScope.$broadcast('dateRangeService:updated', dateRangeService.rangeDateTxt);
          });

          $http.get('/api/anomalies', {
            params: {
              activity: dashboard.activity,
              context: dashboard.context
            }
          }).success(function(anomalies) {
            $scope.anomalies = anomalies;
          });


          dashboard.subscribed = false;
          var userlist = _.pluck(dashboard.users, '_id');
          $scope.userindex = userlist.indexOf($scope.currentUser._id.toString());

          if ($scope.userindex >= 0 && dashboard.users[$scope.userindex] && dashboard.users[$scope.userindex].dashboardName && dashboard.users[$scope.userindex].dashboardName.length > 0) {
            dashboard.name = dashboard.users[$scope.userindex].dashboardName;

            dashboard.subscribed = true;
          }
          $scope.dashboard = dashboard;
          $scope.PerimetersIsExpanded = false;

          $rootScope.perimeter.name = dashboard.name;
          $rootScope.perimeter.id = dashboard._id;
          $rootScope.perimeter.activity = dashboard.activity;
          $rootScope.perimeter.context = dashboard.context;
          $rootScope.perimeter.axis = dashboard.axis;
          $rootScope.perimeter.category = dashboard.category;
          $cookieStore.put('perimeter', $rootScope.perimeter);


          var dataGoals = [];
          var dataAllGoals = [];
          var dataGoals4QCT = [];
          var dataAlerts = [];
          $scope.alertsNb = 0;

          _.forEach($scope.dashboard.kpis, function(kpi) {
            var kpiAlerts = [];
            var kpiGoals = [];

            if (kpi.category === 'Goal') {
              dataGoals4QCT.push({
                name: kpi.constraint,
                value: kpi.calcul.task
              });
              dataAllGoals.push(kpi.calcul.task);
            }
          });


          var scoreOnQCT = _.chain(dataGoals4QCT)
            .flatten()
            .groupBy(function(value) {
              return value.name;
            })
            .map(function(value, key) {
              var sum = _.reduce(value, function(memo, val) {
                return memo + val.value;
              }, 0);
              return {
                name: key,
                value: parseInt(sum / _.filter(value, function(data) {
                  return data.value;
                }).length)
              };
            })
            .value();
          var scoreQualityOnQCT = _.filter(scoreOnQCT, function(data) {
            return data.name === 'Quality';
          })[0] || {
            value: 0
          };
          var scoreCostOnQCT = _.filter(scoreOnQCT, function(data) {
            return data.name === 'Cost';
          })[0] || {
            value: 0
          };
          var scoreTimeOnQCT = _.filter(scoreOnQCT, function(data) {
            return data.name === 'Time';
          })[0] || {
            value: 0
          };
          $scope.goalsNb = parseInt(arrayAverage(_.compact(dataAllGoals)));
          // $scope.lastgoalsNb = _.last($scope.dataGoals[0].values).mean;
          // $scope.lastalertsNb = _.last($scope.dataAlerts[0].values).sum;

          var mydata = {
            'graphset': [{
              'type': 'radar',
              'background-color': 'white',
              'plotarea': {
                'margin': '10px 10px 0px 0px'
              },
              'tooltip': {
                'text': '%t<br>%k Is %v',
                'shadow': 0,
                'border-radius': 3
              },
              'scale-k': {
                'background-color': 'none',
                '-ref-angle': 4,
                'values': ['Quality', 'Time', 'Cost'],
                'item': {
                  'font-size': '14px',
                  'padding-left': '30px',
                  'padding-bottom': '15px',
                  '-visible': false
                },
                'guide': {
                  'line-color': '#818181',
                  'line-style': 'solid',
                  'line-width': '2px',
                  'items': [{
                    'background-color': '#fff'
                  }]
                },
                'tick': {
                  'visible': false
                }
              },
              'scale-v': {
                'values': [0, 20, 40, 60, 80, 100],
                '-visible': false,
                'ref-line': {
                  'line-width': '1px',
                  'line-color': '#818181'
                },
                'guide': {
                  '-visible': false,
                  'line-width': '.5px',
                  'line-style': 'dashed'
                },
                'tick': {
                  '-placement': 'cross',
                  'size': 10,
                  'line-width': '.5px',
                  'line-length': 0.55,
                  'line-color': '#818181'
                },
                'item': {
                  'padding-left': '9.5px',
                  '-padding-bottom': '12.5px',
                  'font-size': '8px'
                }
              },
              'series': [{
                'values': [scoreQualityOnQCT.value, scoreTimeOnQCT.value, scoreCostOnQCT.value],
                'aspect': 'area',
                'text': $scope.dashboard.name,
                'line-color': '#6fbbff',
                'background-color': '#6fbbff',
                'line-width': '3px',
                'alpha': '0.85',
                'marker': {
                  'background-color': '#6fbbff',
                  'size': '4',
                  'border-color': '#6fbbff',
                  'alpha': '0.55'
                }
              }]
            }]
          };

          setTimeout(function() {
            $scope.errors = null;
            $('#context').focusout(function() {
              $scope.contextErrorNotAll = ($scope.dashboard.context.toLowerCase() === 'all');
            });
            $('#activity').focusout(function() {
              $scope.activityErrorNotAll = ($scope.dashboard.activity.toLowerCase() === 'all');
            });

            $scope.loadTasks();
            initializing = false;
            $scope.needToSave = false;
          });
        });
      } else {
        $scope.userindex = 0;
        $scope.PerimetersIsExpanded = true;
        $scope.blnshowConfig = true;

        $rootScope.perimeter.name = null;
        $rootScope.perimeter.id = null;
        $rootScope.perimeter.activity = null;
        $rootScope.perimeter.context = null;
        $rootScope.perimeter.axis = null;
        $rootScope.perimeter.category = null;

        $scope.dashboard = {
          name: '',
          paramId: $stateParams.id,
          users: [{
            _id: $scope.currentUser._id,
            dashboardName: ''
          }],
          perimeter: [{
            activity: null,
            context: null
          }]
        };
      }
    };
    $scope.loadCompleteDashboard();

    // *******************
    // create a new dashboard
    // *******************
    $scope.create = function() {
      $scope.dashboard.users[$scope.userindex].name = $scope.dashboard.name;
      if ($scope.newPerimeterValue.activity || $scope.newPerimeterValue.context) {
        $scope.dashboard.perimeter.push({
          activity: $scope.newPerimeterValue.activity,
          context: $scope.newPerimeterValue.context
        });
      }
      $scope.myPromise = $http.post('/api/dashboardCompletes', $scope.dashboard).success(function(data) {
        var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was created';
        Notification.success(logInfo);
        $location.path('/dashboard/' + data._id);
      });
    };

    // *******************
    // update a task
    // *******************
    $scope.update = function() {
      delete $scope.dashboard.tasks;
      delete $scope.dashboard.kpis;
      delete $scope.dashboard.alerts;

      if ($scope.newPerimeterValue.activity || $scope.newPerimeterValue.context) {
        $scope.dashboard.perimeter.push({
          activity: $scope.newPerimeterValue.activity,
          context: $scope.newPerimeterValue.context
        });
      }
      $scope.myPromise = $http.put('/api/dashboardCompletes/' + $scope.dashboard._id, $scope.dashboard).success(function() {

        var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was updated';
        Notification.success(logInfo);
        $scope.newPerimeterValue = {};
        $scope.showNewPerimeter = false;
        $scope.loadCompleteDashboard();
      });
    };

    $scope.$watchGroup(['dashboard.name', 'newPerimeterValue.activity', 'newPerimeterValue.context'], function(newMap, previousMap) {
      if (initializing) {
        $timeout(function() {
          //initializing = true;
          if ($scope.dashboard) {
            $scope.dashboard.users[$scope.userindex].dashboardName = $scope.dashboard.name;
          }
          //
        });
      } else {
        $scope.dashboard.users[$scope.userindex].dashboardName = $scope.dashboard.name;
        $scope.needToSave = true;
      }
    }, true);


    $scope.$watch('dashboard.perimeter', function(newMap, previousMap) {
      if (initializing) {
        $timeout(function() {
          //initializing = true;
          if ($scope.dashboard && $scope.dashboard.users && $scope.dashboard.users[$scope.userindex]) {
            $scope.dashboard.users[$scope.userindex].dashboardName = $scope.dashboard.name;
          }
          //
        });
      } else {
        if ($scope.dashboard && $scope.dashboard.users && $scope.dashboard.users[$scope.userindex]) {
          $scope.dashboard.users[$scope.userindex].dashboardName = $scope.dashboard.name;
        }
        $scope.needToSave = true;
      }
    }, true);

    $scope.removePerimeter = function(data, index) {
      $scope.dashboard.perimeter.splice(index, 1);
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
        anomalie.context = $scope.dashboard.perimeter[0].context;
        anomalie.activity = $scope.dashboard.perimeter[0].activity;

        anomalie.actor = $scope.currentUser._id;

        $scope.myPromise = $http.post('/api/anomalies', anomalie).success(function(data) {
          $scope.loadCompleteDashboard();
        });
      });

    };

  });
