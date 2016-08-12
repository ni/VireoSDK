//****************************************
// Visual Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static private reference aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.VisualModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        this.bindingInfo = {};
        this.localBindingInfo = null;
        this.defaultValue = undefined;
        this.suppressControlChanged = false;

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    // None

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.VisualModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addModelProperty(targetPrototype, { propertyName: 'top', defaultValue: '0px' });
        proto.addModelProperty(targetPrototype, { propertyName: 'left', defaultValue: '0px' });
        proto.addModelProperty(targetPrototype, { propertyName: 'width', defaultValue: '100px' });
        proto.addModelProperty(targetPrototype, { propertyName: 'height', defaultValue: '100px' });
        proto.addModelProperty(targetPrototype, { propertyName: 'foreground', defaultValue: '#000000' });
        proto.addModelProperty(targetPrototype, { propertyName: 'fontSize', defaultValue: '12px' });
        proto.addModelProperty(targetPrototype, { propertyName: 'fontFamily', defaultValue: 'sans-serif' });
        proto.addModelProperty(targetPrototype, { propertyName: 'fontWeight', defaultValue: 'normal' });
        proto.addModelProperty(targetPrototype, { propertyName: 'fontStyle', defaultValue: 'normal' });
        proto.addModelProperty(targetPrototype, { propertyName: 'visible', defaultValue: true });
        proto.addModelProperty(targetPrototype, { propertyName: 'readOnly', defaultValue: true });
        proto.addModelProperty(targetPrototype, { propertyName: 'labelId', defaultValue: '' });
    });

    proto.setBindingInfo = function (bindingInfo) {
        this.bindingInfo = bindingInfo;
    };

    proto.getBindingInfo = function () {
        return this.bindingInfo;
    };

    proto.getRemoteBindingInfo = function () {
        return {
            prop: this.bindingInfo.prop,
            dco: this.bindingInfo.dco,
            controlId: this.niControlId
        };
    };

    proto.getEditorRuntimeBindingInfo = function () {
        return {
            prop: this.bindingInfo.prop,
            dataItem: this.bindingInfo.dataItem,
            controlId: this.niControlId
        };
    };

    proto.getLocalBindingInfo = function () {
        if (this.localBindingInfo === null) {
            this.localBindingInfo = this.generateLocalBindingInfo();
        }

        return this.localBindingInfo;
    };

    proto.getDefaultValue = function () {
        return this.defaultValue;
    };

    proto.setDefaultValue = function (defaultValue) {
        this.defaultValue = defaultValue;
    };

    proto.generateVireoPath = function () {
        var pathParts = [], path, currBindingInfo, encodedCurrFieldName,
            currControlModel = this;

        while (currControlModel.insideTopLevelContainer()) {
            currBindingInfo = currControlModel.getBindingInfo();
            encodedCurrFieldName = NationalInstruments.HtmlVI.EggShell.encodeVireoIdentifier(currBindingInfo.field);

            pathParts.push(encodedCurrFieldName);

            currControlModel = currControlModel.getOwner();
        }

        currBindingInfo = currControlModel.getBindingInfo();

        if (typeof currBindingInfo.via === 'string' && currBindingInfo.via !== '') {
            pathParts.push('di_' + currBindingInfo.via);
        }

        path = pathParts.reverse().join('.');
        return path;
    };

    proto.getIOBehavior = function (runtimePath) {
        // TODO mraj would rather use model.readonly() but the controls implement this inconsistently so using value in VIAInfo.js
        var topLevelControl, topLevelControlLocalBindingInfo;

        if (NationalInstruments.HtmlVI.inputDataItem !== undefined && NationalInstruments.HtmlVI.inputDataItem[runtimePath] !== undefined) {
            return 'I';
        } else if (NationalInstruments.HtmlVI.outputDataItem !== undefined && NationalInstruments.HtmlVI.outputDataItem[runtimePath] !== undefined) {
            return 'O';
        } else {
            // TODO mraj every control should have a direction. Until fixed use top level control io or fallback. When fixed throw error instead
            topLevelControl = this.findTopLevelControl();

            if (topLevelControl !== this) {
                topLevelControlLocalBindingInfo = topLevelControl.getLocalBindingInfo();

                if (topLevelControlLocalBindingInfo !== undefined && (topLevelControlLocalBindingInfo.io === 'I' || topLevelControlLocalBindingInfo.io === 'O')) {
                    return topLevelControlLocalBindingInfo.io;
                }
            }

            return '?';
        }
    };

    proto.getVireoType = function (runtimePath) {
        // TODO mraj would rather hame model.getVireoType() assuming one data item per model (or lookup type in model property) but not available so using value in VIAInfo.js

        // TODO mraj currently all children of clusters have a type of 'Unknown'. We should emit type information for children.
        if (NationalInstruments.HtmlVI.inputDataItem !== undefined && NationalInstruments.HtmlVI.inputDataItem[runtimePath] !== undefined) {
            return NationalInstruments.HtmlVI.inputDataItem[runtimePath];
        } else if (NationalInstruments.HtmlVI.outputDataItem !== undefined && NationalInstruments.HtmlVI.outputDataItem[runtimePath] !== undefined) {
            return NationalInstruments.HtmlVI.outputDataItem[runtimePath];
        } else {
            return 'Unknown'; // TODO mraj every data item should have a type, current behavior assumes 'Unknown' for now
        }
    };

    // DO NOT USE DIRECTLY: Use getLocalBindingInfo instead for cached value
    proto.generateLocalBindingInfo = function () {
        var bindingInfo = this.getBindingInfo();
        var localBindingInfo = {
            io: '',            // can be either 'I' or 'O' based on top-level control
            runtimePath: '',   // full vireo encoded path from this control to the top-level control
            type: '',          // based on type of the top-level control
            encodedVIName: '', // the vireo encoded VI name
            prop: '',          // same as bindingInfo.prop
            sync: false        // same as bindingInfo.sync
        };

        localBindingInfo.runtimePath = this.generateVireoPath();
        localBindingInfo.io = this.getIOBehavior(localBindingInfo.runtimePath);
        localBindingInfo.type = this.getVireoType(localBindingInfo.runtimePath);
        localBindingInfo.encodedVIName = this.getRoot().getNameVireoEncoded();
        localBindingInfo.prop = (typeof bindingInfo.prop === 'string') ? bindingInfo.prop : '';
        localBindingInfo.sync = (typeof bindingInfo.sync === 'boolean') ? bindingInfo.sync : false;
        localBindingInfo.via = (typeof bindingInfo.via === 'string') ? bindingInfo.via : '';

        if (localBindingInfo.runtimePath === '') {
            return undefined;
        }

        return Object.freeze(localBindingInfo);
    };

    // Control changed is only used for controls that have binding info (ie VisualModels)
    proto.controlChanged = function (propertyName, newValue) {
        var viModel = this.getRoot();
        if (this.suppressControlChanged === false) {
            viModel.controlChanged(this, propertyName, newValue);
        }
    };

    // Event occured is only used for controls that have binding info (ie VisualModels)
    proto.controlEventOccurred = function (eventType, eventData) {
        var viModel = this.getRoot();
        viModel.controlEventOccurred(this, eventType, eventData);
    };

}(NationalInstruments.HtmlVI.Models.VisualComponentModel));
