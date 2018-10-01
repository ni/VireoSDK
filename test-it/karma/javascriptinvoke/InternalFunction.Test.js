describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsInternalFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/InternalFunctions.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsInternalFunctionsUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    it('internal function works', function (done) {
        var runSlices = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        var called = false;

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                called = true;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlices(function (rawPrint, rawPrintError) {
            expect(called).toBeTrue();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error1.status')).toBeFalse();
            expect(viPathParser('error1.code')).toBe(0);
            expect(viPathParser('error1.source')).toBeEmptyString();
            expect(viPathParser('returnValue1')).toBe(2);
            done();
        });
    });

    it('internal function successfully sets error and return value is unset', function (done) { // TODO
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunctionSetsError: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                jsAPI.setLabVIEWError(true, 777, 'this is the error message');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error2.status')).toBeTrue();
            expect(viPathParser('error2.code')).toBe(777);
            expect(viPathParser('error2.source')).toContain('this is the error message');
            expect(viPathParser('error2.source')).toContain('NI_InternalFunctionSetsError');
            expect(viPathParser('returnValue2')).toBe(12);
            done();
        });
    });

    it('internal function is invoked even when no error cluster is wired', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunctionNoErrorCluster: function (returnValueRef, inputIntegerValueRef) {
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('returnValue3')).toBe(112);
            done();
        });
    });

    it('internal function is invoked even when no error cluster is wired and it sets error', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunctionNoErrorClusterSetsError: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                jsAPI.setLabVIEWError(true, 777, 'this is the error message');
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('returnValue4')).toBe(1112);
            done();
        });
    });

    it('registerInternalFunctions successfully errors if we add non-function', function () {
        expect(function () {
            vireo.javaScriptInvoke.registerInternalFunctions({
                NI_InternalFunctionThatIsNotAFunction: { }
            });
        }).toThrow();
    });

    it('registerInternalFunctions successfully errors if we add a duplicate function', function () {
        expect(function () {
            vireo.javaScriptInvoke.registerInternalFunctions({
                NI_InternalFunctionDuplicate: function () {
                    return 1;
                }
            });
            vireo.javaScriptInvoke.registerInternalFunctions({
                NI_InternalFunctionDuplicate: function () {
                    return 2;
                }
            });
        }).toThrow();
    });
});
