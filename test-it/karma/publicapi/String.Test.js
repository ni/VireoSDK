describe('The Vireo EggShell String api can', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var readString = function (path) {
        return vireo.eggShell.readString(vireo.eggShell.findValueRef(viName, path));
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    describe('use readString', function () {
        fit('to read different string values from memory', function () {
            var valueRef = vireo.eggShell.findValueRef(viName, 'dataItem_String');
            vireo.eggShell.readString(valueRef);
            expect(readString('dataItem_String')).toBe('Hello');
        });
    });
});
