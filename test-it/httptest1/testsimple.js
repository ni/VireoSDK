(function () {
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
        var remainingSlices = eggShell.executeSlices(1000, -1);

        if (remainingSlices > 0) {
            setTimeout(continueUntilDone, 0);
        } else {
            console.log('finished :D');
        }
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        var vireoCore = NationalInstruments.Vireo.Core.createVireoCore();
        NationalInstruments.Vireo.ModuleBuilders.assignVireoAPI(vireoCore);
        
        eggShell = vireoCore.publicAPI.vireoAPI;
        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    domReady(runTest);
}());