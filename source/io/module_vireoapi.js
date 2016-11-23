// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, arr) {
            var nextValue = currentIndex === arr.length - 1 ? factory() : {};
            return currObj[subNamespace] === undefined ? currObj[subNamespace] = nextValue : currObj[subNamespace];
        }, root);
  }
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignVireoAPI', function () {
    'use strict';

    var assignVireoAPI = function (vireoCore) {
        var Module = vireoCore.Module;
        var MODULE_VIREO_API = vireoCore.Module.vireoAPI = {};
        var PUBLIC_VIREO_API = vireoCore.publicAPI.vireoAPI = {};

        var Vireo_Version = Module.cwrap('Vireo_Version', 'number', []);
        var EggShell_Create = Module.cwrap('EggShell_Create', 'number', ['number']);
        var EggShell_Delete = Module.cwrap('EggShell_Delete', 'number', ['number']);
        var EggShell_ReadDouble = Module.cwrap('EggShell_ReadDouble', 'number', ['number', 'string', 'string']);
        var EggShell_WriteDouble = Module.cwrap('EggShell_WriteDouble', 'void', ['number', 'string', 'string', 'number']);
        var EggShell_ReadValueString = Module.cwrap('EggShell_ReadValueString', 'string', ['number', 'string', 'string', 'string' ]);
        var EggShell_WriteValueString = Module.cwrap('EggShell_WriteValueString', 'void', ['number', 'string', 'string', 'string', 'string']);
        var Data_WriteString = Module.cwrap('Data_WriteString', 'void', ['number', 'number', 'string', 'number']);
        var Data_WriteInt32 = Module.cwrap('Data_WriteInt32', 'void', ['number', 'number']);
        var Data_WriteUInt32 = Module.cwrap('Data_WriteUInt32', 'void', ['number', 'number']);
        var EggShell_REPL = Module.cwrap('EggShell_REPL', 'number', ['number', 'string', 'number']);
        var EggShell_ExecuteSlices = Module.cwrap('EggShell_ExecuteSlices', 'number', ['number',  'number']);
        var Occurrence_Set = Module.cwrap('Occurrence_Set', 'void', ['number']);
        
        // Shell instances
        var v_root = EggShell_Create(0);
        var v_userShell = EggShell_Create(v_root);

        // Export functions
        MODULE_VIREO_API.fpSync = function (fpIdStr) {
            // Dummy noop function user can set
        };

        PUBLIC_VIREO_API.setFPSyncFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('FPSync must be a callable function');
            }

            MODULE_VIREO_API.fpSync = fn;
        };

        // Relies on Emscripten default if not specified
        PUBLIC_VIREO_API.setPrintFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('Print must be a callable function');
            }

            Module.print = fn;
        };

        // Relies on Emscripten default if not specified
        PUBLIC_VIREO_API.setPrintErrorFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('PrintError must be a callable function');
            }

            Module.printErr = fn;
        };

        // Do not use this property anywhere in here or in external code bases
        PUBLIC_VIREO_API._core_module_for_debug_only_do_not_use_anywhere = Module;

        // Exporting functions to both VIREO_API and PUBLIC_VIREO_API is not normal
        // This is unique to the vireoAPI as it is consumed by other modules as well as users
        var sharedFunctionsToExport = {
            version: Vireo_Version,
            reboot: function() {
                EggShell_Delete(v_userShell);
                EggShell_Delete(v_root);
                v_root =  EggShell_Create(0);
                v_userShell = EggShell_Create(v_root);
            },
            readDouble: function (vi, path) {
                return EggShell_ReadDouble(v_userShell, vi, path);
            },
            writeDouble: function (vi, path, value) {
                EggShell_WriteDouble(v_userShell, vi, path, value);
            },
            readJSON: function (vi, path) {
                EggShell_ReadValueString(v_userShell, vi, path, 'JSON');
            },
            writeJSON: function (vi, path, value) {
                EggShell_WriteValueString(v_userShell, vi, path, 'JSON', value);
            },
            dataWriteString: function (destination, source, sourceLength) {
                Data_WriteString(v_userShell, destination, source, sourceLength);
            },
            dataWriteInt32: function (destination, value) {
                Data_WriteInt32(destination, value);
            },
            dataWriteUInt32: function (destination, value) {
                Data_WriteUInt32(destination, value);
            },
            loadVia: function (viaText) {
                if (typeof viaText !== 'string') {
                    throw new Error('Expected viaText to be a string');
                }

                if (viaText.length === 0) {
                    throw new Error('Empty viaText provided, nothing to run');
                }
                
                return EggShell_REPL(v_userShell, viaText, -1);
            },
            executeSlices: function (slices) {
                return EggShell_ExecuteSlices(v_userShell, slices);
            },
            setOccurrence: function (occurrence) {
                Occurrence_Set(occurrence);
            }
        };

        Object.keys(sharedFunctionsToExport).forEach(function (currentName) {
            PUBLIC_VIREO_API[currentName] = MODULE_VIREO_API[currentName] = sharedFunctionsToExport[currentName];
        });
    };

    return assignVireoAPI;
}));
