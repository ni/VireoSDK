// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Close calls on JavaScript References', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var closeReferenceViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/CloseReference.via');

    var staticReferencesMapSize = function () {
        var internalModule = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired;
        var internalStaticMap = internalModule.javaScriptInvoke.do_not_use_debug_only_static_refnum_manager;
        return internalStaticMap.size;
    };

    var dynamicReferencesMapSize = function () {
        var internalModule = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired;
        var internalDynamicMap = internalModule.javaScriptInvoke.do_not_use_debug_only_dynamic_refnum_manager;
        return internalDynamicMap.size;
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            closeReferenceViaUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    beforeEach(function () {
        window.NI_CreateAnObject = function () {
            return new Uint8Array(1024 * 1024);
        };
        window.NI_ValidateMapSizeOne = function () {
            if (staticReferencesMapSize() !== 0) {
                throw new Error('Expected static map size to be zero');
            }
            if (dynamicReferencesMapSize() !== 1) {
                throw new Error('Expected dynamic map size to be one');
            }
        };
        window.NI_ValidateMapSizeZero = function () {
            if (staticReferencesMapSize() !== 0) {
                throw new Error('Expected static map size to be zero');
            }
            if (dynamicReferencesMapSize() !== 0) {
                throw new Error('Expected dynamic map size to be zero');
            }
        };
    });

    afterEach(function () {
        vireo = undefined;
    });

    afterEach(function () {
        window.NI_CreateAnObject = undefined;
        window.NI_ValidateMapSizeOne = undefined;
        window.NI_ValidateMapSizeZero = undefined;
    });

    it('free the JavaScript References', async function () {
        var viName = 'MyVI';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, closeReferenceViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);

        expect(staticReferencesMapSize()).toBe(0);
        expect(dynamicReferencesMapSize()).toBe(0);

        const {rawPrint, rawPrintError} = await runSlicesAsync();

        expect(staticReferencesMapSize()).toBe(0);
        expect(dynamicReferencesMapSize()).toBe(0);
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
    });
});
