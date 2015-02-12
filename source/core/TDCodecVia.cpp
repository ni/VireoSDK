/**

Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Native Verio VIA functions.
 */

#include <stdarg.h>
#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#include "VirtualInstrument.h" //TODO remove once it is all driven by the type system.

#if !(kVireoOS_win32U || kVireoOS_win64U )
    #include <math.h>
#endif

// LOG_EVENT Note: variadic macros were defined as part of C99 but exactly what happens when no extra parameter are
// passed is not consistent so there are two versions, one for only the two base parameters,
// and one for three or more arguments. If the descrepancies are resolverd in a later standard, the two can be merged.
#define LOG_EVENT(_severity_, _message_)  _pLog->LogEvent(EventLog::_severity_, CalcCurrentLine(), _message_);
#define LOG_EVENTV(_severity_, _message_, ...)  _pLog->LogEvent(EventLog::_severity_, CalcCurrentLine(), _message_, __VA_ARGS__);

namespace Vireo
{
#if defined (VIREO_VIA_PARSER)
//------------------------------------------------------------
TDViaParser::TDViaParser(TypeManagerRef typeManager, SubString *typeString, EventLog *pLog, Int32 lineNumberBase)
{
    _pLog = pLog;
    _typeManager = typeManager;
    _string.AliasAssign(typeString);
    _originalStart = typeString->Begin();
    _lineNumberBase = lineNumberBase;
    _loadVIsImmediatly = false;
}
//------------------------------------------------------------
void TDViaParser::LogEvent(EventLog::EventSeverity severity, ConstCStr message, ...)
{
    va_list args;
    va_start (args, message);
    _pLog->LogEventV(severity, CalcCurrentLine(), message, args);
    va_end (args);
}
//------------------------------------------------------------
Int32 TDViaParser::CalcCurrentLine()
{
    // As the parser moves through the string the line number is periodically calculated
    // It is not managed token by token.
    SubString range(_originalStart, _string.Begin());
    return _lineNumberBase + range.CountMatches('\n');
}
//------------------------------------------------------------
void TDViaParser::RepinLineNumberBase()
{
    // As the parser moves through the string the line number is periodically calculated
    // It is not managed token by token.
    _lineNumberBase = CalcCurrentLine();
    _originalStart = _string.Begin();
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseType()
{
    TypeManagerScope scope(this->_typeManager);

    TypeRef pType = null;
    
    SubString  typeFunction;
    _string.ReadToken(&typeFunction);
    
    if (typeFunction.ComparePrefixCStr(tsNamedTypeToken)) {
        char dot;
        typeFunction.ReadRawChar(&dot);
        
        pType = _typeManager->FindType(&typeFunction);
        if (!pType) {
            LOG_EVENTV(kSoftDataError,"Unrecognized data type '%.*s'", FMT_LEN_BEGIN(&typeFunction));
            pType = BadType();
        }
    } else if (typeFunction.CompareCStr(tsBitClusterTypeToken)) {
        pType = ParseBitCluster();
    } else if (typeFunction.CompareCStr(tsClusterTypeToken)) {
        pType = ParseCluster();
    } else if (typeFunction.CompareCStr(tsParamBlockToken)) {
        pType = ParseParamBlock();
    } else if (typeFunction.CompareCStr(tsBitBlockTypeToken)) {
        pType = ParseBitBlock();
    } else if (typeFunction.CompareCStr(tsArrayToken)) {
        pType = ParseArray();
    } else if (typeFunction.CompareCStr(tsDefaultValueToken)) {
        pType = ParseDefaultValue(false);
    } else if (typeFunction.CompareCStr(tsVarValueToken)) {
        pType = ParseDefaultValue(true);
    } else if (typeFunction.CompareCStr(tsEquivalenceToken)) {
        pType = ParseEquivalence();
    } else if (typeFunction.CompareCStr(tsPointerTypeToken)) {
        pType = ParsePointerType(false);
    } else {
#if defined(VIREO_TYPE_CONSTRUCTION)
        // Call a type function directly
#endif
        LOG_EVENTV(kHardDataError, "Unrecognized type primitive '%.*s'",  FMT_LEN_BEGIN(&typeFunction));
    }

    if (_string.ReadChar('<')) {
        FixedCArray<TypeRef, ClumpParseState::kMaxArguments> templateParameters;
        for(int i = 0; !_string.ReadChar('>'); i++) {
            templateParameters.Append(ParseType());
        }
        pType = InstantiateTypeTemplate(_typeManager,  pType, &templateParameters);
    }
    
    return pType;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseBitCluster()
{
    TypeRef elementTypes[1000];  //TODO enforce limits or make them dynamic
    ClusterAlignmentCalculator calc(_typeManager);
    ParseAggregateElementList(elementTypes, &calc);
    return BitClusterType::New(_typeManager, elementTypes, calc.ElementCount);
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseCluster()
{
    TypeRef elementTypes[1000];   //TODO enforce limits or make them dynamic
    ClusterAlignmentCalculator calc(_typeManager);
    ParseAggregateElementList(elementTypes, &calc);
    return ClusterType::New(_typeManager, elementTypes, calc.ElementCount);
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseEquivalence()
{
    TypeRef elementTypes[1000];   //TODO enforce limits or make them dynamic
    EquivalenceAlignmentCalculator calc(_typeManager);
    ParseAggregateElementList(elementTypes, &calc);
    return EquivalenceType::New(_typeManager, elementTypes, calc.ElementCount);
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseParamBlock()
{
    TypeRef elementTypes[1000];   //TODO enforce limits or make them dynamic
    ParamBlockAlignmentCalculator calc(_typeManager);
    ParseAggregateElementList(elementTypes, &calc);
    return ParamBlockType::New(_typeManager, elementTypes, calc.ElementCount);
}
//------------------------------------------------------------
void TDViaParser::ParseAggregateElementList(TypeRef ElementTypes[], AggregateAlignmentCalculator* calculator)
{
    SubString  token;
    SubString  fieldName;
    UsageTypeEnum  usageType;
    
    _string.ReadToken(&token);
    
    if (!token.CompareCStr("("))
        return LOG_EVENT(kHardDataError, "'(' missing");
    
    _string.ReadToken(&token);
    while (!token.CompareCStr(")")) {
        
        if (token.CompareCStr(tsElementToken)) {
            usageType = kUsageTypeSimple;
        } else if (token.CompareCStr(tsInputParamToken)) {
            usageType = kUsageTypeInput;
        } else if (token.CompareCStr(tsOutputParamToken)) {
            usageType = kUsageTypeOutput;
        } else if (token.CompareCStr(tsInputOutputParamToken)) {
            usageType = kUsageTypeInputOutput;
        } else if (token.CompareCStr(tsStaticParamToken)) {
            usageType = kUsageTypeStatic;
        } else if (token.CompareCStr(tsTempParamToken)) {
            usageType = kUsageTypeTemp;
        } else if (token.CompareCStr(tsImmediateParamToken)) {
            usageType = kUsageTypeTemp;
        } else if (token.CompareCStr(tsAliasToken)) {
            usageType = kUsageTypeAlias;
        } else {
            return  LOG_EVENTV(kSoftDataError,"Unrecognized element type '%.*s'",  FMT_LEN_BEGIN(&token));
        }
        
        if (!_string.ReadChar('('))
            return  LOG_EVENT(kHardDataError, "'(' missing");
        
        TypeRef subType = ParseType();
        
        // If not found put BadType from this TypeManger in its place
        // Null's can be returned from type functions but should not be
        // embedded in the data structures.
        if (subType == null)
            subType = BadType();

        _string.ReadToken(&token);

        // See if there is a field name.
        if (token.CompareCStr(")")) {
            // no field name
            fieldName.AliasAssign(null, null);
        } else {
            fieldName.AliasAssign(&token);
            _string.ReadToken(&token);
            if (!token.CompareCStr(")"))
                return  LOG_EVENT(kHardDataError, "')' missing");
        }

        Int32 offset = calculator->AlignNextElement(subType);
        ElementType* element = ElementType::New(_typeManager, &fieldName, subType, usageType, offset);
        ElementTypes[calculator->ElementCount-1] = element;
    
        _string.ReadToken(&token);
    }
    
    if (!token.CompareCStr(")"))
        return  LOG_EVENT(kHardDataError, "')' missing");
    
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseArray()
{
    SubString token;
    IntIndex  rank=0;
    ArrayDimensionVector  dimensionLengths;
        
    if (!_string.ReadChar('('))
        return BadType();
    
    TypeRef elementType = ParseType();
    
    _string.ReadToken(&token);
    while (!token.CompareCStr(")")) {
        
        IntIndex dimensionLength;
        if (!token.ReadMetaInt(&dimensionLength)) {
            LOG_EVENTV(kHardDataError, "Invalid array dimension '%.*s'",  FMT_LEN_BEGIN(&token));
            return BadType();
        }

        if (rank >= kArrayMaxRank) {
            LOG_EVENT(kSoftDataError, "Too many dimensions");
        } else {
            dimensionLengths[rank] = (IntIndex) dimensionLength;
        }
        
        rank++;
        
        _string.ReadToken(&token);
    }
    
    ArrayType  *array = ArrayType::New(_typeManager, elementType, rank, dimensionLengths);
    return array;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseBitBlock()
{
    IntIndex    length;
    SubString   lengthToken;
    SubString encoding;
    
    if (!_string.ReadChar('('))
        return BadType();
    
    if (!_string.ReadToken(&lengthToken))
        return BadType();
    
    if (lengthToken.CompareCStr(tsHostPointerSize)) {
        length = _typeManager->HostPointerToAQSize() * _typeManager->AQBitLength();
    } else if (!lengthToken.ReadMetaInt(&length)) {
            return BadType();        
    }
    
    if (!_string.ReadToken(&encoding))
        return BadType();
    
    if (!_string.ReadChar(')'))
        return BadType();
    
    EncodingEnum enc = ParseEncoding(&encoding);
    BitBlockType *type = BitBlockType::New(_typeManager, length, enc);
    return type;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParsePointerType(Boolean shortNotation)
{
    if (!shortNotation)
    {
        if (!_string.ReadChar('('))
            return BadType();
    }
    
    TypeRef subType = ParseType();
    PointerType *pointer = PointerType::New(_typeManager, subType);

    if (!shortNotation)
    {
        if (!_string.ReadChar(')'))
            return BadType();
    }
    return pointer;
}
//------------------------------------------------------------
EncodingEnum TDViaParser::ParseEncoding(SubString *string)
{
    EncodingEnum enc = kEncoding_None;
    if (string->CompareCStr(tsBoolean)) {
        enc = kEncoding_Boolean ;
    } else if (string->CompareCStr(tsIEEE754Binary)) {
        enc = kEncoding_IEEE754Binary;
    } else if (string->CompareCStr(tsUInt)) {
        enc = kEncoding_UInt;
    } else if (string->CompareCStr(tsSInt)) {
        enc = kEncoding_SInt;
    } else if (string->CompareCStr(tsFixedPoint)) {
        enc = kEncoding_Q;
    } else if (string->CompareCStr(ts1plusFractional)) {
        enc = kEncoding_Q1;
    } else if (string->CompareCStr(tsIntBiased)) {
        enc = kEncoding_IntBiased;
    } else if (string->CompareCStr(tsInt1sCompliment)) {
        enc = kEncoding_Int1sCompliment;
    } else if (string->CompareCStr(tsAscii)) {
        enc = kEncoding_Ascii;
    } else if (string->CompareCStr(tsBits)) {
        enc = kEncoding_Bits;
    } else if (string->CompareCStr(tsUnicode)) {
        enc = kEncoding_Unicode;
    } else if (string->CompareCStr(tsGeneric)) {
        enc = kEncoding_Generic;
    } else if (string->CompareCStr(tsPointer)) {
        enc = kEncoding_Pointer ;
    }
    return enc;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseDefaultValue(Boolean mutableValue)
{
    //  syntax:   dv ( type value )

    if (!_string.ReadChar('('))
        return BadType();
    
    TypeRef subType = ParseType();
    DefaultValueType *cdt = DefaultValueType::New(_typeManager, subType, mutableValue);
    
    // The initializer value is optional, so check to see there is something
    // other than a closing paren.
    
    _string.EatLeadingSpaces();
    if (!_string.ComparePrefixCStr(")")) {
        ParseData(subType, cdt->Begin(kPAInit));
    }

    // Simple constants can resolved to a unique instance.
    // Perhaps even deeper constant values, let the type system figure it out.
    cdt = cdt->FinalizeConstant();
    
    if (!_string.ReadChar(')'))
        return BadType();
    
    return cdt;
}
//------------------------------------------------------------
void TDViaParser::PreParseElements(Int32 rank, ArrayDimensionVector dimensionLengths)
{
    SubString  token;
    SubString  tempString(_string);
    
    // Figure out how many initializers there are. The rank parameter
    // indicates how many levels are realated to the type being parsed
    // nesting deeper than that is assumed to be part of a deeper type
    // such as a cluster or nested array.
    
    Int32 depth = 0;
    
    ArrayDimensionVector tempDimensionLengths;
    for (Int32 i = 0; i < kArrayMaxRank; i++) {
        dimensionLengths[i] = 0;
        tempDimensionLengths[i] = 0;
        }

    // The opening "(" has been parsed before this function has been called.
    Int32 dimIndex;
    while (depth >= 0) {
        dimIndex = (rank - depth) - 1;

        tempString.ReadToken(&token);
        if (token.CompareCStr("(")) {
            if (dimIndex >= 0)
                tempDimensionLengths[dimIndex]++;
    
            depth++;
        } else if (token.CompareCStr(")")) {
            // When popping out, store the max size for the current level.
            if (dimIndex >= 0) {
                // If the inner dimension is larger than processed before record the larger number
                if (tempDimensionLengths[dimIndex] > dimensionLengths[dimIndex])
                    dimensionLengths[dimIndex] = tempDimensionLengths[dimIndex];

                // Reset the temp counter for this level in case its used again.
                tempDimensionLengths[dimIndex] = 0;
            }
            depth--;
        } else {
            if (dimIndex >= 0)
                tempDimensionLengths[dimIndex]++;
        }
    }
}
//------------------------------------------------------------
void TDViaParser::ParseArrayData(TypedArrayCoreRef pArray, void* pFirstEltInSlice, Int32 level)
{
    VIREO_ASSERT(pArray != null);
    TypeRef type = pArray->Type();
    TypeRef arrayElementType = pArray->ElementType();
    
    Int32 rank = type->Rank();
    
    if (rank >= 1) {
        // Read one token; it should either be a '(' indicating a collection
        // or an alternate array expression such as a string.
        SubString  token;
        TokenTraits tokenTrait = _string.ReadValueToken(&token, TokenTraits_Any);

        if ((rank == 1) && ((tokenTrait & TokenTraits_DoubleQuotedString) || (tokenTrait & TokenTraits_SingleQuotedString))) {
            // First option, if it is the inner most dimension, and the initializer is a string then that is OK
            token.TrimQuotedString();
            const Utf8Char *pBegin = token.Begin();
            Int32 charCount = token.Length();
            
            // TODO this could be cleaned up a bit, actually do Utf8 conversions etc.
            // If escapes are in the string then allow for them as well.
            if (tokenTrait & TokenTraits_EscapeSequences) {
                charCount = token.LengthAferProcessingEscapes();
                // Copy/convert into array
                pArray->Resize1D(charCount);
                if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Ascii) {
                    token.ProcessEscapes((char*)pArray->RawBegin(), (char*)pArray->RawBegin());
                } else if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Unicode) {
                    token.ProcessEscapes((char*)pArray->RawBegin(), (char*)pArray->RawBegin());
                }
            } else {
                // Copy/convert into array
                pArray->Resize1D(charCount);
                // TODO a bit simplistic right now.
                if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Ascii) {
                    // TODO convert from Utf8 to ASCII, map chars that do not fit to something.
                    memcpy(pArray->RawBegin(), pBegin, charCount);
                } else if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Unicode) {
                    // move Utf8 strings
                    memcpy(pArray->RawBegin(), pBegin, charCount);
                }
            }
        } else if (token.CompareCStr("(")) {
            // Second option, it is a list of values.
            // If one or more dimension lengths are variable then the outer most dimension
            // preflights the parsing so the overall storage can be allocated.
            // Note that if the type is fixed or bounded the storage has already
            // been allocated, though for bounded this will still set the logical size.
                        
            if (level == 0) {
                ArrayDimensionVector initializerDimensionLengths;
                
                PreParseElements(rank, initializerDimensionLengths);

                // Resize the array to the degree possible to match initializers
                // if some of the dimensions are bounded or fixed that may impact
                // any changes, but logical  dims can change.
                pArray->ResizeDimensions(rank, initializerDimensionLengths, false);
                
                VIREO_ASSERT(pFirstEltInSlice == null);
                pFirstEltInSlice = pArray->RawBegin();
            }
 
            // Get the dim lengths and slabs for tha actual array, not its
            // reference type. The reference type may indicate variable size
            // but the actaul array will always have a specific size.
            IntIndex* pLengths = pArray->GetDimensionLengths();
            IntIndex* pSlabs = pArray->GetSlabLengths();

            // Now that the Array is the right size, parse the initializers storing
            // as many as there is room for. Log a warning if extras are found.
            Int32 dimIndex = rank - level - 1;
            IntIndex step = pSlabs[dimIndex];
            Int32 length = pLengths[dimIndex];

            IntIndex elementCount = 0;
            Boolean bExtraInitializersFound = false;
            AQBlock1* pEltData = (AQBlock1*) pFirstEltInSlice;
            
            while (!_string.ReadChar(')') && (_string.Length() > 0) ) {
                // Only read as many elements as there was room allocated for,
                // ignore extra ones.
                
                void* pElement = elementCount < length ? pEltData : null;
                if (pElement == null) {
                    bExtraInitializersFound = true;
                }
                if (dimIndex == 0) {
                    // For the inner most dimension parse using element type.
                    ParseData(arrayElementType, pElement);
                } else {
                    // For nested dimensions just parse the next inner dimension using the array type.
                    ParseArrayData(pArray, pElement, level + 1);
                }
                
                if (pFirstEltInSlice) {
                    pEltData += step;
                }
                elementCount++;
            }
            
            if (bExtraInitializersFound) {
                LOG_EVENT(kWarning, "Ignoring extra array initializer elements");
            }
        } else {
            return LOG_EVENT(kHardDataError, "'(' missing");
        }
    } else if (rank == 0) {
        // For Zero-D arrays there are no parens, just parse the element
        AQBlock1* pArrayData = (AQBlock1*) pArray->RawBegin();
        ParseData(arrayElementType, pArrayData);
    }
}
//------------------------------------------------------------
// ParseData - parse a value from the string based on the type
// If the text makes sense then kNIError_Success is returned.
// If pData is Null then only the syntax check is done.
void TDViaParser::ParseData(TypeRef type, void* pData)
{
    static const SubString strVI(VI_TypeName);

    if (type->IsA(&strVI)) {
        return ParseVirtualInstrument(type, pData);
    }
                               
    Int32 aqSize = type->TopAQSize();
    EncodingEnum encoding = type->BitEncoding();
    SubString  token;
    switch (encoding) {
        case kEncoding_Array:
            return ParseArrayData(*(TypedArrayCoreRef*) pData, null, 0);
            break;
      //case kEncoding_Int1sCompliment:
        case kEncoding_UInt:
        case kEncoding_SInt:
            {
                IntMax value = 0;
                Boolean readSuccess = _string.ReadInt(&value);
                if (!readSuccess) {
                    // The token didn't look like a number, so consume it anyway and
                    // Log an error.
                    SubString tempToken;
                    _string.ReadSubexpressionToken(&tempToken);
                    return LOG_EVENT(kSoftDataError, "Data encoding not formatted correctly");
                    }

                if (!pData)
                    return; // If no where to put the parsed data, then all is done.
                
                if (WriteIntToMemory(encoding, aqSize, pData, value) != kNIError_Success)
                    LOG_EVENT(kSoftDataError, "Data int size not suported");

            }
            break;
        case kEncoding_Boolean:
            {
                _string.ReadValueToken(&token, TokenTraits_Any);
                Boolean value = false;
                if (token.CompareCStr("t") || token.CompareCStr("true")) {
                    value = true;
                } else if (token.CompareCStr("f") || token.CompareCStr("false")) {
                    value = false;
                } else {
                    return LOG_EVENT(kSoftDataError, "Data boolean value syntax error");
                }
                if (!pData)
                    return;
                
                if (aqSize==1) {
                    *(AQBlock1*)pData = value;
                } else {
                    return LOG_EVENT(kSoftDataError, "Data boolean size greater than 1");
                }
            }
            break;
        case kEncoding_IEEE754Binary:
            {
                _string.ReadValueToken(&token, TokenTraits_Any);
                Double value = 0.0;
                Boolean readSuccess = token.ParseDouble(&value);
                if (!readSuccess)
                    return LOG_EVENT(kSoftDataError, "Data IEEE754 syntax error");
                if (!pData)
                    return; // If no where to put the parsed data, then all is done.
                
                if (WriteDoubleToMemory(kEncoding_IEEE754Binary, aqSize, pData, value) != kNIError_Success)
                    LOG_EVENT(kSoftDataError, "Data IEEE754 size not supported");
                
                // TODO support 16 bit reals? 128 bit reals? those are defined by IEEE754
            }
            break;
        case kEncoding_Ascii:
        case kEncoding_Unicode:
            _string.ReadValueToken(&token, TokenTraits_Any);
            token.TrimQuotedString();
            if (aqSize == 1 && token.Length() >= 1) {
                *(Utf8Char*)pData = *token.Begin();
            } else {
                LOG_EVENT(kSoftDataError, "Scalar that is unicode");
                // TODO support escaped chars, more error checking
            }
            break;
        case kEncoding_Enum:
            //TODO some fun work here.
            break;
        case kEncoding_None:
            //TODO any thing to do ? value for empty cluster, how
            break;
        case kEncoding_Pointer:
            {
                // TODO this is not really flat.
                static SubString strTypeType(tsTypeType);
                static SubString strExecutionContextType(tsExecutionContextType);
                if (type->IsA(&strTypeType)) {
                    if (pData) {
                        *(TypeRef*)pData = this->ParseType();
                    } else {
                        this->ParseType(); // TODO if preflight its read and lost
                    }
                    return;
                } else if (type->IsA(&strExecutionContextType)) {
                    _string.ReadToken(&token);
                    if (token.CompareCStr(tsWildCard)) {
                        // If a generic is specified then the default for the type should be
                        // used. For some pointer types this may be a process or thread global, etc.
                        // TODO this is at too low a level, it could be done at
                        // a higher level.
                        *(ExecutionContextRef*)pData = THREAD_EXEC();
                        return;
                    }
                }
                SubString typeName = type->GetName();
                LOG_EVENTV(kHardDataError, "Parsing pointer type '%.*s'", FMT_LEN_BEGIN(&typeName));
            }
            break;
        case kEncoding_Cluster:
            {
            SubString  token;
            _string.ReadValueToken(&token, TokenTraits_Any);
            if (token.CompareCStr("(")) {
                // List of values (a b c)
                AQBlock1* baseOffset = (AQBlock1*)pData;
                int i = 0;
                while (!_string.ReadChar(')') && (_string.Length() > 0) && (i < type->SubElementCount())) {
                    TypeRef elementType = type->GetSubElement(i);
                    void* elementData = baseOffset;
                    if (elementData != null)
                        elementData = baseOffset + elementType->ElementOffset();
                    ParseData(elementType, elementData);
                    i++;
                }
            }
            }
            break;
        default:
            LOG_EVENT(kHardDataError, "No parser for data type's encoding");
            break;
    }
}
//------------------------------------------------------------
// VirtualInstruments have their own parser since the defining components
// abstracted from the internal implementation. For example the parameter block
// and the private data space are described as clusters, yet when the VI is
// created these may stored as two objects, or merged into one.
// Same for instruction lists, they could ultimately be modelled as a more generic
// data type, but for now they are unique to VIs
//
// When a VI is first parsed two things have to be done in the first pass.
// 1. The the root type for the VI must be defined with the initial copy of the
// params and locals.
// 2. The initial clump must be set-up. This is the clump that callers will
// point to.
// for reentrant VIs each caller  will get its own copy of the VI.
// this means each reference generates its own copy. Who knows about all the copies?
// perhaps no one at first. each call site, and each instance is a new type derived from the original?
void TDViaParser::ParseVirtualInstrument(TypeRef viType, void* pData)
{
    SubString token;
    
    if (_string.ComparePrefixCStr(tsNamedTypeToken)) {
        // This is a VI that inherits from an existing VI type./
        // This may be used for explicit clones of VIs
        LOG_EVENT(kSoftDataError, "Referring to an already existing type");
        TypeRef pType = ParseType();
        viType->CopyData(pType->Begin(kPARead), pData);
    }
    
    // Read the VIs value
    _string.ReadToken(&token);
    if (!token.CompareCStr("(")) {
        return LOG_EVENT(kHardDataError, "'(' missing");
    }
        
    TypeRef emptyVIParamList =  _typeManager->FindType("EmptyParameterList");
    TypeRef paramsType = emptyVIParamList;
    TypeRef localsType = emptyVIParamList;
    
    SubString name;
    Boolean hasName = _string.ReadNameToken(&name);
    if (hasName) {
        while (hasName) {
            // An initial experiment for named fields in a VI
            TypeRef type = this->ParseType();
            if (name.CompareCStr("Locals")) {
                localsType = type;
            } else if (name.CompareCStr("Params")) {
                paramsType = type;
            } else {
                LOG_EVENTV(kSoftDataError, "Field does not exist '%.*s'", FMT_LEN_BEGIN(&name));
            }
            hasName = _string.ReadNameToken(&name);
        }
    } else {
    TypeRef type1 = this->ParseType();

        // Old school way of loading VIs
    _string.EatLeadingSpaces();
    
    if (_string.ComparePrefixCStr("c") && !_string.ComparePrefixCStr("clump")) {
        // If there are two clusters the first was actually the parameter block,
        // The next will be the data space
            paramsType = type1;
            localsType = this->ParseType();
    } else {
            localsType = type1;
        }
    }
    VIREO_ASSERT(paramsType != null)
    VIREO_ASSERT(localsType != null)
    
    _string.EatLeadingSpaces();
    if (!_string.ComparePrefixCStr("clump")) {
        return LOG_EVENT(kHardDataError, "Expected 'clump' expression");
    }

    // Scan though the clumps to count them and to find the SubString that
    // Holds all of them. In binary format it would be much simpler since a count would
    // always proceed the set.
    Int32 actualClumpCount = 0;
    Int32 lineNumberBase = CalcCurrentLine();
    const Utf8Char* beginClumpSource = _string.Begin();
    const Utf8Char* endClumpSource = null;
    
    while (true) {
        PreParseClump(null);
        actualClumpCount++;
        if (_pLog->HardErrorCount()>0)
            return;
        
        endClumpSource = _string.Begin();
        if (_string.ReadChar(')')) {
            break;
        }
    }
    
    // Preliminary initialization has already been done.
    // from the generic VirtualInstrument definition.
    VirtualInstrumentObjectRef vio = *(VirtualInstrumentObjectRef*)pData;
    VirtualInstrument *vi = vio->ObjBegin();
    SubString clumpSource(beginClumpSource, endClumpSource);
    
    vi->Init(ExecutionContextScope::Current(), (Int32)actualClumpCount, paramsType, localsType, lineNumberBase, &clumpSource);
    
    if (_loadVIsImmediatly) {
        TDViaParser::FinalizeVILoad(vi, _pLog);
    }
    // The clumps code will be loaded once the module is finalized.
}
//------------------------------------------------------------
void TDViaParser::FinalizeVILoad(VirtualInstrument* vi, EventLog* pLog)
{
    SubString clumpSource = vi->_clumpSource;
    
    VIClump *pClump = vi->Clumps()->Begin();
    VIClump *pClumpEnd = vi->Clumps()->End();

    if (pClump && pClump->_codeStart == null) {
        InstructionAllocator cia;
        
        {
            // (1) Parse, but don't create any instrucitons, determine how much memory is needed.
            // Errors are ignored in this pass.
#ifdef VIREO_USING_ASSERTS
            //  Int32 startingAllocations = vi->OwningContext()->TheTypeManager()->_totalAllocations;
#endif
            EventLog dummyLog(EventLog::DevNull);
            TDViaParser parser(vi->OwningContext()->TheTypeManager(), &clumpSource, &dummyLog, vi->_lineNumberBase);
            for (; pClump < pClumpEnd; pClump++) {
                parser.ParseClump(pClump, &cia);
            }
#ifdef VIREO_USING_ASSERTS
            // The frist pass should just calculate the size needed. If any allocations occured then
            // there is a problem.
            // Int32 endingAllocations = vi->OwningContext()->TheTypeManager()->_totalAllocations;
            // VIREO_ASSERT(startingAllocations == endingAllocations)
#endif
        }
        
        // (2) Allocate a chunk for instructions to come out of.
        pClump = vi->Clumps()->Begin();
        cia.Allocate(pClump->TheTypeManager());
        
        {
            // (3) Parse a second time, instrucitons will be allocated out of the chunk.
            TDViaParser parser(vi->OwningContext()->TheTypeManager(), &clumpSource, pLog, vi->_lineNumberBase);
            for (; pClump < pClumpEnd; pClump++) {
                parser.ParseClump(pClump, &cia);
            }
        }
        VIREO_ASSERT(cia._size == 0);
    }
}
//------------------------------------------------------------
void TDViaParser::PreParseClump(VIClump* viClump)
{
    SubString  token;

    _string.ReadToken(&token);
    if (!token.CompareCStr(tsClumpToken))
        return LOG_EVENT(kHardDataError, "'clump' missing");
    
    if (!_string.ReadChar('('))
        return LOG_EVENT(kHardDataError, "'(' missing");

    SubString temp = _string;
    temp.ReadToken(&token);
    IntMax fireCount;
    if (token.ReadInt(&fireCount)) {
        // Old style firecount number found,  update _string
        _string = temp;
    } else {
        // No old style firecount number, leave _string as is.
    }
    
    // Quickly scan through list of instructions without parsing them in detail.
    // Many syntax errors will not be detected until the code is actually loaded.
    Boolean tokenFound = true;
    do {
        // Read the function name.
        tokenFound = _string.ReadToken(&token);
        
        // If there is none, all is done.
        if (token.CompareCStr(")")) {
            break;
        } else {
            // Read its arguments.
            tokenFound = _string.ReadSubexpressionToken(&token);
        }
    } while (tokenFound);
}
//------------------------------------------------------------
void TDViaParser::ParseClump(VIClump* viClump, InstructionAllocator* cia)
{
    ClumpParseState state(viClump, cia, _pLog);
    SubString  token;
    SubString  instructionNameToken;
    SubString  argExpressionTokens[ClumpParseState::kMaxArguments];
    
    _string.ReadToken(&token);
    if (!token.CompareCStr(tsClumpToken))
        return LOG_EVENT(kHardDataError, "'clump' missing");

    if (!_string.ReadChar('('))
        return LOG_EVENT(kHardDataError, "'(' missing");
    

    // Read first instruction, or firecount. If no instruction then the closing paren
    // of the clump will be found immediately
    _string.ReadToken(&token);
    IntMax fireCount = 1;
    if (token.ReadInt(&fireCount)) {
        _string.ReadToken(&instructionNameToken);
    } else if (token.CompareCStr(tsFireCountOpToken)) {
        if (!_string.ReadChar('('))
            return LOG_EVENT(kHardDataError, "'(' missing");

        _string.ReadToken(&token);
        if(!token.ReadInt(&fireCount)) {
            return LOG_EVENT(kHardDataError, "fire count error");
        }

        instructionNameToken = token;
        if (!_string.ReadChar(')'))
            return LOG_EVENT(kHardDataError, "')' missing");

        _string.ReadToken(&instructionNameToken);
    } else {
        // Using default FireCount(1). Treat token as regulat instruction.
        fireCount = 1;
        instructionNameToken = token;
    }
    
    state.SetClumpFireCount((Int32)fireCount);
    state.StartSnippet(&viClump->_codeStart);

    while(!instructionNameToken.CompareCStr(")")) {
        RepinLineNumberBase();

        if (instructionNameToken.CompareCStr(tsPerchOpToken)) {
            // Perch instructions are only anchor points
            // for branches to target. They are addressed by
            // their index. First one is perch number 0 , etc
            if (!_string.ReadChar('('))
                return LOG_EVENT(kHardDataError, "'(' missing");
            SubString perchName;
            if (!_string.ReadToken(&perchName))
                return LOG_EVENT(kHardDataError, "perch label error");
            if (!_string.ReadChar(')'))
                return LOG_EVENT(kHardDataError, "')' missing");
            state.MarkPerch(&perchName);
        } else {
            Boolean keepTrying = state.StartInstruction(&instructionNameToken) != null;
            if (!keepTrying)
                LOG_EVENTV(kSoftDataError, "Function not found '%.*s'", FMT_LEN_BEGIN(&instructionNameToken));

            // Starting reading actual parameters
            if (!_string.ReadChar('('))
                return LOG_EVENT(kHardDataError, "'(' missing");
            
            // Parse the arguments once and determine how many were passed to the function.
            Int32 argCount = 0;
            for(; true; argCount++) {
                _string.ReadSubexpressionToken(&token);
                if (token.Length() == 0 || token.CompareCStr(")")) {
                    break;
                } else if (argCount < ClumpParseState::kMaxArguments) {
                    argExpressionTokens[argCount] = token;
                }
            }
            
            if (argCount > ClumpParseState::kMaxArguments) {
                return LOG_EVENT(kHardDataError, "too many argumnets");
            }
            
            while(keepTrying) {
                for(Int32 i = 0; (i < argCount) && keepTrying; i++) {
                    token = argExpressionTokens[i];
                    TypeRef formalType  = state.ReadFormalParameterType();
                    state._actualArgumentName = token;
                    if (formalType) {
                        // TODO the type classification can be moved into a codec independent class.
                        SubString formalParameterTypeName = formalType->GetName();
                        
                        if (formalParameterTypeName.CompareCStr("VarArgCount")) {
                            VIREO_ASSERT(!state.VarArgParameterDetected());                    
                            state.AddVarArgCount();
                            // If the formal type is "VarArgCount"
                            // restart processing current argument, its the first vararg
                            i--;
                            continue;
                        }                
                    
                        if (formalParameterTypeName.CompareCStr("BranchTarget")) {  // un adorned number, 10p
                            state.AddBranchTargetArgument(&token);
                        } else if (formalParameterTypeName.CompareCStr("Clump")) {  // this is a simple integer, perhaps it should be adorned.
                            state.AddClumpTargetArgument(&token);
                        } else if (formalParameterTypeName.CompareCStr("StaticTypeAndData")) {
                            state.AddDataTargetArgument(&token, true);
                        } else {
                            // The most common case is a data value
                            state.AddDataTargetArgument(&token, false); // For starters
                        }
                    }
                    if (state.LastArgumentError()) {
                        // If there is an argument mismatch stop.
                        keepTrying = false;
                        if (!state.HasMultipleDefinitions()) {
                            // if there is only one match then show the specific error.
                            // other wise "no match found" will be the error.
                            state.LogArgumentProcessing(CalcCurrentLine());
                        }
                    }
                }
                if (keepTrying) {
                    // If there were no arg mismatches then one was found.
                    keepTrying = false;
                } else {
                    // Else see if there is another overload to try.
                    keepTrying = state.StartNextOverload() != null;
                }
            }
            state.EmitInstruction();
        }
        _string.ReadToken(&instructionNameToken);

#if 0         
        if (instructionNameToken.CompareCStr(",")) {
            _string.ReadToken(&instructionNameToken);
        }
#endif
    }
    state.CommitClump();

    if (!instructionNameToken.CompareCStr(")"))
        return LOG_EVENT(kHardDataError, "')' missing");
}
//------------------------------------------------------------
void TDViaParser::FinalizeModuleLoad(TypeManagerRef tm, EventLog* pLog)
{
    static SubString strVIType("VirtualInstrument");
    // Once a module has been loaded sweep through all VIs and
    // And load the clumps. The two pass load is a simple way to allow for forward definitions.
    // The clumps will have been allocated, but the threaded code will not have been created.
    
    // When VIs are loaded additional types may be created. If so, the
    // new types will be added to the front of the list. The loop will repeat until
    // no types have been added. In the worse case this happens when the context runs
    // out of memory and can't allocate any more types.
    
    TypeRef typeEnd = null;
    TypeRef typeList = tm->TypeList();

    while (true) {
        TypeRef type = typeList;
        while (type != typeEnd) {
            if (type->HasCustomDefault() && type->IsA(&strVIType)) {
                TypedArrayCoreRef *pObj = (TypedArrayCoreRef*) type->Begin(kPARead);
                VirtualInstrument *vi  = (VirtualInstrument*) (*pObj)->RawObj();
                TDViaParser::FinalizeVILoad(vi, pLog);
            }
            type = type->Next();
        }
        
        // If nothing has been added the head of the list will be the same.
        if (tm->TypeList() == typeList)
            break;
        
        // Loop again and process new definitions.
        // Initial case it reentrant VIs
        typeEnd = typeList;
        typeList = tm->TypeList();
    }
}
#endif
//------------------------------------------------------------
//------------------------------------------------------------
#if defined (VIREO_VIA_FORMATTER)
class TDViaFormatterTypeVisitor : public TypeVisitor
{
private:
    TDViaFormatter *_pFormatter;
public:
    TDViaFormatterTypeVisitor(TDViaFormatter* pFormatter)
    {
        _pFormatter = pFormatter;
    }
private:
    //------------------------------------------------------------
    virtual void VisitBad(TypeRef type)
    {
        _pFormatter->_string->AppendCStr("BadType");
    }
    //------------------------------------------------------------
    virtual void VisitBitBlock(BitBlockType* type)
    {
        _pFormatter->_string->AppendCStr("bb(");
        IntIndex length = type->BitLength();
        _pFormatter->FormatInt(kEncoding_MetaInt, sizeof(length), &length);
        _pFormatter->_string->Append(' ');
        _pFormatter->FormatEncoding(type->BitEncoding());
        _pFormatter->_string->Append(')');
    }
    //------------------------------------------------------------
    void VisitAggregate(TypeRef type, ConstCStr prefix)
    {
        _pFormatter->_string->AppendCStr(prefix);
        IntIndex subElementCount = type->SubElementCount();
        for (int i = 0; i < subElementCount; i++) {
            TypeRef subType = type->GetSubElement(i);
            subType->Accept(this);
        }
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    virtual void VisitBitCluster(BitClusterType* type)
    {
        VisitAggregate(type, "bc(");
    }
    //------------------------------------------------------------
    virtual void VisitCluster(ClusterType* type)
    {
        VisitAggregate(type, "c(");
    }
    //------------------------------------------------------------
    virtual void VisitParamBlock(ParamBlockType* type)
    {
        VisitAggregate(type, "p(");
    }
    //------------------------------------------------------------
    virtual void VisitEquivalence(EquivalenceType* type)
    {
        VisitAggregate(type, "eq(");
    }
    //------------------------------------------------------------
    virtual void VisitArray(ArrayType* type)
    {
        _pFormatter->_string->AppendCStr("a(");
        type->GetSubElement(0)->Accept(this);
        IntIndex* pDimension = type->GetDimensionLengths();

        for (Int32 rank = type->Rank(); rank>0; rank--) {
            _pFormatter->_string->Append(' ');
            _pFormatter->FormatInt(kEncoding_MetaInt, sizeof(IntIndex), pDimension++);
        }
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    virtual void VisitElement(ElementType* type)
    {
        _pFormatter->FormatElementUsageType(type->ElementUsageType());
        _pFormatter->_string->Append('(');
        type->BaseType()->Accept(this);
        SubString elementName = type->GetElementName();
        if (elementName.Length()>0) {
            // Add element name if it exists.
            _pFormatter->_string->Append(' ');
            _pFormatter->_string->Append(elementName.Length(),elementName.Begin());
        }
        _pFormatter->_string->Append(')');
    }
    //------------------------------------------------------------
    virtual void VisitNamed(NamedType* type)
    {
        // At this point names are terminal elements.
        // There needs to be a mechanism that will optionally collect all the named dependencies
        // in a type.
        SubString name = type->GetName();
        if (name.Length()>0 ) {
            _pFormatter->_string->Append('.');
            _pFormatter->_string->Append(name.Length(), (Utf8Char*)name.Begin());
            return;
        }
    }
    //------------------------------------------------------------
    virtual void VisitPointer(PointerType* type)
    {
        _pFormatter->_string->AppendCStr("^");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr("");
    }
    //------------------------------------------------------------
    virtual void VisitDefaultValue(DefaultValueType* type)
    {
        _pFormatter->_string->AppendCStr(type->IsMutableValue() ? "var(" : "dv(");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    virtual void VisitDefaultPointer(DefaultPointerType* type)
    {
        _pFormatter->_string->AppendCStr("dvp(");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    virtual void VisitCustomDataProc(CustomDataProcType* type)
    {
        _pFormatter->_string->AppendCStr("cdp(");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr(")");
    }
};
//------------------------------------------------------------
TDViaFormatter::TDViaFormatter(StringRef string, Boolean quoteOnTopString, Int32 fieldWidth)
{
    _string = string;
    _bQuoteStrings = quoteOnTopString;
    _fieldWidth = fieldWidth;
}
//------------------------------------------------------------
void TDViaFormatter::FormatEncoding(EncodingEnum value)
{
    ConstCStr str = null;
    switch(value)
    {
        case kEncoding_Boolean:         str = tsBoolean;        break;
        case kEncoding_UInt:            str = tsUInt;           break;
        case kEncoding_SInt:            str = tsSInt;           break;
        case kEncoding_Bits:            str = tsBits;           break;
        case kEncoding_Pointer:         str = tsPointer;        break;
        case kEncoding_IEEE754Binary:   str = tsIEEE754Binary;  break;
        case kEncoding_Ascii:           str = tsAscii;          break;
        default:                        str = "<TODO>";         break;
    }
    _string->AppendCStr(str);
}
//------------------------------------------------------------
void TDViaFormatter::FormatElementUsageType(UsageTypeEnum value)
{
    ConstCStr str = null;
    switch(value)
    {
        case kUsageTypeSimple:          str = tsElementToken;           break;
        case kUsageTypeInput:           str = tsInputParamToken;        break;
        case kUsageTypeOutput:          str = tsOutputParamToken;       break;
        case kUsageTypeInputOutput:     str = tsInputOutputParamToken;  break;
        case kUsageTypeStatic:          str = tsStaticParamToken;       break;
        case kUsageTypeTemp:            str = tsTempParamToken;         break;
        case kUsageTypeImmediate:       str = tsImmediateParamToken;    break;
        case kUsageTypeAlias:           str = tsAliasToken;             break;
        default:                        str = "<TODO>";                 break;
    }
    _string->AppendCStr(str);
}
//------------------------------------------------------------
void TDViaFormatter::FormatInt(EncodingEnum encoding, Int32 aqSize, void* pData)
{
    char buffer[kTempFormattingBufferSize];
    ConstCStr format = null;
    
    IntMax value;
    ReadIntFromMemory(encoding, aqSize, pData, &value);
    
    if (encoding == kEncoding_SInt) {
        format = "%*lld";
    } else if (encoding == kEncoding_UInt) {
        format = "%*llu";
    } else if (encoding == kEncoding_MetaInt) {
        if (value == kArrayVariableLengthSentinel) {
            format = tsWildCard;
        } else if (IsVariableLengthDim((IntIndex)value)) {
            value = value - kArrayVariableLengthSentinel - 1;
            format = tsTemplatePrefix "%*lld";
        } else {
            format = "%*lld";
        }
    } else {
        format = "**unsuported type**";
    }
    
    Int32 len = snprintf(buffer, sizeof(buffer), format, _fieldWidth, value);
    _string->Append(len, (Utf8Char*)buffer);
}
//------------------------------------------------------------
void TDViaFormatter::FormatIEEE754(EncodingEnum encoding, Int32 aqSize, void* pData)
{
    char buffer[kTempFormattingBufferSize];
	ConstCStr pBuff = buffer;

    Double value;
    ReadDoubleFromMemory(kEncoding_IEEE754Binary, aqSize, pData, &value);

	Int32 len;
    if (isnan(value)) {
#if 0
        // TODO unit tests are getting different -NaNs in different cases.
        if (signbit(value)) {
            pBuff = "-nan";
            len = 4;
        } else {
            pBuff = "nan";
            len = 3;
        }
#else
        pBuff = "nan";
        len = 3;
#endif
    } else if (isinf(value)) {
        if (value < 0) {
            pBuff = "-inf";
            len = 4;
        } else {
            pBuff = "inf";
            len = 3;
        }
    } else {
        len = snprintf(buffer, sizeof(buffer), "%G", value);
    }
    _string->Append(len, (Utf8Char*)pBuff);
}
//------------------------------------------------------------
void TDViaFormatter::FormatPointerData(TypeRef pointerType, void* pData)
{
    SubString name = pointerType->GetName();
    // For pointer types, they are opaque to runtime code.
    // So the dispatch is now directed based on the type.
    if (name.CompareCStr(tsTypeType)) {
        FormatType(*(TypeRef*) pData);
    } else {
        // For types that do not support serialization
        // serialize the pointer type and weather it is null or not
        _string->Append('^');
        _string->Append(name.Length(), (Utf8Char*)name.Begin());
        if ((*(size_t*)pData) == null) {
            _string->Append(5, (Utf8Char*)"_null");
        }
    }
}
//------------------------------------------------------------
void TDViaFormatter::FormatType(TypeRef type)
{
    if (type) {
        TDViaFormatterTypeVisitor visitor(this);
        type->Accept(&visitor);
    } else {
        _string->Append(4, (Utf8Char*)"null");
    }
}
//------------------------------------------------------------
void TDViaFormatter::FormatArrayData(TypeRef arrayType, TypedArrayCoreRef pArray, Int32 rank)
{
    TypeRef elementType = pArray->ElementType();
    EncodingEnum elementEncoding = elementType->BitEncoding();

    if (rank==1 && (elementEncoding == kEncoding_Ascii || (elementEncoding == kEncoding_Unicode))) {
        // Unicode + elt size == 1 => Utf8
        // not planning on doing UTF16, or 32 at this time
        // These encodings have a special format
        // TODO option for raw or escaped forms need to be covered, sometime in quotes
        if (_bQuoteStrings) {
            _string->Append('\'');
        }
        _string->Append(pArray->Length(), pArray->RawBegin());
        if (_bQuoteStrings) {
            _string->Append('\'');
        }
    } else if (rank > 0) {
        _bQuoteStrings = true;
        FormatArrayDataRecurse(elementType, rank, pArray->BeginAt(0),
                               pArray->GetDimensionLengths(),
                               pArray->GetSlabLengths());
    } else if (rank == 0) {
        FormatData(elementType, pArray->RawObj());
    }
}
//------------------------------------------------------------
void TDViaFormatter::FormatArrayDataRecurse(TypeRef elementType, Int32 rank, AQBlock1* pBegin,
    IntIndex *pDimLengths, IntIndex *pSlabLengths )
{
    rank = rank - 1;
    
    size_t   elementLength = pSlabLengths[rank];
    IntIndex dimensionLength = pDimLengths[rank];
    AQBlock1 *pElement = pBegin;

    Boolean bPastFirst = false;
    _string->Append('(');
    while (dimensionLength-- > 0) {
        if (bPastFirst) {
            _string->Append(' ');
        }
        if (rank == 0) {
            FormatData(elementType, pElement);
        } else {
            FormatArrayDataRecurse(elementType, rank, pElement, pDimLengths, pSlabLengths);
        }
        pElement += elementLength;
        bPastFirst = true;
    }
    _string->Append(')');
}
//------------------------------------------------------------
void TDViaFormatter::FormatClusterData(TypeRef type, void *pData)
{
    IntIndex count = type->SubElementCount();
    IntIndex i= 0;
    _bQuoteStrings = true;
    _string->Append('(');
    while (i < count) {
        if (i > 0) {
            _string->Append(' ');
        }
        TypeRef elementType = type->GetSubElement(i++);
        IntIndex offset = elementType->ElementOffset();
        AQBlock1* pElementData = (AQBlock1*)pData + offset;
        FormatData(elementType, pElementData);
    }
    _string->Append(')');
}
//------------------------------------------------------------
void TDViaFormatter::FormatData(TypeRef type, void *pData)
{
    char buffer[kTempFormattingBufferSize];
    
    EncodingEnum encoding = type->BitEncoding();
    
    switch (encoding) {
        case kEncoding_UInt:
        case kEncoding_SInt:
        case kEncoding_MetaInt:
            FormatInt(encoding, type->TopAQSize(), pData);
            break;
        case kEncoding_IEEE754Binary:
            FormatIEEE754(encoding, type->TopAQSize(), pData);
            break;
        case kEncoding_Pointer:
            FormatPointerData(type, pData);
            break;
        case kEncoding_Boolean:
            _string->Append((*(AQBlock1*) pData) ? 't' : 'f');
            break;
        case kEncoding_Generic:
            _string->Append('*');
            break;
        case kEncoding_Array:
            // For array and object types pass the array ref (e.g. handle)
            // not the pointer to it.
            FormatArrayData(type, *(TypedArrayCoreRef*)pData, type->Rank());
            break;
        case kEncoding_Cluster:
            FormatClusterData(type, pData);
            break;
        default:
            Int32 len = snprintf(buffer, sizeof(buffer), "***TODO pointer type");
            _string->Append(len, (Utf8Char*)buffer);
            break;
    }
}
//------------------------------------------------------------
struct FormatOptions {
    Boolean Valid;
    Boolean LeftJustify;
    Boolean ShowSign;           // + or - always
    Boolean SignPad;            // ' ' for positive '-' for negative
    Boolean BasePrefix;         // 0, 0x, or 0X
    Boolean ZeroPad;            // 00010
    Boolean VariablePrecision;
    char    FormatChar;         // my affect output 'x' or 'X'
    
    Int32   MinimumFieldWidth;  // If zero no padding
    Int32   Precision;
    SubString  FmtSubString;
};
//------------------------------------------------------------
void ReadPercentFormatOptions(SubString *format, FormatOptions *pOptions)
{
    // Derived on the specification found here.
    // http://www.cplusplus.com/reference/cstdio/printf/
    // There will be some allowances for LabVIEW and since
    // data is typed codes that identify type size like
    // (hh, ll j, z, r, and L) are not needed.
    
    pOptions->ShowSign = false;
    pOptions->LeftJustify = false;
    pOptions->ZeroPad = false;
    pOptions->BasePrefix = false;
    pOptions->SignPad = false;
    pOptions->VariablePrecision = false;
    pOptions->MinimumFieldWidth = 0;
    pOptions->Precision = 0;
    
    Boolean bPrecision = false;
    Boolean bValid = true;
    char c;
    const Utf8Char* pBegin = format->Begin();
    
    while (format->ReadRawChar(&c)) {
        
        if (strchr("diuoxXfFeEgGaAcsp%", c)) {
            pOptions->FormatChar = c;
            break;
        } if (c == '+') {
            pOptions->ShowSign = true;
        } else if (c == '-') {
            pOptions->LeftJustify = true;
        } else if (c == '0') {
            pOptions->ZeroPad = true;
        } else if (c == '#') {
            pOptions->BasePrefix = true;
        } else if (c == ' ') {
            pOptions->SignPad = true;
        } else if (c == '.') {
            bPrecision = true;
        } else if (bPrecision && c == '*') {
            pOptions->VariablePrecision = true;
        } else if (c >= '0' && c <= '9') {
            SubString numberString(format->Begin()-1, format->End());
            IntMax value = 0;
            if (numberString.ReadInt(&value)) {
                if (bPrecision) {
                    pOptions->Precision = (Int32) value;
                } else {
                    pOptions->MinimumFieldWidth = (Int32) value;
                }
            } else {
                bValid = false;
                break;
            }
        } else {
            bValid = false;
            break;
        }
    }
    pOptions->Valid = bValid;
    pOptions->FmtSubString.AliasAssign(pBegin, format->Begin());
}
//------------------------------------------------------------
void Format(SubString *format, Int32 count, StaticTypeAndData arguments[], StringRef buffer)
{
    IntIndex argumentIndex = 0;
    SubString f(format);            // Make a copy to use locally
    
    buffer->Resize1D(0);              // Clear buffer (wont do anything for fixed size)
    
    char c = 0;
    while (f.ReadRawChar(&c))
    {
        if (c == '\\' && f.ReadRawChar(&c)) {
            switch (c)
            {
                case 'n':       buffer->Append('\n');      break;
                case 'r':       buffer->Append('\r');      break;
                case 't':       buffer->Append('\t');      break;
                case 'b':       buffer->Append('\b');      break;
                case 'f':       buffer->Append('\f');      break;
                case 's':       buffer->Append(' ');       break;
                case '\\':      buffer->Append('\\');      break;
                default:  break;
            }
        } else if (c == '%') {
            FormatOptions fOptions;
            ReadPercentFormatOptions(&f, &fOptions);
            
            switch (fOptions.FormatChar)
            {
                case 'g': case 'G':
                case 'f': case 'F':
                case 'e': case 'E':
                case 'a': case 'A':
                {
                    // TODO don't assume data type. This just becomes the default format for real numbers, then use formatter
                    SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                    TempStackCString tempFormat(&percentFormat);
                    char asciiReplacementString[100];
                    //Get the numeric string that will replace the format string
                    Double tempDouble = *(Double*) (arguments[argumentIndex]._pData);
                    Int32 sizeOfNumericString = snprintf(asciiReplacementString, 100, tempFormat.BeginCStr(), tempDouble);
                    buffer->Append(sizeOfNumericString, (Utf8Char*)asciiReplacementString);
                    argumentIndex++;
                }
                break;
                case 'd':
                case 'o':
                case 'x': case 'X':
                {
                    // To cover the max range formats like %d ned to beturned into %lld                    
                    SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                    TempStackCString tempFormat((Utf8Char*)"%ll", 3);
                    tempFormat.Append(&fOptions.FmtSubString);
                    TempStackCString formattedNumber;
                    TypeRef argType = arguments[argumentIndex]._paramType;
                    IntMax intValue;
                    ReadIntFromMemory(argType->BitEncoding(), argType->TopAQSize(), arguments[argumentIndex]._pData, &intValue);
                    Int32 length = snprintf(formattedNumber.BeginCStr(), formattedNumber.Capacity(), tempFormat.BeginCStr(), intValue);
                    buffer->Append(length, (Utf8Char*)formattedNumber.Begin());
                    argumentIndex++;
                }
                break;
                case '%':      //%%
                buffer->Append('%');
                break;
                case 's':      //%s
                {
                    STACK_VAR(String, tempString);
                    TDViaFormatter formatter(tempString.Value, false);
                    formatter.FormatData(arguments[argumentIndex]._paramType, arguments[argumentIndex]._pData);
                    
                    Int32 extraPadding = fOptions.MinimumFieldWidth - tempString.Value->Length();
                    
                    if (fOptions.LeftJustify)
                    buffer->Append(tempString.Value);
                    if (extraPadding > 0) {
                        for (Int32 i = extraPadding; i >0; i--) {
                            buffer->Append(' ');
                        }
                    }
                    if (!fOptions.LeftJustify)
                    buffer->Append(tempString.Value);
                    
                    argumentIndex++;
                }
                break;
                default:
                // This is just part of the format specifier, let it become part of the percent format
                break;
            }
        } else {
            buffer->Append(c);
        }
    }
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(ToTypeAndDataString, StaticType, void, StringRef)
{
    _Param(2)->Resize1D(0);
    _Param(2)->Append(3, (Utf8Char*) "dv(");
    TDViaFormatter formatter(_Param(2), false);
    formatter.FormatData(_ParamPointer(0), _ParamPointer(1));
    _Param(2)->Append(')');
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(DefaultValueToString, TypeRef, StringRef)
{
    _Param(1)->Resize1D(0);
    TDViaFormatter formatter(_Param(1), false, 0);
    formatter.FormatData(_Param(0), _Param(0)->Begin(kPARead));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ToString, StaticType, void, Int16, StringRef)
{
    _Param(3)->Resize1D(0);
    TDViaFormatter formatter(_Param(3), false, _ParamPointer(2) ? _Param(2) : 0);
    formatter.FormatData(_ParamPointer(0), _ParamPointer(1));
    return _NextInstruction();
}
#endif
#if defined(VIREO_VIA_PARSER)
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(FromString, StringRef, StaticType, void, StringRef)
{
    TypeRef type = _ParamPointer(1);
    
    SubString string = _Param(0)->MakeSubStringAlias();
    EventLog log(_Param(3));
    
    TDViaParser parser(THREAD_EXEC()->TheTypeManager(), &string, &log, 1);
    parser._loadVIsImmediatly = true;
    
    parser.ParseData(type, _ParamPointer(2));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(DecimalStringToNumber, StringRef, Int32, void, Int32, StaticType, void)
{
    StringRef string = _Param(0);
    Int32 beginOffset = _ParamPointer(1) ? _Param(1) : 0;
    void *pDefault = _ParamPointer(2);
    TypeRef type = _ParamPointer(4);
    void *pData = _ParamPointer(5);
    
    if (beginOffset < 0)
        beginOffset = 0;
    SubString substring(string->BeginAt(beginOffset), string->End());
    Int32 length1 = substring.Length();
    Int32 length2;
    Boolean success;

    if (pData) { // If an argument is passed for the output value, read a value into it.
        EventLog log(EventLog::DevNull);
        TDViaParser parser(THREAD_EXEC()->TheTypeManager(), &substring, &log, 1);
        Int64 parsedValue;

        // ParseData needs to be given an integer type so that it parses the string as a decimal string.
        TypeRef parseType = THREAD_EXEC()->TheTypeManager()->FindType("Int64");

        parser.ParseData(parseType, &parsedValue);

        success = (parser.ErrorCount() == 0);
        if (success) {
            if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type->BitEncoding(), type->TopAQSize(), pData, parsedValue);
            } else {
                WriteIntToMemory(type->BitEncoding(), type->TopAQSize(), pData, parsedValue);
            }
        } else {
            if (pDefault) {
                type->CopyData(pDefault, pData);
            } else if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type->BitEncoding(), type->TopAQSize(), pData, 0);
            } else {
                WriteIntToMemory(type->BitEncoding(), type->TopAQSize(), pData, 0);
            }
        }
        length2 = parser.TheString()->Length();
    } else { // Otherwise, just read the string to find the end offset.
        success = substring.ReadInt(null);
        length2 = substring.Length();
    }

    // Output offset past the parsed value
    if (_ParamPointer(3))
        _Param(3) = beginOffset + (success ? length1 - length2 : 0);

    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(ExponentialStringToNumber, StringRef, Int32, void, Int32, StaticType, void)
{
    StringRef string = _Param(0);
    Int32 beginOffset = _ParamPointer(1) ? _Param(1) : 0;
    void *pDefault = _ParamPointer(2);
    TypeRef type = _ParamPointer(4);
    void *pData = _ParamPointer(5);
    
    if (beginOffset < 0)
        beginOffset = 0;
    SubString substring(string->BeginAt(beginOffset), string->End());
    Int32 length1 = substring.Length();
    Int32 length2;
    Boolean success;

    if (pData) { // If an argument is passed for the output value, read a value into it.
        EventLog log(EventLog::DevNull);
        TDViaParser parser(THREAD_EXEC()->TheTypeManager(), &substring, &log, 1);
        Double parsedValue;

        // ParseData needs to be given a floating point type so that it parses the string as an exponential string.
        TypeRef parseType = THREAD_EXEC()->TheTypeManager()->FindType("Double");

        parser.ParseData(parseType, &parsedValue);

        success = (parser.ErrorCount() == 0);
        if (success) {
            if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type->BitEncoding(), type->TopAQSize(), pData, parsedValue);
            } else {
                WriteIntToMemory(type->BitEncoding(), type->TopAQSize(), pData, parsedValue);
            }
        } else {
            if (pDefault) {
                type->CopyData(pDefault, pData);
            } else if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type->BitEncoding(), type->TopAQSize(), pData, 0);
            } else {
                WriteIntToMemory(type->BitEncoding(), type->TopAQSize(), pData, 0);
            }
        }

        length2 = parser.TheString()->Length();
    } else { // Otherwise, just read the string to find the end offset.
        success = substring.ParseDouble(null);
        length2 = substring.Length();
    }

    // Output offset past the parsed value
    if (_ParamPointer(3))
        _Param(3) = beginOffset + (success ? length1 - length2 : 0);

    return _NextInstruction();
}
#endif

DEFINE_VIREO_BEGIN(DataAndTypeCodecUtf8)
#if defined(VIREO_VIA_FORMATTER)
    DEFINE_VIREO_FUNCTION(DefaultValueToString, "p(i(.Type)o(.String))")
    DEFINE_VIREO_FUNCTION(ToString, "p(i(.StaticTypeAndData) i(.Int16) o(.String))")
    DEFINE_VIREO_FUNCTION(ToTypeAndDataString, "p(i(.StaticTypeAndData) o(.String))")
#endif
#if defined(VIREO_VIA_PARSER)
    DEFINE_VIREO_FUNCTION(FromString, "p(i(.String) o(.StaticTypeAndData) o(.String))")
    DEFINE_VIREO_FUNCTION(DecimalStringToNumber, "p(i(.String) i(.Int32) i(.*) o(.Int32) o(.StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(ExponentialStringToNumber, "p(i(.String) i(.Int32) i(.*) o(.Int32) o(.StaticTypeAndData))")
#endif
DEFINE_VIREO_END()

} // namespace Vireo
