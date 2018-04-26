fdescribe('A JavaScript function invoke', function () {
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
            }, 4);
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
                    }, 4);
                });
                return myPromise;
            };
            var completionCallback = this.getCompletionCallback();
            createTimerPromise(inputInteger).then(completionCallback);
        },
        NI_RetrieveCompletionCallbackMoreThanOnceBeforeCallback: function (inputInteger) {
            var completionCallback = this.getCompletionCallback();
            expect(this.getCompletionCallback).toThrowError(/retrieved more than once/);
            completionCallback(inputInteger * inputInteger);
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
        }
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
        Object.keys(javaScriptInvokeFixtures).forEach((functionName) => window[functionName] = undefined);
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

    it('with multiple calls to get completion callback throws error', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'RetrieveCompletionCallbackMoreThanOnce');
        vireo.eggShell.loadVia('enqueue(RetrieveCompletionCallbackMoreThanOnce)');
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            expect(viPathParser('beforeCallbackReturn')).toBe(9);
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
});
