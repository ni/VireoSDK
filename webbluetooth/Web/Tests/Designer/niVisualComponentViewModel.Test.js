//****************************************
// Tests for VisualComponentViewModel
// National Instruments Copyright 2014
//****************************************

describe('A VisualComponentViewModel', function () {
    'use strict';
    var controlId = 'Function1';

    var viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('warns about adding a control with the same id twice', function (done) {
        var toCall = function () {
            webAppHelper.createNIElement({
                niControlId: controlId,
                kind: NationalInstruments.HtmlVI.Models.StringControlModel.MODEL_KIND,
                visible: true,
                text: 'Text',
                foreground: '#4D5359',
                fontSize: '12px',
                left: '272px',
                top: '64px',
                width: '23px',
                height: '16px'
            });
        };

        // first call
        expect(toCall).not.toThrow();

        //second call
        expect(toCall).not.toThrow();

        testHelpers.runAsync(done, function () {
            webAppHelper.removeNIElement(controlId);
        });
    });

});
