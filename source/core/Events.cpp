// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief Native Vireo event registration and handling
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "RefNum.h"
#include "Events.h"
#include "ControlRef.h"
#include "JavaScriptRef.h"
#include <deque>
#include <vector>
#include <list>

namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    // JavaScript function prototypes
    // Parameters: viName, controlId, eventId, eventOracleIndex
    extern void jsRegisterForControlEvent(StringRef, UInt32, UInt32, UInt32);
    // Parameters: viName, controlId, eventId, eventOracleIndex
    extern void jsUnRegisterForControlEvent(StringRef, UInt32, UInt32, UInt32);
}
#endif

// Manage UserEvent refnums.
// The refnum storage stores only a placeholder nullptr value because we only actually need to lookup whether a refnum is valid or not;
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

// Monotonically incremented event number, so we can always tell which event is generated first even if timestamps are the same
UInt32 EventData::_s_eventSequenceNumber = 0;

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
    explicit EventOracleObj(EventControlUID controlUID = kNotAnEventControlUID, RefNum ctlRef = kNotARefNum) :
        _controlUID(controlUID), _controlRef(ctlRef) { }
    EventControlUID _controlUID;  // UID of control if statically registered
    RefNum  _controlRef;    // Control RefNum of control if statically registered
    EventRegList _eRegList;
};
typedef std::vector<EventOracleObj> EventOracleObjVector;

// EventQueueObject -- manage a single event queue (statically or dynamically registered)
class EventQueueObject {
 public:
    EventQueueObject() : _wakeUpOccur(nullptr), _status(kQIDFree), _eventLock(false) { }
    size_t size() const { return _eventQueue.size(); }
    void OccurEvent(const EventData &eData) {
        _eventQueue.push_back(eData);
        _eventQueue.back().common.eventSeqIndex = EventData::GetNextEventSequenceNumber();
        if (eData.pEventData) {  // make a unique copy of the event data for each event queue
            Int32 topSize = eData.eventDataType->TopAQSize();
            void *pEvent = THREAD_TADM()->Malloc(topSize);
            eData.eventDataType->InitData(pEvent, (TypeRef)nullptr);
            eData.eventDataType->CopyData(eData.pEventData, pEvent);
            _eventQueue.back().pEventData = pEvent;
        }
        if (_wakeUpOccur)
            _wakeUpOccur->SetOccurrence();
    }
    void ClearQueue() {
        VIREO_ASSERT(!_eventLock)
        bool keepGoing = true;
        do {
            keepGoing = DiscardTopEvent();
        } while (keepGoing);
    }
    void DeleteQueue() {
        ClearQueue();
        SetStatus(kQIDFree);
    }
    const bool GetPendingEventSequenceNumber(UInt32 *eventSeq) {
        if (size() > 0) {
            *eventSeq = _eventQueue.front().common.eventSeqIndex;
            return true;
        }
        return false;
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
    void RemoveObserver() { _wakeUpOccur = nullptr; }
    void DoneProcessingEvent() {
        if (_eventLock) {
            DiscardTopEvent();
            _eventLock = false;
        }
    }
    typedef enum { kQIDFree, kQIDActive } QIDStatus;
    QIDStatus GetStatus() const { return _status; }
    void SetStatus(QIDStatus status) { _status = status; }

 private:
    bool DiscardTopEvent() {
        if (_eventQueue.size() > 0) {
            EventData &eventData = _eventQueue.front();
            eventData.Destroy();
            _eventQueue.pop_front();
            return true;
        }
        return false;
    }
    std::deque<EventData> _eventQueue;
    OccurrenceCore *_wakeUpOccur;
    EventData _timeOutEvent;
    QIDStatus _status;
    bool _eventLock;  // true is the event at the front of the queue is being processed
};

typedef std::vector<EventQueueObject> EventQueueObjectVector;

// Event Oracle -- manage all event registration and delivery
class EventOracle {
 private:
    EventQueueObjectVector _qObject;
    EventOracleObjVector _eventReg;

    static EventOracle _s_singleton;

 public:
    typedef enum { kNewRegistration, kAddedToNewQueue, kNoChange } EventInsertStatus;

    size_t size(EventQueueID qID) const { return _qObject[qID].size(); }
    void OccurEvent(EventOracleIndex eventOracleIdx, const EventData &eData);
    bool GetControlInfoForEventOracleIndex(EventOracleIndex eventOracleIdx, EventControlUID *controlID, RefNum *controlRef);
    void ObserveQueue(EventQueueID qID, OccurrenceCore *occ) {
        _qObject[qID].SetObserver(occ);
    }
    const EventData &GetEventData(EventQueueID qID) {
        return _qObject[qID].GetEventData();
    }
    void DoneProcessingEvent(EventQueueID qID) {
        return _qObject[qID].DoneProcessingEvent();
    }
    void DeleteEventQueue(EventQueueID qID) {  // marks unallocated
        if (size_t(qID) < _qObject.size())
            _qObject[qID].DeleteQueue();
    }
    Int32 GetPendingEventInfo(EventQueueID *pActiveQID, Int32 nQueues, RefNumVal *dynRegRefs, Int32 *dynIndexBase);
    EventInsertStatus RegisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventControlUID controlUID, RefNum ref,
                          EventOracleIndex *oracleIdxPtr = nullptr);
    bool UnregisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventOracleIndex eventOracleIndex, RefNum ref);
    EventInsertStatus EventListInsert(EventOracleIndex eventOracleIndex, EventRegQueueID eventRegQueueID, EventSource eSource, EventType eType);
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
    if (UInt32(eventOracleIdx) < _eventReg.size()) {
        EventRegList &eRegList = _eventReg[eventOracleIdx]._eRegList;
        EventRegList::iterator eRegIter = eRegList.begin(), eRegIterEnd = eRegList.end();
        while (eRegIter != eRegIterEnd && (eRegIter->_eventSource != eData.common.eventSource
                                           || eRegIter->_eventType != eData.common.eventType))
            ++eRegIter;

        if (eRegIter != eRegIterEnd) {
            EventRegQueueIDList::iterator rqIter = eRegIter->_qIDList.begin(), rqIterEnd = eRegIter->_qIDList.end();
            RefNum ref = eData.common.eventRef.GetRefNum();
            while (rqIter != rqIterEnd) {
                RefNum rRef = rqIter->_ref;
                if (rRef == ref)
                    _qObject[rqIter->_qID].OccurEvent(eData);
                ++rqIter;
            }
        }
    }
}

bool EventOracle::GetControlInfoForEventOracleIndex(EventOracleIndex eventOracleIdx, EventControlUID *controlID, RefNum *controlRef) {
    if (UInt32(eventOracleIdx) < _eventReg.size()) {
        if (controlID)
            *controlID = _eventReg[eventOracleIdx]._controlUID;
        if (controlRef)
            *controlRef = _eventReg[eventOracleIdx]._controlRef;
        return true;
    }
    return false;
}

// EventListInsert -- add registration entry at given eventOracleIndex for event source/type/ref, watching the given QueueID
EventOracle::EventInsertStatus EventOracle::EventListInsert(EventOracleIndex eventOracleIndex, EventRegQueueID eventRegQueueID, EventSource eSource,
                                   EventType eType) {
    EventInsertStatus added = kNoChange;
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
            added = kAddedToNewQueue;
        }
    } else {  // first registration for this event source/type
        EventRegInfo eventRegInfo(eSource, eType);
        eventRegInfo._qIDList.push_back(eventRegQueueID);
        eRegList.push_back(eventRegInfo);
        added = kNewRegistration;
    }
    return added;
}

// EventListRemove -- remove registration entry for given eventOracleIndex for event source/type/ref
bool EventOracle::EventListRemove(EventOracleIndex eventOracleIndex, EventRegQueueID eventRegQueueID, EventSource eSource, EventType eType) {
    bool removed = false;
    if (size_t(eventOracleIndex) >= _eventReg.size())
        return removed;
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
EventOracle::EventInsertStatus EventOracle::RegisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventControlUID controlUID,
                                   RefNum ref, EventOracleIndex *oracleIdxPtr) {
    EventOracleIndex eventOracleIndex = kNotAnEventOracleIdx;
    if (oracleIdxPtr)
        *oracleIdxPtr = eventOracleIndex;
    if (UInt32(qID) >= _qObject.size()) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents with invalid QueueiD");
        return kNoChange;
    }
    if (!controlUID) {
        if (!ref) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "RegisterForEvents must pass either controlUID or dynamic ref");
            return kNoChange;
        }
        eventOracleIndex = kAppEventOracleIdx;
    } else {
        // TODO(spathiwa) -- finish; control should be queried for its cached eventOracleIndex if it previously registered
        // eventOracleIndex = ...
    }
    if (eventOracleIndex == kNotAnEventOracleIdx) {  // no eventOracleIndex, allocate a new one
        size_t size = _eventReg.size(), idx = kAppEventOracleIdx+1;
        while (UInt32(idx) < size && !_eventReg[idx]._eRegList.empty() && _eventReg[idx]._controlUID != controlUID) {
            ++idx;
        }
        if (idx < size) {  // we found an unused index, or one already for this control ID
            _eventReg[idx]._controlUID = controlUID;
            _eventReg[idx]._controlRef = ref;
        } else {
            EventOracleObj eo(controlUID, ref);
            _eventReg.push_back(eo);
            // TODO(spathiwa) -- finish: notify control of its new eventOracleIndex
        }
        eventOracleIndex = EventOracleIndex(idx);
        if (oracleIdxPtr)
            *oracleIdxPtr = eventOracleIndex;
    }
    return EventListInsert(eventOracleIndex, EventRegQueueID(qID, ref), eSource, eType);
}

// UnregisterForEvent -- unregister for given event source/type on either a static control (controlUID) or dynamic reference (ref),
// in the given event queue [qID].
bool EventOracle::UnregisterForEvent(EventQueueID qID, EventSource eSource, EventType eType, EventOracleIndex eventOracleIndex, RefNum ref) {
    if (static_cast<size_t>(qID) >= _qObject.size()) {
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
enum EventRegFlags {
    kEventRegFlagsNone = 0L,
    kEventRegFlagsLocksUI = 1,         // not yet implemented
    kEventRegFlagsCallback = 2,        // not yet implemented
    kEventRegFlagsHasLossyLimit = 4,   // not yet implemented
    kEventRegFlagsPolyData = 8         // indicates reg entry is polymorphic data (allocated copy)
};

class DynamicEventRegEntry {
 public:
    EventSource eventSource;
    EventType eventType;
    EventRegFlags regFlags;
    union {
        struct {
            void *refDataEntry;  // Allocated storage, used when entry is an array or cluster: (regFlags & kEventRegFlagsPolyData)!=0
            TypeRef refPolyType;
        };
        RefNumVal refnumEntry;   // Inline storage, used when entry is a scalar refnum
    };
    DynamicEventRegEntry(EventSource eSource, EventType eType, const RefNumVal &refv, EventRegFlags rFlags = kEventRegFlagsNone) :
        eventSource(eSource), eventType(eType), regFlags(rFlags), refnumEntry(refv) { }
    DynamicEventRegEntry(EventSource eSource, EventType eType, void *pData, TypeRef refType, EventRegFlags rFlags = kEventRegFlagsPolyData) :
        eventSource(eSource), eventType(eType), regFlags(EventRegFlags(rFlags | kEventRegFlagsPolyData)), refDataEntry(pData), refPolyType(refType) { }
};

class DynamicEventRegInfo {
 public:
    EventQueueID _qID;
    std::vector<DynamicEventRegEntry> _entry;

    DynamicEventRegInfo(EventQueueID qID, Int32 nEntries) : _qID(qID) {
        _entry.reserve(nEntries);
    }
    size_t NumEntries() const { return _entry.size(); }

    // Recursive function to match a registered dynamic event with polymorphic data (clusters/arrays of refs)
    // If the registered data is a cluster or nested cluster updated *dynIndexBase with the nested element
    // index as it traverses, and returns a non-zero index if a match occcurs.  (The dynIndex value is
    // the same one storied in the EventSpec in the event structure configuration data.)
    static Int32 DynamicEventMatchCore(TypeRef regRefType, void *pData, RefNum refnum, Int32 *dynIndexBase) {
        Int32 dynIndex = 0;
        if (regRefType->IsRefnum() && pData && (static_cast<RefNumVal*>(pData)->GetRefNum() == refnum)) {
            dynIndex = *dynIndexBase;
            return dynIndex;
        } else if (regRefType->IsArray() && regRefType->Rank() == 1 && regRefType->GetSubElement(0)->IsRefnum()) {
            TypedArray1D<RefNumVal> *aRef = *(TypedArray1D<RefNumVal>**)pData;
            RefNumVal *aPtr = aRef->BeginAt(0);
            for (Int32 i = 0; i < aRef->Length(); ++i) {
                if (aPtr->GetRefNum() == refnum) {
                    dynIndex = *dynIndexBase;
                    return dynIndex;
                }
                ++aPtr;
            }
        } else if (regRefType->IsCluster()) {
            AQBlock1 *refClustPtr = static_cast<AQBlock1*>(pData);
            AQBlock1 *eltPtr = refClustPtr;
            Int32 numElts = regRefType->SubElementCount();
            ++*dynIndexBase;  // the whole cluster counts as one, matching the rules for unbundler recursive indexes
            for (Int32 j = 0; j < numElts; ++j) {
                TypeRef eltType = regRefType->GetSubElement(j);
                eltPtr = refClustPtr + eltType->ElementOffset();
                if ((dynIndex = DynamicEventMatchCore(eltType, eltPtr, refnum, dynIndexBase)))
                    break;
                ++*dynIndexBase;
            }
        }
        return dynIndex;
    }
    // Return if the given Event data matches dynamically registered events; returns nonzero dynIndex of match if so.
    Int32 DynamicEventMatch(const EventCommonData &eData, TypeRef regRefClusterType) {
        Int32 dynIndex = 0, dynIndexBase = 1;
        for (Int32 i = 0; i < Int32(_entry.size()); i++) {
            DynamicEventRegEntry &entry = _entry[i];
            if (entry.eventSource == eData.eventSource && entry.eventType == eData.eventType) {
                TypeRef regType = regRefClusterType->GetSubElement(i);
                TypeRef regRefType = regType->GetSubElement(1);
                if (regRefType->IsRefnum()) {
                    if (entry.refnumEntry.GetRefNum() == eData.eventRef.GetRefNum())
                        return dynIndexBase;
                } else {
                    if ((dynIndex = DynamicEventMatchCore(regRefType, entry.refDataEntry, eData.eventRef.GetRefNum(), &dynIndexBase)))
                        break;
                }
            }
            ++dynIndexBase;
        }
        return dynIndex;
    }

    ~DynamicEventRegInfo() {
         for (size_t i = 0; i < _entry.size(); i++) {
             // Free any allocated polymorphic event reg. data
             DynamicEventRegEntry &entry = _entry[i];
             if ((entry.regFlags & kEventRegFlagsPolyData)) {
                 entry.refPolyType->ClearData(entry.refDataEntry);
                 THREAD_TADM()->Free(entry.refDataEntry);
             }
         }
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

// GetPendingEventInfo -- given a static queue and a set of dynamic event queues (passed via refnum), return the queue with the earliest event
// based on sequence number.  Returns 0 if the earliest event is in the static queue (if non-nullptr), or a 1-based index into the dynamic queue
// list if the earliest event is in one of the dynamic queues.
// Also returns the base dynamic index of the returned queueID (e.g. event reg. refnum; if this event reg. refnum has multiple registered items
// the dynIndex will be further incremented by the caller to indicate which item actually matches the event).
Int32 EventOracle::GetPendingEventInfo(EventQueueID *pActiveQID, Int32 nQueues, RefNumVal *dynRegRefs, Int32 *dynIndexBase) {
    EventQueueID eventQID = pActiveQID ? *pActiveQID : kNotAQueueID;
    Int32 earliestIndex = -1, regIndex = 0;
    UInt32 earliestSeq = 0, eventSeq = 0;
    Int32 skippedEntries = 0;
    if (eventQID) {  // passed static QueueID to check with dynamic set
        if (_qObject[eventQID].GetPendingEventSequenceNumber(&eventSeq)) {
            earliestIndex = 0;
            earliestSeq = eventSeq;
        } else {
            eventQID = kNotAQueueID;
        }
    }
    while (regIndex < nQueues) {
        DynamicEventRegInfo *regInfo = nullptr;
        if (dynRegRefs
            && EventRegistrationRefNumManager::RefNumStorage().GetRefNumData(dynRegRefs[regIndex].GetRefNum(), &regInfo) == kNIError_Success) {
            // For each valid dynamic reference, find the event with the earliest event sequence number in its queue.
            if (_qObject[regInfo->_qID].GetPendingEventSequenceNumber(&eventSeq)
                && (!eventQID  // first time through loop, take starting seq number
                    || EventTimeSeqCompare(eventSeq, earliestSeq) < 0)) {
                eventQID = regInfo->_qID;
                earliestSeq = eventSeq;
                earliestIndex = regIndex+1;
                *dynIndexBase = skippedEntries;
            }
            skippedEntries += regInfo->NumEntries();
        }
        ++regIndex;
    }
    *pActiveQID = eventQID;
    return earliestIndex;
}

struct EventSpec {  // Specifier for Event structure configuration data
    EventSource eventSource;
    EventType eventType;
    RefNum eventControlRef;  // 0 == no control (App or VI event, or dynamic)
    UInt32 dynIndex;  // 0 == not dynamic
};
typedef EventSpec *EventSpecRef;

// GetEventSourceForEventType -- return the EventSource associated with an event type
static inline EventSource GetEventSourceForEventType(EventType eType) {
    EventSource eSource = kEventSourceLVUserInt;
    if (eType == kEventTypeUserEvent)
        eSource = kEventSourceUserEvent;
    else if (eType >= kEventTypeValueChange)
        eSource = kEventSourceNXGUIEvent;
    return eSource;
}

// TODO(segaljared): Move this to a more convenient location for general use in the future
void GetVIName(VirtualInstrument *vi, StringRef viName) {
    PercentEncodedSubString encodedStr(vi->VIName(), true, false);
    SubString encodedSubstr = encodedStr.GetSubString();
    viName->AppendSubString(&encodedSubstr);
}

void RegisterForControlEvent(EventInfo *eventInfo, EventSpec eventSpec, StringRef viName, EventQueueID qID, UInt32 controlID, RefNum reference,
                        bool registerControlEvent) {
    EventOracleIndex eventOracleIdx = kNotAnEventOracleIdx;
    EventType eventType = eventSpec.eventType;
    EventSource eSource = eventSpec.eventSource;
    EventOracle::EventInsertStatus status = EventOracle::TheEventOracle().RegisterForEvent(qID, eSource, eventType, controlID, reference,
                                &eventOracleIdx);
    // gPlatform.IO.Printf("Static Register for VI %*s controlID %d, event %d, eventOracleIdx %d\n",
    //                     viName->Length(), viName->Begin(), controlID, eventType, eventOracleIdx);
    if (eventOracleIdx > kAppEventOracleIdx && status == EventOracle::kNewRegistration) {
        eventInfo->controlIDInfoMap[reference] = EventControlInfo(eventOracleIdx, controlID);
#if kVireoOS_emscripten
        if (registerControlEvent) {
            jsRegisterForControlEvent(viName, controlID, eventType, eventOracleIdx);
        }
#endif
    }
}

void RegisterForStaticEvents(VirtualInstrument *vi) {
    TypedObjectRef eventStructSpecsRef = vi->EventSpecs();
    Int32 numEventStructs = eventStructSpecsRef->ElementType()->SubElementCount();
    EventInfo *eventInfo = new EventInfo(numEventStructs);

    for (Int32 eventStructIndex = 0; eventStructIndex < numEventStructs; ++eventStructIndex) {
        TypeRef eventSpecType = eventStructSpecsRef->ElementType()->GetSubElement(eventStructIndex);
        AQBlock1 *eventSpecClustPtr = eventStructSpecsRef->RawBegin() + eventSpecType->ElementOffset();
        EventSpecRef eventSpecRef = (EventSpecRef)eventSpecClustPtr;
        Int32 eventSpecCount = eventSpecType->SubElementCount();
        EventQueueID qID = kNotAQueueID;
        EventOracle::TheEventOracle().GetNewQueueObject(&qID, nullptr);
        // TODO(segaljared): remove this when we no longer use ControlRefNum
        for (Int32 eventSpecIndex = 0; eventSpecIndex < eventSpecCount; ++eventSpecIndex) {
            ControlRefNum controlRef = (ControlRefNum)eventSpecRef[eventSpecIndex].eventControlRef;
            if (controlRef) {
                StringRef tag = nullptr;
                if (ControlReferenceLookup(controlRef, nullptr, &tag) == kNIError_Success) {
                    STACK_VAR(String, viNameVar);
                    StringRef viName = viNameVar.Value;
                    GetVIName(vi, viName);
                    TempStackCString tagCString(tag->Begin(), tag->Length());
                    EventControlUID controlID = Int32(strtol(tagCString.BeginCStr(), nullptr, 10));
                    if (controlID) {
                        RegisterForControlEvent(eventInfo, eventSpecRef[eventSpecIndex], viName, qID, controlID, controlRef, true);
                    }
                }
            }
        }
        eventInfo->eventStructInfo[eventStructIndex].staticQID = qID;
        eventInfo->eventStructInfo[eventStructIndex].setCount = 0;
    }
    vi->SetEventInfo(eventInfo);
}

void ConfigureEventSpecForJSRef(VirtualInstrument *vi, Int32 eventStructIndex, Int32 eventSpecIndex, JavaScriptStaticRefNum jsReference) {
    TypedObjectRef eventStructSpecsRef = vi->EventSpecs();
    Int32 numEventStructs = eventStructSpecsRef->ElementType()->SubElementCount();
    EventInfo *eventInfo = vi->GetEventInfo();
    if (eventStructIndex < numEventStructs) {
        TypeRef eventSpecType = eventStructSpecsRef->ElementType()->GetSubElement(eventStructIndex);
        AQBlock1 *eventSpecClustPtr = eventStructSpecsRef->RawBegin() + eventSpecType->ElementOffset();
        EventSpecRef eventSpecRef = (EventSpecRef)eventSpecClustPtr;
        Int32 eventSpecCount = eventSpecType->SubElementCount();
        if (eventSpecIndex < eventSpecCount) {
            EventQueueID qID = eventInfo->eventStructInfo[eventStructIndex].staticQID;
            EventControlUID controlID = (EventControlUID)eventSpecRef[eventSpecIndex].eventControlRef;
            if (controlID) {
                STACK_VAR(String, viNameVar);
                StringRef viName = viNameVar.Value;
                GetVIName(vi, viName);

                eventSpecRef[eventSpecIndex].eventControlRef = jsReference;
                RegisterForControlEvent(eventInfo, eventSpecRef[eventSpecIndex], viName, qID, controlID, jsReference, false);
            }
        }
    }
}

void UnregisterForStaticEvents(VirtualInstrument *vi) {
    TypedObjectRef eventStructSpecsRef = vi->EventSpecs();
    Int32 numEventStructs = eventStructSpecsRef->ElementType()->SubElementCount();
    if (numEventStructs > 0) {
        EventInfo *eventInfo = vi->GetEventInfo();
        STACK_VAR(String, viNameVar);
        StringRef viName = viNameVar.Value;
        PercentEncodedSubString encodedStr(vi->VIName(), true, false);
        SubString encodedSubstr = encodedStr.GetSubString();
        viName->AppendSubString(&encodedSubstr);

        for (Int32 eventStructIndex = 0; eventStructIndex < numEventStructs; ++eventStructIndex) {
            TypeRef eventSpecType = eventStructSpecsRef->ElementType()->GetSubElement(eventStructIndex);
            AQBlock1 *eventSpecClustPtr = eventStructSpecsRef->RawBegin() + eventSpecType->ElementOffset();
            EventSpecRef eventSpecRef = (EventSpecRef)eventSpecClustPtr;
            Int32 eventSpecCount = eventSpecType->SubElementCount();
            EventQueueID qID =  eventInfo->eventStructInfo[eventStructIndex].staticQID;
            for (Int32 eventSpecIndex = 0; eventSpecIndex < eventSpecCount; ++eventSpecIndex) {
                RefNum controlRef = eventSpecRef[eventSpecIndex].eventControlRef;
                if (controlRef) {
                    EventInfo::ControlIDInfoMap::iterator ciIter = eventInfo->controlIDInfoMap.find(controlRef);
                    EventOracleIndex eventOracleIdx = kNotAnEventOracleIdx;

                    if (ciIter != eventInfo->controlIDInfoMap.end()) {
                        eventOracleIdx = ciIter->second.eventOracleIndex;
                        EventType eventType = eventSpecRef[eventSpecIndex].eventType;
                        EventSource eSource = eventSpecRef[eventSpecIndex].eventSource;

                        EventOracle::TheEventOracle().UnregisterForEvent(qID, eSource, eventType, eventOracleIdx, controlRef);
                        // gPlatform.IO.Printf("Static Unregister for VI %*s controlID %d, event %d, eventOracleIdx %d\n",
                        //                     viName->Length(), viName->Begin(), controlID, eventType, eventOracleIdx);
#if kVireoOS_emscripten
                        jsUnRegisterForControlEvent(viName, ciIter->second.controlID, eventType, eventOracleIdx);
#endif
                        eventInfo->controlIDInfoMap.erase(ciIter);
                    }
                }
            }
            eventInfo->eventStructInfo[eventStructIndex].staticQID = 0;
            eventInfo->eventStructInfo[eventStructIndex].setCount = 0;
        }
    }
}
//------------------------------------------------------------

// Cleanup Proc for disposing user event refnums when top-level VI finishes
static void CleanUpUserEventRefNum(intptr_t arg) {
    RefNum refnum = RefNum(arg);
    void *userEventRef = nullptr;
    UserEventRefNumManager::RefNumStorage().DisposeRefNum(refnum, &userEventRef);
}

// CreateUserEvent(userEventRef<typed_data> errorIO) -- allocate a new typed User Event refnum
VIREO_FUNCTION_SIGNATURE2(UserEventRef_Create, RefNumVal, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    Int32 errCode = 0;
    void* userEventRef = nullptr;
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
            errPtr->SetErrorAndAppendCallChain(true, errCode, "CreateUserEvent");
    }
    return _NextInstruction();
}

// GenerateUserEvent(userEventRef<typed_data> data errorIO) -- fire event, copying data into event queues of all registered observers
VIREO_FUNCTION_SIGNATURE5(UserEventRef_Generate, TypeCommon, RefNumVal, void, Boolean, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(1);
    void *pSourceData = _ParamPointer(2);
    // Boolean highPro = _ParamPointer(3) ? _Param(3) : false;
    ErrorCluster *errPtr = _ParamPointer(4);
    TypeRef type = refnumPtr ? _ParamPointer(0)->GetSubElement(0) : nullptr;
    void *userEventRef = nullptr;

    // TODO(spathiwa) implement high-priority User Events
    if (!errPtr || !errPtr->status) {
        if (!refnumPtr
            || UserEventRefNumManager::RefNumStorage().GetRefNumData(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success) {
            if (errPtr)
                errPtr->SetErrorAndAppendCallChain(true, kEventArgErr, "GenerateUserEvent");
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
    void *userEventRef = nullptr;

    if (!refnumPtr || UserEventRefNumManager::RefNumStorage().DisposeRefNum(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success) {
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, kEventArgErr, "DestroyUserEvent");
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
    _ParamDef(TypeCommon, regType);
    _ParamDef(RefNumVal, regRef);
    _ParamDef(ErrorCluster, errorClust);
    _ParamImmediateDef(RegistertForEventArgs, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

// UnregisterForEventsAux -- helper function to unregister for dynamic events, called from prim and cleanup proc
static bool UnregisterForEventsAux(RefNum refnum) {
    DynamicEventRegInfo *regInfo = nullptr;
    if (EventRegistrationRefNumManager::RefNumStorage().DisposeRefNum(refnum, &regInfo) != kNIError_Success || !regInfo)
        return false;
    EventQueueID qID = regInfo->_qID;
    EventOracle::TheEventOracle().DeleteEventQueue(qID);
    std::vector<DynamicEventRegEntry>::iterator regInfoEntryIter = regInfo->_entry.begin(), regInfoEntryIterEnd = regInfo->_entry.end();
    while (regInfoEntryIter != regInfoEntryIterEnd) {
        EventOracle::TheEventOracle().UnregisterForEvent(qID, regInfoEntryIter->eventSource, regInfoEntryIter->eventType,
                                                         kAppEventOracleIdx, regInfoEntryIter->refnumEntry.GetRefNum());
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

// Return an error message for a particular RegisterForEvents input
static inline InstructionCore *ReturnRegForEventsFatalError(const char *errorMessage, Int32 refInput) {
    THREAD_EXEC()->LogEvent(EventLog::kHardDataError, errorMessage, refInput);
    return THREAD_EXEC()->Stop();
}

// Recursive helper function to handle event registration (or re-registration) of polymorphic inputs (clusters/arrays of refnums)
LVError RegisterForEventsCore(EventQueueID qID, DynamicEventRegInfo *regInfo, Int32 refInput, TypeRef refType, EventSource eSource,
                              EventType eventType, void *pData, void *pOldData) {
    LVError err = kLVError_NoError;
    RefNumVal *refData = static_cast<RefNumVal*>(pData);
    if (refType->IsRefnum()) {  // scalar refnum
        if (pOldData) {  // re-registration
            DynamicEventRegEntry &regEntry =  regInfo->_entry[refInput];
            if (refData && regEntry.refnumEntry.GetRefNum() == refData->GetRefNum())
                return err;  // refnum is same as last time, no reason to unreg and rereg.
            EventOracle::TheEventOracle().UnregisterForEvent(
                qID, eSource, eventType, kAppEventOracleIdx, static_cast<RefNumVal*>(pOldData)->GetRefNum());
            regEntry.refnumEntry.SetRefNum(refData ? refData->GetRefNum() : kNotARefNum);
        }
        if (refData && refData->GetRefNum())
            EventOracle::TheEventOracle().RegisterForEvent(qID, eSource, eventType, 0, refData->GetRefNum());
    } else if (refType->IsArray() && refType->Rank() == 1 && refType->GetSubElement(0)->IsRefnum()) {
        // Array of scalar refnums
        TypedArray1D<RefNumVal> *refArrayPtr = pData ? *(TypedArray1D<RefNumVal>**)pData : nullptr;
        if (pOldData) {  // re-registration
            TypedArray1D<RefNumVal> *oldRefArrayPtr = (TypedArray1D<RefNumVal>*)pOldData;
            RefNumVal *aOldRefPtr = oldRefArrayPtr->BeginAt(0);
            for (Int32 j = 0; j < oldRefArrayPtr->Length(); ++j) {
                EventOracle::TheEventOracle().UnregisterForEvent(qID, eSource, eventType, kAppEventOracleIdx, aOldRefPtr->GetRefNum());
                ++aOldRefPtr;
            }
            DynamicEventRegEntry &regEntry =  regInfo->_entry[refInput];
            regEntry.refDataEntry = refArrayPtr;
        }
        if (refArrayPtr) {
            RefNumVal *aRefPtr = refArrayPtr->BeginAt(0);
            for (Int32 j = 0; j < refArrayPtr->Length(); ++j) {
                EventOracle::TheEventOracle().RegisterForEvent(qID, eSource, eventType, 0, aRefPtr->GetRefNum());
                ++aRefPtr;
            }
        }
    } else if (refType->IsCluster()) {
        // Cluster of ... (recursive, can be scalar ref, array of scalar ref, or another cluster).
        AQBlock1 *refClustPtr = static_cast<AQBlock1*>(pData);
        AQBlock1 *eltPtr = refClustPtr, *oldEltPtr = static_cast<AQBlock1*>(pOldData);
        Int32 numElts = refType->SubElementCount();
        for (Int32 j = 0; j < numElts; ++j) {
            TypeRef eltType = refType->GetSubElement(j);
            eltPtr = refClustPtr + eltType->ElementOffset();
            if (pOldData)
                oldEltPtr = static_cast<AQBlock1*>(pOldData) + eltType->ElementOffset();
            // Recurse to handle subelements
            if ((err = RegisterForEventsCore(qID, regInfo, refInput, eltType, eSource, eventType, eltPtr, oldEltPtr)))
                break;
        }
    } else {
        return kLVError_ArgError;
    }
    return err;
}
VIREO_FUNCTION_SIGNATUREV(RegisterForEvents, RegisterForEventsParamBlock)
{
    RefNumVal* eventRegRefnumPtr = _ParamPointer(regRef);
    DynamicEventRegInfo *regInfo = nullptr;

    const Int32 numberOfFixedArgs = 3;  // eventRegRef (type,data), errorIO
    const Int32 numArgsPerTuple = 3;    // <eventType, user/control ref (STAD)> pairs
    Int32 numVarArgs = (_ParamVarArgCount() - numberOfFixedArgs);
    Int32 numTuples = numVarArgs / numArgsPerTuple;
    ErrorCluster *errPtr = _ParamPointer(errorClust);

    if (errPtr && errPtr->status)
        return _NextInstruction();

    if (_ParamPointer(regType)->SubElementCount() != 1 || !_ParamPointer(regType)->GetSubElement(0)->IsCluster()) {
        return ReturnRegForEventsFatalError("RegisterForEvents: malformed ref ref type, doesn't contain cluster", 0);
    }
    Int32 regCount = _ParamPointer(regType)->GetSubElement(0)->SubElementCount();
    if (numVarArgs % numArgsPerTuple != 0 || regCount != numTuples) {
        return ReturnRegForEventsFatalError("RegisterForEvents: Wrong number of arguments.  Should be one <event code, ref> input pair"
                                " per item in the event reg refnum output type", 0);
    }
    RefNum erRefNum = eventRegRefnumPtr->GetRefNum();
    if (erRefNum && EventRegistrationRefNumManager::RefNumStorage().GetRefNumData(erRefNum, &regInfo) != kNIError_Success) {
        // event reg. ref passed, but invalid
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, kEventArgErr, "RegisterForEvents");
    }

    // Allocate a new Event Queue and associate it with the event reg. refnum
    EventQueueID qID = kNotAQueueID;
    bool isRereg = false;
    if (regInfo) {
        if (regInfo->_entry.size() != regCount) {
            return ReturnRegForEventsFatalError("RegisterForEvents: re-registration number of params doesn't match original registration (%d)",
                                           Int32(regInfo->_entry.size()));
        }
        isRereg = true;
        qID = regInfo->_qID;
    } else {
        EventOracle::TheEventOracle().GetNewQueueObject(&qID, nullptr);
        regInfo = new DynamicEventRegInfo(qID, regCount);
        erRefNum = EventRegistrationRefNumManager::RefNumStorage().NewRefNum(&regInfo);
        eventRegRefnumPtr->SetRefNum(erRefNum);
    }
    // Set cleanup proc to unregister if VI doesn't do it explicitly
    VirtualInstrument* vi = THREAD_CLUMP()->TopVI();
    EventRegistrationRefNumManager::AddCleanupProc(vi, CleanUpEventRegRefNum, erRefNum);

    // Loop through input types and register for events
    TypeRef regRefClusterType = _ParamPointer(regType)->GetSubElement(0);
    RegistertForEventArgs *arguments =  _ParamImmediate(argument1);
    for (Int32 refInput = 0; refInput < numTuples; ++refInput) {
        if (!arguments[refInput].ref._pData) {  // wildcard argument, for re-registration, skip argument and leave previous registration
            if (isRereg)
                continue;
            return ReturnRegForEventsFatalError("RegisterForEvents: wildcard only allowed for re-registration (element %d)", refInput);
        }
        EventType eventType = arguments[refInput].eventType ? *arguments[refInput].eventType : kEventTypeNull;
        if (eventType == kEventTypeNull) {
            if (isRereg) {
                eventType = regInfo->_entry[refInput].eventType;
            } else {
                return ReturnRegForEventsFatalError("RegisterForEvents: event type required (element %d)", refInput);
            }
        } else if (isRereg && eventType != regInfo->_entry[refInput].eventType) {
            return ReturnRegForEventsFatalError("RegisterForEvents: event type doesn't match orig registration (element %d)", refInput);
        }
        EventSource eSource = GetEventSourceForEventType(eventType);
        TypeRef refType = arguments[refInput].ref._paramType;
        TypeRef regType = regRefClusterType->GetSubElement(refInput);
        if (!regType->IsCluster() || regType->SubElementCount() != 2 || regType->GetSubElement(0)->BitEncoding() != kEncoding_S2CInt) {
            return ReturnRegForEventsFatalError("RegisterForEvents: Malformed event reg ref type (element %d)", refInput);
        }
        TypeRef regRefType = regType->GetSubElement(1);
        void *pData = arguments[refInput].ref._pData;
        if (!refType->CompareType(regRefType)) {
            if (regRefType->BitEncoding() == kEncoding_RefNum && refType->BitEncoding() == kEncoding_S2CInt && refType->TopAQSize() == sizeof(Int32)) {
                if (*(static_cast<Int32*>(pData)) == kNotARefNum) {  // special case: constant 0 allowed, treated as not-a-refnum
                    // TODO(spathiwa) - figure out what DFIR does/should generate for the generic not-a-refnum constant.
                    // Should there be a special refnum type for this in Vireo?  For now, allow '0' in via.
                    pData = nullptr;
                }
            } else {
                return ReturnRegForEventsFatalError("RegisterForEvents: Input %d type doesn't match event reg ref element type", refInput);
            }
        }
        void *oldRef = isRereg ? &regInfo->_entry[refInput].refnumEntry : nullptr;
        void *pDataCopy = pData;
        if (!isRereg) {
            if (regRefType->IsRefnum()) {
                regInfo->_entry.push_back(DynamicEventRegEntry(eSource, eventType, *(static_cast<RefNumVal*>(pData))));
            } else {  // clusters and arrays make a deep copy of the data in case it changes
                Int32 topSize = regRefType->TopAQSize();
                pDataCopy = THREAD_TADM()->Malloc(topSize);
                regRefType->InitData(pDataCopy, (TypeRef)nullptr);
                regRefType->CopyData(pData, pDataCopy);
                regInfo->_entry.push_back(DynamicEventRegEntry(eSource, eventType, pDataCopy, regRefType));
            }
        }
        LVError err = RegisterForEventsCore(qID, regInfo, refInput, regRefType, eSource, eventType,
                                            pDataCopy, isRereg ? oldRef : nullptr);
        if (err) {
            if (!isRereg && !regRefType->IsRefnum()) {
                regRefType->ClearData(pDataCopy);
            }
            return ReturnRegForEventsFatalError("RegisterForEvents: Input %d type not supported", refInput);
        }
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(UnregisterForEvents, RefNumVal, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    ErrorCluster *errPtr = _ParamPointer(1);
    if (!refnumPtr || !UnregisterForEventsAux(refnumPtr->GetRefNum())) {
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, kEventArgErr, "UnregisterForEvents");
    }
    return _NextInstruction();
}

//------------------------------------------------------------
struct WaitForEventArgs {
    IntIndex *eventSpecIndex;
    StaticTypeAndData data;
    InstructionCore *branchTarget;
};

struct WaitForEventsParamBlock : public VarArgInstruction
{
    _ParamDef(Int32, timeOut);
    _ParamImmediateDef(StaticTypeAndData, regRefArg[1]);
    _ParamDef(Int32, eventStructIndex);
    _ParamImmediateDef(WaitForEventArgs, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

static inline bool EventMatch(const EventData &eData, const EventSpec &eSpec, Int32 dynIndex = 0) {
    return (eData.common.eventSource == eSpec.eventSource && eData.common.eventType == eSpec.eventType
            && (!eSpec.eventControlRef || eData.common.eventRef.GetRefNum() == eSpec.eventControlRef)
            && dynIndex == eSpec.dynIndex);
}

inline Boolean IsEventRegRefnum(TypeRef regRefType) {
    return regRefType->BitEncoding() == kEncoding_RefNum && regRefType->Name().ComparePrefixCStr("EventRegRefNum");
}

VIREO_FUNCTION_SIGNATUREV(WaitForEventsAndDispatch, WaitForEventsParamBlock)
{
    Int32 *timeOutPtr = _ParamPointer(timeOut);
    StaticTypeAndData *regRefArg = _ParamImmediate(regRefArg);
    TypeRef regRefType = regRefArg[0]._paramType;
    Int32 regRefCount = 1;
    if (regRefType->BitEncoding() == kEncoding_Cluster) {
        regRefCount = regRefType->SubElementCount();
    } else if (!IsEventRegRefnum(regRefType)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Invalid Event Struct event registration ref type");
        return THREAD_EXEC()->Stop();
    }
    RefNumVal* eventRegRefnumPtr = static_cast<RefNumVal*>(regRefArg[0]._pData);

    Int32 eventStructIndex = _Param(eventStructIndex);
    const Int32 numberOfFixedArgs = 4;
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

    EventInfo *eventInfo = owningVI->GetEventInfo();
    EventQueueID eventQID = eventInfo->eventStructInfo[eventStructIndex].staticQID;
    OccurrenceCore &occ = eventInfo->eventStructInfo[eventStructIndex].eventOccurrence;

    if (eventQID)
        EventOracle::TheEventOracle().ObserveQueue(eventQID, &occ);
    for (Int32 regIndex = 0; regIndex < regRefCount; ++regIndex) {
        DynamicEventRegInfo *regInfo = nullptr;
        if (eventRegRefnumPtr
            && EventRegistrationRefNumManager::RefNumStorage().GetRefNumData(eventRegRefnumPtr[regIndex].GetRefNum(), &regInfo) == kNIError_Success) {
            EventOracle::TheEventOracle().ObserveQueue(regInfo->_qID, &occ);
        }
    }

    TypeRef eventSpecType = eventStructSpecsRef->ElementType()->GetSubElement(eventStructIndex);
    UInt32 esCount = UInt32(eventSpecType->SubElementCount());
    AQBlock1 *eventSpecClustPtr = eventStructSpecsRef->RawBegin() + eventSpecType->ElementOffset();
    EventSpecRef eventSpecRef = (EventSpecRef)eventSpecClustPtr;
    {
        Int32 &staticCount = eventInfo->eventStructInfo[eventStructIndex].setCount;

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

    // If regRefCount > 0 (cluster of reg refnums passed), find queue with earliest event timestamp
    Int32 dynIndex = 0;
    Int32 regRefIndex = EventOracle::TheEventOracle().GetPendingEventInfo(&eventQID, regRefCount, eventRegRefnumPtr, &dynIndex);
    DynamicEventRegInfo *regInfo = nullptr;
    if (regRefIndex > 0 && eventRegRefnumPtr
        && EventRegistrationRefNumManager::RefNumStorage().GetRefNumData(eventRegRefnumPtr[regRefIndex-1].GetRefNum(), &regInfo) == kNIError_Success) {
        eventQID = regInfo->_qID;
    }

    // TODO(spathiwa) -- handle/test for spurious timeout (real event and timeout happen at same time,
    //                   should go back to sleep w/o running timeout case)
    const EventData &eventData = EventOracle::TheEventOracle().GetEventData(eventQID);

    if (regInfo) {
        TypeRef eventRegRefType = regRefArg[0]._paramType;
        if (eventRegRefType->IsCluster())
            eventRegRefType = eventRegRefType->GetSubElement(regRefIndex-1);
        dynIndex += regInfo->DynamicEventMatch(eventData.common, eventRegRefType->GetSubElement(0));
    }
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
            Int32 commonDataSize = sizeof(EventCommonData);
            Int32 dataNodeSize = esEventDataNodeType->TopAQSize();
            UInt32 eventIndex = 0;
            for (Int32 prevTuple = 0; prevTuple < inputTuple; ++prevTuple) {
                // count other input tuples with same branch target to find eventIndex
                if (arguments[prevTuple].branchTarget == esBranchTarget)
                    ++eventIndex;
            }
            if (dataNodeSize >= commonDataSize) {
                memcpy(esEventDataNode, &eventData, commonDataSize);
                *EventIndexFieldPtr(esEventDataNode) = eventIndex;
                if (eventData.eventDataType) {
                    const UInt32 numCommonElements = EventCommonData::GetNumberOfCommonElements();
                    const UInt32 numDestElements = esEventDataNodeType->SubElementCount();
                    const UInt32 numSourceElements = eventData.eventDataType->SubElementCount();
                    UInt32 destElementIndex = numCommonElements, sourceElementIndex = 0;
                    if (numDestElements == numCommonElements + 1
                        && esEventDataNodeType->GetSubElement(destElementIndex)->IsA(eventData.eventDataType)) {
                        // Special case, all non-commmon data is encapsulated in a single cluster, for example, when
                        // User Event use the same cluster type which defined the user event to be to fire it and
                        // as a data element after the common portion (without inlining its fields).
                        TypeRef destElemType = esEventDataNodeType->GetSubElement(destElementIndex);
                        eventData.eventDataType->CopyData(static_cast<AQBlock1*>(eventData.pEventData),
                                                          static_cast<AQBlock1*>(esEventDataNode) + destElemType->ElementOffset());
                    } else {
                        // Loop through all elements in the destination event data cluster, and look for the matching
                        // source element in the fired event data.  We need to copy one element at a time because the
                        // alignment of the source and dest might not be the same because of the presence of leading
                        // common fields, and also to handle shared event cases which only expose event data common
                        // to all sources.
                        // Note, although this looks like an O(N^2) nested loop, it's actually O(N+M), the sum of
                        // the number of fields in the source (fired event data) and dest (cluster).
                        while (destElementIndex < numDestElements) {
                            // (TODO(spathiwa) We could use a custom emit proc to verify types and generate
                            // custom snippets for each event data node cluster so it doesn't have to check at run-time.)
                            TypeRef destElemType = esEventDataNodeType->GetSubElement(destElementIndex);
                            IntIndex destOffset = destElemType->ElementOffset();
                            while (sourceElementIndex < numSourceElements) {
                                // Find the event source element with the same type and name. If a source element doesn't
                                // match the current dest name, it was elided so skip it.
                                TypeRef sourceElemType = eventData.eventDataType->GetSubElement(sourceElementIndex++);
                                const SubString sourceElemName = sourceElemType->ElementName();
                                if (destElemType->IsA(sourceElemType) && destElemType->ElementName().Compare(&sourceElemName)) {
                                    // Both type and element name must match.  On match, copy the element and move to next dest.
                                    destElemType->CopyData(static_cast<AQBlock1*>(eventData.pEventData) + sourceElemType->ElementOffset(),
                                                           static_cast<AQBlock1*>(esEventDataNode) + destOffset);
                                    break;
                                }
                            }
                            ++destElementIndex;
                        }
                    }
                }
            } else {  // Timeout case eventData node has no ref, so falls through this case.
                memcpy(esEventDataNode, &eventData, dataNodeSize);
                if (dataNodeSize > sizeof(UInt32)*4)
                    *EventIndexFieldPtr(esEventDataNode) = eventIndex;
            }
            next = esBranchTarget;
            break;
        }
    }
    EventOracle::TheEventOracle().DoneProcessingEvent(eventQID);

    return next;
}

void OccurEvent(UInt32 eventOracleIndex, UInt32 controlID, UInt32 eventType, UInt32 ref, TypeRef eventDataType, void *eventData)
{
    EventSource eventSource = GetEventSourceForEventType(eventType);
    EventData eData;
    eData.Init(eventSource, eventType, RefNumVal(ref), eventDataType, eventData);
    eData.controlUID = controlID;
    EventOracle::TheEventOracle().OccurEvent(eventOracleIndex, eData);
}

VIREO_EXPORT void OccurEvent(TypeManagerRef tm, UInt32 eventOracleIndex, UInt32 controlID, UInt32 eventType, TypeRef eventDataType, void *eventData)
{
    TypeManagerScope scope(tm);
    RefNum ref = kNotARefNum;
    EventControlUID eventIndexControlID = 0;
    if (eventOracleIndex > kAppEventOracleIdx) {
        EventOracle::TheEventOracle().GetControlInfoForEventOracleIndex(eventOracleIndex, &eventIndexControlID, &ref);
        if (controlID == eventIndexControlID)
            OccurEvent(eventOracleIndex, controlID, eventType, ref, eventDataType, eventData);
        else
            THREAD_EXEC()->LogEvent(EventLog::kSoftDataError, "OccurEvent: eventOracleIndex %d does not match controlID %d, expected %d",
                                    eventOracleIndex, controlID, eventIndexControlID);
    } else {
        THREAD_EXEC()->LogEvent(EventLog::kSoftDataError, "OccurEvent: eventOracleIndex invalid");
    }
}

VIREO_FUNCTION_SIGNATURE3(_OccurEvent, RefNumVal, UInt32, UInt32)
{
    RefNumVal controlRefVal = _Param(0);
    UInt32 eventSource = _Param(1);
    UInt32 eventType = _Param(2);
    VirtualInstrument *owningVI = THREAD_CLUMP()->OwningVI();
    EventInfo *eventInfo = owningVI->GetEventInfo();
    EventOracleIndex eventOracleIdx = kNotAnEventOracleIdx;
    EventControlUID controlID = 0;
    RefNum ref = controlRefVal.GetRefNum();
    if (eventInfo) {
        EventControlInfo *ecInfo = &eventInfo->controlIDInfoMap[ref];
        eventOracleIdx = ecInfo->eventOracleIndex;
        controlID = ecInfo->controlID;
    }

    if (eventSource != GetEventSourceForEventType(eventType)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Event source doesn't match event type");
        return THREAD_EXEC()->Stop();
    }
    OccurEvent(eventOracleIdx, controlID, eventType, ref, nullptr, nullptr);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(ConfigureEventSpecJSRef, Int32, Int32, JavaScriptStaticRefNum)
{
    Int32 eventStructIndex = _Param(0);
    Int32 eventSpecIndex = _Param(1);
    JavaScriptStaticRefNum jsRefNum = _Param(2);
    if (jsRefNum == 0) {
        THREAD_EXEC()->LogEvent(EventLog::kSoftDataError, "JavaScriptStaticRefNum must not be null");
        return THREAD_EXEC()->Stop();
    }
    VirtualInstrument *owningVI = THREAD_CLUMP()->OwningVI();
    ConfigureEventSpecForJSRef(owningVI, eventStructIndex, eventSpecIndex, jsRefNum);

    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(RegisterForJSEvent, JavaScriptStaticRefNum, UInt32)
{
    JavaScriptStaticRefNum jsRefNum = _Param(0);
    if (jsRefNum == 0) {
        THREAD_EXEC()->LogEvent(EventLog::kSoftDataError, "JavaScriptStaticRefNum must not be null");
        return THREAD_EXEC()->Stop();
    }
#if kVireoOS_emscripten
    UInt32 eventType = _Param(1);
    VirtualInstrument *owningVI = THREAD_CLUMP()->OwningVI();
    STACK_VAR(String, viNameVar);
    StringRef viName = viNameVar.Value;
    GetVIName(owningVI, viName);
    EventInfo *eventInfo = owningVI->GetEventInfo();
    EventOracleIndex eventOracleIdx = kNotAnEventOracleIdx;
    EventControlUID controlID = 0;
    if (eventInfo) {
        EventControlInfo *ecInfo = &eventInfo->controlIDInfoMap[jsRefNum];
        eventOracleIdx = ecInfo->eventOracleIndex;
        controlID = ecInfo->controlID;

        jsRegisterForControlEvent(viName, controlID, eventType, eventOracleIdx);
    }
#endif

    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsNotAUserEventRefnum, RefNumVal, Boolean)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    void *userEventRef = nullptr;
    if (!refnumPtr || UserEventRefNumManager::RefNumStorage().GetRefNumData(refnumPtr->GetRefNum(), &userEventRef) != kNIError_Success)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsNotAnEventRegRefnum, RefNumVal, Boolean)
{
    RefNumVal* eventRegRefnumPtr = _ParamPointer(0);
    DynamicEventRegInfo *regInfo = nullptr;
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
    DEFINE_VIREO_REQUIRE(ControlRefs)

    // EventSpec used for event structure configuration
    DEFINE_VIREO_TYPE(EventSpec, "c(e(UInt32 eventSource) e(UInt32 eventType) e(UInt32 controlUID) e(UInt32 dynIndex)");

    // User Events
    DEFINE_VIREO_TYPE(UserEventRefNum, "refnum($0)")
    DEFINE_VIREO_FUNCTION_CUSTOM(CreateUserEvent, UserEventRef_Create, "p(o(UserEventRefNum ue) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GenerateUserEvent, UserEventRef_Generate, "p(i(StaticTypeExplicitData) i(UserEventRefNum ue) "
                                 "i(* element) i(Boolean highprio) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(DestroyUserEvent, UserEventRef_Destroy, "p(i(UserEventRefNum ue) io(ErrorCluster err))")

    // Event registration
    DEFINE_VIREO_TYPE(EventRegRefNum, "refnum($0)")
    DEFINE_VIREO_FUNCTION(RegisterForEvents, "p(i(VarArgCount) i(StaticTypeExplicitData) io(EventRegRefNum ref) io(ErrorCluster err)"
                          "i(VarArgRepeat) i(Int32 eventType)i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(UnregisterForEvents, "p(i(EventRegRefNum ref) io(ErrorCluster err))")

    DEFINE_VIREO_FUNCTION(WaitForEventsAndDispatch, "p(i(VarArgCount) i(Int32 timeOut) i(StaticTypeAndData ref) i(Int32 esIndex) "
                          "i(VarArgRepeat) i(Int32 specIndex)i(StaticTypeAndData)i(BranchTarget))")

    // TODO(segaljared): remove this when we no longer use ControlRefNum
    DEFINE_VIREO_FUNCTION(_OccurEvent, "p(i(ControlRefNum controlRef) i(UInt32 eSource) i(UInt32 eType))")
    DEFINE_VIREO_FUNCTION(_OccurEvent, "p(i(JavaScriptStaticRefNum controlRef) i(UInt32 eSource) i(UInt32 eType))")
    DEFINE_VIREO_FUNCTION(ConfigureEventSpecJSRef, "p(i(Int32 eStructIndex) i(Int32 eSpecIndex) i(JavaScriptStaticRefNum jsReference))")
    DEFINE_VIREO_FUNCTION(RegisterForJSEvent, "p(i(JavaScriptStaticRefNum jsReference) i(UInt32 eType))")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAUserEventRefnum, "p(i(UserEventRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(UserEventRefNum) i(UserEventRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(UserEventRefNum) i(UserEventRefNum) o(Boolean))")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAnEventRegRefnum, "p(i(EventRegRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(EventRegRefNum) i(EventRegRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(EventRegRefNum) i(EventRegRefNum) o(Boolean))")

DEFINE_VIREO_END()

}  // namespace Vireo
