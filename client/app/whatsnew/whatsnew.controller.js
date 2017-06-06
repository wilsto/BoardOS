/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('WhatsnewCtrl', function($rootScope, $scope, $http, $uibModal, Auth, $location, Notification) {

    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;
      $rootScope.loadNews();
    });

    $scope.allinfos = [];
    $scope.infos = [];
    $rootScope.showInfos = [];
    $scope.orderByField = 'date';
    $scope.reverseSort = true;

    $rootScope.loadNews = function() {
      var absUrl = $location.absUrl();
      $http.get('/api/whatsnews').success(function(data) {
        $scope.infos = _.sortBy(data, 'date').reverse();

        _.each(data, function(info) {
          info.resume = info.resume || '';
          info.info = info.info || '';
          info.resumeHtml = info.resume.replace(new RegExp('img alt="" src="(?!http:?)', 'g'), 'img alt="" src="assets/ReleaseNotes/');
          info.infoHtml = info.info.replace(new RegExp('img alt="" src="(?!http:?)', 'g'), 'img alt="" src="assets/ReleaseNotes/');
        });

        $scope.infos.every(function(info) {

          $rootScope.alreadyviewed = (info.viewers.length > 0) ? true : false;
          _.each(info.viewers, function(viewer) {
            $scope.thisviewed = false;
            if (viewer._id.toString() === $scope.currentUser._id.toString()) {
              $scope.thisviewed = true;
            }
          });

          if ($scope.thisviewed === false) {

            $rootScope.alreadyviewed = false;
            return false;
          }

        });
        $scope.allinfos = $scope.infos;
        $rootScope.showInfos = $scope.infos.slice(0, 15);
      });
    };

    $scope.reloadInfos = function() {
      $scope.infos = $scope.allinfos;
      $rootScope.showInfos = $scope.infos.slice(0, 15);
    };


    $scope.getMoreData = function() {
      var infos = $scope.allinfos;
      $rootScope.showInfos = infos.slice(0, $rootScope.showInfos.length + 15);
    };

    $scope.save = function() {
      delete $scope.info.__v;
      if (typeof $scope.info._id === 'undefined') {

        $http.post('/api/Whatsnews', $scope.info);
        Notification.success('Info "' + $scope.info.title + '" was created');
        $('#tallModal').modal('hide');
        $rootScope.loadNews();

      } else {
        $http.put('/api/Whatsnews/' + $scope.info._id, $scope.info);
        Notification.success('Info "' + $scope.info.title + '" was updated');
        $('#tallModal').modal('hide');
        $rootScope.loadNews();

      }

    };
    $scope.createInfo = function() {
      $scope.info = {
        active: true,
        owner: $scope.currentUser._id
      };
      $('#tallModal').modal();
    };


    $scope.showDetails = function(info) {
      $scope.info = info;
    };

    $scope.unshowDetails = function() {
      $scope.info = undefined;
    };

    $scope.edit = function(info) {
      $scope.info = {};
      $scope.info = info;
      $('#tallModal').modal();
    };

    $scope.reset = function() {
      $scope.info = {};
    };

    $scope.delete = function(info, index) {
      bootbox.confirm('Are you sure to delete this info ' + info.title + '?', function(result) {
        if (result) {
          $http.delete('/api/Whatsnews/' + info._id).success(function(data) {
            Notification.success('Info "' + info.title + '" was deleted');
            $rootScope.loadNews();
          });
        }
      });
    };
  });
