'use strict';

angular.module('boardOsApp')
  .controller('GlobalCtrl', function ($scope, Auth) {

  	$scope.reLoadUser = function() {
  		$scope.isLoggedIn = Auth.isLoggedIn();
    	$scope.isAdmin = Auth.isAdmin();
    	$scope.currentUser = Auth.getCurrentUser();
  	};

	$scope.reLoadUser();

	 $scope.$on('UserLogChange', function() {  
	 	$scope.reLoadUser();
	 });
  });
