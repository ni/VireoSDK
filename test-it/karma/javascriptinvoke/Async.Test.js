describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsAsyncFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/AsyncFunctions.via');
    var javaScriptInvokeFixtures = {
        NI_AsyncSquareFunction: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            setTimeout(function () {
                completionCallback(inputInteger * inputInteger);
            }, 0);
        },
        NI_CallCompletionCallbackSynchronously: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            completionCallback(inputInteger * inputInteger);
        },
        NI_PromiseBasedAsyncSquareFunction: function (inputInteger) {
            var createTimerPromise = function (input) {
                var myPromise = new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(input * input);
                    }, 0);
                });
                return myPromise;
            };
            var completionCallback = this.getCompletionCallback();
            createTimerPromise(inputInteger).then(completionCallback);
        },
        NI_RetrieveCompletionCallbackMoreThanOnceBeforeCallback: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            expect(this.getCompletionCallback).toThrowError(/retrieved more than once/);
            completionCallback(inputInteger + inputInteger);
        },
        NI_RetrieveCompletionCallbackMoreThanOnceAfterCallback: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            completionCallback(inputInteger * inputInteger);
            expect(this.getCompletionCallback).toThrowError(/retrieved more than once/);
        },
        NI_CallCompletionCallbackMoreThanOnce: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            var testCompletion = function () {
                completionCallback(inputInteger * inputInteger);
            };
            expect(testCompletion).not.toThrowError();
            expect(testCompletion).toThrowError(/invoked more than once for NI_CallCompletionCallbackMoreThanOnce/);
        },
        NI_CallCompletionCallbackMoreThanOnceAfterSecondCallbackRetrieval: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            var testCompletion = function () {
                completionCallback(inputInteger * inputInteger);
            };
            expect(testCompletion).not.toThrowError();
            expect(testCompletion).toThrowError(/invoked more than once for NI_CallCompletionCallbackMoreThanOnceAfterSecondCallbackRetrieval/);
            expect(this.getCompletionCallback).toThrowError(/retrieved more than once/);
            expect(testCompletion).toThrowError(/invoked more than once for NI_CallCompletionCallbackMoreThanOnceAfterSecondCallbackRetrieval/);
        },
        NI_CompletionCallbackReturnsUndefined: function () {
            var completionCallback = this.getCompletionCallback();
            var testCompletion = function () {
                completionCallback(undefined);
            };
            expect(testCompletion).not.toThrowError();
        },
        NI_CallCompletionCallbackAcrossClumps_DoubleFunction: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            javaScriptInvokeFixtures.running = 1;
            var firstClumpCompletionCallback = function () {
                if (javaScriptInvokeFixtures.running === 2) {
                    completionCallback(inputInteger + inputInteger);
                    javaScriptInvokeFixtures.running = 1;
                } else {
                    setTimeout(firstClumpCompletionCallback);
                }
            };
            firstClumpCompletionCallback();
        },
        NI_CallCompletionCallbackAcrossClumps_SquareFunction: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            var secondClumpCompletionCallback = function () {
                if (javaScriptInvokeFixtures.running === 1) {
                    completionCallback(inputInteger * inputInteger);
                    javaScriptInvokeFixtures.running = 2;
                } else {
                    setTimeout(secondClumpCompletionCallback);
                }
            };
            secondClumpCompletionCallback();
        },
        NI_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution: function (inputInteger) {
            javaScriptInvokeFixtures.CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution = this;
            return inputInteger * inputInteger;
        },
        NI_RetrieveCompletionCallbackAfterContextIsStaleFromError: function () {
            javaScriptInvokeFixtures.CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError = this;
            throw new Error('This function is a failure!');
        },
        NI_CallCompletionCallbackAfterFunctionErrors: function () {
            javaScriptInvokeFixtures.NI_CallCompletionCallbackAfterFunctionErrors_Callback = this.getCompletionCallback();
            throw new Error('Your function call just failed!');
        },
        running: 0
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsAsyncFunctionsUrl
        ], done);
        Object.assign(window, javaScriptInvokeFixtures);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    afterAll(function () {
        Object.keys(javaScriptInvokeFixtures).forEach((functionName) => (window[functionName] = undefined));
        javaScriptInvokeFixtures.CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution = undefined;
        javaScriptInvokeFixtures.CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError = undefined;
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
            expect(javaScriptInvokeFixtures.CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution.getCompletionCallback)
                .toThrowError(/The context that is being accessed for NI_RetrieveCompletionCallbackAfterContextIsStaleFromSynchronousExecution is not valid anymore/);
            expect(viPathParser('return')).toBe(36);
            done();
        });
    });

    it('with completion callback retrieval when context is stale after function errors throws error', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        vireo.eggShell.loadVia('enqueue(RetrieveCompletionCallbackAfterContextIsStaleFromError)');
        runSlicesAsync(function () {
            expect(javaScriptInvokeFixtures.CachedContextFor_RetrieveCompletionCallbackAfterContextIsStaleFromError.getCompletionCallback)
                .toThrowError(/The context that is being accessed for NI_RetrieveCompletionCallbackAfterContextIsStaleFromError is not valid anymore/);
            done();
        });
    });

    it('with call to completion callback when context is stale after the function errors', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        vireo.eggShell.loadVia('enqueue(CallCompletionCallbackAfterFunctionErrors)');
        runSlicesAsync(function () {
            expect(javaScriptInvokeFixtures.NI_CallCompletionCallbackAfterFunctionErrors_Callback)
                .toThrowError(/NI_CallCompletionCallbackAfterFunctionErrors threw an error, so this callback cannot be invoked/);
            done();
        });
    });
});
