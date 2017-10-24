/* global requirejs */
(function () {
    'use strict';
    requirejs.config({
        paths: {
            'NationalInstruments.Vireo.Core.createVireoCore': '../../dist/asmjs-unknown-emscripten/release/vireo',
            'NationalInstruments.Vireo.Core.assignCoreHelpers': '../../source/core/module_coreHelpers',
            'NationalInstruments.Vireo.ModuleBuilders.assignEggShell': '../../source/io/module_eggShell',
            'NationalInstruments.Vireo.ModuleBuilders.assignHttpClient': '../../source/io/module_httpClient',
            'NationalInstruments.Vireo.Vireo': '../../source/core/vireo.loader'
        }
    });

    requirejs(['NationalInstruments.Vireo.Vireo'], function (Vireo) {
        var domReady = function (callback) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                callback();
            }
        };

        var runTest = function () {
            var viaCode = document.getElementById('viacode').textContent;
            var vireo = new Vireo();
            vireo.eggShell.setPrintFunction(console.log);
            vireo.eggShell.setPrintErrorFunction(console.error);
            vireo.eggShell.loadVia(viaCode);
            vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
                console.log('finished :D');
            });
        };

        domReady(runTest);
    });
}());
