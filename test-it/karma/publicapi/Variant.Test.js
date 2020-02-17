// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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

    describe('can use getVariantAttribute', function () {
        it('to throw for none variant types', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'utf8string');
            expect(() => vireo.eggShell.getVariantAttribute(valueRef, 'nonexistant')).toThrowError(/InvalidTypeRef/);
        });

        it('to not find an attribute in an empty variant without attributes', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'emptyAttributesVariant');
            const attributeValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'nonexistant');
            expect(attributeValueRef).toBeUndefined();
        });

        it('to find a string attribute in an empty variant with attribute key1:value1', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'stringAttributeVariant');
            const attributeValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'key1');
            const value = vireo.eggShell.readString(attributeValueRef);
            expect(attributeValueRef).toBeObject();
            expect(value).toBe('value1');
        });

        describe('with an empty variant with several different attributes of varied types', function () {
            it('to find a string attribute with name Iñtërnâtiônàlizætiøn☃💩', function () {
                const valueRef = vireo.eggShell.findValueRef(viName, 'multipleAttributeVariant');
                const attributeValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'Iñtërnâtiônàlizætiøn☃💩');
                const value = vireo.eggShell.readString(attributeValueRef);
                expect(attributeValueRef).toBeObject();
                expect(value).toBe('value1');
            });

            it('to find a string attribute with name key1', function () {
                const valueRef = vireo.eggShell.findValueRef(viName, 'multipleAttributeVariant');
                const attributeValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'key1');
                const value = vireo.eggShell.readString(attributeValueRef);
                expect(attributeValueRef).toBeObject();
                expect(value).toBe('Iñtërnâtiônàlizætiøn☃💩');
            });

            it('to find a string attribute with name key2', function () {
                const valueRef = vireo.eggShell.findValueRef(viName, 'multipleAttributeVariant');
                const attributeValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'key2');
                const valueTypedArray = vireo.eggShell.readTypedArray(attributeValueRef);
                const value = Array.from(valueTypedArray);
                expect(attributeValueRef).toBeObject();
                expect(value).toEqual([-1000, -10, 42, 9876543, 123]);
            });
        });
    });

    describe('can use setVariantAttributeAsString to', function () {
        it('throw for none variant types', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'utf8string');
            expect(() => vireo.eggShell.setVariantAttributeAsString(valueRef, 'nonexistant', 'test')).toThrowError(/InvalidTypeRef/);
        });

        it('wite an attribute in an empty variant without attributes', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'emptyAttributesVariant');
            vireo.eggShell.setVariantAttributeAsString(valueRef, 'myattribute', 'hello world');
            const resultValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'myattribute');
            const result = vireo.eggShell.readString(resultValueRef);
            expect(result).toBe('hello world');
        });

        it('overrites an existing attribute in an empty variant with attributes', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'stringAttributeVariant');
            const attributeValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'key1');
            const value = vireo.eggShell.readString(attributeValueRef);
            expect(attributeValueRef).toBeObject();
            expect(value).toBe('value1');

            vireo.eggShell.setVariantAttributeAsString(valueRef, 'key1', 'new updated value');
            const resultValueRef = vireo.eggShell.getVariantAttribute(valueRef, 'key1');
            const result = vireo.eggShell.readString(resultValueRef);
            expect(result).toBe('new updated value');
        });
    });

    describe('can use deleteVariantAttribute', function () {
        it('to throw for none variant types', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'utf8string');
            expect(() => vireo.eggShell.deleteVariantAttribute(valueRef, 'nonexistant')).toThrowError(/InvalidTypeRef/);
        });

        it('to not find an attribute in an empty variant without attributes', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'emptyAttributesVariant');
            const found = vireo.eggShell.deleteVariantAttribute(valueRef, 'nonexistant');
            expect(found).toBeFalse();
        });

        it('to find a string attribute in an empty variant with attribute key1:value1', function () {
            const valueRef = vireo.eggShell.findValueRef(viName, 'stringAttributeVariant');
            const attributeValueRefBefore = vireo.eggShell.getVariantAttribute(valueRef, 'key1');
            const value = vireo.eggShell.readString(attributeValueRefBefore);
            expect(attributeValueRefBefore).toBeObject();
            expect(value).toBe('value1');

            const found = vireo.eggShell.deleteVariantAttribute(valueRef, 'key1');
            expect(found).toBe(true);

            const attributeValueRefAfter = vireo.eggShell.getVariantAttribute(valueRef, 'key1');
            expect(attributeValueRefAfter).toBeUndefined();

            const foundAfter = vireo.eggShell.deleteVariantAttribute(valueRef, 'key1');
            expect(foundAfter).toBe(false);
        });
    });
});
