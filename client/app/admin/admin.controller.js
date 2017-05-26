'use strict';

angular.module('boardOsApp')
  .controller('AdminCtrl', function($scope, $http, Auth, User) {

    // Use the User $resource to fetch all users
    $scope.users = User.query();
    
    $scope.formData = {};
    $scope.searchFilter = '';
    $scope.sortHeader = 'name';
    $scope.onlyactive = true;
    $http.get('/api/users/roles').success(function(roles) {
      $scope.roles = _.map(roles, function(role) {
        return {
          value: role,
          text: role
        };
      });
    });

    $scope.delete = function(user) {
      User.remove({
        id: user._id
      });
      angular.forEach($scope.users, function(u, i) {
        if (u === user) {
          $scope.users.splice(i, 1);
        }
      });
    };

    $scope.changeRole = function(user, role) {
      $http.put('/api/users/' + user._id + '/role', {
        userId: user._id,
        newRole: role.text
      }).success(function() {
        $scope.users = User.query();
      });
    };

    $scope.desactivate = function(user) {
      user.active = false;
      $http.put('/api/users/desactivate/' + user._id, {
        userId: user._id
      }).success(function() {
        $scope.users = User.query();
      });
    };


    $scope.dispUpdate = function(user) {
      $scope.editUser = user;
    };

    $scope.update = function() {
      $http({
        method: 'PUT',
        data: $scope.editUser,
        url: '/api/users/' + $scope.editUser._id + '/fullupdate'
      }).
      success(function() {
        $scope.users = User.query();
        $('#modUser').modal('hide');
      });
    };


  });
