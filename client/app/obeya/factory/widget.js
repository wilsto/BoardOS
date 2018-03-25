'use strict';

angular.module('boardOsApp').controller('CustomWidgetCtrl', [
  '$scope',
  '$modal',
  function($scope, $modal) {

    $scope.remove = function(widget) {
      $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
    };

    $scope.openSettings = function(widget) {
      $modal.open({
        scope: $scope,
        templateUrl: 'pages/gridster/widgetSettings.html',
        controller: 'WidgetSettingsCtrl',
        resolve: {
          widget: function() {
            return widget;
          }
        }
      });
    };

  }
])

.controller('WidgetSettingsCtrl', [
  '$scope',
  '$timeout',
  '$rootScope',
  '$modalInstance',
  'widget',
  'generator',
  function($scope, $timeout, $rootScope, $modalInstance, widget, generator) {
    $scope.widget = widget;
    $scope.widgetTypes = Object.keys(generator);

    $scope.form = {
      name: widget.name,
      sizeX: widget.sizeX,
      sizeY: widget.sizeY,
      col: widget.col,
      row: widget.row,
      type: widget.type
    };

    $scope.sizeOptions = [
      {
        id: '1',
        name: '1'
      }, {
        id: '2',
        name: '2'
      }, {
        id: '3',
        name: '3'
      }, {
        id: '4',
        name: '4'
      }
    ];

    $scope.dismiss = function() {
      $modalInstance.dismiss();
    };

    $scope.remove = function() {
      $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
      $modalInstance.close();
    };

    $scope.submit = function() {
      angular.extend(widget, $scope.form);

      //update with new options and data
      if (widget.type) {
        widget.chart.options = generator[widget.type].options();
        widget.chart.data = generator[widget.type].data();
      }
      $modalInstance.close(widget);

      //update new chart
      $timeout(function() {
        widget.chart.api.update();
      }, 600);
    };

  }
]).filter('object2Array', function() {
  return function(input) {
    var out = [];
    for (var i in input) {
      out.push(input[i]);
    }
    return out;
  };
});
