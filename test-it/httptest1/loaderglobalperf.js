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

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        vireo = new window.NationalInstruments.Vireo.Vireo();
        vireo.eggShell.setPrintFunction(console.log);
        vireo.eggShell.setPrintErrorFunction(console.error);
        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            console.log('finished :D');
        });
    };

    domReady(runTest);
}());
