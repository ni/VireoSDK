describe('The Vireo EggShell api', function () {
    'use strict';
    // Reference aliases
    const vireoHelpers = window.vireoHelpers;
    const vireoRunner = window.testHelpers.vireoRunner;
    const fixtures = window.testHelpers.fixtures;

    const publicApiVariantTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/VariantTypes.via');
    const viName = 'MyVI';

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiVariantTypesViaUrl
        ], done);
    });

    let vireo;
    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    beforeEach(async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiVariantTypesViaUrl);
        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toBe('');
        expect(rawPrintError).toBe('');
    });

    describe('can use readVariantAttribute to', function () {
        it('throw for none variant types', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'utf8string');
            expect(() => vireo.eggShell.readVariantAttribute(valueRef, 'nonexistant')).toThrowError(/InvalidTypeRef/);
        });

        it('not find an attribute in an empty variant without attributes', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'emptyAttributesVariant');
            const attributeValueRef = vireo.eggShell.readVariantAttribute(valueRef, 'nonexistant');
            expect(attributeValueRef).toBeUndefined();
        });

        it('to find a string attribute in an empty variant with attribute key1:value1', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'stringAttributeVariant');
            const attributeValueRef = vireo.eggShell.readVariantAttribute(valueRef, 'key1');
            const value = vireo.eggShell.readString(attributeValueRef);
            expect(attributeValueRef).toBeObject();
            expect(value).toBe('value1');
        });

        describe('with an empty variant with several different attributes of varied types', function () {
            it('to find a string attribute with name Iñtërnâtiônàlizætiøn☃💩', function () {
                const valueRef = vireo.eggShell.findValueRef(viName, 'multipleAttributeVariant');
                const attributeValueRef = vireo.eggShell.readVariantAttribute(valueRef, 'Iñtërnâtiônàlizætiøn☃💩');
                const value = vireo.eggShell.readString(attributeValueRef);
                expect(attributeValueRef).toBeObject();
                expect(value).toBe('value1');
            });

            it('to find a string attribute with name key1', function () {
                const valueRef = vireo.eggShell.findValueRef(viName, 'multipleAttributeVariant');
                const attributeValueRef = vireo.eggShell.readVariantAttribute(valueRef, 'key1');
                const value = vireo.eggShell.readString(attributeValueRef);
                expect(attributeValueRef).toBeObject();
                expect(value).toBe('Iñtërnâtiônàlizætiøn☃💩');
            });

            it('to find a string attribute with name key2', function () {
                const valueRef = vireo.eggShell.findValueRef(viName, 'multipleAttributeVariant');
                const attributeValueRef = vireo.eggShell.readVariantAttribute(valueRef, 'key2');
                const valueTypedArray = vireo.eggShell.readTypedArray(attributeValueRef);
                const value = Array.from(valueTypedArray);
                expect(attributeValueRef).toBeObject();
                expect(value).toEqual([-1000, -10, 42, 9876543, 123]);
            });
        });
    });

    describe('can use writeVariantAttribute to', function () {
        it('throw for none variant types', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'utf8string');
            expect(() => vireo.eggShell.writeVariantAttributeAsString(valueRef, 'nonexistant', 'test')).toThrowError(/InvalidTypeRef/);
        });

        it('wite an attribute in an empty variant without attributes', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'emptyAttributesVariant');
            vireo.eggShell.writeVariantAttributeAsString(valueRef, 'myattribute', 'hello world');
            const resultValueRef = vireo.eggShell.readVariantAttribute(valueRef, 'myattribute');
            const result = vireo.eggShell.readString(resultValueRef);
            expect(result).toBe('hello world');
        });
    });
});
