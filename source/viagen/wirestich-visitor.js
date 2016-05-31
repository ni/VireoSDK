
// In raw form the JSON for each diagram has a list
// of nodes and a list of wires. Wirestich creates
// wire node objects (complete with terminals)
// and connects them to the instruction nodes they
// refer to using the termnal IDs.

module.exports = function(){
'use strict';

var dfir = require('./dfir.js');
var wirestichVisitor = {tMap:{}, visitors:{}};
//TODO(viagen) - add some more error checking, for now it assumes
//the raw value ( parsed from JSON) has the members expected.

//------------------------------------------------------
function wireSynthsizer(visitor, wire, diagram, createdWireNodes){
    // Make a wire node with terminals that are connected to
    // their respective instruction node terminals.
    var inputs = [];
    var outputs = [];
    var wireNode = {t:"wire", owner:diagram, i:inputs, o:outputs};
    createdWireNodes.push(wireNode);
    if (wire.T) {
        // For each terminal ID create a terminal object and
        // connect it to the terminal on the instruction node.
        wire.T.map(function(item){
            // Find the paired terminal
            var pairedTerm = visitor.tMap[item];
            var wireTerm = {owner: wireNode, pair: pairedTerm};
            pairedTerm.pair = wireTerm;
            if (pairedTerm.isInput) {
                outputs.push(pairedTerm);
            } else {
                inputs.push(pairedTerm);
            }
        });
    }
}
//------------------------------------------------------
// Set all the core properties on a terminal
function updateTeminalMap(visitor, node, terminal, isInput) {
    visitor.tMap[terminal.I] = terminal;
    terminal.owner = node;
    terminal.isInput = isInput;
    terminal.db = null; // set now so 'undefined' does not happen.
    Object.setPrototypeOf(terminal, dfir.terminalMethods);
}
//------------------------------------------------------
// Nodes - add terminals to map.
wirestichVisitor.visitors.node = function(visitor, nNode) {
    if (nNode.i) {
        nNode.i.map(function(item){updateTeminalMap(visitor, nNode, item, true);});
    }
    if (nNode.o) {
        nNode.o.map(function(item){updateTeminalMap(visitor, nNode, item, false);});
    }
    Object.setPrototypeOf(nNode, dfir.nodeMethods);
};
//------------------------------------------------------
// Structure - visit all border nodes and then diagrams.
wirestichVisitor.visitors.structure = function(visitor, nStructure) {
    if (nStructure.B) {
        nStructure.B.map(function(item){
            dfir.accept(visitor, item);
            item.owningStructure = nStructure;
        });
    } else {
        // Add an empty array so tests are not
        // needed everywhere.
        nStructure.B = [];
    }
    nStructure.D.map(function(item){dfir.accept(visitor, item);});
    visitor.visitors.node(visitor, nStructure);
};
//------------------------------------------------------
// DfirRoot - set up a terminal id map, and continue as strucutre.
wirestichVisitor.visitors.dfirRoot = function(visitor, nRoot) {
    visitor.tMap = {};
    visitor.visitors.structure(visitor, nRoot);
};
//------------------------------------------------------
// Diagram - visit all nodes, then turn wires into real nodes and add them list of nodes.
wirestichVisitor.visitors.diagram = function(visitor, nDiagram) {
    nDiagram.N.map(function(item){dfir.accept(visitor, item);});
    var createdWireNodes = [];
    nDiagram.W.map(function(item){wireSynthsizer(visitor, item, nDiagram, createdWireNodes);});
    // TODO(viagen) insert wires so they are come before their downstream nodes.
    // perhaps note the node index when they are created. Avoid insertin into the
    // the node list while iterating through it.

    // Raw wire objects are no longer needed. Allowed them to be GC'd
    nDiagram.W = null;
    nDiagram.N = nDiagram.N.concat(createdWireNodes);
};
return wirestichVisitor;
}();
