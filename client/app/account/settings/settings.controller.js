'use strict';

angular.module('boardOsApp')
  .controller('SettingsCtrl', function($scope, Auth, $http, Notification, $timeout, $rootScope) {
    $scope.errors = {};
    $scope.currentUser = Auth.getCurrentUser();


    $scope.datafalse = false;
    $scope.datatrue = true;

    $scope.dashboards = [];
    $scope.locations = [{
      value: 'Suresnes',
      text: 'Suresnes'
    }, {
      value: 'Levallois',
      text: 'Levallois'
    }];
    $scope.repeatOn = [{
        value: 1,
        text: 'MO',
        label: 'Monday'
      },
      {
        value: 2,
        text: 'TU',
        label: 'Tuesday'
      },
      {
        value: 3,
        text: 'WE',
        label: 'Wednesday'
      },
      {
        value: 4,
        text: 'TH',
        label: 'Thursday'
      },
      {
        value: 5,
        text: 'FR',
        label: 'Friday'
      }
    ];
    $scope.showRepeatOn = function(task) {
      var selected = [];
      _.each($scope.repeatOn, function(s) {
        if (task.repeatOn && task.repeatOn.indexOf(s.value) >= 0) {
          selected.push(s.label);
        }
      });
      return selected.length ? selected.join(', ') : 'Not set';
    };

    $scope.$watchGroup(['currentUser.name', 'currentUser.visa', 'currentUser.avatar'], function(newMap, previousMap) {
      $scope.editInProgress = true;
    }, true);

    $scope.load = function() {
      $http.get('/api/recurrentTasks/list/' + $scope.currentUser._id).success(function(recurrentTasks) {
        $scope.recurrentTasks = recurrentTasks;
        $scope.editInProgress = false;
        //Call Intro
        $timeout(function() {
          $rootScope.$broadcast('ExplainToMe/intro');
        }, 1000);

      });
    };

    $scope.load();
    $scope.changePassword = function(form) {
      $scope.submitted = true;
      if (form.$valid) {
        Auth.changePassword($scope.user.oldPassword, $scope.user.newPassword)
          .then(function() {
            $scope.message = 'Password successfully changed.';
          })
          .catch(function() {
            form.password.$setValidity('mongoose', false);
            $scope.errors.other = 'Incorrect password';
            $scope.message = '';
          });
      }
    };

    $scope.deleteDashboard = function(dashboard, index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/dashboards/' + dashboard._id).success(function() {
            $scope.dashboards.splice(index, 1);
            Notification.success({
              Title: 'Dashboard',
              message: 'Dashboard "' + dashboard.name + '" has been removed from your list'
            });
          });
        }
      });
    };

    $scope.saveAvatar = function() {
      $scope.editInProgress = false;
      $http({
        method: 'PUT',
        data: $scope.currentUser,
        url: '/api/users/' + $scope.currentUser._id + '/avatar'
      }).
      success(function() {

      });
    };

    $scope.editMode = function(value) {
      $scope.editInProgress = true;
    };

    $scope.toggleActive = function(type) {
      $http.get('/api/recurrentTasks/toggleAll/' + type + '/' + $scope.currentUser._id).success(function(recurrentTasks) {
        $scope.load();
      });
    };

    $scope.toggleOneActive = function(rtask) {
      $http.get('/api/recurrentTasks/toggleOne/' + !rtask.active + '/' + rtask._id).success(function(recurrentTasks) {
        $scope.load();
      });
    };
  });