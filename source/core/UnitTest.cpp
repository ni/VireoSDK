/**

Copyright (c) 2017 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

Craig S.
*/

/*! \file
 \brief Base Class for Unit Test.
*/

#include "TypeDefiner.h"
#include "UnitTest.h"

#include <vector>

using namespace Vireo;

VireoUnitTest::TestList *VireoUnitTest::_s_unitTests;

bool VireoUnitTest::RunTests(bool &pass) {
    pass = true;
    bool ranTests = false;
    TestList *testList = _s_unitTests;
    while (testList) {
        gPlatform.IO.Printf("Executing test: %s\n", testList->_test->Name());
        if (!testList->_test->Execute())
            pass = false;
        ranTests = true;
        testList = testList->Delete();
    }
    return ranTests;
}

void VireoUnitTest::RegisterTest(VireoUnitTest *test) {
    _s_unitTests = _s_unitTests->NewTest(test);
}
