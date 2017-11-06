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

  describe('initialisation des variables par défaut', function() {
    it('should indicate "checked" as false', function() {
      var controller = createController();
      expect(scope.checked).toBeFalsy();
    });

    it('should indicate "size" as 100px', function() {
      var controller = createController();
      expect(scope.size).toBe('100px');
    });

    it('should indicate "parseFloat" as defined in scope', function() {
      var controller = createController();
      expect(scope.parseFloat).toBeDefined();
    });
    it('should indicate "forceExit" as false', function() {
      var controller = createController();
      expect(scope.forceExit).toBeFalsy();
    });

    it('should indicate "opened" as defined in scope', function() {
      var controller = createController();
      expect(scope.opened).toBeDefined();
    });
  });

  describe('function toggle checked', function() {
    it('should reverse "checked"', function() {
      var controller = createController();
      scope.toggle();
      expect(scope.checked).toBeTruthy();
    });

    it('should reverse "checked" twice back', function() {
      var controller = createController();
      scope.toggle();
      scope.toggle();
      expect(scope.checked).toBeFalsy();
    });
  });

});
