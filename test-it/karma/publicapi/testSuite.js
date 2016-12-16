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
        'ClumpTriggerWait',
        'EthanOpts2',
        'GlobalCrossTalk',
        'HelloRequire',
        'InlineArrayConstantsErrors',
        'ListDirectory',
        'MandelbrotInline',
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
    ]);

    Object.keys(viaFiles).forEach(function (testName) {
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
