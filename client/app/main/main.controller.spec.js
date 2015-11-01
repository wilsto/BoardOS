'use strict';

describe('Controller: MainCtrl', function() {
    var httpBackend, $rootScope, createController, httpResponse, httpResponseHierarchy, httpResponseLog;
    var HierarchyOnStart, hierarchiesCtrl, scope;

    // load the controller's module
    beforeEach(module('boardOsApp'));

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope, $httpBackend) {
        // Set up the mock http service responses
        httpBackend = $httpBackend;
        // backend definition common for all tests
        httpResponse = {
            activity: '',
            actors: [{
                name: 'Will',
                count: 47
            }],
            context: '',
            dashboards: [{
                _id: '54d78f714fe7330820c4fd7a',
                name: 'CBI',
                owner: '549800f633fca76c16fca2af'
            }],
            kpis: [],
            metrics: [{
                _id: '44525cb2eb285a7417068214',
                activity: 'DCLIC.CBI.TREND.AD',
                actor: {
                    _id: 'usermetric'
                },
            }],
            tasks: [{
                _id: '54786dbf1ff267c8166aeddb',
                name: 'Define needs',
                actor: {
                    _id: 'usertask'
                },
                watchers: [{
                    _id: 'userwatcher'
                }, ]
            }]
        };

        httpBackend.when('GET', '/api/dashboards/user/undefined').respond(httpResponse);


        httpResponseLog = {

        };

        httpBackend.when('GET', '/api/logs').respond(httpResponseLog);

        httpResponseHierarchy = {
            list: ['hierarchyX']
        };
        httpBackend.when('GET', '/api/hierarchies/list/Context').respond(httpResponseHierarchy);
        httpBackend.when('GET', '/api/hierarchies/list/Activity').respond(httpResponseHierarchy);
        httpBackend.when('GET', '/api/hierarchies/list/Axis').respond(httpResponseHierarchy);
        // Get hold of a scope (i.e. the root scope)
        scope = $rootScope.$new();
        createController = function() {
            return $controller('MainCtrl', {
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

    it('should define Math', function() {
        var controller = createController();
        expect(scope.Math).toBeDefined();
    });


    it('should define filter for Notification at first', function() {
        var controller = createController();
        expect(scope.filterNotification).toBeDefined();
    });



    it('should load dashboards', function() {
        var controller = createController();

    });

});