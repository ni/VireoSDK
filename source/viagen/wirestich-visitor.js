
// In raw form the JSON for each diagram has a list
// of nodes and a list of wires. Wirestich creates
// wire node objects (complete with terminals) 
// and connects them to the instruction nodes they
// refer to using the termnal IDs.

module.exports = function(){
  'use strict';
  
  var dfirAccept = require('./dfir-accept.js');
  var tMap = {};

  //TODO(viagen) - add some more error checking, for now it assumes
  //the raw value ( parsed from JSON) has the members expected.
    
  function wireSynthsizer(wire, diagram, createdWireNodes){
    // Make a wire node with terminals that are connected to
    // their respective instruction node terminals. 
    var inputs = [];
    var outputs = [];
    var wireNode = {t:"Wire", owner:diagram, i:inputs, o:outputs};
    createdWireNodes.push(wireNode);
    if (wire.T) {
      // For each terminal ID create a terminal object and 
      // connect it to the terminal on the instruction node.
      wire.T.map(function(item){
          // Find the paired terminal
          var pairedTerm = tMap[item];
          //console.log("pairName:" + pairedTerm.owner.t);
          var wireTerm = {owner: wireNode, pair: pairedTerm};
          pairedTerm.pair = wireTerm;
          if (pairedTerm.isInput) {
            outputs.push(pairedTerm);
          } else {
            inputs.push(pairedTerm);            
          }
        });
    }    
  };

  function updateTeminalMap(node, terminal, isInput) {
    tMap[terminal.I] = terminal;
    // Also give termnals a direct link to the node.
    terminal.owner = node;
    terminal.isInput = isInput;
  }
  
  var wirestichVisitor = {
    // Nodes - add terminals to map.
    Node: function(nNode) {
      if (nNode.i) {
        nNode.i.map(function(item){updateTeminalMap(nNode, item, true);});
      }
      if (nNode.o) {
        nNode.o.map(function(item){updateTeminalMap(nNode, item, false);});
      }
    },

    // DfirRoot - set up a terminal ID map, and continue as strucutre.
    DfirRoot: function(nRoot) {
      tMap = {};
      wirestichVisitor.Structure(nRoot);
    },
    
    // Structure - visit all border nodes and then diagrams.
    Structure: function(nStructure) {
      if (nStructure.B) {
        nStructure.B.map(function(item){dfirAccept(item, wirestichVisitor);});
      }
      nStructure.D.map(function(item){dfirAccept(item, wirestichVisitor);});
    },

    // Diagram - visit all nodes, then turn wires into real nodes and add them list of nodes.
    Diagram: function(nDiagram) {
      nDiagram.N.map(function(item){dfirAccept(item, wirestichVisitor);});
      var createdWireNodes = [];
      nDiagram.W.map(function(item){wireSynthsizer(item, nDiagram, createdWireNodes);});
      // TODO(viagen) insert wires so they are come before their downstream nodes.
      // perhaps note the node index when they are created. Avoid insertin into the 
      // the node list while iterating through it.
      nDiagram.N = nDiagram.N.concat(createdWireNodes);
    },
  };
  return wirestichVisitor;
}();
