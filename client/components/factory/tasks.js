'use strict';

angular.module('boardOsApp').factory('Tasks', function($http, Notification, $rootScope, dateRangeService, calendarConfig, myLibrary) {
  // Define the Tasks function
  var Tasks = function(obeya) {

    // Define the initialize function
    this.initialize = function() {
      this.loadTasks();
    }
    this.loadTasks = function() {

      // ***************************************************
      // Fetch the data from tasks in perimeter & timeRange
      // ***************************************************
      var startDate = $rootScope.startRange || dateRangeService.getDates().startRange;
      var endRange = $rootScope.endRange || dateRangeService.getDates().endRange;
      var myparams = {
        params: {
          startRange: startDate,
          endRange: endRange
        }
      };
      var url = '/api/dashboardCompletes/showTasks/' + obeya._id;
      var tasksData = $http.get(url, myparams);
      var self = this;

      tasksData.then(function(response) {
        self.allTasks = response.data;

        self.allTasksNb = self.allTasks.length;

        _.each(self.allTasks, function(task) {

          // ajout icon si tache incomplete
          task.taskIncompleteIcon = '';
          if (task.metrics && task.metrics[task.metrics.length - 1].status === 'Finished' && (task.metrics && task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined)) {
            task.taskIncompleteIcon = ' <i class="fa fa-question-circle orange" ></i>&nbsp;&nbsp;';
          }

          // ajout icon si tache en alerte
          task.taskSuccessIcon = '';
          if (task.success) {
            task.taskSuccessIcon = ' <i class="fa fa-thumbs-up green pull-right"></i>&nbsp;&nbsp;';
          }

          // ajout icon si tache en alerte
          task.taskAlertIcon = '';
          if ((_.compact(_.map(task.alerts, 'calcul.task')).length > 0) || (task.metrics && (task.metrics[task.metrics.length - 1].status === 'Not Started' && moment(task.metrics[task.metrics.length - 1].targetEndDate) < moment()))) {
            task.taskAlertIcon = ' <i class="fa fa-bell text-danger pull-right"></i>&nbsp;&nbsp;';
          }

          // ajout icon
          switch (task.metrics[task.metrics.length - 1].status) {
            case 'In Progress':
              task.taskIcon = '<i class="fa fa-spinner" aria-hidden="true"></i>&nbsp;&nbsp; ';
              task.taskColor = calendarConfig.colorTypes.info;
              break;
            case 'Finished':
              if (task.reviewTask === true) {
                task.taskIcon = '<i class="far fa-bookmark text-success" aria-hidden="true"></i>&nbsp;&nbsp; ';
                task.taskColor = calendarConfig.colorTypes.success;

              } else {
                task.taskIcon = '<i class="far fa-check-square" aria-hidden="true"></i>&nbsp;&nbsp; ';
                task.taskColor = calendarConfig.colorTypes.success;
              }

              break;
            default:
              task.taskIcon = '<i class="far fa-square" aria-hidden="true"></i>&nbsp;&nbsp; ';
              task.taskColor = '';
          }
        });

        self.filterPlan = self.filter('Not Started');
        self.filterPlanNb = self.filterPlan.length;
        self.filterPlanLoad = self.load(self.filterPlan);

        self.filterInProgress = self.filter('In Progress');
        self.filterInProgressNb = self.filterInProgress.length;
        self.filterInProgressLoad = self.load(self.filterInProgress);

        self.filterWithdrawn = self.filter('Withdrawn', false);
        self.filterWithdrawnNb = self.filterWithdrawn.length;
        self.filterWithdrawnLoad = self.load(self.filterWithdrawn);

        self.filterFinished = self.filter('Finished', false);
        self.filterFinishedNb = self.filterFinished.length;
        self.filterFinishedLoad = self.load(self.filterFinished);

        self.filterReviewed = self.filter('Finished', true);
        self.filterReviewedNb = self.filterReviewed.length;
        self.filterReviewedLoad = self.load(self.filterReviewed);

        self.filterClosed = _.concat(self.filterFinished, self.filterReviewed, self.filterWithdrawn);
        self.filterClosedNb = self.filterFinishedNb + self.filterReviewedNb + self.filterWithdrawnNb;
        console.log('SELF.FILTERCLOSEDNB', self.filterClosedNb)

        self.filterTasksWithSuccess = _.filter(self.allTasks, function(task) {
          return task.success;
        });
        self.filterTasksWithSuccessNb = self.filterTasksWithSuccess.length;


        self.filterTasksWithAlert = _.filter(self.allTasks, function(task) {
          return task.taskAlertIcon !== '';
        });
        self.filterTasksWithAlertNb = self.filterTasksWithAlert.length;

        self.filterTasksIncomplete = _.filter(self.allTasks, function(task) {
          return task.taskIncompleteIcon !== '';
        });
        self.filterTasksIncompleteNb = self.filterTasksIncomplete.length;

        self.SubProcessList();

        self.events = [];
        _.each(self.allTasks, function(task) {

          self.events.push({
            title: task.taskIcon + task.taskIncompleteIcon + task.name,
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


      // ***************************************************
      // Fetch the data from tasks group by month
      // ***************************************************
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
        self.listMonth = response.data.results;

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
        self.allmetricsNb = parseInt(_.reduce(self.listMonth, function(result, v, k) {
          return result + v.value.qty;
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


      // ***************************************************
      // Fetch the data from tasks in perimeter & timeRange
      // ***************************************************
      this.SubProcessList = function() {

        var process = $rootScope.obeyaPerimeter[0].activity;
        var myparams = {
          params: {
            process: process
          }
        };

        var processListURL = '/api/hierarchies/list/process';
        var processListData = $http.get(processListURL, myparams);

        processListData.then(function(response) {
          self.processList = response.data;

          // liste des process définis
          _.each(self.processList, function(process) {
            process.isValidPath = true;
            process.isUsedPath = (_.map(self.filterClosed, 'activity').indexOf(process.longname) >= 0);
            process.isCalculatedPath = false;
            process.level = (process.longname.match(new RegExp('\\.', 'g')) || []).length;
          });

          // liste des process utilisés dans les taches
          var allTasksProcess = _.map(_.uniqBy(self.filterClosed, 'activity'), function(taskProcess) {
            return {
              longname: taskProcess.activity
            };
          });

          _.each(allTasksProcess, function(taskProcess) {
            taskProcess.isValidPath = (_.map(self.processList, 'longname').indexOf(taskProcess.longname) >= 0);
            taskProcess.isUsedPath = true;
            taskProcess.isCalculatedPath = false;
            taskProcess.level = (taskProcess.longname.match(new RegExp('\\.', 'g')) || []).length;

            var lastDot = taskProcess.longname.lastIndexOf('.');
            taskProcess.root = taskProcess.longname.substring(0, lastDot);
            taskProcess.name = taskProcess.longname.substring(lastDot + 1);

            if (_.indexOf(_.map(self.processList, 'longname'), taskProcess.longname) < 0) {
              self.processList.push(taskProcess);
            }
          });

          self.processNb = self.processList.length;
          self.processNotDefinedNb = _.filter(self.processList, {'isValidPath' : false}).length;
          self.processNotUsedNb = _.filter(self.processList, {'isUsedPath' : false}).length;


          var isUsed = _.filter(self.processList, {
            'isUsedPath': true
          });
          var calculatedPaths = [];
          _.each(self.processList, function(process) {
            _.each(isUsed, function(usedPath) {
              if (usedPath.longname.indexOf(process.longname) >= 0 && usedPath.longname !== process.longname) {
                calculatedPaths.push(_.cloneDeep(process));
              }
            });
          })
          calculatedPaths = _.uniqBy(calculatedPaths, 'longname');
          _.each(calculatedPaths, function(process) {
            process.isCalculatedPath = true;
          });
          self.processList = self.processList.concat(calculatedPaths);

          self.processList = _.orderBy(self.processList, ['longname', 'isCalculatedPath'], ['asc', 'desc']);


          _.each(self.processList, function(process) {
            process.blnShowTasks = false;
            if (process.isCalculatedPath === false) {
              process.tasks = _.orderBy(_.filter(self.filterClosed, function(task) {
                var blnFinish = task.metrics && (task.metrics[task.metrics.length - 1].status === 'Finished' || task.metrics[task.metrics.length - 1].status === 'Withdrawn');
                var blnActivity = task.activity === process.root + '.' + process.name;
                return blnFinish && blnActivity;
              }), function(task) {
                return task.metrics[task.metrics.length - 1].targetEndDate;
              }).reverse();
            } else {
              process.tasks = _.orderBy(_.filter(self.filterClosed, function(task) {
                var blnFinish = task.metrics && (task.metrics[task.metrics.length - 1].status === 'Finished' || task.metrics[task.metrics.length - 1].status === 'Withdrawn');
                var blnActivity = task.activity.indexOf(process.longname) >= 0;
                return blnFinish && blnActivity;
              }), function(task) {
                return task.metrics[task.metrics.length - 1].targetEndDate;
              }).reverse();
            }

            process.calculGroupBy = {
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
            process.calculGroupBy['none'].count = process.tasks.length;

            process.calculGroupBy['none'].sum = Math.round(myLibrary.arraySum(_.compact(_.map(process.tasks, function(task) {
              return task.metrics[task.metrics.length - 1].timeSpent;
            }))) * 10) / 10;
            process.calculGroupBy['none'].quality = Math.round(myLibrary.arrayAverage(_.compact(_.flattenDeep(_.map(process.tasks, function(task) {
              var value = _.map(task.kpis, function(kpi) {
                return (kpi.constraint === 'Quality') ? kpi.calcul.task : null;
              });
              return value;
            })))) * 10) / 10;

            process.calculGroupBy['none'].cost = Math.round(myLibrary.arrayAverage(_.compact(_.flattenDeep(_.map(process.tasks, function(task) {
              var value = _.map(task.kpis, function(kpi) {
                return (kpi.constraint === 'Cost') ? kpi.calcul.task : null;
              });
              return value;
            })))) * 10) / 10;
            process.calculGroupBy['none'].time = Math.round(myLibrary.arrayAverage(_.compact(_.flattenDeep(_.map(process.tasks, function(task) {
              var value = _.map(task.kpis, function(kpi) {
                return (kpi.constraint === 'Time') ? kpi.calcul.task : null;
              });
              return value;
            })))) * 10) / 10;

            // if group ******
            // self.dataTasksSubNb[process.longname] = self.dataMetricsSub[process.longname]['none'].length;
            // self.dataMetricsSubNb[process.longname] =  myLibrary.arraySum(_.compact(_.map(self.dataMetricsSub[process.longname]['none'], function(task){
            //     return task.metrics[task.metrics.length-1].timeSpent;
            // })));
            // self.dataCostSubNb[process.longname] = myLibrary.arrayAverage(_.compact(_.map(self.dataCostSub[process.longname][0].values, 'count')));
            // self.dataQualitySubNb[process.longname] = myLibrary.arrayAverage(_.compact(_.map(self.dataQualitySub[process.longname][0].values, 'count')));
            // self.dataTimeSubNb[process.longname] = myLibrary.arrayAverage(_.compact(_.map(self.dataTimeSub[process.longname][0].values, 'count')));


          });
          console.log('  SELF.PROCESSLIST', self.processList)
        });
      };

    };

    this.filter = function(status, review) {
      return _.filter(this.allTasks, function(task) {
        var blnReview = (review) ? (task.reviewTask === true) : (task.reviewTask === undefined || task.reviewTask === false);
        var blnReturn = (status !== 'All') ? task.metrics && task.metrics[task.metrics.length - 1].status === status && blnReview : task.metrics;
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
