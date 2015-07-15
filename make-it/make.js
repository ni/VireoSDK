//------------------------------------------------------------
// makefile for vireo base on node.js and shelljs
//------------------------------------------------------------
require('shelljs/make');
sh = require('shelljs');
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
function compileCommandMSCL(opts, fileName) {
    var objFileName = opts.objRoot + path.basename(fileName) + '.o';
    var command =
        'cl ' +
        opts.sourceRoot + fileName + ' ' +
         '/nologo /Oy- /c /DWIN32  /Zi /MTd /Faasm\\ /Foobjs\\ /Fdobjs\\vc100.pdb' +
        (opts.debug ? '/D_DEBUG' : '') +
        '/I' + opts.include + ' ' +
        opts.define + ' ';

    opts.filesToLink += ' ' + objFileName;
    return command;
}
//------------------------------------------------------------
function compileClangCommand(opts, fileName) {
    var objFileName = opts.objRoot + path.basename(fileName) + '.o';
    var command =
        'clang++ ' +
        '-pthread -Wall -m64 -MMD -fno-rtti -fno-exceptions -std=c++11 -c ' +
        (opts.debug ? '-O0 ' : '-Oz ') +
        '-I' + opts.include + ' ' +
        opts.define + ' ' +
        '-o ' + objFileName + ' ' +
        opts.sourceRoot + fileName;

    opts.filesToLink += ' ' + objFileName;
    return command;
}
//------------------------------------------------------------
function compileEmscriptenCommand(opts, fileName) {
    var objFileName = opts.objRoot + path.basename(fileName) + '.bc';
    var command =
        'emcc ' +
        '-pthread -Wall -MMD -fno-rtti -fno-exceptions -std=c++11 ' +
        '-s NO_EXIT_RUNTIME=1 ' +
        '-fno-exceptions ' +
        '--memory-init-file 0 ' +
        '-DkVireoOS_emscripten -DVIREO_LEAN ' +
        (opts.debug ? '-O0 ' : '-Os ') +
        '-I' + opts.include + ' ' +
        opts.define + ' ' +
        '-o ' + objFileName + ' ' +
        opts.sourceRoot + fileName;

    opts.filesToLink += ' ' + objFileName;
    return command;
}
//------------------------------------------------------------
function compileGccCommand(opts, fileName) {
    var objFileName = opts.objRoot + path.basename(fileName) + '.o';
    var command =
        'g++ ' +
        '-pthread -fdata-sections -ffunction-sections' +
        (opts.debug ? '-O0' : '-O2') +
        '-I' + opts.include + ' ' +
        opts.define + ' ' +
        '-o ' + objFileName + ' ' +
        opts.sourceRoot + fileName;

    opts.filesToLink += ' ' + objFileName;
    return command;
}
//------------------------------------------------------------
function compile(opts, fileName) {
    var command = opts.ccCommand(opts, fileName);
    console.log('Compiling ' + fileName);
    // console.log(command);
    sh.exec(command);
}
//------------------------------------------------------------
function link(opts) {
    var command = opts.link + ' ' +
        '-o ' + opts.targetFile + ' ' +
        opts.ldflags + ' ' +
        opts.filesToLink;

    console.log('Linking...');
    console.log(command);
    sh.exec(command);
    if (opts.strip) {
        sh.exec('strip ' + opts.targetFile);
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
        opts.ccCommand = compileClangCommand;
        opts.link = 'clang++';
        opts.ldflags = '-dead_strip -m64 ';
        opts.strip = 'strip';
    } else if (targetPlatform === 'linux') {
        opts.ccCommand = compileGccCommand;
        opts.link   = 'g++';
        opts.ldflags= '-s -Wl,--gc-sections';
        opts.strip = 'strip';
    } else if (targetPlatform === 'uBlaze') {
        opts.ccCommand = compileGccCommand;
        opts.cc     = 'mb-g++';
        //opts.cflags = '-DkVireoOS_XuBlaze -fmessage-length=0 -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax';
        // LDFLAGS+= -Wl,-T -Wl,../source/XuBlaze/lscript.ld -L ../source/XuBlaze/standalone_bsp_0/microblaze_0/lib  -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax -Wl,--gc-sections -Wl,--start-group,-lxil,-lgcc,-lc,-lstdc++,--end-group
    } else if (targetPlatform === 'emscripten') {
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
        opts.link = 'emcc';
        opts.ldflags = '-dead_strip ';
        opts.ldflags += '-Os ';
        opts.ldflags += '-fno-exceptions ';
        opts.ldflags += '--memory-init-file 0 ';
        opts.ldflags += '--js-library ' + opts.sourceRoot + 'io/library_canvas2d.js ';
        opts.ldflags += '--js-library ' + opts.sourceRoot + 'io/library_httpClient.js ';
        opts.ldflags += '--pre-js ' + opts.sourceRoot + 'core/vireo.preamble.js ';
        opts.ldflags += '--post-js ' + opts.sourceRoot + 'core/vireo.postamble.js ';
        opts.ldflags += '-s NO_EXIT_RUNTIME=1 ';

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
        opts.ldflags += EM_EXPORTS;
        opts.targetFile = 'vireo.js';

    } else if (targetPlatform === 'win32' || targetPlatform === 'win64') {
        compilerPath = sh.which('cl');
        if (compilerPath) {
            console.log('using cl at <' + compilerPath + '>');
        } else {
            console.log('This command shell does not the Microsoft cl compiler in its path.');
            exit(1);
        }
        // The build tool will use the compiler that is configured.
        opts.ccCommand = compileCommandMSCL;
        opts.ldflags= '/NOLOGO /DEBUG /OUT:esh.exe';
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
    sh.mkdir(buildOptions.objRoot);

    if (process.platform === 'win32' || process.platform === 'win64') {
        sh.rm('-rf', './asm');
        sh.mkdir( './asm');
    }
};
