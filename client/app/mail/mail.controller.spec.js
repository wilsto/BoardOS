'use strict';

describe('Controller: MailCtrl', function () {

  // load the controller's module
  beforeEach(module('boardOsApp'));

  var MailCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MailCtrl = $controller('MailCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
