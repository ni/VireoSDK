// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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

        var addOutputToError = function (exIn) {
            // Vireo sometimes aborts with strings so convert to Error
            var ex = exIn instanceof Error ? exIn : new Error(exIn);

            // Mutating error used specifically for test crashes of the runtime
            ex.rawPrint = rawPrint;
            ex.rawPrintError = rawPrintError;
            return ex;
        };

        var ex;
        try {
            vireo.eggShell.loadVia(viaText);
        } catch (exIn) {
            ex = addOutputToError(exIn);
            throw ex;
        }

        // If a cb is provided we will execute the cb when finished running, cannot detect runtime failures (deprecated)
        // If a cb is not provided we will return a Promise that can detect runtime failures. Should be used for new tests.
        var runSlicesAsync = function (cb) {
            if (cb !== undefined && typeof cb !== 'function') {
                throw new Error('runSlicesAsync must be called without parameters when using Promises or with a callback if using deprecated behaviors');
            }

            if (cb === undefined) {
                return new Promise(function (resolve, reject) {
                    vireo.eggShell.executeSlicesUntilClumpsFinished()
                        .then(function () {
                            resolve({rawPrint, rawPrintError});
                        })
                        .catch(function (exIn) {
                            var ex = addOutputToError(exIn);
                            reject(ex);
                        });
                });
            }

            vireo.eggShell.executeSlicesUntilClumpsFinished().then(function () {
                // Cleanup the configured print functions in-case the Vireo instance is used for further tests
                // by replacing them with a noop callback
                var noop = function () {
                    // intentionally blank
                };
                vireo.eggShell.setPrintFunction(noop);
                vireo.eggShell.setPrintErrorFunction(noop);
                cb(rawPrint, rawPrintError);
            });

            return undefined;
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

    var enqueueVI = function (vireo, viName) {
        vireo.eggShell.loadVia('enqueue(' + viName + ')');
    };

    var vireoMatchers = {
        toMatchVtrText: function () {
            return {
                compare: function (actualRaw, expectedRaw) {
                    var result = {
                        pass: undefined,
                        message: undefined
                    };

                    // We convert all nulls to newlines because we cannot distinguish between null and newline in Module.print and Module.printErr
                    // https://github.com/kripken/emscripten/blob/52ff847187ee30fba48d611e64b5d10e2498fe0f/src/library_syscall.js#L162
                    // We choose newline because in setPrintFunction and setPrintErrorFunction we use newline termination
                    // Can avoid when lower-level api is available: https://github.com/kripken/emscripten/issues/5290#issuecomment-429970878

                    var actualNormalized = window.testHelpers.textFormat.normalizeLineEndings(actualRaw);
                    var actualNoComments = window.testHelpers.textFormat.removeInlineComments(actualNormalized);
                    var actual = window.testHelpers.textFormat.convertNulltoNewline(actualNoComments);

                    var expectedNormalized = window.testHelpers.textFormat.normalizeLineEndings(expectedRaw);
                    var expectedNoComments = window.testHelpers.textFormat.removeInlineComments(expectedNormalized);
                    var expected = window.testHelpers.textFormat.convertNulltoNewline(expectedNoComments);

                    result.pass = actual === expected;
                    if (result.pass) {
                        // Result is they are equal, but should be not equal (the .not case)
                        result.message = 'Expected Vireo output to not match the VTR text, but they are identical. VTR text:\n' + expectedNoComments;
                    } else {
                        // Result is they are not equal, but should be equal (normal case)
                        result.message = 'Expected Vireo output to match VTR text, instead saw:\n';
                        result.message += window.Diff.createTwoFilesPatch('VTR Text', 'Vireo Output', expectedNoComments, actualNoComments);
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
        createVIPathWriter: createVIPathWriter,
        enqueueVI: enqueueVI
    };
}());
