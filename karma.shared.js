(function () {
    'use strict';

    process.env.CHROME_BIN = require('puppeteer').executablePath();

    module.exports = function (config) {
        return {
            // base path that will be used to resolve all patterns (eg. files, exclude)
            basePath: '',

            // frameworks to use
            // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
            frameworks: ['jasmine', 'jasmine-spec-tags'],

            // list of files / patterns to load in the browser
            files: [
                // Polyfills
                // None

                // Test infrastructure
                'node_modules/jasmine-expect/dist/jasmine-matchers.js',
                'node_modules/diff/dist/diff.js',

                // Source files
                {
                    pattern: 'dist/wasm32-unknown-emscripten/*/vireo.core.wasm',
                    included: false
                },

                // Test specs and assets
                'test-it/karma/utilities/ExtendJasmineTimeout.js',
                'test-it/karma/utilities/TestHelpers.*.js',
                {
                    pattern: 'test-it/ViaTests/*.via',
                    included: false
                },
                {
                    pattern: 'test-it/ExpectedResults/*.vtr',
                    included: false
                },
                {
                    pattern: 'test-it/karma/fixtures/**/*.*',
                    included: false
                },
                {
                    pattern: 'test-it/testList.json',
                    included: false
                },

                // Test specs
                'test-it/karma/helloworld/*.Test.js',
                'test-it/karma/publicapi/*.Test.js',
                'test-it/karma/vtrsuite/*.Test.js',
                'test-it/karma/http/*.Test.js',
                'test-it/karma/javascriptinvoke/*.Test.js',
                'test-it/karma/propertynode/*.Test.js',
                'test-it/karma/events/*.Test.js',
                'test-it/karma/static/*.Test.js'
            ],

            // list of files to exclude
            exclude: [
            ],

            // preprocess matching files before serving them to the browser
            // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
            preprocessors: {},

            // test results reporter to use
            // possible values: 'dots', 'progress', 'verbose'
            // available reporters: https://npmjs.org/browse/keyword/karma-reporter
            reporters: ['dots', 'kjhtml'],

            // web server port
            port: 9876,

            // enable / disable colors in the output (reporters and logs)
            colors: true,

            // enable / disable watching file and executing tests whenever any file changes
            autoWatch: true,

            // start these browsers
            // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
            browsers: [],

            // Hostname to be used when capturing browsers.
            // This seems to reduce intermittent hangs on Windows 7 with legacy browsers, no longer needed.
            hostname: '127.0.0.1',

            // Aliases for launchers that provide custom settings
            // No Sandbox mode needed to run in Travis container https://docs.travis-ci.com/user/chrome#Sandboxing
            // Launching chrome has been timing out, some forums suggest disabling proxy settings:
            // https://github.com/karma-runner/karma-chrome-launcher/issues/175#issuecomment-378247457
            customLaunchers: {
                ChromeHeadlessNoSandbox: {
                    base: 'ChromeHeadless',
                    flags: ['--no-sandbox', '--no-proxy-server']
                }
            },

            // Continuous Integration mode
            // if true, Karma captures browsers, runs the tests and exits
            singleRun: true,

            // How long will Karma wait for a message from a browser before disconnecting from it (in ms).
            // default: 10000
            browserNoActivityTimeout: 60000,

            // Enable or disable failure on running empty test-suites. If disabled the program will return exit-code 0 and display a warning.
            failOnEmptyTestSuite: false,

            // Concurrency level
            // how many browser should be started simultaneous
            concurrency: 1,

            // level of logging
            // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
            logLevel: config.LOG_INFO,

            // Timeout for jasmine set to 50000 in ExtendJasmineTimeout.js so warn if test time getting close
            reportSlowerThan: 40000
        };
    };
}());
