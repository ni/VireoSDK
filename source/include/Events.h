// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief Native Vireo event registration and handling
  */

#ifndef Events_h
#define Events_h

#include "TypeAndDataManager.h"

namespace Vireo
{

enum {  // Event source
    kEventSourceLVUserInt,
    kEventSourceActiveXUserInt,
    kEventSourceDotNetUserInt,
    kEventSourceUserEvent = 25,
    kEventSourceNXGUIEvent = 1000
};

enum {
    kEventTypeNull = 0,
    kEventTypeTimeout = 1,
    kEventTypeValueChange = 2,
    kEventTypePanelClose_ =  3,
    kEventTypeAppClose_ = 4,
    kEventTypeMenuSelectedUser = 5,
    kEventTypeMenuSelectedApp_ = 6,
    kEventTypeMouseDown_ = 7,
    kEventTypeMouseUp = 8,
    kEventTypeMouseMove = 9,
    kEventTypeKeyDown_ = 10,
    kEventTypeKeyRepeat_ = 11,
    kEventTypeKeyUp = 12,
    kEventTypeListBoxDblClk = 13,
    kEventTypeMouseLeave = 14,
    kEventTypeMouseEnter = 15,
    kEventTypeTreeItemOpen_ = 16,
    kEventTypeTreeItemClose_ = 17,
    kEventTypeMouseDown = 18,
    kEventTypePanelResize = 19,
    kEventTypeTreeDrop_ = 20,
    kEventTypeTreeDrag_ = 21,
    kEventTypeTreeDblClk = 22,
    kEventTypeKeyDown = 23,
    kEventTypeKeyRepeat =  24,
    kEventTypePanelClose = 25,
    kEventTypeAppClose = 26,
    kEventTypeMenuSelectedApp =  27,
    // ...
    kEventTypeUserEvent = 1000
};

typedef UInt32 EventSource;
typedef UInt32 EventType;

typedef UInt32 EventControlUID;  // TBD
enum { kNotAnEventControlUID = 0 };

struct EventCommonData {
    // Common fields
    EventSource eventSource;  // Event source and type are used internally but not visible in Event structure in NXG
    EventType eventType;
    UInt32 eventTime;
    UInt32 eventSeqIndex;  // This field is a monotonically increasing event sequence number in actual generated events,
                           // but a placeholder for the computed eventIndex event data node field on the diagram (computed by WaitForEvent per event case)
    RefNumVal eventRef;
    static UInt32 GetNumberOfCommonElements() { return 5; }  // change if fields are added above

    void InitEventTime() { eventTime = UInt32(gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount())); }
    EventCommonData(UInt32 source, UInt32 type) : eventSource(source), eventType(type), eventSeqIndex(0) {
        InitEventTime();
    }
    EventCommonData(UInt32 source, UInt32 type, const RefNumVal &ref) : eventSource(source), eventType(type), eventSeqIndex(0), eventRef(ref) {
        InitEventTime();
    }
};

// Compare two event time stamps or sequence numbers, allowing for wrapping
inline Int32 EventTimeSeqCompare(UInt32 t1, UInt32 t2) {
    return Int32(t1 - t2);
}

inline UInt32 *EventIndexFieldPtr(void *rawEventDataPtr) {
    EventCommonData *eventDataPtr = (EventCommonData*)rawEventDataPtr;
    return &eventDataPtr->eventSeqIndex;
}

struct EventData {
    EventCommonData common;

    EventControlUID controlUID;
    // Varies by event type, out-of-line
    TypeRef eventDataType;
    void *pEventData;

    EventData() : common(0, 0, RefNumVal()), controlUID(kNotAnEventControlUID), eventDataType(nullptr), pEventData(nullptr) { }
    EventData(EventSource source, EventType type, const RefNumVal &ref, TypeRef edtype = nullptr, void *pData = nullptr) :
        common(source, type, ref), controlUID(kNotAnEventControlUID), eventDataType(edtype), pEventData(pData) { }
    EventData(EventSource source, EventType type, EventControlUID uid, TypeRef edtype = nullptr, void *pData = nullptr) :
        common(source, type), controlUID(0), eventDataType(edtype), pEventData(pData) { }
    EventData &Init(EventSource source, EventType type, const RefNumVal &ref, TypeRef edtype = nullptr, void *pData = nullptr) {
        common.eventSource = source;
        common.eventType = type;
        common.eventSeqIndex = 0;
        common.InitEventTime();
        common.eventRef = ref;
        controlUID = kNotAnEventControlUID;
        eventDataType = edtype;
        pEventData = pData;
        return *this;
    }
    void Destroy() const {
        if (eventDataType && pEventData) {
            eventDataType->ClearData(pEventData);
            THREAD_TADM()->Free(pEventData);
        }
    }
    static UInt32 GetNextEventSequenceNumber() { return ++_s_eventSequenceNumber; }
    static UInt32 _s_eventSequenceNumber;
};

class VirtualInstrument;
void RegisterForStaticEvents(VirtualInstrument *vi);
void UnregisterForStaticEvents(VirtualInstrument *vi);

typedef Int32 EventQueueID;
enum { kNotAQueueID = 0 };

typedef IntIndex EventOracleIndex;
enum { kNotAnEventOracleIdx = -1, kAppEventOracleIdx = 0 };

enum { kEventArgErr = 1 };

}  // namespace Vireo

#endif  // Events_h
