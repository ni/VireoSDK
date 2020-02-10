// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Special methods for the VirtualInstrument data type
 */

#ifndef VirtualInstrument_h
#define VirtualInstrument_h

#include "DataTypes.h"
#include "EventLog.h"
#include "Events.h"

#include <vector>
#include <map>

namespace Vireo
{

class VIClump;

#define VI_TypeName             "VirtualInstrument"
#define ReentrantVI_TypeName    "ReentrantVirtualInstrument"

//------------------------------------------------------------
//! The VIA definition for a VirtualInstrument. Must match the C++ definition.
#define VI_TypeString               \
"a(c(                               \n" \
"    e(TypeManager TypeManager)     \n" \
"    e(a(*) Params)                 \n" \
"    e(a(*) Locals)                 \n" \
"    e(a(*) EventSpecs)             \n" \
"    e(DataPointer EventInfo)       \n" \
"    e(a(Clump *) Clumps)           \n" \
"    e(Int32 LineNumberBase)        \n" \
"    e(DataPointer VIName)          \n" \
"    e(SubString ClumpSource)       \n" \
"))"

struct EventStructInfo {
    OccurrenceCore eventOccurrence;
    Int32 setCount;
    EventQueueID staticQID;
    EventStructInfo() : setCount(0), staticQID(0) { }
};

struct EventControlInfo {
    EventOracleIndex eventOracleIndex;
    EventControlUID controlID;
    explicit EventControlInfo(EventOracleIndex eoIdx = 0, EventControlUID ctlID = 0) : eventOracleIndex(eoIdx), controlID(ctlID) { }
};

struct EventInfo {
    typedef std::map<RefNum, EventControlInfo> ControlIDInfoMap;

    EventStructInfo *eventStructInfo;
    ControlIDInfoMap controlIDInfoMap;

    EventInfo() : eventStructInfo(nullptr) { }
    explicit EventInfo(Int32 numEventStruct) : eventStructInfo(nullptr) { eventStructInfo = new EventStructInfo[numEventStruct]; }
    ~EventInfo() {
        delete[] eventStructInfo;
        eventStructInfo = nullptr;
    }
};
//------------------------------------------------------------
//!
class VirtualInstrument
{
    friend class VIDataProcsClass;
 private:
    TypeManagerRef          _typeManager;
    TypedObjectRef          _params;        // All clumps in subVI share the same param block
    TypedObjectRef          _locals;        // All clumps in subVI share the same locals
    TypedObjectRef          _eventSpecs;    // All clumps in subVI share the same event specs
    EventInfo              *_eventInfo;     // Holds occurrences used to wake event structures
    TypedArray1D<VIClump>*  _clumps;
    void InitParamBlock();
    void ClearTopVIParamBlock();
 public:
    Int32                   _lineNumberBase;
    Utf8Char*               _viName;
    SubString               _clumpSource;  // For now, this is tied to the VIA codec.
                                           // It has a Begin and End pointer
 public:
    NIError Init(TypeManagerRef tm, Int32 clumpCount, TypeRef paramsType, TypeRef localsType, TypeRef eventSpecsType,
                 Int32 lineNumberBase, SubString* clumpSource);
    void PressGo();
    void GoIsDone();
    TypeRef GetVIElementAddressFromPath(SubString* eltPath, void* pStart, void** ppData, Boolean allowDynamic);

 public:
    ~VirtualInstrument();
    TypeManagerRef TheTypeManager() const { return _typeManager; }
    TypedObjectRef Params() const { return _params; }
    TypedObjectRef Locals() const { return _locals; }
    TypedObjectRef EventSpecs() const { return _eventSpecs; }
    EventInfo *GetEventInfo() const     { return _eventInfo; }
    void SetEventInfo(EventInfo *ei)    { _eventInfo = ei; }
    TypedArray1D<VIClump>* Clumps() const { return _clumps; }
    ConstCStr VINameCStr() const        { return ConstCStr(_viName); }
    SubString VIName() const
    {
        SubString s;
        if (_viName)
            s.AliasAssignLen(_viName, IntIndex(strlen(ConstCStr(_viName))));
        return s;
    }
    void SetVIName(const SubString &s, bool decode);
    SubString ClumpSource() const       { return _clumpSource; }
    Boolean IsTopLevelVI() const;
};

//------------------------------------------------------------
//! A ZDA that contains a VirtualInstrument
typedef TypedObject<VirtualInstrument>  *VirtualInstrumentObjectRef;

class FunctionClump
{
 public:
    InstructionCore* _codeStart;        // first instruction object in clump. may be shared  between multiple QEs
};

//------------------------------------------------------------
//! The VIA definition for a Clump. Must match the C++ definition.
#define Clump_TypeString              \
"c(\n" \
"    e(InstructionBlock CodeStart)\n" \
"    e(DataPointer Next)\n" \
"    e(Int64 WakeUpInfo)\n" \
"    e(DataPointer Owner)\n" \
"    e(DataPointer NextWaitingCaller)\n" \
"    e(DataPointer Caller)\n" \
"    e(Instruction SavePC)\n" \
"    e(Int32 FireCount)\n" \
"    e(Int32 ShortCount)\n" \
"    e(Int32 WaitCount)\n" \
"    e(Observer Observer)\n" \
"    e(Observer Observer)\n" \
")"

// Initially all clump had the ability to wait on timers, now that has grown to
// timers and objects such as the queue. Yet in many cases clumps never to need to
// on anything. In the simple case of no waiting several pointers can be saved.
// So The clump is going to migrate from one fixed, to a collection of ObserverState objects
// These are the step
//
// 1. move from one hardcoded time list to a fixed set of of WaitableSates that can be used for
// timers AND synchronization objects.
//
// 2. Move the fixed set of buffers to a set that can be dynamically allocated (and arrays)
//
// 3. Get Arrays to support nullptr-means-empty, or shared empty instances
//
// 4. Can other users of the _next field use the same mechanism?


//------------------------------------------------------------
//! A Clump owns an instruction list its execution state.
class VIClump : public FunctionClump
{
 public:
    VIClump*            _next;       //! Next clump if this one is in a list/queue, nullptr otherwise.
    PlatformTickType    _wakeUpInfo;  //! If clump is suspended, used to determine if wake up condition exists
                                     //  (e.g. time)
    VirtualInstrument*  _owningVI;        //! VI that this clump is part of.
    VIClump*            _waitingClumps;  //! If this clump is busy when called then callers are linked here.
    VIClump*            _caller;         //! Used for sub vi calls, clump to restart once done.
    InstructionCore*    _savePc;          //! Save when paused either due to sub vi call, or time slicing
    Int32               _fireCount;      //! What to reset _shortCount to when the clump is done.
    Int32               _shortCount;     //! Greater than 0 is not in run queue, when it goes to zero it gets enqueued
    Int32               _observationCount;  //! How many waitSates are active?
    Observer            _observationStates[2];  //! Fixed set of waits states, maximum is 2.

 public:
    void Trigger();
    Int32               FireCount() const { return _fireCount; }
    Int32               ShortCount() const { return _shortCount; }

    void InsertIntoWaitList(VIClump* elt);
    void AppendToWaitList(VIClump* elt);
    void EnqueueRunQueue()  { TheExecutionContext()->EnqueueRunQueue(this); }

    VirtualInstrument*  OwningVI() const { return _owningVI; }
    VirtualInstrument*  CallerVI() const { return _caller->OwningVI(); }
    VirtualInstrument*  TopVI()      {
        VIClump *caller = this;
        do {
            if (caller->_caller)
                caller = caller->_caller;
            caller = caller->_owningVI->Clumps()->Begin();
        } while (caller->_caller);
        return caller->_owningVI;
    }
    Observer*          GetObservationStates(Int32) { return _observationCount ? _observationStates : nullptr; }
    Observer*          ReserveObservationStatesWithTimeout(Int32, PlatformTickType tickCount);
    InstructionCore*    WaitUntilTickCount(PlatformTickType tickCount, InstructionCore* nextInstruction);
    void               ClearObservationStates();
    InstructionCore*    WaitOnObservableObject(InstructionCore* nextInstruction);
    TypeManagerRef      TheTypeManager() const { return OwningVI()->TheTypeManager(); }
    ExecutionContextRef TheExecutionContext() const { return TheTypeManager()->TheExecutionContext(); }
};

inline Boolean VirtualInstrument::IsTopLevelVI() const
{
    // can't be declared in class because we need VIClump to be defined
    return _clumps->Begin()->_caller == nullptr;
}

//------------------------------------------------------------
//! An instruction that suspends a clump and starts a SubVI's root clump.
struct CallVIInstruction : public InstructionCore
{
    /// The SubVI Call instruction contains a pointer to the SubVIs root clump
    /// and sub snippets for code to copy parameters in and out.

    _ParamImmediateDef(VIClump*, viRootClump);

    // In packed mode, the adjacent instruction is the first copy-in
    // instruction. The instruction following the subVI call has its own
    // explicit field.
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* CopyInSnippet()    { return this + 1; }
    inline InstructionCore* Next() const { return this->_piNext; }

    _ParamImmediateDef(InstructionCore*, CopyOutSnippet);
};
//------------------------------------------------------------
//! Class used by the ClumpParseState to track memory needed for instructions.
class InstructionAllocator {
 public:
    size_t      _size;
    AQBlock1*   _next;

    InstructionAllocator() { _size = 0; _next = nullptr; }
    Boolean IsCalculatePass() const { return _next == nullptr; }
    void AddRequest(size_t count);
    void Allocate(TypeManagerRef tm);
    void* AllocateSlice(size_t count);
};
//------------------------------------------------------------
struct PatchInfo
{
    enum PatchType {
        Perch = 0,
    };

    PatchType   _patchType;
    IntIndex     _whereToPeek;
    void**      _whereToPatch;
    PatchInfo() : _patchType(Perch), _whereToPeek(0), _whereToPatch(nullptr) { }
};
//------------------------------------------------------------
//! Utility class used by decoders that can decode VIs and Clumps
class ClumpParseState
{
// The compiler (clang) really did not want to allow static const pointers so they are #defines
#define kPerchUndefined     ((InstructionCore*)0)    // What a branch sees when it is used before a perch
#define kPerchBeingAllocated ((InstructionCore*)1)   // Perches awaiting the next instruction address see this
 public:
    static const Int32 kMaxArguments = 100;  // This is now only used for args to VIs and type templates
                                            // (a static limit may be reasonable)
    static const Int32 kClumpStateIncrementSize = 32;
 public:
    enum ArgumentState {
        // Initial state, not where it should end in either.
        kArgumentNotResolved,
        // Bad states to end in
        kArgumentTooMany,
        kArgumentTooFew,
        kArgumentTypeMismatch,
        kArgumentNotOptional,
        kArgumentNotMutable,
        // Good states to end in
        kArgumentResolved_FirstGood,
        kArgumentResolvedToVIElement = kArgumentResolved_FirstGood,
        kArgumentResolvedToGlobal,
        kArgumentResolvedToLiteral,
        kArgumentResolvedToDefault,
        kArgumentResolvedToParameter,
        kArgumentResolvedToClump,
        kArgumentResolvedToPerch,
        kArgumentResolved_LastGood = kArgumentResolvedToPerch,
    };
    ArgumentState   _argumentState;
    EventLog*       _pLog;
    Int32           _approximateLineNumber;

    InstructionAllocator* _cia;

    Int32           _argCount;
    std::vector<void*> _argPointers;
    std::vector<TypeRef> _argTypes;

    Int32           _argPatchCount;
    std::vector<Int32> _argPatches;     // Arguments that need patching

    Int32           _patchInfoCount;
    std::vector<PatchInfo> _patchInfos;  // Perch references that need patching

    Int32           _perchCount;
    std::vector<InstructionCore*> _perches;

    VirtualInstrument *_vi;
    VIClump*        _clump;

 private:    // State for patching owner/next field once next instruction created
    // When an instruction is made remember where its 'next' field is so that it can be
    // when the next instruction is generated. When packed instructions are used
    // this is most often nullptr since there are no next pointers. However roots
    // still exist like the pointer in the clump that points to the first instruction,
    // or a sub snippet pointer in the CallVI instruction.
    InstructionCore**   _pWhereToPatch;
    void                StartBuilding(VIClump* clump, InstructionCore** startLocation, InstructionAllocator *);
    InstructionCore*    AllocInstructionCore(Int32 argumentCount);
    InstructionCore*    CreateInstruction(TypeRef instructionType, Int32 argCount, void* args[]);
 public:
    void                RecordNextHere(InstructionCore** where);

 private:    // State related to two-pass parsing
    Int32           _totalInstructionCount;
    Int32           _totalInstructionPointerCount;

 private:    // State related to overloads
    Boolean         _hasMultipleDefinitions;
    NamedTypeRef    _nextFunctionDefinition;
    NamedTypeRef    _genericFunctionDefinition;  // Only one allowed

 private:    // State related to the the current argument
    Int32           _formalParameterIndex;
    TypeRef         _formalParameterType;
    TypeRef         _actualArgumentType;

 private:
    TypeRef         _baseViType;
    TypeRef         _baseReentrantViType;
 public:
    SubString       _parserFocus;

 public:
    // ---
    // The type that has the pointer to the specific target of the function.
    TypeRef         _instructionPointerType;

    // The calling signature descriptor for the instruction's function. Its the BaseType Of the PointerType.
    TypeRef         _instructionType;

    // When a Perch instruction is found the target address will be the next instruction
    // _perchIndexToRecordNextInstrAddr  lets the state know when that patch-up is needed.
    Int32           _perchIndexToRecordNextInstrAddr;

    Int32           _varArgCount;
    Int32           _varArgRepeatStart;
    Boolean         _bIsVI;

    //------------------------------------------------------------
    explicit ClumpParseState(ClumpParseState* cps);
    ClumpParseState(VIClump* clump, InstructionAllocator* cia, EventLog* pLog);
    void            Construct(VIClump* clump, InstructionAllocator* cia, Int32 lineNumber, EventLog* pLog);
    void            StartSnippet(InstructionCore** pWhereToPatch);
    TypeRef         FormalParameterType() const { return _formalParameterType; }
    TypeRef         ActualArgumentType() const { return _actualArgumentType; }
    Boolean         LastArgumentError() const { return _argumentState < kArgumentResolved_FirstGood; }
    TypeRef         ReadFormalParameterType();
    void            SetClumpFireCount(Int32 fireCount) const;
    TypeRef         StartInstruction(SubString* opName);
    TypeRef         StartNextOverload();
    Boolean         HasMultipleDefinitions() const { return _hasMultipleDefinitions; }
    TypeRef         ReresolveInstruction(SubString* opName);
    void            ResolveActualArgument(SubString* argument, void** ppData , Boolean needsAddress);
    void            AddDataTargetArgument(SubString* argument, Boolean addType, Boolean addAddress);
    void            InternalAddArgBack(TypeRef actualType, void* address);
    void            InternalAddArgFront(TypeRef actualType, void* address);
    void            InternalAddArgNeedingPatch(PatchInfo::PatchType patchType, intptr_t whereToPeek);
    Boolean         VarArgParameterDetected() const { return _varArgCount >= 0; }
    void            AddVarArgCount();
    void            SetVarArgRepeat()            { _varArgRepeatStart = _formalParameterIndex-1; }

    void            MarkPerch(SubString* perchToken);
    void            AddBranchTargetArgument(SubString* branchTargetToken);
    void            AddClumpTargetArgument(SubString* clumpIndexToken);
    VirtualInstrument*  AddSubVITargetArgument(TypeRef viType);
    Int32           AddSubSnippet();
    void            LogEvent(EventLog::EventSeverity severity, Int32 lineNumber, ConstCStr message, ...);
    void            LogArgumentProcessing(Int32 lineNumber);

    InstructionCore*    EmitCallVIInstruction();
    InstructionCore*    EmitInstruction();
    InstructionCore*    EmitInstruction(SubString* opName, Int32 argCount, ...);

    void            EmitSimpleInstruction(ConstCStr opName);
    void            CommitSubSnippet();
    void            CommitClump();
    static void     BeginEmitSubSnippet(ClumpParseState* subSnippet, InstructionCore* owningInstruction,
                                        Int32 argIndex);
    void            EndEmitSubSnippet(ClumpParseState* subSnippet);
};

typedef InstructionCore* (VIVM_FASTCALL _PROGMEM *GenericEmitFunction) (ClumpParseState*);

void RunCleanupProcs(VirtualInstrument *vi);

}  // namespace Vireo
#endif  // VirtualInstrument_h

