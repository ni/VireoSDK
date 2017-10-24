(function () {
    'use strict';

    var handlers = [];

    handlers.init = function (scripts) {
        self.importScripts.apply(self, scripts);
    };

    handlers.loadAndRunSync = function (viaCode) {
        var vireo = new self.NationalInstruments.Vireo.Vireo();
        vireo.eggShell.setPrintFunction(console.log.bind(console));
        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilClumpsFinished();
    };

    self.addEventListener('message', function (evt) {
        handlers[evt.data.type].call(undefined, evt.data.data);
    });
}());
