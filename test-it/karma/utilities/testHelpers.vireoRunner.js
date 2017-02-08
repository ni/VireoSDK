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

            var executeSlicesInvocationCount = 0;

            (function runExecuteSlicesAsync () {
                // TODO mraj Executing 1000 slices at a time ran much slower, need better tuning of this value
                var remainingSlices = vireo.eggShell.executeSlices(1000000);
                executeSlicesInvocationCount += 1;

                if (remainingSlices > 0) {
                    // The setImmediate polyfill in PhantomJS does not work when combined with xhr requests.
                    // I think the polyfill blocks servicing network ops...
                    // so periodically use setTimeout to let PhantomJS service the network stack
                    if (executeSlicesInvocationCount % 1000 === 0) {
                        setTimeout(runExecuteSlicesAsync, 0);
                    } else {
                        setImmediate(runExecuteSlicesAsync);
                    }
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
