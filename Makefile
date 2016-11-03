# Makefile for TravisCI

.PHONY: native js testjs testnative

all: native js

native:	simple

simple v32 v64:
	cd make-it; make $@

vjs js:
	cd make-it; make vjs

test: testnative testjs

testjs:
	cd test-it; ./test.js -j

testnative:
	cd test-it; ./test.js -n

clean:
	cd make-it; make clean
