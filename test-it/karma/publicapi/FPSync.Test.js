describe('The Vireo CoreHelpers setFPSyncFunction api', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiFPSyncSimpleViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/FPSyncSimple.via');
    var publicApiFPSyncUtf8ViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/FPSyncUtf8.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiFPSyncSimpleViaUrl,
            publicApiFPSyncUtf8ViaUrl
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    it('can perform a simple fpsync', function (done) {
        var tracker = jasmine.createSpy();
        vireo.coreHelpers.setFPSyncFunction(tracker);
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiFPSyncSimpleViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(tracker).toHaveBeenCalled();
            expect(tracker).toHaveBeenCalledWith('Hello World');

            done();
        });
    });

    it('can perform a fpsync with UTF8 characters', function (done) {
        var viName = 'MyVI';

        var trackerCalls = [];
        var tracker = function (fpSyncString) {
            var valueRef = vireo.eggShell.findValueRef(viName, 'myDouble');
            var myDouble = vireo.eggShell.readDouble(valueRef);
            trackerCalls.push({
                myDouble: myDouble,
                fpSyncString: fpSyncString
            });
        };

        vireo.coreHelpers.setFPSyncFunction(tracker);
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiFPSyncUtf8ViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            var fpSyncString = 'Iñtërnâtiônàlizætiøn\0☃💩';
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(trackerCalls.length).toBe(2);
            expect(trackerCalls[0].myDouble).toBe(7);
            expect(trackerCalls[0].fpSyncString).toBe(fpSyncString);
            expect(trackerCalls[1].myDouble).toBe(8);
            expect(trackerCalls[1].fpSyncString).toBe(fpSyncString);

            done();
        });
    });
});
