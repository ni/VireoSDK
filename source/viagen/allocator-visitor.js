// Some initial stubs for the allocator visitor.
module.exports = function(){
  'use strict';
  
  var dfirAccept = require('./dfir-accept.js');
  var dfirNodes = require('./dfir-nodes.js');

  var allocatorVisitor = {
    Node: function(nNode) {
      console.log('av:node:' + nNode.t);
    },
  //  DataAccessor: function(nData) {
  //    console.log('av:data:' + nData.t);
  //  },
    Primitive: function(nPrim) {
      var name = dfirNodes.primIds[nPrim.p];
      console.log('av:primitive:' + nPrim.t + "id:" + nPrim.p + ":name:" + name);
    },
    Constant: function(nConstant) {
      console.log('av:constant');
    },
    Structure: function(nStructure) {
      console.log('av:structure:' + nStructure.t);
      nStructure.D.map(function(item){dfirAccept(item, allocatorVisitor);});
    },
    Diagram: function(nDaigram) {
      console.log('av:diagram');
      nDaigram.N.map(function(item){dfirAccept(item, allocatorVisitor);});
    },
    Wire: function(nWire) {
      console.log('av:wire');
    },
  };
  return allocatorVisitor;
}();
