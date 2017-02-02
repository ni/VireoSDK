// Karma configuration
// Generated on Mon Dec 12 2016 13:30:12 GMT-0600 (Central Standard Time)

module.exports = function (config) {
    'use strict';

    var sharedConfig = require('./karma.shared.js');

    sharedConfig.files = sharedConfig.files.concat([
        // test specs
        'test-it/karma/publicapi/*.test.js',
        'test-it/karma/http/*.test.js'
    ]);

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    sharedConfig.logLevel = config.LOG_INFO;

    // The jasmine default timeout is 5000ms so this is cutting it close
    sharedConfig.reportSlowerThan = 4000;
    config.set(sharedConfig);
};
