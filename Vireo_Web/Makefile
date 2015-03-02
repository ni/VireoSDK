# Vireo make file for linux/unix

OBJDIR=./objs
INCDIR=../source/include
BIN=../bin
SITESOURCEDIR=../source/dox/playground
SITEDIR=../Documents/gh-pages/playground
TARGETDIR=../target-support/js
CORESOURCEDIR=../source/core
IOSOURCEDIR=../source/io

.PHONY: clean install help vjs dox
.DEFAULT_GOAL=help

clean:
	rm -f objs/*

dox:
	cd ../source; doxygen


install:
	mkdir -p $(SITEDIR)
	cp $(TARGETDIR)/vireo.js $(SITEDIR)/
	cp $(SITESOURCEDIR)/*.html $(SITEDIR)/
	cp $(SITESOURCEDIR)/*.via $(SITEDIR)/
	cp $(SITESOURCEDIR)/*.json $(SITEDIR)/
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

# On optimization, resulting Vireo.js # yielded the following sizes:
#
#  In early builds of emscripten high level optimizations (-O3 -Os) tended to fail though
#  Vireo had an alignment bug that may have caused the failures.
#
#  5/2014 using emcc 1.16
#  -O3 833k / -Os 760k / -Oz 719k
#
#  10/2014 using emcc 1.22.0
#  Data segment is now broken out to the vireo.js.asm file
#  -03 611k+35k  / -Os 571k+35k / -Oz 527k+35k  (all work)
#  Vireo has grown as well, so emscripten is getting better if the over all size has shrunk by about 20%

#EM_OPT= -g4 -s NO_EXIT_RUNTIME=1 -fno-exceptions
EM_OPT= -Os -s NO_EXIT_RUNTIME=1 -fno-exceptions --memory-init-file 0
EMFLAGS= -I$(INCDIR) -DkVireoOS_emscripten -DVIREO_LEAN $(EM_OPT)
EMLIBRARY= --js-library ../source/io/library_canvas2d.js
EM_WRAP= --pre-js $(CORESOURCEDIR)/vireo.preamble.js --post-js $(CORESOURCEDIR)/vireo.postamble.js

EM_EXPORTS = -s EXPORTED_FUNCTIONS="[\
    '_Vireo_Version', \
    '_EggShell_Create', \
    '_EggShell_REPL',\
    '_EggShell_ExecuteSlices',\
    '_EggShell_Delete',\
    '_EggShell_ReadDouble',\
    '_EggShell_WriteDouble',\
    '_EggShell_ReadValueString',\
    '_EggShell_WriteValueString'\
    ]" -s RESERVED_FUNCTION_POINTERS=10

EM_BC_FILES = objs/VireoMerged.bc\
    objs/TypeAndDataManager.Embind.bc\
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
	mkdir -p $(TARGETDIR)
	emcc $(EMFLAGS) $(CORESOURCEDIR)/VireoMerged.cpp -o objs/VireoMerged.bc
	emcc $(EMFLAGS) $(CORESOURCEDIR)/TypeAndDataManager.Embind.cpp --bind -o objs/TypeAndDataManager.Embind.bc
	emcc $(EMFLAGS) $(CORESOURCEDIR)/EggShell.cpp -o objs/EggShell.bc
	emcc $(EMFLAGS) $(CORESOURCEDIR)/Thread.cpp -o objs/Thread.bc
	emcc $(EMFLAGS) $(CORESOURCEDIR)/TimeTypes.cpp -o objs/TimeTypes.bc
	emcc $(EMFLAGS) $(IOSOURCEDIR)/Canvas2D.cpp -o objs/Canvas2D.bc
	emcc $(EMFLAGS) $(IOSOURCEDIR)/FileIO.cpp -o objs/FileIO.bc
	emcc $(EMFLAGS) $(IOSOURCEDIR)/Emscripten.cpp -o objs/Emscripten.bc
	emcc $(EMFLAGS) $(CORESOURCEDIR)/CEntryPoints.cpp -o objs/CEntryPoints.bc
	emcc $(EM_OPT) $(EM_WRAP) $(EMLIBRARY) $(EM_BC_FILES) $(EM_EXPORTS) -o $(TARGETDIR)/vireo.js

# In at least the initial test the compression made start up mcuh slower (2x?)
# it was much better to let the server use gzip automatically

#emcc $(EM_OPT) $(EM_BC_FILES) -o vireo.html --compression $(EM_DIR)third_party/lzma.js/lzma-native,$(EM_DIR)third_party/lzma.js/lzma-decoder.js,LZMA.decompress
#emcc $(EM_OPT) $(EM_WRAP) $(EM_BC_FILES) -o vireo.js

-include $(DEPS)
