import staticHelpers from '../core/vireo.loader.staticHelpers.js';

var assignEggShell;
(function () {
    // Static Private Variables (all vireo instances)
    // None

    // Vireo Core Mixin Function
    assignEggShell = function (Module, publicAPI) {
        Module.eggShell = {};
        publicAPI.eggShell = {};

        Module.eggShell.readJavaScriptRefNum = publicAPI.eggShell.readJavaScriptRefNum = function (valueRef) {
            return Module.javaScriptInvoke.readJavaScriptRefNum(valueRef);
        };

        Module.eggShell.writeJavaScriptRefNum = publicAPI.eggShell.writeJavaScriptRefNum = function (valueRef, data) {
            return Module.javaScriptInvoke.writeJavaScriptRefNum(valueRef, data);
        };

        // Private Instance Variables (per vireo instance)
        var POINTER_SIZE = 4;
        var DOUBLE_SIZE = 8;
        var LENGTH_SIZE = 4;

        // Keep in sync with EggShellResult in CEntryPoints.h
        var EGGSHELL_RESULT = {
            SUCCESS: 0,
            OBJECT_NOT_FOUND_AT_PATH: 1,
            UNEXPECTED_OBJECT_TYPE: 2,
            INVALID_RESULT_POINTER: 3,
            UNABLE_TO_CREATE_RETURN_BUFFER: 4,
            INVALID_TYPE_REF: 5,
            MISMATCHED_ARRAY_RANK: 6,
            UNABLE_TO_PARSE_DATA: 7,
            UNABLE_TO_ALLOCATE_DATA: 8,
            UNABLE_TO_DEALLOCATE_DATA: 9,
            INVALID_DATA_POINTER: 10
        };
        var eggShellResultEnum = {};
        eggShellResultEnum[EGGSHELL_RESULT.SUCCESS] = 'Success';
        eggShellResultEnum[EGGSHELL_RESULT.OBJECT_NOT_FOUND_AT_PATH] = 'ObjectNotFoundAtPath';
        eggShellResultEnum[EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE] = 'UnexpectedObjectType';
        eggShellResultEnum[EGGSHELL_RESULT.INVALID_RESULT_POINTER] = 'InvalidResultPointer';
        eggShellResultEnum[EGGSHELL_RESULT.UNABLE_TO_CREATE_RETURN_BUFFER] = 'UnableToCreateReturnBuffer';
        eggShellResultEnum[EGGSHELL_RESULT.INVALID_TYPE_REF] = 'InvalidTypeRef';
        eggShellResultEnum[EGGSHELL_RESULT.MISMATCHED_ARRAY_RANK] = 'MismatchedArrayRank';
        eggShellResultEnum[EGGSHELL_RESULT.UNABLE_TO_PARSE_DATA] = 'UnableToParseData';
        eggShellResultEnum[EGGSHELL_RESULT.UNABLE_TO_ALLOCATE_DATA] = 'UnableToAllocateData';
        eggShellResultEnum[EGGSHELL_RESULT.UNABLE_TO_DEALLOCATE_DATA] = 'UnableToDeallocateData';
        eggShellResultEnum[EGGSHELL_RESULT.INVALID_DATA_POINTER] = 'InvalidDataPointer';

        // Keep in sync with NIError in DataTypes.h
        var niErrorEnum = {
            0: 'Success',
            1: 'InsufficientResources',
            2: 'ResourceNotFound',
            3: 'ArrayRankMismatch',
            4: 'CantDecode',
            5: 'CantEncode',
            6: 'LogicFailure',
            7: 'ValueTruncated'
        };

        // Create shell for vireo instance
        Module.eggShell.create = function (parentTypeManager) {
            return Module._EggShell_Create(parentTypeManager);
        };
        Module.eggShell.delete = function (typeManager) {
            Module._EggShell_Delete(typeManager);
        };
        Module.eggShell.v_root = Module.eggShell.create(0);
        Module.eggShell.v_userShell = Module.eggShell.create(Module.eggShell.v_root);

        // Exported functions
        publicAPI.eggShell.setPrintFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('Print must be a callable function');
            }

            Module.vireoPrint = fn;
        };

        publicAPI.eggShell.setPrintErrorFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('PrintError must be a callable function');
            }

            Module.vireoPrintErr = fn;
        };

        Module.eggShell.executeSlicesWakeUpCallback = function () {
            // By default do no action
        };

        publicAPI.eggShell.setExecuteSlicesWakeUpCallback = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('Execute slices wake-up callback must be a callable function');
            }

            Module.eggShell.executeSlicesWakeUpCallback = fn;
        };

        publicAPI.eggShell.internal_module_do_not_use_or_you_will_be_fired = Module;

        // Exporting functions to both Module.eggShell and publicAPI.eggShell is not normal
        // This is unique to the eggShell API as it is consumed by other modules as well as users
        Module.eggShell.maxExecWakeUpTime = publicAPI.eggShell.maxExecWakeUpTime = function () {
            return Module._Vireo_MaxExecWakeUpTime();
        };

        Module.eggShell.reboot = publicAPI.eggShell.reboot = function () {
            // TODO abort all http requests
            // TODO reset internal jsli functions
            Module.eggShell.delete(Module.eggShell.v_userShell);
            Module.eggShell.delete(Module.eggShell.v_root);
            Module.eggShell.v_root = Module.eggShell.create(0);
            Module.eggShell.v_userShell = Module.eggShell.create(Module.eggShell.v_root);
        };

        Module.eggShell.createValueRef = function (typeRef, dataRef) {
            if (typeof typeRef !== 'number' || typeof dataRef !== 'number' ||
                (typeRef <= 0 || dataRef <= 0)) {
                return undefined;
            }
            return Object.freeze({
                typeRef: typeRef,
                dataRef: dataRef
            });
        };

        Module.eggShell.allocateData = function (typeRef) {
            var stack = Module.stackSave();

            var dataStackPointer = Module.stackAlloc(POINTER_SIZE);
            var eggShellResult = Module._EggShell_AllocateData(Module.eggShell.v_userShell, typeRef, dataStackPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('A new ValueRef could not be allocated for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (typeRef: ' + typeRef + ')');
            }

            var dataRef = Module.getValue(dataStackPointer, 'i32');
            var allocatedValueRef = Module.eggShell.createValueRef(typeRef, dataRef);

            Module.stackRestore(stack);
            return allocatedValueRef;
        };

        Module.eggShell.deallocateData = function (valueRef) {
            var eggShellResult = Module._EggShell_DeallocateData(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('A ValueRef could not be deallocated for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }
        };

        Module.eggShell.reinitializeToDefault = publicAPI.eggShell.reinitializeToDefault = function (valueRef) {
            var eggShellResult = Module._EggShell_ReinitializeToDefault(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('The ValueRef could not be reinitialized to default for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')');
            }
        };

        Module.eggShell.findValueRef = publicAPI.eggShell.findValueRef = function (vi, path) {
            var stack = Module.stackSave();

            var viStackPointer = Module.coreHelpers.writeJSStringToStack(vi);
            var pathStackPointer = Module.coreHelpers.writeJSStringToStack(path);
            var typeStackPointer = Module.stackAlloc(POINTER_SIZE);
            var dataStackPointer = Module.stackAlloc(POINTER_SIZE);

            var eggShellResult = Module._EggShell_FindValue(Module.eggShell.v_userShell, viStackPointer, pathStackPointer, typeStackPointer, dataStackPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS && eggShellResult !== EGGSHELL_RESULT.OBJECT_NOT_FOUND_AT_PATH) {
                throw new Error('A ValueRef could not be made for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (vi name: ' + vi + ')' +
                    ' (path: ' + path + ')');
            }

            var typeRef, dataRef, valueRef;
            if (eggShellResult === EGGSHELL_RESULT.SUCCESS) {
                typeRef = Module.getValue(typeStackPointer, 'i32');
                dataRef = Module.getValue(dataStackPointer, 'i32');
                valueRef = Module.eggShell.createValueRef(typeRef, dataRef);
            } else {
                valueRef = undefined;
            }

            Module.stackRestore(stack);
            return valueRef;
        };

        Module.eggShell.findSubValueRef = publicAPI.eggShell.findSubValueRef = function (valueRef, subPath) {
            var stack = Module.stackSave();

            var subPathStackPointer = Module.coreHelpers.writeJSStringToStack(subPath);
            var typeStackPointer = Module.stackAlloc(POINTER_SIZE);
            var dataStackPointer = Module.stackAlloc(POINTER_SIZE);

            var eggShellResult = Module._EggShell_FindSubValue(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, subPathStackPointer, typeStackPointer, dataStackPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS && eggShellResult !== EGGSHELL_RESULT.OBJECT_NOT_FOUND_AT_PATH) {
                throw new Error('A ValueRef could not be made for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (type name: ' + Module.typeHelpers.typeName(valueRef.typeRef) + ')' +
                    ' (subpath: ' + subPath + ')');
            }

            var typeRef, dataRef, subValueRef;
            if (eggShellResult === EGGSHELL_RESULT.SUCCESS) {
                typeRef = Module.getValue(typeStackPointer, 'i32');
                dataRef = Module.getValue(dataStackPointer, 'i32');
                subValueRef = Module.eggShell.createValueRef(typeRef, dataRef);
            } else {
                subValueRef = undefined;
            }

            Module.stackRestore(stack);
            return subValueRef;
        };

        Module.eggShell.readValueRefObject = publicAPI.eggShell.readValueRefObject = function (valueRef) {
            var typeRef = valueRef.typeRef;
            var valueRefs = {};

            if (Module.typeHelpers.isCluster(typeRef) === false) {
                throw new Error('A ValueRefObject could not be made for the following reason: ' + eggShellResultEnum[EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE] +
                    ' (error code: ' + EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE + ')' +
                    ' (type name: ' + Module.typeHelpers.typeName(typeRef) + ')');
            }

            var fieldCount = Module.typeHelpers.subElementCount(typeRef);

            var fieldTypeRef, fieldNameEncoded, fieldName;
            for (var i = 0; i < fieldCount; i += 1) {
                fieldTypeRef = Module.typeHelpers.subElementByIndex(typeRef, i);
                fieldNameEncoded = Module.typeHelpers.elementName(fieldTypeRef);
                fieldName = staticHelpers.decodeIdentifier(fieldNameEncoded);
                valueRefs[fieldName] = Module.eggShell.findSubValueRef(valueRef, fieldNameEncoded);
            }

            return valueRefs;
        };

        Module.eggShell.reflectOnValueRef = publicAPI.eggShell.reflectOnValueRef = function (typeVisitor, valueRef, data) {
            if (typeof valueRef !== 'object' || valueRef === null) {
                throw new Error('valueRef must be an object. Found: ' + valueRef);
            }

            if (typeof typeVisitor !== 'object' || typeVisitor === null) {
                throw new Error('typeVisitor must be an object. Found: ' + typeVisitor);
            }

            var typeRef = valueRef.typeRef,
                dispatchFunction = Module.typeHelpers.findTypeDispatcher(typeRef);

            if (dispatchFunction === undefined) {
                throw new Error('Unexpected type. Is typeRef pointing to a valid type?. Type found: ' + typeRef === 0 ? 'invalid type' : Module.typeHelpers.typeName(typeRef));
            }

            return dispatchFunction(typeVisitor, valueRef, data);
        };

        Module.eggShell.testNeedsUpdateAndReset = publicAPI.eggShell.testNeedsUpdateAndReset = function (valueRef) {
            if (typeof valueRef !== 'object' || valueRef === null) {
                throw new Error('valueRef must be an object. Found: ' + valueRef);
            }

            return Module.typeHelpers.testNeedsUpdateAndReset(valueRef.typeRef);
        };

        Module.eggShell.testNeedsUpdateWithoutReset = function (valueRef) {
            if (typeof valueRef !== 'object' || valueRef === null) {
                throw new Error('valueRef must be an object. Found: ' + valueRef);
            }

            return Module.typeHelpers.testNeedsUpdateWithoutReset(valueRef.typeRef);
        };

        Module.eggShell.readDouble = publicAPI.eggShell.readDouble = function (valueRef) {
            var stack = Module.stackSave();
            var resultPointer = Module.stackAlloc(DOUBLE_SIZE);

            // TODO mraj should we try to resolve the typeref name on error for more context?
            var eggShellResult = Module._EggShell_ReadDouble(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, resultPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('Could not run readDouble for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }
            var result = Module.getValue(resultPointer, 'double');

            Module.stackRestore(stack);
            return result;
        };

        Module.eggShell.writeDouble = publicAPI.eggShell.writeDouble = function (valueRef, value) {
            if (typeof value !== 'number') {
                throw new Error('Expected value to write to be of type number, instead got: ' + value);
            }

            var eggShellResult = Module._EggShell_WriteDouble(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, value);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('Could not run writeDouble for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }
        };

        Module.eggShell.readJSON = publicAPI.eggShell.readJSON = function (valueRef) {
            var stack = Module.stackSave(); // Stack save only needed for input parameter string or array

            var type = 'JSON';
            var typeStackPointer = Module.coreHelpers.writeJSStringToStack(type);

            var stringTypeRef = Module.typeHelpers.findType('String');
            var jsonResponseValueRef = Module.eggShell.allocateData(stringTypeRef);
            var eggShellError = Module._EggShell_ReadValueString(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, typeStackPointer, jsonResponseValueRef.typeRef, jsonResponseValueRef.dataRef);
            if (eggShellError !== 0) {
                throw new Error('Performing readJSON failed for the following reason: ' + eggShellResultEnum[eggShellError] +
                    ' (error code: ' + eggShellError + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }

            var response = Module.eggShell.readString(jsonResponseValueRef);
            Module.eggShell.deallocateData(jsonResponseValueRef);
            Module.stackRestore(stack);
            return response;
        };

        Module.eggShell.writeJSON = publicAPI.eggShell.writeJSON = function (valueRef, value) {
            var stack = Module.stackSave();

            var type = 'JSON';
            var valueStackPointer = Module.coreHelpers.writeJSStringToHeap(value);
            var typeStackPointer = Module.coreHelpers.writeJSStringToStack(type);

            var eggShellError = Module._EggShell_WriteValueString(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, typeStackPointer, valueStackPointer);
            if (eggShellError !== 0) {
                throw new Error('Performing writeJSON failed for the following reason: ' + eggShellResultEnum[eggShellError] +
                    ' (error code: ' + eggShellError + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }

            Module._free(valueStackPointer);
            Module.stackRestore(stack);
        };

        Module.eggShell.dataGetArrayBegin = function (dataRef) {
            return Module._Data_GetArrayBegin(dataRef);
        };

        Module.eggShell.dataGetArrayLength = function (dataRef) {
            return Module._Data_GetArrayLength(dataRef);
        };

        Module.eggShell.readString = publicAPI.eggShell.readString = function (valueRef) {
            if (Module.typeHelpers.isString(valueRef.typeRef) === false) {
                throw new Error('Performing readString failed for the following reason: ' + eggShellResultEnum[EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE] +
                    ' (error code: ' + EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }
            var arrayBegin = Module.eggShell.dataGetArrayBegin(valueRef.dataRef);
            var totalLength = Module.eggShell.dataGetArrayLength(valueRef.dataRef);
            var result = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, arrayBegin, totalLength);
            return result;
        };

        Module.eggShell.writeString = publicAPI.eggShell.writeString = function (valueRef, inputString) {
            if (Module.typeHelpers.isString(valueRef.typeRef) === false) {
                throw new Error('Performing writeString failed for the following reason: ' + eggShellResultEnum[EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE] +
                    ' (error code: ' + EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }

            if (typeof inputString !== 'string') {
                throw new Error('Expected string input to be of type string, instead got: ' + inputString);
            }

            var strLength = Module.lengthBytesUTF8(inputString);
            Module.eggShell.resizeArray(valueRef, [strLength]);
            var typedArray = Module.eggShell.readTypedArray(valueRef);
            var bytesWritten = Module.coreHelpers.jsStringToSizedUTF8Array(inputString, typedArray, 0, strLength);
            if (bytesWritten !== strLength) {
                throw new Error('Could not write JS string to memory');
            }
        };

        var findCompatibleTypedArrayConstructor = function (typeRef) {
            var subTypeRef, isSigned, size;
            // String will go down the Array code path a bit as is so check before array checks
            if (Module.typeHelpers.isString(typeRef)) {
                return Uint8Array; // exposes UTF-8 encoded array to client
            } else if (Module.typeHelpers.isArray(typeRef)) {
                subTypeRef = Module.typeHelpers.subElementByIndex(typeRef, 0);
                if (Module.typeHelpers.isBoolean(subTypeRef)) {
                    return Uint8Array;
                } else if (Module.typeHelpers.isInteger(subTypeRef)) { // Used for Enums and Integers
                    isSigned = Module.typeHelpers.isSigned(subTypeRef);
                    size = Module.typeHelpers.topAQSize(subTypeRef);
                    if (isSigned === true) {
                        switch (size) {
                        case 1:
                            return Int8Array;
                        case 2:
                            return Int16Array;
                        case 4:
                            return Int32Array;
                        default:
                            return undefined;
                        }
                    } else {
                        switch (size) {
                        case 1:
                            return Uint8Array;
                        case 2:
                            return Uint16Array;
                        case 4:
                            return Uint32Array;
                        default:
                            return undefined;
                        }
                    }
                } else if (Module.typeHelpers.isFloat(subTypeRef)) {
                    size = Module.typeHelpers.topAQSize(subTypeRef);
                    switch (size) {
                    case 4:
                        return Float32Array;
                    case 8:
                        return Float64Array;
                    default:
                        return undefined;
                    }
                }
            }
            return undefined;
        };

        Module.eggShell.isTypedArrayCompatible = publicAPI.eggShell.isTypedArrayCompatible = function (valueRef) {
            return findCompatibleTypedArrayConstructor(valueRef.typeRef) !== undefined;
        };

        Module.eggShell.getArrayDimensions = publicAPI.eggShell.getArrayDimensions = function (valueRef) {
            if (!Module.typeHelpers.isArray(valueRef.typeRef)) {
                throw new Error('Performing getArrayDimensions failed for the following reason: ' + eggShellResultEnum[EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE] +
                    ' (error code: ' + EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }

            var rank = Module.typeHelpers.typeRank(valueRef.typeRef);
            var stack = Module.stackSave();
            var dimensionsPointer = Module.stackAlloc(rank * LENGTH_SIZE);
            Module._Data_GetArrayDimensions(valueRef.dataRef, dimensionsPointer);
            var dimensions = [];
            var i;
            for (i = 0; i < rank; i += 1) {
                dimensions.push(Module.getValue(dimensionsPointer + (i * LENGTH_SIZE), 'i32'));
            }
            Module.stackRestore(stack);

            return dimensions;
        };

        Module.eggShell.readTypedArray = publicAPI.eggShell.readTypedArray = function (valueRef) {
            var TypedArrayConstructor = findCompatibleTypedArrayConstructor(valueRef.typeRef);
            if (TypedArrayConstructor === undefined) {
                throw new Error('Performing readTypedArray failed for the following reason: ' + eggShellResultEnum[EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE] +
                    ' (error code: ' + EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }
            var arrayBegin = Module.eggShell.dataGetArrayBegin(valueRef.dataRef);
            var totalLength = Module.eggShell.dataGetArrayLength(valueRef.dataRef);
            var typedArray = new TypedArrayConstructor(Module.HEAP8.buffer, arrayBegin, totalLength);
            return typedArray;
        };

        Module.eggShell.isSupportedAndCompatibleArrayType = function (valueRef, typedArrayValue) {
            var TypedArrayConstructor = findCompatibleTypedArrayConstructor(valueRef.typeRef);
            return (TypedArrayConstructor !== undefined && typedArrayValue instanceof TypedArrayConstructor);
        };

        Module.eggShell.writeTypedArray = publicAPI.eggShell.writeTypedArray = function (valueRef, typedArrayValue) {
            var TypedArrayConstructor = findCompatibleTypedArrayConstructor(valueRef.typeRef);
            if (TypedArrayConstructor === undefined || !(typedArrayValue instanceof TypedArrayConstructor)) {
                throw new Error('Performing writeTypedArray failed for the following reason: ' + eggShellResultEnum[EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE] +
                    ' (error code: ' + EGGSHELL_RESULT.UNEXPECTED_OBJECT_TYPE + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }

            var arrayTotalLength = Module.eggShell.dataGetArrayLength(valueRef.dataRef);
            var totalLength = typedArrayValue.length;
            if (totalLength !== arrayTotalLength) {
                throw new Error('TypedArray total length must be ' + arrayTotalLength + ' instead got ' + totalLength);
            }
            var arrayBegin = Module.eggShell.dataGetArrayBegin(valueRef.dataRef);
            var typedArray = new TypedArrayConstructor(Module.HEAP8.buffer, arrayBegin, totalLength);
            typedArray.set(typedArrayValue);
        };

        Module.eggShell.resizeArray = publicAPI.eggShell.resizeArray = function (valueRef, newDimensions) {
            if (!Array.isArray(newDimensions)) {
                throw new Error('Expected newDimensions to be an array of dimension lengths, instead got: ' + newDimensions);
            }
            var stack = Module.stackSave();
            var newDimensionsLength = newDimensions.length;
            var dimensionsPointer = Module.stackAlloc(newDimensionsLength * LENGTH_SIZE);
            var i, currentDimension;
            for (i = 0; i < newDimensionsLength; i += 1) {
                currentDimension = newDimensions[i];

                if (typeof currentDimension !== 'number') {
                    throw new Error('Expected all dimensions of newDimensions to be numeric values for dimension length, instead got' + currentDimension);
                }
                Module.setValue(dimensionsPointer + (i * LENGTH_SIZE), currentDimension, 'i32');
            }
            var eggShellResult = Module._EggShell_ResizeArray(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, newDimensionsLength, dimensionsPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('Resizing the array failed for the following reason: ' + eggShellResultEnum[eggShellResult] +
                ' (error code: ' + eggShellResult + ')' +
                ' (typeRef: ' + valueRef.typeRef + ')' +
                ' (dataRef: ' + valueRef.dataRef + ')');
            }
            Module.stackRestore(stack);
        };

        Module.eggShell.getVariantAttribute = publicAPI.eggShell.getVariantAttribute = function (valueRef, attributeName) {
            var stack = Module.stackSave();

            var attributeNameStackPointer = Module.coreHelpers.writeJSStringToStack(attributeName);
            var typeStackPointer = Module.stackAlloc(POINTER_SIZE);
            var dataStackPointer = Module.stackAlloc(POINTER_SIZE);

            var eggShellResult = Module._EggShell_GetVariantAttribute(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, attributeNameStackPointer, typeStackPointer, dataStackPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS && eggShellResult !== EGGSHELL_RESULT.OBJECT_NOT_FOUND_AT_PATH) {
                throw new Error('Could not get variant attribute for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (type name: ' + Module.typeHelpers.typeName(valueRef.typeRef) + ')' +
                    ' (subpath: ' + attributeName + ')');
            }

            var typeRef, dataRef, resultValueRef;
            if (eggShellResult === EGGSHELL_RESULT.SUCCESS) {
                typeRef = Module.getValue(typeStackPointer, 'i32');
                dataRef = Module.getValue(dataStackPointer, 'i32');
                resultValueRef = Module.eggShell.createValueRef(typeRef, dataRef);
            } else {
                resultValueRef = undefined;
            }

            Module.stackRestore(stack);
            return resultValueRef;
        };

        // Note: Not exported as public api does not have ability to allocate arbitrary types
        // Instead call setVariantAttributeAs<Typename> for current allocatable types as variant attributes
        Module.eggShell.setVariantAttribute = function (valueRef, attributeName, attributeValueRef) {
            var stack = Module.stackSave();

            var attributeNameStackPointer = Module.coreHelpers.writeJSStringToStack(attributeName);
            var eggShellResult = Module._EggShell_SetVariantAttribute(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, attributeNameStackPointer, attributeValueRef.typeRef, attributeValueRef.dataRef);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('Could not set variant attribute for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (type name: ' + Module.typeHelpers.typeName(valueRef.typeRef) + ')' +
                    ' (subpath: ' + attributeName + ')');
            }
            Module.stackRestore(stack);
        };

        Module.eggShell.setVariantAttributeAsString = publicAPI.eggShell.setVariantAttributeAsString = function (valueRef, attributeName, attributeValueString) {
            var stringTypeRef = Module.typeHelpers.findType('String');
            var attributeValueRef = Module.eggShell.allocateData(stringTypeRef);
            Module.eggShell.writeString(attributeValueRef, attributeValueString);
            Module.eggShell.setVariantAttribute(valueRef, attributeName, attributeValueRef);
            Module.eggShell.deallocateData(attributeValueRef);
        };

        Module.eggShell.deleteVariantAttribute = publicAPI.eggShell.deleteVariantAttribute = function (valueRef, attributeName) {
            var stack = Module.stackSave();

            var attributeNameStackPointer = Module.coreHelpers.writeJSStringToStack(attributeName);
            var eggShellResult = Module._EggShell_DeleteVariantAttribute(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, attributeNameStackPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS && eggShellResult !== EGGSHELL_RESULT.OBJECT_NOT_FOUND_AT_PATH) {
                throw new Error('Could not delete variant attribute for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (type name: ' + Module.typeHelpers.typeName(valueRef.typeRef) + ')' +
                    ' (subpath: ' + attributeName + ')');
            }
            var found = eggShellResult !== EGGSHELL_RESULT.OBJECT_NOT_FOUND_AT_PATH;

            Module.stackRestore(stack);
            return found;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadString = function (stringPointer) {
            var begin = Module._Data_GetStringBegin(stringPointer);
            var length = Module._Data_GetStringLength(stringPointer);
            var str = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, begin, length);
            return str;
        };

        Module.eggShell.loadVia = publicAPI.eggShell.loadVia = function (viaText) {
            if (typeof viaText !== 'string') {
                throw new Error('Expected viaText to be a string');
            }

            if (viaText.length === 0) {
                throw new Error('Empty viaText provided, nothing to run');
            }

            var viaTextLength = Module.lengthBytesUTF8(viaText);
            var viaTextPointer = Module.coreHelpers.writeJSStringToHeap(viaText);

            var printText = '',
                printTextErr = '';
            var origPrint = Module.print,
                origPrintErr = Module.printErr;

            Module.print = function (text) {
                printText += text + '\n';
                origPrint(text);
            };

            Module.printErr = function (textErr) {
                printTextErr += textErr + '\n';
                origPrintErr(textErr);
            };

            var result = Module._EggShell_REPL(Module.eggShell.v_userShell, viaTextPointer, viaTextLength);
            Module._free(viaTextPointer);
            Module.print = origPrint;
            Module.printErr = origPrintErr;

            if (result !== 0) {
                throw new Error('Loading VIA failed for the following reason: ' + niErrorEnum[result] +
                    ' (error code: ' + result + ')' +
                    ' (stdout: ' + printText + ')' +
                    ' (stderr: ' + printTextErr + ')');
            }
        };

        // executeSlicesUntilWait
        // numSlices (optional): The minimum number of slice sets to run before checking if maxTimeMS has passed.
        //    The larger the value the less overhead for execution and the quicker the diagram progresses
        //    One slice set corresponds to 10 slices and at a minimum one slice set executes per invocation
        // millisecondsToRun (optional): The amount of time in milliseconds vireo can execute slice sets before vireo saves state and returns
        // return value (type ExecSlicesResult):
        //     returns < 0 if should be called again ASAP, 0 if nothing to run, or positive value N if okay
        //     to delay up to N milliseconds before calling again
        Module.eggShell.executeSlicesUntilWait = publicAPI.eggShell.executeSlicesUntilWait = function (numSlices, millisecondsToRun) {
            return Module._EggShell_ExecuteSlices(Module.eggShell.v_userShell, numSlices, millisecondsToRun);
        };

        // Pumps vireo asynchronously until the currently loaded via has finished all clumps
        // Runs synchronously for a maximum of 4ms at a time to cooperate with browser and node.js execution environments
        // A good starting point for most vireo uses but can be copied and modified as needed
        // Returns a Promise that is resolved when execution has completed or reject when an error has occurred
        Module.eggShell.executeSlicesUntilClumpsFinished = publicAPI.eggShell.executeSlicesUntilClumpsFinished = function (originalCallback) {
            if (originalCallback !== undefined) {
                throw new Error('The executeSlicesUntilClumpsFinished function no longer takes a callback and instead returns a Promise');
            }
            // These numbers may still need tuning.  They should also match the numbers in native
            // in CommandLine/main.cpp.  SLICE_SETS was lowered from 100000 because that was starving
            // other clumps and running too long before checking the timer.
            var SLICE_SETS_PER_TIME_CHECK = 10000;
            var MAXIMUM_VIREO_EXECUTION_TIME_MS = 4;
            var origExecuteSlicesWakeUpCallback = Module.eggShell.executeSlicesWakeUpCallback;

            var vireoResolve, vireoReject;
            var executionFinishedPromise = new Promise(function (resolve, reject) {
                var cleanup = function () {
                    Module.eggShell.executeSlicesWakeUpCallback = origExecuteSlicesWakeUpCallback;
                };

                vireoResolve = function () {
                    cleanup();
                    resolve.apply(undefined, arguments);
                };

                vireoReject = function () {
                    cleanup();
                    reject.apply(undefined, arguments);
                };
            });

            var timerToken;
            var runExecuteSlicesAsync = function () {
                var execSlicesResult;
                try {
                    execSlicesResult = Module.eggShell.executeSlicesUntilWait(SLICE_SETS_PER_TIME_CHECK, MAXIMUM_VIREO_EXECUTION_TIME_MS);
                } catch (ex) {
                    timerToken = undefined;
                    setTimeout(vireoReject, 0, ex);
                    return;
                }

                if (execSlicesResult > 0) {
                    timerToken = setTimeout(runExecuteSlicesAsync, execSlicesResult);
                } else if (execSlicesResult < 0) {
                    timerToken = setTimeout(runExecuteSlicesAsync, 0);
                } else {
                    timerToken = undefined;
                    setTimeout(vireoResolve, 0);
                }
            };

            Module.eggShell.executeSlicesWakeUpCallback = function () {
                origExecuteSlicesWakeUpCallback();
                if (timerToken === undefined) {
                    console.error('Attempted to wake up Vireo runtime but Vireo is not waiting');
                } else {
                    clearTimeout(timerToken);
                    timerToken = undefined;
                    runExecuteSlicesAsync();
                }
            };

            // Queue a microtask for starting execution
            Promise.resolve().then(function () {
                runExecuteSlicesAsync();
            });

            return executionFinishedPromise;
        };

        Module.eggShell.setOccurrenceAsync = function (occurrence) {
            // TODO mraj currently setOccurrenceAsync is only called
            // by relatively slow operation, may need to change from setTimeout
            // to improve performance in the future
            setTimeout(function () {
                Module._Occurrence_Set(occurrence);
                Module.eggShell.executeSlicesWakeUpCallback.call(undefined);
            }, 0);
        };

        Module.eggShell.setOccurrence = function (occurrence) {
            Module._Occurrence_Set(occurrence);
        };
    };
}());
export default assignEggShell;
