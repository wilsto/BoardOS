'use strict';
/*jshint loopfunc:true */

angular.module('boardOsApp')
  .controller('AnomalieCtrl', function($scope, $filter, $stateParams, $http) {
    var BpmnModeler = window.BpmnJS;

    var anomalieId = $stateParams.id || $scope.anomalie._id;

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

    });






    var fiveWhyDiagram = '<?xml version="1.0" encoding="UTF-8"?>\
    <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\
      <bpmn:process id="Process_1" isExecutable="false">\
        <bpmn:startEvent id="StartEvent_1" name="Problem ">\
          <bpmn:outgoing>SequenceFlow_08jiehs</bpmn:outgoing>\
          <bpmn:signalEventDefinition />\
        </bpmn:startEvent>\
        <bpmn:task id="Task_0dvwq34" name="1st Why">\
          <bpmn:incoming>SequenceFlow_08jiehs</bpmn:incoming>\
          <bpmn:outgoing>SequenceFlow_0f01fkd</bpmn:outgoing>\
          <bpmn:outgoing>SequenceFlow_1khl45g</bpmn:outgoing>\
        </bpmn:task>\
        <bpmn:sequenceFlow id="SequenceFlow_08jiehs" sourceRef="StartEvent_1" targetRef="Task_0dvwq34" />\
        <bpmn:task id="Task_1y0o2yz" name="2nd Why">\
          <bpmn:incoming>SequenceFlow_0f01fkd</bpmn:incoming>\
          <bpmn:outgoing>SequenceFlow_1vr12gl</bpmn:outgoing>\
          <bpmn:outgoing>SequenceFlow_1eu2tm3</bpmn:outgoing>\
        </bpmn:task>\
        <bpmn:sequenceFlow id="SequenceFlow_0f01fkd" sourceRef="Task_0dvwq34" targetRef="Task_1y0o2yz" />\
        <bpmn:task id="Task_0t6ipn7" name="3rd Why">\
          <bpmn:incoming>SequenceFlow_1vr12gl</bpmn:incoming>\
          <bpmn:outgoing>SequenceFlow_1bycmt3</bpmn:outgoing>\
        </bpmn:task>\
        <bpmn:sequenceFlow id="SequenceFlow_1vr12gl" sourceRef="Task_1y0o2yz" targetRef="Task_0t6ipn7" />\
        <bpmn:task id="Task_19pkh60" name="4th Why">\
          <bpmn:incoming>SequenceFlow_1bycmt3</bpmn:incoming>\
        </bpmn:task>\
        <bpmn:sequenceFlow id="SequenceFlow_1bycmt3" sourceRef="Task_0t6ipn7" targetRef="Task_19pkh60" />\
        <bpmn:task id="Task_10j2di1" name="Other Why">\
          <bpmn:incoming>SequenceFlow_1eu2tm3</bpmn:incoming>\
          <bpmn:outgoing>SequenceFlow_0g1nya4</bpmn:outgoing>\
        </bpmn:task>\
        <bpmn:sequenceFlow id="SequenceFlow_1eu2tm3" sourceRef="Task_1y0o2yz" targetRef="Task_10j2di1" />\
        <bpmn:task id="Task_10ye4zn" name="Why">\
          <bpmn:incoming>SequenceFlow_0g1nya4</bpmn:incoming>\
        </bpmn:task>\
        <bpmn:sequenceFlow id="SequenceFlow_0g1nya4" sourceRef="Task_10j2di1" targetRef="Task_10ye4zn" />\
        <bpmn:task id="Task_1mij68g" name="Why">\
          <bpmn:incoming>SequenceFlow_1khl45g</bpmn:incoming>\
        </bpmn:task>\
        <bpmn:sequenceFlow id="SequenceFlow_1khl45g" sourceRef="Task_0dvwq34" targetRef="Task_1mij68g" />\
        <bpmn:textAnnotation id="TextAnnotation_0stvn1g">    <bpmn:text>COntinue</bpmn:text>\
    </bpmn:textAnnotation>\
        <bpmn:association id="Association_0ig4u01" sourceRef="Task_19pkh60" targetRef="TextAnnotation_0stvn1g" />\
        <bpmn:textAnnotation id="TextAnnotation_1fzvjie">    <bpmn:text>Continue</bpmn:text>\
    </bpmn:textAnnotation>\
        <bpmn:association id="Association_0ity1gn" sourceRef="Task_10ye4zn" targetRef="TextAnnotation_1fzvjie" />\
        <bpmn:textAnnotation id="TextAnnotation_1igj1vc">    <bpmn:text>Continue</bpmn:text>\
    </bpmn:textAnnotation>\
        <bpmn:association id="Association_15lsj0l" sourceRef="Task_1mij68g" targetRef="TextAnnotation_1igj1vc" />\
      </bpmn:process>\
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">\
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\
          <bpmndi:BPMNShape id="StartEvent_05mgkq9_di" bpmnElement="StartEvent_1">\
            <dc:Bounds x="173" y="102" width="36" height="36" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="168" y="146" width="45" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNShape id="Task_0dvwq34_di" bpmnElement="Task_0dvwq34">\
            <dc:Bounds x="362" y="80" width="100" height="80" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="SequenceFlow_08jiehs_di" bpmnElement="SequenceFlow_08jiehs">\
            <di:waypoint xsi:type="dc:Point" x="209" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="362" y="120" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="285.5" y="99" width="0" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="Task_1y0o2yz_di" bpmnElement="Task_1y0o2yz">\
            <dc:Bounds x="575" y="80" width="100" height="80" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="SequenceFlow_0f01fkd_di" bpmnElement="SequenceFlow_0f01fkd">\
            <di:waypoint xsi:type="dc:Point" x="462" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="575" y="120" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="518.5" y="99" width="0" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="Task_0t6ipn7_di" bpmnElement="Task_0t6ipn7">\
            <dc:Bounds x="801" y="80" width="100" height="80" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="SequenceFlow_1vr12gl_di" bpmnElement="SequenceFlow_1vr12gl">\
            <di:waypoint xsi:type="dc:Point" x="675" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="801" y="120" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="738" y="99" width="0" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="Task_19pkh60_di" bpmnElement="Task_19pkh60">\
            <dc:Bounds x="1003" y="80" width="100" height="80" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="SequenceFlow_1bycmt3_di" bpmnElement="SequenceFlow_1bycmt3">\
            <di:waypoint xsi:type="dc:Point" x="901" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="1003" y="120" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="952" y="99" width="0" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="TextAnnotation_0stvn1g_di" bpmnElement="TextAnnotation_0stvn1g">\
            <dc:Bounds x="1179" y="105" width="100" height="30" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="Association_0ig4u01_di" bpmnElement="Association_0ig4u01">\
            <di:waypoint xsi:type="dc:Point" x="1103" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="1179" y="120" />\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="Task_10j2di1_di" bpmnElement="Task_10j2di1">\
            <dc:Bounds x="801" y="204" width="100" height="80" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="SequenceFlow_1eu2tm3_di" bpmnElement="SequenceFlow_1eu2tm3">\
            <di:waypoint xsi:type="dc:Point" x="675" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="738" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="738" y="244" />\
            <di:waypoint xsi:type="dc:Point" x="801" y="244" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="753" y="176" width="0" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="Task_10ye4zn_di" bpmnElement="Task_10ye4zn">\
            <dc:Bounds x="1003" y="204" width="100" height="80" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="SequenceFlow_0g1nya4_di" bpmnElement="SequenceFlow_0g1nya4">\
            <di:waypoint xsi:type="dc:Point" x="901" y="244" />\
            <di:waypoint xsi:type="dc:Point" x="1003" y="244" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="952" y="223" width="0" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="TextAnnotation_1fzvjie_di" bpmnElement="TextAnnotation_1fzvjie">\
            <dc:Bounds x="1179" y="229" width="100" height="30" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="Association_0ity1gn_di" bpmnElement="Association_0ity1gn">\
            <di:waypoint xsi:type="dc:Point" x="1103" y="244" />\
            <di:waypoint xsi:type="dc:Point" x="1179" y="244" />\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="Task_1mij68g_di" bpmnElement="Task_1mij68g">\
            <dc:Bounds x="575" y="380" width="100" height="80" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="SequenceFlow_1khl45g_di" bpmnElement="SequenceFlow_1khl45g">\
            <di:waypoint xsi:type="dc:Point" x="462" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="519" y="120" />\
            <di:waypoint xsi:type="dc:Point" x="519" y="420" />\
            <di:waypoint xsi:type="dc:Point" x="575" y="420" />\
            <bpmndi:BPMNLabel>\
              <dc:Bounds x="534" y="264" width="0" height="12" />\
            </bpmndi:BPMNLabel>\
          </bpmndi:BPMNEdge>\
          <bpmndi:BPMNShape id="TextAnnotation_1igj1vc_di" bpmnElement="TextAnnotation_1igj1vc">\
            <dc:Bounds x="801" y="405" width="100" height="30" />\
          </bpmndi:BPMNShape>\
          <bpmndi:BPMNEdge id="Association_15lsj0l_di" bpmnElement="Association_15lsj0l">\
            <di:waypoint xsi:type="dc:Point" x="675" y="420" />\
            <di:waypoint xsi:type="dc:Point" x="801" y="420" />\
          </bpmndi:BPMNEdge>\
        </bpmndi:BPMNPlane>\
      </bpmndi:BPMNDiagram>\
    </bpmn:definitions>';


    var viewer = new BpmnModeler({
      container: '#canvas'
    });

    viewer.importXML(fiveWhyDiagram, function(err) {
      if (!err) {
        
        viewer.get('canvas').zoom('fit-viewport');
      } else {
        
      }
    });

    var viewer_large = new BpmnModeler({
      container: '#canvas_large'
    });

    viewer_large.importXML(fiveWhyDiagram, function(err) {
      if (!err) {
        
        viewer.get('canvas').zoom('fit-viewport');
      } else {
        
      }
    });

  });
