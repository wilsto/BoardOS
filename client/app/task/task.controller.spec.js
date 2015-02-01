'use strict';

describe('Controller: TaskCtrl', function () {
  var httpBackend, $rootScope, createController, httpResponse;
  var scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    // Set up the mock http service responses
    //httpBackend = $httpBackend;
    // backend definition common for all tests
    //httpResponse = {list: ['taskX']};
    //httpBackend.when('GET', '/api/tasks/1').respond(httpResponse);
    // Get hold of a scope (i.e. the root scope)
    scope = $rootScope.$new();
    createController = function() {
      return $controller('TaskCtrl', {
        '$scope': scope
      });
    };
  }));

  afterEach(inject(function($httpBackend, $rootScope) {
    // Force all of the http requests to respond.
    try {
      //httpBackend.flush();
    }
    catch(err) {
    }
    // Force all of the promises to resolve.
    // VERY IMPORTANT: If we do not resolve promises, none of the dependent
    // expectations will be called, and the spec may pass inadvertantly.
    try {
      //$rootScope.$digest();
    }
    catch(err) {
    }

    // Check that we don't have anything else hanging.
    /*httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
    httpBackend.resetExpectations();*/
  }));

  describe('initialisation', function() {

    it('should activate tab 1', function () {
      var controller = createController();
      expect( scope.activeTab).toBe(1);



    });




  });
});
