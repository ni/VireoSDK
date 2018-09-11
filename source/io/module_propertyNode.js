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
            errorTypePointer,
            errorDataPointer) {
            var newError = {
                status: false,
                code: ERRORS.NO_ERROR.CODE,
                source: ERRORS.NO_ERROR.MESSAGE
            };

            var viName = Module.eggShell.dataReadString(viNamePointer);
            var controlId = Module.eggShell.dataReadString(controlIdPointer);
            var propertyName = Module.eggShell.dataReadString(propertyNamePointer);
            var valueRef = Module.eggShell.createValueRef(tempVariableTypePointer, tempVariableDataPointer);
            var errorValueRef = Module.eggShell.createValueRef(errorTypePointer, errorDataPointer);

            try {
                writeProperty(viName, controlId, propertyName, valueRef);
            } catch (ex) {
                newError.status = true;
                newError.code = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                newError.source = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                newError.source = Module.coreHelpers.createSourceFromMessage(newError.source);
                Module.coreHelpers.mergeErrors(errorValueRef, newError);
                return;
            }
        };

        Module.propertyNode.jsPropertyNodeRead = function (
            viNamePointer,
            controlIdPointer,
            propertyNamePointer,
            tempVariableTypePointer,
            tempVariableDataPointer,
            errorTypePointer,
            errorDataPointer) {
            var newError = {
                status: false,
                code: ERRORS.NO_ERROR.CODE,
                source: ERRORS.NO_ERROR.MESSAGE
            };

            var viName = Module.eggShell.dataReadString(viNamePointer);
            var controlId = Module.eggShell.dataReadString(controlIdPointer);
            var propertyName = Module.eggShell.dataReadString(propertyNamePointer);
            var valueRef = Module.eggShell.createValueRef(tempVariableTypePointer, tempVariableDataPointer);
            var errorValueRef = Module.eggShell.createValueRef(errorTypePointer, errorDataPointer);

            try {
                readProperty(viName, controlId, propertyName, valueRef);
            } catch (ex) {
                newError.status = true;
                newError.code = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                newError.source = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                newError.source = Module.coreHelpers.createSourceFromMessage(newError.source);
                Module.coreHelpers.mergeErrors(errorValueRef, newError);
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
