// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsAsyncFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/AsyncFunctions.via');
    var test;

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

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    beforeEach(function () {
        test = undefined;
        window.SingleFunction = undefined;
        window.SingleFunctionUnwiredReturn = undefined;
        window.ConcurrentFunction1 = undefined;
        window.ConcurrentFunction2 = undefined;
    });

    afterEach(function () {
        test = undefined;
        window.SingleFunction = undefined;
        window.SingleFunctionUnwiredReturn = undefined;
        window.ConcurrentFunction1 = undefined;
        window.ConcurrentFunction2 = undefined;
    });

    describe('trying to get a jsapi reference results in undefined', function () {
        var jsapiRef;
        beforeEach(function () {
            jsapiRef = 'some value';
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
                expect(jsapiRef).toBeUndefined();
            };
        });
        it('using the completion callback', async function () {
            window.SingleFunction = function (input, jsapi) {
                jsapiRef = jsapi;
                return input * input;
            };
            await test();
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input, jsapi) {
                jsapiRef = jsapi;
                return input * input;
            };
            await test();
        });
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
        it('using promises', async function () {
            window.SingleFunction = async function (input) {
                await delayForTask();
                return input * input;
            };
            await test();
        });
    });

    describe('can start an async task and error as a microtask', function () {
        beforeEach(function () {
            spyOn(console, 'error');
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
                expect(console.error).not.toHaveBeenCalled();
            };
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
            spyOn(console, 'error');
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
                expect(console.error).not.toHaveBeenCalled();
            };
        });
        it('using promises', async function () {
            window.SingleFunction = async function () {
                await delayForTask();
                throw new Error('Failed to run new task');
            };
            await test();
        });
    });

    describe('can start an async task and throw a non-exception value, like a number', function () {
        beforeEach(function () {
            spyOn(console, 'error');
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
                expect(viPathParser('error.source')).toMatch(/8675309/);
                expect(viPathParser('return')).toBe(0);
                expect(console.error).not.toHaveBeenCalled();
            };
        });
        // Not possible with completioncallback as there is not a second code path for errors
        it('using promises', async function () {
            window.SingleFunction = async function () {
                // eslint-disable-next-line no-throw-literal
                throw 8675309;
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
        it('using promises', async function () {
            window.SingleFunctionUnwiredReturn = async function () {
                return undefined;
            };
            await test();
        });
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

    describe('does not include jsapi reference in arguments by default for normal functions', function () {
        var argumentsCount;
        var jsAPIReference;
        beforeEach(function () {
            argumentsCount = 0;
            jsAPIReference = false;
            test = async function () {
                var viName = 'SingleFunction';
                var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsAsyncFunctionsUrl);
                var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
                var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);
                viPathWriter('input', 3);
                vireoRunner.enqueueVI(vireo, viName);

                const {rawPrint, rawPrintError} = await runSlicesAsync();
                expect(argumentsCount).toBe(1);
                expect(jsAPIReference).not.toBeDefined();
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                expect(viPathParser('return')).toBe(9);
            };
        });
        it('using promises', async function () {
            window.SingleFunction = async function (input) {
                argumentsCount = arguments.length;
                jsAPIReference = arguments[1];
                return input * input;
            };
            await test();
        });
    });
});
