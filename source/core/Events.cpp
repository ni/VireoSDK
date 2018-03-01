
/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief Native Vireo event registration and handling
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "RefNum.h"
#include "Events.h"
#include <deque>

namespace Vireo {

// Manage UserEvent refnums.
// The refnum storage stores only a placeholder null value because we only actually need to lookup whether a refnum is valid or not;
// the data is stored in the Event Oracle's event queues, not in the refnum, and the User Event's type is available in any context
// where it's needed by the datatype of other inputs.
class UserEventRefNumManager : public RefNumManager {
 private:
    typedef TypedRefNum<void*, true> UserEventRefNumType;
    UserEventRefNumType _UserEventRefNumTypeStorage;  // manages refnum storage

    static UserEventRefNumManager _s_singleton;
 public:
    static UserEventRefNumManager &UserEventRefManager() { return _s_singleton; }
    static UserEventRefNumType &RefNumStorage() { return _s_singleton.RefNumManager(); }

    UserEventRefNumType &RefNumManager() { return _UserEventRefNumTypeStorage; }
};

UserEventRefNumManager UserEventRefNumManager::_s_singleton;

typedef Int32 EventQueueID;

// EventQueueObject - manage a single event queue (statically or dynamically registered)
class EventQueueObject {
 private:
    std::deque<EventData> _eventQueue;
    OccurrenceCore *_wakeUpOccur;
    EventData _timeOutEvent;

 public:
    size_t size() const { return _eventQueue.size(); }
    void OccurEvent(const EventData &eData) {
        _eventQueue.push_back(eData);
        if (_wakeUpOccur)
            _wakeUpOccur->SetOccurrence();
    }
    const EventData &GetEventData() const {
        if (size() > 0)
            return _eventQueue.front();
        new((void*)&_timeOutEvent) EventData(kEventSourceLVUserInt, kEventTypeTimeout, RefNumVal());
        return _timeOutEvent;;
    }
    void SetObserver(OccurrenceCore *occ) { _wakeUpOccur = occ; }
    void RemoveObserver() { _wakeUpOccur = NULL; }
    void DoneProcessingEvent() {
        if (size() > 0) {
            EventData &eventData = _eventQueue.front();
            eventData.eventDataType->ClearData(eventData.pEventData);
            THREAD_TADM()->Free(eventData.pEventData);
            _eventQueue.pop_front();
        }
    }
};

// Event Oracle -- manage all event registration and delivery
class EventOracle {
 private:
    EventQueueObject _qObject[1];  // Prototype - simplistic single-queue implementation of event queue

    static EventOracle _s_singleton;

 public:
    // Prototype - simplistic single-queue implementation of event queue
    size_t size(EventQueueID qID) const { return _qObject[0].size(); }
    void OccurEvent(const EventData &eData) {
        _qObject[0].OccurEvent(eData);  // ??? handle multiple queues
    }
    void ObserveQueue(EventQueueID qID, OccurrenceCore *occ) { _qObject[qID].SetObserver(occ); }
    const EventData &GetEventData(EventQueueID qID) const {
        return _qObject[qID].GetEventData();
    }
    void DoneProcessingEvent(EventQueueID qID) {
        return _qObject[qID].DoneProcessingEvent();
    }

    static EventOracle &TheEventOracle() { return _s_singleton; }
};

EventOracle EventOracle::_s_singleton;

void RegisterForStaticEvents(VirtualInstrument *vi) {
    TypeRef eventsSpecsTy = vi->EventSpecs()->Type();
    Int32 numES = eventsSpecsTy->GetSubElement(0)->SubElementCount();
    EventInfo *eventInfo = new EventInfo[numES];

    for (Int32 esIndex = 0; esIndex < numES; ++esIndex) {
        eventInfo[esIndex].setCount = 0;
    }
    vi->SetEventInfo(eventInfo);
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(UserEventRef_Create, RefNumVal, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    Int32 errCode = 0;
    void* userEventRef = NULL;
    RefNum refnumVal = 0;

    ErrorCluster *errPtr = _ParamPointer(1);
    if (errPtr && errPtr->status) {
        if (refnumPtr)
            refnumPtr->SetRefNum(0);
        return _NextInstruction();
    }
    if (!refnumPtr) {
        errCode = kUserEventArgErr;
    } else {
        // Unlike Queue_Obtain, we don't need to calll InitData on ref here. No actual data allocated for event until the event is fired.
        refnumVal = UserEventRefNumManager::RefNumStorage().NewRefNum(&userEventRef);
        refnumPtr->SetRefNum(refnumVal);
    }
    if (errCode) {
        if (errPtr)
            errPtr->SetError(true, errCode, "CreateUserEvent", true);
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(UserEventRef_Generate, RefNumVal, void, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    const void *pSourceData = _ParamPointer(1);
    ErrorCluster *errPtr = _ParamPointer(2);
    TypeRef type = refnumPtr ? refnumPtr->Type()->GetSubElement(0) : NULL;
    void *userEventRef = NULL;

    if (!errPtr || !errPtr->status) {
        if (!refnumPtr
            || UserEventRefNumManager::RefNumStorage().GetRefNumData(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success) {
            if (errPtr)
                errPtr->SetError(true, kUserEventArgErr, "GenerateUserEvent", true);
        } else {
            Int32 topSize = type->TopAQSize();
            void *pEvent = THREAD_TADM()->Malloc(topSize);
            NIError status = type->InitData(pEvent, (TypeRef)NULL);
            if (status == kNIError_Success) {
                type->CopyData(pSourceData, pEvent);
                EventOracle::TheEventOracle().OccurEvent(EventData(kEventSourceUserEvent, kEventTypeUserEvent, *refnumPtr, type, pEvent));
            }
        }
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE2(UserEventRef_Destroy, RefNumVal, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    ErrorCluster *errPtr = _ParamPointer(1);
    void *userEventRef = NULL;

    if (!refnumPtr || UserEventRefNumManager::RefNumStorage().DisposeRefNum(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success) {
        if (errPtr && !errPtr->status)
            errPtr->SetError(true, kUserEventArgErr, "DestroyUserEvent", true);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
struct RegistertForEventArgs {
    UInt32 *eventType;
    StaticTypeAndData ref;
};

struct RegisterForEventsParamBlock : public VarArgInstruction
{
    _ParamDef(RefNumVal, regRef);
    _ParamDef(ErrorCluster, ErrClust);
    _ParamImmediateDef(RegistertForEventArgs, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(RegisterForEvents, RegisterForEventsParamBlock)
{
    // RefNumVal* refnumPtr = _ParamPointer(regRef);
    const Int32 numberOfFixedArgs = 2;
    const Int32 numArgsPerTuple = 3;  // <eventType, branchTarget>; ref is StaticTypeAndData so counts as two args
    Int32 numTuples = (_ParamVarArgCount() - numberOfFixedArgs) / numArgsPerTuple;
    RegistertForEventArgs *arguments =  _ParamImmediate(argument1);
    for (Int32 refInput = 0; refInput < numTuples; ++refInput) {
        // TypeRef refType = arguments[refInput].ref._paramType;
        RefNumVal *refData = (RefNumVal*)arguments[refInput].ref._pData;
        gPlatform.IO.Printf("RegisterForEvents event %d, ref 0x%x\n", *arguments[refInput].eventType, refData->GetRefNum());

        // TODO(spathiwa) - implement
        // Hack for simple single-queue event oracle, auto register the first event structure's occurrence.
        // (Actual implementation will dynamically allocate an EventQueueObject and store its EventQueueID and
        // registered references in an event reg. refnum's refnum storage; downstream Event structure will
        // dynamically observe the queues passed to it via the event reg. refnum.
        VirtualInstrument *owningVI = THREAD_CLUMP()->OwningVI();
        TypedObjectRef eventStructSpecsRef = owningVI->EventSpecs();
        Int32 nStructs = eventStructSpecsRef->ElementType()->SubElementCount();
        if (nStructs > 0) {
            EventQueueID qID = 0;   // hard-coded
            EventInfo *eventInfo = owningVI->GetEventInfo();
            OccurrenceCore &occ = eventInfo[qID].eventOccurrence;
            EventOracle::TheEventOracle().ObserveQueue(qID, &occ);
        }
        // end hack
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE2(UnregisterForEvents, RefNumVal, ErrorCluster)
{
    // RefNumVal* refnumPtr = _ParamPointer(0);

    // TODO(spathiwa) - implement
    return _NextInstruction();
}

//------------------------------------------------------------
struct WaitForEventArgs {
    UInt32 *eventSpecIndex;
    StaticTypeAndData data;
    InstructionCore *branchTarget;
};

struct WaitForEventsParamBlock : public VarArgInstruction
{
    _ParamDef(Int32, timeOut);
    _ParamDef(RefNumVal, regRef);
    _ParamDef(Int32, eventStructIndex);
    _ParamImmediateDef(WaitForEventArgs, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

struct EventSpec {
    UInt32 eventSource;
    UInt32 eventType;
    UInt32 eventControlID;
    UInt32 dynIndex;
};
typedef EventSpec *EventSpecRef;

static inline bool EventMatch(const EventCommonData &eCommon, const EventSpec &eSpec, Int32 dynIndex = 0) {
    return (eCommon.eventSource == eSpec.eventSource && eCommon.eventType == eSpec.eventType);
            // && controlID == eSpec.eventControlID
            // && dynIndex == eSpec.dynIndex);
}

VIREO_FUNCTION_SIGNATUREV(WaitForEventsAndDispatch, WaitForEventsParamBlock)
{
    Int32 *timeOutPtr = _ParamPointer(timeOut);
    // RefNumVal* eventRegRefnumPtr = _ParamPointer(regRef);
    // TODO(spathiwa) - handle dyn reg
    EventQueueID eventQID = 0;

    Int32 eventStructIndex = _Param(eventStructIndex);
    const Int32 numberOfFixedArgs = 3;
    const Int32 numArgsPerTuple = 4;  // <evemtSpecIndex, data, branchTarget>; data is StaticTypeAndData so counts as two args
    Int32 numTuples = (_ParamVarArgCount() - numberOfFixedArgs) / numArgsPerTuple;
    WaitForEventArgs *arguments =  _ParamImmediate(argument1);
    InstructionCore *next = _NextInstruction();

    VirtualInstrument *owningVI = THREAD_CLUMP()->OwningVI();
    TypedObjectRef eventStructSpecsRef = owningVI->EventSpecs();
    Int32 nStructs = eventStructSpecsRef->ElementType()->SubElementCount();
    if (eventStructIndex >= nStructs) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Invalid Event Struct Index");
        return THREAD_EXEC()->Stop();
    }
    AQBlock1 *eventSpecClustPtr = eventStructSpecsRef->RawBegin();
    TypeRef eventSpecType = eventStructSpecsRef->ElementType()->GetSubElement(eventStructIndex);
    Int32 esCount = eventSpecType->SubElementCount();
    eventSpecClustPtr += eventSpecType->ElementOffset();
    EventSpecRef eventSpecRef = (EventSpecRef)eventSpecClustPtr;
    {
        EventInfo *eventInfo = owningVI->GetEventInfo();
        OccurrenceCore &occ = eventInfo[eventStructIndex].eventOccurrence;
        Int32 &staticCount = eventInfo[eventStructIndex].setCount;

        UInt32 msTimeout = timeOutPtr ? *timeOutPtr : -1;
        VIClump* clump = THREAD_CLUMP();
        if (!occ.HasOccurred(staticCount, false)) {
            Observer* pObserver = clump->GetObservationStates(2);
            if (!pObserver) {
                PlatformTickType future = msTimeout > 0 ? gPlatform.Timer.MillisecondsFromNowToTickCount(msTimeout) : 0;
                pObserver = clump->ReserveObservationStatesWithTimeout(2, future);
                occ.InsertObserver(pObserver+1, occ.Count()+1);
                return clump->WaitOnObservableObject(_this);
            }
        } else {
            // gPlatform.IO.Printf("Event Has Occurred %d %d\n", staticCount, occ.Count());
        }
        clump->ClearObservationStates();
        ++staticCount;
    }
    const EventData &eventData = EventOracle::TheEventOracle().GetEventData(eventQID);

    for (Int32 inputTuple = 0; inputTuple < numTuples; ++inputTuple) {
        UInt32 eventSpecIndex = *arguments[inputTuple].eventSpecIndex;
        if (eventSpecIndex >= esCount) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Invalid Event Spec Index");
            return THREAD_EXEC()->Stop();
        }
        TypeRef esEventDataNodeType = arguments[inputTuple].data._paramType;
        void *esEventDataNode = arguments[inputTuple].data._pData;
        InstructionCore *esBranchTarget = arguments[inputTuple].branchTarget;
        if (EventMatch(eventData.common, eventSpecRef[eventSpecIndex])) {
            // gPlatform.IO.Printf("Event match %d -> %x\n", eventSpecRef[eventSpecIndex].eventType, esBranchTarget);
            const Int32 commonDataSize = sizeof(EventCommonData);
            Int32 dataNodeSize = esEventDataNodeType->TopAQSize();
            if (dataNodeSize >= commonDataSize) {
                memcpy(esEventDataNode, &eventData, commonDataSize);
                if (eventData.eventDataType->TopAQSize() == dataNodeSize - commonDataSize) {
                    // TODO(spathiwa) Should we also verify type of event data node matches event at run-time?
                    // When we support multiple events with a shared event case, this needs to be smarter
                    // and copy only common data.
                    eventData.eventDataType->CopyData(eventData.pEventData, (AQBlock1*)esEventDataNode + commonDataSize);
                }
            } else {
                memcpy(esEventDataNode, &eventData, dataNodeSize);
            }
            next = esBranchTarget;
            break;
        }
    }
    EventOracle::TheEventOracle().DoneProcessingEvent(eventQID);

    return next;
}

VIREO_FUNCTION_SIGNATURE2(IsNotAUserEventRefnum, RefNumVal, Boolean)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    void *userEventRef = NULL;
    if (!refnumPtr || UserEventRefNumManager::RefNumStorage().GetRefNumData(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(IsEQRefnum, RefNumVal, RefNumVal, Boolean);
VIREO_FUNCTION_SIGNATURE3(IsNERefnum, RefNumVal, RefNumVal, Boolean);

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(Events)

    // User Events
    DEFINE_VIREO_TYPE(UserEventRefNum, "refnum($0)")
    DEFINE_VIREO_FUNCTION_CUSTOM(CreateUserEvent, UserEventRef_Create, "p(o(UserEventRefNum ue) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GenerateUserEvent, UserEventRef_Generate, "p(io(UserEventRefNum ue) i(* element) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(DestroyUserEvent, UserEventRef_Destroy, "p(i(UserEventRefNum ue) io(ErrorCluster err))")

    // Event registration
    DEFINE_VIREO_TYPE(EventReg, "a($0 $1)")
    DEFINE_VIREO_TYPE(EventRegRefNum, "refnum(EventReg)")
    DEFINE_VIREO_FUNCTION(RegisterForEvents, "p(i(VarArgCount) io(EventRegRefNum ref) io(ErrorCluster err)"
                          "i(VarArgRepeat) i(Int32 eventType)i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(UnregisterForEvents, "p(io(EventRegRefNum ref) io(ErrorCluster err))")

    DEFINE_VIREO_FUNCTION(WaitForEventsAndDispatch, "p(i(VarArgCount) i(Int32 timeOut) i(EventRegRefNum ref) i(Int32 esIndex) "
                          "i(VarArgRepeat) i(Int32 specIndex)i(StaticTypeAndData)i(BranchTarget))")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAUserEventRefnum, "p(i(UserEventRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(UserEventRefNum) i(UserEventRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(UserEventRefNum) i(UserEventRefNum) o(Boolean))")

DEFINE_VIREO_END()

}  // namespace Vireo
