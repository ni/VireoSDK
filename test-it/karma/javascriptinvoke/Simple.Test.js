// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var kNIUnableToInvokeAJavaScriptFunction = 44300;
    var kNIUnableToFindFunctionForJavaScriptInvoke = 44302;

    var vireo;

    var jsSimpleFunctionViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleFunction.via');
    var jsSimpleScopedFunctionViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleScopedFunction.via');
    var jsFunctionNotFoundViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionNotFound.via');
    var jsFunctionNotFoundInScopeViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionNotFoundInScope.via');
    var jsScopeNotFoundViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ScopeNotFound.via');
    var jsInvalidFunctionNameViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/InvalidFunctionName.via');
    var jsFunctionThatThrowsViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionThatThrows.via');
    var jsFunctionThatThrowsNumbersViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/FunctionThatThrowsNumbers.via');
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
            jsFunctionThatThrowsNumbersViaUrl,
            jsFunctionWithUnsupportedParameterTypeViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    beforeEach(async function () {
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

        window.NI_FunctionThatThrowsNumbers = function () {
            // eslint-disable-next-line no-throw-literal
            throw 8675309;
        };
    });

    afterEach(function () {
        // Cleanup functions
        window.NI_SimpleFunction = undefined;
        window.NI_Scoped = undefined;
        window.NI_FunctionWithInvalidParameterType = undefined;
        window.NI_FunctionThatThrows = undefined;
        window.NI_FunctionThatThrowsNumbers = undefined;
    });

    it('with no parameters succesfully works', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleFunctionViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        spyOn(window, 'NI_SimpleFunction').and.callThrough();

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

        spyOn(window.NI_Scoped, 'NI_SimpleFunction').and.callThrough();

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

    describe('does not log error', function () {
        beforeEach(function () {
            spyOn(console, 'error');
        });

        it('when function throws an exception', function (done) {
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsFunctionThatThrowsViaUrl);
            var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect([kNIUnableToInvokeAJavaScriptFunction]).toContain(viPathParser('error.code'));
                expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
                expect(viPathParser('error.source')).toMatch(/This function throws/);
                expect(console.error).not.toHaveBeenCalled();
                done();
            });
        });

        it('when function throws a non-exception value, like a number', function (done) {
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsFunctionThatThrowsNumbersViaUrl);
            var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect([kNIUnableToInvokeAJavaScriptFunction]).toContain(viPathParser('error.code'));
                expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
                expect(viPathParser('error.source')).toMatch(/8675309/);
                expect(console.error).not.toHaveBeenCalled();
                done();
            });
        });
    });

    it('errors when parameter type is not supported', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsFunctionWithUnsupportedParameterTypeViaUrl);

        var exception;
        try {
            await runSlicesAsync();
        } catch (ex) {
            exception = ex;
        }
        expect(exception.rawPrint).toBeEmptyString();
        expect(exception.rawPrintError).toBeEmptyString();
        expect(exception instanceof Error).toBeTrue();
        expect(exception.message).toMatch(/Visitor must have a method named/);
    });

    describe('with a specific context', function () {
        var simpleScopedFunctionContext = undefined;

        beforeEach(function () {
            window.NI_Scoped = {};
            window.NI_Scoped.NI_SimpleFunction = function () {
                // eslint-disable-next-line consistent-this
                simpleScopedFunctionContext = this;
                return undefined;
            };
        });

        afterEach(function () {
            window.NI_Scoped = undefined;
            simpleScopedFunctionContext = undefined;
        });

        it('with no parameters and within a scope succesfully works', function (done) {
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleScopedFunctionViaUrl);
            var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(simpleScopedFunctionContext).toBe(window.NI_Scoped);
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                done();
            });
        });
    });

    describe('with a null scope value', function () {
        beforeEach(function () {
            window.NI_Scoped = null;
        });

        afterEach(function () {
            window.NI_Scoped = undefined;
        });

        it('with no parameters and within a scope succesfully works', function (done) {
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleScopedFunctionViaUrl);
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
    });
});
