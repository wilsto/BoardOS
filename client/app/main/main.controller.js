'use strict';

angular.module('boardOsApp')
    .controller('MainCtrl', function($scope, $http, myLibrary, Auth) {

        $scope.Math = window.Math;
        $scope.filterNotification = 'Only For Me';
        $scope.loadDashBoard = function() {
            Auth.getCurrentUser(function(data) {
                $scope.currentUser = data;

                $http.get('/api/dashboards/user/' + $scope.currentUser._id).success(function(dashboards) {
                    $scope.dashboards = dashboards.dashboards;
                    $scope.dataDashboards = dashboards;

                    $scope.loadTaskToNotify();

                    $scope.dataKPIs = [{
                        values: []
                    }];
                    $scope.dataTasks = [{
                        values: []
                    }];
                    $scope.dataMetrics = [{
                        values: []
                    }];
                    $scope.dataGoals = [{
                        values: []
                    }];
                    $scope.dataAlerts = [{
                        values: []
                    }];
                    $scope.dataConfidence = [{
                        values: []
                    }];

                    // on rassemble les métriques
                    $scope.dataDashboards.metrics = [];
                    _.each($scope.dataDashboards.tasks, function(task) {
                        _.each(task.metrics, function(metric) {
                            $scope.dataDashboards.metrics.push(metric);
                        });
                    });

                    $scope.predataKPIs = myLibrary.getByMonth($scope.dataDashboards.kpis, 'date', 'value');
                    $scope.predataTasks = myLibrary.getByMonth($scope.dataDashboards.tasks, 'date', 'value');
                    $scope.predataMetrics = myLibrary.getByMonth($scope.dataDashboards.metrics, 'date', 'value');
                    $scope.predataConfidence = myLibrary.getByMonth($scope.dataDashboards.metrics, 'date', 'trust');

                    var dataGoals = [];
                    var dataAlerts = [];
                    _.forEach($scope.dataDashboards.kpis, function(kpi) {
                        var kpiAlerts = [];
                        var kpiGoals = [];

                        if (kpi.category === 'Goal') {

                            var goalsByMonth = _.pluck(myLibrary.getByMonth(kpi.calcul.taskTime, 'month', 'value'), 'mean');
                            dataGoals.push(goalsByMonth);
                            kpiGoals.push(goalsByMonth);

                            kpi.calcul.time = _.map(myLibrary.getCalculByMonth(kpiGoals), function(data) {
                                return {
                                    month: data.label,
                                    valueKPI: data.mean
                                };
                            });
                        }
                        if (kpi.category === 'Alert') {

                            var alertsByMonth = _.pluck(myLibrary.getByMonth(kpi.calcul.taskTime, 'month', 'value'), 'mean');
                            kpiAlerts.push(alertsByMonth);
                            dataAlerts.push(alertsByMonth);
                        }
                    });

                    $scope.dataKPIs[0].values = $scope.predataKPIs;
                    $scope.dataTasks[0].values = $scope.predataTasks;
                    $scope.dataMetrics[0].values = $scope.predataMetrics;
                    $scope.dataConfidence[0].values = $scope.predataConfidence;
                    $scope.dataGoals[0].values = myLibrary.getCalculByMonth(dataGoals);
                    $scope.dataAlerts[0].values = myLibrary.getCalculByMonth(dataAlerts);
                    $scope.goalsNb = _.last($scope.dataGoals[0].values).mean;
                    $scope.alertsNb = _.last($scope.dataAlerts[0].values).sum;
                    $scope.confidence = parseInt(_.last($scope.dataConfidence[0].values).mean);

                    //calcul goals and alerts per dashboard
                    _.forEach(dashboards.dashboards, function(dashboard, key) {
                        dashboard.nbGoals = 0;
                        dashboard.nbAlerts = 0;
                        var dataGoals = [];
                        var dataAlerts = [];

                        // pour chaque KPI du dashboard
                        _.forEach(dashboard.kpis, function(kpi, key) {
                            var kpiGoals = [];
                            var kpiAlerts = [];
                            if (kpi.category === 'Goal') {
                                dataGoals.push(kpi.calcul.task);
                            }

                            if (kpi.category === 'Alert') {
                                dataAlerts.push(kpi.calcul.task);
                            }

                        });
                        var sumGoals = _.reduce(dataGoals, function(sumGoals, kpicalcul) { // sum
                            return sumGoals + kpicalcul;
                        });
                        dashboard.dataGoals = (dataGoals.length > 0) ? parseInt(sumGoals / dataGoals.length) : '-';
                        var sumAlerts = _.reduce(dataAlerts, function(sumAlerts, kpicalcul) { // sum
                            return sumAlerts + kpicalcul;
                        });
                        dashboard.dataAlerts = sumAlerts;
                    });
                });

            });

        };

        $scope.loadLog = function() {
            $http.get('/api/logs').success(function(logs) {
                $scope.logs = logs;
            });
        };

        $scope.loadTaskToNotify = function() {
            if (typeof $scope.dataDashboards !== 'undefined') {
                var openTasks = _.filter($scope.dataDashboards.tasks, function(task) {
                    if (typeof task.lastmetric === 'undefined' || task.lastmetric.status === 'In Progress' || task.lastmetric.status === 'Not Started') {
                        return true;
                    }
                });
                $scope.alltasksToNotify = openTasks.length;
                $scope.myTasks = $scope.filterTask(openTasks, $scope.filterNotification);
                if ($scope.filterNotification === 'Only For Me') {
                    $scope.tasksToNotify = $scope.myTasks;
                } else {
                    $scope.tasksToNotify = openTasks;
                }
                $scope.mytasksToNotify = $scope.myTasks.length;
            }
        };

        $scope.$watch('filterNotification', function() {
            $scope.loadTaskToNotify();
        });

        $scope.filterTask = function(tasks, filter) {
            var filtertasks;
            // si pas de filtrer alors on retourne le tout
            if (typeof filter === 'undefined') {
                return tasks;
            }
            filtertasks = _.filter(tasks, function(task) {
                // si owner
                if (task.actor._id === $scope.currentUser._id) {
                    return true;
                }
                // si actor (metrics)
                if (_.intersection([$scope.currentUser._id], _.pluck(task.metricActors, '_id')).length > 0) {
                    return true;
                }
                // si watcher
                if (_.intersection([$scope.currentUser._id], _.pluck(task.watchers, '_id')).length > 0) {
                    return true;
                }

            });
            return filtertasks;
        };

        $scope.goalColor = function(value) {
            return {
                color: myLibrary.giveMeMyColor(value)
            };
        };

        $scope.alertColor = function(value) {
            return {
                color: myLibrary.giveMeMyColor(value, 'Alert')
            };
        };

        $scope.loadDashBoard();
        //$scope.loadLog();


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
                    return d.count;
                },
                showValues: false,
                transitionDuration: 500
            }
        };

        $scope.optionsTasks = angular.copy($scope.options);
        $scope.optionsTasks.chart.color = ['#9467bd'];

        $scope.optionsMetrics = angular.copy($scope.options);
        $scope.optionsMetrics.chart.color = ['#87CEEB'];

        $scope.optionsAlerts = angular.copy($scope.options);
        $scope.optionsAlerts.chart.color = ['#CB4B16'];
        $scope.optionsAlerts.chart.y = function(d) {
            return d.sum;
        };

        $scope.optionsGoals = angular.copy($scope.options);
        $scope.optionsGoals.chart.color = function(d) {
            return myLibrary.giveMeMyColor(d.mean);
        };
        $scope.optionsGoals.chart.y = function(d) {
            return d.mean;
        };
        $scope.optionsConfidence = angular.copy($scope.options);
        $scope.optionsConfidence.chart.color = ['#bcbd22'];
        $scope.optionsConfidence.chart.y = function(d) {
            return d.mean;
        };


    });