describe('Performing a PUT request', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    var WEBVI_UNSUPPORTED_INPUT = 363798;
    var vireo;

    beforeEach(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();
    });

    it('with a simple 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutMethod.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeNonEmptyString();
            expect(viPathParser('body')).toBeNonEmptyString();
            expect(viPathParser('statusCode')).toBe(200);
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('errors with an output file parameter', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutMethod.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        var invalidOutputFile = 'C:\\any\\path';
        viPathWriter('url', url);
        viPathWriter('outputFile', invalidOutputFile);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(WEBVI_UNSUPPORTED_INPUT);
            expect(viPathParser('error.source')).toBeNonEmptyString();
            done();
        });
    });

    it('validating a simple 200 response with empty buffer', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutMethod.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
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
            expect(httpBinBody.data).toBeEmptyString();
            expect(requestUrl.pathname).toBe('/put');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a simple 200 response with simple buffer', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutMethod.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        viPathWriter('url', url);
        var buffer = JSON.stringify({
            rick: 'sanchez',
            morty: 'smith',
            beth: 'smith',
            jerry: 'smith',
            summer: 'smith',
            mr: 'pbh'
        });
        viPathWriter('buffer', buffer);

        runSlicesAsync(function (rawPrint, rawPrintError) {
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
            expect(httpBinBody.data).toBe(buffer);
            expect(requestUrl.pathname).toBe('/put');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a simple 200 response with non-ascii buffer', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutMethod.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        viPathWriter('url', url);
        var buffer = 'Iñtërnâtiônàlizætiøn☃💩';
        viPathWriter('buffer', buffer);

        runSlicesAsync(function (rawPrint, rawPrintError) {
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
            expect(httpBinBody.data).toBe(buffer);
            expect(requestUrl.pathname).toBe('/put');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating an unusual 4XX response code', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutMethod.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('status/418');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(418);
            expect(responseHeader.reasonPhrase).toBe('I\'M A TEAPOT');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            expect(viPathParser('body')).toBeNonEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(418);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('with open, put, close and a simple 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutOpenMethodClose.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBeGreaterThan(0);
            expect(viPathParser('headers')).toBeNonEmptyString();
            expect(viPathParser('body')).toBeNonEmptyString();
            expect(viPathParser('statusCode')).toBe(200);
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with open, put, close and validates a 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutOpenMethodClose.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBeGreaterThan(0);

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
            expect(httpBinBody.data).toBeEmptyString();
            expect(requestUrl.pathname).toBe('/put');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with open, add header, put, close and validates a 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutOpenAddMethodClose.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('put');
        var header = 'birdperson';
        var value = 'in bird culture this is considered a dick move';
        viPathWriter('url', url);
        viPathWriter('header', header);
        viPathWriter('value', value);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBeGreaterThan(0);

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
            expect(httpBinBody.headersLowerCase[header]).toBe(value);
            expect(httpBinBody.data).toBeEmptyString();
            expect(requestUrl.pathname).toBe('/put');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('in parallel and validates a 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/PutParallel.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url1 = httpBinHelpers.convertToAbsoluteUrl('put');
        var header1 = 'birdperson';
        var value1 = 'in bird culture this is considered a dick move';
        viPathWriter('url1', url1);
        viPathWriter('header1', header1);
        viPathWriter('value1', value1);

        var url2 = httpBinHelpers.convertToAbsoluteUrl('put');
        var header2 = 'mrmeeseeks';
        var value2 = 'look at me';
        viPathWriter('url2', url2);
        viPathWriter('header2', header2);
        viPathWriter('value2', value2);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle 1
            expect(viPathParser('handle1')).toBeGreaterThan(0);

            // header 1
            var responseHeader1 = httpParser.parseResponseHeader(viPathParser('headers1'));
            expect(responseHeader1.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader1.statusCode).toBe(200);
            expect(responseHeader1.reasonPhrase).toBe('OK');
            expect(responseHeader1.headers).toBeNonEmptyObject();

            // body 1
            var httpBinBody1 = httpBinHelpers.parseBody(viPathParser('body1'));
            var requestUrl1 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody1.args).toBeEmptyObject();
            expect(httpBinBody1.headers).toBeNonEmptyObject();
            expect(httpBinBody1.headersLowerCase).toHaveMember(header1);
            expect(httpBinBody1.headersLowerCase).not.toHaveMember(header2);
            expect(httpBinBody1.headersLowerCase[header1]).toBe(value1);
            expect(httpBinBody1.data).toBeEmptyString();
            expect(requestUrl1.pathname).toBe('/put');

            // status code 1
            expect(viPathParser('statusCode1')).toBe(200);

            // error 1
            expect(viPathParser('error1.status')).toBeFalse();
            expect(viPathParser('error1.code')).toBe(0);
            expect(viPathParser('error1.source')).toBeEmptyString();

            // handle 2
            expect(viPathParser('handle2')).toBeGreaterThan(0);

            // header 2
            var responseHeader2 = httpParser.parseResponseHeader(viPathParser('headers2'));
            expect(responseHeader2.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader2.statusCode).toBe(200);
            expect(responseHeader2.reasonPhrase).toBe('OK');
            expect(responseHeader2.headers).toBeNonEmptyObject();

            // body 2
            var httpBinBody2 = httpBinHelpers.parseBody(viPathParser('body2'));
            var requestUrl2 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody2.args).toBeEmptyObject();
            expect(httpBinBody2.headers).toBeNonEmptyObject();
            expect(httpBinBody2.headersLowerCase).not.toHaveMember(header1);
            expect(httpBinBody2.headersLowerCase).toHaveMember(header2);
            expect(httpBinBody2.headersLowerCase[header2]).toBe(value2);
            expect(httpBinBody2.data).toBeEmptyString();
            expect(requestUrl2.pathname).toBe('/put');

            // status code 2
            expect(viPathParser('statusCode2')).toBe(200);

            // error 2
            expect(viPathParser('error2.status')).toBeFalse();
            expect(viPathParser('error2.code')).toBe(0);
            expect(viPathParser('error2.source')).toBeEmptyString();
            done();
        });
    });
});
