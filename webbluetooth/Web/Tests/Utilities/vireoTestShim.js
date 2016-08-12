
(function () {
    'use strict';

    window.testHelpers = window.testHelpers || {};

    testHelpers.vireoShimFunctionsEnum = Object.freeze({
        CORE_GET_VUSERSHELL: 'CORE_GET_VUSERSHELL',
        CORE_SET_VUSERSHELL: 'CORE_SET_VUSERSHELL',
        CORE_GET_PRINT: 'CORE_GET_PRINT',
        CORE_SET_PRINT: 'CORE_SET_PRINT',
        CORE_GET_FPSYNC: 'CORE_GET_FPSYNC',
        CORE_SET_FPSYNC: 'CORE_SET_FPSYNC',
        EXECUTESLICES: 'EXECUTESLICES',
        REBOOT: 'REBOOT',
        LOADVIA: 'LOADVIA',
        READJSON: 'READJSON',
        READDOUBLE: 'READDOUBLE',
        WRITEJSON: 'WRITEJSON',
        WRITEDOUBLE: 'WRITEDOUBLE'
    });

    testHelpers.createVireoShim = function () {
        var original,
            errorFunc,
            cbName = 'callback',
            cbContainer = {},
            VIREO_FUNC = window.testHelpers.vireoShimFunctionsEnum;

        cbContainer[cbName] = undefined;
        original = NationalInstruments.Vireo;
        NationalInstruments.Vireo = {
            core: {}
        };

        testHelpers.shimBuilder.addShimProperty(NationalInstruments.Vireo.core, 'v_userShell', VIREO_FUNC.CORE_GET_VUSERSHELL, VIREO_FUNC.CORE_SET_VUSERSHELL, cbContainer, cbName);
        testHelpers.shimBuilder.addShimProperty(NationalInstruments.Vireo.core, 'print', VIREO_FUNC.CORE_GET_PRINT, VIREO_FUNC.CORE_SET_PRINT, cbContainer, cbName);
        testHelpers.shimBuilder.addShimProperty(NationalInstruments.Vireo.core, 'fpSync', VIREO_FUNC.CORE_GET_FPSYNC, VIREO_FUNC.CORE_SET_FPSYNC, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(NationalInstruments.Vireo, 'executeSlices', VIREO_FUNC.EXECUTESLICES, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(NationalInstruments.Vireo, 'reboot', VIREO_FUNC.REBOOT, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(NationalInstruments.Vireo, 'loadVia', VIREO_FUNC.LOADVIA, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(NationalInstruments.Vireo, 'readJSON', VIREO_FUNC.READJSON, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(NationalInstruments.Vireo, 'readDouble', VIREO_FUNC.READDOUBLE, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(NationalInstruments.Vireo, 'writeJSON', VIREO_FUNC.WRITEJSON, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(NationalInstruments.Vireo, 'writeDouble', VIREO_FUNC.WRITEDOUBLE, cbContainer, cbName);

        errorFunc = function () {
            throw new Error('Vireo shim has already been removed');
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

                NationalInstruments.Vireo = original;
            }
        };
    };
}());
