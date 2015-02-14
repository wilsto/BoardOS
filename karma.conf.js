// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: '',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],

        reporters: ['progress', 'growl', 'html'],

        // the default configuration
        htmlReporter: {
            outputDir: 'karma_html',
            templatePath: __dirname + '/node_modules/karma-html-reporter/jasmine_template.html'
        },

        // list of files / patterns to load in the browser
        files: [
            'client/bower_components/jquery/dist/jquery.js',
            'client/bower_components/angular/angular.js',
            'client/bower_components/angular-mocks/angular-mocks.js',
            'client/bower_components/bootstrap/dist/js/bootstrap.js',
            'client/bower_components/bootstrap.growl/bootstrap-growl.js',
            'client/bower_components/angular-resource/angular-resource.js',
            'client/bower_components/angular-cookies/angular-cookies.js',
            'client/bower_components/angular-sanitize/angular-sanitize.js',
            'client/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            'client/bower_components/angular-animate/angular-animate.js',
            'client/bower_components/angular-strap/dist/angular-strap.js',
            'client/bower_components/angular-strap/dist/angular-strap.tpl.js',
            'client/bower_components/angular-socket-io/socket.js',
            'client/bower_components/angular-ui-router/release/angular-ui-router.js',
            'client/bower_components/d3/d3.js',
            'client/bower_components/nvd3/nv.d3.js',
            'client/bower_components/angular-nvd3/dist/angular-nvd3.min.js',
            'client/bower_components/ng-table/ng-table.js',
            'client/bower_components/jstree/dist/jstree.js',
            'client/bower_components/ng-js-tree/dist/ngJsTree.js',
            'client/bower_components/select2/select2.js',
            'client/bower_components/ngDialog/js/ngDialog.js',
            'client/bower_components/lodash/dist/lodash.compat.js',
            'client/bower_components/moment/moment.js',
            'client/bower_components/zingchart/src/zingchart-html5-min.js',
            'client/bower_components/bootbox/bootbox.js',
            'client/bower_components/angular-confirm-field/app/package/js/angular-confirm-field.min.js',
            'client/app/app.js',
            'client/app/app.coffee',
            'client/app/**/*.js',
            'client/app/**/*.coffee',
            'client/components/**/*.js',
            'client/components/**/*.coffee',
            'client/app/**/*.jade',
            'client/components/**/*.jade',
            'client/app/**/*.html',
            'client/components/**/*.html'
        ],

        preprocessors: {
            '**/*.jade': 'ng-jade2js',
            '**/*.html': 'html2js',
            '**/*.coffee': 'coffee',
        },

        ngHtml2JsPreprocessor: {
            stripPrefix: 'client/'
        },

        ngJade2JsPreprocessor: {
            stripPrefix: 'client/'
        },

        // list of files / patterns to exclude
        exclude: [],

        // web server port
        port: 8080,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: ['PhantomJS', 'IE'],


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    });
};