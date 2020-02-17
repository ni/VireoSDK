// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';

    window.testHelpers = window.testHelpers || {};

    var verifySpyArgumentsForCalls = function (spy, expectedCallArgs) {
        var i;
        var callsCount = spy.calls.count();
        expect(callsCount).toEqual(expectedCallArgs.length);
        for (i = 0; i < callsCount; i += 1) {
            expect(spy.calls.argsFor(i)).toEqual(expectedCallArgs[i]);
        }
    };

    window.testHelpers.spyHelpers = {
        verifySpyArgumentsForCalls: verifySpyArgumentsForCalls
    };
}());
