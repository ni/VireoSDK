//****************************************
// Tests for niLocalUpdateService file
// National Instruments Copyright 2014
//****************************************

describe('The niLocalUpdateService', function () {
    'use strict';

    var SERVICE_STATE_ENUM = NationalInstruments.HtmlVI.LocalUpdateService.StateEnum;
    var PANEL_ENGINE_ENUM = NationalInstruments.HtmlVI.Elements.WebApplication.PanelEngineEnum;
    var PANEL_LOCATION_ENUM = NationalInstruments.HtmlVI.Elements.WebApplication.PanelLocationEnum;
    var VIREO_FUNC = testHelpers.vireoShimFunctionsEnum;
    var COHERENT_FUNC = testHelpers.coherentShimFunctionsEnum;
    var COHERENT_MESSAGE_ENUM = NationalInstruments.HtmlVI.LocalUpdateService.CoherentMessagesEnum;

    // Shim references
    var coherentShim, vireoShim;

    // AJAX Shims
    var ajaxResponseOk = {
        viaCodeUrl: '/my/awesome.via',
        stubMatch: /\/my\/awesome\.via/,
        response: {
            status: 200,
            contentType: 'text/plain',
            responseText: 'totally a legit via file'
        }
    };

    // Vireo Shims
    var createVireoFinishImmediatelyShim = function () {
        return function (name) {
            if (name === VIREO_FUNC.EXECUTESLICES) {
                return 0;
            }
        };
    };

    var VI_NAME = 'Hakuna matata.gvi',
        VI_REF = '';

    // Editor Shims
    var createEditorFinishSynchroniztionAsynchronouslyShim = function () {
        return function (name, args) {
            var coherentEventName, coherentEventCB;

            if (name === COHERENT_FUNC.ON) {
                coherentEventName = args[0];
                coherentEventCB = args[1];

                if (coherentEventName === COHERENT_MESSAGE_ENUM.FINISHED_SENDING_UPDATES) {
                    setTimeout(function () {
                        coherentEventCB.call(undefined, [VI_NAME]);
                    }, 0);
                }
            }
        };
    };

    beforeEach(function () {
        var webAppElems = document.querySelectorAll('ni-web-application');
        expect(webAppElems.length).toBe(0);

        jasmine.Ajax.install();
        coherentShim = testHelpers.createCoherentShim();
        vireoShim = testHelpers.createVireoShim();
    });

    afterEach(function () {
        jasmine.Ajax.uninstall();
        coherentShim.removeShim();
        vireoShim.removeShim();
    });

    describe('uses shims successful ajax and vireo finish immediately,', function () {
        beforeEach(function () {
            jasmine.Ajax.stubRequest(ajaxResponseOk.stubMatch).andReturn(ajaxResponseOk.response);
            vireoShim.setCallback(createVireoFinishImmediatelyShim());
            coherentShim.setCallback(undefined);
        });

        afterEach(function () {
            vireoShim.setCallback(undefined);
            coherentShim.setCallback(undefined);
        });

        it('and is uninitialized before attaching', function () {
            var webAppElem = document.createElement('ni-web-application');
            expect(webAppElem.serviceState).toBe(SERVICE_STATE_ENUM.UNINITIALIZED);
        });

        describe('is attached with auto start disabled and in browser mode,', function () {
            var webAppElement;

            beforeEach(function (done) {
                var states = [];

                webAppElement = document.createElement('ni-web-application');
                webAppElement.disableAutoStart = true;
                webAppElement.vireoSource = ajaxResponseOk.viaCodeUrl;
                webAppElement.location = PANEL_LOCATION_ENUM.BROWSER;
                webAppElement.engine = PANEL_ENGINE_ENUM.VIREO;

                var viElement = document.createElement('ni-virtual-instrument');
                viElement.viName = VI_NAME;
                viElement.viRef = VI_REF;

                states.push(webAppElement.serviceState);

                webAppElement.addEventListener('service-state-changed', function waitForReadyListener(evt) {
                    states.push(evt.detail.serviceState);

                    if (evt.detail.serviceState === SERVICE_STATE_ENUM.READY) {
                        webAppElement.removeEventListener('service-state-changed', waitForReadyListener);

                        // Call done async to give this event on the element a chance to complete
                        testHelpers.runAsync(done, function () {
                            expect(states).toEqual([
                                SERVICE_STATE_ENUM.UNINITIALIZED,
                                SERVICE_STATE_ENUM.DOWNLOADING,
                                SERVICE_STATE_ENUM.READY
                            ]);

                        });
                    }
                });

                webAppElement.appendChild(viElement);
                document.body.appendChild(webAppElement);
            });

            afterEach(function () {
                webAppElement.parentNode.removeChild(webAppElement);
                webAppElement = undefined;
            });

            it('and is in the READY state', function () {
                expect(webAppElement.serviceState).toEqual(SERVICE_STATE_ENUM.READY);
            });

            it('and is started', function (done) {
                var states = [];
                states.push(webAppElement.serviceState);

                webAppElement.addEventListener('service-state-changed', function waitForReadyListener(evt) {
                    states.push(evt.detail.serviceState);

                    if (evt.detail.serviceState === SERVICE_STATE_ENUM.READY) {
                        webAppElement.removeEventListener('service-state-changed', waitForReadyListener);

                        // Call done async to give this event on the element a chance to complete
                        testHelpers.runAsync(done, function () {
                            expect(states).toEqual([
                                SERVICE_STATE_ENUM.READY,
                                SERVICE_STATE_ENUM.RUNNING,
                                SERVICE_STATE_ENUM.STOPPING,
                                SERVICE_STATE_ENUM.READY
                            ]);
                        });

                    }
                });

                webAppElement.start();
            });

        });

        describe('is attached with auto start disabled and in ide run mode,', function () {
            var webAppElement;

            beforeEach(function (done) {
                var states = [];

                webAppElement = document.createElement('ni-web-application');
                webAppElement.disableAutoStart = true;
                webAppElement.vireoSource = ajaxResponseOk.viaCodeUrl;
                webAppElement.location = PANEL_LOCATION_ENUM.IDE_RUN;
                webAppElement.engine = PANEL_ENGINE_ENUM.VIREO;

                var viElement = document.createElement('ni-virtual-instrument');
                viElement.viName = VI_NAME;
                viElement.viRef = VI_REF;

                coherentShim.setCallback(createEditorFinishSynchroniztionAsynchronouslyShim());

                states.push(webAppElement.serviceState);

                webAppElement.addEventListener('service-state-changed', function waitForReadyListener(evt) {
                    states.push(evt.detail.serviceState);

                    if (evt.detail.serviceState === SERVICE_STATE_ENUM.READY) {
                        webAppElement.removeEventListener('service-state-changed', waitForReadyListener);

                        // Call done async to give this event on the element a chance to complete
                        testHelpers.runAsync(done, function () {
                            expect(states).toEqual([
                                SERVICE_STATE_ENUM.UNINITIALIZED,
                                SERVICE_STATE_ENUM.DOWNLOADING,
                                SERVICE_STATE_ENUM.READY
                            ]);

                        });
                    }
                });

                webAppElement.appendChild(viElement);
                document.body.appendChild(webAppElement);
            });

            afterEach(function () {
                webAppElement.parentNode.removeChild(webAppElement);
                webAppElement = undefined;
                coherentShim.setCallback(undefined);
            });

            it('and is in the READY state', function () {
                expect(webAppElement.serviceState).toEqual(SERVICE_STATE_ENUM.READY);
            });

            it('and is started', function (done) {
                var states = [];
                states.push(webAppElement.serviceState);

                webAppElement.addEventListener('service-state-changed', function waitForReadyListener(evt) {
                    states.push(evt.detail.serviceState);

                    if (evt.detail.serviceState === SERVICE_STATE_ENUM.READY) {
                        webAppElement.removeEventListener('service-state-changed', waitForReadyListener);

                        // Call done async to give this event on the element a chance to complete
                        testHelpers.runAsync(done, function () {
                            expect(states).toEqual([
                                SERVICE_STATE_ENUM.READY,
                                SERVICE_STATE_ENUM.SYNCHRONIZING,
                                SERVICE_STATE_ENUM.RUNNING,
                                SERVICE_STATE_ENUM.STOPPING,
                                SERVICE_STATE_ENUM.READY
                            ]);
                        });

                    }
                });

                webAppElement.start();
            });
        });

    });
});
