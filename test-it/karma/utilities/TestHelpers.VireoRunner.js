(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var rebootAndLoadVia = function (vireo, viaAbsolutePath) {
        // Jasmine Matchers library is not always ready in beforeAll so use jasmine core functions
        expect(typeof viaAbsolutePath).toBe('string');
        expect(viaAbsolutePath).not.toBe('');

        var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaAbsolutePath);
        // Jasmine Matchers library is not always ready in beforeAll so use jasmine core functions
        expect(typeof viaText).toBe('string');
        expect(viaText).not.toBe('');

        vireo.eggShell.reboot();

        var rawPrint = '';
        vireo.eggShell.setPrintFunction(function (text) {
            rawPrint += text + '\n';
        });

        var rawPrintError = '';
        vireo.eggShell.setPrintErrorFunction(function (text) {
            rawPrintError += text + '\n';
        });

        var loadError = false;
        try {
            vireo.eggShell.loadVia(viaText);
        } catch (ex) {
            console.log(ex);
            loadError = true;
        }

        var runSlicesAsync = function (cb) {
            // Jasmine Matchers library is not always ready in beforeAll so use jasmine core functions
            expect(typeof cb).toBe('function');

            if (loadError) {
                cb(rawPrint, rawPrintError);
                return;
            }

            vireo.eggShell.executeSlicesToCompletion(cb);
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

    var vireoMatchers = {
        toMatchVtrText: function () {
            return {
                compare: function (actual, expected) {
                    // TODO mraj maybe we can implement the diff here for cleaner results

                    var result = {};
                    var actualNormalized = window.testHelpers.textFormat.normalizeLineEndings(actual);
                    var actualNoComments = window.testHelpers.textFormat.removeInlineComments(actualNormalized);

                    var expectedNormalized = window.testHelpers.textFormat.normalizeLineEndings(expected);
                    var expectedNoComments = window.testHelpers.textFormat.removeInlineComments(expectedNormalized);

                    result.pass = actualNoComments === expectedNoComments;
                    return result;
                }
            };
        },
        toMatchIEEE754Number: function (util, customEqualityTesters) {
            return {
                compare: function (actual, expected) {
                    var result = {};
                    if (typeof actual === 'number' && typeof expected === 'number') {
                        result.pass = Object.is(actual, expected);
                    } else {
                        result.pass = util.equals(actual, expected, customEqualityTesters);
                    }
                    return result;
                }
            };
        }
    };

    beforeAll(function () {
        window.jasmine.addMatchers(vireoMatchers);
    });

    window.testHelpers.vireoRunner = {
        rebootAndLoadVia: rebootAndLoadVia,
        createVIPathParser: createVIPathParser,
        createVIPathWriter: createVIPathWriter
    };
}());
