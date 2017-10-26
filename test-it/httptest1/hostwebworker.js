(function () {
    'use strict';

    var handlers = [];

    handlers.init = function (scripts) {
        self.importScripts.apply(self, scripts);
    };

    handlers.loadAndRun = function (viaCode) {
        var vireo = new self.NationalInstruments.Vireo.Vireo();
        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilClumpsFinished();
    };

    self.addEventListener('message', function (evt) {
        handlers[evt.data.type].call(undefined, evt.data.data);
    });
}());
