describe('The Vireo EggShell executeSlicesUntilClumpsFinished api', function () {
    'use strict';

    var fixtures = window.testHelpers.fixtures;
    var publicApiExecuteManyHTTPGetUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ExecuteManyHTTPGet.via');

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
            publicApiExecuteManyHTTPGetUrl
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
        vireo.eggShell.writeJSON('MyVI', 'numIterations', JSON.stringify(numIterations));

        var maxTimewithBuffer = maxExecWakeUpTime * numIterations * 0.5;

        var wakeupspy = jasmine.createSpy();
        vireo.eggShell.setExecuteSlicesWakeupCallback(wakeupspy);

        var startTime = performance.now();
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            var totalTime = performance.now() - startTime;
            expect(totalTime).toBeLessThan(maxTimewithBuffer);
            expect(result).toBeEmptyString();
            expect(wakeupspy.calls.count()).toBeGreaterThanOrEqualTo(numIterations);
            done();
        });
    });

    // it('can run many HTTP requests quickly when HTTP is resolved immediately', function (done) {
    //     var Vireo = window.NationalInstruments.Vireo.Vireo;
    //     var viaCode = fixtures.loadAbsoluteUrl(publicApiExecuteManyHTTPGetUrl);

    //     var vireo = new Vireo();
    //     vireo.httpClient.setXMLHttpRequestImplementation(XHRShimResolveImmediatelyAsync);
    //     var result = '';
    //     vireo.eggShell.setPrintFunction(function (text) {
    //         result += text + '\n';
    //     });

    //     vireo.eggShell.loadVia(viaCode);
    //     var maxExecWakeUpTime = vireo.eggShell.maxExecWakeUpTime();
    //     var numIterations = 100;
    //     vireo.eggShell.writeJSON('MyVI', 'numIterations', JSON.stringify(numIterations));

    //     var maxTimewithBuffer = maxExecWakeUpTime * numIterations * 0.5;

    //     var wakeupspy = jasmine.createSpy();
    //     vireo.eggShell.setExecuteSlicesWakeupCallback(wakeupspy);

    //     var startTime = performance.now();
    //     vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
    //         var totalTime = performance.now() - startTime;
    //         expect(totalTime).toBeLessThan(maxTimewithBuffer);
    //         expect(result).toBeEmptyString();
    //         expect(wakeupspy.calls.count()).toBeGreaterThanOrEqualTo(numIterations);
    //         done();
    //     });
    // });
});
