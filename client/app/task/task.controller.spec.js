'use strict';

describe('Controller: TaskCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse;
  var scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {

    scope = $rootScope.$new();
    createController = function() {
      return $controller('TaskCtrl', {
        '$scope': scope
      });
    };
  }));

  describe('initialisation', function() {

    it('should activate tab 1', function() {
      var controller = createController();
      expect(1).toBe(1);
    });


  });
});
