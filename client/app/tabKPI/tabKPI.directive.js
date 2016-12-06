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
            scope.kpis = _.union(scope.data.kpis, scope.data.alerts);
            
            _.each(scope.kpis, function(kpi, index) {
              if (kpi.category === 'Alert') {
                kpi._id = (kpi._id === undefined) ? kpi.alertId : kpi._id;
              } else {
                kpi._id = (kpi._id === undefined) ? kpi.kpiId : kpi._id;
              }
              if (kpi.calcul.taskTime) {
                kpi.calcul.time = myLibrary.displayLastYear(kpi.calcul.taskTime, 'month', 'value');
              }
              //TODO Calcul par trimestre

            });
          }
        };
        scope.loadData();

      }
    };
  });
