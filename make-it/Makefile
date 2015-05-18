# Vireo make file for linux/unix

OBJDIR=./objs
INCDIR=../source/include
BIN=../bin

COMMANDLINE = main.cpp
CORE = EggShell.cpp VireoMerged.cpp Thread.cpp Timestamp.cpp CEntryPoints.cpp
IO = FileIO.cpp Canvas2d.cpp DebugGPIO.cpp

OBJS = $(COMMANDLINEOBJS) $(COREOBJS) $(IOOBJS)
COMMANDLINEOBJS = $(COMMANDLINE:%.cpp=$(OBJDIR)/%.o)
COREOBJS = $(CORE:%.cpp=$(OBJDIR)/%.o)
IOOBJS = $(IO:%.cpp=$(OBJDIR)/%.o)

DEPS = $(OBJS:%.o=%.d)

#-O3 high optimization
#-Os is small (pretty much the same, but smaller and for clang 10/2013 faster)

CFLAGS += $(EXTRACFLAGS)
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
    CFLAGS += -I$(INCDIR) -Wall -MMD

    ifdef DEBUG
        CCOPT = -O0
        STRIP =
        CFLAGS += -DVIREO_DEBUG
    else
        ifeq ($(UNAME_S),Darwin)
            CCOPT = -Oz
        else
            CCOPT = -O3
        endif
        STRIP = strip esh
    endif

    ifeq ($(UNAME_S),Linux)
        ifeq ($(TARGETARCH),ARMv5)
            # Build a library for an ARMv5 target
            CC=arm-none-linux-gnueabi-g++
            CFLAGS+= $(CCOPT) -fPIE -DVIREO_DYNAMIC_LIB
            LDFLAGS+= -L. -pie -Wl,-E
        else
            ifeq ($(TARGETARCH),XuBlaze)
                # Build a library for an ARMv5 target
                CC=mb-g++
                CFLAGS+= $(CCOPT)  -DkVireoOS_XuBlaze -fmessage-length=0 -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax -ffunction-sections -fdata-sections
                LDFLAGS+= -Wl,-T -Wl,../source/XuBlaze/lscript.ld -L ../source/XuBlaze/standalone_bsp_0/microblaze_0/lib  -mlittle-endian -mcpu=v9.2 -mxl-soft-mul -Wl,--no-relax -Wl,--gc-sections -Wl,--start-group,-lxil,-lgcc,-lc,-lstdc++,--end-group
            else
                CC=g++
                CFLAGS+= -pthread $(CCOPT) $(TARGETARCH) -fdata-sections -ffunction-sections
                LDFLAGS+= -s -Wl,--gc-sections
                # LDSTATIC+= -static
            endif
        endif
        ifeq ($(TARGETARCH),XuBlaze)
            LIBs = -L ../source/XuBlaze/standalone_bsp_0/microblaze_0/lib
        else
             PROGRAM_DIR = /usr/local/bin
             LIBS = -lrt
        endif
    endif
    ifeq ($(UNAME_S),Darwin)
        # gcc settings
        # CFLAGS=-I$(INCDIR) -O3 -MMD $(TARGETARCH)
        # CC=g++
        # clang settings (has been about 33% smaller)
        CC=clang++
        LDFLAGS+= -dead_strip
        CFLAGS+= -pthread $(CCOPT) $(TARGETARCH) -fno-rtti -fno-exceptions -std=c++11
        PROGRAM_DIR=/Applications/Vireo
    endif
endif

.PHONY: install clean v32 v64 lARMv5 help
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
	$(STRIP)

lc:
	@cat ../source/core/*.cpp >allcpp.txt
	# SED needs double $ to get past make var expansion
	@sed -e 's=//.*$$==' -e'/^ *$$/d' allcpp.txt >allcpp2.txt
	@wc -l allcpp2.txt
	@rm allcpp.txt allcpp2.txt

#========= 32 bit builds host platfrom
v32:
	if ! ( [ -a esh ] && [ `file esh | cut -d ' ' -f 3` == "32-bit" ] ); then make clean; fi;
	make TARGETARCH=-m32 esh
	$(STRIP)

#========= 32 bit builds host platfrom
v32mini:
	if ! ( [ -a esh ] && [ `file esh | cut -d ' ' -f 3` == "32-bit" ] ); then make clean; fi;
	make TARGETARCH=-m32 EXTRACFLAGS=-DVIREO_MINI esh
	$(STRIP)

#========= 32 bit builds host platfrom
v64:
	if ! ( [ -a esh ] && [ `file esh | cut -d ' ' -f 3` == "64-bit" ] ); then make clean; fi;
	make TARGETARCH=-m64 esh
	$(STRIP)

#========= uBlaze
uBlaze:
	# Experimental static link target
	make TARGETARCH=XuBlaze slmicro
	$(STRIP)

#========= 32 ARMv5
lARMv5:
	if ! [ -a libvireo.so ]; then make clean; fi;
	make TARGETARCH=ARMv5 libvireo.so
	arm-none-linux-gnueabi-strip libvireo.so

#========= Use makefile designed for emscripten builds
vjs:
	# Just buid everything
	make -f EmMakefile clean vjs install

#========= Build documentation
dox:
	cd ../source; doxygen

#========= node.js native module
node_js:
	node-gyp configure build

help:
	@echo 'Execute "make simple"  to build the default esh executable'
	@echo '        "make v32"     to build a 32-bit esh executable'
	@echo '        "make v64"     to build a 64-bit esh executable'
	@echo '        "make vjs"     to build a java script version'
	@echo '        "make dox"     to build documentation'
	@echo '        "make lARMv5"  to build the libvireo.so library for an ARMv5 target'
	@echo
	@echo '        "make install" to install esh to $(PROGRAM_DIR), uses sudo'
	@echo '        "make clean"   to delete $(OBJDIR) and backup files'
	@echo '        "make lc"      to count the lines of code'
	@echo '        "make"         to print this help dialogue'
	@echo ''
	@echo 'Options can be combined. For example:'
	@echo ''
	@echo '        "make clean simple install"'
	@echo ''
	@echo 'To build debug versions with symbols and extra asserts, define the DEBUG flag:'
	@echo ''
	@echo '        "make clean simple install DEBUG=1"'
	@echo ''

# Build the executable with symbols stripped
esh: $(OBJDIR) $(OBJS)
	$(CC) -o $@ $(TARGETARCH) $(LDFLAGS) $(OBJS) $(LIBS)

libvireo.so: $(OBJDIR) $(COREOBJS) $(IOOBJS) $(COMMANDLINEOBJS)
	$(CC) $(LDFLAGS) -o $@ $(OBJS) $(LIBS)

slmicro: $(OBJDIR) ../source/micro/StaticMicroMain.cpp ../source/core/Math.cpp
	rm -f $(OBJDIR)/*.o
	rm -f $(OBJDIR)/*.d
	$(CC) $(CFLAGS) -DVIREO_STATIC_LINK -c ../source/micro/StaticMicroMain.cpp -o $(OBJDIR)/StaticMicroMain.o
	$(CC) $(CFLAGS) -DVIREO_STATIC_LINK -DVIREO_DEBUG_GPIO_STDIO -c ../source/io/DebugGPIO.cpp -o $(OBJDIR)/DebugGPIO.o
	$(CC) $(CFLAGS) -DVIREO_STATIC_LINK -c ../source/core/Math.cpp -o $(OBJDIR)/Math.o
	$(CC) $(CFLAGS) -DVIREO_STATIC_LINK -c ../source/core/Queue.cpp -o $(OBJDIR)/Queue.o
	$(CC) $(CFLAGS) -DVIREO_STATIC_LINK -c ../source/core/ExecutionContext.cpp -o $(OBJDIR)/ExecutionContext.o
	$(CC) -o $@ $(LDFLAGS) $(LDSTATIC) $(OBJDIR)/StaticMicroMain.o $(OBJDIR)/Math.o $(OBJDIR)/DebugGPIO.o $(LIBS) $(OBJDIR)/Queue.o $(OBJDIR)/ExecutionContext.o $(LIBS)

$(OBJDIR):
	mkdir -p $@

$(COMMANDLINEOBJS): $(OBJDIR)/%.o: ../source/CommandLine/%.cpp
	$(CC) $(CFLAGS) -c -o $@ $<

$(COREOBJS): $(OBJDIR)/%.o: ../source/core/%.cpp
	$(CC) $(CFLAGS) -c -o $@ $<

$(IOOBJS): $(OBJDIR)/%.o: ../source/io/%.cpp
	$(CC) $(CFLAGS) -c -o $@ $<

-include $(DEPS)
