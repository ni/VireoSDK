describe('Performing a CORS request #FailsIE', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;
    var vireo;

    var httpCORSViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/Credentials.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            httpCORSViaUrl
        ], done);
    });

    beforeAll(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeEach(async function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        vireo = await vireoHelpers.createInstance();
    });

    beforeEach(function (done) {
        httpBinHelpers.forceHttpBinQuery('cookies/set?FastestLandAnimal=cheetah', done);
    });

    it('with open, set credentials to true, get, close and validates a 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpCORSViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        // Break cache for IE11 by adding random string
        var url = httpBinHelpers.convertToAbsoluteUrl('get?rand=' + Math.random());
        viPathWriter('url', url);
        viPathWriter('withCredentials', 1);

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
            expect(httpBinBody.args).toBeNonEmptyObject();
            expect(httpBinBody.headers).toBeNonEmptyObject();
            var header1 = 'Cookie';
            var header2 = 'cookie';
            expect(httpBinBody.headers[header1]).toMatch(/cheetah/);
            expect(httpBinBody.headersLowerCase[header2]).toMatch(/cheetah/);
            expect(requestUrl.pathname).toBe('/get');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with open, set credentials to false, get, close and validates a 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpCORSViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        // Break cache for IE11 by adding random string
        var url = httpBinHelpers.convertToAbsoluteUrl('get?rand=' + Math.random());
        viPathWriter('url', url);
        viPathWriter('withCredentials', 0);

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
            expect(httpBinBody.args).toBeNonEmptyObject();
            expect(httpBinBody.headers).toBeNonEmptyObject();
            expect(httpBinBody.headers).not.toHaveMember('Cookie');
            expect(httpBinBody.headersLowerCase).not.toHaveMember('cookie');
            expect(requestUrl.pathname).toBe('/get');

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
