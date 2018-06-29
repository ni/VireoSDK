describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var spyHelpers = window.testHelpers.spyHelpers;

    var vireo, spy, runSlicesAsync;

    var publicApiPropertyNodeWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeWriteUnwiredError.via');
    var publicApiPropertyNodeRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeReadUnwiredError.via');
    var propertyReadVIName = '%3AWeb%20Server%3AInteractive%3AWebApp%3AMain%2Egviweb';
    var propertyWriteVIName = 'MyVI';
    var propertyName = 'Value';

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiPropertyNodeRead,
            publicApiPropertyNodeWrite
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    describe('property read', function () {
        beforeEach(function () {
            spy = jasmine.createSpy();
            vireo.propertyNode.setPropertyReadFunction(spy);
        });

        it('callback is invoked with no wired error terminal', function (done) {
            var expectedCallArgs = [
                [propertyReadVIName, '1', propertyName, 'Boolean', propertyReadVIName, 'local_Boolean'],
                [propertyReadVIName, '2', propertyName, 'Int8', propertyReadVIName, 'local_Int8'],
                [propertyReadVIName, '3', propertyName, 'Int16', propertyReadVIName, 'local_Int16'],
                [propertyReadVIName, '4', propertyName, 'Int32', propertyReadVIName, 'local_Int32'],
                [propertyReadVIName, '5', propertyName, 'Int64', propertyReadVIName, 'local_Int64'],
                [propertyReadVIName, '6', propertyName, 'UInt8', propertyReadVIName, 'local_UInt8'],
                [propertyReadVIName, '7', propertyName, 'UInt16', propertyReadVIName, 'local_UInt16'],
                [propertyReadVIName, '8', propertyName, 'UInt32', propertyReadVIName, 'local_UInt32'],
                [propertyReadVIName, '9', propertyName, 'UInt64', propertyReadVIName, 'local_UInt64'],
                [propertyReadVIName, '10', propertyName, 'Single', propertyReadVIName, 'local_Single'],
                [propertyReadVIName, '11', propertyName, 'Double', propertyReadVIName, 'local_Double'],
                [propertyReadVIName, '12', propertyName, 'ComplexSingle', propertyReadVIName, 'local_ComplexSingle'],
                [propertyReadVIName, '13', propertyName, 'ComplexDouble', propertyReadVIName, 'local_ComplexDouble'],
                [propertyReadVIName, '14', propertyName, 'String', propertyReadVIName, 'local_String'],
                [propertyReadVIName, '15', propertyName, 'Timestamp', propertyReadVIName, 'local_Timestamp']
            ];

            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
                done();
            });
        });
    });

    describe('property write', function () {
        beforeEach(function () {
            spy = jasmine.createSpy();
            vireo.propertyNode.setPropertyReadFunction(spy);
        });

        it('callback is invoked with no wired error terminal', function (done) {
            var expectedCallArgs = [
                [propertyWriteVIName, 'dataItem_Boolean', propertyName, 'Boolean', propertyWriteVIName, 'local_Boolean'],
                [propertyWriteVIName, 'dataItem_Int8', propertyName, 'Int8', propertyWriteVIName, 'local_Int8'],
                [propertyWriteVIName, 'dataItem_Int16', propertyName, 'Int16', propertyWriteVIName, 'local_Int16'],
                [propertyWriteVIName, 'dataItem_Int32', propertyName, 'Int32', propertyWriteVIName, 'local_Int32'],
                [propertyWriteVIName, 'dataItem_Int64', propertyName, 'Int64', propertyWriteVIName, 'local_Int64'],
                [propertyWriteVIName, 'dataItem_UInt8', propertyName, 'UInt8', propertyWriteVIName, 'local_UInt8'],
                [propertyWriteVIName, 'dataItem_UInt16', propertyName, 'UInt16', propertyWriteVIName, 'local_UInt16'],
                [propertyWriteVIName, 'dataItem_UInt32', propertyName, 'UInt32', propertyWriteVIName, 'local_UInt32'],
                [propertyWriteVIName, 'dataItem_UInt64', propertyName, 'UInt64', propertyWriteVIName, 'local_UInt64'],
                [propertyWriteVIName, 'dataItem_Single', propertyName, 'Single', propertyWriteVIName, 'local_Single'],
                [propertyWriteVIName, 'dataItem_Double', propertyName, 'Double', propertyWriteVIName, 'local_Double'],
                [propertyWriteVIName, 'dataItem_ComplexSingle', propertyName, 'ComplexSingle', propertyWriteVIName, 'local_ComplexSingle'],
                [propertyWriteVIName, 'dataItem_ComplexDouble', propertyName, 'ComplexDouble', propertyWriteVIName, 'local_ComplexDouble'],
                [propertyWriteVIName, 'dataItem_String', propertyName, 'String', propertyWriteVIName, 'local_String'],
                [propertyWriteVIName, 'dataItem_Timestamp', propertyName, 'Timestamp', propertyWriteVIName, 'local_Timestamp']
            ];

            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
                done();
            });
        });
    });
});
