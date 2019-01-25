var assignCoreHelpers;
(function () {
    // Static Private Variables (all vireo instances)
    // None

    // Vireo Core Mixin Function
    assignCoreHelpers = function (Module, publicAPI) {
        Module.coreHelpers = {};
        publicAPI.coreHelpers = {};

        // Private Instance Variables (per vireo instance)
        var fpSync = function (/* fpIdStr*/) {
            // Dummy noop function user can replace by using eggShell.setFPSyncFunction
        };

        var CODES = {
            NO_ERROR: 0
        };

        // Exported functions
        Module.coreHelpers.jsExecutionContextFPSync = function (fpStringPointer) {
            var fpString = Module.eggShell.dataReadString(fpStringPointer);
            fpSync(fpString);
        };

        Module.coreHelpers.jsSystemLogging_WriteMessageUTF8 = function (
            messageTypeRef, messageDataRef,
            severityTypeRef, severityDataRef) {
            var messageValueRef = Module.eggShell.createValueRef(messageTypeRef, messageDataRef);
            var severityValueRef = Module.eggShell.createValueRef(severityTypeRef, severityDataRef);
            var message = Module.eggShell.readString(messageValueRef);
            var severity = Module.eggShell.readDouble(severityValueRef);
            switch (severity) {
            case 0:
                console.error(message);
                break;
            case 1:
                console.warn(message);
                break;
            case 2:
                console.info(message);
                break;
            default:
                console.log(message);
                break;
            }
        };

        publicAPI.coreHelpers.setFPSyncFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('FPSync must be a callable function');
            }

            fpSync = fn;
        };

        // Returns the length of a C string (excluding null terminator)
        Module.coreHelpers.findCStringLength = function (u8Array, startIndex) {
            var i,
                end = u8Array.length;

            for (i = startIndex; i < end; i += 1) {
                if (u8Array[i] === 0) {
                    return i - startIndex;
                }
            }
            return -1;
        };

        // WARNING: DO NOT USE UNLESS STACK SAVED FIRST
        Module.coreHelpers.writeJSStringToStack = function (str) {
            /* eslint-disable no-bitwise */
            // See https://github.com/kripken/emscripten/blob/6dc4ac5f9e4d8484e273e4dcc554f809738cedd6/src/preamble.js#L155
            // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
            var strMaxStackLength = (str.length << 2) + 1;
            var strStackPointer = Module.stackAlloc(strMaxStackLength);
            Module.stringToUTF8(str, strStackPointer, strMaxStackLength);
            return strStackPointer;
        };

        // WARNING: CALLER IS RESPONSIBLE TO FREE THE RETURNED POINTER
        Module.coreHelpers.writeJSStringToHeap = function (str) {
            /* eslint-disable no-bitwise */
            // See https://github.com/kripken/emscripten/blob/6dc4ac5f9e4d8484e273e4dcc554f809738cedd6/src/preamble.js#L155
            // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
            var strMaxHeapLength = (str.length << 2) + 1;
            var strHeapPointer = Module._malloc(strMaxHeapLength);
            Module.stringToUTF8(str, strHeapPointer, strMaxHeapLength);
            return strHeapPointer;
        };

        // Takes Vireo Strings (non-safe UTF-8 encoded byte buffers with known length) and returns JS strings (non-safe UTF-16 encoded character arrays)
        // Any bytes that are not part of a valid UTF-8 byte sequence are replaced with the Unicode Replacement Character
        // In addition, code points represented as overlong UTF-8 byte sequences have the byte sequence replaced with an equal number of Unicode Replacement Characters
        // This code does not validate for UTF-8 safety, only for UTF-8 byte sequence structure.
        // As such, the following UTF-8 safety checks are not performed: forbidding unicode reserved blocks, forbidding internal use blocks, forbidding the surrogate code point range in UTF-8 byte sequences, etc.
        Module.coreHelpers.sizedUtf8ArrayToJSString = function (u8Array, startIndex, length) {
            /* eslint-disable no-continue, no-plusplus, no-bitwise */
            /* eslint complexity: ["error", 40]*/
            var REPLACEMENT_CODEPOINT = '\uFFFD';
            var REPLACEMENT_CODEPOINT_LENGTH_2 = '\uFFFD\uFFFD';
            var REPLACEMENT_CODEPOINT_LENGTH_3 = '\uFFFD\uFFFD\uFFFD';
            var REPLACEMENT_CODEPOINT_LENGTH_4 = '\uFFFD\uFFFD\uFFFD\uFFFD';
            var u0, u1, u2, u3;
            var idx = startIndex;
            var endIndex = startIndex + length;
            endIndex = endIndex > u8Array.length ? u8Array.length : endIndex;
            var str = '';
            if (length <= 0) {
                return str;
            }
            while (true) {
                // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
                // This algorithm was adapted from the emscripten source: https://github.com/kripken/emscripten/blob/6dc4ac5f9e4d8484e273e4dcc554f809738cedd6/src/preamble.js#L543

                // Algorithm based on the following UTF-8 byte structure:
                // [1 byte] 0xxx xxxx
                // [2 byte] 110x xxxx   10xx xxxx
                // [3 byte] 1110 xxxx   10xx xxxx   10xx xxxx
                // [4 byte] 1111 0xxx   10xx xxxx   10xx xxxx   10xx xxxx
                // Note: The [4 byte] sequence can numerically encode a 21-bit number representing values up to U+1FFFFF however the last valid Unicode code point is U+10FFFF
                // Note: Numerically a character must be represented with the minimum number of bytes in a UTF-8 byte sequence as possible. For example NULL (U+0000) can be represented as
                // [1 byte] with 7-bits of zero, [2 bytes] with 11 bits of zero, [3 bytes] with 16 bits of zero, or [4 bytes] with 21 bits of zero.
                // Using a longer byte sequence than necessary is referred to as overlong encoding and is an invalid UTF-8 byte sequence.

                // Continue as long as there are bytes to process
                if (idx >= endIndex) {
                    return str;
                }

                // [1 byte] sequences take the value as is and continue
                u0 = u8Array[idx++];
                if (!(u0 & 0x80)) {
                    str += String.fromCharCode(u0);
                    continue;
                }

                // Look ahead to validate the UTF-8 structure for [2 byte] to [4 byte] representations
                // For invalid UTF-8 byte structures replace the current byte and continue
                // Note: at this point idx refers to the first byte after u0
                if ((u0 & 0xE0) === 0xC0) {
                    if (idx >= endIndex || (u8Array[idx] & 0xC0) !== 0x80) {
                        str += REPLACEMENT_CODEPOINT;
                        continue;
                    }
                } else if ((u0 & 0xF0) === 0xE0) {
                    if (idx + 1 >= endIndex || (u8Array[idx] & 0xC0) !== 0x80 || (u8Array[idx + 1] & 0xC0) !== 0x80) {
                        str += REPLACEMENT_CODEPOINT;
                        continue;
                    }
                } else if ((u0 & 0xF8) === 0xF0) {
                    if (idx + 2 >= endIndex || (u8Array[idx] & 0xC0) !== 0x80 || (u8Array[idx + 1] & 0xC0) !== 0x80 || (u8Array[idx + 2] & 0xC0) !== 0x80) {
                        str += REPLACEMENT_CODEPOINT;
                        continue;
                    }
                } else {
                    // u0 byte says multi-byte utf-8 encoding but is invalid so replace this byte and move on
                    str += REPLACEMENT_CODEPOINT;
                    continue;
                }

                // At this point UTF-8 byte sequence following byte u0 is valid

                // [2 byte] sequences are always below the UTF-16 surrogate pair range so take the value and continue
                // Note: The first code point in a [2 byte] sequence is U+0080, so any code point less than that is overlong and is replaced
                u1 = u8Array[idx++] & 63;
                if ((u0 & 0xE0) === 0xC0) {
                    u0 = ((u0 & 31) << 6) | u1;
                    if (u0 < 0x80) {
                        str += REPLACEMENT_CODEPOINT_LENGTH_2;
                        continue;
                    }
                    str += String.fromCharCode(u0);
                    continue;
                }

                // [3 byte] and [4 byte] sequences may require UTF-16 surrogate pair so create point but do not append to the string until checking
                // Note: The first code point in a [3 byte] sequence is U+0800, so any code point less than that is overlong and is replaced
                // Note: The first code point in a [4 byte] sequence is U+10000, so any code point less than that is overlong and is replaced
                u2 = u8Array[idx++] & 63;
                if ((u0 & 0xF0) === 0xE0) {
                    u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
                    if (u0 < 0x800) {
                        str += REPLACEMENT_CODEPOINT_LENGTH_3;
                        continue;
                    }
                } else {
                    u3 = u8Array[idx++] & 63;
                    u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
                    if (u0 < 0x10000) {
                        str += REPLACEMENT_CODEPOINT_LENGTH_4;
                        continue;
                    }
                }

                // Codepoints in the range U+10000 to U+10FFFF must be encoded as a UTF-16 surrogate pair
                // A surrogate pair is a high surrogate UTF-16 character with range 0xD800-0xDBFF and a low surrogate UTF-16 character with range 0xDC00-0xDFFF
                // The algorithm for encoding a codepoint as a UTF-16 surrogate pair is available here: https://en.wikipedia.org/wiki/UTF-16#U.2B10000_to_U.2B10FFFF
                // Note: Code points less than U+10000 are saved as a single UTF-16 character
                // Note: Code points >= U+10000 and <= 0x10FFFF are saved as two UTF-16 characters using the surrogate pair algorithm
                // Note: Code points greater than U+10FFFF are outside the Unicode range and replaced with the Unicode Replacement Character
                if (u0 < 0x10000) {
                    str += String.fromCharCode(u0);
                } else if (u0 <= 0x10FFFF) {
                    var ch = u0 - 0x10000;
                    str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
                } else {
                    str += REPLACEMENT_CODEPOINT_LENGTH_4;
                }
            }
        };

        // Source adapted from https://github.com/kripken/emscripten/blob/bd050e64bb0d9952df1344b8ea9356252328ad83/src/preamble.js#L488
        // Copies the given Javascript String object 'str' to the given byte array at address 'startIndex' encoded in UTF8 form.
        // Use the function lengthBytesUTF8 to compute the exact number of bytes that this function will write.
        // Parameters:
        //   str: the Javascript string to copy.
        //   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
        //   startIndex: The starting offset in the array to begin the copying.
        //   maxBytesToWrite: The maximum number of bytes this function can write to the array. maxBytesToWrite=0 does not write any bytes to the output.
        // Returns the number of bytes written.
        Module.coreHelpers.jsStringToSizedUTF8Array = function (str, outU8Array, startIndex, maxBytesToWrite) {
            /* eslint-disable no-plusplus, id-length */
            // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
            if (!(maxBytesToWrite > 0)) {
                return 0;
            }
            var outIdx = startIndex;
            var endIdx = outIdx + maxBytesToWrite;
            for (var i = 0; i < str.length; ++i) {
                // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
                // See http://unicode.org/faq/utf_bom.html#utf16-3
                // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
                var u = str.charCodeAt(i); // possibly a lead surrogate
                if (u >= 0xD800 && u <= 0xDFFF) {
                    u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
                }
                if (u <= 0x7F) {
                    if (outIdx >= endIdx) {
                        break;
                    }
                    outU8Array[outIdx++] = u;
                } else if (u <= 0x7FF) {
                    if (outIdx + 1 >= endIdx) {
                        break;
                    }
                    outU8Array[outIdx++] = 0xC0 | (u >> 6);
                    outU8Array[outIdx++] = 0x80 | (u & 63);
                } else if (u <= 0xFFFF) {
                    if (outIdx + 2 >= endIdx) {
                        break;
                    }
                    outU8Array[outIdx++] = 0xE0 | (u >> 12);
                    outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
                    outU8Array[outIdx++] = 0x80 | (u & 63);
                } else if (u <= 0x1FFFFF) {
                    if (outIdx + 3 >= endIdx) {
                        break;
                    }
                    outU8Array[outIdx++] = 0xF0 | (u >> 18);
                    outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
                    outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
                    outU8Array[outIdx++] = 0x80 | (u & 63);
                } else if (u <= 0x3FFFFFF) {
                    if (outIdx + 4 >= endIdx) {
                        break;
                    }
                    outU8Array[outIdx++] = 0xF8 | (u >> 24);
                    outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
                    outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
                    outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
                    outU8Array[outIdx++] = 0x80 | (u & 63);
                } else {
                    if (outIdx + 5 >= endIdx) {
                        break;
                    }
                    outU8Array[outIdx++] = 0xFC | (u >> 30);
                    outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
                    outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
                    outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
                    outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
                    outU8Array[outIdx++] = 0x80 | (u & 63);
                }
            }
            return outIdx - startIndex;
        };

        var writeNewError = function (errorValueRef, newError) {
            Module.eggShell.writeDouble(Module.eggShell.findSubValueRef(errorValueRef, 'status'), newError.status ? 1 : 0);
            Module.eggShell.writeDouble(Module.eggShell.findSubValueRef(errorValueRef, 'code'), newError.code);
            Module.eggShell.writeString(Module.eggShell.findSubValueRef(errorValueRef, 'source'), newError.source);
        };

        Module.coreHelpers.mergeErrors = function (errorValueRef, newError) {
            // Follows behavior of merge errors function: https://zone.ni.com/reference/en-XX/help/371361N-01/glang/merge_errors_function/
            if (errorValueRef === undefined) {
                return;
            }

            var errorStatusValueRef = Module.eggShell.findSubValueRef(errorValueRef, 'status');
            var isExistingError = Module.eggShell.readDouble(errorStatusValueRef) !== 0;
            if (isExistingError) {
                return;
            }

            var isNewError = newError.status;
            if (isNewError) {
                writeNewError(errorValueRef, newError);
                return;
            }

            var existingErrorCodeValueRef = Module.eggShell.findSubValueRef(errorValueRef, 'code');
            var existingErrorCode = Module.eggShell.readDouble(existingErrorCodeValueRef);
            var isExistingWarning = existingErrorCode !== CODES.NO_ERROR;
            var isNewWarning = newError.code !== CODES.NO_ERROR;
            if (isExistingWarning) {
                return;
            }

            if (isNewWarning) {
                writeNewError(errorValueRef, newError);
                return;
            }

            // If no error or warning then pass through
            // Note: merge errors function ignores newErrorSource if no newError or newWarning so replicated here
            return;
        };

        Module.coreHelpers.formatMessageWithException = function (messageText, exception) {
            var additionalInfo;
            if (exception !== undefined && exception !== null) {
                // Some browsers do not print the message in the stack so print both
                if (typeof exception.message === 'string' && exception.message.length !== 0) {
                    additionalInfo = ', Additional information:\nMessage: ' + exception.message;
                    if (typeof exception.stack === 'string' && exception.stack.length !== 0) {
                        additionalInfo += '\nStack: ' + exception.stack;
                    }
                    return messageText + additionalInfo;
                }
            }

            return messageText;
        };

        Module.coreHelpers.createSourceFromMessage = function (additionalInformation) {
            if (typeof additionalInformation === 'string' && additionalInformation.length !== 0) {
                return `<APPEND>\n${additionalInformation}`;
            }

            return '';
        };
    };
}());

export default assignCoreHelpers;
