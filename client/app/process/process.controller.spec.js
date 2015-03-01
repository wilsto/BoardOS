'use strict';

describe('Controller: ProcessCtrl', function () {

  // load the controller's module
  beforeEach(module('boardOsApp'));

  var ProcessCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProcessCtrl = $controller('ProcessCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
