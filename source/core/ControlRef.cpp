// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
    StringRef controlTag;   // Unique identifying tag (control id) for control

    ControlRefInfo() : vi(nullptr), controlTag(nullptr) { }
    ControlRefInfo(VirtualInstrument *aVi, StringRef aControlTag) : vi(aVi), controlTag(aControlTag) { }
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
    RefNum FindOrCreateRefNum(ControlRefInfo *info) {
        ControlRefNumType::RefNumIterator ctlRefIter = _refStorage.Begin(), ctlRefEnd = _refStorage.End();
        while (ctlRefIter != ctlRefEnd) {
            if (ctlRefIter->second._refData.vi == info->vi && ctlRefIter->second._refData.controlTag->IsEqual(info->controlTag)) {
                // Found an existing ref with the same data; return it, and dispose the new StringRef, because we now own it.
                info->controlTag->Delete(info->controlTag);
                return ControlRefNumType::RefNumFromIndexAndExistingHeader(ctlRefIter->first, ctlRefIter->second._refHeader);
            }
            ++ctlRefIter;
        }
        return _refStorage.NewRefNum(info);
    }

    ControlRefNumType &RefNumManager() { return _refStorage; }
};

ControlRefNumManager ControlRefNumManager::_s_singleton;

// ControlReferenceDestroy -- deallocate control ref
// ControlRefInfo owns controlTag string, so it needs to be deallocated before disposing the refnum.
NIError ControlReferenceDestroy(ControlRefNum refnum) {
    ControlRefInfo controlRefInfo;
    NIError err = ControlRefNumManager::RefNumStorage().GetRefNumData(refnum, &controlRefInfo);
    if (err == kNIError_Success) {
        controlRefInfo.controlTag->Delete(controlRefInfo.controlTag);
    }
    return ControlRefNumManager::RefNumStorage().DisposeRefNum(refnum, nullptr);
}

// Clean-up Proc, run when top level VI finishes, disposing control reference.
static void CleanUpControlReference(intptr_t arg) {
    ControlRefNum refnum = ControlRefNum(arg);
    ControlReferenceDestroy(refnum);
}

// ControlReferenceCreate -- create a control ref linked to control associated with controlTag on given VI.
ControlRefNum ControlReferenceCreate(VirtualInstrument *vi, const StringRef &controlTag) {
    ControlRefInfo controlRefInfo(vi, controlTag);
    ControlRefNum refnum = ControlRefNumManager::ControlRefManager().FindOrCreateRefNum(&controlRefInfo);
    ControlRefNumManager::AddCleanupProc(nullptr, CleanUpControlReference, refnum);
    return refnum;
}

// ControlReferenceCreate -- RefNumVal version
ControlRefNum ControlReferenceCreate(RefNumVal *pRefNumVal, VirtualInstrument *vi, const SubString &controlTag) {
    STACK_VAR(String, controlTagStrVar);
    StringRef controlTagStr = controlTagStrVar.DetachValue();
    SubString ss(controlTag);
    controlTagStr->AppendSubString(&ss);
    ControlRefNum refnum = ControlReferenceCreate(vi, controlTagStr);
    pRefNumVal->SetRefNum(refnum);
    return refnum;
}

NIError ControlReferenceLookup(ControlRefNum refnum, VirtualInstrument **pVI, StringRef *pControlTag) {
    ControlRefInfo controlRefInfo;
    NIError err = ControlRefNumManager::RefNumStorage().GetRefNumData(refnum, &controlRefInfo);
    if (err == kNIError_Success) {
        if (pVI)
            *pVI = controlRefInfo.vi;
        if (pControlTag)
            *pControlTag = controlRefInfo.controlTag;
    } else {
        if (pVI)
            *pVI = nullptr;
        if (pControlTag)
            *pControlTag = nullptr;
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
        str->AppendStringRef(controlRefInfo.controlTag);
        str->Append('>');
    }
    return err;
}

VIREO_FUNCTION_SIGNATURE2(IsNotAControlRefnum, RefNumVal, Boolean)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    if (!refnumPtr || ControlRefNumManager::RefNumStorage().GetRefNumData(refnumPtr->GetRefNum(), nullptr) != kNIError_Success)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(IsEQRefnum, RefNumVal, RefNumVal, Boolean);
VIREO_FUNCTION_SIGNATURE3(IsNERefnum, RefNumVal, RefNumVal, Boolean);

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(ControlRefs)
    DEFINE_VIREO_REQUIRE(VirtualInstrument)

    DEFINE_VIREO_TYPE(ControlRefNumInfo, "c(e(VirtualInstrument vi) e(String controlTag))")
    DEFINE_VIREO_TYPE(ControlRefNum, "refnum(ControlRefNumInfo)")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAControlRefnum, "p(i(ControlRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(ControlRefNum) i(ControlRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(ControlRefNum) i(ControlRefNum) o(Boolean))")

DEFINE_VIREO_END()
}  // namespace Vireo

