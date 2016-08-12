//****************************************
// Tests for HyperlinkModel class
// National Instruments Copyright 2015
//****************************************

describe('A HyperlinkModel', function () {
    'use strict';
    var controlModel;
    var niControlId = 'testId';
    var top = 100;
    var left = 200;
    var width = 300;
    var height = 400;
    var visible = true;
    var href = 'href';
    var content = 'content';
    var completeSettings = {};
    var otherSettings = {};

    beforeEach(function () {
        completeSettings = {
            top: top,
            left: left,
            width: width,
            height: height,
            visible: visible,
            href: href,
            content: content
        };

        otherSettings = {
            top: top + 1,
            left: left + 1,
            width: width + 1,
            height: height + 1,
            href: href + ' other',
            content: content + ' other'
        };

        controlModel = new NationalInstruments.HtmlVI.Models.HyperlinkModel(niControlId);
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    it('allows to set and get the href property', function () {
        controlModel.href = href;
        expect(controlModel.href).toEqual(href);
    });

    it('allows to set and get the content property', function () {
        controlModel.content = content;
        expect(controlModel.content).toEqual(content);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(completeSettings);
        expect(controlModel.width).toEqual(completeSettings.width);
        expect(controlModel.height).toEqual(completeSettings.height);
        expect(controlModel.href).toEqual(completeSettings.href);
        expect(controlModel.content).toEqual(completeSettings.content);
    });

    it('allows to call the setMultipleProperties method to update Model properties', function () {
        controlModel.setMultipleProperties(otherSettings);
        expect(controlModel.top).toEqual(otherSettings.top);
        expect(controlModel.left).toEqual(otherSettings.left);
        expect(controlModel.width).toEqual(otherSettings.width);
        expect(controlModel.height).toEqual(otherSettings.height);
        expect(controlModel.href).toEqual(otherSettings.href);
        expect(controlModel.content).toEqual(otherSettings.content);
    });
});
