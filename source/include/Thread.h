/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Tools for working in a multithreaded process.
 */

#ifndef Thread_h
#define Thread_h

namespace Vireo
{

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
    MutexedScope(Mutex* pMutex)
        { _mutex = pMutex; _mutex->Acquire(); }
    ~MutexedScope()
        { _mutex->Release(); }
};

}

#endif // Thread_h
