(function () {
    'use strict';

    var handlers = [];

    handlers.init = function () {
        self.importScripts.apply(self, arguments);
    };

    handlers.loadAndRun = function (wasmUrl, viaCode) {
        self.vireoHelpers.createInstance({
            wasmUrl: wasmUrl
        }).then(function (vireo) {
            vireo.eggShell.loadVia(viaCode);
            return vireo.eggShell.executeSlicesUntilClumpsFinished();
        });
    };

    self.addEventListener('message', function (evt) {
        handlers[evt.data.fn].apply(undefined, evt.data.params);
    });
}());
