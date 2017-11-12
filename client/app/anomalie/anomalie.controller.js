'use strict';
/*jshint loopfunc:true */

angular.module('boardOsApp')
  .controller('AnomalieCtrl', function($scope, $filter, $stateParams, $http, $location, $window, $timeout, Notification, $uibModal, $mdpDatePicker) {

    var anomalieId = $stateParams.id || $scope.anomalie._id;
    $scope.checked = false;

    $scope.toggle = function() {
      $scope.checked = !$scope.checked;
    };


    $scope.createActionPlan = function() {
      var path = $location.protocol() + '://' + location.host + '/task////anomaly/' + $scope.anomalie._id;
      $window.open(path, '_blank');
    };

    $scope.refreshAnomalie = function() {
      $scope.myPromise = $http.put('/api/anomalies/' + $scope.anomalie._id, $scope.anomalie).success(function(data) {
        var logInfo = 'Anomalie "' + $scope.anomalie.name + '" was recalculated';
        $timeout(function() {
          $scope.loadAnomalie();
        }, 500);
        Notification.success(logInfo);
      });
    };


    $scope.exportXML = function() {
      $http.get('/api/anomalies/exportFiveWhyXml/' + $scope.anomalie._id, {
        timeout: 60000
      }).success(function(response) {
        var link = document.createElement('a');
        link.download = $scope.anomalie.name + '.bpmn';
        var data = 'text/json;charset=utf-8,' + encodeURIComponent(response);
        link.href = 'data:' + data;
        link.click();

      });
    };

    // *******************
    // update a task
    // *******************
    $scope.updateAnomalie = function() {

      $scope.myPromise = $http.put('/api/anomalies/' + $scope.anomalie._id, $scope.anomalie).success(function(data) {
        var logInfo = 'Anomaly "' + $scope.anomalie.name + '" was updated';
        Notification.success(logInfo);
        $scope.loadAnomalie();
      });

    };


    $scope.loadAnomalie = function() {

      $scope.myPromise = $http.get('/api/anomalies/' + anomalieId).success(function(anomalie) {
        $scope.anomalie = anomalie;

        $scope.impacts = [{
            value: 'Blocking',
            text: 'Blocking'
          },
          {
            value: 'Critic',
            text: 'Critic'
          },
          {
            value: 'Irritating',
            text: 'Irritating'
          }
        ];

        $scope.showImpacts = function() {
          var selected = $filter('filter')($scope.impacts, {
            value: $scope.anomalie.impact
          });
          return ($scope.anomalie.impact && selected.length) ? selected[0].text : 'Not set';
        };

        $scope.categories = [{
            value: 'Process',
            text: 'Process'
          },
          {
            value: 'RACI',
            text: 'RACI'
          },
          {
            value: 'Tools',
            text: 'Tools'
          },
          {
            value: 'Competencies',
            text: 'Competencies'
          },
          {
            value: 'Communication',
            text: 'Communication'
          }
        ];

        $scope.showCategories = function() {
          var checklist = [];
          _.each($scope.categories, function(s) {
            if ($scope.anomalie.category && $scope.anomalie.category.indexOf(s.value) >= 0) {
              checklist.push(s.text);
            }
          });
          return checklist.length ? checklist.join(', ') : 'Not set';
        };


        $scope.removeTask = function(typeTask, index, task) {
          bootbox.confirm('Are you sure to remove this task ? (can\'t be undone)', function(result) {
            if (result) {
              if (typeTask === 'CA') {
                $scope.anomalie.correctiveActions.splice(index, 1);
              }
              if (typeTask === 'RCA') {
                $scope.anomalie.rootCauseAnalysisTasks.splice(index, 1);


              }
              if (typeTask === 'PA') {
                $scope.anomalie.preventiveActions.splice(index, 1);
              }
              $scope.refreshAnomalie();
            }
          });

        };

        var fiveWhyDiagram = $scope.anomalie.fiveWhy;

        $('#canvas').empty();
        var viewer = new $window.BpmnJS({
          container: '#canvas'
        });

        viewer.importXML(fiveWhyDiagram, function(err) {
          if (!err) {

            viewer.get('canvas').zoom('fit-viewport');
          } else {

          }
        });
        $('#canvas_large').empty();
        var viewer_large = new $window.BpmnJS({
          container: '#canvas_large'
        });

        viewer_large.importXML(fiveWhyDiagram, function(err) {
          if (!err) {

            viewer.get('canvas').zoom('fit-viewport');
          } else {

          }
        });
      });
    };
    $scope.loadAnomalie();
    $scope.uploadXmlFile = function() {
      var file = document.getElementById('importFile').files[0],
        reader = new FileReader();
      reader.onloadend = function(e) {
        $scope.anomalie.fiveWhy = e.target.result;
        $scope.refreshAnomalie();

      };
      reader.readAsBinaryString(file);
    };


    $scope.delete = function() {
      $scope.checked = false;
      bootbox.confirm('Are you sure to delete this anomaly ? It can NOT be undone.', function(result) {
        if (result) {
          $scope.myPromise = $http.delete('/api/anomalies/' + $scope.anomalie._id).success(function() {
            var logInfo = 'Anomalie "' + $scope.anomalie.name + '" was deleted';
            Notification.success(logInfo);
            $location.path('/');
          });
        }
      });

    };


    $scope.showDatePicker = function(item, datename, ev) {
      var currentdate = (item[datename]) ? new Date(item[datename]) : new Date();
      $mdpDatePicker(currentdate, {
        targetEvent: ev
      }).then(function(selectedDate) {
        item[datename] = selectedDate.toISOString();

      });
    };

    $scope.showWeeks = true;

    $scope.today = function() {
      $scope.date = new Date();
    };
    $scope.today();

    $scope.toggleWeeks = function() {
      $scope.showWeeks = !$scope.showWeeks;
    };


    // *******************
    // Select or create a task
    // ******************


    $scope.selectOrCreateTask = function(typeTask, blnSelect) {

      $scope.typeTask = typeTask;
      $scope.typeTaskText = typeTask.replace('RCA', 'Root Cause Analysis').replace('CA', 'Corrective Action').replace('PA', 'Preventive Action');

      $scope.blnSelect = (blnSelect === 'Select');

      var modalInstance = $uibModal.open({
        templateUrl: 'selectOrCreateTask.html',
        controller: 'ModalTaskInstanceCtrl',
        scope: $scope, //passed current scope to the modal
        backdrop: 'static',
        keyboard: false
      });
      modalInstance.result.then(function(result) {

        var task = {};
        if (result.blnSelect === 'Select') {
          //----------------------
          // sélection de la tache
          //----------------------
          task = result;
          if (!task.previousAnomalies) {
            task.previousAnomalies = [];
          }
          task.previousAnomalies.push($scope.anomalie._id);

          //update task with previousAnomalies
          $scope.myPromise = $http.put('/api/taskFulls/' + task._id + '/false', task).success(function(data) {
            $timeout(function() {
              var logInfo = $scope.typeTaskText + ' Task "' + task.name + '" was updated';
              Notification.success(logInfo);
            }, 100);
            if (result.typeTask === 'CA') {
              if (!$scope.anomalie.correctiveActions) {
                $scope.anomalie.correctiveActions = [];
              }
              $scope.anomalie.correctiveActions.push(data);
            }
            if (result.typeTask === 'RCA') {
              if (!$scope.anomalie.rootCauseAnalysisTasks) {
                $scope.anomalie.rootCauseAnalysisTasks = [];
              }
              $scope.anomalie.rootCauseAnalysisTasks.push(data);
            }
            if (result.typeTask === 'PA') {
              if (!$scope.anomalie.preventiveActions) {
                $scope.anomalie.preventiveActions = [];
              }
              $scope.anomalie.preventiveActions.push(data);
            }

            $scope.refreshAnomalie();


          });
        } else {
          //----------------------
          // création de la tache
          //----------------------

          task = {
            name: result.name,
            description: $scope.typeTaskText + ' was created from anomaly ',
            activity: result.activity,
            context: result.context,
            metrics: []
          };
          task.metrics.push({
            targetstartDate: result.targetstartDate,
            targetEndDate: result.targetEndDate,
            targetLoad: result.targetLoad,
            trust: result.trust,
            progress: 0,
            timeSpent: 0,
            status: 'Not Started'
          });
          task.previousTasks = [];
          task.anomalies = [];
          task.nextTasks = [];
          task.date = Date.now();
          task.comments = [{
            text: 'create task',
            date: Date.now(),
            user: $scope.currentUser._id,
            auto: true
          }];
          task.todos = [];
          task.actors = [{
            _id: $scope.currentUser._id,
            name: $scope.currentUser.name,
            avatar: $scope.currentUser.avatar
          }];
          task.followers = [];

          task.previousAnomalies = [];
          task.previousAnomalies.push($scope.anomalie._id);


          //create task
          $scope.myPromise = $http.post('/api/taskFulls', task).success(function(data) {

            $timeout(function() {
              var logInfo = $scope.typeTaskText + ' Task "' + task.name + '" was created';
              Notification.success(logInfo);
            }, 100);
            if (result.typeTask === 'CA') {
              if (!$scope.anomalie.correctiveActions) {
                $scope.anomalie.correctiveActions = [];
              }
              $scope.anomalie.correctiveActions.push(data);
            }
            if (result.typeTask === 'RCA') {
              if (!$scope.anomalie.rootCauseAnalysisTasks) {
                $scope.anomalie.rootCauseAnalysisTasks = [];
              }
              $scope.anomalie.rootCauseAnalysisTasks.push(data);
            }
            if (result.typeTask === 'PA') {
              if (!$scope.anomalie.preventiveActions) {
                $scope.anomalie.preventiveActions = [];
              }
              $scope.anomalie.preventiveActions.push(data);
            }

            $scope.refreshAnomalie();

          });


        }


      });
    };
  })
  .controller('ModalTaskInstanceCtrl', function($scope, $mdpDatePicker, $uibModalInstance, $filter, $http) {

    $scope.selected = {
      typeTask: $scope.typeTask,
      blnSelect: 'Create'
    };

    /** SearhBar **/
    $http.get('/api/taskFulls/').success(function(objects) {
      $scope.mySearchTasks = objects;
    });

    $scope.selectTask = function(task) {
      $scope.selected = task;
      $scope.selected.blnSelect = 'Select';
      $scope.selected.typeTask = $scope.typeTask;

    };

    $scope.showDatePicker = function(item, datename, ev) {
      var currentdate = (item[datename]) ? new Date(item[datename]) : new Date();
      $mdpDatePicker(currentdate, {
        targetEvent: ev
      }).then(function(selectedDate) {
        item[datename] = selectedDate.toISOString();
      });
    };

    $scope.ok = function() {
      $uibModalInstance.close($scope.selected);
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };


    $scope.impacts = [{
        value: 'Blocking',
        text: 'Blocking'
      },
      {
        value: 'Critic',
        text: 'Critic'
      },
      {
        value: 'Irritating',
        text: 'Irritating'
      }
    ];

    $scope.showImpacts = function() {
      var selected = $filter('filter')($scope.impacts, {
        value: $scope.selected.impact
      });
      return ($scope.selected.impact && selected.length) ? selected[0].text : 'Not set';
    };

    $scope.categories = [{
        value: 'Process',
        text: 'Process'
      },
      {
        value: 'RACI',
        text: 'RACI'
      },
      {
        value: 'Tools',
        text: 'Tools'
      },
      {
        value: 'Competencies',
        text: 'Competencies'
      },
      {
        value: 'Communication',
        text: 'Communication'
      }
    ];

    $scope.showCategories = function() {
      var selected = $filter('filter')($scope.categories, {
        value: $scope.selected.category
      });
      return ($scope.selected.category && selected.length) ? selected[0].text : 'Not set';
    };

  });
