'use strict';

describe('Controller: TaskCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse, httpResponseHierarchy, httpResponseMembers;
  var scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope, $httpBackend) {
    // Set up the mock http service responses
    httpBackend = $httpBackend;
    // backend definition common for all tests
    jasmine.getJSONFixtures().fixturesPath = 'base/client/test/mock';
    var taskfull = getJSONFixture('tasks.controller.spec.data.json');
    httpBackend.when('GET', '/api/taskFulls/5a0da5df40576e0004cad609').respond(taskfull);

    httpResponseMembers = [{
      name: 'Member1'
    }];
    httpBackend.when('GET', '/api/users/members').respond(httpResponseMembers);

    httpResponseHierarchy = {
      list: ['hierarchyX']
    };
    httpBackend.when('GET', '/api/hierarchies/list/Context').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/listContext').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/list/Activity').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/listActivity').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/list/Axis').respond(httpResponseHierarchy);
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



  // describe('function markAsDone', function() {
  //
  //   it('should change real data by engagement', function() {
  //     var controller = createController();
  //     httpBackend.flush();
  //     scope.markAsDone(0);
  //     expect(scope.checked).toBeTruthy();
  //   });
  //
  //   it('should take account rework phase', function() {
  //     var controller = createController();
  //     scope.markAsDone(1);
  //     expect(scope.checked).toBeFalsy();
  //   });
  // });

});
