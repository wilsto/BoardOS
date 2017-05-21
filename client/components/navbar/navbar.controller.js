'use strict';

angular.module('boardOsApp')
  .controller('NavbarCtrl', function($scope, $rootScope, $location, Auth, $http) {
    Auth.getCurrentUser(function(data) {
      $scope.currentUser = data;
      $scope.load();
      $scope.loadDashBoards();
    });


    $scope.availableSearchParams = [{
        key: 'task',
        name: 'Task',
        placeholder: 'Task...'
      },
      {
        key: 'dashboard',
        name: 'Dashboard',
        placeholder: 'Dashboard...'
      }
    ];

    // $scope.availableSearchParams = [{
    //     key: 'name',
    //     name: 'Name',
    //     placeholder: 'Name...'
    //   },
    //   {
    //     key: 'activity',
    //     name: 'Activity',
    //     placeholder: 'Activity...'
    //   },
    //   {
    //     key: 'context',
    //     name: 'Context',
    //     placeholder: 'Context...'
    //   },
    //   {
    //     key: 'description',
    //     name: 'Description',
    //     placeholder: 'Description...'
    //   },
    //   {
    //     key: 'hypothesis',
    //     name: 'Hypothesis',
    //     placeholder: 'Hypothesis...'
    //   },
    //   {
    //     key: 'risks',
    //     name: 'Risks',
    //     placeholder: 'Risks...'
    //   },
    //   {
    //     key: 'comments.text',
    //     name: 'Comment',
    //     placeholder: 'Comment...'
    //   }
    // ];

    $scope.load = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id,
          status: ['Not Started', 'In Progress']
        }
      };

      $http.get('/api/taskFulls/', myparams).success(function(tasks) {
        $scope.navBarTasks = tasks;
      });
    };


    /** SearhBar **/
    $http.get('/api/taskFulls/').success(function(objects) {
      $scope.mySearchTasks = objects;
      
    });

    $scope.loadDashBoards = function() {
      var myparams = {
        params: {
          userId: $scope.currentUser._id,
          quick: true
        }
      };
      $http.get('/api/dashboardCompletes/', myparams).success(function(dashboards) {
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

    $scope.updateMySearch = function(typed) {
      
      $scope.mySearch = [];
      $http.get('/api/taskFulls/').success(function(objects) {
        _.each(objects, function(object) {
          $scope.mySearch.push(object.name);
        });
        $scope.mySearch = _.uniq($scope.mySearch);
        
      });
    };

    $scope.findMySearch = function(finded) {
      
    };

    $scope.$watch('quickSearchTxt', function() {});



    $scope.logout = function() {
      Auth.logout();
      $scope.$emit('UserLogChange');
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.filterTask = function(tasks, filter) {
      var filtertasks;
      // si pas de filtrer alors on retourne le tout
      if (typeof filter === 'undefined') {
        return tasks;
      }
      filtertasks = _.filter(tasks, function(task) {
        // si owner
        if (task.actor._id === $scope.currentUser._id) {
          return true;
        }
        // si actor (metrics)
        if (typeof task.metrics[task.metrics.length - 1] !== 'undefined') {
          if ($scope.currentUser._id === task.metrics[task.metrics.length - 1].actor._id) {
            return true;
          }
        }
        // si watcher
        if (_.intersection([$scope.currentUser._id], _.pluck(task.watchers, '_id')).length > 0) {
          return true;
        }

      });
      return filtertasks;
    };
    /*        jQuery(document).ready(function($) {
        $('#header_notification_bar').on('show.bs.dropdown', function() {

        });

        $('.dropdown').on('show.bs.dropdown', function() {

        });
    });*/
  });
