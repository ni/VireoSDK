//****************************************
// Tests for TabControlModel class
// National Instruments Copyright 2014
//****************************************

describe('A TabControlModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var selectedIndex = 0;
    var tabStripPlacement = 'top';
    var completeSettings;
    var otherSettings;

    beforeEach(function () {
        completeSettings = {
            tabStripPlacement: tabStripPlacement,
            selectedIndex: selectedIndex
        };
        otherSettings = {
            tabStripPlacement: 'left',
            selectedIndex: selectedIndex + 1
        };

        controlModel = new NationalInstruments.HtmlVI.Models.TabControlModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call the constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the selectedIndex property', function () {
        controlModel.selectedIndex = selectedIndex;
        expect(controlModel.selectedIndex).toEqual(selectedIndex);
    });

    it('allows to set and get the tab strip placement property', function () {
        controlModel.tabStripPlacement = tabStripPlacement;
        expect(controlModel.tabStripPlacement).toEqual(tabStripPlacement);
    });

    it('can set and get the selectedIndex property through the selectedIndex accessors', function () {
        controlModel.selectedIndex = selectedIndex;
        expect(controlModel.selectedIndex).toEqual(selectedIndex);
        expect(controlModel.selectedIndex).toEqual(selectedIndex);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.selectedIndex).toEqual(completeSettings.selectedIndex);
        expect(controlModel.tabStripPlacement).toEqual(completeSettings.tabStripPlacement);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.selectedIndex).toEqual(otherSettings.selectedIndex);
        expect(controlModel.tabStripPlacement).toEqual(otherSettings.tabStripPlacement);
    });
});
