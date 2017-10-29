// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    reporters: ['progress', 'growl', 'html', 'coverage'],

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
      'client/bower_components/angular-aria/angular-aria.js',
      'client/bower_components/angular-animate/angular-animate.js',
      'client/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'client/bower_components/lodash/dist/lodash.compat.js',
      'client/bower_components/angular-confirm-field/app/package/js/angular-confirm-field.min.js',
      'client/bower_components/angular-cookies/angular-cookies.js',
      'client/bower_components/angular-filter/dist/angular-filter.js',
      'client/bower_components/angular-messages/angular-messages.js',
      'client/bower_components/d3/d3.js',
      'client/bower_components/nvd3/nv.d3.js',
      'client/bower_components/angular-nvd3/dist/angular-nvd3.min.js',
      'client/bower_components/angular-resource/angular-resource.js',
      'client/bower_components/angular-sanitize/angular-sanitize.js',
      'client/bower_components/socket.io-client/dist/socket.io.js',
      'client/bower_components/angular-socket-io/socket.js',
      'client/bower_components/bootstrap/dist/js/bootstrap.js',
      'client/bower_components/angular-strap/dist/angular-strap.js',
      'client/bower_components/angular-strap/dist/angular-strap.tpl.js',
      'client/bower_components/jquery-ui/ui/jquery-ui.js',
      'client/bower_components/fullcalendar/fullcalendar.js',
      'client/bower_components/angular-ui-calendar/src/calendar.js',
      'client/bower_components/angular-ui-router/release/angular-ui-router.js',
      'client/bower_components/bootbox/bootbox.js',
      'client/bower_components/bootstrap-markdown/js/bootstrap-markdown.js',
      'client/bower_components/bootstrap.growl/bootstrap-growl.js',
      'client/bower_components/moment/moment.js',
      'client/bower_components/ng-table/ng-table.js',
      'client/bower_components/ngDialog/js/ngDialog.js',
      'client/bower_components/select2/select2.js',
      'client/bower_components/angular-ui-notification/dist/angular-ui-notification.js',
      'client/bower_components/ng-infinite-scroll-npm-is-better-than-bower/build/ng-infinite-scroll.js',
      'client/bower_components/angular-busy/dist/angular-busy.js',
      'client/bower_components/bootstrap-daterangepicker/daterangepicker.js',
      'client/bower_components/vis/dist/vis.js',
      'client/bower_components/angular-visjs/angular-vis.js',
      'client/bower_components/angular-xeditable/dist/js/xeditable.js',
      'client/bower_components/angular-ui-sortable/sortable.js',
      'client/bower_components/bootstrap-toggle/js/bootstrap-toggle.min.js',
      'client/bower_components/angular-material/angular-material.js',
      'client/bower_components/bpmn-js/dist/bpmn-viewer.js',
      'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.0/angular-aria.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.0/angular-messages.min.js',
      'client/bower_components/mdPickers/dist/mdPickers.min.js',
      'client/bower_components/ng-tags-input/ng-tags-input.js',
      'client/bower_components/angular-bootstrap-calendar/dist/js/angular-bootstrap-calendar-tpls.js',
      'client/bower_components/checklist-model/checklist-model.js',
      'client/bower_components/interactjs/interact.js',
      'client/bower_components/ngEmbed/src/ng-embed.js',
      'client/bower_components/angular-pageslide-directive/dist/angular-pageslide-directive.js',
      'client/app/app.js',
      'client/app/**/*.js',
      'client/components/**/*.js',
      'client/app/**/*.html',
      'client/components/**/*.html'
    ],

    preprocessors: {
      '**/*.html': 'html2js',
      'client/app/**/*.js': 'coverage',
      'client/components/**/*.js': 'coverage'
    },

    coverageReporter: {
      reporters: [{
        type: 'html',
        dir: 'coverage-results/'
      }, {
        type: 'lcov',
        dir: 'coverage-results/'
      }]
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
    port: 9898,

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
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
