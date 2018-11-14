describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsAsyncFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/AsyncFunctions.via');
    var test;
    var error;

    var delayForTask = function () {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, 0);
        });
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsAsyncFunctionsUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    beforeEach(function () {
        test = undefined;
        error = undefined;
        window.SingleFunction = undefined;
        window.SingleFunctionUnwiredReturn = undefined;
        window.ConcurrentFunction1 = undefined;
        window.ConcurrentFunction2 = undefined;
    });

    afterEach(function () {
        test = undefined;
        error = undefined;
        window.SingleFunction = undefined;
        window.SingleFunctionUnwiredReturn = undefined;
        window.ConcurrentFunction1 = undefined;
        window.ConcurrentFunction2 = undefined;
    });

    describe('can start an async task and complete synchronously', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 2);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(4);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                completionCallback(input * input);
            };
            await test();
        });
        // This test is not possible with Promises
    });

    describe('can start an async task and complete as a microtask', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 3);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(9);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                Promise.resolve().then(function () {
                    completionCallback(input * input);
                });
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input) {
                return input * input;
            };
            await test();
        });
    });

    describe('can start an async task and complete as a new task', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 4);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(16);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                setTimeout(function () {
                    completionCallback(input * input);
                }, 0);
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input) {
                await delayForTask();
                return input * input;
            };
            await test();
        });
    });

    describe('can start an async task and error synchronously', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 2);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44300);
                expect(viPathParser('error.source')).toMatch(/Failed to run sync/);
                expect(viPathParser('return')).toBe(0);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                jsapi.getCompletionCallback();
                throw new Error('Failed to run sync');
            };
            await test();
        });
        // This test is not possible with Promises
    });

    describe('can start an async task and error as a microtask', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 3);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44300);
                expect(viPathParser('error.source')).toMatch(/Failed to run microtask/);
                expect(viPathParser('return')).toBe(0);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                Promise.resolve().then(function () {
                    completionCallback(new Error('Failed to run microtask'));
                });
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function () {
                throw new Error('Failed to run microtask');
            };
            await test();
        });
    });

    describe('can start an async task and error as a new task', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 4);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44300);
                expect(viPathParser('error.source')).toMatch(/Failed to run new task/);
                expect(viPathParser('return')).toBe(0);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                setTimeout(function () {
                    completionCallback(new Error('Failed to run new task'));
                }, 0);
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function () {
                await delayForTask();
                throw new Error('Failed to run new task');
            };
            await test();
        });
    });

    describe('can return undefined to an unwired return value', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunctionUnwiredReturn';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 4);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunctionUnwiredReturn = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                completionCallback(undefined);
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunctionUnwiredReturn = async function () {
                return undefined;
            };
            await test();
        });
    });

    describe('errors retrieving completion callback twice', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 7);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44300);
                expect(viPathParser('error.source')).toMatch(/retrieved more than once/);
                expect(viPathParser('return')).toBe(49);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                jsapi.getCompletionCallback();
                // TODO mraj this allows completing after an exception is thrown, this should not be allowed.
                // Instead if we are not resolved we should resolve immediately with an error
                completionCallback(input * input);
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input, jsapi) {
                // By returning a promise the first implicit call happens
                await delayForTask();
                try {
                    jsapi.getCompletionCallback();
                } catch (ex) {
                    error = ex;
                }
                // TODO mraj this allows completing after an exception is thrown, this should not be allowed.
                // Instead if we are not resolved we should resolve immediately with an error
                return input * input;
            };
            await test();
        });
    });

    describe('errors retrieving completion, completing, and trying to retrieve again', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 8);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(64);
                expect(error.message).toMatch(/not valid anymore/);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                completionCallback(input * input);

                try {
                    jsapi.getCompletionCallback();
                } catch (ex) {
                    error = ex;
                }
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input, jsapi) {
                // By returning a promise the first implicit call happens
                this.setTimeout(function () {
                    try {
                        jsapi.getCompletionCallback();
                    } catch (ex) {
                        error = ex;
                    }
                }, 0);
                return input * input;
            };
            await test();
        });
    });

    describe('errors calling completion callback twice', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 8);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(64);
                expect(error.message).toMatch(/invoked more than once/);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();

                completionCallback(input * input);
                try {
                    completionCallback(input * input);
                } catch (ex) {
                    error = ex;
                }
            };
            await test();
        });
        // This test is not possible with Promises
    });

    describe('errors after using get completion callback or completing after initial completion', function () {
        var errorSecondCompletion;
        var errorSecondRetrieval;
        var errorThirdCompletion;

        beforeEach(function () {
            errorSecondCompletion = errorSecondRetrieval = errorThirdCompletion = undefined;
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 8);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(64);
                expect(errorSecondCompletion.message).toMatch(/invoked more than once/);
                expect(errorSecondRetrieval.message).toMatch(/is not valid anymore/);
                expect(errorThirdCompletion.message).toMatch(/invoked more than once/);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                completionCallback(input * input);

                try {
                    completionCallback(input * input);
                } catch (ex) {
                    errorSecondCompletion = ex;
                }

                try {
                    jsapi.getCompletionCallback();
                } catch (ex) {
                    errorSecondRetrieval = ex;
                }

                try {
                    completionCallback(input * input);
                } catch (ex) {
                    errorThirdCompletion = ex;
                }
            };
            await test();
        });
        // This test is not possible with Promises
    });

    describe('can have concurrent calls that complete out of order', function () {
        var resolve1, task1;
        var resolve2, task2;
        beforeEach(function () {
            resolve1 = task1 = undefined;
            resolve2 = task2 = undefined;
            window.ConcurrentFunction1 = undefined;
            window.ConcurrentFunction2 = undefined;
            task1 = new Promise(function (resolve) {
                resolve1 = resolve;
            });
            task2 = new Promise(function (resolve) {
                resolve2 = resolve;
            });
            test = async function () {
                var viName = 'ConcurrentFunctions';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input1', 3);
                viPathWriter('input2', 5);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return1')).toBe(6);
                expect(viPathParser('return2')).toBe(25);
            };
        });
        afterEach(function () {
            window.ConcurrentFunction1 = undefined;
            window.ConcurrentFunction2 = undefined;
        });
        it('using the completion callback', async function () {
            window.ConcurrentFunction1 = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                resolve1();
                task2.then(function () {
                    completionCallback(input + input);
                });
            };
            window.ConcurrentFunction2 = function (input, jsapi) {
                var completionCallback = jsapi.getCompletionCallback();
                task1.then(function () {
                    resolve2();
                    completionCallback(input * input);
                });
            };
            await test();
        });
        it('using promises', async function () {
            window.ConcurrentFunction1 = async function (input) {
                resolve1();
                await task2;
                return input + input;
            };
            window.ConcurrentFunction2 = async function (input) {
                await task1;
                resolve2();
                return input * input;
            };
            await test();
        });
    });

    describe('errors using a stale jsapi reference', function () {
        var jsapiStale;
        beforeEach(function () {
            jsapiStale = undefined;
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 6);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(36);
                expect(jsapiStale.getCompletionCallback).toThrowError(/not valid anymore/);
            };
        });
        it('using synchronous functions', async function () {
            window.SingleFunction = function (input, jsapi) {
                jsapiStale = jsapi;
                return input * input;
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input, jsapi) {
                jsapiStale = jsapi;
                return input * input;
            };
            await test();
        });
    });

    describe('errors using a stale jsapi reference after js function completes with error', function () {
        var jsapiStale;
        beforeEach(function () {
            jsapiStale = undefined;
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 6);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44300);
                expect(viPathParser('error.source')).toMatch(/This function is a failure!/);
                expect(viPathParser('return')).toBe(0);
                expect(jsapiStale.getCompletionCallback).toThrowError(/not valid anymore/);
            };
        });
        it('using the synchronous functions', async function () {
            window.SingleFunction = function (input, jsapi) {
                jsapiStale = jsapi;
                throw new Error('This function is a failure!');
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input, jsapi) {
                jsapiStale = jsapi;
                throw new Error('This function is a failure!');
            };
            await test();
        });
    });

    describe('errors using a stale completion callback reference after js function completes with error', function () {
        var completionCallbackStale;
        beforeEach(function () {
            completionCallbackStale = undefined;
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 6);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44300);
                expect(viPathParser('error.source')).toMatch(/Your function errored before completion callback!/);
                expect(viPathParser('return')).toBe(0);
                expect(completionCallbackStale).toThrowError(/callback cannot be invoked/);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                completionCallbackStale = jsapi.getCompletionCallback();
                throw new Error('Your function errored before completion callback!');
            };
            await test();
        });
        // This test is not possible with Promises
    });

    describe('errors returning a value synchronously after retrieving completion callback', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 6);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44308);
                expect(viPathParser('error.source')).toMatch(/after call to getCompletionCallback/);
                expect(viPathParser('return')).toBe(0);
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                jsapi.getCompletionCallback();
                return 'unexpected return value';
            };
            await test();
        });
        // This test is not possible with Promises
    });

    describe('errors if getCompletionCallback was used when returning a promise', function () {
        beforeEach(function () {
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 2);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(44307);
                expect(viPathParser('error.source')).toMatch(/Unable to use Promise/);
                expect(viPathParser('return')).toBe(0);
            };
        });
        // This test is not possible with completion callbacks
        it('using promises', async function () {
            window.SingleFunction = async function (input, jsapi) {
                jsapi.getCompletionCallback();
                return input * input;
            };
            await test();
        });
    });
});
