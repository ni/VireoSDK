// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

#include "DataTypes.h"
#include "Instruction.h"
#include "ExecutionContext.h"

#if 0
// Data Queue
/*
 Init

 Configure size, if shrinking, it may lop off elements
 (oldest always?)

 Enqueue
    - New take priority forever waiting (flush older)
    - Suspend until there might be enough room
    - enqueue one or more elements

 Dequeue
    - Ask for n, Wait or return what you can get?
    -

 For now it will only work with flat data.


    |..................|..............|
 */

class VivmDataQueue
{
 public:
    VivmDataQueue(int size);
    ~VivmDataQueue();

    void Configure(Int32 size);
    void EnqueueOrSuspend(Int32 n, Double* buffer, InstructionCore* current);
    void EnqueueOrSuspend(Double value, InstructionCore* current);
    void EnqueueFlushOldIfNecessary(Int32 n, Double* buffer);

    void Peek(Int32 n, TypedBlock* buffer);
    void DequeueOrSuspend(Int32 n, TypedBlock* buffer);
    void DequeueWhatICanGet(Int32 n);
    int  RoomAvailable() {return _freeSpace; }
    int  ElementsAvailable() {return (_end-_begin) - _freeSpace; }
 private:
    QueueElt*       _waitingClumps;  // queue elts waiting for room, or more data
    TypedBlock*     _buffer;
    Double*         _begin;
    Double*         _end;
    Double*         _insert;
    Double*         _remove;
    int             _freeSpace;
    int             _eltSize;
};

VivmDataQueue::VivmDataQueue(int size)
{
    _freeSpace = size;
    // TODO needs to be allocated from the Contexts Type Manager
    VIREO_ASSERT(false)
    _insert = (Double*)_buffer->Begin();
    _remove = _insert;
    _eltSize = sizeof(Double);
}

VivmDataQueue::~VivmDataQueue()
{
}

void VivmDataQueue::Configure(Int32 n)
{
    _buffer->Resize1D(n);
}

void Peek(Int32 n, TypedBlock* buffer)
{

}

void VivmDataQueue::EnqueueFlushOldIfNecessary(Int32 n, Double* buffer)
{
}

void VivmDataQueue::EnqueueOrSuspend(Double value, InstructionCore* current)
{
    if (_freeSpace > 0){
        // there is room and _insert always points to a good location, add it.
        // It is never left at _end.
        *_insert++ = value;
        _freeSpace--;
    }

    if (_insert >= _end)
    {
        // wrap around.
        _insert = _begin;
    }
}

// Insert 0 or more elements into the queue.
void VivmDataQueue::EnqueueOrSuspend(Int32 n, Double* buffer, InstructionCore* current)
{
    // get mutex
    if (n <= _freeSpace){
        _freeSpace -= n;

        // wrap = amount-to-insert - room-at-end
        //   positive =>  amount to copy to front,
        //   zero     =>  exact fit
        //   negative =>  room_still_at_end
        int wrap = n - (_end - _insert);
        if (wrap > 0 ) {
            memcpy(_insert, buffer, (n - wrap) * _eltSize);
            memcpy(_begin, buffer, wrap * _eltSize);
            _insert = _begin + wrap;
        } else {
            memcpy(_insert, buffer, n * _eltSize);
            if (wrap == 0) {
                _insert = _begin;
            } else {
                _insert = _insert+ n;
            }
        }
    } else {
  // TODO
  //      QueueElt* currentQe = THREAD_EXEC()->_runningQueueElt;

  // TODO InstructionCore* next = THREAD_EXEC()->SuspendRunningQueueElt(current);

  //      current->_wakeUpInfo = this->MicroSeconds() +  count;
  //      current->_next = this->_sleepingList;
  //      this->_waitingClumps = currentQe;

  // suspend this element, arrange to wake up when something is removed.
    }
}

#endif
