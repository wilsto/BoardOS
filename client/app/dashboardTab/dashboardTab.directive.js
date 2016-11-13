'use strict';

angular.module('boardOsApp')
  .directive('dashboardTab', function(ngDialog, $location, $rootScope, myLibrary, Auth, $http, Notification) {
    return {
      templateUrl: 'app/dashboardTab/dashboardTab.html',
      restrict: 'EA',
      scope: {
        dashboardType: '@',
        dashboardData: '='
      },
      link: function(scope, element, attrs) {

        scope.helpCategory = 'General';
        /**
         * Display Table
         */

        scope.$watch('dashboardData', function() {
          scope.dataTable = scope.dashboardData[scope.dashboardType];
        });

        scope.dataTable = scope.dashboardData[scope.dashboardType];
        scope.page = $location.path().split('/')[1];

        Auth.isAdmin(function(data) {
          scope.isAdmin = data;
        });

        scope.isManager = false;
        Auth.isManager(function(data) {
          scope.isManager = data;
        });

        scope.giveMeMyColor = function(value, category) {
          return myLibrary.giveMeMyColor(value, category);
        };

        scope.loadHelp = function() {
          $http.get('/api/helps').success(function(helps) {
            scope.helps = helps;
          });
        };

        scope.createNewHelp = function() {
          $http.post('/api/helps', {
            title: 'new',
            info: 'to describe',
            category: scope.helpCategory
          }).success(function() {
            scope.loadHelp();
          });
          Notification.success('New help was updated');
        };

        if (scope.dashboardType === 'help') {
          scope.loadHelp();
        }

        scope.changeTab = function(name) {
          scope.helpCategory = name;
        };
        /**
         * Display DirectBar for Task
         */
        if (scope.page === 'task' && scope.dashboardType === 'kpis') {
          _.forEach(scope.dataTable, function(task, key2) {
            task.data = [{
              values: []
            }];
            _.forEach(scope.dashboardData.calcul.taskTime, function(value, key) {
              if (value.task === task.name) {
                task.data[0].values = myLibrary.displayLastYear(value.time, 'month', 'valueKPI');
              }
            });
            _.forEach(scope.dashboardData.metricsGroupBy.Task, function(value, key) {
              if (key === task.name) {
                task.lastmetric = _.last(_.sortBy(value, 'date'));
              }
            });
          });
        }
        /**
         * Display DirectBar for Task
         */
        if (scope.page === 'KPI' && scope.dashboardType === 'tasks') {
          _.forEach(scope.dataTable, function(task, key2) {
            task.data = [{
              values: []
            }];
            _.forEach(scope.dashboardData.calcul.taskTime, function(value, key) {
              if (value.task === task.name) {
                task.data[0].values = myLibrary.displayLastYear(value.time, 'month', 'valueKPI');
              }
            });
            _.forEach(scope.dashboardData.metricsGroupBy.Task, function(value, key) {
              if (key === task.name) {
                task.lastmetric = _.last(_.sortBy(value, 'date'));
              }
            });
          });
          scope.options = {
            chart: {
              type: 'discreteBarChart',
              height: 20,
              width: 260,
              margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
              },
              showXAxis: true,
              showYAxis: false,
              color: function(d) {
                switch (true) {
                  case d.value === null:
                    return ['none'];
                  case d.value > 66:
                    return ['#2ca02c'];
                  case d.value === 0:
                    return ['#008B00'];
                  default:
                    return ['#CB4B16'];
                }
              },
              x: function(d) {
                return d.month;
              },
              y: function(d) {
                switch (true) {
                  case d.value === null:
                    return null;
                  case d.value > 66:
                    return 100;
                  case d.value === 0:

                    return 100;
                  default:
                    return 100;
                }
              },
              showValues: false,
              transitionDuration: 500
            }
          };

        }

        /**
         * Display DirectBar for KPI
         */
        if (scope.page === 'dashboard' && scope.dashboardType === 'kpis') {
          _.forEach(scope.dataTable, function(kpi, key) {
            kpi.data = [{
              values: []
            }];
            //
            kpi.data[0].values = myLibrary.displayLastYear(kpi.calcul.time || [], 'month', 'valueKPI');
          });

          scope.options = {
            chart: {
              type: 'discreteBarChart',
              height: 20,
              width: 400,
              margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
              },
              showXAxis: true,
              showYAxis: false,
              color: function(d) {
                switch (true) {
                  case d.value === null:
                    return ['none'];
                  case d.value > 66:
                    return ['#2ca02c'];
                  default:
                    return ['#CB4B16'];
                }
              },
              x: function(d) {
                return d.month;
              },
              y: function(d) {
                return d.value;
              },
              showValues: false,
              transitionDuration: 500
            }
          };

        }

        scope.markdownMe = function(id) {
          $('#' + id).markdown({
            autofocus: true,
            savable: true,
            hideable: true,
            onSave: function(e) {

              if (e.$element[0].id.indexOf('title_') >= 0) {
                $http.put('/api/helps/' + e.$element[0].id.replace('help_', '').replace('title_', ''), {
                  title: e.getContent()
                }).success(function() {
                  scope.loadHelp();
                  Notification.success('Help title was updated');
                  e.blur();
                });
              } else {
                $http.put('/api/helps/' + e.$element[0].id.replace('help_', ''), {
                  info: e.getContent()
                }).success(function() {
                  scope.loadHelp();
                  Notification.success('Help content was updated');
                  e.blur();
                });
              }
            }
          });
        };

        /**
         * Modal
         */
        scope.openMetric = function(task, mesure, newItem) {

          $rootScope.currentTask = task;
          if (!newItem) {
            bootbox.confirm('Are you sure you want to modify the metric ? 99% of the time, the right process is to add a new metric with the above "plus" button ', function(result) {
              if (result) {
                scope.openMetricDialog(mesure, newItem);
              }

            });
          } else {
            scope.openMetricDialog(mesure, newItem);
          }
        };

        scope.openMetricDialog = function(mesure, newItem) {
          ngDialog.open({
            template: 'myMesureContent.html',
            className: 'ngdialog-theme-plain',
            closeByDocument: false,
            controller: ['$scope', '$http', '$rootScope', 'Auth', '$filter',
              function($scope, $http, $rootScope, Auth, $filter) {
                $scope.errors = {};
                Auth.getCurrentUser(function(data) {
                  $scope.currentUser = data;
                });

                // controller logic
                $scope.currentTask = $rootScope.currentTask;
                $scope.formData = mesure;
                if (typeof $scope.formData === 'undefined') {
                  $scope.formData = (scope.dataTable.length === 0) ? {} : _.clone(_.last(_.sortBy(scope.dataTable, 'date')), true);
                  delete $scope.formData._id;
                  Auth.getCurrentUser(function(data) {
                    $scope.formData.actor = data;
                  });
                  $scope.formData.date = new Date().toISOString();
                  $scope.formData.activity = scope.dashboardData.activity;
                  $scope.formData.context = scope.dashboardData.context;
                }

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

                $scope.open3 = function($event) {
                  $event.preventDefault();
                  $event.stopPropagation();

                  $scope.opened3 = true;
                };

                $scope.dateOptions = {
                  'year-format': '"yyyy"',
                  'starting-day': 1
                };

                $scope.format = 'MMM d, y';

                $scope.ok = function() {
                  $scope.submitted = true;
                  if ($scope.form.$valid) {
                    delete $scope.formData.___v;
                    if ($scope.formData._id) {
                      $http.put('/api/metrics/' + $scope.formData._id, $scope.formData).success(function(data) {
                        var logInfo = 'A Metric for Task "' + scope.dashboardData.name + '" was updated';
                        Notification.success(logInfo);

                        $http.post('/api/logs', {
                          info: logInfo,
                          actor: $scope.currentUser
                        });

                        $scope.closeThisDialog();
                      });
                    } else {
                      $http.post('/api/metrics', $scope.formData).success(function(data) {
                        var logInfo = 'A Metric for Task "' + scope.dashboardData.name + '" was created';
                        Notification.success(logInfo);

                        $http.post('/api/logs', {
                          info: logInfo,
                          actor: $scope.currentUser
                        });
                        $scope.closeThisDialog();
                      });
                    }
                  }
                };

                $scope.$watch('formData.progress', function(newValue, oldValue) {
                  $scope.formData.status = 'Error';
                  if (parseInt(newValue) === 0) {
                    $scope.formData.status = 'Not Started';
                  }
                  if (parseInt(newValue) > 0 && parseInt(newValue) < 100) {
                    $scope.formData.status = 'In Progress';
                  }
                  if (parseInt(newValue) === 100) {
                    $scope.formData.status = 'Finished';
                    if (parseInt(oldValue) >= 0 && parseInt(oldValue) < 100) {
                      $scope.formData.endDate = $filter('date')(new Date(), 'mediumDate');
                      Notification.primary(' Automatic Status & end date when you finish the task (100%)');
                    }
                  }
                  $scope.calculProjectedWorkload();
                });

                $scope.$watch('formData.endDate', function(newValue, oldValue) {
                  $scope.formData.progressStatus = 'Error';
                  if (new Date($scope.formData.endDate).setHours(0, 0, 0, 0) - new Date($scope.currentTask.endDate).setHours(0, 0, 0, 0) > 0) {
                    $scope.formData.progressStatus = 'Late';
                  } else {
                    if (new Date().setHours(0, 0, 0, 0) - new Date($scope.currentTask.endDate).setHours(0, 0, 0, 0) > 0 && $scope.formData.progress < 100) {
                      $scope.formData.progressStatus = 'At Risk';
                    } else {
                      $scope.formData.progressStatus = 'On Time';
                    }
                  }
                });

                $scope.$watch('formData.timeSpent', function(newValue, oldValue) {
                  $scope.calculProjectedWorkload();
                });

                $scope.calculProjectedWorkload = function() {
                  $scope.formData.projectedWorkload = ($scope.formData.progress > 0) ? Math.round(1000 * parseFloat($scope.formData.timeSpent.toString().replace(',', '.')) * 100 / parseFloat($scope.formData.progress)) / 1000 : $scope.formData.load;
                };

                $scope.deleteMetric = function() {
                  event.preventDefault();
                  bootbox.confirm('Are you sure to delete this metric ? It can NOT be undone.', function(result) {
                    if (result) {
                      $http.delete('/api/metrics/' + $scope.formData._id + '/' + $scope.formData.taskId).success(function() {
                        var logInfo = 'A Metric for Task "' + scope.dashboardData.name + '" was deleted';
                        $http.post('/api/logs', {
                          info: logInfo,
                          actor: $scope.currentUser
                        });
                        Notification.success(logInfo);
                      });
                      $scope.closeThisDialog();
                    }
                  });
                };

                $scope.cancel = function() {
                  $scope.closeThisDialog();
                };

              }
            ]
          });
        };

      }
    };
  });
