describe('ValueChanged event tests', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var valueChangedEventRegisterAndUnregister = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeEventRegistration.via');
    var valueChangeEventOccurred = fixtures.convertToAbsoluteFromFixturesDir('events/ValueChangeStaticControlEvent.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            valueChangedEventRegisterAndUnregister,
            valueChangeEventOccurred
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    it('Verify registration callback is called on parse and unregister callback on exit', function (done) {
        var registerCallbackExecuted = false;
        var unregisterCallbackExecuted = false;
        vireo.controlEvents.setRegisterForControlEventsFunction(function (viName, controlId, eventId, eventOracleIndex) {
            expect(viName).toBe('ValueChangedEventRegisterAndUnregister');
            expect(controlId).toBe(18);
            expect(eventId).toBe(2);
            expect(eventOracleIndex).toBe(1);
            registerCallbackExecuted = true;
        });

        vireo.controlEvents.setUnRegisterForControlEventsFunction(function (viName, controlId, eventId, eventOracleIndex) {
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, valueChangeEventOccurred);
        vireo.eggShell.loadVia('enqueue(OccurEvent)');
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'OccurEvent');

        setTimeout(function () {
            vireo.eggShell.occurEvent(1, 18, 2);
        }, 20);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(true);
            expect(viPathParser('eventTimedOut')).toEqual(false);
            done();
        });
    });

    it('Verify that time out event occurs when value change is not triggered', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, valueChangeEventOccurred);
        vireo.eggShell.loadVia('enqueue(OccurEvent)');
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'OccurEvent');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('eventOccurred')).toEqual(false);
            expect(viPathParser('eventTimedOut')).toEqual(true);
            done();
        });
    });

    // TODO: Test cases to add:
    // trigger value changed event on a control that is not registered and make sure event code doesnt happen
    // multiple event listeners
    // two clumps waiting need to be both called
    // error cases
    // value changed for different types of controls
});
