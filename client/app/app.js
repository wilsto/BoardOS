'use strict';

angular.module('boardOsApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'btford.socket-io',
    'ngJsTree',
    'ngDialog',
    'nvd3',
    'ng.confirmField',
    'ui.calendar'
])
    .config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
        $urlRouterProvider.otherwise('/');
        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('authInterceptor');

        //initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get.Pragma = 'no-cache';
    })

/*  .config(function ($httpProvider) {
        $httpProvider.requestInterceptors.push('httpRequestInterceptorIECacheSlayer');
    })
    // IE 8 cache problem - Request Interceptor - https://github.com/angular/angular.js/issues/1418#issuecomment-11750815
    .factory('httpRequestInterceptorIECacheSlayer', function($log) {
        return function(promise) {
            return promise.then(function(request) {
                // If not a partial, append timestamp query string
                if(request.url.indexOf("partials/") === -1) {
                    var d = new Date();
                    request.url = request.url + '?cacheSlayer=' + d.getTime();
                }
                $log.info('request.url = ' + request.url);
                // return the config object to pass it on to the next interceptor
                return request;
            });
        };
    });*/

.factory('authInterceptor', function($rootScope, $q, $cookieStore, $location) {
    return {
        // Add authorization token to headers
        request: function(config) {
            config.headers = config.headers || {};
            if ($cookieStore.get('token')) {
                config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
            }
            return config;
        },

        // Intercept 401s and redirect you to login
        responseError: function(response) {
            if (response.status === 401) {
                $location.path('/login');
                // remove any stale tokens
                $cookieStore.remove('token');
                return $q.reject(response);
            } else {
                return $q.reject(response);
            }
        }
    };
})

.constant('progressStatusTask', [{
    value: 'On Time',
    text: 'On Time'
}, {
    value: 'At Risk',
    text: 'At Risk'
}, {
    value: 'Late',
    text: 'Late'
}])

.constant('statusTask', [{
    value: 'Not Started',
    text: 'Not Started'
}, {
    value: 'In Progress',
    text: 'In Progress'
}, {
    value: 'Withdrawn',
    text: 'Withdrawn'
}, {
    value: 'Finished',
    text: 'Finished'
}])

.constant('metricTaskFields', [{
    value: 'Constant',
    text: 'Constant'
}, {
    value: 'load',
    text: 'Load'
}, {
    value: 'timeSpent',
    text: 'Time Spent'
}, {
    value: 'projectedWorkload',
    text: 'Projected Work Load'
}, {
    value: 'duration',
    text: 'Duration'
}, {
    value: 'progress',
    text: 'Progress'
}, {
    value: 'trust',
    text: 'Trust'
}, {
    value: 'startDate',
    text: 'Start'
}, {
    value: 'endDate',
    text: 'End'
}, {
    value: 'progressStatus',
    text: 'progressStatus'
}, {
    value: 'status',
    text: 'Statut'
}, {
    value: 'deliverableStatus',
    text: 'deliverableStatus'
}, {
    value: 'userSatisfaction',
    text: 'userSatisfaction'
}, {
    value: 'actorSatisfaction',
    text: 'actorSatisfaction'
}, {
    value: 'reworkReason',
    text: 'reworkReason'
}])

.constant('categoryKPI', [{
    value: 'Alert',
    text: 'Alert'
}, {
    value: 'Anticipation',
    text: 'Anticipation'
}, {
    value: 'Goal',
    text: 'Goal'
}, {
    value: 'Information',
    text: 'Information'
}])

.constant('listValuesKPI', [{
    value: 'AllValues',
    text: 'AllValues'
}, {
    value: 'UniqueValues',
    text: 'UniqueValues'
}, {
    value: 'LastValue',
    text: 'LastValue'
}, {
    value: 'FirstValue',
    text: 'FirstValue'
}, {
    value: 'ValuesLessThan',
    text: 'ValuesLessThan'
}, {
    value: 'ValuesMoreThan',
    text: 'ValuesMoreThan'
}])

.constant('actionKPI', [{
    value: 'Count',
    text: 'Count'
}, {
    value: 'List',
    text: 'List'
}, {
    value: 'Mean',
    text: 'Mean'
}, {
    value: 'Min',
    text: 'Min'
}, {
    value: 'Max',
    text: 'Max'
}, {
    value: 'Sum',
    text: 'Sum'
}])

.constant('groupByKPI', [{
        value: 'None',
        text: 'None'
    }, {
        value: 'Day',
        text: 'Day'
    }, {
        value: 'Week',
        text: 'Week'
    }, {
        value: 'Month',
        text: 'Month'
    }, {
        value: 'Year',
        text: 'Year'
    }

])

.run(function($rootScope, $location, Auth, $http, progressStatusTask, statusTask, metricTaskFields, categoryKPI, actionKPI, groupByKPI, $cookieStore) {

    $rootScope.perimeter = $cookieStore.get('perimeter');
    if (typeof $rootScope.perimeter === 'undefined') {
        $rootScope.perimeter = {};
        $rootScope.perimeter.name = '';
        $rootScope.perimeter.id = '';
        $rootScope.perimeter.activity = '';
        $rootScope.perimeter.context = '';
        $rootScope.perimeter.axis = '';
        $rootScope.perimeter.category = '';
    }


    $rootScope.constant = {};
    $rootScope.constant.progressStatusTask = progressStatusTask;
    $rootScope.constant.statusTask = statusTask;
    $rootScope.constant.metricTaskFields = metricTaskFields;
    $rootScope.constant.categoryKPI = categoryKPI;
    $rootScope.constant.actionKPI = actionKPI;
    $rootScope.constant.groupByKPI = groupByKPI;

    // Mettre les informations transversales en mémoire
    $http.get('/api/hierarchies/list/Context').success(function(contexts) {
        $rootScope.contexts = contexts.list;
    });

    $http.get('/api/hierarchies/list/Activity').success(function(activities) {
        $rootScope.activities = activities.list;
    });

    $http.get('/api/hierarchies/list/Axis').success(function(axes) {
        $rootScope.axes = axes.list;
    });


    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function(event, next) {
        $rootScope.isHome = ($location.path() === '/');
        Auth.isLoggedIn(function(loggedIn) {
            if (next.authenticate && !loggedIn) {
                $location.path('/login');
            }
        });
    });
});