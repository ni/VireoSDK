//------------------------------------------------------------
// makefile for vireo based on node.js and shelljs
//------------------------------------------------------------
require('shelljs/make');
sh = require('shelljs');
fs = require('fs');
path = require('path');

//------------------------------------------------------------
// Default setup
buildOptions = {
    "debug": false,
    "define": "-DVIREO_STDIO=1 -DVIREO_FILESYSTEM=1 -DVIREO_FILESYSTEM_DIRLIST=1",
    "optimization": "",
    "include": "../source/include",
        "sourceRoot": "../source/",
    "objRoot": "./objs/",
    "targetFile": "esh",
    "filesToLink": ""
};
//------------------------------------------------------------
function fileIsNewer(sourceFilePath, objectFilePath) {
    if (!sh.test('-e', objectFilePath)) {
        return sh.test('-e', sourceFilePath);
    } else {
        return ( fs.statSync(sourceFilePath).mtime.getTime() -
                 fs.statSync(objectFilePath).mtime.getTime()) > 0;
    }
}
//------------------------------------------------------------
function compileCommandMSCL(opts, filePath) {
    var objFilePath = opts.objRoot + 'win/' + path.parse(filePath).name + '.obj';
    var command = '';
    if (fileIsNewer(filePath, objFilePath)) {
        command =
            'cl ' +
            filePath + ' ' +
            '/nologo /DWIN32 ' +
            '/c ' +       // Compile to object file ojnly, dont link.
            '/Oxy ' +     // Full optimization, supress frame pointers where possible.
            '/EHsc ' +    // C++ exceptions only, no structured exceptions (* see below)
            '/Zi ' +      // Build pdb file for symbol information.
            '/MT ' +      // Statically link to the multi-threaded c runtime library.
            '/Faobjs\\win\\ /Foobjs\\win\\ /Fdobjs\\win\\vc100.pdb ' +
            (opts.debug ? '/D_DEBUG ' : '') +
            '/I' + opts.include + ' ' +
            opts.define + ' ';

        // * vireo does not use exceptions, however the MS string header files
        // generated warnings for some system classes that used exceptions.
        // so some execption support is turned on for windows builds.
    }
    opts.filesToLink += ' ' + objFilePath;

    return command;
}
//------------------------------------------------------------
function compileClangCommand(opts, filePath) {
    var objFilePath = opts.objRoot + 'clang/' + path.parse(filePath).name + '.o';
    var command = '';
    if (fileIsNewer(filePath, objFilePath)) {
        command =
            'clang++ ' +
            '-pthread -Wall -m64 -MMD -fno-rtti -fno-exceptions -std=c++11 -c ' +
            (opts.debug ? '-O0 ' : '-Oz ') +
            '-I' + opts.include + ' ' +
            opts.define + ' ' +
            '-o ' + objFilePath + ' ' +
            filePath;
    }
    opts.filesToLink += ' ' + objFilePath;
    return command;
}
//------------------------------------------------------------
function compileEmscriptenCommand(opts, filePath) {
    var objFilePath = opts.objRoot + 'ems/' + path.parse(filePath).name + '.bc';
    var command = '';
    if (fileIsNewer(filePath, objFilePath)) {
        command =
            'emcc ' +
            '-pthread -Wall -MMD -fno-rtti -fno-exceptions -std=c++11 ' +
            // Main will never exits so save some memory.
            '-s NO_EXIT_RUNTIME=1 ' +
            '-fno-exceptions ' +
            '--memory-init-file 0 ' +
            '-DkVireoOS_emscripten -DVIREO_LEAN ' +
            (opts.debug ? '-O0 ' : '-Os ') +
            '-I' + opts.include + ' ' +
            opts.define + ' ' +
            '-o ' + objFilePath + ' ' +
            filePath;
    }
    opts.filesToLink += ' ' + objFilePath;
    return command;
}
//------------------------------------------------------------
function compileGccCommand(opts, filePath) {
    var objFilePath = opts.objRoot + 'gcc/' + path.parse(filePath).name + '.o';
    var command =
        'g++ ' +
        '-pthread -fdata-sections -ffunction-sections' +
        (opts.debug ? '-O0' : '-O2') +
        '-I' + opts.include + ' ' +
        opts.define + ' ' +
        '-o ' + objFilePath + ' ' +
        filePath;

    opts.filesToLink += ' ' + objFilePath;
    return command;
}
//------------------------------------------------------------
function compile(opts, fileName) {
    var sourceFilePath = opts.sourceRoot + fileName;
    var command = opts.ccCommand(opts, sourceFilePath);
    if (command.length > 0) {
        console.log('Compiling ' + fileName);
        // console.log(command);
        sh.exec(command);
    } else {
        console.log('Skipping (looks up to date) ' + fileName);
    }
}
//------------------------------------------------------------
function link(opts) {
    console.log('Linking...');
    console.log(opts.linkCommand);
    sh.exec(opts.linkCommand + opts.filesToLink);
    if (opts.stripCommand) {
        sh.exec(opts.stripCommand);
    }
}
//------------------------------------------------------------
function configureSettings(opts, targetPlatform) {
    // Set options based on platformm being run on, or
    // in some cases for cross platfrom compiling.
    // the latter has not yet been done.
    var compilerPath = "";
    opts.filesToLink = "";
    if (targetPlatform === 'darwin') {
        // OSX Desktop
        sh.mkdir('-p', buildOptions.objRoot + 'clang/');
        opts.ccCommand = compileClangCommand;
        opts.linkCommand = 'clang++ -dead_strip -m64 -o esh';
        opts.stripCommand = 'strip esh';
    } else if (targetPlatform === 'linux') {
        sh.mkdir('-p', buildOptions.objRoot + 'gcc/');
        opts.ccCommand = compileGccCommand;
        opts.linkCommand = 'g++ -s -Wl,--gc-sections -o esh ';
        opts.strip = 'strip esh';
    } else if (targetPlatform === 'uBlaze') {
        sh.mkdir('-p', buildOptions.objRoot + 'uBlaze/');
        opts.ccCommand = compileGccCommand;
        opts.cc     = 'mb-g++';
        //opts.cflags = '-DkVireoOS_XuBlaze -fmessage-length=0 -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax';
        // LDFLAGS+= -Wl,-T -Wl,../source/XuBlaze/lscript.ld -L ../source/XuBlaze/standalone_bsp_0/microblaze_0/lib  -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax -Wl,--gc-sections -Wl,--start-group,-lxil,-lgcc,-lc,-lstdc++,--end-group
    } else if (targetPlatform === 'emscripten') {
        sh.mkdir('-p', buildOptions.objRoot + 'ems/');
        compilerPath = which('emcc');
        if (compilerPath) {
            console.log('using emcc at <' + compilerPath + '>');
        } else {
            console.log('Emscripten\'s "emcc" compiler must be configured for this shell.');
            exit(1);
        }

        // SITESOURCEDIR=../source/dox/playground
        // SITEDIR=../Documents/gh-pages/playground

        opts.ccCommand = compileEmscriptenCommand;
        opts.linkCommand = 'emcc';
        opts.linkCommand += '-dead_strip ';
        opts.linkCommand += '-Os ';
        opts.linkCommand += '-fno-exceptions ';
        opts.linkCommand += '--memory-init-file 0 ';
        opts.linkCommand += '--js-library ' + opts.sourceRoot + 'io/library_canvas2d.js ';
        opts.linkCommand += '--js-library ' + opts.sourceRoot + 'io/library_httpClient.js ';
        opts.linkCommand += '--pre-js ' + opts.sourceRoot + 'core/vireo.preamble.js ';
        opts.linkCommand += '--post-js ' + opts.sourceRoot + 'core/vireo.postamble.js ';
        opts.linkCommand += '-s NO_EXIT_RUNTIME=1 ';
        opts.linkCommand += '-o vireo.js ';

        var EM_EXPORTS = '-s EXPORTED_FUNCTIONS="[' +
        '\'_Vireo_Version\',' +
        '\'_EggShell_Create\',' +
        '\'_EggShell_REPL\',' +
        '\'_EggShell_ExecuteSlices\',' +
        '\'_EggShell_Delete\',' +
        '\'_EggShell_ReadDouble\',' +
        '\'_EggShell_WriteDouble\',' +
        '\'_EggShell_ReadValueString\',' +
        '\'_EggShell_WriteValueString\',' +
        '\'_Occurrence_Set\',' +
        '\'_Data_WriteString\',' +
        '\'_Data_WriteInt32\',' +
        '\'_Data_WriteUInt32\'' +
        ']" -s RESERVED_FUNCTION_POINTERS=10 ';
        opts.linkCommand += EM_EXPORTS;

    } else if (targetPlatform === 'win32' || targetPlatform === 'win64') {
        sh.mkdir('-p', buildOptions.objRoot + 'win/');
        compilerPath = sh.which('cl');
        if (compilerPath) {
            console.log('using cl at <' + compilerPath + '>');
        } else {
            console.log('This shell is not configured to use the Microsoft C++ compiler.');
            exit(1);
        }
        // The build tool will use the compiler that is configured.
        opts.ccCommand = compileCommandMSCL;
        opts.linkCommand = 'link /NOLOGO /OUT:esh.exe ';
    } else if (targetPlatform === 'xcompile-ARMv5') {
        console.log("target TBD");
        sh.exit(1);
    } else if (targetPlatform === 'xcompile-ARM-cortexM3') {
        console.log("target TBD");
        sh.exit(1);
    } else if (targetPlatform === 'xcompile-ARM-cortexM4') {
        console.log("target TBD");
        sh.exit(1);
    } else {
        console.log("target TBD");
        sh.exit(1);
    }
    return opts;
}
//------------------------------------------------------------
function compileVireo(platform) {
    console.log('Build for the <' + platform + '> platform');
    var opts = configureSettings(buildOptions, platform);
    // opts.debug = true;

    compile(opts, 'CommandLine/main.cpp');

    compile(opts, 'core/EggShell.cpp');
    compile(opts, 'core/VireoMerged.cpp');
    compile(opts, 'core/Thread.cpp');
    compile(opts, 'core/Timestamp.cpp');
    compile(opts, 'core/CEntryPoints.cpp');

    compile(opts, 'io/FileIO.cpp');
    compile(opts, 'io/DebugGPIO.cpp');
    compile(opts, 'io/Linx.cpp');
    compile(opts, 'io/Canvas2d.cpp');

    link(opts);
}
//------------------------------------------------------------
//------------------------------------------------------------
target.all = function() {
    console.log(" make options: ");
    console.log(" node make v64     // local native 64 bit ");
    console.log(" node make vjs     // vireo.js ");
    console.log(" node make dox     // build doxygen executable ");
    console.log(" node make clean   // delete objects ");
};
//------------------------------------------------------------
target.dox = function() {
    console.log(" Build Doxygen.");
    sh.exec('cd ../source && doxygen');
};
//------------------------------------------------------------
target.install = function() {
    if (!sh.test('-e', '/Applications/Vireo')) {
        sh.mkdir('/Applications/Vireo');
    }
    sh.cp('-f', buildOptions.targetFile, '/Applications/Vireo');
};
//------------------------------------------------------------
target.v64 = function() {
    compileVireo(process.platform);
};
//------------------------------------------------------------
target.vjs = function() {
    compileVireo('emscripten');
};
//------------------------------------------------------------
target.clean = function() {
    console.log("Clean all.");
    sh.rm('-rf', buildOptions.objRoot);
    sh.rm('-f', buildOptions.targetFile);

    if (process.platform === 'win32' || process.platform === 'win64') {
        sh.rm('-rf', './asm');
    }
};
