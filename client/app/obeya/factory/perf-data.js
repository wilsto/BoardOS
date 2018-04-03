'use strict';

angular.module('boardOsApp').factory('dataGenerator', function($rootScope, $http) {
    return {
      quantitativeOverTime: {
        data: function() {
          return $http.get('/api/taskFulls/countByMonth', {
            params: {
              filterPerimeter: $rootScope.filterPerimeter
            }
          }).success(function(tasks) {
            return tasks;
          }).error(function(err) {
            console.log('err', err);
          });
        }
      },
      qualitativeOverTime: {
        data: function() {
          return $http.get('/api/taskFulls/countByMonth', {
            params: {
              filterPerimeter: $rootScope.filterPerimeter
            }
          }).success(function(tasks) {        
            return tasks;
          }).error(function(err) {
            console.log('err', err);
          });
        }
      }
    };

  });
