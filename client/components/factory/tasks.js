'use strict';

angular.module('boardOsApp').factory('Tasks', function($http, Notification, $rootScope, dateRangeService) {
  // Define the Tasks function
  var Tasks = function(obeya) {

    // Define the initialize function
    this.initialize = function() {
      // Fetch the tasks
      var url = '/api/dashboardCompletes/showTasks/' + obeya._id;
      var tasksData = $http.get(url);
      var self = this;

      tasksData.then(function(response) {
        self.list = response.data;

        self.alltasksNb = self.list.length;

        self.openTasksNb = _.filter(self.list, function(task) {
          return task.metrics && task.metrics[task.metrics.length - 1].status !== 'Finished';
        }).length;

        _.each(self.list, function(task) {
          task.taskSuffIcon = '';
          if (task.metrics && task.metrics[task.metrics.length - 1].userSatisfaction === undefined || task.metrics[task.metrics.length - 1].deliverableStatus === undefined || task.metrics[task.metrics.length - 1].actorSatisfaction === undefined) {
            task.taskSuffIcon = ' <i class="fa fa-question-circle-o text-danger" aria-hidden="true"></i>&nbsp;&nbsp;';
          }
        });

        self.filterPlan = self.filter('Not Started');
        self.filterPlanLoad = self.load(self.filterPlan);

        self.filterInProgress = self.filter('In Progress');
        self.filterInProgressLoad = self.load(self.filterInProgress);

        self.filterFinished = self.filter('Finished', false, dateRangeService.datediff);
        self.filterFinishedLoad = self.load(self.filterFinished);

        self.filterReviewed = self.filter('Finished', true, dateRangeService.datediff);
        self.filterReviewedLoad = self.load(self.filterReviewed);

        console.log('self',self);
      });
    };

    this.filter = function(status, review, datediff) {
      var a = moment(new Date());
      return _.filter(this.list, function(task) {
        var b = (task.metrics) ? moment(new Date(task.metrics[task.metrics.length - 1].endDate)) : a;
        var blnDate = (datediff) ? (datediff >= a.diff(b, 'days')) : true;
        var blnReview = (review) ? (task.reviewTask === true) : (task.reviewTask === undefined || task.reviewTask === false);
        return blnDate && task.metrics && task.metrics[task.metrics.length - 1].status === status && blnReview;
      });
    };

    this.load = function(filteredTasks) {
      return _.reduce(filteredTasks, function(s, task) {
        return s + parseFloat(task.metrics[task.metrics.length - 1].projectedWorkload || task.metrics[task.metrics.length - 1].targetLoad);
      }, 0).toFixed(1);
    };

    // Call the initialize function for every new instance
    this.initialize();

  };

  // Return a reference to the function
  return (Tasks);
});
