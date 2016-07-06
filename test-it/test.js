// Node program #2 a simple test runner
// a bit of an improvement over bash.

fs = require('fs');
jsdiff = require('diff');
path = require('path');
cp = require('child_process');
vireo = {};

require('colors');

var app = {};
app.testFailures = {};
app.totalResultLines = 0;

var blacklist = null;

function TestFailure(testName, testResults) {
    this.name = testName;
    this.results = testResults;
}

function IsViaFile(name) {
    return path.extname(name) === '.via';
}

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

// -----------------------------------------------------------------------------------
// Helpful function when debugging why oldResults != cleanNewResults on ComparaResults
// It outputs a comparison of the two strings char by char
function PrintCharactersToConsole (testName, oldResults, cleanNewResults)
{
    var firstDifferenceFound = false;
    var maxLength = oldResults.length;
    if (cleanNewResults.length > maxLength)
    {
        maxLength = cleanNewResults.length;
    }
    console.log('=======================================================');
    console.log('"' + testName + '"');
    console.log('Comparing oldResults(' + oldResults.length + ') vs cleanNewResults(' + cleanNewResults.length + ')');
    console.log('=======================================================');
    for (i = 0; i < maxLength; i++)
    {
        var oldResultsText = '';
        if (i < oldResults.length)
        {
            oldResultsText = oldResults.charCodeAt(i)
        }
        var cleanNewResultsText = '';
        if (i < cleanNewResults.length) {
            cleanNewResultsText = cleanNewResults.charCodeAt(i)
        }
        var differenceText = '';
        if (!firstDifferenceFound && (i < oldResults.length) && (i < cleanNewResults.length) && oldResults[i] != cleanNewResults[i])
        {
            differenceText = ' <---------- Found first difference';
            firstDifferenceFound = true;
        }
        console.log(oldResultsText + '\t' + cleanNewResultsText + '\t' + differenceText);
    }
}

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
            results = results.concat(part.value[color]).concat('\n');
        });

        var key = testName.toString();
        if (!app.testFailures.hasOwnProperty(key)) {
            app.testFailures[key] = new TestFailure(testName, results);
        }
    }
}

//------------------------------------------------------------
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

function RunNativeTest(testName) {
    var newResults = '';
    try {
        newResults = cp.execFileSync('../dist/esh', [ testName ]).toString();
    } catch (e) {
        // If Vireo detects an error it will return non zero
        // and exec will throw an exception, so catch the results.
        newResults = e.stdout.toString();
    }
    return newResults;
}

//------------------------------------------------------------
function SetupVJS()
{
    vireo = require('../dist/vireo.js');
    vireo.stdout = '';
    vireo.core.print = function(text) { vireo.stdout = vireo.stdout + text + '\n'; };
}

//------------------------------------------------------------
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
        } else {
            testFiles.push(arg);
        }
        argv.shift();
    }

    if (!tester) {
        SetupVJS();
        tester = JSTester;
    }

    // Output which tests are being run
    console.log("\n=============================================".cyan);
    console.log("=============================================".cyan);
    if (test_native) {
        console.log("RUNNING TESTS AGAINST ESH (NATIVE)".cyan);
    } else {
        console.log("RUNNING TESTS AGAINST VIREO.JS".cyan);
    }
    console.log("=============================================".cyan);
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
            errorCode = 1;
        }
        else {
            console.log("\n=============================================".green);
            console.log("SUCCESS: All tests passed for this execution!".green);
            console.log("=============================================\n".green);
        }
        if (all) {
            PrintBlackList();
        }

    } else {
        console.log("Nothing to test.");
    }

    process.exit(errorCode);
})();
