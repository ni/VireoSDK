// Ids used in json data.
module.exports = {

// Class hierarchy for diagram nodes.
// Names will map to methods on visitor so they
// need to fit js naming conventions. Thath is
// one reason they start with lowercase letters.
classMap: {
    // Some internals
    node:null,
    daigram:"node",
    wire:"node",
    clumpStart:"node",
    clumpEnd:"node",
    methodCall:"node",
    primitive:"node",
    callByReference:"methodCall",
    callChain:"node",
    plugInNode:"node",
    dataAccessor:"node",
    debugPoint:"node",
    dfirRoot:"structure",

    // Core strucutre
    structure:"node",
    loop:"structure",
    forLoop:"loop",
    whileLoop:"loop",
    caseStructure:"structure",
    disableStructure:"structure",
    inplaceElementStructure:"structure",

    // Core structure border nodes
    borderNode:"node",
    tunnel:"borderNode",
    siblingTunnel:"tunnel",
    caseSelector:"borderNode",       // the '?' terminal
    leftShiftRegister:"borderNode",
    rightShiftRegister:"borderNode",
    loopCondition:"borderNode",
    loopIndex:"borderNode",          // i
    loopMax:"borderNode",            // N on the for loop
    feedbackInitNode:"borderNode",
    feedbackInputNode:"borderNode",
    feedbackOutputNode:"borderNode",

    // Simple prims/nodes operations
    constant:"node",
    compoundArithmeticNode:"node",
    waitNode:"node",
    waitUntilNextMultipleNode:"node",
    tickCountNode:"node",
    coercionNode:"node",

    // Array operations
    initializeArryNode:"node",
    arrayIndexNode:"node",
    reshapeArrayNode:"node",
    decimate1DArrayNode:"node",
    deleteFromArrayNode:"node",
    arraySubsetNode:"node",
    automaticErrorHanlerNode:"node",

    // Cluster operations
    buildClusterNode:"node",
    buildClusterArrayNode:"node",

    // Events
    createUserEvent:"node",
    destroyUserEvent:"node",
    flushEventQueue:"node",
    unRegisterForEvents:"node",
    registerForEvents:"node",
    generateUserEvent:"node",
    eventStructure:"node",

    // String operations
    formatIntoStringNode:"node",
    concatenate:"node",

    // Other operations
    loopTimerNode:"timingNodeBase",
    timingNodeBase:"node",

    // Abbreviations
    data:"dataAccessor",
    "for":"forLoop",
    vi:"dfirRoot",
    coerce:"coercionNode",
    dbgPt:"debugPoint",
    idx:"loopIndex",
    max:"loopMax",
    tnl:"tunnel"
},

primClass: {
    simple:{}   // coerce all inputs to output type.
},
// Some initial prim Ids
primIds:{
    1050:{name:"Add","class":"simple"},
    1051:{name:"Sub","class":"simple"},
    1052:{name:"Mul","class":"simple"},
    1053:{name:"Mul","class":"simple"},
    1911:{name:"AndArrayElementsPrimitive"},
}
};
