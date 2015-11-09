# Makefile for TravisCI

all:
	printenv
	cd make-it; node make.js clean v64

test:
	echo "Testing goes here"
