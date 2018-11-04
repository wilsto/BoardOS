'use strict';

angular.module('boardOsApp').factory('dateRangeService', function($rootScope, $window) {

  this.startRange = ($window.sessionStorage.getItem('startRange')) ? moment(new Date($window.sessionStorage.getItem('startRange'))) : moment().subtract(1, 'month').startOf('month');
  this.endRange = ($window.sessionStorage.getItem('endRange')) ? moment(new Date($window.sessionStorage.getItem('endRange'))) : moment().subtract(1, 'month').endOf('month');
  $rootScope.startRange = this.startDate;
  $rootScope.endRange = this.endDate;

  function cb(start, end) {
    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
  }
  cb(this.startRange, this.endRange);

  $('#reportrange').daterangepicker({
    startDate: this.startRange,
    endDate: this.endRange,
    ranges: {
      'This Day': [moment().startOf('day'), moment().endOf('day')],
      'This Week': [moment().startOf('week'), moment().endOf('week')],
      'Last Week': [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
      'This Month': [moment().startOf('month'), moment().endOf('month')],
      'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
      'All Time': [moment().subtract(5, 'year').startOf('month'), moment().endOf('month')],
    },
    showCustomRangeLabel: true,
    autoApply: true
  }, cb);

  $('#reportrange').on('apply.daterangepicker', function(ev, picker) {
    this.startRange = picker.startDate;
    this.endRange = picker.endDate;

    $rootScope.startRange = this.startRange;
    $rootScope.endRange = this.endRange;

    $window.sessionStorage.setItem('startRange', this.startRange);
    $window.sessionStorage.setItem('endRange', this.endRange);

    $rootScope.$broadcast('dateRangeService:updated');
  });


  var self= this;
  var getDates = function() {
    return {
      startRange: self.startRange,
      endRange: self.endRange
    }
  };
  // this is simplified for illustration, see edit below
  return {
    getDates: getDates
  }

});
