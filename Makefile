# Makefile for TravisCI

all:
	pwd
	ls
	cd make-it; node make.js clean v64
	cp make-it/esh /home/travis/bin/esh
	ls -l make-it/esh

test:
	echo "Testing goes here"
	cd test-it; ./run-tests
