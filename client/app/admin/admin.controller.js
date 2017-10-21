'use strict';

angular.module('boardOsApp')
  .controller('AdminCtrl', function($scope, $http, Auth, User) {

    // Use the User $resource to fetch all users

    $scope.formData = {};
    $scope.searchFilter = '';
    $scope.searchName = '';
    $scope.searchRole = '';
    $scope.searchGroup = '';
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
        $scope.reloadUsers();
      });
    };

    $http.get('/api/users/').success(function(users) {
      $scope.allusers = users;
      
      $scope.reloadUsers();
    });

    $scope.loadGroups = function(query) {
      
      var tags = [{
          text: 'CBI-PMO'
        },
        {
          text: 'CBI-ANA'
        },
        {
          text: 'CBI-DA'
        },
        {
          text: 'CBI-DD'
        },
        {
          text: 'CBI-VIZ'
        },
        {
          text: 'CBI-CM'
        },
        {
          text: 'CBI-SM'
        },
        {
          text: 'CBI-BR'
        },
        {
          text: 'CBI-MDM'
        }
      ];
      return tags;
    };

    $scope.addGroups = function(tag, userId, userGroups) {
      if (!userGroups) {
        userGroups = [];
      }
      userGroups.push(tag.text);
      $scope.saveGroups(userId, userGroups);

    };

    var filterUsers = function(data) {
      return _.filter(data, function(user) {
        var blnName = ($scope.searchName.length === 0) ? true : user.name.toLowerCase().indexOf($scope.searchName.toLowerCase()) >= 0;
        var blnGroup = ($scope.searchGroup.length === 0) ? true : false;
        _.each(user.groups, function(group) {
          if (group.toLowerCase().indexOf($scope.searchGroup.toLowerCase()) >= 0) {
            blnGroup = true;
          }
        });
        var blnRole = ($scope.searchRole.length === 0) ? true : false;
        var bnlActive = ($scope.onlyactive === user.active);
        var blnSearchText = blnName && blnGroup && blnRole && bnlActive;
        return blnSearchText;
      });
    };


    $scope.reloadUsers = function() {
      $scope.users = filterUsers($scope.allusers);
    };

    $scope.$watchGroup(['searchName', 'searchRole', 'searchGroup', 'onlyactive'], function(newValues, oldValues) {
      $scope.reloadUsers();
    });

    $scope.filterUsers = function(item) {

      if ($scope.searchFilter) {
        return true;
      }
      return false;
    };

    $scope.removeGroups = function(tag, userId, userGroups) {
      userGroups = _.filter(userGroups, function(item) {
        return item !== tag.text;
      });
      $scope.saveGroups(userId, userGroups);
    };

    $scope.saveGroups = function(userId, userGroups) {
      $http.put('/api/users/' + userId + '/groups', {
        userId: userId,
        newGroups: userGroups
      }).success(function(data) {
        
      });
    };


    $scope.desactivate = function(user) {
      user.active = false;
      $http.put('/api/users/desactivate/' + user._id, {
        userId: user._id
      }).success(function() {
        $scope.reloadUsers();
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
        $scope.reloadUsers();
        $('#modUser').modal('hide');
      });
    };


  });
