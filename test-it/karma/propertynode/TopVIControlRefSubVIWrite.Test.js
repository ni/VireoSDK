describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var vireo;
    var runSlicesAsync;

    var viaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/TopVIControlRefSubVIWrite.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            viaUrl
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaUrl);
    });

    it('propertyRead when controlref is in top VI and property value is in subVI callback is invoked with diferent VI names', function (done) {
        var spy = jasmine.createSpy();
        vireo.propertyNode.setPropertyWriteFunction(spy);
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
