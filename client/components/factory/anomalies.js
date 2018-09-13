'use strict';

angular.module('boardOsApp').factory('Anomalies', function($http, Notification, $rootScope, dateRangeService) {
  // Define the Anomalies function
  var Anomalies = function(obeya) {


    // Define the initialize function
    this.initialize = function() {
      // Fetch the anomalies

      this.allanomalies = [];
      this.anomalies = [];
      this.otheranomalies = [];
      this.myanomalies = [];
      this.orderByField = 'date';
      this.reverseSort = true;
      this.searchName = '';
      this.searchActor = '';
      this.searchActivity = '';
      this.searchContext = '';
      this.searchCategory = '';
      this.searchImpact = '';
      this.searchStatus = '';
      this.searchParams = {};
      this.availableSearchParams = [{
        key: 'group',
        name: 'Group',
        placeholder: 'Group...',
        allowMultiple: true
      }, {
        key: 'name',
        name: 'Name',
        placeholder: 'Name...',
        allowMultiple: true
      }, {
        key: 'activity',
        name: 'Activity',
        placeholder: 'Activity...',
        allowMultiple: true
      }, {
        key: 'context',
        name: 'Context',
        placeholder: 'Context...',
        allowMultiple: true
      }, {
        key: 'category',
        name: 'Category',
        placeholder: 'Category...',
        allowMultiple: true
      }, {
        key: 'impact',
        name: 'Impact',
        placeholder: 'Impact...'
      }, {
        key: 'status',
        name: 'Status',
        placeholder: 'Status...',
        restrictToSuggestedValues: true,
        suggestedValues: ['Not Planned', 'In Progress', 'Closed']
      }];

      var myparams = {
        params: {
          quick: true
        }
      };

      var url = '/api/anomalies/';
      var anomaliesData = $http.get(url, myparams);
      var self = this;

      anomaliesData.then(function(response) {
        self.list = response.data;

        _.each(self.list, function(anomalie) {
          anomalie.subscribed = false;
          var userlist = _.pluck(anomalie.users, '_id');
          var userindex = userlist.indexOf($rootScope.thisUser._id.toString());
          if (userindex >= 0 && anomalie.users[userindex] && anomalie.users[userindex].anomalieName && anomalie.users[userindex].anomalieName.length > 0) {
            anomalie.name = anomalie.users[userindex].anomalieName;
            anomalie.subscribed = true;
          }
        });
        self.list = _.sortBy(self.list, 'date').reverse();
      });
    };

    this.filter = function() {
      var self = this;
      return _.filter(self.list, function(anomalie) {

        var blnName = (self.searchName.length === 0) ? true : (anomalie.name.toLowerCase().indexOf(self.searchName.toLowerCase()) >= 0 || anomalie.activity.toLowerCase().indexOf(self.searchName.toLowerCase()) >= 0);
        var blnActor = (self.searchActor.length === 0) ? true : false;
        if (anomalie.actor && anomalie.actor.groups && anomalie.actor.groups[0].toLowerCase().indexOf(self.searchActor.toLowerCase()) >= 0) {
          blnActor = true;
        }
        var blnContext = (self.searchContext.length === 0) ? true : false;
        if (anomalie.context && anomalie.context.toLowerCase().indexOf(self.searchContext.toLowerCase()) >= 0) {
          blnContext = true;
        }

        var blnCategory = (self.searchCategory.length === 0) ? true : false;
        var anoCats = _.map(anomalie.category, function(x) {
          return x.toLowerCase();
        });
        _.each(anoCats, function(anoCat) {
          if (anoCat.indexOf(self.searchCategory.toLowerCase()) >= 0) {
            blnCategory = true;
          }
        });

        var blnImpact = (self.searchImpact.length === 0) ? true : false;
        if (anomalie.impact.toLowerCase().indexOf(self.searchImpact.toLowerCase()) >= 0) {
          blnImpact = true;
        }

        var blnStatus = (self.searchStatus.length === 0) ? true : false;
        if (anomalie.status.toLowerCase().indexOf(self.searchStatus.toLowerCase()) >= 0) {
          blnStatus = true;
        }

        var blnSearchText = blnName && blnActor && blnContext && blnCategory && blnImpact && blnStatus;
        return blnSearchText;
      });
    };

    this.load = function(filteredAnomalies) {
      return _.reduce(filteredAnomalies, function(s, task) {
        return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
      }, 0).toFixed(1);
    };

    // Call the initialize function for every new instance
    this.initialize();
    
  };

  // Return a reference to the function
  return (Anomalies);
});
