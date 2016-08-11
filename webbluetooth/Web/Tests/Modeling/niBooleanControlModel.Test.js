//****************************************
// Tests for BooleanControlModel class
// National Instruments Copyright 2014
//****************************************

describe('A BooleanControlModel', function () {
    'use strict';
    var controlModel;
    var content = 'content';
    var contentVisible = false;
    var niControlId = 'testId';
    var clickMode = NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE;
    var momentary = true;

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.BooleanControlModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the content property', function () {
        controlModel.content = content;
        expect(controlModel.content).toEqual(content);
    });

    it('allows to set and get the contentVisible property', function () {
        controlModel.contentVisible = contentVisible;
        expect(controlModel.contentVisible).toEqual(contentVisible);
    });

    it('allows to set and get the clickMode property', function () {
        controlModel.clickMode = clickMode;
        expect(controlModel.clickMode).toEqual(clickMode);
    });

    it('allows to set and get the momentary property', function () {
        controlModel.momentary = momentary;
        expect(controlModel.momentary).toEqual(momentary);
    });
});
