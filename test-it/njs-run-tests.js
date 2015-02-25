// Node program #2 a simple test runner
// a bit of an improvement over bash.

fs = require('fs');
jsdiff = require('diff');
path = require('path');
cp = require('child_process');
require('colors');

var testFailures = [];
var totalResultLines = 0;

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
    totalResultLines += lineCount;

    if (oldResults === cleanNewResults) {
        console.log('Test for "' + testName + '" passed. (' + msec + 'ms)' );
    } else {
        console.log('Test for "' + testName + '" failed.');

        process.stdout.write('----------------\n');
        diffs = jsdiff.diffLines(oldResults, cleanNewResults);
        diffs.forEach(function(part){
            // green for additions, red for deletions
            // grey for common parts
            var color = part.added ? 'green' : part.removed ? 'red' : 'grey';
            //process.stdout.write("foo\n");
            process.stdout.write(part.value[color]);
            });
        process.stdout.write('----------------\n');

        // When will all the test be done?
        testFailures.push(testName);
    }
}

function RunTest(testName) {
    var resultsFileName = 'results/' + path.basename(testName, '.via') + '.vtr';
    var oldResults = '';
    var newResults = '';
    var noOldResults = false;
    var testCrashed = false;

    try {
        oldResults = fs.readFileSync(resultsFileName).toString();
    } catch (e) {
        if (e.code === 'ENOENT') {
            noCurrentResults = true;
        }
    }

    var hrstart = process.hrtime();
    try {
        newResults = cp.execFileSync('esh', [ testName ]).toString();
    } catch (e) {
        // If Vireo detects an erroro ti will return non zero
        // and exec will throw an execption, so catch the results.
        newResults = e.stdout.toString();
    }
    var hrend = process.hrtime(hrstart);
    var msec = hrend[1]/1000000;

    if (noOldResults) {
        // Save the generated resutls as the new reference
        // Add the file name to a list that can be printed at the end.
    } else {
        CompareResults(testName, oldResults, newResults, msec);
    }
}

if (process.argv.length < 3) {
     var filelist = fs.readdirSync('.');
     var testFiles = filelist.filter(IsViaFile);
     console.log("command line batch mode");
     testFiles.map(RunTest);

     if (testFailures.length > 0) {
         console.log("failures");
         console.log(testFailures);
     }
} else if (IsViaFile(process.argv[2])) {
     console.log("command line single mode");
     RunTest(process.argv[2]);
}
console.log("Vireo test run complete. Total TestVectors = " + totalResultLines);
