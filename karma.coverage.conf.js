// Karma configuration

(function () {
    'use strict';

    module.exports = function (config) {
        var getSharedConfig = require('./karma.shared.js');
        var sharedConfig = getSharedConfig(config);

        sharedConfig.files = [
            ...sharedConfig.filesPolyfills,
            ...sharedConfig.filesInfrastructure,
            'dist/wasm32-unknown-emscripten/release/vireo.js',
            ...sharedConfig.filesSource,
            ...sharedConfig.filesFixtures,
            ...sharedConfig.filesSpecs
        ];

        sharedConfig.browsers = [
            'FirefoxHeadless'
        ];

        sharedConfig.reporters = [
            'dots',
            'coverage'
        ];

        sharedConfig.preprocessors['dist/wasm32-unknown-emscripten/release/vireo.js'] = ['coverage'];

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
}());
