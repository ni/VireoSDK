describe('can run test suite file', function () {
    'use strict';

    var viaFiles = {};
    var vtrFiles = {};
    // Sharing Vireo instances across tests make them run soooo much faster
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireo = new Vireo();

    Object.keys(window.__karma__.files).forEach(function (file) {
        var viaFileParts = file.match(/test-it\/(.*)\.via$/);
        if (viaFileParts !== null) {
            viaFiles[viaFileParts[1]] = file;
        }

        var vtrFileParts = file.match(/test-it\/results\/(.*)\.vtr$/);
        if (vtrFileParts !== null) {
            vtrFiles[vtrFileParts[1]] = file;
        }
    });

    Object.keys(viaFiles).forEach(function (viaFileName) {
        if (vtrFiles[viaFileName] === undefined) {
            throw new Error('Missing vtr file for test:', viaFileName);
        }
    });

    var normalizeLineEndings = function (multiLineString) {
        return multiLineString.replace(/\r\n/gm, '\n');
    };

    var removeInlineComments = function (multiLineString) {
        return multiLineString.replace(/^\/\/.*\n/gm, '');
    };

    var createTestForVia = function (viaAbsolutePath, vtrAbsolutePath) {
        return function () {
            var viaText = window.testHelpers.fixtures.loadAbsoluteUrl(viaAbsolutePath);
            var rawVtrText = window.testHelpers.fixtures.loadAbsoluteUrl(vtrAbsolutePath);
            var rawResults = '';
            vireo.eggShell.reboot();
            vireo.eggShell.setPrintFunction(function (text) {
                rawResults += text + '\n';
            });
            vireo.eggShell.loadVia(viaText);
            vireo.eggShell.executeSlices(1000000);

            var normalizedResults = normalizeLineEndings(rawResults);
            var normalizedVtrText = normalizeLineEndings(rawVtrText);
            var vtrTextNoComments = removeInlineComments(normalizedVtrText);
            expect(JSON.stringify(normalizedResults)).toBe(JSON.stringify(vtrTextNoComments));
        };
    };

    var focusTests = [
    ];

    var disabledTests = [
        'BadArgumentToVarArgInstruction',
        'BadComment',
        'ClumpTriggerWait',
        'EthanOpts2',
        'GlobalCrossTalk',
        'HelloRequire',
        'InlineArrayConstantsErrors',
        'ListDirectory',
        'MandelbrotInline',
        'MathFunctions',
        'Occurrence',
        'PID',
        'Parallel',
        'Parallel2',
        'Pi',
        'Pi_EthanOpts',
        'Pi_NonReentrant',
        'QueueOfNothingReaderWriter',
        'QueueReaderWriter',
        'QueueType',
        'QueueTypeTemplate',
        'ReentrantSubVISimple',
        'Round',
        'Scale2X',
        'StringFormatTime',
        'TicTock',
        'Time128',
        'TimingTest1',
        'TooManyArguments',
        'Viaduino'
    ];

    var addNameToObject = function (obj, testName) {
        obj[testName] = true;
        return obj;
    };

    var disabledTestsObj = disabledTests.reduce(addNameToObject, {});
    var focusTestsObj = focusTests.reduce(addNameToObject, {});

    Object.keys(viaFiles).forEach(function (testName) {
        var viaAbsolutePath = viaFiles[testName];
        var vtrAbsolutePath = vtrFiles[testName];

        if (focusTestsObj[testName] === true) {
            fit(testName, createTestForVia(viaAbsolutePath, vtrAbsolutePath));
        } else if (disabledTestsObj[testName] === true) {
            xit(testName, createTestForVia(viaAbsolutePath, vtrAbsolutePath));
        } else {
            it(testName, createTestForVia(viaAbsolutePath, vtrAbsolutePath));
        }
    });
});
