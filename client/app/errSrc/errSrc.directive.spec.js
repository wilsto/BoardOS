'use strict';

describe('Directive: errSrc', function () {

  // load the directive's module
  beforeEach(module('boardOsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<div errSrc="1">this is the errSrc directive</div>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the errSrc directive');
  }));
});