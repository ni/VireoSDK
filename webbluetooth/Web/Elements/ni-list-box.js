//****************************************
// ListBox
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.ListBox = function () {
    'use strict';
};

// Static Public Variables
NationalInstruments.HtmlVI.Elements.ListBox.SelectionModeEnum = Object.freeze({
    ZERO_OR_ONE: 'ZeroOrOne',
    ONE: 'One',
    ZERO_OR_MORE: 'ZeroOrMore',
    ONE_OR_MORE: 'OneOrMore'
});

// Static Public Functions
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var SELECTION_MODE_ENUM = NationalInstruments.HtmlVI.Elements.ListBox.SelectionModeEnum;
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    var getJqxListBoxSelectedIndices = function (jqref) {
        var items = jqref.jqxListBox('getSelectedItems');
        if (items.length === 0 || (items.length === 1 && items[0] === undefined)) {
            return [];
        }

        return items.map(function (obj) {
            return obj.index;
        });
    };

    var setJqxListBoxSelectedIndices = function (jqref, indices) {
        var i;
        jqref.jqxListBox('clearSelection');
        for (i = 0; i < indices.length; i++) {
            jqref.jqxListBox('selectIndex', indices[i]);
        }
    };

    var selectedIndicesMatch = function (jqref, elementSelectedIndices) {
        var i, jqxIndices = getJqxListBoxSelectedIndices(jqref).sort(), parsedIndices = JSON.parse(elementSelectedIndices).sort();
        if (jqxIndices.length !== parsedIndices.length) {
            return false;
        }

        for (i = 0; i < jqxIndices.length; i++) {
            if (jqxIndices[i] !== parsedIndices[i]) {
                return false;
            }
        }

        return true;
    };

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'selectedIndex',
            defaultValue: '[]',
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'selectionMode',
            defaultValue: SELECTION_MODE_ENUM.ONE
        });
    };

    proto.updateSelectionMode = function (jqref) {
        var settings = {
            multiple: this.selectionMode !== SELECTION_MODE_ENUM.ONE
        };

        jqref.jqxListBox(settings);
    };

    proto.coerceSelection = function (jqref) {
        var selectedIndex = JSON.parse(this.selectedIndex);
        var items = getJqxListBoxSelectedIndices(jqref);
        var newSelection = items.filter(function (a) {
            return selectedIndex.indexOf(a) === -1;
        });
        var revertSelection = (items.length > 1 && (this.selectionMode === SELECTION_MODE_ENUM.ONE || this.selectionMode === SELECTION_MODE_ENUM.ZERO_OR_ONE)) ||
                              (items.length === 0 && (this.selectionMode === SELECTION_MODE_ENUM.ONE || this.selectionMode === SELECTION_MODE_ENUM.ONE_OR_MORE));
        var firstSelectedIndex, coercedSelectedIndices, src, firstValidIndexArray;
        if (revertSelection) {
            src = JSON.parse(this.source);
            firstValidIndexArray = Array.isArray(src) && src.length > 0 ? [0] : [];
            if (newSelection.length > 0) {
                firstSelectedIndex = [newSelection[0]];
            } else {
                firstSelectedIndex = selectedIndex.length > 0 ? [selectedIndex[0]] : [];
            }

            switch (this.selectionMode) {
                case SELECTION_MODE_ENUM.ZERO_OR_ONE:
                    coercedSelectedIndices = firstSelectedIndex;
                    break;
                case SELECTION_MODE_ENUM.ONE:
                    coercedSelectedIndices = firstSelectedIndex.length === 1 ? firstSelectedIndex : firstValidIndexArray;
                    break;
                case SELECTION_MODE_ENUM.ONE_OR_MORE:
                    coercedSelectedIndices = selectedIndex.length > 0 ? selectedIndex : firstValidIndexArray;
                    break;
            }

            setJqxListBoxSelectedIndices(jqref, coercedSelectedIndices);
        } else {
            this.selectedIndex = JSON.stringify(items);
        }
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            childElement,
            jqref,
            that = this;

        if (firstCall === true) {
            widgetSettings = {};

            childElement = document.createElement('div');
            childElement.style.width = '100%';
            childElement.style.height = '100%';
            childElement.style.fontSize = $(this).css('font-size');
            childElement.style.fontFamily = $(this).css('font-family');
            childElement.style.fontWeight = $(this).css('font-weight');
            childElement.style.fontStyle = $(this).css('font-style');
            this.appendChild(childElement);

            jqref = $(childElement);
            widgetSettings.source = JSON.parse(this.source);
            jqref.jqxListBox(widgetSettings);
            setJqxListBoxSelectedIndices(jqref, this.selectedIndex);
            this.updateSelectionMode(jqref);
            jqref.on('change', function () {
                if (!selectedIndicesMatch(jqref, that.selectedIndex)) {
                    that.coerceSelection(jqref);
                }
            });
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        $(this.firstElementChild).jqxListBox(size);
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        jqref.css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        switch (propertyName) {
            case 'source':
                jqref.jqxListBox({ source: JSON.parse(this.source) });
                break;
            case 'selectedIndex':
                if (!selectedIndicesMatch(jqref, this.selectedIndex)) {
                    setJqxListBoxSelectedIndices(jqref, JSON.parse(this.selectedIndex));
                }

                break;
            case 'selectionMode':
                this.updateSelectionMode(jqref);
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-list-box', 'HTMLNIListBox');
}(NationalInstruments.HtmlVI.Elements.ListBox, NationalInstruments.HtmlVI.Elements.Selector));
