(function () {
    'use strict';

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var createAndRun = function (vireoHelpers, viaCode) {
        var vireo;
        vireoHelpers.createInstance().then(function (vireoInstance) {
            vireo = vireoInstance;
            vireo.eggShell.loadVia(viaCode);
            return vireo.eggShell.executeSlicesUntilClumpsFinished();
        }).then(function () {
            var valueRef = vireo.eggShell.findValueRef('MyVI', 'body');
            console.log(JSON.parse(vireo.eggShell.readJSON(valueRef)));
            console.log('finished :D');
        });
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        createAndRun(window.vireoHelpers, viaCode);
    };

    domReady(runTest);
}());
