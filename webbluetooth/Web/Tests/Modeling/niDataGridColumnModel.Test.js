//****************************************
// Tests for DataGridModel class
// National Instruments Copyright 2016
//****************************************

describe('A DataGridModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var width = 300;
    var visible = true;
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            width: width,
            visible: visible,
            index: 0,
            header: 'A',
            fieldName: 'A',
            pinned: true,
            aggregates: { horizontalAlignment: 'left', items: { min: { label: 'Min' } } }
        };
        otherSettings = {
            width: width + 1,
            visible: !visible,
            index: 1,
            header: 'B',
            fieldName: 'B',
            pinned: false,
            aggregates: { horizontalAlignment: 'center', items: { max: { label: 'Max' } } }
        };
        controlModel = new NationalInstruments.HtmlVI.Models.ArrayViewerModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.width).toEqual(completeSettings.width);
        expect(controlModel.visible).toEqual(completeSettings.visible);
        expect(controlModel.index).toEqual(completeSettings.index);
        expect(controlModel.header).toEqual(completeSettings.header);
        expect(controlModel.fieldName).toEqual(completeSettings.fieldName);
        expect(controlModel.pinned).toEqual(completeSettings.pinned);
        expect(controlModel.aggregates).toEqual(completeSettings.aggregates);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.visible).toEqual(otherSettings.visible);
        expect(controlModel.index).toEqual(otherSettings.index);
        expect(controlModel.header).toEqual(otherSettings.header);
        expect(controlModel.fieldName).toEqual(otherSettings.fieldName);
        expect(controlModel.pinned).toEqual(otherSettings.pinned);
        expect(controlModel.aggregates).toEqual(otherSettings.aggregates);
    });
});
