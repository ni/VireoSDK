# Vireo make file for linux/unix

OBJDIR=./objs
INCDIR=../source/include
BIN=../bin


.PHONY: clean help v-js
.DEFAULT_GOAL=help

clean:
	rm -f objs/*

help:
	@echo 'Execute "make v-js"    to build vireo.js'
	@echo '        "make"         to print this help dialogue'
	@echo ''


# Instead of trying fake out make for emscripten just build it explicitly
# To install the Emscripten SDK 
#   https://github.com/kripken/emscripten/wiki

# Note on debugging:
#   https://github.com/kripken/emscripten/wiki/Optimizing-Code

# On optimization, for size, as of 5/2014 The resulting Vireo.js built with emscripten 1.16
# yielded the following sizes:
#  -O3 833k / -Os 760k / -Oz 719k


EM_OPT= -Oz -s NO_EXIT_RUNTIME=1
EMFLAGS= -I$(INCDIR) -DkVireoOS_emscripten $(EM_OPT)

EM_EXPORTS = -s EXPORTED_FUNCTIONS="[\
    '_Vireo_Version', \
    '_EggShell_Create', \
    '_EggShell_REPL',\
    '_EggShell_ExecuteSlices',\
    '_EggShell_Delete',\
    '_EggShell_GetValueInt32'\
    ]" -s RESERVED_FUNCTION_POINTERS=10

EM_BC_FILES = objs/VireoMerged.bc\
    objs/EggShell.bc\
    objs/Thread.bc\
    objs/TimeTypes.bc\
    objs/FileIO.bc\
    objs/CEntryPoints.bc

v-js:
	make clean
	mkdir -p objs
	emcc $(EMFLAGS) ../source/core/VireoMerged.cpp -o objs/VireoMerged.bc
	emcc $(EMFLAGS) ../source/core/EggShell.cpp -o objs/EggShell.bc
	emcc $(EMFLAGS) ../source/core/Thread.cpp -o objs/Thread.bc
	emcc $(EMFLAGS) ../source/core/TimeTypes.cpp -o objs/TimeTypes.bc
	emcc $(EMFLAGS) ../source/io/FileIO.cpp -o objs/FileIO.bc
	emcc $(EMFLAGS) ../source/core/CEntryPoints.cpp -o objs/CEntryPoints.bc
	emcc $(EM_OPT)  $(EM_BC_FILES) $(EM_EXPORTS) -o objs/vireo.js
	cp objs/vireo.js ../Documents/dox/online/vireo.js

v-jscounter:
	make clean
	mkdir -p objs
	emcc $(EMFLAGS) ../source/core/VireoMerged.cpp -o objs/VireoMerged.bc
	emcc $(EMFLAGS) ../source/core/EggShell.cpp -o objs/EggShell.bc
	emcc $(EMFLAGS) ../source/core/Thread.cpp -o objs/Thread.bc
	emcc $(EMFLAGS) ../source/core/TimeTypes.cpp -o objs/TimeTypes.bc
	emcc $(EMFLAGS) ../source/io/FileIO.cpp -o objs/FileIO.bc
	emcc $(EMFLAGS) ../source/CommandLine/SimpleCountMain.cpp -o objs/SimpleCountMain.bc
	emcc $(EM_OPT)  objs/SimpleCountMain.bc $(EM_BC_FILES) -o objs/Counter.html

v-jssdl:
	make clean
	mkdir -p objs
	emcc $(EMFLAGS) ../source/core/VireoMerged.cpp -o objs/VireoMerged.bc
	emcc $(EMFLAGS) ../source/core/EggShell.cpp -o objs/EggShell.bc
	emcc $(EMFLAGS) ../source/core/Thread.cpp -o objs/Thread.bc
	emcc $(EMFLAGS) ../source/core/TimeTypes.cpp -o objs/TimeTypes.bc
	emcc $(EMFLAGS) ../source/io/FileIO.cpp -o objs/FileIO.bc
	emcc $(EMFLAGS) ../source/io/Sdl3d.cpp -o objs/Sdl3d.bc
	emcc $(EMFLAGS) ../source/core/CEntryPoints.cpp -o objs/CEntryPoints.bc
	emcc $(EMFLAGS) ../source/CommandLine/SimpleCountMain.cpp -o objs/SimpleCountMain.bc
	emcc $(EM_OPT)  objs/SimpleCountMain.bc $(EM_BC_FILES) objs/Sdl3d.bc -s LEGACY_GL_EMULATION=1 -o vireo_sdl.html


# In at least the initial test the compression made start up mcuh slower (2x?)
# it was much better to let the server use gzip automatically

#emcc $(EM_OPT) $(EM_BC_FILES) -o vireo.html --compression $(EM_DIR)third_party/lzma.js/lzma-native,$(EM_DIR)third_party/lzma.js/lzma-decoder.js,LZMA.decompress
#emcc $(EM_OPT) $(EM_BC_FILES) -o vireo.js

-include $(DEPS)

