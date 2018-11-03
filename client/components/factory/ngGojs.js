/* jshint latedef: nofunc */
'use strict';

angular.module('boardOsApp').directive('goDiagram', function( $rootScope) {
  return {
    restrict: 'E',
    template: '<div></div>', // just an empty DIV element
    replace: true,
    scope: {
      model: '=goModel'
    },
    link: function($scope, element, attrs) {
      // init for these samples -- you don't need to call this
      var $ = go.GraphObject.make;
      // create a Diagram for the given HTML DIV element
      var diagram = $(go.Diagram, element[0], {
        nodeTemplate: $(go.Node, 'Auto',
          new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
          $(go.Shape, 'RoundedRectangle', new go.Binding('fill', 'color'), {
            portId: '',
            cursor: 'pointer',
            width: 150,
            height: 75,
            margin: 5,
            strokeWidth: 1,
            fromLinkable: true,
            toLinkable: true,
            fromLinkableSelfNode: false,
            toLinkableSelfNode: false,
            fromLinkableDuplicates: false,
            toLinkableDuplicates: false
          }),
          $(go.TextBlock, {
              margin: 5,
              editable: true
            },
            new go.Binding('text', 'name').makeTwoWay())
        ),
        linkTemplate: $(go.Link, {
            relinkableFrom: true,
            relinkableTo: true
          },
          $(go.Shape),
          $(go.Shape, {
            toArrow: 'Standard',
            stroke: null,
            strokeWidth: 0
          })
        ),
        initialContentAlignment: go.Spot.Center,
        'ModelChanged': updateAngular,
        'ChangedSelection': updateSelection,
        'undoManager.isEnabled': true,
        allowDrop: true, // must be true to accept drops from the Palette
        'LinkDrawn': showLinkLabel, // this DiagramEvent listener is defined below
        'LinkRelinked': showLinkLabel,
        scrollsPageOnFocus: false,
      });

      // Define a function for creating a "port" that is normally transparent.
      // The "name" is used as the GraphObject.portId,
      // the "align" is used to determine where to position the port relative to the body of the node,
      // the "spot" is used to control how links connect with the port and whether the port
      // stretches along the side of the node,
      // and the boolean "output" and "input" arguments control whether the user can draw links from or to the port.
      function makePort(name, align, spot, output, input) {
        var horizontal = align.equals(go.Spot.Top) || align.equals(go.Spot.Bottom);
        // the port is basically just a transparent rectangle that stretches along the side of the node,
        // and becomes colored when the mouse passes over it
        return $(go.Shape, {
          fill: 'transparent', // changed to a color in the mouseEnter event handler
          strokeWidth: 0, // no stroke
          width: horizontal ? NaN : 8, // if not stretching horizontally, just 8 wide
          height: !horizontal ? NaN : 8, // if not stretching vertically, just 8 tall
          alignment: align, // align the port on the main Shape
          stretch: (horizontal ? go.GraphObject.Horizontal : go.GraphObject.Vertical),
          portId: name, // declare this object to be a "port"
          fromSpot: spot, // declare where links may connect at this port
          fromLinkable: output, // declare whether the user may draw links from here
          toSpot: spot, // declare where links may connect at this port
          toLinkable: input, // declare whether the user may draw links to here
          cursor: 'pointer', // show a different cursor to indicate potential link point
          mouseEnter: function(e, port) { // the PORT argument will be this Shape
            if (!e.diagram.isReadOnly) {
              port.fill = 'rgba(255,0,255,0.5)';
            }
          },
          mouseLeave: function(e, port) {
            port.fill = 'transparent';
          }
        });
      }

      function nodeStyle() {
        return [
          // The Node.location comes from the "loc" property of the node data,
          // converted by the Point.parse static method.
          // If the Node.location is changed, it updates the "loc" property of the node data,
          // converting back using the Point.stringify static method.
          new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
          {
            // the Node.location is at the center of each node
            locationSpot: go.Spot.Center
          }
        ];
      }

      function textStyle() {
        return {
          font: 'bold 11pt Helvetica, Arial, sans-serif',
          stroke: 'whitesmoke'
        };
      }

      diagram.nodeTemplateMap.add('Process',
        $(go.Node, 'Table', nodeStyle(),
          $(go.Panel, 'Auto',
            $(go.Shape, 'RoundedRectangle', new go.Binding('fill', 'color'), {
              portId: '',
              cursor: 'pointer',
              width: 150,
              height: 75,
              margin: 5,
              strokeWidth: 1,
              fromLinkable: true,
              toLinkable: true,
              fromLinkableSelfNode: false,
              toLinkableSelfNode: false,
              fromLinkableDuplicates: false,
              toLinkableDuplicates: false
            }),
            $(go.TextBlock, {
                margin: 5,
                editable: true
              },
              new go.Binding('text', 'name').makeTwoWay())
          ),
          // three named ports, one on each side except the top, all output only:
          makePort('L', go.Spot.Left, go.Spot.Left, true, false),
          makePort('R', go.Spot.Right, go.Spot.Right, true, false),
          makePort('B', go.Spot.Bottom, go.Spot.Bottom, true, false),
          makePort('T', go.Spot.Top, go.Spot.Top, false, true)
        ));

      diagram.nodeTemplateMap.add('Start',
        $(go.Node, 'Table', nodeStyle(),
          $(go.Panel, 'Auto',
            $(go.Shape, 'Circle', {
              minSize: new go.Size(40, 40),
              fill: '#79C900',
              strokeWidth: 0
            }),
            $(go.TextBlock, 'Start', textStyle(),
              new go.Binding('text'))
          ),
          // three named ports, one on each side except the top, all output only:
          makePort('L', go.Spot.Left, go.Spot.Left, true, false),
          makePort('R', go.Spot.Right, go.Spot.Right, true, false),
          makePort('B', go.Spot.Bottom, go.Spot.Bottom, true, false)
        ));

      diagram.nodeTemplateMap.add('End',
        $(go.Node, 'Table', nodeStyle(),
          $(go.Panel, 'Auto',
            $(go.Shape, 'Circle', {
              minSize: new go.Size(40, 40),
              fill: '#DC3C00',
              strokeWidth: 0
            }),
            $(go.TextBlock, 'End', textStyle(),
              new go.Binding('text'))
          ),
          // three named ports, one on each side except the bottom, all input only:
          makePort('T', go.Spot.Top, go.Spot.Top, false, true),
          makePort('L', go.Spot.Left, go.Spot.Left, false, true),
          makePort('R', go.Spot.Right, go.Spot.Right, false, true)
        ));


      diagram.nodeTemplateMap.add('Conditional',
        $(go.Node, 'Table', nodeStyle(),
          // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
          $(go.Panel, 'Auto',
            $(go.Shape, 'Diamond', {
                fill: '#ffffff',
                stroke:'#000000',
                strokeWidth: 1,
                strokeDashArray: [4, 2]
              },
              new go.Binding('figure', 'figure')),
            $(go.TextBlock, textStyle(), {
                margin: 8,
                stroke:'#000000',
                maxSize: new go.Size(160, NaN),
                wrap: go.TextBlock.WrapFit,
                editable: true
              },
              new go.Binding('text').makeTwoWay())
          ),
          // four named ports, one on each side:
          makePort('T', go.Spot.Top, go.Spot.Top, false, true),
          makePort('L', go.Spot.Left, go.Spot.Left, true, true),
          makePort('R', go.Spot.Right, go.Spot.Right, true, true),
          makePort('B', go.Spot.Bottom, go.Spot.Bottom, true, false)
        ));


      diagram.nodeTemplateMap.add('Comment',
        $(go.Node, 'Auto', nodeStyle(),
          $(go.Shape, 'File', {
            fill: '#EFFAB4',
            strokeWidth: 0
          }),
          $(go.TextBlock, textStyle(), {
              margin: 5,
              maxSize: new go.Size(200, NaN),
              wrap: go.TextBlock.WrapFit,
              textAlign: 'center',
              editable: false,
              font: 'bold 11pt Helvetica, Arial, sans-serif',
              stroke: '#454545'
            },
            new go.Binding('text').makeTwoWay())
          // no ports, because no links are allowed to connect with a comment
        ));

      // replace the default Link template in the linkTemplateMap
      diagram.linkTemplate =
        $(go.Link, // the whole link panel
          {
            routing: go.Link.AvoidsNodes,
            curve: go.Link.JumpOver,
            corner: 5,
            toShortLength: 4,
            relinkableFrom: true,
            relinkableTo: true,
            reshapable: true,
            resegmentable: true,
            // mouse-overs subtly highlight links:
            mouseEnter: function(e, link) {
              link.findObject('HIGHLIGHT').stroke = 'rgba(30,144,255,0.2)';
            },
            mouseLeave: function(e, link) {
              link.findObject('HIGHLIGHT').stroke = 'transparent';
            },
            selectionAdorned: false
          },
          new go.Binding('points').makeTwoWay(),
          $(go.Shape, // the highlight shape, normally transparent
            {
              isPanelMain: true,
              strokeWidth: 8,
              stroke: 'transparent',
              name: 'HIGHLIGHT'
            }),
          $(go.Shape, // the link path shape
            {
              isPanelMain: true,
              stroke: 'gray',
              strokeWidth: 2
            },
            new go.Binding('stroke', 'isSelected', function(sel) {
              return sel ? 'dodgerblue' : 'gray';
            }).ofObject()),
          $(go.Shape, // the arrowhead
            {
              toArrow: 'standard',
              strokeWidth: 0,
              fill: 'gray'
            }),
          $(go.Panel, 'Auto', // the link label, normally not visible
            {
              visible: false,
              name: 'LABEL',
              segmentIndex: 2,
              segmentFraction: 0.5
            },
            new go.Binding('visible', 'visible').makeTwoWay(),
            $(go.Shape, 'RoundedRectangle', // the label shape
              {
                fill: '#F8F8F8',
                strokeWidth: 0
              }),
            $(go.TextBlock, 'Yes', // the label
              {
                textAlign: 'center',
                font: '10pt helvetica, arial, sans-serif',
                stroke: '#333333',
                editable: true
              },
              new go.Binding('text').makeTwoWay())
          )
        );

      // Make link labels visible if coming out of a "conditional" node.
      // This listener is called by the "LinkDrawn" and "LinkRelinked" DiagramEvents.
      function showLinkLabel(e) {
        var label = e.subject.findObject('LABEL');
        if (label !== null) {
          label.visible = (e.subject.fromNode.data.category === 'Conditional');
        }
      }

      // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
      diagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
      diagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

      // initialize the Palette that is on the left side of the page
      var myPalette =
        $(go.Palette, 'myPaletteDiv', // must name or refer to the DIV HTML element
          {
            scrollsPageOnFocus: false,
            nodeTemplateMap: diagram.nodeTemplateMap, // share the templates used by diagram
            model: new go.GraphLinksModel([ // specify the contents of the Palette
              {
                category: 'Start',
                text: 'Start'
              },
              {
                category: 'Process',
                text: 'Process',
                color: 'white',
                stroke: 'black'
              },
              {
                category: 'Conditional',
                text: '???'
              },
              {
                category: 'End',
                text: 'End'
              },
              {
                category: 'Comment',
                text: 'Comment'
              }
            ])
          });


      diagram.grid.visible = true;
      diagram.grid.gridCellSize = new go.Size(30, 20);
      diagram.toolManager.draggingTool.isGridSnapEnabled = true;
      diagram.toolManager.resizingTool.isGridSnapEnabled = true;

      // whenever a GoJS transaction has finished modifying the model, update all Angular bindings
      function updateAngular(e) {
        if (e.isTransactionFinished) {
          $scope.$apply();
        }
      }

      // update the Angular model when the Diagram.selection changes
      function updateSelection(e) {
        diagram.model.selectedNodeData = null;
        var it = diagram.selection.iterator;
        while (it.next()) {
          var selnode = it.value;
          // ignore a selected link or a deleted node
          if (selnode instanceof go.Node && selnode.data !== null) {
            diagram.model.selectedNodeData = selnode.data;
            break;
          }
        }
        $scope.$apply();
      }
      // notice when the value of 'model' changes: update the Diagram.model
      $scope.$watch('model', function(newmodel) {
        if (!newmodel) {
          return;
        }
        var oldmodel = diagram.model;
        if (oldmodel !== newmodel) {
          diagram.removeDiagramListener('ChangedSelection', updateSelection);
          diagram.model = newmodel;
          diagram.addDiagramListener('ChangedSelection', updateSelection);
        }
      });
      $scope.$watch('model.selectedNodeData.name', function(newname) {
        if (!diagram.model.selectedNodeData) {
          return;
        }
        // disable recursive updates
        diagram.removeModelChangedListener(updateAngular);
        // change the name
        diagram.startTransaction('change name');
        // the data property has already been modified, so setDataProperty would have no effect
        var node = diagram.findNodeForData(diagram.model.selectedNodeData);
        if (node !== null) {
          node.updateTargetBindings('name');
        }
        diagram.commitTransaction('change name');
        // re-enable normal updates
        diagram.addModelChangedListener(updateAngular);
      });

      $scope.$on('saveDiagram', function() {
        document.getElementById('mySavedModel').value = diagram.model.toJson();
        $rootScope.processFlowJson = diagram.model.toJson();
      });

      $scope.$on('loadDiagram', function() {
        document.getElementById('mySavedModel').value = diagram.model.toJson();
        //diagram.model = go.Model.fromJson(document.getElementById('mySavedModel').value);
      });

      // print the diagram by opening a new window holding SVG images of the diagram contents for each page
      $scope.$on('printDiagram', function() {
        var svgWindow = window.open();
        if (!svgWindow) {
          return;
        } // failure to open a new Window
        var printSize = new go.Size(700, 960);
        var bnds = diagram.documentBounds;
        var x = bnds.x;
        var y = bnds.y;
        while (y < bnds.bottom) {
          while (x < bnds.right) {
            var svg = diagram.makeSVG({
              scale: 1.0,
              position: new go.Point(x, y),
              size: printSize
            });
            svgWindow.document.body.appendChild(svg);
            x += printSize.width;
          }
          x = bnds.x;
          y += printSize.height;
        }
        setTimeout(function() {
          svgWindow.print();
        }, 1);
      });

    }
  };
});
