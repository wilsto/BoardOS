'use strict';

describe('Controller: MainCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse, httpResponseHierarchy, httpResponseLog;
  var HierarchyOnStart, hierarchiesCtrl, scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {

    scope = $rootScope.$new();
    createController = function() {
      return $controller('MainCtrl', {
        '$scope': scope
      });
    };
  }));

  it('should define Math', function() {
    var controller = createController();
    expect(scope.Math).toBeDefined();
  });

});
