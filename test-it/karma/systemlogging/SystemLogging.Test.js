// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Performing a system log', function () {
    'use strict';
    // Reference aliases
    const vireoHelpers = window.vireoHelpers;
    const vireoRunner = window.testHelpers.vireoRunner;
    const fixtures = window.testHelpers.fixtures;
    let vireo;

    const systemLoggingViaUrl = fixtures.convertToAbsoluteFromFixturesDir('systemlogging/SystemLogging.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            systemLoggingViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    beforeEach(async function () {
        spyOn(console, 'error');
        spyOn(console, 'warn');
        spyOn(console, 'info');
        spyOn(console, 'log');
    });

    it('with error severity calls console error', async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, systemLoggingViaUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        const viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('message', 'this should be an error');
        viPathWriter('severity', 0);
        const {rawPrint, rawPrintError} = await runSlicesAsync();

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith('this should be an error');
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.info).not.toHaveBeenCalled();
        expect(console.log).not.toHaveBeenCalled();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
    });

    it('with warn severity calls console warn', async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, systemLoggingViaUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        const viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('message', 'this should be a warning');
        viPathWriter('severity', 1);
        const {rawPrint, rawPrintError} = await runSlicesAsync();

        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('this should be a warning');
        expect(console.info).not.toHaveBeenCalled();
        expect(console.log).not.toHaveBeenCalled();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
    });

    it('with info severity calls console info', async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, systemLoggingViaUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        const viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('message', 'this should be an info');
        viPathWriter('severity', 2);
        const {rawPrint, rawPrintError} = await runSlicesAsync();

        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.info).toHaveBeenCalledTimes(1);
        expect(console.info).toHaveBeenCalledWith('this should be an info');
        expect(console.log).not.toHaveBeenCalled();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
    });

    it('with invalid severity calls console log', async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, systemLoggingViaUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        const viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('message', 'this should be a log');
        viPathWriter('severity', 70);
        const {rawPrint, rawPrintError} = await runSlicesAsync();

        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.info).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('this should be a log');
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(viPathParser('error.status')).toBeFalse();
        expect(viPathParser('error.code')).toBe(0);
        expect(viPathParser('error.source')).toBeEmptyString();
    });
});
