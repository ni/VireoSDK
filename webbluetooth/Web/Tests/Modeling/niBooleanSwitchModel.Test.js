//****************************************
// Tests for BooleanSwitchModel class
// National Instruments Copyright 2015
//****************************************

describe('A BooleanSwitchModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var visible = true;
    var value = true;
    var contentVisible = false;
    var content = 'booleanSwitchButton';
    var trueContent = 'on';
    var falseContent = 'off';
    var shape = 'slider';
    var orientation = 'vertical';
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible,
            value: value,
            contentVisible: contentVisible,
            content: content,
            trueContent: trueContent,
            falseContent: falseContent,
            shape: shape,
            orientation: orientation
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            visible: !visible,
            value: !value,
            contentVisible: !contentVisible,
            content: content + 'other',
            trueContent: trueContent + 'other',
            falseContent: falseContent + 'other',
            shape: shape + 'other',
            orientation: orientation + 'other'
        };
        controlModel = new NationalInstruments.HtmlVI.Models.BooleanSwitchModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the shape property', function () {
        controlModel.shape = shape;
        expect(controlModel.shape).toEqual(shape);
    });

    it('allows to set and get the orientation property', function () {
        controlModel.orientation = orientation;
        expect(controlModel.orientation).toEqual(orientation);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to set properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.top).toEqual(completeSettings.top);
        expect(controlModel.left).toEqual(completeSettings.left);
        expect(controlModel.width).toEqual(completeSettings.width);
        expect(controlModel.height).toEqual(completeSettings.height);
        expect(controlModel.value).toEqual(completeSettings.value);
        expect(controlModel.contentVisible).toEqual(completeSettings.contentVisible);
        expect(controlModel.content).toEqual(completeSettings.content);
        expect(controlModel.trueContent).toEqual(completeSettings.trueContent);
        expect(controlModel.falseContent).toEqual(completeSettings.falseContent);
        expect(controlModel.shape).toEqual(completeSettings.shape);
        expect(controlModel.orientation).toEqual(completeSettings.orientation);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.value).toEqual(otherSettings.value);
        expect(controlModel.contentVisible).toEqual(otherSettings.contentVisible);
        expect(controlModel.content).toEqual(otherSettings.content);
        expect(controlModel.trueContent).toEqual(otherSettings.trueContent);
        expect(controlModel.falseContent).toEqual(otherSettings.falseContent);
        expect(controlModel.shape).toEqual(otherSettings.shape);
        expect(controlModel.orientation).toEqual(otherSettings.orientation);
    });
});
