'use strict';

angular.module('boardOsApp')
    .controller('DqmCtrl', function($scope, $http) {
        $scope.HierarchyType = 'Context';
        $scope.filterUsed = 'All';
        $scope.filterValid = 'All';

        $scope.load = function() {
            $http.get('/api/hierarchies/list/' + $scope.HierarchyType).success(function(hierarchies) {
                var allhierarchies = _.sortBy(hierarchies.list, 'longname');

                $http.get('/api/tasks').success(function(tasks) {
                    var alltasks = _.pluck(_.sortBy(tasks.tasks, $scope.HierarchyType.toLowerCase()), $scope.HierarchyType.toLowerCase());
                    var paths = [];
                    _.each(allhierarchies, function(hierarchy) {
                        hierarchy.isValidPath = true;
                        hierarchy.isUsedPath = (_.indexOf(alltasks, hierarchy.longname) > 0);
                        if ((hierarchy.isUsedPath === $scope.filterUsed || $scope.filterUsed === 'All') && (hierarchy.isValidPath === $scope.filterValid || $scope.filterValid === 'All')) {
                            paths.push(hierarchy);
                        }
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
                        if ((task.isUsedPath === $scope.filterUsed || $scope.filterUsed === 'All') && (task.isValidPath === $scope.filterValid || $scope.filterValid === 'All')) {
                            paths.push(task);
                        }
                    });
                    paths = _.sortBy(paths, 'longname');
                    console.log('paths', paths.length);
                    $scope.paths = _.uniq(paths, true, function(x) {
                        return x.longname;
                    });

                });
            });


        };


        $scope.$watch('filterUsed', function() {
            $scope.load();
        });


        $scope.$watch('filterValid', function() {
            $scope.load();
        });


        $scope.loadMe = function(HierarchyType) {
            $scope.HierarchyType = HierarchyType;
            $scope.load();
        };

        $scope.load();

        $scope.globalChange = function() {
            var globalChangeVar = {
                params: {
                    HierarchyType: $scope.HierarchyType.toLowerCase(),
                    textFilter: $scope.textFilter,
                    textReplace: $scope.textReplace
                }
            };

            $http.get('/api/tasks/globalChange', globalChangeVar).success(function() {
                $scope.load();
            });

        };

        $scope.mergeAll = function() {
            $http.get('/api/hierarchies/merge/' + $scope.HierarchyType).success(function() {
                $scope.load();
            });

        };

        $scope.replaceRegex = function(value, regex, newtext) {
            var patt;
            var newValue = value;
            if (typeof regex !== 'undefined') {
                if (regex.indexOf('/') >= 0) {
                    var regexMatch = regex.match(/^\/(.*)\/([^\/]*)$/);
                    patt = new RegExp(regexMatch[1], regexMatch[2]);
                } else {
                    patt = new RegExp(regex);
                }
                if (typeof newtext !== 'undefined' && newtext.length > 0) {
                    newValue = value.replace(patt, newtext);
                }
            }
            return newValue;
        };



    });