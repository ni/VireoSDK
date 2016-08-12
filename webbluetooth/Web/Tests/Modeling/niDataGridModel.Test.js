//****************************************
// Tests for DataGridModel class
// National Instruments Copyright 2016
//****************************************

describe('A DataGridModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var visible = true;
    var value1 = [{ A: 'One' }, { A: 'Two' }, { A: 'Three' }];
    var value2 = [{ A: 'Four' }, { A: 'Five' }, { A: 'Six' }];
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible,
            value: value1,
            rowHeaderVisible: false,
            columnHeaderVisible: false,
            allowSorting: true,
            allowPaging: true,
            allowFiltering: true,
            allowGrouping: true,
            rowHeight: 40,
            altRowColors: true,
            altRowStart: 2,
            altRowStep: 2,
            selectedColumn: 0
        };
        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            visible: !visible,
            value: value2,
            rowHeaderVisible: true,
            columnHeaderVisible: true,
            allowSorting: false,
            allowPaging: false,
            allowFiltering: false,
            allowGrouping: false,
            rowHeight: 25,
            altRowColors: false,
            altRowStart: 1,
            altRowStep: 1,
            selectedColumn: 1
        };
        controlModel = new NationalInstruments.HtmlVI.Models.DataGridModel(niControlId);
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
        expect(controlModel.top).toEqual(completeSettings.top);
        expect(controlModel.left).toEqual(completeSettings.left);
        expect(controlModel.width).toEqual(completeSettings.width);
        expect(controlModel.height).toEqual(completeSettings.height);
        expect(controlModel.value).toEqual(completeSettings.value);
        expect(controlModel.rowHeaderVisible).toEqual(completeSettings.rowHeaderVisible);
        expect(controlModel.columnHeaderVisible).toEqual(completeSettings.columnHeaderVisible);
        expect(controlModel.allowSorting).toEqual(completeSettings.allowSorting);
        expect(controlModel.allowPaging).toEqual(completeSettings.allowPaging);
        expect(controlModel.allowFiltering).toEqual(completeSettings.allowFiltering);
        expect(controlModel.allowGrouping).toEqual(completeSettings.allowGrouping);
        expect(controlModel.rowHeight).toEqual(completeSettings.rowHeight);
        expect(controlModel.altRowColors).toEqual(completeSettings.altRowColors);
        expect(controlModel.altRowStart).toEqual(completeSettings.altRowStart);
        expect(controlModel.altRowStep).toEqual(completeSettings.altRowStep);
        expect(controlModel.selectedColumn).toEqual(completeSettings.selectedColumn);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.value).toEqual(otherSettings.value);
        expect(controlModel.rowHeaderVisible).toEqual(otherSettings.rowHeaderVisible);
        expect(controlModel.columnHeaderVisible).toEqual(otherSettings.columnHeaderVisible);
        expect(controlModel.allowSorting).toEqual(otherSettings.allowSorting);
        expect(controlModel.allowPaging).toEqual(otherSettings.allowPaging);
        expect(controlModel.allowFiltering).toEqual(otherSettings.allowFiltering);
        expect(controlModel.allowGrouping).toEqual(otherSettings.allowGrouping);
        expect(controlModel.rowHeight).toEqual(otherSettings.rowHeight);
        expect(controlModel.altRowColors).toEqual(otherSettings.altRowColors);
        expect(controlModel.altRowStart).toEqual(otherSettings.altRowStart);
        expect(controlModel.altRowStep).toEqual(otherSettings.altRowStep);
        expect(controlModel.selectedColumn).toEqual(otherSettings.selectedColumn);
    });
});
