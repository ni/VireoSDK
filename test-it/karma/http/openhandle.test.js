describe('Running an Open Handle call', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var WEBVI_UNSUPPORTED_INPUT = 363650;
    var vireo;

    beforeEach(function () {
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();
    });

    it('with simple inputs', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandle.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('cookieFile')).toBeEmptyString();
            expect(viPathParser('username')).toBeEmptyString();
            expect(viPathParser('password')).toBeEmptyString();
            expect(viPathParser('verifyServer')).toBe(1);
            expect(viPathParser('handle')).toBeGreaterThan(0);
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with invalid cookieFile', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandle.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('cookieFile', 'C:\\Awesomefile');
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('cookieFile')).toBe('C:\\Awesomefile');
            expect(viPathParser('username')).toBeEmptyString();
            expect(viPathParser('password')).toBeEmptyString();
            expect(viPathParser('verifyServer')).toBe(1);
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(WEBVI_UNSUPPORTED_INPUT);
            expect(viPathParser('error.source')).toBeNonEmptyString();
            expect(viPathParser('error.source')).toMatch(/HttpClientOpen in MyVI/);
            done();
        });
    });

    it('with invalid verifyServer', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandle.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('verifyServer', 0);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('cookieFile')).toBeEmptyString();
            expect(viPathParser('username')).toBeEmptyString();
            expect(viPathParser('password')).toBeEmptyString();
            expect(viPathParser('verifyServer')).toBe(0);
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(WEBVI_UNSUPPORTED_INPUT);
            expect(viPathParser('error.source')).toBeNonEmptyString();
            expect(viPathParser('error.source')).toMatch(/HttpClientOpen in MyVI/);
            done();
        });
    });

    it('with existing error does not create handle', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandle.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('error.status', true);
        viPathWriter('error.code', 5000);
        viPathWriter('error.source', 'wubalubadubdub');
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('cookieFile')).toBeEmptyString();
            expect(viPathParser('username')).toBeEmptyString();
            expect(viPathParser('password')).toBeEmptyString();
            expect(viPathParser('verifyServer')).toBe(1);
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(5000);
            expect(viPathParser('error.source')).toBe('wubalubadubdub');
            done();
        });
    });

    it('with existing error does not override error', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandle.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('error.status', true);
        viPathWriter('error.code', 5000);
        viPathWriter('error.source', 'wubalubadubdub');
        viPathWriter('cookieFile', 'C:\\Awesomefile');
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('cookieFile')).toBe('C:\\Awesomefile');
            expect(viPathParser('username')).toBeEmptyString();
            expect(viPathParser('password')).toBeEmptyString();
            expect(viPathParser('verifyServer')).toBe(1);
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(5000);
            expect(viPathParser('error.source')).toBe('wubalubadubdub');
            done();
        });
    });

    it('with existing error does override warning', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandle.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('error.status', false);
        viPathWriter('error.code', 5000);
        viPathWriter('error.source', 'wubalubadubdub');
        viPathWriter('cookieFile', 'C:\\Awesomefile');
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('cookieFile')).toBe('C:\\Awesomefile');
            expect(viPathParser('username')).toBeEmptyString();
            expect(viPathParser('password')).toBeEmptyString();
            expect(viPathParser('verifyServer')).toBe(1);
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(WEBVI_UNSUPPORTED_INPUT);
            expect(viPathParser('error.source')).toBeNonEmptyString();
            expect(viPathParser('error.source')).toMatch(/HttpClientOpen in MyVI/);
            done();
        });
    });
});
