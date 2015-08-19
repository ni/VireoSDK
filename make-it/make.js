//------------------------------------------------------------
// makefile for vireo based on node.js and shelljs
//------------------------------------------------------------
require('shelljs/make');
sh = require('shelljs');
fs = require('fs');
path = require('path');

//------------------------------------------------------------
/*
    Moving from a make file to a make script.

    Basic flow is as follows
    (1) using shelljs 'node make target' will call one
        of the target.XXX() functions
    (2) the target invokes one or more BuildXXX functions
    (3) the BuildXXX fucntion configures the opts object, compiles each
    component in the target and then links them.

    Each compiler tool chain has two function. The compileXXX functions
    generates the command line calls the compiler and adds the object file
    to a list of files to link by the linkerXXX function.

    compileMSCL()
    compileClang()
    compileEmscripten()
    compileGcc()

    linkMSCL()
    linkClang()
    linkEmscripten()
    linkGcc()

*/
//------------------------------------------------------------
// Default setup
buildOptions = {
    'debug': false,
    'define': '-DVIREO_STDIO=1 -DVIREO_FILESYSTEM=1 -DVIREO_FILESYSTEM_DIRLIST=1 -DVIREO_LINX=1',
    'optimization': '',
    'include': '../source/include',
        'sourceRoot': '../source/',
    'objRoot': './objs/',
    'targetFile': 'esh',
    'filesToLink': ''
};
//------------------------------------------------------------
function fileIsNewer(sourceFilePath, objectFilePath) {
    if (!sh.test('-e', objectFilePath)) {
        return sh.test('-e', sourceFilePath);
    } else {
        return (fs.statSync(sourceFilePath).mtime.getTime() -
                 fs.statSync(objectFilePath).mtime.getTime()) > 0;
    }
}
//------------------------------------------------------------
//------------------------------------------------------------
function compileMSCL(opts, filePath) {
    var objFilePath = opts.objRoot + 'win/' + path.parse(filePath).name + '.obj';
    opts.filesToLink += ' ' + objFilePath;

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
        sh.exec(command);
    }
}
//------------------------------------------------------------
function compileClang(opts, filePath) {
    var objFilePath = opts.objRoot + 'clang/' + path.parse(filePath).name + '.o';
    opts.filesToLink += ' ' + objFilePath;

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

        sh.exec(command);
    }
}
//------------------------------------------------------------
function compileEmscripten(opts, filePath) {
    var objFilePath = opts.objRoot + 'ems/' + path.parse(filePath).name + '.bc';
    opts.filesToLink += ' ' + objFilePath;

    var command = '';
    if (fileIsNewer(filePath, objFilePath)) {
        command =
            'emcc ' +
            '-pthread -Wall -MMD -fno-rtti -fno-exceptions -std=c++11 ' +
            // Main will never exits so save some memory.
        //    '-s NO_EXIT_RUNTIME=1 ' +
        //    '--memory-init-file 0 ' +
            '-DkVireoOS_emscripten -DVIREO_LEAN ' +
            (opts.debug ? '-O0 ' : '-Os ') +
            '-I' + opts.include + ' ' +
            opts.define + ' ' +
            '-o ' + objFilePath + ' ' +
            filePath;
        console.log(command);
        sh.exec(command);
    }
}
//------------------------------------------------------------
function compileGcc(opts, filePath) {
    var objFilePath = opts.objRoot + 'gcc/' + path.parse(filePath).name + '.o';
    opts.filesToLink += ' ' + objFilePath;

    var command =
        'g++ ' +
        '-pthread -fdata-sections -ffunction-sections' +
        (opts.debug ? '-O0' : '-O2') +
        '-I' + opts.include + ' ' +
        opts.define + ' ' +
        '-o ' + objFilePath + ' ' +
        filePath;

    sh.exec(command);
}
//------------------------------------------------------------
//------------------------------------------------------------
function linkClang(opts, fileName) {
    var command = 'clang++ ';
        command += '-dead_strip -m64 ';
        command += '-o ' + fileName + ' ';
        command += opts.filesToLink;

    console.log(command);
    sh.exec(command);
    console.log('stripping out symbols...');
    sh.exec('strip esh');
}
//------------------------------------------------------------
function linkGcc(opts, fileName) {
    var command = 'g++ ';
        command += '-s -Wl,--gc-sections ';
        command += '-o ' + fileName + ' ';
        command += opts.filesToLink;

    console.log(command);
    sh.exec(command);
    console.log('stripping out symbols...');
    sh.exec('strip esh');
}
//------------------------------------------------------------
function linkMSCL(opts, fileName) {
    var command = 'link /NOLOGO /OUT:' + fileName + '.exe';
        command += opts.filesToLink;

    console.log(command);
    sh.exec(command);
}
//------------------------------------------------------------
function linkEmscripten(opts, fileName) {
    var filePath =  '../dist/' + fileName + '.js';

    // Use emscripten compiler (tool that wraps clang).
    var command = 'emcc ';

    // Optimize for size, turn off fancy C++ stuff
    command += '-Os ';
    command += '-fno-exceptions ';
    command += '-fno-rtti ';

    command += '--memory-init-file 0 ';

    // Add native javascript libaries.
    if (opts.jsLibraries) {
        opts.jsLibraries.map( function(item) {
            command += '--js-library ' + opts.sourceRoot + item + ' ';
        });
    }

    command += '-s NO_EXIT_RUNTIME=1 ';
    command += '-g0 ';

    if (opts.sharedLibrary) {
        command += '-s SIDE_MODULE=1 ';
    } else {
        // MAIN_MODULE=2 triggers dead code stripping in the main module.
        // so any symbol need by the side module most be referenced by code
        // or added to the EXPORTED_FUNCTIONS set.
        command += '-s MAIN_MODULE=2 ';
        command += '--pre-js ' + opts.sourceRoot + 'core/vireo.preamble.js ';
        command += '--post-js ' + opts.sourceRoot + 'core/vireo.postamble.js ';
    }

    if (opts.exports) {
        var exports_string = '\'' + opts.exports.join('\',\'') +  '\'';
        command += '-s EXPORTED_FUNCTIONS="[' + exports_string + ']" ';
    }
    command += '-s NO_FILESYSTEM=1 ';
    // command += '-s RESERVED_FUNCTION_POINTERS=10 ';

    // dist directory is where bower wants the js file.
    command += '-o ' + filePath;

    // Add the list files to link.
    command += opts.filesToLink  + ' ';

    console.log(command);
    sh.exec(command);
    sh.exec(' ls -l ' + filePath);

    return command;
}
//------------------------------------------------------------
function compile(opts, fileName) {
    var sourceFilePath = opts.sourceRoot + fileName;
    console.log('Compiling ' + fileName);
    opts.compiler(opts, sourceFilePath);
}
//------------------------------------------------------------
function link(opts, fileName) {
    console.log('linking...');
    opts.linker(opts, fileName);
}
//------------------------------------------------------------
function configureSettings(opts, targetPlatform) {
    // Set options based on platformm being run on, or
    // in some cases for cross platfrom compiling.
    // the latter has not yet been done.

    if (targetPlatform === 'darwin') {
        // OSX Desktop
        opts.objPlatformSuffix =  'clang/';
        opts.compiler = compileClang;
        opts.linker = linkClang;
    } else if (targetPlatform === 'linux') {
        opts.objPlatformSuffix =  'gcc/';
        opts.compiler = compileGcc;
        opts.linker = linkGcc;
    } else if (targetPlatform === 'uBlaze') {
        opts.objPlatformSuffix =  'uBlaze/';
        opts.compiler = compileGcc;
        // opts.cc     = 'mb-g++';
        // opts.cflags = '-DkVireoOS_XuBlaze -fmessage-length=0 -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax';
        // LDFLAGS+= -Wl,-T -Wl,../source/XuBlaze/lscript.ld -L ../source/XuBlaze/standalone_bsp_0/microblaze_0/lib  -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax -Wl,--gc-sections -Wl,--start-group,-lxil,-lgcc,-lc,-lstdc++,--end-group
    } else if (targetPlatform === 'emscripten') {
        opts.objPlatformSuffix =  'ems/';
        var emscriptenPath = which('emcc');
        if (emscriptenPath) {
            console.log('using emcc at <' + emscriptenPath + '>');
        } else {
            console.log('Emscripten\'s "emcc" compiler must be configured for this shell.');
            exit(1);
        }
        opts.compiler = compileEmscripten;
        opts.linker = linkEmscripten;
    } else if (targetPlatform === 'win32' || targetPlatform === 'win64') {
        sh.mkdir('-p', buildOptions.objRoot + 'win/');
        var compilerPath = sh.which('cl');
        if (compilerPath) {
            console.log('using cl at <' + compilerPath + '>');
        } else {
            console.log('This shell is not configured to use the Microsoft C++ compiler.');
            exit(1);
        }
        // The build tool will use the compiler that is configured.
        opts.compiler = compileMSCL;
        opts.linker = linkMSCL;
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

    opts.filesToLink = '';
    opts.jsLibrries = null;
    opts.exports = null;
    opts.sharedLibrary = null;
    if (opts.objPlatformSuffix) {
        sh.mkdir('-p', buildOptions.objRoot + opts.objPlatformSuffix);
    }
    return opts;
}

//------------------------------------------------------------
function buildVireo(platform, outputName) {
    console.log('Build vireo for the <' + platform + '> platform');
    var opts = configureSettings(buildOptions, platform);

    compile(opts, 'CommandLine/main.cpp');
    compile(opts, 'core/VireoMerged.cpp');

    compile(opts, 'core/Thread.cpp');
    compile(opts, 'core/Timestamp.cpp');
    compile(opts, 'core/CEntryPoints.cpp');

    compile(opts, 'io/FileIO.cpp');
    compile(opts, 'io/DebugGPIO.cpp');
    compile(opts, 'io/HttpClient.cpp');
    compile(opts, 'io/WebSocketClient.cpp');
    compile(opts, 'io/Linx.cpp');       // to be pulled into side module
    compile(opts, 'io/Canvas2d.cpp');   // to be pulled into side module

    // Exported symbole are initially just used for JS builds
    // other targets will ingore this set.
    opts.exports = [
        '_Vireo_Version',
        '_EggShell_Create',
        '_EggShell_REPL',
        '_EggShell_ExecuteSlices',
        '_EggShell_Delete',
        '_EggShell_ReadDouble',
        '_EggShell_WriteDouble',
        '_EggShell_ReadValueString',
        '_EggShell_WriteValueString',
        '_Occurrence_Set',
        '_Data_WriteString',
        '_Data_WriteInt32',
        '_Data_WriteUInt32'
    ];

    opts.jsLibraries = [
        'io/library_httpClient.js',
        'io/library_WebSocketClient.js',
        'io/library_canvas2d.js'        // to be pulled into side module
    ];

    link(opts, outputName);
}
//------------------------------------------------------------
function buildCanvas2d(platform) {
    var opts = configureSettings(buildOptions, platform);
    opts.sharedLibrary = true;
    compile(opts, 'io/Canvas2d.cpp');
    opts.jsLibraries = [
        'io/library_canvas2d.js'
    ];

    link(opts, 'canvas2d');
}
//------------------------------------------------------------
function buildLinx(platform) {
    var opts = configureSettings(buildOptions, platform);
    opts.sharedLibrary = true;
    compile(opts, 'io/Linx.cpp');
    link(opts, 'linx');
}
//------------------------------------------------------------
//------------------------------------------------------------
target.all = function() {
    console.log(' make options: ');
    console.log('');
    console.log('   node make v64     // local native 64 bit ');
    console.log('   node make vjs     // vireo.js ');
    console.log('   node make dox     // build doxygen executable ');
    console.log('   node make clean   // delete objects ');

    console.log('');
    console.log(' If you are using npm, the following commands should work ');
    console.log(' from any directory within the vireo project.');
    console.log('');
    console.log('   npm run make -- <make options from list above> ');
    console.log('');
};
//------------------------------------------------------------
target.dox = function() {
    console.log(' Build Doxygen.');
    sh.exec('cd ../source && doxygen');
};
//------------------------------------------------------------
target.install = function() {
    if (!sh.test('-e', '/Applications/Vireo')) {
        sh.mkdir('/Applications/Vireo');
    }
    console.log(' Copying <' + buildOptions.targetFile + '> to </Applications/Vireo>.' );
    sh.cp('-f', buildOptions.targetFile, '/Applications/Vireo');
};
//------------------------------------------------------------
target.v64 = function() {
    buildVireo(process.platform, 'esh');
};
//------------------------------------------------------------
target.vjs = function() {
    buildVireo('emscripten', 'vireo');
};
//------------------------------------------------------------
target.vjs_canvas2d = function() {
    buildCanvas2d('emscripten');
};
//------------------------------------------------------------
target.vjs_linx = function() {
    buildLinx('emscripten');
};
//------------------------------------------------------------
target.vjs_playground = function() {
    buildVireo('emscripten', 'vireo');
    buildLinx('emscripten');
    buildCanvas2d('emscripten');
    // copy file to the gh-pages playgournd as well.
    sh.cp('-f', '../dist/vireo.js', '../Documents/gh-pages/playground');
};
//------------------------------------------------------------
target.clean = function() {
    console.log('Clean all.');
    sh.rm('-rf', buildOptions.objRoot);
    sh.rm('-f', buildOptions.targetFile);
    sh.rm('-f', '../dist/*');

    if (process.platform === 'win32' || process.platform === 'win64') {
        sh.rm('-rf', './asm');
    }
};
