'use strict';

describe('Directive: dashboardWidget', function () {

  // load the directive's module and view
  beforeEach(module('boardOsApp'));
  beforeEach(module('app/dashboardWidget/dashboardWidget.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<dashboard-widget></dashboard-widget>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the dashboardWidget directive');
  }));
});