'use strict';

angular.module('boardOsApp')
  .controller('MainCtrl', function ($scope, $http, calLibrary) {

    $scope.Math = window.Math;
    
    $scope.loadDashBoard = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
      $scope.dashboards = dashboards.list;
      $scope.dataDashboards = dashboards;

      $scope.dataKPIs = [{values: [] }];
      $scope.dataTasks = [{values: [] }];
      $scope.dataMetrics = [{values: [] }];
      $scope.dataGoals = [{values: [] }];
      $scope.dataAlerts = [{values: [] }];

      $scope.predataKPIs = calLibrary.getByMonth(dashboards.kpis, 'date','value');
      $scope.predataTasks = calLibrary.getByMonth(dashboards.tasks, 'date','value');
      $scope.predataMetrics = calLibrary.getByMonth(dashboards.metrics, 'date','value');


      var dataGoals = [];
      var dataAlerts= [];
      $scope.goalsNb= 0;
      $scope.alertsNb = 0;
      _.forEach(dashboards.kpis, function(kpi, key) {
           if (kpi.category ==='Goal')  {dataGoals.push(_.pluck(calLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI'),'value'))};
           if (kpi.category ==='Alert')  {dataAlerts.push(_.pluck(calLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI'),'value'))};
        });      

      $scope.dataKPIs[0].values = $scope.predataKPIs;
      $scope.dataTasks[0].values = $scope.predataTasks;
      $scope.dataMetrics[0].values = $scope.predataMetrics;
      $scope.dataGoals[0].values = calLibrary.getCalculByMonth(dataGoals);     
      $scope.dataAlerts[0].values = calLibrary.getCalculByMonth(dataAlerts);  

      $scope.goalsNb = _.last($scope.dataGoals[0].values).count;   
      $scope.alertsNb =_.last($scope.dataAlerts[0].values).sum;  

      //calcul goals and alerts per dashboard
      _.forEach(dashboards.list, function(dashboard, key) {
        dashboard.nbGoals = 0;
        dashboard.nbAlerts = 0;
        var dataGoals = 0;
        var dataAlerts= 0;
        console.log('dashboard.name',dashboard.name);
        _.forEach(dashboards.kpis, function(kpi, key) {

            console.log('kpi.name',kpi.name);
            console.log('dashboard.context',dashboard.context);
            console.log('kpi.context',kpi.context);
            console.log('dashboard.activity',dashboard.activity);
            console.log('kpi.activity',kpi.activity);
            var context = (typeof kpi.context === 'undefined' || kpi.context === '')  ? dashboard.context : kpi.context;
            var activity = (typeof kpi.activity === 'undefined' || kpi.activity === '')  ? dashboard.activity : kpi.activity;
 

            if (context.indexOf(dashboard.context) >=0  && activity.indexOf(dashboard.activity) >=0 ) {
              console.log('last',_.last(kpi.calcul.time).valueKPI);
              if (kpi.category ==='Goal')  {dashboard.nbGoals += 1; dataGoals += _.last(kpi.calcul.time).valueKPI};
              if (kpi.category ==='Alert')  {dashboard.nbAlerts += 1; dataAlerts = _.last(kpi.calcul.time).valueKPI};
            }
        });

        dashboard.dataGoals = (dashboard.nbGoals > 0) ? parseInt(dataGoals / dashboard.nbGoals) : '-';
        dashboard.dataAlerts = dataAlerts;
      });   


      });
    };

    $scope.loadLog = function() {
      $http.get('/api/logs').success(function(logs) {
        $scope.logs = logs;
      });
    };

    $scope.loadDashBoard();
    $scope.loadLog();


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
