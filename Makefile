# Makefile for TravisCI

all:
	git clone https://github.com/urho3d/emscripten-sdk.git ./emsdk
	cd ./emsdk
	ls
	# ./emsdk activate latest
	source ./emsdk_env.sh
	emcc -v
	# cd ..
	# cd make-it; node make.js clean vjs

test:
	echo "Testing goes here"
	cd test-it; ./run-tests.sh
