//****************************************
// Tests for ImageModel class
// National Instruments Copyright 2016
//****************************************

describe('An ImageModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var visible = true;
    var source = 'source';
    var stretch = 'uniform';
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible,
            source: source,
            stretch: stretch
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            source: source + ' other',
            stretch: 'fill'
        };
        controlModel = new NationalInstruments.HtmlVI.Models.ImageModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('can be constructed', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('can get and set the source property', function () {
        controlModel.source = source;
        expect(controlModel.source).toEqual(source);
    });

    it('can get and set the stretch property', function () {
        controlModel.stretch = stretch;
        expect(controlModel.stretch).toEqual(stretch);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.width).toEqual(width);
        expect(controlModel.height).toEqual(height);
        expect(controlModel.source).toEqual(source);
        expect(controlModel.stretch).toEqual(stretch);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.source).toEqual(otherSettings.source);
        expect(controlModel.stretch).toEqual(otherSettings.stretch);
    });
});
