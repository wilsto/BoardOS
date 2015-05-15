'use strict';

angular.module('boardOsApp')
    .controller('MailCtrl', function($scope, $http) {

        $scope.sendMail = function() {
            $http.get('/api/mails').success(function(response) {
                console.log('response', response);
                $scope.message = response;
            });
        };
    });