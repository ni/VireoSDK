describe('The Vireo EggShell readValueRefObject', function () {
    'use strict';

    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var expectValidValueRef = function (valueRef) {
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

    describe('for a cluster of scalars', function () {
        var valueRef,
            clusterOfScalarsPath = 'dataItem_ClusterOfScalars';

        beforeAll(function () {
            valueRef = vireo.eggShell.findValueRef(viName, clusterOfScalarsPath);
        });

        it('returns an object with field names as keys and valueRefs as values', function () {
            var objectRef = vireo.eggShell.readValueRefObject(valueRef);
            expectValidValueRef(objectRef.bool);
            expectValidValueRef(objectRef.string);
            expectValidValueRef(objectRef.double);
            expectValidValueRef(objectRef.int32);
            expectValidValueRef(objectRef.int64);
            expectValidValueRef(objectRef.uint64);
            expectValidValueRef(objectRef.complex);
            expectValidValueRef(objectRef.time);
        });

        it('valueRefObject can be used to read from it', function () {
            var objectValueRef = vireo.eggShell.readValueRefObject(valueRef);
            expect(vireo.eggShell.readDouble(objectValueRef.bool)).toBe(1);
            expect(vireo.eggShell.readDouble(objectValueRef.double)).toMatchIEEE754Number(3.14159);
            expect(vireo.eggShell.readDouble(objectValueRef.int32)).toBe(42);
            expect(vireo.eggShell.readDouble(objectValueRef.int64)).toBe(-72057594037927936);
            expect(vireo.eggShell.readDouble(objectValueRef.uint64)).toBe(9223372041149743104);
            expect(vireo.eggShell.readDouble(objectValueRef.time)).toBe(3564057536.423476);
        });
    });

    describe('for a timestamp', function () {
        var valueRef,
            timestampPath = 'dataItem_Timestamp';

        beforeAll(function () {
            valueRef = vireo.eggShell.findValueRef(viName, timestampPath);
        });

        it('returns something', function () {
            var objectValueRef = vireo.eggShell.readValueRefObject(valueRef);
            expectValidValueRef(objectValueRef.seconds);
            expectValidValueRef(objectValueRef.fraction);
        });
    });

    describe('for an analogwaveform', function () {
        var valueRef,
            analogWaveformPath = 'wave_Double';

        beforeAll(function () {
            valueRef = vireo.eggShell.findValueRef(viName, analogWaveformPath);
        });

        it('returns something else', function () {
            var objectValueRef = vireo.eggShell.readValueRefObject(valueRef);
            expectValidValueRef(objectValueRef.t0);
            expectValidValueRef(objectValueRef.dt);
            expectValidValueRef(objectValueRef.Y);
        });
    });

    describe('for complex', function () {
        var valueRef,
            complexSinglePath = 'dataItem_ComplexSingle';

        beforeAll(function () {
            valueRef = vireo.eggShell.findValueRef(viName, complexSinglePath);
        });

        it('returns something else', function () {
            var objectValueRef = vireo.eggShell.readValueRefObject(valueRef);
            expectValidValueRef(objectValueRef.real);
            expectValidValueRef(objectValueRef.imaginary);
        });
    });

    describe('for a 1-D array of', function () {
        it('booleans', function () {
            var valueRef = vireo.eggShell.findValueRef(viName, 'dataItem_ArrayOfBoolean');
            var objectValueRef = vireo.eggShell.readValueRefObject(valueRef);
            console.log(objectValueRef);
            expectValidValueRef(objectValueRef['']);
        });
    });
});
