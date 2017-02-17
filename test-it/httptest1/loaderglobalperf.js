(function () {
    'use strict';

    var vireo;

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var continueUntilDone = function () {
        var remainingSlices = vireo.eggShell.executeSlices(1000);

        if (remainingSlices > 0) {
            setTimeout(continueUntilDone, 0);
        } else {
            console.log('finished :D');
        }
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        vireo = new window.NationalInstruments.Vireo.Vireo();
        vireo.eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    domReady(runTest);
}());
