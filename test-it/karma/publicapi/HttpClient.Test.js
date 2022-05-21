// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo HttpClient', function () {
    'use strict';

    const vireoHelpers = window.vireoHelpers;
    const vireoRunner = window.testHelpers.vireoRunner;
    const fixtures = window.testHelpers.fixtures;
    const httpOpenHandleCredentialsAddViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/OpenHandleCredentialsAdd.via');
    let vireo;

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            httpOpenHandleCredentialsAddViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    it('exposes the private http client mananger', async function () {
        const vireoHelpers = window.vireoHelpers;
        const vireo = await vireoHelpers.createInstance();
        const httpClientManager = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired.httpClient.httpClientManager;
        expect(httpClientManager).toBeDefined();
    });

    it('exposes the private http client to read header values', async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpOpenHandleCredentialsAddViaUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        const viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');
        const username = 'myuser';
        const password = 'mypassword';
        const header = 'birdperson';
        const value = 'in bird culture this is considered a dick move';
        const withCredentials = 1; // which is boolean true
        viPathWriter('username', username);
        viPathWriter('password', password);
        viPathWriter('header', header);
        viPathWriter('value', value);
        viPathWriter('withCredentials', withCredentials);

        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();

        // handle
        const handle = viPathParser('handle');
        expect(handle).toBeGreaterThan(0);

        // error
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();

        // Get current http client
        const httpClientManager = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired.httpClient.httpClientManager;
        expect(httpClientManager).toBeDefined();
        const httpClient = httpClientManager.get(handle);
        expect(httpClient).toBeDefined();

        // A user accessing the internal http client api may be trying to access configured properties
        // such as username, password, withCredentials, and headers
        expect(httpClient._username).toBe(username);
        expect(httpClient._password).toBe(password);
        expect(httpClient._includeCredentialsDuringCORS).toBe(true);
        expect(httpClient._headers.get(header)).toBe(value);
    });
});
