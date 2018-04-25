describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiPropertyNodeWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeWrite.via');
    var publicApiPropertyNodeRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeRead.via');
    var topVIControlRefReadViaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/TopVIControlRefSubVIRead.via');
    var topVIControlRefWriteViaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/TopVIControlRefSubVIWrite.via');
    var propertyReadVIName = '%3AWeb%20Server%3AInteractive%3AWebApp%3AMain%2Egviweb';
    var propertyWriteVIName = 'MyVI';

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiPropertyNodeRead,
            publicApiPropertyNodeWrite,
            topVIControlRefReadViaUrl,
            topVIControlRefWriteViaUrl
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    it('setPropertyReadFunction when trying to set not a function throws', function () {
        var notFunctions = [{}, [], '', 234, undefined, null];
        notFunctions.forEach(function (element) {
            var setPropertyReadFunction = function () {
                vireo.propertyNode.setPropertyReadFunction(element);
            };

            expect(setPropertyReadFunction).toThrowError(/callable function/);
        });
    });

    describe('propertyRead', function () {
        var runSlicesAsync;
        var generateReadFunction = function (valuesToRead) {
            var indexToRead = 0;
            return function (viName, fpId, propertyName, propertyTypeName, propertyViName, propertyPath) {
                var writer = vireoRunner.createVIPathWriter(vireo, propertyViName);
                var valueRead = valuesToRead[indexToRead];
                indexToRead += 1;
                writer(propertyPath, valueRead);
            };
        };

        describe('callback is invoked with expected parameters', function () {
            var spy;

            beforeEach(function () {
                spy = jasmine.createSpy();
                vireo.propertyNode.setPropertyReadFunction(spy);
            });

            it('when controlRef and property var are in the same top VI', function (done) {
                runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
                runSlicesAsync(function (rawPrint, rawPrintError) {
                    expect(rawPrint).toBeEmptyString();
                    expect(rawPrintError).toBeEmptyString();
                    expect(spy.calls.argsFor(0)).toEqual([propertyReadVIName, 'dataItem_Boolean', 'value', 'Boolean', propertyReadVIName, 'booleanLocal']);
                    expect(spy.calls.argsFor(1)).toEqual([propertyReadVIName, 'dataItem_String', 'value', 'String', propertyReadVIName, 'stringLocal']);
                    expect(spy.calls.argsFor(2)).toEqual([propertyReadVIName, 'dataItem_Double', 'value', 'Double', propertyReadVIName, 'doubleLocal']);
                    expect(spy.calls.argsFor(3)).toEqual([propertyReadVIName, 'dataItem_Int32', 'value', 'Int32', propertyReadVIName, 'int32Local']);
                    expect(spy.calls.argsFor(4)).toEqual([propertyReadVIName, 'dataItem_UInt32', 'value', 'UInt32', propertyReadVIName, 'uint32Local']);
                    expect(spy.calls.argsFor(5)).toEqual([propertyReadVIName, 'dataItem_ComplexDouble', 'value', 'ComplexDouble', propertyReadVIName, 'complexDoubleLocal']);
                    expect(spy.calls.argsFor(6)).toEqual([propertyReadVIName, 'dataItem_Timestamp', 'value', 'Timestamp', propertyReadVIName, 'timestampLocal']);
                    expect(spy.calls.argsFor(7)).toEqual([propertyReadVIName, 'dataItem_MíNúmero', 'Value', 'Double', propertyReadVIName, 'numberLocal']);
                    expect(spy.calls.argsFor(8)).toEqual([propertyReadVIName, 'dataItem_MíNúmero', 'Value', 'Double', propertyReadVIName, 'clusterLocal.%3Anumeric%3A']);
                    expect(spy.calls.argsFor(9)).toEqual([propertyReadVIName, 'dataItem_Boolean', 'Value', 'Boolean', propertyReadVIName, 'clusterLocal.nestedClusterLocal.Boolean%20Space%20Part']);
                    done();
                });
            });

            it('when controlRef is in top VI and property var is in subVI', function (done) {
                var topVIName = 'TopVI',
                    subVIName = 'subVI';
                runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, topVIControlRefReadViaUrl);
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

        it('writes an error when callback function throws', function (done) {
            var readFunction = function () {
                throw new Error('This is not good');
            };
            vireo.propertyNode.setPropertyReadFunction(readFunction);

            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
            var viPathParser = vireoRunner.createVIPathParser(vireo, propertyReadVIName);
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
            var readFunction = generateReadFunction(valuesToRead);
            vireo.propertyNode.setPropertyReadFunction(readFunction);
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
            var viPathParser = vireoRunner.createVIPathParser(vireo, propertyReadVIName);
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
            var setPropertyWriteFunction = function () {
                vireo.propertyNode.setPropertyWriteFunction(element);
            };

            expect(setPropertyWriteFunction).toThrowError(/callable function/);
        });
    });

    describe('propertyWrite', function () {
        var runSlicesAsync;
        var generateWriteFunction = function (expectedValues) {
            return function (viName, fpId, propertyName, propertyTypeName, propertyVIName, propertyPath) {
                var parser = vireoRunner.createVIPathParser(vireo, propertyVIName);
                var readValue = parser(propertyPath);
                var expectedVal = expectedValues[propertyPath];
                expect(readValue).toEqual(expectedVal);
            };
        };

        describe('callback is invoked with expected parameters', function () {
            var spy;

            beforeEach(function () {
                spy = jasmine.createSpy();
                vireo.propertyNode.setPropertyWriteFunction(spy);
            });

            it('when controlRef and property var are in the same top VI', function (done) {
                runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
                runSlicesAsync(function (rawPrint, rawPrintError) {
                    expect(rawPrint).toBeEmptyString();
                    expect(rawPrintError).toBeEmptyString();
                    expect(spy.calls.argsFor(0)).toEqual([propertyWriteVIName, 'dataItem_Boolean', 'value', 'Boolean', propertyWriteVIName, 'myBoolValue']);
                    expect(spy.calls.argsFor(1)).toEqual([propertyWriteVIName, 'dataItem_String', 'value', 'String', propertyWriteVIName, 'stringLocal']);
                    expect(spy.calls.argsFor(2)).toEqual([propertyWriteVIName, 'dataItem_Double', 'value', 'Double', propertyWriteVIName, 'doubleLocal']);
                    expect(spy.calls.argsFor(3)).toEqual([propertyWriteVIName, 'dataItem_Int32', 'value', 'Int32', propertyWriteVIName, 'int32Local']);
                    expect(spy.calls.argsFor(4)).toEqual([propertyWriteVIName, 'dataItem_UInt32', 'value', 'UInt32', propertyWriteVIName, 'uint32Local']);
                    expect(spy.calls.argsFor(5)).toEqual([propertyWriteVIName, 'dataItem_ComplexDouble', 'value', 'ComplexDouble', propertyWriteVIName, 'complexDoubleLocal']);
                    expect(spy.calls.argsFor(6)).toEqual([propertyWriteVIName, 'dataItem_Timestamp', 'value', 'Timestamp', propertyWriteVIName, 'timestampLocal']);
                    done();
                });
            });

            it('when controlRef is in top vi and property var is in sub VI', function (done) {
                var topVIName = 'TopVI',
                    subVIName = 'subVI';
                runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, topVIControlRefWriteViaUrl);
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

        it('writes an error when callback function throws', function (done) {
            var writeFunction = function () {
                throw new Error('This is not good');
            };
            vireo.propertyNode.setPropertyWriteFunction(writeFunction);
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
            var viPathParser = vireoRunner.createVIPathParser(vireo, propertyWriteVIName);
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
            var writeFunction = generateWriteFunction(expectedValues);
            vireo.propertyNode.setPropertyWriteFunction(writeFunction);
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                done();
            });
        });
    });
});
