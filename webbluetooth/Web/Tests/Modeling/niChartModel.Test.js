//****************************************
// Tests for ChartModel class
// National Instruments Copyright 2014
//****************************************

describe('A ChartModel', function () {
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

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            visible: !visible,
            bufferSize: 128
        };
        controlModel = new NationalInstruments.HtmlVI.Models.ChartModel(niControlId);
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

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.historySize).toEqual(otherSettings.bufferSize);
    });

    it('should have default history size of 1024', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.historySize).toEqual(1024);
    });

    it('should be able to add numbers to a chart', function () {
        controlModel.setMultipleProperties({value: 7});

        expect(controlModel.historyBuffer.count).toBe(1);
        expect(controlModel.historyBuffer.toDataSeries()).toEqual([[0, 7]]);
    });

    it('should be able to add 1D arrays of numbers to a chart', function () {
        controlModel.setMultipleProperties({value: '[7, 8]'});

        expect(controlModel.historyBuffer.count).toBe(2);
        expect(controlModel.historyBuffer.toDataSeries()).toEqual([[0, 7], [1, 8]]);
    });

    it('should be able to add 1D arrays of 1 element arrays of numbers to a chart', function () {
        controlModel.setMultipleProperties({value: '[[7], [8]]'});

        expect(controlModel.historyBuffer.count).toBe(1);
        expect(controlModel.historyBuffer.toDataSeries(0)).toEqual([[0, 7]]);
        expect(controlModel.historyBuffer.toDataSeries(1)).toEqual([[0, 8]]);
    });

    it('should be able to add 1D arrays of multiple elements arrays of numbers to a chart', function () {
        controlModel.setMultipleProperties({value: '[[7, 8], [9, 10]]'});

        expect(controlModel.historyBuffer.count).toBe(2);
        expect(controlModel.historyBuffer.toDataSeries(0)).toEqual([[0, 7], [1, 8]]);
        expect(controlModel.historyBuffer.toDataSeries(1)).toEqual([[0, 9], [1, 10]]);
    });

    it('should set the width of the history buffer to 1 when pushing numbers to the buffer', function () {
        controlModel.setMultipleProperties({value: '[[7], [8]]'});
        controlModel.setMultipleProperties({value: 7});

        expect(controlModel.historyBuffer.width).toBe(1);
    });

    it('should set the width of the history buffer to 1 when pushing 1D arrays of numbers to the buffer', function () {
        controlModel.setMultipleProperties({value: '[[7], [8]]'});
        controlModel.setMultipleProperties({value: '[7, 8]'});

        expect(controlModel.historyBuffer.width).toBe(1);
    });

    it('should set the width of the history buffer to the lenght of the array rows when pushing 2D arrays of numbers to the buffer', function () {
        controlModel.setMultipleProperties({value: 7});
        controlModel.setMultipleProperties({value: '[[7], [8], [9]]'});

        expect(controlModel.historyBuffer.width).toBe(3);
    });

    it('should empty the history buffer on width change', function () {
        controlModel.setMultipleProperties({ value: 7 });
        controlModel.setMultipleProperties({ value: '[[7], [8], [9]]' });

        expect(controlModel.historyBuffer.count).toBe(1);
    });

    it('should do nothing when receiving invalid JSON', function () {
        controlModel.setMultipleProperties({ value: 'invalidJsonString: [[7], [8], [9]]' });

        expect(controlModel.historyBuffer.count).toBe(0);
    });

    it('should do nothing when receiving unexpected data types', function () {
        controlModel.setMultipleProperties({ value: {} });

        expect(controlModel.historyBuffer.count).toBe(0);
    });
});
