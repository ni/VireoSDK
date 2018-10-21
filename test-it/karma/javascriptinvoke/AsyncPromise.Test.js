xdescribe('A JavaScript function invoke relying on async using Promises', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsAsyncFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/AsyncFunctions.via');

    var javaScriptInvokeFixtures;
    var CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution;
    var CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError;
    var running;

    var sleep = function (ms) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, typeof ms === 'number' ? ms : 0);
        });
    };

    beforeAll(function () {
        javaScriptInvokeFixtures = Object.freeze({
            NI_AsyncSquareFunction: async function (inputInteger) {
                await sleep();
                return inputInteger * inputInteger;
            },
            NI_CallCompletionCallbackSynchronously: async function (inputInteger) {
                return inputInteger * inputInteger;
            },
            NI_PromiseBasedAsyncSquareFunction: function (inputInteger) {
                return sleep().then(() => inputInteger * inputInteger);
            },
            NI_RetrieveCompletionCallbackMoreThanOnceBeforeCallback: async function (inputInteger, jsAPI) {
                await sleep();
                expect(jsAPI.getCompletionCallback).toThrowError(/retrieved more than once/);
                return inputInteger + inputInteger;
            },
            NI_RetrieveCompletionCallbackMoreThanOnceAfterCallback: async function (inputInteger, jsAPI) {
                setTimeout(function () {
                    expect(jsAPI.getCompletionCallback).toThrowError(/The API being accessed for NI_RetrieveCompletionCallbackMoreThanOnceAfterCallback is not valid anymore./);
                }, 0);
                return inputInteger * inputInteger;
            },
            // TODO need to bring this test over
            NI_CompletionCallbackReturnsUndefined: function (inputInteger, jsAPI) {
                var completionCallback = jsAPI.getCompletionCallback();
                var testCompletion = function () {
                    completionCallback(undefined);
                };
                expect(testCompletion).not.toThrowError();
            },
            NI_CallCompletionCallbackAcrossClumps_DoubleFunction: async function (inputInteger) {
                running = 1;

                await new Promise(function (resolve) {
                    (function waitForTwo () {
                        if (running === 2) {
                            running = 1;
                            resolve();
                        } else {
                            setTimeout(waitForTwo, 0);
                        }
                    }());
                });
                return inputInteger + inputInteger;
            },
            NI_CallCompletionCallbackAcrossClumps_SquareFunction: async function (inputInteger) {
                await new Promise(function (resolve) {
                    (function waitForOne () {
                        if (running === 1) {
                            running = 2;
                            resolve();
                        } else {
                            setTimeout(waitForOne, 0);
                        }
                    }());
                });
                return inputInteger * inputInteger;
            },
            NI_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution: async function (inputInteger, jsAPI) {
                CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution = jsAPI;
                return inputInteger * inputInteger;
            },
            NI_RetrieveCompletionCallbackAfterContextIsStaleFromError: async function (inputInteger, jsAPI) {
                CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError = jsAPI;
                throw new Error('This function is a failure!');
            },
            NI_StartAsync_ReturnValueSync_Errors: async function (jsAPI) {
                jsAPI.getCompletionCallback();
                return undefined;
            },
            NI_ResolveAsyncWithError: async function () {
                throw new Error('An async error occurred');
            }
        });

        CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution = undefined;
        CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError = undefined;
        running = 0;
    });

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsAsyncFunctionsUrl
        ], done);
        Object.assign(window, javaScriptInvokeFixtures);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        Object.keys(javaScriptInvokeFixtures).forEach(function (functionName) {
            window[functionName] = undefined;
        });
        CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution = undefined;
        CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError = undefined;
        running = 0;
    });

    it('with async callback successfully works', function (done) {
        var viName = 'ValidCases';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            expect(viPathParser('return')).toBe(4);
            expect(viPathParser('returnSynchronousCompletionCallback')).toBe(9);
            expect(viPathParser('returnPromiseBasedCall')).toBe(16);
            done();
        });
    });

    it('with multiple completion callback retrievals throws error', function (done) {
        var viName = 'RetrieveCompletionCallbackMoreThanOnce';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            expect(viPathParser('beforeCallbackReturn')).toBe(6);
            expect(viPathParser('afterCallbackReturn')).toBe(25);
            done();
        });
    });

    it('with completion callbacks called out of order', function (done) {
        var viName = 'CallCompletionCallbackAcrossClumps';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            expect(viPathParser('acrossClumpsReturn1')).toBe(6);
            expect(viPathParser('acrossClumpsReturn2')).toBe(25);
            done();
        });
    });

    it('with completion callback retrieval when context is stale after to synchronous execution throws error', function (done) {
        var viName = 'RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function () {
            expect(CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution.getCompletionCallback)
                .toThrowError(/The API being accessed for NI_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution is not valid anymore/);
            expect(viPathParser('return')).toBe(36);
            done();
        });
    });

    it('with completion callback retrieval when context is stale after function errors throws error', function (done) {
        var viName = 'RetrieveCompletionCallbackAfterContextIsStaleFromError';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function () {
            expect(CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError.getCompletionCallback)
                .toThrowError(/The API being accessed for NI_RetrieveCompletionCallbackAfterContextIsStaleFromError is not valid anymore/);
            done();
        });
    });

    // TODO this causes the runtime to crash. We don't want user code to ever crash the runtime
    xit('with call to completion callback, followed by returning a value, causes an error', function (done) {
        var viName = 'NI_StartAsync_ReturnValueSync_Errors';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(44303);
            expect(viPathParser('error.source')).toMatch(/Unable to set return value/);
            done();
        });
    });

    it('resolves to an error asynchronously', function (done) {
        var viName = 'NI_ResolveAsyncWithError';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(44300);
            expect(viPathParser('error.source')).toMatch(/An exception occurred within the external JavaScript function/);
            done();
        });
    });
});
