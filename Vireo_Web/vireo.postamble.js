// Begin postamble
// Add some functions to the vireo object.

Module.v_create = Module.cwrap('EggShell_Create', 'number', ['number']);
Module.v_readDouble = Module.cwrap('EggShell_ReadDouble', 'number', ['number', 'string', 'string']);
Module.v_writeDouble = Module.cwrap('EggShell_WriteDouble', 'void', ['number', 'string', 'string', 'number']);
Module.v_readString = Module.cwrap('EggShell_ReadString', 'string', ['number', 'string', 'string']);
Module.v_writeString = Module.cwrap('EggShell_WriteString', 'void', ['number', 'string', 'string', 'string']);
Module.v_repl = Module.cwrap('EggShell_REPL', 'void', ['number', 'string', 'number']);
Module.v_executeSlices = Module.cwrap('EggShell_ExecuteSlices', 'number', ['number',  'number']);
Module.v_delete = Module.cwrap('EggShell_Delete', 'number', ['number']);
Module.v_shell = Module.v_create(0);

return {
    version: Module.cwrap('Vireo_Version', 'number', []),
    
    readDouble:     
        function(vi, path)      
        { return Module.v_readDouble(Module.v_shell, vi, path) },
    writeDouble:    
        function(vi, path, value) 
        { Module.v_writeDouble(Module.v_shell, vi, path, value) },
    readString:     
        function(vi, path) 
        { return Module.v_readString(Module.v_shell, vi, path) },
    writeString:    
        function(vi, path, value) 
        { Module.v_writeString(Module.v_shell, vi, path, value) },
    loadVia:        
        function(viaText) 
        { Module.v_repl(Module.v_shell, viaText, -1); },
    executeSlices:        
        function(slices)
        { return Module.v_executeSlices(Module.v_shell, slices); }
}

}());

if (typeof process === 'object' && typeof require === 'function') {
    module.exports = NationalInstruments.Vireo;
}

