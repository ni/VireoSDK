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
            NI_InternalFunction: function (inputInteger, jsAPI) {
                called = true;
                jsAPI.setLabVIEWError(false, 0, '');
                return inputInteger + 1;
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

    it('internal function successfully sets error and return value is unset', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunctionSetsError: function (inputInteger, jsAPI) {
                jsAPI.setLabVIEWError(true, 777, 'this is the error message');
                return inputInteger + 1;
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error2.status')).toBeTrue();
            expect(viPathParser('error2.code')).toBe(777);
            expect(viPathParser('error2.source')).toContain('this is the error message');
            expect(viPathParser('returnValue2')).toBe(12);
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
