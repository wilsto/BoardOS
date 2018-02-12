'use strict';

angular.module('boardOsApp').factory('Milestones', function($http, Notification, $rootScope) {
  // Define the Milestones function
  var Milestones = function(obeya) {

    // Define the initialize function
    this.initialize = function() {
      // Fetch the milestones
      var url = '/api/hierarchies/list/Context/obeya/' + obeya._id;
      var milestonesData = $http.get(url);
      var self = this;

      milestonesData.then(function(response) {
        self.list = response.data;
      });
    };

    // Modification of milestones
    this.save = function() {
      $http.put('/api/hierarchies/Context', this.list ).success(function(hierarchies) {
        $rootScope.$broadcast('obeya:searchContext', hierarchies);
      });
    };

    this.create = function(hierarchy, index) {
      var valueToShow = (hierarchy) ? hierarchy.longname : '';
      var parentToShow = (hierarchy) ? hierarchy.id : '#';
      bootbox.prompt({
        title: 'Please Enter Name of this milestone',
        value: valueToShow,
        callback: function(result) {
          if (result) {
            this.add(parentToShow, result);
          }
        }
      });
    };

    this.add = function(id, value) {
      this.list.push({
        id: 'ajson' + (Math.round(Math.random() * 100000)).toString(),
        parent: id,
        text: value,
        longname: value
      });
      this.list = _.sortBy(this.list, 'longname');
      Notification.success('Milestones ' + value + 'was created');
      this.save();
    };

    this.delete = function(milestone, index) {
      bootbox.confirm('Are you sure to remove "' + milestone.longname + '" ?', function(result) {
        if (result) {
          this.list.splice(index, 1);
          Notification.success('Hierarchy "' + milestone.longname + '" was deleted');
          this.save();
        }
      });
    };

    this.updateStatus = function(milestone, status) {
      _.each(this.list, function(milestone) {
        if (milestone.id === milestone.id) {
          if (milestone.status === status) {
            delete milestone.status;
          } else {
            milestone.status = status;
          }
        }
      });
      Notification.success('Milestones ' + milestone.longname + ' was updated');
      this.save();
    };

    // sublist of milestones
    this.selected = function() {
      return _.filter(this.list, function(milestone) {
        return milestone.longname && milestone.longname.indexOf('FONCTIONNEMENT') > -1;
      });
    };

    this.thisWeek = function() {
      return _.filter(this.selected(), function(milestone) {
        return milestone.duedate > -1;
      });
    };

    this.thisMonth = function() {
      return _.filter(this.selected(), function(milestone) {
        return milestone.duedate > -30;
      });
    };

    this.toEngage = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.status !== 'Engaged' && hierarchie.status !== 'Achieved' && hierarchie.status !== 'N/A';
      });
    };

    this.withAlerts = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.alerts > 0;
      });
    };

    // Call the initialize function for every new instance
    this.initialize();

  };

  // Return a reference to the function
  return (Milestones);
});
