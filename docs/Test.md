# Test

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

Note: Windows 10 may include a a copy of python seen by running `which python` resulting in the path: `C:\Users\<USER>\AppData\Local\Microsoft\WindowsApps\python.exe`. Make sure to install a copy of python from `python.org`.

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
