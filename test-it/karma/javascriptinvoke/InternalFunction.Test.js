describe('A JavaScriptInvoke for an internal function', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsInternalFunctionsUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/InternalFunctions.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsInternalFunctionsUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterEach(function () {
        vireo = undefined;
    });

    it('works for the simple case', function (done) {
        var viName = 'NI_InternalFunction';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var called = false;

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                called = true;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(called).toBeTrue();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            expect(viPathParser('returnValue')).toBe(2);
            done();
        });
    });

    it('successfully sets error and return value is unset', function (done) {
        var viName = 'NI_InternalFunctionSetsError';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunctionSetsError: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                jsAPI.setLabVIEWError(true, 777, 'this is the error message');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(777);
            expect(viPathParser('error.source')).toContain('this is the error message');
            expect(viPathParser('error.source')).toContain('NI_InternalFunctionSetsError');
            expect(viPathParser('returnValue')).toBe(12);
            done();
        });
    });

    it('is invoked even when no error cluster is wired', function (done) {
        var viName = 'NI_InternalFunctionNoErrorCluster';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunctionNoErrorCluster: function (returnValueRef, inputIntegerValueRef) {
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('returnValue')).toBe(112);
            done();
        });
    });

    it('is invoked even when no error cluster is wired and it sets error', function (done) {
        var viName = 'NI_InternalFunctionNoErrorClusterSetsError';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunctionNoErrorClusterSetsError: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                jsAPI.setLabVIEWError(true, 777, 'this is the error message');
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('returnValue')).toBe(1112);
            done();
        });
    });

    it('errors if the internal function does not exist', async function () {
        var viName = 'NI_InternalFunction_DoesNotExist';
        var runSlices = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var exception;
        try {
            await runSlices();
        } catch (ex) {
            exception = ex;
        }
        expect(exception instanceof Error).toBeTrue();
        expect(exception.rawPrint).toBeEmptyString();
        expect(exception.rawPrintError).toBeEmptyString();
        expect(exception.message).toMatch(/Unable to find internal JS function/);
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
        expect(viPathParser('returnValue')).toBe(0);
    });

    it('errors if we add non-function using registerInternalFunctions', function () {
        expect(function () {
            vireo.javaScriptInvoke.registerInternalFunctions({
                NI_InternalFunctionThatIsNotAFunction: { }
            });
        }).toThrow();
    });

    it('errors if we add a duplicate function using registerInternalFunctions', function () {
        expect(function () {
            vireo.javaScriptInvoke.registerInternalFunctions({
                NI_InternalFunctionDuplicate: function () {
                    return 1;
                }
            });
            vireo.javaScriptInvoke.registerInternalFunctions({
                NI_InternalFunctionDuplicate: function () {
                    return 2;
                }
            });
        }).toThrow();
    });

    it('errors if returning a value', async function () {
        var viName = 'NI_InternalFunction';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var called = false;

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                jsAPI.getCompletionCallback();
                called = true;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
                return 'some unexpected value';
            }
        });

        var exception;
        try {
            await runSlicesAsync();
        } catch (ex) {
            exception = ex;
        }
        expect(called).toBeTrue();
        expect(exception instanceof Error).toBeTrue();
        expect(exception.rawPrint).toBeEmptyString();
        expect(exception.rawPrintError).toBeEmptyString();
        expect(exception.message).toMatch(/Unexpected return value/);
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
        expect(viPathParser('returnValue')).toBe(2);
    });

    it('errors if starting an async call and returning a value sync', async function () {
        var viName = 'NI_InternalFunction';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var called = false;

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                jsAPI.getCompletionCallback();
                called = true;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
                return 'some unexpected value';
            }
        });

        var exception;
        try {
            await runSlicesAsync();
        } catch (ex) {
            exception = ex;
        }
        expect(called).toBeTrue();
        expect(exception instanceof Error).toBeTrue();
        expect(exception.rawPrint).toBeEmptyString();
        expect(exception.rawPrintError).toBeEmptyString();
        expect(exception.message).toMatch(/Unexpected return value/);
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
        expect(viPathParser('returnValue')).toBe(2);
    });

    it('errors if starting an async call and returning a value async', async function () {
        var viName = 'NI_InternalFunction';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var called = false;
        var complete;
        var waitForError = new Promise(function (resolve) {
            complete = resolve;
        });
        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                var cb = jsAPI.getCompletionCallback();
                called = true;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
                setTimeout(function () {
                    // workaround for vireo completion callback unable to abort runtime https://github.com/ni/VireoSDK/issues/521
                    try {
                        cb('some unexpected value');
                    } catch (ex) {
                        complete(ex);
                    }
                }, 0);
            }
        });
        runSlicesAsync();
        var exception = await waitForError;
        expect(called).toBeTrue();
        expect(exception instanceof Error).toBeTrue();
        expect(exception.message).toMatch(/Unexpected return value/);
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
        expect(viPathParser('returnValue')).toBe(2);
    });

    it('errors if starting an async call with promises and calls getCompletionCallback', async function () {
        var viName = 'NI_InternalFunction';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var called = false;
        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: async function (returnValueRef, inputIntegerValueRef, jsAPI) {
                jsAPI.getCompletionCallback();
                called = true;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
                return 'Unexpected return value';
            }
        });
        var exception;
        try {
            await runSlicesAsync();
        } catch (ex) {
            exception = ex;
        }

        expect(called).toBeTrue();
        expect(exception instanceof Error).toBeTrue();
        expect(exception.message).toMatch(/Promise returned but completionCallback unavailable/);
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
        expect(viPathParser('returnValue')).toBe(2);
    });

    it('includes the jsAPI if explicit in signature for internal functions', function (done) {
        var viName = 'NI_InternalFunction';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var argumentsCount;
        var jsAPIReference;

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: function (returnValueRef, inputIntegerValueRef, jsAPI) {
                argumentsCount = arguments.length;
                jsAPIReference = jsAPI;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(argumentsCount).toBe(3);
            expect(jsAPIReference).toHaveMember('getCompletionCallback');
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            expect(viPathParser('returnValue')).toBe(2);
            done();
        });
    });

    it('still includes the jsAPI even if not explicit in signature for internal functions', function (done) {
        var viName = 'NI_InternalFunction';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsInternalFunctionsUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        var argumentsCount;
        var jsAPIReference;

        vireo.javaScriptInvoke.registerInternalFunctions({
            NI_InternalFunction: function () {
                var returnValueRef = arguments[0];
                var inputIntegerValueRef = arguments[1];
                var jsAPI = arguments[2];
                argumentsCount = arguments.length;
                jsAPIReference = jsAPI;
                jsAPI.setLabVIEWError(false, 0, '');
                var inputInteger = vireo.eggShell.readDouble(inputIntegerValueRef);
                var returnValue = inputInteger + 1;
                vireo.eggShell.writeDouble(returnValueRef, returnValue);
            }
        });

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(argumentsCount).toBe(3);
            expect(jsAPIReference).toHaveMember('getCompletionCallback');
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            expect(viPathParser('returnValue')).toBe(2);
            done();
        });
    });
});
