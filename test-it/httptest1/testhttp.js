(function () {
    'use strict';

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var createAndRun = function (Vireo, viaCode) {
        var vireo = new Vireo();
        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            var valueRef = vireo.eggShell.findValueRef('%3AWeb%20Server%3AInteractive%3AApplication%3AMain%2Egviweb', 'dataItem_Body');
            console.log(JSON.parse(vireo.eggShell.readJSON(valueRef)));
            console.log('finished :D');
        });
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;

        createAndRun(window.NationalInstruments.Vireo.Vireo, viaCode);
    };

    domReady(runTest);
}());
