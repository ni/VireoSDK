describe('can run test suite file', function () {
    'use strict';

    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var textFormat = window.testHelpers.textFormat;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();
    var viaFiles = fixtures.matchNamesFromPaths(/test-it\/(\w*)\.via$/);
    var vtrFiles = fixtures.matchNamesFromPaths(/test-it\/results\/(\w*)\.vtr$/);

    var stringArrayToObjectMap = function (arr) {
        return arr.reduce(function (obj, testName) {
            obj[testName] = true;
            return obj;
        }, {});
    };

    var focusTests = stringArrayToObjectMap([
    ]);

    var disabledTests = stringArrayToObjectMap([
        'HelloRequire', // native only
        'ListDirectory', // native only
        'StringFormatTime' // manual
    ]);

    var removeInlineComments = function (multiLineString) {
        return multiLineString.replace(/^\/\/.*\n/gm, '');
    };

    Object.keys(viaFiles).forEach(function (testName) {
        /* eslint no-restricted-globals: 'off' */
        var viaAbsolutePath = viaFiles[testName];
        var vtrAbsolutePath = vtrFiles[testName];

        var test = function (done) {
            var vtrText = fixtures.loadAbsoluteUrl(vtrAbsolutePath);
            var vtrTextNormalized = textFormat.normalizeLineEndings(vtrText);
            var vtrTextNoComments = removeInlineComments(vtrTextNormalized);
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaAbsolutePath);

            runSlicesAsync(function (results, errorText) {
                expect(errorText).toBeEmptyString();

                var resultsNormalized = textFormat.normalizeLineEndings(results);
                var resultsNoComments = removeInlineComments(resultsNormalized);
                expect(resultsNoComments).toBe(vtrTextNoComments);
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
