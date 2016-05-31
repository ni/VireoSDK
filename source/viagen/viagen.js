
var path = require('path');
var fs = require('fs');
var dfir = require('./dfir.js');
var ModuleBuilder = require('./module-builder.js');
var AllocatorVisitor = require('./allocator-visitor.js');
var CodeGenVisitor = require('./codegen-visitor.js');
var wirestichVisitor = require('./wirestich-visitor.js');
var Emit = require('./via-emitter.js');
function Run() {
    'use strict';

    if (process.argv.length === 3) {
        var fileName =  process.argv[2];
        var dfirJson = fs.readFileSync(fileName).toString();
        var dfirRoot = JSON.parse(dfirJson);

        // Normalize the JSON structure.
        dfir.accept(wirestichVisitor, dfirRoot);

        // Calculate storage allocations
        var mb = new ModuleBuilder();
        var av = new AllocatorVisitor(mb);
        dfir.accept(av, dfirRoot);

        // Generate logical instructions
        var cgv = new CodeGenVisitor(mb);
        dfir.accept(cgv, dfirRoot);

        // Emit via text
        var emit = new Emit();
        var viaText = emit.emitModule(mb);

        console.log(viaText);
    } else {
        console.log("Usage: node viagen.js filename");
    }
}
Run();
