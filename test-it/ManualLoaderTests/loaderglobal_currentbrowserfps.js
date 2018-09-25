(function () {
    'use strict';

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var runTest = async function () {
        var viaCode = document.getElementById('viacode').textContent;
        var vireo = await window.vireoHelpers.createInstance();
        vireo.eggShell.loadVia(viaCode);
        await vireo.eggShell.executeSlicesUntilClumpsFinished();
        console.log('finished :D');
    };

    domReady(runTest);
}());
