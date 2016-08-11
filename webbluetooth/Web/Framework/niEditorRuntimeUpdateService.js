//**********************************************************
// Service that handles interaction to a running non-Vireo VI in the editor
// National Instruments Copyright 2015
//**********************************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.EditorRuntimeUpdateService = function () {
        parent.call(this);

        // Public Instance Properties
        this.dataItemCache = undefined;

        this.windowEngineCallbacks = {
            panelControlChanged: undefined
        };

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.EditorRuntimeUpdateService.StateEnum = Object.freeze(Object.assign({
        INITIALIZING: 'INITIALIZING',
        LISTENING: 'LISTENING'
    }, NationalInstruments.HtmlVI.Elements.WebApplication.ServiceStateEnum));

    NationalInstruments.HtmlVI.EditorRuntimeUpdateService.CoherentMessagesEnum = Object.freeze({
        READY_FOR_UPDATES: 'ReadyForUpdates',
        PANEL_CONTROL_CHANGED: 'PanelControlChanged',
        DIAGRAM_VALUE_CHANGED: 'DiagramValueChanged',
        DOCUMENT_READY: 'DocumentReady',
        PANEL_CONTROL_EVENT_OCCURRED: 'PanelControlEventOccurred'
    });

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.EditorRuntimeUpdateService;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    var SERVICE_STATE_ENUM = NationalInstruments.HtmlVI.EditorRuntimeUpdateService.StateEnum;
    var INIT_TASKS_ENUM = NationalInstruments.HtmlVI.EditorRuntimeUpdateService.InitTasksEnum;
    var COHERENT_MESSAGE_ENUM = NationalInstruments.HtmlVI.EditorRuntimeUpdateService.CoherentMessagesEnum;

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.isValidServiceState = function (state) {
        // Child states merged with parent states so only need to check child

        var isValidState = SERVICE_STATE_ENUM[state] !== undefined;
        return isValidState;
    };

    // Functions for state transitions
    proto.initialize = function () {
        parent.prototype.initialize.call(this, SERVICE_STATE_ENUM.UNINITIALIZED, INIT_TASKS_ENUM);

        this.setServiceState(SERVICE_STATE_ENUM.INITIALIZING);
    };

    proto.finishInitializing = function () {
        parent.prototype.finishInitializing.call(this, SERVICE_STATE_ENUM.INITIALIZING);

        this.dataItemCache = new NationalInstruments.HtmlVI.ControlDataItemCache(this.getVIModels());

        this.setServiceState(SERVICE_STATE_ENUM.READY);
    };

    proto.start = function () {
        parent.prototype.start.call(this, SERVICE_STATE_ENUM.READY);

        var that = this;
        that.windowEngineCallbacks.panelControlChanged = function (argsArr) {
            // Coherent message will identify the control by its C# data item name and a property called 'value'
            // but HTML panel update message needs control to be identified by control ID and a specific property name for each model.
            var viName = argsArr[0],
                dataItem = argsArr[1],
                editorRuntimeBindingInfo = that.dataItemCache.getEditorRuntimeBindingInfo(viName, dataItem),
                controlId = editorRuntimeBindingInfo.controlId,
                dataJSON = argsArr[2],
                parsedData = JSON.parse(dataJSON),
                data = {};
            data[editorRuntimeBindingInfo.prop] = parsedData;

            that.dispatchMessageToHTMLPanel(viName, controlId, data);
        };

        window.engine.on(COHERENT_MESSAGE_ENUM.DIAGRAM_VALUE_CHANGED, that.windowEngineCallbacks.panelControlChanged);
        window.engine.call(COHERENT_MESSAGE_ENUM.DOCUMENT_READY);
        // Send requests for VI updates
        var i, visToSync;
        visToSync = Object.keys(that.getVIModels());
        for (i = 0; i < visToSync.length; i = i + 1) {
            window.engine.trigger(COHERENT_MESSAGE_ENUM.READY_FOR_UPDATES, visToSync[i]);
        }

        that.setServiceState(SERVICE_STATE_ENUM.LISTENING);
    };

    proto.stop = function () {
        parent.prototype.stop.call(this, SERVICE_STATE_ENUM.LISTENING);
        window.engine.off(COHERENT_MESSAGE_ENUM.DIAGRAM_VALUE_CHANGED, this.windowEngineCallbacks.panelControlChanged);
        this.setServiceState(SERVICE_STATE_ENUM.READY);
    };

    // Called by the WebAppModel
    proto.controlChanged = function (viModel, controlModel, propertyName, newValue) {
        // Currently we only send messages to the editor when values change on the page, not any other property.
        // Eventually we may want to send messages if the user changes other properties (e.g. by editing min/max in place)
        if (controlModel.bindingInfo.prop === propertyName && controlModel.bindingInfo.dataItem !== '') {
            controlModel = controlModel.findTopLevelControl();
            newValue = controlModel[controlModel.bindingInfo.prop];
            window.engine.trigger(COHERENT_MESSAGE_ENUM.PANEL_CONTROL_CHANGED, viModel.viName, controlModel.bindingInfo.dataItem, JSON.stringify(newValue));
        }
    };

    // Called by the WebAppModel
    proto.controlEventOccurred = function (viModel, controlModel, eventType, eventData) {
        controlModel = controlModel.findTopLevelControl();
        var modelIdentifier = controlModel.getEditorRuntimeBindingInfo().controlId;
        window.engine.trigger(COHERENT_MESSAGE_ENUM.PANEL_CONTROL_EVENT_OCCURRED, viModel.viName, modelIdentifier, eventType, JSON.stringify(eventData));
    };
}(NationalInstruments.HtmlVI.UpdateService));
