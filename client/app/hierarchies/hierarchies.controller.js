'use strict';

angular.module('boardOsApp')
  .controller('hierarchiesCtrl', function ($scope, $http, socket, ngToast) {
    $scope.hierarchies = [];
    $scope.Hierarchy = {};
    $scope.config = {tab1: true, tab2: false};
    $scope.serialNest = [];
    $scope.HierarchyType ="Activity";

    $scope.treeConfig = {
            core : {
                animation: true,
                error : function(error) {
                    $log.error('treeCtrl: error from js tree - ' + angular.toJson(error));
                },
                check_callback : true,
                theme : {responsive:true},
                worker : true
            },
            types : {
                default : {
                    icon : 'glyphicon glyphicon-flash'
                },
                star : {
                    icon : 'glyphicon glyphicon-star'
                },
                cloud : {
                    icon : 'glyphicon glyphicon-cloud'
                }
            },
            version : 1,
            plugins : ['wholerow','types','contextmenu','dnd','search','unique','themes','ui']
        };

    $scope.load = function() {
      $http.get('/api/hierarchies').success(function(hierarchies) {
        $scope.hierarchies = hierarchies[0].list;
      });

      $scope.treeData = [
            { id : 'ajson1', parent : '#', text : 'Simple root node', state: { opened: true} },
            { id : 'ajson2', parent : '#', text : 'Root node 2', state: { opened: true} },
            { id : 'ajson3', parent : 'ajson2', text : 'Child 1', state: { opened: true} },
            { id : 'ajson4', parent : 'ajson2', text : 'Child 2' , state: { opened: true}}
        ]

    };

    $scope.save = function() {
      if (typeof $scope.HierarchyType !== 'undefined') {
        $http.put('/api/hierarchies/'+ $scope.HierarchyType, $scope.serialNest);
        ngToast.create('Hierarchy "' + $scope.HierarchyType + '" was updated');
      }
      $scope.load();
      $scope.config = {tab1: true, tab2: false};
    };

    $scope.edit = function(Hierarchy) {
      $scope.Hierarchy = Hierarchy;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.reset = function() {
      $scope.Hierarchy = {};
    };

    $scope.delete = function(Hierarchy,index) {
      bootbox.confirm("Are you sure?", function(result) {
        if (result) {
          $http.delete('/api/hierarchies/' + Hierarchy._id).success(function () {
              $scope.hierarchies.splice(index, 1);
              ngToast.create('Hierarchy "' + Hierarchy.name + '" was deleted');
          });
        }
      }); 
    }; 

    $scope.load();

    $scope.$watch('serialNest', function(value) {
      // do something with the new value
      $('#nestable_list_output').val(window.JSON.stringify($scope.serialNest));
    });

  
    $('#mytree').bind('select_node.jstree', function (e, data) {
          console.log(data.selected);
          if(data && data.selected && data.selected.length) {
              $('#details').html('d.content').show();
          }
          else {
            $('#details').hide();
            $('#details').html('Select a file from the tree.').show();
          }
        });

});
