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
      $http.put('/api/hierarchies/Context', this.list).success(function(hierarchies) {
        $rootScope.$broadcast('obeya:searchContext', hierarchies);
      });
    };

    this.create = function(hierarchy, index) {
      var valueToShow = (hierarchy) ? hierarchy.longname : '';
      var parentToShow = (hierarchy) ? hierarchy.id : '#';
      var self = this;

      bootbox.prompt({
        title: 'Please Enter Name of this milestone',
        value: valueToShow,
        callback: function(result) {
          if (result) {
            self.add(parentToShow, result);
          }
        }
      });
    };

    this.update = function(thisMilestone) {
      _.each(this.list, function(milestone) {
        if (milestone.id === thisMilestone.id) {
          milestone.longname = thisMilestone.longname;
          milestone.parent = thisMilestone.parent;
          milestone.milestone = thisMilestone.milestone;
        }
      });
      Notification.success('Milestone ' + thisMilestone.longname + ' was updated');
      this.save();
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
      var contexts = _.map($rootScope.obeyaPerimeter, function(perimeter) {
        return perimeter.context;
      });
      return _.filter(this.list, function(milestone) {
        var blnSelected = false;
        _.each(contexts, function(context) {
          if ((milestone.longname && milestone.longname.indexOf(context) > -1) || !context) {
            blnSelected = true;
          }
        });
        return blnSelected;
      });
    };

    // sublist of milestones
    this.selectedAndApplicable = function() {
      return _.filter(this.selected(), function(milestone) {
        var blnSelected = false;
        if (milestone.milestone && milestone.milestone.status !== 'N/A') {
          blnSelected = true;
        }
        return blnSelected;
      });
    };

    this.toForecast = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return !hierarchie.milestone || (hierarchie.milestone && !hierarchie.milestone.dueDate && hierarchie.milestone.status !== 'N/A');
      });
    };

    this.toPlan = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.milestone && hierarchie.milestone.status === 'Forecasted';
      });
    };

    this.toEngage = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.milestone && hierarchie.milestone.status === 'Planned';
      });
    };

    this.toAchieve = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.milestone && hierarchie.milestone.status === 'Engaged';
      });
    };

    this.withAlerts = function() {
      return _.filter(this.selected(), function(hierarchie) {
        return hierarchie.milestone && (new Date(hierarchie.milestone.dueDate) < new Date() && hierarchie.milestone.status !== 'Achieved');
      });
    };

    // Call the initialize function for every new instance
    this.initialize();

  };

  // Return a reference to the function
  return (Milestones);
});
