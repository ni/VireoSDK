//****************************************
// Tests for LinearProgressBarModel class
// National Instruments Copyright 2014
//****************************************

describe('A LinearProgressBar', function () {
    'use strict';
    var niControlId = 'TestId';
    var controlModel;
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var orientation = NationalInstruments.HtmlVI.Models.ProgressBarModel.OrientationEnum.HORIZONTAL;
    var minimum = 0;
    var maximum = 100;
    var value = 50;
    var settings = {};
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            orientation: orientation,
            minimum: minimum,
            maximum: maximum,
            value: value
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            orientation: NationalInstruments.HtmlVI.Models.ProgressBarModel.OrientationEnum.VERTICAL,
            minimum: minimum + 1,
            maximum: maximum + 1,
            value: value
        };
        settings = {};
        controlModel = new NationalInstruments.HtmlVI.Models.LinearProgressBarModel(niControlId);
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
    it('allows to call the setMultipleProperties method to test setting properties all at once', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.top).toEqual(top);
        expect(controlModel.left).toEqual(left);
        expect(controlModel.width).toEqual(width);
        expect(controlModel.height).toEqual(height);
        expect(controlModel.orientation).toEqual(orientation);
        expect(controlModel.minimum).toEqual(minimum);
        expect(controlModel.maximum).toEqual(maximum);
        expect(controlModel.value).toEqual(value);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.orientation).toEqual(otherSettings.orientation);
        expect(controlModel.maximum).toEqual(otherSettings.maximum);
        expect(controlModel.minimum).toEqual(otherSettings.minimum);
        expect(controlModel.value).toEqual(otherSettings.value);
    });
});
