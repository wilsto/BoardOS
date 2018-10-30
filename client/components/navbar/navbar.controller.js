'use strict';

angular.module('boardOsApp')
  .controller('NavbarCtrl', function($scope, $rootScope, $location, Auth, $http, Notification) {

    // Variable pour afficher ou non ExplainToMe
    $scope.StartExplainToMe = function() {
      var bln = false;
      bln = bln || ($location.path().indexOf('tasks') > 0);
      bln = bln || ($location.path().indexOf('settings') > 0);
      bln = bln || ($location.path().indexOf('anomalie/') > 0);
      bln = bln || ($location.path().indexOf('anomalies') > 0);
      $scope.blnExplainToMe = bln;
      return bln;
    };
    $scope.StartExplainToMe();

    $rootScope.openNav = function() {
      $rootScope.loadNews();
      $http.get('/api/Whatsnews/updateViewer/' + $rootScope.thisUser._id).success(function(infos) {
        $rootScope.alreadyviewed = true;
      });
      if ($('#mySidenav').css('width') === '4px') {
        $('#mySidenav').css('width', '755px');
      } else {
        $('#mySidenav').css('width', '4px');
      }
    };

    $scope.loadTasks = function() {
      var myparams = {
        params: {
          userId: $rootScope.thisUser._id,
          status: ['Not Started', 'In Progress']
        }
      };

      $http.get('/api/taskFulls/', myparams).success(function(tasks) {
        $scope.navBarTasks = tasks;
      });
    };

    $scope.ExplainToMe = function() {
      $scope.CallMeFull();
    };

    $scope.$on('ExplainToMe/intro', function() {
      if ($scope.blnShownewHints) {
        $scope.CallMe();
      }
    });

    $scope.CompletedNewIntro = function() {
      $http.put('/api/users/' + $rootScope.thisUser._id + '/pageHints', {
        page: $scope.pageHints,
        version: $scope.maxVersion
      }).success(function() {
        Notification.success('Hints "' + $scope.pageHints + '" ' + $scope.maxVersion + ' was marked as read');
      });
    };

    $scope.IntroOptionsFull = {
      steps: [],
      showStepNumbers: true,
      showBullets: true,
      exitOnOverlayClick: true,
      exitOnEsc: true,
      nextLabel: '<span style="color:green">Next</span>',
      prevLabel: 'Previous',
      skipLabel: 'Exit',
      doneLabel: 'I got it !'
    };

    $scope.IntroOptions = {
      steps: [],
      showStepNumbers: true,
      showBullets: true,
      exitOnOverlayClick: true,
      exitOnEsc: true,
      nextLabel: '<span style="color:green">Next</span>',
      prevLabel: 'Previous',
      skipLabel: 'Exit',
      doneLabel: 'I got it !'
    };

    $scope.loadHints = function() {
      $scope.pageHints = '/' + $location.path().split('/')[1];
      $http.get('/api/whatsnews/searchPage' + $scope.pageHints).success(function(data) {
        if (data) {
          $scope.maxVersion = _.max(_.map(data.hints, 'version'));
          $scope.blnShownewHints = false;
          var userVersions = _.filter($rootScope.thisUser.pageHints, function(page) {
            return page.page === $scope.pageHints;
          });
          if (userVersions.length > 0) {
            var userVersion = userVersions[0].version;
            if ($scope.maxVersion > userVersion) {
              $scope.blnShownewHints = true;
            }
          } else {
            $scope.blnShownewHints = true;
          }

          // intro if not viewed
          $scope.IntroOptions.steps = [];
          $scope.IntroOptions.steps.push({
            element: '#step0',
            intro: '<strong class="text-primary">New !</strong> in this version ' + $scope.maxVersion + '<br><br>Please <strong>read them all until end</strong> to mark as read these tips ',
            position: 'bottom'
          });
          var newHints = _.filter(data.hints, function(hint) {
            return !userVersion || hint.version > userVersion;
          });
          $scope.IntroOptions.steps = $scope.IntroOptions.steps.concat(newHints);
          $scope.IntroOptions.steps.push({
            element: '#stepFinal',
            intro: 'Click above on <strong>Explain to me</strong> to have full explaination again.<br><br> Click below on <strong>I got it !</strong> to mark as read these tips ',
            position: 'bottom'
          });

          // Full Intro always
          $scope.IntroOptionsFull.steps = [];
          $scope.IntroOptionsFull.steps = $scope.IntroOptionsFull.steps.concat(data.hints);
          $scope.IntroOptionsFull.steps.push({
            element: '#stepFinal',
            intro: 'Click above on <strong>Explain to me</strong> to have full explaination again.',
            position: 'bottom'
          });
        }
      });
    };


    $scope.loadDashBoards = function() {
      var myparams = {
        params: {
          userId: $rootScope.thisUser._id,
          quick: true
        }
      };
      $http.get('/api/dashboardCompletes/', myparams).success(function(dashboards) {
        _.each(dashboards, function(dashboard) {
          dashboard.subscribed = false;
          var userlist = _.map(dashboard.users, '_id');
          var userindex = userlist.indexOf($rootScope.thisUser._id.toString());
          if (userindex >= 0 && dashboard.users[userindex] && dashboard.users[userindex].dashboardName && dashboard.users[userindex].dashboardName.length > 0) {
            dashboard.name = dashboard.users[userindex].dashboardName;
            dashboard.subscribed = true;
          }
        });
        dashboards = _.sortBy(dashboards, ['activity', 'context']);

        $scope.dashboards = dashboards;
        $rootScope.dashboards = dashboards;
      });
    };
    $scope.quickSearchTxt = '';

    $scope.onSelect = function($item, $model, $label) {
      $scope.$item = $item;
      $scope.$model = $model;
      $scope.$label = $label;
    };

    /** SearhBar **/
    $scope.searchTasks = function(typed) {
      return $http.get('/api/taskFulls/search/', {
        params: {
          search: typed,
        }
      }).then(function(response) {
        $scope.mySearchTxt = null;
        return response.data;
      });
    };

    $scope.logout = function() {
      Auth.logout();
      $scope.$emit('UserLogChange');
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    if ($rootScope.thisUser && $rootScope.thisUser._id) {
        $scope.loadTasks();
        $scope.loadDashBoards();
        $scope.loadHints();
    } else {
      Auth.getCurrentUser(function(data) {
        $rootScope.thisUser = data;
        if ($rootScope.thisUser && $rootScope.thisUser._id) {
            $scope.loadTasks();
            $scope.loadDashBoards();
            $scope.loadHints();
          }
      });
    }

  });
