# Makefile for TravisCI

all:
	cd make-it; node make.js clean vjs

test:
	echo "Testing goes here"
	cd test-it; ./run-tests.sh
