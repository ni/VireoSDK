(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var rebootAndLoadVia = function (vireo, viaAbsolutePath) {
        expect(viaAbsolutePath).toBeNonEmptyString();

        var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaAbsolutePath);
        expect(viaText).toBeNonEmptyString();

        vireo.eggShell.reboot();

        var rawPrint = '';
        vireo.eggShell.setPrintFunction(function (text) {
            rawPrint += text + '\n';
        });

        var rawPrintError = '';
        vireo.eggShell.setPrintErrorFunction(function (text) {
            rawPrintError += text + '\n';
        });

        var niError = vireo.eggShell.loadVia(viaText);

        var runSlicesAsync = function (cb) {
            expect(cb).toBeFunction();

            if (niError !== 0) {
                cb(rawPrint, rawPrintError);
                return;
            }

            (function runExecuteSlicesAsync () {
                var remainingSlices = vireo.eggShell.executeSlices(1000);

                if (remainingSlices > 0) {
                    setImmediate(runExecuteSlicesAsync);
                } else {
                    cb(rawPrint, rawPrintError);
                }
            }());
        };

        return runSlicesAsync;
    };

    var createVIPathParser = function (vireo, viName) {
        return function (path) {
            return JSON.parse(vireo.eggShell.readJSON(viName, path));
        };
    };

    var createVIPathWriter = function (vireo, viName) {
        return function (path, value) {
            vireo.eggShell.writeJSON(viName, path, JSON.stringify(value));
        };
    };

    window.testHelpers.vireoRunner = {
        rebootAndLoadVia: rebootAndLoadVia,
        createVIPathParser: createVIPathParser,
        createVIPathWriter: createVIPathWriter
    };
}());
