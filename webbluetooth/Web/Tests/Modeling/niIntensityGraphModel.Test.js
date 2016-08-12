//****************************************
// Tests for IntensityGraphModel class
// National Instruments Copyright 2014
//****************************************

describe('A IntensityGraphModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var visible = true;
    var completeSettings = {};
    var otherSettings = {};
    var value1 = [
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
    ];

    var value2 = [
                    [1, 1, 1, 1],
                    [1, 1, 1, 1],
                    [1, 1, 1, 1],
                    [1, 1, 1, 1]
    ];

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible,
            value: value1
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            visible: !visible,
            value: value2
        };
        controlModel = new NationalInstruments.HtmlVI.Models.IntensityGraphModel(niControlId);
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
    it('allows to call the setMultipleProperties method to update the configuration property', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.value).toEqual(value1);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.value).toEqual(otherSettings.value);
    });

    it('should be able to set value to a IntensityGraph', function () {
        controlModel.setMultipleProperties({value: value1});
        expect(controlModel.value).toEqual(value1);
    });
});
