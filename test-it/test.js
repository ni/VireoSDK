#!/usr/bin/env node
// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(async function () {
    'use strict';
    // Node Test runner for *.via files against Vireo Targets
    // Config file: testList.json

    // Disable new APIs in node 20
    global.fetch = undefined;
    global.Blob = undefined;

    require('colors');
    var fs = require('fs'),
        jsdiff = require('diff'),
        path = require('path'),
        cp = require('child_process'),
        xhr2 = require('xhr2'),
        vireo;

    var dots = false;
    var app = {};
    app.testFailures = {};
    app.totalResultLines = 0;

    // var blacklist = null;

    // Constructor function for TestFailure objects
    var TestFailure = function (testName, testResults) {
        this.name = testName;
        this.results = testResults;
    };

    // Check the test config for any errors and duplicate test suite names
    var checkTestConfig = function (testMap, testFile) {
        var keys = Object.keys(testMap);

        // Check for test suite properties
        if (keys.length === 0) {
            console.log('Error: ' + testFile + ' is missing test suites');
            return false;
        }

        // Check for "js" and "native" testsuites
        if (testMap.js === undefined || testMap.native === undefined) {
            console.log('Error: ' + testFile + ' is missing tests for "js" and "native" (These are required for defaults in the test.js)');
            return false;
        }

        // Check all testsuites for correct properties ('include' and 'tests')
        for (var prop in testMap) {
            if (Object.prototype.hasOwnProperty.call(testMap, prop)) {
                // Make sure 'include' and 'tests' are arrays
                var includeCount = 0;
                if (testMap[prop].include !== undefined) {
                    if (Array.isArray(testMap[prop].include)) {
                        includeCount = testMap[prop].include.length;
                    } else {
                        console.log('Error: ' + testFile + ' testsuite: ' + prop + ' is not an array\n');
                        return false;
                    }
                }
                if (Array.isArray(testMap[prop].tests)) {
                    if (includeCount === 0 && testMap[prop].tests.length === 0) {
                        console.log('Error: ' + testFile + ' testsuite: ' + prop + ' is missing Array "include" or "tests"');
                        return false;
                    }
                } else {
                    console.log('Error: ' + testFile + ' testsuite: ' + prop + ' has inproper "include" or "tests" properties');
                    return false;
                }
            }
        }
        return true;
    };

    // A recursive function to parse all of the tests from the test suite includes.
    // Makes sure no circular dependencies exist by keeping track of existing includes already parsed for tests (circMap).
    var getTests = function (testsuite, testsuiteName, testMap, circMapIn) {
        var testlist = [];
        var circMap = circMapIn;

        if (testsuite === undefined) {
            return testlist;
        }
        if (circMap === undefined) {
            circMap = {};
        }
        circMap[testsuiteName] = true; // Set the dependency in the map
        if (testsuite.include !== undefined && testsuite.include.length !== 0) {
            // Parse through the 'include' dependencies as a DFS
            testsuite.include.forEach(function (include) {
                // Verify that the testsuite exists in the testMap
                if (Object.prototype.hasOwnProperty.call(testMap, include)) {
                    // Make sure not to recurse on a previously processed dependency
                    if (circMap[include] === undefined) {
                        testlist = testlist.concat(getTests(testMap[include], include, testMap, circMap));
                    }
                } else {
                    console.log('The test list doesn\'t have a testsuite named: ' + include);
                    process.exit(1);
                }
            });
        }

        // Concat the tests that exist in the current testsuite to the list (if any exist)
        if (testsuite.tests.length !== 0) {
            testlist = testlist.concat(testsuite.tests);
        }

        return testlist;
    };

    // Load all of the tests
    var loadTests = function (testFile) {
        var testListString,
            testMap;
        try {
            testListString = fs.readFileSync(testFile).toString();
            testMap = JSON.parse(testListString).tests;
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('Missing testList.json file');
            } else {
                console.log('Could not parse testList.json');
            }
        }
        // Check the format of the input test list
        if (checkTestConfig(testMap, testFile)) {
            return testMap;
        }
        return undefined;
    };

    // Filter function to check if a file is a '.via'
    var isViaFile = function (name) {
        return path.extname(name) === '.via';
    };

    // Compare the two strings and check for equality.
    // This is the way that we test the inputs for vireo to the expected
    // outputs.
    var compareResults = function (testName, oldResultsIn, newResultsIn, msec) {
        var diffs = [],
            results;
        var oldResults = oldResultsIn.replace(/\r+\n/gm, '\n').replace(/\0/gm, '\n');
        var newResults = newResultsIn.replace(/\r+\n/gm, '\n').replace(/\0/gm, '\n');
        var cleanNewResults = newResults.replace(/^\/\/.*\n/gm, ''); // use \n instead of $ so entire line is deleted; don't leave blank line
        var i = 0;
        var lineCount = 0;
        var len = cleanNewResults.length;

        for (i = 0; i < len; i += 1) {
            if (cleanNewResults[i] === '\n') {
                lineCount += 1;
            }
            i += 1; // TODO mraj this seems strange (look at history)
        }
        app.totalResultLines += lineCount;

        if (oldResults === cleanNewResults) {
            if (dots === true) {
                process.stdout.write('.');
            } else {
                console.log('Test for "' + testName + '" passed. (' + msec + 'ms)');
            }
        } else {
            if (dots === true) {
                console.log('');
            }
            console.log(('Test for "' + testName + '" failed.').red);
            diffs = jsdiff.diffLines(oldResults, cleanNewResults);
            results = '';
            diffs.forEach(function (part) {
                var color = 'grey';
                color = part.removed ? 'red' : color;
                color = part.added ? 'green' : color;
                results = results.concat(part.value[color]);
            });

            var key = testName.toString();
            if (!Object.prototype.hasOwnProperty.call(app.testFailures, key)) {
                app.testFailures[key] = new TestFailure(testName, results);
            }
        }
    };

    // Process the via files for the provided tester function and compare with
    // the results file of the same name but with a '.vtr' extension
    var runTestCore = function (testName, tester, testFinished, execOnly) {
        var resultsFileName = 'ExpectedResults/' + path.basename(testName, '.via') + '.vtr';
        var oldResults = '';
        var noOldResults = false;

        if (!execOnly) {
            try {
                oldResults = fs.readFileSync(resultsFileName).toString();
            } catch (e) {
                if (e.code === 'ENOENT') {
                    console.log('File not Found: ' + resultsFileName);
                    process.exit(1);
                }
            }
        }
        var hrstart = process.hrtime();
        tester(testName, function (newResults) {
            var hrend = process.hrtime(hrstart);
            var msec = hrend[1] / 1000000;

            if (execOnly) {
                console.log(newResults);
            } else if (noOldResults) {
                // Save the generated resutls as the new reference
                // Add the file name to a list that can be printed at the end.
            } else {
                compareResults(testName, oldResults, newResults, msec);
            }
            testFinished();
        });
    };

    // Process a provided test and return the stdout from the vireo.js runtime
    var RunVJSTest = function (testName, testFinishedCB) {
        var viaCode;
        var viaPath = 'ViaTests/' + testName;
        vireo.eggShell.reboot();
        try {
            viaCode = fs.readFileSync(viaPath).toString();
        } catch (e) {
            if (e.code === 'ENOENT') {
                viaPath = testName;
                try {
                    viaCode = fs.readFileSync(viaPath).toString();
                } catch (e) {
                    if (e.code === 'ENOENT') {
                        viaCode = '';
                        throw new Error('No such test ' + testName);
                    }
                }
            }
        }
        var testOutput = '';
        vireo.eggShell.setPrintFunction(function (text) {
            testOutput += text + '\n';
        });
        // Vireo unit tests can't fire JS events, so register no-op registration functions
        vireo.eventHelpers.setRegisterForControlEventsFunction(function () {
            // no-op
        });
        vireo.eventHelpers.setUnRegisterForControlEventsFunction(function () {
            // no-op
        });

        try {
            vireo.eggShell.loadVia(viaCode, {debugging: true});
        } catch (ex) {
            testFinishedCB(testOutput);
            return;
        }

        vireo.eggShell.executeSlicesUntilClumpsFinished().then(function () {
            testFinishedCB(testOutput);
        });
    };

    // Setup the esh binary for via execution
    var RunNativeTest = function (testName, testFinishedCB) {
        var newResults = '';
        var exec = '../dist/esh';
        var viaPath = 'ViaTests/' + testName;
        // Look for Windows exec or Linux/Unix
        if (process.platform === 'win32') {
            exec = '../dist/Debug/esh';
        }

        try {
            newResults = cp.execFileSync(exec, [viaPath, '--debugging']).toString();
        } catch (e) {
            // If Vireo detects an error it will return non zero
            // and exec will throw an exception, so catch the results.
            newResults = e.stdout.toString() + e.stderr.toString();
        }
        testFinishedCB(newResults);
    };

    // Setup the vireo.js runtime for instruction execution
    var setupVJS = async function () {
        var vireoHelpers = require('../');
        vireo = await vireoHelpers.createInstance();
        vireo.httpClient.setXMLHttpRequestImplementation(xhr2);
    };

    // Testing functions for processing the tests against vireo.js or esh binary
    var JSTester = function (testName, testFinishedCB, execOnly) {
        runTestCore(testName, RunVJSTest, testFinishedCB, execOnly);
    };

    var NativeTester = function (testName, testFinishedCB, execOnly) {
        runTestCore(testName, RunNativeTest, testFinishedCB, execOnly);
    };
    var errorCode = 0;

    var report = function () {
        // ----------------------------------------------------------------------
        // Run twice to look for global state issues.
        // Some tests are failing on a second iteration during the test execution.
        // This is being tracked by defect: DE9032
        // testFiles.map(tester);
        // ----------------------------------------------------------------------

        // Check the testFailures (if any)
        if (Object.keys(app.testFailures).length > 0) {
            console.log('\n=============================================');
            console.log('The following tests failed: ' + Object.keys(app.testFailures).length);
            console.log('=============================================\n');
            for (var test in app.testFailures) {
                if (Object.prototype.hasOwnProperty.call(app.testFailures, test)) {
                    console.log('===========================');
                    console.log(app.testFailures[test].name);
                    console.log('===========================');
                    console.log(app.testFailures[test].results);
                    console.log('\n');
                }
            }
            // Make sure to set error code for ci failure
            errorCode = 1;
        } else {
            console.log('\n============================================='.green);
            console.log('SUCCESS: All tests passed for this execution!'.green);
            console.log('=============================================\n'.green);
        }
    };

    // -------------------- Main Function
    // TODO mraj this needs to be refactored, complexity 38 is too high
    /* eslint complexity: ["error", 40]*/
    (async function () {
        var configFile = 'testList.json',
            testMap = loadTests(configFile),
            testCategory = '',
            testFiles = [],
            testSet = new Set(),
            arg = '',
            argv = process.argv.slice(),
            testNative = false,
            printOutTests = false,
            tester = false,
            once = false,
            execOnly = false,
            individualTests = false,
            showHelp = false;

        argv.shift(); // node path
        argv.shift(); // script path

        // check config file
        if (testMap === undefined) {
            process.exit(1);
        }

        while (argv.length > 0) {
            arg = argv[0];
            if (arg === '-j') {
                await setupVJS();
                tester = JSTester;
            } else if (arg === '-n') {
                tester = NativeTester;
                testNative = true;
            } else if (arg === '--dots') {
                dots = true;
            } else if (arg === '-e') {
                execOnly = true;
                once = true;
            } else if (arg === '-all' || arg === '--all') {
                console.log('--all option deprecated; the default behavior is to run all tests in the default test list if one is not specified');
            } else if (arg === '-o' || arg === '-once' || arg === '--once') {
                once = true;
            } else if (arg === '-t') {
                argv.shift(); // shift to testname
                testCategory = argv[0];
            } else if (arg === '-l') {
                argv.shift(); // shift to testname
                testCategory = argv[0];
                printOutTests = true;
            } else {
                if (isViaFile(arg)) {
                    testSet.add(arg);
                } else if (arg.substring(0, 1) === '-') {
                    if (arg !== '-h') {
                        console.log('Error: Unknown option ' + arg);
                    }
                    showHelp = true;
                } else {
                    console.log('Error: Invalid input file provided: ' + arg + ' (Must be *.via)');
                    process.exit(1);
                }
                individualTests = true;
            }
            if (arg === '-h' || showHelp) {
                console.log('Usage: ./test.js [options] [via test files]');
                console.log('Options:');
                console.log('-n                  Run the tests against the native vireo target (esh)');
                console.log('-j                  Run the tests against the javascript target (vireo.js)');
                console.log('-t [test suite]     Run the tests in the given test suite');
                console.log('-l [test suite]     List the tests that would be run in given test suite,');
                console.log('                        or list the test suite options if not provided');
                console.log('-e                  Execute the test suite or tests provided and show their');
                console.log('                        raw output; do not compute pass/fail');
                console.log('-h                  Print this usage message');
                console.log('--once              Will only run the tests once (default is to run twice)\n');
                process.exit(0);
            }

            argv.shift();
        }
        if (isViaFile(testCategory)) {
            console.log('Error: Argument to -t or -l should be a test suite name, not a via file');
            testCategory = undefined;
            printOutTests = true;
        }
        if (individualTests && testCategory !== '') {
            console.log('Error: Use either [-l|-t] <test suite> or individual .via test files, not both');
            process.exit(1);
        }
        // If no tester listed in the arguments, assume vireo.js
        if (!tester) {
            await setupVJS();
            tester = JSTester;
        }

        // If a test is provide in command line, just run those
        if (!individualTests) {
            if (testCategory === undefined) {
                var usageMessage = 'Usage: test.js [-l|-t] [';
                for (var key in testMap) {
                    if (Object.prototype.hasOwnProperty.call(testMap, key)) {
                        usageMessage += key + '|';
                    }
                }
                usageMessage = usageMessage.substring(0, usageMessage.length - 1);
                usageMessage += ']\n';
                console.log(usageMessage);
                process.exit(0);
            }
            // Provide default testCategory if none provided
            if (testCategory === '') {
                if (testNative) {
                    testCategory = 'native';
                } else {
                    testCategory = 'js';
                }
            }

            // Setup test files from the given category
            var testObj = testMap[testCategory];
            if (testObj === undefined) {
                console.log('No such test suite list ' + testCategory.red);
                console.log('Use test.js -l to list test suites');
                process.exit(1);
            }
            testSet = new Set(getTests(testObj, testCategory, testMap));
        }

        // Filter the test list just in case
        testFiles = Array.from(testSet).filter(isViaFile).map(function (filePath) {
            var testFileName = path.basename(filePath);
            return testFileName;
        });
        testFiles.sort();

        if (printOutTests) {
            console.log('\n============================================='.cyan);
            console.log('Tests to be run: '.cyan + testFiles.length);
            console.log('============================================='.cyan);
            testFiles.forEach(function (test) {
                console.log(test);
            });
            process.exit(0);
        }

        // Output which tests are being run
        if (!execOnly) {
            var target = testNative ? 'esh (native)' : 'vireo.js';
            var testCat = testCategory ? '\'' + testCategory + '\' ' : '';
            console.log('\n============================================='.cyan);
            console.log(('Running ' + testCat + 'tests against ' + target).cyan);
            console.log('============================================='.cyan);
        }

        // If no tester listed in the arguments, assume vireo.js
        if (!tester) {
            await setupVJS();
            tester = JSTester;
        }

        if (testFiles.length > 0) {
            var runNextTest = function (testFiles, chain) {
                if (testFiles.length > 0) {
                    var testName = testFiles.shift();
                    tester(testName, function () {
                        runNextTest(testFiles, chain);
                    }, execOnly);
                } else if (!execOnly) {
                    chain();
                }
            };
            var saveTestFiles = testFiles.slice();

            runNextTest(testFiles, function () {
                if (once) {
                    report();
                    process.exit(errorCode);
                } else {
                    runNextTest(saveTestFiles, function () {
                        report();
                        process.exit(errorCode);
                    });
                }
            });
        } else {
            console.log('Nothing to test.  Use test.js -h for help');
            process.exit(1);
        }
    }());
}());
