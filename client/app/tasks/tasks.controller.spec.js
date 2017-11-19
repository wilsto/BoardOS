'use strict';

describe('Controller: TasksCtrl', function() {
  var httpBackend, $rootScope, createController, httpResponse, httpResponseHierarchy;
  var HierarchyOnStart, hierarchiesCtrl, scope, taskfulls;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope, $httpBackend) {
    // Set up the mock http service responses
    httpBackend = $httpBackend;
    // backend definition common for all tests
    jasmine.getJSONFixtures().fixturesPath = 'base/client/test/mock';
    taskfulls = getJSONFixture('tasks.controller.spec.data.json');
    httpBackend.when('GET', '/api/taskFulls').respond(taskfulls);

    httpResponseHierarchy = {
      list: ['hierarchyX']
    };
    httpBackend.when('GET', '/api/hierarchies/list/Context').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/listContext').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/list/Activity').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/listActivity').respond(httpResponseHierarchy);
    httpBackend.when('GET', '/api/hierarchies/list/Axis').respond(httpResponseHierarchy);
    // Get hold of a scope (i.e. the root scope)
    scope = $rootScope.$new();
    createController = function() {
      return $controller('TasksCtrl', {
        '$scope': scope
      });
    };
  }));

  afterEach(inject(function($httpBackend, $rootScope) {
    // Force all of the http requests to respond.
    try {
      httpBackend.flush();
    } catch (err) {}
    // Force all of the promises to resolve.
    // VERY IMPORTANT: If we do not resolve promises, none of the dependent
    // expectations will be called, and the spec may pass inadvertantly.
    try {
      $rootScope.$digest();
    } catch (err) {}
    // Check that we don't have anything else hanging.
    try {
      httpBackend.verifyNoOutstandingExpectation();
      httpBackend.verifyNoOutstandingRequest();
      httpBackend.resetExpectations();
    } catch (err) {}
  }));

  describe('TasksCtrl Function filterTasks', function() {

    it('should return all tasks (6) at start', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(7);
    });

    it('should return 1 task when searchActor exist in Actor', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchActor = 'Sylviane';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(1);
    });

    it('should return zero task when searchActor not exist in Actor', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchActor = 'NOTEXIST';
      var filterTasks = scope.filterTasks(scope.tasks);

      expect(filterTasks.length).toBe(0);
    });

    it('should return 1 task when searchName exist in name', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchName = 'Mentoring';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(1);
    });

    it('should return zero task when searchName not exist in name', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchName = 'NOTEXIST';
      var filterTasks = scope.filterTasks(scope.tasks);

      expect(filterTasks.length).toBe(0);
    });

    it('should return 4 tasks when searchName exist in Activity', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchName = 'MANAGEMENT';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(4);
    });

    it('should return zero task when searchName not exist in Activity', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchName = 'NOTEXIST';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(0);
    });

    it('should return 4 tasks when searchContext exist in Context', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchContext = 'CBI.PMO';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(4);
    });

    it('should return zero task when searchContext not exist in Context', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchContext = 'NOTEXIST';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(0);
    });


    it('should return 4 tasks when searchStart exist in Start', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchStart = '2017-11-16';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(4);
    });

    it('should return zero task when searchStart not exist in Start', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchStart = 'NOTEXIST';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(0);
    });

    it('should return 4 tasks when searchEnd exist in End', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchEnd = '2017-11-16';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(4);
    });

    it('should return zero task when searchEnd not exist in End', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchEnd = 'NOTEXIST';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(0);
    });


    it('should return 4 tasks when searchStatus exist in Status', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchStatus = 'FINI';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(1);
    });

    it('should return zero task when searchStatus not exist in Status', function() {
      var controller = createController();
      scope.Load();
      httpBackend.flush();
      scope.searchStatus = 'NOTEXIST';
      var filterTasks = scope.filterTasks(scope.tasks);
      expect(filterTasks.length).toBe(0);
    });
  });

});
