# Makefile for TravisCI

all:
	cd make-it; node make.js clean v64

test:
	echo "Testing goes here"
