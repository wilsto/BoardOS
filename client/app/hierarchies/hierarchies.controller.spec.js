'use strict';

describe('Controller: hierarchiesCtrl', function () {
  var httpBackend, $rootScope, createController, httpResponse;
  var HierarchyOnStart, hierarchiesCtrl, scope;

  // load the controller's module
  beforeEach(module('boardOsApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    // Set up the mock http service responses
    httpBackend = $httpBackend;
    // backend definition common for all tests
    httpResponse = {list: ['hierarchyX']};
    httpBackend.when('GET', '/api/hierarchies/list/Context').respond(httpResponse);
    httpBackend.when('GET', '/api/hierarchies/list/Activity').respond(httpResponse);
    httpBackend.when('GET', '/api/hierarchies/list/Axis').respond(httpResponse);
    // Get hold of a scope (i.e. the root scope)
    scope = $rootScope.$new();
    createController = function() {
        return $controller('hierarchiesCtrl', {
            '$scope': scope
        });
    };
  }));

  afterEach(inject(function($httpBackend, $rootScope) {
    // Force all of the http requests to respond.
    try {
      httpBackend.flush();
    }
    catch(err) {
    }
    // Force all of the promises to resolve.
    // VERY IMPORTANT: If we do not resolve promises, none of the dependent
    // expectations will be called, and the spec may pass inadvertantly.
    $rootScope.$digest();
    // Check that we don't have anything else hanging.
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
    httpBackend.resetExpectations();
  }));

  it('should start on first tab Context', function () {
    var controller = createController();
    HierarchyOnStart = 'Context';
    expect( scope.HierarchyType).toEqual(HierarchyOnStart);
  });

  it('should define the config of the tree', function() {
    var controller = createController();
    expect(scope.treeConfig).toBeDefined();    
  });

  it('should define the id of the first item when zero item is there', function() {
    var controller = createController();
    expect(scope.newId).toBe(1);    
  });

  // LoadMe()
  it('should change the hierachyType and call reload', function() {
    var controller = createController();
    scope.HierarchyType = null;
    spyOn(scope, 'load');
    scope.loadMe('1 valeur');
    scope.$digest();
    expect(scope.HierarchyType).toBe('1 valeur');
    expect(scope.load).toHaveBeenCalled();
  });

  // Load()
  it('should get data from backend and redisplay tree', function () {
     var controller = createController();
     expect(scope.treeConfig.version).toBe(1);
     expect(scope.hierarchies).toEqual([]);
     scope.load();
     httpBackend.flush();
     expect(scope.hierarchies).toEqual(['hierarchyX']);
     expect(scope.treeConfig.version).toBeGreaterThan(1);
     expect(scope.selectedNode).toBeNull();
  });

  it('should call function on start', function() {
      // to do
  });

  // Create()
  it('should create a new node and redisplay tree', function () {
     var controller = createController();
     expect(scope.treeConfig.version).toBe(1);
     expect(scope.hierarchies).toEqual([]);
     expect(scope.hierarchies.length).toBe(0);
     scope.create();
     scope.$digest();
     expect(scope.hierarchies.length).toBeGreaterThan(0);
     expect(scope.treeConfig.version).toBeGreaterThan(1);
  });


});
