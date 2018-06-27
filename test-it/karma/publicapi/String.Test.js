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

    var writeString = function (path, str) {
        vireo.eggShell.writeString(vireo.eggShell.findValueRef(viName, path), str);
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
        it('to read different string values from memory', function () {
            expect(readString('dataItem_String')).toBe('Hello');
        });

        it('to throw on unsupported types', function () {
            var readStringThrows = function () {
                readString('dataItem_NumericDouble');
            };
            expect(readStringThrows).toThrowError(/UnexpectedObjectType/);
        });
    });

    describe('use writeString', function () {
        it('to write different string values from memory', function () {
            expect(readString('dataItem_String')).toBe('Hello');
            writeString('dataItem_String', 'Iñtërnâtiônàlizætiøn☃💩');
            expect(readString('dataItem_String')).toBe('Iñtërnâtiônàlizætiøn☃💩');
        });
    });
});
