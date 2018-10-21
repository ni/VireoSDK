describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsAsyncFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/AsyncFunctions.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsAsyncFunctionsUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    describe('can start an async task and complete synchronously', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    completionCallback(input * input);
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('can start an async task and complete as a microtask', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    Promise.resolve().then(function () {
                        completionCallback(input * input);
                    });
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('can start an async task and complete as a new task', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    setTimeout(function () {
                        completionCallback(input * input);
                    }, 0);
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('can start an async task and error synchronously', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    jsAPI.getCompletionCallback();
                    throw new Error('Failed to run sync');
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('can start an async task and error as a microtask', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    Promise.resolve().then(function () {
                        completionCallback(new Error('Failed to run microtask'));
                    });
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('can start an async task and error as a new task', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    setTimeout(function () {
                        completionCallback(new Error('Failed to run new task'));
                    }, 0);
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('can return undefined to an unwired return value', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunctionUnwiredReturn = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    completionCallback(undefined);
                };
            });
            afterEach(function () {
                window.SingleFunctionUnwiredReturn = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('errors retrieving completion callback twice', function () {
        describe('using the completion callback', function () {
            var error;

            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    try {
                        jsAPI.getCompletionCallback();
                    } catch (ex) {
                        error = ex;
                    }
                    // TODO mraj this allows completing after an exception is thrown, this should not be allowed.
                    // Instead if we are not resolved we should resolve immediately with an error
                    completionCallback(input * input);
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 7);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(49);
                expect(error.message).toMatch(/retrieved more than once/);
            });
        });
    });

    describe('errors retrieving completion, completing, and trying to retrieve again', function () {
        describe('using the completion callback', function () {
            var error;

            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    completionCallback(input * input);

                    try {
                        jsAPI.getCompletionCallback();
                    } catch (ex) {
                        error = ex;
                    }
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('errors calling completion callback twice', function () {
        describe('using the completion callback', function () {
            var error;

            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();

                    completionCallback(input * input);
                    try {
                        completionCallback(input * input);
                    } catch (ex) {
                        error = ex;
                    }
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('errors after using get completion callback or completing after initial completion', function () {
        describe('using the completion callback', function () {
            var errorSecondCompletion;
            var errorSecondRetrieval;
            var errorThirdCompletion;

            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    var completionCallback = jsAPI.getCompletionCallback();
                    completionCallback(input * input);

                    try {
                        completionCallback(input * input);
                    } catch (ex) {
                        errorSecondCompletion = ex;
                    }

                    try {
                        jsAPI.getCompletionCallback();
                    } catch (ex) {
                        errorSecondRetrieval = ex;
                    }

                    try {
                        completionCallback(input * input);
                    } catch (ex) {
                        errorThirdCompletion = ex;
                    }
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('can have concurrent calls that complete out of order', function () {
        describe('using the completion callback', function () {
            var running;

            beforeEach(function () {
                running = 0;

                window.ConcurrentFunction1 = function (inputInteger, jsAPI) {
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
                };

                window.ConcurrentFunction2 = function (inputInteger, jsAPI) {
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
                };
            });

            afterEach(function () {
                running = 0;
                window.ConcurrentFunction1 = undefined;
                window.ConcurrentFunction2 = undefined;
            });
            it('to do math on different values', async function () {
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
            });
        });
    });

    describe('errors using a stale jsapi reference', function () {
        describe('using the completion callback', function () {
            var jsapiStale;
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    jsapiStale = jsAPI;
                    return input * input;
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('errors using a stale jsapi reference after js function completes with error', function () {
        describe('using the completion callback', function () {
            var jsapiStale;
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    jsapiStale = jsAPI;
                    throw new Error('This function is a failure!');
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('errors using a stale completion callback reference after js function completes with error', function () {
        describe('using the completion callback', function () {
            var completionCallbackStale;
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    completionCallbackStale = jsAPI.getCompletionCallback();
                    throw new Error('Your function errored before completion callback!');
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
            });
        });
    });

    describe('errors returning a value synchronously after retrieving completion callback', function () {
        describe('using the completion callback', function () {
            beforeEach(function () {
                window.SingleFunction = function (input, jsAPI) {
                    jsAPI.getCompletionCallback();
                    return 'unexpected return value';
                };
            });
            afterEach(function () {
                window.SingleFunction = undefined;
            });
            it('to square a value', async function () {
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
                expect(viPathParser('error.code')).toBe(44303);
                expect(viPathParser('error.source')).toMatch(/Unable to set return value/);
                expect(viPathParser('return')).toBe(0);
            });
        });
    });
});
