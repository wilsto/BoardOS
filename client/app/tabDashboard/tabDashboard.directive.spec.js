'use strict';

describe('Directive: tabDashboard', function() {
    var httpBackend, $rootScope, createController, httpResponse, httpResponseHierarchy, httpResponseLog;
    var HierarchyOnStart, hierarchiesCtrl, scope;
    // load the directive's module and view
    beforeEach(module('boardOsApp'));
    beforeEach(module('app/tabDashboard/tabDashboard.html'));

    var element;
    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope, $httpBackend) {
        // Set up the mock http service responses
        httpBackend = $httpBackend;
        httpResponseHierarchy = {
            list: ['hierarchyX']
        };
        httpBackend.when('GET', '/api/hierarchies/list/Context').respond(httpResponseHierarchy);
        httpBackend.when('GET', '/api/hierarchies/list/Activity').respond(httpResponseHierarchy);
        httpBackend.when('GET', '/api/hierarchies/list/Axis').respond(httpResponseHierarchy);

        scope = $rootScope.$new();
    }));

    it('should make hidden element visible', inject(function($compile) {
        element = angular.element('<tab-dashboard></tab-dashboard>');
        element = $compile(element)(scope);
        scope.$apply();
        expect(element.text()).toBeDefined();
    }));
});