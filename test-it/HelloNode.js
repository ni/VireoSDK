var vireo = {};

var SetupVJS = function () {
    var buildVireoInstance;
    try {
        buildVireoInstance = require('../source/core/vireo.loader.js');
        vireo = buildVireoInstance().vireoAPI;
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.log('Error: ../dist/vireo.js not found (Maybe build it first?)');
            process.exit(1);
        } else {
            throw err;
        }
    }
    //vireo.stdout = '';
    vireo.setPrintFunction(function (text) {
        console.log('console: ' + text);
    });
};

SetupVJS();

var text =
    'define(c0 dv(.String "wubbalubbadubdub"))\n' +
    'define(HelloWorld dv(.VirtualInstrument (\n' +
        'Locals: c(' +
            'e(dv(.String "Hello, world. I can fly.") variable1)' +
        ')\n' +
        'clump (' +
            'Println(variable1)' +
            'FPSync(c0)' +
        ')' +
    ') ) )\n'  +
    'enqueue(HelloWorld)\n';

var currFPID = '';

vireo.setFPSyncFunction(function (fpId) {
    currFPID = 'fpsync called with (' + fpId + ')';
});

vireo.loadVia(text);
vireo.executeSlices(1);


var testResult = false;
var testString = '';
var preTestString = '';

console.log('test1');
testString = 'fpsync called with (wubbalubbadubdub)';
testResult = currFPID === testString;
console.assert(testResult, 'FPSync function called from vireo and passes value 90');

console.log('test2');
testString = 'Hello, world. I can fly.';
testResult = JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === testString;
console.assert(testResult, 'Read a value after execution is done');

// console.log('test3');
// testString = 'Hello, world. I can fly.你好世界。我能飛。';
// vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify(testString));
// testResult = JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === testString;
// console.assert(testResult, 'Read a value with unicode characters');

console.log('test4');
testString = 'May it be a good Day!';
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify(testString));
testResult = JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === testString;
console.assert(testResult, 'Write a value and get it back');

console.log('test5');
testString = 'multi\nline with \'single\' and \"double\" quotes';
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify(testString));
testResult = JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === testString;
console.assert(testResult, 'Write some special characters');

console.log('test6');
preTestString = 'multi\nline with \'single\' and \"double\" quotes';
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify(preTestString));
console.assert(JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === preTestString, 'The initial valid JSON is written');
testString = 'Buenas Dias';
vireo.writeJSON('HelloWorld', 'variable1', testString); // JSON.stringify intentionally left off
testResult = JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === preTestString;
console.assert(testResult, 'Write string that is not in JSON format is ignored');

console.log('test7');
preTestString = 'multi\nline with \'single\' and \"double\" quotes';
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify(preTestString));
console.assert(JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === preTestString, 'The initial valid JSON is written');
testString = 'Buenas Dias';
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify(testString)); // JSON.stringify intentionally added
testResult = JSON.parse(vireo.readJSON('HelloWorld', 'variable1')) === testString;
console.assert(testResult, 'Write string that has been fixed');

console.log('test end');
