'use strict';

angular.module('boardOsApp')
    .controller('TaskCtrl', function($rootScope, $scope, $http, $stateParams, $location, Auth) {

        $scope.activeTab = 1;
        $scope.errors = {};
        $scope.task = {};
        $scope.taskAlreadyExist = {
            id: null,
            name: null
        };

        $scope.isAdmin = false;
        Auth.isAdmin(function(data) {
            $scope.isAdmin = data;
        });

        $scope.isManager = false;
        Auth.isManager(function(data) {
            $scope.isManager = data;
        });

        $scope.loadTask = function() {
            if ($stateParams.id) {
                $http.get('/api/tasks/' + $stateParams.id).success(function(data) {
                    $scope.task = data;
                    $.growl({
                        icon: 'fa fa-info-circle',
                        message: 'Task "' + $scope.task.name + '" loaded'
                    });
                    $scope.updateWatch();
                });
            }
        };

        $scope.updateWatch = function() {
            $scope.taskIsWatched = (_.intersection([$scope.currentUser._id], $scope.task.watchers).length > 0) ? 'YES' : 'NO';
        };

        $scope.loadTask();

        $rootScope.$on('reloadTask', function(data) {
            $scope.loadTask();
        });

        $scope.changeTab = function(e, tabNb) {
            $('.ver-inline-menu li').removeClass('active');
            $(e.target).closest('li').addClass('active');
            $scope.activeTab = tabNb;
        };


        $scope.watchThisTask = function() {
            $http.get('/api/tasks/watch/' + $scope.task._id + '/' + $scope.currentUser._id).success(function(data) {
                $scope.task.watchers = data.watchers;
                $scope.updateWatch();

                var logInfo = 'Task watch "' + $scope.task.name + '" was updated by ' + $scope.currentUser.name;
                $http.post('/api/logs', {
                    info: logInfo,
                    actor: $scope.currentUser
                });
                $.growl({
                    icon: 'fa fa-info-circle',
                    message: logInfo
                });
            });
        };

        $scope.save = function(form) {
            $scope.submitted = true;

            // si la form est valide
            if (form.$valid) {


                delete $scope.task.__v;
                delete $scope.task.kpis;
                delete $scope.task.metrics;
                delete $scope.task.tasks;

                $scope.task.actor = $scope.currentUser;
                $scope.task.date = Date.now();

                if (typeof $scope.task._id === 'undefined') {
                    $http.get('/api/tasks/search', {
                        params: {
                            activity: $scope.task.activity,
                            context: $scope.task.context
                        }
                    }).success(function(alreadyExit) {
                        // si cela n'existe pas 
                        if (alreadyExit.length === 0) {
                            $http.post('/api/tasks', $scope.task).success(function(data) {
                                var logInfo = 'Task "' + $scope.task.name + '" was created';
                                $http.post('/api/logs', {
                                    info: logInfo,
                                    actor: $scope.currentUser
                                });
                                $.growl({
                                    icon: 'fa fa-info-circle',
                                    message: logInfo
                                });
                                $location.path('/task/' + data._id);
                            });
                        } else {
                            $scope.taskAlreadyExist.id = alreadyExit[0]._id;
                            $scope.taskAlreadyExist.name = alreadyExit[0].name;
                        }
                    });
                } else {
                    $http.put('/api/tasks/' + $scope.task._id, $scope.task).success(function(data) {
                        var logInfo = 'Task "' + $scope.task.name + '" was updated';
                        $http.post('/api/logs', {
                            info: logInfo,
                            actor: $scope.currentUser
                        });
                        $.growl({
                            icon: 'fa fa-info-circle',
                            message: logInfo
                        });
                    });
                }
            }
        };

        $scope.delete = function() {
            bootbox.confirm('Are you sure to delete this task and all associated metrics ? It can NOT be undone.', function(result) {
                if (result) {
                    $http.delete('/api/tasks/' + $scope.task._id).success(function() {
                        var logInfo = 'Task "' + $scope.task.name + '" was deleted';
                        $http.post('/api/logs', {
                            info: logInfo,
                            actor: $scope.currentUser
                        });
                        $.growl({
                            icon: 'fa fa-info-circle',
                            message: logInfo
                        });
                        $location.path('/tasks');
                    });
                }
            });
        };


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

        $scope.dateOptions = {
            'year-format': '"yyyy"',
            'starting-day': 1
        };

        $scope.format = 'dd-MMMM-yyyy';

    });