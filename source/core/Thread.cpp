/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#ifdef VIREO_MULTI_THREAD
#include "BuildConfig.h"
#include "Thread.h"

#if (kVireoOS_win32U || kVireoOS_win64U)
    #define NOMINMAX
    #include <Windows.h>
#elif (kVireoOS_linuxU || kVireoOS_macosxU)
    #include <pthread.h>
#elif kVireoOS_emscripten
    #include <emscripten.h>
#endif

namespace Vireo {
//------------------------------------------------------------
Mutex::Mutex()
{
#if (kVireoOS_win32U || kVireoOS_win64U)

    HANDLE hdl;
    hdl = ::CreateMutex(NULL, false, NULL);
    _nativeMutex = (void*)hdl;

#elif (kVireoOS_linuxU || kVireoOS_macosxU)

    pthread_mutex_t *pmtx = new pthread_mutex_t;
    pthread_mutexattr_t attr;
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_settype(&attr, PTHREAD_MUTEX_RECURSIVE);
    pthread_mutex_init(pmtx, &attr);   // Create a recursive mutex
    pthread_mutexattr_destroy(&attr);
    _nativeMutex = (void*)pmtx;
    
#endif
}
//------------------------------------------------------------
Mutex::~Mutex()
{
#if (kVireoOS_win32U || kVireoOS_win64U)

    ::CloseHandle((HANDLE)_nativeMutex);

#elif (kVireoOS_linuxU || kVireoOS_macosxU)

    pthread_mutex_destroy((pthread_mutex_t*)_nativeMutex);
    delete (pthread_mutex_t*)_nativeMutex;

#endif
}
//------------------------------------------------------------
void Mutex::Acquire()
{
#if (kVireoOS_win32U || kVireoOS_win64U)

    ::WaitForSingleObject((HANDLE)_nativeMutex, INFINITE);

#elif (kVireoOS_linuxU || kVireoOS_macosxU)

    if (_nativeMutex)
        pthread_mutex_lock((pthread_mutex_t*)_nativeMutex);

#endif
}
//------------------------------------------------------------
void Mutex::Release()
{
#if (kVireoOS_win32U || kVireoOS_win64U)

    ::ReleaseMutex((HANDLE)_nativeMutex);

#elif (kVireoOS_linuxU || kVireoOS_macosxU)

    if (_nativeMutex)
        pthread_mutex_unlock((pthread_mutex_t*)_nativeMutex);

#endif
}

}  // namespace Vireo
#endif
