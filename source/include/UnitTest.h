/**

Copyright (c) 2017 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

Craig S.
*/

/*! \file
 \brief Base class for Unit Test classes.
  Usage:  Derive from VireoUnitTest.  Test is registered in constructor.
  Implement Execute() method to run unit test.
*/

#include "TypeDefiner.h"
#include "RefNum.h"
#include <vector>

#ifndef VIREO_UNIT_TEST
#define VIREO_UNIT_TEST 0
#endif

class VireoUnitTest {
    struct TestList {
        VireoUnitTest *_test;
        TestList *_next;
        explicit TestList(VireoUnitTest *test = nullptr) { _test = test; _next = nullptr; }

        TestList *NewTest(VireoUnitTest *test) {
            TestList *testList = new TestList(test);
            testList->_next = this;
            return testList;
        }
        TestList *Delete() { TestList *next = _next; delete this; return next; }
    };
    static TestList *_s_unitTests;

 public:
    VireoUnitTest() { RegisterTest(this); }
    virtual ~VireoUnitTest() { }
    virtual const char *Name() = 0;
    virtual bool Execute() = 0;
    void RegisterTest(VireoUnitTest *test);

    static bool RunTests(bool * pass);
};
