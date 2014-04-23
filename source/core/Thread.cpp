/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include "BuildConfig.h"
#include "Thread.h"

#if (kVireoOS_win32U || kVireoOS_win64U)
	#define NOMINMAX
    #include <Windows.h>
#elif kVireoOS_macosxU
    #include <pthread.h>
#elif (kVireoOS_linuxU)
    #include <pthread.h>
#elif kVireoOS_emscripten
    #include <emscripten.h>
#endif

namespace Vireo {
//------------------------------------------------------------
Mutex::Mutex()
{
#if _WIN32

	HANDLE hdl;
	hdl=::CreateMutex(NULL, false, NULL);
	_nativeMutex=(void*)hdl;

#elif kVireoOS_linuxU || kVireoOS_macosxU

	pthread_mutex_t *pmtx=new pthread_mutex_t;
	pthread_mutexattr_t attr;
	pthread_mutexattr_init(&attr);
	pthread_mutexattr_settype(&attr, PTHREAD_MUTEX_RECURSIVE);
	pthread_mutex_init (pmtx, &attr);	//create a recursive mutex
	pthread_mutexattr_destroy (&attr);
	_nativeMutex=(void*)pmtx;
#endif
	//return kNIError_Success;
}
//------------------------------------------------------------
Mutex::~Mutex()
{
#if _WIN32 && !WinCE
	::CloseHandle((HANDLE)_nativeMutex);
#elif kVireoOS_linuxU || kVireoOS_macosxU
	pthread_mutex_destroy((pthread_mutex_t*)_nativeMutex);
	delete (pthread_mutex_t*)_nativeMutex;
#endif
}
//------------------------------------------------------------
void Mutex::Acquire()
{
#if _WIN32
	::WaitForSingleObject((HANDLE)_nativeMutex,INFINITE);
#elif kVireoOS_linuxU || kVireoOS_macosxU
	if (_nativeMutex)
		pthread_mutex_lock((pthread_mutex_t*)_nativeMutex);
#endif
}
//------------------------------------------------------------
void Mutex::Release()
{
#if _WIN32
	::ReleaseMutex((HANDLE)_nativeMutex);
#elif kVireoOS_linuxU || kVireoOS_macosxU
	if (_nativeMutex)
		pthread_mutex_unlock((pthread_mutex_t*)_nativeMutex);
#endif
}

}
