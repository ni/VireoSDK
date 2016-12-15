(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var normalizeLineEndings = function (multiLineString) {
        return multiLineString.replace(/\r\n/gm, '\n');
    };

    var removeInlineComments = function (multiLineString) {
        return multiLineString.replace(/^\/\/.*\n/gm, '');
    };

    var createVTRTest = function (vireo, viaAbsolutePath, vtrAbsolutePath) {
        return function () {
            expect(typeof viaAbsolutePath).toBe('string');
            expect(typeof vtrAbsolutePath).toBe('string');

            var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaAbsolutePath);
            var rawVtrText = window.testHelpers.fixtures.loadAbsoluteUrl(vtrAbsolutePath);
            expect(typeof viaText).toBe('string');
            expect(typeof vtrAbsolutePath).toBe('string');

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

    var stringArrayToObjectMap = function (arr) {
        return arr.reduce(function (obj, testName) {
            obj[testName] = true;
            return obj;
        }, {});
    };

    var matchNamesFromPaths = function (regexMatchName) {
        var files = {};
        Object.keys(window.__karma__.files).forEach(function (file) {
            var fileParts = file.match(regexMatchName);
            if (fileParts !== null) {
                files[fileParts[1]] = file;
            }
        });
        return files;
    };

    window.testHelpers.vireoRunner = {
        normalizeLineEndings: normalizeLineEndings,
        removeInlineComments: removeInlineComments,
        createVTRTest: createVTRTest,
        stringArrayToObjectMap: stringArrayToObjectMap,
        matchNamesFromPaths: matchNamesFromPaths
    };
}());
