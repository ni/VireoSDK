// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('A JavaScriptInvoke with a custom global registered', function () {
    'use strict';
    // Reference aliases
    const vireoHelpers = window.vireoHelpers;
    const vireoRunner = window.testHelpers.vireoRunner;
    const fixtures = window.testHelpers.fixtures;

    let vireo;

    const jsSimpleFunctionUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleFunction.via');
    const jsSimpleScopedFunctionUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleScopedFunction.via');

    var kNIUnableToFindFunctionForJavaScriptInvoke = 44302;

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsSimpleFunctionUrl,
            jsSimpleScopedFunctionUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterEach(function () {
        vireo = undefined;
    });

    it('can lookup a simple function', async function () {
        const viName = 'MyVI';
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleFunctionUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        let called = false;

        vireo.javaScriptInvoke.registerCustomGlobal({
            NI_SimpleFunction: function () {
                called = true;
            }
        });

        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(called).toBeTrue();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
    });

    it('can lookup a simple scoped function', async function () {
        const viName = 'MyVI';
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleScopedFunctionUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        let called = false;
        vireo.javaScriptInvoke.registerCustomGlobal({
            NI_Scoped: {
                NI_SimpleFunction: function () {
                    called = true;
                }
            }
        });

        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(called).toBeTrue();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
    });

    describe('with functions of the same name in the global scope', function () {
        let simpleGlobalCalled = false;
        let simpleScopedGlobalCalled = false;
        beforeEach(function () {
            // Add functions to exercise JavaScriptInvoke behavior
            window.NI_SimpleFunction = function () {
                simpleGlobalCalled = true;
            };

            window.NI_Scoped = {};
            window.NI_Scoped.NI_SimpleFunction = function () {
                simpleScopedGlobalCalled = true;
            };
        });
        afterEach(function () {
            window.NI_SimpleFunction = undefined;
            window.NI_Scoped = undefined;
            simpleGlobalCalled = false;
            simpleScopedGlobalCalled = false;
        });

        it('does not call the global for a simple function', async function () {
            const viName = 'MyVI';
            const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleFunctionUrl);
            const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
            vireoRunner.enqueueVI(vireo, viName);

            let called = false;

            vireo.javaScriptInvoke.registerCustomGlobal({
                NI_SimpleFunction: function () {
                    called = true;
                }
            });

            const {rawPrint, rawPrintError} = await runSlicesAsync();
            expect(called).toBeTrue();
            expect(simpleGlobalCalled).toBeFalse();
            expect(simpleScopedGlobalCalled).toBeFalse();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
        });

        it('does not call the global for a simple scoped function', async function () {
            const viName = 'MyVI';
            const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleScopedFunctionUrl);
            const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
            vireoRunner.enqueueVI(vireo, viName);

            let called = false;
            vireo.javaScriptInvoke.registerCustomGlobal({
                NI_Scoped: {
                    NI_SimpleFunction: function () {
                        called = true;
                    }
                }
            });

            const {rawPrint, rawPrintError} = await runSlicesAsync();
            expect(called).toBeTrue();
            expect(simpleGlobalCalled).toBeFalse();
            expect(simpleScopedGlobalCalled).toBeFalse();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
        });

        it('does not fallback to the global for a simple function missing from the custom global and errors', async function () {
            const viName = 'MyVI';
            const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleFunctionUrl);
            const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
            vireoRunner.enqueueVI(vireo, viName);

            vireo.javaScriptInvoke.registerCustomGlobal({});

            const {rawPrint, rawPrintError} = await runSlicesAsync();
            expect(simpleGlobalCalled).toBeFalse();
            expect(simpleScopedGlobalCalled).toBeFalse();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(kNIUnableToFindFunctionForJavaScriptInvoke);
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
        });

        it('does not fall back to the global for a simple scoped function missing from the custom global and errors', async function () {
            const viName = 'MyVI';
            const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleScopedFunctionUrl);
            const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
            vireoRunner.enqueueVI(vireo, viName);

            vireo.javaScriptInvoke.registerCustomGlobal({});

            const {rawPrint, rawPrintError} = await runSlicesAsync();
            expect(simpleGlobalCalled).toBeFalse();
            expect(simpleScopedGlobalCalled).toBeFalse();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(kNIUnableToFindFunctionForJavaScriptInvoke);
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
        });

        it('can fallback to the global with a well crafted custom global for a simple function', async function () {
            const viName = 'MyVI';
            const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleFunctionUrl);
            const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
            vireoRunner.enqueueVI(vireo, viName);

            vireo.javaScriptInvoke.registerCustomGlobal(Object.create(window));

            const {rawPrint, rawPrintError} = await runSlicesAsync();
            expect(simpleGlobalCalled).toBeTrue();
            expect(simpleScopedGlobalCalled).toBeFalse();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
        });

        it('can fallback to the global with a well crafted custom global for a simple scoped function', async function () {
            const viName = 'MyVI';
            const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleScopedFunctionUrl);
            const viPathParser = vireoRunner.createVIPathParser(vireo, viName);
            vireoRunner.enqueueVI(vireo, viName);

            vireo.javaScriptInvoke.registerCustomGlobal(Object.create(window));

            const {rawPrint, rawPrintError} = await runSlicesAsync();
            expect(simpleGlobalCalled).toBeFalse();
            expect(simpleScopedGlobalCalled).toBeTrue();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
        });
    });
});
