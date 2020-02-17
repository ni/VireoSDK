// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo Control Event', function () {
    'use strict';

    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var valueChangedEventRegisterAndUnregister = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeEventRegistration.via');
    var valueChangedMultipleEventRegisterAndUnregister = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeMultipleEventRegistration.via');
    var updateBooleanOnValueChangeEvent = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeStaticControlEvent.via');
    var updateNumericOnValueChangeEvent = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeNumericStaticControlEvent.via');
    var updateMultipleEventStructuresOnValueChange = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeStaticControlEventWithMultipleRegistrations.via');
    var updateBooleanOnValueChangeEventJavaScriptRefNum = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeStaticControlEventJavaScriptRefNum.via');
    var updateBooleanOnValueChangeEventNullJavaScriptRefNum = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeStaticControlEventNullJavaScriptRefNum.via');

    var javaScriptRefNumObject = {};
    var getEventDataValueRef = function (viName, controlName) {
        return vireo.eggShell.findValueRef(viName, 'valueChangedEventData' + controlName);
    };

    var typeVisitor = (function () {
        return {
            visitCluster: function (valueRef, data) {
                var that = this;
                var valueRefObject = vireo.eggShell.readValueRefObject(valueRef);

                Object.keys(valueRefObject).forEach(function (name) {
                    vireo.eggShell.reflectOnValueRef(that, valueRefObject[name], data[name]);
                });
            },
            visitBoolean: function (valueRef, data) {
                vireo.eggShell.writeDouble(valueRef, data ? 1 : 0);
            },
            visitInt32: function (valueRef, data) {
                var dataNum = parseFloat(data);
                vireo.eggShell.writeDouble(valueRef, dataNum);
            }
        };
    }());

    var writeData = function (valueRef, data) {
        vireo.eggShell.reflectOnValueRef(typeVisitor, valueRef, data);
    };

    // Can be removed once we finish this task: https://ni.visualstudio.com/DevCentral/_workitems/edit/41574
    var waitForReadyDataItem = function (viPathParser) {
        return new Promise(function (resolve) {
            (function checkReady () {
                var ready = viPathParser('ready');
                if (!ready) {
                    setTimeout(checkReady, 0);
                } else {
                    resolve();
                }
            }());
        });
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            valueChangedEventRegisterAndUnregister,
            valueChangedMultipleEventRegisterAndUnregister,
            updateBooleanOnValueChangeEvent,
            updateNumericOnValueChangeEvent,
            updateMultipleEventStructuresOnValueChange,
            updateBooleanOnValueChangeEventJavaScriptRefNum,
            updateBooleanOnValueChangeEventNullJavaScriptRefNum
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
        vireo.eventHelpers.setRegisterForControlEventsFunction(function () {
            // no-op
        });
        vireo.eventHelpers.setUnRegisterForControlEventsFunction(function () {
            // no-op
        });
        vireo.javaScriptInvoke.registerInternalFunctions({
            GetJSRef: function (returnValueRef) {
                vireo.eggShell.writeJavaScriptRefNum(returnValueRef, javaScriptRefNumObject);
            }
        });
    });

    afterEach(function () {
        vireo = undefined;
    });

    it('registration callback is called on parse and unregister callback on exit', function (done) {
        var registerCallbackExecuted = false;
        var unregisterCallbackExecuted = false;
        vireo.eventHelpers.setRegisterForControlEventsFunction(function (viName, controlId, eventId, eventOracleIndex) {
            expect(viName).toBe('ValueChangedEventRegisterAndUnregister');
            expect(controlId).toBe(18);
            expect(eventId).toBe(2);
            expect(eventOracleIndex).toBe(1);
            registerCallbackExecuted = true;
        });

        vireo.eventHelpers.setUnRegisterForControlEventsFunction(function (viName, controlId, eventId, eventOracleIndex) {
            expect(viName).toBe('ValueChangedEventRegisterAndUnregister');
            expect(controlId).toBe(18);
            expect(eventId).toBe(2);
            expect(eventOracleIndex).toBe(1);
            unregisterCallbackExecuted = true;
        });

        expect(registerCallbackExecuted).toBeFalse();
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, valueChangedEventRegisterAndUnregister);
        expect(registerCallbackExecuted).toBeTrue();

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(unregisterCallbackExecuted).toBeTrue();
            done();
        });
    });

    it('registration and unregistration callbacks are called only once for each control/event combination', function (done) {
        var registerCallbackExecutedCount = 0;
        var unregisterCallbackExecutedCount = 0;
        vireo.eventHelpers.setRegisterForControlEventsFunction(function (viName, controlId, eventId, eventOracleIndex) {
            expect(viName).toBe('ValueChangedMultipleEventRegisterAndUnregister');
            expect(controlId).toBe(18);
            expect(eventId).toBe(2);
            expect(eventOracleIndex).toBe(1);
            registerCallbackExecutedCount += 1;
        });

        vireo.eventHelpers.setUnRegisterForControlEventsFunction(function (viName, controlId, eventId, eventOracleIndex) {
            expect(viName).toBe('ValueChangedMultipleEventRegisterAndUnregister');
            expect(controlId).toBe(18);
            expect(eventId).toBe(2);
            expect(eventOracleIndex).toBe(1);
            unregisterCallbackExecutedCount += 1;
        });

        expect(registerCallbackExecutedCount).toBe(0);
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, valueChangedMultipleEventRegisterAndUnregister);
        expect(registerCallbackExecutedCount).toBe(1);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(unregisterCallbackExecutedCount).toBe(1);
            done();
        });
    });

    it('occurrence updates boolean terminal value', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEvent);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateBooleanOnValueChangeEvent');

        var triggerEvent = async function () {
            await waitForReadyDataItem(viPathParser);
            const valueRef = getEventDataValueRef('UpdateBooleanOnValueChangeEvent', 'Bool');
            const data = {
                OldValue: false,
                NewValue: true
            };
            vireo.eventHelpers.occurEvent(1, 18, 2, writeData, valueRef, data);
        };

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(true);
            expect(viPathParser('eventTimedOut')).toEqual(false);
            done();
        });

        triggerEvent();
    });

    it('on an unregistered control does not update boolean terminal value', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEvent);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateBooleanOnValueChangeEvent');

        var unregisteredControlId = 19;
        var triggerEvent = async function () {
            await waitForReadyDataItem(viPathParser);
            const valueRef = getEventDataValueRef('UpdateBooleanOnValueChangeEvent', 'Bool');
            const data = {
                OldValue: false,
                NewValue: true
            };
            vireo.eventHelpers.occurEvent(1, unregisteredControlId, 2, writeData, valueRef, data);
        };

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(false);
            expect(viPathParser('eventTimedOut')).toEqual(true);
            done();
        });

        triggerEvent();
    });

    it('time out event occurs when value change is not triggered', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEvent);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateBooleanOnValueChangeEvent');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(false);
            expect(viPathParser('eventTimedOut')).toEqual(true);
            done();
        });
    });

    it('occurrence notifies all registered event structures', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateMultipleEventStructuresOnValueChange);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MultipleEventStructuresListeningToSameControl');

        var triggerEvent = async function () {
            await waitForReadyDataItem(viPathParser);
            const valueRef = getEventDataValueRef('MultipleEventStructuresListeningToSameControl', 'Bool');
            const data = {
                OldValue: false,
                NewValue: true
            };
            vireo.eventHelpers.occurEvent(1, 18, 2, writeData, valueRef, data);
        };

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventStructure1Notified')).toEqual(true);
            expect(viPathParser('eventStructure2Notified')).toEqual(true);
            done();
        });

        triggerEvent();
    });

    it('for value change occurrence passes correct old and new value', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateNumericOnValueChangeEvent);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateNumericOnValueChangeEvent');
        var oldValue = 12;
        var newValue = 13;

        var triggerEvent = async function () {
            await waitForReadyDataItem(viPathParser);
            const valueRef = getEventDataValueRef('UpdateNumericOnValueChangeEvent', 'Numeric');
            const data = {
                OldValue: oldValue,
                NewValue: newValue
            };
            vireo.eventHelpers.occurEvent(1, 18, 2, writeData, valueRef, data);
        };

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(true);
            expect(viPathParser('oldValueInEvent')).toEqual(oldValue);
            expect(viPathParser('newValueInEvent')).toEqual(newValue);
            expect(viPathParser('eventTimedOut')).toEqual(false);
            done();
        });

        triggerEvent();
    });

    it('occurrence updates boolean terminal value when using JavaScriptStaticRefNum', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEventJavaScriptRefNum);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateBooleanOnValueChangeEvent');
        var result = `Waiting on Events
Event occurred
`;

        var triggerEvent = async function () {
            await waitForReadyDataItem(viPathParser);
            const valueRef = getEventDataValueRef('UpdateBooleanOnValueChangeEvent', 'Bool');
            const data = {
                OldValue: false,
                NewValue: true
            };
            vireo.eventHelpers.occurEvent(1, 18, 2, writeData, valueRef, data);
        };

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(rawPrint).toMatchVtrText(result);
            done();
        });

        triggerEvent();
    });

    it('errors when JavaScriptStaticRefNum is left null', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEventNullJavaScriptRefNum);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(rawPrint).toBe('(Error "JavaScriptStaticRefNum must not be null.")\n');
            done();
        });
    });
});
