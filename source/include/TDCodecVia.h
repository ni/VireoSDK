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
#include <vector>

namespace Vireo
{

class VIClump;
class VirtualInstrument;
class InstructionAllocator;

//! Punctuation and options used by the TDViaFormatter
enum ViaFormat {
    kViaFormat_NoFieldNames = 0,
    kViaFormat_UseFieldNames = 1,
    kViaFormat_QuotedFieldNames =  kViaFormat_UseFieldNames | 2,
    kViaFormat_PercentEncodeFieldNames = kViaFormat_UseFieldNames | 4,
    kViaFormat_FieldNameMask = kViaFormat_QuotedFieldNames | kViaFormat_PercentEncodeFieldNames,
    kViaFormat_UseLongNameInfNaN = 8,  // mask,  clear == use inf,nan, set == use Infinity/NaN
    kViaFormat_SuppressInfNaN = 16,    // use neither,
    kViaFormat_JSONStrictValidation = 32,
    kViaFormat_QuoteInfNanNames = 64,
    kViaFormat_StopArrayParseOnFirstError = 128
};

#define kJSONEncoding "JSON"
#define kVIAEncoding "VIA"
#define kCEncoding "C"

struct ViaFormatChars
{
    ConstCStr   _name;
    Utf8Char    _arrayPre;
    Utf8Char    _arrayPost;
    Utf8Char    _clusterPre;
    Utf8Char    _clusterPost;
    Utf8Char    _itemSeparator;
    Utf8Char    _quote;
    ViaFormat   _fieldNameFormat;

    Boolean UseFieldNames()        { return _fieldNameFormat &  kViaFormat_UseFieldNames ? true : false; }
    Boolean QuoteFieldNames()      {
        return (_fieldNameFormat & kViaFormat_FieldNameMask) == kViaFormat_QuotedFieldNames;
    }
    Boolean SuppressInfNaN()       { return (_fieldNameFormat & kViaFormat_SuppressInfNaN) ? true : false; }
    Boolean LongNameInfNaN()       { return (_fieldNameFormat & kViaFormat_UseLongNameInfNaN) ? true : false; }
    Boolean QuotedNameInfNaN()     { return (_fieldNameFormat & kViaFormat_QuoteInfNanNames) ? true : false; }
    Boolean JSONStrictValidation() { return (_fieldNameFormat & kViaFormat_JSONStrictValidation) ? true : false; }
    Boolean GenerateJSON()         { return strcmp(_name, kJSONEncoding) == 0; }
    Boolean StopArrayParseOnFirstError() { return (_fieldNameFormat & kViaFormat_StopArrayParseOnFirstError) ? true : false; }
};

struct ViaFormatOptions
{
    // Once formatter digs below top level this will be on. Constructor controls initial value
    Boolean         _bQuoteStrings;
    Boolean         _bEscapeStrings;
    Boolean         _exponentialNotation;
    Boolean         _allowNulls;
    Int32           _fieldWidth;
    Int32           _precision;
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

    Boolean         _loadVIsImmediately;
    EventLog*       _pLog;

    void    LogEvent(EventLog::EventSeverity severity, ConstCStr message, ...);
    Int32   ErrorCount() { return _pLog->TotalErrorCount(); }
    Int32   CalcCurrentLine();
    void    RepinLineNumberBase();

    TDViaParser(TypeManagerRef typeManager, SubString* typeString, EventLog *pLog, Int32 lineNumberBase,
                SubString* format = null, Boolean jsonLVExt = false, Boolean strictJSON = false,
                Boolean quoteInfNaN = false, Boolean allowJSONNulls = false);
    void    Reset() { _string.AliasAssign(_originalStart, _string.End()); }
    TypeRef ParseType(TypeRef patternType = null);
    TypeRef ParseLiteral(TypeRef patternType);
    Int32   ParseData(TypeRef type, void* pData);
    Boolean EatJSONPath(SubString* path);
    NIError ParseREPL();
    TypeRef ParseEnqueue();
    Boolean PreParseElements(Int32 rank, ArrayDimensionVector dimensionLengths);
    TokenTraits ReadArrayItem(SubString* input, SubString* token, Boolean topLevel, Boolean suppressInfNaN);
    Int32   ParseArrayData(TypedArrayCoreRef array, void* pData, Int32 level);
    void    ParseVirtualInstrument(TypeRef viType, void* pData);
    void    ParseClump(VIClump* clump, InstructionAllocator* cia);
    void    PreParseClump(VIClump* viClump);
    SubString* TheString() {return &_string;}

 public:
    static NIError StaticRepl(TypeManagerRef typeManager, SubString *replStream);
    static void FinalizeVILoad(VirtualInstrument* vi, EventLog* pLog);
    static void FinalizeModuleLoad(TypeManagerRef tm, EventLog* pLog);

 private:
    TypeRef BadType()   {return _typeManager->BadType();}
    void    ParseAggregateElementList(std::vector<TypeRef> *elementTypesVector, AggregateAlignmentCalculator* calculator);
    TypeRef ParseArray();
    TypeRef ParseBitBlock();
    TypeRef ParseBitCluster();
    TypeRef ParseCluster();
    TypeRef ParseDefine();
    TypeRef ParseRequire();
    TypeRef ParseContext();
    TypeRef ParseDefaultValue(Boolean mutableValue);
    TypeRef ParseEquivalence();
    TypeRef ParseNamedType();
    TypeRef ParseParamBlock();
    TypeRef ParsePointerType(Boolean shortNotation);
    TypeRef ParseRefNumType();
    TypeRef ParseEnumType(SubString *token);
    EncodingEnum ParseEncoding(SubString* str);
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
    Int32 _errorCode;

    static const Int32 kTempFormattingBufferSize = 100;
 public:
    TDViaFormatter(StringRef str, Boolean quoteOnTopString, Int32 fieldWidth = 0, SubString* format = null,
                   Boolean jsonLVExt = false, Boolean quoteInfNaN = false);
    // Type formatters
    void    FormatType(TypeRef type);
    // Options
    void    SetFieldWidth(Int32 width) { _options._fieldWidth = width; }
    void    SetPrecision(Int32 precision) { _options._precision = precision; }
    void    SetExponentialNotation(Boolean on) { _options._exponentialNotation = on; }
    // Data formatters
    void    FormatData(TypeRef type, void* pData);
    void    FormatArrayData(TypeRef arrayType, TypedArrayCoreRef pData, Int32 rank);
    void    FormatArrayDataRecurse(TypeRef elementType, Int32 rank, AQBlock1* pBegin,
                IntIndex *pDimLengths, IntIndex *pSlabLengths);

    void    FormatClusterData(TypeRef clusterType, void* pData);
    void    FormatPointerData(TypeRef pointerType, void* pData);
    void    FormatEncoding(EncodingEnum value);
    void    FormatElementUsageType(UsageTypeEnum value);
    void    FormatInt(EncodingEnum encoding, IntMax value);
    void    FormatIEEE754(TypeRef type, void* pData);
    Int32   GetError() const { return _errorCode; }

    static char LocaleDefaultDecimalSeparator;
    static ViaFormatChars formatVIA;
    static ViaFormatChars formatJSON;
    static ViaFormatChars formatJSONLVExt;
    static ViaFormatChars formatJSONEggShell;
    static ViaFormatChars formatC;
};

void Format(SubString *format, Int32 count, StaticTypeAndData arguments[], StringRef buffer, ErrorCluster *errPtr);
#endif

#define tsBoolean         "Boolean"
#define tsGeneric         "Generic"  //!< Generic template place holder
#define tsEnum            "Enum"     //!< no numeric significance
#define tsUInt            "UInt"     //!< unsigned integer 0 == 00000b, max = 1111b
#define tsSInt            "S2cInt"   //!< signed int two's complement. 4 bits min=1000b(-8), 0=0000b, max=0111bs
#define tsInt1sCompliment "S1cInt"   //!< signed int ones's complement. 4 bits min=1000b(-7),
                                   //   0=0000b or 1111b, max=0111b
#define tsFixedPoint      "Q"        //!< .xxxx fractional part of fixed point numbers. TODO fractional bits? Q.n
#define ts1plusFractional "Q1"       //!< 1.xxxx  used in floating-point formats
#define tsUnusedBits      "XBits"
#define tsAscii           "Ascii"    //!< always single byte  ISO-8859-1
#define tsUnicode         "Unicode"  //!< Utf8, Utf16, Utf32    (Basic Multilingual Plane 0 only right now)
#define tsBiasedInt       "BiasedInt"   //!< example, for 4 bits : -max=0000,  0 = 1xxx, max = 1111
#define tsZigZagInt       "ZigZagInt"   //!< used in Google's protocol buffers.
#define tsIEEE754Binary   "IEEE754B"    //!< Formats defined for 16,32,64 and 128 bit floating-point numbers

#define tsPointer         "Pointer"     // CodePointer - necessary distinction for Harvard architecture machines
#define tsHostPointerSize "HostPointerSize"  // Used in BitBlock definitions

#define tsArrayTypeToken        "a"
#define tsBitClusterTypeToken   "bc"
#define tsBitBlockTypeToken     "bb"
#define tsClusterTypeToken      "c"
#define tsRequireTypeToken      "require"
#define tsContextTypeToken      "context"
#define tsDefineTypeToken       "define"
#define tsEnqueueTypeToken      "enqueue"
#define tsElementToken          "e"   // used for Cluster, BitCluster, and array aggregate types for simple elements
#define tsAliasToken            "al"  // alias to another element.
#define tsInputParamToken       "i"   // input parameter
#define tsOutputParamToken      "o"   // output parameter
#define tsInputOutputParamToken "io"  // input-output parameter
#define tsImmediateParamToken   "im"  // Immediate mode (not byref), only in paramblocks. size must be <= size_t
#define tsStaticParamToken      "s"   // static not explicitly passed, allocated in param block and preserved between
#define tsTempParamToken        "t"   // temp param, not passed, allocated in param block and can be thrown away
#define tsVolatileToken         "x"   // volatile parameter, not explicitly passed or allocated in the param block
#define tsEquivalenceTypeToken  "eq"  // for alternate views on the same set of bits.
#define tsNamedTypeToken        "."

#define tsParamBlockTypeToken   "p"   // Used for defining param blocks used by native functions.
#define tsPointerTypeToken      "ptr"
#define tsRefNumTypeToken       "refnum"

#define tsEnumTypeToken         "Enum"
#define tsEnumTypeTokenLen      4     // strlen of above

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

}  // namespace Vireo

#endif  // TDCodecVia_h
