//****************************************
// Tests for VisualComponentModel class
// National Instruments Copyright 2014
//****************************************

describe('A VisualComponentModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var kind = NationalInstruments.HtmlVI.Models.GaugeModel.MODEL_KIND;
    var settings = {};
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            kind: kind
        };
        otherSettings = {};
        settings = {};
        controlModel = new NationalInstruments.HtmlVI.Models.VisualComponentModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('prevents changing niControlId after it is assigned', function () {
        var toCall = function () {
            controlModel.niControlId = niControlId + 'other';
        };

        expect(toCall).toThrow();
    });

});
