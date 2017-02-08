// Karma configuration
// Generated on Mon Dec 12 2016 13:30:12 GMT-0600 (Central Standard Time)

module.exports = function (config) {
    'use strict';

    var sharedConfig = require('./karma.shared.js');

    sharedConfig.files = sharedConfig.files.concat([
        // test assets
        'test-it/karma/utilities/extendJasmineTimeout.longrun.js',

        // test specs
        'test-it/karma/publicapi/*.test.js',
        'test-it/karma/http/*.test.js',
        'test-it/karma/longrun/*.test.js'
    ]);

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    sharedConfig.logLevel = config.LOG_INFO;

    sharedConfig.browsers = [
        'Firefox'
    ];

    sharedConfig.reporters = [
        'dots',
        'coverage'
    ];

    sharedConfig.preprocessors['source/core/*.js'] = ['coverage'];
    sharedConfig.preprocessors['source/io/*.js'] = ['coverage'];

    sharedConfig.coverageReporter = {
        dir: 'coverage',
        reporters: [
            {
                type: 'html',
                subdir: 'report'
            },
            {
                type: 'text',
                subdir: '.',
                file: 'report.txt'
            }
        ]
    };

    sharedConfig.singleRun = true;

    config.set(sharedConfig);
};
