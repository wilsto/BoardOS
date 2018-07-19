/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('hierarchiesCtrl', function($scope, $http, Notification, $rootScope) {
    $scope.hierarchies = [];
    $scope.Hierarchy = {};
    $scope.config = {
      tab1: true,
      tab2: false
    };
    $scope.serialNest = [];
    $scope.newId = 1;
    $scope.newNode = {};
    $scope.HierarchyType = 'Context';

    $scope.treeConfig = {
      version: 1,
      core: {
        animation: true,
        error: function(error) {

        },
        check_callback: true,
        theme: {
          responsive: true
        },
        worker: true
      },
      types: {
        default: {
          icon: 'glyphicon glyphicon-star-empty'
        },
        star: {
          icon: 'glyphicon glyphicon-star'
        },
        cloud: {
          icon: 'glyphicon glyphicon-cloud'
        }
      },
      plugins: ['wholerow', 'types', 'contextmenu', 'dnd', 'search', 'unique', 'themes', 'ui']
    };

    function verboseHierarchy(data) {
      angular.forEach($scope.hierarchies, function(obj, key) {
        // on recherche les parents et on les concatène.
        var parentPath = _.compact(_.map(data.instance._model.data[obj.id].parents.reverse(), function(parent) {
          return data.instance._model.data[parent].text;
        })).join('.');

        $scope.hierarchies[key].longname = (parentPath.length > 0) ? parentPath + '.' + obj.text : obj.text;

      });
    }

    $scope.nodes = [{
        'id': 1,
        'title': 'node 1'
      },
      {
        'id': 2,
        'title': 'node 2'
      },
      {
        'id': 3,
        'title': 'node 3'
      }
    ];

    $scope.countDot = function count(s1) {
      return (s1.match(new RegExp('\\.', 'g')) || []).length;
    };

    $scope.load = function() {
      $http.get('/api/hierarchies/list/' + $scope.HierarchyType).success(function(hierarchies) {
        $scope.hierarchies = _.sortBy(hierarchies.list, 'longname');
        _.each($scope.hierarchies, function(hierarchy) {
          hierarchy.longname = hierarchy.longname.toUpperCase();
        });
        $scope.selectedNode = null;
      });
    };

    $scope.load();

    $scope.loadMe = function(HierarchyType) {
      $scope.HierarchyType = HierarchyType;
      $scope.load();
    };


    $scope.newSubItem = function(hierarchy, index) {
      bootbox.prompt({
        title: 'Please Enter Name of this hierarchy',
        value: hierarchy.longname,
        callback: function(result) {
          if (result) {
            $scope.hierarchies.push({
              id: 'ajson' + (Math.round(Math.random() * 100000)).toString(),
              parent: hierarchy.id,
              text: result,
              longname: result
            });
            $scope.hierarchies = _.sortBy($scope.hierarchies, 'longname');
            $scope.$apply();
          }
        }
      });
    };

    $scope.save = function() {
      if (typeof $scope.HierarchyType !== 'undefined') {


        $http.put('/api/hierarchies/' + $scope.HierarchyType, $scope.hierarchies).success(function(hierarchies) {
          Notification.success('Hierarchy "' + $scope.HierarchyType + '" was updated');
          $scope.load();
        });
      }
    };

    $scope.edit = function(Hierarchy) {
      $scope.Hierarchy = Hierarchy;
    };

    $scope.reset = function() {
      $scope.Hierarchy = {};
    };

    $scope.delete = function(hierarchy, index) {
      bootbox.confirm('Are you sure to remove "' + hierarchy.longname + '" ?', function(result) {
        if (result) {
          $scope.hierarchies.splice(index, 1);
          Notification.success('Hierarchy "' + hierarchy.longname + '" was deleted');
        }
      });
    };


    $scope.selectNode = function(data) {

      if (data) {
        $scope.selectedNode = $scope.hierarchies.filter(function(obj) {
          return obj.id === data.id;
        })[0];
      }
    };

    $scope.createNode = function(data) {
      bootbox.prompt({
        title: 'Please Enter Name of this hierarchy',
        callback: function(result) {
          if (result) {
            $scope.hierarchies.push({
              id: 'ajson' + (Math.round(Math.random() * 100000)).toString(),
              parent: '#',
              text: result,
              longname: result
            });
            $scope.hierarchies = _.sortBy($scope.hierarchies, 'longname');
            $scope.$apply();
          }
        }
      });
    };

    $scope.deleteNode = function(e, data) {
      angular.forEach($scope.hierarchies, function(obj, key) {
        if (obj.id === data.node.id) {
          $scope.hierarchies.splice(key, 1);
        }
      });
      verboseHierarchy(data);
    };

    $scope.renameNode = function(e, data) {
      angular.forEach($scope.hierarchies, function(obj, key) {
        if (obj.id === data.node.id) {
          $scope.hierarchies[key].text = data.node.text;
        }
      });
      verboseHierarchy(data);

    };

    $scope.loadNode = function(e, data) {
      verboseHierarchy(data);
    };



  });
