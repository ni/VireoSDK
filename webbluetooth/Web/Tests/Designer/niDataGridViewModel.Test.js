//****************************************
// Tests for DataGridViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A DataGridViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var viModel, controlModel, controlElement;
    var settings, updateSettings,
        settingsColumn0, updateSettingsColumn0, settingsColumnControl0,
        settingsColumn1, updateSettingsColumn1, settingsColumnControl1;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: 'FunctionDataGrid0',
            kind: NationalInstruments.HtmlVI.Models.DataGridModel.MODEL_KIND,
            left: '150px',
            top: '150px',
            width: '400px',
            height: '700px',
            readOnly: false,
            rowHeaderVisible: true,
            columnHeaderVisible: true,
            allowSorting: true,
            allowPaging: false,
            allowFiltering: true,
            allowGrouping: true,
            rowHeight: 40,
            altRowColors: true,
            altRowStart: 2,
            altRowStep: 2
        };
        updateSettings = {
            rowHeaderVisible: false,
            columnHeaderVisible: false,
            allowSorting: false,
            allowPaging: true,
            allowFiltering: false,
            allowGrouping: false,
            rowHeight: 25,
            altRowColors: false,
            altRowStart: 1,
            altRowStep: 1
        };

        settingsColumn0 = {
            niControlId: 'FunctionColumn0',
            kind: NationalInstruments.HtmlVI.Models.DataGridColumnModel.MODEL_KIND,
            width: 200,
            header: 'Column A',
            fieldName: 'A',
            index: 0
        };
        updateSettingsColumn0 = {
            header: 'AAA',
            index: 1
        };
        settingsColumnControl0 = {
            niControlId: 'FunctionColumnControl0',
            kind: NationalInstruments.HtmlVI.Models.StringControlModel.MODEL_KIND
        };

        settingsColumn1 = {
            niControlId: 'FunctionColumn1',
            kind: NationalInstruments.HtmlVI.Models.DataGridColumnModel.MODEL_KIND,
            width: 200,
            header: 'Column B',
            fieldName: 'B',
            index: 1
        };
        updateSettingsColumn1 = {
            header: 'BBB',
            index: 0
        };
        settingsColumnControl1 = {
            niControlId: 'FunctionColumnControl1',
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-data-grid ni-control-id="' + settings.niControlId + '"></ni-data-grid>');

        testHelpers.runMultipleAsync(done, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            expect(viewModel).toBeDefined();
        }, function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('allows elements to be added directly to the page via DOM functions', function (done) {
        var dataGrid, column0, columnControl0;

        dataGrid = document.createElement('ni-data-grid');
        dataGrid.niControlId = settings.niControlId;

        column0 = document.createElement('ni-data-grid-column');
        column0.niControlId = settingsColumn0.niControlId;
        column0.index = settingsColumn0.index;
        column0.fieldName = settingsColumn0.fieldName;

        columnControl0 = document.createElement('ni-string-control');
        columnControl0.niControlId = settingsColumnControl0.niControlId;

        column0.appendChild(columnControl0);
        dataGrid.appendChild(column0);
        document.body.appendChild(dataGrid);

        testHelpers.runMultipleAsync(done, function () {
            var viewModelDataGrid = viModel.getControlViewModel(settings.niControlId),
                viewModelColumn0 = viModel.getControlViewModel(settingsColumn0.niControlId),
                viewModelColumnControl0 = viModel.getControlViewModel(settingsColumnControl0.niControlId);
            expect(viewModelDataGrid).toBeDefined();
            expect(viewModelColumn0).toBeDefined();
            expect(viewModelColumnControl0).toBeDefined();
        }, function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('responds to a click to change the selected column (when in edit mode)', function (done) {
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settingsColumn0, settings.niControlId);
        webAppHelper.createNIElement(settingsColumnControl0, settingsColumn0.niControlId);
        webAppHelper.createNIElement(settingsColumn1, settings.niControlId);
        webAppHelper.createNIElement(settingsColumnControl1, settingsColumn1.niControlId);

        testHelpers.runMultipleAsync(done, function () {
            viModel.getControlViewModel(settings.niControlId).element.isInEditMode = true;
        }, function () {
            var columnHeaderToClick = $(viModel.getControlViewModel(settings.niControlId).element.querySelectorAll('div[role=\'columnheader\']')[2]);
            columnHeaderToClick.simulate('click');
        }, function () {
            expect(viModel.getControlViewModel(settings.niControlId).element.selectedColumn).toBe(1);
        }, function () {
            var columnHeaderToClick = $(viModel.getControlViewModel(settings.niControlId).element.querySelectorAll('div[role=\'columnheader\']')[1]);
            columnHeaderToClick.simulate('click');
        }, function () {
            expect(viModel.getControlViewModel(settings.niControlId).element.selectedColumn).toBe(0);
        }, function () {
            var columnHeaderToClick = $(viModel.getControlViewModel(settings.niControlId).element.querySelectorAll('div[role=\'columnheader\']')[0]);
            columnHeaderToClick.simulate('click');
        }, function () {
            expect(viModel.getControlViewModel(settings.niControlId).element.selectedColumn).toBe(-1);
        }, function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('allows elements to be added directly to the page via jQuery functions', function (done) {
        var str = '<ni-data-grid ni-control-id="' + settings.niControlId + '">' +
                     '<ni-data-grid-column ni-control-id="' + settingsColumn0.niControlId + '" index="' + settingsColumn0.index + '" fieldName="' + settingsColumn0.fieldName + '" >' +
                         '<ni-string-control ni-control-id="' + settingsColumnControl0.niControlId + '" />' +
                     '</ni-data-grid-column>' +
                     '<ni-data-grid-column ni-control-id="' + settingsColumn1.niControlId + '" index="' + settingsColumn1.index + '" fieldName="' + settingsColumn1.fieldName + '" >' +
                         '<ni-numeric-text-box ni-control-id="' + settingsColumnControl1.niControlId + '" />' +
                     '</ni-data-grid-column>' +
                  '</ni-data-grid>';

        $(document.body).append(str);

        testHelpers.runMultipleAsync(done, function () {
            expect(viModel.getControlModel(settings.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsColumn0.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsColumnControl0.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsColumn1.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsColumnControl1.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settings.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsColumn0.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsColumnControl0.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsColumn1.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsColumnControl1.niControlId)).toBeDefined();
        }, function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    describe('exists after the custom element is created', function () {
        var viewModel;
        var columnModel, columnViewModel, columnElement;
        var columnControlModel, columnControlViewModel, columnControlElement;

        beforeEach(function (done) {
            webAppHelper.createNIElement(settings);
            webAppHelper.createNIElement(settingsColumn0, settings.niControlId);
            webAppHelper.createNIElement(settingsColumnControl0, settingsColumn0.niControlId);
            testHelpers.runAsync(done, function () {
                controlModel = viModel.getControlModel(settings.niControlId);
                viewModel = viModel.getControlViewModel(settings.niControlId);
                controlElement = viewModel.element;

                columnModel = viModel.getControlModel(settingsColumn0.niControlId);
                columnViewModel = viModel.getControlViewModel(settingsColumn0.niControlId);
                columnElement = columnViewModel.element;

                columnControlModel = viModel.getControlModel(settingsColumnControl0.niControlId);
                columnControlViewModel = viModel.getControlViewModel(settingsColumnControl0.niControlId);
                columnControlElement = columnControlViewModel.element;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.readOnly).toEqual(settings.readOnly);
            expect(controlModel.rowHeaderVisible).toEqual(settings.rowHeaderVisible);
            expect(controlModel.columnHeaderVisible).toEqual(settings.columnHeaderVisible);
            expect(controlModel.allowSorting).toEqual(settings.allowSorting);
            expect(controlModel.allowPaging).toEqual(settings.allowPaging);
            expect(controlModel.allowFiltering).toEqual(settings.allowFiltering);
            expect(controlModel.allowGrouping).toEqual(settings.allowGrouping);
            expect(controlModel.rowHeight).toEqual(settings.rowHeight);
            expect(controlModel.altRowColors).toEqual(settings.altRowColors);
            expect(controlModel.altRowStart).toEqual(settings.altRowStart);
            expect(controlModel.altRowStep).toEqual(settings.altRowStep);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(settings.niControlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.rowHeaderVisible).toEqual(updateSettings.rowHeaderVisible);
                expect(controlModel.columnHeaderVisible).toEqual(updateSettings.columnHeaderVisible);
                expect(controlModel.allowSorting).toEqual(updateSettings.allowSorting);
                expect(controlModel.allowPaging).toEqual(updateSettings.allowPaging);
                expect(controlModel.allowFiltering).toEqual(updateSettings.allowFiltering);
                expect(controlModel.allowGrouping).toEqual(updateSettings.allowGrouping);
                expect(controlModel.rowHeight).toEqual(updateSettings.rowHeight);
                expect(controlModel.altRowColors).toEqual(updateSettings.altRowColors);
                expect(controlModel.altRowStart).toEqual(updateSettings.altRowStart);
                expect(controlModel.altRowStep).toEqual(updateSettings.altRowStep);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };
            webAppHelper.dispatchMessage(settings.niControlId, unknownSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.readOnly).toEqual(settings.readOnly);
                expect(controlModel.rowHeaderVisible).toEqual(settings.rowHeaderVisible);
                expect(controlModel.columnHeaderVisible).toEqual(settings.columnHeaderVisible);
                expect(controlModel.allowSorting).toEqual(settings.allowSorting);
                expect(controlModel.allowPaging).toEqual(settings.allowPaging);
                expect(controlModel.allowFiltering).toEqual(settings.allowFiltering);
                expect(controlModel.allowGrouping).toEqual(settings.allowGrouping);
                expect(controlModel.rowHeight).toEqual(settings.rowHeight);
                expect(controlModel.altRowColors).toEqual(settings.altRowColors);
                expect(controlModel.altRowStart).toEqual(settings.altRowStart);
                expect(controlModel.altRowStep).toEqual(settings.altRowStep);
            });
        });
    });

    describe('updates values correctly', function () {
        var viewModel;
        var columnModel, columnViewModel, columnElement;
        var columnControlModel, columnControlViewModel, columnControlElement;

        var numericValues = [1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9];
        var booleanValues = [false, true, false, true];
        var stringValues = ['Row 0', 'Row 1', 'Row 2', 'ABC', 'def', 'ghi', '0123', '4567', '89!'];
        var intValues = [1, 2, 3, 4];

        var testColumnType = function (done, controlSettings) {
            var i, values = [], val;
            var foundControls = null, checkCount = 0;
            var baseValues = controlSettings.values;
            var valuePropertyName = controlSettings.valuePropertyName;
            if (valuePropertyName === undefined) {
                valuePropertyName = 'value';
            }

            webAppHelper.createNIElement(settings);
            webAppHelper.createNIElement(settingsColumn0, settings.niControlId);
            controlSettings.settings.niControlId = settingsColumnControl0.niControlId;
            webAppHelper.createNIElement(controlSettings.settings, settingsColumn0.niControlId);

            var pushValues = function () {
                var valueToPush;

                controlModel = viModel.getControlModel(settings.niControlId);
                viewModel = viModel.getControlViewModel(settings.niControlId);
                controlElement = viewModel.element;
                expect(controlModel).toBeDefined();
                expect(viewModel).toBeDefined();
                expect(controlElement).toBeDefined();

                columnModel = viModel.getControlModel(settingsColumn0.niControlId);
                columnViewModel = viModel.getControlViewModel(settingsColumn0.niControlId);
                columnElement = columnViewModel.element;
                expect(columnModel).toBeDefined();
                expect(columnViewModel).toBeDefined();
                expect(columnElement).toBeDefined();

                columnControlModel = viModel.getControlModel(settingsColumnControl0.niControlId);
                columnControlViewModel = viModel.getControlViewModel(settingsColumnControl0.niControlId);
                columnControlElement = columnControlViewModel.element;
                expect(columnControlModel).toBeDefined();
                expect(columnControlViewModel).toBeDefined();
                expect(columnControlElement).toBeDefined();

                for (i = 0; i < baseValues.length; i++) {
                    valueToPush = {};
                    valueToPush[columnElement.fieldName] = baseValues[i];
                    values.push(valueToPush);
                }

                webAppHelper.dispatchMessage(settings.niControlId, { value: values });
            };

            var checkControlValues = function () {
                var i;

                for (i = 0; i < foundControls.length; i++) {
                    val = foundControls[i][valuePropertyName];
                    if (controlSettings.getValueToCheck !== undefined) {
                        val = controlSettings.getValueToCheck(val);
                    }

                    expect(val).toEqual(baseValues[i]);
                }
            };

            var checkControls = function () {
                var controls, jqxGrid;

                if (foundControls !== null) {
                    return;
                }

                jqxGrid = $(controlElement).children('div')[0];

                if (controlSettings.elementQuery !== undefined) {
                    controls = controlSettings.elementQuery(jqxGrid);
                } else {
                    controls = jqxGrid.querySelectorAll(columnControlElement.tagName);
                }

                if (controls.length === baseValues.length) {
                    foundControls = controls;
                    checkControlValues();
                    return;
                } else {
                    checkCount++;
                    if (checkCount > 3) {
                        expect(controls.length).toEqual(baseValues.length); // Fail test if controls not found after 3 frames
                    }
                }
            };

            testHelpers.runMultipleAsync(done, pushValues,
                checkControls,
                checkControls,
                checkControls); // Note: 3 calls to checkControls here should match the max checkCount from above
        };

        afterEach(function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });

        it('for the string column type', function (done) {
            testColumnType(done, {
                settings: { kind: NationalInstruments.HtmlVI.Models.StringControlModel.MODEL_KIND },
                values: stringValues,
                valuePropertyName: 'text'
            });
        });
        it('for the numeric text box column type', function (done) {
            testColumnType(done, {
                settings: { kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND },
                values: numericValues,
                getValueToCheck: function (val) {
                    return val.numberValue;
                }
            });
        });
        it('for the checkbox column type', function (done) {
            testColumnType(done, {
                settings: { kind: NationalInstruments.HtmlVI.Models.CheckBoxModel.MODEL_KIND },
                values: booleanValues,
                elementQuery: function (jqxGridDiv) {
                    return jqxGridDiv.querySelectorAll('div.jqx-checkbox span');
                },
                valuePropertyName: 'className',
                getValueToCheck: function (val) {
                    return val === 'jqx-checkbox-check-checked';
                }
            });
        });
        it('for the boolean LED column type', function (done) {
            testColumnType(done, {
                settings: { kind: NationalInstruments.HtmlVI.Models.BooleanLEDModel.MODEL_KIND },
                values: booleanValues
            });
        });
        it('for the slider column type', function (done) {
            testColumnType(done, {
                settings: { kind: NationalInstruments.HtmlVI.Models.SliderModel.MODEL_KIND },
                values: numericValues,
                getValueToCheck: function (val) {
                    return val.numberValue;
                }
            });
        });
        it('for the progress bar column type', function (done) {
            testColumnType(done, {
                settings: { kind: NationalInstruments.HtmlVI.Models.LinearProgressBarModel.MODEL_KIND },
                values: numericValues
            });
        });
        it('for the dropdown column type', function (done) {
            testColumnType(done, {
                settings: { kind: NationalInstruments.HtmlVI.Models.DropDownModel.MODEL_KIND, source: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
                values: intValues,
                valuePropertyName: 'selectedIndex'
            });
        });
    });

    it('is virtualized (based on how many rows are visible)', function (done) {
        var viewModel;
        var columnModel, columnViewModel, columnElement;
        var columnControlModel, columnControlViewModel, columnControlElement;

        settings.height = '300px';
        settings.rowHeight = 25;
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settingsColumn0, settings.niControlId);
        webAppHelper.createNIElement(settingsColumnControl0, settingsColumn0.niControlId);

        testHelpers.runMultipleAsync(done, function () {
            var valueToPush, values = [], i;

            controlModel = viModel.getControlModel(settings.niControlId);
            viewModel = viModel.getControlViewModel(settings.niControlId);
            controlElement = viewModel.element;

            columnModel = viModel.getControlModel(settingsColumn0.niControlId);
            columnViewModel = viModel.getControlViewModel(settingsColumn0.niControlId);
            columnElement = columnViewModel.element;

            columnControlModel = viModel.getControlModel(settingsColumnControl0.niControlId);
            columnControlViewModel = viModel.getControlViewModel(settingsColumnControl0.niControlId);
            columnControlElement = columnControlViewModel.element;

            for (i = 0; i < 1000; i++) {
                valueToPush = {};
                valueToPush[columnElement.fieldName] = 'ABC ' + i;
                values.push(valueToPush);
            }

            webAppHelper.dispatchMessage(settings.niControlId, { value: values });
        }, function () {
            // This allows the control to be rendered and visible. The test will still pass without this.
        }, function () {
            var jqxGrid = $(controlElement).children('div')[0];
            var controls = jqxGrid.querySelectorAll(columnControlElement.tagName);

            // Since the data grid is virtualized, there should be only enough controls created to fill the data grid's visible height,
            // so in this case, much fewer than 1000.

            expect(controls.length).toBeGreaterThan(0);
            // From above, rowheight = 25 and data grid height = 300, so the number of controls would be ~12 without headers / toolbars. But, we
            // have to take into account the headers, toolbars, and the fact that at least one more control is created in the bottom of the data
            // grid to allow for scrolling.
            // We're not very exact here, we mainly care that it's much fewer than the number of values in the dataset.
            expect(controls.length).toBeLessThan(20);

            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('can add new rows at runtime', function (done) {
        var viewModel;
        var columnModel, columnViewModel, columnElement;
        var columnControlModel, columnControlViewModel, columnControlElement;
        var foundControls = false, checkCount = 0;

        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settingsColumn0, settings.niControlId);
        webAppHelper.createNIElement(settingsColumnControl0, settingsColumn0.niControlId);

        var checkControls = function () {
            if (foundControls) {
                return;
            }

            var jqxGrid = $(controlElement).children('div')[0];
            var controls = jqxGrid.querySelectorAll(columnControlElement.tagName);
            if (controls.length === 3) {
                foundControls = true;
                webAppHelper.removeNIElement(settings.niControlId);
                return;
            } else {
                checkCount++;
                if (checkCount > 3) {
                    expect(controls.length).toEqual(3); // Fail test if controls not found after 3 frames
                }
            }
        };

        testHelpers.runMultipleAsync(done, function () {
            var addRowsInput, addRowsButton;

            controlModel = viModel.getControlModel(settings.niControlId);
            viewModel = viModel.getControlViewModel(settings.niControlId);
            controlElement = viewModel.element;

            columnModel = viModel.getControlModel(settingsColumn0.niControlId);
            columnViewModel = viModel.getControlViewModel(settingsColumn0.niControlId);
            columnElement = columnViewModel.element;

            columnControlModel = viModel.getControlModel(settingsColumnControl0.niControlId);
            columnControlViewModel = viModel.getControlViewModel(settingsColumnControl0.niControlId);
            columnControlElement = columnControlViewModel.element;

            addRowsInput = document.querySelector('div.ni-add-rows-toolbar div.jqx-input');
            expect(addRowsInput).toBeDefined();
            $(addRowsInput).jqxNumberInput('val', 3);

            addRowsButton = document.querySelector('div.ni-add-rows-toolbar input[type=\'button\']');
            expect(addRowsButton).toBeDefined();
            $(addRowsButton).simulate('click');
        }, checkControls, checkControls, checkControls); // Note: 3 calls to checkControls here should match the max checkCount from above
    });
});
