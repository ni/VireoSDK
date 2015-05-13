/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
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

//! Create a Execution and Typemanager pair.
TypeManagerRef ConstructTypeManagerAndExecutionContext(TypeManagerRef parentTADM);

//! Punctuation and options used by the TDViaFormatter
enum ViaFormat {
    kViaFormat_NoFieldNames = 0,
    kViaFormat_UseFieldNames = 1,
    kViaFormat_QuotedFieldNames =  kViaFormat_UseFieldNames + 2,
    kViaFormat_PercentEncodeFieldNames = kViaFormat_UseFieldNames + 4,
};

struct ViaFormatChars
{
    ConstCStr   _name;
    Utf8Char    _arrayPre;
    Utf8Char    _arrayPost;
    Utf8Char    _clusterPre;
    Utf8Char    _clusterPost;
    Utf8Char    _itemSeperator;
    Utf8Char    _quote;
    ViaFormat   _fieldNameFormat;
    
    Boolean UseFieldNames()      { return _fieldNameFormat &  kViaFormat_UseFieldNames ? true : false; }
    Boolean QuoteFieldNames()    { return _fieldNameFormat == kViaFormat_QuotedFieldNames; }
};

struct ViaFormatOptions
{
    //Once formatter digs below top level this will be on. Constructor controls initial value
    Boolean         _bQuoteStrings;
    Boolean         _bEscapeStrings;
    Int32           _fieldWidth;
    ViaFormatChars  _fmt;
};

//------------------------------------------------------------
// Find or build a type in the the type manager corresponding to ascii type description
// The are three primary errors that are likely to happen.
// 1. Grammar errors.  For example parens or key words are misplaced
// these tokens direct the recursive descent parser, so on is encountered parsing will cease.
// 2. Semantic errors. For example, arguments to functions might have the wrong type
// 3. Out of memory. Memory will be allocated out of the designated TypeManager
// if the quota is exceeded parsing will cease.

//! The VIA decoder, also includes options for JSON and C style initializers.
class TDViaParser
{
private:
    TypeManagerRef  _typeManager;
    SubString       _string;      // "Begin()" moves through string as it is parsed.
    const Utf8Char* _originalStart;
    Int32           _lineNumberBase;
      
public:
    // Format options also used in ViaFormatter
    ViaFormatOptions  _options;
    ViaFormatChars& Fmt()  { return _options._fmt; }

    Boolean         _loadVIsImmediatly;
    EventLog*       _pLog;

    void    LogEvent(EventLog::EventSeverity severity, ConstCStr message, ...);
    Int32   ErrorCount() { return _pLog->TotalErrorCount(); }
    Int32   CalcCurrentLine();
    void    RepinLineNumberBase();

    TDViaParser(TypeManagerRef typeManager, SubString* typeString, EventLog *pLog, Int32 lineNumberBase, SubString* format = null);
    TypeRef ParseType(TypeRef patternType = null);
    TypeRef ParseLiteral(TypeRef patternType);
    void    ParseData(TypeRef type, void* pData);
    Boolean EatJSONPath(SubString* path);
    NIError ParseREPL();
    void    ParseEnqueue();
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
    TypeRef ParseDefine();
    TypeRef ParseContext(TypeManagerRef parentTADM);
    TypeRef ParseDefaultValue(Boolean mutableValue);
    TypeRef ParseEquivalence();
    TypeRef ParseNamedType();
    TypeRef ParseParamBlock();
    TypeRef ParsePointerType(Boolean shortNotation);
    EncodingEnum ParseEncoding(SubString* string);
};

#if defined (VIREO_VIA_FORMATTER)
class TDViaFormatterTypeVisitor;

//! The VIA encoder.
class TDViaFormatter
{
    friend class TDViaFormatterTypeVisitor;
private:
    StringRef       _string;
    ViaFormatOptions  _options;
    ViaFormatChars& Fmt() { return _options._fmt; }
    
    static const Int32 kTempFormattingBufferSize = 100;
public:
    TDViaFormatter(StringRef string, Boolean quoteOnTopString, Int32 fieldWidth = 0, SubString* format = null);
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
    
    static char LocaleDefaultDecimalSeperator;
    static ViaFormatChars formatVIA;
    static ViaFormatChars formatJSON;
    static ViaFormatChars formatC;
};

void Format(SubString *format, Int32 count, StaticTypeAndData arguments[], StringRef buffer);
#endif

#define tsBoolean         "Boolean"
#define tsGeneric         "Generic"     //!< Generic template place holder
#define tsBits            "Bits"        // Boolean values, 0 = false, off, 1 = true, on. No numeric significance
#define tsEnum            "Enum"        //!< no numeric significance
#define tsUInt            "UInt"        //!< unsigned integer 0 == 00000b, max = 1111b
#define tsSInt            "SInt2c"      //!< signed integer two's compliment.  for 4 bits min=1000b(-8), 0 = 0000b, max = 0111b
#define tsInt1sCompliment "SInt1c"      //!< signed integer ones's compliment. for 4 bits min=1000b(-7), 0 = 0000b or 1111b, max = 0111b
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

#define tsArrayTypeToken        "a"
#define tsBitClusterTypeToken   "bc"
#define tsBitBlockTypeToken     "bb"
#define tsClusterTypeToken      "c"
#define tsContextTypeToken      "context"
#define tsDefineTypeToken       "define"
#define tsEnqueueTypeToken      "enqueue"
#define tsElementToken          "e"  // used for Cluster, BitCluster, and array aggregate types for simple elements
#define tsAliasToken            "al" // alias to another element. 
#define tsInputParamToken       "i"  // input parameter
#define tsOutputParamToken      "o"  // output parameter
#define tsInputOutputParamToken "io" // input-output parameter
#define tsImmediateParamToken   "im" // Immediate mode parameter (not byref), only in paramblocks. size must be <= size_t
#define tsStaticParamToken      "s"  // static parameter, not explicitly passed, allocated in param block and preserved between
#define tsTempParamToken        "t"  // temp parameter, not explicitly passed, allocated in param block and can be thrown away
#define tsVolatileToken         "x"  // volatile parameter, not explicitly passed or allocated in the param block
#define tsEquivalenceTypeToken  "eq" // for alternate views on the same set of bits.
#define tsNamedTypeToken        "."
#define tsParamBlockTypeToken   "p"  // Used for defining param blocks used by native functions.
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
#define tsTypeManagerType       "TypeManager"
#define tsVIClumpType           "Clump"

} // namespace Vireo

#endif //TDCodecVia_h
