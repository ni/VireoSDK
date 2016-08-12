//**************************************
//Cluster Control Prototype
// DOM Registration: No
//National Instruments Copyright 2014
//**************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.Cluster = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var NI_VAL_CONVERTER = NationalInstruments.HtmlVI.ValueConverters.ElementValueConverter;

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
            defaultValue: '{}',
            fireEvent: true,
            addNonSignalingProperty: true,
            preventAttributeSync: true,
            isElementValueProperty: true
        });
    };

    proto.makeValueObj = function () {
        var i;
        var valueObj = {};
        for (i = 0; i < this.childNodes.length; i++) {
            if (this.childNodes[i] instanceof NationalInstruments.HtmlVI.Elements.VisualComponent === true && this.childNodes[i].tagName !== 'NI-LABEL' && this.childNodes[i].elementInfo.valuePropertyDescriptor !== undefined) {
                var propertyName = this.childNodes[i].elementInfo.valuePropertyDescriptor.propertyName;
                valueObj[this.childNodes[i].dataLabel] = this.getValue(this.childNodes[i], propertyName);
            }
        }

        return valueObj;
    };

    proto.childChanged = function (evt) {
        if (evt.srcElement === evt.target && this._childValueChanging === false) {
            var valueObj = this.makeValueObj();
            this._childValueChanging = true;
            this.value = JSON.stringify(valueObj);
            this._childValueChanging = false;
        }
    };

    proto.addPropertyToValue = function (name, value) {
        var valueObj = JSON.parse(this.value);
        valueObj[name] = value;
        this.valueNonSignaling = JSON.stringify(valueObj);
    };

    proto.removePropertyFromValue = function (name) {
        var valueObj = JSON.parse(this.value);
        delete valueObj[name];
        this.valueNonSignaling = JSON.stringify(valueObj);
    };

    proto.changePropertyNameInValue = function (oldName, newName) {
        var valueObj = JSON.parse(this.value);
        var temp = valueObj[oldName];
        delete valueObj[oldName];
        valueObj[newName] = temp;
        this.valueNonSignaling = JSON.stringify(valueObj);
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Private Instance Properties
        this._childValueChanging = false;
        this._mutationObserver = null;
        this._mutationLabelObserver = null;
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);
        var that = this, i;
        var callChildChanged = function (evt) {
            that.childChanged(evt);
        };

        if (firstCall) {
            this._mutationObserver = new window.MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    if (m.type === 'childList') {
                        if (m.target === that) {
                            if (m.addedNodes.length > 0) {
                                for (i = 0; i < m.addedNodes.length; i++) {
                                    if (m.addedNodes[i] instanceof NationalInstruments.HtmlVI.Elements.VisualComponent === true && m.addedNodes[i].tagName === 'NI-LABEL') {
                                        that.applyLabel(m.addedNodes[i]);
                                    }
                                }
                            } else if (m.removedNodes.length > 0) {
                                for (i = 0; i < m.removedNodes.length; i++) {
                                    var removed = m.removedNodes[i];
                                    if (removed instanceof NationalInstruments.HtmlVI.Elements.VisualComponent === true && removed.tagName !== 'NI-LABEL' && removed.elementInfo.valuePropertyDescriptor !== undefined) {
                                        var eventName = removed.elementInfo.valuePropertyDescriptor.eventName;
                                        removed.removeEventListener(eventName, callChildChanged);
                                        that.removePropertyFromValue(removed.dataLabel);
                                    } else if (removed instanceof NationalInstruments.HtmlVI.Elements.VisualComponent === true && removed.tagName === 'NI-LABEL') {
                                        if (removed.textMutationObserver !== null) {
                                            if (typeof removed.textMutationObserver.disconnect === 'function') {
                                                removed.textMutationObserver.disconnect();
                                            }

                                            removed.textMutationObserver = null;
                                        }
                                    }

                                }
                            }
                        }
                    }
                });
            });

            if (this._mutationObserver.observe !== undefined) {
                this._mutationObserver.observe(this, { childList: true, attributes: false, subtree: false });
            }

            for (i = 0; i < this.childNodes.length; i++) {
                var child = this.childNodes[i];
                if (child instanceof NationalInstruments.HtmlVI.Elements.VisualComponent === true && child.tagName === 'NI-LABEL') {
                    that.applyLabel(child);
                }
            }
        }

        return firstCall;
    };

    proto.detachedCallback = function () {
        var i;
        parent.prototype.detachedCallback.call(this);

        if (this._mutationObserver !== null) {
            if (typeof this._mutationObserver.disconnect === 'function') {
                this._mutationObserver.disconnect();
            }

            this._mutationObserver = null;
        }

        for (i = 0; i < this.childNodes.length; i++) {
            var child = this.childNodes[i];
            if (child instanceof NationalInstruments.HtmlVI.Elements.VisualComponent === true && child.tagName === 'NI-LABEL') {
                if (child.textMutationObserver !== null) {
                    if (typeof child.textMutationObserver.disconnect === 'function') {
                        child.textMutationObserver.disconnect();
                    }

                    child.textMutationObserver = null;
                }
            }
        }
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        switch (propertyName) {
            case 'value':
                if (this.value !== '{}' && this._childValueChanging === false) {
                    this.updateChildValues();
                }

                break;
            default:
                break;
        }
    };

    proto.updateChildValues = function () {
        var i = 0;
        var valueObj = JSON.parse(this.value);
        for (i = 0; i < this.childNodes.length; i++) {
            var child = this.childNodes[i];
            if (child instanceof NationalInstruments.HtmlVI.Elements.VisualComponent === true && child.tagName !== 'NI-LABEL' && child.elementInfo.valuePropertyDescriptor !== undefined) {
                var descriptor = child.elementInfo.valuePropertyDescriptor.propertyName;
                if (valueObj[child.dataLabel] !== undefined) {
                    this._childValueChanging = true;
                    this.setValue(child, descriptor, valueObj[child.dataLabel]);
                    this._childValueChanging = false;
                }
            }
        }
    };

    proto.applyLabel = function (label) {
        var that = this;
        if (label.text !== '') {
            this.updateLabel(label, null);
        }

        if (label.textMutationObserver === undefined) {
            label.textMutationObserver = new window.MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    if (m.type === 'attributes') {
                        if (m.target === label && m.attributeName === 'text') {
                            that.updateLabel(label, m.oldValue);
                        }
                    }
                });
            });

            if (label.textMutationObserver.observe !== undefined) {
                label.textMutationObserver.observe(label, { childList: false, attributes: true, subtree: false });
            }
        }
    };

    proto.updateLabel = function (label, oldValue) {
        var text = label.text;
        var controlId = label.niControlId;
        var i;
        var that = this;
        var callChildChanged = function (evt) {
            that.childChanged(evt);
        };

        for (i = 0; i < this.childNodes.length; i++) {
            var child = this.childNodes[i];
            if (child.labelId === controlId) {
                child.dataLabel = text;
                if (child.elementInfo.valuePropertyDescriptor !== undefined) {
                    var propertyName = child.elementInfo.valuePropertyDescriptor.propertyName;
                    var eventName = child.elementInfo.valuePropertyDescriptor.eventName;
                    if (oldValue === null) {
                        this.addPropertyToValue(text, this.getValue(child, propertyName));
                    } else {
                        this.changePropertyNameInValue(oldValue, text);
                    }

                    if (child.dataEventListenerAdded === undefined) {
                        child.addEventListener(eventName, callChildChanged);
                        child.dataEventListenerAdded = true;
                    }
                }

                break;
            }
        }
    };

    proto.getValue = function (element, propertyName) {
        var value = element[propertyName],
            convertedValue = NI_VAL_CONVERTER.ConvertBack(element, value);
        return convertedValue;
    };

    proto.setValue = function (element, propertyName, value) {
        var convertedValue = NI_VAL_CONVERTER.Convert(element, value);
        element[propertyName] = convertedValue;
    };

    proto.defineElementInfo(proto, 'ni-cluster', 'HTMLNICluster');
}(NationalInstruments.HtmlVI.Elements.Cluster, NationalInstruments.HtmlVI.Elements.Visual));
