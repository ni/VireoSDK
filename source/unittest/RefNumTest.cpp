// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief Classes for RefNum API, used to manage references to queues and other reference-based objects.
*/

#include "TypeDefiner.h"
#include "RefNum.h"
#include "UnitTest.h"

namespace Vireo {

#ifndef VIREO_TEST_REFNUM
#define VIREO_TEST_REFNUM VIREO_UNIT_TEST
#endif

#if VIREO_TEST_REFNUM
class RefNumTest : public VireoUnitTest {
    struct Stuff {
        Int32 a;
        Double b;
        TypedArrayCoreRef elements;
    };

 public:
    virtual bool Execute();
    virtual ~RefNumTest() { }
    virtual const char *Name() { return "RefNum"; }

    static RefNumTest RefNumUnitTest;
};

RefNumTest RefNumTest::RefNumUnitTest;

bool RefNumTest::Execute() {
    bool pass = true;
    TypedRefNum<Int32, true> gIntRefNum;

    Int32 d = 7;
    RefNum r1 = gIntRefNum.NewRefNum(&d);
    Int32 e = 33;
    RefNum r2 = gIntRefNum.NewRefNum(&e);

    e = 0;
    gIntRefNum.GetRefNumData(r1, &e);
    if (d != e)
        pass = false;
    e = 44;
    gIntRefNum.SetRefNumData(r1, &e);
    gIntRefNum.GetRefNumData(r1, &d);
    if (d != e)
        pass = false;

    Int32 count = gIntRefNum.GetRefNumCount();
    if (count != 2)
        pass = false;

    RefNumList list;
    gIntRefNum.GetRefNumList(&list);

    e = 0;
    if (gIntRefNum.AcquireRefNumRights(r1, &e)) {
        gIntRefNum.ReleaseRefNumRights(r1);
    }
    if (d != e)
        pass = false;

    gIntRefNum.DisposeRefNum(r1, NULL);
    d = 11;
    RefNum r3 = gIntRefNum.NewRefNum(&d);
    gIntRefNum.DisposeRefNum(r2, NULL);

    d = 55;
    RefNum r4 = gIntRefNum.NewRefNum(&d);
    d = -123;
    RefNum r5 = gIntRefNum.NewRefNum(&d);
    gIntRefNum.DisposeRefNum(r3, NULL);
    gIntRefNum.DisposeRefNum(r5, NULL);
    gIntRefNum.DisposeRefNum(r4, NULL);

    Stuff stuff1, stuff2, teststuff;
    TypedRefNum<Stuff, true> gStuffRefNum;
    stuff1.a = 1;
    stuff1.b = 1.0;
    RefNum sr1 = gStuffRefNum.NewRefNum(&stuff1);
    stuff2.a = 2;
    stuff2.b = 2.0;
    RefNum sr2 = gStuffRefNum.NewRefNum(&stuff2);
    gStuffRefNum.GetRefNumData(sr1, &teststuff);
    if (teststuff.a != stuff1.a)
        pass = false;

    gStuffRefNum.GetRefNumData(sr2, &teststuff);
    if (teststuff.a != stuff2.a)
        pass = false;
    gStuffRefNum.DisposeRefNum(sr2, NULL);
    gStuffRefNum.DisposeRefNum(sr1, NULL);
    return pass;
}
#endif

}  // namespace Vireo
