describe('can run HTTP Get suite', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;

    // Skip test if httpbin offline
    httpBinHelpers.makeTestPendingIfHttpBinOffline();

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();

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
        viPathWriter('timeOut', timeout);

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
            done();
        });
    });
});
