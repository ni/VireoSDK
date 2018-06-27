describe('The Vireo EggShell executeSlicesUntilClumpsFinished api', function () {
    'use strict';

    var fixtures = window.testHelpers.fixtures;
    var publicApiExecuteManyHTTPGetUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ExecuteManyHTTPGet.via');
    var publicApiExecuteLongWaitUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ExecuteLongWait.via');

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
            publicApiExecuteLongWaitUrl
        ], done);
    });

    it('can run many HTTP requests quickly when HTTP is resolved immediately', function (done) {
        var Vireo = window.NationalInstruments.Vireo.Vireo;
        var viaCode = fixtures.loadAbsoluteUrl(publicApiExecuteManyHTTPGetUrl);

        var vireo = new Vireo();
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
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            var totalTime = performance.now() - startTime;
            expect(totalTime).toBeLessThan(maxTimewithBuffer);
            expect(result).toBeEmptyString();
            expect(wakeUpSpy.calls.count()).toBeGreaterThanOrEqualTo(numIterations);
            done();
        });
    });

    it('can run executeSlicesUntilWait slowly while performing a long wait', function (done) {
        var Vireo = window.NationalInstruments.Vireo.Vireo;
        var viaCode = fixtures.loadAbsoluteUrl(publicApiExecuteLongWaitUrl);

        var vireo = new Vireo();
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
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            var totalTime = performance.now() - startTime;

            expect(result).toBeEmptyString();
            expect(totalTime).toBeNear(waitTime, waitTime * 0.5);
            expect(internalModule.eggShell.executeSlicesUntilWait.calls.count()).toBeNear(maxExecuteSlicesCalls, maxExecuteSlicesCalls * 10);
            done();
        });
    });
});
