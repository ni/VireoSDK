
//****************************************
// Tests for CartesianGraphModel class
// National Instruments Copyright 2014
//****************************************

describe('A CartesianGraphModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var value1D = [20, 30];
    var value2D = [[0, 10], [1, 15]];

    beforeEach(function () {
        controlModel = new NationalInstruments.HtmlVI.Models.CartesianGraphModel(niControlId);
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
    it('allows to set the value', function () {
        controlModel.setMultipleProperties({value: value2D});
        expect(controlModel.value).toEqual(value2D);
    });

    it('allows to receive a 1D value and convert it to a 2D value', function () {
        controlModel.setMultipleProperties({value: value1D});
        expect(controlModel.value).toEqual(value1D);
    });

});
