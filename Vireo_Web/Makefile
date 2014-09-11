# Vireo make file for linux/unix

OBJDIR=./objs
INCDIR=../source/include
BIN=../bin
SITEDIR=../Documents/gh-pages/playground

.PHONY: clean install help vjs dox
.DEFAULT_GOAL=help

clean:
	rm -f objs/*
	
dox:
	cd ../source; doxygen


install: 
	mkdir -p $(SITEDIR)
	cp objs/vireo.js $(SITEDIR)/
	cp objs/vireo.js.mem $(SITEDIR)/
	cp SiteSource/*.html $(SITEDIR)/
	cp SiteSource/*.via $(SITEDIR)/
	cp SiteSource/*.json $(SITEDIR)/
	@echo '==> website files copied to  $(SITEDIR)'

help:
	@echo 'Execute "make vjs"     to build vireo.js'
	@echo '        "make clean"   to remove intermediate files'
	@echo '        "make dox"     to rebuild doxygen web content'
	@echo '        "make install" to copy files to web directory'
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

EM_OPT= -O3 -s NO_EXIT_RUNTIME=1 -fno-exceptions
EMFLAGS= -I$(INCDIR) -DkVireoOS_emscripten -DVIREO_LEAN $(EM_OPT)

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
    objs/Canvas2D.bc\
    objs/FileIO.bc\
    objs/Emscripten.bc\
    objs/CEntryPoints.bc

vjs:
	make clean
	mkdir -p objs
	emcc $(EMFLAGS) ../source/core/VireoMerged.cpp -o objs/VireoMerged.bc
	emcc $(EMFLAGS) ../source/core/EggShell.cpp -o objs/EggShell.bc
	emcc $(EMFLAGS) ../source/core/Thread.cpp -o objs/Thread.bc
	emcc $(EMFLAGS) ../source/core/TimeTypes.cpp -o objs/TimeTypes.bc
	emcc $(EMFLAGS) ../source/io/Canvas2D.cpp -o objs/Canvas2D.bc
	emcc $(EMFLAGS) ../source/io/FileIO.cpp -o objs/FileIO.bc
	emcc $(EMFLAGS) ../source/io/Emscripten.cpp -o objs/Emscripten.bc
	emcc $(EMFLAGS) ../source/core/CEntryPoints.cpp -o objs/CEntryPoints.bc
	emcc $(EM_OPT)  $(EM_BC_FILES) $(EM_EXPORTS) -o objs/vireo.js

# In at least the initial test the compression made start up mcuh slower (2x?)
# it was much better to let the server use gzip automatically

#emcc $(EM_OPT) $(EM_BC_FILES) -o vireo.html --compression $(EM_DIR)third_party/lzma.js/lzma-native,$(EM_DIR)third_party/lzma.js/lzma-decoder.js,LZMA.decompress
#emcc $(EM_OPT) $(EM_BC_FILES) -o vireo.js

-include $(DEPS)

