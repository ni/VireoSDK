// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo VTR test suite', function () {
    'use strict';

    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var testListLoader = window.testHelpers.testListLoader;

    var vireo;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();

        // VTR tests can't fire JS events, so register no-op registration functions
        vireo.eventHelpers.setRegisterForControlEventsFunction(function () {
            // no-op
        });
        vireo.eventHelpers.setUnRegisterForControlEventsFunction(function () {
            // no-op
        });
    });

    afterAll(function () {
        vireo = undefined;
    });

    var viaTestNames = testListLoader.getTestNamesForEnvironment('browser');

    var viaTestConfigs = viaTestNames.map(function (testName) {
        return {
            testName: testName,
            viaFile: fixtures.convertToAbsoluteFromViaTestsDir(testName + '.via'),
            vtrFile: fixtures.convertToAbsoluteFromExpectedResultsDir(testName + '.vtr')
        };
    });

    // To disable a test add a key for the test name set to true, ie:
    // {'AwesomeDisabledTest': true}
    var focusTests = {};
    var disabledTests = {};

    viaTestConfigs.forEach(function (viaTestConfig) {
        var testName = viaTestConfig.testName;
        var viaFile = viaTestConfig.viaFile;
        var vtrFile = viaTestConfig.vtrFile;

        describe('can preload ' + testName, function () {
            var testDescription = 'and run ' + testName;

            // A test that all top-level vi locals in memory can safely call testNeedsUpdateAndReset
            var testLocalsNeedUpdate = function (viName, allLocals) {
                Object.keys(allLocals).forEach(function (rawName) {
                    var encodedName = vireoHelpers.staticHelpers.encodeIdentifier(rawName);
                    var valueRef = vireo.eggShell.findValueRef(viName, encodedName);
                    vireo.eggShell.testNeedsUpdateAndReset(valueRef);
                });
            };

            // A test that all top-level vi locals can be serialized to valid JSON
            var readLocalsAsJSON = function () {
                var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaFile);
                var enqueueRegex = /^enqueue\s*\((\S*)\)$/m;
                var matches = viaText.match(enqueueRegex);
                var viName = matches === null ? undefined : matches[1];
                var viValueRef = viName === undefined ? undefined : vireo.eggShell.findValueRef(viName, '');
                // viName can be undefined if the test VI never runs enqueue() in the via
                // viValueRef can be undefined if the vi reference has no associated data (data pointer null because no locals for VI)
                var jsonResult, allLocals;
                if (viName !== undefined && viValueRef !== undefined) {
                    jsonResult = vireo.eggShell.readJSON(viValueRef);
                    allLocals = JSON.parse(jsonResult);
                    testLocalsNeedUpdate(viName, allLocals);
                }
            };

            var test = async function () {
                var vtrText = fixtures.loadAbsoluteUrl(vtrFile);
                var runSlicesAsync;
                try {
                    runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaFile);
                } catch (ex) {
                    expect(ex.message).toMatch(/CantDecode/);
                    expect(ex.rawPrintError).toBeEmptyString();
                    expect(ex.rawPrint).toMatchVtrText(vtrText);
                    return;
                }
                var {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrintError).toBeEmptyString();
                expect(rawPrint).toMatchVtrText(vtrText);
                expect(readLocalsAsJSON).not.toThrow();
            };

            beforeEach(function (done) {
                fixtures.preloadAbsoluteUrls([
                    viaFile,
                    vtrFile
                ], done);
            });

            if (focusTests[testName] === true) {
                fit(testDescription, async function () { // eslint-disable-line no-restricted-globals
                    await test();
                });
            } else if (disabledTests[testName] === true) {
                xit(testDescription, async function () {
                    await test();
                });
            } else {
                it(testDescription, async function () {
                    await test();
                });
            }
        });
    });
});
