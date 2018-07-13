describe('The Vireo EggShell Reflection API', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var typeDescriptor = (function () {
        var returnTypeName = function (name) {
            return function () {
                return name;
            };
        };

        return {
            visitBoolean: returnTypeName('Boolean'),
            visitEnum8: returnTypeName('Enum8'),
            visitEnum16: returnTypeName('Enum16'),
            visitEnum32: returnTypeName('Enum32'),
            visitInt8: returnTypeName('Int8'),
            visitInt16: returnTypeName('Int16'),
            visitInt32: returnTypeName('Int32'),
            visitInt64: returnTypeName('Int64'),
            visitUInt8: returnTypeName('UInt8'),
            visitUInt16: returnTypeName('UInt16'),
            visitUInt32: returnTypeName('UInt32'),
            visitUInt64: returnTypeName('UInt64'),
            visitSingle: returnTypeName('Single'),
            visitDouble: returnTypeName('Double'),
            visitString: returnTypeName('String'),
            visitComplexSingle: returnTypeName('ComplexSingle'),
            visitComplexDouble: returnTypeName('ComplexDouble'),
            visitAnalogWaveform: returnTypeName('AnalogWaveform'),
            visitTimestamp: returnTypeName('Timestamp'),
            visitPath: returnTypeName('Path'),
            visitArray: returnTypeName('Array'),
            visitCluster: returnTypeName('Cluster')
        };
    }());

    var validateValueRef = function (valueRef) {
        expect(valueRef).toBeNonEmptyObject();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.typeRef).not.toBe(0);
        expect(valueRef.dataRef).toBeNumber();
        expect(valueRef.dataRef).not.toBe(0);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    var getTypeName = function (path) {
        return vireo.eggShell.reflectOnValueRef(typeDescriptor, vireo.eggShell.findValueRef(viName, path));
    };

    var reflectOnEmptyVisitor = function (path) {
        var thePath = path;
        return function () {
            vireo.eggShell.reflectOnValueRef({}, vireo.eggShell.findValueRef(viName, thePath));
        };
    };

    describe('reflectOnValueRef', function () {
        describe('error handling', function () {
            it('throws when typeDescriptor is not an object', function () {
                var throwingFunction = function () {
                    vireo.eggShell.reflectOnValueRef([]);
                };

                expect(throwingFunction).toThrow();
            });

            it('throws when valueRef is not an object', function () {
                var throwingFunction = function () {
                    vireo.eggShell.reflectOnValueRef({}, []);
                };

                expect(throwingFunction).toThrow();
            });

            it('throws when visitor does not have visit methods for all types', function () {
                expect(reflectOnEmptyVisitor('int8MinValue')).toThrowError(/visitInt8/);
                expect(reflectOnEmptyVisitor('int16MinValue')).toThrowError(/visitInt16/);
                expect(reflectOnEmptyVisitor('int32MinValue')).toThrowError(/visitInt32/);
                expect(reflectOnEmptyVisitor('int64MinSafeInteger')).toThrowError(/visitInt64/);
                expect(reflectOnEmptyVisitor('uInt8MinValue')).toThrowError(/visitUInt8/);
                expect(reflectOnEmptyVisitor('uInt16MinValue')).toThrowError(/visitUInt16/);
                expect(reflectOnEmptyVisitor('uInt32MinValue')).toThrowError(/visitUInt32/);
                expect(reflectOnEmptyVisitor('uInt64MinSafeInteger')).toThrowError(/visitUInt64/);
                expect(reflectOnEmptyVisitor('dataItem_NumericSingle')).toThrowError(/visitSingle/);
                expect(reflectOnEmptyVisitor('dataItem_NumericDouble')).toThrowError(/visitDouble/);
                expect(reflectOnEmptyVisitor('dataItem_ComplexSingle')).toThrowError(/visitComplexSingle/);
                expect(reflectOnEmptyVisitor('dataItem_Complex')).toThrowError(/visitComplexDouble/);
                expect(reflectOnEmptyVisitor('dataItem_String')).toThrowError(/visitString/);
                expect(reflectOnEmptyVisitor('dataItem_Boolean')).toThrowError(/visitBoolean/);
                expect(reflectOnEmptyVisitor('dataItem_Timestamp')).toThrowError(/visitTimestamp/);
                expect(reflectOnEmptyVisitor('enum8alphabet')).toThrowError(/visitEnum8/);
                expect(reflectOnEmptyVisitor('enum16numbers')).toThrowError(/visitEnum16/);
                expect(reflectOnEmptyVisitor('enum32colors')).toThrowError(/visitEnum32/);
                expect(reflectOnEmptyVisitor('wave_Double')).toThrowError(/visitAnalogWaveform/);
                expect(reflectOnEmptyVisitor('dataItem_ClusterOfScalars')).toThrowError(/visitCluster/);
                expect(reflectOnEmptyVisitor('dataItem_ArrayOfBoolean')).toThrowError(/visitArray/);
            });

            it('throws for unsupported enum types', function () {
                expect(reflectOnEmptyVisitor('enum64releases')).toThrowError(/Unexpected size/);
            });
        });

        describe('dispatches a call on visitor', function () {
            it('for all numerics', function () {
                expect(getTypeName('int8MinValue')).toEqual('Int8');
                expect(getTypeName('int16MinValue')).toEqual('Int16');
                expect(getTypeName('int32MinValue')).toEqual('Int32');
                expect(getTypeName('int64MinSafeInteger')).toEqual('Int64');
                expect(getTypeName('uInt8MinValue')).toEqual('UInt8');
                expect(getTypeName('uInt16MinValue')).toEqual('UInt16');
                expect(getTypeName('uInt32MinValue')).toEqual('UInt32');
                expect(getTypeName('uInt64MinSafeInteger')).toEqual('UInt64');
                expect(getTypeName('dataItem_NumericSingle')).toEqual('Single');
                expect(getTypeName('dataItem_NumericDouble')).toEqual('Double');
                expect(getTypeName('dataItem_ComplexSingle')).toEqual('ComplexSingle');
                expect(getTypeName('dataItem_Complex')).toEqual('ComplexDouble');
            });

            it('for strings', function () {
                expect(getTypeName('dataItem_String')).toEqual('String');
            });

            it('for booleans', function () {
                expect(getTypeName('dataItem_Boolean')).toEqual('Boolean');
            });

            it('for aggregate types', function () {
                expect(getTypeName('dataItem_Timestamp')).toEqual('Timestamp');
                expect(getTypeName('enum8alphabet')).toEqual('Enum8');
                expect(getTypeName('enum16numbers')).toEqual('Enum16');
                expect(getTypeName('enum32colors')).toEqual('Enum32');
                expect(getTypeName('wave_Double')).toEqual('AnalogWaveform');
                expect(getTypeName('dataItem_ClusterOfScalars')).toEqual('Cluster');
                expect(getTypeName('dataItem_ArrayOfBoolean')).toEqual('Array');
            });

            it('with "this" bound to the visitor a valid valueRef and data as arguments', function () {
                var dummyData = {};
                var visitor = {};
                var validateVisitArgs = function (valueRef, data) {
                    /* eslint-disable no-invalid-this */
                    expect(this).toBe(visitor);
                    validateValueRef(valueRef);
                    expect(data).toBe(dummyData);
                };

                for (var visitkey in typeDescriptor) {
                    if (typeDescriptor.hasOwnProperty(visitkey)) {
                        visitor[visitkey] = validateVisitArgs;
                    }
                }

                var visitorArgsTest = function (path) {
                    vireo.eggShell.reflectOnValueRef(visitor, vireo.eggShell.findValueRef(viName, path), dummyData);
                };

                visitorArgsTest('int8MinValue');
                visitorArgsTest('int16MinValue');
                visitorArgsTest('int32MinValue');
                visitorArgsTest('int64MinSafeInteger');
                visitorArgsTest('uInt8MinValue');
                visitorArgsTest('uInt16MinValue');
                visitorArgsTest('uInt32MinValue');
                visitorArgsTest('uInt64MinSafeInteger');
                visitorArgsTest('dataItem_NumericSingle');
                visitorArgsTest('dataItem_NumericDouble');
                visitorArgsTest('dataItem_ComplexSingle');
                visitorArgsTest('dataItem_Complex');
                visitorArgsTest('dataItem_String');
                visitorArgsTest('dataItem_Boolean');
                visitorArgsTest('dataItem_Timestamp');
                visitorArgsTest('enum8alphabet');
                visitorArgsTest('enum16numbers');
                visitorArgsTest('enum32colors');
                visitorArgsTest('wave_Double');
                visitorArgsTest('dataItem_ClusterOfScalars');
                visitorArgsTest('dataItem_ArrayOfBoolean');
            });
        });
    });
});
