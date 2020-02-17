// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief Base Class for Unit Test.
*/

#include "TypeDefiner.h"
#include "UnitTest.h"

#include <vector>

VireoUnitTest::TestList *VireoUnitTest::_s_unitTests;

bool VireoUnitTest::RunTests(bool *pass) {
    *pass = true;
    bool ranTests = false;
    TestList *testList = _s_unitTests;
    while (testList) {
        Vireo::gPlatform.IO.Printf("Executing test: %s\n", testList->_test->Name());
        if (!testList->_test->Execute())
            *pass = false;
        ranTests = true;
        testList = testList->Delete();
    }
    return ranTests;
}

void VireoUnitTest::RegisterTest(VireoUnitTest *test) {
    _s_unitTests = _s_unitTests->NewTest(test);
}
