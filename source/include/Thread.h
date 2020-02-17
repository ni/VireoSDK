// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Tools for working in a multithreaded process.
 */

#ifndef Thread_h
#define Thread_h

#include "DataTypes.h"

namespace Vireo
{

//------------------------------------------------------------
// In pure single thread environments like bare-metal, or
// single thread command line apps, no mutex infrastructure is
// needed. These macros help remove all overhead for those
// simple cases.
#ifdef  VIREO_MULTI_THREAD
    #define MUTEX_CLASS_MEMBER      Mutex _mutex;
    #define MUTEX_SCOPE()           MutexedScope mutexScope(&_mutex);
#else
    #define MUTEX_CLASS_MEMBER
    #define MUTEX_SCOPE()
#endif

bool CompareAndSwapUInt32(volatile UInt32 *ptr, UInt32 new_value, UInt32 old_value);

#ifdef VIREO_MULTI_THREAD
//------------------------------------------------------------
class Mutex
{
 private:
    void* _nativeMutex;
 public:
    Mutex();
    ~Mutex();
    void Acquire();
    void Release();
};

//------------------------------------------------------------
class MutexedScope
{
 private:
    Mutex *_mutex;
 public:
    explicit MutexedScope(Mutex* pMutex)
        { _mutex = pMutex; _mutex->Acquire(); }
    ~MutexedScope()
        { _mutex->Release(); }
};
#endif

}   // namespace Vireo

#endif  // Thread_h
