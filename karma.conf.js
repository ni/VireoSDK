// Karma configuration

(function () {
    'use strict';

    module.exports = function (config) {
        var getSharedConfig = require('./karma.shared.js');
        var sharedConfig = getSharedConfig(config);
        sharedConfig.files = [
            'dist/wasm32-unknown-emscripten/release/vireo.js'
        ].concat(sharedConfig.files);

        config.set(sharedConfig);
    };
}());
