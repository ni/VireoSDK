//****************************************
// Tests for ArrayViewerModel class
// National Instruments Copyright 2014
//****************************************

describe('A ArrayViewerViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;
    var controlId = 'Array1';

    var viModel, frontPanelControls, arrayViewerModel, arrayViewerElement, arraySettings, arraySettings2, updateSettings, numericSettings, numericSettings2,
        clusterSettings, stringSettings, numericSettingsLabel, stringSettingsLabel;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        arraySettings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.ArrayViewerModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            visible: true
        };
        arraySettings2 = {
            niControlId: 'Array2',
            kind: NationalInstruments.HtmlVI.Models.ArrayViewerModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '200px',
            height: '100px',
            visible: true
        };

        numericSettings = {
            niControlId: 'Function10',
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            value: 5.0,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            labelId: 'Function10Label'
        };

        clusterSettings = {
            niControlId: 'Cluster1',
            kind: NationalInstruments.HtmlVI.Models.ClusterModel.MODEL_KIND,
            left: '10px',
            top: '20px',
            width: '80px',
            height: '120px'
        };
        numericSettings2 = {
            niControlId: 'Numeric1',
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            value: 5.0,
            left: '10px',
            top: '20px',
            width: '60px',
            height: '25px',
            labelId: 'Numeric1Label'
        };
        numericSettingsLabel = {
            niControlId: 'Numeric1Label',
            text: 'Numeric1',
            kind: NationalInstruments.HtmlVI.Models.LabelModel.MODEL_KIND,
            left: '10px',
            top: '20px',
            width: '60px',
            height: '20px'
        };

        stringSettings = {
            niControlId: 'String1',
            kind: NationalInstruments.HtmlVI.Models.StringControlModel.MODEL_KIND,
            visible: true,
            text: 'Editable',
            readOnly: false,
            configuration: {},
            left: '2px',
            top: '6px',
            width: '90px',
            height: '22px',
            labelId: 'String1Label'
        };
        stringSettingsLabel = {
            niControlId: 'String1Label',
            text: 'String1',
            kind: NationalInstruments.HtmlVI.Models.LabelModel.MODEL_KIND,
            left: '6px',
            top: '6px',
            width: '80px',
            height: '12px'
        };

        updateSettings = {
            visible: false
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    describe('update model property updates element property', function () {
        var viewModel, internalControl;
        beforeEach(function (done) {
            arrayViewerElement = webAppHelper.createNIElement(arraySettings);

            testHelpers.runMultipleAsync(done, function () {
                webAppHelper.createNIElement(numericSettings, arraySettings.niControlId);
            }, function () {
                frontPanelControls = viModel.getAllControlModels();
                arrayViewerModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                internalControl = $(arrayViewerElement.firstElementChild);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('sets model properties', function (done) {
            testHelpers.runMultipleAsync(done, function () {
                arrayViewerModel.rowsAndColumns = '2,1';
            }, function () {
                viewModel.userInteractionChanged('end');
            }, function () {
                expect(internalControl.jqxArray('rows')).toEqual(2);
            }, function () {
                arrayViewerModel.orientation = 'vertical';
                arrayViewerModel.rowsAndColumns = '1,2';
            }, function () {
                expect(internalControl.jqxArray('rows')).toEqual(1);
                expect(internalControl.jqxArray('columns')).toEqual(2);
                expect(arrayViewerElement.rowsAndColumns).toEqual('1,2');
            }, function () {
                arrayViewerModel.dimensions = 2;
            }, function () {
                expect(internalControl.jqxArray('dimensions')).toEqual(2);
            }, function () {
                arrayViewerModel.indexEditorWidth = 50;
            }, function () {
                expect(internalControl.jqxArray('indexerWidth')).toEqual(50);
            }, function () {
                arrayViewerModel.indexVisibility = false;
            }, function () {
                expect(internalControl.jqxArray('showIndexDisplay')).toEqual(false);
            }, function () {
                arrayViewerModel.verticalScrollbarVisibility = true;
            }, function () {
                expect(internalControl.jqxArray('showVerticalScrollbar')).toEqual(true);
            }, function () {
                arrayViewerModel.horizontalScrollbarVisibility = true;
            }, function () {
                expect(internalControl.jqxArray('showHorizontalScrollbar')).toEqual(true);
            });
        });
    });

    describe('dynamically updates value triggering ModelPropertyChanged', function () {
        var viewModel, internalControl;

        beforeEach(function (done) {
            arrayViewerElement = webAppHelper.createNIElement(arraySettings);

            testHelpers.runMultipleAsync(done, function () {
                webAppHelper.createNIElement(numericSettings, arraySettings.niControlId);
            }, function () {
                frontPanelControls = viModel.getAllControlModels();
                arrayViewerModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                internalControl = $(arrayViewerElement.firstElementChild);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('verifies initial values', function () {
            expect(arrayViewerModel).toBeDefined();
            expect(viewModel).toBeDefined();
        });

        it('changes 1D value', function (done) {
            testHelpers.runMultipleAsync(done, function () {
                $(internalControl).jqxArray({ value: [2] });
            }, function () {
                $(internalControl).trigger('change');
            }, function () {
                expect(arrayViewerModel.value).toEqual([2]);
            });
        });

        it('changes 2D value', function (done) {
            testHelpers.runMultipleAsync(done, function () {
                arrayViewerElement.dimensions = 2;
            }, function () {
                $(internalControl).jqxArray({ value: [[2], [3]] });
            }, function () {
                $(internalControl).trigger('change');
            }, function () {
                expect(arrayViewerModel.value).toEqual([[2], [3]]);
            });
        });
    });
    describe('dynamically updates properties on the template element and applies them to the value elements', function () {
        var viewModel, internalControl, selector;

        beforeEach(function (done) {
            arrayViewerElement = webAppHelper.createNIElement(arraySettings);

            testHelpers.runMultipleAsync(done, function () {
                webAppHelper.createNIElement(numericSettings, arraySettings.niControlId);
            }, function () {
                frontPanelControls = viModel.getAllControlModels();
                arrayViewerModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                internalControl = $(arrayViewerElement.firstElementChild);
                selector = '[ni-control-id=\'' + controlId + '\']';
                selector = selector + ' div.jqx-array-element-' + arrayViewerElement.childElement.id;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('updates size', function (done) {
            testHelpers.runMultipleAsync(done, function () {
                arrayViewerElement.elementSize = { width: 100, height: 100 };
            }, function () {
                var controls = document.querySelectorAll(selector);
                var i;
                for (i = 0; i < controls.length; i++) {
                    var niControl = controls[i].firstElementChild;
                    expect(niControl.style.width).toEqual('100px');
                    expect(niControl.style.height).toEqual('100px');
                }

                expect(arrayViewerElement.elementSize).toEqual({ width: 100, height: 100 });
            });
        });
        it('updates fontSize', function (done) {
            var viewModel;
            testHelpers.runMultipleAsync(done, function () {
                viewModel = viModel.getControlViewModel('Function10');
                viewModel.model.fontSize = '20px';
            }, function () {
                var controls = document.querySelectorAll(selector);
                expect(controls[0].childNodes[0].style.fontSize).toEqual('20px');
            });
        });
    });
    describe('nested arrays', function () {
        beforeEach(function () {
            webAppHelper.createNIElement(arraySettings);
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('creates an array of clusters', function (done) {
            testHelpers.runMultipleAsync(done, function () {
                webAppHelper.createNIElement(clusterSettings, arraySettings.niControlId);
                webAppHelper.createNIElement(numericSettings, clusterSettings.niControlId);
                webAppHelper.createNIElement(numericSettingsLabel, clusterSettings.niControlId);
                webAppHelper.createNIElement(stringSettings, clusterSettings.niControlId);
                webAppHelper.createNIElement(stringSettingsLabel, clusterSettings.niControlId);
            }, function () {
                var arrayViewModel = viModel.getControlViewModel(arraySettings.niControlId);
                var clusterViewModel = viModel.getControlViewModel(clusterSettings.niControlId);
                var numericViewModel = viModel.getControlViewModel(numericSettings.niControlId);
                var stringViewModel = viModel.getControlViewModel(stringSettings.niControlId);
                expect(Object.keys(viModel.getAllControlModels()).length).toBe(6);
                expect(arrayViewModel).toBeDefined();
                expect(clusterViewModel.model.getOwner()).toBe(arrayViewModel.model);
                expect(stringViewModel.model.getOwner()).toBe(clusterViewModel.model);
                expect(numericViewModel.model.getOwner()).toBe(clusterViewModel.model);
            });
        });
        it('creates an array of cluster of array of numeric', function (done) {
            testHelpers.runMultipleAsync(done, function () {
                webAppHelper.createNIElement(clusterSettings, arraySettings.niControlId);
            }, function () {
                webAppHelper.createNIElement(arraySettings2, clusterSettings.niControlId);
            }, function () {
                webAppHelper.createNIElement(numericSettings2, arraySettings2.niControlId);
            }, function () {
                var arrayViewModel = viModel.getControlViewModel(arraySettings.niControlId);
                var clusterViewModel = viModel.getControlViewModel(clusterSettings.niControlId);
                var array2ViewModel = viModel.getControlViewModel(arraySettings2.niControlId);
                var numeric2ViewModel = viModel.getControlViewModel(numericSettings2.niControlId);
                expect(Object.keys(viModel.getAllControlModels()).length).toBe(4);
                expect(arrayViewModel).toBeDefined();
                expect(clusterViewModel.model.getOwner()).toBe(arrayViewModel.model);
                expect(array2ViewModel.model.getOwner()).toBe(clusterViewModel.model);
                expect(numeric2ViewModel.model.getOwner()).toBe(array2ViewModel.model);
            });
        });
    });
});
