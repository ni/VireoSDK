describe('The Vireo PropertyNode', function () {
    'use strict';

    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var viaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/ControlRefNestedSubVIReadWrite.via');

    var expectValidValueRef = function (valueRef) {
        expect(valueRef).toBeObject();
        expect(valueRef.typeRef).toBeDefined();
        expect(valueRef.dataRef).toBeDefined();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.dataRef).toBeNumber();
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            viaUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    describe('can pass control reference to nested sub-sub-vi and ', function () {
        var topVIName = 'topVI',
            subVIName = 'subSubVI',
            controlRefId = '1',
            propertyName = 'Value';

        it('callback is invoked with expected parameters', function (done) {
            var spyRead = jasmine.createSpy();
            var spyWrite = jasmine.createSpy();
            vireo.propertyNode.setPropertyWriteFunction(spyWrite);
            vireo.propertyNode.setPropertyReadFunction(spyRead);

            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaUrl);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                var readArgs = spyRead.calls.argsFor(0);

                expect(readArgs[0]).toEqual(topVIName);
                expect(readArgs[1]).toEqual(controlRefId);
                expect(readArgs[2]).toEqual(propertyName);
                expectValidValueRef(readArgs[3]);

                var writeArgs = spyWrite.calls.argsFor(0);
                expect(writeArgs[0]).toEqual(topVIName);
                expect(writeArgs[1]).toEqual(controlRefId);
                expect(writeArgs[2]).toEqual(propertyName);
                expectValidValueRef(writeArgs[3]);

                done();
            });
        });

        it('callback reads from vireo with passed parameters', function (done) {
            var expectedValues = {
                doubleLocal: 1234.5678
            };

            var readFromVireo = function (viName, fpId, propertyName, tempVarValueRef) {
                var readValue = vireo.eggShell.readDouble(tempVarValueRef);
                var expectedVal = expectedValues.doubleLocal;
                expect(readValue).toEqual(expectedVal);
            };

            vireo.propertyNode.setPropertyWriteFunction(readFromVireo);
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaUrl);
            var parser = vireoRunner.createVIPathParser(vireo, subVIName);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(parser('error.status')).toBeFalse();
                expect(parser('error.code')).toBe(0);
                expect(parser('error.source')).toBeEmptyString();
                done();
            });
        });


        it('callback writes to vireo with passed parameters', function (done) {
            var indexToRead = 0;
            var valuesToRead = [3.14];
            var writeToVireo = function (viName, controlId, propertyName, tempVarValueRef) {
                var valueRead = valuesToRead[indexToRead];
                indexToRead += 1;
                vireo.eggShell.writeDouble(tempVarValueRef, valueRead);
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
