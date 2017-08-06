'use strict';
/*jshint loopfunc:true */

angular.module('boardOsApp')
  .controller('AnomalieCtrl', function($scope, $filter, $stateParams, $http, $location, $window, $timeout, Notification, $uibModal, $mdpDatePicker) {

    var anomalieId = $stateParams.id || $scope.anomalie._id;

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
      }).success(function(data) {
        

      });
    };

    $scope.loadAnomalie = function() {

      $scope.myPromise = $http.get('/api/anomalies/' + anomalieId).success(function(anomalie) {
        $scope.anomalie = anomalie;

        $scope.impacts = [{
            value: 1,
            text: 'Blocking'
          },
          {
            value: 2,
            text: 'Critic'
          },
          {
            value: 3,
            text: 'Irritant'
          }
        ];

        $scope.showImpacts = function() {
          var selected = $filter('filter')($scope.impacts, {
            value: $scope.anomalie.impact
          });
          return ($scope.anomalie.impact && selected.length) ? selected[0].text : 'Not set';
        };

        $scope.categories = [{
            value: 1,
            text: 'Process'
          },
          {
            value: 2,
            text: 'RACI'
          },
          {
            value: 3,
            text: 'Tools'
          },
          {
            value: 4,
            text: 'Competencies'
          },
          {
            value: 5,
            text: 'Communication'
          }
        ];

        $scope.showCategories = function() {
          var selected = $filter('filter')($scope.categories, {
            value: $scope.anomalie.category
          });
          return ($scope.anomalie.category && selected.length) ? selected[0].text : 'Not set';
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

        //var x2js = new X2JS();
        //var fiveWhy = x2js.json2xml_str($scope.anomalie.fiveWhy);
        var fiveWhy;
        var BpmnViewer = $window.BpmnJS;
        var fiveWhyDiagram = fiveWhy; //|| '<?xml version="1.0" encoding="UTF-8"?>\
        // <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\
        //   <bpmn:process id="Process_1" isExecutable="false">\
        //     <bpmn:startEvent id="StartEvent_1" name="Problem ">\
        //       <bpmn:outgoing>SequenceFlow_08jiehs</bpmn:outgoing>\
        //       <bpmn:signalEventDefinition />\
        //     </bpmn:startEvent>\
        //     <bpmn:task id="Task_0dvwq34" name="1st Why">\
        //       <bpmn:incoming>SequenceFlow_08jiehs</bpmn:incoming>\
        //       <bpmn:outgoing>SequenceFlow_0f01fkd</bpmn:outgoing>\
        //       <bpmn:outgoing>SequenceFlow_1khl45g</bpmn:outgoing>\
        //     </bpmn:task>\
        //     <bpmn:sequenceFlow id="SequenceFlow_08jiehs" sourceRef="StartEvent_1" targetRef="Task_0dvwq34" />\
        //     <bpmn:task id="Task_1y0o2yz" name="2nd Why">\
        //       <bpmn:incoming>SequenceFlow_0f01fkd</bpmn:incoming>\
        //       <bpmn:outgoing>SequenceFlow_1vr12gl</bpmn:outgoing>\
        //       <bpmn:outgoing>SequenceFlow_1eu2tm3</bpmn:outgoing>\
        //     </bpmn:task>\
        //     <bpmn:sequenceFlow id="SequenceFlow_0f01fkd" sourceRef="Task_0dvwq34" targetRef="Task_1y0o2yz" />\
        //     <bpmn:task id="Task_0t6ipn7" name="3rd Why">\
        //       <bpmn:incoming>SequenceFlow_1vr12gl</bpmn:incoming>\
        //       <bpmn:outgoing>SequenceFlow_1bycmt3</bpmn:outgoing>\
        //     </bpmn:task>\
        //     <bpmn:sequenceFlow id="SequenceFlow_1vr12gl" sourceRef="Task_1y0o2yz" targetRef="Task_0t6ipn7" />\
        //     <bpmn:task id="Task_19pkh60" name="4th Why">\
        //       <bpmn:incoming>SequenceFlow_1bycmt3</bpmn:incoming>\
        //     </bpmn:task>\
        //     <bpmn:sequenceFlow id="SequenceFlow_1bycmt3" sourceRef="Task_0t6ipn7" targetRef="Task_19pkh60" />\
        //     <bpmn:task id="Task_10j2di1" name="Other Why">\
        //       <bpmn:incoming>SequenceFlow_1eu2tm3</bpmn:incoming>\
        //       <bpmn:outgoing>SequenceFlow_0g1nya4</bpmn:outgoing>\
        //     </bpmn:task>\
        //     <bpmn:sequenceFlow id="SequenceFlow_1eu2tm3" sourceRef="Task_1y0o2yz" targetRef="Task_10j2di1" />\
        //     <bpmn:task id="Task_10ye4zn" name="Why">\
        //       <bpmn:incoming>SequenceFlow_0g1nya4</bpmn:incoming>\
        //     </bpmn:task>\
        //     <bpmn:sequenceFlow id="SequenceFlow_0g1nya4" sourceRef="Task_10j2di1" targetRef="Task_10ye4zn" />\
        //     <bpmn:task id="Task_1mij68g" name="Why">\
        //       <bpmn:incoming>SequenceFlow_1khl45g</bpmn:incoming>\
        //     </bpmn:task>\
        //     <bpmn:sequenceFlow id="SequenceFlow_1khl45g" sourceRef="Task_0dvwq34" targetRef="Task_1mij68g" />\
        //     <bpmn:textAnnotation id="TextAnnotation_0stvn1g">    <bpmn:text>COntinue</bpmn:text>\
        // </bpmn:textAnnotation>\
        //     <bpmn:association id="Association_0ig4u01" sourceRef="Task_19pkh60" targetRef="TextAnnotation_0stvn1g" />\
        //     <bpmn:textAnnotation id="TextAnnotation_1fzvjie">    <bpmn:text>Continue</bpmn:text>\
        // </bpmn:textAnnotation>\
        //     <bpmn:association id="Association_0ity1gn" sourceRef="Task_10ye4zn" targetRef="TextAnnotation_1fzvjie" />\
        //     <bpmn:textAnnotation id="TextAnnotation_1igj1vc">    <bpmn:text>Continue</bpmn:text>\
        // </bpmn:textAnnotation>\
        //     <bpmn:association id="Association_15lsj0l" sourceRef="Task_1mij68g" targetRef="TextAnnotation_1igj1vc" />\
        //   </bpmn:process>\
        //   <bpmndi:BPMNDiagram id="BPMNDiagram_1">\
        //     <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\
        //       <bpmndi:BPMNShape id="StartEvent_05mgkq9_di" bpmnElement="StartEvent_1">\
        //         <dc:Bounds x="173" y="102" width="36" height="36" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="168" y="146" width="45" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNShape id="Task_0dvwq34_di" bpmnElement="Task_0dvwq34">\
        //         <dc:Bounds x="362" y="80" width="100" height="80" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="SequenceFlow_08jiehs_di" bpmnElement="SequenceFlow_08jiehs">\
        //         <di:waypoint xsi:type="dc:Point" x="209" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="362" y="120" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="285.5" y="99" width="0" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="Task_1y0o2yz_di" bpmnElement="Task_1y0o2yz">\
        //         <dc:Bounds x="575" y="80" width="100" height="80" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="SequenceFlow_0f01fkd_di" bpmnElement="SequenceFlow_0f01fkd">\
        //         <di:waypoint xsi:type="dc:Point" x="462" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="575" y="120" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="518.5" y="99" width="0" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="Task_0t6ipn7_di" bpmnElement="Task_0t6ipn7">\
        //         <dc:Bounds x="801" y="80" width="100" height="80" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="SequenceFlow_1vr12gl_di" bpmnElement="SequenceFlow_1vr12gl">\
        //         <di:waypoint xsi:type="dc:Point" x="675" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="801" y="120" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="738" y="99" width="0" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="Task_19pkh60_di" bpmnElement="Task_19pkh60">\
        //         <dc:Bounds x="1003" y="80" width="100" height="80" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="SequenceFlow_1bycmt3_di" bpmnElement="SequenceFlow_1bycmt3">\
        //         <di:waypoint xsi:type="dc:Point" x="901" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="1003" y="120" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="952" y="99" width="0" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="TextAnnotation_0stvn1g_di" bpmnElement="TextAnnotation_0stvn1g">\
        //         <dc:Bounds x="1179" y="105" width="100" height="30" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="Association_0ig4u01_di" bpmnElement="Association_0ig4u01">\
        //         <di:waypoint xsi:type="dc:Point" x="1103" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="1179" y="120" />\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="Task_10j2di1_di" bpmnElement="Task_10j2di1">\
        //         <dc:Bounds x="801" y="204" width="100" height="80" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="SequenceFlow_1eu2tm3_di" bpmnElement="SequenceFlow_1eu2tm3">\
        //         <di:waypoint xsi:type="dc:Point" x="675" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="738" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="738" y="244" />\
        //         <di:waypoint xsi:type="dc:Point" x="801" y="244" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="753" y="176" width="0" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="Task_10ye4zn_di" bpmnElement="Task_10ye4zn">\
        //         <dc:Bounds x="1003" y="204" width="100" height="80" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="SequenceFlow_0g1nya4_di" bpmnElement="SequenceFlow_0g1nya4">\
        //         <di:waypoint xsi:type="dc:Point" x="901" y="244" />\
        //         <di:waypoint xsi:type="dc:Point" x="1003" y="244" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="952" y="223" width="0" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="TextAnnotation_1fzvjie_di" bpmnElement="TextAnnotation_1fzvjie">\
        //         <dc:Bounds x="1179" y="229" width="100" height="30" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="Association_0ity1gn_di" bpmnElement="Association_0ity1gn">\
        //         <di:waypoint xsi:type="dc:Point" x="1103" y="244" />\
        //         <di:waypoint xsi:type="dc:Point" x="1179" y="244" />\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="Task_1mij68g_di" bpmnElement="Task_1mij68g">\
        //         <dc:Bounds x="575" y="380" width="100" height="80" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="SequenceFlow_1khl45g_di" bpmnElement="SequenceFlow_1khl45g">\
        //         <di:waypoint xsi:type="dc:Point" x="462" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="519" y="120" />\
        //         <di:waypoint xsi:type="dc:Point" x="519" y="420" />\
        //         <di:waypoint xsi:type="dc:Point" x="575" y="420" />\
        //         <bpmndi:BPMNLabel>\
        //           <dc:Bounds x="534" y="264" width="0" height="12" />\
        //         </bpmndi:BPMNLabel>\
        //       </bpmndi:BPMNEdge>\
        //       <bpmndi:BPMNShape id="TextAnnotation_1igj1vc_di" bpmnElement="TextAnnotation_1igj1vc">\
        //         <dc:Bounds x="801" y="405" width="100" height="30" />\
        //       </bpmndi:BPMNShape>\
        //       <bpmndi:BPMNEdge id="Association_15lsj0l_di" bpmnElement="Association_15lsj0l">\
        //         <di:waypoint xsi:type="dc:Point" x="675" y="420" />\
        //         <di:waypoint xsi:type="dc:Point" x="801" y="420" />\
        //       </bpmndi:BPMNEdge>\
        //     </bpmndi:BPMNPlane>\
        //   </bpmndi:BPMNDiagram>\
        // </bpmn:definitions>';

        $('#canvas').empty();
        var viewer = new BpmnViewer({
          container: '#canvas'
        });

        viewer.importXML(fiveWhyDiagram, function(err) {
          if (!err) {

            viewer.get('canvas').zoom('fit-viewport');
          } else {

          }
        });
        $('#canvas_large').empty();
        var viewer_large = new BpmnViewer({
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
      //var x2js = new X2JS();
      var file = document.getElementById('importFile').files[0],
        reader = new FileReader();
      reader.onloadend = function(e) {
        //$scope.anomalie.fiveWhy = x2js.xml_str2json(e.target.result);
        $scope.refreshAnomalie();

      };
      reader.readAsBinaryString(file);
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
