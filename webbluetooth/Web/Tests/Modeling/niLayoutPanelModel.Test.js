//****************************************
// Tests for LayoutPanelModel class
// National Instruments Copyright 2014
//****************************************

describe('A LayoutPanelModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.LayoutPanelModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call the constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });
});
