/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('KPICtrl', function($scope, $rootScope, Auth, $http, actionKPI, categoryKPI, groupByKPI, metricTaskFields, listValuesKPI, $stateParams, myLibrary, $location, Notification) {

    $scope.activeTab = 1;
    $scope.isAdmin = Auth.isAdmin();
    $scope.isManager = Auth.isManager();

    $scope.actionKPI = actionKPI;
    $scope.categoryKPI = categoryKPI;
    $scope.groupByKPI = groupByKPI;
    $scope.metricTaskFields = metricTaskFields;
    $scope.listValuesKPI = listValuesKPI;

    $scope.type = $stateParams.type;
    $scope.typeid = $stateParams.typeid;

    $scope.load = function() {
      if ($stateParams.id) {

        var query = ($stateParams.type === 'task') ? {
          params: {
            taskFilter: $stateParams.typeid,
          }
        } : {
          params: {
            activity: $rootScope.perimeter.activity,
            context: $rootScope.perimeter.context
          }
        };
        $http.get('/api/KPIs/' + $stateParams.id).success(function(KPI) {
          $scope.KPI = KPI;
          var metricTaskValues = KPI.metricTaskValues || 'All';
          var refMetricTaskValues = KPI.refMetricTaskValues || 'All';
          $scope.calculation = '# ' + KPI.metricTaskField + '[' + metricTaskValues + '] <b class="text-primary">/ </b> # ' + KPI.refMetricTaskField + '[' + refMetricTaskValues + ']';
          $scope.where = (typeof $scope.KPI.whereField !== 'undefined' && KPI.whereField.length > 0) ? ' ' + KPI.whereField + ' ' + KPI.whereOperator + ' ' + KPI.whereValues : '';
        });

        $http.get('/api/KPIs/tasksList/' + $stateParams.id, query).success(function(tasksList) {
          $scope.tasksList = tasksList;

          $scope.metricsNb = 0;
          $scope.sumValue = 0;
          $scope.sumRefValue = 0;
          $scope.sumKPI = 0;
          $scope.nbKPI = 0;
          $scope.lastmetricDate = '';
          _.forEach($scope.tasksList, function(task) {
            $scope.metricsNb += task.metrics.length;
            if (typeof task.lastmetric !== 'undefined') {
              $scope.lastmetricDate = (task.lastmetric.date > $scope.lastmetricDate) ? task.lastmetric.date : $scope.lastmetricDate;
              if (typeof $scope.KPI.whereField === 'undefined' || $scope.KPI.whereField.length === 0 || task.lastmetric[$scope.KPI.whereField] === $scope.KPI.whereValues) {
                // ##TODO plus tard
                // $scope.sumValue += parseFloat(task.lastmetric[$scope.KPI.metricTaskField]);
                // $scope.sumRefValue += parseFloat(task.lastmetric[$scope.KPI.refMetricTaskField]);
                $scope.sumKPI += (!task.KPI && isNaN(parseFloat(task.KPI))) ? 0 : parseFloat(task.KPI);
                $scope.nbKPI += (!task.KPI && isNaN(parseFloat(task.KPI))) ? 0 : 1;



              }
            }
          });
          // ##TODO plus tard
          //$scope.globalKPI = parseInt($scope.sumValue / $scope.sumRefValue * 100);
          //$scope.globalKPI = (isNaN($scope.globalKPI)) ? parseInt($scope.sumKPI / $scope.nbKPI) : $scope.globalKPI;
          $scope.globalKPI = ($scope.KPI.category === 'Goal') ? parseInt($scope.sumKPI / $scope.nbKPI) : parseInt($scope.sumKPI);
        });

      } else {
        $scope.tasksList = [];
        $scope.KPI = {
          name: ''
        };
      }
    };

    $scope.changeTab = function(e, tabNb) {
      $('.ver-inline-menu li').removeClass('active');
      $(e.target).closest('li').addClass('active');
      $scope.activeTab = tabNb;
    };

    $scope.save = function() {

      //clean KPI
      $scope.KPI.activity = ($scope.KPI.originalActivity === '') ? '' : $scope.KPI.activity;
      $scope.KPI.context = ($scope.KPI.originalContext === '') ? '' : $scope.KPI.context;
      delete $scope.KPI.__v;
      delete $scope.KPI.actors;
      delete $scope.KPI.originalActivity;
      delete $scope.KPI.originalContext;
      delete $scope.KPI.dashboards;
      delete $scope.KPI.metrics;
      delete $scope.KPI.tasks;
      delete $scope.KPI.kpis;
      delete $scope.KPI.graphs;
      delete $scope.KPI.metricsGroupBy;
      delete $scope.KPI.categories;
      delete $scope.KPI.metricValues;
      delete $scope.KPI.metricValuesCal;
      delete $scope.KPI.percentObjectif;
      delete $scope.KPI.refMetricValues;
      delete $scope.KPI.refMetricValuesCal;

      $scope.KPI.actor = $scope.currentUser;
      $scope.KPI.date = Date.now();

      if (typeof $scope.KPI._id === 'undefined') {
        $http.post('/api/KPIs', $scope.KPI).success(function(data) {
          var logInfo = 'KPI "' + $scope.KPI.name + '" was created';
          $http.post('/api/logs', {
            info: logInfo,
            actor: $scope.currentUser
          });
          Notification.success(logInfo);
          $location.path('/KPI/' + data._id);
        });

      } else {
        $http.put('/api/KPIs/' + $scope.KPI._id, $scope.KPI).success(function() {
          var logInfo = 'KPI "' + $scope.KPI.name + '" was updated';
          $http.post('/api/logs', {
            info: logInfo,
            actor: $scope.currentUser
          });
          Notification.success(logInfo);
        });

      }
    };

    $scope.edit = function(KPI) {
      $scope.KPI = {};
      $scope.KPI = KPI;
      $scope.config = {
        tab1: false,
        tab2: true
      };
    };

    $scope.reset = function() {
      $scope.KPI = {};
    };

    $scope.delete = function(KPI, index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/KPIs/' + $scope.KPI._id).success(function() {
            Notification.success('KPI "' + $scope.KPI.name + '" was deleted');
            $location.path('/KPIs');
          });
        }
      });
    };
    $scope.giveMeMyColor = function(value, category) {
      return myLibrary.giveMeMyColor(value, category);
    };
    $scope.load();

  });
