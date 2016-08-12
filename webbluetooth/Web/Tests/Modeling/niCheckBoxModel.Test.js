//****************************************
// Tests for CheckBoxModel class
// National Instruments Copyright 2015
//****************************************

describe('A CheckBoxModel', function () {
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
    var content = 'checkBox';
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
            content: content
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            visible: !visible,
            value: !value,
            contentVisible: !contentVisible,
            content: content + 'other'
        };
        controlModel = new NationalInstruments.HtmlVI.Models.CheckBoxModel(niControlId);
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
        expect(controlModel.top).toEqual(completeSettings.top);
        expect(controlModel.left).toEqual(completeSettings.left);
        expect(controlModel.width).toEqual(completeSettings.width);
        expect(controlModel.height).toEqual(completeSettings.height);
        expect(controlModel.value).toEqual(completeSettings.value);
        expect(controlModel.contentVisible).toEqual(completeSettings.contentVisible);
        expect(controlModel.content).toEqual(completeSettings.content);
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
    });
});
