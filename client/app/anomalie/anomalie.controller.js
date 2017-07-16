'use strict';
/*jshint loopfunc:true */

angular.module('boardOsApp')
  .controller('AnomalieCtrl', function($scope, $filter, $stateParams, $http, $location, $window, $timeout, Notification) {

    var anomalieId = $stateParams.id || $scope.anomalie._id;

    $scope.createActionPlan = function() {
      var path = $location.protocol() + '://' + location.host + '/task////anomaly/' + $scope.anomalie._id;
      $window.open(path, '_blank');
    };

    $scope.refreshAnomalie = function() {
      $scope.myPromise = $http.put('/api/anomalie/' + $scope.anomalie._id + '/true', $scope.anomalie).success(function(data) {
        var logInfo = 'Anomalie "' + $scope.anomalie.name + '" was recalculated';
        $timeout(function() {
          $scope.loadAnomalie();
        }, 500);
        Notification.success(logInfo);
      });
    };

    $scope.myPromise = $http.get('/api/anomalies/' + anomalieId).success(function(anomalie) {
      $scope.anomalie = anomalie;

      $scope.impacts = [{
          value: 1,
          text: 'Blocking'
        },
        {
          value: 2,
          text: 'Critic'
        },
        {
          value: 3,
          text: 'Irritant'
        }
      ];

      $scope.showImpacts = function() {
        var selected = $filter('filter')($scope.impacts, {
          value: $scope.anomalie.impact
        });
        return ($scope.anomalie.impact && selected.length) ? selected[0].text : 'Not set';
      };

      $scope.categories = [{
          value: 1,
          text: 'Process'
        },
        {
          value: 2,
          text: 'RACI'
        },
        {
          value: 3,
          text: 'Tools'
        },
        {
          value: 4,
          text: 'Competencies'
        },
        {
          value: 5,
          text: 'Communication'
        }
      ];

      $scope.showCategories = function() {
        var selected = $filter('filter')($scope.categories, {
          value: $scope.anomalie.category
        });
        return ($scope.anomalie.category && selected.length) ? selected[0].text : 'Not set';
      };

    });
  });
