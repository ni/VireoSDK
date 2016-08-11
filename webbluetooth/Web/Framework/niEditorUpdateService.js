//**********************************************************
// Service that handles interaction with the LabVIEW Editor
// National Instruments Copyright 2014
//**********************************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.EditorUpdateService = function () {
        parent.call(this);

        // Public Instance Properties
        // References to callbacks registered to coherent so they can be unregistered later
        this.windowEngineCallbacks = {
            propertyChange: undefined,
            propertyChangeMultiple: undefined,
            addElement: undefined,
            removeElement: undefined
        };

        // Private Instance Properties
        this._elementReparentingCache = new NationalInstruments.HtmlVI.ElementReparentingCache();
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.EditorUpdateService.StateEnum = Object.freeze(Object.assign({
        INITIALIZING: 'INITIALIZING',
        LISTENING: 'LISTENING'
    }, NationalInstruments.HtmlVI.Elements.WebApplication.ServiceStateEnum));

    NationalInstruments.HtmlVI.EditorUpdateService.CoherentMessagesEnum = Object.freeze({
        PROPERTY_CHANGE: 'PropertyChange',
        PROPERTY_CHANGE_MULTIPLE: 'PropertyChangeMultiple',
        ADD_ELEMENT: 'AddElement',
        REMOVE_ELEMENT: 'RemoveElement',
        PROCESS_MODEL_UPDATE: 'ProcessModelUpdate',
        PROCESS_EVENT: 'ProcessEvent',
        DOCUMENT_READY: 'DocumentReady',
        USERINTERACTION_CHANGED: 'UserInteractionChanged'
    });

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.EditorUpdateService;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    var SERVICE_STATE_ENUM = NationalInstruments.HtmlVI.EditorUpdateService.StateEnum;
    var COHERENT_MESSAGE_ENUM = NationalInstruments.HtmlVI.EditorUpdateService.CoherentMessagesEnum;

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.isValidServiceState = function (state) {
        // Child states merged with parent states so only need to check child

        var isValidState = SERVICE_STATE_ENUM[state] !== undefined;
        return isValidState;
    };

    proto.initialize = function () {
        parent.prototype.initialize.call(this, SERVICE_STATE_ENUM.UNINITIALIZED, undefined);

        this.setServiceState(SERVICE_STATE_ENUM.INITIALIZING);
    };

    proto.finishInitializing = function () {
        parent.prototype.finishInitializing.call(this, SERVICE_STATE_ENUM.INITIALIZING);

        this.setServiceState(SERVICE_STATE_ENUM.READY);
    };

    proto.start = function () {
        parent.prototype.start.call(this, SERVICE_STATE_ENUM.READY);
        var that = this;

        that.windowEngineCallbacks.propertyChange = function (argsArr) {
            var viName = argsArr[0],
                controlId = argsArr[1],
                dataJSON = argsArr[2],
                data;

            data = JSON.parse(dataJSON);
            that.dispatchMessageToHTMLPanel(viName, controlId, data);
        };

        that.windowEngineCallbacks.propertyChangeMultiple = function (argsArr) {
            var viName = argsArr[0],
                controlIdsJSON = argsArr[1],
                dataValuesJSON = argsArr[2],
                controlIds = JSON.parse(controlIdsJSON),
                dataValues = JSON.parse(dataValuesJSON),
                i;

            for (i = 0; i < controlIds.length; i++) {
                that.dispatchMessageToHTMLPanel(viName, controlIds[i], dataValues[i]);
            }
        };

        that.windowEngineCallbacks.addElement = function (argsArr) {
            var modelSettingsJSON = argsArr[0],
                parentId = argsArr[1],
                nextModelId = argsArr[2],
                initialLoad = argsArr[3],
                modelSettings = JSON.parse(modelSettingsJSON),
                tagName,
                viRef = '',
                resultElements;

            // TODO mraj REPARENTING console logging very helpful for debugging
            //NI_SUPPORT.log('add Element (editor)', modelSettings.niControlId, argsArr);

            // TODO mraj modelKindToTagName only works when a model has a 1 to 1 mapping to an element. In the future seetings needs to explicitly include a tagName
            tagName = NationalInstruments.HtmlVI.NIModelProvider.modelKindToTagName(modelSettings.kind);
            resultElements = NationalInstruments.HtmlVI.UpdateService.createNIControlToAddToDOM(modelSettings, tagName, modelSettings.niControlId, viRef, parentId);

            if (resultElements !== null) {
                resultElements.controlElement._isInitialLoad = initialLoad;

                if (resultElements.parentElement === undefined) {
                    that._elementReparentingCache.addToElementCache(parentId, resultElements.controlElement);
                } else {
                    if (nextModelId !== '') {
                        var selector = '[ni-control-id=\'' + nextModelId + '\']';
                        var nextNode = document.querySelectorAll(selector);
                        if (nextNode.length === 1) {
                            resultElements.parentElement.insertBefore(resultElements.controlElement, nextNode[0]);
                        } else {
                            resultElements.parentElement.appendChild(resultElements.controlElement);
                        }
                    } else {
                        resultElements.parentElement.appendChild(resultElements.controlElement);
                    }

                    that._elementReparentingCache.flushElementCache(resultElements.controlElement.niControlId, resultElements.controlElement);
                }
            }
        };

        that.windowEngineCallbacks.removeElement = function (argsArr) {
            var controlId = argsArr[0],
                viRef = '',
                resultElements;

            // TODO mraj REPARENTING console logging very helpful for debugging
            //NI_SUPPORT.log('remove Element (editor)', controlId, argsArr);

            resultElements = NationalInstruments.HtmlVI.UpdateService.findNIControlToRemoveFromDOM(controlId, viRef);
            if (resultElements !== null) {
                resultElements.controlElement.parentNode.removeChild(resultElements.controlElement);

                if (resultElements.parentElement instanceof NationalInstruments.HtmlVI.Elements.VisualComponent) {
                    that._elementReparentingCache.addToElementCache(resultElements.parentElement.niControlId, resultElements.controlElement);
                }
            }

        };

        that.windowEngineCallbacks.userInteractionChanged = function (argsArr) {
            var viName = argsArr[0],
                controlId = argsArr[1],
                dataJSON = argsArr[2],
                state, viModel, controlViewModel;

            state = JSON.parse(dataJSON);
            viModel = that.getVIModels()[viName];
            controlViewModel = viModel.getControlViewModel(controlId);

            var viViewModel = NationalInstruments.HtmlVI.viReferenceService.getVIViewModelByVIRef(viModel.viRef);
            if (state === 'start') {
                viViewModel.setUserInteracting(controlId);
            } else if (state === 'end') {
                viViewModel.clearUserInteracting(controlId);
            }

            // Is possible that a VisualComponentViewModel receives this event.
            // But it cannot handle it. Shall we move userInteractionChanged to VisualComponent?
            if (controlViewModel instanceof NationalInstruments.HtmlVI.ViewModels.VisualViewModel) {
                controlViewModel.userInteractionChanged(state);
            }
        };

        window.engine.on(COHERENT_MESSAGE_ENUM.PROPERTY_CHANGE, that.windowEngineCallbacks.propertyChange);
        window.engine.on(COHERENT_MESSAGE_ENUM.PROPERTY_CHANGE_MULTIPLE, that.windowEngineCallbacks.propertyChangeMultiple);
        window.engine.on(COHERENT_MESSAGE_ENUM.ADD_ELEMENT, that.windowEngineCallbacks.addElement);
        window.engine.on(COHERENT_MESSAGE_ENUM.REMOVE_ELEMENT, that.windowEngineCallbacks.removeElement);
        window.engine.on(COHERENT_MESSAGE_ENUM.USERINTERACTION_CHANGED, that.windowEngineCallbacks.userInteractionChanged);

        window.engine.call(COHERENT_MESSAGE_ENUM.DOCUMENT_READY);
        that.setServiceState(SERVICE_STATE_ENUM.LISTENING);
    };

    proto.stop = function () {
        parent.prototype.stop.call(this, SERVICE_STATE_ENUM.LISTENING);

        window.engine.off(COHERENT_MESSAGE_ENUM.PROPERTY_CHANGE, this.windowEngineCallbacks.propertyChange);
        window.engine.off(COHERENT_MESSAGE_ENUM.PROPERTY_CHANGE_MULTIPLE, this.windowEngineCallbacks.propertyChangeMultiple);
        window.engine.off(COHERENT_MESSAGE_ENUM.ADD_ELEMENT, this.windowEngineCallbacks.addElement);
        window.engine.off(COHERENT_MESSAGE_ENUM.REMOVE_ELEMENT, this.windowEngineCallbacks.removeElement);
        window.engine.off(COHERENT_MESSAGE_ENUM.USERINTERACTION_CHANGED, this.windowEngineCallbacks.userInteractionChanged);
        this.windowEngineCallbacks.propertyChange = undefined;
        this.windowEngineCallbacks.propertyChangeMultiple = undefined;
        this.windowEngineCallbacks.addElement = undefined;
        this.windowEngineCallbacks.removeElement = undefined;
        this.windowEngineCallbacks.userInteractionChanged = undefined;

        this.setServiceState(SERVICE_STATE_ENUM.READY);
    };

    // Called by the WebAppModel
    proto.internalControlEventOccurred = function (viModel, controlModel, eventName, eventData) {
        var data = {};
        data[eventName] = eventData;
        window.engine.trigger(COHERENT_MESSAGE_ENUM.PROCESS_EVENT, viModel.viName, controlModel.niControlId, JSON.stringify(data));
    };

    // Called by the WebAppModel
    proto.controlChanged = function (viModel, controlModel, propertyName, newValue) {
        // jshint unused:vars

        var topLevelControl,
            topLevelControlValue,
            topLevelControlValueJSON;

        if (controlModel.bindingInfo.prop === propertyName) {
            topLevelControl = controlModel.findTopLevelControl();
            topLevelControlValue = topLevelControl[topLevelControl.bindingInfo.prop];

            // TODO mraj JSON stringify does not handle all model values (ie -Infinity, Infinity, cluster using indexes, etc)
            topLevelControlValueJSON = JSON.stringify(topLevelControlValue);

            window.engine.trigger(COHERENT_MESSAGE_ENUM.PROCESS_MODEL_UPDATE, viModel.viName, topLevelControl.bindingInfo.dataItem, topLevelControlValueJSON);
        }
    };

    proto.setRenderHintsOnViewModel = function (viewModel) {
        if (viewModel instanceof NationalInstruments.HtmlVI.ViewModels.VisualViewModel) {
            viewModel.setRenderHints({ preferTransforms: true });
        }
    };

}(NationalInstruments.HtmlVI.UpdateService));
