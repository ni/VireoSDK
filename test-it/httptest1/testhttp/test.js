(function () {
    'use strict';

    var eggShell = new NationalInstruments.HtmlVI.EggShell();
    var domReady = function (callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    };

    var continueUntilDone = function () {
        var executionState = eggShell.runSlices();

        if (executionState.finished === true) {
            console.log(eggShell.peek('_%46unction%2Egvi', 'dataItem_String', 'String'));
        } else {
            setTimeout(continueUntilDone, 0);
        }
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        
        eggShell.loadVia(viaCode);
        setTimeout(continueUntilDone, 0);
    };

    domReady(runTest);
}());