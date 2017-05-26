/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('DashboardsCtrl', function($scope, $rootScope, $http, categoryKPI, Notification) {
    $scope.alldashboards = [];
    $scope.dashboards = [];
    $scope.otherdashboards = [];
    $scope.mydashboards = [];
    $scope.orderByField = 'subscribed';
    $scope.reverseSort = true;
    $scope.searchText = '';

    var filterDashboards = function(data) {
      return _.filter(data, function(dashboard) {
        if (!dashboard.activity) {
          dashboard.activity = '';
        }
        if (!dashboard.context) {
          dashboard.context = '';
        }
        var blnSearchText = ($scope.searchText.length === 0) ? true : dashboard.name.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0 || dashboard.activity.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0 || dashboard.context.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0;
        return blnSearchText;
      });
    };

    $scope.load = function() {
      var myparams = {
        params: {
          quick: true
        }
      };

      $http.get('/api/dashboardCompletes/', myparams).success(function(dashboards) {
        $scope.alldashboards = [];
        $scope.dashboards = [];
        $scope.otherdashboards = [];
        $scope.mydashboards = [];
        _.each(dashboards, function(dashboard) {
          dashboard.subscribed = false;
          var userlist = _.pluck(dashboard.users, '_id');
          var userindex = userlist.indexOf($scope.currentUser._id.toString());
          if (userindex >= 0) {
            dashboard.name = dashboard.users[userindex].dashboardname;
            dashboard.subscribed = true;
          }
        });
        $scope.alldashboards = _.sortBy(dashboards, ['activity', 'context']).reverse();
        $scope.reloadDashboards();
      });
    };

    $scope.getMoreData = function() {
      var filterdashboards = _.where($scope.alldashboards, function(dashboard) {
        var userlist = _.pluck(dashboard.users, '_id');
        return userlist.indexOf($scope.currentUser._id.toString()) < 0;
      });
      filterdashboards = filterDashboards(filterdashboards);
      $scope.otherdashboards = filterdashboards.slice(0, $scope.otherdashboards.length + 15);
      $scope.dashboards = $scope.mydashboards.concat($scope.otherdashboards);
    };

    $scope.reloadDashboards = function() {
      var mydashboards = _.filter($scope.alldashboards, function(dashboard) {
        var userlist = _.pluck(dashboard.users, '_id');
        return userlist.indexOf($scope.currentUser._id.toString()) >= 0;
      });
      mydashboards = filterDashboards(mydashboards);
      $scope.mydashboards = mydashboards;
      var filterdashboards = _.where($scope.alldashboards, function(dashboard) {
        var userlist = _.pluck(dashboard.users, 'user');
        return userlist.indexOf($scope.currentUser._id.toString()) < 0;
      });
      filterdashboards = filterDashboards(filterdashboards);
      $scope.otherdashboards = filterdashboards.slice(0, Math.max(15, $scope.dashboards.length - mydashboards.length));
      $scope.dashboards = $scope.mydashboards.concat($scope.otherdashboards);
    };

    $scope.pinDashboard = function(dashboard) {
      $http.post('/api/dashboardCompletes/subscribe/' + dashboard._id, $scope.currentUser);
      Notification.success('You subscribe to dashboard "' + dashboard.name + '"');
      $scope.load();
    };

    $scope.unpinDashboard = function(dashboard) {
      $http.post('/api/dashboardCompletes/unsubscribe/' + dashboard._id, $scope.currentUser);
      Notification.success('You unsubscribe to dashboard "' + dashboard.name + '"');
      $scope.load();
    };

    $scope.$watch('searchText', function() {
      $scope.reloadDashboards();
    });

    $scope.delete = function(dashboard, index) {
      bootbox.confirm('Are you sure to delete this dashboard ?', function(result) {
        if (result) {
          $http.delete('/api/dashboardCompletes/' + dashboard._id).success(function() {
            Notification.success('Dashboard "' + dashboard.name + '" was deleted');
            $scope.load();
          });
        }
      });
    };

    $scope.load();
  });
