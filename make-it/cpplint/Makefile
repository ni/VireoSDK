LINTARGS = --linelength=160 --filter=-whitespace/braces,-build/header_guard,-readability/casting

# Ignored warnings:
# whitespace/braces -- warn if function open brace is on its own line instead of end of previous line; why??
# readability/casting -- C-style casts.  AQBlock1* casts are common in polymorphic prims and reinterpret_cast would make the code harder to read.
# build/header_guard -- wants include guard to include file path (_SOURCE_INCLUDE_) prefixes, which is unnecessary since all of our includes are in the same folder

XLINTARGS = $(subst ' ',,$(LINTARGS))

lint:
	@echo Running cpplint on Vireo source...
	@python ./cpplint.py $(XLINTARGS) $(INCSRCS) $(COMMANDLINESRCS) $(CORESRCS) $(IOSRCS) 2>&1

include ../Makefile

.DEFAULT_GOAL=lint

COMMANDLINESRCS = $(COMMANDLINE:%.cpp=../../source/CommandLine/%.cpp)
CORESRCS = $(CORE:%.cpp=../../source/core/%.cpp)
IOSRCS = $(IO:%.cpp=../../source/io/%.cpp)
INCSRCS = ../../source/include/*.h

