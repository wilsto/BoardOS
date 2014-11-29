/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
.controller('TasksCtrl', function ($rootScope, $scope, $http,  ngToast,statusTask, progressStatusTask){
    $scope.tasks = [];
    $scope.task = {};

    $scope.debug = false;

    $rootScope.taskStatus = statusTask;
    $rootScope.progressStatus = progressStatusTask;

    $scope.Load = function(){
        $http.get('/api/tasks').success(function (data) { 
            $scope.tasks =  data;
        });
    };

    $scope.save = function() {
        delete $scope.task.__v;
        console.log($scope.task );

        if (typeof $scope.task._id === 'undefined') {
            $http.post('/api/tasks', $scope.task);
            ngToast.create('Task "' + $scope.task.name + '" was created');
        } else {
            $http.put('/api/tasks/'+ $scope.task._id , $scope.task);
            ngToast.create('Task "' + $scope.task.name + '" was updated');
        }
        $scope.load();
        $scope.config = {tab1: true, tab2: false};
    };

    $scope.edit = function(task) {
        $scope.task = {};
        $scope.task = task;
        $scope.config = {tab1: false, tab2: true};
    };

    $scope.reset = function() {
        $scope.task = {};
    };

    $scope.delete = function(task,index) {
        bootbox.confirm('Are you sure?', function(result) {
            if (result) {
                $http.delete('/api/tasks/' + task._id).success(function () {
                    $scope.tasks.splice(index, 1);
                    ngToast.create('task "' + task.name + '" was deleted');
                });
            }
        }); 
    }; 

    $scope.Load();

    $scope.loadXEditable = function() {

        //toggle `popup` / `inline` mode
        $.fn.editable.defaults.mode = 'popup';     

        //make username editable
        $('#name').editable({
            success: function(response, newValue) {
                $scope.task.name = newValue;
            }
        });

        $('#Activity').editable({
            title: 'Select activity',
            source: '/api/hierarchies/list/Activity',
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select activity',
                allowClear: true,
                sortResults: function(results, container, query) {
                    if (query.term) {
        // use the built in javascript sort function
        return results.sort(function(a, b) {
            if (a.text.length > b.text.length) {
                return 1;
            } else if (a.text.length < b.text.length) {
                return -1;
            } else {
                return 0;
            }
        });
        }
        return results;
        }
        },
        success: function(response, newValue) {
            $scope.task.activity = newValue;
        }
        }); 

        $('#Context').editable({
            title: 'Select context',
            source: '/api/hierarchies/list/Context',
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select context',
                allowClear: true
            },
            success: function(response, newValue) {
                $scope.task.context = newValue;
            }
        }); 
    };
});
