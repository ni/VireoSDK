//****************************************
// Tests for Cartesian Axis class
// National Instruments Copyright 2014
//****************************************

describe('A CursorModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var showLabel = false;
    var showValue = false;
    var cursorColor = 'black';
    var targetShape = 'ellipse';
    var label = '';
    var snapToData = false;
    var crosshairStyle = 'both';
    var fontSize = '15px';
    var fontFamily = 'sans serif';
    var fontStyle = 'normal';
    var fontWeight = 'normal';
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            showLabel: showLabel,
            showValue: showValue,
            cursorColor: cursorColor,
            targetShape: targetShape,
            label: label,
            snapToData: snapToData,
            crosshairStyle: crosshairStyle,
            fontSize: fontSize,
            fontFamily: fontFamily,
            fontStyle: fontStyle,
            fontWeight: fontWeight
        };

        otherSettings = {
            showLabel: !showLabel,
            showValue: !showValue,
            cursorColor: 'red',
            targetShape: 'square',
            label: 'cursor',
            snapToData: !snapToData,
            crosshairStyle: 'none'
        };

        controlModel = new NationalInstruments.HtmlVI.Models.CursorModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the showLabel property', function () {
        controlModel.showLabel = showLabel;
        expect(controlModel.showLabel).toEqual(showLabel);
    });

    it('allows to set and get the showValue property', function () {
        controlModel.showValue = showValue;
        expect(controlModel.showValue).toEqual(showValue);
    });

    it('allows to set and get the cursorColor property', function () {
        controlModel.cursorColor = cursorColor;
        expect(controlModel.cursorColor).toEqual(cursorColor);
    });

    it('allows to set and get the targetShape property', function () {
        controlModel.targetShape = targetShape;
        expect(controlModel.targetShape).toEqual(targetShape);
    });

    it('allows to set and get the label property', function () {
        controlModel.label = label;
        expect(controlModel.label).toEqual(label);
    });

    it('allows to set and get the snapToData property', function () {
        controlModel.snapToData = snapToData;
        expect(controlModel.snapToData).toEqual(snapToData);
    });

    it('allows to set and get the crosshairStyle property', function () {
        controlModel.crosshairStyle = crosshairStyle;
        expect(controlModel.crosshairStyle).toEqual(crosshairStyle);
    });

    it('allows to set and get the fontSize property', function () {
        controlModel.fontSize = fontSize;
        expect(controlModel.fontSize).toEqual(fontSize);
    });

    it('allows to set and get the fontFamily property', function () {
        controlModel.fontFamily = fontFamily;
        expect(controlModel.fontFamily).toEqual(fontFamily);
    });

    it('allows to set and get the fontStyle property', function () {
        controlModel.fontStyle = fontStyle;
        expect(controlModel.fontStyle).toEqual(fontStyle);
    });

    it('allows to set and get the fontWeight property', function () {
        controlModel.fontWeight = fontWeight;
        expect(controlModel.fontWeight).toEqual(fontWeight);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.showLabel).toEqual(showLabel);
        expect(controlModel.showValue).toEqual(showValue);
        expect(controlModel.cursorColor).toEqual(cursorColor);
        expect(controlModel.targetShape).toEqual(targetShape);
        expect(controlModel.label).toEqual(label);
        expect(controlModel.snapToData).toEqual(snapToData);
        expect(controlModel.crosshairStyle).toEqual(crosshairStyle);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.showLabel).toEqual(otherSettings.showLabel);
        expect(controlModel.showValue).toEqual(otherSettings.showValue);
        expect(controlModel.cursorColor).toEqual(otherSettings.cursorColor);
        expect(controlModel.targetShape).toEqual(otherSettings.targetShape);
        expect(controlModel.label).toEqual(otherSettings.label);
        expect(controlModel.snapToData).toEqual(otherSettings.snapToData);
        expect(controlModel.crosshairStyle).toEqual(otherSettings.crosshairStyle);
    });
});
