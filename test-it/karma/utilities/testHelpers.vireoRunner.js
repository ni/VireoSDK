(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var normalizeLineEndings = function (multiLineString) {
        return multiLineString.replace(/\r\n/gm, '\n');
    };

    var removeInlineComments = function (multiLineString) {
        return multiLineString.replace(/^\/\/.*\n/gm, '');
    };

    var createVTRTestSync = function (vireo, viaAbsolutePath, vtrAbsolutePath) {
        return function () {
            expect(typeof viaAbsolutePath).toBe('string');
            expect(typeof vtrAbsolutePath).toBe('string');

            var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaAbsolutePath);
            var rawVtrText = window.testHelpers.fixtures.loadAbsoluteUrl(vtrAbsolutePath);
            expect(typeof viaText).toBe('string');
            expect(typeof rawVtrText).toBe('string');

            vireo.eggShell.reboot();

            var rawResults = '';
            vireo.eggShell.setPrintFunction(function (text) {
                rawResults += text + '\n';
            });

            vireo.eggShell.loadVia(viaText);
            vireo.eggShell.executeSlices(1000000);

            var normalizedResults = normalizeLineEndings(rawResults);
            var normalizedVtrText = normalizeLineEndings(rawVtrText);
            var vtrTextNoComments = removeInlineComments(normalizedVtrText);

            // Print the JSON.stringify versions so whitespace characters are encoded and easier to inspect
            expect(JSON.stringify(normalizedResults)).toBe(JSON.stringify(vtrTextNoComments));
        };
    };

    var rebootAndLoadVia = function (vireo, viaAbsolutePath) {
        expect(typeof viaAbsolutePath).toBe('string');

        var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaAbsolutePath);
        expect(typeof viaText).toBe('string');

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
        expect(rawPrint).toBe('');
        expect(rawPrintError).toBe('');

        var runSlicesAsync = function (cb) {
            expect(typeof cb).toBe('function');

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
        normalizeLineEndings: normalizeLineEndings,
        removeInlineComments: removeInlineComments,
        createVTRTestSync: createVTRTestSync,
        rebootAndLoadVia: rebootAndLoadVia,
        createVIPathParser: createVIPathParser,
        createVIPathWriter: createVIPathWriter
    };
}());
