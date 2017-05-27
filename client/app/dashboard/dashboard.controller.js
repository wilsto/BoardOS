'use strict';

angular.module('boardOsApp')
  .controller('DashboardCtrl', function($scope, $rootScope, $http, $stateParams, myLibrary, $cookieStore, $location, Notification, $timeout, dateRangeService) {

    var initializing = true;

    function average(arr) {
      return _.reduce(arr, function(memo, num) {
        return memo + num;
      }, 0) / arr.length;
    }

    $scope.refreshDashboard = function() {
      $scope.myPromise = $http.get('/api/dashboardCompletes/executeId/' + $stateParams.id).success(function(response) {
        $scope.loadCompleteDashboard();
      });
    };


    $scope.createNewTask = function(data) {
      
      switch (data) {
        case 'context':
          $location.path('/task//' + $scope.dashboard.context);
          break;
        case 'activity':
          $location.path('/task///' + $scope.dashboard.activity);
          break;
        case 'both':
          $location.path('/task//' + $scope.dashboard.context + '/' + $scope.dashboard.activity);
          break;
      }
    };

    $scope.loadTasks = function() {
      $http.get('/api/taskFulls/countByMonth', {
        params: {
          activity: $rootScope.perimeter.activity,
          context: $rootScope.perimeter.context
        }
      }).success(function(tasks) {
        $scope.dataTasks = [{
          values: []
        }];

        $scope.dataMetrics = [{
          values: []
        }];

        $scope.metricsNb = tasks.reduce(function(pv, cv) {
          return pv + cv.value.qty;
        }, 0);

        $scope.dataTasks[0].values = myLibrary.displayLastYear(tasks, '_id', 'count', true);
        $scope.dataMetrics[0].values = myLibrary.displayLastYear(tasks, '_id', 'qty', true);

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
        $scope.$apply(function() {
          $scope.filteredPlanTasks = _.filter($scope.dashboard.tasks, function(task) {
            var a = moment(new Date()).add($scope.datediff, 'days');
            var b = moment(new Date(task.metrics[task.metrics.length - 1].targetstartDate));
            return task.metrics[task.metrics.length - 1].status === 'Not Started';
          });
          $scope.filteredInProgressTasks = _.filter($scope.dashboard.tasks, function(task) {
            var a = moment(new Date()).add($scope.datediff, 'days');
            var b = moment(new Date(task.metrics[task.metrics.length - 1].startDate || task.metrics[task.metrics.length - 1].targetstartDate));
            return task.metrics[task.metrics.length - 1].status === 'In Progress';
          });
          $scope.filteredFinishedTasks = _.filter($scope.dashboard.tasks, function(task) {
            var a = moment(new Date());
            var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate || task.metrics[task.metrics.length - 1].targetEndDate));
            return ($scope.datediff >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished');
          });
        });
      });
    });

    $scope.loadCompleteDashboard = function() {
      if ($stateParams.id) {
        $scope.myPromise = $http.get('/api/dashboardCompletes/' + $stateParams.id).success(function(dashboard) {

          dashboard.subscribed = false;
          var userlist = _.pluck(dashboard.users, '_id');
          $scope.userindex = userlist.indexOf($scope.currentUser._id.toString());

          if ($scope.userindex >= 0 && dashboard.users[$scope.userindex] && dashboard.users[$scope.userindex].dashboardName && dashboard.users[$scope.userindex].dashboardName.length > 0) {
            dashboard.name = dashboard.users[$scope.userindex].dashboardName;

            dashboard.subscribed = true;
          }
          $scope.dashboard = dashboard;

          $rootScope.perimeter.name = dashboard.name;
          $rootScope.perimeter.id = dashboard._id;
          $rootScope.perimeter.activity = dashboard.activity;
          $rootScope.perimeter.context = dashboard.context;
          $rootScope.perimeter.axis = dashboard.axis;
          $rootScope.perimeter.category = dashboard.category;
          $cookieStore.put('perimeter', $rootScope.perimeter);

          $scope.tasksNb = dashboard.tasks.length;

          $rootScope.$broadcast('dateRangeService:updated', dateRangeService.rangeDateTxt);

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
          $scope.goalsNb = parseInt(average(_.compact(dataAllGoals)));
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
            zingchart.render({
              id: 'myChartQCT',
              data: mydata,
              height: 200,
              width: '100%'
            });
            $scope.errors = null;
            $('#context').focusout(function() {
              $scope.contextErrorNotAll = ($scope.dashboard.context.toLowerCase() === 'all');
            });
            $('#activity').focusout(function() {
              $scope.activityErrorNotAll = ($scope.dashboard.activity.toLowerCase() === 'all');
            });

            $scope.loadTasks();
            initializing = false;
          });
        });
      } else {
        $scope.userindex = 0;
        $scope.dashboard = {
          name: '',
          paramId: $stateParams.id,
          users: [{
            _id: $scope.currentUser._id,
            dashboardName: ''
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
      $http.post('/api/dashboardCompletes', $scope.dashboard).success(function(data) {
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

      $http.put('/api/dashboardCompletes/' + $scope.dashboard._id, $scope.dashboard).success(function() {
        var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was updated';
        Notification.success(logInfo);
        $scope.loadCompleteDashboard();
      });
    };

    $scope.$watchGroup(['dashboard.name', 'dashboard.context', 'dashboard.activity'], function(newMap, previousMap) {
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
        $scope.update();
      }
    }, true);

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
        color: [
          '#1f77b4'
        ],
        x: function(d) {
          return d.label;
        },
        y: function(d) {
          return parseInt(d.count);
        },
        showValues: false,
        transitionDuration: 500
      }
    };

    $scope.optionsTasks = angular.copy($scope.options);
    $scope.optionsTasks.chart.color = ['#9467bd'];

    $scope.optionsMetrics = angular.copy($scope.options);
    $scope.optionsMetrics.chart.color = ['#87CEEB'];
  });
