//******************************************
// Tests for VI Model classes
// National Instruments Copyright 2014
//******************************************

describe('A VIModel', function () {
    'use strict';
    var viName = 'Function.gvi';
    var viRef = '';

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    describe('without any children elements', function () {
        var viModel;

        beforeEach(function () {
            viModel = new NationalInstruments.HtmlVI.Models.VirtualInstrumentModel();
        });

        afterEach(function () {
            viModel = undefined;
        });

        it('allows to call his constructor', function () {
            expect(viModel).toBeDefined();
        });

        it('has undefined values by default', function () {
            expect(viModel.viName).toBe(undefined);
            expect(viModel.viRef).toBe(undefined);
        });

        it('can change the default values', function () {
            viModel.viName = viName;
            viModel.viRef = viRef;

            expect(viModel.viName).toBe(viName);
            expect(viModel.viRef).toBe(viRef);
        });

        it('has an owner that is the value undefined', function () {
            expect(viModel.getOwner()).toBe(undefined);
        });

        it('has no control models', function () {
            expect(viModel.getAllControlModels()).toEqual({});
        });

    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------
    describe('is created in a web application', function () {
        var viModel;
        var buttonSettings, clusterSettings;

        var buttonUpdateSettings;

        var webAppHelper = testHelpers.createWebAppTestHelper();

        beforeAll(function (done) {
            webAppHelper.installWebAppFixture(done, function (newVIModel) {
                viModel = newVIModel;
            });
        });

        beforeEach(function () {
            NationalInstruments.HtmlVI.inputDataItem = {};
            NationalInstruments.HtmlVI.inputDataItem.di_22 = 'Object';

            buttonSettings = {
                niControlId: 'id45',
                bindingInfo: {
                    prop: 'value',
                    field: 'field1'
                },
                kind: NationalInstruments.HtmlVI.Models.BooleanButtonModel.MODEL_KIND,
                left: '100px',
                top: '200px',
                width: '300px',
                height: '400px'
            };

            buttonUpdateSettings = {
                left: '500px',
                top: '600px',
                width: '700px',
                height: '800px'
            };

            clusterSettings = {
                niControlId: 'id55',
                bindingInfo: {
                    prop: 'value',
                    via: '22'
                },
                kind: NationalInstruments.HtmlVI.Models.ClusterModel.MODEL_KIND
            };
        });

        afterEach(function () {
            NationalInstruments.HtmlVI.inputDataItem = undefined;
        });

        afterAll(function (done) {
            webAppHelper.removeWebAppFixture(done);
        });

        describe('with two child elements', function () {
            var buttonModel,
                clusterModel;

            beforeEach(function (done) {
                webAppHelper.createNIElement(clusterSettings);
                webAppHelper.createNIElement(buttonSettings, clusterSettings.niControlId);

                testHelpers.runAsync(done, function () {
                    buttonModel = viModel.getControlModel(buttonSettings.niControlId);
                    clusterModel = viModel.getControlModel(clusterSettings.niControlId);
                });
            });

            afterEach(function (done) {
                webAppHelper.removeNIElement(clusterSettings.niControlId);

                testHelpers.runAsync(done, function () {
                    buttonModel = undefined;
                    clusterModel = undefined;
                });
            });

            it('has access to two child models', function () {
                var controlModels = viModel.getAllControlModels();
                expect(controlModels).toBeDefined();
                expect(Object.keys(controlModels).length).toBe(2);
                expect(controlModels[clusterSettings.niControlId]).toBeDefined();
                expect(controlModels[buttonSettings.niControlId]).toBeDefined();
            });

            it('can run getLocalBindingInfo on the controls', function () {
                var controlModels = viModel.getAllControlModels();

                var clusterLocalBindingInfo = controlModels[clusterSettings.niControlId].getLocalBindingInfo();
                var buttonLocalBindingInfo = controlModels[buttonSettings.niControlId].getLocalBindingInfo();

                expect(buttonLocalBindingInfo).toEqual({
                    io: 'I',
                    runtimePath: 'di_22.%66ield1',
                    type: 'Unknown',
                    encodedVIName: '',
                    prop: 'value',
                    sync: false,
                    via: ''
                });

                expect(clusterLocalBindingInfo).toEqual({
                    io: 'I',
                    runtimePath: 'di_22',
                    type: 'Object',
                    encodedVIName: '',
                    prop: 'value',
                    sync: false,
                    via: '22'
                });
            });

            it('can call processControlUpdate for a control owned by the VI', function (done) {
                viModel.processControlUpdate(buttonSettings.niControlId, buttonUpdateSettings);

                testHelpers.runAsync(done, function () {
                    expect(buttonModel.top).toBe(buttonUpdateSettings.top);
                    expect(buttonModel.left).toBe(buttonUpdateSettings.left);
                    expect(buttonModel.width).toBe(buttonUpdateSettings.width);
                    expect(buttonModel.height).toBe(buttonUpdateSettings.height);
                });
            });

        });
    });
});
