/**

Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Parser for VI assembly.
 */

#include <stdarg.h>
#include <stdio.h>
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
// and one for three or more arguments. If the discrepancies are resolved in a later standard, the two can be merged.
#define LOG_EVENT(_severity_, _message_)  _pLog->LogEvent(EventLog::_severity_, CalcCurrentLine(), _message_);
#define LOG_EVENTV(_severity_, _message_, ...)  _pLog->LogEvent(EventLog::_severity_, CalcCurrentLine(), _message_, __VA_ARGS__);

namespace Vireo
{
//------------------------------------------------------------
TDViaParser::TDViaParser(TypeManagerRef typeManager, SubString *typeString, EventLog *pLog, Int32 lineNumberBase, SubString* format)
{
    _pLog = pLog;
    _typeManager = typeManager;
    _string.AliasAssign(typeString);
    _originalStart = typeString->Begin();
    _lineNumberBase = lineNumberBase;
    _loadVIsImmediatly = false;

   if (!format || format->ComparePrefixCStr(TDViaFormatter::formatVIA._name)) {
       _options._bEscapeStrings = false;
       _options._fmt = TDViaFormatter::formatVIA;
   } else if (format->ComparePrefixCStr(TDViaFormatter::formatJSON._name)) {
       _options._bEscapeStrings = true;
       _options._fmt = TDViaFormatter::formatJSON;
   } else if (format->ComparePrefixCStr(TDViaFormatter::formatC._name)) {
       _options._fmt = TDViaFormatter::formatC;
   }
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
TypeRef TDViaParser::ParseEnqueue()
{
    TypeRef type = BadType();

    //! TODO merge with runtime enqueue function
    SubString viName;
    
    if (! _string.EatChar('(')) {
        LOG_EVENT(kHardDataError, "'(' missing");
        return type;
    }
    
    TypeRef vit = ParseType();  // Could be a type or inlined VI.
    
    if (! _string.EatChar(')')) {
        LOG_EVENT(kHardDataError, "')' missing");
        return type;
    }
    
    VirtualInstrumentObjectRef vio = null;
    if (vit && /*vit->IsA() && */ vit->IsZDA()) {
        vio = *(VirtualInstrumentObjectRef*) vit->Begin(kPARead);
    }
    
    if (vio && vio->ObjBegin()) {
        vio->ObjBegin()->PressGo();
        type = vit;
    } else {
        LOG_EVENTV(kHardDataError,"VI not found '%.*s'", FMT_LEN_BEGIN(&viName));
    }
    return type;
}
//------------------------------------------------------------
NIError TDViaParser::ParseREPL()
{
    if (_string.ComparePrefixCStr("#!")) {
        // Files can start with a shabang if they are used as  script files.
        // skip the rest of the line.
        _string.EatToEol();
    }

    SubString command;
    _string.EatLeadingSpaces();
    TypeRef type;
    while((_string.Length() > 0) && (_pLog->TotalErrorCount() == 0)) {
        if (_string.ComparePrefix(')')) {
            break;
        } else if (_string.ComparePrefixCStr(tsDefineTypeToken)
                   || _string.ComparePrefixCStr(tsEnqueueTypeToken)
                   || _string.ComparePrefixCStr(tsContextTypeToken)
                   || _string.ComparePrefixCStr(tsRequireTypeToken)
                   || _string.ComparePrefixCStr("start")
                   ) {
            type = ParseType();
        } else {
            // Move this to core parser.
            TokenTraits tt = _string.ReadToken(&command);
            if (command.CompareCStr("exit")) {
                // This needs to change. Perhas end/exit method an set context variable.
                _pLog->LogEvent(EventLog::kTrace, 0, "chirp chirp");
                return kNIError_kResourceNotFound;
            } else if (tt == TokenTraits_SymbolName || tt == TokenTraits_String ) {
                command.TrimQuotedString(tt);
                // A JSONish style REPL level definition. Keys can be unquoted.
                if (_string.EatChar(*tsNameSuffix)) {
                    // For colon the concepts is the keys value takes on the the value on the right
                    // a bit like it inherits the value. The keys valu is not considered immutable.
                    TypeRef subType = ParseType();
                    DefaultValueType *cdt = DefaultValueType::New(_typeManager, subType, true);
                    cdt = cdt->FinalizeDVT();
                
                    type = _typeManager->Define(&command, cdt);
                } else if (_string.EatChar(*tsEqualSuffix)) {
                    // For equal, taek the matematical immutable equvalence perspective.
                    TypeRef subType = ParseType();
                    type = _typeManager->Define(&command, subType);
                }
            }
            
            if (!type) {
                LOG_EVENT(kHardDataError, "Error in epxression");
                break;
            }
        }
        _string.EatLeadingSpaces();
        RepinLineNumberBase();
    }
    
    TDViaParser::FinalizeModuleLoad(_typeManager, _pLog);

    return _pLog->TotalErrorCount() == 0 ? kNIError_Success : kNIError_kCantDecode;
}
//------------------------------------------------------------
//! Parse a require block
TypeRef TDViaParser::ParseRequire()
{
    TypeRef type = BadType();
    
    if (!_string.EatChar('(')) {
        LOG_EVENT(kHardDataError, "'(' missing");
        return type;
    }

    SubString moduleName;
    TokenTraits tt = _string.ReadToken(&moduleName);
    moduleName.TrimQuotedString(tt);
    
    if (!_string.EatChar(')')) {
        LOG_EVENT(kHardDataError, "')' missing");
        return type;
    }
    
    TypeManagerRef newTADM = TypeManager::New(_typeManager);
    TypeRef eType = _typeManager->FindType(tsTypeManagerType);
    type = DefaultValueType::New(_typeManager, eType, true, newTADM);

    if (false /* TypeDefiner::DefineBuiltinModule(newTADM, &moduleName) */) {
        // The module was a built-in one.
        return type;
    } else {
        // Its not built-in so make subExpression the contents of a module file.
        STACK_VAR(String, buffer);
        TypeDefiner::ResolvePackage(&moduleName, buffer.Value);
        SubString module = buffer.Value->MakeSubStringAlias();
        
        if (buffer.Value->Length() == 0) {
            gPlatform.IO.Printf("(Error \"Package <%.*s> empty\")\n", FMT_LEN_BEGIN(&moduleName));
        } else {
            TypeManagerScope scope(newTADM);
            TDViaParser parser(newTADM, &module, _pLog, CalcCurrentLine());
            parser.ParseREPL();
        }
    }
    return type;
}
//------------------------------------------------------------
//! Parse a context block by creating sub context then recursing the REPL.
TypeRef TDViaParser::ParseContext()
{
    if (!_string.EatChar('(')) {
        LOG_EVENT(kHardDataError, "'(' missing");
        return BadType();
    }
  
#if 0 
    DefaultValueType *cdt = DefaultValueType::New(_typeManager, subType, mutableValue);
    
    // The initializer value is optional, so check to see there is something
    // other than a closing paren.
    
    _string.EatLeadingSpaces();
    if (!_string.ComparePrefix(')')) {
        ParseData(subType, cdt->Begin(kPAInit));
    }
#endif

    TypeManagerRef newTADM = TypeManager::New(_typeManager);
    TypeRef eType = _typeManager->FindType(tsTypeManagerType);
    TypeRef type = DefaultValueType::New(_typeManager, eType, true, newTADM);
    
//    TypeRef type = DefaultPointerType::New(_typeManager, eType, newTADM, kPTTypeManager);
    
    // Parse the subExpression using the newly created type manager.
    {
        TypeManagerScope scope(newTADM);
        TDViaParser parser(newTADM, &_string, _pLog, CalcCurrentLine());
        parser.ParseREPL();
        _string.AliasAssign(parser.TheString());
    }

    if (!_string.EatChar(')')) {
        LOG_EVENT(kHardDataError, "')' missing");
        return BadType();
    }
    return type;
}
//------------------------------------------------------------
//! Parse a general type expresssion.
TypeRef TDViaParser::ParseType(TypeRef patternType)
{
    TypeManagerScope scope(_typeManager);

    TypeRef type = null;
    SubString save = _string;
    SubString typeFunction;
    TokenTraits tt = _string.ReadToken(&typeFunction);
    
    if (typeFunction.CompareCStr(tsEnqueueTypeToken) || typeFunction.CompareCStr(tsDefineTypeToken)) {
        // Legacy work around
        _string.EatLeadingSpaces();
    }
    
    Boolean bTypeFunction = _string.ComparePrefix('(');
    if ((tt == TokenTraits_SymbolName) && (!bTypeFunction)) {
        // Eat the deprecated dot prefix if it exists.
        typeFunction.EatChar('.');
        
        type = _typeManager->FindType(&typeFunction);
        if (!type) {
            LOG_EVENTV(kSoftDataError,"Unrecognized data type '%.*s'", FMT_LEN_BEGIN(&typeFunction));
            type = BadType();
        }
    } else if (typeFunction.CompareCStr(tsBitClusterTypeToken)) {
        type = ParseBitCluster();
    } else if (typeFunction.CompareCStr(tsClusterTypeToken)) {
        type = ParseCluster();
    } else if (typeFunction.CompareCStr(tsDefineTypeToken)) {
        type = ParseDefine();
    } else if (typeFunction.CompareCStr(tsParamBlockTypeToken)) {
        type = ParseParamBlock();
    } else if (typeFunction.CompareCStr(tsBitBlockTypeToken)) {
        type = ParseBitBlock();
    } else if (typeFunction.CompareCStr(tsArrayTypeToken)) {
        type = ParseArray();
    } else if (typeFunction.CompareCStr(tsRequireTypeToken)) {
        type = ParseRequire();
    } else if (typeFunction.CompareCStr(tsContextTypeToken)) {
        type = ParseContext();
    } else if (typeFunction.CompareCStr(tsDefaultValueToken)) {
        type = ParseDefaultValue(false);
    } else if (typeFunction.CompareCStr(tsVarValueToken)) {
        type = ParseDefaultValue(true);
    } else if (typeFunction.CompareCStr(tsEquivalenceTypeToken)) {
        type = ParseEquivalence();
    } else if (typeFunction.CompareCStr(tsPointerTypeToken)) {
        type = ParsePointerType(false);
    } else if (typeFunction.CompareCStr(tsEnqueueTypeToken) || typeFunction.CompareCStr("start")) {
        type = ParseEnqueue();
    } else {
        _string = save;
        type = ParseLiteral(patternType);
    }

    while(true) {
        if (_string.EatChar('<')) {
            if (type->IsTemplate()) {
                // Build a list of parameters.
                FixedCArray<TypeRef, ClumpParseState::kMaxArguments> templateParameters;
                for (IntIndex i = 0; !_string.EatChar('>'); i++) {
                    templateParameters.Append(ParseType());
                }
                type = InstantiateTypeTemplate(_typeManager, type, &templateParameters);
            } else {
                // If not a template then its a typed literal. Use the type
                // as a guide to parse the initializer(s)
                type = ParseType(type);
                _string.EatChar('>');
            }
        } else {
            break;
        }
    }
    
    return type;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseLiteral(TypeRef patternType)
{
    TypeRef type = null;
    SubString expressionToken;
    _string.ReadSubexpressionToken(&expressionToken);

    // See if the token fits the rules for a literal.
    TokenTraits tt = expressionToken.ClassifyNextToken();
    ConstCStr tName = null;
    TypeRef literalsType = null;
    
    if (tt == TokenTraits_WildCard) {
        // The wild card has no value to parse so just return it.
        return _typeManager->FindType(tsWildCard);
    }
    
    if (patternType) {
        EncodingEnum enc = patternType->BitEncoding();
        if (enc == kEncoding_S2CInt || enc == kEncoding_UInt || enc == kEncoding_IEEE754Binary) {
            if (tt == TokenTraits_Integer || tt == TokenTraits_IEEE754) {
                literalsType = patternType;
            }
        } else if (((enc == kEncoding_Array) || (enc == kEncoding_Cluster)) && (tt == TokenTraits_NestedExpression)) {
            literalsType = patternType;
        }
    }
    
    if (literalsType == null) {
        if (tt == TokenTraits_Integer) {
            tName = tsInt32Type;
        } else if (tt == TokenTraits_IEEE754) {
            tName = tsDoubleType;
        } else if (tt == TokenTraits_Boolean) {
            tName = tsBooleanType;
        } else if ((tt == TokenTraits_String) || (tt == TokenTraits_VerbatimString)) {
            tName = tsStringType;
        } else if (tt == TokenTraits_NestedExpression) {
            printf("compound value\n");
            
            // Sniff the expression to determin what type it is.
            // 1. nda arry of a single type.
            // 2. ndarray of mixed numeric type, use widest
            // 3. mixed type, cluster. some field may have named.
        }
        literalsType = _typeManager->FindType(tName);
    }
    
    if (literalsType) {
        DefaultValueType *cdt = DefaultValueType::New(_typeManager, literalsType, false);
        TypeDefiner::ParseData(_typeManager, cdt, _pLog, CalcCurrentLine(), &expressionToken);
        cdt = cdt->FinalizeDVT();
        type = cdt;
    } else {
        LOG_EVENTV(kHardDataError, "Unrecognized literal '%.*s'",  FMT_LEN_BEGIN(&expressionToken));
        type = BadType();
    }
    return type;
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
TypeRef TDViaParser::ParseDefine()
{
    if (!_string.EatChar('(')) {
        LOG_EVENT(kHardDataError, "'(' missing");
        return BadType();
    }
    
    SubString symbolName;
    _string.ReadToken(&symbolName);
    TypeRef type = ParseType();
    
    if (!_string.EatChar(')')) {
        LOG_EVENT(kHardDataError, "')' missing");
        return BadType();
    }
    
    TypeRef namedType = _typeManager->Define(&symbolName, type);
    if (!namedType) {
        LOG_EVENT(kHardDataError, "Can't define symbol");
        return BadType();
    }

    return namedType;
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
        
        if (!_string.EatChar('('))
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
        ElementTypeRef element = ElementType::New(_typeManager, &fieldName, subType, usageType, offset);
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
        
    if (!_string.EatChar('('))
        return BadType();
    
    TypeRef elementType = ParseType();
    
    _string.ReadSubexpressionToken(&token);
    while (!token.CompareCStr(")")) {
        
        IntIndex dimensionLength;
        if (!token.ReadIntDim(&dimensionLength)) {
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
    
    if (!_string.EatChar('('))
        return BadType();
    
    if (!_string.ReadToken(&lengthToken))
        return BadType();
    
    if (lengthToken.CompareCStr(tsHostPointerSize)) {
        length = _typeManager->HostPointerToAQSize() * _typeManager->AQBitLength();
    } else if (!lengthToken.ReadIntDim(&length)) {
            return BadType();        
    }
    
    if (!_string.ReadToken(&encoding))
        return BadType();
    
    if (!_string.EatChar(')'))
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
        if (!_string.EatChar('('))
            return BadType();
    }
    
    TypeRef subType = ParseType();
    PointerType *pointer = PointerType::New(_typeManager, subType);

    if (!shortNotation)
    {
        if (!_string.EatChar(')'))
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
        enc = kEncoding_S2CInt;
    } else if (string->CompareCStr(tsFixedPoint)) {
        enc = kEncoding_Q;
    } else if (string->CompareCStr(ts1plusFractional)) {
        enc = kEncoding_Q1;
    } else if (string->CompareCStr(tsBiasedInt)) {
        enc = kEncoding_BiasedInt;
    } else if (string->CompareCStr(tsInt1sCompliment)) {
        enc = kEncoding_S1CInt;
    } else if (string->CompareCStr(tsAscii)) {
        enc = kEncoding_Ascii;
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
    //  syntax:  dv ( type value ) or dv( type )
    //  for the second case, the value will be the inner types default value.
    
    if (!_string.EatChar('('))
        return BadType();
    
    TypeRef subType = ParseType();
    if (!subType)
        return BadType();
    
    DefaultValueType *cdt = DefaultValueType::New(_typeManager, subType, mutableValue);
    
    // The initializer value is optional, so check to see if there is something
    // other than a closing paren.
    
    _string.EatLeadingSpaces();
    if (!_string.ComparePrefix(')')) {
        ParseData(subType, cdt->Begin(kPAInit));
    }

    // Simple constants can resolve to a unique shared instance.
    // Perhaps even deeper constant values, let the type system figure it out.
    cdt = cdt->FinalizeDVT();
    
    if (!_string.EatChar(')'))
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

    // The opening array_pre like "(" has been parsed before this function has been called.
    Int32 dimIndex;
    while (depth >= 0) {
        dimIndex = (rank - depth) - 1;

        if(!ReadArrayItem(&tempString, &token)) {
             // Avoid infinite loop for incorrect input.
             break;
        }
        if (token.EatChar(Fmt()._itemSeperator)) {
            // For JSON string, it has non-space separator.
            continue;
        }
        if (token.EatChar(Fmt()._arrayPre)) {
            if (dimIndex >= 0)
                tempDimensionLengths[dimIndex]++;
    
            depth++;
        } else if (token.EatChar(Fmt()._arrayPost)) {
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

TokenTraits TDViaParser::ReadArrayItem(SubString* input, SubString* token)
{
   if (input->EatChar('{')) {
       input->EatWhiteSpaces();
       while (input->Length()>0 && !input->EatChar('}')) {
           input->ReadToken(token);
           input->EatWhiteSpaces();
           if (!input->EatChar(*tsNameSuffix)) {
               return TokenTraits_Unrecognized;
           }
           if (!ReadArrayItem(input, token)) { return TokenTraits_Unrecognized; }
           input->EatChar(',');
       }
       return TokenTraits_NestedExpression;
   } else {
       return input->ReadToken(token);
   }
   return TokenTraits_Unrecognized;
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
        TokenTraits tt = _string.ReadToken(&token);
        if ((rank == 1) && ((tt == TokenTraits_String) || (tt == TokenTraits_VerbatimString))) {
            // First option, if it is the inner most dimension, and the initializer is a string then that is OK
            token.TrimQuotedString(tt);
            const Utf8Char *pBegin = token.Begin();
            Int32 charCount = token.Length();
            
            if (tt == TokenTraits_String) {
                // Adjust count for escapes
                charCount = token.LengthAferProcessingEscapes();
                pArray->Resize1D(charCount);
                if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Ascii) {
                    // TODO convert from Utf8 to ASCII, map chars that do not fit to something.
                    token.ProcessEscapes(pArray->RawBegin(), pArray->RawBegin());
                } else if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Unicode) {
                    token.ProcessEscapes(pArray->RawBegin(), pArray->RawBegin());
                }
            } else {
                // Treat string bytes verbatim.
                pArray->Resize1D(charCount);

                if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Ascii) {
                    // TODO convert from Utf8 to ASCII, map chars that do not fit to something.
                    memcpy(pArray->RawBegin(), pBegin, charCount);
                } else if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Unicode) {
                    memcpy(pArray->RawBegin(), pBegin, charCount);
                }
            }
        } else if (token.EatChar(Fmt()._arrayPre)) {
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
                // any changes, but logical dims can change.
                pArray->ResizeDimensions(rank, initializerDimensionLengths, false);
                
                VIREO_ASSERT(pFirstEltInSlice == null);
                pFirstEltInSlice = pArray->RawBegin();
            }
            // Get the dim lengths and slabs for tha actual array, not its
            // reference type. The reference type may indicate variable size
            // but the actaul array will always have a specific size.
            IntIndex* pLengths = pArray->DimensionLengths();
            IntIndex* pSlabs = pArray->SlabLengths();

            // Now that the Array is the right size, parse the initializers storing
            // as many as there is room for. Log a warning if extras are found.
            Int32 dimIndex = rank - level - 1;
            IntIndex step = pSlabs[dimIndex];
            Int32 length = pLengths[dimIndex];
            IntIndex elementCount = 0;
            Boolean bExtraInitializersFound = false;
            AQBlock1* pEltData = (AQBlock1*) pFirstEltInSlice;

            while ((_string.Length() > 0) && !_string.EatChar(Fmt()._arrayPost)) {
                // Only read as many elements as there was room allocated for,
                // ignore extra ones.
                _string.EatLeadingSpaces();
                _string.EatChar(Fmt()._itemSeperator);
                void* pElement = elementCount < length ? pEltData : null;
                if (pElement == null) {
                    bExtraInitializersFound = true;
                }
                if (dimIndex == 0) {
                    // For the inner most dimension parse using element type.

                    // will be replaced with the genericParseData in the future.

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
        case kEncoding_UInt:
        case kEncoding_S2CInt:
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
                
                if (WriteIntToMemory(type, pData, value) != kNIError_Success)
                    LOG_EVENT(kSoftDataError, "Data int size not suported");

            }
            break;
        case kEncoding_Boolean:
            {
                _string.ReadToken(&token);
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
                _string.ReadToken(&token);
                Double value = 0.0;
                Boolean readSuccess = token.ParseDouble(&value);
                if (!readSuccess)
                    return LOG_EVENT(kSoftDataError, "Data IEEE754 syntax error");
                if (!pData)
                    return; // If no where to put the parsed data, then all is done.
                
                if (WriteDoubleToMemory(type, pData, value) != kNIError_Success)
                    LOG_EVENT(kSoftDataError, "Data IEEE754 size not supported");
                
                // TODO support 16 bit reals? 128 bit reals? those are defined by IEEE754
            }
            break;
        case kEncoding_Ascii:
        case kEncoding_Unicode:
            {
            TokenTraits tt = _string.ReadToken(&token);
            token.TrimQuotedString(tt);
            if (aqSize == 1 && token.Length() >= 1) {
                *(Utf8Char*)pData = *token.Begin();
            } else {
                LOG_EVENT(kSoftDataError, "Scalar that is unicode");
                // TODO support escaped chars, more error checking
            }
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
                SubString typeName = type->Name();
                LOG_EVENTV(kHardDataError, "Parsing pointer type '%.*s'", FMT_LEN_BEGIN(&typeName));
            }
            break;
        case kEncoding_Cluster:
            {
                if (Fmt().UseFieldNames()) {
                    // the json cluster always contains the name
                    // JSON generally igonre any white space around or between syntactic elements
                    // JSON does not provide or allow any sort of comment syntax
                    _string.EatWhiteSpaces();
                    if(!_string.EatChar('{')) {
                        return ;
                    }
                    IntIndex elmIndex =0;
                    AQBlock1* baseOffset = (AQBlock1*)pData;
                    void* elementData = baseOffset;
                    while ((_string.Length() > 0) && !_string.EatChar('}')  ) {
                        SubString fieldName;
                        _string.ReadToken(&fieldName);
                        fieldName.AliasAssign(fieldName.Begin()+1, fieldName.End()-1);
                        _string.EatWhiteSpaces();
                        _string.EatChar(*tsNameSuffix);
                        Boolean found = false;
                        TypeRef elementType = null;
                        for (elmIndex = 0;!found && elmIndex<type->SubElementCount(); elmIndex++) {
                            elementType= type->GetSubElement(elmIndex);
                            SubString name = elementType->ElementName();
                            elementData = baseOffset + elementType->ElementOffset();
                            found = fieldName.CompareViaEncodedString(&name);
                        }
                        if (!found) {
                            return ;
                        }
                        if (baseOffset == null) {
                            elementData = baseOffset ;
                            return ;
                        }
                        ParseData(elementType, elementData);
                        _string.EatWhiteSpaces();
                        _string.EatChar(',');
                    }
                } else {
                    _string.ReadToken(&token);
                    if (token.CompareCStr("(")) {
                        // List of values (a b c)
                        AQBlock1* baseOffset = (AQBlock1*)pData;
                        IntIndex i = 0;
                        while (!_string.EatChar(')') && (_string.Length() > 0) && (i < type->SubElementCount())) {
                            TypeRef elementType = type->GetSubElement(i);
                            void* elementData = baseOffset;
                            if (elementData != null)
                                elementData = baseOffset + elementType->ElementOffset();
                            ParseData(elementType, elementData);
                            i++;
                        }
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
//! Skip over a JSON item.  TODO merge with ReadSubexpression
Boolean EatJSONItem(SubString* input)
{
    SubString token;

    if (input->EatChar('{')) {
        input->EatWhiteSpaces();
        while (input->Length()>0 && !input->EatChar('}')) {
            input->ReadToken(&token);
            input->EatWhiteSpaces();
            if (!input->EatChar(*tsNameSuffix)) {
                return false;
            }
            EatJSONItem(input);
            input->EatChar(',');
        }
    } else if (input->EatChar('[')) {
        while (input->Length()>0 && !input->EatChar(']')) {
            EatJSONItem(input);
            input->EatWhiteSpaces();
            if (!input->EatChar(',')) {
                return false;
            }
        }
    } else {
        input->ReadToken(&token);
    }
    return true;
}
//------------------------------------------------------------
//! Find the location in JSON string based on an indexing path.
Boolean TDViaParser::EatJSONPath(SubString* path)
{
    if (path == null) {
        return true;
    }
    SubString  token;
    _string.EatWhiteSpaces();
    if(_string.EatChar('{')) {
        // Searching in cluster
        while ((_string.Length() > 0) && !_string.EatChar('}')) {
            SubString fieldName;
            _string.EatWhiteSpaces();
            _string.ReadToken(&fieldName);
            fieldName.AliasAssign(fieldName.Begin()+1, fieldName.End()-1);
            _string.EatWhiteSpaces();
            _string.EatChar(*tsNameSuffix);
            Boolean found = false;
            if (path!=null) {
                // attention: not compare the encoded string.
                found = fieldName.Compare(path);
            }
            if (found) {
                return true;
            } else {
                _string.EatWhiteSpaces();
                EatJSONItem(&_string);
                _string.EatWhiteSpaces();
                _string.EatChar(',');
            }
        }
        return false;
    } else if (_string.EatChar('[')) {
        // labview could use the path as the index integer to access the array element.
        // only support 1d array
        IntMax arrayIndex = -1;
        SubString arrayIndexStr(path);
        arrayIndexStr.ReadInt(&arrayIndex);
        if (arrayIndex<0) {
            return false;
        }
        IntIndex i = 0;
        while ((_string.Length() > 0) &&!_string.EatChar(']')) {
            _string.EatWhiteSpaces();
            if (i==arrayIndex) {
                return true;
            } else {
                EatJSONItem(&_string);
                _string.EatChar(',');
            }
            i++;
        }
        return false;
    } else {
        // don't need to eat path any more
        return false;
    }
    return true;
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
    } else if (!_string.ComparePrefixCStr("clump")) {
        // Old school way of loading VIs

        // if there is something other than clump, it should be an unnamed type.
        TypeRef type1 = this->ParseType();
        
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
        if (_string.EatChar(')')) {
            break;
        }
    }
    
    // Preliminary initialization has already been done.
    // from the generic VirtualInstrument definition.
    VirtualInstrumentObjectRef vio = *(VirtualInstrumentObjectRef*)pData;
    VirtualInstrument *vi = vio->ObjBegin();
    SubString clumpSource(beginClumpSource, endClumpSource);
    
    vi->Init(THREAD_TADM(), (Int32)actualClumpCount, paramsType, localsType, lineNumberBase, &clumpSource);
    
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
            //  Int32 startingAllocations = vi->TheTypeManager()->_totalAllocations;
#endif
            EventLog dummyLog(EventLog::DevNull);
            TDViaParser parser(vi->TheTypeManager(), &clumpSource, &dummyLog, vi->_lineNumberBase);
            for (; pClump < pClumpEnd; pClump++) {
                parser.ParseClump(pClump, &cia);
            }
#ifdef VIREO_USING_ASSERTS
            // The frist pass should just calculate the size needed. If any allocations occured then
            // there is a problem.
            // Int32 endingAllocations = vi->TheTypeManager()->_totalAllocations;
            // VIREO_ASSERT(startingAllocations == endingAllocations)
#endif
        }
        
        // (2) Allocate a chunk for instructions to come out of.
        pClump = vi->Clumps()->Begin();
        cia.Allocate(pClump->TheTypeManager());
        
        {
            // (3) Parse a second time, instrucitons will be allocated out of the chunk.
            TDViaParser parser(vi->TheTypeManager(), &clumpSource, pLog, vi->_lineNumberBase);
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
    
    if (!_string.EatChar('('))
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
        _string.ReadToken(&token);
        
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

    if (!_string.EatChar('('))
        return LOG_EVENT(kHardDataError, "'(' missing");
    
    // Read first instruction, or firecount. If no instruction then the closing paren
    // of the clump will be found immediately
    _string.ReadToken(&token);
    IntMax fireCount = 1;
    if (token.ReadInt(&fireCount)) {
        _string.ReadToken(&instructionNameToken);
    } else if (token.CompareCStr(tsFireCountOpToken)) {
        if (!_string.EatChar('('))
            return LOG_EVENT(kHardDataError, "'(' missing");

        _string.ReadToken(&token);
        if (!token.ReadInt(&fireCount)) {
            return LOG_EVENT(kHardDataError, "fire count error");
        }

        instructionNameToken = token;
        if (!_string.EatChar(')'))
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
            if (!_string.EatChar('('))
                return LOG_EVENT(kHardDataError, "'(' missing");
            SubString perchName;
            if (!_string.ReadToken(&perchName))
                return LOG_EVENT(kHardDataError, "perch label error");
            if (!_string.EatChar(')'))
                return LOG_EVENT(kHardDataError, "')' missing");
            state.MarkPerch(&perchName);
        } else {
            Boolean keepTrying = state.StartInstruction(&instructionNameToken) != null;

            // Start reading actual parameters
            if (!_string.EatChar('('))
                return LOG_EVENT(kHardDataError, "'(' missing");
            
            // Parse the arguments once and determine how many were passed to the instruction.
            Int32 argCount = 0;
            for (; true; argCount++) {
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
                for (Int32 i = 0; (i < argCount) && keepTrying; i++) {
                
                    token = argExpressionTokens[i];
                    TypeRef formalType  = state.ReadFormalParameterType();

                    state._parserFocus = token;
                    if (formalType) {
                        // TODO the type classification can be moved into a codec independent class.
                        SubString formalParameterTypeName = formalType->Name();
                        
                        if (formalParameterTypeName.CompareCStr("VarArgCount")) {
                            VIREO_ASSERT(!state.VarArgParameterDetected());                    
                            state.AddVarArgCount();
                            // If the formal type is "VarArgCount"
                            // restart processing current argument, its the first vararg
                            i--;
                            continue;
                        }                
                    
                        if (formalParameterTypeName.CompareCStr("BranchTarget")) {  // unadorned number
                            state.AddBranchTargetArgument(&token);
                        } else if (formalParameterTypeName.CompareCStr(tsVIClumpType)) {
                            // Parse as an integer then resolve to pointer to the clump.
                            state.AddClumpTargetArgument(&token);
                        } else if (formalParameterTypeName.CompareCStr("StaticType")) {
                            state.AddDataTargetArgument(&token, true, false);
                        } else if (formalParameterTypeName.CompareCStr("StaticTypeAndData")) {
                            state.AddDataTargetArgument(&token, true, true);
                        } else if (formalType->IsStaticParam()) {
                            LOG_EVENT(kSoftDataError, "unexpeced static parameter");
                        } else {
                            // The most common case is a data value
                            state.AddDataTargetArgument(&token, false, true); // For starters
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
                    // See if there is another overload to try.
                    keepTrying = state.StartNextOverload() != null;
                }
            }
            InstructionCore* instruction = state.EmitInstruction();
            if (!instruction) {
                LOG_EVENTV(kSoftDataError, "Instruction not generated '%.*s'", FMT_LEN_BEGIN(&instructionNameToken));
            }
        }
        _string.ReadToken(&instructionNameToken);
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
//------------------------------------------------------------
//! Create a parser and process all the declaraions in the stream.
NIError TDViaParser::StaticRepl(TypeManagerRef tm, SubString *replStream)
{
    TypeManagerScope scope(tm);
    
    STACK_VAR(String, errorLog);
    EventLog log(errorLog.Value);
    
    TDViaParser parser(tm, replStream, &log, 1);
    NIError err = parser.ParseREPL();
    
    if (errorLog.Value->Length() > 0) {
        gPlatform.IO.Printf("%.*s", (int)errorLog.Value->Length(), errorLog.Value->Begin());
    }
    return err;
}
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
        _pFormatter->FormatInt(kEncoding_DimInt, length);
        _pFormatter->_string->Append(' ');
        _pFormatter->FormatEncoding(type->BitEncoding());
        _pFormatter->_string->Append(')');
    }
    //------------------------------------------------------------
    void VisitAggregate(TypeRef type, ConstCStr prefix)
    {
        _pFormatter->_string->AppendCStr(prefix);
        IntIndex subElementCount = type->SubElementCount();
        for (IntIndex i = 0; i < subElementCount; i++) {
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
        IntIndex* pDimension = type->DimensionLengths();

        for (Int32 rank = type->Rank(); rank>0; rank--) {
            _pFormatter->_string->Append(' ');
            _pFormatter->FormatInt(kEncoding_DimInt, *pDimension);
            pDimension++;
        }
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    virtual void VisitElement(ElementTypeRef type)
    {
        _pFormatter->FormatElementUsageType(type->ElementUsageType());
        _pFormatter->_string->Append('(');
        type->BaseType()->Accept(this);
        SubString elementName = type->ElementName();
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
        SubString name = type->Name();
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
// If formatting options specify to use the locale's default seperator
// then this variable should be used.
char TDViaFormatter::LocaleDefaultDecimalSeperator = '.';

// the format const used in Formatter and Parser
ViaFormatChars TDViaFormatter::formatVIA =  {"VIA",  '(',')','(',')',' ','\'', kViaFormat_NoFieldNames};
ViaFormatChars TDViaFormatter::formatJSON = {"JSON", '[',']','{','}',',','\"', kViaFormat_QuotedFieldNames};
ViaFormatChars TDViaFormatter::formatC =    {"C",    '{','}','{','}',',','\"', kViaFormat_NoFieldNames};

//------------------------------------------------------------
TDViaFormatter::TDViaFormatter(StringRef string, Boolean quoteOnTopString, Int32 fieldWidth, SubString* format)
{
    // Might move all options to format string.
    _string = string;
    _options._bQuoteStrings = quoteOnTopString;
    _options._fieldWidth = fieldWidth;
    
    if (!format || format->ComparePrefixCStr(formatVIA._name)) {
        _options._bEscapeStrings = false;
        _options._fmt = formatVIA;
    } else if (format->ComparePrefixCStr(formatJSON._name)) {
        _options._bEscapeStrings = true;
        _options._fmt = formatJSON;
    } else if (format->ComparePrefixCStr(formatC._name)) {
        _options._fmt = formatC;
    }
}
//------------------------------------------------------------
void TDViaFormatter::FormatEncoding(EncodingEnum value)
{
    ConstCStr str = null;
    switch (value) {
        case kEncoding_Boolean:         str = tsBoolean;        break;
        case kEncoding_UInt:            str = tsUInt;           break;
        case kEncoding_S2CInt:          str = tsSInt;           break;
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
    switch (value) {
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
void TDViaFormatter::FormatInt(EncodingEnum encoding, IntMax value)
{
    char buffer[kTempFormattingBufferSize];
    ConstCStr format = null;

    if (encoding == kEncoding_S2CInt) {
        format = "%*lld";
    } else if (encoding == kEncoding_UInt) {
        format = "%*llu";
    } else if (encoding == kEncoding_DimInt) {
        if (value == kArrayVariableLengthSentinel) {
            format = tsWildCard;
        } else if (IsVariableLengthDim((IntIndex)value)) {
            value = value - kArrayVariableLengthSentinel - 1;
            format = tsMetaIdPrefix "%*lld";
        } else {
            format = "%*lld";
        }
    } else {
        format = "**unsuported type**";
    }
    
    Int32 len = snprintf(buffer, sizeof(buffer), format, _options._fieldWidth, value);
    _string->Append(len, (Utf8Char*)buffer);
}
//------------------------------------------------------------
void TDViaFormatter::FormatIEEE754(TypeRef type, void* pData)
{
    char buffer[kTempFormattingBufferSize];
    ConstCStr pBuff = buffer;
    Double value = ReadDoubleFromMemory(type, pData);

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
    SubString name = pointerType->Name();
    // For pointer types, they are opaque to runtime code.
    // So the dispatch is now directed based on the type.
    if (name.CompareCStr(tsTypeType)) {
        FormatType(*(TypeRef*) pData);
    } else {
        // For types that do not support serialization
        // serialize the pointer type and weather it is null or not
        _string->Append('^');
        _string->Append(name.Length(), (Utf8Char*)name.Begin());
        if ((*(void**)pData) == null) {
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
    if (null == pArray) {
        _string->AppendCStr("null");
        return;
    }
    TypeRef elementType = pArray->ElementType();
    EncodingEnum elementEncoding = elementType->BitEncoding();
    if (rank==1 && (elementEncoding == kEncoding_Ascii || (elementEncoding == kEncoding_Unicode))) {
        // Unicode + elt size == 1 => Utf8
        // not planning on doing UTF16, or 32 at this time
        // These encodings have a special format
        // TODO option for raw or escaped forms need to be covered, sometime in quotes
        if (_options._bQuoteStrings) {
            _string->Append(Fmt()._quote);
        }
        // whether need to escape the string
        if(_options._bEscapeStrings) {
            SubString ss(pArray->RawBegin(), pArray->RawBegin() + pArray->Length());
            _string->AppendEscapeEncoded(ss.Begin(), ss.Length());
        }
         else {
            _string->Append(pArray->Length(), pArray->RawBegin());
        }

        if (_options._bQuoteStrings) {
            _string->Append(Fmt()._quote);
        }
    } else if (rank > 0) {
        _options._bQuoteStrings = true;
        FormatArrayDataRecurse(elementType, rank, pArray->BeginAt(0),
                               pArray->DimensionLengths(),
                               pArray->SlabLengths());
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
    _string->Append(Fmt()._arrayPre);
    while (dimensionLength-- > 0) {
        if (bPastFirst) {
            _string->Append(Fmt()._itemSeperator);
        }
        if (rank == 0) {
            FormatData(elementType, pElement);
        } else {
            FormatArrayDataRecurse(elementType, rank, pElement, pDimLengths, pSlabLengths);
        }
        pElement += elementLength;
        bPastFirst = true;
    }
    _string->Append(Fmt()._arrayPost);
}
//------------------------------------------------------------
void TDViaFormatter::FormatClusterData(TypeRef type, void *pData)
{
    IntIndex count = type->SubElementCount();
    IntIndex i= 0;
    _options._bQuoteStrings = true;
    _string->Append(Fmt()._clusterPre);
    while (i < count) {
        if (i > 0) {
            _string->Append(Fmt()._itemSeperator);
        }
        TypeRef elementType = type->GetSubElement(i++);
        if (Fmt().UseFieldNames()) {
            SubString ss = elementType->ElementName();
            Boolean useQuotes = Fmt().QuoteFieldNames();
            if (useQuotes)
                _string->Append('\"');
            
            //TODO use percent encoding when needed
           // _string->Append(ss.Length(), ss.Begin());
            IntIndex pos = _string->Length();
            _string->AppendViaDecoded(&ss);
            if (_options._bEscapeStrings) {
                _string->AppendEscapeEncoded(_string->BeginAt(pos), (IntIndex)(_string->End() - _string->BeginAt(pos)));
            }

            if (useQuotes)
                _string->Append('\"');
            _string->Append(*tsNameSuffix);
        }
        IntIndex offset = elementType->ElementOffset();
        AQBlock1* pElementData = (AQBlock1*)pData + offset;
        FormatData(elementType, pElementData);
    }
    _string->Append(Fmt()._clusterPost);
}
//------------------------------------------------------------
void TDViaFormatter::FormatData(TypeRef type, void *pData)
{
    char buffer[kTempFormattingBufferSize];
    
    EncodingEnum encoding = type->BitEncoding();
    
    switch (encoding) {
        case kEncoding_UInt:
        case kEncoding_S2CInt:
        case kEncoding_DimInt:
            {
            IntMax intValue = ReadIntFromMemory(type, pData);
            FormatInt(type->BitEncoding(), intValue);
            }
            break;
        case kEncoding_IEEE754Binary:
            FormatIEEE754(type, pData);
            break;
        case kEncoding_Pointer:
            FormatPointerData(type, pData);
            break;
        case kEncoding_Boolean:
            _string->AppendCStr((*(AQBlock1*) pData) ? "true" : "false");
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
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ToStringEx, StaticType, void, StringRef, StringRef)
{
    _Param(3)->Resize1D(0);
    SubString ss = _Param(2)->MakeSubStringAlias();
    TDViaFormatter formatter(_Param(3), true, 0, &ss);
    formatter.FormatData(_ParamPointer(0), _ParamPointer(1));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(FlattenToJSON, StaticType, void, Boolean, StringRef)
{
    _Param(3)->Resize1D(0);
    SubString json("JSON");
    TDViaFormatter formatter(_Param(3), true, 0, &json);
    if (_Param(0).IsCluster()) {
        formatter.FormatClusterData(_ParamPointer(0), _ParamPointer(1));
    } else {
        formatter.FormatData(_ParamPointer(0), _ParamPointer(1));
    }
    return _NextInstruction();
}
//------------------------------------------------------------
/**
 * Unflatten from JSON string.
 * The 3 boolean flags are
 *      :enable LV extensions(true)
 *      :default null elements
 *      :strict validation. whether allow json object contains items not defined in the cluster
 * */
VIREO_FUNCTION_SIGNATURE7(UnflattenFromJSON, StringRef, StaticType, void, TypedArray1D<StringRef>*, Boolean, Boolean, Boolean)
{
    SubString jsonString = _Param(0)->MakeSubStringAlias();
    TypedArray1D<StringRef>* itemPath = _Param(3);
    EventLog log(EventLog::DevNull);
    SubString jsonFormat("JSON");
    TDViaParser parser(THREAD_TADM(), &jsonString, &log, 1, &jsonFormat);
    if (itemPath->Length()>0) {
        Boolean existingPath = true;
        for (IntIndex i=0; existingPath && i< itemPath->Length();i++) {
            SubString p = itemPath->At(i)->MakeSubStringAlias();
            if(!parser.EatJSONPath(&p)) {
                existingPath = false;
            }
        }
        if (existingPath) {
            parser.ParseData(_ParamPointer(1), _ParamPointer(2));
        } else {
            // PlatformIO::Print("not found\n");
        }
    } else {
        parser.ParseData(_ParamPointer(1), _ParamPointer(2));
    }
    return _NextInstruction();
}

#endif

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(FromString, StringRef, StaticType, void, StringRef)
{
    TypeRef type = _ParamPointer(1);
    
    SubString string = _Param(0)->MakeSubStringAlias();
    EventLog log(_Param(3));
    
    TDViaParser parser(THREAD_TADM(), &string, &log, 1);
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
        TDViaParser parser(THREAD_TADM(), &substring, &log, 1);
        Int64 parsedValue;

        // ParseData needs to be given an integer type so that it parses the string as a decimal string.
        TypeRef parseType = THREAD_TADM()->FindType(tsInt64Type);

        parser.ParseData(parseType, &parsedValue);

        success = (parser.ErrorCount() == 0);
        if (success) {
            if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type, pData, parsedValue);
            } else {
                WriteIntToMemory(type, pData, parsedValue);
            }
        } else {
            if (pDefault) {
                type->CopyData(pDefault, pData);
            } else if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type, pData, 0);
            } else {
                WriteIntToMemory(type, pData, 0);
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
        TDViaParser parser(THREAD_TADM(), &substring, &log, 1);
        Double parsedValue;

        // ParseData needs to be given a floating point type so that it parses the string as an exponential string.
        TypeRef parseType = THREAD_TADM()->FindType(tsDoubleType);

        parser.ParseData(parseType, &parsedValue);

        success = (parser.ErrorCount() == 0);
        if (success) {
            if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type, pData, parsedValue);
            } else {
                WriteIntToMemory(type, pData, parsedValue);
            }
        } else {
            if (pDefault) {
                type->CopyData(pDefault, pData);
            } else if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type, pData, 0);
            } else {
                WriteIntToMemory(type, pData, 0);
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

DEFINE_VIREO_BEGIN(DataAndTypeCodecUtf8)
#if defined(VIREO_VIA_FORMATTER)
    DEFINE_VIREO_FUNCTION(DefaultValueToString, "p(i(Type)o(String))")
    DEFINE_VIREO_FUNCTION(ToString, "p(i(StaticTypeAndData) i(Int16) o(String))")
    DEFINE_VIREO_FUNCTION(FlattenToJSON, "p(i(StaticTypeAndData) i(Boolean) o(String))")
    DEFINE_VIREO_FUNCTION(UnflattenFromJSON, "p( i(String) o(StaticTypeAndData) i(a(String *)) i(Boolean) i(Boolean) i(Boolean) )")
    DEFINE_VIREO_FUNCTION_CUSTOM(ToString, ToStringEx, "p(i(StaticTypeAndData) i(String) o(String))")
    DEFINE_VIREO_FUNCTION(ToTypeAndDataString, "p(i(StaticTypeAndData) o(String))")
#endif
    DEFINE_VIREO_FUNCTION(FromString, "p(i(String) o(StaticTypeAndData) o(String))")
    DEFINE_VIREO_FUNCTION(DecimalStringToNumber, "p(i(String) i(Int32) i(*) o(Int32) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(ExponentialStringToNumber, "p(i(String) i(Int32) i(*) o(Int32) o(StaticTypeAndData))")
DEFINE_VIREO_END()

} // namespace Vireo
