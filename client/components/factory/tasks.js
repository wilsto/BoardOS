'use strict';

angular.module('boardOsApp').factory('Tasks', function($http, Notification, $rootScope, dateRangeService, calendarConfig, myLibrary) {
  // Define the Tasks function
  var Tasks = function(obeya) {

    // Define the initialize function
    this.initialize = function() {

      // Fetch the tasks
      var url = '/api/dashboardCompletes/showTasks/' + obeya._id;
      var tasksData = $http.get(url);
      var self = this;

      tasksData.then(function(response) {
        self.list = response.data;

        self.alltasksNb = self.list.length;

        self.openTasksNb = _.filter(self.list, function(task) {
          return task.metrics && task.metrics[task.metrics.length - 1].status !== 'Finished';
        }).length;


        _.each(self.list, function(task) {
          task.taskSuffIcon = '';
          if (task.metrics && task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined) {
            task.taskSuffIcon = ' <i class="fa fa-question-circle-o text-danger" aria-hidden="true"></i>&nbsp;&nbsp;';
          }
        });

        self.filterPlan = self.filter('Not Started');
        self.filterPlanLoad = self.load(self.filterPlan);

        self.filterInProgress = self.filter('In Progress');
        self.filterInProgressLoad = self.load(self.filterInProgress);

        self.filterFinished = self.filter('Finished', false, dateRangeService.datediff);
        self.filterFinishedLoad = self.load(self.filterFinished);

        self.filterReviewed = self.filter('Finished', true, dateRangeService.datediff);
        self.filterReviewedLoad = self.load(self.filterReviewed);

        self.filterTimeBoxed = self.filter('All', true, dateRangeService.datediff);
        self.filterTimeBoxedLoad = self.load(self.filterReviewed);

        self.SubMonthDetails();

        self.events = [];
        _.each(self.list, function(task) {
          task.taskSuffIcon = '';
          switch (task.metrics[task.metrics.length - 1].status) {
            case 'In Progress':
              task.taskIcon = '<i class="fa fa-spinner" aria-hidden="true"></i>&nbsp;&nbsp; ';
              task.taskColor = calendarConfig.colorTypes.info;
              break;
            case 'Finished':
              if (task.reviewTask === true) {
                task.taskIcon = '<i class="fa fa-bookmark-o text-success" aria-hidden="true"></i>&nbsp;&nbsp; ';
                task.taskColor = calendarConfig.colorTypes.success;

              } else {
                task.taskIcon = '<i class="fa fa-check-square-o" aria-hidden="true"></i>&nbsp;&nbsp; ';
                task.taskColor = calendarConfig.colorTypes.success;
              }
              if (task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined) {
                task.taskSuffIcon = ' <i class="fa fa-question-circle-o text-danger" aria-hidden="true"></i>&nbsp;&nbsp;';
              }
              break;
            default:
              task.taskIcon = '<i class="fa fa-square-o " aria-hidden="true"></i>&nbsp;&nbsp; ';
              task.taskColor = '';
          }

          self.events.push({
            title: task.taskIcon + task.taskSuffIcon + task.name,
            eventType: 'task',
            eventId: task._id,
            displayEventTimes: false, // Indicates whether need to show time or not.
            startsAt: moment(task.metrics[task.metrics.length - 1].startDate || task.metrics[task.metrics.length - 1].targetstartDate).set({
              hour: 0,
              minute: 0,
              second: 0,
              millisecond: 0
            }).toDate(),
            endsAt: moment(task.metrics[task.metrics.length - 1].endDate || task.metrics[task.metrics.length - 1].targetEndDate).set({
              hour: 2,
              minute: 0,
              second: 0,
              millisecond: 0
            }).toDate(),
            color: task.taskColor,
            draggable: (task.metrics[task.metrics.length - 1].status !== 'Finished')
          });
        });


      });

      // Fetch the tasks

      var filterPerimeter = {
        $or: [],
        metrics: {
          $elemMatch: {
            status: 'Finished'
          }
        }
      };
      _.each(obeya.perimeter, function(perimeter) {
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
        self.filterPerimeter = filterPerimeter;
      });



      // Overview : Top graphs
      var urlMonth = '/api/taskFulls/countByMonth';
      var tasksMonthData = $http.get(urlMonth, {
        params: {
          filterPerimeter: self.filterPerimeter
        }
      });

      tasksMonthData.then(function(response) {
        self.listMonth = response.data;

        self.dataTasks = [{
          values: []
        }];

        self.dataMetrics = [{
          values: []
        }];

        self.dataCost = [{
          values: []
        }];
        self.dataQuality = [{
          values: []
        }];
        self.dataTime = [{
          values: []
        }];
        self.allmetricsNb = parseInt(self.listMonth.reduce(function(pv, cv) {
          return pv + cv.value.qty;
        }, 0));

        self.dataTasks[0].values = myLibrary.displayLastYear(self.listMonth, '_id', 'count', true);
        self.dataMetrics[0].values = myLibrary.displayLastYear(self.listMonth, '_id', 'qty', true);

        self.tasksNb = myLibrary.arraySum(_.compact(_.map(self.dataTasks[0].values, 'value')));
        self.metricsNb = myLibrary.arraySum(_.compact(_.map(self.dataMetrics[0].values, 'value')));

        self.optionsDiscreteBarChart = {
          chart: {
            type: 'discreteBarChart',
            height: 100,
            margin: {
              top: 0,
              right: 0,
              bottom: 20,
              left: 0
            },
            showYAxis: false,
            showXAxis: true,
            color: [
              '#1f77b4'
            ],
            x: function(d) {
              return d.month;
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

        self.optionsTasks = angular.copy(self.optionsDiscreteBarChart);
        self.optionsTasks.chart.color = ['#9467bd'];

        self.optionsLoad = angular.copy(self.optionsDiscreteBarChart);
        self.optionsLoad.chart.color = ['#87CEEB'];

      });

      this.SubMonthDetails = function() {

        self.subs = 'Activity';
        var urlMonthDetails = '/api/hierarchies/sublist/' + self.subs + '/dashboard/' + obeya._id + '/false';
        var tasksMonthDetailsData = $http.get(urlMonthDetails);

        tasksMonthDetailsData.then(function(response) {
          self.listMonthDetails = response.data;

          self.subHierarchies = _.sortBy(self.listMonthDetails, ['root', 'name']);

          self.subTasks = [];
          self.groupSubTasks = [];
          self.blnShowTasks = [];
          self.blnShowKpis = [];
          self.dataKpis = [];
          self.blnShowAllTasks = false;
          self.showEmptyRow = false;

          _.each(self.subHierarchies, function(subHierarchy) {

            self.blnShowTasks[subHierarchy.root + subHierarchy.name] = false;
            self.blnShowKpis[subHierarchy.root + subHierarchy.name] = false;

            self.subTasks[subHierarchy.root + subHierarchy.name] = _.sortBy(_.filter(self.list, function(task) {
              var blnReturn = false;
              var blnReturnTimeBox = false;

              _.each(obeya.perimeter, function(perimeter) {

                var subActivityFilter = perimeter.activity || '';
                var subContextFilter = perimeter.context || '';

                subActivityFilter = subActivityFilter.replace('^', '');
                subContextFilter = subContextFilter.replace('^', '');

                if (self.subs === 'Activity' && (subHierarchy.root + subHierarchy.name).indexOf(subActivityFilter) > -1) {
                  if (!blnReturn) {
                    blnReturn = ((subHierarchy.root + subHierarchy.name) !== subActivityFilter && (task.activity.indexOf(subActivityFilter) === 0 && task.activity.indexOf(subHierarchy.root + subHierarchy.name) === 0 || task.activity + '$' === subHierarchy.root + subHierarchy.name) && task.context.indexOf(subContextFilter) === 0 && task.metrics[task.metrics.length - 1].status === 'Finished');
                  }
                }

                if (self.subs === 'Context' && (subHierarchy.root + subHierarchy.name).indexOf(subContextFilter) === 0) {
                  if (!blnReturn) {
                    blnReturn = ((subHierarchy.root + subHierarchy.name) !== subContextFilter && (task.context.indexOf(subContextFilter) === 0 && task.context.indexOf(subHierarchy.root + subHierarchy.name) === 0 || task.context + '$' === subHierarchy.root + subHierarchy.name) && task.activity.indexOf(subActivityFilter) > -1 && task.metrics[task.metrics.length - 1].status === 'Finished');
                  }
                }
              });

              if ((moment(task.metrics[task.metrics.length - 1].targetEndDate) > dateRangeService.startRange) && (moment(task.metrics[task.metrics.length - 1].targetEndDate) < dateRangeService.endRange)) {
                blnReturnTimeBox = true;
              }

              return blnReturn && blnReturnTimeBox;

            }), function(task) {
              return task.metrics[task.metrics.length - 1].targetEndDate;
            }).reverse();

            self.groupSubTasks[subHierarchy.root + subHierarchy.name] = {
              'none': {
                'count': 0,
                'sum': 0,
                'cost': 0,
                'quality': 0,
                'time': 0
              },
              'day': {
                'count': [],
                'sum': [],
                'cost': [],
                'quality': [],
                'time': []
              },
              'week': {
                'count': [],
                'sum': [],
                'cost': [],
                'quality': [],
                'time': []
              },
              'month': {
                'count': [],
                'sum': [],
                'cost': [],
                'quality': [],
                'time': []
              },
              'year': {
                'count': [],
                'sum': [],
                'cost': [],
                'quality': [],
                'time': []
              },
            };


            // if no group
            self.groupSubTasks[subHierarchy.root + subHierarchy.name]['none'].count = self.subTasks[subHierarchy.root + subHierarchy.name].length;

            self.groupSubTasks[subHierarchy.root + subHierarchy.name]['none'].sum = Math.round(myLibrary.arraySum(_.compact(_.map(self.subTasks[subHierarchy.root + subHierarchy.name], function(task) {
              return task.metrics[task.metrics.length - 1].timeSpent;
            })))* 10) / 10;
            self.groupSubTasks[subHierarchy.root + subHierarchy.name]['none'].quality = Math.round(myLibrary.arrayAverage(_.compact(_.flattenDeep(_.map(self.subTasks[subHierarchy.root + subHierarchy.name], function(task) {
              var value = _.map(task.kpis, function(kpi) {
                return (kpi.constraint === 'Quality') ? kpi.calcul.task : null;
              });
              return value;
            }))))* 10) / 10;

            self.groupSubTasks[subHierarchy.root + subHierarchy.name]['none'].cost = Math.round(myLibrary.arrayAverage(_.compact(_.flattenDeep(_.map(self.subTasks[subHierarchy.root + subHierarchy.name], function(task) {
              var value = _.map(task.kpis, function(kpi) {
                return (kpi.constraint === 'Cost') ? kpi.calcul.task : null;
              });
              return value;
            }))))* 10) / 10;
            self.groupSubTasks[subHierarchy.root + subHierarchy.name]['none'].time = Math.round(myLibrary.arrayAverage(_.compact(_.flattenDeep(_.map(self.subTasks[subHierarchy.root + subHierarchy.name], function(task) {
              var value = _.map(task.kpis, function(kpi) {
                return (kpi.constraint === 'Time') ? kpi.calcul.task : null;
              });
              return value;
            }))))* 10) / 10;

            // if group ******
            // self.dataTasksSubNb[subHierarchy.root + subHierarchy.name] = self.dataMetricsSub[subHierarchy.root + subHierarchy.name]['none'].length;
            // self.dataMetricsSubNb[subHierarchy.root + subHierarchy.name] =  myLibrary.arraySum(_.compact(_.map(self.dataMetricsSub[subHierarchy.root + subHierarchy.name]['none'], function(task){
            //     return task.metrics[task.metrics.length-1].timeSpent;
            // })));
            // self.dataCostSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arrayAverage(_.compact(_.map(self.dataCostSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            // self.dataQualitySubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arrayAverage(_.compact(_.map(self.dataQualitySub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            // self.dataTimeSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arrayAverage(_.compact(_.map(self.dataTimeSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));


          });
        });
      };

    };

    this.filter = function(status, review, datediff) {
      var a = moment(new Date());
      return _.filter(this.list, function(task) {
        var b = (task.metrics) ? moment(new Date(task.metrics[task.metrics.length - 1].endDate)) : a;
        var blnDate = (datediff) ? (datediff >= a.diff(b, 'days')) : true;
        var blnReview = (review) ? (task.reviewTask === true) : (task.reviewTask === undefined || task.reviewTask === false);
        var blnReturn = (status !== 'All') ? blnDate && task.metrics && task.metrics[task.metrics.length - 1].status === status && blnReview : blnDate && task.metrics;
        return blnReturn;
      });
    };

    this.load = function(filteredTasks) {
      return _.reduce(filteredTasks, function(s, task) {
        return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
      }, 0).toFixed(1);
    };

    // Call the initialize function for every new instance
    this.initialize();

  };

  // Return a reference to the function
  return (Tasks);
});
