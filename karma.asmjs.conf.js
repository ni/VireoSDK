// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

// Karma configuration

(function () {
    'use strict';

    module.exports = function (config) {
        var getSharedConfig = require('./karma.shared.js');
        var sharedConfig = getSharedConfig(config);

        sharedConfig.files = [
            ...sharedConfig.filesPolyfills,
            ...sharedConfig.filesInfrastructure,
            'dist/asmjs-unknown-emscripten/release/vireo.min.js',
            ...sharedConfig.filesSource,
            ...sharedConfig.filesFixtures,
            ...sharedConfig.filesSpecs
        ];

        config.set(sharedConfig);
    };
}());
