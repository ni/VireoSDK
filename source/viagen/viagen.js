
var path = require('path');
var fs = require('fs');
var dfirAccept = require('./dfir-accept.js');
var allocatorVisitor = require('./allocator-visitor.js');
var wirestichVisitor = require('./wirestich-visitor.js');

function Run() {
  'use strict';
  if (process.argv.length === 3) {
    var fileName =  process.argv[2];
    var dfirJson = fs.readFileSync(fileName).toString();
    var dfirRoot = JSON.parse(dfirJson);
    dfirAccept(dfirRoot, wirestichVisitor);
    dfirAccept(dfirRoot, allocatorVisitor);
  } else {
    console.log("Usage: viagen filename");
  }
};
Run();
