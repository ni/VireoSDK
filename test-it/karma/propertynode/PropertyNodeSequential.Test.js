describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var spyHelpers = window.testHelpers.spyHelpers;

    var vireo, spy, runSlicesAsync;

    var propertyNodeReadRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/ReadRead.via');
    var propertyNodeWriteRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/WriteRead.via');
    var propertyNodeWriteWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/WriteWrite.via');
    var propertyName = 'Value';

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            propertyNodeReadRead,
            propertyNodeWriteRead,
            propertyNodeWriteWrite
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
        spy = jasmine.createSpy();
    });

    it('sequential read read operations invoke JavaScript callbacks with correct parameters', function (done) {
        var viName = '%3A%3AWeb%20Server%3A%3AInteractive%3A%3AWebApp%3A%3AReadRead%2Egviweb';
        vireo.propertyNode.setPropertyReadFunction(spy);

        var expectedCallArgs = [
            [viName, '1', propertyName, 'Boolean', viName, 'local3'],
            [viName, '1', propertyName, 'Boolean', viName, 'local6']
        ];

        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, propertyNodeReadRead);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
            done();
        });
    });

    it('sequential write write operations invoke JavaScript callbacks with correct parameters', function (done) {
        var viName = '%3A%3AWeb%20Server%3A%3AInteractive%3A%3AWebApp%3A%3AWriteWrite%2Egviweb';
        vireo.propertyNode.setPropertyWriteFunction(spy);

        var expectedCallArgs = [
            [viName, '1', propertyName, 'Boolean', viName, 'c1'],
            [viName, '1', propertyName, 'Boolean', viName, 'c4']
        ];

        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, propertyNodeWriteWrite);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
            done();
        });
    });

    it('sequential write read operations invoke JavaScript callbacks with correct parameters', function (done) {
        var viName = '%3A%3AWeb%20Server%3A%3AInteractive%3A%3AWebApp%3A%3AWriteRead%2Egviweb';
        vireo.propertyNode.setPropertyWriteFunction(spy);
        vireo.propertyNode.setPropertyReadFunction(spy);

        var expectedCallArgs = [
            [viName, '1', propertyName, 'Boolean', viName, 'c1'],
            [viName, '1', propertyName, 'Boolean', viName, 'local6']
        ];

        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, propertyNodeWriteRead);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
            done();
        });
    });
});
