//****************************************
// Tests for LayoutPanelViewModel class
// National Instruments Copyright 2014
//****************************************
// This test deosn't do anything... so it's disabled, should at least create the thing
/*global xdescribe*/
xdescribe('A LayoutPanelViewModel', function () {
    'use strict';

    var viModel, settings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: 'Function12',
            kind: NationalInstruments.HtmlVI.Models.LayoutPanelModel.MODEL_KIND,
            visible: true
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });
});
