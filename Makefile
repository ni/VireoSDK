# Makefile for TravisCI

all:
	cd make-it; node make.js clean vjs

test:
	npm test
