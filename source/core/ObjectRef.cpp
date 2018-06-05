
/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief Opaque Object reference management
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "RefNum.h"
#include "ObjectRef.h"

namespace Vireo {

//TODO: do something similar

// ObjectRefInfo -- Storage for static opaque object references.
struct ObjectRefInfo {
    VirtualInstrument *vi;  // VI containing object
    StringRef objectTag;   // Unique identifying tag for object // TODO: what is this going to be?

    ObjectRefInfo() : vi(NULL), objectTag(NULL) { }
    ObjectRefInfo(VirtualInstrument *aVi, StringRef aObjectTag) : vi(aVi), objectTag(aObjectTag) { }
};

// ObjectRefNumManager -- Allocation, deallocation, and lookup of object references
class ObjectRefNumManager : public RefNumManager {
 private:
    typedef TypedRefNum<ObjectRefInfo, true> ObjectRefNumType;
    ObjectRefNumType _refStorage;  // manages refnum storage

    static ObjectRefNumManager _s_singleton;
 public:
    static ObjectRefNumManager &ObjectRefManager() { return _s_singleton; }
    static ObjectRefNumType &RefNumStorage() { return _s_singleton.RefNumManager(); }

    ObjectRefNumType &RefNumManager() { return _refStorage; }
};

ObjectRefNumManager ObjectRefNumManager::_s_singleton;

// ObjectReferenceDestroy -- deallocate object ref
// ObjectRefInfo owns objectTag string, so it needs to be deallocated before disposing the refnum.
NIError ObjectReferenceDestroy(ObjectRefNum refnum) {
    ObjectRefInfo ObjectRefInfo;
    NIError err = ObjectRefNumManager::RefNumStorage().GetRefNumData(refnum, &ObjectRefInfo);
    if (err == kNIError_Success) {
        ObjectRefInfo.objectTag->Delete(ObjectRefInfo.objectTag);
    }
    return ObjectRefNumManager::RefNumStorage().DisposeRefNum(refnum, NULL);
}

// Clean-up Proc, run when top level VI finishes, disposing object reference.
static void CleanUpObjectReference(intptr_t arg) {
    ObjectRefNum refnum = ObjectRefNum(arg);
    ObjectReferenceDestroy(refnum);
}

// ObjectReferenceCreate -- create a object ref linked to object associated with objectTag on given VI.
ObjectRefNum ObjectReferenceCreate(VirtualInstrument *vi, const StringRef &objectTag) {
    ObjectRefInfo ObjectRefInfo(vi, objectTag);
    ObjectRefNum refnum = ObjectRefNumManager::RefNumStorage().NewRefNum(&ObjectRefInfo);
    ObjectRefNumManager::AddCleanupProc(null, CleanUpObjectReference, refnum);
    return refnum;
}

// ObjectReferenceCreate -- RefNumVal version
ObjectRefNum ObjectReferenceCreate(RefNumVal *pRefNumVal, VirtualInstrument *vi, const SubString &objectTag) {
    STACK_VAR(String, objectTagStrVar);
    StringRef objectTagStr = objectTagStrVar.DetachValue();
    SubString ss(objectTag);
    objectTagStr->AppendSubString(&ss);
    ObjectRefNum refnum = ObjectReferenceCreate(vi, objectTagStr);
    pRefNumVal->SetRefNum(refnum);
    return refnum;
}

NIError ObjectReferenceLookup(ObjectRefNum refnum, VirtualInstrument **pVI, StringRef *pobjectTag) {
    ObjectRefInfo ObjectRefInfo;
    NIError err = ObjectRefNumManager::RefNumStorage().GetRefNumData(refnum, &ObjectRefInfo);
    if (err == kNIError_Success) {
        *pVI = ObjectRefInfo.vi;
        *pobjectTag = ObjectRefInfo.objectTag;
    } else {
        *pVI = NULL;
        *pobjectTag = NULL;
    }
    return err;
}

// ObjectReferenceAppendDescription -- output the VI and object a refnum is linked to (for test validation)
NIError ObjectReferenceAppendDescription(StringRef str, ObjectRefNum refnum) {
    ObjectRefInfo ObjectRefInfo;
    NIError err = ObjectRefNumManager::RefNumStorage().GetRefNumData(refnum, &ObjectRefInfo);
    if (err == kNIError_Success) {
        SubString viName;
        if (ObjectRefInfo.vi)
            viName = ObjectRefInfo.vi->VIName();
        str->Append('<');
        str->AppendSubString(&viName);
        str->Append(',');
        str->AppendStringRef(ObjectRefInfo.objectTag);
        str->Append('>');
    }
    return err;
}

VIREO_FUNCTION_SIGNATURE2(IsNotAObjectRefnum, RefNumVal, Boolean)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    if (!refnumPtr || ObjectRefNumManager::RefNumStorage().GetRefNumData(refnumPtr->GetRefNum(), NULL) != kNIError_Success)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(IsEQRefnum, RefNumVal, RefNumVal, Boolean);
VIREO_FUNCTION_SIGNATURE3(IsNERefnum, RefNumVal, RefNumVal, Boolean);

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(ObjectRefs)
    DEFINE_VIREO_REQUIRE(VirtualInstrument)

    DEFINE_VIREO_TYPE(ObjectRefNumInfo, "c(e(VirtualInstrument vi) e(String objectTag))")
    DEFINE_VIREO_TYPE(ObjectRefNum, "refnum(ObjectRefNumInfo)")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAObjectRefnum, "p(i(ObjectRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(ObjectRefNum) i(ObjectRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(ObjectRefNum) i(ObjectRefNum) o(Boolean))")

DEFINE_VIREO_END()
}  // namespace Vireo

