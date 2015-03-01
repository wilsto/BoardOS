'use strict';

angular.module('boardOsApp')
    .controller('JournallogCtrl', function($scope, $http) {
        $http.get('/api/logs').success(function(logs) {
            $scope.logs = logs;
        });
    });