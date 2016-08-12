//****************************************
// Tests for OpaqueRefnumViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A OpaqueRefnumViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Refnum';

    var viModel, settings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.OpaqueRefnumModel.MODEL_KIND,
            visible: true
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-opaque-refnum ni-control-id="' + controlId + '"></ni-opaque-refnum>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(controlId);
        });
    });

});
