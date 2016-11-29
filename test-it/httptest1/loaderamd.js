requirejs.config({
    paths: {
        'NationalInstruments.Vireo.Core.createVireoCore': '../../dist/vireo',
        'NationalInstruments.Vireo.ModuleBuilders.assignEggShell': '../../source/io/module_vireoapi',
        'NationalInstruments.Vireo.ModuleBuilders.assignHttpClient': '../../source/io/module_httpClient',
        'NationalInstruments.Vireo.Vireo': '../../source/core/vireo.loader'
    }
});

requirejs(['NationalInstruments.Vireo.Vireo'], function (Vireo) {
    'use strict';

    var eggShell;

    var domReady = function (callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
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

        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    domReady(runTest);
});
