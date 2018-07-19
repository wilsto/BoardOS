'use strict';

angular.module('boardOsApp').factory('dateRangeService', function($rootScope) {

  this.rangeDate = 'last30';
  this.datediff = 30;
  this.startRange = moment().subtract(30, 'days');
  this.endRange = moment();

  function cb(start, end) {
    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
  }
  cb(this.startRange, this.endRange);

  $('#reportrange').daterangepicker({
    startDate: this.startRange,
    endDate: this.endRange,
    ranges: {
      'Last 7 Days': [moment().subtract(7, 'days'), moment()],
      'Last 14 Days': [moment().subtract(14, 'days'), moment()],
      'Last 30 Days': [moment().subtract(30, 'days'), moment()],
      'Last 90 Days': [moment().subtract(90, 'days'), moment()],
      'Last 180 Days': [moment().subtract(180, 'days'), moment()],
      'Last 365 Days': [moment().subtract(365, 'days'), moment()],
      'All': [moment().subtract(5000, 'days'), moment()],
    },
    showCustomRangeLabel: false,
    autoApply: true
  }, cb);

  $('#reportrange').on('apply.daterangepicker', function(ev, picker) {
    this.startRange = picker.startDate;
    this.endRange = picker.endDate;

    switch (picker.chosenLabel) {
      case 'Last 7 Days':
        this.rangeDate = 'last7';
        this.rangeDateTxt = 'Last 7 Days';
        this.datediff = 7;
        break;
      case 'Last 14 Days':
        this.rangeDate = 'last14';
        this.rangeDateTxt = 'Last 14 Days';
        this.datediff = 14;
        break;
      case 'Last 30 Days':
        this.rangeDate = 'last30';
        this.rangeDateTxt = 'Last 30 Days';
        this.datediff = 30;
        break;
      case 'Last 90 Days':
        this.rangeDate = 'last90';
        this.rangeDateTxt = 'Last 90 Days';
        this.datediff = 90;
        break;
      case 'Last 180 Days':
        this.rangeDate = 'last180';
        this.rangeDateTxt = 'Last 180 Days';
        this.datediff = 180;
        break;
      case 'Last 365 Days':
        this.rangeDate = 'last365';
        this.rangeDateTxt = 'Last 365 Days';
        this.datediff = 365;
        break;
      case 'All':
        this.rangeDate = 'All';
        this.rangeDateTxt = 'All';
        this.datediff = 5000;
        break;
    }

    $rootScope.$broadcast('dateRangeService:updated', this.datediff);
  });


  // this is simplified for illustration, see edit below
  return {
    rangeDate: this.rangeDate,
    datediff: this.datediff,
    startRange: this.startRange,
    endRange: this.endRange,
  };

});
