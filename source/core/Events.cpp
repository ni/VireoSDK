
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
#include <vector>
#include <list>

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
enum { kNotAQueueID };

class EventRegQueueID {
 public:
    EventRegQueueID(EventQueueID qID, RefNum ref) : _qID(qID), _ref(ref) { }
    EventQueueID _qID;
    RefNum _ref;
    // bool _locksPanel;
 private:
    EventRegQueueID();
};
typedef std::list<EventRegQueueID> EventRegQueueIDList;

class EventRegInfo {
 public:
    EventRegInfo(EventSource eSource, EventType eType) : _eventSource(eSource), _eventType(eType) { }
    EventSource _eventSource;
    EventType _eventType;
    EventRegQueueIDList _qIDList;
};
typedef std::list<EventRegInfo> EventRegList;

class EventOracleObj {
 public:
    explicit EventOracleObj(EventControlUID controlUID = kNotAnEventControlUID)  { }
    EventControlUID _controlUID;  // UID of control statically registered

    EventRegList _eRegList;
};
typedef std::vector<EventOracleObj> EventOracleObjVector;

// EventQueueObject -- manage a single event queue (statically or dynamically registered)
class EventQueueObject {
 public:
    EventQueueObject() : _wakeUpOccur(NULL), _status(kQIDFree), _eventLock(false) { }
    size_t size() const { return _eventQueue.size(); }
    void OccurEvent(const EventData &eData) {
        _eventQueue.push_back(eData);
        if (eData.pEventData) {  // make a unique copy of the event data for each event queue
            Int32 topSize = eData.eventDataType->TopAQSize();
            void *pEvent = THREAD_TADM()->Malloc(topSize);
            eData.eventDataType->InitData(pEvent, (TypeRef)NULL);
            eData.eventDataType->CopyData(eData.pEventData, pEvent);
            _eventQueue.back().pEventData = pEvent;
        }
        if (_wakeUpOccur)
            _wakeUpOccur->SetOccurrence();
    }
    const EventData &GetEventData() {
        if (size() > 0) {
            _eventLock = true;
            return _eventQueue.front();
        }
        return _timeOutEvent.Init(kEventSourceLVUserInt, kEventTypeTimeout, RefNumVal());
    }
    void SetObserver(OccurrenceCore *occ) {
        if (_wakeUpOccur != occ && occ) {
            size_t i = _eventQueue.size();
            while (i > 0) {  // fire once for each event already in queue
                occ->SetOccurrence();
                --i;
            }
        }
        _wakeUpOccur = occ;
    }
    void RemoveObserver() { _wakeUpOccur = NULL; }
    void DoneProcessingEvent() {
        if (_eventLock) {
            EventData &eventData = _eventQueue.front();
            eventData.eventDataType->ClearData(eventData.pEventData);
            THREAD_TADM()->Free(eventData.pEventData);
            _eventQueue.pop_front();
            _eventLock = false;
        }
    }
    typedef enum { kQIDFree, kQIDActive } QIDStatus;
    QIDStatus GetStatus() const { return _status; }
    void SetStatus(QIDStatus status) { _status = status; }

 private:
    std::deque<EventData> _eventQueue;
    OccurrenceCore *_wakeUpOccur;
    EventData _timeOutEvent;
    QIDStatus _status;
    bool _eventLock;  // true is the event at the front of the queue is being processed
};

typedef std::vector<EventQueueObject> EventQueueObjectVector;

typedef Int32 EventOracleIndex;
enum { kNotAnEventOracleIdx = -1, kAppEventOracleIdx = 0 };

// Event Oracle -- manage all event registration and delivery
class EventOracle {
 private:
    EventQueueObjectVector _qObject;
    EventOracleObjVector _eventReg;

    static EventOracle _s_singleton;

 public:
    size_t size(EventQueueID qID) const { return _qObject[qID].size(); }
    void OccurEvent(EventOracleIndex eventOracleIdx, const EventData &eData);
    void ObserveQueue(EventQueueID qID, OccurrenceCore *occ) {
        _qObject[qID].SetObserver(occ);
    }
    const EventData &GetEventData(EventQueueID qID) {
        return _qObject[qID].GetEventData();
    }
    void DoneProcessingEvent(EventQueueID qID) {
        return _qObject[qID].DoneProcessingEvent();
    }
    bool RegisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventControlUID controlUID, RefNum ref,
                          EventOracleIndex *oracleIdxPtr = NULL);
    bool UnregisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventControlUID controlUID, RefNum ref);
    bool EventListInsert(EventOracleIndex eventOracleIndex, EventRegQueueID eventRegQueueID, EventSource eSource, EventType eType);
    bool EventListRemove(EventOracleIndex eventOracleIndex, EventRegQueueID eventRegQueueID, EventSource eSource, EventType eType);
    bool GetNewQueueObject(EventQueueID *qID, OccurrenceCore *occurrence);

    EventOracle() {
        _qObject.push_back(EventQueueObject());  // EvenetQueueID 0 (kNotAQueueID) is reserved
        _eventReg.push_back(EventOracleObj());   // EventOracleIndex 0 (kNotAnEventOracleIdx) is reserved
    }

    static EventOracle &TheEventOracle() { return _s_singleton; }
};

EventOracle EventOracle::_s_singleton;

// OccurEvent -- broadcast an event to all registered event queues
void EventOracle::OccurEvent(EventOracleIndex eventOracleIdx, const EventData &eData) {
    if (eventOracleIdx < _eventReg.size()) {
        EventRegList &eRegList = _eventReg[eventOracleIdx]._eRegList;
        EventRegList::iterator eRegIter = eRegList.begin(), eRegIterEnd = eRegList.end();
        while (eRegIter != eRegIterEnd && (eRegIter->_eventSource != eData.common.eventSource
                                           || eRegIter->_eventType != eData.common.eventType))
            ++eRegIter;

        if (eRegIter != eRegIterEnd) {
            EventRegQueueIDList::iterator rqIter = eRegIter->_qIDList.begin(), rqIterEnd = eRegIter->_qIDList.end();
            RefNum ref = eData.common.eventRef.GetRefNum();
            while (rqIter != rqIterEnd) {
                if (rqIter->_ref == ref)
                    _qObject[rqIter->_qID].OccurEvent(eData);
                ++rqIter;
            }
        }
    }
}

// EventListInsert -- add registration entry at given eventOracleIndex for event source/type/ref, watching the given QueueID
bool EventOracle::EventListInsert(EventOracleIndex eventOracleIndex, EventRegQueueID eventRegQueueID, EventSource eSource, EventType eType) {
    bool added = false;
    EventRegList &eRegList = _eventReg[eventOracleIndex]._eRegList;
    EventRegList::iterator eRegIter = eRegList.begin(), eRegIterEnd = eRegList.end();
    while (eRegIter != eRegIterEnd && (eRegIter->_eventSource != eSource || eRegIter->_eventType != eType))
        ++eRegIter;
    if (eRegIter != eRegIterEnd) {  // found registration matching event source/type
        EventRegQueueIDList::iterator rqIter = eRegIter->_qIDList.begin(), rqIterEnd = eRegIter->_qIDList.end();
        while (rqIter != rqIterEnd && (rqIter->_qID != eventRegQueueID._qID || rqIter->_ref != eventRegQueueID._ref))
            ++rqIter;
        if (rqIter == rqIterEnd) {  // ref/qID not found, add it
            eRegIter->_qIDList.push_back(eventRegQueueID);
            added = true;
        }
    } else {  // first registration for this event source/type
        EventRegInfo eventRegInfo(eSource, eType);
        eventRegInfo._qIDList.push_back(eventRegQueueID);
        eRegList.push_back(eventRegInfo);
        added = true;
    }
    return added;
}

// EventListRemove -- remove registration entry for given eventOracleIndex for event source/type/ref
bool EventOracle::EventListRemove(EventOracleIndex eventOracleIndex, EventRegQueueID eventRegQueueID, EventSource eSource, EventType eType) {
    bool removed = false;
    EventRegList &eRegList = _eventReg[eventOracleIndex]._eRegList;
    EventRegList::iterator eRegIter = eRegList.begin(), eRegIterEnd = eRegList.end();
    while (eRegIter != eRegIterEnd && (eRegIter->_eventSource != eSource || eRegIter->_eventType != eType))
        ++eRegIter;
    if (eRegIter != eRegIterEnd) {  // found registration matching event source/type
        EventRegQueueIDList::iterator rqIter = eRegIter->_qIDList.begin(), rqIterEnd = eRegIter->_qIDList.end();
        while (rqIter != rqIterEnd && (rqIter->_qID != eventRegQueueID._qID || rqIter->_ref != eventRegQueueID._ref))
            ++rqIter;
        if (rqIter != rqIterEnd) {  // ref/qID found, remove it
            eRegIter->_qIDList.erase(rqIter);
            if (eRegIter->_qIDList.empty())
                eRegList.erase(eRegIter);
            if (eventOracleIndex != kAppEventOracleIdx && eRegList.empty()) {
                // TODO(spathiwa) - was the last registered event for this index; inform control (_eventReg[eventOracleIndex]._controlUID) to forget index
            }
            removed = true;
        }
    }
    return removed;
}

// RegisterForEvent -- register for given event source/type on either a static control (controlUID) or dynamic reference (ref),
// queueing events into the specified event queue [qID].  The event oracle index (bucket) allocated is returned for quicker lookup;
// all events for the same control are bucketed together.  User events are always in the application index (kAppEventOracleIdx) bucket.
bool EventOracle::RegisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventControlUID controlUID,
                                   RefNum ref, EventOracleIndex *oracleIdxPtr) {
    EventOracleIndex eventOracleIndex = kNotAnEventOracleIdx;
    if (oracleIdxPtr)
        *oracleIdxPtr = eventOracleIndex;
    if (qID >= _qObject.size()) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents with invalid QueueiD");
        return false;
    }
    if (!controlUID) {
        if (!ref) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents must pass either controlUID or dynamic ref");
            return false;
        }
        eventOracleIndex = kAppEventOracleIdx;
    } else {
        if (ref) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents cannot pass both controlUID and dynamic ref");
            return false;
        }
        // TODO(spathiwa) -- finish; control should be queried for its cached eventOracleIndex if it previously registered
        // eventOracleIndex = ...
    }
    if (eventOracleIndex == kNotAnEventOracleIdx) {  // no eventOracleIndex, allocate a new one
        size_t size = _eventReg.size(), idx = kAppEventOracleIdx+1;
        while (eventOracleIndex < size && !_eventReg[eventOracleIndex]._eRegList.empty()) {
            ++eventOracleIndex;
        }
        if (idx < size) {  // we found an unused index
            _eventReg[idx]._controlUID = controlUID;
        } else {
            EventOracleObj eo(controlUID);
            _eventReg.push_back(eo);
            // TODO(spathiwa) -- finish: notify control of its new eventOracleIndex
        }
        if (oracleIdxPtr)
            *oracleIdxPtr = eventOracleIndex;
    }
    return EventListInsert(eventOracleIndex, EventRegQueueID(qID, ref), eSource, eType);
}

// UnregisterForEvent -- unregister for given event source/type on either a static control (controlUID) or dynamic reference (ref),
// in the given event queue [qID].
bool EventOracle::UnregisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventControlUID controlUID, RefNum ref) {
    EventOracleIndex eventOracleIndex = kAppEventOracleIdx;
    if (controlUID) {
        // TODO(spathiwa) -- look up index for given control
    }
    if (qID >= _qObject.size()) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "UnregisterForEvents with invalid QueueiD");
        return false;
    }
    return EventListRemove(eventOracleIndex, EventRegQueueID(qID, ref), eSource, eType);
}

// GetNewQueueObject -- dynamically allocate a new event queue, and associate the given occurrence with it so that it is fired
// when new events are enqueued.  Called by Event structure (WaitForEventsAndDispatch) on the queues passed to it via the
// event reg. refnum input.
bool EventOracle::GetNewQueueObject(EventQueueID *qID, OccurrenceCore *occurrence) {
    EventQueueObjectVector::iterator qoIter = _qObject.begin()+1;  // skip the first QueueID; reserved as kNotAQueueID
    EventQueueObjectVector::iterator qoIterEnd = _qObject.end();
    while (qoIter != qoIterEnd && qoIter->GetStatus() != EventQueueObject::kQIDFree)
        qoIter++;
    if (qoIter != qoIterEnd) {
        qoIter->SetStatus(EventQueueObject::kQIDActive);
        qoIter->SetObserver(occurrence);
        *qID = EventQueueID(qoIter - _qObject.begin());
    } else {
        EventQueueObject eqObject;
        eqObject.SetObserver(occurrence);
        eqObject.SetStatus(EventQueueObject::kQIDActive);
        _qObject.push_back(eqObject);
        *qID = EventQueueID(_qObject.size() - 1);
    }
    return true;
}

// EventRegistrationRefNumManager -- Manage dynamic Event Registration refnums.

class DynamicEventRegEntry {
 public:
    EventSource eventSource;
    EventType eventType;
    UInt32 regFlags;
    RefNumVal refVal;
    RefNumVal prevRefVal;
    DynamicEventRegEntry(EventSource eSource, EventType eType, UInt32 rFlags, RefNumVal refv) : eventSource(eSource), eventType(eType),
        regFlags(rFlags), refVal(refv), prevRefVal(NULL) { }
};

class DynamicEventRegInfo {
 public:
    EventQueueID _qID;
    std::vector<DynamicEventRegEntry> _entry;

    DynamicEventRegInfo(EventQueueID qID, Int32 nEntries) : _qID(qID) {
        _entry.reserve(nEntries);
    }
    Int32 DynamicEventMatch(const EventCommonData &eData) {
        Int32 dynIndex = 0;
        for (size_t i = 0; i < _entry.size(); i++) {
            DynamicEventRegEntry &entry = _entry[i];
            if (entry.eventSource == eData.eventSource && entry.eventType == eData.eventType && entry.refVal.GetRefNum() == eData.eventRef.GetRefNum()) {
                dynIndex = Int32(i+1);
                break;
            }
        }
        return dynIndex;
    }
    ~DynamicEventRegInfo() {
        // for (size_t i = 0; i < _entry.size(); i++) {  TODO(spathiwa)
        //    if/when _refVal is array/cluster, delete DynamicEventRegEntry->_refVal
        // }
    }
};

class EventRegistrationRefNumManager : public RefNumManager {
 private:
    typedef TypedRefNum<DynamicEventRegInfo*, true> EventRegRefNumType;
    EventRegRefNumType _refStorage;  // manages refnum storage

    static EventRegistrationRefNumManager _s_singleton;
 public:
    static EventRegistrationRefNumManager &EventRegistrationRefManager() { return _s_singleton; }
    static EventRegRefNumType &RefNumStorage() { return _s_singleton.RefNumManager(); }

    EventRegRefNumType &RefNumManager() { return _refStorage; }
};

EventRegistrationRefNumManager EventRegistrationRefNumManager::_s_singleton;

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

// Cleanup Proc for disposing user event refnums when top-level VI finishes
static void CleanUpUserEventRefNum(intptr_t arg) {
    RefNum refnum = RefNum(arg);
    void *userEventRef = NULL;
    UserEventRefNumManager::RefNumStorage().DisposeRefNum(refnum, &userEventRef);
}

// CreateUserEvent(userEventRef<typed_data> errorIO) -- allocate a new typed User Event refnum
VIREO_FUNCTION_SIGNATURE2(UserEventRef_Create, RefNumVal, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    Int32 errCode = 0;
    void* userEventRef = NULL;
    RefNum refnum = 0;

    ErrorCluster *errPtr = _ParamPointer(1);
    if (errPtr && errPtr->status) {
        if (refnumPtr)
            refnumPtr->SetRefNum(0);
        return _NextInstruction();
    }
    if (!refnumPtr) {
        errCode = kEventArgErr;
    } else {
        // Unlike Queue_Obtain, we don't need to calll InitData on ref here. No actual data allocated for event until the event is fired.
        refnum = UserEventRefNumManager::RefNumStorage().NewRefNum(&userEventRef);
        refnumPtr->SetRefNum(refnum);

        VirtualInstrument* vi = THREAD_CLUMP()->TopVI();
        EventRegistrationRefNumManager::AddCleanupProc(vi, CleanUpUserEventRefNum, refnum);
    }
    if (errCode) {
        if (errPtr)
            errPtr->SetError(true, errCode, "CreateUserEvent");
    }
    return _NextInstruction();
}

// GenerateUserEvent(userEventRef<typed_data> data errorIO) -- fire event, copying data into event queues of all registered observers
VIREO_FUNCTION_SIGNATURE4(UserEventRef_Generate, RefNumVal, void, Boolean, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    void *pSourceData = _ParamPointer(1);
    // Boolean highPro = _ParamPointer(2) ? _Param(2) : false;
    ErrorCluster *errPtr = _ParamPointer(3);
    TypeRef type = refnumPtr ? refnumPtr->Type()->GetSubElement(0) : NULL;
    void *userEventRef = NULL;

    // TODO(spathiwa) implement high-priority User Events
    if (!errPtr || !errPtr->status) {
        if (!refnumPtr
            || UserEventRefNumManager::RefNumStorage().GetRefNumData(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success) {
            if (errPtr)
                errPtr->SetError(true, kEventArgErr, "GenerateUserEvent");
        } else {
            // TODO(spathiwa) make a custom emitter for this prim so we can check the type of the data against the refnum's contained type
            // without incurring runtime performance penalty
            EventOracle::TheEventOracle().OccurEvent(kAppEventOracleIdx, EventData(kEventSourceUserEvent, kEventTypeUserEvent, *refnumPtr, type, pSourceData));
        }
    }
    return _NextInstruction();
}

// DestroyUserEvent(userEventRef<typed_data> errorIO)
VIREO_FUNCTION_SIGNATURE2(UserEventRef_Destroy, RefNumVal, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    ErrorCluster *errPtr = _ParamPointer(1);
    void *userEventRef = NULL;

    if (!refnumPtr || UserEventRefNumManager::RefNumStorage().DisposeRefNum(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success) {
        if (errPtr && !errPtr->status)
            errPtr->SetError(true, kEventArgErr, "DestroyUserEvent");
    }
    return _NextInstruction();
}
//------------------------------------------------------------
struct RegistertForEventArgs {
    EventType *eventType;
    StaticTypeAndData ref;
};

struct RegisterForEventsParamBlock : public VarArgInstruction
{
    _ParamDef(RefNumVal, regRef);
    _ParamDef(ErrorCluster, errorClust);
    _ParamImmediateDef(RegistertForEventArgs, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

// GetEventSourceForEventType -- return the EventSource associated with an event type
static inline EventSource GetEventSourceForEventType(EventType eType) {
    EventSource eSource = kEventSourceLVUserInt;
    if (eType == kEventTypeUserEvent)
        eSource = kEventSourceUserEvent;
    return eSource;
}

// UnregisterForEventsAux -- helper function to unregister for dynamic events, called from prim and cleanup proc
static bool UnregisterForEventsAux(RefNum refnum) {
    DynamicEventRegInfo *regInfo = NULL;
    if (EventRegistrationRefNumManager::RefNumStorage().DisposeRefNum(refnum, &regInfo) != kNIError_Success || !regInfo)
        return false;
    EventQueueID qID = regInfo->_qID;
    std::vector<DynamicEventRegEntry>::iterator regInfoEntryIter = regInfo->_entry.begin(), regInfoEntryIterEnd = regInfo->_entry.end();
    while (regInfoEntryIter != regInfoEntryIterEnd) {
        EventOracle::TheEventOracle().UnregisterForEvent(qID, regInfoEntryIter->eventSource, regInfoEntryIter->eventType, 0, refnum);
        ++regInfoEntryIter;
    }
    delete regInfo;
    return true;
}

// Cleanup Proc for disposing event reg. refnums when top-level VI finishes
static void CleanUpEventRegRefNum(intptr_t arg) {
    RefNum refnum = RefNum(arg);
    UnregisterForEventsAux(refnum);
}

VIREO_FUNCTION_SIGNATUREV(RegisterForEvents, RegisterForEventsParamBlock)
{
    RefNumVal* eventRegRefnumPtr = _ParamPointer(regRef);
    DynamicEventRegInfo *regInfo = NULL;

    const Int32 numberOfFixedArgs = 2;  // eventRegRef, errorIO
    const Int32 numArgsPerTuple = 3;    // <eventType, user/control ref (STAD)> pairs
    Int32 numVarArgs = (_ParamVarArgCount() - numberOfFixedArgs);
    Int32 numTuples = numVarArgs / numArgsPerTuple;
    ErrorCluster *errPtr = _ParamPointer(errorClust);

    if (errPtr && errPtr->status)
        return _NextInstruction();

    if (eventRegRefnumPtr->Type()->SubElementCount() != 1 || !eventRegRefnumPtr->Type()->GetSubElement(0)->IsCluster()) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents: malformed ref ref type, doesn't contain cluster");
        return THREAD_EXEC()->Stop();
    }
    Int32 regCount = eventRegRefnumPtr->Type()->GetSubElement(0)->SubElementCount();
    if (numVarArgs % numArgsPerTuple != 0 || regCount != numTuples) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents: Wrong number of arguments.  Should be one <event code, ref> input pair"
                                " per item in the event reg refnum output type");
        return THREAD_EXEC()->Stop();
    }
    RefNum erRefNum = eventRegRefnumPtr->GetRefNum();
    if (erRefNum && EventRegistrationRefNumManager::RefNumStorage().GetRefNumData(erRefNum, &regInfo) == kNIError_Success) {
        // TODO(spathiwa) implement re-registeration, sanity check count
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents: re-registration not yet supported");
        return THREAD_EXEC()->Stop();
    } else if (erRefNum) {  // event reg. ref passed, but invalid
        if (errPtr && !errPtr->status)
            errPtr->SetError(true, kEventArgErr, "RegisterForEvents");
    }

    // Allocate a new Event Queue and associate it with the event reg. refnum
    EventQueueID qID = kNotAQueueID;
    EventOracle::TheEventOracle().GetNewQueueObject(&qID, NULL);
    regInfo = new DynamicEventRegInfo(qID, regCount);
    erRefNum = EventRegistrationRefNumManager::RefNumStorage().NewRefNum(&regInfo);
    eventRegRefnumPtr->SetRefNum(erRefNum);

    // Set cleanup proc to unregister if VI doesn't do it explicitly
    VirtualInstrument* vi = THREAD_CLUMP()->TopVI();
    EventRegistrationRefNumManager::AddCleanupProc(vi, CleanUpEventRegRefNum, erRefNum);

    // Loop through input types and register for events
    TypeRef regRefClusterType = eventRegRefnumPtr->Type()->GetSubElement(0);
    RegistertForEventArgs *arguments =  _ParamImmediate(argument1);
    for (Int32 refInput = 0; refInput < numTuples; ++refInput) {
        EventType eventType = *arguments[refInput].eventType;
        TypeRef refType = arguments[refInput].ref._paramType;
        TypeRef regType = regRefClusterType->GetSubElement(refInput);
        if (!regType->IsCluster() || regType->SubElementCount() != 2 || regType->GetSubElement(0)->BitEncoding() != kEncoding_S2CInt) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents: Malformed event reg ref type (element %d)", refInput);
            return THREAD_EXEC()->Stop();
        }
        TypeRef regRefType = regType->GetSubElement(1);
        if (!refType->CompareType(regRefType)) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents: Input %d type doesn't match event reg ref element type", refInput);
            return THREAD_EXEC()->Stop();
        }
        RefNumVal *refData = (RefNumVal*)arguments[refInput].ref._pData;
        // TO-DO(spathiwa) for control events, make sure ref is valid and return error if not

        EventSource eSource = GetEventSourceForEventType(eventType);
        regInfo->_entry.push_back(DynamicEventRegEntry(eSource, eventType, 0, *refData));
        EventOracle::TheEventOracle().RegisterForEvent(qID, eSource, eventType, 0, refData->GetRefNum());
        // gPlatform.IO.Printf("RegisterForEvents event %d, ref 0x%x\n", eventType, refData->GetRefNum());
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(UnregisterForEvents, RefNumVal, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    ErrorCluster *errPtr = _ParamPointer(1);
    if (!refnumPtr || !UnregisterForEventsAux(refnumPtr->GetRefNum())) {
        if (errPtr && !errPtr->status)
            errPtr->SetError(true, kEventArgErr, "UnregisterForEvents");
    }
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
    EventSource eventSource;
    EventType eventType;
    EventControlUID eventControlUID;  // 0 == no control (App or VI event, or dynamic)
    UInt32 dynIndex;  // 0 == not dynamic
};
typedef EventSpec *EventSpecRef;

static inline bool EventMatch(const EventData &eData, const EventSpec &eSpec, Int32 dynIndex = 0) {
    return (eData.common.eventSource == eSpec.eventSource && eData.common.eventType == eSpec.eventType
            && eData.controlUID == eSpec.eventControlUID && dynIndex == eSpec.dynIndex);
}

VIREO_FUNCTION_SIGNATUREV(WaitForEventsAndDispatch, WaitForEventsParamBlock)
{
    Int32 *timeOutPtr = _ParamPointer(timeOut);
    RefNumVal* eventRegRefnumPtr = _ParamPointer(regRef);
    EventQueueID eventQID = kNotAQueueID;

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

    // TODO(spathiwa) -- handle cluster of dynamic event reg refnums
    DynamicEventRegInfo *regInfo = NULL;
    if (eventRegRefnumPtr
        && EventRegistrationRefNumManager::RefNumStorage().GetRefNumData(eventRegRefnumPtr->GetRefNum(), &regInfo) == kNIError_Success) {
        eventQID = regInfo->_qID;
    }

    EventInfo *eventInfo = owningVI->GetEventInfo();
    OccurrenceCore &occ = eventInfo[eventStructIndex].eventOccurrence;
    // TODO(spathiwa) -- if different dynamic QID than last time, unobserve previous queue
    EventOracle::TheEventOracle().ObserveQueue(eventQID, &occ);

    AQBlock1 *eventSpecClustPtr = eventStructSpecsRef->RawBegin();
    TypeRef eventSpecType = eventStructSpecsRef->ElementType()->GetSubElement(eventStructIndex);
    Int32 esCount = eventSpecType->SubElementCount();
    eventSpecClustPtr += eventSpecType->ElementOffset();
    EventSpecRef eventSpecRef = (EventSpecRef)eventSpecClustPtr;
    {
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

    // TODO(spathiwa) -- watch static and dynamic queue, take earliest event
    // TODO(spathiwa) -- handle/test for spurious timeout (real event and timeout happen at same time,
    //                   should go back to sleep w/o running timeout case)
    const EventData &eventData = EventOracle::TheEventOracle().GetEventData(eventQID);
    Int32 dynIndex = regInfo ? regInfo->DynamicEventMatch(eventData.common) : 0;

    for (Int32 inputTuple = 0; inputTuple < numTuples; ++inputTuple) {
        UInt32 eventSpecIndex = *arguments[inputTuple].eventSpecIndex;
        if (eventSpecIndex >= esCount) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Invalid Event Spec Index");
            return THREAD_EXEC()->Stop();
        }
        TypeRef esEventDataNodeType = arguments[inputTuple].data._paramType;
        void *esEventDataNode = arguments[inputTuple].data._pData;
        InstructionCore *esBranchTarget = arguments[inputTuple].branchTarget;
        if (EventMatch(eventData, eventSpecRef[eventSpecIndex], dynIndex)) {
            // gPlatform.IO.Printf("Event match %d -> %x\n", eventSpecRef[eventSpecIndex].eventType, esBranchTarget);
            const Int32 commonDataSize = sizeof(EventCommonData);
            Int32 dataNodeSize = esEventDataNodeType->TopAQSize();
            if (dataNodeSize >= commonDataSize) {
                // TODO(spathiwa) Compute eventIndex when we support multiple events sharing event cases
                UInt32 eventIndex = 0;
                memcpy(esEventDataNode, &eventData, commonDataSize);
                *EventIndexFieldPtr(esEventDataNode) = eventIndex;

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

VIREO_FUNCTION_SIGNATURE2(IsNotAnEventRegRefnum, RefNumVal, Boolean)
{
    RefNumVal* eventRegRefnumPtr = _ParamPointer(0);
    DynamicEventRegInfo *regInfo = NULL;
    if (!eventRegRefnumPtr
        || EventRegistrationRefNumManager::RefNumStorage().GetRefNumData(eventRegRefnumPtr->GetRefNum(), &regInfo) != kNIError_Success)
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
    DEFINE_VIREO_FUNCTION_CUSTOM(GenerateUserEvent, UserEventRef_Generate, "p(i(UserEventRefNum ue) i(* element) i(Boolean highprio) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(DestroyUserEvent, UserEventRef_Destroy, "p(i(UserEventRefNum ue) io(ErrorCluster err))")

    // Event registration
    DEFINE_VIREO_TYPE(EventRegRefNum, "refnum($0)")
    DEFINE_VIREO_FUNCTION(RegisterForEvents, "p(i(VarArgCount) io(EventRegRefNum ref) io(ErrorCluster err)"
                          "i(VarArgRepeat) i(Int32 eventType)i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(UnregisterForEvents, "p(i(EventRegRefNum ref) io(ErrorCluster err))")

    DEFINE_VIREO_FUNCTION(WaitForEventsAndDispatch, "p(i(VarArgCount) i(Int32 timeOut) i(EventRegRefNum ref) i(Int32 esIndex) "
                          "i(VarArgRepeat) i(Int32 specIndex)i(StaticTypeAndData)i(BranchTarget))")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAUserEventRefnum, "p(i(UserEventRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(UserEventRefNum) i(UserEventRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(UserEventRefNum) i(UserEventRefNum) o(Boolean))")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAnEventRegRefnum, "p(i(EventRegRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(EventRegRefNum) i(EventRegRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(EventRegRefNum) i(EventRegRefNum) o(Boolean))")

DEFINE_VIREO_END()

}  // namespace Vireo
