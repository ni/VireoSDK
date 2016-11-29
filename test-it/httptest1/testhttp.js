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

    var createAndRun = function (Vireo, viaCode) {
        var vireo = new Vireo();

        vireo.httpClient.enableHttpDebugging(true);

        eggShell = vireo.eggShell;
        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;

        createAndRun(window.NationalInstruments.Vireo.Vireo, viaCode);
    };

    domReady(runTest);
}());
