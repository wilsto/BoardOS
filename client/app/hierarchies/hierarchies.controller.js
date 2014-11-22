'use strict';

angular.module('boardOsApp')
.controller('hierarchiesCtrl', function ($scope, $http, socket, ngToast) {
  $scope.hierarchies = [];
  $scope.Hierarchy = {};
  $scope.config = {tab1: true, tab2: false};
  $scope.serialNest = [];
  $scope.HierarchyType ="Activity";
  $scope.newId = 1;
  $scope.newNode = {};

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
      $scope.treeConfig.version++;
    });
  };

  $scope.save = function() {
    console.log($scope.hierarchies);
    if (typeof $scope.HierarchyType !== 'undefined') {
      $scope.treeData = $scope.hierarchies;
      $scope.treeData.forEach(function(v){ delete v.__uiNodeId });      
      $http.put('/api/hierarchies/'+ $scope.HierarchyType, $scope.treeData);
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
  
  $scope.selectNode = function(e, data) {
    //console.log(data);
    if(data && data.selected && data.selected.length) {
      $('#details').html(data.node.text).show();
    }
    else {
      $('#details').hide();
      $('#details').html('Select a file from the tree.').show();
    }
  };

  $scope.createNode = function(e, data) {
    console.log(data);
    $scope.hierarchies.push({ id : 'ajson'+ (data.node.children.length+1).toString(), parent : data.node.parent, text : data.node.text });
    console.log( $scope.hierarchies);
  };

  $scope.deleteNode = function(e, data) {
    angular.forEach($scope.hierarchies, function(obj, key ) {
        if(obj.id == data.node.id) {
              $scope.hierarchies.splice(key,1);
        }   
      });
  };

  $scope.renameNode = function(e, data) {
    angular.forEach($scope.hierarchies, function(obj, key ) {
        if(obj.id == data.node.id) {
              $scope.hierarchies[key].text = data.node.text;
        }   
      });
  };

});
