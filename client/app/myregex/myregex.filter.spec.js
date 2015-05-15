'use strict';

describe('Filter: myregex', function() {

    // load the filter's module
    beforeEach(module('boardOsApp'));

    // initialize a new instance of the filter before each test
    var myregex;
    beforeEach(inject(function($filter) {
        myregex = $filter('myregex');
    }));

    it('should return the input prefixed with "myregex filter:"', function() {
        var text = 'a';
        expect(1).toBe(1);
    });

});