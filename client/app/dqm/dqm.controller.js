'use strict';

angular.module('boardOsApp')
  .controller('DqmCtrl', function($scope, $http) {
    $scope.HierarchyType = '';
    $scope.filterUsed = 'All';
    $scope.filterValid = 'All';
    var alltasks = {};
    var allhierarchies = {};

    var filterTasks = function() {
      var allTaskHierachies = _.pluck(_.sortBy(alltasks, $scope.HierarchyType.toLowerCase()), $scope.HierarchyType.toLowerCase());
      var paths = [];
      _.each(allhierarchies, function(hierarchy) {
        hierarchy.isValidPath = true;
        hierarchy.isUsedPath = (_.indexOf(allTaskHierachies, hierarchy.longname) > 0);
        if ((hierarchy.isUsedPath === $scope.filterUsed || $scope.filterUsed === 'All') && (hierarchy.isValidPath === $scope.filterValid || $scope.filterValid === 'All')) {
          paths.push(hierarchy);
        }
      });
      var joinAllTasks = _.map(allTaskHierachies, function(taskHierarchie) {
        return {
          longname: taskHierarchie,
          type: 'task'
        };
      });
      _.each(joinAllTasks, function(taskHierarchie) {
        taskHierarchie.isUsedPath = true;
        taskHierarchie.isValidPath = (_.indexOf(_.pluck(allhierarchies, 'longname'), taskHierarchie) > 0);
        if ((taskHierarchie.isUsedPath === $scope.filterUsed || $scope.filterUsed === 'All') && (taskHierarchie.isValidPath === $scope.filterValid || $scope.filterValid === 'All')) {
          paths.push(taskHierarchie);
        }
      });
      paths = _.sortBy(paths, 'longname');

      $scope.paths = _.uniq(paths, true, function(x) {
        return x.longname;
      });
    };

    $scope.load = function() {
      $http.get('/api/hierarchies/list/' + $scope.HierarchyType).success(function(hierarchies) {
        allhierarchies = _.sortBy(hierarchies.list, 'longname');
        $http.get('/api/taskFulls/list/hierarchies').success(function(tasks) {
          alltasks = tasks;
          filterTasks();
        });
      });
    };

    $scope.$watch('filterUsed', function() {
      filterTasks();
    });

    $scope.$watch('filterValid', function() {
      filterTasks();
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

      $http.get('/api/taskFulls/globalChange', globalChangeVar).success(function() {
        $scope.load();
      });

    };

    $scope.mergeAll = function() {
      $http.get('/api/hierarchies/merge/' + $scope.HierarchyType).success(function() {
        $scope.load();
      });
    };

    $scope.ValidPath = function() {

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
