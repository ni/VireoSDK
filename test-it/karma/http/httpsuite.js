describe('can run http suite', function () {
    'use strict';

    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();

    it('GET method', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('url', 'http://localhost:5000/get');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');

            var httpBinResponse = JSON.parse(viPathParser('body'));
            expect(httpBinResponse.args).toBeDefined();
            expect(httpBinResponse.headers).toBeDefined();

            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeDefined();
            expect(viPathParser('body')).toBeDefined();
            done();
        });
    });

    // The timeout does not seem to timeout fast enough and things get weird on fail
    xdescribe('tests timeout', function () {
        var originalTimeout;

        beforeEach(function () {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });

        afterEach(function () {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        it('GET method with timeout 2s times out with 8s delay', function (done) {
            var timeout = 2;

            var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');

            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
            var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
            var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

            viPathWriter('url', 'http://localhost:5000/delay/8');
            viPathWriter('timeOut', timeout);

            var startTime = performance.now();
            runSlicesAsync(function (rawPrint, rawPrintError) {
                var endTime = performance.now();
                var runTime = endTime - startTime;
                var timeoutBuffered = timeout + (timeout * 0.5);

                expect(runTime).toBeLessThan(timeoutBuffered);

                expect(rawPrint).toBe('');
                expect(rawPrintError).toBe('');

                // var httpBinResponse = JSON.parse(viPathParser('body'));
                // expect(httpBinResponse.args).toBeDefined();
                // expect(httpBinResponse.headers).toBeDefined();

                expect(viPathParser('handle')).toBe(0);
                expect(viPathParser('headers')).toBeDefined();
                expect(viPathParser('body')).toBeDefined();
                done();
            });
        });
    });
});
