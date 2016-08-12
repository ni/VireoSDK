//****************************************
// Data Grid
// DOM Registration: No
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.DataGrid = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var $ = NationalInstruments.Globals.jQuery;
    var NUM_VAL_CONVERTER = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static Properties
    var DEFAULT_ROW_HEIGHT = 22;
    var ID_DATAFIELD = '_id'; // The column datafield name for the 'id' column that shows the row index
    var STRING_TEMPLATE_TYPE = 'NI-STRING-CONTROL';
    var NUMERIC_TEMPLATE_TYPE = 'NI-NUMERIC-TEXT-BOX';
    var CHECKBOX_TEMPLATE_TYPE = 'NI-CHECK-BOX';
    var LED_TEMPLATE_TYPE = 'NI-BOOLEAN-LED';
    var SLIDER_TEMPLATE_TYPE = 'NI-SLIDER';
    var PROGRESSBAR_TEMPLATE_TYPE = 'NI-LINEAR-PROGRESS-BAR';
    var DROPDOWN_TEMPLATE_TYPE = 'NI-DROP-DOWN';
    var JQX_MATH = new $.jqx.math();

    // Static Private Functions

    // Utility
    var getFalseValue = function () {
        return false;
    };

    var getElementHeight = function (elementSelector) {
        if (elementSelector.length > 0) {
            var element = elementSelector[0];
            if (element.style.display !== 'none' && element.style.visibility !== 'hidden') {
                return element.offsetHeight;
            }
        }

        return 0;
    };

    var getAltRowSettings = function (start, step) {
        // We want Alt Start Index (the property that this element defines) to mean that the row at that index is the first
        // one in the alt color. The jqxGrid defines it differently (if rowindex > altstart && ((altstart + i) % (1 + altstep) == 0)).
        // We want (i - altstart) % (1 + altstep) == 0.
        // So basically we'd just need to negate startIndex, except that would mean the first colored row starts too early. So we add to that
        // based on multiples of the step size.
        var altstart = -start + Math.floor(2 * start / (step + 1)) * (step + 1);
        return {
            altstep: step,
            altstart: altstart
        };
    };

    // Column Widgets
    var initJqxColumnWidget = function (dataGrid, row, column, value, cellElement) {
        var rowindex = (typeof row === 'number') ? row : row.visibleindex;
        var datafield = (typeof column === 'string') ? column : column.datafield;
        var niElement = cellElement.firstElementChild;
        niElement._dataGridRow = rowindex;
        niElement._dataGridColumn = datafield;
        columnTypeHelpers[niElement.nodeName].setWidgetValue(niElement, value);
    };

    var createJqxColumnWidget = function (dataGrid, row, column, value, cellElement) {
        if (!cellElement.firstElementChild) {
            var columnIndex = column.datafield;
            var niColumn = dataGrid.columns[columnIndex];
            var templateControl = niColumn.firstElementChild;
            var templateType = templateControl.nodeName;
            var columnTypeHelper = columnTypeHelpers[templateType];
            var control = templateControl.cloneNode(false);
            // TODO : Right now we need to clear the style, because the template control has a transform set on it that we
            // don't want to clone. Long term, it would be nice not do this, in case the control has other style settings we
            // do want to clone.
            control.setAttribute('style', '');
            var fontStyles;
            control.niControlId = NI_SUPPORT.uniqueId();
            control._dataGridRow = row.visibleindex;
            control._dataGridColumn = column.datafield;
            control._preventModelCreation = true;
            control.visible = true;
            control.style.width = '100%';
            control.style.height = '100%';
            fontStyles = window.getComputedStyle(templateControl);
            control.style.fontSize = fontStyles.fontSize;
            control.style.fontFamily = fontStyles.fontFamily;
            control.style.fontWeight = fontStyles.fontWeight;
            control.style.fontStyle = fontStyles.fontStyle;
            columnTypeHelper.setWidgetValue(control, value);
            cellElement.appendChild(control);
            if (typeof columnTypeHelper.configureWidget === 'function') {
                columnTypeHelper.configureWidget(dataGrid, control, cellElement);
            }

            if (typeof columnTypeHelper.resize === 'function') {
                control.attachedCallback(); // Force internal DOM to be initialized, since the resize code often assumes its already there
                columnTypeHelper.resize(control, { width: niColumn.width, height: dataGrid.coercedRowHeight });
            }
        }
    };

    var initCustomColumnType = function (dataGrid, jqxColumn) {
        jqxColumn.columntype = 'custom';
        jqxColumn.createwidget = function (row, column, value, cellElement) {
            createJqxColumnWidget(dataGrid, row, column, value, cellElement);
        };

        jqxColumn.initwidget = function (row, column, value, cellElement) {
            initJqxColumnWidget(dataGrid, row, column, value, cellElement);
        };

        jqxColumn.cellbeginedit = getFalseValue;
    };

    var getAggregateStringValue = function (aggregate, val) {
        var significantDigits = aggregate.significantDigits;
        var precisionDigits = aggregate.precisionDigits;

        if (aggregate.format === 'exponential') {
            if (precisionDigits < 0) {
                precisionDigits = undefined;
            }

            return JQX_MATH.getDecimalNotation(val, aggregate.format, precisionDigits, significantDigits);
        }

        if (significantDigits >= 0) {
            return Number(val.toPrecision(significantDigits)).toString();
        } else if (precisionDigits >= 0) {
            return val.toFixed(precisionDigits);
        } else {
            throw new Error('Unexpected significantDigits / precisionDigits for column aggregate');
        }
    };

    var aggregatesRenderer = function (aggregates, jqxAggregates) {
        var first = true;
        var alignment = '';
        if (aggregates.horizontalAlignment !== undefined) {
            alignment = ' style=\'text-align:' + aggregates.horizontalAlignment + '\'';
        }

        var renderstring = '<div class=\'ni-aggregate-box\'' + alignment + '>';
        $.each(jqxAggregates, function (key, value) {
            var aggregate = aggregates.items[key];
            var label = aggregate.label;
            if (label === undefined) {
                label = '';
            }

            if (first) {
                first = false;
            } else {
                renderstring += '<br />';
            }

            renderstring += '<strong>' + label + ':</strong> ' + getAggregateStringValue(aggregate, value);
        });
        renderstring += '</div>';
        return renderstring;
    };

    // Support (column initialization, default values, value updating) for all supported column types

    var addTemplateControlMutationObserver = function (dataGrid, column) {
        var observer, observerConfig, columnTypeHelper, columnDataField;
        var templateControl = column.firstElementChild;

        if (templateControl === null) {
            return;
        }

        columnDataField = column.index.toString();
        columnTypeHelper = columnTypeHelpers[templateControl.nodeName];
        observer = new window.MutationObserver(function (mutations) {
            var changedAttributes;
            if (columnTypeHelper.templateControlAttributeChanged !== undefined) {
                changedAttributes = {};
                mutations.forEach(function (mutation) {
                    var attrName = mutation.attributeName;
                    if (attrName !== null) {
                        changedAttributes[attrName] = true;
                    }
                });
                columnTypeHelper.templateControlAttributeChanged(dataGrid, column, changedAttributes);
            }
        });

        observerConfig = { attributes: true };
        column._niColumnTemplateControlObserver = observer;
        if (typeof observer.observe === 'function') {
            observer.observe(templateControl, observerConfig);
        }
    };

    var removeTemplateControlMutationObserver = function (column) {
        var columnObserver = column._niColumnTemplateControlObserver;
        if (columnObserver !== undefined && (typeof columnObserver.disconnect === 'function')) {
            columnObserver.disconnect();
            column._niColumnTemplateControlObserver = undefined;
        }
    };

    var templateControlAttributeChangedNIElement = function (dataGrid, column, attributes) {
        var columnDataField = column.index.toString();
        var templateControl = column.firstElementChild;
        var fontStyles, attrName, templateAttributeValues = {}, matchedControls, control, i;
        for (attrName in attributes) {
            if (attributes.hasOwnProperty(attrName)) {
                if (attrName === 'style') {
                    fontStyles = $(templateControl).css(['fontSize', 'fontFamily', 'fontWeight', 'fontStyle']);
                } else if (templateControl.hasAttribute(attrName)) {
                    templateAttributeValues[attrName] = templateControl.getAttribute(attrName);
                }
            }
        }

        matchedControls = dataGrid.jqref[0].querySelectorAll(templateControl.tagName);

        for (i = 0; i < matchedControls.length; i++) {
            control = matchedControls[i];
            if (control._dataGridColumn === columnDataField) {
                for (attrName in attributes) {
                    if (attributes.hasOwnProperty(attrName)) {
                        if (attrName === 'style') {
                            control.setFont(fontStyles.fontSize, fontStyles.fontFamily, fontStyles.fontWeight, fontStyles.fontStyle);
                        } else if (templateAttributeValues[attrName] !== undefined) {
                            control.setAttribute(attrName, templateAttributeValues[attrName]);
                        } else {
                            control.removeAttribute(attrName);
                        }
                    }
                }
            }
        }
    };

    var addNumericValueChangedListener = function (dataGrid, widgetElement) {
        widgetElement.addEventListener('value-changed', function (event) {
            var modelValue = NUM_VAL_CONVERTER.convertBack(event.detail.value, widgetElement.valueType);
            dataGrid.templateControlValueChanged(widgetElement, modelValue);
        });
    };

    var keyDownStopPropagation = function (e) {
        // This keydown handler is meant to be hooked up to template control
        // types that use keyboard input (e.g. numeric text box and string).
        // It prevents keydown events from bubbling up to the data grid.
        // (The data grid has its own key listeners which interfere with
        // the control's, otherwise.)
        if (e.stopPropagation !== undefined) {
            e.stopPropagation();
        }
    };

    var triggerResizeForWidget = function (element, size) {
        element.dispatchEvent(new CustomEvent('resizeEventHack', { detail: size, bubbles: false }));
    };

    var columnTypeHelpers = {};

    columnTypeHelpers[STRING_TEMPLATE_TYPE] = {
        initializeColumn: initCustomColumnType,
        setWidgetValue: function (niElement, value) {
            var type = typeof value;
            if (type === 'string') {
                niElement.textNonSignaling = value;
            }
        },
        getDefaultValue: function () {
            return '';
        },
        templateControlAttributeChanged: templateControlAttributeChangedNIElement,
        configureWidget: function (dataGrid, widgetElement) {
            widgetElement.addEventListener('text-changed', function (evt) {
                dataGrid.templateControlValueChanged(widgetElement, evt.detail.text);
            });
            widgetElement.addEventListener('keydown', keyDownStopPropagation, false);
        }
    };

    columnTypeHelpers[NUMERIC_TEMPLATE_TYPE] = {
        initializeColumn: initCustomColumnType,
        setWidgetValue: function (niElement, value) {
            niElement.valueNonSignaling = NUM_VAL_CONVERTER.convert(value);
        },
        resize: triggerResizeForWidget,
        getDefaultValue: function (templateElement) {
            var valueTypeAttr = templateElement.attributes['value-type'], valueType,
                defaultValue = {stringValue: '0', numberValue: 0};
            if (valueTypeAttr !== undefined) {
                valueType = valueTypeAttr.value;
            }

            return NUM_VAL_CONVERTER.convertBack(defaultValue, valueType);
        },
        templateControlAttributeChanged: templateControlAttributeChangedNIElement,
        configureWidget: function (dataGrid, widgetElement) {
            addNumericValueChangedListener(dataGrid, widgetElement);
            widgetElement.addEventListener('keydown', keyDownStopPropagation, false);
        }
    };

    columnTypeHelpers[CHECKBOX_TEMPLATE_TYPE] = {
        initializeColumn: function (dataGrid, jqxColumn) {
            jqxColumn.columntype = 'checkbox';
        },
        getDefaultValue: getFalseValue
    };

    columnTypeHelpers[LED_TEMPLATE_TYPE] = {
        initializeColumn: initCustomColumnType,
        setWidgetValue: function (niElement, value) {
            if (typeof value === 'boolean') {
                niElement.valueNonSignaling = value;
            }
        },
        templateControlAttributeChanged: templateControlAttributeChangedNIElement,
        configureWidget: function (dataGrid, widgetElement) {
            widgetElement.attachedCallback(); // Without attaching early here, detached can be called before attached and we hit errors in niUIActivityService.
            widgetElement.addEventListener('value-changed', function (event) {
                dataGrid.templateControlValueChanged(widgetElement, event.detail.value);
            });
        },
        getDefaultValue: getFalseValue,
        resize: function (element, size) {
            var minDimension = Math.min(size.width, size.height) - 4; // -4 for 2*padding for LEDs in a data grid in our CSS
            element.style.left = ((size.width - minDimension - 4) / 2) + 'px';
            element.style.top = ((size.height - minDimension - 4) / 2) + 'px';
            element.style.width = minDimension + 'px';
            element.style.height = minDimension + 'px';
        }
    };

    columnTypeHelpers[SLIDER_TEMPLATE_TYPE] = {
        initializeColumn: initCustomColumnType,
        setWidgetValue: columnTypeHelpers[NUMERIC_TEMPLATE_TYPE].setWidgetValue,
        getDefaultValue: columnTypeHelpers[NUMERIC_TEMPLATE_TYPE].getDefaultValue,
        resize: function (element, size) {
            var newSize = { width: size.width - 6, height: size.height }; // 6px is the same as margin-left for the ni-slider in a data grid in our CSS
            triggerResizeForWidget(element, newSize);
        },
        templateControlAttributeChanged: templateControlAttributeChangedNIElement,
        configureWidget: function (dataGrid, widgetElement) {
            addNumericValueChangedListener(dataGrid, widgetElement);
        }
    };

    columnTypeHelpers[PROGRESSBAR_TEMPLATE_TYPE] = {
        initializeColumn: initCustomColumnType,
        setWidgetValue: function (niElement, value) {
            var type = typeof value;
            if (type === 'number') {
                niElement.valueNonSignaling = value;
            }
        },
        getDefaultValue: function () {
            return 0;
        },
        templateControlAttributeChanged: templateControlAttributeChangedNIElement
    };

    columnTypeHelpers[DROPDOWN_TEMPLATE_TYPE] = {
        initializeColumn: initCustomColumnType,
        setWidgetValue: function (niElement, value) {
            var type = typeof value;
            if (type === 'number') {
                niElement.selectedIndexNonSignaling = value;
            }
        },
        getDefaultValue: function () {
            return -1;
        },
        resize: triggerResizeForWidget,
        templateControlAttributeChanged: templateControlAttributeChangedNIElement,
        configureWidget: function (dataGrid, widgetElement) {
            widgetElement.addEventListener('selected-index-changed', function (evt) {
                dataGrid.templateControlValueChanged(widgetElement, evt.detail.selectedIndex);
            });
        }
    };

    // Add Rows Tool Bar
    var appendAddRowsToolbar = function (dataGrid) {
        var innerDiv = $('<div style=\'margin:5px;\'></div>');
        var rowCountInput = $('<div style=\'display: inline-table; margin-right: 5px;\' />');
        innerDiv.append(rowCountInput);
        innerDiv.append(dataGrid.addRowsLabel + ': ');
        var addButton = $('<input type=\'button\' style=\'margin-left: 2px;\' />');
        innerDiv.append(addButton);
        var outerDiv = $('<div class=\'ni-add-rows-toolbar\'></div>');
        outerDiv.append(innerDiv);
        if (dataGrid.readOnly || !dataGrid.showAddRowsToolBar) {
            outerDiv[0].style.display = 'none';
        }

        dataGrid.jqref.append(outerDiv);
        dataGrid.addRowsToolbarRef = outerDiv;
        rowCountInput.jqxNumberInput({ inputMode: 'simple', decimalDigits: 0, min: 1, value: 1 });
        rowCountInput[0].style.width = '55px';
        rowCountInput[0].firstElementChild.style.width = '50px';
        rowCountInput.addClass('ni-row-count-text-field-box');
        rowCountInput.find(' input').addClass('ni-row-count-text-field');
        addButton[0].value = dataGrid.addRowsButtonLabel;
        addButton.jqxButton({ width: '50' });
        addButton.addClass('ni-add-rows-button');
        addButton.on('click', function () {
            if (dataGrid.jqref === undefined) {
                return;
            }

            dataGrid.addEmptyRows(rowCountInput.jqxNumberInput('val'));

            addButton.blur();
        });
    };

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'value',
            defaultValue: '[]',
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'rowHeaderVisible',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'columnHeaderVisible',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'showAddRowsToolBar',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'allowSorting',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'allowPaging',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'allowFiltering',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'allowGrouping',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'rowHeight',
            defaultValue: DEFAULT_ROW_HEIGHT
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'altRowColors',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'altRowStart',
            defaultValue: 1
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'altRowStep',
            defaultValue: 1
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'isInEditMode',
            defaultValue: false,
            fireEvent: false,
            addNonSignalingProperty: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'selectedColumn',
            defaultValue: -1
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        this.columns = [];
        this.selectedColumnDataField = undefined;
        this.sortedColumnIndices = [];
        this.parsedValue = [];
        this.jqxValue = [];
        this.columnObservers = [];
        this.pageSize = 0;
        this.addRowsButtonLabel = NI_SUPPORT.i18n('msg_datagrid_addrowsbuttonlabel');
        this.addRowsLabel = NI_SUPPORT.i18n('msg_datagrid_addrowslabel');
        this.coercedRowHeight = DEFAULT_ROW_HEIGHT;
        this.showAggregates = false;
        this.maxAggregateCountPerColumn = 0;

        // Private Instance Properties
        // None
    };

    proto.getDefaultColumns = function () {
        // This adds the leftmost 'row index' column, which will be hidden if the 'row header visible' property is false.
        return [{
            text: '',
            datafield: ID_DATAFIELD,
            width: 50,
            cellsalign: 'center',
            columntype: 'custom',
            createwidget: function (row, column, value, cellElement) {
                if (!cellElement.firstElementChild) {
                    $(cellElement).append('<div style=\'width: 100%; height: 100%; display: table; text-align: center;\'>' +
                       '<span style=\'display: table-cell; vertical-align: middle;\'>' + value.toString() + '</span></div>');
                }
            },
            initwidget: function (row, column, value, cellElement) {
                var outerDiv = cellElement.firstElementChild;
                if (outerDiv !== null) {
                    outerDiv.firstElementChild.textContent = value.toString();
                }
            },
            cellbeginedit: getFalseValue,
            hidden: !this.rowHeaderVisible,
            pinned: this.columns.some(function (col) {
                return col.pinned;
            })
        }];
    };

    proto.setFont = function () {
        // Don't call the parent / base method, which changes the font properties on our CSS style. Changing fonts on the data grid shouldn't
        // affect the headers / toolbar / etc. Each column can have its font settings changed individually via styling the template control
        // for that column.
        // parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);
    };

    proto.templateControlValueChanged = function (element, modelValue) {
        var row = element._dataGridRow, column = element._dataGridColumn;
        var curValue = this.jqxValue[row][column];
        if (curValue !== modelValue) {
            this.jqxValue[row][column] = modelValue;
            this.parsedValue[row][this.columns[column].fieldName] = modelValue;
            this.value = JSON.stringify(this.parsedValue);
        }
    };

    proto.updateJqxColumnConfig = function () {
        var that = this;
        var i;
        var columns = this.getDefaultColumns();
        var newColumn, templateType, templateElement, columnTypeHelper;
        var aggregates, showAggregates = false, aggregateCount = 0;
        var maxAggregateCountPerColumn = 0;
        var sortedIndices = [0];
        var columnsValid = true;

        // Sanity check column ordering. If we're in an inconsistent state (missing column, 2 columns with the same index,
        // etc), then tell the jqxGrid that it has no user columns (just the row ID one).
        for (i = 0; i < this.columns.length; i++) {
            if (i !== this.columns[i].index) {
                columnsValid = false;
                break;
            }
        }

        if (columnsValid) {
            for (i = 0; i < this.columns.length; i++) {
                if (this.columns[i].pinned) {
                    sortedIndices.push(i + 1);
                }
            }

            // Note: using forEach instead of a regular for loop here because otherwise, the value of 'column' in the inner function
            // would be incorrect due to how closures work in loops in JS
            this.columns.forEach(function (column, i) {
                column.parsedAggregates = JSON.parse(column.aggregates);
                aggregates = [];
                aggregateCount = 0;
                for (var aggregate in column.parsedAggregates.items) {
                    if (column.parsedAggregates.items.hasOwnProperty(aggregate)) {
                        aggregates.push(aggregate);
                        aggregateCount++;
                        showAggregates = true;
                    }
                }

                maxAggregateCountPerColumn = Math.max(maxAggregateCountPerColumn, aggregateCount);
                newColumn = {
                    align: 'center',
                    text: column.header,
                    datafield: i.toString(),
                    width: column.width,
                    pinned: column.pinned,
                    aggregates: aggregates
                };
                if (aggregates.length > 0) {
                    newColumn.aggregatesrenderer = function (aggregates) {
                        return aggregatesRenderer(column.parsedAggregates, aggregates);
                    };
                }

                if (!column.pinned) {
                    sortedIndices.push(i + 1);
                }

                templateElement = column.firstElementChild;
                if (templateElement !== null) {
                    templateType = templateElement.nodeName;
                    if (!columnTypeHelpers.hasOwnProperty(templateType)) {
                        throw new Error('Unsupported template element type for column ' + i + ': ' + templateType);
                    }

                    columnTypeHelper = columnTypeHelpers[templateType];
                    column._niColumnDefaultValue = columnTypeHelper.getDefaultValue(templateElement);
                    columnTypeHelper.initializeColumn(that, newColumn);

                    columns.push(newColumn);
                }
            });
        }

        this.showAggregates = showAggregates;
        this.maxAggregateCountPerColumn = maxAggregateCountPerColumn;
        this.sortedColumnIndices = sortedIndices;
        this.jqxColumnConfig = columns;
    };

    proto.addEmptyRows = function (count) {
        var row, jqxRow, rows, i, j, n, column, oldLength;
        if (count > 0) {
            rows = [];
            oldLength = this.parsedValue.length;
            n = oldLength;
            for (i = 0; i < count; i++) {
                row = {};
                jqxRow = {};
                jqxRow[ID_DATAFIELD] = n++;
                for (j = 0; j < this.columns.length; j++) {
                    column = this.columns[j];
                    jqxRow[j] = column._niColumnDefaultValue;
                    row[column.fieldName] = column._niColumnDefaultValue;
                }

                rows.push(jqxRow);
                this.jqxValue.push(jqxRow);
                this.parsedValue.push(row);
            }

            if (this.showAggregates && oldLength === 0) {
                // If we have data and we didn't before, show the aggregates bar as needed.
                this.updateStatusBar();
                this.updatePageSize();
            }

            this.jqref.jqxGrid('addrow', null, rows);
            this.value = JSON.stringify(this.parsedValue);
        }
    };

    proto.updateJqxValueFromParsedValue = function () {
        // jqxValue and parsedValue both represent the full data set, but with different field names.
        // Example: If you have 'Column A' and 'Column B' in the editor and 1 row of data, you would have
        // parsedValue[0]['Column A'] and parsedValue[0]['Column B'], versus
        // jqxValue[0]['0'] and jqxValue[0]['1'] for the cell values.
        // There's 2 main reasons why jqxValue and parsedValue can't be the same array instance (and why the
        // field names are different):
        // 1. Each column in the jqxGrid has a datafield (string property) that's the field name in the row objects,
        //    where the data should come from for that column. The ID / row index column also must have a datafield.
        //    If we directly map the diagram cluster field names as the datafield, a user-specified name could conflict
        //    with the name we pick for the ID column's datafield. So, we have a copy with different field names that
        //    we know won't conflict.
        // 2. When you give the jqxGrid an array data source, it sets additional fields in the row objects inside the
        //    array you give it. We don't want those additional (internal) fields to still be in the array of objects that
        //    we hand back to the model when the user changes data. So, we'd need a copy anyway.
        var i, j, curRow, result;
        result = [];
        for (i = 0; i < this.parsedValue.length; i++) {
            curRow = {};
            curRow[ID_DATAFIELD] = i;
            for (j = 0; j < this.columns.length; j++) {
                curRow[j] = this.parsedValue[i][this.columns[j].fieldName];
            }

            result.push(curRow);
        }

        this.jqxValue = result;
    };

    proto.initializeColumnsAndData = function () {
        this.updateJqxColumnConfig();
        this.parsedValue = JSON.parse(this.value);
        this.updateJqxValueFromParsedValue();
        this.dataSource = {
            datatype: 'array',
            localdata: this.jqxValue
        };
        this.dataAdapter = new $.jqx.dataAdapter(this.dataSource);
        this.updateStatusBar(); // Make sure aggregates will show, if enabled
        this.jqref.jqxGrid({ columns: this.jqxColumnConfig, source: this.dataAdapter });
    };

    proto.getSettings = function () {
        var altRowSettings = getAltRowSettings(this.altRowStart, this.altRowStep);
        return {
            editable: !this.readOnly,
            showemptyrow: false, // Don't show 'No Data to Display' when empty,
            selectionmode: 'none',
            showheader: this.columnHeaderVisible,
            columnsresize: true,
            enablehover: false,
            sortable: this.allowSorting,
            filterable: this.allowFiltering,
            showfilterrow: this.allowFiltering,
            pageable: this.allowPaging,
            groupable: this.allowGrouping,
            altrows: this.altRowColors,
            altstart: altRowSettings.altstart,
            altstep: altRowSettings.altstep,
            width: this.offsetWidth,
            height: this.offsetHeight,
            columnsheight: DEFAULT_ROW_HEIGHT,
            rowsheight: this.coercedRowHeight
        };
    };

    proto.setSelectedColumn = function (column) {
        var newSelectedDataField, columnToSelect;

        if (!this.jqref) {
            return;
        }

        if (!this.isInEditMode) {
            return;
        }

        if (column >= 0 && column < this.columns.length) {
            columnToSelect = column;
            newSelectedDataField = column.toString();
        } else {
            columnToSelect = -1;
        }

        if (columnToSelect !== this.selectedColumn) {
            this.selectedColumn = columnToSelect;
        }

        if (this.selectedColumnDataField !== newSelectedDataField) {
            if (this.selectedColumnDataField !== undefined) {
                $(this.jqref.jqxGrid('getcolumn', this.selectedColumnDataField).element).removeClass('ni-selected-header');
            }

            this.selectedColumnDataField = newSelectedDataField;
            this.refreshSelectedColumn();

            this.dispatchEvent(new CustomEvent('selected-column-changed', {
                detail: { selectedColumn: this.selectedColumn }
            }));
        }
    };

    proto.refreshSelectedColumn = function () {
        var i, jqxColumn, leftIndex;
        if (this.isInEditMode) {
            if (this.selectedColumn === -1) {
                for (i = 0; i < this.jqxColumnConfig.length; i++) {
                    jqxColumn = this.jqref.jqxGrid('getcolumn', this.jqxColumnConfig[i].datafield);
                    if (jqxColumn !== null && jqxColumn !== undefined) {
                        jqxColumn.cellclassname = '';
                    }
                }
            } else {
                leftIndex = this.sortedColumnIndices[this.sortedColumnIndices.indexOf(this.selectedColumn + 1) - 1];
                for (i = 0; i < this.jqxColumnConfig.length; i++) {
                    jqxColumn = this.jqref.jqxGrid('getcolumn', this.jqxColumnConfig[i].datafield);
                    if (jqxColumn !== null && jqxColumn !== undefined) {
                        if (i === leftIndex) {
                            jqxColumn.cellclassname = 'ni-selected-cell';
                        } else if (i === this.selectedColumn + 1) {
                            jqxColumn.cellclassname = 'ni-selected-cell';
                            $(jqxColumn.element).addClass('ni-selected-header');
                        } else {
                            jqxColumn.cellclassname = '';
                        }
                    }
                }
            }
            // Trigger a 'soft refresh' so the jqxGrid will re-query the cell CSS classes, but not recreate widgets
            $(this.jqref).jqxGrid('clearselection');
        }
    };

    proto.updateCoercedRowHeight = function () {
        this.coercedRowHeight = this.rowHeight >= 1 ? this.rowHeight : DEFAULT_ROW_HEIGHT;
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            childElement,
            childColumns,
            jqref,
            that = this;

        if (firstCall === true) {
            childColumns = this.findInitialColumns();
            this.addColumnListeners(childColumns);

            this.updateCoercedRowHeight();

            widgetSettings = this.getSettings();

            childElement = document.createElement('div');
            childElement.style.width = '100%';
            childElement.style.height = '100%';
            // Currently, we don't want changing the data grid headers to affect the row / column header font, or the
            // statusbar / toolbar fonts, so we're setting the font we want explicitly here
            childElement.style.fontSize = '12px';
            childElement.style.fontFamily = 'Segoe UI, sans-serif';
            childElement.style.fontWeight = 'normal';
            childElement.style.fontStyle = 'normal';
            this.appendChild(childElement);

            jqref = $(childElement);
            jqref.jqxGrid(widgetSettings);
            this.jqref = jqref;
            appendAddRowsToolbar(this);
            this.updateStatusBar();
            this.updatePagingSettings();

            if (childColumns.length === 0) {
                this.initializeColumnsAndData();
            }

            // Adding CSS class names
            jqref.find(' .jqx-grid-statusbar').addClass('ni-status-bar');
            jqref.addClass('ni-grid-widget');
            jqref.addClass('ni-grid-widget-content');
            jqref.find(' .jqx-widget').addClass('ni-grid-widget');
            jqref.find(' .jqx-widget-content').addClass('ni-grid-widget-content');
            jqref.find(' .jqx-grid-groups-header').addClass('ni-groups-header');
            jqref.find(' .jqx-grid-pager').addClass('ni-pager-box');
            jqref.find(' .jqx-grid-pager-input').addClass('ni-pager-text-field');
            jqref.find(' .jqx-dropdownlist-state-normal').addClass('ni-selector');
            jqref.find(' .jqx-max-size').addClass('ni-filter-row-box');
            jqref.find(' .jqx-grid-column-header').addClass('ni-column-header');
            jqref.find(' .jqx-grid-content').addClass('ni-grid-content');
            jqref.find(' .jqx-grid-cell-filter-row').addClass('ni-filter-row');
            jqref.find(' .jqx-grid-cell').addClass('ni-cell');
            jqref.find(' .jqx-grid-group-cell').addClass('ni-group-cell');

            jqref.on('cellendedit', function (event) {
                var rowindex = event.args.rowindex, datafield = event.args.datafield, value = event.args.value;
                that.jqxValue[rowindex][datafield] = value;
                that.parsedValue[rowindex][that.columns[datafield].fieldName] = value;
                that.value = JSON.stringify(that.parsedValue);
            });

            jqref.on('columnclick', function (event) {
                var origMouseEvent = event.args.originalEvent.originalEvent;
                that.setSelectedColumn(parseInt(event.args.datafield));

                if (origMouseEvent !== undefined && origMouseEvent.x !== undefined && origMouseEvent.y !== undefined) {
                    that.handledClickEvent = { x: origMouseEvent.x, y: origMouseEvent.y };
                }
            });

            jqref.on('cellclick', function (event) {
                var origMouseEvent = event.args.originalEvent.originalEvent;
                that.setSelectedColumn(parseInt(event.args.datafield));

                if (origMouseEvent !== undefined && origMouseEvent.x !== undefined && origMouseEvent.y !== undefined) {
                    that.handledClickEvent = { x: origMouseEvent.x, y: origMouseEvent.y };
                }
            });

            jqref.on('click', function (event) {
                // If a click is on the data grid but not on its cells or columns (which are handled above), deselect
                // the currently active column
                var origMouseEvent = event.originalEvent;
                if (origMouseEvent !== undefined && that.handledClickEvent !== undefined &&
                    origMouseEvent.x === that.handledClickEvent.x && origMouseEvent.y === that.handledClickEvent.y) {
                    return;
                }

                that.setSelectedColumn(-1);
                that.handledClickEvent = undefined;
            });

            jqref.on('columnresized', function (event) {
                var args = event.args;
                var dataField = args.datafield;
                var newWidth = args.newwidth;
                var newHeight = that.coercedRowHeight;
                var column = that.columns[dataField];
                var templateControl = column.firstElementChild;
                var columnHelper = columnTypeHelpers[templateControl.nodeName];
                var matchedControls, i, control;

                if (typeof columnHelper.resize !== 'function') {
                    return;
                }

                matchedControls = jqref[0].querySelectorAll(templateControl.tagName);

                for (i = 0; i < matchedControls.length; i++) {
                    control = matchedControls[i];
                    if (control._dataGridColumn === dataField) {
                        columnHelper.resize(control, { width: newWidth, height: newHeight });
                    }
                }
            });
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        var jqref = this.jqref;

        if (jqref === undefined) {
            jqref = $(this).children('div');
        }

        jqref.jqxGrid(size);
        this.updatePageSize();
    };

    proto.updateDataGridConfig = function (refresh) {
        if (this.jqref === undefined || this.parentElement === null) {
            return;
        }

        this.updateJqxColumnConfig();

        // Cancel any pending edits before refreshing columns
        this.jqref.jqxGrid('endcelledit');

        this.jqref.jqxGrid({ columns: this.jqxColumnConfig });

        if (refresh) {
            this.jqref.jqxGrid('refresh');
        }

        this.refreshSelectedColumn();
    };

    proto.refreshDataSource = function () {
        this.dataSource.localdata = this.jqxValue;
        this.jqref.jqxGrid({ source: this.dataAdapter });
    };

    proto.updateData = function () {
        var oldDataLength;

        if (this.jqref === undefined) {
            return;
        }

        oldDataLength = this.parsedValue.length;
        this.parsedValue = JSON.parse(this.value);
        this.updateJqxValueFromParsedValue();

        if (this.showAggregates && (oldDataLength === 0) !== (this.parsedValue.length === 0)) {
            // If we have any data and didn't before (or the opposite),
            // show or hide the aggregates bar as needed.
            this.updateStatusBar();
        }

        // The jqxGrid updaterow function is noticeably faster than
        // refreshing the data grid via refreshing the data source, so
        // we do that when we can (when the number of rows is the same).
        if (oldDataLength === this.parsedValue.length) {
            var rows = [];
            var i;
            for (i = 0; i < oldDataLength; i++) {
                rows[i] = i;
            }

            this.jqref.jqxGrid('updaterow', rows, this.jqxValue);
        } else {
            this.refreshDataSource();
        }
    };

    proto.findInitialColumns = function () {
        var childColumns = [],
            columnItemName = NationalInstruments.HtmlVI.Elements.DataGridColumn.prototype.elementInfo.tagName.toUpperCase(),
            i;

        for (i = 0; i < this.children.length; i++) {
            if (this.children[i].tagName === columnItemName) {
                childColumns.push(this.children[i]);
            }
        }

        return childColumns;
    };

    proto.sortColumns = function () {
        this.columns.sort(function (a, b) {
            return a.index - b.index;
        });
    };

    proto.addColumnListeners = function (initialColumns) {
        var that = this;

        that.addEventListener('ni-data-grid-column-attached', function (evt) {
            var i, column, observer, observerConfig;

            if (evt.target === that) {
                column = evt.detail.element;
                that.columns.push(column);
                that.sortColumns();

                observer = new window.MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        if (mutation.removedNodes.length > 0) {
                            removeTemplateControlMutationObserver(that, column);
                        }

                        if (mutation.addedNodes.length > 0) {
                            addTemplateControlMutationObserver(that, column);
                            that.updateDataGridConfig(true);
                        }
                    });
                });

                observerConfig = { childList: true };
                column._niColumnObserver = observer;
                if (typeof observer.observe === 'function') {
                    observer.observe(column, observerConfig);
                }

                addTemplateControlMutationObserver(that, column);

                for (i = 0; i < initialColumns.length; i++) {
                    if (initialColumns[i] === evt.detail.element) {
                        initialColumns.splice(i, 1);
                        break;
                    }
                }

                if (initialColumns.length === 0) { // We've either just added the last initial column, or this is attaching a new column after that (at edit-time)
                    if (this.dataSource === undefined) {
                        this.initializeColumnsAndData(); // First time initialization
                    } else {
                        that.updateDataGridConfig(false);
                    }
                }
            }
        });

        that.addEventListener('ni-data-grid-column-detached', function (evt) {
            var i, column;
            if (evt.target === that) {
                column = evt.detail.element;
                for (i = 0; i < that.columns.length; i++) {
                    if (that.columns[i] === column) {
                        that.columns.splice(i, 1);

                        if (typeof column._niColumnObserver.disconnect === 'function') {
                            column._niColumnObserver.disconnect();
                        }

                        removeTemplateControlMutationObserver(that, column);
                        break;
                    }
                }

                that.updateDataGridConfig(false);
            }
        });

        that.addEventListener('ni-data-grid-column-changed', function (evt) {
            var propName = evt.detail.propertyName;
            if (propName === 'index') {
                that.sortColumns();
            }

            that.updateDataGridConfig(false);

            if (propName === 'aggregates') {
                that.updateStatusBar();
                that.updatePageSize();
            } else if (propName === 'index' || propName === 'fieldName') {
                that.updateJqxValueFromParsedValue();
                that.refreshDataSource();
            }
        });
    };

    proto.updateStatusBar = function () {
        var that = this;
        var showAddRowsToolBar = (!that.readOnly && that.showAddRowsToolBar);
        var statusBarHeight;
        if (that.addRowsToolbarRef !== undefined) {
            that.addRowsToolbarRef.toggle(showAddRowsToolBar);
        }

        if (that.jqref !== undefined) {
            statusBarHeight = showAddRowsToolBar ? 40 : 0;
            if (this.parsedValue.length > 0 && that.maxAggregateCountPerColumn > 0) {
                statusBarHeight += that.maxAggregateCountPerColumn * DEFAULT_ROW_HEIGHT + 4;
            }

            // Note: We need to set the statusbarheight before updating the aggregate properties, since
            // it has to already be set before the aggregates render.
            that.jqref.jqxGrid({
                statusbarheight: statusBarHeight
            });
            that.jqref.jqxGrid({
                showstatusbar: showAddRowsToolBar || that.showAggregates,
                showaggregates: that.showAggregates
            });
            if (that.showAggregates) {
                that.jqref.jqxGrid('refreshaggregates');
            }
        }
    };

    proto.updatePageSize = function () {
        var that = this;

        if (this.updatePageSizeTimer !== undefined) {
            clearTimeout(this.updatePageSizeTimer);
        }

        this.updatePageSizeTimer = setTimeout(function () {
            that.updatePageSizeTimer = undefined;
            if (that.allowPaging) {
                var numRows;
                var height = that.jqref.height();
                height -= getElementHeight(that.jqref.find('div.jqx-grid-header'));
                height -= getElementHeight(that.jqref.find('div.jqx-grid-groups-header'));
                height -= getElementHeight(that.jqref.find('div.jqx-grid-pager'));
                height -= getElementHeight(that.jqref.find('div.ni-status-bar'));
                var horizScrollBar = that.jqref.find('div.jqx-scrollbar').sort(function (a, b) {
                    return a.offsetLeft - b.offsetLeft;
                });

                height -= getElementHeight(horizScrollBar);
                numRows = Math.floor(height / that.coercedRowHeight);

                // Sanity check the number of rows. If the data grid is very small, we can end up computing a negative size since we
                // subtract the size of toolbars (assuming they're always visible and nonoverlapping).
                if (numRows <= 0) {
                    numRows = 10;
                }

                if (that.pageSize !== numRows) {
                    that.pageSize = numRows;
                    that.jqref.jqxGrid({ pagesize: numRows, pagesizeoptions: [numRows] });
                }
            }
        }, 10);
    };

    proto.updatePagingSettings = function () {
        var pagerRef;

        this.jqref.jqxGrid({ pageable: this.allowPaging });
        pagerRef = this.jqref.find('div.jqx-grid-pager');

        // Workaround for a jqxGrid issue where the top border of the pager toolbar / a 1px line is still
        // visible when you turn paging on then off
        pagerRef.toggle(this.allowPaging);

        if (this.allowPaging === true) {
            this.addRowsToolbarRef[0].style.bottom = pagerRef.outerHeight() + 'px';
        } else {
            this.addRowsToolbarRef[0].style.bottom = '0px';
        }

        this.updatePageSize();
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        if (this.jqref === undefined) {
            return;
        }

        switch (propertyName) {
            case 'rowHeaderVisible':
                this.jqref.jqxGrid('setcolumnproperty', ID_DATAFIELD, 'hidden', !this.rowHeaderVisible);
                break;
            case 'columnHeaderVisible':
                this.jqref.jqxGrid({ showheader: this.columnHeaderVisible });
                this.updatePageSize();
                break;
            case 'isInEditMode':
                this.jqref.jqxGrid({ columnsresize: !this.isInEditMode });
                this.jqref.jqxGrid('render');
                break;
            case 'value':
                this.updateData();
                break;
            case 'showAddRowsToolBar':
                this.updateStatusBar();
                this.updatePageSize();
                break;
            case 'allowSorting':
                this.jqref.jqxGrid({ sortable: this.allowSorting });
                break;
            case 'allowPaging':
                this.updatePagingSettings();
                break;
            case 'allowFiltering':
                this.jqref.jqxGrid({ filterable: this.allowFiltering, showfilterrow: this.allowFiltering });
                this.updatePageSize();
                break;
            case 'allowGrouping':
                this.jqref.jqxGrid({ groupable: this.allowGrouping });
                this.updatePageSize();
                break;
            case 'rowHeight':
                this.updateCoercedRowHeight();
                this.jqref.jqxGrid({ rowsheight: this.coercedRowHeight });
                this.jqref.jqxGrid('render');
                break;
            case 'altRowColors':
                this.jqref.jqxGrid({ altrows: this.altRowColors });
                break;
            case 'altRowStart':
                this.jqref.jqxGrid(getAltRowSettings(this.altRowStart, this.altRowStep));
                break;
            case 'altRowStep':
                this.jqref.jqxGrid(getAltRowSettings(this.altRowStart, this.altRowStep));
                break;
            case 'readOnly':
                this.jqref.jqxGrid({ editable: !this.readOnly });
                this.updateStatusBar();
                this.updatePageSize();
                break;
            case 'selectedColumn':
                this.setSelectedColumn(this.selectedColumn);
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-data-grid', 'HTMLNIDataGrid');
}(NationalInstruments.HtmlVI.Elements.DataGrid, NationalInstruments.HtmlVI.Elements.Visual));
