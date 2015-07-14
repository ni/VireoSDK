require('shelljs/make');
sh = require('shelljs');
path = require('path');

// Default setup
buildOptions = {
    "cc": "not-set",
    "link": "not-set",
    "cflags": "not-set",
    "define": "-DVIREO_STDIO=1 -DVIREO_FILESYSTEM=1 -DVIREO_FILESYSTEM_DIRLIST=1",
    "optimization": "-Oz",
    "architechure": "-m64",
    "include": "../source/include",
    "sourceRoot": "../",
    "objRoot": "./objs/",
    "targetFile": "esh",
    "filesToLink": ""
};

function compile(opts, fileName) {

    var objFileName = opts.objRoot + path.basename(fileName) + '.o';

    var cl = opts.cc + ' ' +
        opts.cflags + ' ' +
        opts.optimization + ' ' +
        opts.architechure + ' ' +
        '-I' + opts.include + ' ' +
        opts.define + ' ' +
        '-c ' +
        '-o ' + objFileName + ' ' +
        opts.sourceRoot + fileName;

    opts.filesToLink += ' ' + objFileName;

    console.log('Compiling ' + fileName + ' -> ' + objFileName);
    sh.exec(cl);
    return 0;
}

function link(opts) {
    var cl = opts.link + ' ' +
        '-o ' + opts.targetFile + ' ' +
        opts.ldflags + ' ' +
        opts.architechure + ' ' +
        opts.filesToLink;

    console.log('Linking...');
    console.log(cl);
    sh.exec(cl);
    sh.exec('strip ' + opts.targetFile);
}

function configureSettings(opts, targetPlatform) {
    // Set options based on platformm being run on, or
    // in some cases for cross platfrom compiling.
    // the latter has not yet been done.

    opts.filesToLink = "";
    if (targetPlatform === 'darwin') {
        opts.cc     = 'clang++';
        opts.optimization= '-Oz';
        opts.cflags = '-Wall -MMD -pthread -fno-rtti -fno-exceptions -std=c++11';
        opts.link   = 'clang++';
        opts.ldflags= '-dead_strip';
    } else if (targetPlatform === 'linux') {
        opts.cc     = 'g++';
        opts.optimization= '-O3';
        opts.cflags = '-pthread -fdata-sections -ffunction-sections';
        opts.link   = 'g++';
        opts.ldflags= '-s -Wl,--gc-sections';
    } else if (targetPlatfrom === 'uBlaze') {
        opts.cc     = 'mb-g++';
        opts.cflags = '-pthread -fdata-sections -ffunction-sections -DkVireoOS_XuBlaze -fmessage-length=0 -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax';
        opts.optimization= '-O3';
        opts.ldflags= 'not-set';
        // LDFLAGS+= -Wl,-T -Wl,../source/XuBlaze/lscript.ld -L ../source/XuBlaze/standalone_bsp_0/microblaze_0/lib  -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax -Wl,--gc-sections -Wl,--start-group,-lxil,-lgcc,-lc,-lstdc++,--end-group
    } else if (targetPlatform === 'emscripten') {
        console.log("target TBD");
        sh.exit(1);
        opts.cc     = 'emcc';
        opts.optimization= '-O2';
        opts.cflags = '-Wall -MMD -pthread -fno-rtti -fno-exceptions -std=c++11';
        opts.link   = 'emcc';
        opts.ldflags= '-dead_strip';
        /*
        See EmMakefile for more details.

        the list of exported symbols should be pulled directly from the source files.
        and can be done as part of the compile process.

        #EM_OPT= -g4 -s NO_EXIT_RUNTIME=1 -fno-exceptions
        EM_OPT= -Os -s NO_EXIT_RUNTIME=1 -fno-exceptions --memory-init-file 0
        EMFLAGS= -I$(INCDIR) -DkVireoOS_emscripten -DVIREO_LEAN $(EM_OPT)
        EMLIBRARY= --js-library ../source/io/library_canvas2d.js --js-library ../source/io/library_httpClient.js
        EM_WRAP= --pre-js $(CORESOURCEDIR)/vireo.preamble.js --post-js $(CORESOURCEDIR)/vireo.postamble.js
        */
    } else if (targetPlatform === 'win32') {
        console.log("target TBD");
        sh.exit(1);
    } else if (targetPlatform === 'win64') {
        console.log("target TBD");
        sh.exit(1);
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

target.all = function() {
    console.log(" make options: ");
    console.log(" node make n64     // local native 64 bit ");
    console.log(" node make dox     // build doxygen executable ");
    console.log(" node make clean   // delete objects ");
};

target.dox = function() {
    console.log(" Build Doxygen.");
    sh.exec('cd ../source && doxygen');
};

target.install = function() {
    if (!sh.test('-e', '/Applications/Vireo')) {
        sh.mkdir('/Applications/Vireo');
    }
    sh.cp('-f', buildOptions.targetFile, '/Applications/Vireo');
};

target.n64 = function() {
    var opts = configureSettings(buildOptions, process.platform);

    compile(opts, 'source/CommandLine/main.cpp');

    compile(opts, 'source/core/EggShell.cpp');
    compile(opts, 'source/core/VireoMerged.cpp');
    compile(opts, 'source/core/Thread.cpp');
    compile(opts, 'source/core/Timestamp.cpp');
    compile(opts, 'source/core/CEntryPoints.cpp');

    compile(opts, 'source/io/FileIO.cpp');
    compile(opts, 'source/io/DebugGPIO.cpp');
    compile(opts, 'source/io/Linx.cpp');
    compile(opts, 'source/io/Canvas2d.cpp');

    link(opts);
    return 0;
};

target.clean = function() {
    console.log("Clean all.");
    sh.rm('-rf', buildOptions.objRoot);
    sh.rm('-f', buildOptions.targetFile);
    sh.mkdir(buildOptions.objRoot);
    return 0;
};
