'use strict';

angular.module('boardOsApp')
    .directive('errSrc', function() {
        return {
            template: '<div></div>',
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('error', function() {
                    if (attrs.src !== attrs.errSrc) {
                        attrs.$set('src', attrs.errSrc);
                    }
                });
            }
        };
    });