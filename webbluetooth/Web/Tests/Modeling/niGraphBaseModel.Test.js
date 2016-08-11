//****************************************
// Tests for GraphBaseModel class
// National Instruments Copyright 2014
//****************************************

describe('A GraphBaseModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.GraphBaseModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });
});
