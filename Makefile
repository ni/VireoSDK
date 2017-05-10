# Makefile for TravisCI

.PHONY: native js testjs testnative

all: native js

native:	simple

lint:
	@cd make-it/cpplint; make $@

simple v32 v64:
	cd make-it; make $@

vjs js:
	cd make-it; make vjs

test: testnative testjs

testjs:
	cd test-it; ./test.js -j --dots

testnative:
	cd test-it; ./test.js -n --dots

clean:
	cd make-it; make clean
