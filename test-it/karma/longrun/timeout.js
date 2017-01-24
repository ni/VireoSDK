describe('Timeout test suite', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;

    // Sharing Vireo instances across tests make them run soooo much faster
    // var vireo = new Vireo();

    // TODO mraj using the same vireo instance causes an abort when one http call results in a none 200 response code
    // See https://github.com/ni/VireoSDK/issues/163
    var vireo;

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        vireo = new Vireo();
    });

    // The timeout does not seem to timeout fast enough and things get weird on fail
    var originalTimeout;

    beforeEach(function () {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
    });

    afterEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
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
            var timeoutBuffered = timeout + (timeout * 0.5);

            expect(runTime).toBeLessThan(timeoutBuffered);

            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBe('');
            expect(viPathParser('body')).toBe('');
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBe(true);
            expect(viPathParser('error.code')).toBe(-50);
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
            var timeoutBuffered = timeout + (timeout * 0.5);

            expect(runTime).toBeLessThan(timeoutBuffered);
            expect(runTime).toBeGreaterThan(timeout);

            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');

            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBe('');
            expect(viPathParser('body')).toBe('');
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBe(true);
            expect(viPathParser('error.code')).toBe(-50);
            expect(viPathParser('error.source')).toBe('LabVIEWHTTPClient:GET, Timeout');
            done();
        });
    });
});
