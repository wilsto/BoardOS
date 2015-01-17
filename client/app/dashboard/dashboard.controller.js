'use strict';

angular.module('boardOsApp')
.controller('DashboardCtrl', function ($scope,  $rootScope, $http, $stateParams, calLibrary, $cookieStore, $location) {
  
  $scope.load = function() {
    if ($stateParams.id) {
    $http.get('/api/dashboards/'+$stateParams.id).success(function(dashboard) {
      $scope.dashboard = dashboard;

      $rootScope.perimeter.name = dashboard.name;
      $rootScope.perimeter.id = dashboard._id;
      $rootScope.perimeter.activity = dashboard.activity;
      $rootScope.perimeter.context = dashboard.context;
      $rootScope.perimeter.axis = dashboard.axis;
      $rootScope.perimeter.category = dashboard.category;
      $cookieStore.put('perimeter',$rootScope.perimeter);

      $scope.dataKPIs = [{values: [] }];
      $scope.dataTasks = [{values: [] }];
      $scope.dataMetrics = [{values: [] }];
      $scope.dataGoals = [{values: [] }];
      $scope.dataAlerts = [{values: [] }];

      $scope.predataKPIs = calLibrary.getByMonth($scope.dashboard.kpis, 'date','value');
      $scope.predataTasks = calLibrary.getByMonth($scope.dashboard.tasks, 'date','value');
      $scope.predataMetrics = calLibrary.getByMonth($scope.dashboard.metrics, 'date','value');

      var dataGoals = [];
      var dataAlerts= [];
      _.forEach($scope.dashboard.kpis, function(kpi) {
           if (kpi.category ==='Goal')  {dataGoals.push(_.pluck(calLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI'),'value'));}
           if (kpi.category ==='Alert')  {dataAlerts.push(_.pluck(calLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI'),'value'));}
          
      });
       

      $scope.dataKPIs[0].values = $scope.predataKPIs;
      $scope.dataTasks[0].values = $scope.predataTasks;
      $scope.dataMetrics[0].values = $scope.predataMetrics;     
      $scope.dataGoals[0].values = calLibrary.getCalculByMonth(dataGoals);     
      $scope.dataAlerts[0].values = calLibrary.getCalculByMonth(dataAlerts);     

       
       
      $scope.goalsNb = _.last($scope.dataGoals[0].values).count;   
      $scope.alertsNb =_.last($scope.dataAlerts[0].values).sum;  
       
       
    });
    } else {
       $scope.dashboard = {name:''};
    }

  };

  $scope.load();

$scope.save = function() {

  delete $scope.dashboard.__v;
  delete $scope.dashboard.kpis;
  delete $scope.dashboard.fullKPIs;
  delete $scope.dashboard.metrics;
  delete $scope.dashboard.tasks;

  if (typeof $scope.dashboard._id === 'undefined') {
    $http.post('/api/dashboards', $scope.dashboard).success(function(data){
         var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was created';
        $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
        $.growl({  icon: "fa fa-paw",  message: logInfo});
        $location.path('/dashboard/'+data._id);
    });
  } else {
    $http.put('/api/dashboards/'+ $scope.dashboard._id , $scope.dashboard).success(function(){
        var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was updated';
        $http.post('/api/logs', {info:logInfo, actor:$rootScope.currentUser.name});
        $.growl({  icon: "fa fa-paw",  message: logInfo});
    });
  }

};


  $scope.options = {
    chart: {
      type: 'discreteBarChart',
      height: 40,
      margin : {
        top: 0,
        right: 0,
        bottom: 2,
        left: 0
      },
      showYAxis : false,
      color: [
      '#1f77b4'
      ],
      x: function(d){ return d.label; },
      y: function(d){ return d.count; },
      showValues: false,
      transitionDuration: 500
    }
  };

  $scope.optionsTasks = angular.copy($scope.options);
  $scope.optionsTasks.chart.color =  ['#9467bd'];

  $scope.optionsMetrics = angular.copy($scope.options);
  $scope.optionsMetrics.chart.color =  ['#87CEEB'];

  $scope.optionsAlerts = angular.copy($scope.options);
  $scope.optionsAlerts.chart.color =  ['#CB4B16'];
  $scope.optionsAlerts.chart.y = function(d){ return d.sum; };

  $scope.optionsGoals = angular.copy($scope.options);
  $scope.optionsGoals.chart.color =  function(d){  return  calLibrary.giveMeMyColor(d.count); };

  $scope.optionsTrust = angular.copy($scope.options);
  $scope.optionsTrust.chart.color =  ['#bcbd22'];

});
