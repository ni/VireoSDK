// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Timeout test suite #Slow', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    var TIMEOUT_CODE = 56;
    var ABORT_CODE = 363508;
    var vireo;

    var httpGetMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/GetMethod.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            httpGetMethodViaUrl
        ], done);
    });

    beforeAll(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
    });

    beforeEach(function (done) {
        // The timeout tests sometimes need a recovery period so perform a full get request and wait for it before continuing
        httpBinHelpers.forceHttpBinQuery('get?show_env=1', done);
    });

    it('GET method with timeout 0s times out with httpbin delay of 10s', function (done) {
        var timeout = 0;
        var timeoutEpsilon = 1000;

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delay/10');
        viPathWriter('url', url);
        viPathWriter('timeout', timeout);

        var startTime = performance.now();
        runSlicesAsync(function (rawPrint, rawPrintError) {
            var endTime = performance.now();
            var runTime = endTime - startTime;

            expect(runTime).toBeNear(timeout, timeoutEpsilon);

            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(TIMEOUT_CODE);
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            expect(viPathParser('error.source')).toMatch(/time limit/);
            done();
        });
    });

    it('GET method with timeout 1s times out with httpbin delay of 10s', function (done) {
        var timeout = 1000;

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delay/10');
        viPathWriter('url', url);
        viPathWriter('timeout', timeout);

        var startTime = performance.now();
        runSlicesAsync(function (rawPrint, rawPrintError) {
            var endTime = performance.now();
            var runTime = endTime - startTime;

            expect(runTime).toBeNear(timeout, timeout * 0.5);

            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(TIMEOUT_CODE);
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            expect(viPathParser('error.source')).toMatch(/time limit/);
            done();
        });
    });

    it('GET method with timeout of 5 seconds times out with httpbin delay of 10s', function (done) {
        var timeout = 5000;

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delay/10');
        viPathWriter('url', url);
        viPathWriter('timeout', timeout);

        var startTime = performance.now();
        runSlicesAsync(function (rawPrint, rawPrintError) {
            var endTime = performance.now();
            var runTime = endTime - startTime;

            expect(runTime).toBeNear(timeout, timeout * 0.5);

            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(TIMEOUT_CODE);
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            expect(viPathParser('error.source')).toMatch(/time limit/);
            done();
        });
    });

    it('GET method with timeout of 5 seconds times and httpbin delay of 10s is aborted after 2s', function (done) {
        var timeout = 5000;
        var abortTimeout = 2000;
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delay/10');
        viPathWriter('url', url);
        viPathWriter('timeout', timeout);

        var startTime = performance.now();

        setTimeout(function () {
            vireo.httpClient.abortAllRunningRequests();
        }, abortTimeout);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            var endTime = performance.now();
            var runTime = endTime - startTime;

            expect(runTime).toBeNear(abortTimeout, abortTimeout * 0.5);

            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(ABORT_CODE);
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            expect(viPathParser('error.source')).toMatch(/aborted/);
            done();
        });
    });

    it('GET method with timeout -1 succeeds with httpbin delay of 10s', function (done) {
        var timeout = -1;
        var httpBinDelay = 10000;

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delay/10');
        viPathWriter('url', url);
        viPathWriter('timeout', timeout);

        var startTime = performance.now();
        runSlicesAsync(function (rawPrint, rawPrintError) {
            var endTime = performance.now();
            var runTime = endTime - startTime;

            expect(runTime).toBeNear(httpBinDelay, httpBinDelay * 2);

            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var httpBinBody = httpBinHelpers.parseBody(viPathParser('body'));
            var requestUrl = httpParser.parseUrl(httpBinBody.url);
            expect(httpBinBody.args).toBeEmptyObject();
            expect(httpBinBody.headers).toBeNonEmptyObject();
            expect(requestUrl.pathname).toBe('/delay/10');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });
});
