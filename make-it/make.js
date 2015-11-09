//------------------------------------------------------------
// makefile for vireo based on node.js and shelljs
//------------------------------------------------------------
require('shelljs/make');
sh = require('shelljs');
fs = require('fs');
path = require('path');
colors = require('colors');

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
buildVars = {
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
    var objFilePath = opts.objRoot + 'win/' + path.basename(filePath) + '.obj';
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
    var objFilePath = opts.objRoot + 'clang/' + path.basename(filePath) + '.o';
    opts.filesToLink += ' ' + objFilePath;

    var command = '';
    if (fileIsNewer(filePath, objFilePath)) {
        command =
            'clang++ ' +
            '-pthread -Wall -m64 -MMD -fno-rtti -fno-exceptions -std=c++11 ' +
            (opts.debug ? '-O0' : '-Oz') + ' ' +
            '-I' + opts.include + ' ' +
            opts.define + ' ' +
            // -c Build a library (not executable)
            '-c -o ' + objFilePath + ' ' +
            filePath;

        sh.exec(command);
    }
}
//------------------------------------------------------------
function compileEmscripten(opts, filePath) {
    var objFilePath = opts.objRoot + 'ems/' + path.basename(filePath) + '.bc';
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
    var objFilePath = opts.objRoot + 'gcc/' + path.basename(filePath) + '.o';
    opts.filesToLink += ' ' + objFilePath;

    var command =
        'g++ ' +
        '-pthread -fdata-sections -ffunction-sections' + ' ' +
        (opts.debug ? '-O0' : '-O2') + ' ' +
        '-I' + opts.include + ' ' +
        opts.define + ' ' +
        '-c -o ' + objFilePath + ' ' +
        filePath;

    sh.exec(command);
}
//------------------------------------------------------------
//!
function compileLint(opts, filePath) {
    var objFilePath = opts.objRoot + opts.objPlatformSuffix + path.basename(filePath) + '.lint';
    opts.filesToLink += ' ' + objFilePath;

    var command =
        'python cpplint/cpplint.py ' +
        // For now, allow lines this long.
        '--linelength=150 ' +
        // Filter: allow 'using namespace Vireo'
        '--filter=-build/namespaces' +
        // Filter allow old style c casts turned to reinterpret_cast<> style
        ',-readability/casting ' +
        // The file to lint
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
    console.log('stripping out symbols...'.cyan);
    sh.exec('strip esh');
}
//------------------------------------------------------------
function linkGcc(opts, fileName) {
    var command = 'g++ ';
        // -lrt for clock_gettime (linux)
        command += '-lrt ';
        // gc-sections for dead stripping
        command += '-s -Wl,--gc-sections ';
        command += '-o ' + fileName + ' ';
        command += opts.filesToLink;

    console.log(command);
    sh.exec(command);
    console.log('stripping out symbols...'.cyan);
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

    // wasm is not in main or incoming quite yet.
    // command += '-s WASM=1 ';

    command += '-s NO_EXIT_RUNTIME=1 ';
    command += '-g0 ';

    if (opts.sharedLib) {
        console.log('making shared Library');
        command += '-s SIDE_MODULE=1 ';
    } else {
        // MAIN_MODULE=2 triggers dead code stripping in the main module.
        // so any symbol need by the side module most be referenced by code
        // or added to the EXPORTED_FUNCTIONS set.

        // command += '-s MAIN_MODULE=2 ';
        command += '--pre-js ' + opts.sourceRoot + 'core/vireo.preamble.js ';
        command += '--post-js ' + opts.sourceRoot + 'core/vireo.postamble.js ';
    }

    if (opts.exports) {
        var exports_string = '\'' + opts.exports.join('\',\'') +  '\'';
        command += '-s EXPORTED_FUNCTIONS="[' + exports_string + ']" ';
    }
    // command += '-s NO_FILESYSTEM=1 ';
    // command += '-s RESERVED_FUNCTION_POINTERS=10 ';

    // Dist directory is where bower wants the js file.
    command += '-o ' + filePath;

    // Add the list files to link.
    command += opts.filesToLink  + ' ';

    console.log(command);
    sh.exec(command);

    var stats = fs.statSync(filePath);
    console.log (('Generated <' + filePath + '> size is ' + stats.size).cyan);

    return command;
}
//------------------------------------------------------------
function compile(opts, fileName) {
    var sourceFilePath = opts.sourceRoot + fileName;
    console.log( ('Compiling ' + fileName).cyan);
    opts.compiler(opts, sourceFilePath);
}
//------------------------------------------------------------
function link(opts, fileName) {
    console.log('linking...'.cyan);
    opts.linker(opts, fileName);
}
//------------------------------------------------------------
function configureSettings(opts, targetVars) {
    // Set options based on platformm being run on, or
    // in some cases for cross platfrom colmpiling.
    // the latter has not yet been done.
    opts.platform = targetVars.platform;
    opts.sharedLib = (targetVars.sharedLib === true);
    switch(targetVars.platform) {
        case 'darwin':
            // OSX Desktop
            opts.objPlatformSuffix =  'clang/';
            opts.compiler = compileClang;
            opts.linker = linkClang;
            break;
        case 'lint':
            opts.objPlatformSuffix =  'lint/';
            opts.compiler = compileLint;
            opts.linker = function(){};
            break;
        case 'linux':
            opts.objPlatformSuffix =  'gcc/';
            opts.compiler = compileGcc;
            opts.linker = linkGcc;
            break;
        case 'uBlaze':
            opts.objPlatformSuffix =  'uBlaze/';
            opts.compiler = compileGcc;
            // opts.cc     = 'mb-g++';
            // opts.cflags = '-DkVireoOS_XuBlaze -fmessage-length=0 -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax';
            // LDFLAGS+= -Wl,-T -Wl,../source/XuBlaze/lscript.ld -L ../source/XuBlaze/standalone_bsp_0/microblaze_0/lib  -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax -Wl,--gc-sections -Wl,--start-group,-lxil,-lgcc,-lc,-lstdc++,--end-group
            break;
        case 'emscripten':
            opts.objPlatformSuffix =  'ems/';
            var emscriptenPath = which('emcc');
            if (emscriptenPath) {
                console.log('using emcc at <' + emscriptenPath + '>');
            } else {
                console.log('Emscripten\'s "emcc" compiler must be configured for this shell.'.red);
                exit(1);
            }
            opts.compiler = compileEmscripten;
            opts.linker = linkEmscripten;
            break;
        case 'win32':
        case 'win64':
            sh.mkdir('-p', buildVars.objRoot + 'win/');
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
            break;
        case 'xcompile-ARMv5':
        case 'xcompile-ARM-cortexM3':
        case 'xcompile-ARM-cortexM4':
            console.log("target TBD");
            sh.exit(1);
            break;
        default:
            console.log("target TBD");
            sh.exit(1);
    }

    opts.filesToLink = '';
    opts.jsLibrries = null;
    opts.exports = null;
    opts.sharedLibrary = null;
    if (opts.objPlatformSuffix) {
        sh.mkdir('-p', buildVars.objRoot + opts.objPlatformSuffix);
    }
    return opts;
}

//------------------------------------------------------------
function buildVireo(targetOptions, outputName) {
    console.log('Build vireo for the <' + targetOptions.platform + '> platform');
    var opts = configureSettings(buildVars, targetOptions);

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
function buildCanvas2d(targetOptions) {
    var opts = configureSettings(buildVars, targetOptions);
    compile(opts, 'io/Canvas2d.cpp');
    opts.jsLibraries = [
        'io/library_canvas2d.js'
    ];

    link(opts, 'canvas2d');
}
//------------------------------------------------------------
function buildLinx(targetOptions) {
    var opts = configureSettings(buildVars, targetOptions);
    compile(opts, 'io/Linx.cpp');
    link(opts, 'linx');
}

//------------------------------------------------------------
function checkEmcc() {
    var emscriptenPath = which('emcc');
    if (!emscriptenPath) {
        console.log('No emcc found'.red);
        sh.exec('source EmSetup');
    }
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
    console.log(' Copying <' + buildVars.targetFile + '> to </Applications/Vireo>.' );
    sh.cp('-f', buildVars.targetFile, '/Applications/Vireo');
};
//------------------------------------------------------------
target.lint = function() {
    buildVireo({platform:'lint'});
};
//------------------------------------------------------------
target.v64 = function() {
    buildVireo({platform:process.platform}, 'esh');
};
//------------------------------------------------------------
target.vjs = function() {
    buildVireo({platform:'emscripten'}, 'vireo');
};
//------------------------------------------------------------
target.vjs_canvas2d = function() {
    buildCanvas2d({platform:'emscripten', sharedLib:true});
};
//------------------------------------------------------------
target.vjs_playground = function() {
    buildVireo({platform:'emscripten'}, 'vireo');
    buildLinx({platform:'emscripten', sharedLib:true});
    buildCanvas2d({platform:'emscripten', sharedLib:true});
    // copy file to the gh-pages playgournd as well.
    sh.cp('-f', '../dist/vireo.js', '../Documents/gh-pages/playground');
    sh.cp('-f', '../dist/linx.js', '../Documents/gh-pages/playground');
    sh.cp('-f', '../dist/canvas2d.js', '../Documents/gh-pages/playground');
};
//------------------------------------------------------------
target.clean = function() {
    console.log('Clean all.');
    sh.rm('-rf', buildVars.objRoot);
    sh.rm('-f', buildVars.targetFile);
    sh.rm('-f', '../dist/*');

    if (process.platform === 'win32' || process.platform === 'win64') {
        sh.rm('-rf', './asm');
    }
};
