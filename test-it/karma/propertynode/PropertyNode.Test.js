describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiPropertyNodeWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeWrite.via');
    var publicApiPropertyNodeRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeRead.via');
    var propertyReadVIName = '%3AWeb%20Server%3AInteractive%3AWebApp%3AMain%2Egviweb';
    var propertyWriteVIName = 'MyVI';

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiPropertyNodeRead,
            publicApiPropertyNodeWrite
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    it('setPropertyReadFunction throws when trying to set not a function', function () {
        var notFunctions = [{}, [], '', 234, undefined, null];
        notFunctions.forEach(function (element) {
            var setPropertyReadFunction = function () {
                vireo.propertyNode.setPropertyReadFunction(element);
            };

            expect(setPropertyReadFunction).toThrowError(/callable function/);
        });
    });

    describe('propertyRead', function () {
        var runSlicesAsync, viPathParser, viPathWriter,
            decodedReadVIName = decodeURIComponent(propertyReadVIName);

        beforeEach(function () {
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
            viPathParser = vireoRunner.createVIPathParser(vireo, propertyReadVIName);
            viPathWriter = vireoRunner.createVIPathWriter(vireo, propertyReadVIName);
        });

        it('callback is invoked with expected parameters', function (done) {
            var spy = jasmine.createSpy();
            vireo.propertyNode.setPropertyReadFunction(spy);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(spy.calls.argsFor(0)).toEqual([decodedReadVIName, 'dataItem_Boolean', 'value', 'Boolean', 'booleanLocal']);
                expect(spy.calls.argsFor(1)).toEqual([decodedReadVIName, 'dataItem_String', 'value', 'String', 'stringLocal']);
                expect(spy.calls.argsFor(2)).toEqual([decodedReadVIName, 'dataItem_Double', 'value', 'Double', 'doubleLocal']);
                expect(spy.calls.argsFor(3)).toEqual([decodedReadVIName, 'dataItem_Int32', 'value', 'Int32', 'int32Local']);
                expect(spy.calls.argsFor(4)).toEqual([decodedReadVIName, 'dataItem_UInt32', 'value', 'UInt32', 'uint32Local']);
                expect(spy.calls.argsFor(5)).toEqual([decodedReadVIName, 'dataItem_ComplexDouble', 'value', 'ComplexDouble', 'complexDoubleLocal']);
                expect(spy.calls.argsFor(6)).toEqual([decodedReadVIName, 'dataItem_Timestamp', 'value', 'Timestamp', 'timestampLocal']);
                expect(spy.calls.argsFor(7)).toEqual([decodedReadVIName, 'dataItem_MíNúmero', 'Value', 'Double', 'numberLocal']);
                expect(spy.calls.argsFor(8)).toEqual([decodedReadVIName, 'dataItem_MíNúmero', 'Value', 'Double', 'clusterLocal.%3Anumeric%3A']);
                expect(spy.calls.argsFor(9)).toEqual([decodedReadVIName, 'dataItem_Boolean', 'Value', 'Boolean', 'clusterLocal.nestedClusterLocal.Boolean%20Space%20Part']);
                done();
            });
        });

        it('writes an error when callback function throws', function (done) {
            var readFunction = function () {
                throw new Error('This is not good');
            };
            vireo.propertyNode.setPropertyReadFunction(readFunction);

            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(1055);
                expect(viPathParser('error.source')).toMatch(/PropertyNodeRead/);
                done();
            });
        });

        it('callback can use parameters to write back to vireo', function (done) {
            var complexToWrite = {
                real: 10,
                imaginary: -10
            };
            var expectedTimestamp = {
                seconds: 0,
                fraction: 0
            };
            var valuesToRead = [true, 'Lorem ipsum', 3.14, -24, 123456, complexToWrite, '0:0', 6.28];
            var indexToRead = 0;
            var readFunction = function (viName, fpId, propertyName, propertyTypeName, propertyPath) {
                var valueRead = valuesToRead[indexToRead];
                indexToRead += 1;
                viPathWriter(propertyPath, valueRead);
            };

            vireo.propertyNode.setPropertyReadFunction(readFunction);

            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('booleanLocal')).toEqual(valuesToRead[0]);
                expect(viPathParser('stringLocal')).toEqual(valuesToRead[1]);
                expect(viPathParser('doubleLocal')).toEqual(valuesToRead[2]);
                expect(viPathParser('int32Local')).toEqual(valuesToRead[3]);
                expect(viPathParser('uint32Local')).toEqual(valuesToRead[4]);
                expect(viPathParser('complexDoubleLocal')).toEqual(valuesToRead[5]);
                expect(viPathParser('timestampLocal')).toEqual(expectedTimestamp);
                expect(viPathParser('numberLocal')).toEqual(valuesToRead[7]);

                done();
            });
        });
    });

    it('setPropertyWriteFunction throws when trying to set not a function', function () {
        var notFunctions = [{}, [], '', 234, undefined, null];
        notFunctions.forEach(function (element) {
            var setPropertyReadFunction = function () {
                vireo.propertyNode.setPropertyWriteFunction(element);
            };

            expect(setPropertyReadFunction).toThrowError(/callable function/);
        });
    });

    describe('propertyWrite', function () {
        var runSlicesAsync, viPathParser;

        beforeEach(function () {
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
            viPathParser = vireoRunner.createVIPathParser(vireo, propertyWriteVIName);
        });

        it('callback is invoked with expected parameters', function (done) {
            var spy = jasmine.createSpy();
            vireo.propertyNode.setPropertyWriteFunction(spy);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(spy.calls.argsFor(0)).toEqual([propertyWriteVIName, 'dataItem_Boolean', 'value', 'Boolean', 'myBoolValue']);
                expect(spy.calls.argsFor(1)).toEqual([propertyWriteVIName, 'dataItem_String', 'value', 'String', 'stringLocal']);
                expect(spy.calls.argsFor(2)).toEqual([propertyWriteVIName, 'dataItem_Double', 'value', 'Double', 'doubleLocal']);
                expect(spy.calls.argsFor(3)).toEqual([propertyWriteVIName, 'dataItem_Int32', 'value', 'Int32', 'int32Local']);
                expect(spy.calls.argsFor(4)).toEqual([propertyWriteVIName, 'dataItem_UInt32', 'value', 'UInt32', 'uint32Local']);
                expect(spy.calls.argsFor(5)).toEqual([propertyWriteVIName, 'dataItem_ComplexDouble', 'value', 'ComplexDouble', 'complexDoubleLocal']);
                expect(spy.calls.argsFor(6)).toEqual([propertyWriteVIName, 'dataItem_Timestamp', 'value', 'Timestamp', 'timestampLocal']);
                done();
            });
        });

        it('writes an error when callback function throws', function (done) {
            var writeFunction = function () {
                throw new Error('This is not good');
            };
            vireo.propertyNode.setPropertyWriteFunction(writeFunction);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeTrue();
                expect(viPathParser('error.code')).toBe(1055);
                expect(viPathParser('error.source')).toMatch(/PropertyNodeWrite/);
                done();
            });
        });

        it('callback function can read from vireo using parameters', function (done) {
            var expectedValues = {
                myBoolValue: false,
                stringLocal: 'Dolor amet sit amet',
                doubleLocal: 1234.5678,
                int32Local: -1000,
                uint32Local: 9876543,
                complexDoubleLocal: {
                    real: 5.045,
                    imaginary: -5.67
                },
                timestampLocal: {
                    seconds: 3564057536,
                    fraction: 7811758927381449000
                }
            };
            var writeFunction = function (viName, fpId, propertyName, propertyTypeName, propertyPath) {
                var readValue = viPathParser(propertyPath);
                var expectedVal = expectedValues[propertyPath];
                expect(readValue).toEqual(expectedVal);
            };
            vireo.propertyNode.setPropertyWriteFunction(writeFunction);

            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                done();
            });
        });
    });
});
