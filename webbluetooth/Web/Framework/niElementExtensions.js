//****************************************
// Custom Element Extensions
// National Instruments Copyright 2014
//****************************************

(function () {
    'use strict';
    // Static Private Reference Aliases
    // var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    var toReg, proto, targetPrototype, generateAttachedCallback, generateDetachedCallback;

    generateAttachedCallback = function (orig) {
        return function attachedCallback_VisualComponentViewModel() {
            var firstCall, viViewModel, controlModelViewModel,
                that = this; // this should be bound to the custom element that was attached

            // Create Model and ViewModel (this will synchronize element attributes <-> model properties)
            // Assumptions:
            // Element is in the DOM
            // Element internal DOM not created yet

            // _preventModelCreation can be undefined or true, so must check if !true
            if (that._preventModelCreation !== true) {
                viViewModel = NationalInstruments.HtmlVI.viReferenceService.getVIViewModelByVIRef(that.viRef);
                controlModelViewModel = viViewModel.model.addFrontPanelControlModel(that);
                viViewModel.addFrontPanelControlViewModel(controlModelViewModel.controlViewModel, that._isInitialLoad);
                that._isInitialLoad = undefined;
            }

            // Attach and populate internal DOM (as needed)
            firstCall = orig.apply(that, arguments);

            if (typeof firstCall !== 'boolean') {
                throw new Error('Make sure attachedCallback is returning the firstCall value');
            }

            // Complete ViewModel - View binding
            // Assumptions:
            // Element is in the DOM
            // Element internal DOM created
            // _preventModelCreation can be undefined or true, so must check if !true
            if (that._preventModelCreation !== true) {
                controlModelViewModel.controlViewModel.bindToView();

                if (controlModelViewModel.controlViewModel._needsResizeHack === true) {
                    that.dispatchEvent(new CustomEvent('resizeEventHack', {
                        detail: {
                            width: controlModelViewModel.controlModel.width,
                            height: controlModelViewModel.controlModel.height
                        }
                    }));
                }
            }

            return firstCall;
        };
    };

    generateDetachedCallback = function (orig) {
        return function detachedCallback_VisualComponentViewModel() {
            orig.apply(this, arguments);

            var viViewModel,
                webAppModel,
                that = this; // this should be bound to the custom element that was attached

            var currParent,
                parentElement,
                elementViewModel;

            // _preventModelCreation can be undefined or true, so must check if !true
            if (that._preventModelCreation !== true) {
                viViewModel = NationalInstruments.HtmlVI.viReferenceService.getVIViewModelByVIRef(that.viRef);
                elementViewModel = viViewModel.model.getControlViewModel(that.niControlId);
                viViewModel.removeFrontPanelControlViewModel(elementViewModel);
                viViewModel.model.removeFrontPanelControl(that);

                // If this element is the child of a parent element that was detached, then detach the element from the parent and add to element buffer
                webAppModel = NationalInstruments.HtmlVI.viReferenceService.getWebAppModelByVIRef(that.viRef);

                // TODO mraj, maybe webapp or update service should expose an interface instead..
                if (webAppModel.updateService._elementReparentingCache !== undefined) {
                    parentElement = document.body;

                    for (currParent = that.parentElement; currParent !== null; currParent = currParent.parentElement) {
                        if (currParent instanceof NationalInstruments.HtmlVI.Elements.VisualComponent) {
                            parentElement = currParent;
                            break;
                        }
                    }

                    if (parentElement instanceof NationalInstruments.HtmlVI.Elements.VisualComponent) {
                        // TODO mraj REPARENTING console logging very helpful for debugging
                        // NI_SUPPORT.log('remove Element (parent detached)', that.niControlId);
                        that.parentNode.removeChild(that);
                        webAppModel.updateService._elementReparentingCache.addToElementCache(parentElement.niControlId, that);
                    }

                }

            }
        };
    };

    // Extensions to multiple prototypes
    for (toReg in NationalInstruments.HtmlVI.Elements) {
        if (NationalInstruments.HtmlVI.Elements.hasOwnProperty(toReg)) {
            proto = targetPrototype = NationalInstruments.HtmlVI.Elements[toReg].prototype;

            // Modify the attached callback of all leaf prototypes of the visual component custom elements
            if (proto.elementInfo !== undefined && proto instanceof NationalInstruments.HtmlVI.Elements.VisualComponent) {

                proto.addProperty(targetPrototype, {
                    propertyName: 'viRef',
                    defaultValue: ''
                });

                proto.attachedCallback = generateAttachedCallback(proto.attachedCallback);
                proto.detachedCallback = generateDetachedCallback(proto.detachedCallback);
            }

            // Add additional properties to all leaf prototypes of the visual custom elements
            if (proto.elementInfo !== undefined && proto instanceof NationalInstruments.HtmlVI.Elements.Visual) {

                proto.addProperty(targetPrototype, {
                    propertyName: 'bindingInfo',
                    defaultValue: {
                        prop: '',        // The model property that is associated with a data item in via code
                        via: '',         // The name of the associated data item in the via code
                        field: '',       // Name of element if inside cluster
                        sync: false,     // Whether the update performs synchronously
                        dco: -1,         // Index of the control as used by RT
                        dataItem: ''     // Compiled data item name in the desktop native runtime
                    }
                });

                proto.addProperty(targetPrototype, {
                    propertyName: 'labelId',
                    defaultValue: ''
                });
            }

        }
    }
}());

