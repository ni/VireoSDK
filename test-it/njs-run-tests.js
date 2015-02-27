// Node program #2 a simple test runner
// a bit of an improvement over bash.

fs = require('fs');
jsdiff = require('diff');
path = require('path');
cp = require('child_process');
vireo = {};

require('colors');

var app = {};

app.testFailures = [];
app.totalResultLines = 0;

function IsViaFile(name) {
    return path.extname(name) === '.via';
}

function CompareResults(testName, oldResults, newResults, msec) {
    var diffs = [];
    var cleanNewResults = newResults.replace(/^\/\/.*$/gm, '');
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
        console.log('Test for "' + testName + '" failed.');

        process.stdout.write('----------------\n');
        diffs = jsdiff.diffLines(oldResults, cleanNewResults);
        diffs.forEach(function(part){
            var color = part.added ? 'green' : part.removed ? 'red' : 'grey';
            process.stdout.write(part.value[color]);
            });
        process.stdout.write('----------------\n');

        // When will all the test be done?
        testFailures.push(testName);
    }
}

//------------------------------------------------------------
function RunTestCore(testName, tester)
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

    if (noOldResults) {
        // Save the generated resutls as the new reference
        // Add the file name to a list that can be printed at the end.
    } else {
        CompareResults(testName, oldResults, newResults, msec);
    }
}

function RunVJSTest(testName) {
    var newResults = '';
    try {
        viaCode = fs.readFileSync(testName).toString();
    } catch (e) {
        if (e.code === 'ENOENT') {
            viaCode = '';
        }
    }

    vireo.stdout = '';
    vireo.loadVia(viaCode);
    vireo.executeSlices(1000000);
    return vireo.stdout;
}

function RunNativeTest(testName) {
    var newResults = '';
    try {
        newResults = cp.execFileSync('esh', [ testName ]).toString();
    } catch (e) {
        // If Vireo detects an erroro ti will return non zero
        // and exec will throw an execption, so catch the results.
        newResults = e.stdout.toString();
    }
    return newResults;
}

//------------------------------------------------------------
function SetupVJS()
{
    vireo = require('../Vireo_Web/objs/vireo.js');
    vireo.stdout = '';
    vireo.core.print = function(text) { vireo.stdout = vireo.stdout + text + '\n'; };
}

//------------------------------------------------------------
function JSTester(testName) { RunTestCore(testName, RunVJSTest); }
function NativeTester(testName) { RunTestCore(testName, RunNativeTest); }

//------------------------------------------------------------
(function Main() {
    var testFiles = [];
    var argv = process.argv.slice();
    argv.shift(); // node path
    argv.shift(); // script path
    var tester = function(){};

    while(argv.length > 0) {
        var arg = argv[0];
        if  (arg === '-j') {
            SetupVJS();
            tester = JSTester;
        } else if (arg === '-n') {
            tester = NativeTester;
        } else if (arg === '-all') {
            testFiles = fs.readdirSync('.');
            testFiles = filelist.filter(IsViaFile);
        } else {
            testFiles.push(arg);
        }
        argv.shift();
    }

    if (testFiles.length > 0) {
        testFiles.map(tester);
        console.log("Total test vectors :" + app.totalResultLines);
        if (app.testFailures.length > 0) {
            console.log(app.testFailures);
        }
    } else {
        console.log("Nothing to test.");
    }
})();
