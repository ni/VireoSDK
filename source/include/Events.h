/**
 
 Copyright (c) 2018 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

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
    kEventSourceUserEvent = 25 };

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
    // UInt32 eventIndex  -- computed by event structure, not included in actual event data
    RefNumVal eventRef;

    void InitEventTime() { eventTime = UInt32(gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount())); }
    EventCommonData(UInt32 source, UInt32 type) : eventSource(source), eventType(type) {
        InitEventTime();
    }
    EventCommonData(UInt32 source, UInt32 type, const RefNumVal &ref) : eventSource(source), eventType(type), eventRef(ref) {
        InitEventTime();
    }
};

struct EventData {
    EventCommonData common;

    EventControlUID controlUID;
    // Varies by event type, out-of-line
    TypeRef eventDataType;
    void *pEventData;

    EventData() : common(0, 0, RefNumVal()), controlUID(kNotAnEventControlUID), eventDataType(NULL), pEventData(NULL) { }
    EventData(EventSource source, EventType type, const RefNumVal &ref, TypeRef edtype = NULL, void *pData = NULL) :
        common(source, type, ref), controlUID(kNotAnEventControlUID), eventDataType(edtype), pEventData(pData) { }
    EventData(EventSource source, EventType type, EventControlUID uid, TypeRef edtype = NULL, void *pData = NULL) :
    common(source, type), controlUID(0), eventDataType(edtype), pEventData(pData) { }
    EventData &Init(EventSource source, EventType type, const RefNumVal &ref, TypeRef edtype = NULL, void *pData = NULL) {
        common.eventSource = source;
        common.eventType = type;
        common.InitEventTime();
        common.eventRef = ref;
        controlUID = kNotAnEventControlUID;
        eventDataType = edtype;
        pEventData = pData;
        return *this;
    }
};

void RegisterForStaticEvents(VirtualInstrument *vi);

enum { kEventArgErr = 1 };

}  // namespace Vireo

#endif  // Events_h
