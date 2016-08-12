//****************************************
// Helpers to run tests that must be performed asynchronously
// National Instruments Copyright 2015
//****************************************

window.testHelpers = window.testHelpers || {};

// This Helper function is used to check the results of a test asynchronously.
// For example, the createNIElement function and the testHelpers.messageDispatch function both have behaviors that run asynchronously.
// runAsync is used to run a piece of code after the results of createNIElement or messageDispatch are complete.
window.testHelpers.runAsync = function (done, asyncCB) {
    'use strict';
    if (typeof asyncCB !== 'function' || typeof done !== 'function') {
        throw new Error('Forgot to provide callback function or done function');
    }

    if (arguments.length !== 2) {
        throw new Error('Expecting only two callbacks');
    }

    // Using requestAnimationFrame because the document-register-element polyfill
    // is using requestAnimationFrame to schedule lifecycle callbacks
    window.requestAnimationFrame(function () {
        expect(asyncCB).not.toThrow();
        done.call(undefined);
    });
};

// Expects to be called with the first parameter as the done function and the remainder as callbacks to invoke
window.testHelpers.runMultipleAsync = function () {
    'use strict';

    var i, nextFunctionToInvoke, done, callbacks;

    // Validate Inputs
    if (arguments.length <= 2) {
        throw new Error('Must be called with more than two functions. For just calling done with an asynchronous callback use runAsync');
    }

    for (i = 0; i < arguments.length; i = i + 1) {
        if (typeof arguments[i] !== 'function') {
            throw new Error('Must only call with function inputs. The first should be the done function and the rest are asynchronous callbacks');
        }
    }

    // Extract Done function and callbacks
    done = arguments[0];
    callbacks = [];
    for (i = 1; i < arguments.length; i = i + 1) {
        callbacks.push(arguments[i]);
    }

    nextFunctionToInvoke = function (done, callbacks, curr) {
        expect(callbacks[curr]).not.toThrow();

        if (curr < callbacks.length - 1) {
            // Using requestAnimationFrame because the document-register-element polyfill
            // is using requestAnimationFrame to schedule lifecycle callbacks
            window.requestAnimationFrame(function () {
                nextFunctionToInvoke(done, callbacks, curr + 1);
            });
        } else if (curr === callbacks.length - 1) {
            done.call(undefined);
        } else {
            throw new Error('Problem executing multiple async callback list');
        }
    };

    // Using requestAnimationFrame because the document-register-element polyfill
    // is using requestAnimationFrame to schedule lifecycle callbacks
    window.requestAnimationFrame(function () {
        nextFunctionToInvoke(done, callbacks, 0);
    });
};

window.testHelpers.createWebAppTestHelper = function () {
    'use strict';

    var VI_REF = '',
        VI_NAME = 'test.gvi',
        PARENT_ID_FOR_VI = '';

    var webAppElement,
        viElement,
        updateService;

    var installWebAppFixture = function (done, viModelProviderCB) {
        if (typeof done !== 'function' || typeof viModelProviderCB !== 'function') {
            throw new Error('Must provide a function to invoke when finished attaching to DOM');
        }

        if (webAppElement !== undefined || viElement !== undefined) {
            throw new Error('installWebAppFixture has already been called for this webAppTestHelper');
        }

        var webAppElements = document.querySelectorAll('ni-web-application');

        if (webAppElements.length !== 0) {
            throw new Error('No other ni-web-application elements should be present when creating the fixture');
        }

        var viElements = document.querySelectorAll('ni-virtual-instrument');

        if (viElements.length !== 0) {
            throw new Error('No other ni-virtual-instrument elements should be present when creating the fixture');
        }

        webAppElement = document.createElement('ni-web-application');
        webAppElement.testMode = true;

        viElement = document.createElement('ni-virtual-instrument');
        viElement.viName = VI_NAME;
        viElement.viRef = VI_REF;

        webAppElement.appendChild(viElement);

        // Wait for service state to go to Running
        webAppElement.addEventListener('service-state-changed', function waitForRunningListener(evt) {
            var viModel, webAppModel;

            if (evt.detail.serviceState === NationalInstruments.HtmlVI.TestUpdateService.StateEnum.RUNNING) {
                webAppElement.removeEventListener('service-state-changed', waitForRunningListener);

                webAppModel = NationalInstruments.HtmlVI.webApplicationModelsService.getModel(webAppElement);

                updateService = webAppModel.updateService;

                viModel = NationalInstruments.HtmlVI.viReferenceService.getVIModelByVIRef(VI_REF);
                viModelProviderCB.call(undefined, viModel);

                // Let this event finish so the element lifecycle callbacks are settled before moving on
                testHelpers.runAsync(done, function () {
                    // Intentionally left blank
                });

            }
        });

        document.head.appendChild(webAppElement);
    };

    var removeWebAppFixture = function (done) {
        if (typeof done !== 'function') {
            throw new Error('Must provide a function to invoke when finished attaching to DOM');
        }

        // Wait for service state to go from Running to Ready
        webAppElement.addEventListener('service-state-changed', function waitForReadyListener(evt) {
            if (evt.detail.serviceState === NationalInstruments.HtmlVI.TestUpdateService.StateEnum.READY) {
                webAppElement.removeEventListener('service-state-changed', waitForReadyListener);

                webAppElement.parentNode.removeChild(webAppElement);
                webAppElement = undefined;
                viElement = undefined;
                updateService = undefined;

                // Let this event finish so the element lifecycle callbacks are settled before moving on
                testHelpers.runAsync(done, function () {
                    // Intentionally left blank
                });
            }
        });

        webAppElement.stop();
    };

    var createNIElement = function (settings, parentId) {
        if (updateService === undefined) {
            throw new Error('The method installWebAppFixture must be completed before createNIElement can be called');
        }

        var tagName = NationalInstruments.HtmlVI.NIModelProvider.modelKindToTagName(settings.kind);
        var selector = '[vi-ref="' + VI_REF + '"][ni-control-id="' + settings.niControlId + '"]';
        var validParentId = (typeof parentId === 'string') ? parentId : PARENT_ID_FOR_VI;

        // Should run and attach the element to the DOM synchronously (and the element attachedCallback will not have run yet)
        updateService.windowCallbacks.addElement.call(undefined, settings, tagName, settings.niControlId, VI_REF, validParentId);

        var controlElements = document.querySelectorAll(selector);
        return controlElements[0];
    };

    var removeNIElement = function (niControlId) {
        if (updateService === undefined) {
            throw new Error('The method installWebAppFixture must be completed before createNIElement can be called');
        }

        if (typeof niControlId !== 'string') {
            throw new Error('Expected niControlId to be a string');
        }

        updateService.windowCallbacks.removeElement.call(undefined, niControlId, VI_REF);
    };

    var dispatchMessage = function (niControlId, updateSettings) {
        if (updateService === undefined) {
            throw new Error('The method installWebAppFixture must be completed before createNIElement can be called');
        }

        if (typeof niControlId !== 'string') {
            throw new Error('Expected niControlId to be a string');
        }

        if (updateSettings === undefined || updateSettings === null) {
            throw new Error('Expected updateSettings to be an object with multiple properties to update on the target');
        }

        updateService.windowCallbacks.propertyChange.call(undefined, VI_NAME, niControlId, updateSettings);
    };

    return {
        installWebAppFixture: installWebAppFixture,
        createNIElement: createNIElement,
        removeNIElement: removeNIElement,
        dispatchMessage: dispatchMessage,
        removeWebAppFixture: removeWebAppFixture
    };

};
