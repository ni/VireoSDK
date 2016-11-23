requirejs(['../../source/core/vireo.loader'], function(buildVireoInstance) {
    'use strict';
    
    var eggShell;
    
    var domReady = function (callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    };

    var continueUntilDone = function () {
        var remainingSlices = eggShell.executeSlices(1000);

        if (remainingSlices > 0) {
            setTimeout(continueUntilDone, 0);
        } else {
            console.log('finished :D');
        }
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        var publicAPI = buildVireoInstance();
        
        eggShell = publicAPI.vireoAPI;
        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    domReady(runTest);
});
