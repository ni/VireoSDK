// Some initial stubs for the allocator visitor.
module.exports = function(){
    'use strict';
    var dfir = require('./dfir.js');
    var path = require('path');

/*
    basic algorithm
        nodes know their data types. tha has been established by upstreat dfir transforms
        
        thus each wire has a allocation.
        
        nodes may need allocaiton during code gen as well
        
        those allocaiotn can be added to the nodes as well. 
        
        then do an allocaiton pass with in the clump merging pieces to gether?

        first pass allocate
        
        reduce to lower level?
        
        thath should make it simpler. finallly!!
*/
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
            visitor.allocateNode(nNode);
        },
        //------------------------------------------------------
        dataAccessor: function(visitor, nData) {
        },
        //------------------------------------------------------
        primitive: function(visitor, nPrim) {
            // may switch to using id numbers, but trying to move
            // away from those.
            switch(dfir.primIdToName(nPrim))  {
                default:
                    visitor.visitors.node(visitor, nPrim)
            }    
        },
        //------------------------------------------------------
        constant: function(visitor, nConstant) {
        },
    
        //------------------------------------------------------
        concatenateNode: function(visitor, nConcat) {
            // Try to make first output inplace to input.
            var firstDb = visitor.allocateTerminal(nConcat.i[0], false, null);
            visitor.allocateTerminal(nConcat.o[0], false, firstDb);
            // Allocate the rest normally.
            for ( var i = 1; i < nConcat.o.length; i++ ) {
                visitor.allocateTerminal(nConcat.i[i], false, firstDb);
            } 
        },    
        //------------------------------------------------------
        loopIndex: function(visitor, nIndex) {
            var term = nIndex.o[0];            
            switch(visitor.stage) {
                case dfir.visitStage.loopPrologue:
                    var isRequired = nIndex.owningStructure.nodeIsA('forLoop')
                    term.db = visitor.allocateTerminal(term, isRequired, null);
                    term.db.addDependency();
                    break;
                case dfir.visitStage.loopEpilogue:
                    term.db.fillDependency();
                    break;
                default:
                    visitor.mb.logError("unrecognized stage in allocate visitor");
                    break;
            }
        },
        //------------------------------------------------------
        loopMax: function(visitor, nMax) {
            var term = nMax.o[0];            
            switch(visitor.stage) {
                case dfir.visitStage.loopPrologue:
                    nMax.outerTerm().addDendency();
                    forceAllocation(nMax.innerTerm(), nMax.outerTerm())
                    nMax.innerTerm().addDependency();
                    break;
                case dfir.visitStage.loopEpilogue:
                    nMax.outerTerm.fillDependency();
                    nMax.innerTerm.fillDependency();
                    break;
                default:
                    visitor.mb.logError("unrecognized stage in allocate visitor");
                    break;
            }
        },
        //------------------------------------------------------
        loopConditional: function(visitor, nConditional) {
            if (visitor.stage === dfir.visitStage.loopEpilogue) {
                visitor.allocateTerminal(nConditional.i[0]);
            }
        },        
/*
void AllocatorVisitor::Visit(DFIR::LoopMax& loopMax)
	{
		switch(GetVisitStage(loopMax))
		{
		case VIVM::LoopPrologueStage:
			{
			DFIR::Terminal& t = loopMax.GetInnerTerminal(0,0);
			DataBuilder* NMinus1 = _viBuilder->DefineLocal(t.GetDataType());
			_allocMap->Add(loopMax, NMinus1); // internal node storage for "NMinusOne"
			// need to ensure NMinus1 does not get unified with anything (including the loopmax terminal) for duration of loop.
			// This would be cleaner if we didn't need both locations (they could be unified if 4loop was a pretest loop).
			NMinus1->AddDependency(); 

			DataBuilder* outer = _allocateTerminal(loopMax.GetOuterTerminal(0), false, NULL);

			_forceAllocateTerminal(loopMax.GetInnerTerminal(0,0), outer);
			outer->AddDependency(); //loop diagram dependency.
			break;
			}
		case VIVM::LoopEpilogueStage:
			{
				_allocMap->Find(loopMax)->FillDependency();
				DataBuilder* inner = _allocMap->Find(loopMax.GetInnerTerminal(0,0));
				if(inner != NULL)
				{
					inner->FillDependency();
				}
			break;
			}
        default:
            break;
		}
	}
 
*/
        //------------------------------------------------------
        loop: function(visitor, nStructure) {
            visitor.visitBorderNodesByStage(nStructure, dfir.visitStage.preStructure);
            visitor.visitBorderNodesByStage(nStructure, dfir.visitStage.loopPrologue);

            // visit the diagram
            nStructure.D.map(function(item){dfir.accept(visitor, item);});

            visitor.visitBorderNodesByStage(nStructure, dfir.visitStage.loopEpilogue);
            visitor.visitBorderNodesByStage(nStructure, dfir.visitStage.postStructure);
        },
        //------------------------------------------------------
        structure: function(visitor, nStructure) {
            visitor.visitBorderNodesByStage(nStructure, dfir.visitStage.preStructure);

            nStructure.D.map(function(item){dfir.accept(visitor, item);});

            visitor.visitBorderNodesByStage(nStructure, dfir.visitStage.postStructure);
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
        //------------------------------------------------------
        visitBorderNodesByStage: function(nStructure, stage) {
            var visitor = this;
            visitor.stage = stage;
            nStructure.B.map(function(item){dfir.accept(visitor, item);});
            visitor.stage = 0;
        },
        //------------------------------------------------------
        allocateNode: function(node, allowInplace) {
            if (allowInplace) {
                // Allocate inputs first, so output have a chance at reusing them.
                this.allocateTerminalSets(node.i, node.o);   
            } else {
                // Allocate outputs first so inputs wont be in the pool.
                this.allocateTerminalSets(node.o, node.i);
            }
        },
        //------------------------------------------------------
        allocateTerminalSets: function(a, b) {
            var visitor = this;
            if (a !== undefined) {
                a.map(function(item){visitor.allocateTerminal(item, false, null);});
            }
            if (b !== undefined) {
                b.map(function(item){visitor.allocateTerminal(item, false, null);});     
            }
        },
        //------------------------------------------------------
        allocateTerminal: function(terminal, isRequired, preferred) {
            var db = terminal.db;
            if (terminal.isInput) {
                if (terminal.isConnected() && db !== null) {
                    db.fillDependency();
                } else if (isRequired && (db === null)) {
                    // input not wired create a constant
                }
            } else /* output */ {
                if (isRequired || terminal.isConnected()) {
                    if (db === null) {
                       // TODO defeind local 
                    }  else {
                        if (terminal.isConnected()) {
                            db.addDependency();
                        }
                       // TODO defeind local 
                    }
                }
            }
            return db;
        },
        forceAllocateTerminal: function(terminal, db) {
            if (terminal.isInput) {
                // TODO(viagen)
            } else if (db === null) {
                return null; 
            }  else {
                var existingDb = terminal.db;
                if (existingDb === null) {
                    terminal.db = db;
                    if (terminal.isConnected) {
                        // TODO does add Dependency aply to terminal or db
                        db.addDependency();
                    }
                }
            }      
        }
    };
    return AllocatorVisitor;
}();
