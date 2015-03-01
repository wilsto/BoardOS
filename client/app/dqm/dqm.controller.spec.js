'use strict';

describe('Controller: DqmCtrl', function () {

  // load the controller's module
  beforeEach(module('boardOsApp'));

  var DqmCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DqmCtrl = $controller('DqmCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
