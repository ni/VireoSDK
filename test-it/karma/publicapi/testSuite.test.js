describe('can run test suite file', function () {
    'use strict';

    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

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
        'BadArgumentToVarArgInstruction',
        'BadComment',
        'GlobalCrossTalk',
        'HelloRequire', // native only
        'InlineArrayConstantsErrors',
        'ListDirectory', // native only
        'StringFormatTime', // manual
        'TooManyArguments'
    ]);

    Object.keys(viaFiles).forEach(function (testName) {
        /* eslint no-restricted-globals: 'off' */
        var viaAbsolutePath = viaFiles[testName];
        var vtrAbsolutePath = vtrFiles[testName];
        var test = vireoRunner.createVTRTestSync(vireo, viaAbsolutePath, vtrAbsolutePath);

        if (focusTests[testName] === true) {
            fit(testName, test);
        } else if (disabledTests[testName] === true) {
            xit(testName, test);
        } else {
            it(testName, test);
        }
    });
});
