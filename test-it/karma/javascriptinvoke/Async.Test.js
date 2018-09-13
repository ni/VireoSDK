describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsAsyncFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/AsyncFunctions.via');
    var running = 0;
    var CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution;
    var CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError;
    var NI_CallCompletionCallbackAfterFunctionErrors_Callback;

    var javaScriptInvokeFixtures = Object.freeze({
        NI_AsyncSquareFunction: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            setTimeout(function () {
                completionCallback(inputInteger * inputInteger);
            }, 0);
        },
        NI_CallCompletionCallbackSynchronously: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            completionCallback(inputInteger * inputInteger);
        },
        NI_PromiseBasedAsyncSquareFunction: function (inputInteger, jsAPI) {
            var createTimerPromise = function (input) {
                var myPromise = new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(input * input);
                    }, 0);
                });
                return myPromise;
            };
            var completionCallback = jsAPI.getCompletionCallback();
            createTimerPromise(inputInteger).then(completionCallback);
        },
        NI_RetrieveCompletionCallbackMoreThanOnceBeforeCallback: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            expect(jsAPI.getCompletionCallback).toThrowError(/retrieved more than once/);
            completionCallback(inputInteger + inputInteger);
        },
        NI_RetrieveCompletionCallbackMoreThanOnceAfterCallback: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            completionCallback(inputInteger * inputInteger);
            expect(jsAPI.getCompletionCallback).toThrowError(/The API being accessed for NI_RetrieveCompletionCallbackMoreThanOnceAfterCallback is not valid anymore./);
        },
        NI_CallCompletionCallbackMoreThanOnce: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            var testCompletion = function () {
                completionCallback(inputInteger * inputInteger);
            };
            expect(testCompletion).not.toThrowError();
            expect(testCompletion).toThrowError(/invoked more than once for NI_CallCompletionCallbackMoreThanOnce/);
        },
        NI_CallCompletionCallbackMoreThanOnceAfterSecondCallbackRetrieval: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            var testCompletion = function () {
                completionCallback(inputInteger * inputInteger);
            };
            expect(testCompletion).not.toThrowError();
            expect(testCompletion).toThrowError(/invoked more than once for NI_CallCompletionCallbackMoreThanOnceAfterSecondCallbackRetrieval/);
            expect(jsAPI.getCompletionCallback).toThrowError(/The API being accessed for NI_CallCompletionCallbackMoreThanOnceAfterSecondCallbackRetrieval is not valid anymore./);
            expect(testCompletion).toThrowError(/invoked more than once for NI_CallCompletionCallbackMoreThanOnceAfterSecondCallbackRetrieval/);
        },
        NI_CompletionCallbackReturnsUndefined: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            var testCompletion = function () {
                completionCallback(undefined);
            };
            expect(testCompletion).not.toThrowError();
        },
        NI_CallCompletionCallbackAcrossClumps_DoubleFunction: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            running = 1;
            var firstClumpCompletionCallback = function () {
                if (running === 2) {
                    completionCallback(inputInteger + inputInteger);
                    running = 1;
                } else {
                    setTimeout(firstClumpCompletionCallback);
                }
            };
            firstClumpCompletionCallback();
        },
        NI_CallCompletionCallbackAcrossClumps_SquareFunction: function (inputInteger, jsAPI) {
            var completionCallback = jsAPI.getCompletionCallback();
            var secondClumpCompletionCallback = function () {
                if (running === 1) {
                    completionCallback(inputInteger * inputInteger);
                    running = 2;
                } else {
                    setTimeout(secondClumpCompletionCallback);
                }
            };
            secondClumpCompletionCallback();
        },
        NI_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution: function (inputInteger, jsAPI) {
            CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution = jsAPI;
            return inputInteger * inputInteger;
        },
        NI_RetrieveCompletionCallbackAfterContextIsStaleFromError: function (inputInteger, jsAPI) {
            CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError = jsAPI;
            throw new Error('This function is a failure!');
        },
        NI_CallCompletionCallbackAfterFunctionErrors: function (inputInteger, jsAPI) {
            NI_CallCompletionCallbackAfterFunctionErrors_Callback = jsAPI.getCompletionCallback();
            throw new Error('Your function call just failed!');
        }
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
        NI_CallCompletionCallbackAfterFunctionErrors_Callback = undefined;
        running = 0;
    });

    it('with async callback successfully works', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'ValidCases');
        vireo.eggShell.loadVia('enqueue(ValidCases)');
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'RetrieveCompletionCallbackMoreThanOnce');
        vireo.eggShell.loadVia('enqueue(RetrieveCompletionCallbackMoreThanOnce)');
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

    it('with multiple calls to completion callback throws error', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'CallCompletionCallbackMoreThanOnce');
        vireo.eggShell.loadVia('enqueue(CallCompletionCallbackMoreThanOnce)');
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with completion callbacks called out of order', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'CallCompletionCallbackAcrossClumps');
        vireo.eggShell.loadVia('enqueue(CallCompletionCallbackAcrossClumps)');
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution');
        vireo.eggShell.loadVia('enqueue(RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution)');
        runSlicesAsync(function () {
            expect(CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution.getCompletionCallback)
                .toThrowError(/The API being accessed for NI_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution is not valid anymore/);
            expect(viPathParser('return')).toBe(36);
            done();
        });
    });

    it('with completion callback retrieval when context is stale after function errors throws error', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        vireo.eggShell.loadVia('enqueue(RetrieveCompletionCallbackAfterContextIsStaleFromError)');
        runSlicesAsync(function () {
            expect(CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError.getCompletionCallback)
                .toThrowError(/The API being accessed for NI_RetrieveCompletionCallbackAfterContextIsStaleFromError is not valid anymore/);
            done();
        });
    });

    it('with call to completion callback when context is stale after the function errors', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        vireo.eggShell.loadVia('enqueue(CallCompletionCallbackAfterFunctionErrors)');
        runSlicesAsync(function () {
            expect(NI_CallCompletionCallbackAfterFunctionErrors_Callback)
                .toThrowError(/NI_CallCompletionCallbackAfterFunctionErrors threw an error, so this callback cannot be invoked/);
            done();
        });
    });
});
