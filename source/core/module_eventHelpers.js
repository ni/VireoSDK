var assignEventHelpers;
(function () {
    // Static Private Variables (all vireo instances)
    assignEventHelpers = function (Module, publicAPI) {
        Module.eventHelpers = {};
        publicAPI.eventHelpers = {};

        var registerForControlEvent = function () {
            throw new Error('No event registration callback was supplied');
        };
        var unRegisterForControlEvent = function () {
            throw new Error('No event un-registration callback was supplied');
        };

        Module.eventHelpers.jsRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var viName = Module.eggShell.dataReadString(viNamePointer);
            registerForControlEvent(viName, controlId, eventId, eventOracleIndex);
        };

        Module.eventHelpers.jsUnRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var viName = Module.eggShell.dataReadString(viNamePointer);
            unRegisterForControlEvent(viName, controlId, eventId, eventOracleIndex);
        };

        publicAPI.eventHelpers.setRegisterForControlEventsFunction = Module.eventHelpers.setRegisterForControlEventsFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('RegisterForControlEvents must be a callable function');
            }

            registerForControlEvent = fn;
        };

        publicAPI.eventHelpers.setUnRegisterForControlEventsFunction = Module.eventHelpers.setUnRegisterForControlEventsFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('UnRegisterForControlEvents must be a callable function');
            }

            unRegisterForControlEvent = fn;
        };

        publicAPI.eventHelpers.occurEvent = Module.eventHelpers.occurEvent = function (eventOracleIndex, controlId, eventType, writeCallback, eventDataTypeValueRef, eventData) {
            // Allocate space for the event data using the type information passed in to occurEvent
            var allocatedDataValueRef = Module.eggShell.allocateData(eventDataTypeValueRef.typeRef);
            writeCallback(allocatedDataValueRef, eventData);
            Module._OccurEvent(Module.eggShell.v_userShell, eventOracleIndex, controlId, eventType, allocatedDataValueRef.typeRef, allocatedDataValueRef.dataRef);
            // Now that the data has been passed to Vireo, which should copy it, deallocate the memory
            Module.eggShell.deallocateData(allocatedDataValueRef);
        };
    };
}());
export default assignEventHelpers;
