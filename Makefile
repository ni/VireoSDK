# Copyright (c) 2020 National Instruments
# SPDX-License-Identifier: MIT

# Makefile for TravisCI

.PHONY: native js testjs testnative

all: native js

native:	simple

lint:
	@cd make-it/cpplint && make $@

simple v32 v64 help:
	cd make-it && make $@

vjs js:
	cd make-it && make vjs

unittest:
	cd make-it && make $@

test: testnative testjs

testhttpbin:
	cd test-it && node test.js -j -t httpbin --dots

testjs:
	cd test-it && node test.js -j --dots

testnative:
	cd test-it && node test.js -n --dots

clean:
	cd make-it && make clean && make -f EmMakefile clean
