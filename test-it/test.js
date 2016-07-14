#!/usr/bin/env node
'use strict';

// Node Test runner for *.via files against Vireo Targets
// Config file: testList.json

require('colors');
var fs = require('fs'),
    jsdiff = require('diff'),
    path = require('path'),
    cp = require('child_process'),
    vireo = {};


var app = {};
app.testFailures = {};
app.totalResultLines = 0;

var blacklist = null;

// Check the test config for any errors and duplicate test suite names
function CheckTestConfig(testMap, testFile) {
    var keys = Object.keys(testMap);

    // Check for test suite properties
    if (keys.length === 0) {
        console.log('Error: ' + testFile + ' is missing test suites');
        return false;
    }

    // Check for "js" and "native" testsuites
    if (testMap['js'] === undefined || testMap['native'] === undefined) {
        console.log('Error: ' + testFile + ' is missing tests for "js" and "native" (These are required for defaults in the test.js)');
        return false;
    }

    // Check all testsuites for correct properties ('include' and 'tests')
    for (var prop in testMap) {
        if (testMap.hasOwnProperty(prop)) {
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
                if (includeCount == 0 && testMap[prop].tests.length === 0) {
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
}

function GetTests(testsuite, testMap) {
    var testlist = [];
    if (testsuite == undefined)
        return testlist;
    if (testsuite.include !== undefined && testsuite.include.length !== 0) {
        testsuite.include.forEach(function(include) {
            if (testMap.hasOwnProperty(include)) {
                testlist = testlist.concat(GetTests(testMap[include], testMap));
            } else {
                console.log('The test list doesn\'t have a testsuite named: ' + include);
                process.exit(1);
            }
        });
    }

    if (testsuite.tests.length !== 0) {
        testlist = testlist.concat(testsuite.tests);
    }

    return testlist;
}


// Load all of the tests
function LoadTests(testFile) {
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
    if (CheckTestConfig(testMap, testFile)) {
        return testMap;
    } else {
        return undefined;
    }
}

// Constructor function for TestFailure objects
function TestFailure(testName, testResults) {
    this.name = testName;
    this.results = testResults;
}

// Filter function to check if a file is a '.via'
function IsViaFile(name) {
    return path.extname(name) === '.via';
}

// Open and process the blacklist JSON file
function GenerateBlacklist ()
{
    if (blacklist === null) {
        try {
            var fileContent = fs.readFileSync('testBlacklist.json').toString();
            var jsonObject = JSON.parse(fileContent);
            blacklist = jsonObject.blacklist;
        }
        catch (err)
        {
            if (err.code === 'ENOENT') {
               console.log ("WARNING: testBlacklist.json not present");
            } else {
               console.log ("WARNING: testBlacklist.json contains parse error");
            }
            blacklist = [];
        }
    }
}

// Filter function to check if a test is within the blacklist
function IsNotBlackList(name) {
    GenerateBlacklist();
    for (var i = 0; i < blacklist.length; i++)
    {
        var item = blacklist[i];
        if (item.filename === name) {
            return false;
        }
    }
    return true;
}

// Print out the blacklist of via tests
function PrintBlackList ()
{
    GenerateBlacklist();
    if (blacklist.length > 0) {
        console.log('\n');
        console.log('=====================================================================================');
        console.log('The following tests(' + blacklist.length + ') were not executed. They are blacklisted.');
        for (var i = 0; i < blacklist.length; i++) {
            var item = blacklist[i];
            console.log('  "' + item.filename + '"\t' + item.reason);
        }
        console.log('=====================================================================================');
    }
    else {
        console.log('=================================================================');
        console.log('There aren\'t tests that are blacklisted.');
        console.log('=================================================================');
    }
}

function PrintCharactersToConsole (testName, oldResults, cleanNewResults) {
    var firstDifferenceFound = false;
    var maxLength = oldResults.length;
    if (cleanNewResults.length > maxLength) {
        maxLength = cleanNewResults.length;
    }
    console.log('=======================================================');
    console.log('"' + testName + '"');
    console.log('Comparing oldResults(' + oldResults.length + ') vs cleanNewResults(' + cleanNewResults.length + ')');
    console.log('=======================================================');
    for (var i = 0; i < maxLength; i++) {
        var oldResultsText = '';
        if (i < oldResults.length) {
            oldResultsText = oldResults.charCodeAt(i);
        }
        var cleanNewResultsText = '';
        if (i < cleanNewResults.length) {
            cleanNewResultsText = cleanNewResults.charCodeAt(i);
        }
        var differenceText = '';
        if (!firstDifferenceFound && (i < oldResults.length) && (i < cleanNewResults.length) && oldResults[i] !== cleanNewResults[i]) {
            differenceText = ' <---------- Found first difference';
            firstDifferenceFound = true;
        }
        console.log(oldResultsText + '\t' + cleanNewResultsText + '\t' + differenceText);
    }
}
// Compare the two strings and check for equality.
// This is the way that we test the inputs for vireo to the expected
// outputs.
function CompareResults(testName, oldResults, newResults, msec) {
    var diffs = [],
        results;
    oldResults = oldResults.replace(/\r\n/gm, "\n");
    newResults = newResults.replace(/\r\n/gm, "\n");
    var cleanNewResults = newResults.replace(/^\/\/.*\n/gm, ''); // use \n instead of $ so entire line is deleted; don't leave blank line
    var i = 0;
    var lineCount = 0;
    var len = cleanNewResults.length;

    for (i = 0; i < len; i++) {
        if ("\n" === cleanNewResults[i++]) {
           lineCount += 1;
        }
    }
    app.totalResultLines += lineCount;

    if (oldResults === cleanNewResults) {
        console.log('Test for "' + testName + '" passed. (' + msec + 'ms)' );
    } else {
        console.log(('Test for "' + testName + '" failed.').red);
        diffs = jsdiff.diffLines(oldResults, cleanNewResults);
        results = "";
        diffs.forEach(function(part){
            var color = part.added ? 'green' : part.removed ? 'red' : 'grey';
            results = results.concat(part.value[color]);
        });

        var key = testName.toString();
        if (!app.testFailures.hasOwnProperty(key)) {
            app.testFailures[key] = new TestFailure(testName, results);
        }
    }
}

// Process the via files for the provided tester function and compare with
// the results file of the same name but with a '.vtr' extension
function RunTestCore(testName, tester, execOnly)
{
    var resultsFileName = 'results/' + path.basename(testName, '.via') + '.vtr';
    var oldResults = '';
    var noOldResults = false;

    try {
        oldResults = fs.readFileSync(resultsFileName).toString();
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log('File not Found: ' + resultsFileName);
            process.exit(1);
        }
    }
    var hrstart = process.hrtime();
    var newResults = tester(testName);
    var hrend = process.hrtime(hrstart);
    var msec = hrend[1]/1000000;

    if (execOnly) {
      console.log(newResults);
    } else if (noOldResults) {
        // Save the generated resutls as the new reference
        // Add the file name to a list that can be printed at the end.
    } else {
        CompareResults(testName, oldResults, newResults, msec);
    }
}

// Process a provided test and return the stdout from the vireo.js runtime
function RunVJSTest(testName) {
    var viaCode;
    console.log('Executing "' + testName + '"');
    vireo.reboot();
    try {
        viaCode = fs.readFileSync(testName).toString();
    } catch (e) {
        if (e.code === 'ENOENT') {
            viaCode = '';
            throw "No such test " + testName;
        }
    }

    vireo.stdout = '';
    if (viaCode !== '' && vireo.loadVia(viaCode) === 0) {
    	while (vireo.executeSlices(1000000)) {}
    }

    return vireo.stdout;
}

// Setup the esh binary for via execution
function RunNativeTest(testName) {
    var newResults = '';
    var exec = '../dist/esh';
    // Look for Windows exec or Linux/Unix
    if (process.platform === 'win32') {
        exec = '../dist/Debug/esh';
    }

    try {
        newResults = cp.execFileSync(exec, [ testName ]).toString();
    } catch (e) {
        // If Vireo detects an error it will return non zero
        // and exec will throw an exception, so catch the results.
        newResults = e.stdout.toString();
    }
    return newResults;
}

// Setup the vireo.js runtime for instruction execution
function SetupVJS()
{
    vireo = require('../dist/vireo.js');
    vireo.stdout = '';
    vireo.core.print = function(text) { vireo.stdout = vireo.stdout + text + '\n'; };
}

// Testing functions for processing the tests against vireo.js or esh binary
function JSTester(testName, execOnly) { RunTestCore(testName, RunVJSTest, execOnly); }
function NativeTester(testName, execOnly) { RunTestCore(testName, RunNativeTest, execOnly); }

//------------------------------------------------------------
(function Main() {
    var configFile = 'testList.json',
        testMap = LoadTests(configFile),
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
        singleTest = false,
        errorCode = 0;

    argv.shift(); // node path
    argv.shift(); // script path

    // check config file
    if (testMap === undefined) {
        process.exit(1);
    }

    while(argv.length > 0) {
        arg = argv[0];
        if  (arg === '-j') {
            SetupVJS();
            tester = JSTester;
        } else if (arg === '-n') {
            tester = NativeTester;
            testNative = true;
        } else if (arg === '-e') {
            execOnly = true;
            once = true;
        } else if (arg === '-once') {
            once = true;
        } else if (IsViaFile(arg)) {
            testSet.add(arg);
            singleTest = true;
        } else if (arg === '-t') {
            argv.shift(); // shift to testname
            testCategory = argv[0];
        } else if (arg === '-l') {
            argv.shift(); // shift to testname
            testCategory = argv[0];
            printOutTests = true;
        } else {
            console.log('Invalid argument parameter: ' + arg);
            errorCode = 1;
            process.exit(errorCode);
        }
        argv.shift();
    }

    // If no tester listed in the arguments, assume vireo.js
    if (!tester) {
        SetupVJS();
        tester = JSTester;
    }

    // If a test is provide in command line, just run those
    if (!singleTest) {
        if (testCategory == undefined) {
            var usageMessage = "Usage: test.js [-l|-t] [";
            for (var key in testMap) {
                usageMessage += key + "|";
            }
            usageMessage = usageMessage.substring(0, usageMessage.length-1)
            usageMessage += "]\n";
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
        if (testObj == undefined) {
            console.log("No such test suite list " + testCategory.red);
            console.log("Use test.js -l to list test suites");
            process.exit(1)
        }
        testSet = new Set(GetTests(testObj, testMap));
    }

    // Filter the test list just in case
    testFiles = Array.from(testSet).filter(IsViaFile);
    testFiles.sort();

    if (printOutTests) {
        console.log("\n=============================================".cyan);
        console.log('Tests to be run: '.cyan + testFiles.length);
        console.log("=============================================".cyan);
        testFiles.forEach(function(test) {
            console.log(test);
        });
        process.exit(0);
    }

    // Output which tests are being run
    var target = testNative ? "esh (native)" : "vireo.js";
    console.log("\n=============================================".cyan);
    console.log(("Running tests against " + target).cyan);
    console.log("=============================================".cyan);


    if (testFiles.length > 0) {
        testFiles.map(
            function(testName) { return tester(testName, execOnly); }
        );

        // Possibly run only once (default is false, so run twice)
        if (!once) {
            testFiles.map(
              function(testName) { return tester(testName, execOnly); }
            );
        }

        // Don't diff the test
        if (execOnly) {
            return;
        }
        // ----------------------------------------------------------------------
        // Run twice to look for global state issues.
        // Some tests are failing on a second iteration during the test execution.
        // This is being tracked by defect: DE9032
        // testFiles.map(tester);
        // ----------------------------------------------------------------------

        // Check the testFailures (if any)
        if (Object.keys(app.testFailures).length > 0) {
            console.log("=============================================");
            console.log("The following tests failed: " + Object.keys(app.testFailures).length);
            console.log("=============================================");
            for (var test in app.testFailures) {
                if (app.testFailures.hasOwnProperty(test)) {
                    console.log("===========================");
                    console.log(app.testFailures[test].name);
                    console.log("===========================");
                    console.log(app.testFailures[test].results);
                    console.log('\n');
                }
            }
            // Make sure to set error code for travis-ci failure
            errorCode = 1;
        }
        else {
            console.log("\n=============================================".green);
            console.log("SUCCESS: All tests passed for this execution!".green);
            console.log("=============================================\n".green);
        }

    } else {
        console.log("Nothing to test (try and run with -all)");
        errorCode = 1;
    }
    
    // Provide an exit code
    process.exit(errorCode);
})();
