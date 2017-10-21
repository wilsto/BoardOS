'use strict';

angular.module('boardOsApp')
  .directive('tabTask', function($location, myLibrary) {
    return {
      templateUrl: 'app/tabTask/tabTask.html',
      restrict: 'EA',
      scope: {
        data: '=',
        kpi: '='
      },
      link: function(scope, element, attrs) {

        scope.filterStatus = 'Not Finished';
        scope.filterProgressStatus = 'All';
        scope.searchText = '';
        scope.orderByField = 'metrics[task.metrics.length - 1].date';
        scope.reverseSort = true;
        scope.page = $location.path().split('/')[1];

        scope.giveMeMyColor = function(value, category) {
          return myLibrary.giveMeMyColor(value, category);
        };

        scope.sortByDate = function(task) {

          return (task.metrics[task.metrics.length - 1]) ? task.metrics[task.metrics.length - 1].endDate : -1;
        };

        scope.filterTasks = function() {
          scope.tasks = _.filter(scope.alltasks, function(task) {
            var blnSearchText = (scope.searchText.length === 0) ? true : task.name.toLowerCase().indexOf(scope.searchText.toLowerCase()) >= 0 || task.activity.toLowerCase().indexOf(scope.searchText.toLowerCase()) >= 0 || task.context.toLowerCase().indexOf(scope.searchText.toLowerCase()) >= 0;
            var blnStatus = (typeof task.metrics[task.metrics.length - 1] === 'undefined') ? true : task.metrics[task.metrics.length - 1].status.toLowerCase().indexOf(scope.filterStatus.replace('All', '').replace('Not Finished', 'o').toLowerCase()) >= 0;
            var blnProgressStatus = (typeof task.metrics[task.metrics.length - 1] === 'undefined' || typeof task.metrics[task.metrics.length - 1].progressStatus === 'undefined') ? true : task.metrics[task.metrics.length - 1].progressStatus.toLowerCase().indexOf(scope.filterProgressStatus.replace('All', '').toLowerCase()) >= 0;
            return blnSearchText && blnProgressStatus && blnStatus;
          });
        };

        if (typeof scope.data !== 'undefined') {
          //on fait la somme des calculs de kpi pour chaque tache
          scope.alltasks = scope.data;
          scope.filterTasks();
          if (scope.page === 'KPI') {

            scope.filterStatus = (typeof scope.kpi !== 'undefined' && ((typeof scope.kpi.whereField !== 'undefined' && scope.kpi.whereField !== '') || scope.kpi.whereField === 'status')) ? scope.kpi.whereValues : 'Not Finished';
          }
        }

        scope.$watch('searchText', function() {
          scope.filterTasks();
        });

        scope.$watch('filterStatus', function() {
          scope.filterTasks();
        });

        scope.$watch('filterProgressStatus', function() {
          scope.filterTasks();
        });

      }
    };
  });
