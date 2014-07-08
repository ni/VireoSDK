/**
 
 Copyright (c) 2014 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "DataTypes.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"

using namespace Vireo;

#ifndef VIREO_MICRO
#error this main is for the single context micro vireo
#endif

//------------------------------------------------------------
namespace Vireo {

#define X(_name_, _count_, ...)   VIREO_FUNCTION_SIGNATURE##_count_(_name_, __VA_ARGS__);
VIREO_FUNCTION_SIGNATURE0(Done);
#include "FunctionTable.def"
#undef X
  
FunctonTableEntry FunctionTable[] = {
    #define X(_name_, _count_, ...)   VIREO_FTE(_name_, _count_),
    VIREO_FTE(null, 1),
    VIREO_FTE(Done, 0),
    #include "FunctionTable.def"
    #undef X
};

enum VireoOpCode {
    #define X(_name_, _count_, ...)   kOP_##_name_,
    kOP_Perch,
    kOP_Done,
    #include "FunctionTable.def"
    #undef X
};


// Vireo ByteCode. value ver similiar to the VIA grammar
// though sets are count prefixed instead of delimiter prefixed.

enum VireoByteCode {
    // Commnads
    kVBC_DefineCount,
    kVBC_Define,
    kVBC_Enqueue,
    // Simple Types
    kVBC_TypeType,
    kVBC_ByteBlockType,
    kVBC_VarArgCount,
    // Regular type
    kVBC_BitBlockType,
    kVBC_ClusterType,
    kVBC_VectorType,    // Always 1D
    kVBC_DVType,    //
    kVBC_Array,     // n dimensiona 0..n
    kVBC_CustomDefault,
    kVBC_VIType,
    kVBC_ClumpType,
    kVBC_NamedType,
    kVBC_VoidType,
};

// encoding will defined how many bytes folow, and how many bytes they shold
// be expaneded to, typically. Its a hintd is a hint
#define kVDBC_I8   0x81
#define kVDBC_I16  0x82
#define kVDBC_I32  0x83
#define kVDBC_F32  0x84
#define kVDBC_F64  0x85
#define kVDBC_EOD  0x86

/* 

A binary VI is a lot like a via one.

A VI is a definition. in the small world the name wil be a number. 

The the VI will have a tye defining  the param block, then the ds block then 
the clumps each is a list of instruction.

All names are simply indexes ( e.g. vi "1", "2",...) and are stored as numbers not strings.
no forward definitions. So Data is layed out in stripes.

// 1. VI data spaces
// 2. VI Code

This means when the code is loaded all the parameter blocks have been defined.
that means for example the parameter count can be determined from the param block.
thus the byte stream does not inlcude a count or terminator, it also helps with default
parameters.

*/

class SubByteBuffer : public SimpleSubVector<Int8>
{
public:
    SubByteBuffer()
    {
        _begin = null;
        _end = null;
    }
    
    SubByteBuffer(const Int8* begin, int count)
    {
        _begin = begin;
        _end = begin + count;
    }
    
    Int8 ReadByte() {
        Int8 byte = *_begin;
        _begin++;
        return byte;
    }
    
    void UnpackVBData(void* pDest)
    {
        Int8 *pByte = (Int8*) pDest;
        Int8 byte = ReadByte();
        
        while (true) {
            if ((byte & 0x80) == 0) {
                *pByte++ = byte;
            } else if (byte == (Int8)kVDBC_EOD) {
                break;
            } else if (byte == (Int8)kVDBC_I8)  {
                *pByte++ = ReadByte();
            } else if (byte == (Int8)kVDBC_I32) {
                // Adjust byte ordering as needed.
                *pByte++ = ReadByte();
                *pByte++ = ReadByte();
                *pByte++ = ReadByte();
                *pByte++ = ReadByte();
            }
            byte = ReadByte();
        }
    }
};

//------------------------------------------------------------
/**
  For small non VM targets. A pool of memory that can be 
  allocated from. And al allocation can be freed in one operation.
  The template should be instanced to occupy all remaining ram.
*/
template <int T>
class StaticMallocPool {
private:
    Int8*   _next;
    Int8    _memory[T];
public:
    void  Reset()
    {
        _next = &_memory[0];
    }
    
    void* Malloc(size_t count)
    {
        Int8* newNext = _next + count;
        if (newNext <= &_memory[T]) {
            Int8* next= _next;
            _next = newNext;
            return next;
        } else {
            return null;
        }
    }
};

VirtualInstrument* gSymbolTable;
    
StaticMallocPool<5000> gMem;
//------------------------------------------------------------
#define ML_CONTEXT  static
class MicroLoader {
public:
    static const int MaxPerchCount = 16;
public:
    ML_CONTEXT void     LoadModule(const char* begin, int len);
    ML_CONTEXT void     LoadData(VireoByteCode vbcType, void* pData);  // No rank yet
    ML_CONTEXT void     LoadClump(VIClump* pClump);
    ML_CONTEXT void     LoadInstructions();
    ML_CONTEXT int      TopSize(VireoByteCode type);
    ML_CONTEXT SubByteBuffer _buffer;
    ML_CONTEXT VirtualInstrument* _currentVI;
};

#ifdef ML_CONTEXT
    SubByteBuffer MicroLoader::_buffer;
    VirtualInstrument* MicroLoader::_currentVI;
#endif

//------------------------------------------------------------
int MicroLoader::TopSize(VireoByteCode type)
{
    if (type == kVBC_VIType) {
        return sizeof(VirtualInstrument);
    } else if (type == kVBC_ClumpType) {
        return sizeof(VIClump);
    } else {
        return 0;
    }
}
//------------------------------------------------------------
void MicroLoader::LoadModule(const char* begin, int len)
{
    gMem.Reset();
    _buffer.AliasAssign(begin, begin + len);
    LoadData(kVBC_TypeType, &gSymbolTable);
}
//------------------------------------------------------------
void MicroLoader::LoadData(VireoByteCode vbcType, void* pData)
{
    /*
    Pass 1
    Read Each VI
    Create VI, DS, and Clumps Array 
    
    Pass 2 
    REad instructions wiht pointers to each piece of data.
    
    No recursion?
    Reentrant VIs. Initially no. ny dynamically created.
    Each instance has to be created.
    
     */
    if  (vbcType == kVBC_VectorType) {
        // ?? Array of what hard coded to VIs right now. Some basic sizeof() still needed.
        VireoByteCode type = (VireoByteCode) _buffer.ReadByte();
        
        Int8 count =  _buffer.ReadByte();
        int eltSize = count * TopSize(type);
        VirtualInstrument* viArray = (VirtualInstrument*) gMem.Malloc(count * eltSize);
        *(VirtualInstrument**)pData = viArray;

        for ( int i = 0 ; i < count ; i++) {
            LoadData(type, viArray+i);
        }
    } else if (vbcType == kVBC_ByteBlockType) {
        // Read type and determin size??
        Int8 count =  _buffer.ReadByte();
        *(void**)pData = gMem.Malloc(count);
    } else if (vbcType == kVBC_DVType) {
        VireoByteCode type = (VireoByteCode) _buffer.ReadByte();
        LoadData(type, pData);
        // Now load value into the type.
        // Limit the range of data.
        _buffer.UnpackVBData(*(void**)pData);
        // LoadDVData(type, PData);
    } else if (vbcType == kVBC_TypeType) {
        // At this point the type is not stored any where.
        VireoByteCode type = (VireoByteCode) _buffer.ReadByte();
        LoadData(type, pData);
    } else if (vbcType == kVBC_VoidType) {
        *(void**)pData = null;
    } else if (vbcType == kVBC_ClumpType) {
        LoadClump((VIClump*)pData); //VIClump *pClump = (VIClump*)
    } else if (vbcType == kVBC_VIType) {
        _currentVI = (VirtualInstrument*) pData;
        LoadData(kVBC_TypeType, &_currentVI->_paramBlock);
        LoadData(kVBC_TypeType, &_currentVI->_dataSpace);
        LoadData(kVBC_TypeType, &_currentVI->_clumps);
    }
}
//------------------------------------------------------------
void MicroLoader::LoadClump(VIClump* pVIClump)
{
    pVIClump->_fireCount = _buffer.ReadByte();
    pVIClump->_shortCount = pVIClump->_fireCount;
    GenericInstruction* pFirstInstruction = null;
    
    VireoOpCode opCode;
    Int8* pDataSpace = (Int8*)_currentVI->_dataSpace;
    Int8  perchIndex = -1;
    GenericInstruction *perches[MaxPerchCount];
    // GenericInstruction *forwardPerchPatches[MaxPerchCount];
    
    // pVIClump*
    
    do {
        opCode = (VireoOpCode) _buffer.ReadByte();

        if (opCode == kOP_Perch) {
            perchIndex = _buffer.ReadByte();
            continue;
        }
        
        // If opCode is pearch member the location
        // ithe arguemnt type is branch  we need to look up the perch.
        // arguments need to be of thte right type.

        int paramCount = FunctionTable[opCode]._argCount;
        GenericInstruction* pInst = (GenericInstruction*) gMem.Malloc((paramCount+1) * sizeof(void*));
        pInst->_function = FunctionTable[opCode]._function;

        if (pFirstInstruction == null) {
            pFirstInstruction = pInst;
        }
        if (perchIndex != -1) {
            perches[perchIndex] = pInst;
            perchIndex = -1;
        }

        if (opCode == kOP_Branch) {
            int branchIndex = _buffer.ReadByte();
            pInst->_args[0] = perches[branchIndex];
            // ?? If the target is not yet known  address then put this field in the perh table.
            // whenthe perch is found them path up hte link list of forward references. Ho to know the difference?
            // perhasp a parallel table of pointers ( still stack based?)
        } else {
            for ( int i = 0; i < paramCount; i ++) {
                int argOffset =  _buffer.ReadByte();
                pInst->_args[i] = pDataSpace + argOffset;
            }
        }
        
    } while (opCode != kOP_Done);
    
    pVIClump->_codeStart = pFirstInstruction;
    pVIClump->_savePc = pVIClump->_codeStart;
}

//------------------------------------------------------------
void VirtualInstrument::Init(VIClump* clumps, void* paramBlockType, void* dataSpaceType)
{
    this->_dataSpace = paramBlockType;
    this->_dataSpace = dataSpaceType;
    this->_clumps = clumps;
}


};


/*
 Parametere address are a samll dotted notation.
 positive number offest into cluster. For array of bytes this is a raw offset
 If it is a cluster then it is element relative.

*/


#define VBC_INT7(x)   ((Int8) (x && 0x07F))
#define VBC_INT8(x)   ((Int8) kVDBC_I8), ((Int8)x)
#define VBC_INT16(x)  ((Int8) kVDBC_I16), ((Int8)(x>>8) & 0xFF), ((Int8)(x & 0xFF))
//#define VBC_INT32(x)  ((Int8) kVDBC_I32), ((Int8)(x>>24) & 0xFF), ((Int8)(x>>16) & 0xFF), ((Int8)(x>>8) & 0xFF), ((Int8)(x & 0xFF))
#define VBC_INT32(x)  ((Int8) kVDBC_I32), ((Int8)(x & 0xFF)), ((Int8)(x>>8) & 0xFF), ((Int8)(x>>16) & 0xFF), ((Int8)(x>>24) & 0xFF)
#define VBC_EOD       ((Int8) kVDBC_EOD)
//------------------------------------------------------------
Int8 sampleProgram[] = {
    // Array of defines
     kVBC_VectorType, kVBC_VIType, 1,
        //VI #1
        kVBC_VoidType,
        kVBC_DVType,
            // First part of a DV is the type
            kVBC_ByteBlockType, 8,
            // Second part is the value, it uses a multi byte encoding.
            VBC_INT32(1000),
            VBC_INT7(1),
            VBC_INT7(0),
            VBC_INT7(1),
            VBC_INT7(0),
            VBC_EOD,
        kVBC_VectorType, kVBC_ClumpType, 1,  // fixed sized array with two elements. Type implied
                1,  // fire count, byte count ( or instruction count?)
                kOP_Perch, 0,
                kOP_AddInt8, 4, 5, 5,
                kOP_WaitMilliseconds, 0,
                kOP_DebugLED, 5,
                kOP_Branch, 0,
                kOP_Done,
            //---
#if 0
                1,  // fire count, byte count ( or instruction count?)
                kOP_Perch, 0,
                kOP_AddInt8, 6, 7, 7,
                kOP_WaitMilliseconds, 0,
                kOP_Branch, 0,
                kOP_Done,
#endif
            //---
};

//------------------------------------------------------------
int VIREO_MAIN(int argc, const char * argv[])
{
    ExecutionState status;
    
    printf("Load. Size is %ld \n",  sizeof(sampleProgram));
    
    MicroLoader::LoadModule(sampleProgram,  sizeof(sampleProgram));
    
    gSymbolTable[0].PressGo();
    
    //MicroLoader::Enqueue(0)
    // Enqueue the first V
    
    printf("start\n");
    
    // TODO: load VI from binary data
    
    do {
        status = THREAD_EXEC()->ExecuteSlices(10, 10);
    } while (status != kExecutionState_None);
    
    printf("done\n");
    return 0;
}
