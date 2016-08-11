//****************************************
// Tests for LinearNumericPointerModel class
// National Instruments Copyright 2014
//****************************************

describe('A LinearNumericPointerModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.LinearNumericPointerModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });
});
