'use strict';

angular.module('boardOsApp')
  .controller('KanBanCtrl', function($scope, $http) {
    var groups = [];
    var items = [];
    var group = {};
    $scope.Load = function() {
      $http.get('/api/taskFulls').success(function(data) {
        $scope.tasks = _.filter(data, function(task) {
          var retour;
          if (task.metrics) {
            retour = (task.metrics[0].status === 'Not Started' || task.metrics[0].status === 'In Progress') ? true : false;
          }
          return retour;
        });
        $scope.tasks = _.sortBy($scope.tasks, function(task) {
          return task.actors[0];
        });
        console.log('$scope.tasks', $scope.tasks);
        var previousGroup;
        _.each($scope.tasks, function(task) {
          if (previousGroup !== task.actors[0]) {
            group[task.actors[0]] = {
              name: task.actors[0],
              state: state2,
              assignedResource: resource1
            };
            groups.push(group[task.actors[0]]);
          }

          var taskState = (task.metrics[0].status === 'Not Started') ? state1 : state2;
          console.log('task', task);
          console.log('group[task.actors[0]]', group[task.actors[0]]);
          items.push({
            name: task.name,
            group: group[task.actors[0]],
            state: taskState,
            assignedResource: resource2
          });
          previousGroup = task.actors[0];
        });
        console.log('items', items);
        console.log('$scope.groups', $scope.groups);

      });
    };
    $scope.Load();

    var KanbanBoard = {};
    KanbanBoard.types = {
      item: 'item',
      group: 'group'
    };
    KanbanBoard.defaultGroup = {};
    KanbanBoard.defaultStates = [{
        name: 'New'
      },
      {
        name: 'Active',
        areNewItemButtonsHidden: true
      },
      {
        name: 'Resolved',
        areNewItemButtonsHidden: true
      },
      {
        name: 'Closed',
        areNewItemButtonsHidden: true
      }
    ];
    var DefaultItemTypes = (function() {
      function DefaultItemTypes() {}
      return DefaultItemTypes;
    }());
    KanbanBoard.DefaultItemTypes = DefaultItemTypes;
    KanbanBoard.defaultItemTypes = {
      task: {
        color: '#ffd800',
        backgroundColor: 'white'
      },
      bug: {
        color: '#ca3838',
        backgroundColor: '#fff8f4'
      },
      story: {
        color: '#0094ff',
        backgroundColor: 'white'
      },
      feature: {
        color: '#67157b',
        backgroundColor: 'white'
      },
      epic: {
        color: '#ff6a00',
        backgroundColor: 'white'
      }
    };
    KanbanBoard.defaultItemType = KanbanBoard.defaultItemTypes.task;
    KanbanBoard.defaultGroupType = KanbanBoard.defaultItemTypes.story;

    function getItemsInGroupAndState(group, state) {
      var itemsInGroupAndState = [];
      for (var i = 0; i < $scope.items.length; i++) {
        var item = $scope.items[i];
        if (item.group === group && item.state === state) {
          itemsInGroupAndState.push(item);
        }
      }
      return itemsInGroupAndState;
    }

    KanbanBoard.getItemsInGroupAndState = getItemsInGroupAndState;

    function getItemsInGroup(group) {
      var itemsInGroup = [];
      for (var i = 0; i < $scope.items.length; i++) {
        var item = $scope.items[i];
        if (item.group === group) {
          itemsInGroup.push(item);
        }
      }
      return itemsInGroup;
    }
    KanbanBoard.getItemsInGroup = getItemsInGroup;

    function getItemsInState(state) {
      var itemsInState = [];
      for (var i = 0; i < $scope.items.length; i++) {
        var item = $scope.items[i];
        if (item.state === state) {
          itemsInState.push(item);
        }
      }
      return itemsInState;
    }
    KanbanBoard.getItemsInState = getItemsInState;


    var state1 = {
        name: 'Not Started'
      },
      state2 = {
        name: 'In progress',
        areNewItemButtonsHidden: true
      },
      state3 = {
        name: 'Monday',
        isCollapsedByDefaultForGroups: true,
        areNewItemButtonsHidden: true
      },
      state4 = {
        name: 'Tuesday',
        isCollapsedByDefaultForGroups: true,
        areNewItemButtonsHidden: true
      },
      state5 = {
        name: 'Wednesday',
        isCollapsedByDefaultForGroups: true,
        areNewItemButtonsHidden: true
      },
      state6 = {
        name: 'Thursday',
        isCollapsedByDefaultForGroups: true,
        areNewItemButtonsHidden: true
      },
      state7 = {
        name: 'Friday',
        isCollapsedByDefaultForGroups: true,
        areNewItemButtonsHidden: true
      };
    var states = [state1, state2, state3, state4, state5, state6, state7];
    var resource1 = {
        name: 'Resource 1',
        imageUrl: 'assets/images/avatars/avatar.png'
      },
      resource2 = {
        name: 'Resource 2',
        imageUrl: 'assets/images/avatars/avatar.png'
      };
    var assignableResources = [resource1, resource2];

    $scope.states = states;
    $scope.groups = groups;
    console.log('$scope.groups', $scope.groups);
    $scope.items = items;
    console.log('items', items);
    $scope.assignableResources = assignableResources;

    var item;
    var i;
    var group;
    // Force early binding to controller.
    if (!$scope.groups) {
      for (i = 0; i < $scope.items.length; i++) {
        item = $scope.items[i];
        item.group = KanbanBoard.defaultGroup;
      }
      $scope.groups = [KanbanBoard.defaultGroup];
      $scope.hideGroups = true;
    }

    if (!$scope.states) {
      for (i = 0; i < $scope.items.length; i++) {
        item = $scope.items[i];
        item.state = KanbanBoard.defaultStates[0];
      }
      $scope.states = KanbanBoard.defaultStates;
    }

    if (!$scope.groupStates) {
      $scope.groupStates = $scope.states;
    }
    for (i = 0; i < $scope.items.length; i++) {
      item = $scope.items[i];
      if (!item.group || $scope.groups.indexOf(item.group) < 0) {
        item.group = $scope.groups[0];
      }
      if (!item.state || $scope.states.indexOf(item.state) < 0) {
        item.state = $scope.states[0];
      }
    }

    for (i = 0; i < $scope.groups.length; i++) {
      group = $scope.groups[i];
      if (!group.state || $scope.groupStates.indexOf(group.state) < 0) {
        group.state = $scope.states[0];
      }
      if (group.isCollapsed === undefined) {
        group.isCollapsed = group.state ? group.state.isCollapsedByDefaultForGroups : false;
      }
    }

    if (!$scope.itemType) {
      $scope.itemType = KanbanBoard.types.item;
    }
    if (!$scope.groupType) {
      $scope.groupType = KanbanBoard.types.group;
    }
    if (!$scope.itemNameField) {
      $scope.itemNameField = 'name';
    }
    if (!$scope.groupNameField) {
      $scope.groupNameField = $scope.itemNameField;
    }
    if (!$scope.itemTypes) {
      $scope.itemTypes = KanbanBoard.defaultItemTypes;
    }
    if (!$scope.defaultItemType) {
      $scope.defaultItemType = KanbanBoard.defaultItemType;
    }
    if (!$scope.defaultGroupType) {
      $scope.defaultGroupType = KanbanBoard.defaultGroupType;
    }
    $scope.getItemsInGroupAndState = getItemsInGroupAndState;
    $scope.getItemsInGroup = getItemsInGroup;
    $scope.getItemsInState = getItemsInState;

    $scope.getMaxStateInGroup = function(group) {
      var maxState = null,
        maxItemCount = 0;
      for (var i = 0; i < $scope.states.length; i++) {
        var state = $scope.states[i];
        var itemCount = $scope.getItemsInGroupAndState(group, state).length;
        if (itemCount > maxItemCount) {
          maxState = state;
          maxItemCount = itemCount;
        }
      }
      return maxState;
    };
    if (!$scope.groupWidth) {
      $scope.groupWidth = '15%';
    }
    if (!$scope.stateWidth) {
      $scope.stateWidth = ((!$scope.hideGroups ? 85 : 100) / $scope.states.length) + '%';
    }
    if (!$scope.itemHeight) {
      $scope.itemHeight = 56;
    }
    if (!$scope.groupHeight) {
      $scope.groupHeight = 86;
    }
    if (!$scope.collapsedGroupHeight) {
      $scope.collapsedGroupHeight = 36;
    }
    if (!$scope.itemTemplateUrl) {
      $scope.itemTemplateUrl = 'Templates/kanban-item.html';
    }
    if (!$scope.groupTemplateUrl) {
      $scope.groupTemplateUrl = 'Templates/kanban-group.html';
    }
    if (!$scope.stateTemplateUrl) {
      $scope.stateTemplateUrl = 'Templates/kanban-state.html';
    }
    var setItemState = function(item, state) {
      var previousState = item.state;
      item.state = state;
      if ($scope.onItemStateChanged) {
        $scope.onItemStateChanged({
          item: item,
          state: state,
          previousState: previousState
        });
      }
    };
    var setItemGroup = function(item, group) {
      var previousGroup = item.group;
      item.group = group;
      if ($scope.onItemGroupChanged) {
        $scope.onItemGroupChanged({
          item: item,
          group: group,
          previousGroup: previousGroup
        });
      }
    };
    $scope.canDropItem = function(type, index, group, state, targetIndex) {
      if (type !== KanbanBoard.types.item || targetIndex === index) {
        return false;
      }
      var item = $scope.items[index];
      if ($scope.canMoveItem) {
        return $scope.canMoveItem({
          item: item,
          index: targetIndex,
          previousIndex: index,
          group: group,
          previouGroup: item.group,
          state: state,
          previousState: item.state
        });
      }
      return true;
    };
    $scope.onItemDrop = function(type, index, group, state, targetIndex) {
      if (type !== KanbanBoard.types.item || targetIndex === index) {
        return;
      }
      var item = $scope.items[index];
      // console.log('index', index);
      // console.log('$scope.items', $scope.items);
      // console.log('item', item);
      if (group !== item.group) {
        setItemGroup(item, group);
      }
      if (state !== item.state) {
        setItemState(item, state);
      }
      if (targetIndex !== undefined) {
        $scope.items.splice(index, 1);
        $scope.items.splice(targetIndex, 0, item);
        if ($scope.onItemIndexChanged) {
          $scope.onItemIndexChanged({
            item: item,
            index: targetIndex,
            previousIndex: index
          });
        }
      }
    };
    $scope.canDropGroup = function(type, index, targetIndex) {
      if (type !== KanbanBoard.types.group || targetIndex === index) {
        return false;
      }
      var group = $scope.groups[index];
      if ($scope.canMoveGroup) {
        return $scope.canMoveGroup({
          group: group,
          index: targetIndex,
          previousIndex: index
        });
      }
      return true;
    };
    $scope.onGroupDrop = function(type, index, targetIndex) {
      if (type !== KanbanBoard.types.group || targetIndex === index) {
        return;
      }
      var group = $scope.groups[index];
      $scope.groups.splice(index, 1);
      $scope.groups.splice(targetIndex, 0, group);
      if ($scope.onGroupIndexChanged) {
        $scope.onGroupIndexChanged({
          group: group,
          index: targetIndex,
          previousIndex: index
        });
      }
    };
    if (!$scope.itemsLabel) {
      $scope.itemsLabel = 'items';
    }
    if (!$scope.noItemsLabel) {
      $scope.noItemsLabel = 'No items';
    }
    if (!$scope.stateLabel) {
      $scope.stateLabel = 'State';
    }
    if (!$scope.editItemButtonText) {
      $scope.editItemButtonText = '…';
    }
    if (!$scope.editGroupButtonText) {
      $scope.editGroupButtonText = $scope.editItemButtonText;
    }
    if (!$scope.newItemButtonText) {
      $scope.newItemButtonText = '+';
    }
    if (!$scope.newItemButtonToolTip) {
      $scope.newItemButtonToolTip = 'New item';
    }
    if (!$scope.editItemButtonToolTip) {
      $scope.editItemButtonToolTip = 'Edit item';
    }
    if (!$scope.editGroupButtonToolTip) {
      $scope.editGroupButtonToolTip = $scope.editItemButtonToolTip;
    }
    if (!$scope.newItemName) {
      $scope.newItemName = 'New item';
    }
    $scope.addNewItem = function(group, state) {
      var item = {
        name: $scope.newItemName,
        group: group,
        state: state,
        assignedResource: $scope.newItemResource
      };
      $scope.items.push(item);
      if ($scope.onAddingNewItem !== null) {
        $scope.onAddingNewItem({
          item: item
        });
      }
    };







  });
