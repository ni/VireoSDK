describe('The Vireo EggShell Double api can', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var readDouble = function (path, subPath) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        var subValueRef = vireo.eggShell.findSubValueRef(valueRef, subPath);
        return vireo.eggShell.readDouble(subValueRef);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    describe('use readDouble', function () {
        it('to read different double values from 1-D arrays', function () {
            expect(readDouble('dataItem_ArrayOfBoolean', '3')).toBe(1);
            expect(readDouble('dataItem_ArrayOfDouble', '4')).toMatchIEEE754Number(1234.5678);
            expect(readDouble('dataItem_ArrayOfInt32', '3')).toBe(9876543);
            expect(readDouble('dataItem_ArrayOfInt64', '1')).toBe(9090);
            expect(readDouble('dataItem_ArrayOfTimestamp', '0')).toMatchIEEE754Number(3564057536.423476);
        });

        it('to read different double values from N-dimensional arrays', function () {
            expect(readDouble('dataItem_2DArrayOfBoolean', '2,1')).toBe(1);
            expect(readDouble('dataItem_2DArrayOfDouble', '1,2')).toMatchIEEE754Number(-6.789);
            expect(readDouble('dataItem_3DArrayOfInt32', '1,1,2')).toBe(223);
            expect(readDouble('dataItem_2DArrayOfInt64', '0,0')).toBe(9090);
            expect(readDouble('dataItem_2DArrayOfTimestamp', '0,1')).toMatchIEEE754Number(3564057542.904824);
        });

        it('to read different double values from clusters', function () {
            var path = 'dataItem_ClusterOfScalars';
            expect(readDouble(path, 'bool')).toBe(1);
            expect(readDouble(path, 'double')).toMatchIEEE754Number(3.14159);
            expect(readDouble(path, 'int32')).toBe(42);
            expect(readDouble(path, 'int64')).toBe(-72057594037927936);
            expect(readDouble(path, 'uint64')).toBe(9223372041149743104);
            expect(readDouble(path, 'time')).toMatchIEEE754Number(3564057536.423476);
        });

        it('to read different double values from array of clusters', function () {
            var path = 'dataItem_ArrayOfClusters';
            expect(readDouble(path, '0.bool')).toBe(1);
            expect(readDouble(path, '1.double')).toMatchIEEE754Number(6.2831);
            expect(readDouble(path, '2.int32')).toBe(144);
            expect(readDouble(path, '0.int64')).toBe(72057594037927936);
            expect(readDouble(path, '1.time')).toMatchIEEE754Number(3564059871.423476);
        });

        it('to read different double values from cluster of arrays', function () {
            var path = 'dataItem_ClusterOfArrays';
            expect(readDouble(path, 'booleans.2')).toBe(1);
            expect(readDouble(path, 'doubles.3')).toMatchIEEE754Number(7.89);
            expect(readDouble(path, 'int32s.0')).toBe(-1000);
            expect(readDouble(path, 'int64s.1')).toBe(9090);
            expect(readDouble(path, 'uint64s.2')).toBe(9223376434901286912);
            expect(readDouble(path, 'times.1')).toMatchIEEE754Number(3564057542.904824);
        });
    });
});
