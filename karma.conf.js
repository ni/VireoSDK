// Karma configuration

(function () {
    'use strict';

    module.exports = function (config) {
        var sharedConfig = require('./karma.shared.js');

        sharedConfig.files = sharedConfig.files.concat([
            // test assets
            'test-it/karma/utilities/ExtendJasmineTimeout.js',

            // test specs
            'test-it/karma/helloworld/*.Test.js',
            'test-it/karma/publicapi/*.Test.js',
            'test-it/karma/vtrsuite/*.Test.js',
            'test-it/karma/http/*.Test.js',
            'test-it/karma/javascriptinvoke/*.Test.js',
            'test-it/karma/propertynode/*.Test.js'
        ]);

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        sharedConfig.logLevel = config.LOG_INFO;

        // Timeout for jasmine set to 50000 in ExtendJasmineTimeout.js so warn if test time getting close
        sharedConfig.reportSlowerThan = 40000;

        config.set(sharedConfig);
    };
}());
