'use strict';

angular.module('boardOsApp')
  .controller('NavbarCtrl', function($scope, $rootScope, $location, Auth, $http) {

    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;
      $rootScope.thisUser = $scope.currentUser;
      if ($scope.currentUser && $scope.currentUser._id) {
        $scope.load();
        $scope.loadDashBoards();
      }
    });

    $rootScope.openNav = function() {
      $rootScope.loadNews();
      $http.get('/api/Whatsnews/updateViewer/' + $scope.currentUser._id).success(function(infos) {
        $rootScope.alreadyviewed = true;
      });
      if ($('#mySidenav').css('width') === '4px') {
        $('#mySidenav').css('width', '755px');
      } else {
        $('#mySidenav').css('width', '4px');
      }
    };

    $scope.load = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id,
          status: ['Not Started', 'In Progress']
        }
      };

      $http.get('/api/taskFulls/', myparams).success(function(tasks) {
        $scope.navBarTasks = tasks;
      });
    };


    $scope.loadDashBoards = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id,
          quick: true
        }
      };
      $http.get('/api/dashboardCompletes/', myparams).success(function(dashboards) {
        _.each(dashboards, function(dashboard) {
          dashboard.subscribed = false;
          var userlist = _.pluck(dashboard.users, '_id');
          var userindex = userlist.indexOf($scope.currentUser._id.toString());
          if (userindex >= 0 && dashboard.users[userindex] && dashboard.users[userindex].dashboardName && dashboard.users[userindex].dashboardName.length > 0) {
            dashboard.name = dashboard.users[userindex].dashboardName;
            dashboard.subscribed = true;
          }
        });
        dashboards = _.sortBy(dashboards, ['activity', 'context']);

        $scope.dashboards = dashboards;
        $rootScope.dashboards = dashboards;
      });
    };
    $scope.quickSearchTxt = '';

    $scope.onSelect = function($item, $model, $label) {
      $scope.$item = $item;
      $scope.$model = $model;
      $scope.$label = $label;
    };

    /** SearhBar **/
    $scope.searchTasks = function(typed) {
      return $http.get('/api/taskFulls/search/', {
        params: {
          search: typed,
        }
      }).then(function(response) {
        $scope.mySearchTxt = null;
        return response.data;
      });
    };

    $scope.logout = function() {
      Auth.logout();
      $scope.$emit('UserLogChange');
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    if ($scope.currentUser && $scope.currentUser._id) {
      $scope.load();
      $scope.loadDashBoards();
    }
  });
