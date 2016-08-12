//*****************************************
// Tests for niRenderBugger file
// National Instruments Copyright 2014
//*****************************************

describe('A Render Buffer', function () {
    'use strict';

    var renderBuffer;

    beforeEach(function () {
        renderBuffer =  new NationalInstruments.HtmlVI.RenderBuffer();
    });

    it('has the correct initial values', function () {
        expect(renderBuffer.properties).toEqual({});
        expect(renderBuffer.cssClasses).toEqual({toAdd: [], toRemove: []});
        expect(renderBuffer.cssStyles).toEqual({});
        expect(renderBuffer.attributes).toEqual({});
    });

    it('newly created is empty', function () {
        expect(renderBuffer.isEmpty()).toBe(true);
    });

    describe('can be modified', function () {

        beforeEach(function () {
            renderBuffer.properties.value = '5';
            renderBuffer.cssClasses.toAdd.push('block');
            renderBuffer.cssClasses.toRemove.push('block');
            renderBuffer.cssStyles.transform = 'none';
            renderBuffer.attributes.readOnly = false;
        });

        it('and is not empty', function () {
            expect(renderBuffer.isEmpty()).toBe(false);
        });

        it('and modifications are verified', function () {
            expect(renderBuffer.properties.value).toEqual('5');
            expect(renderBuffer.cssClasses.toAdd[0]).toEqual('block');
            expect(renderBuffer.cssClasses.toRemove[0]).toEqual('block');
            expect(renderBuffer.cssStyles.transform).toEqual('none');
            expect(renderBuffer.attributes.readOnly).toEqual(false);
        });

        it('and resets to initial values', function () {
            renderBuffer.reset();
            expect(renderBuffer.isEmpty()).toBe(true);
        });
    });
});
