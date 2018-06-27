describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var spyHelpers = window.testHelpers.spyHelpers;

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
            var spy,
                propertyName = 'Value';

            beforeEach(function () {
                spy = jasmine.createSpy();
                vireo.propertyNode.setPropertyReadFunction(spy);
            });

            it('when controlRef and property var are in the same top VI', function (done) {
                var expectedCallArgs = [
                    [propertyReadVIName, 'dataItem_Boolean', propertyName, 'Boolean', propertyReadVIName, 'local_Boolean'],
                    [propertyReadVIName, 'dataItem_Int8', propertyName, 'Int8', propertyReadVIName, 'local_Int8'],
                    [propertyReadVIName, 'dataItem_Int16', propertyName, 'Int16', propertyReadVIName, 'local_Int16'],
                    [propertyReadVIName, 'dataItem_Int32', propertyName, 'Int32', propertyReadVIName, 'local_Int32'],
                    [propertyReadVIName, 'dataItem_Int64', propertyName, 'Int64', propertyReadVIName, 'local_Int64'],
                    [propertyReadVIName, 'dataItem_UInt8', propertyName, 'UInt8', propertyReadVIName, 'local_UInt8'],
                    [propertyReadVIName, 'dataItem_UInt16', propertyName, 'UInt16', propertyReadVIName, 'local_UInt16'],
                    [propertyReadVIName, 'dataItem_UInt32', propertyName, 'UInt32', propertyReadVIName, 'local_UInt32'],
                    [propertyReadVIName, 'dataItem_UInt64', propertyName, 'UInt64', propertyReadVIName, 'local_UInt64'],
                    [propertyReadVIName, 'dataItem_Single', propertyName, 'Single', propertyReadVIName, 'local_Single'],
                    [propertyReadVIName, 'dataItem_Double', propertyName, 'Double', propertyReadVIName, 'local_Double'],
                    [propertyReadVIName, 'dataItem_ComplexSingle', propertyName, 'ComplexSingle', propertyReadVIName, 'local_ComplexSingle'],
                    [propertyReadVIName, 'dataItem_ComplexDouble', propertyName, 'ComplexDouble', propertyReadVIName, 'local_ComplexDouble'],
                    [propertyReadVIName, 'dataItem_String', propertyName, 'String', propertyReadVIName, 'local_String'],
                    [propertyReadVIName, 'dataItem_Timestamp', propertyName, 'Timestamp', propertyReadVIName, 'local_Timestamp'],
                    [propertyReadVIName, 'dataItem_MíNúmero', propertyName, 'Double', propertyReadVIName, 'numberLocal'],
                    [propertyReadVIName, 'dataItem_MíNúmero', propertyName, 'Double', propertyReadVIName, 'clusterLocal.%3Anumeric%3A'],
                    [propertyReadVIName, 'dataItem_Boolean', propertyName, 'Boolean', propertyReadVIName, 'clusterLocal.nestedClusterLocal.Boolean%20Space%20Part']
                ];
                runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
                runSlicesAsync(function (rawPrint, rawPrintError) {
                    expect(rawPrint).toBeEmptyString();
                    expect(rawPrintError).toBeEmptyString();
                    spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
                    done();
                });
            });

            it('when controlRef is in top VI and property var is in subVI', function (done) {
                var topVIName = 'TopVI',
                    subVIName = 'subVI';
                var expectedCallArgs = [
                    [topVIName, 'dataItem_Boolean', 'Value', 'Boolean', subVIName, 'booleanLocal'],
                    [topVIName, 'dataItem_String', 'Value', 'String', subVIName, 'stringLocal'],
                    [topVIName, 'dataItem_Double', 'Value', 'Double', subVIName, 'doubleLocal']
                ];
                runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, topVIControlRefReadViaUrl);
                runSlicesAsync(function (rawPrint, rawPrintError) {
                    expect(rawPrint).toBeEmptyString();
                    expect(rawPrintError).toBeEmptyString();
                    spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
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
            var complexToRead = {
                real: 10,
                imaginary: -10
            };
            var expectedTimestamp = {
                seconds: '0',
                fraction: '0'
            };
            var valuesToRead = [true, -123, -4321, -987654321, '-9876543210', 123, 4321, 987654321, '9876543210',
                3.5, 6.28, complexToRead, complexToRead, 'Lorem ipsum', expectedTimestamp, 1.618, 3.236, true];

            var readFunction = generateReadFunction(valuesToRead);
            vireo.propertyNode.setPropertyReadFunction(readFunction);
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
            var viPathParser = vireoRunner.createVIPathParser(vireo, propertyReadVIName);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('local_Boolean')).toEqual(valuesToRead[0]);
                expect(viPathParser('local_Int8')).toEqual(valuesToRead[1]);
                expect(viPathParser('local_Int16')).toEqual(valuesToRead[2]);
                expect(viPathParser('local_Int32')).toEqual(valuesToRead[3]);
                expect(viPathParser('local_Int64')).toEqual(valuesToRead[4]);
                expect(viPathParser('local_UInt8')).toEqual(valuesToRead[5]);
                expect(viPathParser('local_UInt16')).toEqual(valuesToRead[6]);
                expect(viPathParser('local_UInt32')).toEqual(valuesToRead[7]);
                expect(viPathParser('local_UInt64')).toEqual(valuesToRead[8]);
                expect(viPathParser('local_Single')).toEqual(valuesToRead[9]);
                expect(viPathParser('local_Double')).toEqual(valuesToRead[10]);
                expect(viPathParser('local_ComplexSingle')).toEqual(valuesToRead[11]);
                expect(viPathParser('local_ComplexDouble')).toEqual(valuesToRead[12]);
                expect(viPathParser('local_String')).toEqual(valuesToRead[13]);
                expect(viPathParser('local_Timestamp')).toEqual(expectedTimestamp);
                expect(viPathParser('numberLocal')).toEqual(valuesToRead[15]);
                expect(viPathParser('clusterLocal.%3Anumeric%3A')).toEqual(valuesToRead[16]);
                expect(viPathParser('clusterLocal.nestedClusterLocal.Boolean%20Space%20Part')).toEqual(valuesToRead[17]);
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
        var generateWriteVerifier = function (expectedValues) {
            return function (viName, fpId, propertyName, propertyTypeName, propertyVIName, propertyPath) {
                var parser = vireoRunner.createVIPathParser(vireo, propertyVIName);
                var readValue = parser(propertyPath);
                var expectedVal = expectedValues[propertyPath];
                expect(readValue).toEqual(expectedVal);
            };
        };

        describe('callback is invoked with expected parameters', function () {
            var spy,
                propertyName = 'Value';

            beforeEach(function () {
                spy = jasmine.createSpy();
                vireo.propertyNode.setPropertyWriteFunction(spy);
            });

            it('when controlRef and property var are in the same top VI', function (done) {
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

            it('when controlRef is in top vi and property var is in sub VI', function (done) {
                var topVIName = 'TopVI',
                    subVIName = 'subVI',
                    expectedCallArgs = [
                        [topVIName, 'dataItem_Boolean', 'Value', 'Boolean', subVIName, 'booleanLocal'],
                        [topVIName, 'dataItem_String', 'Value', 'String', subVIName, 'stringLocal'],
                        [topVIName, 'dataItem_Double', 'Value', 'Double', subVIName, 'doubleLocal']
                    ];
                runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, topVIControlRefWriteViaUrl);
                runSlicesAsync(function (rawPrint, rawPrintError) {
                    expect(rawPrint).toBeEmptyString();
                    expect(rawPrintError).toBeEmptyString();
                    spyHelpers.verifySpyArgumentsForCalls(spy, expectedCallArgs);
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
            // Must match default values in .via
            var expectedValues = {
                local_Boolean: false,
                local_Int8: -123,
                local_Int16: -4321,
                local_Int32: -987654321,
                local_Int64: '-9876543210',
                local_UInt8: 123,
                local_UInt16: 4321,
                local_UInt32: 987654321,
                local_UInt64: '9876543210',
                local_Single: 3.5,
                local_Double: 1234.5678,
                local_ComplexSingle: {
                    real: 5.25,
                    imaginary: -5.5
                },
                local_ComplexDouble: {
                    real: 5.045,
                    imaginary: -5.67
                },
                local_String: 'Dolor amet sit amet',
                local_Timestamp: {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }
            };
            var writeFunction = generateWriteVerifier(expectedValues);
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
