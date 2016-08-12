//****************************************
// Tests for Cartesian Axis class
// National Instruments Copyright 2014
//****************************************

describe('A ColorScaleModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var axisLabel = 'Color scale';
    var axisPosition = 'right';
    var showLabel = false;
    var autoScale = false;
    var show = true;
    var highColor = '#ffffff';
    var lowColor = '#000000';
    var markers = [{ 0: '#00ff00' }, { 0.5: '#ff00ff' }, { 1.0: '#0000ff' }];
    var highColor2 = '#ffaaff';
    var lowColor2 = '#0aa000';
    var markers2 = [{ 0: '#00ffff' }, { 0.5: '#ffaaff' }, { 1.0: '#aa00ff' }];
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            show: show,
            axisPosition: axisPosition,
            showLabel: showLabel,
            highColor: highColor,
            lowColor: lowColor,
            markers: markers,
            axisLabel: axisLabel,
            autoScale: autoScale
        };
        otherSettings = {
            show: !show,
            axisPosition: 'right',
            showLabel: !showLabel,
            axisLabel: axisLabel + '1',
            highColor: highColor2,
            lowColor: lowColor2,
            markers: markers2,
            autoScale: !autoScale
        };
        controlModel = new NationalInstruments.HtmlVI.Models.ColorScaleModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the autoScale property', function () {
        controlModel.autoScale = autoScale;
        expect(controlModel.autoScale).toEqual(autoScale);
    });

    it('allows to set and get the axisLabel property', function () {
        controlModel.axisLabel = axisLabel;
        expect(controlModel.axisLabel).toEqual(axisLabel);
    });

    it('allows to set and get the lowColor property', function () {
        controlModel.lowColor = lowColor2;
        expect(controlModel.lowColor).toEqual(lowColor2);
    });

    it('allows to set and get the highColor property', function () {
        controlModel.highColor = highColor2;
        expect(controlModel.highColor).toEqual(highColor2);
    });

    it('allows to set and get the markers property', function () {
        controlModel.markers = markers2;
        expect(controlModel.markers).toEqual(markers2);
    });

    it('allows to set and get the showLabel property', function () {
        controlModel.showLabel = showLabel;
        expect(controlModel.showLabel).toEqual(showLabel);
    });

    it('allows to set and get the axisPosition property', function () {
        controlModel.axisPosition = axisPosition;
        expect(controlModel.axisPosition).toEqual(axisPosition);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update the configuration property', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.autoScale).toEqual(autoScale);
        expect(controlModel.axisLabel).toEqual(axisLabel);
        expect(controlModel.lowColor).toEqual(lowColor);
        expect(controlModel.highColor).toEqual(highColor);
        expect(controlModel.markers).toEqual(markers);
        expect(controlModel.axisPosition).toEqual(axisPosition);
        expect(controlModel.showLabel).toEqual(showLabel);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.autoScale).toEqual(otherSettings.autoScale);
        expect(controlModel.axisLabel).toEqual(otherSettings.axisLabel);
        expect(controlModel.lowColor).toEqual(otherSettings.lowColor);
        expect(controlModel.highColor).toEqual(otherSettings.highColor);
        expect(controlModel.markers).toEqual(otherSettings.markers);
        expect(controlModel.showLabel).toEqual(otherSettings.showLabel);
        expect(controlModel.axisPosition).toEqual(otherSettings.axisPosition);
    });
});
