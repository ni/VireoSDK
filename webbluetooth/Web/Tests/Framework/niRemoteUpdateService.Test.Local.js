//****************************************
// Tests for niRemoteUpdateService file
// National Instruments Copyright 2014
//****************************************

describe('The niRemoteUpdateService', function () {
    'use strict';

    var SERVICE_STATE_ENUM = NationalInstruments.HtmlVI.RemoteUpdateService.StateEnum;
    var PANEL_ENGINE_ENUM = NationalInstruments.HtmlVI.Elements.WebApplication.PanelEngineEnum;
    var PANEL_LOCATION_ENUM = NationalInstruments.HtmlVI.Elements.WebApplication.PanelLocationEnum;

    var VI_NAME = '8 mile.gvi',
        VI_REF = '',
        REMOTE_ADDRESS = 'ws://localhost:8181';

    beforeEach(function () {
        var webAppElems = document.querySelectorAll('ni-web-application');
        expect(webAppElems.length).toBe(0);
    });

    it('verifies the server is running', function (done) {
        var wsServer;

        var connectToServer = function () {
            var websocketFailed = function () {
                expect('Cannot connect to server, make sure server is started before running tests. See Web/Tests/Standalone/localtestserver/README.txt').not.toBeDefined();
                done();
            };

            wsServer = new WebSocket(REMOTE_ADDRESS);
            wsServer.addEventListener('close', websocketFailed);

            wsServer.addEventListener('open', function () {
                wsServer.removeEventListener('close', websocketFailed);
                wsServer.close();
                done();
            });
        };

        expect(connectToServer).not.toThrow();
    });

    describe('is attached with auto start disabled and in browser mode,', function () {
        var webAppElement,
            numericControl,
            numericIndicator;

        var numericControlSettings = {
            viRef: VI_REF,
            niControlId: 'hola',
            value: { numberValue: 10 },
            top: '0px',
            left: '0px',
            width: '200px',
            height: '100px',
            bindingInfo: {
                prop: 'value',
                dco: 2
            }
        };

        var numericControlUpdateSettings = {
            numberValue: 5
        };

        var numericIndicatorSettings = {
            viRef: VI_REF,
            niControlId: 'aloha',
            value: { numberValue: 15 },
            top: '0px',
            left: '300px',
            width: '200px',
            height: '100px',
            bindingInfo: {
                prop: 'value',
                dco: 3
            }
        };

        var numericIndicatorUpdateSettings = {
            numberValue: 5
        };

        beforeEach(function (done) {
            var states = [];

            webAppElement = document.createElement('ni-web-application');
            webAppElement.disableAutoStart = true;
            webAppElement.remoteAddress = REMOTE_ADDRESS;
            webAppElement.location = PANEL_LOCATION_ENUM.BROWSER;
            webAppElement.engine = PANEL_ENGINE_ENUM.NATIVE;

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
                            SERVICE_STATE_ENUM.INITIALIZING,
                            SERVICE_STATE_ENUM.READY
                        ]);

                    });
                }
            });

            numericControl = document.createElement('ni-numeric-text-box');
            Object.keys(numericControlSettings).forEach(function (prop) {
                numericControl[prop] = numericControlSettings[prop];
            });

            numericIndicator = document.createElement('ni-numeric-text-box');
            Object.keys(numericIndicatorSettings).forEach(function (prop) {
                numericIndicator[prop] = numericIndicatorSettings[prop];
            });

            // Web App element must be in the DOM first
            webAppElement.appendChild(viElement);
            document.body.appendChild(webAppElement);
            document.body.appendChild(numericControl);
            document.body.appendChild(numericIndicator);
        });

        afterEach(function () {
            numericControl.parentNode.removeChild(numericControl);
            numericIndicator.parentNode.removeChild(numericIndicator);

            webAppElement.parentNode.removeChild(webAppElement);
            webAppElement = undefined;
        });

        it('and is in the READY state', function () {
            expect(webAppElement.serviceState).toEqual(SERVICE_STATE_ENUM.READY);
        });

        describe('and is started', function () {
            beforeEach(function (done) {
                var states = [];

                states.push(webAppElement.serviceState);

                webAppElement.addEventListener('service-state-changed', function waitForReadyListener(evt) {
                    states.push(evt.detail.serviceState);

                    if (evt.detail.serviceState === SERVICE_STATE_ENUM.CONNECTED) {
                        webAppElement.removeEventListener('service-state-changed', waitForReadyListener);

                        // Call done async to give this event on the element a chance to complete
                        testHelpers.runAsync(done, function () {
                            expect(states).toEqual([
                                SERVICE_STATE_ENUM.READY,
                                SERVICE_STATE_ENUM.INITIALCONNECTION,
                                SERVICE_STATE_ENUM.CONNECTING,
                                SERVICE_STATE_ENUM.CONNECTED
                            ]);
                        });

                    }
                });

                webAppElement.start();
            });

            afterEach(function (done) {
                var states = [];

                states.push(webAppElement.serviceState);

                webAppElement.addEventListener('service-state-changed', function waitForReadyListener(evt) {
                    states.push(evt.detail.serviceState);

                    if (evt.detail.serviceState === SERVICE_STATE_ENUM.READY) {
                        webAppElement.removeEventListener('service-state-changed', waitForReadyListener);

                        // Call done async to give this event on the element a chance to complete
                        testHelpers.runAsync(done, function () {
                            expect(states).toEqual([
                                SERVICE_STATE_ENUM.CONNECTED,
                                SERVICE_STATE_ENUM.READY
                            ]);
                        });

                    }
                });

                webAppElement.stop();
            });

            it('and can communicate an update to a control', function (done) {
                console.time('controlupdate');
                numericControl.value = numericControlUpdateSettings;

                window.requestAnimationFrame(function waitingForUpdate() {
                    if (numericIndicator.value.numberValue === numericIndicatorUpdateSettings.numberValue) {
                        console.timeEnd('controlupdate');
                        done();
                    } else {
                        window.requestAnimationFrame(waitingForUpdate);
                    }
                });
            });
        });

    });
});
