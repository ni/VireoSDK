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

module.exports = function() {
'use strict';
var dfirNodes = require('./dfir-nodes.js');

var dfir = {
//------------------------------------------------------------
accept: function(visitor, node) {
  // Check for a function assigned for the specific class.
  // Perhaps for primites allow sub keys ( e.g. Primitive_1911)
  var func = visitor.visitors[node.t];
  if (func)
      return func(visitor, node);

  // If there was not a direct match then climb the class hierarchy.
  var name = dfirNodes.classMap[node.t];
  while(name) {
      func = visitor.visitors[name];
      if (func) {
          // Now that there is a match, store it so the
          // match is direct the next time.
          visitor.visitors[node.t] = func;
          return func(visitor, node);
      } else {
          name = dfirNodes.classMap[name];
      }
  }
  console.log("Nothing to accept the visit to: " + node.t);
},
//------------------------------------------------------------
primIdToName: function(id) {
    var name = dfirNodes.primIds[id];
    if (name === undefined) {
        name = '_Unknown_Prim_ID_' + id;
    }
    return name;
},
//------------------------------------------------------------
// passes used with border nodes.
vistStage: {
    preStructure:1,
    postStructure:2,
    loopPrologue:3,
    loopEpilogue:4,
    preDiagram:5,
    postDiageam:6,
},
//------------------------------------------------------------
nodeMethods: {
  //--------------------------
  nodeIsA: function(typeName) {
      var t = this.t;
      while (t !== typeName) {
          t = dfirNodes.classMap[t];
          if (!t) return false;
      }
      return true;
  },
  //--------------------------
  outputTerm: function(index) {
      return this.o[0];
  },
  //--------------------------
  inputTerm: function(index) {
      return this.i[0];
  },
},
//------------------------------------------------------------
terminalMethods: {
  //--------------------------
  isConnected: function(node){
      return (this.pair !== null);
  },
  //--------------------------
  innerTerminal: function(node){
      return {};
  },
}
};
return dfir;
}();
