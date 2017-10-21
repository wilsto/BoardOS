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

    /** SearhBar **/
    $http.get('/api/taskFulls/').success(function(objects) {
      $scope.mySearchTasks = objects;
    });

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

    $scope.updateMySearch = function(typed) {

      $scope.mySearch = [];
      $http.get('/api/taskFulls/').success(function(objects) {
        _.each(objects, function(object) {
          $scope.mySearch.push(object.name);
        });
        $scope.mySearch = _.uniq($scope.mySearch);
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

    $scope.filterTask = function(tasks, filter) {
      var filtertasks;
      // si pas de filtrer alors on retourne le tout
      if (typeof filter === 'undefined') {
        return tasks;
      }
      filtertasks = _.filter(tasks, function(task) {
        // si owner
        if (task.actor._id === $scope.currentUser._id) {
          return true;
        }
        // si actor (metrics)
        if (typeof task.metrics[task.metrics.length - 1] !== 'undefined') {
          if ($scope.currentUser._id === task.metrics[task.metrics.length - 1].actor._id) {
            return true;
          }
        }
        // si watcher
        if (_.intersection([$scope.currentUser._id], _.pluck(task.watchers, '_id')).length > 0) {
          return true;
        }
      });
      return filtertasks;
    };

    if ($scope.currentUser && $scope.currentUser._id) {
      $scope.load();
      $scope.loadDashBoards();
    }
  });
