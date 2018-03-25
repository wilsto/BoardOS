'use strict';

angular.module('boardOsApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'mwl.calendar',
  'ui.bootstrap',
  'btford.socket-io',
  'ngDialog',
  'nvd3',
  'ng.confirmField',
  'ui.calendar',
  'ui-notification',
  'cgBusy',
  'xeditable',
  'ui.sortable',
  'angular.filter',
  'mdPickers',
  'infinite-scroll',
  'ngTagsInput',
  'checklist-model',
  'pageslide-directive',
  'ngEmbed',
  'ngVis',
  'angular-intro',
  'gridster',
  'zingchart-angularjs'

]).config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, NotificationProvider) {
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

  NotificationProvider.setOptions({startTop: 2, positionX: 'center', maxCount: 2});
}).config([
  'calendarConfig',
  function(calendarConfig) {

    // View all available config

    // Change the month view template globally to a custom template
    //calendarConfig.templates.calendarMonthView = 'path/to/custom/template.html';

    // Use either moment or angular to format dates on the calendar. Default angular. Setting this will override any date formats you have already set.
    calendarConfig.dateFormatter = 'moment';

    moment.locale('en_gb', {
      week: {
        dow: 1 // Monday is the first day of the week
      }
    });

    // This will configure times on the day view to display in 24 hour format rather than the default of 12 hour
    //calendarConfig.allDateFormats.moment.date.hour = 'HH:mm';

    // This will configure the day view title to be shorter
    calendarConfig.allDateFormats.moment.title.day = 'ddd D MMM';

    // This will set the week number hover label on the month view
    calendarConfig.i18nStrings.weekNumber = 'Week {week}';

    // This will display all events on a month view even if they're not in the current month. Default false.
    //calendarConfig.displayAllMonthEvents = true;

    // Make the week view more like the day view, ***with the caveat that event end times are ignored***.
    calendarConfig.showTimesOnWeekView = false;

  }
]).factory('authInterceptor', function($rootScope, $q, $cookieStore, $location) {
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
}).value('cgBusyDefaults', {
  message: 'Please wait, Processing calculation...',
  wrapperClass: 'loadingboss'
}).constant('progressStatusTask', [
  {
    value: 'On Time',
    text: 'On Time'
  }, {
    value: 'At Risk',
    text: 'At Risk'
  }, {
    value: 'Late',
    text: 'Late'
  }
]).constant('statusTask', [
  {
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
  }
]).constant('metricTaskFields', [
  {
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
  }
]).constant('categoryKPI', [
  {
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
  }
]).constant('listValuesKPI', [
  {
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
  }
]).constant('actionKPI', [
  {
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
  }
]).constant('groupByKPI', [
  {
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

]).run(function($rootScope, $location, Auth, $http, progressStatusTask, statusTask, metricTaskFields, categoryKPI, actionKPI, groupByKPI, $cookieStore, $timeout, editableOptions) {

  $rootScope.showHideWhatsNew = false;

  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
  editableOptions.blurElem = 'submit';
  editableOptions.blurForm = 'submit';

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
  $http.get('/api/hierarchies/listContext').success(function(contexts) {
    $rootScope.contexts = [];
    _.each(contexts, function(context) {
      $rootScope.contexts.push({longname: context});
    });
  });

  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    $rootScope.showArianeMain = ($location.path() === '/');
    $rootScope.showArianeDashboard = ($location.path().indexOf('dashboard/') > 0);
    $rootScope.showArianeTask = ($location.path().indexOf('task/') > 0);
    $rootScope.showArianeKPI = ($location.path().indexOf('KPI/') > 0);
    $rootScope.showArianeAno = ($location.path().indexOf('anomalies') > 0);
    $rootScope.showArianeObeya = ($location.path().indexOf('obeya/') > 0);
  });

  // Redirect to login if route requires auth and you're not logged in
  $rootScope.$on('$stateChangeSuccess', function(event, next) {

    Auth.isLoggedIn(function(loggedIn) {
      if (next.authenticate && !loggedIn) {
        $location.path('/login');
      }
    });
  });

});
