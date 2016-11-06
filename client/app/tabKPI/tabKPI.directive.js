'use strict';

angular.module('boardOsApp')
  .directive('tabKPI', function(myLibrary, $location) {
    return {
      templateUrl: 'app/tabKPI/tabKPI.html',
      restrict: 'EA',
      scope: {
        data: '=',
        multitasks: '@'
      },
      link: function(scope, element, attrs) {
        scope.page = $location.path().split('/')[1];

        scope.giveMeMyColor = function(value, category) {
          return myLibrary.giveMeMyColor(value, category);
        };

        scope.$watch('data', function() {
          scope.loadData();
        });

        scope.loadData = function() {
          if (typeof scope.data !== 'undefined') {
            //on fait la somme des calculs de kpi pour chaque tache
            scope.kpis = scope.data.kpis;
            _.each(scope.kpis, function(kpi, index) {
              kpi.calcul.time = myLibrary.displayLastYear(kpi.calcul.taskTime, 'month', 'value');
              //TODO Calcul par trimestre

            });
          }
        };
        scope.loadData();

      }
    };
  });
