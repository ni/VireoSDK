describe('The Vireo VTR test suite', function () {
    'use strict';

    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var testListLoader = window.testHelpers.testListLoader;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
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
            var test = function (done) {
                var vtrText = fixtures.loadAbsoluteUrl(vtrFile);
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaFile);

                runSlicesAsync(function (results, errorText) {
                    expect(errorText).toBeEmptyString();
                    expect(results).toMatchVtrText(vtrText);
                    done();
                });
            };

            beforeEach(function (done) {
                fixtures.preloadAbsoluteUrls([
                    viaFile,
                    vtrFile
                ], done);
            });

            if (focusTests[testName] === true) {
                fit(testDescription, test); // eslint-disable-line no-restricted-globals
            } else if (disabledTests[testName] === true) {
                xit(testDescription, test);
            } else {
                it(testDescription, test);
            }
        });
    });
});
