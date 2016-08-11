(function() {
    'use strict';
    // check for vireo
    if (NationalInstruments.Vireo === undefined) {
        throw new Error('vireo.js not available when creating the userAction event');
    } else {
        var userActionElement = document.getElementById('userActionButton');

        userActionElement.onclick = function() {
            NationalInstruments.Vireo.requestWebBluetoothDevice([0xFF02]);
        };
    }
}());
