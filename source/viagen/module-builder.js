// Some initial stubs for the allocator visitor.
module.exports = function(){
'use strict';

    // in C++/C# thre was a allocator dictionary that served as a map from
    // several objects types to data builders. This worked well for those languages
    // as it prevented adding fields to the respective objects.
    // In JS it is not necessary since adding the propeorty to the object
    // is easily done.

//------------------------------------------------------------
var DataBuilder = function DataBuilder() {
    this.value = 0;
    this.lifeTime = 0;
    this.permitReuse = true;
};
DataBuilder.prototype = {
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
function ClumpBuilder(vi, id) {
    this.vi = vi;
    this.id = id;
    this.fireCount = 0;
    this.instructions = [];
    this.labels = [];
    this.nextInstructionHasNeedsLabel = false;
}
ClumpBuilder.prototype = {
    defineLabel: function() {
    },
    markLabel: function() {
    },
    emitMove: function() {
    },
    emit: function() {
    },
    addInstructionComment: function() {
    }
};
//------------------------------------------------------------
function VIBuilder(name) {
    this.name = name;
    this.locals = [];
    this.clumps = [];
    this.rootClump = null;
    this.isReentrant = false;
    this.reentrantCloneCount = 0;
}
VIBuilder.prototype = {
    defineLocal: function(dataType) {
        var db = new DataBuilder();
        this.locals.push(db);
        return db;
    },
    logError: function() {
    },
    resolveClumpId: function(id) {
        var clump = clump[id];
        if (clump === null) {
            clump = new ClumpBuilder(this, id);
            clump[id] = clump;
        }
        return clump;
    },
    setRootClump: function(clump) {
    },
    addReentrantCaller: function(clump) {
    },
    defineOrGetClump: function() {
    },
    isSubVI: function() {
        return true;
    }
};
//------------------------------------------------------------
function ModuleBuilder() {
}
ModuleBuilder.prototype = {
    defineGlobal: function(name, value) {
        return new DataBuilder();
    },
    defineConstant: function(value) {
        return new DataBuilder();
    },
    defineVI: function(name) {
        // return a VIBuilder object
        return new VIBuilder(name);
    }
};
//------------------------------------------------------------
return ModuleBuilder;
}();
