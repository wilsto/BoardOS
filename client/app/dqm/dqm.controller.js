'use strict';

angular.module('boardOsApp')
    .controller('DqmCtrl', function($scope, $http) {
        $scope.HierarchyType = 'Context';

        $scope.load = function() {
            $http.get('/api/hierarchies/list/' + $scope.HierarchyType).success(function(hierarchies) {
                var allhierarchies = _.sortBy(hierarchies.list, 'longname');
                $http.get('/api/tasks').success(function(tasks) {
                    var alltasks = _.pluck(_.sortBy(tasks.tasks, 'context'), 'context');
                    $scope.paths = [];
                    _.each(allhierarchies, function(hierarchy) {
                        hierarchy.isValidPath = true;
                        hierarchy.isUsedPath = (_.indexOf(alltasks, hierarchy.longname) > 0);
                        $scope.paths.push(hierarchy);
                    });
                    var joinAllTasks = _.map(alltasks, function(task) {
                        return {
                            longname: task,
                            type: 'task'
                        };
                    });
                    _.each(joinAllTasks, function(task) {
                        task.isUsedPath = true;
                        task.isValidPath = (_.indexOf(_.pluck(allhierarchies, 'longname'), task) > 0);
                        $scope.paths.push(task);
                    });
                    $scope.paths = _.sortBy($scope.paths, 'longname');
                    
                });
            });


        };

        $scope.loadMe = function(HierarchyType) {
            $scope.HierarchyType = HierarchyType;
            $scope.load();
        };

        $scope.load();

    });