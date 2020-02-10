// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 */

#include "BuildConfig.h"
#include "Thread.h"

#if defined(kVireoOS_windows)
    #define NOMINMAX
    #include <Windows.h>
#elif defined(kVireoOS_linuxU) || defined(kVireoOS_macosxU)
    #include <pthread.h>
#elif defined(kVireoOS_emscripten)
    #include <emscripten.h>
#endif

namespace Vireo {

bool CompareAndSwapUInt32(volatile UInt32 *ptr, UInt32 new_value, UInt32 old_value) {
#if (kVireoOS_linuxU || kVireoOS_macosxU)
    return __sync_bool_compare_and_swap(ptr, old_value, new_value);
#elif kVireosOS_windows
    return InterlockedCompareExchange((volatile LONG*)ptr, LONG(new_value), LONG(old_value)) == old_value;
#else
    // #if VIREO_MULTI_THREAD ... ???
    if (*ptr == old_value) {
        *ptr = new_value;
        return true;
    } else {
        return false;
    }
#endif
}

#ifdef VIREO_MULTI_THREAD

//------------------------------------------------------------
Mutex::Mutex()
{
#if defined(kVireoOS_windows)

    HANDLE hdl;
    hdl = ::CreateMutex(nullptr, false, nullptr);
    _nativeMutex = reinterpret_cast<void*>(hdl);

#elif defined(kVireoOS_linuxU || kVireoOS_macosxU)Ï

    pthread_mutex_t *pmtx = new pthread_mutex_t;
    pthread_mutexattr_t attr;
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_settype(&attr, PTHREAD_MUTEX_RECURSIVE);
    pthread_mutex_init(pmtx, &attr);   // Create a recursive mutex
    pthread_mutexattr_destroy(&attr);
    _nativeMutex = reinterpret_cast<void*>(pmtx);

#endif
}
//------------------------------------------------------------
Mutex::~Mutex()
{
#if defined(kVireoOS_windows)

    ::CloseHandle((HANDLE)_nativeMutex);

#elif defined(kVireoOS_linuxU || kVireoOS_macosxU)

    pthread_mutex_destroy(reinterpret_cast<pthread_mutex_t*>(_nativeMutex));
    delete reinterpret_cast<pthread_mutex_t*>(_nativeMutex);

#endif
}
//------------------------------------------------------------
void Mutex::Acquire()
{
#if defined(kVireoOS_windows)

    ::WaitForSingleObject((HANDLE)_nativeMutex, INFINITE);

#elif defined(kVireoOS_linuxU || kVireoOS_macosxU)

    if (_nativeMutex)
        pthread_mutex_lock(reinterpret_cast<pthread_mutex_t*>(_nativeMutex));

#endif
}
//------------------------------------------------------------
void Mutex::Release()
{
#if defined(kVireoOS_windows)

    ::ReleaseMutex((HANDLE)_nativeMutex);

#elif defined(kVireoOS_linuxU || kVireoOS_macosxU)

    if (_nativeMutex)
        pthread_mutex_unlock(reinterpret_cast<pthread_mutex_t*>(_nativeMutex));

#endif
}

#endif
}  // namespace Vireo
