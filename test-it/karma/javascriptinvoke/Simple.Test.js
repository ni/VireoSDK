describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var kNIUnableToInvokeAJavaScriptFunction = 44300;
    var kNIUnsupportedParameterTypeInJavaScriptInvoke = 44301;
    var kNIUnableToFindFunctionForJavaScriptInvoke = 44302;

    var vireo;

    var jsSimpleFunctionViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleFunction.via');
    var jsSimpleScopedFunctionViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleScopedFunction.via');
    var jsFunctionNotFoundViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionNotFound.via');
    var jsFunctionNotFoundInScopeViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionNotFoundInScope.via');
    var jsScopeNotFoundViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ScopeNotFound.via');
    var jsInvalidFunctionNameViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/InvalidFunctionName.via');
    var jsFunctionThatThrowsViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionThatThrows.via');
    var jsFunctionWithUnsupportedParameterTypeViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionWithUnsupportedParameterType.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsSimpleFunctionViaUrl,
            jsSimpleScopedFunctionViaUrl,
            jsFunctionNotFoundViaUrl,
            jsFunctionNotFoundInScopeViaUrl,
            jsScopeNotFoundViaUrl,
            jsInvalidFunctionNameViaUrl,
            jsFunctionThatThrowsViaUrl,
            jsFunctionWithUnsupportedParameterTypeViaUrl
        ], done);
    });

    beforeEach(function () {
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();

        // Add functions to exercise JavaScriptInvoke behavior
        window.NI_SimpleFunction = function () {
            return undefined;
        };

        window.NI_Scoped = {};
        window.NI_Scoped.NI_SimpleFunction = function () {
            return undefined;
        };

        window.NI_FunctionWithInvalidParameterType = function () {
            return undefined;
        };

        window.NI_FunctionThatThrows = function () {
            throw new Error('This function throws');
        };
    });

    afterEach(function () {
        // Cleanup functions
        window.NI_SimpleFunction = undefined;
        window.NI_FunctionThatThrows = undefined;
        window.NI_FunctionWithInvalidParameterType = undefined;
    });

    it('with no parameters succesfully works', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleFunctionViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        spyOn(window, 'NI_SimpleFunction');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(window.NI_SimpleFunction).toHaveBeenCalled();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with no parameters and within a scope succesfully works', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleScopedFunctionViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        spyOn(window.NI_Scoped, 'NI_SimpleFunction');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(window.NI_Scoped.NI_SimpleFunction).toHaveBeenCalled();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('errors when function not found', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsFunctionNotFoundViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNIUnableToFindFunctionForJavaScriptInvoke]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });

    it('errors when function not found in scope', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsFunctionNotFoundInScopeViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNIUnableToFindFunctionForJavaScriptInvoke]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });

    it('errors when scope not found', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsScopeNotFoundViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNIUnableToFindFunctionForJavaScriptInvoke]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });

    it('errors with invalid function name', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInvalidFunctionNameViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNIUnableToFindFunctionForJavaScriptInvoke]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });

    it('errors when function throws an exception', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsFunctionThatThrowsViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNIUnableToInvokeAJavaScriptFunction]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });

    it('errors when parameter type is not supported', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsFunctionWithUnsupportedParameterTypeViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNIUnsupportedParameterTypeInJavaScriptInvoke]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });
});
