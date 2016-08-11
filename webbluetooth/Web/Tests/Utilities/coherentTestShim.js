
(function () {
    'use strict';

    window.testHelpers = window.testHelpers || {};

    testHelpers.coherentShimFunctionsEnum = Object.freeze({
        ON: 'ON',
        OFF: 'OFF',
        CALL: 'CALL',
        TRIGGER: 'TRIGGER'
    });

    testHelpers.createCoherentShim = function () {
        var original,
            errorFunc,
            cbName = 'callback',
            cbContainer = {},
            COHERENT_FUNC = testHelpers.coherentShimFunctionsEnum;

        cbContainer[cbName] = undefined;
        original = window.engine;
        window.engine = {
        };

        testHelpers.shimBuilder.addShimFunction(window.engine, 'on', COHERENT_FUNC.ON, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(window.engine, 'off', COHERENT_FUNC.OFF, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(window.engine, 'call', COHERENT_FUNC.CALL, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(window.engine, 'trigger', COHERENT_FUNC.TRIGGER, cbContainer, cbName);

        errorFunc = function () {
            throw new Error('Coherent shim has already been removed');
        };

        return {
            setCallback: function (newCb) {
                if (cbContainer[cbName] === errorFunc) {
                    errorFunc();
                } else {
                    cbContainer[cbName] = newCb;
                }
            }, removeShim: function () {
                cbContainer[cbName] = errorFunc;

                window.engine = original;
            }
        };
    };
}());
