// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? currObj[subNamespace] = nextValue : currObj[subNamespace];
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
        Module.eggShell = {};
        publicAPI.eggShell = {};

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
        Module.eggShell.fpSync = function (/*fpIdStr*/) {
            // Dummy noop function user can replace by using eggShell.setFPSyncFunction
        };

        publicAPI.eggShell.setFPSyncFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('FPSync must be a callable function');
            }

            Module.eggShell.fpSync = fn;
        };

        publicAPI.eggShell.setPrintFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('Print must be a callable function');
            }

            Module.print = fn;
        };

        publicAPI.eggShell.setPrintErrorFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error ('PrintError must be a callable function');
            }

            Module.printErr = fn;
        };

        publicAPI.eggShell._core_module_for_debug_only_do_not_use_anywhere = Module;

        // Exporting functions to both Module.eggShell and publicAPI.eggShell is not normal
        // This is unique to the eggShell API as it is consumed by other modules as well as users
        Module.eggShell.version = publicAPI.eggShell.version = Vireo_Version;

        Module.eggShell.reboot = publicAPI.eggShell.reboot = function () {
            EggShell_Delete(v_userShell);
            EggShell_Delete(v_root);
            v_root =  EggShell_Create(0);
            v_userShell = EggShell_Create(v_root);
        };

        Module.eggShell.readDouble = publicAPI.eggShell.readDouble = function (vi, path) {
            return EggShell_ReadDouble(v_userShell, vi, path);
        };

        Module.eggShell.writeDouble = publicAPI.eggShell.writeDouble = function (vi, path, value) {
            EggShell_WriteDouble(v_userShell, vi, path, value);
        };

        Module.eggShell.readJSON = publicAPI.eggShell.readJSON = function (vi, path) {
            return EggShell_ReadValueString(v_userShell, vi, path, 'JSON');
        };

        Module.eggShell.writeJSON = publicAPI.eggShell.writeJSON = function (vi, path, value) {
            EggShell_WriteValueString(v_userShell, vi, path, 'JSON', value);
        };

        Module.eggShell.dataWriteString = publicAPI.eggShell.dataWriteString = function (destination, source, sourceLength) {
            Data_WriteString(v_userShell, destination, source, sourceLength);
        };

        Module.eggShell.dataWriteInt32 = publicAPI.eggShell.dataWriteInt32 = function (destination, value) {
            Data_WriteInt32(destination, value);
        };

        Module.eggShell.dataWriteUInt32 = publicAPI.eggShell.dataWriteUInt32 = function (destination, value) {
            Data_WriteUInt32(destination, value);
        };

        Module.eggShell.loadVia = publicAPI.eggShell.loadVia = function (viaText) {
            if (typeof viaText !== 'string') {
                throw new Error('Expected viaText to be a string');
            }

            if (viaText.length === 0) {
                throw new Error('Empty viaText provided, nothing to run');
            }

            return EggShell_REPL(v_userShell, viaText, -1);
        };

        Module.eggShell.executeSlices = publicAPI.eggShell.executeSlices = function (slices) {
            return EggShell_ExecuteSlices(v_userShell, slices);
        };

        Module.eggShell.setOccurrence = publicAPI.eggShell.setOccurrence = function (occurrence) {
            Occurrence_Set(occurrence);
        };
    };

    return assignEggShell;
}));
