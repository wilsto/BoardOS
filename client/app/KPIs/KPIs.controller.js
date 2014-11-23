/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('KPIsCtrl', function ($scope, $http, socket, ngToast,actionKPI,categoryKPI,groupByKPI,metricTaskFields) {
    $scope.KPIs = [];
    $scope.KPI = {};
    $scope.config = {tab1: true, tab2: false};

    $scope.load = function() {
      $http.get('/api/KPIs').success(function(KPIs) {
        $scope.KPIs = KPIs;
      });
    };

    $scope.save = function() {
      delete $scope.KPI.__v;
      console.log($scope.KPI );

      if (typeof $scope.KPI._id === 'undefined') {
        $http.post('/api/KPIs', $scope.KPI);
        ngToast.create('KPI "' + $scope.KPI.name + '" was created');
      } else {
        $http.put('/api/KPIs/'+ $scope.KPI._id , $scope.KPI);
        ngToast.create('KPI "' + $scope.KPI.name + '" was updated');
      }
      $scope.load();
      $scope.config = {tab1: true, tab2: false};
    };

    $scope.edit = function(KPI) {
      $scope.KPI = {};
      $scope.KPI = KPI;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.reset = function() {
      $scope.KPI = {};
    };

    $scope.delete = function(KPI,index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/KPIs/' + KPI._id).success(function () {
              $scope.KPIs.splice(index, 1);
              ngToast.create('KPI "' + KPI.name + '" was deleted');
          });
        }
      }); 
    }; 

    $scope.load();

    $scope.loadXEditable = function() {
    
        //toggle `popup` / `inline` mode
        $.fn.editable.defaults.mode = 'popup';     
        
        //make username editable
        $('#name').editable({
          success: function(response, newValue) {
              $scope.KPI.name = newValue;
          }
        });

        var countries = [];
        $.each({'BD': 'Bangladesh', 'BE': 'Belgium'}, function(k, v) {
            countries.push({id: k, text: v});
        }); 

        $('#Activity').editable({
            title: 'Select activity',
            source: '/api/hierarchies/list/Activity',
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select activity',
                allowClear: true,
                sortResults: function(results, container, query) {
                        if (query.term) {
                            // use the built in javascript sort function
                            return results.sort(function(a, b) {
                                if (a.text.length > b.text.length) {
                                    return 1;
                                } else if (a.text.length < b.text.length) {
                                    return -1;
                                } else {
                                    return 0;
                                }
                            });
                        }
                        return results;
                    }
            },
            success: function(response, newValue) {
                $scope.KPI.activity = newValue;
                console.log($scope.KPI.activity );

            }
        }); 

        $('#Context').editable({
            title: 'Select context',
            source: '/api/hierarchies/list/Context',
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select context',
                allowClear: true
            },
            success: function(response, newValue) {
                $scope.KPI.context = newValue;
                console.log($scope.KPI.context );

            }
        }); 

        $('#Axe').editable({
            title: 'Select axe',
            source: countries,
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select axe',
                allowClear: true
            }, 
            success: function(response, newValue) {
                $scope.KPI.axe = newValue;
                console.log($scope.KPI.axe );

            }
        }); 

        $('#Category').editable({
            title: 'Select Category',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: categoryKPI,
            success: function(response, newValue) {
                  $scope.KPI.category = newValue;
            }
        }); 

        $('#Tags').editable({
            title: 'Select tags',
            type: 'select2',
            select2: {
                tags: ['html', 'javascript', 'css', 'ajax'],
                tokenSeparators: [',', ' ']
            },
            inputclass: 'input-large',
            success: function(response, newValue) {
                  $scope.KPI.tags = newValue;
            }
        }); 

        $('#Action').editable({
            title: 'Select action',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: actionKPI,
            success: function(response, newValue) {
                  $scope.KPI.action = newValue;
            }
        }); 

        $('#metricTaskField').editable({
            title: 'Select field of task',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: metricTaskFields,
            success: function(response, newValue) {
                  $scope.KPI.metricTaskField = newValue;
            }
        }); 


        $('#refMetricTaskField').editable({
            title: 'Select field of task for reference',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: metricTaskFields,
            success: function(response, newValue) {
                  $scope.KPI.refMetricTaskField = newValue;
            }
        }); 

        //make username editable
        $('#metricTaskValues').editable({
          success: function(response, newValue) {
              $scope.KPI.metricTaskValues = newValue;
          }
        });


        //make username editable
        $('#refMetricTaskValues').editable({
          success: function(response, newValue) {
              $scope.KPI.refMetricTaskValues = newValue;
          }
        });


        $('#groupBy').editable({
            title: 'Select groupBy',
            type: 'checklist',
            placement: 'right',
            limit: 1,
            source: groupByKPI,
            success: function(response, newValue) {
                  $scope.KPI.groupBy = newValue;
            }
        }); 

        $('#refresh').editable({
            title: 'Select refresh interval (days)',
            type: 'number',
            inputclass: 'input-small',
            success: function(response, newValue) {
                  $scope.KPI.refresh = newValue;
            }
        }); 

    };





});
