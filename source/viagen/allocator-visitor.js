// Some initial stubs for the allocator visitor.
module.exports = function(){
    'use strict';
    var dfir = require('./dfir.js');
    var path = require('path');

    var visitorMethods = {
        //------------------------------------------------------
        vi: function(visitor, nNode) {
            var name = nNode.name.slice(2);
            var p = path.parse(name);
            visitor.viBuilder = visitor.mb.defineVI('_' + p.name);
            visitor.visitors.structure(visitor, nNode);
        },
        //------------------------------------------------------
        node: function(visitor, nNode) {
            console.log('av:Node, name:' + nNode.t);
        },
        //------------------------------------------------------
        dataAccessor: function(visitor, nData) {
            console.log('av:DataAccessor');
        },
        //------------------------------------------------------
        primitive: function(visitor, nPrim) {
            console.log('av:' + nPrim.t + ", id:" + nPrim.p );
        },
        //------------------------------------------------------
        constant: function(visitor, nConstant) {
            console.log('av:Constant');
        },
        //------------------------------------------------------
        loopIndex: function(visitor, nIndex) {
            var term = nIndex.outputTerm();
            if (nIndex.owningStructure.nodeIsA('whileLoop') && !term.isConnected()) {
                return; // Ignore unwired while loops
            } else {
                term.db = visitor.viBuilder.defineLocal(term.dataType, null);
            }
        },
        //------------------------------------------------------
        structure: function(visitor, nStructure) {
            console.log('av:Structure, name:' + nStructure.t);
            nStructure.D.map(function(item){dfir.accept(visitor, item);});
            if (nStructure.B) {
                nStructure.B.map(function(item){dfir.accept(visitor, item);});
            }
        },
        //------------------------------------------------------
        diagram: function(visitor, nDaigram) {
            console.log('av:Diagram');
            nDaigram.N.map(function(item){dfir.accept(visitor, item);});
        },
        //------------------------------------------------------
        wire: function(visitor, nWire) {
            console.log('av:Wire');
        }
    };

    var AllocatorVisitor = function AllocatorVisitor(moduleBuilder) {
        this.mb = moduleBuilder;
        this.visitors = visitorMethods;
    };
    return AllocatorVisitor;
}();
