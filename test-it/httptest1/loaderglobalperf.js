(function () {
    'use strict';

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        var vireo = new window.NationalInstruments.Vireo.Vireo();
        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            console.log('finished :D');
        });
    };

    domReady(runTest);
}());
