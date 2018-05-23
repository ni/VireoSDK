(function () {
    'use strict';

    window.testHelpers = window.testHelpers || {};

    var verifySpyArgumentsForCalls = function (spy, expectedCallArgs) {
        var i;
        var callsCount = spy.calls.count();
        for (i = 0; i < callsCount; i += 1) {
            expect(spy.calls.argsFor(i)).toEqual(expectedCallArgs[i]);
        }
    };

    window.testHelpers.spyHelpers = {
        verifySpyArgumentsForCalls: verifySpyArgumentsForCalls
    };
}());
