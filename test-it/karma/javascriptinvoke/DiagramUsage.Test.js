// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('JavaScriptInvoke calls', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsObjectTypeViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ObjectType.via');

    var jsObjectMap = new Map(); // to share javascript objects for JavaScriptStaticRefNum and JavaScriptDynamicRefNum types. <key,value>=<uniquifier, jsObject>
    var getObjectByName = function (name) {
        var existingObject = jsObjectMap.get(name);
        if (existingObject === undefined) {
            var newObject = {};
            newObject.name = name;
            newObject.getLengthOfName = function () {
                return this.name.length;
            };
            jsObjectMap.set(name, newObject);
            return newObject;
        }
        return existingObject;
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsObjectTypeViaUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterEach(function () {
        vireo = undefined;
    });

    beforeEach(function () {
        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_GetObjectFunction: function (returnValueRef, nameValueRef) {
                var name = vireo.eggShell.readString(nameValueRef);
                var objectToWrite = getObjectByName(name);
                vireo.eggShell.writeJavaScriptRefNum(returnValueRef, objectToWrite);
                return;
            }
        });

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_UseObjectFunction: function (returnValueRef, myObjectValueRef) {
                var myObject, length;
                if (vireo.eggShell.isJavaScriptRefNumValid(myObjectValueRef)) {
                    myObject = vireo.eggShell.readJavaScriptRefNum(myObjectValueRef);
                    length = myObject.getLengthOfName();
                } else {
                    length = -1;
                }
                vireo.eggShell.writeDouble(returnValueRef, length);
            }
        });

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_GetPrimitiveFunction: function (returnValueRef) {
                vireo.eggShell.writeJavaScriptRefNum(returnValueRef, 'foo');
            },
            NI_GetNullFunction: function (returnValueRef) {
                vireo.eggShell.writeJavaScriptRefNum(returnValueRef, null);
            },
            NI_GetUndefinedFunction: function (returnValueRef) {
                vireo.eggShell.writeJavaScriptRefNum(returnValueRef, undefined);
            }
        });
    });

    it('can be used with primitives such as IsEQ, IsNE, and IsNotANumPathRefnum ', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsObjectTypeViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error1.status')).toBeFalse();
            expect(viPathParser('error1.code')).toBe(0);
            expect(viPathParser('error1.source')).toBeEmptyString();
            expect(viPathParser('error2.status')).toBeFalse();
            expect(viPathParser('error2.code')).toBe(0);
            expect(viPathParser('error2.source')).toBeEmptyString();
            expect(viPathParser('error3.status')).toBeFalse();
            expect(viPathParser('error3.code')).toBe(0);
            expect(viPathParser('error3.source')).toBeEmptyString();
            expect(viPathParser('error4.status')).toBeFalse();
            expect(viPathParser('error4.code')).toBe(0);
            expect(viPathParser('error4.source')).toBeEmptyString();
            expect(viPathParser('length1')).toBe(3);
            expect(viPathParser('length2')).toBe(6);
            expect(viPathParser('isEqual')).toBeFalse();
            expect(viPathParser('isNotEqual')).toBeTrue();
            expect(viPathParser('isNotANumPathRefnum1')).toBeFalse();
            expect(viPathParser('isNotANumPathRefnum2')).toBeFalse();
            expect(viPathParser('error5.code')).toBe(0);
            expect(viPathParser('error5.status')).toBeFalse();
            expect(viPathParser('error5.source')).toBeEmptyString();
            expect(viPathParser('isSharedStaticRef')).toBeTrue();
            expect(viPathParser('isSharedDynamicRef')).toBeFalse();
            expect(viPathParser('isSharedPrimRef')).toBeFalse();
            expect(viPathParser('isSharedNullRef')).toBeFalse();
            expect(viPathParser('isSharedUndefinedRef')).toBeFalse();
            expect(viPathParser('error6.code')).toBe(0);
            expect(viPathParser('error6.status')).toBeFalse();
            expect(viPathParser('error6.source')).toBeEmptyString();
            expect(viPathParser('error7.code')).toBe(0);
            expect(viPathParser('error7.status')).toBeFalse();
            expect(viPathParser('error7.source')).toBeEmptyString();
            expect(viPathParser('isNotANumPathRefnum3')).toBeTrue();
            expect(viPathParser('isNotANumPathRefnum4')).toBeTrue();
            expect(viPathParser('error8.code')).toBe(0);
            expect(viPathParser('error8.status')).toBeFalse();
            expect(viPathParser('error8.source')).toBeEmptyString();
            expect(viPathParser('error9.code')).toBe(0);
            expect(viPathParser('error9.status')).toBeFalse();
            expect(viPathParser('error9.source')).toBeEmptyString();
            expect(viPathParser('length3')).toBe(-1);
            expect(viPathParser('error10.code')).toBe(0);
            expect(viPathParser('error10.status')).toBeFalse();
            expect(viPathParser('error10.source')).toBeEmptyString();
            expect(viPathParser('error11.code')).toBe(0);
            expect(viPathParser('error11.status')).toBeFalse();
            expect(viPathParser('error11.source')).toBeEmptyString();
            done();
        });
    });
});
