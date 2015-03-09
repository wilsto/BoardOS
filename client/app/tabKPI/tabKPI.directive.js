'use strict';

angular.module('boardOsApp')
    .directive('tabKPI', function(myLibrary) {
        return {
            templateUrl: 'app/tabKPI/tabKPI.html',
            restrict: 'EA',
            scope: {
                data: '=',
                multitasks: '@'
            },
            link: function(scope, element, attrs) {

                scope.giveMeMyColor = function(value, category) {
                    return myLibrary.giveMeMyColor(value, category);
                };

                if (typeof scope.data !== 'undefined') {
                    //on fait la somme des calculs de kpi pour chaque tache
                    scope.kpis = scope.data.kpis;
                    _.each(scope.kpis, function(kpi, index) {
                        kpi.calcul.time = myLibrary.displayLastYear(kpi.calcul.taskTime, 'month', 'value');
                    });
                }
            }
        };
    });