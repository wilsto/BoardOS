/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('WhatsnewCtrl', function($rootScope, $scope, $http, $uibModal, Auth, $location, Notification) {

    $scope.allPages = [];
    $scope.infos = [];
    $scope.showPage = [];

    $scope.versions = [{
        value: '2.3',
        text: '2.3'
      },
      {
        value: '2.2',
        text: '2.2'
      },
      {
        value: '2.1',
        text: '2.1'
      },
      {
        value: '2.0',
        text: '2.0'
      },
      {
        value: '1.0',
        text: '1.0'
      }
    ];

    $scope.positions = [{
        value: 'top',
        text: 'top'
      },
      {
        value: 'right',
        text: 'right'
      },
      {
        value: 'left',
        text: 'left'
      },
      {
        value: 'bottom',
        text: 'bottom'
      }
    ];

    $scope.allinfos = [];
    $scope.infos = [];
    $scope.showInfos = [];
    $scope.orderByField = 'date';
    $scope.reverseSort = true;

    $scope.selectedPage = '';
    $scope.selectPage = function(page) {
      $scope.selectedPage = page;
      $scope.showPage = _.filter($scope.allPages, function(thispage) {
        return thispage.page === $scope.selectedPage;
      })[0];
    };

    $scope.pages = ['/', 'about', 'account', 'admin', 'anomalie', 'anomalies', 'calendar', 'dasboard', 'dasboards', 'dqm', 'hierarchies', 'KPI', 'KPIs', 'mail', 'settings', 'task', 'tasks', 'whatsnew'];
    $scope.pagesNb = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    $scope.loadHints = function() {
      $http.get('/api/whatsnews').success(function(data) {
        $scope.allPages = data;

        _.each($scope.allPages, function(page) {
          var index = $scope.pages.indexOf(page.page);
          $scope.pagesNb[index] = page.hints.length;
        });

        if ($scope.selectedPage) {
          $scope.selectPage($scope.selectedPage);
        }
      });
    };

    $scope.loadHints();

    $scope.createHint = function() {
      if (!$scope.showPage) {
        $scope.showPage = {
          page: $scope.selectedPage,
          hints: []
        };
      }
      if (!$scope.showPage.hints) {
        $scope.showPage.hints = [];
      }
      $scope.showPage.hints.push({
        version: '2.3',
        position: 'bottom'
      });
    };

    $scope.save = function() {
      if (!$scope.showPage._id) {
        $http.post('/api/Whatsnews', $scope.showPage);
        Notification.success('Page of Hints "' + $scope.showPage.page + '" was created');
        $scope.loadHints();
      } else {
        $http.put('/api/Whatsnews/' + $scope.showPage._id, $scope.showPage);
        Notification.success('Page of Hints "' + $scope.showPage.page + '" was updated');
        $scope.loadHints();
      }
    };

    $scope.delete = function(hint, index) {
      bootbox.confirm('Are you sure to delete the hint on element ' + hint.element + '?', function(result) {
        if (result) {
          $scope.showPage.hints.splice(index, 1);
          $scope.$apply();
        }
      });
    };
  });