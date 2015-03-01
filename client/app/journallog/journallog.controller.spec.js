'use strict';

describe('Controller: JournallogCtrl', function () {

  // load the controller's module
  beforeEach(module('boardOsApp'));

  var JournallogCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    JournallogCtrl = $controller('JournallogCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
