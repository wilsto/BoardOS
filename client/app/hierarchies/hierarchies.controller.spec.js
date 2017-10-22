'use strict';

describe('Controller: hierarchiesCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse;
  var HierarchyOnStart, hierarchiesCtrl, scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {

    // Get hold of a scope (i.e. the root scope)
    scope = $rootScope.$new();
    createController = function() {
      return $controller('hierarchiesCtrl', {
        '$scope': scope
      });
    };
  }));

  it('should start on first at Context', function() {
    var controller = createController();
    expect(scope.HierarchyType).toEqual('Context');
  });
});
