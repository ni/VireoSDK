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
        var eggShell;

        var domReady = function (callback) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                callback();
            }
        };

        var continueUntilDone = function () {
            var remainingSlices = eggShell.executeSlices(1000);

            if (remainingSlices > 0) {
                setTimeout(continueUntilDone, 0);
            } else {
                console.log('finished :D');
            }
        };

        var runTest = function () {
            var viaCode = document.getElementById('viacode').textContent;
            eggShell = new Vireo().eggShell;
            eggShell.setPrintFunction(console.log);
            eggShell.setPrintErrorFunction(console.error);
            eggShell.loadVia(viaCode);
            setTimeout(continueUntilDone, 0);
        };

        domReady(runTest);
    });
}());
