//****************************************
// Tests for ListBoxModel class
// National Instruments Copyright 2015
//****************************************

describe('A ListBoxModel', function () {
    'use strict';

    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var visible = true;
    var source = ['one', 'two', 'three'];
    var otherSource = ['alpha', 'beta', 'charlie'];
    var selectionMode = 'ZeroOrOne';
    var selectedIndex = 0;
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible,
            selectionMode: selectionMode,
            source: source,
            selectedIndex: selectedIndex
        };

        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            visible: !visible,
            source: otherSource,
            selectionMode: 'ZeroOrMore',
            selectedIndex: [selectedIndex + 1]
        };

        controlModel = new NationalInstruments.HtmlVI.Models.ListBoxModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------

    it('can be constructed', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('can get and set the selectedIndex property', function () {
        controlModel.selectedIndex = selectedIndex;
        expect(controlModel.selectedIndex).toEqual(selectedIndex);
    });

    it('can get and set the selectionMode property', function () {
        controlModel.selectionMode = selectionMode;
        expect(controlModel.selectionMode).toEqual(selectionMode);
    });

    it('can get and set the source property', function () {
        controlModel.source = source;
        expect(controlModel.source).toEqual(source);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.width).toEqual(width);
        expect(controlModel.height).toEqual(height);
        expect(controlModel.selectedIndex).toEqual(selectedIndex);
        expect(controlModel.selectionMode).toEqual(selectionMode);
        expect(controlModel.source).toEqual(source);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.selectedIndex).toEqual(otherSettings.selectedIndex);
        expect(controlModel.selectionMode).toEqual(otherSettings.selectionMode);
        expect(controlModel.source).toEqual(otherSettings.source);
    });
});
