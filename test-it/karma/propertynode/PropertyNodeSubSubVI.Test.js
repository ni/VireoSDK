describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var viaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/ControlRefNestedSubVIReadWrite.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            viaUrl
        ], done);
    });


    beforeEach(function () {
        vireo = new Vireo();
    });

    describe('can pass control reference to nested sub-sub-vi and ', function () {
        it('callback is invoked with expected parameters', function (done) {
            var spyRead = jasmine.createSpy();
            var spyWrite = jasmine.createSpy();
            vireo.propertyNode.setPropertyWriteFunction(spyWrite);
            vireo.propertyNode.setPropertyReadFunction(spyRead);

            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaUrl);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(spyRead.calls.argsFor(0)).toEqual(['topVI', 'dataItem', 'Value', 'Double', 'subSubVI', 'doubleLocal']);
                expect(spyWrite.calls.argsFor(0)).toEqual(['topVI', 'dataItem', 'Value', 'Double', 'subSubVI', 'doubleLocal']);
                done();
            });
        });

        it('callback reads from vireo with passed parameters', function (done) {
            var expectedValues = {
                doubleLocal: 1234.5678
            };

            var readFromVireo = function (viName, fpId, propertyName, propertyTypeName, propertyVIName, propertyPath) {
                var parser = vireoRunner.createVIPathParser(vireo, propertyVIName);
                var readValue = parser(propertyPath);
                var expectedVal = expectedValues[propertyPath];
                expect(readValue).toEqual(expectedVal);
            };

            vireo.propertyNode.setPropertyWriteFunction(readFromVireo);
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaUrl);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                done();
            });
        });


        it('callback writes to vireo with passed parameters', function (done) {
            var indexToRead = 0;
            var valuesToRead = [3.14];
            var writeToVireo = function (viName, fpId, propertyName, propertyTypeName, propertyViName, propertyPath) {
                var writer = vireoRunner.createVIPathWriter(vireo, propertyViName);
                var valueRead = valuesToRead[indexToRead];
                indexToRead += 1;
                writer(propertyPath, valueRead);
            };
            var nestSubVIName = 'subSubVI';

            vireo.propertyNode.setPropertyWriteFunction(writeToVireo);
            var parser = vireoRunner.createVIPathParser(vireo, nestSubVIName);
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaUrl);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(parser('doubleLocal')).toEqual(valuesToRead[0]);
                done();
            });
        });
    });
});
