describe('The Vireo EggShell readJSON api can read', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    var viName = 'MyVI';
    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    describe('scalars of type', function () {
        it('Boolean', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Boolean');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe(true);
        });

        it('String', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_String');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe('Hello');
        });

        it('Double', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe(123.456);
        });

        it('Int32', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Numeric32');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe(-1073741824);
        });

        // 64-bit numeric representation should be returned as JSON strings to prevent loss of precision
        xit('Int64', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Numeric64');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe('-1152921504606846976');
        });

        // 64-bit numeric representation should be returned as JSON strings to prevent loss of precision
        it('Int64 workaround', function () {
            var numberInvalid = vireo.eggShell.readJSON(viName, 'dataItem_Numeric64');
            var actualJSON = '"' + numberInvalid + '"';
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe('-1152921504606846976');
        });

        // 64-bit numeric representation should be returned as JSON strings to prevent loss of precision
        xit('UInt64', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericU64');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe('18446744073709551615');
        });

        // Workaround that is used until readJSON returns the right value
        it('UInt64 workaround', function () {
            var numberInvalid = vireo.eggShell.readJSON(viName, 'dataItem_NumericU64');
            var actualJSON = '"' + numberInvalid + '"';
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe('18446744073709551615');
        });

        it('ComplexDouble', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Complex');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual({
                real: 1337.73,
                imaginary: -9283.12
            });
        });

        // The timestamp components that are 64-bit numeric representation should be returned as JSON strings
        xit('Timestamp', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Timestamp');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual({
                seconds: '3564057536',
                fraction: '7811758927381448193'
            });
        });

        // Workaround that is used until readJSON returns the right value
        it('Timestamp workaround', function () {
            var secondsInvalid = vireo.eggShell.readJSON(viName, 'dataItem_Timestamp.seconds');
            var fractionInvalid = vireo.eggShell.readJSON(viName, 'dataItem_Timestamp.fraction');
            var secondsInvalidJSON = '"' + secondsInvalid + '"';
            var fractionInvalidJSON = '"' + fractionInvalid + '"';
            var actualJSON = '{"seconds":' + secondsInvalidJSON + ', "fraction":' + fractionInvalidJSON + '}';
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual({
                seconds: '3564057536',
                fraction: '7811758927381448193'
            });
        });
    });
});
