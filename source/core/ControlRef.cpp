
/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief Control reference management
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "RefNum.h"
#include "ControlRef.h"

namespace Vireo {

// ControlRefInfo -- Storage for static control references.
struct ControlRefInfo {
    VirtualInstrument *vi;  // VI containing control
    SubString controlTag;  // Unique identifying tag (data item name) for control

    ControlRefInfo() : vi(NULL), controlTag() { }
    ControlRefInfo(VirtualInstrument *aVi, SubString aControlTag) : vi(aVi), controlTag(aControlTag) { }
};

// ControlRefNumManager -- Allocation, deallocation, and lookup of control references
class ControlRefNumManager : public RefNumManager {
 private:
    typedef TypedRefNum<ControlRefInfo, true> ControlRefNumType;
    ControlRefNumType _refStorage;  // manages refnum storage

    static ControlRefNumManager _s_singleton;
 public:
    static ControlRefNumManager &ControlRefManager() { return _s_singleton; }
    static ControlRefNumType &RefNumStorage() { return _s_singleton.RefNumManager(); }

    ControlRefNumType &RefNumManager() { return _refStorage; }
};

ControlRefNumManager ControlRefNumManager::_s_singleton;

// ControlReferenceDestroy -- deallocate control ref
// (The VI and string tag are weak references into the owning VI, so do not have to be deallocated.)
NIError ControlReferenceDestroy(ControlRefNum refnum) {
    return ControlRefNumManager::RefNumStorage().DisposeRefNum(refnum, NULL);
}

// Clean-up Proc, run when top level VI finishes, disposing control reference.
static void CleanUpControlReference(intptr_t arg) {
    ControlRefNum refnum = ControlRefNum(arg);
    ControlReferenceDestroy(refnum);
}

// ControlReferenceCreate -- create a control ref linked to control associated with controlTag on given VI.
ControlRefNum ControlReferenceCreate(VirtualInstrument *vi, const SubString &controlTag) {
    ControlRefInfo controlRefInfo(vi, controlTag);
    ControlRefNum refnum = ControlRefNumManager::RefNumStorage().NewRefNum(&controlRefInfo);

    ControlRefNumManager::AddCleanupProc(null, CleanUpControlReference, refnum);
    return refnum;
}

// ControlReferenceCreate -- RefNumVal version
ControlRefNum ControlReferenceCreate(RefNumVal *pRefNumVal, VirtualInstrument *vi, const SubString &controlTag) {
    ControlRefNum refnum = ControlReferenceCreate(vi, controlTag);
    pRefNumVal->SetRefNum(refnum);
    return refnum;
}

NIError ControlReferenceLookup(ControlRefNum refnum, VirtualInstrument **pVI, SubString *pControlTag) {
    ControlRefInfo controlRefInfo;
    NIError err = ControlRefNumManager::RefNumStorage().GetRefNumData(refnum, &controlRefInfo);
    if (err == kNIError_Success) {
        *pVI = controlRefInfo.vi;
        *pControlTag = controlRefInfo.controlTag;
    } else {
        *pVI = NULL;
        *pControlTag = SubString();
    }
    return err;
}

// ControlReferenceAppendDescription -- output the VI and control a refnum is linked to (for test validation)
NIError ControlReferenceAppendDescription(StringRef str, ControlRefNum refnum) {
    ControlRefInfo controlRefInfo;
    NIError err = ControlRefNumManager::RefNumStorage().GetRefNumData(refnum, &controlRefInfo);
    if (err == kNIError_Success) {
        SubString viName;
        if (controlRefInfo.vi)
            viName = controlRefInfo.vi->VIName();
        str->Append('<');
        str->AppendSubString(&viName);
        str->Append(',');
        str->AppendSubString(&controlRefInfo.controlTag);
        str->Append('>');
    }
    return err;
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(ControlRefs)
    DEFINE_VIREO_REQUIRE(VirtualInstrument)

    DEFINE_VIREO_TYPE(ControlRefNumInfo, "c(e(VirtualInstrument vi) e(String controlTag))")
    DEFINE_VIREO_TYPE(ControlRefNum, "refnum(ControlRefNumInfo)")
    // TODO(spathiwa) Add IsNotARefNum, IsEQ,IsNE support (and tests)

DEFINE_VIREO_END()
}  // namespace Vireo

