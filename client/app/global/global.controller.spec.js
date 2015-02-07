'use strict';

describe('Controller: GlobalCtrl', function() {

    // load the controller's module
    beforeEach(module('boardOsApp'));

    var GlobalCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        GlobalCtrl = $controller('GlobalCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function() {
        expect(1).toEqual(1);
    });
});