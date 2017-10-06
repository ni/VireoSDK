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
        var execResult = vireo.eggShell.executeSlices(1000);

        if (execResult !== 0) {
            setTimeout(continueUntilDone, execResult > 0 ? execResult : 0);
        } else {
            console.log('finished :D');
        }
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        vireo = new window.NationalInstruments.Vireo.Vireo();
        vireo.eggShell.setPrintFunction(console.log);
        vireo.eggShell.setPrintErrorFunction(console.error);
        vireo.eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    domReady(runTest);
}());
