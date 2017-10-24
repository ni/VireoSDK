/* global requirejs */
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

    var createAndRun = function (Vireo, viaCode) {
        vireo = new Vireo();
        vireo.eggShell.setPrintFunction(console.log);
        vireo.eggShell.setPrintErrorFunction(console.error);
        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            console.log('finished :D');
        });
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;

        // Assume amd if NI namespace not loaded for now
        if (window.NationalInstruments === undefined || window.NationalInstruments.Vireo === undefined) {
            console.log('using amd module');
            requirejs(['NationalInstruments.Vireo.Vireo'], function (Vireo) {
                createAndRun(Vireo, viaCode);
            });
        } else {
            console.log('using global');
            createAndRun(window.NationalInstruments.Vireo.Vireo, viaCode);
        }
    };

    domReady(runTest);
}());
