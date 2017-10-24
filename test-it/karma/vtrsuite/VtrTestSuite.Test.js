describe('The Vireo VTR test suite', function () {
    'use strict';

    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var testListLoader = window.testHelpers.testListLoader;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();
    var viaTestNames = testListLoader.getTestNamesForEnvironment('browser');

    var viaTestConfigs = viaTestNames.map(function (testName) {
        return {
            testName: testName,
            viaFile: fixtures.convertToAbsoluteFromViaTestsDir(testName + '.via'),
            vtrFile: fixtures.convertToAbsoluteFromExpectedResultsDir(testName + '.vtr')
        };
    });

    describe('can preload files for test', function () {
        viaTestConfigs.forEach(function (viaTestConfig) {
            it(viaTestConfig.testName, function (done) {
                fixtures.preloadAbsoluteUrls([
                    viaTestConfig.viaFile,
                    viaTestConfig.vtrFile
                ], done);
            });
        });
    });

    describe('can run test', function () {
        // To disable a test add a key for the test name set to true, ie:
        // {'AwesomeDisabledTest': true}
        var focusTests = {};
        var disabledTests = {};

        viaTestConfigs.forEach(function (viaTestConfig) {
            /* eslint no-restricted-globals: 'off' */

            var test = function (done) {
                var vtrText = fixtures.loadAbsoluteUrl(viaTestConfig.vtrFile);
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaTestConfig.viaFile);

                runSlicesAsync(function (results, errorText) {
                    expect(errorText).toBeEmptyString();
                    expect(results).toMatchVtrText(vtrText);
                    done();
                });
            };

            var testName = viaTestConfig.testName;
            if (focusTests[testName] === true) {
                fit(testName, test);
            } else if (disabledTests[testName] === true) {
                xit(testName, test);
            } else {
                it(testName, test);
            }
        });
    });
});
