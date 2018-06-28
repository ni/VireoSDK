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
            visitEnumUInt8: returnTypeName('Enum8'),
            visitEnumUInt16: returnTypeName('Enum16'),
            visitEnumUInt32: returnTypeName('Enum32'),
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
                expect(reflectOnEmptyVisitor('enum8alphabet')).toThrowError(/visitEnumUInt8/);
                expect(reflectOnEmptyVisitor('enum16numbers')).toThrowError(/visitEnumUInt16/);
                expect(reflectOnEmptyVisitor('enum32colors')).toThrowError(/visitEnumUInt32/);
                expect(reflectOnEmptyVisitor('wave_Double')).toThrowError(/visitAnalogWaveform/);
                expect(reflectOnEmptyVisitor('dataItem_ClusterOfScalars')).toThrowError(/visitCluster/);
                expect(reflectOnEmptyVisitor('dataItem_ArrayOfBoolean')).toThrowError(/visitArray/);
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
        });
    });
});
