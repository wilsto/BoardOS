'use strict';

describe('Directive: popoverHtmlUnsafePopup', function () {

  // load the directive's module
  beforeEach(module('boardOsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<popover-html-unsafe-popup></popover-html-unsafe-popup>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the popoverHtmlUnsafePopup directive');
  }));
});