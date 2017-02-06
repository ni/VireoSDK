
describe('Tests that perform multiple serial requests', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    var vireo;

    beforeEach(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();
    });

    // Tests with serial connections to the same endpoint run slowly sometimes, not sure what conditions
    it('with open, add header, get, add header, get, close and validates a 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/GetOpenAddMethodAddMethodClose.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url1 = httpBinHelpers.convertToAbsoluteUrl('get');
        var header1 = 'birdperson';
        var value1 = 'in bird culture this is considered a dick move';
        viPathWriter('url1', url1);
        viPathWriter('header1', header1);
        viPathWriter('value1', value1);

        var url2 = httpBinHelpers.convertToAbsoluteUrl('get');
        var header2 = 'mrmeeseeks';
        var value2 = 'look at me';
        viPathWriter('url2', url2);
        viPathWriter('header2', header2);
        viPathWriter('value2', value2);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBeGreaterThan(0);

            // header 1
            var responseHeader1 = httpParser.parseResponseHeader(viPathParser('headers1'));
            expect(responseHeader1.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader1.statusCode).toBe(200);
            expect(responseHeader1.reasonPhrase).toBe('OK');
            expect(responseHeader1.headers).toBeNonEmptyObject();

            // body 1
            var httpBinBody1 = httpBinHelpers.parseBody(viPathParser('body1'));
            var requestUrl1 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody1.args).toEqual({});
            expect(httpBinBody1.headers).toBeNonEmptyObject();
            expect(httpBinBody1.headersLowerCase).toHaveMember(header1);
            expect(httpBinBody1.headersLowerCase).not.toHaveMember(header2);
            expect(httpBinBody1.headersLowerCase[header1]).toBe(value1);
            expect(requestUrl1.pathname).toBe('/get');

            // status code 1
            expect(viPathParser('statusCode1')).toBe(200);

            // header 2
            var responseHeader2 = httpParser.parseResponseHeader(viPathParser('headers1'));
            expect(responseHeader2.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader2.statusCode).toBe(200);
            expect(responseHeader2.reasonPhrase).toBe('OK');
            expect(responseHeader2.headers).toBeNonEmptyObject();

            // body 2
            var httpBinBody2 = httpBinHelpers.parseBody(viPathParser('body2'));
            var requestUrl2 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody2.args).toEqual({});
            expect(httpBinBody2.headers).toBeNonEmptyObject();
            expect(httpBinBody2.headersLowerCase).toHaveMember(header1);
            expect(httpBinBody2.headersLowerCase).toHaveMember(header2);
            expect(httpBinBody2.headersLowerCase[header1]).toBe(value1);
            expect(httpBinBody2.headersLowerCase[header2]).toBe(value2);
            expect(requestUrl2.pathname).toBe('/get');

            // status code 2
            expect(viPathParser('statusCode2')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });
});
