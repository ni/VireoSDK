vireo = require('../target-support/js/vireo.js');

var text =
    'define(c0 dv(.UInt32 90))\n' +
    'define(HelloWorld dv(.VirtualInstrument (\n' +
        'Locals: c(' +
            'e(dv(.String "Hello, world. I can fly.你好世界。我能飛。") variable1)' +
        ')\n' +
        'clump (' +
            'Println(variable1)' +
            'FPSync(c0)' +
        ')' +
    ') ) )\n'  +
    'enqueue(HelloWorld)\n';

vireo.core.fpSync = function(fpId) {console.log("***fpSync() Called with: " + fpId + " ***"); };
vireo.loadVia(text);
vireo.executeSlices(1);

// Read a value after execution is done
console.log( '<' + vireo.readJSON('HelloWorld', 'variable1') + '>');

// Write a value and get it back
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify('May it be a good Day! 也許這是一個很好的一天'));
console.log( '<' + vireo.readJSON('HelloWorld', 'variable1') + '>');

// Write some specail charactes
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify('multi\nline with \'single\' and \"double\" quotes'));
console.log( '<' + vireo.readJSON('HelloWorld', 'variable1') + '>');

// Write string that is not in JSON format.
vireo.writeJSON('HelloWorld', 'variable1', 'Buenas Dias');
console.log( '<' + vireo.readJSON('HelloWorld', 'variable1') + '>');

// Write string that has been fixed.
vireo.writeJSON('HelloWorld', 'variable1', JSON.stringify('Buenas Dias'));
console.log( '<' + vireo.readJSON('HelloWorld', 'variable1') + '>');
