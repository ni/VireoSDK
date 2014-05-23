# Vireo make file for linux/unix

OBJDIR=./objs
INCDIR=../source/include
BIN=../bin

COMMANDLINE = main.cpp
CORE = EggShell.cpp VireoMerged.cpp Thread.cpp TimeTypes.cpp CEntryPoints.cpp
IO = FileIO.cpp

OBJS = $(COMMANDLINEOBJS) $(COREOBJS) $(IOOBJS)
COMMANDLINEOBJS = $(COMMANDLINE:%.cpp=$(OBJDIR)/%.o)
COREOBJS = $(CORE:%.cpp=$(OBJDIR)/%.o)
IOOBJS = $(IO:%.cpp=$(OBJDIR)/%.o)

DEPS = $(OBJS:%.o=%.d)

#-O3 high optimization
#-Os is small (pretty much the same, but smaller and for clang 10/2013 faster)

ifeq ($(OS),Windows_NT)
    CCFLAGS += -D WIN32
    ifeq ($(PROCESSOR_ARCHITECTURE),AMD64)
      #  plat stuff
    endif
    ifeq ($(PROCESSOR_ARCHITECTURE),x86)
      #  plat stuff
    endif
else
    UNAME_S := $(shell uname -s)
    CFLAGS=-I$(INCDIR) -Wall -MMD
    ifeq ($(UNAME_S),Linux)
        ifeq ($(TARGETARCH),ARMv5)
            # Build a library for an ARMv5 target
            CC=arm-none-linux-gnueabi-g++
            CFLAGS+=-Os -fPIE -DVIREO_DYNAMIC_LIB
            LDFLAGS+=-L. -pie -Wl,-E
        else
            CC=g++
            CFLAGS+=-O3 $(TARGETARCH)
        endif
        PROGRAM_DIR = /usr/local/bin
        LIBS = -lrt
    endif
    ifeq ($(UNAME_S),Darwin)
        # gcc settings
        # CFLAGS=-I$(INCDIR) -O3 -MMD $(TARGETARCH)
        # CC=g++
        # clang settings (has been about 33% smaller)
        CC=clang++
        CFLAGS+=-O3 $(TARGETARCH)
        PROGRAM_DIR=/Applications/Vireo
    endif
endif

.PHONY: install clean v32 v64 lARMv5 help dox
.DEFAULT_GOAL=help

install: esh
	@username=`whoami`; \
	if test $$username == "root"; \
	then \
	  cp esh $(PROGRAM_DIR); \
	else \
	  sudo cp esh $(PROGRAM_DIR); \
	fi
	@echo '==> esh installed to $(PROGRAM_DIR)'

clean:
	rm -f esh libvireo.so $(BIN)/esh *~ $(INCDIR)/*~
	rm -rf $(OBJDIR)

simple:
	make esh
	strip esh

v32:
	if ! ( [ -a esh ] && [ `file esh | cut -d ' ' -f 3` == "32-bit" ] ); then make clean; fi;
	make TARGETARCH=-m32 esh
	strip esh

v64:
	if ! ( [ -a esh ] && [ `file esh | cut -d ' ' -f 3` == "64-bit" ] ); then make clean; fi;
	make TARGETARCH=-m64 esh
	strip esh

lARMv5:
	if ! [ -a libvireo.so ]; then make clean; fi;
	make TARGETARCH=ARMv5 libvireo.so
	arm-none-linux-gnueabi-strip libvireo.so

dox:
	cd ../source; doxygen

help:
	@echo 'Execute "make v32"     to build a 32-bit esh executable'
	@echo '        "make v64"     to build a 64-bit esh executable'
	@echo '        "make lARMv5"  to build the libvireo.so library for an ARMv5 target'
	@echo
	@echo '        "make install" to install esh to $(PROGRAM_DIR), uses sudo'
	@echo '        "make clean"   to delete $(OBJDIR) and backup files'
	@echo '        "make dox"     to build documentation (doxygen must be installed)'
	@echo '        "make"         to print this help dialogue'
	@echo ''
	@echo 'Options can be combined. For example:'
	@echo ''
	@echo '        "make clean v64 install"'

# Build the executable with symbols stripped
esh: $(OBJDIR) $(OBJS)
	$(CC) -o $@ $(TARGETARCH) $(LDFLAGS) $(OBJS) $(LIBS)

libvireo.so: $(OBJDIR) $(COREOBJS) $(IOOBJS) $(COMMANDLINEOBJS)
	$(CC) $(LDFLAGS) -o $@ $(OBJS) $(LIBS)

$(OBJDIR):
	mkdir -p $@

$(COMMANDLINEOBJS): $(OBJDIR)/%.o: ../source/CommandLine/%.cpp
	$(CC) $(CFLAGS) -c -o $@ $<

$(COREOBJS): $(OBJDIR)/%.o: ../source/core/%.cpp
	$(CC) $(CFLAGS) -c -o $@ $<

$(IOOBJS): $(OBJDIR)/%.o: ../source/io/%.cpp
	$(CC) $(CFLAGS) -c -o $@ $<

-include $(DEPS)

