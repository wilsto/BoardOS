'use strict';

angular.module('boardOsApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('mail', {
                url: '/mail',
                templateUrl: 'app/mail/mail.html',
                controller: 'MailCtrl',
                authenticate: true
            });
    });