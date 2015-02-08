'use strict';

angular.module('boardOsApp')
    .directive('dashboardTab', function(ngDialog, $location, $rootScope, myLibrary, Auth, $http) {
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
                    $.growl({
                        icon: 'fa fa-info-circle',
                        message: 'New help was updated'
                    });
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
                                    $.growl({
                                        icon: 'fa fa-info-circle',
                                        message: 'Help title was updated'
                                    });
                                    e.blur();
                                });
                            } else {
                                $http.put('/api/helps/' + e.$element[0].id.replace('help_', ''), {
                                    info: e.getContent()
                                }).success(function() {
                                    scope.loadHelp();
                                    $.growl({
                                        icon: 'fa fa-info-circle',
                                        message: 'Help content was updated'
                                    });
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

                    ngDialog.open({
                        template: 'myMesureContent.html',
                        className: 'ngdialog-theme-plain',
                        closeByDocument: false,
                        controller: ['$scope', '$http', '$rootScope',
                            function($scope, $http, $rootScope) {

                                // controller logic
                                $scope.formData = mesure;

                                if (typeof $scope.formData === 'undefined') {
                                    $scope.formData = (scope.dataTable.length === 0) ? {} : _.clone(_.last(_.sortBy(scope.dataTable, 'date')), true);
                                    delete $scope.formData._id;
                                    Auth.getCurrentUser(function(data) {
                                        $scope.formData.actor = data;
                                    });
                                    $scope.formData.date = new Date();
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

                                $scope.format = 'dd-MMMM-yyyy';

                                $scope.ok = function() {

                                    delete $scope.formData.___v;
                                    if ($scope.formData._id) {
                                        $http.put('/api/metrics/' + $scope.formData._id, $scope.formData).success(function(data) {
                                            var logInfo = 'A Metric for Task "' + scope.dashboardData.name + '" was updated';
                                            $http.post('/api/logs', {
                                                info: logInfo,
                                                actor: $scope.currentUser
                                            });
                                            $.growl({
                                                icon: 'fa fa-info-circle',
                                                message: logInfo
                                            });
                                            $rootScope.$broadcast('reloadTask', 'data');
                                            $scope.closeThisDialog();
                                        });
                                    } else {
                                        $http.post('/api/metrics', $scope.formData).success(function(data) {
                                            var logInfo = 'A Metric for Task "' + scope.dashboardData.name + '" was created';
                                            $http.post('/api/logs', {
                                                info: logInfo,
                                                actor: $scope.currentUser
                                            });
                                            $.growl({
                                                icon: 'fa fa-info-circle',
                                                message: logInfo
                                            });
                                            $rootScope.$broadcast('reloadTask', 'data');
                                            $scope.closeThisDialog();
                                        });
                                    }
                                };


                                $scope.deleteMetric = function(id) {
                                    bootbox.confirm('Are you sure?', function(result) {
                                        if (result) {
                                            $http.delete('/api/metrics/' + id).success(function() {
                                                var logInfo = 'A Metric for Task "' + scope.dashboardData.name + '" was deleted';
                                                $http.post('/api/logs', {
                                                    info: logInfo,
                                                    actor: $scope.currentUser
                                                });
                                                $.growl({
                                                    icon: 'fa fa-info-circle',
                                                    message: logInfo
                                                });
                                                $rootScope.$broadcast('reloadTask', 'data');
                                                $scope.closeThisDialog();
                                            });
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