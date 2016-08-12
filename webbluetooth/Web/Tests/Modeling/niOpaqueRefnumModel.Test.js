//****************************************
// Tests for OpaqueRefnum class
// National Instruments Copyright 2015
//****************************************

describe('A OpaqueRefnumModel', function () {
    'use strict';

    var controlModel;
    var niControlId = 'refnum';

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.OpaqueRefnumModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------

    it('can be constructed', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });
});
