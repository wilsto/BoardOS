'use strict';

angular.module('boardOsApp')
  .directive('dashboardTab', function (ngDialog, $location, $rootScope, calLibrary) {
    return {
		templateUrl: 'app/dashboardTab/dashboardTab.html',
		restrict: 'EA',
		scope: { dashboardType: '@', data: '=dashboardData' },
    link: function (scope, element, attrs) {

     /**
     * Display Table
     */
		  scope.dataTable = scope.data[scope.dashboardType];
      scope.page =  $location.path().split('/')[1];


      scope.giveMeMyColor = function (value, category) {
        return calLibrary.giveMeMyColor(value, category);
      };

     /**
     * Display DirectBar for Task
     */
    if (scope.page === 'KPI' && scope.dashboardType=== 'tasks') {
      _.forEach(scope.dataTable, function(kpi, key2) {
        kpi.data = [{values: [] }];
        _.forEach(scope.data.calcul.taskTime, function(value, key) {
          if (value.task === kpi.name) {
            kpi.data[0].values = calLibrary.displayLastYear(value.time,'month','valueKPI');
          }
        });
      });

      scope.options = {
        chart: {
          type: 'discreteBarChart',
          height: 20,
          width: 260,
          margin : {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          },
          showXAxis : true,
          showYAxis : false,
          color: function(d){ 
            switch (true) {
              case d.value === null : return ['none'];
              case d.value > 66: return ['#2ca02c'] ; 
              default: return ['#CB4B16'] ;
            }
          },
          x: function(d){ return d.month; },
          y: function(d){ return 100; },
          showValues: false,
          transitionDuration: 500
        }
      };

    }

     /**
     * Display DirectBar for KPI
     */
    if (scope.page === 'dashboard' && scope.dashboardType=== 'kpis') {
         _.forEach(scope.dataTable, function(kpi, key) {
            kpi.data = [{values: [] }];
            kpi.data[0].values = calLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI');
        });

        scope.options = {
          chart: {
            type: 'discreteBarChart',
            height: 20,
            width: 400,
            margin : {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            },
            showXAxis : true,
            showYAxis : false,
            color: function(d){ 
              switch (true) {
                case d.value === null : return ['none'] ;  
                case d.value > 66: return ['#2ca02c'] ;  
                default: return ['#CB4B16'] ;
              }
            },
            x: function(d){ return d.month; },
            y: function(d){ return d.value; },
            showValues: false,
            transitionDuration: 500
          }
        };

    }

     /**
     * Modal
     */
      scope.openMetric = function (task, mesure, newItem) {
                        
          ngDialog.open({ 
            template: 'myMesureContent.html',
            className: 'ngdialog-theme-plain',
            closeByDocument: false,
            controller: ['$scope', '$http', '$rootScope', 'ngToast', function($scope, $http, $rootScope, ngToast) {
              
                // controller logic
                $scope.formData = mesure;

                if (typeof $scope.formData === 'undefined') {
                  $scope.formData =  (scope.dataTable.length === 0) ? {} : _.clone(_.last(_.sortBy(scope.dataTable,'date')),true);
                  delete $scope.formData._id ;
                  $scope.formData.date = new Date();
                  $scope.formData.activity = scope.data.activity; 
                  $scope.formData.context = scope.data.context;
                }

                $scope.showWeeks = true;

                $scope.today = function() {
                  $scope.date = new Date();
                };
                            $scope.today();

                $scope.toggleWeeks = function () {
                  $scope.showWeeks = ! $scope.showWeeks;
                };

                $scope.clear = function () {
                  $scope.date = null;
                };

                // Disable weekend selection
                $scope.disabled = function(date, mode) {
                  return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
                };

                $scope.toggleMin = function() {
                  $scope.minDate = ( $scope.minDate ) ? null : new Date();
                };
                $scope.toggleMin();

                $scope.open1 = function($event) {
                  $event.preventDefault();
                  $event.stopPropagation();

                  $scope.opened1 = true;
                };

                $scope.open2 = function($event) {
                  $event.preventDefault();
                  $event.stopPropagation();

                  $scope.opened2 = true;
                };

                $scope.open3 = function($event) {
                  $event.preventDefault();
                  $event.stopPropagation();

                  $scope.opened3 = true;
                };

                $scope.dateOptions = {
                  'year-format': '"yyyy"',
                  'starting-day': 1
                };

                $scope.format = 'dd-MMMM-yyyy';

                $scope.ok = function () {
                  console.log(' $scope.formData', $scope.formData);
                  delete $scope.formData.___v;
                  if ($scope.formData._id) {
                    $http.put('/api/metrics/'+$scope.formData._id, $scope.formData).success(function(data) {

                        var logInfo = 'A Metric for Task "' + scope.data.name + '" was updated';
                        $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
                        ngToast.create(logInfo);

                        $scope.closeThisDialog();
                    });
                  }else{
                    $http.post('/api/metrics', $scope.formData).success(function(data) {

                        var logInfo = 'A Metric for Task "' + scope.data.name + '" was created';
                        $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
                        ngToast.create(logInfo);

                        scope.dataTable.push($scope.formData);
                        $scope.closeThisDialog();
                    });
                  }
                };

                $scope.cancel = function () {
                     $scope.closeThisDialog();
                };

            }]
          });
    };



      }
    };
  });