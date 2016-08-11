//****************************************
// Cursor Legend Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.CursorLegend = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'graphName',
            defaultValue: '',
            fireEvent: false,
            addNonSignalingProperty: false
        });
        proto.addProperty(targetPrototype, {
            propertyName: 'isInEditMode',
            defaultValue: false,
            fireEvent: false,
            addNonSignalingProperty: false
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        this.table = undefined;
        this.nCursors = 0;
        this.selectedIndex = -1;
        this.selectedRow = null;
        this.addButton = null;
        this.deleteButton = null;
        this.centerButton = null;
        this.currentRow = null;
        this.currentBtn = null;
        this.observer = null;
        this.helpers = new NationalInstruments.HtmlVI.Elements.CursorLegendHelpers();
        this.cursorLegendItemDisplay = new NationalInstruments.HtmlVI.Elements.CursorLegendItemDisplay(this.helpers);
        this.uihelpers = new NationalInstruments.HtmlVI.Elements.LegendHelpers(this.helpers, this.cursorLegendItemDisplay);

        // Private Instance Properties
        // None
    };

    proto.cursorAdded = function (cursor) {
        var that = this;
        var n = that.nCursors;
        var tr;
        that.createRow(that.table, that.nCursors);
        that.helpers.cursorAdded(cursor);
        that.helpers.cursorPositionChanged(that.nCursors, function (x, y) {
            that.updatePosition(n, x, y);
        });
        if (that.selectedIndex >= 0) {
            tr = that.table.childNodes[that.selectedIndex * 2];
            $(tr).removeClass('ni-selected-row');
        }

        tr = that.table.childNodes[n * 2];
        that.selectedIndex = n;
        that.selectedRow = tr;
        $(tr).addClass('ni-selected-row');
        that.nCursors++;
    };

    proto.updatePosition = function (index, x, y) {
        var xEl = document.getElementById('x_' + index);
        var yEl = document.getElementById('y_' + index);
        if (xEl !== null && x !== undefined) {
            xEl.innerText = x.toPrecision(4);
        }

        if (yEl !== null && y !== undefined) {
            yEl.innerText = y.toPrecision(4);
        }
    };

    // cursor can be removed at runtime or edit time from legend, or at edit time from right rail
    proto.cursorRemoved = function (cursor) {
        var index;
        index = this.helpers.cursorToIndex(cursor);
        if (index >= 0) {
            $('.ni-master-row').eq(index).remove();
            $('.ni-details-box').eq(index).remove();
            this.cursorLegendItemDisplay.clearShape(index);
            this.nCursors--;
            this.helpers.cursorRemoved(cursor);

            if (index === this.selectedIndex) {
                this.selectedIndex = -1;
            }
        }
    };

    proto.cursorChanged = function (cursor) {
        var index = this.helpers.cursorToIndex(cursor);
        this.cursorLegendItemDisplay.updateShape(index);
        this.updateName(index);
        this.updateVisible(index);
    };

    proto.updateName = function (index) {
        $('#name_' + index).text(this.helpers.getState('name', index));
    };

    proto.updateVisible = function (index) {
        var visible = this.helpers.getState('visible', index);
        if (visible) {
            $('#visible_' + index).removeClass('ni-visibility-off-icon').addClass('ni-visibility-on-icon');
        } else {
            $('#visible_' + index).removeClass('ni-visibility-on-icon').addClass('ni-visibility-off-icon');
        }
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            that = this;

        if (firstCall === true) {
            that.helpers.graphName = that.graphName;
            that.helpers.isInEditMode = that.isInEditMode;
            var div = document.createElement('div');
            div.style.width = '100%';
            div.style.height = '100%';
            div.id = 'div' + NI_SUPPORT.uniqueId();
            that.appendChild(div);
            that.table = document.createElement('table');
            that.table.className = 'ni-cursors-box';
            div.appendChild(that.table);

            var buttonsRow = document.createElement('div');
            div.appendChild(buttonsRow);

            var center = document.createElement('button');
            center.className = 'ni-center-button ni-command-button';
            $(center).jqxButton();
            $(center).on('click', function () {
                that.helpers.centerCursor(that.selectedIndex);
            });
            buttonsRow.appendChild(center);
            that.centerButton = center;

            var add = document.createElement('button');
            add.className = 'ni-add-button ni-command-button';
            $(add).jqxButton();
            $(add).on('click', function () {
                that.helpers.addCursor();
            });
            buttonsRow.appendChild(add);
            that.addButton = add;

            var del = document.createElement('button');
            del.className = 'ni-delete-button ni-command-button';
            $(del).jqxButton();
            $(del).on('click', function () {
                that.helpers.deleteCursor(that.selectedIndex);
                that.selectedIndex = -1;
            });
            buttonsRow.appendChild(del);
            that.deleteButton = del;

            that.addEventListener('ni-cursor-attached', function (evt) {
                that.cursorAdded(evt.detail.originalSource);
            });
            that.addEventListener('ni-cursor-detached', function (evt) {
                that.cursorRemoved(evt.detail.originalSource);
            });
            that.addEventListener('ni-cursor-changed', function (evt) {
                that.cursorChanged(evt.detail.originalSource);
            });
            var graph = document.querySelector('[ni-control-id=\'' + that.graphName + '\']');
            if (graph !== null) {
                graph.registerCursorLegend(that);
            }
        }

        return firstCall;
    };

    proto.imageRenderer = function (row) {
        return this.cursorLegendItemDisplay.createHeaderDisplay(row);
    };

    proto.createRow = function (table, index) {
        var that = this;
        var btn = that.createMainRow(table, index);
        var row = that.createDetailsRow(table, index);
        $(btn).on('click', function () {
            if (that.currentRow !== row) {
                var currentRow = that.currentRow;
                var currentBtn = that.currentBtn;
                row.style.display = 'table-row';
                that.currentRow = row;
                btn.classList.remove('ni-closed-icon');
                btn.classList.add('ni-open-icon');
                that.currentBtn = btn;
                if (currentRow !== null) {
                    currentRow.style.display = 'none';
                }

                if (currentBtn !== null) {
                    currentBtn.classList.remove('ni-open-icon');
                    currentBtn.classList.add('ni-closed-icon');
                }
            } else {
                row.style.display = 'none';
                btn.classList.remove('ni-open-icon');
                btn.classList.add('ni-closed-icon');
                that.currentRow = null;
                that.currentBtn = null;
            }
        });
        that.applyFont();
    };

    proto.getRowIndex = function (table, tr) {
        var i;
        for (i = 0; i < table.childNodes.length; i++) {
            if (table.childNodes[i] === tr) {
                return i / 2;
            }
        }

        return -1;
    };

    proto.createMainRow = function (table, index) {
        var that = this;
        var rowIndex;
        var tr, td0, td1, td2, td3, td4, span, p, display, button, showHideButton, visible;
        tr = document.createElement('tr');
        tr.className = 'ni-master-row';
        table.appendChild(tr);
        $(tr).on('click', function () {
            if (that.selectedRow !== tr) {
                if (that.selectedRow !== null) {
                    $(that.selectedRow).removeClass('ni-selected-row');
                }

                that.selectedIndex = that.getRowIndex(table, tr);
                that.selectedRow = tr;
                $(tr).addClass('ni-selected-row');
            } else { // deselect the selected row
                that.selectedIndex = -1;
                $(that.selectedRow).removeClass('ni-selected-row');
            }
        });

        td0 = document.createElement('td');
        td0.className = 'ni-expand-box';
        tr.appendChild(td0);
        showHideButton = document.createElement('input');
        showHideButton.className = 'ni-expand-button ni-closed-icon';
        showHideButton.type = 'button';
        showHideButton.id = 'details_' + index;
        td0.appendChild(showHideButton);
        $(showHideButton).jqxButton({ width : 20, height: 20, disabled: that.isInEditMode });

        td1 = document.createElement('td');
        td1.className = 'ni-cursor-box';
        tr.appendChild(td1);
        display = that.cursorLegendItemDisplay.createHeaderDisplay(index);
        if (display !== null) {
            display.id = 'display_' + index;
            td1.appendChild(display);
        }

        span = document.createElement('span');
        span.className = 'ni-cursor-title';
        span.id = 'name_' + index;
        p = document.createTextNode(that.helpers.getState('name', index));
        span.appendChild(p);
        td1.appendChild(span);

        td2 = document.createElement('td');
        td2.className = 'ni-x-box';
        tr.appendChild(td2);
        span = document.createElement('span');
        span.className = 'ni-x-title';
        span.id = 'x_' + index;
        p = document.createTextNode(parseFloat(that.helpers.getState('x', index)));
        span.appendChild(p);
        td2.appendChild(span);

        td3 = document.createElement('td');
        td3.className = 'ni-y-box';
        tr.appendChild(td3);
        span = document.createElement('span');
        span.className = 'ni-y-title';
        span.id = 'y_' + index;
        p = document.createTextNode(parseFloat(that.helpers.getState('y', index)));
        span.appendChild(p);
        td3.appendChild(span);

        td4 = document.createElement('td');
        td4.className = 'ni-actions-box';
        tr.appendChild(td4);
        button = document.createElement('input');
        button.className = 'ni-visibility-button ni-action-button';
        button.type = 'button';
        button.id = 'visible_' + index;
        visible = that.helpers.getState('visible', index);
        if (visible) {
            button.classList.add('ni-visibility-on-icon');
        } else {
            button.classList.add('ni-visibility-off-icon');
        }

        $(button).on('click', function () {
            rowIndex = that.getRowIndex(table, tr);
            that.helpers.handleClick('visible', '', rowIndex);
        });

        td4.appendChild(button);
        $(button).jqxToggleButton({ disabled: that.isInEditMode });

        button = document.createElement('input');
        button.className = 'ni-snap-button ni-action-button';
        button.type = 'button';
        button.id = 'snap_' + index;
        td4.appendChild(button);
        $(button).on('click', function () {
            rowIndex = that.getRowIndex(table, tr);
            that.helpers.handleClick('snap', '', rowIndex);
        });
        $(button).jqxToggleButton({ disabled: that.isInEditMode });

        return showHideButton;
    };

    proto.createDetailsItem = function (table, title, className) {
        var tr, td1, td2, div, span, p;
        tr = document.createElement('tr');
        tr.className = 'ni-details-row';
        table.appendChild(tr);

        td1 = document.createElement('td');
        td1.className = 'ni-details-row-title-box';
        tr.appendChild(td1);
        span = document.createElement('span');
        span.class = 'ni-details-row-title';
        td1.appendChild(span);
        p = document.createTextNode(title);
        span.appendChild(p);

        td2 = document.createElement('td');
        td2.className = 'ni-details-row-control-box';
        tr.appendChild(td2);
        div = document.createElement('div');
        div.className = className;
        td2.appendChild(div);
        return div;
    };

    proto.createDetailsRow = function (table, index) {
        var subtable, tr, td, div;

        tr = document.createElement('tr');
        tr.className = 'ni-details-box';
        tr.style.display = 'none';
        table.appendChild(tr);

        td = document.createElement('td');
        td.colSpan = 5;
        tr.appendChild(td);

        subtable = document.createElement('table');
        subtable.className = 'ni-details';
        td.appendChild(subtable);

        div = this.createDetailsItem(subtable, 'Color', 'ni-colorbox-selector ni-selector');
        this.uihelpers.addColorBox({ name: 'Color' }, div, index);

        div = this.createDetailsItem(subtable, 'Shape', 'ni-shape-selector ni-selector');
        this.uihelpers.addComboBox(this.helpers.getMenuItem('shape'), div, index, 16);

        div = this.createDetailsItem(subtable, 'Crosshair', 'ni-crosshair-selector ni-selector');
        this.uihelpers.addComboBox(this.helpers.getMenuItem('crosshair'), div, index, 16);

        return tr;
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqrefContent = $('#' + childElement.id + ' .jqx-widget-content'),
            jqrefItemName = $('#' + childElement.id + ' .ni-cursor-title'),
            jqrefItemX = $('#' + childElement.id + ' .ni-x-title'),
            jqrefItemY = $('#' + childElement.id + ' .ni-y-title'),
            jqrefItemDetails = $('#' + childElement.id + ' .ni-details-title');

        jqrefContent.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemName.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemX.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemY.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemDetails.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.applyFont = function () {
        var childElement = this.firstElementChild,
            jqrefContent = $('#' + childElement.id + ' .jqx-widget-content'),
            jqrefItemName = $('#' + childElement.id + ' .ni-cursor-title'),
            jqrefItemX = $('#' + childElement.id + ' .ni-x-title'),
            jqrefItemY = $('#' + childElement.id + ' .ni-y-title'),
            jqrefItemDetails = $('#' + childElement.id + ' .ni-details-title');

        var fontSize = $(this).css('font-size');
        var fontFamily = $(this).css('font-family');
        var fontWeight = $(this).css('font-weight');
        var fontStyle = $(this).css('font-style');
        jqrefContent.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemName.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemX.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemY.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
        jqrefItemDetails.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        switch (propertyName) {
            case 'graphName':
                // should never change
                this.helpers.graphName = this.graphName;
                break;
            case 'isInEditMode':
                // this changes once after the element is created
                this.helpers.isInEditMode = this.isInEditMode;
                if (this.addButton !== null) {
                    this.addButton.disabled = this.isInEditMode;
                }

                if (this.deleteButton !== null) {
                    this.deleteButton.disabled = this.isInEditMode;
                }

                if (this.centerButton !== null) {
                    this.centerButton.disabled = this.isInEditMode;
                }

                $(this.table).find('.ni-expand-button').each(function () {
                    $(this).jqxButton({ disabled: this.isInEditMode });
                });

                $(this.table).find('.ni-visibility-button').each(function () {
                    $(this).jqxToggleButton({ disabled: this.isInEditMode });
                });

                $(this.table).find('.ni-snap-button').each(function () {
                    $(this).jqxToggleButton({ disabled: this.isInEditMode });
                });

                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-cursor-legend', 'HTMLNICursorLegend');
}(NationalInstruments.HtmlVI.Elements.CursorLegend, NationalInstruments.HtmlVI.Elements.Visual));
