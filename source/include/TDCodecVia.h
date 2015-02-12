/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief A Vireo codec for the VIA (VI Assembly) text format.
*/

#ifndef TDCodecVia_h
#define TDCodecVia_h

#include "TypeAndDataManager.h"
#include "EventLog.h"

namespace Vireo
{

class VIClump;
class VirtualInstrument;
class InstructionAllocator;

//------------------------------------------------------------
// Find or build a type in the the type manager corresponding to ascii type description
// The are three primary errors that are likely to happen.
// 1. Grammar errors.  For example parens or key words are misplaced
// these tokens direct the recursive descent parser, so on is encountered parsing will cease.
// 2. Semantic errors. For example, arguments to functions might have the wrong type
// 3. Out of memory. Memory will be allocated out of the designated TypeManager
// if the quota is exceeded parsing will cease.

#if defined (VIREO_VIA_PARSER)
//! The VIA decoder.
class TDViaParser
{
private:
    TypeManagerRef  _typeManager;
    SubString       _string;      // "Begin()" moves through string as it is parsed.
    const Utf8Char* _originalStart;
    Int32           _lineNumberBase;
      
public:
    Boolean         _loadVIsImmediatly;
    EventLog*       _pLog;

    void    LogEvent(EventLog::EventSeverity severity, ConstCStr message, ...);
    Int32   ErrorCount()
        { return _pLog->TotalErrorCount(); }
    Int32   CalcCurrentLine();
    void    RepinLineNumberBase();

    TDViaParser(TypeManagerRef typeManager, SubString* typeString, EventLog *pLog, Int32 lineNumberBase);
    TypeRef ParseType();
    void    ParseData(TypeRef type, void* pData);
    void    PreParseElements(Int32 rank, ArrayDimensionVector dimensionLengths);
    void    ParseArrayData(TypedArrayCoreRef array, void* pData, Int32 level);
    void    ParseVirtualInstrument(TypeRef viType, void* pData);
    void    ParseClump(VIClump* clump, InstructionAllocator* cia);
    void    PreParseClump(VIClump* viClump);
    void    ParseInstructionArguments(VIClump* clump);
    SubString* TheString() {return &_string;}
    
public:
    static void FinalizeVILoad(VirtualInstrument* vi, EventLog* pLog);
    static void FinalizeModuleLoad(TypeManagerRef tm, EventLog* pLog);
    
private :
    TypeRef BadType()   {return _typeManager->BadType();}
    void    ParseAggregateElementList(TypeRef ElementTypes[], AggregateAlignmentCalculator* calculator);
    TypeRef ParseArray();
    TypeRef ParseBitBlock();
    TypeRef ParseBitCluster();
    TypeRef ParseCluster();
    TypeRef ParseDefaultValue(Boolean mutableValue);
    TypeRef ParseEquivalence();
    TypeRef ParseNamedType();
    TypeRef ParseParamBlock();
    TypeRef ParsePointerType(Boolean shortNotation);
    EncodingEnum ParseEncoding(SubString* string);
};
#endif

#if defined (VIREO_VIA_FORMATTER)
// Questions The type and data formatter is handled as a class similar to the parser
// not sure it need to be a class. Here is why it seems to help. Mutually recursive functions for type and data
// are methods on the same class. State and formatting options can be held by the class instead of being passed
// as a long list of parameters in recursive functions.
class TDViaFormatterTypeVisitor;

//! The VIA encoder.
class TDViaFormatter
{
    friend class TDViaFormatterTypeVisitor;
private:
    StringRef       _string;
    
    //Once formatter digs below top level this will be on. Constructor controls initial value
    Boolean         _bQuoteStrings;
    Int32           _fieldWidth;
    
    static const Int32 kTempFormattingBufferSize = 100;
public:
    TDViaFormatter(StringRef string, Boolean quoteOnTopString, Int32 fieldWidth = 0);
    // Type formatters
    void    FormatType(TypeRef type);
    // Data formatters
    void    FormatData(TypeRef type, void* pData);
    void    FormatArrayData(TypeRef arrayType, TypedArrayCoreRef pData, Int32 rank);
    void    FormatArrayDataRecurse(TypeRef elementType, Int32 rank, AQBlock1* pBegin,
                IntIndex *pDimLengths, IntIndex *pSlabLengths);

    void    FormatClusterData(TypeRef clusterType, void* pData);
    void    FormatPointerData(TypeRef pointerType, void* pData);
    void    FormatEncoding(EncodingEnum value);
    void    FormatElementUsageType(UsageTypeEnum value);
    void    FormatInt(EncodingEnum encoding, Int32 aqSize, void* pData);
    void    FormatIEEE754(EncodingEnum encoding, Int32 aqSize, void* pData);
};

// sprintf style formatting
void Format(SubString *format, Int32 count, StaticTypeAndData arguments[], StringRef buffer);
#endif

#define tsBoolean         "Boolean"
#define tsGeneric         "Generic"     //!< Generic template place holder
#define tsBits            "Bits"        // Boolean values, 0 = false, off, 1 = true, on. No numeric significance
#define tsEnum            "Enum"        //!< no numeric significance
#define tsUInt            "UInt"        //!< unsigned int 0 == 00000b, max = 1111b
#define tsSInt            "SInt"        //!< example, for 4 bits : min=1000b(-8),  0 = 0000b, max = 0111b
#define tsInt1sCompliment "SInt1c"      //!< example, for 4 bits : min=1000b(-7),  0 = 0000b or 1111b, max = 0111b
#define tsFixedPoint      "Q"           //!< .xxxx fractional part of fixed point numbers   TODO fractional bits??? Q.n
#define ts1plusFractional "Q1"          //!< 1.xxxx  used in floating-point formats
#define tsUnusedBits      "XBits"
#define tsAscii           "Ascii"       //!< always single byte  ISO-8859-1
#define tsUnicode         "Unicode"     //!< Utf8, Utf16, Utf32    (Basic Multilingual Plane 0 only right now TODO support more?)
#define tsIntBiased       "IntBiased"   //!< example, for 4 bits : -max=0000,  0 = 1xxx, max = 1111
#define tsZigZag          "IntZigZag"   //!< used in Google's protocol buffers.
#define tsIEEE754Binary   "IEEE754B"    //!< Formats defined for 16,32,64 and 128 bit floating-point numbers

#define tsPointer         "Pointer"     // CodePointer - necessary distinction for Harvard architecture machines
#define tsHostPointerSize "HostPointerSize"  // Used in BitBlock definitions


// Notes on Ascii
// There are many Ascii variants to chose from. LabVIEW historically used what was
// Know as Latin-1 know more formally defined as ISO 8859-1
// http://en.wikipedia.org/wiki/ISO/IEC_8859-1

#define tsArrayToken            "a"
#define tsBitClusterTypeToken   "bc"
#define tsBitBlockTypeToken     "bb"
#define tsClusterTypeToken      "c"
#define tsElementToken          "e"  // used for Cluster, BitCluster, and array aggregate types for simple elements
#define tsAliasToken            "al" // alias to another element. 
#define tsInputParamToken       "i"  // input parameter
#define tsOutputParamToken      "o"  // output parameter
#define tsInputOutputParamToken "io" // input-output parameter
#define tsImmediateParamToken   "im" // Immediate mode parameter (not byref), only in paramblocks. size must be <= size_t
#define tsStaticParamToken      "s"  // static parameter, not explicitly passed, allocated in param block and preserved between
#define tsTempParamToken        "t"  // temp parameter, not explicitly passed, allocated in param block and can be thrown away
#define tsVolatileToken         "x"  // volatile parameter, not explicitly passed or allocated in the param block
#define tsEquivalenceToken      "eq" // for alternate views on the same set of bits.
#define tsNamedTypeToken        "."
#define tsParamBlockToken       "p"  // Used for defining param blocks used by native functions.
#define tsPointerTypeToken      "ptr"
#define tsDefaultValueToken     "dv"
#define tsVarValueToken         "var"

#define tsClumpsToken           "clumps"
#define tsClumpToken            "clump"

#define tsCallVIToken           "CallVI"
#define tsCopyOpToken           "Copy"
#define tsPerchOpToken          "Perch"
#define tsFireCountOpToken      "FireCount"

#define tsExecutionContextType  "ExecutionContext"


} // namespace Vireo

#endif //TDCodecVia_h
