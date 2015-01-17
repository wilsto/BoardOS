/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
.controller('hierarchiesCtrl', function ($scope, $http) {
  $scope.hierarchies = [];
  $scope.Hierarchy = {};
  $scope.config = {tab1: true, tab2: false};
  $scope.serialNest = [];
  $scope.newId = 1;
  $scope.newNode = {};
  $scope.HierarchyType = 'Context';

  $scope.treeConfig = {
    version : 1,
    core : {
      animation: true,
      error : function(error) {
            
        },
      check_callback : true,
      theme : {responsive:true},
      worker : true
    },
    types : {
      default : {
        icon : 'glyphicon glyphicon-star-empty'
      },
      star : {
        icon : 'glyphicon glyphicon-star'
      },
      cloud : {
        icon : 'glyphicon glyphicon-cloud'
      }
    },
    plugins : ['wholerow','types','contextmenu','dnd','search','unique','themes','ui']
  };

  $scope.load = function() {
    $http.get('/api/hierarchies/list/' + $scope.HierarchyType).success(function(hierarchies)  {
      $scope.hierarchies = hierarchies.list ;
      $scope.treeConfig.version++;
       $scope.selectedNode = null;
    });
  };

  $scope.loadMe = function(HierarchyType) {
    $scope.HierarchyType =HierarchyType;
    $scope.load();
  };


  $scope.create = function() {
    $scope.hierarchies.push({ id : 'ajson'+ (Math.round(Math.random() * 100000)).toString(), parent : '#', text : 'new Node' });
    $scope.treeConfig.version++;

  };

  $scope.save = function() {
    if (typeof $scope.HierarchyType !== 'undefined') {
      $scope.treeData = $scope.hierarchies;
      $scope.treeData.forEach(function(v){ delete v.__uiNodeId;});      
      $http.put('/api/hierarchies/'+ $scope.HierarchyType, $scope.treeData);
      $.growl({  icon: "fa fa-paw",  message:'Hierarchy "' + $scope.HierarchyType + '" was updated'});
    }
    //$scope.load();
  };

  $scope.edit = function(Hierarchy) {
    $scope.Hierarchy = Hierarchy;
  };

  $scope.reset = function() {
    $scope.Hierarchy = {};
  };

  $scope.delete = function(Hierarchy,index) {
    bootbox.confirm('Are you sure?', function(result) {
      if (result) {
        $http.delete('/api/hierarchies/' + Hierarchy._id).success(function () {
          $scope.hierarchies.splice(index, 1);
          $.growl({  icon: "fa fa-paw",  message:'Hierarchy "' + Hierarchy.name + '" was deleted'});
        });
      }
    }); 
  }; 

  $scope.load();
  
  $scope.selectNode = function(e, data) {
    if(data && data.selected && data.selected.length) {
      $scope.$apply( // ?? workaround avec apply, à chercher pourquoi
         $scope.selectedNode = $scope.hierarchies.filter(function(obj){ return obj.id === data.node.id;})[0]
      );
    }

  };

  $scope.createNode = function(e, data) {
    
    $scope.hierarchies.push({ id : 'ajson'+ (Math.round(Math.random() * 100000)).toString(), parent : data.node.parent, text : data.node.text });
  };

  $scope.deleteNode = function(e, data) {
    angular.forEach($scope.hierarchies, function(obj, key ) {
        if(obj.id === data.node.id) {
              $scope.hierarchies.splice(key,1);
        }   
      });
  };

  $scope.renameNode = function(e, data) {
    angular.forEach($scope.hierarchies, function(obj, key ) {
        if(obj.id === data.node.id) {
              $scope.hierarchies[key].text = data.node.text;
        }   
      });
  };


});
