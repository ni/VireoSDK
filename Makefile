# Makefile for TravisCI

all:
	pwd
	ls
	cd make-it; node make.js clean v64
	mkdir /home/travis/bin
	cp make-it/esh /home/travis/bin/esh
	ls -l make-it/esh
	which esh

test:
	echo "Testing goes here"
	cd test-it; ./run-tests.sh
