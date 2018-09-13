describe('The Vireo PropertyNode', function () {
    'use strict';

    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiPropertyNodeWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeWrite.via');
    var publicApiPropertyNodeRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeRead.via');
    var topVIControlRefReadViaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/TopVIControlRefSubVIRead.via');
    var topVIControlRefWriteViaUrl = fixtures.convertToAbsoluteFromFixturesDir('propertynode/TopVIControlRefSubVIWrite.via');
    var propertyReadVIName = '%3AWeb%20Server%3AInteractive%3AWebApp%3AMain%2Egviweb';
    var propertyWriteVIName = 'MyVI';

    var expectValidValueRef = function (valueRef) {
        expect(valueRef).toBeObject();
        expect(valueRef.typeRef).toBeDefined();
        expect(valueRef.dataRef).toBeDefined();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.dataRef).toBeNumber();
    };

    var writeValue = function (valueRef, value) {
        vireo.eggShell.writeJSON(valueRef, JSON.stringify(value));
    };

    var propertyNodeCallbackTest = function (viaPath, viName, expectedControlRefs, propertyName, spy, done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            var callCount = spy.calls.count();
            expect(callCount).toEqual(expectedControlRefs.length);
            for (var i = 0; i < callCount; i += 1) {
                var args = spy.calls.argsFor(i);
                expect(args[0]).toEqual(viName);
                expect(args[1]).toEqual(expectedControlRefs[i]);
                expect(args[2]).toEqual(propertyName);
                expectValidValueRef(args[3]);
            }

            done();
        });
    };

    var writeErrorTest = function (viaPath, viName, errorSource, done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(1055);
            expect(viPathParser('error.source')).toMatch(errorSource);
            done();
        });
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiPropertyNodeRead,
            publicApiPropertyNodeWrite,
            topVIControlRefReadViaUrl,
            topVIControlRefWriteViaUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
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
        var generateReadFunction = function (valuesToRead) {
            var indexToRead = 0;
            return function (viName, fpId, propertyName, valueRef) {
                var valueRead = valuesToRead[indexToRead];
                indexToRead += 1;
                writeValue(valueRef, valueRead);
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
                var expectedControlRefs = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '16', '1'];
                propertyNodeCallbackTest(publicApiPropertyNodeRead, propertyReadVIName, expectedControlRefs, propertyName, spy, done);
            });

            it('when controlRef is in top VI and property var is in subVI', function (done) {
                var topVIName = 'TopVI',
                    expectedControlRefs = ['1', '2', '3'];
                propertyNodeCallbackTest(topVIControlRefReadViaUrl, topVIName, expectedControlRefs, propertyName, spy, done);
            });
        });

        it('writes an error when callback function throws', function (done) {
            var readFunction = function () {
                throw new Error('This is not good');
            };
            vireo.propertyNode.setPropertyReadFunction(readFunction);
            writeErrorTest(publicApiPropertyNodeRead, propertyReadVIName, /PropertyNodeRead/, done);
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
            var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
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
            var index = 0;
            return function (viName, fpId, propertyName, valueRef) {
                var readValue = JSON.parse(vireo.eggShell.readJSON(valueRef));
                var expectedVal = expectedValues[index];
                expect(readValue).toEqual(expectedVal);
                index += 1;
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
                var expectedControlRefs = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

                propertyNodeCallbackTest(publicApiPropertyNodeWrite, propertyWriteVIName, expectedControlRefs, propertyName, spy, done);
            });

            it('when controlRef is in top vi and property var is in sub VI', function (done) {
                var topVIName = 'TopVI',
                    expectedControlRefs = ['1', '2', '3'];

                propertyNodeCallbackTest(topVIControlRefWriteViaUrl, topVIName, expectedControlRefs, propertyName, spy, done);
            });
        });

        it('writes an error when callback function throws', function (done) {
            var writeFunction = function () {
                throw new Error('This is not good');
            };
            vireo.propertyNode.setPropertyWriteFunction(writeFunction);

            writeErrorTest(publicApiPropertyNodeWrite, propertyWriteVIName, /PropertyNodeWrite/, done);
        });

        it('callback function can read from vireo using parameters', function (done) {
            // Must match default values in .via
            var expectedValues = [
                false,
                -123,
                -4321,
                -987654321,
                '-9876543210',
                123,
                4321,
                987654321,
                '9876543210',
                3.5,
                1234.5678,
                {
                    real: 5.25,
                    imaginary: -5.5
                },
                {
                    real: 5.045,
                    imaginary: -5.67
                },
                'Dolor amet sit amet',
                {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }
            ];
            var writeFunction = generateWriteVerifier(expectedValues);
            vireo.propertyNode.setPropertyWriteFunction(writeFunction);
            var viPathParser = vireoRunner.createVIPathParser(vireo, propertyWriteVIName);
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();
                expect(viPathParser('error.status')).toBeFalse();
                expect(viPathParser('error.code')).toBe(0);
                expect(viPathParser('error.source')).toBeEmptyString();
                done();
            });
        });
    });
});
