# Copyright (c) 2020 National Instruments
# SPDX-License-Identifier: MIT

LINTARGS = --quiet --linelength=160 --filter=-build/header_guard,-readability/casting,-whitespace/braces

# Ignored warnings:
# build/header_guard -- wants include guard to include file path (_SOURCE_INCLUDE_) prefixes, which is unnecessary since all of our includes are in the same folder
# readability/casting -- C-style casts.  AQBlock1* casts are common in polymorphic prims and reinterpret_cast would make the code harder to read.

XLINTARGS = $(subst ' ',,$(LINTARGS))

lint:
	@echo Running cpplint on Vireo source...
	@python ./cpplint.py $(XLINTARGS) $(INCSRCS) $(COMMANDLINESRCS) $(CORESRCS) $(IOSRCS) 2>&1

include ../Makefile

.DEFAULT_GOAL=lint

COMMANDLINESRCS = $(COMMANDLINE:%.cpp=../../source/CommandLine/%.cpp)
CORESRCS = $(CORE:%.cpp=../../source/core/%.cpp)
IOSRCS = $(IO:%.cpp=../../source/io/%.cpp)
INCSRCS = $(wildcard ../../source/include/*.h)
