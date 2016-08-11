//****************************************
// Tests for RadialNumericPointerModel class
// National Instruments Copyright 2014
//****************************************

describe('A RadialNumericPointerModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.RadialNumericPointerModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });
});
