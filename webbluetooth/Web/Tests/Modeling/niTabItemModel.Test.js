//****************************************
// Tests for TabItemModel class
// National Instruments Copyright 2014
//****************************************

describe('A TabItemModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var tabPosition = 0;
    var header = 'sometext';
    var completeSettings;
    var otherSettings;

    beforeEach(function () {
        completeSettings = {
            tabPosition: tabPosition,
            header: header
        };

        otherSettings = {
            tabPosition: tabPosition + 1,
            header: header + ' updated'
        };
        controlModel = new NationalInstruments.HtmlVI.Models.TabItemModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call the constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the tabPosition property', function () {
        controlModel.tabPosition = tabPosition;
        expect(controlModel.tabPosition).toEqual(tabPosition);
    });

    it('allows to set and get the header property', function () {
        controlModel.header = header;
        expect(controlModel.header).toEqual(header);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.tabPosition).toEqual(completeSettings.tabPosition);
        expect(controlModel.header).toEqual(completeSettings.header);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.tabPosition).toEqual(otherSettings.tabPosition);
        expect(controlModel.header).toEqual(otherSettings.header);
    });
});
