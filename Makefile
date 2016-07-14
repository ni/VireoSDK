# Makefile for TravisCI

.PHONY: native js testjs testnative

all: native js

native:
	cd make-it; make simple

js:
	cd make-it; make vjs

test: testnative testjs

testjs:
	cd test-it; ./test.js -j

testnative:
	cd test-it; ./test.js -n

clean:
	cd make-it; make clean
