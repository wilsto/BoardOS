'use strict';

angular.module('boardOsApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'ngToast',
  'ng-nestable',
  'ngJsTree'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');
  })

  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })
  

.directive('xeditable', function($timeout) {
    return {
        restrict: 'A',
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            var loadXeditable = function() {
                angular.element(element).editable({
                    display: function(value, srcData) {
                        ngModel.$setViewValue(value);
                        scope.$apply();
                    }
                });
            }
            $timeout(function() {
                loadXeditable();
            }, 10);
        }
    };
})

.constant('progressStatusTask',
[                                                                                                                                                                                                             
  {value: 'On time', text: 'On time'},
  {value: 'At Risk', text: 'At Risk'},
  {value: 'Late', text: 'Late'}
])

.constant('statusTask',
[                                                                                                                                                                                                             
  {value: 'Not Started', text: 'Not Started'},
  {value: 'In Progress', text: 'In Progress'},
  {value: 'Withdrawn', text: 'Withdrawn'},
  {value: 'Finished', text: 'Finished'}
])

.constant('categoryKPI',
[                                                                                                                                                                                                             
  {value: 'Goal', text: 'Goal'},
  {value: 'Alert', text: 'Alert'},
  {value: 'Anticipation', text: 'Anticipation'},
  {value: 'Information', text: 'Information'}
])

.constant('actionKPI',
[                                                                                                                                                                                                             
  {value: 'Mean', text: 'Mean'},
  {value: 'Sum', text: 'Sum'},
  {value: 'List', text: 'List'}
])

.constant('groupByKPI',
[                                                                                                                                                                                                             
  {value: 'Week', text: 'Week'},
  {value: 'Month', text: 'Month'},
  {value: 'Year', text: 'Year'}
])

  .run(function ($rootScope, $location, Auth) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  });