// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Parser for VI assembly.
 */

#include <stdarg.h>
#include <stdio.h>
#include <ctype.h>
#include <memory>
#include <algorithm>
#include <vector>

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include "ControlRef.h"
#include "Events.h"

#include "VirtualInstrument.h"  // TODO(PaulAustin): remove once it is all driven by the type system.
#include "Variants.h"
#include "StringUtilities.h"
#include "DebuggingToggles.h"

#if !kVireoOS_windows
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
TDViaParser::TDViaParser(TypeManagerRef typeManager, SubString *typeString, EventLog *pLog,
    Int32 lineNumberBase, SubString* format, Boolean jsonLVExt /*=false*/, Boolean strictJSON /*=false*/,
    Boolean quoteInfNaN /*= false*/, Boolean allowJSONNulls /*= false*/, Boolean debugging /*= false*/)
{
    _pLog = pLog;
    _typeManager = typeManager;
    _string.AliasAssign(typeString);
    _originalStart = typeString->Begin();
    _lineNumberBase = lineNumberBase;
    _loadVIsImmediately = false;
    _debugging = debugging;
    _options._allowNulls = allowJSONNulls;
    _virtualInstrumentScope = nullptr;

    if (!format || format->ComparePrefixCStr(TDViaFormatter::formatVIA._name)) {
        _options._bEscapeStrings = false;
        _options._fmt = TDViaFormatter::formatVIA;
    } else if (format->ComparePrefixCStr(TDViaFormatter::formatJSON._name)) {
        _options._bEscapeStrings = true;
        _options._fmt = jsonLVExt ? (quoteInfNaN ? TDViaFormatter::formatJSONEggShell : TDViaFormatter::formatJSONLVExt) : TDViaFormatter::formatJSON;
        _options._bQuote64BitNumbers = jsonLVExt;
        if (strictJSON)
           _options._fmt._fieldNameFormat = ViaFormat(_options._fmt._fieldNameFormat | kViaFormat_JSONStrictValidation);
    } else if (format->ComparePrefixCStr(TDViaFormatter::formatC._name)) {
        _options._fmt = TDViaFormatter::formatC;
    }
}
//------------------------------------------------------------
void TDViaParser::LogEvent(EventLog::EventSeverity severity, ConstCStr message, ...) const
{
    va_list args;
    va_start(args, message);
    _pLog->LogEventV(severity, CalcCurrentLine(), message, args);
    va_end(args);
}
//------------------------------------------------------------
Int32 TDViaParser::CalcCurrentLine() const
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

    //! TODO(PaulAustin): merge with runtime enqueue function
    SubString viName;

    if (!_string.EatChar('(')) {
        LOG_EVENT(kHardDataError, "'(' missing");
        return type;
    }

    TypeRef vit = ParseType();  // Could be a type or inlined VI.
    if (vit->IsString()) {  // allow VI names to be quoted
        StringRef *str = (StringRef*)vit->Begin(kPARead);
        if (str) {
            viName = (*str)->MakeSubStringAlias();
            vit = _typeManager->FindTypeCore(&viName);
        }
    } else {
        viName = vit->Name();
    }

    if (!_string.EatChar(')')) {
        LOG_EVENT(kHardDataError, "')' missing");
        return type;
    }

    VirtualInstrumentObjectRef vio = nullptr;
    if (vit && /*vit->IsA() && */ vit->IsZDA()) {
        vio = *(VirtualInstrumentObjectRef*) vit->Begin(kPARead);
    }

    if (vio && vio->ObjBegin()) {
        vio->ObjBegin()->PressGo();
        type = vit;
    } else {
        LOG_EVENTV(kHardDataError, "VI not found '%.*s'", FMT_LEN_BEGIN(&viName));
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
    TypeRef type = nullptr;
    while ((_string.Length() > 0) && (_pLog->TotalErrorCount() == 0)) {
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
                // This needs to change. Perhaps end/exit method an set context variable.
                _pLog->LogEvent(EventLog::kTrace, 0, "chirp chirp");
                return kNIError_kResourceNotFound;
            } else if (tt == TokenTraits_SymbolName || tt == TokenTraits_String) {
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
                    // For equal, take the mathematical immutable equivalence perspective.
                    TypeRef subType = ParseType();
                    type = _typeManager->Define(&command, subType);
                }
            }

            if (!type) {
                LOG_EVENT(kHardDataError, "Error in expression");
                break;
            }
        }
        _string.EatLeadingSpaces();
        RepinLineNumberBase();
    }

    FinalizeModuleLoad(_typeManager, _pLog);

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
            TDViaParser parser(newTADM, &module, _pLog, CalcCurrentLine(), nullptr, false, false, false, false, _debugging);
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
        TDViaParser parser(newTADM, &_string, _pLog, CalcCurrentLine(), nullptr, false, false, false, false, _debugging);
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
//! Parse a general type expression.
TypeRef TDViaParser::ParseType(TypeRef patternType)
{
    TypeManagerScope scope(_typeManager);

    TypeRef type = nullptr;
    SubString save = _string;
    SubString typeFunction;
    TokenTraits tt = _string.ReadToken(&typeFunction);

    if (typeFunction.CompareCStr(tsEnqueueTypeToken) || typeFunction.CompareCStr(tsDefineTypeToken)) {
        // Legacy work around
        _string.EatLeadingSpaces();
    }

    Boolean bTypeFunction = _string.ComparePrefix('(');
    if (typeFunction.ComparePrefixCStr(tsEnumTypeToken) &&
        (typeFunction.Length() == tsEnumTypeTokenLen || isdigit(typeFunction.Begin()[tsEnumTypeTokenLen]))) {
        type = ParseEnumType(&typeFunction);
    } else if ((tt == TokenTraits_SymbolName) && (!bTypeFunction)) {
        // Eat the deprecated dot prefix if it exists.
        typeFunction.EatChar('.');
        type = _typeManager->FindType(&typeFunction, true);
        if (type != nullptr && type->Name().CompareCStr(tsVariantType)) {
            VariantTypeRef variant = VariantType::New(_typeManager);
            type = variant;
        }
        if (!type) {
            LOG_EVENTV(kSoftDataError, "Unrecognized data type '%.*s'", FMT_LEN_BEGIN(&typeFunction));
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
    } else if (typeFunction.CompareCStr(tsRefNumTypeToken)) {
        type = ParseRefNumType();
    } else if (typeFunction.CompareCStr(tsEnqueueTypeToken) || typeFunction.CompareCStr("start")) {
        type = ParseEnqueue();
    } else if (typeFunction.CompareCStr(tsControlReferenceToken)) {
        type = ParseControlReference();
    } else {
        _string = save;
        type = ParseLiteral(patternType);
    }

    while (true) {
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
    TypeRef type = nullptr;
    SubString expressionToken;
    _string.ReadSubexpressionToken(&expressionToken);

    // See if the token fits the rules for a literal.
    TokenTraits tt = expressionToken.ClassifyNextToken();
    ConstCStr tName = nullptr;
    TypeRef literalsType = nullptr;

    if (tt == TokenTraits_WildCard) {
        // The wild card has no value to parse so just return it.
        return _typeManager->FindType(tsWildCard);
    }

    if (patternType) {
        EncodingEnum enc = patternType->BitEncoding();
        if (enc == kEncoding_S2CInt || enc == kEncoding_UInt || enc == kEncoding_IEEE754Binary || enc == kEncoding_Enum) {
            if (tt == TokenTraits_Integer || tt == TokenTraits_IEEE754) {
                literalsType = patternType;
            }
        } else if (((enc == kEncoding_Array) || (enc == kEncoding_Cluster)) && (tt == TokenTraits_NestedExpression)) {
            literalsType = patternType;
        }
    }

    if (literalsType == nullptr) {
        if (tt == TokenTraits_Integer) {
            tName = tsInt32Type;
        } else if (tt == TokenTraits_IEEE754) {
            tName = tsDoubleType;
        } else if (tt == TokenTraits_Boolean) {
            tName = tsBooleanType;
        } else if ((tt == TokenTraits_String) || (tt == TokenTraits_VerbatimString)) {
            tName = tsStringType;
        } else if (tt == TokenTraits_NestedExpression) {
            // TODO(spathiwa) Figure out what this was intended for and either finish it or remove it

            // Sniff the expression to determine what type it is.
            // 1. nda array of a single type.
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
    ClusterAlignmentCalculator calc(_typeManager);
    std::vector<TypeRef> elementTypesVector;
    ParseAggregateElementList(&elementTypesVector, &calc);
    BitClusterType *bitClusterType = BitClusterType::New(_typeManager, (TypeRef*)elementTypesVector.data(), calc.ElementCount);
    return bitClusterType;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseCluster()
{
    ClusterAlignmentCalculator calc(_typeManager);
    std::vector<TypeRef> elementTypesVector;
    ParseAggregateElementList(&elementTypesVector, &calc);
    ClusterType *clusterType = ClusterType::New(_typeManager, (TypeRef*)elementTypesVector.data(), calc.ElementCount);
    return  clusterType;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseDefine()
{
    if (!_string.EatChar('(')) {
        LOG_EVENT(kHardDataError, "'(' missing");
        return BadType();
    }

    SubString symbolName;
    TokenTraits tt = _string.ReadToken(&symbolName);
    TypeRef type = ParseType();
    if (type->IsA(VI_TypeName)) {
        VirtualInstrumentObjectRef vio = *(VirtualInstrumentObjectRef*)type->Begin(kPARead);
        if (vio && vio->ObjBegin()) {
            VirtualInstrument *vi = vio->ObjBegin();
            symbolName.TrimQuotedString(tt);
            vi->SetVIName(symbolName, tt != TokenTraits_String && tt != TokenTraits_VerbatimString);
            symbolName = vi->VIName();  // might have been decoded
            RegisterForStaticEvents(vi);
        }
    }
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
    EquivalenceAlignmentCalculator calc(_typeManager);
    std::vector<TypeRef> elementTypesVector;
    ParseAggregateElementList(&elementTypesVector, &calc);
    EquivalenceType* equivalenceType = EquivalenceType::New(_typeManager, (TypeRef*)elementTypesVector.data(), calc.ElementCount);
    return  equivalenceType;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseParamBlock()
{
    ParamBlockAlignmentCalculator calc(_typeManager);
    std::vector<TypeRef> elementTypesVector;
    ParseAggregateElementList(&elementTypesVector, &calc);
    ParamBlockType *paramBlockType = ParamBlockType::New(_typeManager, (TypeRef*)elementTypesVector.data(), calc.ElementCount);
    return paramBlockType;
}
//------------------------------------------------------------
void TDViaParser::ParseAggregateElementList(std::vector<TypeRef> *elementTypesVector, AggregateAlignmentCalculator* calculator)
{
    VIREO_ASSERT(elementTypesVector != nullptr)

    SubString  token;
    SubString  fieldName;
    UsageTypeEnum  usageType;
    bool isDataItem;

    _string.ReadToken(&token);
    if (!token.CompareCStr("("))
        return LOG_EVENT(kHardDataError, "'(' missing");

    _string.ReadToken(&token);
    while (!token.CompareCStr(")")) {
        isDataItem = false;
        if (token.CompareCStr(tsElementToken)) {
            usageType = kUsageTypeSimple;
        } else if (token.CompareCStr(tsDataitemElementToken)) {
            usageType = kUsageTypeSimple;
            isDataItem = true;
        } else if (token.CompareCStr(tsConstElementToken)) {
            usageType = kUsageTypeConst;
        } else if (token.CompareCStr(tsInputParamToken)) {
            usageType = kUsageTypeInput;
            isDataItem = true;
        } else if (token.CompareCStr(tsOutputParamToken)) {
            usageType = kUsageTypeOutput;
            isDataItem = true;
        } else if (token.CompareCStr(tsInputOutputParamToken)) {
            usageType = kUsageTypeInputOutput;
            isDataItem = true;
        } else if (token.CompareCStr(tsStaticParamToken)) {
            usageType = kUsageTypeStatic;
        } else if (token.CompareCStr(tsTempParamToken)) {
            usageType = kUsageTypeTemp;
        } else if (token.CompareCStr(tsAliasToken)) {
            usageType = kUsageTypeAlias;
        } else {
            return  LOG_EVENTV(kSoftDataError, "Unrecognized element type '%.*s'",  FMT_LEN_BEGIN(&token));
        }

        if (!_string.EatChar('('))
            return LOG_EVENT(kHardDataError, "'(' missing");

        TypeRef subType = ParseType();

        // If not found put BadType from this TypeManger in its place
        // Null's can be returned from type functions but should not be
        // embedded in the data structures.
        if (subType == nullptr)
            subType = BadType();

        _string.ReadToken(&token);

        // See if there is a field name.
        if (token.CompareCStr(")")) {
            // no field name
            fieldName.AliasAssign(nullptr, nullptr);
        } else {
            fieldName.AliasAssign(&token);
            _string.ReadToken(&token);
            if (!token.CompareCStr(")"))
                return  LOG_EVENT(kHardDataError, "')' missing");
        }

        Int32 offset = calculator->AlignNextElement(subType);
        ElementTypeRef element = ElementType::New(_typeManager, &fieldName, subType, usageType, offset, isDataItem);
        elementTypesVector->push_back(element);

        _string.ReadToken(&token);
    }

    if (!token.CompareCStr(")"))
        return  LOG_EVENT(kHardDataError, "')' missing");
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseArray()
{
    SubString token;
    IntIndex  rank = 0;
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

    ArrayType  *array = ArrayType::New(_typeManager, elementType, std::min(rank, static_cast<IntIndex>(kArrayMaxRank)), dimensionLengths);
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
    if (!shortNotation) {
        if (!_string.EatChar('('))
            return BadType();
    }

    TypeRef subType = ParseType();
    PointerType *pointer = PointerType::New(_typeManager, subType);

    if (!shortNotation) {
        if (!_string.EatChar(')'))
            return BadType();
    }
    return pointer;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseRefNumType()
{
    if (!_string.EatChar('('))
        return BadType();
    TypeRef subType = ParseType();
    RefNumValType *refnum = RefNumValType::New(_typeManager, subType);
    if (!_string.EatChar(')'))
        return BadType();
    return refnum;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseControlReference(void *pData) {
    SubString controlTagToken;
    TypeRef ctrlRefType = nullptr;

    if (_string.EatChar('(')) {
        TokenTraits tt = _string.ReadToken(&controlTagToken);
        if (tt == TokenTraits_String) {
            controlTagToken.TrimQuotedString(tt);
            if (_string.EatChar(')'))
                ctrlRefType = _typeManager->FindType(tsControlRefNumToken);
        }
    }
    if (!ctrlRefType)
        return BadType();
    if (pData) {
        ControlReferenceCreate((RefNumVal*)pData, _virtualInstrumentScope, controlTagToken);
        return ctrlRefType;
    }

    DefaultValueType *cdt = DefaultValueType::New(_typeManager, ctrlRefType, true);
    pData = cdt->Begin(kPAInit);

    ControlReferenceCreate((RefNumVal*)pData, _virtualInstrumentScope, controlTagToken);

    cdt = cdt->FinalizeDVT();
    return cdt;
}
//------------------------------------------------------------
TypeRef TDViaParser::ParseEnumType(SubString *token)
{
    TypeRef subType = _typeManager->FindType(&TypeCommon::TypeUInt32);
    if (token->CompareCStr(tsEnum "8")) {
        subType = _typeManager->FindType(&TypeCommon::TypeUInt8);
    } else if (token->CompareCStr(tsEnum "16")) {
        subType = _typeManager->FindType(&TypeCommon::TypeUInt16);
    } else if (token->CompareCStr(tsEnum "64")) {
        subType = _typeManager->FindType(&TypeCommon::TypeUInt64);
    } else if (!token->CompareCStr(tsEnum) && !token->CompareCStr(tsEnum "32")) {
        return BadType();
    }
    EncodingEnum subEncoding = subType->BitEncoding();
    EnumType *enumVal = EnumType::New(_typeManager, subType);
    if (_string.EatChar('(')) {
        SubString enumValToken;
        while (!_string.EatChar(')')) {
            TokenTraits tt = _string.ReadToken(&enumValToken);
            if (tt == TokenTraits_SymbolName) {
                STACK_VAR(String, decodedStr);
                decodedStr.Value->AppendViaDecoded(&enumValToken);
                enumValToken = decodedStr.Value->MakeSubStringAlias();
                enumVal->AddEnumItem(&enumValToken);
            } else if (tt == TokenTraits_String) {
                enumValToken.TrimQuotedString(tt);
                enumVal->AddEnumItem(&enumValToken);
            } else {
                return BadType();
            }
        }
    }
    if (subEncoding != kEncoding_UInt && subEncoding != kEncoding_S2CInt)
        return BadType();
    return enumVal;
}
//------------------------------------------------------------
EncodingEnum TDViaParser::ParseEncoding(SubString *str)
{
    EncodingEnum enc = kEncoding_None;
    if (str->CompareCStr(tsBoolean)) {
        enc = kEncoding_Boolean;
    } else if (str->CompareCStr(tsIEEE754Binary)) {
        enc = kEncoding_IEEE754Binary;
    } else if (str->CompareCStr(tsUInt)) {
        enc = kEncoding_UInt;
    } else if (str->CompareCStr(tsSInt)) {
        enc = kEncoding_S2CInt;
    } else if (str->CompareCStr(tsFixedPoint)) {
        enc = kEncoding_Q;
    } else if (str->CompareCStr(ts1plusFractional)) {
        enc = kEncoding_Q1;
    } else if (str->CompareCStr(tsBiasedInt)) {
        enc = kEncoding_BiasedInt;
    } else if (str->CompareCStr(tsInt1sCompliment)) {
        enc = kEncoding_S1CInt;
    } else if (str->CompareCStr(tsAscii)) {
        enc = kEncoding_Ascii;
    } else if (str->CompareCStr(tsUnicode)) {
        enc = kEncoding_Unicode;
    } else if (str->CompareCStr(tsGeneric)) {
        enc = kEncoding_Generic;
    } else if (str->CompareCStr(tsPointer)) {
        enc = kEncoding_Pointer;
    } else if (str->CompareCStr(tsEnum)) {
        enc = kEncoding_Enum;
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
Boolean TDViaParser::PreParseElements(Int32 rank, ArrayDimensionVector dimensionLengths, Int32 *reachedDepth /*= nullptr*/)
{
    SubString  token;
    SubString  tempString(_string);
    Boolean inconsistentDimSizes = false;
    // Figure out how many initializers there are. The rank parameter
    // indicates how many levels are related to the type being parsed
    // nesting deeper than that is assumed to be part of a deeper type
    // such as a cluster or nested array.

    Int32 depth = 0;
    if (reachedDepth)
        *reachedDepth = 1;

    ArrayDimensionVector tempDimensionLengths;
    for (Int32 i = 0; i < kArrayMaxRank; i++) {
        dimensionLengths[i] = 0;
        tempDimensionLengths[i] = 0;
    }

    // The opening array_pre like "(" has been parsed before this function has been called.
    Int32 dimIndex;
    while (depth >= 0) {
        if (reachedDepth && depth >= *reachedDepth)
            *reachedDepth = depth+1;
        dimIndex = (rank - depth) - 1;
        if (!ReadArrayItem(&tempString, &token, true, Fmt().SuppressInfNaN())) {
             // Avoid infinite loop for incorrect input.
             break;
        }
        if (token.EatChar(Fmt()._itemSeparator)) {
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
                if (dimensionLengths[dimIndex] && tempDimensionLengths[dimIndex] != dimensionLengths[dimIndex])
                    inconsistentDimSizes = true;
                // If the inner dimension is larger than processed before, record the larger number
                if (tempDimensionLengths[dimIndex] > dimensionLengths[dimIndex])
                    dimensionLengths[dimIndex] = tempDimensionLengths[dimIndex];

                // Reset the temp counter for this level in case it's used again.
                tempDimensionLengths[dimIndex] = 0;
            }
            depth--;
        } else {
            if (dimIndex >= 0)
                tempDimensionLengths[dimIndex]++;
        }
    }
    return inconsistentDimSizes;
}

TokenTraits TDViaParser::ReadArrayItem(SubString* input, SubString* token, Boolean topLevel, Boolean suppressInfNaN)
{
    if (input->EatChar('{')) {
        input->EatWhiteSpaces();
        while (input->Length() > 0 && !input->EatChar('}')) {
            input->ReadToken(token);
            input->EatWhiteSpaces();
            if (!input->EatChar(*tsNameSuffix)) {
               return TokenTraits_Unrecognized;
            }
            if (!ReadArrayItem(input, token, false, suppressInfNaN)) {
                return TokenTraits_Unrecognized;
            }
            input->EatChar(',');
        }
        return TokenTraits_NestedExpression;
    } else if (!topLevel && input->EatChar('[')) {
        input->EatWhiteSpaces();
        while (input->Length() > 0 && !input->EatChar(']')) {
            if (!ReadArrayItem(input, token, false, suppressInfNaN)) {
                return TokenTraits_Unrecognized;
            }
            if (input->EatChar(']'))
                break;
            input->EatChar(',');
        }
        return TokenTraits_NestedExpression;
    } else {
        return input->ReadToken(token, suppressInfNaN);
    }
    return TokenTraits_Unrecognized;
}

//------------------------------------------------------------
Int32 TDViaParser::ParseVariantData(VariantDataRef pData)
{
    LVError err = kLVError_NoError;
    VIREO_ASSERT(pData != nullptr);

    // For JSON encodings skip variant parsing altogether
    // Not possible until we include type information in FormatVariant
    if (Fmt().QuoteFieldNames()) {
        if (!EatJSONItem(&_string)) {
            err = kLVError_ArgError;
        }
    } else {
        if (!_string.EatChar('(')) {
            err = kLVError_ArgError;
        } else if (!_string.EatChar(')')) {
            err = kLVError_ArgError;
        }
    }
    if (err == kLVError_ArgError) {
        LOG_EVENT(kHardDataError, "default value for variant must be empty");
    }
    return err;
}

//------------------------------------------------------------
Int32 TDViaParser::ParseArrayData(TypedArrayCoreRef pArray, void* pFirstEltInSlice, Int32 level)
{
    VIREO_ASSERT(pArray != nullptr);
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
                charCount = token.LengthAfterProcessingEscapes();
                pArray->Resize1D(charCount);
                if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Ascii) {
                    // TODO(PaulAustin): convert from Utf8 to ASCII, map chars that do not fit to something.
                    token.ProcessEscapes(pArray->RawBegin(), pArray->RawBegin());
                } else if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Unicode) {
                    token.ProcessEscapes(pArray->RawBegin(), pArray->RawBegin());
                }
            } else {
                // Treat string bytes verbatim.
                pArray->Resize1D(charCount);

                if (arrayElementType->TopAQSize() == 1 && arrayElementType->BitEncoding() == kEncoding_Ascii) {
                    // TODO(PaulAustin): convert from Utf8 to ASCII, map chars that do not fit to something.
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
                Int32 maxDepth = 1;
                Boolean inconsistentDimLens = PreParseElements(rank, initializerDimensionLengths, &maxDepth);
                if (Fmt().UseFieldNames()) {  // JSON
                    if (maxDepth != rank)
                        return kLVError_JSONInvalidArrayDims;
                    else if (inconsistentDimLens)
                        return kLVError_JSONInvalidArray;
                }
                // Resize the array to the degree possible to match initializers
                // if some of the dimensions are bounded or fixed that may impact
                // any changes, but logical dims can change.
                pArray->ResizeDimensions(rank, initializerDimensionLengths, false);

                VIREO_ASSERT(pFirstEltInSlice == nullptr);
                pFirstEltInSlice = pArray->RawBegin();
            }
            // Get the dim lengths and slabs for the actual array, not its
            // reference type. The reference type may indicate variable size
            // but the actual array will always have a specific size.
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
            Int32 errCode = kLVError_NoError;

            while ((_string.Length() > 0) && !_string.EatChar(Fmt()._arrayPost)) {
                // Only read as many elements as there was room allocated for,
                // ignore extra ones.
                _string.EatLeadingSpaces();
                _string.EatChar(Fmt()._itemSeparator);
                void* pElement = elementCount < length ? pEltData : nullptr;
                Int32 subErr;
                if (elementCount >= length) {
                    bExtraInitializersFound = true;
                }
                if (dimIndex == 0) {
                    // For the inner most dimension parse using element type.

                    // will be replaced with the genericParseData in the future.

                    subErr = ParseData(arrayElementType, pElement);
                } else {
                    // For nested dimensions just parse the next inner dimension using the array type.
                    subErr = ParseArrayData(pArray, pElement, level + 1);
                }
                if (subErr && !errCode) {
                    errCode = subErr;
                    if (Fmt().StopArrayParseOnFirstError())
                        break;
                }
                if (pFirstEltInSlice) {
                    pEltData += step;
                }
                elementCount++;
            }

            if (bExtraInitializersFound) {
                LOG_EVENT(kWarning, "Ignoring extra array initializer elements");
            }
            return errCode;
        } else if (tt == TokenTraits_SymbolName && token.CompareCStr("null")) {
            LOG_EVENT(kSoftDataError, "null encountered");
            return Fmt().UseFieldNames() ? _options._allowNulls ? Int32(kLVError_NoError) : Int32(kLVError_JSONTypeMismatch) : Int32(kLVError_ArgError);
        } else {
            LOG_EVENT(kHardDataError, "'(' missing");
            return Fmt().UseFieldNames() ? Int32(kLVError_JSONTypeMismatch) : Int32(kLVError_ArgError);
        }
    } else if (rank == 0) {
        // For Zero-D arrays there are no parens, just parse the element
        AQBlock1* pArrayData = (AQBlock1*) pArray->RawBegin();
        return ParseData(arrayElementType, pArrayData);
    }
    return kLVError_NoError;
}

//------------------------------------------------------------
//! Skip over a JSON item.  TODO(PaulAustin): merge with ReadSubexpression
Boolean TDViaParser::EatJSONItem(SubString* input)
{
    SubString token;

    if (input->EatChar('{')) {
        input->EatWhiteSpaces();
        while (input->Length() > 0 && !input->EatChar('}')) {
            input->ReadToken(&token);
            input->EatWhiteSpaces();
            if (!input->EatChar(*tsNameSuffix)) {
                return false;
            }
            EatJSONItem(input);
            input->EatChar(',');
        }
    } else if (input->EatChar('[')) {
        while (input->Length() > 0 && !input->EatChar(']')) {
            EatJSONItem(input);
            if (input->EatChar(']'))
                break;
            if (!input->EatChar(',')) {
                return false;
            }
        }
    } else {
        if (input->ReadToken(&token) == TokenTraits_Unrecognized)
            return false;
    }
    return true;
}

//------------------------------------------------------------
// ParseData - parse a value from the string based on the type
// If the text makes sense then kNIError_Success is returned.
// If pData is Null then only the syntax check is done.
Int32 TDViaParser::ParseData(TypeRef type, void* pData)
{
    static const SubString strVI(VI_TypeName);
    Int32 error = kLVError_NoError;
    if (type->IsA(&strVI)) {
        ParseVirtualInstrument(type, pData);
        return kLVError_NoError;
    }

    Int32 aqSize = type->TopAQSize();
    EncodingEnum encoding = type->BitEncoding();
    SubString  token;
    switch (encoding) {
        case kEncoding_Array:
            if (!pData)
                return kLVError_NoError;
            return ParseArrayData(*(TypedArrayCoreRef*) pData, nullptr, 0);
            break;
        case kEncoding_Variant:
            return ParseVariantData(*static_cast<VariantDataRef*>(pData));
            break;
        case kEncoding_Enum:
        case kEncoding_UInt:
        case kEncoding_S2CInt:
            {
                Boolean is64Bit = type->IsInteger64();
                IntMax value = 0;
                Boolean overflow = false;
                Utf8Char sign = 0;
                _string.EatWhiteSpaces();
                Boolean isNumericString = false;
                if (_options._bQuote64BitNumbers && is64Bit) {
                    isNumericString = _string.EatChar('"');
                }
                _string.PeekRawChar(&sign);
                Boolean readSuccess = _string.ReadInt(&value, &overflow);

                if (Fmt().UseFieldNames()) {  // JSON
                    if (readSuccess) {
                        if (overflow) {  // this checks for only UInt64 overflow
                            error = kLVError_JSONOutOfRange;
                        } else if (aqSize < 8) {  // check for overflow for smaller size ints
                            if (encoding == kEncoding_S2CInt) {
                                // Signed; overflowed if + and any non-zero bits in top part
                                // (past bits valid for aqSized-int) uor - and any non-one bits in top part
                                if ((value >= 0 && (value & ~((1ULL << (aqSize*8))-1)))
                                    || (value < 0 && (value >> (aqSize*8-1)) != -1))
                                    error = kLVError_JSONOutOfRange;
                            } else {  // unsigned, overflow if any bits set in top part
                                if (value & ~((1ULL << (aqSize*8))-1))
                                    error = kLVError_JSONOutOfRange;
                            }
                        } else if (encoding == kEncoding_S2CInt) {
                            // Signed Int64, overflow if sign doesn't match value
                            // (or if overflow returned above)
                            if ((sign == '-') != (value < 0))
                                error = kLVError_JSONOutOfRange;
                        }
                        if (error)
                            return error;

                        if (isNumericString)
                            _string.EatChar('"');
                    }
                }
                if (!readSuccess) {
                    // The token didn't look like a number, so consume it anyway and
                    // Log an error.
                    SubString tempToken;
                    if (_string.ReadSubexpressionToken(&tempToken) == TokenTraits_SymbolName && tempToken.CompareCStr("null")) {
                        LOG_EVENT(kSoftDataError, "null encountered");
                        return Fmt().UseFieldNames() ? _options._allowNulls ? Int32(kLVError_NoError)
                          : Int32(kLVError_JSONTypeMismatch) : Int32(kLVError_ArgError);
                    } else {
                        LOG_EVENT(kSoftDataError, "Data encoding not formatted correctly");
                    }

                    return Fmt().UseFieldNames() ? kLVError_JSONInvalidString : kLVError_ArgError;
                }

                if (!pData)
                    return kLVError_NoError;  // If no where to put the parsed data, then all is done.
                if (WriteIntToMemory(type, pData, value) != kNIError_Success) {
                    LOG_EVENT(kSoftDataError, "Data int size not supported");
                    return kLVError_ArgError;
                }
            }
            break;
        case kEncoding_Boolean:
            {
                TokenTraits tt = _string.ReadToken(&token);
                Boolean value = false;
                if (token.CompareCStr("t") || token.CompareCStr("true")) {
                    value = true;
                } else if (token.CompareCStr("f") || token.CompareCStr("false")) {
                    value = false;
                } else {
                    LOG_EVENT(kSoftDataError, "Data boolean value syntax error");
                    if (Fmt().UseFieldNames()) {
                        if (_options._allowNulls && tt == TokenTraits_SymbolName && token.CompareCStr("null"))
                            return _options._allowNulls ? Int32(kLVError_NoError) : Int32(kLVError_JSONTypeMismatch);
                        if (TokenTraits_Integer == tt || TokenTraits_String == tt || TokenTraits_IEEE754 == tt)
                            return  Int32(kLVError_JSONTypeMismatch);
                    }
                    return  Int32(kLVError_ArgError);
                }
                if (!pData)
                    return kLVError_NoError;

                if (aqSize == 1) {
                    *(AQBlock1*)pData = value;
                } else {
                    LOG_EVENT(kSoftDataError, "Data boolean size greater than 1");
                    return kLVError_ArgError;
                }
            }
            break;
        case kEncoding_IEEE754Binary:
            {
                Boolean suppressInfNaN = Fmt().SuppressInfNaN();
                Int32 errCode = kLVError_NoError;
                TokenTraits tt = _string.ReadToken(&token, suppressInfNaN);
                token.TrimQuotedString(tt);
                Double value = 0.0;
                Utf8Char leadingChar = token.StringLength() > 0 ? token.Begin()[0] : 0;
                Boolean isMundane = (tt == TokenTraits_IEEE754 || tt == TokenTraits_Integer) &&
                    (leadingChar == '.' || leadingChar == '-' || isdigit(leadingChar));  // not inf, nan
                Boolean readSuccess = token.ParseDouble(&value, suppressInfNaN, &errCode);
                if (!readSuccess) {
                    if (_options._allowNulls && tt == TokenTraits_SymbolName && token.CompareCStr("null"))
                        return kLVError_NoError;
                    LOG_EVENT(kSoftDataError, "Data IEEE754 syntax error");
                    return errCode;
                }
                if (Fmt().UseFieldNames()) {  // JSON
                    // Check if number was so large it mapped to infinity, but it wasn't really 'inf'.
                    if (isMundane && (std::isinf(value) || (aqSize == 4 && std::isinf(Single(value)))))  // overflowed
                        return kLVError_JSONOutOfRange;
                }
                if (!pData)
                    return kLVError_NoError;  // If no where to put the parsed data, then all is done.

                if (WriteDoubleToMemory(type, pData, value) != kNIError_Success) {
                    LOG_EVENT(kSoftDataError, "Data IEEE754 size not supported");
                    return kLVError_ArgError;
                }

                // TODO(PaulAustin): support 16 bit reals? 128 bit reals? those are defined by IEEE754
            }
            break;
        case kEncoding_Ascii:
        case kEncoding_Unicode:
            {
                TokenTraits tt = _string.ReadToken(&token);
                token.TrimQuotedString(tt);
                if (aqSize == 1 && token.Length() >= 1) {
                    if (pData)
                        *(Utf8Char*)pData = *token.Begin();
                } else {
                    LOG_EVENT(kSoftDataError, "Scalar that is unicode");
                    return kLVError_ArgError;
                    // TODO(PaulAustin): support escaped chars, more error checking
                }
            }
            break;
        case kEncoding_None:
            // TODO(PaulAustin): anything to do? value for empty cluster?
            break;
        case kEncoding_Pointer:
            {
                // TODO(PaulAustin): this is not really flat.
                static SubString strTypeType(tsTypeType);
                static SubString strExecutionContextType(tsExecutionContextType);
                if (type->IsA(&strTypeType)) {
                    if (pData) {
                        *(TypeRef*)pData = this->ParseType();
                    } else {
                        this->ParseType();  // TODO(PaulAustin): if preflight its read and lost
                    }
                    return kLVError_NoError;
                } else if (type->IsA(&strExecutionContextType)) {
                    _string.ReadToken(&token);
                    if (token.CompareCStr(tsWildCard)) {
                        // If a generic is specified then the default for the type should be
                        // used. For some pointer types this may be a process or thread global, etc.
                        // TODO(PaulAustin): this is at too low a level, it could be done at
                        // a higher level.
                        *(ExecutionContextRef*)pData = THREAD_EXEC();
                        return kLVError_NoError;
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
                    // JSON generally ignore any white space around or between syntactic elements
                    // JSON does not provide or allow any sort of comment syntax
                    _string.EatWhiteSpaces();
                    if (_string.ComparePrefixCStr("null")) {
                        _string.EatRawChars(4);
                        return _options._allowNulls ? Int32(kLVError_NoError) : Int32(kLVError_JSONTypeMismatch);
                    }
                    if (!_string.EatChar('{')) {
                        return kLVError_ArgError;
                    }
                    IntIndex elmIndex = 0;
                    AQBlock1* baseOffset = (AQBlock1*)pData;
                    Int32 elemCount = type->SubElementCount();
                    void* elementData = baseOffset;
                    std::unique_ptr<Boolean[]> handledElems =
                        std::unique_ptr<Boolean[]>(new Boolean[type->SubElementCount()]);
                    for (elmIndex = 0; elmIndex < elemCount; elmIndex++)
                        handledElems[elmIndex] = false;
                    while ((_string.Length() > 0) && !_string.EatChar('}')) {
                        SubString fieldName;
                        _string.ReadToken(&fieldName);
                        fieldName.AliasAssign(fieldName.Begin()+1, fieldName.End()-1);
                        _string.EatWhiteSpaces();
                        _string.EatChar(*tsNameSuffix);
                        Boolean found = false;
                        TypeRef elementType = nullptr;
                        for (elmIndex = 0; !found && elmIndex < elemCount; elmIndex++) {
                            elementType = type->GetSubElement(elmIndex);
                            SubString name = elementType->ElementName();
                            elementData = baseOffset + elementType->ElementOffset();
                            found = fieldName.CompareViaEncodedString(&name);
                        }
                        if (found) {
                            Int32 subErr;
                            --elmIndex;
                            if (baseOffset == nullptr) {
                                elementData = baseOffset;
                                return kLVError_NoError;
                            }
                            if (handledElems[elmIndex]) {  // already seen, ignore
                                subErr = ParseData(elementType, nullptr);
                            } else {
                                handledElems[elmIndex] = found;
                                subErr = ParseData(elementType, elementData);
                            }
                            if (subErr && !error)
                                error = subErr;
                        } else {
                            if (Fmt().JSONStrictValidation()) {
                                LOG_EVENT(kWarning, "JSON field not found in cluster");
                                error = kLVError_JSONStrictFieldNotFound;
                            }
                            _string.EatWhiteSpaces();
                            if (!EatJSONItem(&_string))
                                error = kLVError_JSONInvalidString;
                        }
                        if (error && error != kLVError_JSONStrictFieldNotFound)
                            break;
                        _string.EatWhiteSpaces();
                        _string.EatChar(',');
                    }
                    for (elmIndex = 0; !error && elmIndex < elemCount; elmIndex++) {
                        if (!handledElems[elmIndex])
                            error = kLVError_JSONClusterElemNotFound;
                    }
                } else {
                    Boolean isComplex = type->IsComplex();  // complex is a special case of cluster
                    Boolean matchOpenParen = _string.EatChar('(');
                    if (isComplex || matchOpenParen) {  // Vireo will allow either a+bi or (a b) complex initializer
                        // List of values (a b c)
                        AQBlock1* baseOffset = (AQBlock1*)pData;
                        IntIndex i = 0;
                        while ((!matchOpenParen || !_string.EatChar(')')) && (_string.Length() > 0) && (i < type->SubElementCount())) {
                            // This code is shared by parsing clusters and complex numbers
                            TypeRef elementType = type->GetSubElement(i);
                            void* elementData = baseOffset;
                            if (elementData != nullptr)
                                elementData = baseOffset + elementType->ElementOffset();
                            if (isComplex && !matchOpenParen) {  // complex a+bi format
                                if (i == 1)  // complex part
                                    _string.EatChar('+');
                                const Utf8Char* initialBegin = _string.Begin();
                                Boolean suppressInfNaN = Fmt().SuppressInfNaN();
                                _string.ReadToken(&token, suppressInfNaN);
                                Double value = 0.0;
                                if (token.ParseDouble(&value, suppressInfNaN)) {
                                    WriteDoubleToMemory(elementType, elementData, value);
                                    // put back any trailing chars, complex a+bi may not have embedded whitespace
                                    _string.AliasAssign(token.Begin(), _string.End());
                                    if (!matchOpenParen && i == 0 && (_string.EatChar('i') || _string.EatChar('I'))) {
                                        // allow complex component only (real part missing, parsed number ends with 'i'.)
                                        // copy value to complex part and terminate
                                        if (elementData) {
                                            type->GetSubElement(1)->CopyData(elementData, baseOffset+type->GetSubElement(1)->ElementOffset());
                                            elementType->InitData(elementData);
                                            break;
                                        }
                                    }
                                } else {  // value missing
                                    _string.AliasAssign(initialBegin, _string.End());  // rewind
                                    if (i == 1) {  // have real part only, complex part missing, ok
                                        elementType->InitData(elementData);  // zero complex part
                                        break;
                                    }
                                }
                            } else {  // cluster, or complex in cluster format
                                Int32 subErr = ParseData(elementType, elementData);
                                if (subErr && !error)
                                    error = subErr;
                            }
                            i++;
                        }
                        if (isComplex) {
                            // if we parsed both parts and it's not cluster initializer format, make sure 'i' terminator is found
                            if (!matchOpenParen && i == 2 && !_string.EatChar('i') && !_string.EatChar('I')) {
                                LOG_EVENT(kHardDataError, "bad complex literal");
                                error = kLVError_ArgError;
                            }
                        }
                    }
                }
            }
            break;
        case kEncoding_RefNum: {
            TokenTraits tt = _string.ReadToken(&token);
            if (tt == TokenTraits_SymbolName && token.CompareCStr(tsControlReferenceToken))
                ParseControlReference(pData);
            }
            break;
        default:
            LOG_EVENT(kHardDataError, "No parser for data type's encoding");
            return kLVError_ArgError;
            break;
    }
    return error;
}

//------------------------------------------------------------
//! Find the location in JSON string based on an indexing path.
Boolean TDViaParser::EatJSONPath(SubString* path)
{
    if (path == nullptr) {
        return true;
    }
    SubString  token;
    _string.EatWhiteSpaces();
    if (_string.EatChar('{')) {
        // Searching in cluster
        while ((_string.Length() > 0) && !_string.EatChar('}')) {
            SubString fieldName;
            _string.EatWhiteSpaces();
            _string.ReadToken(&fieldName);
            fieldName.AliasAssign(fieldName.Begin()+1, fieldName.End()-1);
            _string.EatWhiteSpaces();
            _string.EatChar(*tsNameSuffix);
            Boolean found = false;
            if (path != nullptr) {
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
        if (arrayIndex < 0) {
            return false;
        }
        IntIndex i = 0;
        while ((_string.Length() > 0) && !_string.EatChar(']')) {
            _string.EatWhiteSpaces();
            if (i == arrayIndex) {
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
    TypeRef eventSpecsType = emptyVIParamList;

    VirtualInstrumentObjectRef vio = *(VirtualInstrumentObjectRef*)pData;
    VirtualInstrument *vi = vio->ObjBegin();

    VirtualInstrument *savedVIScope = _virtualInstrumentScope;
    _virtualInstrumentScope = vi;  // Allow sub-objects parsed inside this VI to know what VI they are

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
            } else if (name.CompareCStr("Events")) {
                eventSpecsType = type;
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
    VIREO_ASSERT(paramsType != nullptr)
    VIREO_ASSERT(localsType != nullptr)

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
    const Utf8Char* endClumpSource = nullptr;

    while (true) {
        PreParseClump(nullptr);
        actualClumpCount++;
        if (_pLog->HardErrorCount() > 0)
            return;

        endClumpSource = _string.Begin();
        if (_string.EatChar(')')) {
            break;
        }
    }

    // Preliminary initialization has already been done.
    // from the generic VirtualInstrument definition.
    SubString clumpSource(beginClumpSource, endClumpSource);

    vi->Init(THREAD_TADM(), (Int32)actualClumpCount, paramsType, localsType, eventSpecsType, lineNumberBase, &clumpSource);

    if (_loadVIsImmediately) {
        FinalizeVILoad(vi, _pLog);
    }
    _virtualInstrumentScope = savedVIScope;
    // The clumps code will be loaded once the module is finalized.
}
//------------------------------------------------------------
void TDViaParser::FinalizeVILoad(VirtualInstrument* vi, EventLog* pLog)
{
    SubString clumpSource = vi->_clumpSource;

    VIClump *pClump = vi->Clumps()->Begin();
    VIClump *pClumpEnd = vi->Clumps()->End();

    if (pClump && pClump->_codeStart == nullptr) {
        InstructionAllocator cia;

        {
            // (1) Parse, but don't create any instructions, determine how much memory is needed.
            // Errors are ignored in this pass.
#ifdef VIREO_USING_ASSERTS
            //  Int32 startingAllocations = vi->TheTypeManager()->_totalAllocations;
#endif
            EventLog dummyLog(EventLog::DevNull);
            TDViaParser parser(vi->TheTypeManager(), &clumpSource, &dummyLog, vi->_lineNumberBase,
                nullptr, false, false, false, false, _debugging);
            for (; pClump < pClumpEnd; pClump++) {
                parser.ParseClump(pClump, &cia);
            }
#ifdef VIREO_USING_ASSERTS
            // The first pass should just calculate the size needed. If any allocations occurred then
            // there is a problem.
            // Int32 endingAllocations = vi->TheTypeManager()->_totalAllocations;
            // VIREO_ASSERT(startingAllocations == endingAllocations)
#endif
        }

        // (2) Allocate a chunk for instructions to come out of.
        pClump = vi->Clumps()->Begin();
        cia.Allocate(pClump->TheTypeManager());

        {
            // (3) Parse a second time, instructions will be allocated out of the chunk.
            TDViaParser parser(vi->TheTypeManager(), &clumpSource, pLog, vi->_lineNumberBase,
                nullptr, false, false, false, false, _debugging);
            for (; pClump < pClumpEnd; pClump++) {
                parser.ParseClump(pClump, &cia);
            }
        }

        if (cia._size != 0) {
            pLog->LogEvent(EventLog::kHardDataError, vi->_lineNumberBase, "Requested and allocated memory size is different.");
            exit(1);
        }
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
            tokenFound = (_string.ReadSubexpressionToken(&token) != TokenTraits_Unrecognized);
        }
    } while (tokenFound);
}
//------------------------------------------------------------
void TDViaParser::ParseClump(VIClump* viClump, InstructionAllocator* cia)
{
    ClumpParseState state(viClump, cia, _pLog);
    SubString  token;
    SubString  instructionNameToken;
    std::vector<SubString> argExpressionTokens;
    argExpressionTokens.reserve(ClumpParseState::kMaxArguments);
    TokenTraits tt = _string.ReadToken(&token);
    if (!token.CompareCStr(tsClumpToken))
        return LOG_EVENT(kHardDataError, "'clump' missing");

    if (!_string.EatChar('('))
        return LOG_EVENT(kHardDataError, "'(' missing");

    // Read first instruction, or firecount. If no instruction then the closing paren
    // of the clump will be found immediately
    tt = _string.ReadToken(&token);
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

    while (!instructionNameToken.CompareCStr(")")) {
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
        } else if (instructionNameToken.CompareCStr("DebugPoint") && !_debugging) {
            // No -Op
            if (!_string.EatChar('('))
                return LOG_EVENT(kHardDataError, "'(' missing");
            // Skip over the DebugPoint arguments
            SubString skipTokens;
            do {
                _string.ReadToken(&skipTokens);
            } while (!skipTokens.CompareCStr(")"));
        } else {
            instructionNameToken.TrimQuotedString(tt);
            Boolean keepTrying = state.StartInstruction(&instructionNameToken) != nullptr;

            // Start reading actual parameters
            if (!_string.EatChar('('))
                return LOG_EVENT(kHardDataError, "'(' missing");

            // Parse the arguments once and determine how many were passed to the instruction.
            Int32 argCount = 0;
            for (; true; argCount++) {
                _string.ReadSubexpressionToken(&token);
                if (token.Length() == 0 || token.CompareCStr(")")) {
                    break;
                }
                argExpressionTokens.push_back(token);
            }

            while (keepTrying) {
                Int32 uncountedArgs = 0;
                for (Int32 i = 0; (i < argCount) && keepTrying; i++) {
                    token = argExpressionTokens[i];
                    TypeRef formalType = state.ReadFormalParameterType();

                    state._parserFocus = token;
                    if (formalType) {
                        // TODO(PaulAustin): the type classification can be moved into a codec independent class.
                        SubString formalParameterTypeName = formalType->Name();

                        if (formalParameterTypeName.CompareCStr("VarArgCount")) {
                            VIREO_ASSERT(!state.VarArgParameterDetected());
                            state.AddVarArgCount();
                            // If the formal type is "VarArgCount"
                            // restart processing current argument, its the first vararg
                            i--;
                            uncountedArgs++;
                            continue;
                        }
                        if (formalParameterTypeName.CompareCStr("VarArgRepeat")) {
                            state.SetVarArgRepeat();
                            i--;
                            uncountedArgs++;
                            continue;
                        }

                        if (formalParameterTypeName.CompareCStr("BranchTarget")) {  // unadorned number
                            state.AddBranchTargetArgument(&token);
                        } else if (formalParameterTypeName.CompareCStr(tsVIClumpType)) {
                            // Parse as an integer then resolve to pointer to the clump.
                            state.AddClumpTargetArgument(&token);
                        } else if (formalParameterTypeName.CompareCStr("StaticType")) {
                            state.AddDataTargetArgument(&token, true, false);
                        } else if (formalParameterTypeName.CompareCStr("StaticTypeExplicitData")) {
                            state.AddDataTargetArgument(&token, true, false);
                            i--;
                            uncountedArgs++;
                            continue;
                        } else if (formalParameterTypeName.CompareCStr("StaticTypeAndData")) {
                            state.AddDataTargetArgument(&token, true, true);
                        } else if (formalParameterTypeName.CompareCStr("EnumTypeAndData")) {
                            state.AddDataTargetArgument(&token, true, true);
                        } else if (formalType->IsStaticParam()) {
                            if (!state.HasMultipleDefinitions())
                                LOG_EVENT(kSoftDataError, "unexpected static parameter");
                        } else {
                            // The most common case is a data value
                            state.AddDataTargetArgument(&token, false, true);  // For starters
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
                if (state._varArgCount >= 0 && argCount < state._instructionType->SubElementCount()-uncountedArgs-1) {
                    // var args but didn't read all the required args
                    keepTrying = false;
                }
                if (keepTrying) {
                    // If there were no arg mismatches then one was found.
                    keepTrying = false;
                } else {
                    // See if there is another overload to try.
                    keepTrying = state.StartNextOverload() != nullptr;
                }
            }
            InstructionCore* instruction = state.EmitInstruction();
#if VIREO_DEBUG_PARSING_PRINT_OVERLOADS
            if (cia->IsCalculatePass()) {
                if (instruction) {
                    gPlatform.IO.Printf("\tAn overload was found.\n");
                } else {
                    gPlatform.IO.Printf("\tAn overload wasn't found. Unable to generate instruction.\n");
                }
            }
#endif
            if (!instruction) {
                LOG_EVENTV(kSoftDataError, "Instruction not generated '%.*s'", FMT_LEN_BEGIN(&instructionNameToken));
            }
            argExpressionTokens.clear();
        }
        tt = _string.ReadToken(&instructionNameToken);
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

    TypeRef typeEnd = nullptr;
    TypeRef typeList = tm->TypeList();

    while (true) {
        TypeRef type = typeList;
        while (type != typeEnd) {
            if (type->HasCustomDefault() && type->IsA(&strVIType)) {
                TypedArrayCoreRef *pObj = (TypedArrayCoreRef*) type->Begin(kPARead);
                VirtualInstrument *vi = (VirtualInstrument*) (*pObj)->RawObj();
                FinalizeVILoad(vi, pLog);
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
//! Create a parser and process all the declarations in the stream.
NIError TDViaParser::StaticRepl(TypeManagerRef tm, SubString *replStream, Boolean debugging)
{
    TypeManagerScope scope(tm);

    STACK_VAR(String, errorLog);
    EventLog log(errorLog.Value);

    TDViaParser parser(tm, replStream, &log, 1, nullptr, false, false, false, false, debugging);
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
    explicit TDViaFormatterTypeVisitor(TDViaFormatter* pFormatter) {
        _pFormatter = pFormatter;
    }
 private:
    //------------------------------------------------------------
    void VisitBad(TypeRef type) override
    {
        _pFormatter->_string->AppendCStr("BadType");
    }
    //------------------------------------------------------------
    void VisitBitBlock(BitBlockType* type) override
    {
        _pFormatter->_string->AppendCStr("bb(");
        IntIndex length = type->BitLength();
        _pFormatter->FormatInt(kEncoding_DimInt, length);
        _pFormatter->_string->Append(' ');
        _pFormatter->FormatEncoding(type->BitEncoding());
        _pFormatter->_string->Append(')');
    }
    //------------------------------------------------------------
    void VisitAggregate(TypeRef type, ConstCStr prefix) {
        _pFormatter->_string->AppendCStr(prefix);
        IntIndex subElementCount = type->SubElementCount();
        for (IntIndex i = 0; i < subElementCount; i++) {
            TypeRef subType = type->GetSubElement(i);
            subType->Accept(this);
        }
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    void VisitBitCluster(BitClusterType* type) override
    {
        VisitAggregate(type, "bc(");
    }
    //------------------------------------------------------------
    void VisitCluster(ClusterType* type) override
    {
        VisitAggregate(type, "c(");
    }
    //------------------------------------------------------------
    void VisitParamBlock(ParamBlockType* type) override
    {
        VisitAggregate(type, "p(");
    }
    //------------------------------------------------------------
    void VisitEquivalence(EquivalenceType* type) override
    {
        VisitAggregate(type, "eq(");
    }
    //------------------------------------------------------------
    void VisitArray(ArrayType* type) override
    {
        _pFormatter->_string->AppendCStr("a(");
        type->GetSubElement(0)->Accept(this);
        IntIndex* pDimension = type->DimensionLengths();

        for (Int32 rank = type->Rank(); rank > 0; rank--) {
            _pFormatter->_string->Append(' ');
            _pFormatter->FormatInt(kEncoding_DimInt, *pDimension);
            pDimension++;
        }
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    void VisitElement(ElementTypeRef type) override
    {
        if (type->ElementUsageType() == kUsageTypeSimple && type->IsDataItem())
            _pFormatter->_string->AppendCStr(tsDataitemElementToken);
        else
            _pFormatter->FormatElementUsageType(type->ElementUsageType());
        _pFormatter->_string->Append('(');
        type->BaseType()->Accept(this);
        SubString elementName = type->ElementName();
        if (elementName.Length() > 0) {
            // Add element name if it exists.
            _pFormatter->_string->Append(' ');
            _pFormatter->_string->Append(elementName.Length(), elementName.Begin());
        }
        _pFormatter->_string->Append(')');
    }
    //------------------------------------------------------------
    void VisitNamed(NamedType* type) override
    {
        // At this point names are terminal elements.
        // There needs to be a mechanism that will optionally collect all the named dependencies
        // in a type.
        SubString name = type->Name();
        if (name.Length() > 0) {
            _pFormatter->_string->Append('.');
            _pFormatter->_string->Append(name.Length(), (Utf8Char*)name.Begin());
            return;
        }
    }
    //------------------------------------------------------------
    void VisitPointer(PointerType* type) override
    {
        _pFormatter->_string->AppendCStr("^");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr("");
    }
    //------------------------------------------------------------
    void VisitEnum(EnumType* type) override
    {
        _pFormatter->_string->AppendCStr("enum(");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr(")");
    }

    void VisitRefNumVal(RefNumValType* type) override
    {
        _pFormatter->_string->AppendCStr("^");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr("");
    }
    //------------------------------------------------------------
    void VisitDefaultValue(DefaultValueType* type) override
    {
        _pFormatter->_string->AppendCStr(type->IsMutableValue() ? "var(" : "dv(");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    void VisitDefaultPointer(DefaultPointerType* type) override
    {
        _pFormatter->_string->AppendCStr("dvp(");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr(")");
    }
    //------------------------------------------------------------
    void VisitCustomDataProc(CustomDataProcType* type) override
    {
        _pFormatter->_string->AppendCStr("cdp(");
        type->BaseType()->Accept(this);
        _pFormatter->_string->AppendCStr(")");
    }
};

//------------------------------------------------------------
// If formatting options specify to use the locale's default separator
// then this variable should be used.
char TDViaFormatter::LocaleDefaultDecimalSeparator = '.';

// the format const used in Formatter and Parser
ViaFormatChars TDViaFormatter::formatVIA =       { kVIAEncoding, '(', ')', '(', ')', ' ', '\'',  kViaFormat_NoFieldNames};
ViaFormatChars TDViaFormatter::formatJSON =      { kJSONEncoding, '[', ']', '{', '}', ',', '\"',
    ViaFormat(kViaFormat_QuotedFieldNames | kViaFormat_StopArrayParseOnFirstError | kViaFormat_SuppressInfNaN) };
ViaFormatChars TDViaFormatter::formatJSONLVExt = { kJSONEncoding, '[', ']', '{', '}', ',', '\"',
    ViaFormat(kViaFormat_QuotedFieldNames | kViaFormat_StopArrayParseOnFirstError | kViaFormat_UseLongNameInfNaN) };
ViaFormatChars TDViaFormatter::formatJSONEggShell = { kJSONEncoding, '[', ']', '{', '}', ',', '\"',
    ViaFormat(kViaFormat_QuotedFieldNames | kViaFormat_StopArrayParseOnFirstError | kViaFormat_UseLongNameInfNaN | kViaFormat_QuoteInfNanNames) };
ViaFormatChars TDViaFormatter::formatC =         { kCEncoding,    '{', '}', '{', '}', ',', '\"', kViaFormat_NoFieldNames};
ViaFormatChars TDViaFormatter::formatLabVIEW = { kLabVIEWEncoding, '(', ')', '(', ')', ' ', '\'',
    ViaFormat(kViaFormat_NoFieldNames | kViaFormat_UseUppercaseForBooleanValues) };

//------------------------------------------------------------
TDViaFormatter::TDViaFormatter(
    StringRef str,
    Boolean quoteOnTopString,
    Int32 fieldWidth,
    SubString* format,
    JSONEncodingEnum encoding)
{
    // Might move all options to format string.
    _string = str;
    _options._bQuoteStrings = quoteOnTopString;
    _options._bQuote64BitNumbers = false;
    _options._fieldWidth = fieldWidth;
    _options._precision = -1;
    _options._exponentialNotation = false;
    _errorCode = kLVError_NoError;

    if (!format || format->ComparePrefixCStr(formatVIA._name)) {
        _options._bEscapeStrings = false;
        _options._fmt = formatVIA;
    } else if (format->ComparePrefixCStr(formatLabVIEW._name)) {
        _options._bEscapeStrings = false;
        _options._fmt = formatLabVIEW;
    } else if (format->ComparePrefixCStr(formatJSON._name)) {
        _options._precision = 17;
        _options._bEscapeStrings = true;
        switch (encoding) {
            case kJSONEncodingRegular:
                _options._fmt = formatJSON;
                break;
            case kJSONEncodingLVExtensions:
                _options._fmt = formatJSONLVExt;
                break;
            case kJSONEncodingEggShell:
                _options._bQuote64BitNumbers = true;
                _options._fmt = formatJSONEggShell;
                break;
        }
    } else if (format->ComparePrefixCStr(formatC._name)) {
        _options._fmt = formatC;
    }
}
//------------------------------------------------------------
void TDViaFormatter::FormatEncoding(EncodingEnum value) const
{
    ConstCStr str = nullptr;
    switch (value) {
        case kEncoding_Boolean:         str = tsBoolean;        break;
        case kEncoding_UInt:            str = tsUInt;           break;
        case kEncoding_S2CInt:          str = tsSInt;           break;
        case kEncoding_Enum:           str = tsEnum;            break;
        case kEncoding_Pointer:         str = tsPointer;        break;
        case kEncoding_IEEE754Binary:   str = tsIEEE754Binary;  break;
        case kEncoding_Ascii:           str = tsAscii;          break;
        default:                        str = "<TODO>";         break;
    }
    _string->AppendCStr(str);
}
//------------------------------------------------------------
void TDViaFormatter::FormatElementUsageType(UsageTypeEnum value) const
{
    ConstCStr str = nullptr;
    switch (value) {
        case kUsageTypeSimple:          str = tsElementToken;           break;
        case kUsageTypeConst:           str = tsConstElementToken;      break;
        case kUsageTypeInput:           str = tsInputParamToken;        break;
        case kUsageTypeOutput:          str = tsOutputParamToken;       break;
        case kUsageTypeInputOutput:     str = tsInputOutputParamToken;  break;
        case kUsageTypeStatic:          str = tsStaticParamToken;       break;
        case kUsageTypeTemp:            str = tsTempParamToken;         break;
        case kUsageTypeAlias:           str = tsAliasToken;             break;
        default:                        str = "<TODO>";                 break;
    }
    _string->AppendCStr(str);
}
//------------------------------------------------------------
void TDViaFormatter::FormatInt(EncodingEnum encoding, IntMax value, Boolean is64Bit /*= false*/) const
{
    char buffer[kTempFormattingBufferSize];
    ConstCStr format = nullptr;

    if (encoding == kEncoding_S2CInt) {
        if (is64Bit && _options._bQuote64BitNumbers) {
            format = "\"%*lld\"";  // json should encode i64s as strings
        } else {
            format = "%*lld";
        }
    } else if (encoding == kEncoding_UInt || encoding == kEncoding_Enum) {
        if (is64Bit && _options._bQuote64BitNumbers) {
            format = "\"%*llu\"";  // json should encode u64s as strings
        } else {
            format = "%*llu";
        }
    } else if (encoding == kEncoding_RefNum) {
        format = "0x%*llx";
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
        format = "**unsupported type**";
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
    Int32 len = 0;
    Boolean suppressInfNaN = _options._fmt.SuppressInfNaN();
    Boolean quotedInfNaN = _options._fmt.QuotedNameInfNaN();

    if (std::isnan(value)) {
        if (!suppressInfNaN) {
            pBuff = "\"NaN\"";
            len = 3;
            if (quotedInfNaN)
                len += 2;  // include quotes
            else
                pBuff++;  // skip quotes
        } else {
            _errorCode = kLVError_JSONBadNaN;
        }
    } else if (std::isinf(value)) {
        if (!suppressInfNaN) {
            Boolean longForm = _options._fmt.LongNameInfNaN();
            if (value < 0) {
                pBuff = longForm ? "\"-Infinity\"" : "\"-Inf\"";
                len = longForm ? 9 : 4;
            } else {
                pBuff = longForm ? "\"Infinity\"" : "\"Inf\"";
                len = longForm ? 8 : 3;
            }
            if (quotedInfNaN)
                len += 2;  // include quotes
            else
                pBuff++;  // skip quotes
        } else {
            _errorCode = kLVError_JSONBadInf;
        }
    } else {
        char formatBuffer[32];
        if (_options._precision >= 0)
            snprintf(formatBuffer, sizeof(formatBuffer), "%%%d.%d%s", _options._fieldWidth, _options._precision,
                     _options._exponentialNotation ? "E" : "G");
        else
            snprintf(formatBuffer, sizeof(formatBuffer), "%%%d%s", _options._fieldWidth,
                     _options._exponentialNotation ? "E" : "G");
        len = snprintf(buffer, sizeof(buffer), formatBuffer, value);
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
        // serialize the pointer type and whether it is null or not
        if (Fmt().UseFieldNames())
            _string->Append(Fmt()._quote);
        _string->Append('^');
        _string->Append(name.Length(), (Utf8Char*)name.Begin());
        if ((*(void**)pData) == nullptr) {
            _string->Append(5, (Utf8Char*)"_null");
        }
        if (Fmt().UseFieldNames())
            _string->Append(Fmt()._quote);
    }
}
//------------------------------------------------------------
void TDViaFormatter::FormatType(TypeRef type)
{
    if (Fmt().UseFieldNames())
        _string->Append(Fmt()._quote);
    if (type) {
        TDViaFormatterTypeVisitor visitor(this);
        type->Accept(&visitor);
    } else {
        _string->Append(4, (Utf8Char*)"null");
    }
    if (Fmt().UseFieldNames())
        _string->Append(Fmt()._quote);
}
//------------------------------------------------------------
void TDViaFormatter::FormatArrayData(TypeRef arrayType, TypedArrayCoreRef pArray, Int32 rank)
{
    if (nullptr == pArray) {
        _string->AppendCStr("null");
        return;
    }
    TypeRef elementType = pArray->ElementType();
    EncodingEnum elementEncoding = elementType->BitEncoding();
    if (rank == 1 && (elementEncoding == kEncoding_Ascii || (elementEncoding == kEncoding_Unicode))) {
        // Unicode + elt size == 1 => Utf8
        // not planning on doing UTF16, or 32 at this time
        // These encodings have a special format
        // TODO(PaulAustin): option for raw or escaped forms need to be covered, sometime in quotes
        if (_options._bQuoteStrings) {
            _string->Append(Fmt()._quote);
        }
        // whether need to escape the string
        if (_options._bEscapeStrings) {
            SubString ss(pArray->RawBegin(), pArray->RawBegin() + pArray->Length());
            _string->AppendEscapeEncoded(ss.Begin(), ss.Length());
        } else {
            _string->Append(pArray->Length(), pArray->RawBegin());
        }

        if (_options._bQuoteStrings) {
            _string->Append(Fmt()._quote);
        }
    } else if (rank > 0) {
        _options._bQuoteStrings = true;
        FormatArrayDataRecurse(elementType, rank, pArray->BeginAt(0),
                               pArray->DimensionLengths(),
                               pArray->SlabLengths(),
                               pArray->Length());
    } else if (rank == 0) {
        FormatData(elementType, pArray->RawObj());
    }
}
//------------------------------------------------------------
void TDViaFormatter::FormatArrayDataRecurse(TypeRef elementType, Int32 rank, AQBlock1* pBegin,
    IntIndex *pDimLengths, IntIndex *pSlabLengths, IntIndex totalLength)
{
    rank = rank - 1;

    size_t   elementLength = pSlabLengths[rank];
    IntIndex dimensionLength = pDimLengths[rank];
    AQBlock1 *pElement = pBegin;

    _string->Append(Fmt()._arrayPre);
    IntIndex origLen = *_string->DimensionLengths();

    if (rank != 0) {
        FormatArrayDataRecurse(elementType, rank, pElement, pDimLengths, pSlabLengths, totalLength);
    }
    if (totalLength > 0) {
        if (dimensionLength-- > 0) {
            if (rank == 0) {
                FormatData(elementType, pElement);
            }
            pElement += elementLength;
            if (rank == 0) {  // estimate total array size based on first element and pre-allocate
                IntIndex preAlloc = origLen + (1 + dimensionLength) * (*_string->DimensionLengths() - origLen + 1);
                origLen = *_string->DimensionLengths();
                _string->ResizeDimensions(1, &preAlloc, true, true);
                *_string->DimensionLengths() = origLen;
            }
        }
        while (dimensionLength-- > 0) {
            _string->Append(Fmt()._itemSeparator);
            if (rank == 0) {
                FormatData(elementType, pElement);
            } else {
                FormatArrayDataRecurse(elementType, rank, pElement, pDimLengths, pSlabLengths, totalLength);
            }
            pElement += elementLength;
        }
    }
    _string->Append(Fmt()._arrayPost);
}
//------------------------------------------------------------
void TDViaFormatter::FormatClusterData(TypeRef type, void *pData)
{
    IntIndex count = type->SubElementCount();
    IntIndex i = 0;
    _options._bQuoteStrings = true;
    _string->Append(Fmt()._clusterPre);
    while (i < count) {
        if (i > 0) {
            _string->Append(Fmt()._itemSeparator);
        }
        TypeRef elementType = type->GetSubElement(i++);
        if (Fmt().UseFieldNames()) {
            SubString ss = elementType->ElementName();
            Boolean useQuotes = Fmt().QuoteFieldNames();
            if (useQuotes)
                _string->Append('\"');

           // TODO(PaulAustin): use percent encoding when needed
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
void TDViaFormatter::FormatVariant(TypeRef type, void *pData)
{
    _options._bQuoteStrings = true;
    _string->Append(Fmt()._clusterPre);
    Boolean useQuotesForFieldNames = Fmt().QuoteFieldNames();
    VariantDataRef variantData = *reinterpret_cast<VariantDataRef *>(pData);
    if (useQuotesForFieldNames)
        _string->Append(Fmt()._quote);
    _string->AppendCStr(variantInnerData);
    if (useQuotesForFieldNames)
        _string->Append(Fmt()._quote);
    _string->Append(*tsNameSuffix);

    TypeRef innerType = variantData->GetInnerType();
    if (innerType) {
        FormatData(innerType, variantData->GetInnerData());
    } else {
        _string->AppendCStr("null");
    }
    _string->Append(Fmt()._itemSeparator);
    if (useQuotesForFieldNames)
        _string->Append(Fmt()._quote);
    _string->AppendCStr(variantAttributes);
    if (useQuotesForFieldNames)
        _string->Append(Fmt()._quote);
    _string->Append(*tsNameSuffix);
    if (variantData->HasMap()) {
        _string->Append(Fmt()._clusterPre);
        auto iterator = variantData->GetMap_cbegin(), iteratorBegin = variantData->GetMap_cbegin(), iteratorEnd = variantData->GetMap_cend();
        for (; iterator != iteratorEnd; ++iterator) {
            if (iterator != iteratorBegin) {
                _string->Append(Fmt()._itemSeparator);
            }
            StringRef attributeName = iterator->first;
            if (_options._bQuoteStrings)
                _string->Append(Fmt()._quote);
            if (_options._bEscapeStrings) {
                _string->AppendEscapeEncoded(attributeName->Begin(), attributeName->End() - attributeName->Begin());
            } else {
                _string->Append(attributeName);
            }
            if (_options._bQuoteStrings)
                _string->Append(Fmt()._quote);
            _string->Append(*tsNameSuffix);
            VariantDataRef attributeValue = iterator->second;
            FormatVariant(attributeValue->Type(), &attributeValue);
        }
        _string->Append(Fmt()._clusterPost);
    } else {
        _string->AppendCStr("null");
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
                FormatInt(type->BitEncoding(), intValue, type->IsInteger64());
            }
            break;
        case kEncoding_Enum:
            {
                IntMax intValue = ReadIntFromMemory(type, pData);
                if (Fmt().GenerateJSON()) {
                    FormatInt(type->BitEncoding(), intValue);
                } else {
                    StringRef itemName = type->GetEnumItemName(IntIndex(intValue));
                    if (itemName) {
                        _string->Append(itemName);
                    } else {  // enum index out of range
                        _string->Append('<');
                        FormatInt(kEncoding_UInt, intValue);
                        _string->Append('>');
                    }
                }
            }
            break;
        case kEncoding_IEEE754Binary:
            FormatIEEE754(type, pData);
            break;
        case kEncoding_Pointer:
            FormatPointerData(type, pData);
            break;
        case kEncoding_Boolean:
            if (Fmt().UseUppercaseForBooleanValues())
                _string->AppendCStr((*(AQBlock1*)pData) ? "TRUE" : "FALSE");
            else
                _string->AppendCStr((*(AQBlock1*) pData) ? "true" : "false");
            break;
        case kEncoding_Generic:
            if (Fmt().UseFieldNames())
                _string->Append(Fmt()._quote);
            _string->Append('*');
            if (Fmt().UseFieldNames())
                _string->Append(Fmt()._quote);
            break;
        case kEncoding_Array:
            // For array and object types pass the array ref (e.g. handle)
            // not the pointer to it.
            FormatArrayData(type, *(TypedArrayCoreRef*)pData, type->Rank());
            break;
        case kEncoding_Cluster:
            FormatClusterData(type, pData);
            break;
        case kEncoding_Variant:
            if (!Fmt().GenerateJSON() || TDViaFormatter::IsFormatJSONEggShell(Fmt())) {
                FormatVariant(type, pData);
            }
            break;
        case kEncoding_RefNum:
            {
                if (Fmt().UseFieldNames())
                    _string->Append(Fmt()._quote);
                RefNumVal *refVal = (RefNumVal*)pData;
                SubString name = type->Name();
                UInt32 refnum = refVal->GetRefNum();
                if (name.Length() > 0)
                    _string->Append(name.Length(), (Utf8Char*)name.Begin());
                else
                    _string->AppendCStr(tsRefNumTypeToken);
                if (name.CompareCStr(tsControlRefNumToken))
                    ControlReferenceAppendDescription(_string, refnum);
                _string->Append('(');
                FormatInt(kEncoding_RefNum, refnum);
                _string->Append(')');
                if (Fmt().UseFieldNames())
                    _string->Append(Fmt()._quote);
            }
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
struct FlattenToJSONParamBlock : VarArgInstruction
{
    _ParamImmediateDef(StaticTypeAndData, arg1[1]);
    _ParamDef(Boolean, lvExtensions);
    _ParamDef(StringRef, stringOut);
    _ParamDef(ErrorCluster, errClust);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(FlattenToJSON, FlattenToJSONParamBlock)
{
    StaticTypeAndData *arg =  _ParamImmediate(arg1);

    _Param(stringOut)->Resize1D(0);
    if (_ParamVarArgCount() > 4 && _Param(errClust).status)
        return _NextInstruction();

    SubString json(kJSONEncoding);

    JSONEncodingEnum encoding = _Param(lvExtensions) ? kJSONEncodingLVExtensions : kJSONEncodingRegular;

    TDViaFormatter formatter(_Param(stringOut), true, 0, &json, encoding);
    if (arg[0]._paramType->IsCluster()) {
        formatter.FormatClusterData(arg[0]._paramType, arg[0]._pData);
    } else {
        formatter.FormatData(arg[0]._paramType, arg[0]._pData);
    }
    Int32 errCode = formatter.GetError();
    if (errCode) {
        if (_ParamVarArgCount() > 4) {
            _ParamPointer(errClust)->SetErrorAndAppendCallChain(true, errCode, "Flatten To JSON");
        }
        _Param(stringOut)->Resize1D(0);
    } else if (_ParamVarArgCount() > 4) {
        _ParamPointer(errClust)->SetError(false, 0, "");
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
struct UnflattenFromJSONParamBlock : VarArgInstruction
{
    _ParamDef(StringRef, jsonString);
    _ParamImmediateDef(StaticTypeAndData, arg1[1]);
    _ParamDef(TypedArray1D<StringRef>*, itemPath);
    _ParamDef(Boolean, lvExtensions);
    _ParamDef(Boolean, defaultNullElements);
    _ParamDef(Boolean, strictValidation);
    _ParamDef(ErrorCluster, errClust);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(UnflattenFromJSON, UnflattenFromJSONParamBlock)
{
    if (_ParamVarArgCount() > 7 && _Param(errClust).status)
        return _NextInstruction();

    SubString jsonString = _Param(jsonString)->MakeSubStringAlias();
    StaticTypeAndData *arg =  _ParamImmediate(arg1);
    Int32 error = kLVError_NoError;

    TypedArray1D<StringRef> *itemPath = _Param(itemPath);
    EventLog log(EventLog::DevNull);
    SubString jsonFormat(kJSONEncoding);
    TDViaParser parser(THREAD_TADM(), &jsonString, &log, 1, &jsonFormat, _Param(lvExtensions), _Param(strictValidation), false, _Param(defaultNullElements));
    if (itemPath->Length() > 0) {
        for (IntIndex i = 0; !error && i < itemPath->Length(); i++) {
            SubString p = itemPath->At(i)->MakeSubStringAlias();
            if (!parser.EatJSONPath(&p)) {
                error = kLVError_JSONInvalidPath;
            }
        }
    }
    if (!error) {
        Int32 topSize = arg[0]._paramType->TopAQSize();
        char *buffer = new char[topSize];  // passed in default data is overwritten since it's also the output.  Save a copy.
        // TODO(spathiwa): Consider refactor to make default and output different args?
        memset(buffer, 0, topSize);
        arg[0]._paramType->InitData(buffer);
        arg[0]._paramType->CopyData(arg[0]._pData, buffer);
        error = parser.ParseData(arg[0]._paramType, arg[0]._pData);
        if (error == kLVError_JSONInvalidString || error == kLVError_ArgError) {
            arg[0]._paramType->CopyData(buffer, arg[0]._pData);
        }
        arg[0]._paramType->ClearData(buffer);
        delete[] buffer;
    }
    if (_ParamVarArgCount() > 7) {  // error I/O wired
        ErrorCluster *errPtr = _ParamPointer(errClust);
        if (error) {
            errPtr->SetErrorAndAppendCallChain(true,  error && error != kLVError_ArgError ? error : kLVError_JSONInvalidString, "Unflatten From JSON");
        }
    }
    return _NextInstruction();
}

#endif

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(FromString, StringRef, StaticType, void, StringRef)
{
    TypeRef type = _ParamPointer(1);

    SubString str = _Param(0)->MakeSubStringAlias();

    StringRef strRef;
    if (_ParamPointer(3)) {
        strRef = _Param(3);
    } else {
        strRef = EventLog::DevNull;
    }
    EventLog log(strRef);

    TDViaParser parser(THREAD_TADM(), &str, &log, 1);
    parser._loadVIsImmediately = true;

    parser.ParseData(type, _ParamPointer(2));
    return _NextInstruction();
}

// saturate (pin) value if out of range
static void SaturateValue(TypeRef type, Int64 *value, Boolean sourceIsFloat) {
    Int32 aqSize = type->TopAQSize();
    if (aqSize < 8) {
        // saturate if out of range
        Boolean isSigned = type->BitEncoding() != kEncoding_UInt;
        Int32 maskSignBitAdjust = sourceIsFloat || !isSigned;
        IntMax mask = ~0ULL << (aqSize*8-maskSignBitAdjust), upperBits = (*value & mask);
        if (isSigned && upperBits != 0 && upperBits != mask)
            *value = *value > 0 ? (IntMax)(1ULL << (aqSize*8-1))-1 : (IntMax)(1ULL << (aqSize*8-1));
        else if (!isSigned && (*value & (~0ULL << (aqSize*8))) != 0)
                *value = ~0ULL >> ((8-aqSize)*8);
    }
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(DecimalStringToNumber, StringRef, Int32, void, Int32, StaticType, void)
{
    StringRef str = _Param(0);
    Int32 beginOffset = _ParamPointer(1) ? _Param(1) : 0;
    void *pDefault = _ParamPointer(2);
    TypeRef type = _ParamPointer(4);
    void *pData = _ParamPointer(5);

    if (beginOffset < 0)
        beginOffset = 0;
    SubString substring(str->BeginAt(beginOffset), str->End());
    Int32 length1 = substring.Length();
    Int32 length2;
    Boolean success;

    if (pData) {  // If an argument is passed for the output value, read a value into it.
        EventLog log(EventLog::DevNull);
        TDViaParser parser(THREAD_TADM(), &substring, &log, 1);
        Int64 parsedValue;

        // ParseData needs to be given an integer type so that it parses the string as a decimal string.
        TypeRef parseType = THREAD_TADM()->FindType(tsInt64Type);

        parser.ParseData(parseType, &parsedValue);

        success = (parser.ErrorCount() == 0);
        if (success) {
            if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                WriteDoubleToMemory(type, pData, static_cast<Double>(parsedValue));
            } else {
                SaturateValue(type, &parsedValue, true);
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
    } else {  // Otherwise, just read the string to find the end offset.
        success = substring.ReadInt(nullptr);
        length2 = substring.Length();
    }

    // Output offset past the parsed value
    if (_ParamPointer(3))
        _Param(3) = beginOffset + (success ? length1 - length2 : 0);

    return _NextInstruction();
}

static void BaseStringToNumber(Int32 base, StringRef str, Int32 beginOffset, Int32 *endOffset, void *pDefault, TypeRef type, void *pData) {
    if (beginOffset < 0)
        beginOffset = 0;
    SubString substring(str->BeginAt(beginOffset), str->End());
    Int32 length1 = substring.Length();
    Int32 length2;
    Boolean success;

    if (pData) {  // If an argument is passed for the output value, read a value into it.
        Int64 parsedValue = 0, sign = 1;
        if (substring.EatChar('-'))
            sign = -1;
        success = substring.ReadIntWithBase(&parsedValue, base);
        if (success) {
            if (type->BitEncoding() == kEncoding_IEEE754Binary) {
                parsedValue *= sign;
                WriteDoubleToMemory(type, pData, static_cast<Double>(parsedValue));
            } else {
                if (sign < 0) {
                    switch (type->TopAQSize()) {  // sign-extend
                        case 1:
                            parsedValue = (Int64)(Int8)parsedValue;
                            break;
                        case 2:
                            parsedValue = (Int64)(Int16)parsedValue;
                            break;
                        case 4:
                            parsedValue = (Int64)(Int32)parsedValue;
                            break;
                        default:
                            break;
                    }
                }
                SaturateValue(type, &parsedValue, false);
                parsedValue *= sign;
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
        length2 = substring.Length();  // ??? parser.TheString()->Length();
    } else {  // Otherwise, just read the string to find the end offset.
        success = substring.ReadInt(nullptr);
        length2 = substring.Length();
    }

    // Output offset past the parsed value
    if (endOffset)
        *endOffset = beginOffset + (success ? length1 - length2 : 0);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(HexStringToNumber, StringRef, Int32, void, Int32, StaticType, void)
{
    Int32 beginOffset = _ParamPointer(1) ? _Param(1) : 0;
    BaseStringToNumber(16, _Param(0), beginOffset, _ParamPointer(3), _ParamPointer(2), _ParamPointer(4), _ParamPointer(5));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(OctalStringToNumber, StringRef, Int32, void, Int32, StaticType, void)
{
    Int32 beginOffset = _ParamPointer(1) ? _Param(1) : 0;
    BaseStringToNumber(8, _Param(0), beginOffset, _ParamPointer(3), _ParamPointer(2), _ParamPointer(4), _ParamPointer(5));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(BinaryStringToNumber, StringRef, Int32, void, Int32, StaticType, void)
{
    Int32 beginOffset = _ParamPointer(1) ? _Param(1) : 0;
    BaseStringToNumber(2, _Param(0), beginOffset, _ParamPointer(3), _ParamPointer(2), _ParamPointer(4), _ParamPointer(5));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(ExponentialStringToNumber, StringRef, Int32, void, Int32, StaticType, void)
{
    StringRef str = _Param(0);
    Int32 beginOffset = _ParamPointer(1) ? _Param(1) : 0;
    void *pDefault = _ParamPointer(2);
    TypeRef type = _ParamPointer(4);
    void *pData = _ParamPointer(5);

    if (beginOffset < 0)
        beginOffset = 0;
    SubString substring(str->BeginAt(beginOffset), str->End());
    Int32 length1 = substring.Length();
    Int32 length2;
    Boolean success;

    if (pData) {  // If an argument is passed for the output value, read a value into it.
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
                Int64 value = Int64(parsedValue);
                SaturateValue(type, &value, true);
                WriteIntToMemory(type, pData, value);
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
    } else {     // Otherwise, just read the string to find the end offset.
        success = substring.ParseDouble(nullptr);
        length2 = substring.Length();
    }

    // Output offset past the parsed value
    if (_ParamPointer(3))
        _Param(3) = beginOffset + (success ? length1 - length2 : 0);

    return _NextInstruction();
}

//------------------------------------------------------------
typedef void (*NumberToStringCallback)(TypeRef type, void *pData, Int32 minWidth, Int32 precision, StringRef str);

void NumberToFloatStringInternal(TypeRef type, void *pData, Int32 minWidth, Int32 precision, StringRef str) {
    StaticTypeAndData arguments[1] = {{ type, pData }};
    SubString format;
    char formatBuffer[32];
    snprintf(formatBuffer, sizeof(formatBuffer), "%%%d.%dF", minWidth, precision);
    format.AliasAssignCStr(formatBuffer);
    Format(&format, 1, arguments, str, nullptr);
}
void NumberToExponentialStringInternal(TypeRef type, void *pData, Int32 minWidth, Int32 precision, StringRef str)
{
    StaticTypeAndData arguments[1] = {{ type, pData }};
    SubString format;
    char formatBuffer[32];
    snprintf(formatBuffer, sizeof(formatBuffer), "%%%d.%dE", minWidth, precision);
    format.AliasAssignCStr(formatBuffer);
    Format(&format, 1, arguments, str, nullptr);
}
void NumberToEngineeringStringInternal(TypeRef type, void *pData, Int32 minWidth, Int32 precision, StringRef str)
{
    StaticTypeAndData arguments[1] = {{ type, pData }};
    SubString format;
    char formatBuffer[32];
    snprintf(formatBuffer, sizeof(formatBuffer), "%%^%d.%dE", minWidth, precision);
    format.AliasAssignCStr(formatBuffer);
    Format(&format, 1, arguments, str, nullptr);
}
void NumberToDecimalStringInternal(TypeRef type, void *pData, Int32 minWidth, Int32, StringRef str)
{
    StaticTypeAndData arguments[1] = {{ type, pData }};
    SubString format;
    char formatBuffer[32];
    if (type->IsComplex())
        snprintf(formatBuffer, sizeof(formatBuffer), "%%%d.0f", minWidth);
    else
        snprintf(formatBuffer, sizeof(formatBuffer), "%%%dd", minWidth);
    format.AliasAssignCStr(formatBuffer);
    Format(&format, 1, arguments, str, nullptr);
}
void NumberToHexStringInternal(TypeRef type, void *pData, Int32 minWidth, Int32, StringRef str)
{
    StaticTypeAndData arguments[1] = {{ type, pData }};
    SubString format;
    char formatBuffer[32];
    snprintf(formatBuffer, sizeof(formatBuffer), "%%0%dX", minWidth);
    format.AliasAssignCStr(formatBuffer);
    Format(&format, 1, arguments, str, nullptr);
}
void NumberToOctalStringInternal(TypeRef type, void *pData, Int32 minWidth, Int32, StringRef str)
{
    StaticTypeAndData arguments[1] = {{ type, pData }};
    SubString format;
    char formatBuffer[32];
    snprintf(formatBuffer, sizeof(formatBuffer), "%%0%do", minWidth);
    format.AliasAssignCStr(formatBuffer);
    Format(&format, 1, arguments, str, nullptr);
}
void NumberToBinaryStringInternal(TypeRef type, void *pData, Int32 minWidth, Int32, StringRef str)
{
    StaticTypeAndData arguments[1] = {{ type, pData }};
    SubString format;
    char formatBuffer[32];
    snprintf(formatBuffer, sizeof(formatBuffer), "%%0%db", minWidth);
    format.AliasAssignCStr(formatBuffer);
    Format(&format, 1, arguments, str, nullptr);
}

Boolean NumberToStringInternal(TypeRef type, AQBlock1 *pData, Int32 minWidth, Int32 precision,
    TypeRef destType, AQBlock1 *pDestData, NumberToStringCallback formatCallback)
{
    EncodingEnum encoding = type->BitEncoding();
    EncodingEnum destEncoding = destType->BitEncoding();
    switch (encoding) {
        case kEncoding_Array: {
            if (destEncoding != kEncoding_Array) {
                THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Type mismatch in NumberToString");
                return false;
            }
            TypeRef subType = type->GetSubElement(0);
            TypedArrayCoreRef pArray = *(TypedArrayCoreRef*)pData;
            TypedArrayCoreRef pDestArray = *(TypedArrayCoreRef*)pDestData;
            Int32 elementSize = type->GetSubElement(0)->TopAQSize();
            Int32 destElementSize = destType->GetSubElement(0)->TopAQSize();
            IntIndex count = pArray->Length();
            pDestArray->Resize1D(count);
            AQBlock1 *pElement = pArray->BeginAt(0);
            AQBlock1 *pDestElement = pDestArray->BeginAt(0);
            while (count > 0) {
                StringRef str = *(StringRef*)pDestElement;
                (*formatCallback)(subType, pElement, minWidth, precision, str);
                pElement += elementSize;
                pDestElement += destElementSize;
                --count;
            }
            break;
        }
        case kEncoding_Cluster: {
            IntIndex count = type->SubElementCount();
            if (type->IsComplex()) {
                count = 1;
                if (formatCallback == NumberToDecimalStringInternal) {
                    (*formatCallback)(type, pData, minWidth, precision, *(StringRef*)pDestData);
                    return true;
                }
            } else if (destEncoding != kEncoding_Cluster || count != destType->SubElementCount()) {
                THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Type mismatch in NumberToString");
                return false;
            }
            Int32 destElementSize = destType->GetSubElement(0)->TopAQSize();
            AQBlock1 *pDestElement = (AQBlock1*)pDestData;
            Int32 i = 0;
            while (i < count) {
                TypeRef subType = type->GetSubElement(i);
                AQBlock1 *pElement = pData + subType->ElementOffset();
                StringRef str = *(StringRef*)pDestElement;
                (*formatCallback)(subType, pElement, minWidth, precision, str);
                pDestElement += destElementSize;
                ++i;
            }
            break;
        }
        case kEncoding_Boolean:
        case kEncoding_UInt:
        case kEncoding_S2CInt:
        case kEncoding_Enum:
        case kEncoding_IEEE754Binary:
            if (destEncoding == kEncoding_Array && destType->Rank() == 1 && destType->GetSubElement(0)->BitEncoding() == kEncoding_Unicode) {
                StringRef str = *(StringRef*)pDestData;
                (*formatCallback)(type, pData, minWidth, precision, str);
                break;
            }  // else fall through...
        default:
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Illegal type in NumberToString");
            return false;
    }
    return true;
}

VIREO_FUNCTION_SIGNATURE6(NumberToExponentialString, StaticType, void, Int32, Int32, StaticType, void)
{
    Int32 minWidth = _ParamPointer(2) ? _Param(2) : 0;
    Int32 precision = _ParamPointer(3) ? _Param(3) : 6;
    Boolean success = NumberToStringInternal(_ParamPointer(0), (AQBlock1*)_ParamPointer(1), minWidth,
                                            precision, _ParamPointer(4), (AQBlock1*)_ParamPointer(5),
                                            NumberToExponentialStringInternal);
    return success ? _NextInstruction() : THREAD_EXEC()->Stop();
}

VIREO_FUNCTION_SIGNATURE6(NumberToFloatString, StaticType, void, Int32, Int32, StaticType, void) {
    Int32 minWidth = _ParamPointer(2) ? _Param(2) : 0;
    Int32 precision = _ParamPointer(3) ? _Param(3) : 6;
    Boolean success = NumberToStringInternal(_ParamPointer(0), (AQBlock1*)_ParamPointer(1), minWidth,
                                             precision, _ParamPointer(4), (AQBlock1*)_ParamPointer(5),
                                             NumberToFloatStringInternal);
    return success ? _NextInstruction() : THREAD_EXEC()->Stop();
}

VIREO_FUNCTION_SIGNATURE6(NumberToEngineeringString, StaticType, void, Int32, Int32, StaticType, void)
{
    Int32 minWidth = _ParamPointer(2) ? _Param(2) : 0;
    Int32 precision = _ParamPointer(3) ? _Param(3) : 6;
    Boolean success = NumberToStringInternal(_ParamPointer(0), (AQBlock1*)_ParamPointer(1), minWidth,
                                             precision, _ParamPointer(4), (AQBlock1*)_ParamPointer(5),
                                             NumberToEngineeringStringInternal);
    return success ? _NextInstruction() : THREAD_EXEC()->Stop();
}

VIREO_FUNCTION_SIGNATURE5(NumberToDecimalString, StaticType, void, Int32, StaticType, void)
{
    Int32 minWidth = _ParamPointer(2) ? _Param(2) : 0;
    Boolean success = NumberToStringInternal(_ParamPointer(0), (AQBlock1*)_ParamPointer(1), minWidth,
                                             0, _ParamPointer(3), (AQBlock1*)_ParamPointer(4),
                                             NumberToDecimalStringInternal);
    return success ? _NextInstruction() : THREAD_EXEC()->Stop();
}

VIREO_FUNCTION_SIGNATURE5(NumberToHexString, StaticType, void, Int32, StaticType, void)
{
    Int32 minWidth = _ParamPointer(2) ? _Param(2) : 0;
    Boolean success = NumberToStringInternal(_ParamPointer(0), (AQBlock1*)_ParamPointer(1), minWidth,
                                             0, _ParamPointer(3), (AQBlock1*)_ParamPointer(4),
                                             NumberToHexStringInternal);
    return success ? _NextInstruction() : THREAD_EXEC()->Stop();
}

VIREO_FUNCTION_SIGNATURE5(NumberToOctalString, StaticType, void, Int32, StaticType, void)
{
    Int32 minWidth = _ParamPointer(2) ? _Param(2) : 0;
    Boolean success = NumberToStringInternal(_ParamPointer(0), (AQBlock1*)_ParamPointer(1), minWidth,
                                             0, _ParamPointer(3), (AQBlock1*)_ParamPointer(4),
                                             NumberToOctalStringInternal);
    return success ? _NextInstruction() : THREAD_EXEC()->Stop();
}

VIREO_FUNCTION_SIGNATURE5(NumberToBinaryString, StaticType, void, Int32, StaticType, void)
{
    Int32 minWidth = _ParamPointer(2) ? _Param(2) : 0;
    Boolean success = NumberToStringInternal(_ParamPointer(0), (AQBlock1*)_ParamPointer(1), minWidth,
                                             0, _ParamPointer(3), (AQBlock1*)_ParamPointer(4),
                                             NumberToBinaryStringInternal);
    return success ? _NextInstruction() : THREAD_EXEC()->Stop();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(DataAndTypeCodecUtf8)
#if defined(VIREO_VIA_FORMATTER)
    DEFINE_VIREO_FUNCTION(DefaultValueToString, "p(i(Type)o(String))")
    DEFINE_VIREO_FUNCTION(ToString, "p(i(StaticTypeAndData) i(Int16) o(String))")
    DEFINE_VIREO_FUNCTION(FlattenToJSON, "p(i(VarArgCount) i(StaticTypeAndData) i(Boolean) o(String) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION(UnflattenFromJSON,
        "p(i(VarArgCount) i(String) o(StaticTypeAndData) i(a(String *)) i(Boolean) i(Boolean) i(Boolean) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION_CUSTOM(ToString, ToStringEx, "p(i(StaticTypeAndData) i(String) o(String))")
    DEFINE_VIREO_FUNCTION(ToTypeAndDataString, "p(i(StaticTypeAndData) o(String))")
#endif
    DEFINE_VIREO_FUNCTION(FromString, "p(i(String) o(StaticTypeAndData) o(String))")
    DEFINE_VIREO_FUNCTION(DecimalStringToNumber, "p(i(String) i(Int32) i(*) o(Int32) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(HexStringToNumber, "p(i(String) i(Int32) i(*) o(Int32) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(OctalStringToNumber, "p(i(String) i(Int32) i(*) o(Int32) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(BinaryStringToNumber, "p(i(String) i(Int32) i(*) o(Int32) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(ExponentialStringToNumber, "p(i(String) i(Int32) i(*) o(Int32) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(NumberToFloatString, "p(i(StaticTypeAndData) i(Int32) i(Int32) o(StaticTypeAndData)")
    DEFINE_VIREO_FUNCTION(NumberToExponentialString, "p(i(StaticTypeAndData) i(Int32) i(Int32) o(StaticTypeAndData)")
    DEFINE_VIREO_FUNCTION(NumberToEngineeringString, "p(i(StaticTypeAndData) i(Int32) i(Int32) o(StaticTypeAndData)")
    DEFINE_VIREO_FUNCTION(NumberToDecimalString, "p(i(StaticTypeAndData) i(Int32) o(StaticTypeAndData)")
    DEFINE_VIREO_FUNCTION(NumberToHexString, "p(i(StaticTypeAndData) i(Int32) o(StaticTypeAndData)")
    DEFINE_VIREO_FUNCTION(NumberToOctalString, "p(i(StaticTypeAndData) i(Int32) o(StaticTypeAndData)")
    DEFINE_VIREO_FUNCTION(NumberToBinaryString, "p(i(StaticTypeAndData) i(Int32) o(StaticTypeAndData)")
DEFINE_VIREO_END()

}  // namespace Vireo
