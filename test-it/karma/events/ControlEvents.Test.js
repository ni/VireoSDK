describe('ValueChanged event tests', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var valueChangedEventRegisterAndUnregister = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeEventRegistration.via');
    var updateBooleanOnValueChangeEvent = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeStaticControlEvent.via');
    var updateMultipleEventStructuresOnValueChange = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeStaticControlEventWithMultipleRegistrations.via');

    var getEventDataValueRef = function(viName) {
        return vireo.eggShell.findValueRef(viName, "valueChangedEventDataBool");
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            valueChangedEventRegisterAndUnregister,
            updateBooleanOnValueChangeEvent,
            updateMultipleEventStructuresOnValueChange
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
        vireo.eventHelpers.setRegisterForControlEventsFunction(function () {
            // no-op
        });
        vireo.eventHelpers.setUnRegisterForControlEventsFunction(function () {
            // no-op
        });
        vireo.eventHelpers.setWriteEventDataFunction(function (valueRef, eventData) {
            vireo.eggShell.writeJSON(valueRef, JSON.stringify(eventData));
        });
    });

    it('Verify registration callback is called on parse and unregister callback on exit', function (done) {
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

    it('Verify event occurrence updates boolean terminal value', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEvent);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateBooleanOnValueChangeEvent');

        setTimeout(function () {
            const valueRef = getEventDataValueRef("UpdateBooleanOnValueChangeEvent")
            const data = { OldValue:false, NewValue:true };
            vireo.eventHelpers.occurEvent(1, 18, 2, valueRef, data);
        }, 20);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(true);
            expect(viPathParser('eventTimedOut')).toEqual(false);
            done();
        });
    });

    it('Verify value change on an unregistered control does not update boolean terminal value', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEvent);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateBooleanOnValueChangeEvent');

        var unregisteredControlId = 19;
        setTimeout(function () {
            const valueRef = getEventDataValueRef('UpdateBooleanOnValueChangeEvent')
            const data = { OldValue:false, NewValue:true };
            vireo.eventHelpers.occurEvent(1, unregisteredControlId, 2, valueRef, data);
        }, 20);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(false);
            expect(viPathParser('eventTimedOut')).toEqual(true);
            done();
        });
    });

    it('Verify that time out event occurs when value change is not triggered', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateBooleanOnValueChangeEvent);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'UpdateBooleanOnValueChangeEvent');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(false);
            expect(viPathParser('eventTimedOut')).toEqual(true);
            done();
        });
    });

    it('Verify event occurrence notifies all registered event structures', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, updateMultipleEventStructuresOnValueChange);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MultipleEventStructuresListeningToSameControl');

        setTimeout(function () {
            const valueRef = getEventDataValueRef('MultipleEventStructuresListeningToSameControl')
            const data = { OldValue:false, NewValue:true };
            vireo.eventHelpers.occurEvent(1, 18, 2, valueRef, data);
        }, 20);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventStructure1Notified')).toEqual(true);
            expect(viPathParser('eventStructure2Notified')).toEqual(true);
            done();
        });
    });
});
