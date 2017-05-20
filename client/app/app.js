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
    'ui.calendar',
    'ui-notification',
    'cgBusy',
    'xeditable',
    'ngEmbed',
    'ui.sortable',
    'angular.filter',
    'mdPickers',
    'ng-mfb',
    'DlhSoft.Kanban.Angular.Components'
  ])
  .config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, NotificationProvider) {
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

    NotificationProvider.setOptions({
      startTop: 2,
      positionX: 'center',
      maxCount: 2
    });
  })

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

  .value('cgBusyDefaults', {
    message: 'Please wait, Processing calculation...'
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

  .run(function($rootScope, $location, Auth, $http, progressStatusTask, statusTask, metricTaskFields, categoryKPI, actionKPI, groupByKPI, $cookieStore, $timeout, editableOptions, dateRangeService) {

    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

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
      $rootScope.showAriane = ($location.path().indexOf('dashboard/') > 0 || $location.path().indexOf('KPI/') > 0);

      Auth.isLoggedIn(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });

    $timeout(function() {

      function cb(start, end) {
        $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
      }

      $('#reportrange').daterangepicker({
        startDate: dateRangeService.startRange,
        endDate: dateRangeService.endRange,
        ranges: {
          'Last 7 Days': [moment().subtract(7, 'days'), moment()],
          'Last 14 Days': [moment().subtract(14, 'days'), moment()],
          'Last 30 Days': [moment().subtract(30, 'days'), moment()],
          'Last 90 Days': [moment().subtract(90, 'days'), moment()],
          'Last 180 Days': [moment().subtract(180, 'days'), moment()],
          'Last 365 Days': [moment().subtract(365, 'days'), moment()],
          'All': [moment().subtract(5000, 'days'), moment()],
        },
        showCustomRangeLabel: false,
        autoApply: true
      }, cb);

      cb(dateRangeService.startRange, dateRangeService.endRange);

      $('#reportrange').on('apply.daterangepicker', function(ev, picker) {

        $rootScope.$broadcast('dateRangeService:updated', picker.chosenLabel);
        dateRangeService.startRange = picker.startDate;
        dateRangeService.endRange = picker.endDate;
      });
    }, 500);

  })

  .factory('dateRangeService', function() {

    var rangeDate = 'last7';
    var startRange = moment().subtract(7, 'days');
    var endRange = moment();

    // this is simplified for illustration, see edit below
    return {
      rangeDate: rangeDate,
      startRange: startRange,
      endRange: endRange,
    };
  });
