describe('Timeout test suite', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;

    // Setting jasmine.DEFALT_TIMEOUT_INTERVAL seems to not be picked up reliably
    // Not sure why so switched to setting it per 'it' block
    var TIMEOUT_CODE = 56;
    var vireo;

    beforeEach(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();
    });

    it('GET method with timeout 1s times out with httpbin delay of 30s', function (done) {
        var timeout = 1000;

        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delay/30');
        viPathWriter('url', url);
        viPathWriter('timeout', timeout);

        var startTime = performance.now();
        runSlicesAsync(function (rawPrint, rawPrintError) {
            var endTime = performance.now();
            var runTime = endTime - startTime;

            expect(runTime).toBeNear(timeout, timeout * 0.5);

            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBe('');
            expect(viPathParser('body')).toBe('');
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBe(true);
            expect(viPathParser('error.code')).toBe(TIMEOUT_CODE);
            expect(viPathParser('error.source')).toBe('LabVIEWHTTPClient:GET, Timeout');
            done();
        });
    });

    it('GET method with default timeout of 10 seconds times out with httpbin delay of 30s', function (done) {
        var timeout = 10000;

        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('longrun/DefaultTimeout.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delay/30');
        viPathWriter('url', url);
        // Do not write timeout, default of 10s should be used

        var startTime = performance.now();
        runSlicesAsync(function (rawPrint, rawPrintError) {
            var endTime = performance.now();
            var runTime = endTime - startTime;

            expect(runTime).toBeNear(timeout, timeout * 0.5);

            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');

            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBe('');
            expect(viPathParser('body')).toBe('');
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBe(true);
            expect(viPathParser('error.code')).toBe(TIMEOUT_CODE);
            expect(viPathParser('error.source')).toBe('LabVIEWHTTPClient:GET, Timeout');
            done();
        });
    });
});
