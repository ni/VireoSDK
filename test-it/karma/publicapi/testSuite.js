describe('can run test suite file', function () {
    'use strict';

    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();
    var viaFiles = vireoRunner.matchNamesFromPaths(/test-it\/(.*)\.via$/);
    var vtrFiles = vireoRunner.matchNamesFromPaths(/test-it\/results\/(.*)\.vtr$/);

    var focusTests = vireoRunner.stringArrayToObjectMap([
    ]);

    var disabledTests = vireoRunner.stringArrayToObjectMap([
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
    ]);

    Object.keys(viaFiles).forEach(function (testName) {
        var viaAbsolutePath = viaFiles[testName];
        var vtrAbsolutePath = vtrFiles[testName];
        var test = vireoRunner.createVTRTest(vireo, viaAbsolutePath, vtrAbsolutePath);

        if (focusTests[testName] === true) {
            fit(testName, test);
        } else if (disabledTests[testName] === true) {
            xit(testName, test);
        } else {
            it(testName, test);
        }
    });
});
