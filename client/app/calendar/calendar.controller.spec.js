'use strict';

describe('Controller: CalendarCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse;
  var HierarchyOnStart, hierarchiesCtrl, scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope, $location, calendarConfig, Notification) {
    scope = $rootScope.$new();
    createController = function() {
      return $controller('CalendarCtrl', {
        '$scope': scope
      });
    };
  }));

  it('should ...', function() {
    var controller = createController();

    expect(1).toEqual(1);
  });
});
