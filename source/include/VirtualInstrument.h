/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Special methods for the VirtualInstrument data type
 */

#ifndef VirtualInstrument_h
#define VirtualInstrument_h

#include "DataTypes.h"
#include "EventLog.h"

namespace Vireo
{

class VIClump;

#define VI_TypeName             "VirtualInstrument"
#define ReentrantVI_TypeName    "ReentrantVirtualInstrument"

//------------------------------------------------------------
//! The VIA definition for a VirtualInstrument. Must match the C++ definition.
#define VI_TypeString               \
"a(c(                               \
    e(.TypeManager TypeManager)     \
    e(a(.*) Params)                 \
    e(a(.*) Locals)                 \
    e(a(.Clump *) Clumps)         \
    e(.Int32 LineNumberBase)        \
    e(.SubString ClumpSource)       \
))"

//------------------------------------------------------------
//!
class VirtualInstrument
{
    friend class VIDataProcsClass;
private:
    TypeManagerRef          _typeManger;
    TypedObjectRef          _params;        // All clumps in subVI share the same param block
    TypedObjectRef          _locals;        // All clumps in subVI share the same locals
    TypedArray1D<VIClump>*  _clumps;
    void InitParamBlock();
    void ClearTopVIParamBlock();
public:
    Int32                   _lineNumberBase;
    SubString               _clumpSource;         // For now, this is tied to the VIA codec. It has a Begin and End pointer
public :
    NIError Init(TypeManagerRef tm, Int32 clumpCount, TypeRef paramsType, TypeRef localsType, Int32 lineNumberBase, SubString* source);
    void PressGo();
    void GoIsDone();
    TypeRef GetVIElementAddressFromPath(SubString* elementPath, void* pStart, void** pData, Boolean allowDynamic);

public:
    VirtualInstrument(ExecutionContextRef context, int clumps, TypeRef paramsType, TypeRef localsType);
    TypeManagerRef TheTypeManager()     { return _typeManger; }
    TypedObjectRef Params()             { return _params; }
    TypedObjectRef Locals()             { return _locals; }
    TypedArray1D<VIClump>* Clumps()     { return _clumps; }
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
"c(                                     \
    e(.InstructionBlock CodeStart)      \
    e(.DataPointer Next)                \
    e(.Int64 WakeUpInfo)                \
    e(.DataPointer Owner)               \
    e(.DataPointer NextWaitingCaller)   \
    e(.DataPointer Caller)              \
    e(.Instruction SavePC)              \
    e(.Int32 FireCount)                 \
    e(.Int32 ShortCount)                \
    e(.Int32 WaitCount)                 \
    e(.Observer Observer)               \
    e(.Observer Observer)               \
)"

// Initially all clump had the ability to wait on timers, now that has grown to
// timers and objects such as the queue. Yet in many cases clumps never to need to
// on anything. In the simple case of no waiting several pointes can be saved.
// So The clump is gogin to migrate from one fixed, to a collection of ObserverState objects
// These are the step
//
// 1. move from one hardcoded time list to a fixed set of of WaitableSates that can be used for
// timers AND synchronization objects.
//
// 2. Move the fixed set of buffers to a set that can be dynamically allocated (and arrays)
//
// 3. Get Arrays to support null-measn empty, or shared empty instances
//
// 4. Can other users of the _next field use the same mechanism?


//------------------------------------------------------------
//! A Clump owns an instruction list its execution state.
class VIClump : public FunctionClump
{
public:
    VIClump*            _next;              //! Next clump if this one is in a list or queue, null other wise.
    PlatformTickType    _wakeUpInfo;		//! If clump is suspended, used to determine if wake up condition exists (e.g. time)
    VirtualInstrument*  _owningVI;          //! VI that this clump is part of.
	VIClump*            _waitingClumps;     //! If this clump is busy when called then callers are linked here.
	VIClump*            _caller; 			//! Used for sub vi calls, clump to restart once done.
	InstructionCore*    _savePc;            //! Save when paused either due to sub vi call, or time slicing
	IntSmall            _fireCount;         //! What to reset _shortCount to when the clump is done.
	IntSmall            _shortCount;		//! Greater than 0 is not in run queue, when it goes to zero it gets enqueued
    Int32               _observationCount;  //! How many waitSates are active?
    Observer            _observationStates[2]; //! Fixed set of waits states, maximum is 2.
    
public:
    void Trigger();
    IntSmall            FireCount()     { return _fireCount; }
    IntSmall            ShortCount()    { return _shortCount; }
    
    void InsertIntoWaitList(VIClump* elt);
    void AppendToWaitList(VIClump* elt);
    void EnqueueRunQueue()  { TheExecutionContext()->EnqueueRunQueue(this); }

    VirtualInstrument*  OwningVI()      { return _owningVI; }
    Observer*           GetObservationStates(Int32) { return _observationCount ? _observationStates : null; };
    Observer*           ReserveObservationStatesWithTimeout(Int32, PlatformTickType count);
    InstructionCore*    WaitUntilTickCount(PlatformTickType count, InstructionCore* next);
    void                ClearObservationStates();
    InstructionCore*    WaitOnObservableObject(InstructionCore*);
    TypeManagerRef      TheTypeManager()        { return OwningVI()->TheTypeManager(); }
    ExecutionContextRef TheExecutionContext()   { return TheTypeManager()->TheExecutionContext(); }
};
//------------------------------------------------------------
//! An instruciton that suspends a clump and starts a SubVI's root clump.
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
    inline InstructionCore* Next()             { return this->_piNext; }

    _ParamImmediateDef(InstructionCore*, CopyOutSnippet);
};
//------------------------------------------------------------
//! Class used by the ClumpParseState to track memory needed for instructions.
class InstructionAllocator {
public:
    size_t      _size;
    AQBlock1*   _next;
    
    InstructionAllocator() { _size = 0; _next = null; }
    Boolean IsCalculatePass() { return _next == null; }
    void AddRequest(size_t count);
    void Allocate (TypeManagerRef tm);
    void* AllocateSlice(size_t count);
};
//------------------------------------------------------------
struct PatchInfo
{
    enum PatchType {
        Perch = 0,
    };
    
    PatchType   _patchType;
    void**      _whereToPeek;
    void**      _whereToPatch;
};
//------------------------------------------------------------
//! Utility class used by decoders that can decode VIs and Clumps
class ClumpParseState
{
    // The compiler (clang) really did not want to allow static const pointers so they are #defines
#define kPerchUndefined     ((InstructionCore*)0)    // What a branch sees when it is used before a perch
#define kPerchBeingAlocated ((InstructionCore*)1)    // Perches awaiting the next instruction address see this
public:
    static const Int32 kMaxPerches = 200;       // TODO dynamic
    static const Int32 kMaxArguments = 100;     // TODO dynamic
    static const Int32 kMaxPatchInfos = 100;    // TODO allow more
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
    void*           _argPointers[kMaxArguments];
    TypeRef         _argTypes[kMaxArguments];
    
    Int32           _argPatches[kMaxArguments];     // Arguments that need patching
    Int32           _argPatchCount;
    
    PatchInfo       _patchInfos[kMaxPatchInfos];
    Int32           _patchInfoCount;
    
    Int32           _perchCount;
    InstructionCore* _perches[kMaxPerches];
    
    VirtualInstrument *_vi;
    VIClump*        _clump;

private:    // State to pathcing owner/next field once next instruction created
    // When an instruction is made remember where its 'next' field is so that it can be
    // when the next instruction is generated. When packed instructions are used
    // this is most often null since there are no next pointers. However roots
    // still exist like the pointer in the clump that points to the first instruction,
    // or a sub snippet pointer in the CallVI instruction.
    InstructionCore**   _pWhereToPatch;
    void                StartBuilding(VIClump* clump, InstructionCore** startLocation, InstructionAllocator *);
    InstructionCore*    AllocInstructionCore(Int32 argumentCount);
    InstructionCore*    CreateInstruction(TypeRef instructionType, Int32 argCount, void* args[]);
public:
    void                RecordNextHere(InstructionCore** startLocation);

private:    // State related to two pass parseing
    Int32           _totalInstructionCount;
    Int32           _totalInstructionPointerCount;

private:    // state related to overloads
    Boolean         _hasMultipleDefinitions;
    NamedTypeRef    _nextFuncitonDefinition;
    NamedTypeRef    _genericFuncitonDefinition;  // Only one allowed
    
private:    // state related to the the current argument
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
    // _recordNextInstructionAddress  lets the state know when that patch-up is needed.
    Int32           _recordNextInstructionAddress;
    
    size_t*         _pVarArgCount;
    Boolean         _bIsVI;
    
    //------------------------------------------------------------
    ClumpParseState(ClumpParseState* cps);
    ClumpParseState(VIClump* clump, InstructionAllocator* cia, EventLog* pLog);
    void            Construct(VIClump* clump, InstructionAllocator* cia, Int32 lineNumber, EventLog* pLog);
    void            StartSnippet(InstructionCore** startLocation);
    TypeRef         FormalParameterType()       { return _formalParameterType; }
    TypeRef         ActualArgumentType()        { return _actualArgumentType; }
    Boolean         LastArgumentError()         { return _argumentState < kArgumentResolved_FirstGood; }
    TypeRef         ReadFormalParameterType();
    void            SetClumpFireCount(Int32 fireCount);
    TypeRef         StartInstruction(SubString* opName);
    TypeRef         StartNextOverload();
    Boolean         HasMultipleDefinitions()    { return _hasMultipleDefinitions; }
    TypeRef         ReresolveInstruction(SubString* opName, Boolean allowErrors);
    void            ResolveActualArgumentAddress(SubString* argument, void** ppData);
    void            AddDataTargetArgument(SubString* argument, Boolean prependType);
    void            InternalAddArg(TypeRef actualType, void* arg);
    void            InternalAddArgNeedingPatch(PatchInfo::PatchType patchType, void** whereToPeek);
    Boolean         VarArgParameterDetected()   { return _pVarArgCount != null; }
    Boolean         GenericFunction()           { return _instructionType->HasGenericType(); }
    void            AddVarArgCount();
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
    void            BeginEmitSubSnippet(ClumpParseState* subSnippet, InstructionCore* owningInstruction, Int32 argIndex);
    void            EndEmitSubSnippet(ClumpParseState* subSnippet);
};

typedef InstructionCore* (VIVM_FASTCALL _PROGMEM *GenericEmitFunction) (ClumpParseState*);

}
#endif //VirtualInstrument_h

