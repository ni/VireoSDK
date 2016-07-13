// Node program #2 a simple test runner
// a bit of an improvement over bash.

require('colors');
fs = require('fs');
jsdiff = require('diff');
path = require('path');
cp = require('child_process');
vireo = {};


var app = {};
app.testFailures = {};
app.totalResultLines = 0;

var blacklist = null;

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
        console.log('=====================================================================================')
        console.log('The following tests(' + blacklist.length + ') were not executed. They are blacklisted.')
        for (var i = 0; i < blacklist.length; i++) {
            var item = blacklist[i];
            console.log('  "' + item.filename + '"\t' + item.reason);
        }
        console.log('=====================================================================================')
    }
    else {
        console.log('=================================================================')
        console.log('There aren\'t tests that are blacklisted.')
        console.log('=================================================================')
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
    for (i = 0; i < maxLength; i++) {
        var oldResultsText = '';
        if (i < oldResults.length) {
            oldResultsText = oldResults.charCodeAt(i)
        }
        var cleanNewResultsText = '';
        if (i < cleanNewResults.length) {
            cleanNewResultsText = cleanNewResults.charCodeAt(i)
        }
        var differenceText = '';
        if (!firstDifferenceFound && (i < oldResults.length) && (i < cleanNewResults.length) && oldResults[i] != cleanNewResults[i]) {
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

    for (i=count=0; i < len; i++) {
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
            noCurrentResults = true;
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
    console.log('Executing "' + testName + '"');
    vireo.reboot();
    var newResults = '';
    try {
        viaCode = fs.readFileSync(testName).toString();
    } catch (e) {
        if (e.code === 'ENOENT') {
            viaCode = '';
            throw "No such test " + testName;
        }
    }

    vireo.stdout = '';
    if (viaCode != '' && vireo.loadVia(viaCode)==0) {
    	while (vireo.executeSlices(1000000)) {}
    }

    return vireo.stdout;
}

// Setup the esh binary for via execution
function RunNativeTest(testName) {
    var newResults = '';
    var exec = '../dist/esh'
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
    var testFiles = [];
    var argv = process.argv.slice();
    argv.shift(); // node path
    argv.shift(); // script path
    var test_native = false;
    var tester = false;
    var all = false;
    var once = false;
    var execOnly = false;
    var errorCode = 0;

    while(argv.length > 0) {
        var arg = argv[0];
        if  (arg === '-j') {
            SetupVJS();
            tester = JSTester;
        } else if (arg === '-e') {
            execOnly = true;
            once = true;
        } else if (arg === '-n') {
            tester = NativeTester;
            test_native = true;
        } else if (arg === '-once') {
            once = true;
        } else if (arg === '-all') {
            testFiles = fs.readdirSync('.');
            testFiles = testFiles.filter(IsViaFile);
            testFiles = testFiles.filter(IsNotBlackList);
            all = true;
        } else if (IsViaFile(arg)) {
            testFiles.push(arg);
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

    // Output which tests are being run
    var target = test_native ? "esh (native)" : "vireo.js";
    console.log("\n=============================================".cyan);
    console.log(("Running tests against " + target).cyan);
    console.log("=============================================".cyan);


    if (testFiles.length > 0) {
        testFiles.map(
            function(testName) { return tester(testName, execOnly); }
        );
        if (!once) {
            testFiles.map(
              function(testName) { return tester(testName, execOnly); }
            );
        }
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

        // Print out the Blacklist to note which tests were skipped
        if (all) {
            PrintBlackList();
        }

    } else {
        console.log("Nothing to test (try and run with -all)");
        errorCode = 1;
    }

    process.exit(errorCode);
})();
