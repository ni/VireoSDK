LINTARGS = --linelength=160 --filter=-whitespace/braces,-build/include_what_you_use,-build/header_guard,-readability/casting,-readability/todo,-build/namespaces

# Ignored warnings:
# whitespace/braces -- warn if function open brace is on its own line instead of end of previous line; why??
# build/include_what_you_use -- generates false positives for arguments namd 'string'
# readability/casting -- C-style casts.  AQBlock1* casts are common in polymorphic prims and reinterpret_cast would make the code harder to read.
# build/header_guard -- wants include guard to include file path (_SOURCE_INCLUDE_) prefixes, which is unnecessary since all of our includes are in the same folder

# Ignored warnings that should eventually be turned on:
# readability/todo -- required usernames for all TODOs, probably a good idea, but we have too many without and no good way to assign
# build/namespaces - don't use 'using namespace X'

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

