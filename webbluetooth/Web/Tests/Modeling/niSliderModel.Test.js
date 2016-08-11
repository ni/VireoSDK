//****************************************
// Tests for SliderModel class
// National Instruments Copyright 2014
//****************************************

describe('A SliderModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var visible = true;
    var minimum = 500;
    var maximum = 600;
    var value = 700;
    var interval = 800;
    var significantDigits = 6;
    var precisionDigits = -1;
    var coerconMode = false;
    var majorTicksVisible = true;
    var minorTicksVisible = true;
    var labelsVisible = true;
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible,
            minimum: minimum,
            maximum: maximum,
            value: value,
            interval: interval,
            significantDigits: significantDigits,
            precisionDigits: precisionDigits,
            majorTicksVisible: majorTicksVisible,
            minorTicksVisible: minorTicksVisible,
            labelsVisible: labelsVisible,
            coercionMode: coerconMode
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            visible: !visible,
            minimum: minimum + 1,
            maximum: maximum + 1,
            value: value + 1,
            significantDigits: -1,
            precisionDigits: 6,
            majorTicksVisible: !majorTicksVisible,
            minorTicksVisible: !minorTicksVisible,
            labelsVisible: !labelsVisible,
            coercionMode: !coerconMode
        };
        controlModel = new NationalInstruments.HtmlVI.Models.SliderModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.width).toEqual(width);
        expect(controlModel.height).toEqual(height);
        expect(controlModel.maximum).toEqual(maximum);
        expect(controlModel.minimum).toEqual(minimum);
        expect(controlModel.value).toEqual(value);
        expect(controlModel.significantDigits).toEqual(significantDigits);
        expect(controlModel.precisionDigits).toEqual(precisionDigits);
        expect(controlModel.majorTicksVisible).toEqual(majorTicksVisible);
        expect(controlModel.minorTicksVisible).toEqual(minorTicksVisible);
        expect(controlModel.labelsVisible).toEqual(labelsVisible);
        expect(controlModel.coercionMode).toEqual(coerconMode);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.maximum).toEqual(otherSettings.maximum);
        expect(controlModel.minimum).toEqual(otherSettings.minimum);
        expect(controlModel.value).toEqual(otherSettings.value);
        expect(controlModel.significantDigits).toEqual(otherSettings.significantDigits);
        expect(controlModel.precisionDigits).toEqual(otherSettings.precisionDigits);
        expect(controlModel.majorTicksVisible).toEqual(otherSettings.majorTicksVisible);
        expect(controlModel.minorTicksVisible).toEqual(otherSettings.minorTicksVisible);
        expect(controlModel.labelsVisible).toEqual(otherSettings.labelsVisible);
        expect(controlModel.coercionMode).toEqual(otherSettings.coercionMode);
    });
});
