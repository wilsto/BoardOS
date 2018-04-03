'use strict';

angular.module('boardOsApp').factory('graphGenerator', function($rootScope, $http) {
  return {
    quantitativeOverTime: {
      options: function() {
        return {
          chart: {
            type: 'lineChart',
            width: 300,
            height: 300,
            x: function(d) {
              return d._id;
            },
            y: function(d) {
              return parseInt(d.value.count);
            },
            useInteractiveGuideline: true,
            valueFormat: function(d) {
              return d3.format(',.0f')(d);
            },
            duration: 500,
            xAxis: {
              tickFormat: function(d) {
                return d3.time.format('%m-%y')(new Date(d));
              }
            }
          }
        };
      }
    },
    quantitative: {
      options: function() {
        return {
          chart: {
            type: 'discreteBarChart',
            width: 300,
            height: 300,
            x: function(d) {
              return d.label;
            },
            y: function(d) {
              return parseInt(d.value);
            },
            showValues: true,
            valueFormat: function(d) {
              return d3.format(',.0f')(d);
            },
          }
        };
      }
    },
    qualitativeOverTime: {
      options: function() {
        return {
          chart: {
            type: 'lineChart',
            width: 300,
            height: 300,
            x: function(d) {
              return d._id;
            },
            y: function(d) {
              return parseInt(d.value.count);
            },
            useInteractiveGuideline: true,
            valueFormat: function(d) {
              return d3.format(',.0f')(d);
            },
            duration: 500,
            xAxis: {
              tickFormat: function(d) {
                return d3.time.format('%m-%y')(new Date(d));
              }
            }
          }
        };
      }
    }
  };

});
