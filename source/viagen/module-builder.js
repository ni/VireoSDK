// Some initial stubs for the allocator visitor.
module.exports = function(){
'use strict';

    // in C++/C# thre was a allocator dictionary that served as a map from
    // several objects types to data builders. This worked well for those languages
    // as it prevented adding fields to the respective objects.
    // In JS it is not necessary since adding the propeorty to the object
    // is easily done.

//------------------------------------------------------------
var Data = function Data() {
    this.value = 0;
    this.lifeTime = 0;
    this.permitReuse = true;
};
Data.prototype = {
    addDependency: function() {
        if(this.permitReuse) this.lifeTime++;
    },
    fillDependency: function() {
        if(this.permitReuse) this.lifeTime--;
    },
    isReadyToUse: function() {
        return (this.permitReuse && this.lifeTiem === 0);
    },
    isArray: function() {
        return false;
    },
    isCluster: function() {
        return false;
    }
};
//------------------------------------------------------------
function Clump(vi, id) {
    this.vi = vi;
    this.id = id;
    this.fireCount = 0;
    this.instructions = [];
    this.labels = [];
    this.nextInstructionHasNeedsLabel = false;
}
Clump.prototype = {
    defineLabel: function() {
    },
    markLabel: function() {
    },
    emitMove: function() {
    },
    emit: function(instruction) {
        this.instructions.push(instruction);
    },
    addInstructionComment: function() {
    }
};
//------------------------------------------------------------
function VI(name) {
    this.name = name;
    this.locals = [];
    this.clumps = [];
    this.rootClump = null;
    this.isReentrant = false;
    this.reentrantCloneCount = 0;
}
VI.prototype = {
    defineLocal: function(dataType) {
        var db = new Data();
        this.locals.push(db);
        return db;
    },
    logError: function() {
    },
    resolveClumpId: function(id) {
        // Finds an existing clump or creates one.
        var clump = this.clumps[id];
        if (clump === undefined) {
            clump = new Clump(this, id);
            this.clumps[id] = clump;
        }
        return clump;
    },
    setRootClump: function(clump) {
    },
    addReentrantCaller: function(clump) {
    },
    isSubVI: function() {
        return true;
    }
};
//------------------------------------------------------------
function ModuleBuilder() {
    this.constants = [];
    this.globals = [];
    this.vis = [];
    this.errors = [];
}
ModuleBuilder.prototype = {
    logError: function(value) {
        this.errors.push(value);
    },
    defineConstant: function(value) {
        var db = new Data();
        this.constants.push(db);
        return db;
    },
    defineGlobal: function(name, value) {
        var db = new Data();
        this.globals.push(db);
        return db;
    },
    defineVI: function(name) {
        var vi = new VI(name);
        this.vis.push(vi);
        return vi;
    },
};
//------------------------------------------------------------
return ModuleBuilder;
}();
