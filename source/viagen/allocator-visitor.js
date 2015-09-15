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
            visitor.vi = visitor.mb.defineVI('_' + p.name);
            // Make an initial clump for code. If the VI has parallel parts
            // there will be clumpBegin/ClumpEnd nodes.
            visitor.clump = visitor.vi.resolveClumpId(0);

            // Call parent class. It will visit its diagram and all nodes.
            visitor.visitors.structure(visitor, nNode);
            visitor.clump = null;
        },
        //------------------------------------------------------
        node: function(visitor, nNode) {
        },
        //------------------------------------------------------
        dataAccessor: function(visitor, nData) {
        },
        //------------------------------------------------------
        primitive: function(visitor, nPrim) {
            var instruction = {
                name:dfir.primIdToName(nPrim.p),
                args:[]
                };

            nPrim.i.map(function(item) {instruction.args.push(item);});
            nPrim.o.map(function(item) {instruction.args.push(item);});
            visitor.clump.emit(instruction);
        },
        //------------------------------------------------------
        constant: function(visitor, nConstant) {
        },
        //------------------------------------------------------
        loopIndex: function(visitor, nIndex) {
            var term = nIndex.outputTerm();
            if (nIndex.owningStructure.nodeIsA('whileLoop') && !term.isConnected()) {
                return; // Ignore unwired while loops
            } else {
                term.db = visitor.vi.defineLocal(term.dataType, null);
            }
        },
        //------------------------------------------------------
        loop: function(visitor, nStructure) {
            visitor.visitBorderNodesByStage(nStructure, dfir.vistStage.preStructure);
            visitor.visitBorderNodesByStage(nStructure, dfir.vistStage.loopPrologue);

            // visit the diagram
            nStructure.D.map(function(item){dfir.accept(visitor, item);});

            visitor.visitBorderNodesByStage(nStructure, dfir.vistStage.loopEpilogue);
            visitor.visitBorderNodesByStage(nStructure, dfir.vistStage.postStructure);
        },
        //------------------------------------------------------
        structure: function(visitor, nStructure) {
            visitor.visitBorderNodesByStage(nStructure, dfir.vistStage.preStructure);

            nStructure.D.map(function(item){dfir.accept(visitor, item);});

            visitor.visitBorderNodesByStage(nStructure, dfir.vistStage.postStructure);
        },
        //------------------------------------------------------
        diagram: function(visitor, nDaigram) {
            nDaigram.N.map(function(item){dfir.accept(visitor, item);});
        },
        //------------------------------------------------------
        wire: function(visitor, nWire) {
        }
    };

    //------------------------------------------------------
    var AllocatorVisitor = function AllocatorVisitor(moduleBuilder) {
        this.mb = moduleBuilder;
        this.visitors = visitorMethods;
    };
    AllocatorVisitor.prototype = {
        visitBorderNodesByStage: function(nStructure, stage) {
            var visitor = this;
            if (nStructure.B) {
                if (stage === dfir.vistStage.postStructure) {
                    // temporarily just visit them them last time.
                    nStructure.B.map(function(item){dfir.accept(visitor, item);});
                }
            }
        }
    };
    return AllocatorVisitor;
}();
