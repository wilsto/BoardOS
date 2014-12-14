/*global bootbox:false */
'use strict';

angular.module('boardOsApp')
  .controller('DashboardsCtrl', function ($scope, $http, ngToast,categoryKPI) {
    $scope.dashboards = [];
    $scope.dashboard = {};
    $scope.config = {tab1: true, tab2: false};

    $scope.load = function() {
      $http.get('/api/dashboards').success(function(dashboards) {
        $scope.dashboards = dashboards;
      });
    };

    $scope.save = function() {
      if (typeof $scope.dashboard._id === 'undefined') {
        $http.post('/api/dashboards', $scope.dashboard);
        ngToast.create('Dashboard "' + $scope.dashboard.name + '" was created');
      } else {
        $http.put('/api/dashboards/'+ $scope.dashboard._id, $scope.dashboard);
        ngToast.create('Dashboard "' + $scope.dashboard.name + '" was updated');
      }
      $scope.load();
      $scope.config = {tab1: true, tab2: false};
    };

    $scope.edit = function(dashboard) {
      console.log(dashboard);
      $scope.dashboard = dashboard;
      $scope.config = {tab1: false, tab2: true};
    };

    $scope.delete = function(dashboard,index) {
      bootbox.confirm('Are you sure?', function(result) {
        if (result) {
          $http.delete('/api/dashboards/' + dashboard._id).success(function () {
              $scope.dashboards.splice(index, 1);
              ngToast.create('Dashboard "' + dashboard.name + '" was deleted');
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
              $scope.dashboard.name = newValue;
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
                $scope.dashboard.activity = newValue;
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
                $scope.dashboard.context = newValue;
            }
        }); 

        $('#Axis').editable({
            title: 'Select axe',
            source: countries,
            type: 'select2',
            select2: {
                width: 300,
                placeholder: 'Select axis',
                allowClear: true
            }, 
            success: function(response, newValue) {
                $scope.dashboard.axis = newValue;
            }
        }); 

        $('#Category').editable({
            title: 'Select Category',
            type: 'checklist',
            placement: 'right',
            source: categoryKPI,
            success: function(response, newValue) {
                  $scope.dashboard.category = newValue;
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
                  $scope.dashboard.tags = newValue;
            }
        }); 

    };

});
