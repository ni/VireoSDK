var assignPropertyNode;
(function () {
    // Static Private Variables (all vireo instances)
    var ERRORS = {
        // Shared
        NO_ERROR: {
            CODE: 0,
            MESSAGE: ''
        },

        kNIObjectReferenceIsInvalid: {
            CODE: 1055,
            MESSAGE: 'Object reference is invalid.'
        }
    };

    // Vireo Core Mixin Function
    assignPropertyNode = function (Module, publicAPI) {
        Module.propertyNode = {};
        publicAPI.propertyNode = {};

        var readProperty = function () {
            // Dummy no-op function.
        };

        var writeProperty = function () {
            // Dummy no-op function.
        };

        // Private Instance Variables (per vireo instance)
        Module.propertyNode.jsPropertyNodeWrite = function (
            viNamePointer,
            controlIdPointer,
            propertyNamePointer,
            tempVariableTypePointer,
            tempVariableDataPointer,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var viName = Module.eggShell.dataReadString(viNamePointer);
            var controlId = Module.eggShell.dataReadString(controlIdPointer);
            var propertyName = Module.eggShell.dataReadString(propertyNamePointer);
            var valueRef = Module.eggShell.createValueRef(tempVariableTypePointer, tempVariableDataPointer);

            try {
                writeProperty(viName, controlId, propertyName, valueRef);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                newErrorSource = Module.coreHelpers.createSourceFromMessage(newErrorSource);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }
        };

        Module.propertyNode.jsPropertyNodeRead = function (
            viNamePointer,
            controlIdPointer,
            propertyNamePointer,
            tempVariableTypePointer,
            tempVariableDataPointer,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var viName = Module.eggShell.dataReadString(viNamePointer);
            var controlId = Module.eggShell.dataReadString(controlIdPointer);
            var propertyName = Module.eggShell.dataReadString(propertyNamePointer);
            var valueRef = Module.eggShell.createValueRef(tempVariableTypePointer, tempVariableDataPointer);

            try {
                readProperty(viName, controlId, propertyName, valueRef);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                newErrorSource = Module.coreHelpers.createSourceFromMessage(newErrorSource);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }
        };

        publicAPI.propertyNode.setPropertyReadFunction = Module.propertyNode.setPropertyReadFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('PropertyRead must be a callable function');
            }

            readProperty = fn;
        };

        publicAPI.propertyNode.setPropertyWriteFunction = Module.propertyNode.setPropertyWriteFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('PropertyWrite must be a callable function');
            }

            writeProperty = fn;
        };
    };
}());
export default assignPropertyNode;
