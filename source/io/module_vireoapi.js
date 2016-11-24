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

    // Static Private Variables (all vireo instances)
    // None

    // Vireo Core Mixin Function
    var assignVireoAPI = function (vireoCore) {
        var PUBLIC_VIREO_API = vireoCore.publicAPI.vireoAPI = {};
        var Module = vireoCore.Module;
        Module.vireoAPI = {};

        // Private Instance Variables (per vireo instance)
        var Vireo_Version = Module.cwrap('Vireo_Version', 'number', []);
        var EggShell_Create = Module.cwrap('EggShell_Create', 'number', ['number']);
        var EggShell_Delete = Module.cwrap('EggShell_Delete', 'number', ['number']);
        var EggShell_ReadDouble = Module.cwrap('EggShell_ReadDouble', 'number', ['number', 'string', 'string']);
        var EggShell_WriteDouble = Module.cwrap('EggShell_WriteDouble', 'void', ['number', 'string', 'string', 'number']);
        var EggShell_ReadValueString = Module.cwrap('EggShell_ReadValueString', 'string', ['number', 'string', 'string', 'string']);
        var EggShell_WriteValueString = Module.cwrap('EggShell_WriteValueString', 'void', ['number', 'string', 'string', 'string', 'string']);
        var Data_WriteString = Module.cwrap('Data_WriteString', 'void', ['number', 'number', 'string', 'number']);
        var Data_WriteInt32 = Module.cwrap('Data_WriteInt32', 'void', ['number', 'number']);
        var Data_WriteUInt32 = Module.cwrap('Data_WriteUInt32', 'void', ['number', 'number']);
        var EggShell_REPL = Module.cwrap('EggShell_REPL', 'number', ['number', 'string', 'number']);
        var EggShell_ExecuteSlices = Module.cwrap('EggShell_ExecuteSlices', 'number', ['number',  'number']);
        var Occurrence_Set = Module.cwrap('Occurrence_Set', 'void', ['number']);

        // Create shell for vireo instance
        var v_root = EggShell_Create(0);
        var v_userShell = EggShell_Create(v_root);

        // Exported functions
        Module.vireoAPI.fpSync = function (/*fpIdStr*/) {
            // Dummy noop function user can set with public api
        };

        PUBLIC_VIREO_API.setFPSyncFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('FPSync must be a callable function');
            }

            Module.vireoAPI.fpSync = fn;
        };

        PUBLIC_VIREO_API.setPrintFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('Print must be a callable function');
            }

            Module.print = fn;
        };

        PUBLIC_VIREO_API.setPrintErrorFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('PrintError must be a callable function');
            }

            Module.printErr = fn;
        };

        PUBLIC_VIREO_API._core_module_for_debug_only_do_not_use_anywhere = Module;

        // Exporting functions to both VIREO_API and PUBLIC_VIREO_API is not normal
        // This is unique to the vireoAPI as it is consumed by other modules as well as users
        Module.vireoAPI.version = PUBLIC_VIREO_API.version = Vireo_Version;

        Module.vireoAPI.reboot = PUBLIC_VIREO_API.reboot = function () {
            EggShell_Delete(v_userShell);
            EggShell_Delete(v_root);
            v_root =  EggShell_Create(0);
            v_userShell = EggShell_Create(v_root);
        };

        Module.vireoAPI.readDouble = PUBLIC_VIREO_API.readDouble = function (vi, path) {
            return EggShell_ReadDouble(v_userShell, vi, path);
        };

        Module.vireoAPI.writeDouble = PUBLIC_VIREO_API.writeDouble = function (vi, path, value) {
            EggShell_WriteDouble(v_userShell, vi, path, value);
        };

        Module.vireoAPI.readJSON = PUBLIC_VIREO_API.readJSON = function (vi, path) {
            EggShell_ReadValueString(v_userShell, vi, path, 'JSON');
        };

        Module.vireoAPI.writeJSON = PUBLIC_VIREO_API.writeJSON = function (vi, path, value) {
            EggShell_WriteValueString(v_userShell, vi, path, 'JSON', value);
        };

        Module.vireoAPI.dataWriteString = PUBLIC_VIREO_API.dataWriteString = function (destination, source, sourceLength) {
            Data_WriteString(v_userShell, destination, source, sourceLength);
        };

        Module.vireoAPI.dataWriteInt32 = PUBLIC_VIREO_API.dataWriteInt32 = function (destination, value) {
            Data_WriteInt32(destination, value);
        };

        Module.vireoAPI.dataWriteUInt32 = PUBLIC_VIREO_API.dataWriteUInt32 = function (destination, value) {
            Data_WriteUInt32(destination, value);
        };

        Module.vireoAPI.loadVia = PUBLIC_VIREO_API.loadVia = function (viaText) {
            if (typeof viaText !== 'string') {
                throw new Error('Expected viaText to be a string');
            }

            if (viaText.length === 0) {
                throw new Error('Empty viaText provided, nothing to run');
            }

            return EggShell_REPL(v_userShell, viaText, -1);
        };

        Module.vireoAPI.executeSlices = PUBLIC_VIREO_API.executeSlices = function (slices) {
            return EggShell_ExecuteSlices(v_userShell, slices);
        };

        Module.vireoAPI.setOccurrence = PUBLIC_VIREO_API.setOccurrence = function (occurrence) {
            Occurrence_Set(occurrence);
        };
    };

    return assignVireoAPI;
}));
