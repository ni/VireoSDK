// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo EggShell JavaScriptRefNum api can', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var vireo;

    beforeEach(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    afterEach(function () {
        vireo = undefined;
    });

    var readJavaScriptRefNum = function (path) {
        return vireo.eggShell.readJavaScriptRefNum(vireo.eggShell.findValueRef(viName, path));
    };

    var tryReadJavaScriptRefNum = function (path) {
        return function () {
            return readJavaScriptRefNum(path);
        };
    };

    var writeJavaScriptRefNum = function (path, value) {
        return vireo.eggShell.writeJavaScriptRefNum(vireo.eggShell.findValueRef(viName, path), value);
    };

    var tryWriteJavaScriptRefNum = function (path, value) {
        return function () {
            writeJavaScriptRefNum(path, value);
        };
    };

    var isJavaScriptRefNumValid = function (path) {
        return vireo.eggShell.isJavaScriptRefNumValid(vireo.eggShell.findValueRef(viName, path));
    };

    var tryIsJavaScriptRefNumValid = function (path) {
        return function () {
            return isJavaScriptRefNumValid(path);
        };
    };

    var clearJavaScriptRefNum = function (path) {
        return vireo.eggShell.clearJavaScriptRefNum(vireo.eggShell.findValueRef(viName, path));
    };

    var tryClearJavaScriptRefNum = function (path) {
        return function () {
            return clearJavaScriptRefNum(path);
        };
    };

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

    it('throw on unsupported types', function () {
        expect(tryReadJavaScriptRefNum('dataItem_NumericDouble')).toThrowError(/UnexpectedObjectType/);
        expect(tryWriteJavaScriptRefNum('dataItem_NumericDouble', 'hello world')).toThrowError(/UnexpectedObjectType/);
        expect(tryIsJavaScriptRefNumValid('dataItem_NumericDouble')).toThrowError(/UnexpectedObjectType/);
        expect(tryClearJavaScriptRefNum('dataItem_NumericDouble')).toThrowError(/UnexpectedObjectType/);
    });

    describe('use static references', function () {
        it('that are uninitialized', function () {
            expect(tryReadJavaScriptRefNum('jsStatic')).toThrowError(/not been set/);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeFalse();
            expect(tryClearJavaScriptRefNum('jsStatic')).not.toThrow();
            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(0);
        });

        it('that are given a value', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsStatic', testObj);

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();
        });

        it('that are given the same value twice', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsStatic', testObj);

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();

            writeJavaScriptRefNum('jsStatic', testObj);

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();
        });

        it('that are given a value and then cleared', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsStatic', testObj);

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();

            clearJavaScriptRefNum('jsStatic');

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();
        });

        it('that get reassigned the same value', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsStatic', testObj);

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();

            clearJavaScriptRefNum('jsStatic');

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();

            writeJavaScriptRefNum('jsStatic', testObj);

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();
        });

        it('that get reassigned a new value', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsStatic', testObj);

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();

            clearJavaScriptRefNum('jsStatic');

            expect(staticReferencesMapSize()).toBe(1);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();

            var anotherObj = {};
            writeJavaScriptRefNum('jsStatic', anotherObj);

            expect(staticReferencesMapSize()).toBe(2);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(readJavaScriptRefNum('jsStatic')).toBe(anotherObj);
            expect(isJavaScriptRefNumValid('jsStatic')).toBeTrue();
        });

        it('that are give the values null or undefined', function () {
            expect(tryWriteJavaScriptRefNum('jsStatic', null)).toThrowError(/not a valid operation/);
            expect(tryWriteJavaScriptRefNum('jsStatic', undefined)).toThrowError(/not a valid operation/);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(0);
        });
    });

    describe('use dynamic references', function () {
        it('that are uninitialized', function () {
            expect(tryReadJavaScriptRefNum('jsDynamic')).toThrowError(/not been set/);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeFalse();
            expect(tryClearJavaScriptRefNum('jsDynamic')).toThrowError(/InvalidDataPointer/);
            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(0);
        });

        it('that are given a value', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsDynamic', testObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();
        });

        it('that are given the same value twice', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsDynamic', testObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();

            writeJavaScriptRefNum('jsDynamic', testObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(2);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();
        });

        it('that are given a value and then cleared', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsDynamic', testObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();

            clearJavaScriptRefNum('jsDynamic');

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(tryReadJavaScriptRefNum('jsDynamic')).toThrowError(/not been set/);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeFalse();
        });

        it('that are reassigned the same value', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsDynamic', testObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();

            clearJavaScriptRefNum('jsDynamic');

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(tryReadJavaScriptRefNum('jsDynamic')).toThrowError(/not been set/);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeFalse();

            writeJavaScriptRefNum('jsDynamic', testObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();
        });

        it('that are reassigned a different value', function () {
            var testObj = {};
            writeJavaScriptRefNum('jsDynamic', testObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(testObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();

            clearJavaScriptRefNum('jsDynamic');

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(0);
            expect(tryReadJavaScriptRefNum('jsDynamic')).toThrowError(/not been set/);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeFalse();

            var anotherObj = {};
            writeJavaScriptRefNum('jsDynamic', anotherObj);

            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(anotherObj);
            expect(isJavaScriptRefNumValid('jsDynamic')).toBeTrue();
        });

        it('that are give the value null', function () {
            writeJavaScriptRefNum('jsDynamic', null);
            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(null);
        });

        it('that are give the value undefined', function () {
            writeJavaScriptRefNum('jsDynamic', undefined);
            expect(staticReferencesMapSize()).toBe(0);
            expect(dynamicReferencesMapSize()).toBe(1);
            expect(readJavaScriptRefNum('jsDynamic')).toBe(undefined);
        });
    });
});
