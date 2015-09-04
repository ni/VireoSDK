// Ids used in json data.
module.exports = {

// Class hierarchy for diagram nodes
classMap: {
  // Some internals
  Node:null,
  Daigram:"Node",
  Wire:"Node",
  ClumpStart:"Node",
  ClumpEnd:"Node",
  MethodCall:"Node",
  Primitive:"Node",
  CallByReference:"MethodCall",
  CallChain:"Node",
  PlugInNode:"Node",
  DataAccessor:"Node",
  DebugPoint:"Node",
  DfirRoot:"Structure",

  // Core strucutre
  Structure:"Node",
  Loop:"Structure",
  ForLoop:"Loop",
  WhileLoop:"Loop",
  CaseStructure:"Structure",
  DisableStructure:"Structure",
  InplaceElementStructure:"Structure",

  // Core structure border nodes
  BorderNode:"Node",
  Tunnel:"BorderNode",
  SiblingTunnel:"Tunnel",
  CaseSelector:"BorderNode",       // the '?' terminal
  LeftShiftRegister:"BorderNode",
  RightShiftRegister:"BorderNode",
  LoopCondition:"BorderNode",
  LoopIndex:"BorderNode",          // i
  LoopMax:"BorderNode",            // N on the for loop
  FeedbackInitNode:"BorderNode",
  FeedbackInputNode:"BorderNode",
  FeedbackOutputNode:"BorderNode",

  // Simple prims/nodes operations
  Constant:"Node",
  CompoundArithmeticNode:"Node",
  WaitNode:"Node",
  WaitUntilNextMultipleNode:"Node",
  TickCountNode:"Node",
  CoercionNode:"Node",

  // Array operations
  InitializeArryNode:"Node",
  ArrayIndexNode:"Node",
  ReshapeArrayNode:"Node",
  Decimate1DArrayNode:"Node",
  DeleteFromArrayNode:"Node",
  ArraySubsetNode:"Node",
  AutomaticErrorHanlerNode:"Node",

  // Cluster operations
  BuildClusterNode:"Node",
  BuildClusterArrayNode:"Node",

  // Events
  CreateUserEvent:"Node",
  DestroyUserEvent:"Node",
  FlushEventQueue:"Node",
  UnRegisterForEvents:"Node",
  RegisterForEvents:"Node",
  GenerateUserEvent:"Node",
  EventStructure:"Node",

  // String operations
  FormatIntoStringNode:"Node",
  Concatenate:"Node",

  // Other operations
  LoopTimerNode:"TimingNodeBase",
  TimingNodeBase:"Node",

  // Abbreviations
  diagram:"Diagram",
  data:"DataAccessor",
  constant:"Constant",
  "for":"ForLoop",
  vi:"DfirRoot",
  coerce:"CoercionNode",
  primitive:"Primitive",
  dbgPt:"DebugPoint"
},

// Some initial prim Ids
primIds:{
  1050:"Add",
  1051:"Sub",
  1052:"Mul",
  1053:"Mul",
  1911:"AndArrayElementsPrimitive",
}
};
