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
        window.vireoHelpers.createInstance().then(function (vireo) {
            vireo.eggShell.loadVia(viaCode);
            return vireo.eggShell.executeSlicesUntilClumpsFinished();
        }).then(function () {
            console.log('finished :D');
        });
    };

    domReady(runTest);
}());
