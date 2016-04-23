'use strict';

angular.module('boardOsApp')
    .config(function($stateProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'app/account/login/login.html',
                controller: 'LoginCtrl'
            })
            .state('signup', {
                url: '/signup',
                templateUrl: 'app/account/signup/signup.html',
                controller: 'SignupCtrl'
            })
            .state('forgot', {
                url: '/forgot',
                templateUrl: 'app/account/forgot/forgot.html',
                controller: 'ForgotCtrl'
            })
            .state('reset', {
                url: '/reset/:token',
                templateUrl: 'app/account/reset/reset.html',
                controller: 'ResetCtrl'
            })
            .state('settings', {
                url: '/settings',
                templateUrl: 'app/account/settings/settings.html',
                controller: 'SettingsCtrl',
                authenticate: true
            });
    });