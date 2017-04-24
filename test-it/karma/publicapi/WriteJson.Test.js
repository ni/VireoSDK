describe('The Vireo EggShell writeJSON api can write', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();
    var viName = 'MyVI';

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');

    var writeTest = function (path, oldVal, newVal) {
        var oldValJSON = vireo.eggShell.readJSON(viName, path);
        var oldValActual = JSON.parse(oldValJSON);
        expect(oldValActual).toMatchIEEE754Number(oldVal);

        var newValToWriteJSON = JSON.stringify(newVal);
        vireo.eggShell.writeJSON(viName, path, newValToWriteJSON);

        var newValJSON = vireo.eggShell.readJSON(viName, path);
        var newValActual = JSON.parse(newValJSON);
        expect(newValActual).toMatchIEEE754Number(newVal);
    };

    var writeWorkaroundTest = function (path, oldVal, newVal) {
        var oldValString = vireo.eggShell.readJSON(viName, path);
        // Do not parse the JSON result as JSON or precision is lost
        expect(oldValString).toEqual(oldVal);

        // Do not stringify as JSON becasue string values are ignored
        vireo.eggShell.writeJSON(viName, path, newVal);

        var newValString = vireo.eggShell.readJSON(viName, path);
        // Do not parse the JSON result as JSON or precision is lost
        expect(newValString).toEqual(newVal);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    describe('scalars of type', function () {
        it('Boolean', function () {
            writeTest('dataItem_Boolean', true, false);
        });

        it('String', function () {
            writeTest('dataItem_String', 'Hello', 'Hello World! :D');
        });

        it('Double', function () {
            writeTest('dataItem_NumericDouble', 123.456, 1234.56789);
            writeTest('dataItem_NumericDouble', 1234.56789, (NaN).toString());
            writeTest('dataItem_NumericDouble', (NaN).toString(), (Infinity).toString());
            writeTest('dataItem_NumericDouble', (Infinity).toString(), (-Infinity).toString());
            writeTest('dataItem_NumericDouble', (-Infinity).toString(), +0);
            writeTest('dataItem_NumericDouble', +0, 123.456);
        });

        it('awesome but first some interesting JS tests', function () {
            // Apparantly JSON.stringify(-0) results in "0" but JSON.parse('-0') results in -0
            expect(JSON.parse(JSON.stringify(0))).toMatchIEEE754Number(0);
            expect(JSON.parse(JSON.stringify(+0))).toMatchIEEE754Number(0);
            expect(JSON.parse(JSON.stringify(-0))).toMatchIEEE754Number(0); // should be -0

            // Apparantly '+0' is not valid JSON
            expect(JSON.parse('0')).toMatchIEEE754Number(0);
            expect(JSON.parse('-0')).toMatchIEEE754Number(-0);

            // Several other approaches that don't preserve negative zero
            expect((-0).toString()).toBe('0');
            expect(String(-0)).toBe('0');
        });

        it('Double Negative Zero as JSON string', function () {
            // Summary of this test is that if you pass the JSON string '-0' or '"-0"' to vireo for a numeric
            // it will be handled correctly. The problem is that most of the JavaScript serializtion
            // approaches to not correctly serialize negative zero

            var oldVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(oldVal).toBe(123.456);

            // To properly handle this case the string serialization of -0 effectively has to be hard coded
            // since we cannot rely on toString or JSON.stringify
            var negativeZeroString = '-0';
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', JSON.stringify(negativeZeroString));

            var newVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(newVal).toMatchIEEE754Number(-0);

            // Reset double value
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', JSON.stringify(123.456));
        });

        it('Double Negative Zero as JSON number', function () {
            // Summary of this test is that if you pass the JSON string '-0' or '"-0"' to vireo for a numeric
            // it will be handled correctly. The problem is that most of the JavaScript serializtion
            // approaches to not correctly serialize negative zero

            var oldVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(oldVal).toBe(123.456);

            // To properly handle this case the string serialization of -0 effectively has to be hard coded
            // since we cannot rely on toString or JSON.stringify
            var negativeZeroString = '-0';
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', negativeZeroString);

            var newVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(newVal).toMatchIEEE754Number(-0);

            // Reset double value
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', JSON.stringify(123.456));
        });

        it('Int32', function () {
            writeTest('dataItem_Numeric32', -1073741824, -36963968);
        });

        it('Int64', function () {
            // TODO mraj when writing 64-bit values as strings is fixed the following can be enabled
            // writeTest('dataItem_Numeric64', '-1152921504606846976', '-36028797018963968');

            // TODO mraj a workaround has to be done to validate string writes to avoid loss of precision
            writeWorkaroundTest('dataItem_Numeric64', '-1152921504606846976', '-36028797018963968');
        });


    });
});
