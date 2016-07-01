# Makefile for TravisCI

all:
	cd make-it; node make.js clean vjs

test:
	echo "==================== Testing ===================="
	cd test-it; node njs-run-tests.js -j -all
