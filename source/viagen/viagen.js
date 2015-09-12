
var path = require('path');
var fs = require('fs');
var dfir = require('./dfir.js');
var ModuleBuilder = require('./module-builder.js');
var AllocatorVisitor = require('./allocator-visitor.js');
var wirestichVisitor = require('./wirestich-visitor.js');

function Run() {
    'use strict';

    // Basic strategy
    // 1. Read raw JSON
    // 2. normalize dfir ( wires turn into rad nodes)
    // 3. visit dfir with multiple passes
    // 4. Determine storage allocation needed for instructions nodes
    // 5. Build tree of VIs of clump of instrutions wiht arguments
    // 6. Visit tree of VCIA build lists
    // 7. from VCIA and lists format out via text.

    if (process.argv.length === 3) {
        var fileName =  process.argv[2];
        var dfirJson = fs.readFileSync(fileName).toString();
        var dfirRoot = JSON.parse(dfirJson);

        var mb = new ModuleBuilder();
        var av = new AllocatorVisitor(mb);

        dfir.accept(wirestichVisitor, dfirRoot);
        dfir.accept(av, dfirRoot);
    } else {
        console.log("Usage: node viagen.js filename");
    }
}
Run();
