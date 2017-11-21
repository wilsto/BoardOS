'use strict';

describe('Controller: ObeyaCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse;
  var HierarchyOnStart, hierarchiesCtrl, scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope, $location, calendarConfig, Notification) {
    scope = $rootScope.$new();
    createController = function() {
      return $controller('ObeyaCtrl', {
        '$scope': scope
      });
    };
  }));

  it('should ...', function() {
    var controller = createController();

    expect(1).toEqual(1);
  });
});
