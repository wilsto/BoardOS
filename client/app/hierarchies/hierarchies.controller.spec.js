'use strict';

describe('Controller: hierarchiesCtrl', function () {

  // load the controller's module
  beforeEach(module('boardOsApp'));

  var hierarchiesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    hierarchiesCtrl = $controller('hierarchiesCtrl', {
      $scope: scope
    });
  }));

  it('should start on first tab Context', function () {
    expect( scope.HierarchyType).toEqual('Context');
  });
});
