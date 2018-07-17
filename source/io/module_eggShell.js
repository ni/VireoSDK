// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? (currObj[subNamespace] = nextValue) : currObj[subNamespace];
        }, root);
    };

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a named module.
        define(globalName, [], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        buildGlobalNamespace();
    }
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignEggShell', function () {
    'use strict';
    // Static Private Variables (all vireo instances)
    // None

    // Vireo Core Mixin Function
    var assignEggShell = function (Module, publicAPI) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'Vireo_Version',
            'Vireo_MaxExecWakeUpTime',
            'EggShell_Create',
            'EggShell_Delete',
            'EggShell_GetPointer',
            'EggShell_GetArrayDimLength',
            'Data_ValidateArrayType',
            'Data_GetStringBegin',
            'Data_GetStringLength',
            'Data_ReadBoolean',
            'Data_ReadInt8',
            'Data_ReadInt16',
            'Data_ReadInt32',
            'Data_ReadUInt8',
            'Data_ReadUInt16',
            'Data_ReadUInt32',
            'Data_ReadSingle',
            'Data_ReadDouble',
            'Data_GetArrayMetadata',
            'Data_GetArrayDimLength',
            'Data_WriteBoolean',
            'Data_WriteString',
            'Data_WriteStringFromArray',
            'Data_WriteInt8',
            'Data_WriteInt16',
            'Data_WriteInt32',
            'Data_WriteUInt8',
            'Data_WriteUInt16',
            'Data_WriteUInt32',
            'Data_WriteSingle',
            'Data_WriteDouble',
            'Data_ResizeArray',
            'EggShell_REPL',
            'EggShell_ExecuteSlices',
            'Occurrence_Set',
            'Pointer_stringify'
        ]}], */

        Module.eggShell = {};
        publicAPI.eggShell = {};

        // Private Instance Variables (per vireo instance)
        var NULL = 0;
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

        var Vireo_Version = Module.cwrap('Vireo_Version', 'number', []);
        var Vireo_MaxExecWakeUpTime = Module.cwrap('Vireo_MaxExecWakeUpTime', 'number', []);
        var EggShell_Create = Module.cwrap('EggShell_Create', 'number', ['number']);
        var EggShell_Delete = Module.cwrap('EggShell_Delete', 'number', ['number']);
        var EggShell_GetPointer = Module.cwrap('EggShell_GetPointer', 'number', ['number', 'string', 'string', 'number', 'number']);
        var EggShell_GetArrayDimLength = Module.cwrap('EggShell_GetArrayDimLength', 'number', ['number', 'string', 'string', 'number']);
        var Data_ValidateArrayType = Module.cwrap('Data_ValidateArrayType', 'number', ['number', 'number']);
        var Data_GetStringBegin = Module.cwrap('Data_GetStringBegin', 'number', []);
        var Data_GetStringLength = Module.cwrap('Data_GetStringLength', 'number', []);
        var Data_WriteString = Module.cwrap('Data_WriteString', 'void', ['number', 'number', 'string', 'number']);
        var Data_ReadBoolean = Module.cwrap('Data_ReadBoolean', 'number', ['number']);
        var Data_ReadInt8 = Module.cwrap('Data_ReadInt8', 'number', ['number']);
        var Data_ReadInt16 = Module.cwrap('Data_ReadInt16', 'number', ['number']);
        var Data_ReadInt32 = Module.cwrap('Data_ReadInt32', 'number', ['number']);
        var Data_ReadUInt8 = Module.cwrap('Data_ReadUInt8', 'number', ['number']);
        var Data_ReadUInt16 = Module.cwrap('Data_ReadUInt16', 'number', ['number']);
        var Data_ReadUInt32 = Module.cwrap('Data_ReadUInt32', 'number', ['number']);
        var Data_ReadSingle = Module.cwrap('Data_ReadSingle', 'number', ['number']);
        var Data_ReadDouble = Module.cwrap('Data_ReadDouble', 'number', ['number']);
        var Data_GetArrayMetadata = Module.cwrap('Data_GetArrayMetadata', 'number', ['number', 'number', 'number', 'number', 'number']);
        var Data_GetArrayDimLength = Module.cwrap('Data_GetArrayDimLength', 'number', ['number', 'number', 'number']);
        var Data_ResizeArray = Module.cwrap('Data_ResizeArray', 'number', ['number', 'number', 'number', 'number']);
        var Data_WriteBoolean = Module.cwrap('Data_WriteBoolean', 'void', ['number', 'number']);
        var Data_WriteInt8 = Module.cwrap('Data_WriteInt8', 'void', ['number', 'number']);
        var Data_WriteInt16 = Module.cwrap('Data_WriteInt16', 'void', ['number', 'number']);
        var Data_WriteInt32 = Module.cwrap('Data_WriteInt32', 'void', ['number', 'number']);
        var Data_WriteUInt8 = Module.cwrap('Data_WriteUInt8', 'void', ['number', 'number']);
        var Data_WriteUInt16 = Module.cwrap('Data_WriteUInt16', 'void', ['number', 'number']);
        var Data_WriteUInt32 = Module.cwrap('Data_WriteUInt32', 'void', ['number', 'number']);
        var Data_WriteSingle = Module.cwrap('Data_WriteSingle', 'void', ['number', 'number']);
        var Data_WriteDouble = Module.cwrap('Data_WriteDouble', 'void', ['number', 'number']);
        var EggShell_ExecuteSlices = Module.cwrap('EggShell_ExecuteSlices', 'number', ['number', 'number', 'number']);
        var Occurrence_Set = Module.cwrap('Occurrence_Set', 'void', ['number']);

        // Create shell for vireo instance
        Module.eggShell.v_root = EggShell_Create(0);
        Module.eggShell.v_userShell = EggShell_Create(Module.eggShell.v_root);

        // Exported functions
        Module.print = function (text) {
            console.log(text);
        };

        Module.printErr = function (text) {
            console.error(text);
        };

        publicAPI.eggShell.setPrintFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('Print must be a callable function');
            }

            Module.print = fn;
        };

        publicAPI.eggShell.setPrintErrorFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('PrintError must be a callable function');
            }

            Module.printErr = fn;
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
        Module.eggShell.version = publicAPI.eggShell.version = Vireo_Version;
        Module.eggShell.maxExecWakeUpTime = publicAPI.eggShell.maxExecWakeUpTime = Vireo_MaxExecWakeUpTime;

        Module.eggShell.reboot = publicAPI.eggShell.reboot = function () {
            EggShell_Delete(Module.eggShell.v_userShell);
            EggShell_Delete(Module.eggShell.v_root);
            Module.eggShell.v_root = EggShell_Create(0);
            Module.eggShell.v_userShell = EggShell_Create(Module.eggShell.v_root);
        };

        Module.eggShell.createValueRef = function (typeRef, dataRef) {
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

        Module.eggShell.findValueRef = publicAPI.eggShell.findValueRef = function (vi, path) {
            var stack = Module.stackSave();

            var viStackPointer = Module.coreHelpers.writeJSStringToStack(vi);
            var pathStackPointer = Module.coreHelpers.writeJSStringToStack(path);
            var typeStackPointer = Module.stackAlloc(POINTER_SIZE);
            var dataStackPointer = Module.stackAlloc(POINTER_SIZE);

            var eggShellResult = Module._EggShell_FindValue(Module.eggShell.v_userShell, viStackPointer, pathStackPointer, typeStackPointer, dataStackPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('A ValueRef could not be made for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (vi name: ' + vi + ')' +
                    ' (path: ' + path + ')');
            }

            var typeRef = Module.getValue(typeStackPointer, 'i32');
            var dataRef = Module.getValue(dataStackPointer, 'i32');
            var valueRef = Module.eggShell.createValueRef(typeRef, dataRef);

            Module.stackRestore(stack);
            return valueRef;
        };

        Module.eggShell.findSubValueRef = publicAPI.eggShell.findSubValueRef = function (valueRef, subPath) {
            var stack = Module.stackSave();

            var subPathStackPointer = Module.coreHelpers.writeJSStringToStack(subPath);
            var typeStackPointer = Module.stackAlloc(POINTER_SIZE);
            var dataStackPointer = Module.stackAlloc(POINTER_SIZE);

            var eggShellResult = Module._EggShell_FindSubValue(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, subPathStackPointer, typeStackPointer, dataStackPointer);
            if (eggShellResult !== EGGSHELL_RESULT.SUCCESS) {
                throw new Error('A ValueRef could not be made for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (type name: ' + Module.typeHelpers.typeName(valueRef.typeRef) + ')' +
                    ' (subpath: ' + subPath + ')');
            }

            var typeRef = Module.getValue(typeStackPointer, 'i32');
            var dataRef = Module.getValue(dataStackPointer, 'i32');
            var subValueRef = Module.eggShell.createValueRef(typeRef, dataRef);

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
                fieldName = Module.Vireo.decodeIdentifier(fieldNameEncoded);
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
            var jsonStackDoublePointer = Module.stackAlloc(POINTER_SIZE);
            var typeStackPointer = Module.coreHelpers.writeJSStringToStack(type);

            var eggShellError = Module._EggShell_ReadValueString(Module.eggShell.v_userShell, valueRef.typeRef, valueRef.dataRef, typeStackPointer, jsonStackDoublePointer);

            if (eggShellError !== 0) {
                throw new Error('Performing readJSON failed for the following reason: ' + eggShellResultEnum[eggShellError] +
                    ' (error code: ' + eggShellError + ')' +
                    ' (typeRef: ' + valueRef.typeRef + ')' +
                    ' (dataRef: ' + valueRef.dataRef + ')');
            }

            var jsonStackPointer = Module.getValue(jsonStackDoublePointer, 'i32');
            var responseLength = Module.coreHelpers.findCStringLength(Module.HEAPU8, jsonStackPointer);
            var response = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, jsonStackPointer, responseLength);

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

        var supportedArrayTypeConfig = {
            Int8: {
                heap: Module.HEAP8,
                constructorFunction: Int8Array
            },
            Int16: {
                heap: Module.HEAP16,
                constructorFunction: Int16Array
            },
            Int32: {
                heap: Module.HEAP32,
                constructorFunction: Int32Array
            },
            UInt8: {
                heap: Module.HEAPU8,
                constructorFunction: Uint8Array
            },
            UInt16: {
                heap: Module.HEAPU16,
                constructorFunction: Uint16Array
            },
            UInt32: {
                heap: Module.HEAPU32,
                constructorFunction: Uint32Array
            },
            Single: {
                heap: Module.HEAPF32,
                constructorFunction: Float32Array
            },
            Double: {
                heap: Module.HEAPF64,
                constructorFunction: Float64Array
            }
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
            var typedArray = new TypedArrayConstructor(Module.buffer, arrayBegin, totalLength);
            return typedArray;
        };

        var groupByDimensionLength = function (arr, startIndex, arrLength, dimensionLength) {
            var i, retArr, currArr, currArrIndex;

            if (arrLength % dimensionLength !== 0) {
                throw new Error('Cannot evenly split array into groups');
            }

            retArr = [];
            currArr = [];
            currArrIndex = 0;
            // TODO mraj should benchmark and see if difference between slice and iteration
            for (i = 0; i < arrLength; i += 1) {
                currArr[currArrIndex] = arr[startIndex + i];
                currArrIndex += 1;

                // After an increment currArrIndex is equivalent to the currArray length
                if (currArrIndex === dimensionLength) {
                    retArr.push(currArr);
                    currArr = [];
                    currArrIndex = 0;
                }
            }

            return retArr;
        };

        var convertFlatArraytoNArray = function (arr, dimensionLengths) {
            var i;
            var rank = dimensionLengths.length;
            var arrLength = 1;

            for (i = 0; i < rank; i += 1) {
                arrLength *= dimensionLengths[i];
            }

            // Perform a copy of array rank 1
            var currArr;
            if (rank === 1) {
                currArr = [];
                for (i = 0; i < arrLength; i += 1) {
                    currArr[i] = arr[i];
                }
                return currArr;
            }

            // Perform nd array creation for rank > 1
            // TODO mraj this is O((m-1)n) for rank m. So rank 2 is O(n) and can be improved for rank > 2
            currArr = arr;
            var currStartIndex = 0;
            var currArrLength = arrLength;
            var currDimensionLength;

            for (i = 0; i < rank - 1; i += 1) {
                currDimensionLength = dimensionLengths[i];
                currArr = groupByDimensionLength(currArr, currStartIndex, currArrLength, currDimensionLength);

                currStartIndex = 0;
                currArrLength = currArr.length;
            }

            return currArr;
        };

        var arrayTypeNameDoublePointer = Module._malloc(4);
        var arrayBeginPointer = Module._malloc(4);
        var arrayRankPointer = Module._malloc(4);
        var vireoObjectPointer = Module._malloc(4);
        var vireoTypePointer = Module._malloc(4);

        // **DEPRECATED**
        Module.eggShell.getNumericArray = publicAPI.eggShell.getNumericArray = function (vi, path) {
            var eggShellResult = EggShell_GetPointer(Module.eggShell.v_userShell, vi, path, vireoObjectPointer, vireoTypePointer);

            if (eggShellResult !== 0) {
                throw new Error('Getting the array pointer failed for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (vi name: ' + vi + ')' +
                    ' (path: ' + path + ')');
            }

            var arrayVireoPointer = Module.getValue(vireoObjectPointer, 'i32');
            var typePointer = Module.getValue(vireoTypePointer, 'i32');
            eggShellResult = Data_ValidateArrayType(Module.eggShell.v_userShell, typePointer);

            if (eggShellResult !== 0) {
                throw new Error('Getting the array pointer failed for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (vi name: ' + vi + ')' +
                    ' (path: ' + path + ')');
            }

            var arrayInfo = Module.eggShell.dataReadNumericArrayAsTypedArray(arrayVireoPointer);

            var actualArray;
            if (arrayInfo.array === undefined || arrayInfo.array.length === 0) {
                // handle empty array
                actualArray = [];
                for (var i = 0; i < arrayInfo.dimensionLengths.length - 1; i += 1) {
                    actualArray = [actualArray];
                }
                return actualArray;
            }

            actualArray = arrayInfo.array;

            return convertFlatArraytoNArray(actualArray, arrayInfo.dimensionLengths);
        };

        // **DEPRECATED**
        Module.eggShell.getArrayDimLength = publicAPI.eggShell.getArrayDimLength = function (vi, path, dim) {
            return EggShell_GetArrayDimLength(Module.eggShell.v_userShell, vi, path, dim);
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

        // **DEPRECATED**
        Module.eggShell.dataReadString = function (stringPointer) {
            var begin = Data_GetStringBegin(stringPointer);
            var length = Data_GetStringLength(stringPointer);
            var str = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, begin, length);
            return str;
        };

        // Note this function is tied to the underlying buffer, a copy is not made
        // **DEPRECATED**
        Module.eggShell.dataReadStringAsArray_NoCopy = function (stringPointer) {
            var begin = Data_GetStringBegin(stringPointer);
            var length = Data_GetStringLength(stringPointer);
            return Module.HEAPU8.subarray(begin, begin + length);
        };

        // Source should be a JS String
        // **DEPRECATED**
        Module.eggShell.dataWriteString = function (destination, source) {
            var sourceLength = Module.lengthBytesUTF8(source);
            Data_WriteString(Module.eggShell.v_userShell, destination, source, sourceLength);
        };

        // Source should be a JS array of numbers or a TypedArray of Uint8Array or Int8Array
        // **DEPRECATED**
        Module.eggShell.dataWriteStringFromArray = function (destination, source) {
            var sourceHeapPointer = Module._malloc(source.length);
            Module.writeArrayToMemory(source, sourceHeapPointer);
            Module._Data_WriteString(Module.eggShell.v_userShell, destination, sourceHeapPointer, source.length);
            Module._free(sourceHeapPointer);
        };

        // **DEPRECATED**
        Module.eggShell.dataReadBoolean = function (booleanPointer) {
            var numericValue = Data_ReadBoolean(booleanPointer);
            return numericValue !== 0;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadInt8 = function (intPointer) {
            var numericValue = Data_ReadInt8(intPointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadInt16 = function (intPointer) {
            var numericValue = Data_ReadInt16(intPointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadInt32 = function (intPointer) {
            var numericValue = Data_ReadInt32(intPointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadUInt8 = function (intPointer) {
            var numericValue = Data_ReadUInt8(intPointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadUInt16 = function (intPointer) {
            var numericValue = Data_ReadUInt16(intPointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadUInt32 = function (intPointer) {
            var numericValue = Data_ReadUInt32(intPointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadSingle = function (singlePointer) {
            var numericValue = Data_ReadSingle(singlePointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadDouble = function (doublePointer) {
            var numericValue = Data_ReadDouble(doublePointer);
            return numericValue;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadTypedArray = function (arrayPointer) {
            return Module.eggShell.dataReadNumericArrayAsTypedArray(arrayPointer).array;
        };

        // **DEPRECATED**
        Module.eggShell.dataReadNumericArrayAsTypedArray = function (arrayPointer) {
            var eggShellResult = Data_GetArrayMetadata(Module.eggShell.v_userShell, arrayPointer, arrayTypeNameDoublePointer, arrayRankPointer, arrayBeginPointer);

            if (eggShellResult !== 0) {
                throw new Error('Querying Array Metadata failed for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')');
            }

            var arrayTypeNamePointer = Module.getValue(arrayTypeNameDoublePointer, 'i32');
            var arrayTypeName = Module.Pointer_stringify(arrayTypeNamePointer);

            var arrayTypeConfig = supportedArrayTypeConfig[arrayTypeName];
            if (arrayTypeConfig === undefined) {
                throw new Error('Unsupported type: ' + arrayTypeName + ', the following types are supported: ' + Object.keys(supportedArrayTypeConfig).join(','));
            }
            var heap = supportedArrayTypeConfig[arrayTypeName].heap;

            var arrayRank = Module.getValue(arrayRankPointer, 'i32');
            var arrayBeginBytes = Module.getValue(arrayBeginPointer, 'i32');

            var dimensionLengths;
            // Handle empty arrays
            if (arrayBeginBytes === NULL) {
                dimensionLengths = [];
                for (var i = 0; i < arrayRank; i += 1) {
                    dimensionLengths[i] = 0;
                }

                return {
                    array: [],
                    dimensionLengths: dimensionLengths
                };
            }

            var arrayBegin = arrayBeginBytes / heap.BYTES_PER_ELEMENT;

            var arrayLength = 1;
            dimensionLengths = [];
            for (var j = 0; j < arrayRank; j += 1) {
                dimensionLengths[j] = Data_GetArrayDimLength(Module.eggShell.v_userShell, arrayPointer, j);
                arrayLength *= dimensionLengths[j];
            }

            var TypedArrayConstructor = supportedArrayTypeConfig[arrayTypeName].constructorFunction;
            var typedArray = new TypedArrayConstructor(heap.subarray(arrayBegin, arrayBegin + arrayLength));
            return {
                array: typedArray,
                dimensionLengths: dimensionLengths
            };
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteBoolean = function (booleanPointer, booleanValue) {
            var numericValue = booleanValue ? 1 : 0;
            Data_WriteBoolean(booleanPointer, numericValue);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteInt8 = function (destination, value) {
            Data_WriteInt8(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteInt16 = function (destination, value) {
            Data_WriteInt16(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteInt32 = function (destination, value) {
            Data_WriteInt32(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteUInt8 = function (destination, value) {
            Data_WriteUInt8(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteUInt16 = function (destination, value) {
            Data_WriteUInt16(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteUInt32 = function (destination, value) {
            Data_WriteUInt32(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteSingle = function (destination, value) {
            Data_WriteSingle(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteDouble = function (destination, value) {
            Data_WriteDouble(destination, value);
        };

        // **DEPRECATED**
        Module.eggShell.dataWriteTypedArray = function (destination, value) {
            var int32Byte = 4;
            var rank = 1;
            var newLengths = Module._malloc(rank * int32Byte);
            Module.setValue(newLengths, value.length, 'i32');

            Data_ResizeArray(Module.eggShell.v_userShell, destination, rank, newLengths);
            Module._free(newLengths);

            var eggShellResult = Data_GetArrayMetadata(Module.eggShell.v_userShell, destination, arrayTypeNameDoublePointer, arrayRankPointer, arrayBeginPointer);

            if (eggShellResult !== 0) {
                throw new Error('Querying Array Metadata failed for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')');
            }

            var arrayTypeNamePointer = Module.getValue(arrayTypeNameDoublePointer, 'i32');
            var arrayTypeName = Module.Pointer_stringify(arrayTypeNamePointer);
            var heap = supportedArrayTypeConfig[arrayTypeName].heap;
            var arrayBegin = Module.getValue(arrayBeginPointer, 'i32') / heap.BYTES_PER_ELEMENT;

            var returnArray = heap.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
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
            return EggShell_ExecuteSlices(Module.eggShell.v_userShell, numSlices, millisecondsToRun);
        };

        // Pumps vireo asynchronously until the currently loaded via has finished all clumps
        // Runs synchronously for a maximum of 4ms at a time to cooperate with browser and node.js execution environments
        // A good starting point for most vireo uses but can be copied and modified as needed
        // If a callback (stdout, stderr) is provided, it will be run asynchronously to completion
        Module.eggShell.executeSlicesUntilClumpsFinished = publicAPI.eggShell.executeSlicesUntilClumpsFinished = function (callback) {
            // These numbers may still need tuning.  They should also match the numbers in native
            // in CommandLine/main.cpp.  SLICE_SETS was lowered from 100000 because that was starving
            // other clumps and running too long before checking the timer.
            var SLICE_SETS_PER_TIME_CHECK = 10000;
            var MAXIMUM_VIREO_EXECUTION_TIME_MS = 4;
            var timerToken;
            var origExecuteSlicesWakeUpCallback = Module.eggShell.executeSlicesWakeUpCallback;

            var vireoFinished = function () {
                Module.eggShell.executeSlicesWakeUpCallback = origExecuteSlicesWakeUpCallback;

                if (typeof callback === 'function') {
                    callback();
                }
            };

            var runExecuteSlicesAsync = function () {
                var execSlicesResult = Module.eggShell.executeSlicesUntilWait(SLICE_SETS_PER_TIME_CHECK, MAXIMUM_VIREO_EXECUTION_TIME_MS);
                if (execSlicesResult > 0) {
                    timerToken = setTimeout(runExecuteSlicesAsync, execSlicesResult);
                } else if (execSlicesResult < 0) {
                    timerToken = setTimeout(runExecuteSlicesAsync, 0);
                } else {
                    timerToken = undefined;
                    setTimeout(vireoFinished, 0);
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

            runExecuteSlicesAsync();
        };

        Module.eggShell.setOccurrenceAsync = function (occurrence) {
            // TODO mraj currently setOccurrenceAsync is only called
            // by relatively slow operation, may need to change from setTimeout
            // to improve performance in the future
            setTimeout(function () {
                Occurrence_Set(occurrence);
                Module.eggShell.executeSlicesWakeUpCallback.call(undefined);
            }, 0);
        };

        Module.eggShell.setOccurrence = Occurrence_Set;
    };

    return assignEggShell;
}));
