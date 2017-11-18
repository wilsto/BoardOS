'use strict';

describe('Controller: DashboardCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse;
  var scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope.$new();
    createController = function() {
      return $controller('DashboardCtrl', {
        '$scope': scope
      });
    };
  }));

  describe('New Dashboard', function() {

    it('should be visible', function() {
      var controller = createController();
      expect(scope.blnshowConfig).toBeTruthy();
    });
  });
});
