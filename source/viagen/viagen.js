

// JSON notes, subject to change at any time.
// I: Terminal ID
// T: terminal type
// t: node type ( e.g. class for, add, diagrem, vi, ...)
// V: vi
// N: nodes
// W: wires
// w; wire
// i: input terminals
// o: output terminals
// v: value as hex string ( to simplify xfer and avoid percision loss)

//var sh = require('shelljs');
var path = require('path');
var fs = require('fs');

var dfirAccept = require('./dfir-accept.js');
var allocatorVisitor = require('./allocator-visitor.js');

function LoadDFIR() {
  'use strict';
  if (process.argv.length >= 3) {
    var fileName =  process.argv[2];
    console.log("Single test: " + fileName);

    var dfirJson = fs.readFileSync(fileName).toString();
    var dfirRoot = JSON.parse(dfirJson);
    dfirAccept(dfirRoot, allocatorVisitor);
  } else {
    console.log("No file");
  }
}

LoadDFIR();
