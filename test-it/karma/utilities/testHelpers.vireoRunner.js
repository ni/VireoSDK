(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var removeInlineComments = function (multiLineString) {
        return multiLineString.replace(/^\/\/.*\n/gm, '');
    };

    var createVTRTestSync = function (vireo, viaAbsolutePath, vtrAbsolutePath) {
        return function () {
            expect(viaAbsolutePath).toBeNonEmptyString();
            expect(vtrAbsolutePath).toBeNonEmptyString();

            var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaAbsolutePath);
            var rawVtrText = window.testHelpers.fixtures.loadAbsoluteUrl(vtrAbsolutePath);
            expect(viaText).toBeNonEmptyString();
            expect(rawVtrText).toBeString();

            vireo.eggShell.reboot();

            var rawResults = '';
            vireo.eggShell.setPrintFunction(function (text) {
                rawResults += text + '\n';
            });

            vireo.eggShell.loadVia(viaText);
            while (vireo.eggShell.executeSlices(1000000)) {
                // repeat until it returns zero
            }

            var normalizedResults = window.testHelpers.textFormat.normalizeLineEndings(rawResults);
            var normalizedVtrText = window.testHelpers.textFormat.normalizeLineEndings(rawVtrText);
            var vtrTextNoComments = removeInlineComments(normalizedVtrText);

            // Print the JSON.stringify versions so whitespace characters are encoded and easier to inspect
            expect(JSON.stringify(normalizedResults)).toBe(JSON.stringify(vtrTextNoComments));
        };
    };

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

        vireo.eggShell.loadVia(viaText);
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();

        var runSlicesAsync = function (cb) {
            expect(cb).toBeFunction();

            (function runExecuteSlicesAsync () {
                var remainingSlices = vireo.eggShell.executeSlices(1000);

                if (remainingSlices > 0) {
                    setTimeout(runExecuteSlicesAsync, 0);
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
        createVTRTestSync: createVTRTestSync,
        rebootAndLoadVia: rebootAndLoadVia,
        createVIPathParser: createVIPathParser,
        createVIPathWriter: createVIPathWriter
    };
}());
