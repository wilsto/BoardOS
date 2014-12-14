'use strict';

angular.module('boardOsApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'ngToast',
  'ng-nestable',
  'ngJsTree',
  'nvd3'
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

.constant('metricTaskFields',
[   
    {value: 'load', text: 'Load'},
    {value: 'duration', text: 'Duration'},
    {value: 'progress', text: 'Progress'},
    {value: 'trust', text: 'Trust'},
    {value: 'startDate', text: 'Start'},
    {value: 'endDate', text: 'End'},
    {value: 'progressStatus', text: 'progressStatus'},
    {value: 'status', text: 'Statut'},
    {value: 'constant', text: 'Constant'}
  ])

.constant('categoryKPI',
[                                                                                                                                                                                                             
  {value: 'Alert', text: 'Alert'},
  {value: 'Anticipation', text: 'Anticipation'},
  {value: 'Goal', text: 'Goal'},
  {value: 'Information', text: 'Information'}
])

.constant('actionKPI',
[                                                                                                                                                                                                             
  {value: 'Count', text: 'Count'},
  {value: 'List', text: 'List'},
  {value: 'Mean', text: 'Mean'},
  {value: 'Min', text: 'Min'},
  {value: 'Max', text: 'Max'},
  {value: 'Sum', text: 'Sum'}
])

.constant('groupByKPI',
[                                                                                                                                                                                                             
  {value: 'None', text: 'None'},
  {value: 'Day', text: 'Day'},
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