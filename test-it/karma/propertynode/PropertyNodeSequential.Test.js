describe('The Vireo PropertyNode', function () {
    'use strict';

    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo, spy, runSlicesAsync;

    var propertyNodeReadRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/ReadRead.via');
    var propertyNodeWriteRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/WriteRead.via');
    var propertyNodeWriteWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/WriteWrite.via');
    var propertyName = 'Value';

    var expectValidValueRef = function (valueRef) {
        expect(valueRef).toBeObject();
        expect(valueRef.typeRef).toBeDefined();
        expect(valueRef.dataRef).toBeDefined();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.dataRef).toBeNumber();
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            propertyNodeReadRead,
            propertyNodeWriteRead,
            propertyNodeWriteWrite
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
        spy = jasmine.createSpy();
    });

    var propertyNodeCallbackTest = function (viaPath, viName, controlId, propertyName, done) {
        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            var callCount = spy.calls.count();
            for (var i = 0; i < callCount; i += 1) {
                var args = spy.calls.argsFor(i);
                expect(args[0]).toEqual(viName);
                expect(args[1]).toEqual(controlId);
                expect(args[2]).toEqual(propertyName);
                expectValidValueRef(args[3]);
            }

            done();
        });
    };

    it('sequential read read operations invoke JavaScript callbacks with correct parameters', function (done) {
        var viName = '%3A%3AWeb%20Server%3A%3AInteractive%3A%3AWebApp%3A%3AReadRead%2Egviweb',
            controlId = '1';

        vireo.propertyNode.setPropertyReadFunction(spy);

        propertyNodeCallbackTest(propertyNodeReadRead, viName, controlId, propertyName, done);
    });

    it('sequential write write operations invoke JavaScript callbacks with correct parameters', function (done) {
        var viName = '%3A%3AWeb%20Server%3A%3AInteractive%3A%3AWebApp%3A%3AWriteWrite%2Egviweb',
            controlId = '1';

        vireo.propertyNode.setPropertyWriteFunction(spy);

        propertyNodeCallbackTest(propertyNodeWriteWrite, viName, controlId, propertyName, done);
    });

    it('sequential write read operations invoke JavaScript callbacks with correct parameters', function (done) {
        var viName = '%3A%3AWeb%20Server%3A%3AInteractive%3A%3AWebApp%3A%3AWriteRead%2Egviweb',
            controlId = '1';

        vireo.propertyNode.setPropertyWriteFunction(spy);
        vireo.propertyNode.setPropertyReadFunction(spy);

        propertyNodeCallbackTest(propertyNodeWriteRead, viName, controlId, propertyName, done);
    });
});
