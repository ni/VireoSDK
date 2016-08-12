//****************************************
// Tests for VisualModel class
// National Instruments Copyright 2014
//****************************************

describe('A VisualModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var readOnly = true;
    var foreground = '#0000FF';
    var fontSize = '20px';
    var fontFamily = 'Arial, sans-serif';
    var labelId = 'labelId';
    var visible = true;
    var defaultValue = 'defaultValue';
    var settings = {};
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            readOnly: readOnly,
            foreground: foreground,
            fontSize: fontSize,
            fontFamily: fontFamily,
            labelId: labelId,
            visible: visible,
            defaultValue: defaultValue
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            readOnly: !readOnly,
            foreground: '#FF0000',
            fontSize: '30px',
            fontFamily: 'serif',
            labelId: labelId + '2',
            visible: !visible,
            defaultValue: 'otherValue'
        };
        settings = {};
        controlModel = new NationalInstruments.HtmlVI.Models.VisualModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the top property', function () {
        controlModel.top = top;
        expect(controlModel.top).toEqual(top);
    });

    it('allows to set and get the left property', function () {
        controlModel.left = left;
        expect(controlModel.left).toEqual(left);
    });

    it('allows to set and get the width property', function () {
        controlModel.width = width;
        expect(controlModel.width).toEqual(width);
    });

    it('allows to set and get the height property', function () {
        controlModel.height = height;
        expect(controlModel.height).toEqual(height);
    });

    it('allows to set and get the readOnly property', function () {
        controlModel.readOnly = readOnly;
        expect(controlModel.readOnly).toEqual(readOnly);
    });

    it('allows to set and get the foreground property', function () {
        controlModel.foreground = foreground;
        expect(controlModel.foreground).toEqual(foreground);
    });

    it('allows to set and get the fontSize property', function () {
        controlModel.fontSize = fontSize;
        expect(controlModel.fontSize).toEqual(fontSize);
    });

    it('allows to set and get the fontFamily property', function () {
        controlModel.fontFamily = fontFamily;
        expect(controlModel.fontFamily).toEqual(fontFamily);
    });

    it('allows to set and get the labelId property', function () {
        controlModel.labelId = labelId;
        expect(controlModel.labelId).toEqual(labelId);
    });

    it('allows to set and get the visible property', function () {
        controlModel.visible = visible;
        expect(controlModel.visible).toEqual(visible);
    });

    it('allows to set and get the defaultValue property', function () {
        controlModel.defaultValue = defaultValue;
        expect(controlModel.defaultValue).toEqual(defaultValue);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update all the properties at the same time', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.top).toEqual(top);
        expect(controlModel.left).toEqual(left);
        expect(controlModel.width).toEqual(width);
        expect(controlModel.height).toEqual(height);
        expect(controlModel.readOnly).toEqual(readOnly);
        expect(controlModel.foreground).toEqual(foreground);
        expect(controlModel.fontSize).toEqual(fontSize);
        expect(controlModel.fontFamily).toEqual(fontFamily);
        expect(controlModel.labelId).toEqual(labelId);
        expect(controlModel.visible).toEqual(visible);
    });

    it('allows to call the setMultipleProperties method with an unknown property', function () {
        controlModel.setMultipleProperties(completeSettings);
        settings = {
            unknownProperty: 'someValue'
        };
        controlModel.setMultipleProperties(settings);
        expect(controlModel.top).toEqual(top);
        expect(controlModel.left).toEqual(left);
        expect(controlModel.width).toEqual(width);
        expect(controlModel.height).toEqual(height);
        expect(controlModel.readOnly).toEqual(readOnly);
        expect(controlModel.foreground).toEqual(foreground);
        expect(controlModel.fontSize).toEqual(fontSize);
        expect(controlModel.fontFamily).toEqual(fontFamily);
        expect(controlModel.labelId).toEqual(labelId);
        expect(controlModel.visible).toEqual(visible);
    });

    it('allows to call the setMultipleProperties method to update just one property without updating others', function () {
        controlModel.setMultipleProperties(completeSettings);
        settings = {
            top: top * 2
        };
        controlModel.setMultipleProperties(settings);
        expect(controlModel.top).toEqual(settings.top);
        expect(controlModel.left).toEqual(left);
        expect(controlModel.width).toEqual(width);
        expect(controlModel.height).toEqual(height);
        expect(controlModel.readOnly).toEqual(readOnly);
        expect(controlModel.foreground).toEqual(foreground);
        expect(controlModel.fontSize).toEqual(fontSize);
        expect(controlModel.fontFamily).toEqual(fontFamily);
        expect(controlModel.labelId).toEqual(labelId);
        expect(controlModel.visible).toEqual(visible);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.readOnly).toEqual(otherSettings.readOnly);
        expect(controlModel.foreground).toEqual(otherSettings.foreground);
        expect(controlModel.fontSize).toEqual(otherSettings.fontSize);
        expect(controlModel.fontFamily).toEqual(otherSettings.fontFamily);
        expect(controlModel.labelId).toEqual(otherSettings.labelId);
        expect(controlModel.visible).toEqual(otherSettings.visible);
    });
});
