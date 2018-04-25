describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var vireo;
    var runSlicesAsync;

    var readGlobalsViaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/TopVIControlRefSubVIRead.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            readGlobalsViaUrl
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, readGlobalsViaUrl);
    });

    it('', function (done) {
        var spy = jasmine.createSpy();
        vireo.propertyNode.setPropertyReadFunction(spy);
        var topVIName = 'TopVI',
            subVIName = 'subVI';

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(spy.calls.argsFor(0)).toEqual([topVIName, 'dataItem_Boolean', 'Value', 'Boolean', subVIName, 'booleanLocal']);
            expect(spy.calls.argsFor(1)).toEqual([topVIName, 'dataItem_String', 'Value', 'String', subVIName, 'stringLocal']);
            expect(spy.calls.argsFor(2)).toEqual([topVIName, 'dataItem_Double', 'Value', 'Double', subVIName, 'doubleLocal']);
            done();
        });
    });
});
