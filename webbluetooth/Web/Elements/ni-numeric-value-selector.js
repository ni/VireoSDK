/*global NationalInstruments*/
//****************************************
// Numeric Value Selector Prototype
// DOM Registration: No
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.NumericValueSelector = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var NUM_VAL_CONVERTER = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

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
            propertyName: 'value',
            defaultValue: { stringValue: '0', numberValue: 0 },
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'valueType',
            defaultValue: NationalInstruments.HtmlVI.NINumerics.ValueTypes.UINT32
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'items',
            defaultValue: '[]'
        });
    };

    proto.compareIndexValue = function (value1, value2) {
        if (typeof value1 === typeof value2) {
            return value1 === value2;
        } else {
            // todo
            return parseFloat(value1) === parseFloat(value2);
        }
    };

    proto.itemsCache = function () {
        var that = this;
        if (!that.itemsArray) {
            that.itemsArray = JSON.parse(that.items);
        }

        function updateItemsArray() {
            that.itemsArray = JSON.parse(that.items);
        }

        function pushItem(newItem) {
            that.itemsArray.push(newItem);
            that.items = JSON.stringify(that.itemsArray);
        }

        return {
            itemsArray: that.itemsArray,
            cacheDirty: updateItemsArray,
            writeThrough: pushItem
        };
    };

    // create the source array from the items which contain both ringvalue and ringindex. we may need to insert new dropdown item when necessary
    // and then calculate the selectedIndex based on the ringIndex which coud be very different from the index of the dropdown item.
    // the format of the ring source is [{value:3, displayvalue:'first'}, {value:7, displayvalue:'second'},..]
    proto.getSourceAndSelectedIndexFromSource = function (allowCreateNewSelectedItem) {

        var result = {};
        var source = [];
        var selectedIndex = -1;
        var numericIndex = NUM_VAL_CONVERTER.convertBack(this.value, this.valueType);
        var itemsArray = this.itemsCache().itemsArray;
        for (var i = 0; i < itemsArray.length; i++) {
            var item = itemsArray[i];
            source.push(item.displayValue);
            if (this.compareIndexValue(item.value, numericIndex)) {
                selectedIndex = i;
            }
        }

        if (allowCreateNewSelectedItem) {
            if (selectedIndex < 0) {
                source.push('<' + numericIndex + '>');
                selectedIndex = source.length - 1;
            }
        }

        result.source = source;
        result.selectedIndex = selectedIndex;
        return result;
    };

    // handler to update the property when the dropdown selection changed
    proto.selectChangedHandler = function (selectValue) {
        var itemsArray = this.itemsCache().itemsArray;
        var numericIndex;
        for (var i = 0; i < itemsArray.length; i++) {
            var item = itemsArray[i];
            if (item.displayValue === selectValue) {
                numericIndex = item.value;
                this.value = NUM_VAL_CONVERTER.convert(numericIndex, this.valueType, true);
                break;
            }
        }

        return numericIndex;
    };

    proto.propertyUpdatedHelper = function (propertyName, jqref) {
        switch (propertyName) {
            case 'items':
                this.itemsCache().cacheDirty();
                var data = this.getSourceAndSelectedIndexFromSource(false);
                var selectedIndex = data.selectedIndex;
                var source = data.source;
                jqref.jqxDropDownList({ source: source, selectedIndex: selectedIndex });
                break;
            case 'value':
                data = this.getSourceAndSelectedIndexFromSource(true);
                source = data.source;
                selectedIndex = data.selectedIndex;
                if (source.length === jqref.jqxDropDownList('source').length) {
                    jqref.jqxDropDownList({ selectedIndex: selectedIndex });
                } else {
                    var newItem = { value: NUM_VAL_CONVERTER.convertBack(this.value, this.valueType), displayValue: source[source.length - 1] };
                    this.itemsCache().writeThrough(newItem);
                    jqref.jqxDropDownList({ source: source, selectedIndex: selectedIndex });
                }

                break;
            case 'readOnly':
                jqref.jqxDropDownList({ disabled: this.readOnly });
                break;
            default:
                break;
        }
    };

}(NationalInstruments.HtmlVI.Elements.NumericValueSelector, NationalInstruments.HtmlVI.Elements.Visual));
