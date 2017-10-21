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
    $scope.searchName = '';
    $scope.searchActor = '';
    $scope.searchActivity = '';
    $scope.searchContext = '';

    var filterDashboards = function(data) {
      return _.filter(data, function(dashboard) {

        var blnName = ($scope.searchName.length === 0) ? true : dashboard.name.toLowerCase().indexOf($scope.searchName.toLowerCase()) >= 0;
        var blnActor = ($scope.searchActor.length === 0) ? true : false;
        _.each(dashboard.users, function(actor) {
          if (actor.name.toLowerCase().indexOf($scope.searchActor.toLowerCase()) >= 0) {
            blnActor = true;
          }
        });
        var blnActivity = ($scope.searchActivity.length === 0) ? true : false;
        var blnContext = ($scope.searchContext.length === 0) ? true : false;
        _.each(dashboard.perimeter, function(thisperimeter) {
          if (thisperimeter.activity && thisperimeter.activity.toLowerCase().indexOf($scope.searchActivity.toLowerCase()) >= 0) {
            blnActivity = true;
          }
          if (thisperimeter.context && thisperimeter.context.toLowerCase().indexOf($scope.searchContext.toLowerCase()) >= 0) {
            blnContext = true;
          }
        });
        var blnSearchText = blnName && blnActor && blnActivity && blnContext;
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
          if (userindex >= 0 && dashboard.users[userindex] && dashboard.users[userindex].dashboardName && dashboard.users[userindex].dashboardName.length > 0) {
            dashboard.name = dashboard.users[userindex].dashboardName;
            dashboard.subscribed = true;
          }
        });
        $scope.alldashboards = _.sortBy(dashboards, 'name').reverse();
        $scope.dashboards = $scope.alldashboards;

      });
    };

    $scope.reloadDashboards = function() {
      $scope.dashboards = filterDashboards($scope.alldashboards);
    };

    $scope.$watchGroup(['searchName', 'searchActor', 'searchActivity', 'searchContext'], function(newValues, oldValues) {
      $scope.reloadDashboards();
    });

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
