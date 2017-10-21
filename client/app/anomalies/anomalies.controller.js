/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('AnomaliesCtrl', function($scope, $rootScope, $http, categoryKPI, Notification) {
    $scope.allanomalies = [];
    $scope.anomalies = [];
    $scope.otheranomalies = [];
    $scope.myanomalies = [];
    $scope.orderByField = 'date';
    $scope.reverseSort = true;
    $scope.searchName = '';
    $scope.searchActor = '';
    $scope.searchActivity = '';
    $scope.searchContext = '';
    $scope.searchCategory = '';
    $scope.searchImpact = '';
    $scope.searchParams = {};
    $scope.availableSearchParams = [{
      key: 'group',
      name: 'Group',
      placeholder: 'Group...',
      allowMultiple: true
    }, {
      key: 'name',
      name: 'Name',
      placeholder: 'Name...',
      allowMultiple: true
    }, {
      key: 'activity',
      name: 'Activity',
      placeholder: 'Activity...',
      allowMultiple: true
    }, {
      key: 'context',
      name: 'Context',
      placeholder: 'Context...',
      allowMultiple: true
    }, {
      key: 'category',
      name: 'Category',
      placeholder: 'Category...',
      allowMultiple: true
    }, {
      key: 'impact',
      name: 'Impact',
      placeholder: 'Impact...'
    }, {
      key: 'status',
      name: 'Status',
      placeholder: 'Status...',
      restrictToSuggestedValues: true,
      suggestedValues: ['Not Planned', 'In Progress', 'Closed']
    }];

    var filterDashboards = function(data) {
      return _.filter(data, function(anomalie) {

        var blnName = ($scope.searchName.length === 0) ? true : (anomalie.name.toLowerCase().indexOf($scope.searchName.toLowerCase()) >= 0 || anomalie.activity.toLowerCase().indexOf($scope.searchName.toLowerCase()) >= 0);
        var blnActor = ($scope.searchActor.length === 0) ? true : false;
        if (anomalie.actor && anomalie.actor.groups && anomalie.actor.groups[0].toLowerCase().indexOf($scope.searchActor.toLowerCase()) >= 0) {
          blnActor = true;
        }
        var blnContext = ($scope.searchContext.length === 0) ? true : false;
        if (anomalie.context && anomalie.context.toLowerCase().indexOf($scope.searchContext.toLowerCase()) >= 0) {
          blnContext = true;
        }

        var blnCategory = ($scope.searchCategory.length === 0) ? true : false;
        var anoCats = _.map(anomalie.category, function(x) {
          return x.toLowerCase();
        });
        _.each(anoCats, function(anoCat) {
          if (anoCat.indexOf($scope.searchCategory.toLowerCase()) >= 0) {
            blnCategory = true;
          }
        });

        var blnImpact = ($scope.searchImpact.length === 0) ? true : false;
        if (anomalie.impact.toLowerCase().indexOf($scope.searchImpact.toLowerCase()) >= 0) {
          blnImpact = true;
        }

        var blnSearchText = blnName && blnActor && blnContext && blnCategory && blnImpact;
        return blnSearchText;
      });
    };

    $scope.load = function() {
      var myparams = {
        params: {
          quick: true
        }
      };

      $http.get('/api/anomalies/', myparams).success(function(anomalies) {
        $scope.allanomalies = [];
        $scope.anomalies = [];
        $scope.otheranomalies = [];
        $scope.myanomalies = [];
        _.each(anomalies, function(anomalie) {
          anomalie.subscribed = false;
          var userlist = _.pluck(anomalie.users, '_id');
          var userindex = userlist.indexOf($scope.currentUser._id.toString());
          if (userindex >= 0 && anomalie.users[userindex] && anomalie.users[userindex].anomalieName && anomalie.users[userindex].anomalieName.length > 0) {
            anomalie.name = anomalie.users[userindex].anomalieName;
            anomalie.subscribed = true;
          }
        });
        $scope.allanomalies = _.sortBy(anomalies, 'name').reverse();
        $scope.anomalies = $scope.allanomalies;

      });
    };

    $scope.reloadDashboards = function() {
      $scope.anomalies = filterDashboards($scope.allanomalies);
    };

    $scope.$watchGroup(['searchName', 'searchActor', 'searchActivity', 'searchContext', 'searchCategory', 'searchImpact'], function(newValues, oldValues) {
      $scope.reloadDashboards();
    });

    $scope.pinDashboard = function(anomalie) {
      $http.post('/api/anomalieCompletes/subscribe/' + anomalie._id, $scope.currentUser);
      Notification.success('You subscribe to anomalie "' + anomalie.name + '"');
      $scope.load();
    };

    $scope.unpinDashboard = function(anomalie) {
      $http.post('/api/anomalieCompletes/unsubscribe/' + anomalie._id, $scope.currentUser);
      Notification.success('You unsubscribe to anomalie "' + anomalie.name + '"');
      $scope.load();
    };

    $scope.delete = function(anomalie, index) {
      bootbox.confirm('Are you sure to delete this anomalie ?', function(result) {
        if (result) {
          $http.delete('/api/anomalieCompletes/' + anomalie._id).success(function() {
            Notification.success('Dashboard "' + anomalie.name + '" was deleted');
            $scope.load();
          });
        }
      });
    };

    $scope.load();


    $scope.categories = [{
        value: 'Process',
        text: 'Process'
      },
      {
        value: 'RACI',
        text: 'RACI'
      },
      {
        value: 'Tools',
        text: 'Tools'
      },
      {
        value: 'Competencies',
        text: 'Competencies'
      },
      {
        value: 'Communication',
        text: 'Communication'
      }
    ];

    $scope.showCategories = function(anoCat) {
      var checklist = [];
      _.each($scope.categories, function(s) {
        if (anoCat && anoCat.indexOf(s.value) >= 0) {
          checklist.push(s.text);
        }
      });
      return checklist.length ? checklist.join(', ') : 'Not set';
    };

  });
