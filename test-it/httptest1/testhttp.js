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
        var execResult = eggShell.executeSlices(1000);

        if (execResult != 0) {
            setTimeout(continueUntilDone, execResult > 0 ? execResult : 0);
        } else {
            console.log(JSON.parse(eggShell.readJSON('%3AWeb%20Server%3AInteractive%3AApplication%3AMain%2Egviweb', 'dataItem_Body')));
            console.log('finished :D');
        }
    };

    var createAndRun = function (Vireo, viaCode) {
        var vireo = new Vireo();

        eggShell = vireo.eggShell;
        eggShell.setPrintFunction(console.log);
        eggShell.setPrintErrorFunction(console.error);
        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;

        createAndRun(window.NationalInstruments.Vireo.Vireo, viaCode);
    };

    domReady(runTest);
}());
