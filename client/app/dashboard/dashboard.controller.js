'use strict';

angular.module('boardOsApp')
.controller('DashboardCtrl', function ($scope,  $rootScope, $http, $stateParams, myLibrary, $cookieStore, $location) {

  $scope.activeTab = 1;

  
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
        $scope.dataConfidence = [{values: [] }];

        $scope.predataKPIs = myLibrary.getByMonth($scope.dashboard.kpis, 'date','value');
        $scope.predataTasks = myLibrary.getByMonth($scope.dashboard.tasks, 'date','value');
        $scope.predataMetrics = myLibrary.getByMonth($scope.dashboard.metrics, 'date','value');
        $scope.predataConfidence = myLibrary.getByMonth($scope.dashboard.metrics, 'date','trust');

        var dataGoals = [];
        var dataGoalsTime = [];
        var dataAlerts= [];
        _.forEach($scope.dashboard.kpis, function(kpi) {
         if (kpi.category ==='Goal')  {
          var SeriesOfGoals = _.pluck(myLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI'),'value');
          dataGoals.push(SeriesOfGoals);
          dataGoalsTime.push({name:kpi.constraint,value:_.last(SeriesOfGoals) });
        }
        if (kpi.category ==='Alert')  {dataAlerts.push(_.pluck(myLibrary.displayLastYear(kpi.calcul.time,'month','valueKPI'),'value'));}
      });
        $scope.dataKPIs[0].values = $scope.predataKPIs;
        $scope.dataTasks[0].values = $scope.predataTasks;
        $scope.dataMetrics[0].values = $scope.predataMetrics;     
        $scope.dataConfidence[0].values = $scope.predataConfidence;
        $scope.dataGoals[0].values = myLibrary.getCalculByMonth(dataGoals);     
        $scope.dataAlerts[0].values = myLibrary.getCalculByMonth(dataAlerts);     

        var scoreOnQCT = _.chain(dataGoalsTime)
        .flatten()
        .groupBy(function(value) { return value.name; })
        .map(function(value, key) {
          var sum = _.reduce(value, function(memo, val) { return memo + val.value; }, 0);
          return {name: key, value: sum / value.length};
        })
        .value();
        
        var scoreQualityOnQCT = _.filter(scoreOnQCT, function(data){ return data.name === 'Quality';})[0] || {value:0};
        var scoreCostOnQCT = _.filter(scoreOnQCT, function(data){ return data.name === 'Cost';})[0] || {value:0};
        var scoreTimeOnQCT = _.filter(scoreOnQCT, function(data){ return data.name === 'Time';})[0] || {value:0};


        $scope.goalsNb = _.last($scope.dataGoals[0].values).count;   
        $scope.alertsNb =_.last($scope.dataAlerts[0].values).sum;  
        $scope.confidence = parseInt(_.last($scope.dataConfidence[0].values).mean); 

        var mydata = {
          'graphset':[
          {
            'type':'radar',
            'background-color':'white',
            'plotarea':{
              'margin':'10px 10px 0px 0px'
            },
            'tooltip':{
              'text':'%t<br>%k Is %v',
              'shadow':0,
              'border-radius':3
            },
            'scale-k':{
              'background-color':'none',
              '-ref-angle':4,
              'values':['Quality','Time','Cost'],
              'item':{
                'font-size':'14px',
                'padding-left':'30px',
                'padding-bottom':'15px',
                '-visible':false
              },
              'guide':{
                'line-color':'#818181',
                'line-style':'solid',
                'line-width':'2px',
                'items':[
                {
                  'background-color':'#fff'
                }
                ]
              },
              'tick':{
                'visible':false
              }
            },
            'scale-v':{
              'values':[0,20,40,60,80,100],
              '-visible':false,
              'ref-line':{
                'line-width':'1px',
                'line-color':'#818181'
              },
              'guide':{
                '-visible':false,
                'line-width':'.5px',
                'line-style':'dashed'
              },
              'tick':{
                '-placement':'cross',
                'size':10,
                'line-width':'.5px',
                'line-length':0.55,
                'line-color':'#818181'
              },
              'item':{
                'padding-left':'9.5px',
                '-padding-bottom':'12.5px',
                'font-size':'8px'
              }
            },
            'series':[
            {
              'values':[scoreQualityOnQCT.value,scoreTimeOnQCT.value,scoreCostOnQCT.value],
              'aspect':'area',
              'text': $scope.dashboard.name,
              'line-color':'#6fbbff',
              'background-color':'#6fbbff',
              'line-width':'3px',
              'alpha':'0.85',
              'marker':{
                'background-color':'#6fbbff',
                'size':'4',
                'border-color':'#6fbbff',
                'alpha':'0.55'
              }
            }
            ]
          }
          ]
        };

        setTimeout( function(){
          zingchart.render({
            id:'myChartQCT',
            data:mydata,
            height:200,
            width:'100%'
          });
        });

      });
} else {
 $scope.dashboard = {name:'',owner:$scope.currentUser._id};
 
}


};

$scope.load();

$scope.changeTab = function (e, tabNb) {
  $('.ver-inline-menu li').removeClass('active');
  $(e.target).closest('li').addClass('active');
  $scope.activeTab = tabNb;
};

$scope.save = function() {

  delete $scope.dashboard.__v;
  delete $scope.dashboard.kpis;
  delete $scope.dashboard.fullKPIs;
  delete $scope.dashboard.metrics;
  delete $scope.dashboard.tasks;

  if (typeof $scope.dashboard._id === 'undefined') {
    $http.post('/api/dashboards', $scope.dashboard).success(function(data){
     var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was created';
     $http.post('/api/logs', {info:logInfo, actor:$scope.currentUser.name});
     $.growl({  icon: 'fa fa-info-circle',  message: logInfo});
     $location.path('/dashboard/'+data._id);
   });
  } else {
    $http.put('/api/dashboards/'+ $scope.dashboard._id , $scope.dashboard).success(function(){
      var logInfo = 'Dashboard "' + $scope.dashboard.name + '" was updated';
      $http.post('/api/logs', {info:logInfo, actor:$scope.currentUser.name});
      $.growl({  icon: 'fa fa-info-circle',  message: logInfo});
    });
  }

};

$scope.delete = function() {
  bootbox.confirm('Are you sure?', function(result) {
    if (result) {
      $http.delete('/api/dashboards/' + $scope.dashboard._id).success(function () {
        $.growl({  icon: 'fa fa-info-circle',  message:'dashboard "' + $scope.dashboard.name + '" was deleted'});
        $location.path('/dashboards');
      });
    }
  }); 
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
$scope.optionsGoals.chart.color =  function(d){  return  myLibrary.giveMeMyColor(d.count); };

  $scope.optionsConfidence = angular.copy($scope.options);
  $scope.optionsConfidence.chart.color =  ['#bcbd22'];
  $scope.optionsConfidence.chart.y = function(d){ return d.mean; };




});
