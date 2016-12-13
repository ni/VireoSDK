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
            vireo.eggShell.loadVia(viaText);
            vireo.eggShell.setPrintFunction(function (text) {
                rawResults += text + '\n';
            });
            vireo.eggShell.executeSlices(1000000);

            var normalizedVtrText = normalizeLineEndings(rawVtrText);
            var vtrNoComments = removeInlineComments(normalizedVtrText);
            expect(JSON.stringify(rawResults)).toBe(JSON.stringify(vtrNoComments));
        };
    };

    var disabledTests = [
        'BadArgumentToVarArgInstruction',
        'BadComment',
        'Banner',
        'BitFields',
        'BooleanFunctions',
        'BranchErrors',
        'ClumpTriggerWait',
        'EggShellError1',
        'EggShellError2',
        'EggShellError3',
        'EggShellError4',
        'EggShellError5',
        'EthanOpts2',
        'ExtraArrayInializers',
        'GlobalCrossTalk',
        'HelloRequire',
        'HelloRequireBad',
        'InlineArrayConstantsErrors',
        'ListDirectory',
        'Literals',
        'MandelbrotInline',
        'MathFunctions',
        'MissingType',
        'MultiDimensionArrayDefaults',
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
        'Scale2X',
        'StringFormatTime',
        'StringTrim',
        'Strings',
        'TicTock',
        'Time128',
        'TimingTest1',
        'TooManyArguments',
        'TooManyDimensions',
        'TypeChecking',
        'TypeValuesError',
        'VIScripting',
        'Viaduino'
    ];
    var disabledTestsObj = disabledTests.reduce(function (obj, testName) {
        obj[testName] = true;
        return obj;
    }, {});

    Object.keys(viaFiles).forEach(function (testName) {
        var viaAbsolutePath = viaFiles[testName];
        var vtrAbsolutePath = vtrFiles[testName];

        if (disabledTestsObj[testName] === undefined) {
            it(testName, createTestForVia(viaAbsolutePath, vtrAbsolutePath));
        } else {
            xit(testName, createTestForVia(viaAbsolutePath, vtrAbsolutePath));
        }
    });
});
