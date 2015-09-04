// Visitor pattern dispatcher.

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

module.exports = function accept(node, visitor) {
  'use strict';
  var dfirNodes = require('./dfir-nodes.js');

  // Check for a function assigned for the specific class.
  // Perhaps for primites allow sub keys ( e.g. Primitive_1911)
  var func = visitor[node.t];
  if (func)
    return func(node);

  // If there was not a direct match then climb the class hierarchy.
  var name = dfirNodes.classMap[node.t];
  while(name) {
    func = visitor[name];
    if (func) {
	    // Now that there is a match, store it so the
	    // match is direct the next time.
      visitor[node.t] = func;
      return func(node);
    } else {
      name = dfirNodes.classMap[name];
    }
  }
  console.log("Nothing to accept the visit to: " + node.t);
};
