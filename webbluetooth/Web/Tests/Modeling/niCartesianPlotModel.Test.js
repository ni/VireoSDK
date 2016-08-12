//****************************************
// Tests for Cartesian Plot class
// National Instruments Copyright 2014
//****************************************

describe('A CartesianPlotModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var xaxis = 'xaxis';
    var yaxis = 'yaxis';
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            xaxis: xaxis,
            yaxis: yaxis
        };
        otherSettings = {
            xaxis: xaxis + '1',
            yaxis: yaxis + '1'
        };
        controlModel = new NationalInstruments.HtmlVI.Models.CartesianPlotModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the xaxis property', function () {
        controlModel.xaxis = xaxis;
        expect(controlModel.xaxis).toEqual(xaxis);
    });

    it('allows to set and get the yaxis property', function () {
        controlModel.yaxis = yaxis;
        expect(controlModel.yaxis).toEqual(yaxis);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.xaxis).toEqual(xaxis);
        expect(controlModel.yaxis).toEqual(yaxis);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.xaxis).toEqual(otherSettings.xaxis);
        expect(controlModel.yaxis).toEqual(otherSettings.yaxis);
    });
});
