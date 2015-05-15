'use strict';

angular.module('boardOsApp')
    .filter('myregex', function() {
        var patt;
        return function(input, field, regex) {
            if (regex && regex.indexOf('/') >= 0) {
                var regexMatch = regex.match(/^\/(.*)\/([^\/]*)$/);
                patt = new RegExp(regexMatch[1], regexMatch[2]);
            } else {
                patt = new RegExp(regex);
            }
            var out = [];

            if (input === undefined) {
                return out;
            }

            for (var i = 0; i < input.length; i++) {
                if (patt.test(input[i][field])) {
                    out.push(input[i]);
                }
            }
            return out;
        };
    });