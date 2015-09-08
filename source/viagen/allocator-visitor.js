// Some initial stubs for the allocator visitor.
module.exports = function(){
  'use strict';
  
  var dfirAccept = require('./dfir-accept.js');
  var dfirNodes = require('./dfir-nodes.js');

  var allocatorVisitor = {
    Node: function(nNode) {
      console.log('av:Node, name:' + nNode.t);
    },
   DataAccessor: function(nData) {
      console.log('av:DataAccessor');
    },
    Primitive: function(nPrim) {
      var name = dfirNodes.primIds[nPrim.p];
      console.log('av:' + nPrim.t + ", id:" + nPrim.p + ", name:" + name);
    },
    Constant: function(nConstant) {
      console.log('av:Constant');
    },
    Structure: function(nStructure) {
      console.log('av:Structure, name:' + nStructure.t);
      nStructure.D.map(function(item){dfirAccept(item, allocatorVisitor);});
      if (nStructure.B) {
        nStructure.B.map(function(item){dfirAccept(item, allocatorVisitor);});
      }
    },
    Diagram: function(nDaigram) {
      console.log('av:Diagram');
      nDaigram.N.map(function(item){dfirAccept(item, allocatorVisitor);});
    },
    Wire: function(nWire) {
      console.log('av:Wire');
    },
  };
  return allocatorVisitor;
}();
