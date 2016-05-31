// Some initial stubs for the allocator visitor.
module.exports = function(){
    'use strict';
    var dfir = require('./dfir.js');

    var visitorMethods = {
        //------------------------------------------------------
        vi: function(visitor, nNode) {
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
        loopIndex: function(visitor, nIndex) {
        },
        //------------------------------------------------------
        loop: function(visitor, nStructure) {
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
    var CodeGenVisitor = function CodeGenVisitor(moduleBuilder) {
        this.mb = moduleBuilder;
        this.visitors = visitorMethods;
    };
    CodeGenVisitor.prototype = {
        visitBorderNodesByStage: function(nStructure, stage) {
            var visitor = this;
            nStructure.B.map(function(item){dfir.accept(visitor, item);});
        }
    };
    return CodeGenVisitor;
}();
