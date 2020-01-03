# Vireo

[![NPM Version](https://img.shields.io/npm/v/vireo.svg)](https://www.npmjs.com/package/vireo)
[![Nuget Version](https://img.shields.io/nuget/v/vireo.svg)](https://www.nuget.org/packages/vireo)
[![Travis Build Status](https://travis-ci.org/ni/VireoSDK.svg)](https://travis-ci.org/ni/VireoSDK)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/ni/VireoSDK?svg=true)](https://ci.appveyor.com/project/vireobot/vireosdk)
[![Dependencies Status](https://david-dm.org/ni/VireoSDK/status.svg)](https://david-dm.org/ni/VireoSDK)
[![Development Dependencies Status](https://david-dm.org/ni/VireoSDK/dev-status.svg)](https://david-dm.org/ni/VireoSDK?type=dev)
[![NPM Downloads](https://img.shields.io/npm/dt/vireo.svg)](https://www.npmjs.com/package/vireo)

A compact parallel execution runtime for VIs (virtual instruments) saved in VI assembly format (.via files).

The Vireo project provides a subset of LabVIEW runtime functionality for small targets. Example usages are WebVIs and the EV3 support in the _LabVIEW Module for LEGO® MINDSTORMS®_. The LabVIEW features supported are primarily defined by the features needed for the VIA files generated by LabVIEW NXG.

# Getting VireoSDK Source

Before starting Vireo development it is recommended that you create a GitHub Fork and enable CI integration in your fork. For more information see [CONTRIBUTING.md](CONTRIBUTING.md).

# Building

## Prerequisites for all targets

### Software requirements

- [git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/) (>8, latest LTS release recommended)
- GNU Make and GNU core utilities (see following)

### Installing GNU Make and GNU core utilities

On Windows you can get these by installing the [Chocolatey](https://chocolatey.org/) package manager and then running the following commands to install GNU Make and the GNU core utilities:

   ```console
   choco install make
   choco install gnuwin32-coreutils.portable
   ```

For other platforms, see platform documentation for installing a compatible version of GNU make and GNU core utilities.

### Fetching tooling dependencies

On all platforms run the following in the `VireoSDK` folder to install JavaScript-based tooling needed for the test infrastructure:

   ```console
   npm install
   ```

## vireo.js target

### Software requirements

- emsdk toolchain (see following)

### Installing the emsdk toolchain

The emsdk toolchain is used to cross-compile Vireo to Vireo.js to run in Node.js and web browser environments.

1. Create a directory outside of the `VireoSDK` folder to store the emsdk toolchain binaries.

2. Do **ONE** of the following:
   - download and extract the [latest emsdk](https://github.com/juj/emsdk#downloads) zip distribution
   - clone the [juj/emsdk](https://github.com/juj/emsdk) GitHub repository

3. If you download the zip archive you will need to run the following command inside the extracted folder to bring it up to date:

   ```console
   emsdk update
   ```

4. From either the extracted folder or the cloned emsdk repository run the following commands:

   ```console
   emsdk install 1.39.5-fastcomp
   emsdk activate 1.39.5-fastcomp
   emcc -v # should match the sdk version
   ```

NOTE: The above commands only add `emcc` to the path for your current shell session. The emsdk tool provides the `emsdk activate SOME_SDK_VERSION --global` option but there is a known issue where using the `--global` flag [hangs on Windows](https://github.com/juj/emsdk/issues/138).

Instead it is recommended that in a new shell where you wish to build Vireo you run the `emsdk_env.bat` (Windows) or `emsdk_env.sh` (Mac / Linux) from the emsdk folder to update your path variables for the shell session.

For more detailed information about emsdk see the [juj/emsdk](https://github.com/juj/emsdk) GitHub repository.

### Building vireo.js

To create a default (release) build of vireo.js:

```console
make js
```

The above default build of vireo.js is equivalent to:

```console
make js BUILD=release
```

To create a debug build of vireo.js:

```console
make js BUILD=debug
```

To create a profile build of vireo.js:

```console
make js BUILD=profile
```

Notice that vireo.js is created in the `dist` folder based on the `BUILD` type. For example, a default vireo.js build equivalent to `BUILD=release` will be located at: `dist/wasm32-unknown-emscripten/release/vireo.js`

## Vireo Windows Native target

### Software requirements

- Visual Studio 2013, Visual Studio 2015, or Visual Studio 2017 with C++ support

### Building Vireo Windows Native

1. Open the `Vireo_VS/VireoCommandLine.sln` solution in Visual Studio
2. Perform a Debug build

Notice the esh executable placed in the `dist` folder.

## Vireo Linux Native target

### Software requirements

- GCC 4.9

### Building Vireo Linux Native

From the root directory run the following:

```console
make native
```

Notice the esh executable placed in the `dist` folder.

There is a flag you can pass to `make` to enable [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer):

```console
make native ASAN=1
```

## Vireo MacOS Native target

### Software requirements

- XCode

### Building Vireo MacOS Native

Open the `Vireo_Xcode/VireoEggShell.xcodeproj`

If you prefer to build from the command line, the instructions for building Vireo Linux Native will work on macOS as well.

# Running Tests

## Running VTR Tests

The VTR (Vireo Test Result) test suite runs .via files located in the `test-it/ViaTests` directory, captures the standard output during the execution, and compares it to the .vtr output file located in `test-it/ExpectedResults`. The VTR test suite is the primary test suite for testing execution behavior for Vireo.

### From the root directory

To run all the native and Node.js vtr tests:

```console
make test
```

To run all the native vtr tests:

```console
make testnative
```

To run all the Node.js vtr tests:

```console
make testjs
```

### From within the `test-it` directory

To run all the native and Node.js vtr tests:

```console
node ./test.js
```

To run all the native vtr tests:

```console
node ./test.js -n
```

To run all the Node.js vtr tests:

```console
node ./test.js -j
```

To run a specific test suite:

```console
node ./test.js -t <test suite>
```

To run an individual test:

```console
node ./test.js HelloWorld.via
```

### Listing Out VTR Tests (`-l [test suite]`)

Since the test suites can be created recursively from other test suites in the configuration file, the `-l` command line argument lists all of the tests to be run for the test suite name provided. Example:

```console
node ./test.js -l native
```

will list the tests that would be run against the `native` test suite.

### VTR Test Suite Runner Help

```console
$ node ./test.js -h
Usage: node ./test.js [options] [via test files]
Options:
 -n                  Run the tests against the native vireo target (esh)
 -j                  Run the tests against the JavaScript target (vireo.js)
 -t [test suite]     Run the tests in the given test suite
 -l [test suite]     List the tests that would be run in given test suite,
                        or list the test suite options if not provided
 -e                  Execute the test suite or tests provided and show their
                        raw output; do not compute pass/fail
 -h                  Print this usage message
 --once              Will only run the tests once (default is to run twice)
```

## Running Karma Tests

The karma test suite is a web browser only test suite used to test the JS public API for Vireo along with the portion of Vireo features which are JS specific (i.e. the actual HTTP communication layer of the HTTP Client feature). The karma test suite also runs the VTR test suite as part of its execution.

To run the full karma test suite (you will need [Firefox](https://www.mozilla.org/en-US/firefox/new/) installed on your machine):

```console
npm run test
```

To debug the karma tests, use the command below which will print a URL to the console. Open the URL on a browser and open the browser's debugging tool:
```console
npm run test-manual
```

## Running the HTTP test server

Vireo tests rely on a locally running instance of the [httpbin](https://httpbin.org/) server for testing the HTTP Client functionality. If the httpbin server is not running locally, the test suite will **skip** tests which rely on it. If you would like to run the HTTP client tests locally these instructions show you how.

### Software requirements

- [Python](https://www.python.org/) (>= 2.7.9)
- [pip](https://pypi.org/project/pip/)

### Setup

1. Ensure python (correct version) and pip are available on the path.
2. From a command line in the `VireoSDK` directory or elsewhere do `pip install tox` to globally install the [tox](http://tox.readthedocs.io/en/latest/) tool.

### Starting the Server

1. Open a command prompt in the `VireoSDK` directory.
2. Run the `npm run httpbin` command. This will install dependencies of httpbin if necessary and start the httpbin server locally.

   Note: On Windows you can alternatively execute `npm run httpbin-start` to start the httpbin server in a new console window.
3. With the server running in a new window you can now run the tests which rely on the HTTP client:
    - Running HTTP karma tests
    ```console
    npm run test
    ```
    - Running HTTP VTR tests
    ```console
    make testhttpbin
    ```

# Adding Tests

## Adding to the VTR test suite

### Test Configuration

The `.via` test files to run are located in the `test-it/ViaTests` folder. The expected result from the stdout of running the test `.via` file is located in a file of the same name but with the extension `.vtr` inside the `test-it/ExpectedResults` folder. The test name exists within a test suite in the `test-it/testList.json` file.

The `testList.json` file has two required properties for each test suite name:

#### include

An array of strings that are names to other test suites. These test suite names are processed recursively to accumulate tests together into one list of tests to run (Duplicates are omitted if overlap exists between test suites).

#### tests

An array of strings which contains the list of `.via` files the test suite should run.

### Adding a Test Suite

Here is a simple example that adds the test suite `rpi` with the `RpiTest.via` file to the test manager.

1. Put the `RpiTest.via` file in the `test-it/ViaTests` folder and put the `RpiTest.vtr` file in the `test-it/ExpectedResults` folder.
2. Then add this example code to the `testList.json` file:

    ```json
    "rpi": {
        "include": [ "common" ],
        "tests": [
            "RpiTest.via"
        ]
    }
    ```

    This will add the test suite `rpi` which will include the test `RpiTest.via` and all of the tests included in the `common` test suite.

3. Try it out to verify it works and your tests pass:

```console
node ./test.js -n -t rpi
```

# Updating Vireo Documentation

We are using [Doxygen](http://www.stack.nl/~dimitri/doxygen/) to generate our documentation. This tool lets us annotate our source code and generate documentation from it. We are currently using version *1.8.6*.

Installers can be found [here](http://www.stack.nl/~dimitri/doxygen/download.html). On Windows use the 64-bit version.

Once Doxygen is installed run the following command from any directory in the repo:

```console
npm run doxygen
```

It will find and use the Doxyfile file in the source directory to generate documentation files in the `gh-pages` directory:

The main html file in the `gh-pages` directory is called index.html.

# Legal

Features beyond the core set that can be accessed directly from VIA source written by hand should be considered experimental, and subject to change at any time. A complete list of disclaimers and terms is described in LICENSE.txt.
