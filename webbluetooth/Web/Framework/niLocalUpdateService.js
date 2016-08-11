//**********************************************************
// Service that handles interaction with Vireo
// National Instruments Copyright 2014
//**********************************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var $ = NationalInstruments.Globals.jQuery;

    // Constructor Function
    NationalInstruments.HtmlVI.LocalUpdateService = function (config) {
        parent.call(this);

        // Public Instance Properties
        this.eggShell = undefined;
        this.syncControlsCache = [];
        this.vireoSource = config.vireoSource;
        this.ideMode = config.runningInIDE === true;
        this.vireoText = undefined;
        this.dataItemCache = undefined;

        // References to callbacks registered to coherent so they can be unregistered later
        this.windowEngineCallbacks = {
            start: undefined,
            diagramValueChanged: undefined,
            finishedSendingUpdates: undefined,
            abortVI: undefined
        };

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.LocalUpdateService.StateEnum = Object.freeze(Object.assign({
        DOWNLOADING: 'DOWNLOADING',
        SYNCHRONIZING: 'SYNCHRONIZING',
        RUNNING: 'RUNNING',
        STOPPING: 'STOPPING'
    }, NationalInstruments.HtmlVI.Elements.WebApplication.ServiceStateEnum));

    NationalInstruments.HtmlVI.LocalUpdateService.InitTasksEnum = Object.freeze(Object.assign({
        DOWNLOADING: 'DOWNLOADING'
    }, parent.InitTasksEnum));

    NationalInstruments.HtmlVI.LocalUpdateService.CoherentMessagesEnum = Object.freeze({
        DIAGRAM_VALUE_CHANGED: 'DiagramValueChanged',
        FINISHED_SENDING_UPDATES: 'FinishedSendingUpdates',
        READY_FOR_UPDATES: 'ReadyForUpdates',
        ABORT_VI: 'AbortVI',
        FINISHED_RUNNING: 'FinishedRunning',
        PANEL_CONTROL_CHANGED: 'PanelControlChanged',
        START: 'Start',
        DOCUMENT_READY: 'DocumentReady'
    });

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.LocalUpdateService;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    var SERVICE_STATE_ENUM = NationalInstruments.HtmlVI.LocalUpdateService.StateEnum;
    var INIT_TASKS_ENUM = NationalInstruments.HtmlVI.LocalUpdateService.InitTasksEnum;
    var COHERENT_MESSAGE_ENUM = NationalInstruments.HtmlVI.LocalUpdateService.CoherentMessagesEnum;

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.isValidServiceState = function (state) {
        // Child states merged with parent states so only need to check child

        var isValidState = SERVICE_STATE_ENUM[state] !== undefined;
        return isValidState;
    };

    // Functions for State transitions
    proto.initialize = function () {
        var initTaskTracker = parent.prototype.initialize.call(this, SERVICE_STATE_ENUM.UNINITIALIZED, INIT_TASKS_ENUM),
            that = this;

        // Change state prior to starting download
        $.ajax({
            url: that.vireoSource,
            cache: false, // TODO mraj not caching is useful in development, should be true in production?
            dataType: 'text',
            complete: function (jqXHR, status) {
                if (status === 'success' || status === 'notmodified') {
                    that.vireoText = jqXHR.responseText;
                    initTaskTracker.complete(INIT_TASKS_ENUM.DOWNLOADING);
                } else {
                    NI_SUPPORT.error('Error retrieving vireo source from url (', that.vireoSource, ') with status (', status, ')');
                    that.setServiceState(SERVICE_STATE_ENUM.ERROR);
                }
            }
        });

        that.setServiceState(SERVICE_STATE_ENUM.DOWNLOADING);
    };

    proto.finishInitializing = function () {
        parent.prototype.finishInitializing.call(this, SERVICE_STATE_ENUM.DOWNLOADING);
        var that = this;

        that.eggShell = new NationalInstruments.HtmlVI.EggShell();
        that.eggShell.setFrontPanelSynchronousUpdateCallback(function (fpId) {
            that.updateSyncHTMLControl(fpId);
        });

        that.eggShell.setPrintCallback(function (text) {
            NI_SUPPORT.debug(text + '\n');
        });

        that.dataItemCache = new NationalInstruments.HtmlVI.ControlDataItemCache(that.getVIModels());

        if (that.ideMode === true) {
            window.engine.call(COHERENT_MESSAGE_ENUM.DOCUMENT_READY);
        }

        that.setServiceState(SERVICE_STATE_ENUM.READY);
    };

    proto.start = function () {
        parent.prototype.start.call(this, SERVICE_STATE_ENUM.READY);
        var that = this;

        that.eggShell.loadVia(that.vireoText);

        if (that.ideMode === true) {
            window.engine.off(COHERENT_MESSAGE_ENUM.START, that.windowEngineCallbacks.start);
            that.windowEngineCallbacks.start = undefined;
            setTimeout(function () {
                that.synchronize();
            }, 0);
            that.setServiceState(SERVICE_STATE_ENUM.SYNCHRONIZING);

        } else {
            that.startVireoRuntime();
        }
    };

    proto.synchronize = function () {
        var that = this,
            remainingVIsToSync,
            i;

        that.verifyServiceStateIs(SERVICE_STATE_ENUM.SYNCHRONIZING);

        if (that.ideMode === false) {
            NI_SUPPORT.error('HTML Panel synchronization steps should only be run when inside the editor');
            that.setServiceState(SERVICE_STATE_ENUM.ERROR);
            return;
        }

        // Create list of VIs to sync
        remainingVIsToSync = Object.keys(that.getVIModels());

        // Create property update listener
        that.windowEngineCallbacks.diagramValueChanged = function (argsArr) {
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

        // create VI panel complete listener
        that.windowEngineCallbacks.finishedSendingUpdates = function (argsArr) {
            var i, viName;

            viName = argsArr[0];

            for (i = 0; i < remainingVIsToSync.length; i = i + 1) {
                if (remainingVIsToSync[i] === viName) {
                    remainingVIsToSync.splice(i, 1);
                    break;
                }
            }

            if (remainingVIsToSync.length === 0) {
                window.engine.off(COHERENT_MESSAGE_ENUM.DIAGRAM_VALUE_CHANGED, that.windowEngineCallbacks.diagramValueChanged);
                window.engine.off(COHERENT_MESSAGE_ENUM.FINISHED_SENDING_UPDATES, that.windowEngineCallbacks.finishedSendingUpdates);
                that.windowEngineCallbacks.diagramValueChanged = undefined;
                that.windowEngineCallbacks.finishedSendingUpdates = undefined;
                that.startVireoRuntime();
            }

        };

        window.engine.on(COHERENT_MESSAGE_ENUM.DIAGRAM_VALUE_CHANGED, that.windowEngineCallbacks.diagramValueChanged);
        window.engine.on(COHERENT_MESSAGE_ENUM.FINISHED_SENDING_UPDATES, that.windowEngineCallbacks.finishedSendingUpdates);

        // Send requests for VI updates
        for (i = 0; i < remainingVIsToSync.length; i = i + 1) {
            window.engine.trigger(COHERENT_MESSAGE_ENUM.READY_FOR_UPDATES, remainingVIsToSync[i]);
        }
    };

    proto.startVireoRuntime = function () {
        var that = this;
        that.verifyServiceStateIs([SERVICE_STATE_ENUM.READY, SERVICE_STATE_ENUM.SYNCHRONIZING]);

        if (that.ideMode === true) {
            that.windowEngineCallbacks.abortVI = function () {
                that.stop();
            };

            window.engine.on(COHERENT_MESSAGE_ENUM.ABORT_VI, that.windowEngineCallbacks.abortVI);
        }

        setTimeout(function () {
            that.loadCurrentControlValuesIntoRuntime();
            that.executeRuntimeSlices();
        }, 0);

        that.setServiceState(SERVICE_STATE_ENUM.RUNNING);
    };

    proto.executeRuntimeSlices = function () {
        var that = this,
            finished;

        if (that.checkServiceStateIs(SERVICE_STATE_ENUM.RUNNING)) {

            finished = that.eggShell.runSlices();
            that.updateHTMLControls();

            if (finished === true) {
                that.stop();
            }

            // Keep executing until the service state changes
            setTimeout(function () {
                that.executeRuntimeSlices();
            }, 0);

        } else if (that.checkServiceStateIs(SERVICE_STATE_ENUM.STOPPING)) {
            setTimeout(function () {
                that.finishStopping();
            }, 0);
        } else {
            NI_SUPPORT.error('Web Application expected to be RUNNING or STOPPING');
            that.setServiceState(SERVICE_STATE_ENUM.ERROR);
        }
    };

    proto.stop = function () {
        parent.prototype.stop.call(this, SERVICE_STATE_ENUM.RUNNING);

        if (this.ideMode === true) {
            window.engine.off(COHERENT_MESSAGE_ENUM.ABORT_VI, this.windowEngineCallbacks.abortVI);
            this.windowEngineCallbacks.abortVI = undefined;
        }

        this.setServiceState(SERVICE_STATE_ENUM.STOPPING);
    };

    proto.finishStopping = function () {
        var that = this;
        this.verifyServiceStateIs(SERVICE_STATE_ENUM.STOPPING);

        if (this.ideMode === true) {
            // Send control values back to editor.
            // TODO: We should probably do this during run, not just at the end of run.
            // This would be necessary for the C# data context to remain up to date so that features
            // like Capture Data work correctly
            this.sendControlValuesToEditor();
            window.engine.trigger(COHERENT_MESSAGE_ENUM.FINISHED_RUNNING, 'Function');
            this.windowEngineCallbacks.start = function () {
                that.start();
            };

            window.engine.on(COHERENT_MESSAGE_ENUM.START, that.windowEngineCallbacks.start);
        }

        this.setServiceState(SERVICE_STATE_ENUM.READY);
    };

    // Functions for service <-> MVVM interconnect

    // Called by the WebAppModel
    proto.controlChanged = function (viModel, controlModel, propertyName, newValue) {
        var localBindingInfo = controlModel.getLocalBindingInfo();

        if (localBindingInfo !== undefined && localBindingInfo.io.indexOf('I') > -1) {

            this.eggShell.poke(localBindingInfo.encodedVIName,
                               localBindingInfo.runtimePath,
                               localBindingInfo.type,
                               newValue);
        }
    };

    proto.sendControlValuesToEditor = function () {
        var viModels = this.getVIModels();

        for (var viName in viModels) {
            if (viModels.hasOwnProperty(viName)) {

                var viModel = viModels[viName],
                    controlModels = viModel.getAllControlModels();

                for (var controlId in controlModels) {
                    if (controlModels.hasOwnProperty(controlId)) {

                        var controlModel = controlModels[controlId],
                            bindingInfo = controlModel.getEditorRuntimeBindingInfo();
                        // Currently we only send messages to the editor when values change on the page, not any other property.
                        // Eventually we may want to send messages if the user changes other properties (e.g. by editing min/max in place)
                        if (bindingInfo !== undefined && bindingInfo.dataItem !== undefined && bindingInfo.prop !== undefined &&
                            bindingInfo.dataItem !== '' && bindingInfo.prop !== '') {
                            var data = controlModel[bindingInfo.prop];
                            window.engine.trigger(COHERENT_MESSAGE_ENUM.PANEL_CONTROL_CHANGED, viName, bindingInfo.dataItem, JSON.stringify(data));
                        }
                    }
                }
            }
        }
    };

    proto.loadCurrentControlValuesIntoRuntime = function () {
        var viModels = this.getVIModels();

        for (var viName in viModels) {
            if (viModels.hasOwnProperty(viName)) {

                var viModel = viModels[viName],
                    controlModels = viModel.getAllControlModels();

                for (var controlId in controlModels) {
                    if (controlModels.hasOwnProperty(controlId)) {

                        var controlModel = controlModels[controlId],
                            localBindingInfo = controlModel.getLocalBindingInfo();

                        if (localBindingInfo !== undefined && localBindingInfo.io.indexOf('I') > -1) {
                            var data = controlModel[localBindingInfo.prop];

                            this.eggShell.poke(localBindingInfo.encodedVIName,
                                               localBindingInfo.runtimePath,
                                               localBindingInfo.type,
                                               data);
                        }
                    }
                }
            }
        }
    };

    proto.updateHTMLControls = function () {
        var viModels = this.getVIModels();

        for (var viName in viModels) {
            if (viModels.hasOwnProperty(viName)) {

                var viModel = viModels[viName],
                    controlModels = viModel.getAllControlModels();

                for (var controlId in controlModels) {
                    if (controlModels.hasOwnProperty(controlId)) {

                        var controlModel = controlModels[controlId],
                            localBindingInfo = controlModel.getLocalBindingInfo();

                        // Only update Top level controls; containers (cluster and array) are responsible for their children
                        // Only update indicators (output); controls are updated by the user
                        if (localBindingInfo !== undefined && controlModel.insideTopLevelContainer() === false && localBindingInfo.sync === false && localBindingInfo.io.indexOf('O') > -1) {
                            var messageData = {};

                            messageData[localBindingInfo.prop] = this.eggShell.peek(localBindingInfo.encodedVIName,
                                                                                    localBindingInfo.runtimePath,
                                                                                    localBindingInfo.type);

                            this.dispatchMessageToHTMLPanel(viName, controlId, messageData);
                        }
                    }
                }
            }
        }
    };

    proto.findSyncHTMLControl = function (fpId) {
        var viModels = this.getVIModels();

        for (var viName in viModels) {
            if (viModels.hasOwnProperty(viName)) {

                var viModel = viModels[viName],
                    controlModels = viModel.getAllControlModels();

                for (var controlId in controlModels) {
                    if (controlModels.hasOwnProperty(controlId)) {

                        var controlModel = controlModels[controlId],
                            localBindingInfo = controlModel.getLocalBindingInfo(),
                            fpIdStr = fpId.toString();

                        // All synchronous controls are managed separately (whether contained or top-level)
                        if (localBindingInfo !== undefined && localBindingInfo.via === fpIdStr && localBindingInfo.sync === true && localBindingInfo.io.indexOf('O') > -1) {
                            return {
                                localBindingInfo: localBindingInfo,
                                viName: viName,
                                controlId: controlId
                            };

                        }
                    }
                }
            }
        }

        return undefined;
    };

    proto.updateSyncHTMLControl = function (fpId) {
        var localBindingInfo, viName, controlId, messageData;

        if (this.syncControlsCache[fpId] === undefined) {
            this.syncControlsCache[fpId] = this.findSyncHTMLControl(fpId);
        }

        if (this.syncControlsCache[fpId] !== undefined) {
            localBindingInfo = this.syncControlsCache[fpId].localBindingInfo;
            viName = this.syncControlsCache[fpId].viName;
            controlId = this.syncControlsCache[fpId].controlId;
            messageData = {};

            messageData[localBindingInfo.prop] = this.eggShell.peek(localBindingInfo.encodedVIName,
                                                                    localBindingInfo.runtimePath,
                                                                    localBindingInfo.type);

            this.dispatchMessageToHTMLPanel(viName, controlId, messageData);

        } else {
            NI_SUPPORT.error('Trying to update synchronous control with data item id ' + fpId + ' but failed to locate control');
        }
    };
}(NationalInstruments.HtmlVI.UpdateService));
