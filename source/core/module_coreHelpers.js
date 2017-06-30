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
}(this, 'NationalInstruments.Vireo.Core.assignCoreHelpers', function () {
    'use strict';
    // Static Private Variables (all vireo instances)
    // None

    // Vireo Core Mixin Function
    var assignCoreHelpers = function (Module, publicAPI) {
        Module.coreHelpers = {};
        publicAPI.coreHelpers = {};

        // Private Instance Variables (per vireo instance)
        var fpSync = function (/* fpIdStr*/) {
            // Dummy noop function user can replace by using eggShell.setFPSyncFunction
        };

        var trackingFPS = false;
        var lastTime = 0;
        var currentFPS = 0;

        var CODES = {
            NO_ERROR: 0
        };

        // Exported functions
        Module.coreHelpers.jsExecutionContextFPSync = function (fpStringPointer) {
            var fpString = Module.eggShell.dataReadString(fpStringPointer);
            fpSync(fpString);
        };

        publicAPI.coreHelpers.setFPSyncFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('FPSync must be a callable function');
            }

            fpSync = fn;
        };

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
            var strStackPointer = Module.Runtime.stackAlloc(strMaxStackLength);
            Module.stringToUTF8(str, strStackPointer, strMaxStackLength);
            return strStackPointer;
        };

        // Takes Vireo Strings that are non-safe UTF-8 encoded strings with known length that may be potentially invalid UTF-8 byte sequences
        // and returns a JS string using the Unicode Replacement Character for invalid bytes
        // safe utf-8 refers to forbidding unicode reserved blocks, forbidding internal use blocks, preventing surrogate code points in utf, etc.
        // this code does not validate for safety, only for utf-8 byte sequence structure
        Module.coreHelpers.sizedUtf8ArrayToJSString = function (u8Array, startIndex, length) {
            /* eslint-disable no-continue, no-plusplus, no-bitwise */
            /* eslint complexity: ["error", 40]*/
            var u0, u1, u2, u3;
            var idx = startIndex;
            var endIndex = startIndex + length;
            endIndex = endIndex > u8Array.length ? u8Array.length : endIndex;
            var str = '';
            if (length <= 0) {
                return str;
            }
            while (true) {
                if (idx >= endIndex) {
                    return str;
                }
                // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
                u0 = u8Array[idx++];
                if (!(u0 & 0x80)) {
                    str += String.fromCharCode(u0);
                    continue;
                }

                // Look ahead to validate the UTF-8 structure
                if ((u0 & 0xE0) === 0xC0) {
                    if (idx >= endIndex || (u8Array[idx] & 0xC0) !== 0x80) {
                        str += '\uFFFD';
                        continue;
                    }
                } else if ((u0 & 0xF0) === 0xE0) {
                    if (idx + 1 >= endIndex || (u8Array[idx] & 0xC0) !== 0x80 || (u8Array[idx + 1] & 0xC0) !== 0x80) {
                        str += '\uFFFD';
                        continue;
                    }
                } else if ((u0 & 0xF8) === 0xF0) {
                    if (idx + 2 >= endIndex || (u8Array[idx] & 0xC0) !== 0x80 || (u8Array[idx + 1] & 0xC0) !== 0x80 || (u8Array[idx + 2] & 0xC0) !== 0x80) {
                        str += '\uFFFD';
                        continue;
                    }
                } else {
                    // u0 byte says multi-byte utf-8 encoding but is invalid so replace this byte and move on
                    str += '\uFFFD';
                    continue;
                }

                // Valid UTf-8 structure so encode
                // 2 byte sequences always less than surrogate pair so create codepoint and move on
                u1 = u8Array[idx++] & 63;
                if ((u0 & 0xE0) === 0xC0) {
                    u0 = ((u0 & 31) << 6) | u1;
                    if (u0 < 0x80) {
                        str += '\uFFFD\uFFFD';
                        continue;
                    }
                    str += String.fromCharCode(u0);
                    continue;
                }

                // >2 byte sequences may require surrogate pair so create point and then check if should be transformed to surrogate pair
                u2 = u8Array[idx++] & 63;
                if ((u0 & 0xF0) === 0xE0) {
                    u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
                    if (u0 < 0x800) {
                        str += '\uFFFD\uFFFD\uFFFD';
                        continue;
                    }
                } else {
                    u3 = u8Array[idx++] & 63;
                    u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
                    if (u0 < 0x10000) {
                        str += '\uFFFD\uFFFD\uFFFD\uFFFD';
                        continue;
                    }
                }

                // Check if needs to be transformed to surrogate pair
                if (u0 < 0x10000) {
                    str += String.fromCharCode(u0);
                } else if (u0 <= 0x10FFFF) {
                    var ch = u0 - 0x10000;
                    str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
                } else {
                    // Values from 0x10FFFF to 0x1FFFFF are valid UTF-8 structures but UTF-16 can only represent up to 0x10FFFF with surrogate pairs and Unicode max is 0x10FFFF
                    str += '\uFFFD\uFFFD\uFFFD\uFFFD';
                }
            }
        };

        Module.coreHelpers.jsCurrentBrowserFPS = function () {
            if (trackingFPS === false) {
                trackingFPS = true;
                lastTime = performance.now();

                requestAnimationFrame(function vireoFPSTracker (currentTime) {
                    var timeBetweenFrames = currentTime - lastTime;
                    currentFPS = 1000 / timeBetweenFrames;
                    lastTime = currentTime;
                    requestAnimationFrame(vireoFPSTracker);
                });
            }

            return currentFPS;
        };

        var writeNewError = function (newErrorStatus, newErrorCode, newErrorSource, existingErrorStatusPointer, existingErrorCodePointer, exisitingErrorSourcePointer) {
            Module.eggShell.dataWriteBoolean(existingErrorStatusPointer, newErrorStatus);
            Module.eggShell.dataWriteInt32(existingErrorCodePointer, newErrorCode);
            Module.eggShell.dataWriteString(exisitingErrorSourcePointer, newErrorSource);
        };

        Module.coreHelpers.mergeErrors = function (newErrorStatus, newErrorCode, newErrorSource, existingErrorStatusPointer, existingErrorCodePointer, exisitingErrorSourcePointer) {
            // Follows behavior of merge errors function: https://zone.ni.com/reference/en-XX/help/371361N-01/glang/merge_errors_function/

            var existingErrorStatus = Module.eggShell.dataReadBoolean(existingErrorStatusPointer);
            var isExistingError = existingErrorStatus;
            var isNewError = newErrorStatus;

            if (isExistingError) {
                return;
            }

            if (isNewError) {
                writeNewError(newErrorStatus, newErrorCode, newErrorSource, existingErrorStatusPointer, existingErrorCodePointer, exisitingErrorSourcePointer);
                return;
            }

            var existingErrorCode = Module.eggShell.dataReadInt32(existingErrorCodePointer);
            var isExistingWarning = existingErrorCode !== CODES.NO_ERROR;
            var isNewWarning = newErrorCode !== CODES.NO_ERROR;
            if (isExistingWarning) {
                return;
            }

            if (isNewWarning) {
                writeNewError(newErrorStatus, newErrorCode, newErrorSource, existingErrorStatusPointer, existingErrorCodePointer, exisitingErrorSourcePointer);
                return;
            }

            // If no error or warning then pass through
            // Note: merge errors function ignores newErrorSource if no newError or newWarning so replicated here
            return;
        };
    };

    return assignCoreHelpers;
}));
