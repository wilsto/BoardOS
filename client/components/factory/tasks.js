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

          self.dataTasksSub = [];
          self.dataTasksSubReal = [];
          self.dataUOMetricsSub = []; 
          self.dataUODiffMetricsSub = [];
          self.dataUOPerfMetricsSub = [];
          self.dataMetricsSub = [];
          self.dataMetricsSubReal = [];
          self.dataCostSub = [];
          self.dataQualitySub = [];
          self.dataTimeSub = [];

          self.dataTasksSubNb = [];
          self.dataUOMetricsSubNb = [];
          self.dataUODiffMetricsSubNb = [];
          self.dataUOPerfMetricsSubNb = [];
          self.dataMetricsSubNb = [];
          self.dataQualitySubNb = [];
          self.dataCostSubNb = [];
          self.dataTimeSubNb = [];

          self.dataSubKPIs = [];

          self.subTasks = [];
          self.blnShowTasks = [];
          self.blnShowKpis = [];
          self.dataKpis = [];
          self.blnShowAllTasks = false;
          self.showEmptyRow = false;
          self.dataQualitySubKPIs = [];

          self.dataUOMetrics = [{
            values: []
          }];
          self.dataUODiffMetrics = [{
            values: []
          }];
          self.dataUOPerfMetrics = [{
            values: []
          }];

          var iMonth = 0;
          while (iMonth < 12) {
            self.dataUOMetrics[0].values.push({
              label: '',
              month: '',
              month2: iMonth,
              total: 0,
              value: 0,
              count: 0
            });
            iMonth = iMonth + 1;
          }

          _.each(self.subHierarchies, function(subHierarchy) {

            self.dataTasksSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataTasksSubReal[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataUODiffMetricsSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataUOPerfMetricsSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataMetricsSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataMetricsSubReal[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataCostSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataQualitySub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataTimeSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataTimeSub[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataKpis[subHierarchy.root + subHierarchy.name] = [{
              values: []
            }];

            self.dataSubKPIs[subHierarchy.root + subHierarchy.name] = {
              'Cost': [],
              'Quality': [],
              'Time': []
            };

            self.subTasks[subHierarchy.root + subHierarchy.name] = _.sortBy(_.filter(self.list, function(task) {
              var blnReturn = false;

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

              return blnReturn;
            }), function(task) {
              return task.metrics[0].targetEndDate;
            }).reverse();

            self.blnShowTasks[subHierarchy.root + subHierarchy.name] = false;
            self.blnShowKpis[subHierarchy.root + subHierarchy.name] = false;

            self.dataTasksSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearTask(self.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'count');
            self.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearTask(self.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'qty');

            self.dataTasksSubReal[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearTask(self.subTasks[subHierarchy.root + subHierarchy.name], 'endDate', 'count');
            self.dataMetricsSubReal[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearTask(self.subTasks[subHierarchy.root + subHierarchy.name], 'endDate', 'qty');

            self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values = _.map(_.cloneDeep(self.dataTasksSubReal[subHierarchy.root + subHierarchy.name][0].values), function(v) {
              v.value = v.count * (subHierarchy.value || 0);
              v.count = v.count * subHierarchy.value;
              return v;
            });
            self.dataUODiffMetricsSub[subHierarchy.root + subHierarchy.name][0].values = _.map(_.cloneDeep(self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values), function(v, k) {
              v.value = v.count - self.dataMetricsSubReal[subHierarchy.root + subHierarchy.name][0].values[k].count;
              v.count = v.count - self.dataMetricsSubReal[subHierarchy.root + subHierarchy.name][0].values[k].count;
              return v;
            });
            self.dataUOPerfMetricsSub[subHierarchy.root + subHierarchy.name][0].values = _.map(_.cloneDeep(self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values), function(v, k) {
              v.value = v.count / self.dataMetricsSubReal[subHierarchy.root + subHierarchy.name][0].values[k].count * 100;
              v.count = v.count / self.dataMetricsSubReal[subHierarchy.root + subHierarchy.name][0].values[k].count * 100;
              v.color = myLibrary.giveMeMyColor(v.count);
              return v;
            });
            self.dataCostSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearKPI(self.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', 'Cost');
            self.dataQualitySub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearKPI(self.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', 'Quality');
            self.dataTimeSub[subHierarchy.root + subHierarchy.name][0].values = myLibrary.displayLastYearKPI(self.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', 'Time');

            self.dataQualitySubKPIs[subHierarchy.root + subHierarchy.name] = [];
            _.each(obeya.kpis, function(kpi) {
              self.dataSubKPIs[subHierarchy.root + subHierarchy.name][kpi.constraint][kpi.name] = [{
                values: []
              }];
              self.dataSubKPIs[subHierarchy.root + subHierarchy.name][kpi.constraint][kpi.name][0].values = myLibrary.displayLastYearKPI(self.subTasks[subHierarchy.root + subHierarchy.name], 'targetEndDate', 'kpis', kpi.constraint, kpi.name);
            });

            self.dataTasksSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arraySum(_.compact(_.map(self.dataTasksSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            self.dataUOMetricsSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arraySum(_.compact(_.map(self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            self.dataUODiffMetricsSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arraySum(_.compact(_.map(self.dataUODiffMetricsSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            self.dataMetricsSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arraySum(_.compact(_.map(self.dataMetricsSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            self.dataCostSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arrayAverage(_.compact(_.map(self.dataCostSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            self.dataQualitySubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arrayAverage(_.compact(_.map(self.dataQualitySub[subHierarchy.root + subHierarchy.name][0].values, 'count')));
            self.dataTimeSubNb[subHierarchy.root + subHierarchy.name] = myLibrary.arrayAverage(_.compact(_.map(self.dataTimeSub[subHierarchy.root + subHierarchy.name][0].values, 'count')));

            var iMonth2 = 0;
            while (iMonth2 < 12) {
              self.dataUOMetrics[0].values[iMonth2].label = self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].label;
              self.dataUOMetrics[0].values[iMonth2].month = self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].month;
              self.dataUOMetrics[0].values[iMonth2].month2 = self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].month2;
              self.dataUOMetrics[0].values[iMonth2].total += self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].total;
              self.dataUOMetrics[0].values[iMonth2].value += isNaN(self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].value) ? 0 : self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].value;
              self.dataUOMetrics[0].values[iMonth2].count += isNaN(self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].count) ? 0 : self.dataUOMetricsSub[subHierarchy.root + subHierarchy.name][0].values[iMonth2].count;
              iMonth2 = iMonth2 + 1;
            }

          });

          self.dataUODiffMetrics[0].values = _.map(_.cloneDeep(self.dataUOMetrics[0].values), function(v, k) {
            v.value = v.count - self.dataMetrics[0].values[k].count;
            v.count = v.count - self.dataMetrics[0].values[k].count;
            return v;
          });
          self.dataUOPerfMetrics[0].values = _.map(_.cloneDeep(self.dataUOMetrics[0].values), function(v, k) {
            v.value = v.count / self.dataMetrics[0].values[k].count * 100;
            v.count = v.count / self.dataMetrics[0].values[k].count * 100;
            v.color = myLibrary.giveMeMyColor(v.count);
            return v;
          });

          self.dataUOMetricsNb = myLibrary.arraySum(_.compact(_.map(self.dataUOMetrics[0].values, 'count')));
          self.dataUODiffMetricsNb = myLibrary.arraySum(_.compact(_.map(self.dataUODiffMetrics[0].values, 'count')));
          self.dataUOPerfMetricsNb = myLibrary.arrayAverage(_.compact(_.map(self.dataUOPerfMetrics[0].values, 'count')));
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
