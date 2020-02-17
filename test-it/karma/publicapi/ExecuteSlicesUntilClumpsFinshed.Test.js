// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo EggShell executeSlicesUntilClumpsFinished api', function () {
    'use strict';

    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var publicApiExecuteManyHTTPGetUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ExecuteManyHTTPGet.via');
    var publicApiExecuteLongWaitUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ExecuteLongWait.via');
    var publicApiLargeAllocationUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/LargeAllocations.via');

    var XHRShimResolveImmediatelyAsync = function () {
        var noop = function () {
            // Intentionally blank
        };
        var loadCallback;
        return {
            abort: noop,
            addEventListener: function (name, cb) {
                if (name === 'load') {
                    loadCallback = cb;
                }
            },
            removeEventListener: noop,
            status: 200,
            statusText: 'OK',
            getAllResponseHeaders: function () {
                return '';
            },
            response: new ArrayBuffer(0),
            open: noop,
            setRequestHeader: noop,
            withCredentials: false,
            responseType: 'arraybuffer',
            timeout: 10000,
            send: function () {
                setTimeout(loadCallback, 0);
            }
        };
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiExecuteManyHTTPGetUrl,
            publicApiExecuteLongWaitUrl,
            publicApiLargeAllocationUrl
        ], done);
    });

    // This suite relies on a unique vireo instance per spec
    var vireo;
    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterEach(function () {
        vireo = undefined;
    });

    it('can run many HTTP requests quickly when HTTP is resolved immediately', function (done) {
        var viaCode = fixtures.loadAbsoluteUrl(publicApiExecuteManyHTTPGetUrl);
        vireo.httpClient.setXMLHttpRequestImplementation(XHRShimResolveImmediatelyAsync);
        var result = '';
        vireo.eggShell.setPrintFunction(function (text) {
            result += text + '\n';
        });

        vireo.eggShell.loadVia(viaCode);
        var maxExecWakeUpTime = vireo.eggShell.maxExecWakeUpTime();
        var numIterations = 100;
        var valueRef = vireo.eggShell.findValueRef('MyVI', 'numIterations');
        vireo.eggShell.writeJSON(valueRef, JSON.stringify(numIterations));

        var maxTimewithBuffer = maxExecWakeUpTime * numIterations * 0.5;

        var wakeUpSpy = jasmine.createSpy();
        vireo.eggShell.setExecuteSlicesWakeUpCallback(wakeUpSpy);

        var startTime = performance.now();
        vireo.eggShell.executeSlicesUntilClumpsFinished().then(function () {
            var totalTime = performance.now() - startTime;
            expect(totalTime).toBeLessThan(maxTimewithBuffer);
            expect(result).toBeEmptyString();
            expect(wakeUpSpy.calls.count()).toBeGreaterThanOrEqualTo(numIterations);
            done();
        });
    });

    it('can run executeSlicesUntilWait slowly while performing a long wait', function (done) {
        var viaCode = fixtures.loadAbsoluteUrl(publicApiExecuteLongWaitUrl);
        var result = '';
        vireo.eggShell.setPrintFunction(function (text) {
            result += text + '\n';
        });

        vireo.eggShell.loadVia(viaCode);
        var maxExecWakeUpTime = vireo.eggShell.maxExecWakeUpTime();
        var maxExecuteSlicesCalls = 20;
        var waitTime = maxExecuteSlicesCalls * maxExecWakeUpTime;
        var valueRef = vireo.eggShell.findValueRef('MyVI', 'waitTime');
        vireo.eggShell.writeJSON(valueRef, JSON.stringify(waitTime));

        var internalModule = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired;
        spyOn(internalModule.eggShell, 'executeSlicesUntilWait').and.callThrough();
        var startTime = performance.now();
        vireo.eggShell.executeSlicesUntilClumpsFinished().then(function () {
            var totalTime = performance.now() - startTime;

            expect(result).toBeEmptyString();
            expect(totalTime).toBeNear(waitTime, waitTime * 0.5);
            expect(internalModule.eggShell.executeSlicesUntilWait.calls.count()).toBeNear(maxExecuteSlicesCalls, maxExecuteSlicesCalls * 10);
            done();
        });
    });

    it('reports error when the Vireo runtime stops execution', async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiLargeAllocationUrl);

        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toMatch(/Failed to perform allocation/);
        expect(rawPrintError).toBeEmptyString();
    });
});
