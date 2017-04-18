describe('can run test suite file', function () {
    'use strict';

    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var testListLoader = window.testHelpers.testListLoader;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();
    var viaTestNames = testListLoader.getTestNamesForEnvironment('browser');

    var stringArrayToObjectMap = function (arr, cb) {
        return arr.reduce(function (obj, currentString) {
            obj[currentString] = cb(currentString);
            return obj;
        }, {});
    };

    var createViaPath = function (testName) {
        return fixtures.convertToAbsoluteFromViaTestsDir(testName + '.via');
    };

    var createVtrPath = function (testName) {
        return fixtures.convertToAbsoluteFromExpectedResultsDir(testName + '.vtr');
    };

    var viaFiles = stringArrayToObjectMap(viaTestNames, createViaPath);
    var vtrFiles = stringArrayToObjectMap(viaTestNames, createVtrPath);

    beforeAll(function (done) {
        var allUrls = Object.values(viaFiles).concat(Object.values(vtrFiles));
        fixtures.preloadAbsoluteUrls(allUrls, done);
    });

    beforeEach(function () {
        window.jasmine.addMatchers(vireoRunner.vireoMatchers);
    });

    var setToTrue = function () {
        return true;
    };

    var focusTests = stringArrayToObjectMap([
    ], setToTrue);

    var disabledTests = stringArrayToObjectMap([
    ], setToTrue);

    Object.keys(viaFiles).forEach(function (testName) {
        /* eslint no-restricted-globals: 'off' */
        var viaAbsolutePath = viaFiles[testName];
        var vtrAbsolutePath = vtrFiles[testName];

        var test = function (done) {
            var vtrText = fixtures.loadAbsoluteUrl(vtrAbsolutePath);
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaAbsolutePath);

            runSlicesAsync(function (results, errorText) {
                expect(errorText).toBeEmptyString();
                expect(results).toMatchVtrText(vtrText);
                done();
            });
        };

        if (focusTests[testName] === true) {
            fit(testName, test);
        } else if (disabledTests[testName] === true) {
            xit(testName, test);
        } else {
            it(testName, test);
        }
    });
});
