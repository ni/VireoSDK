(function () {
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
            console.log(eggShell.readJSON('_%46unction%2Egvi', 'dataItem_String'));
            console.log('finished :D');
        }
    };

    var createAndRun = function (buildVireoInstance, viaCode) {
        var publicAPI = buildVireoInstance();

        publicAPI.httpClient.enableHttpDebugging(true);

        eggShell = publicAPI.vireoAPI;
        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;

        createAndRun(window.NationalInstruments.Vireo.buildVireoInstance, viaCode);
    };

    domReady(runTest);
}());
