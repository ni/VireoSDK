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

        var loadErrorOccurred = false;
        try {
            vireo.eggShell.loadVia(viaText);
        } catch (ex) {
            loadErrorOccurred = true;
        }

        var runSlicesAsync = function (cb) {
            // Jasmine Matchers library is not always ready in beforeAll so use jasmine core functions
            expect(typeof cb).toBe('function');

            var complete = function () {
                cb(rawPrint, rawPrintError);
            };

            if (loadErrorOccurred) {
                complete();
            } else {
                vireo.eggShell.executeSlicesUntilClumpsFinished(complete);
            }
        };

        return runSlicesAsync;
    };

    var createVIPathParser = function (vireo, viName) {
        return function (path) {
            var valueRef = vireo.eggShell.findValueRef(viName, path);
            var json = vireo.eggShell.readJSON(valueRef);
            return JSON.parse(json);
        };
    };

    var createVIPathWriter = function (vireo, viName) {
        return function (path, value) {
            var valueRef = vireo.eggShell.findValueRef(viName, path);
            vireo.eggShell.writeJSON(valueRef, JSON.stringify(value));
        };
    };

    var vireoMatchers = {
        toMatchVtrText: function () {
            return {
                compare: function (actual, expected) {
                    var result = {
                        pass: undefined,
                        message: undefined
                    };

                    var actualNormalized = window.testHelpers.textFormat.normalizeLineEndings(actual);
                    var actualNoComments = window.testHelpers.textFormat.removeInlineComments(actualNormalized);

                    var expectedNormalized = window.testHelpers.textFormat.normalizeLineEndings(expected);
                    var expectedNoComments = window.testHelpers.textFormat.removeInlineComments(expectedNormalized);

                    result.pass = actualNoComments === expectedNoComments;
                    if (result.pass) {
                        // Result is they are equal, but should be not equal (the .not case)
                        result.message = 'Expected Vireo output to not match the VTR text, but they are identical. VTR text:\n' + expectedNoComments;
                    } else {
                        // Result is they are not equal, but should be equal (normal case)
                        result.message = 'Expected Vireo output to match VTR text, instead saw:\n';
                        result.message += window.JsDiff.createTwoFilesPatch('VTR Text', 'Vireo Output', expectedNoComments, actualNoComments);
                    }

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
