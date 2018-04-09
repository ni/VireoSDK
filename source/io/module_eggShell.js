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
            'EggShell_ReadDouble',
            'EggShell_WriteDouble',
            'EggShell_WriteValueString',
            'EggShell_GetArrayMetadata',
            'EggShell_GetArrayDimLength',
            'EggShell_ResizeArray',
            'Data_GetStringBegin',
            'Data_GetStringLength',
            'Data_GetTypedArrayBegin',
            'Data_GetTypedArrayLength',
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
        var Vireo_Version = Module.cwrap('Vireo_Version', 'number', []);
        var Vireo_MaxExecWakeUpTime = Module.cwrap('Vireo_MaxExecWakeUpTime', 'number', []);
        var EggShell_Create = Module.cwrap('EggShell_Create', 'number', ['number']);
        var EggShell_Delete = Module.cwrap('EggShell_Delete', 'number', ['number']);
        var EggShell_ReadDouble = Module.cwrap('EggShell_ReadDouble', 'number', ['number', 'string', 'string']);
        var EggShell_WriteDouble = Module.cwrap('EggShell_WriteDouble', 'void', ['number', 'string', 'string', 'number']);
        var EggShell_WriteValueString = Module.cwrap('EggShell_WriteValueString', 'void', ['number', 'string', 'string', 'string', 'string']);
        var EggShell_GetArrayMetadata = Module.cwrap('EggShell_GetArrayMetadata', 'number', ['number', 'string', 'string', 'number', 'number', 'number', 'number']);
        var EggShell_GetArrayDimLength = Module.cwrap('EggShell_GetArrayDimLength', 'number', ['number', 'string', 'string', 'number']);
        var EggShell_ResizeArray = Module.cwrap('EggShell_ResizeArray', 'number', ['number', 'string', 'string', 'number', 'number']);
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
        var Data_GetTypedArrayBegin = Module.cwrap('Data_GetTypedArrayBegin', 'number', ['number']);
        var Data_GetTypedArrayLength = Module.cwrap('Data_GetTypedArrayLength', 'number', ['number']);
        var Data_GetArrayMetadata = Module.cwrap('Data_GetArrayMetadata', 'number', ['number', 'number', 'number', 'number', 'number']);
        var Data_GetArrayDimLength = Module.cwrap('Data_GetArrayDimLength', 'number', ['number', 'number', 'number']);
        var Data_ResizeArray = Module.cwrap('Data_ResizeArray', 'void', ['number', 'number', 'number']);
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
        var v_root = EggShell_Create(0);
        var v_userShell = EggShell_Create(v_root);

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
            EggShell_Delete(v_userShell);
            EggShell_Delete(v_root);
            v_root = EggShell_Create(0);
            v_userShell = EggShell_Create(v_root);
        };

        Module.eggShell.readDouble = publicAPI.eggShell.readDouble = function (vi, path) {
            return EggShell_ReadDouble(v_userShell, vi, path);
        };

        Module.eggShell.writeDouble = publicAPI.eggShell.writeDouble = function (vi, path, value) {
            EggShell_WriteDouble(v_userShell, vi, path, value);
        };

        Module.eggShell.readJSON = publicAPI.eggShell.readJSON = function (vi, path) {
            var stack = Module.stackSave(); // Stack save only needed for input parameter string or array

            var type = 'JSON';
            var viStackPointer = Module.coreHelpers.writeJSStringToStack(vi);
            var pathStackPointer = Module.coreHelpers.writeJSStringToStack(path);
            var typeStackPointer = Module.coreHelpers.writeJSStringToStack(type);

            var responsePointer = Module._EggShell_ReadValueString(v_userShell, viStackPointer, pathStackPointer, typeStackPointer);
            var responseLength = Module.coreHelpers.findCStringLength(Module.HEAPU8, responsePointer);
            var response = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, responsePointer, responseLength);

            Module.stackRestore(stack);
            return response;
        };

        Module.eggShell.writeJSON = publicAPI.eggShell.writeJSON = function (vi, path, value) {
            EggShell_WriteValueString(v_userShell, vi, path, 'JSON', value);
        };

        var supportedArrayTypeConfig = {
            Int8: Module.HEAP8,
            Int16: Module.HEAP16,
            Int32: Module.HEAP32,
            UInt8: Module.HEAPU8,
            UInt16: Module.HEAPU16,
            UInt32: Module.HEAPU32,
            Single: Module.HEAPF32,
            Double: Module.HEAPF64
        };

        // Keep in sync with EggShellResult in CEntryPoints.h
        var eggShellResultEnum = {
            0: 'Success',
            1: 'ObjectNotFoundAtPath',
            2: 'UnexpectedObjectType',
            3: 'InvalidResultPointer',
            4: 'UnableToCreateReturnBuffer'
        };

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

        var convertFlatArraytoNArray = function (arr, startIndex, dimensionLengths) {
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
                    currArr[i] = arr[startIndex + i];
                }
                return currArr;
            }

            // Perform nd array creation for rank > 1
            // TODO mraj this is O((m-1)n) for rank m. So rank 2 is O(n) and can be improved for rank > 2
            currArr = arr;
            var currStartIndex = startIndex;
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

        Module.eggShell.getNumericArray = publicAPI.eggShell.getNumericArray = function (vi, path) {
            var eggShellResult = EggShell_GetArrayMetadata(v_userShell, vi, path, arrayTypeNameDoublePointer, arrayRankPointer, arrayBeginPointer);

            if (eggShellResult !== 0) {
                throw new Error('Querying Array Metadata failed for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')' +
                    ' (vi name: ' + vi + ')' +
                    ' (path: ' + path + ')');
            }

            var arrayTypeNamePointer = Module.getValue(arrayTypeNameDoublePointer, 'i32');
            // The following use of Pointer_stringify is safe as long as arrayTypeNamePointer is a valid C string
            var arrayTypeName = Module.Pointer_stringify(arrayTypeNamePointer);
            var arrayRank = Module.getValue(arrayRankPointer, 'i32');
            var arrayBegin = Module.getValue(arrayBeginPointer, 'i32');

            var arrayTypeConfig = supportedArrayTypeConfig[arrayTypeName];
            if (arrayTypeConfig === undefined) {
                throw new Error('Unsupported type: ' + arrayTypeName + ', the following types are supported: ' + Object.keys(supportedArrayTypeConfig).join(','));
            }

            var i, returnArray;

            // Handle empty arrays
            if (arrayBegin === NULL) {
                returnArray = [];
                for (i = 0; i < arrayRank - 1; i += 1) {
                    returnArray = [returnArray];
                }

                return returnArray;
            }

            var arrayStartIndex = arrayBegin / arrayTypeConfig.BYTES_PER_ELEMENT;
            var dimensionLengths = [];
            for (i = 0; i < arrayRank; i += 1) {
                dimensionLengths[i] = Module.eggShell.getArrayDimLength(vi, path, i);
            }

            returnArray = convertFlatArraytoNArray(arrayTypeConfig, arrayStartIndex, dimensionLengths);
            return returnArray;
        };

        Module.eggShell.getArrayDimLength = publicAPI.eggShell.getArrayDimLength = function (vi, path, dim) {
            return EggShell_GetArrayDimLength(v_userShell, vi, path, dim);
        };

        Module.eggShell.resizeArray = publicAPI.eggShell.resizeArray = function (vi, path, newDimensionSizes) {
            var int32Byte = 4;
            var rank = newDimensionSizes.length;
            var newLengths = Module._malloc(rank * int32Byte);

            for (var i = 0; i < rank; i += 1) {
                Module.setValue(newLengths + (i * int32Byte), newDimensionSizes[i], 'i32');
            }

            var success = EggShell_ResizeArray(v_userShell, vi, path, rank, newLengths);

            Module._free(newLengths);

            return success;
        };

        Module.eggShell.dataReadString = function (stringPointer) {
            var begin = Data_GetStringBegin(stringPointer);
            var length = Data_GetStringLength(stringPointer);
            var str = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, begin, length);
            return str;
        };

        // Note this function is tied to the underlying buffer, a copy is not made
        Module.eggShell.dataReadStringAsArray_NoCopy = function (stringPointer) {
            var begin = Data_GetStringBegin(stringPointer);
            var length = Data_GetStringLength(stringPointer);
            return Module.HEAPU8.subarray(begin, begin + length);
        };

        // Source should be a JS String
        Module.eggShell.dataWriteString = function (destination, source) {
            var sourceLength = Module.lengthBytesUTF8(source);
            Data_WriteString(v_userShell, destination, source, sourceLength);
        };

        // Source should be a JS array of numbers or a TypedArray of Uint8Array or Int8Array
        Module.eggShell.dataWriteStringFromArray = function (destination, source) {
            var sourceHeapPointer = Module._malloc(source.length);
            Module.writeArrayToMemory(source, sourceHeapPointer);
            Module._Data_WriteString(v_userShell, destination, sourceHeapPointer, source.length);
            Module._free(sourceHeapPointer);
        };

        Module.eggShell.dataReadBoolean = function (booleanPointer) {
            var numericValue = Data_ReadBoolean(booleanPointer);
            return numericValue !== 0;
        };

        Module.eggShell.dataReadInt8 = function (intPointer) {
            var numericValue = Data_ReadInt8(intPointer);
            return numericValue;
        };

        Module.eggShell.dataReadInt16 = function (intPointer) {
            var numericValue = Data_ReadInt16(intPointer);
            return numericValue;
        };

        Module.eggShell.dataReadInt32 = function (intPointer) {
            var numericValue = Data_ReadInt32(intPointer);
            return numericValue;
        };

        Module.eggShell.dataReadUInt8 = function (intPointer) {
            var numericValue = Data_ReadUInt8(intPointer);
            return numericValue;
        };

        Module.eggShell.dataReadUInt16 = function (intPointer) {
            var numericValue = Data_ReadUInt16(intPointer);
            return numericValue;
        };

        Module.eggShell.dataReadUInt32 = function (intPointer) {
            var numericValue = Data_ReadUInt32(intPointer);
            return numericValue;
        };

        Module.eggShell.dataReadSingle = function (singlePointer) {
            var numericValue = Data_ReadSingle(singlePointer);
            return numericValue;
        };

        Module.eggShell.dataReadDouble = function (doublePointer) {
            var numericValue = Data_ReadDouble(doublePointer);
            return numericValue;
        };

        var io_types = {
            Int8: {
                heap: supportedArrayTypeConfig.Int8,
                constructor: Int8Array
            }
        };

        Module.eggShell.dataReadTypedArray = function (arrayPointer) {
            var eggShellResult = Data_GetArrayMetadata(v_userShell, arrayPointer, arrayTypeNameDoublePointer, arrayRankPointer, arrayBeginPointer);

            if (eggShellResult !== 0) {
                throw new Error('Querying Array Metadata failed for the following reason: ' + eggShellResultEnum[eggShellResult] +
                    ' (error code: ' + eggShellResult + ')');
            }

            var arrayTypeNamePointer = Module.getValue(arrayTypeNameDoublePointer, 'i32');
            var arrayTypeName = Module.Pointer_stringify(arrayTypeNamePointer);
            //var arrayRank = Module.getValue(arrayRankPointer, 'i32');
            var arrayBegin = Module.getValue(arrayBeginPointer, 'i32');

            // just get the first length - later I will generalize this??
            var length = Data_GetArrayDimLength(v_userShell, arrayPointer, 0);
            var constructor = io_types[arrayTypeName].constructor;
            var heap = io_types[arrayTypeName].heap;
            return new constructor(heap.subarray(arrayBegin, arrayBegin + length));
        };

        Module.eggShell.dataReadInt8Array = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAP8.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Int8Array(Module.HEAP8.subarray(begin, begin + length));
        };

        Module.eggShell.dataReadInt16Array = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAP16.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Int16Array(Module.HEAP16.subarray(begin, begin + length));
        };

        Module.eggShell.dataReadInt32Array = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAP32.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Int32Array(Module.HEAP32.subarray(begin, begin + length));
        };

        Module.eggShell.dataReadUInt8Array = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAPU8.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Uint8Array(Module.HEAPU8.subarray(begin, begin + length));
        };

        Module.eggShell.dataReadUInt16Array = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAPU16.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Uint16Array(Module.HEAPU16.subarray(begin, begin + length));
        };

        Module.eggShell.dataReadUInt32Array = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAPU32.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Uint32Array(Module.HEAPU32.subarray(begin, begin + length));
        };

        Module.eggShell.dataReadSingleArray = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAPF32.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Float32Array(Module.HEAPF32.subarray(begin, begin + length));
        };

        Module.eggShell.dataReadDoubleArray = function (arrayPointer) {
            var begin = Data_GetTypedArrayBegin(arrayPointer) / Module.HEAPF64.BYTES_PER_ELEMENT;
            var length = Data_GetTypedArrayLength(arrayPointer);
            return new Float64Array(Module.HEAPF64.subarray(begin, begin + length));
        };

        Module.eggShell.dataWriteBoolean = function (booleanPointer, booleanValue) {
            var numericValue = booleanValue ? 1 : 0;
            Data_WriteBoolean(booleanPointer, numericValue);
        };

        Module.eggShell.dataWriteInt8 = function (destination, value) {
            Data_WriteInt8(destination, value);
        };

        Module.eggShell.dataWriteInt16 = function (destination, value) {
            Data_WriteInt16(destination, value);
        };

        Module.eggShell.dataWriteInt32 = function (destination, value) {
            Data_WriteInt32(destination, value);
        };

        Module.eggShell.dataWriteUInt8 = function (destination, value) {
            Data_WriteUInt8(destination, value);
        };

        Module.eggShell.dataWriteUInt16 = function (destination, value) {
            Data_WriteUInt16(destination, value);
        };

        Module.eggShell.dataWriteUInt32 = function (destination, value) {
            Data_WriteUInt32(destination, value);
        };

        Module.eggShell.dataWriteSingle = function (destination, value) {
            Data_WriteSingle(destination, value);
        };

        Module.eggShell.dataWriteDouble = function (destination, value) {
            Data_WriteDouble(destination, value);
        };

        Module.eggShell.dataWriteInt8Array = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAP8.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAP8.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
        };

        Module.eggShell.dataWriteInt16Array = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAP16.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAP16.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
        };

        Module.eggShell.dataWriteInt32Array = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAP32.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAP32.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
        };

        Module.eggShell.dataWriteUInt8Array = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAPU8.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAPU8.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
        };

        Module.eggShell.dataWriteUInt16Array = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAPU16.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAPU16.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
        };

        Module.eggShell.dataWriteUInt32Array = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAPU32.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAPU32.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
        };

        Module.eggShell.dataWriteSingleArray = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAPF32.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAPF32.subarray(arrayBegin, arrayBegin + value.length);
            returnArray.set(value);
        };

        Module.eggShell.dataWriteDoubleArray = function (destination, value) {
            Data_ResizeArray(v_userShell, destination, value.length);
            var arrayBegin = Data_GetTypedArrayBegin(destination) / Module.HEAPF64.BYTES_PER_ELEMENT;

            var returnArray = Module.HEAPF64.subarray(arrayBegin, arrayBegin + value.length);
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

            var result = Module._EggShell_REPL(v_userShell, viaTextPointer, viaTextLength);
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
            return EggShell_ExecuteSlices(v_userShell, numSlices, millisecondsToRun);
        };

        // Pumps vireo asynchronously until the currently loaded via has finished all clumps
        // Runs synchronously for a maximum of 4ms at a time to cooperate with browser and node.js execution environments
        // A good starting point for most vireo uses but can be copied and modified as needed
        // If a callback (stdout, stderr) is provided, it will be run asynchronously to completion
        Module.eggShell.executeSlicesUntilClumpsFinished = publicAPI.eggShell.executeSlicesUntilClumpsFinished = function (callback) {
            var SLICE_SETS_PER_TIME_CHECK = 100000;
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
    };

    return assignEggShell;
}));
