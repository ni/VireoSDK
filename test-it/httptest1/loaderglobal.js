/* global requirejs */
(function () {
    'use strict';

    var eggShell;

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var continueUntilDone = function () {
        var execResult = eggShell.executeSlicesUntilWait(1000);

        if (execResult !== 0) {
            setTimeout(continueUntilDone, execResult > 0 ? execResult : 0);
        } else {
            console.log('finished :D');
        }
    };

    var createAndRun = function (Vireo, viaCode) {
        eggShell = new Vireo().eggShell;
        eggShell.setPrintFunction(console.log);
        eggShell.setPrintErrorFunction(console.error);
        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
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
