'use strict';

angular.module('boardOsApp')
  .controller('ObeyaCtrl', function($scope, $http, Notification, $stateParams, $rootScope, dateRangeService) {

    $scope.obeyaMOde = 'week';
    $scope.blnShowCard = {};
    $scope.blnShowCard.Milestones = false;
    $scope.blnShowCard.Milestone = false;

    if ($stateParams.id) {
      // ouverture de l'obeya
      $scope.myPromise = $http.get('/api/dashboardCompletes/' + $stateParams.id).success(function(obeya) {
        $scope.obeya = obeya;

        // appel des activités en cours
        $rootScope.$broadcast('obeya:searchTasks', $scope.obeya);


      });

    }

    $scope.showCard = function(card) {
      $('#card' + card).toggleClass('fullscreen');
      _.each($scope.blnShowCard, function(card) {
        card = false;
      });
      $scope.blnShowCard[card] = !$scope.blnShowCard[card];
      console.log('$scope.blnShowCard', $scope.blnShowCard);
    };

    $scope.showContext = function(context) {
      console.log('context', context);
      $scope.milestone = context;
    };
    $scope.hideContext = function(context) {
      console.log('context', context);
      $scope.milestone = undefined;
    };

    // recherche des activités en cours
    $scope.$on('obeya:searchTasks', function(event, data) {
      $http.get('/api/dashboardCompletes/showTasks/' + $stateParams.id).success(function(tasks) {
        $scope.obeya.tasks = tasks;
        $scope.obeya.alltasksNb = $scope.obeya.tasks.length;
        $scope.obeya.openTasksNb = _.filter($scope.obeya.tasks, function(task) {
          return task.metrics[task.metrics.length - 1].status !== 'Finished';
        }).length;

        // Appel des engagement en cours
        $rootScope.$broadcast('obeya:searchContext', $scope.obeya);

        console.log('obeya', $scope.obeya);
      });

    });

    // recherche des engagement en cours
    $scope.$on('obeya:searchContext', function(event, data) {
      $http.get('/api/hierarchies/list/Context/obeya/' + $scope.obeya._id).success(function(hierarchies) {
        console.log('hierarchies', hierarchies);
        $scope.hierarchies = hierarchies;

      });
    });




    // Plan
    // ######

    $scope.createNode = function(data) {
      bootbox.prompt({
        title: 'Please Enter Name of this hierarchy',
        callback: function(result) {
          if (result) {
            $scope.hierarchies.push({
              id: 'ajson' + (Math.round(Math.random() * 100000)).toString(),
              parent: '#',
              text: result,
              longname: result
            });
            $scope.hierarchies = _.sortBy($scope.hierarchies, 'longname');
            $scope.$apply();
          }
        }
      });
    };

    $scope.newSubItem = function(hierarchy, index) {
      bootbox.prompt({
        title: 'Please Enter Name of this hierarchy',
        value: hierarchy.longname,
        callback: function(result) {
          if (result) {
            $scope.hierarchies.push({
              id: 'ajson' + (Math.round(Math.random() * 100000)).toString(),
              parent: hierarchy.id,
              text: result,
              longname: result
            });
            $scope.hierarchies = _.sortBy($scope.hierarchies, 'longname');
            Notification.success('Milestones ' + result + 'was created');
            $scope.saveMilestones();
          }
        }
      });
    };

    $scope.delete = function(hierarchy, index) {
      bootbox.confirm('Are you sure to remove "' + hierarchy.longname + '" ?', function(result) {
        if (result) {
          $scope.hierarchies.splice(index, 1);
          $scope.saveMilestones();
          Notification.success('Hierarchy "' + hierarchy.longname + '" was deleted');
        }
      });
    };

    $scope.saveMilestones = function() {
      $http.put('/api/hierarchies/Context', $scope.hierarchies).success(function(hierarchies) {
        $rootScope.$broadcast('obeya:searchContext', $scope.obeya);
      });
    };

  });