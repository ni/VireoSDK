//****************************************
// Tests for BooleanContentControlModel class
// National Instruments Copyright 2014
//****************************************

describe('A BooleanContentControlModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var trueContent = 'on';
    var falseContent = 'off';

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.BooleanContentControlModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the trueContent property', function () {
        controlModel.trueContent = trueContent;
        expect(controlModel.trueContent).toEqual(trueContent);
    });

    it('allows to set and get the falseContent property', function () {
        controlModel.falseContent = falseContent;
        expect(controlModel.falseContent).toEqual(falseContent);
    });
});
