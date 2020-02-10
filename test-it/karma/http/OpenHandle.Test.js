// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Running an Open Handle call', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var kNIHttpWebVICookieFileUnsupported = 363652;
    var kNIHttpWebVIVerifyServerUnsupported = 363653;
    var vireo;

    var httpOpenHandleViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandle.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            httpOpenHandleViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    it('with simple inputs', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpOpenHandleViaUrl);
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpOpenHandleViaUrl);
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
            expect(viPathParser('error.code')).toBe(kNIHttpWebVICookieFileUnsupported);
            expect(viPathParser('error.source')).toMatch(/HttpClientOpen in MyVI/);
            done();
        });
    });

    it('with invalid verifyServer', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpOpenHandleViaUrl);
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
            expect(viPathParser('error.code')).toBe(kNIHttpWebVIVerifyServerUnsupported);
            expect(viPathParser('error.source')).toMatch(/HttpClientOpen in MyVI/);
            done();
        });
    });

    it('with existing error does not create handle', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpOpenHandleViaUrl);
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpOpenHandleViaUrl);
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpOpenHandleViaUrl);
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
            expect(viPathParser('error.code')).toBe(kNIHttpWebVICookieFileUnsupported);
            expect(viPathParser('error.source')).toMatch(/HttpClientOpen in MyVI/);
            done();
        });
    });
});
