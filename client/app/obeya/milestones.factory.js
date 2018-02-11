'use strict';

angular.module('boardOsApp').factory('Milestones', function($http) {
  // Define the Milestones function
  var Milestones = function(obeya) {

    // Define the initialize function
    this.initialize = function() {
      // Fetch the milestones
      var url = '/api/hierarchies/list/Context/obeya/' + obeya._id;
      var milestonesData = $http.get(url);
      var self = this;

      milestonesData.then(function(response) {
        angular.extend(self, response.data);
      });
    };

    this.selected = function() {
      return _.filter(this, function(milestone) {
        return milestone.longname && milestone.longname.indexOf('FONCTIONNEMENT') > -1;
      });
    };

    this.thisWeek = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.duedate > -1;
      });
    };

    this.toEngage = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.status !== 'Engaged' && hierarchie.status !== 'Achieved' && hierarchie.status !== 'N/A';
      });
    };

    this.withAlerts = function() {
      return  _.filter(this.selected(), function(hierarchie) {
        return hierarchie.alerts > 0;
      });
    };

    // Call the initialize function for every new instance
    this.initialize();

  };

  // Return a reference to the function
  return (Milestones);
});
