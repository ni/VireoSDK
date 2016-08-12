//****************************************
// Tests for ClusterModel class
// National Instruments Copyright 2014
//****************************************

describe('A ClusterModel', function () {
    'use strict';
    var niControlId = 'testId';

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('allows to call his constructor', function () {
        var controlModel = new NationalInstruments.HtmlVI.Models.ClusterModel(niControlId);
        expect(controlModel).toBeDefined();
        expect(controlModel.niControlId).toEqual(niControlId);
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    it('allows to call the set the value of fields', function () {
        var clusterId = 'parent';
        var childId = 'numeric1';
        var numericSettings = {
            niControlId: childId,
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            decimalDigits: 2,
            value: 5.0,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            bindingInfo: {
                'prop': 'value',
                'field': 'numericField',
                'sync': false
            }
        };
        var parentModel = new NationalInstruments.HtmlVI.Models.ClusterModel(clusterId);
        var childModel =  new NationalInstruments.HtmlVI.Models.NumericTextBoxModel(childId);
        var messageData = { numericField: 6.66 };
        childModel.setMultipleProperties(numericSettings);
        parentModel.addChildModel(childModel);

        parentModel.value = messageData;
        expect(parentModel.value).toEqual(messageData);
    });
});
