'use strict';

angular.module('boardOsApp')
    .controller('SettingsCtrl', function($scope, Auth, $http, Notification) {
        $scope.errors = {};
        $scope.currentUser = Auth.getCurrentUser();

        $scope.dashboards = [];
        $scope.locations = [{
            value: 'Suresnes',
            text: 'Suresnes'
        }, {
            value: 'Hongrie',
            text: 'Hongrie'
        }, {
            value: 'RepThech',
            text: 'RepThech'
        }, {
            value: 'Nantes',
            text: 'Nantes'
        }, {
            value: 'Levallois',
            text: 'Levallois'
        }, {
            value: 'Boulogne',
            text: 'Boulogne'
        }, ];
        $scope.editInProgress = false;

        $scope.load = function() {
            $http.get('/api/dashboardCompletes/list/' + $scope.currentUser._id).success(function(dashboards) {
                $scope.dashboards = dashboards;
            });
        };

        $scope.load();
        $scope.changePassword = function(form) {
            $scope.submitted = true;
            if (form.$valid) {
                Auth.changePassword($scope.user.oldPassword, $scope.user.newPassword)
                    .then(function() {
                        $scope.message = 'Password successfully changed.';
                    })
                    .catch(function() {
                        form.password.$setValidity('mongoose', false);
                        $scope.errors.other = 'Incorrect password';
                        $scope.message = '';
                    });
            }
        };

        $scope.deleteDashboard = function(dashboard, index) {
            bootbox.confirm('Are you sure?', function(result) {
                if (result) {
                    $http.delete('/api/dashboards/' + dashboard._id).success(function() {
                        $scope.dashboards.splice(index, 1);
                        Notification.success({
                            Title: 'Dashboard',
                            message: 'Dashboard "' + dashboard.name + '" has been removed from your list'
                        });
                    });
                }
            });
        };

        $scope.saveAvatar = function() {
            $scope.editInProgress = false;
            $http({
                method: 'PUT',
                data: $scope.currentUser,
                url: '/api/users/' + $scope.currentUser._id + '/avatar'
            }).
            success(function() {

            });
        };

        $scope.editMode = function(value) {
            $scope.editInProgress = true;
        };

    });
