'use strict';

describe('Directive: dashboardTab', function () {

  // load the directive's module and view
  beforeEach(module('boardOsApp'));
  beforeEach(module('app/dashboardTab/dashboardTab.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<dashboard-tab></dashboard-tab>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the dashboardTab directive');
  }));
});