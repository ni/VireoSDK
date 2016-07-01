# Makefile for TravisCI

all:
	cd make-it; node make.js clean vjs

test:
	echo "==================== Test ===================="
	cd test-it; node njs-run-test.js
