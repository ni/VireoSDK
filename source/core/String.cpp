/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Native Vireo string functions.
 */

#if _WIN32
    #define _CRT_SECURE_NO_WARNINGS
    #define snprintf _snprintf
#endif

#ifdef __APPLE__
#include <xlocale.h>
#endif

// LabVIEW has string iterators wrapper for its strings handle
// those could be used, or the wstring could be used.
// in memory strings are to be 16 bit wide. serialized are to be UTF8
#include "ExecutionContext.h"
#include "TypeDefiner.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
using namespace Vireo;

//---------------------------------------------
Boolean String::AppendUrlEncodedSubString(SubString* string)
{
    Utf8Char c;
    IntIndex originLen = 0;
    Boolean unreservedC = false;
    SubString urlString(string);
    while(string->ReadRawChar(&c)) {
        unreservedC = true;
        if (c=='%'){
            unreservedC = false;
        }
        if (unreservedC) {
            originLen++;
        } else {
            string->ReadUrlEncodedToken(null);
            originLen++;
        }
    }
    IntIndex i = this->Length();
    this->Resize1D(this->Length()+originLen);
    string->AliasAssign(&urlString);
    while (string->ReadRawChar(&c)) {
        if (c == '+') {
            (*BeginAt(i)) = ' ';
        } else if (c!= '%'){
            (*BeginAt(i)) = c;
        } else {
            // c == '%'. according to the document, single % is not legal in a url string.
            Utf8Char value = 0;
            if (string->ReadUrlEncodedToken(&value)){
                (*BeginAt(i)) = (Utf8Char)value;
            } else {
                (*BeginAt(i)) = '%';
            }
        }
        i++;
    }
    return true;
}

/**
 * This one will escape the input substring and then append it to current string
 * e.g. It is used for JSON formating.
 * */
Boolean String::EscapeSubString(SubString* string)
{
    Int32 needLength = 0;
    const Utf8Char* begin = string->Begin();
    for (IntIndex i=0; i< string->Length(); i++) {
        Utf8Char c = *(begin+i);
        // see the document on http://json.org. need handle more control character and \uhexadecimal
        switch (c) {
        case '\n': case '\r': case '\t':
        case '\f' : case '\b': case '\\':
        case '"':
            needLength += 2;
            break;
        default:
            needLength++;
            break;
        }
    }
    IntIndex originLength = Length();
    this->Resize1D(Length()+needLength);
    Utf8Char* ptr = this->BeginAt(originLength);
    for (IntIndex i=0; i< string->Length(); i++) {
        Utf8Char c = *(begin + i);
        switch (c) {
        case '\n':
            *ptr++ = '\\';
            *ptr++ = 'n';
            break;
        case '\r':
            *ptr++ = '\\';
            *ptr++ ='r';
            break;
        case '\t':
            *ptr++ = '\\';
            *ptr++ = 't';
           break;
        case '\f' :
            *ptr++ = '\\';
            *ptr++  = 'f';
           break;
        case '\b':
           *ptr++ = '\\';
           *ptr++ = 'b';
           break;
        case '\\':
            *ptr++ = '\\';
            *ptr++ = '\\';
           break;
        case '"':
            *ptr++ = '\\';
            *ptr++  = '\"';
        break;
        default:
            *ptr++ = c;
            break;
       }
    }
    return true;
}
//------------------------------------------------------------
struct ReplaceSubstringStruct : public InstructionCore
{
    _ParamDef(StringRef, StringIn);
    _ParamDef(StringRef, ReplacementString);
    _ParamDef(Int32, Offset);
    _ParamDef(Int32, Length);
    _ParamDef(StringRef, ResultString); // TODO cannot be in-place , might need to allow for this
    _ParamDef(StringRef, ReplacedSubString);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(ReplaceSubstring, ReplaceSubstringStruct)
{
    StringRef stringIn = _Param(StringIn);
    StringRef replacementString = _ParamPointer(ReplacementString) ? _Param(ReplacementString) : 0;
    IntIndex replacementStringLength = replacementString ? replacementString->Length() : 0;
    StringRef resultString = _ParamPointer(ResultString) ? _Param(ResultString) : null;
    StringRef replacedSubString = _ParamPointer(ReplacedSubString) ? _Param(ReplacedSubString) : null;
    IntIndex offset = _ParamPointer(Offset) ? _Param(Offset) : 0;
    IntIndex length =  _ParamPointer(Length) ? _Param(Length) : replacementStringLength;
    IntIndex stringInLength =  stringIn->Length();

    TypeRef eltType = stringIn->ElementType();
    length = Max(0, Min(length, stringInLength - offset));

    // Replace substring only if the offset is not past the end of the string
    if ((offset >= 0) && (offset <= stringInLength)) {
        VIREO_ASSERT(stringIn != resultString && stringIn != replacedSubString);
        VIREO_ASSERT(replacementString == null || (replacementString != resultString && replacementString != replacedSubString));

        Int32 resultLength = stringInLength + (replacementStringLength - length);

        if (replacedSubString) {
            replacedSubString->Resize1D(length);
            // Copy out the substring to be replaced
            eltType->CopyData(stringIn->BeginAt(offset), replacedSubString->Begin(), length);
        }

        if (resultString) {
            resultString->Resize1D(resultLength);
            // Copy the original string up to the offset point
            eltType->CopyData(stringIn->Begin(), resultString->Begin(), offset);
            // Copy in the replacement
            if (replacementString)
                eltType->CopyData(replacementString->Begin(), resultString->BeginAt(offset), replacementStringLength);
            // Copy the original tail
            Int32 tailLength = (stringInLength - (offset + length));
            eltType->CopyData(stringIn->BeginAt(offset + length), resultString->BeginAt(offset + replacementStringLength), tailLength);
        }
    } else {
        if (resultString && (stringIn != resultString))
            stringIn->Type()->CopyData(&stringIn, &resultString);
        if (replacedSubString)
            replacedSubString->Resize1D(0);
    }
    return _NextInstruction();
}

struct SearchAndReplaceStringStruct : public InstructionCore
{
    _ParamDef(StringRef, StringOut);
    _ParamDef(StringRef, StringIn);
    _ParamDef(StringRef, SearchString);
    _ParamDef(StringRef, ReplacementString);
    _ParamDef(Int32, Offset);
    _ParamDef(Int32, NumOfReplacements);
    _ParamDef(Int32, OffsetPastReplacement);
    _ParamDef(Boolean, ReplaceAll);
    _ParamDef(Boolean, IgnoreCase);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(SearchAndReplaceString, SearchAndReplaceStringStruct)
{
    StringRef stringOut = _ParamPointer(StringOut) ? _Param(StringOut) : null;
    StringRef stringIn = _Param(StringIn);
    StringRef searchString = _Param(SearchString);
    StringRef replacementString = _ParamPointer(ReplacementString) ? _Param(ReplacementString) : null;
    IntIndex offset = _ParamPointer(Offset) ? _Param(Offset) : 0;
    IntIndex numOfReplacements = 0;
    Boolean replaceAll = _ParamPointer(ReplaceAll) ? _Param(ReplaceAll) : false;
    Boolean ignoreCase = _ParamPointer(IgnoreCase) ? _Param(IgnoreCase) : false;

    VIREO_ASSERT(stringIn != stringOut);
    VIREO_ASSERT(searchString != stringOut);
    VIREO_ASSERT(replacementString == null || replacementString != stringOut);

    SubString stringInSubString = stringIn->MakeSubStringAlias();
    SubString searchStringSubString = searchString->MakeSubStringAlias();
    IntIndex stringInLength = stringIn->Length();
    IntIndex searchStringLength = searchString->Length();
    IntIndex replacementStringLength = replacementString ? replacementString->Length() : 0;
    TypeRef eltType = stringIn->ElementType();

    offset = Max(0, Min(offset, stringInLength));

    IntIndex matchOffset;
    IntIndex stringOutOffset = offset;

    // Copy up to the offset
    if (stringOut) {
        stringOut->Resize1D(stringInLength);
        eltType->CopyData(stringIn->Begin(), stringOut->Begin(), offset);
    }

    // Search for matches and copy up to the end of the replacement
    while ((matchOffset = stringInSubString.FindFirstMatch(&searchStringSubString, offset, ignoreCase)) != -1) {
        if (stringOut) {
            stringOut->Resize1D(stringOut->Length() + replacementStringLength - searchStringLength);
            // Copy up to the match
            eltType->CopyData(stringIn->BeginAt(offset), stringOut->BeginAt(stringOutOffset), matchOffset - offset);
            // Copy in the replacement
            if (replacementString)
                eltType->CopyData(replacementString->Begin(), stringOut->BeginAt(stringOutOffset + matchOffset - offset), replacementStringLength);
        }

        stringOutOffset += matchOffset - offset + replacementStringLength;
        offset = matchOffset + searchStringLength;
        numOfReplacements++;

        // If the search string is empty, copy a character and increment the offsets so that we don't insert indefinitely
        if (searchStringLength == 0) {
            if (stringOut)
                *stringOut->BeginAt(stringOutOffset) = *stringIn->BeginAt(offset);
            stringOutOffset++;
            offset++;
        }

        if (!replaceAll)
            break;
    }

    // Copy the rest of the string following the last match
    if (stringOut && (offset < stringInLength))
        eltType->CopyData(stringIn->BeginAt(offset), stringOut->BeginAt(stringOutOffset), stringInLength - offset);

    if _ParamPointer(NumOfReplacements)
        _Param(NumOfReplacements) = numOfReplacements;
    if _ParamPointer(OffsetPastReplacement)
        _Param(OffsetPastReplacement) = numOfReplacements ? stringOutOffset : -1;

    return _NextInstruction();
}

struct SearchSplitStringStruct : public InstructionCore
{
    _ParamDef(StringRef, StringIn);
    _ParamDef(StringRef, SearchString);
    _ParamDef(Int32, Offset);
    _ParamDef(StringRef, BeforeMatchString);
    _ParamDef(StringRef, MatchPlusRestString);
    _ParamDef(Int32, MatchOffset);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(SearchSplitString, SearchSplitStringStruct)
{
    StringRef stringIn = _Param(StringIn);
    StringRef searchString = _Param(SearchString);
    IntIndex offset = _ParamPointer(Offset) ? _Param(Offset) : 0;
    StringRef beforeMatchString = _ParamPointer(BeforeMatchString) ? _Param(BeforeMatchString) : null;
    StringRef matchPlusRestString = _ParamPointer(MatchPlusRestString) ? _Param(MatchPlusRestString) : null;
    IntIndex matchOffset;

    VIREO_ASSERT(stringIn != matchPlusRestString);

    SubString stringInSubString = stringIn->MakeSubStringAlias();
    SubString searchStringSubString = searchString->MakeSubStringAlias();
    IntIndex stringInLength = stringIn->Length();
    TypeRef eltType = stringIn->ElementType();

    offset = Max(0, Min(offset, stringInLength));
    matchOffset = stringInSubString.FindFirstMatch(&searchStringSubString, offset, false);

    if (matchOffset != -1) { // A match is found
        if (matchPlusRestString) {
            // Copy stringIn starting at the match to matchPlusRestString
            // This copy is done first since the other copy may modify stringIn (when stringIn == beforeMatchString)
            matchPlusRestString->Resize1D(stringInLength - matchOffset);
            eltType->CopyData(stringIn->BeginAt(matchOffset), matchPlusRestString->Begin(), stringInLength - matchOffset);
        }
        if (beforeMatchString) {
            // Copy inString up to the match to beforeMatchString
            beforeMatchString->Resize1D(matchOffset);
            if (stringIn != beforeMatchString)
                eltType->CopyData(stringIn->Begin(), beforeMatchString->Begin(), matchOffset);
        }
    } else {
        // No match is found
        if (matchPlusRestString)
            // Copy inString to beforeMatchString
            matchPlusRestString->Resize1D(0);
        if (beforeMatchString && (stringIn != beforeMatchString)) {
            // Clear out matchPlusRestString
            beforeMatchString->Resize1D(stringInLength);
            eltType->CopyData(stringIn->Begin(), beforeMatchString->Begin(), stringInLength);
        }
    }

    if _ParamPointer(MatchOffset)
        _Param(MatchOffset) = matchOffset;

    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringLength, StringRef, Int32)
{
    SubString ss = _Param(0)->MakeSubStringAlias();
    _Param(1) = ss.StringLength();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(StringIndexChar, StringRef, Int32, Utf32Char)
{
    SubString ss = _Param(0)->MakeSubStringAlias();
    ss.EatRawChars(_Param(1));
    ss.ReadUtf32(_ParamPointer(2));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringToUpper, StringRef, StringRef)
{
    IntIndex targetLength = _Param(0)->Length();

    _Param(1)->Resize1D(targetLength);

    // TODO only works for U+0000 .. U+007F
    Utf8Char *pSourceChar      = _Param(0)->Begin();
    Utf8Char *pSourceCharEnd   = _Param(0)->End();
    Utf8Char *pDestChar        = _Param(1)->Begin();
    while (pSourceChar < pSourceCharEnd) {
        char c = *pSourceChar++;
        if ('a' <= c && c <= 'z') {
            c =  (c - 0x20);
        }
        *pDestChar++ = c;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringToLower, StringRef, StringRef)
{
    IntIndex targetLength = _Param(0)->Length();  // TODO only works for Ascii

    _Param(1)->Resize1D(targetLength);

    // TODO only works for U+0000 .. U+007F
    // Adding Latin/Russian/Greek/Armenian not "too" hard
    // http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
    // ftp://ftp.unicode.org/Public/3.0-Update/UnicodeData-3.0.0.html

    Utf8Char *pSourceChar      = (Utf8Char*) _Param(0)->Begin();
    Utf8Char *pSourceCharEnd   = (Utf8Char*) _Param(0)->End();
    Utf8Char *pDestChar        = (Utf8Char*) _Param(1)->Begin();
    while (pSourceChar < pSourceCharEnd) {
        char c = *pSourceChar++;
        if ('A' <= c && c <= 'Z') {
            c =  (c + 0x20);
        }
        *pDestChar++ = c;
    }
    return _NextInstruction();
}

//-----------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(DecodeUrlString, StringRef, StringRef)
{
    SubString urlString = _Param(0)->MakeSubStringAlias();
    _Param(1)->Resize1D(0);
    _Param(1)->AppendUrlEncodedSubString(&urlString);
    return _NextInstruction();

}

//---------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringReverse, StringRef, StringRef)
{
    SubString ss = _Param(0)->MakeSubStringAlias();
    _Param(1)->Resize1D(ss.Length());
    Utf8Char* pDestChar = _Param(1)->End();
    TypeRef elementType = _Param(0)->ElementType();
    SubString character;
    while (ss.ReadGraphemeCluster(&character)) {
        pDestChar = pDestChar - character.Length();
        elementType->CopyData(character.Begin(), pDestChar, character.Length());
    }
    return _NextInstruction();
}
//---------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringRotate, StringRef, StringRef)
{
    SubString ss = _Param(0)->MakeSubStringAlias();
    _Param(1)->Resize1D(ss.Length());
    Utf8Char* pDestChar = _Param(1)->End();
    TypeRef elementType = _Param(0)->ElementType();
    SubString character;
    ss.ReadGraphemeCluster(&character);
    pDestChar = pDestChar - character.Length();
    elementType->CopyData(character.Begin(), pDestChar, character.Length());
    elementType->CopyData(ss.Begin(), _Param(1)->Begin(), ss.Length());
    return _NextInstruction();
}
//-----------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(StringTrim, StringRef, Int32, StringRef)
{
    SubString ss = _Param(0)->MakeSubStringAlias();
    const Utf8Char* pSourceChar = ss.Begin();
    IntIndex targetLength = ss.Length();
    bool found = false;
    int leading = 0;
    int trailing = 0;
    const Utf8Char* spacePos = null;
    bool last = false;
    while (pSourceChar < ss.End()) {
        int bytes = ss.CharLength(pSourceChar);
        if (bytes == 1) {
            char c = *pSourceChar;
            if (!found && ss.IsSpaceChar(c)) {
                leading ++;
            } else {
                found = true;
                if (ss.IsSpaceChar(c)) {
                    if (spacePos == null || !last) {
                        spacePos = pSourceChar;
                    }
                    last = true;
                    trailing++;
                } else {
                    spacePos = pSourceChar;
                    last = false;
                    trailing = 0;
                }
            }
        } else {
            last = false;
            trailing = 0;
            found = true;
        }
        pSourceChar += bytes;
    }
    // return empty string
    if (!found) {
        _Param(2)->Resize1D(0);
        return _NextInstruction();
    }
    Int32 location = _Param(1);
    if (location == 0) {
        targetLength = targetLength-leading-trailing;
    } else if (location == 1) {
        // remove start of string
        targetLength = targetLength-leading;
    } else if (location == 2) {
        targetLength = targetLength-trailing;
        leading = 0;
    } else {
        // return original string
        leading = 0;
    }
    _Param(2)->Resize1D(targetLength);
    TypeRef elementType = _Param(0)->ElementType();
    elementType->CopyData(_Param(0)->BeginAt(leading), _Param(2)->Begin(), targetLength);
    return _NextInstruction();
}

#if 0
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(StringFormat, StringRef, StringRef, Int32, void*)
{
    StringRef buffer = _Param(0);
    StringRef format = _Param(1);
    SubString formatString(format->Begin(), format->End());

    Int32 count = _ParamVarArgCount();
    StaticTypeAndData* pArguments = (StaticTypeAndData*) &_ParamPointer(3);

    Format(&formatString, count, pArguments, buffer);
    return _NextInstruction();
}
#endif
//------------------------------------------------------------
struct StringConcatenateParamBlock : public VarArgInstruction
{
    _ParamDef(StringRef, StringOut);
    _ParamImmediateDef(TypedArrayCoreRef*, Element[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(StringConcatenate, StringConcatenateParamBlock)
{
    // Ignore begin
    Int32 numInputs = ((_ParamVarArgCount() - 1));

    StringRef pDest = _Param(StringOut);
    Int32 originalLength = pDest->Length();
    Int32 totalLength = 0;
    TypedArrayCoreRef** inputs =  (_ParamImmediate(Element));
    for (Int32 i = 0; i < numInputs; i++) {
        TypedArrayCoreRef arrayInput = *(inputs[i]);
        if (arrayInput->ElementType()->IsArray()) {
            // TODO this needs to support N-Dim string arrays
            for (Int32 j = 0; j < arrayInput->Length(); j++) {
                StringRef stringInput = *(StringRef*) arrayInput->BeginAt(j);
                totalLength += stringInput->Length();
            }
        } else {
            totalLength += arrayInput->Length();
        }
    }
    pDest->Resize1D(totalLength);
    // TODO error check
    AQBlock1* pInsert = pDest->BeginAt(0);

    TypeRef elementType = pDest->ElementType();  // Flat char type

    for (Int32 i = 0; i < numInputs; i++) {
        TypedArrayCoreRef arrayInput = *(inputs[i]);
        if (arrayInput->ElementType()->IsArray())  {
            // TODO this needs to support N-Dim string arrays
            for (Int32 j = 0; j < arrayInput->Length(); j++) {
                StringRef stringInput = *(StringRef*) arrayInput->BeginAt(j);
                VIREO_ASSERT(stringInput != pDest);
                IntIndex length = stringInput->Length();
                elementType->CopyData(stringInput->BeginAt(0), pInsert, length);
                pInsert += length;
            }
        } else if (arrayInput != pDest) {
            // String input that is not the same as dest
            IntIndex length = arrayInput->Length();
            elementType->CopyData(arrayInput->BeginAt(0), pInsert, length);
            pInsert += length;
        } else {
            // String input that is the same as dest
            if (i != 0) {
                THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Illegal StringConcatenate inplaceness");
                return THREAD_EXEC()->Stop();
            }

            pInsert += originalLength;
        }
    }
    return _NextInstruction();
}
//------------------------------------------------------------
DECLARE_VIREO_CONDITIONAL_BRANCH(BranchIfEQString, StringRef, StringRef,
    (_Param(1)->Length() == _Param(2)->Length() && (memcmp(_Param(1)->Begin(), _Param(2)->Begin(), _Param(1)->Length()) == 0)))

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(BranchIfLTString, InstructionCore, StringRef, StringRef)
{
    int cmp = memcmp(_Param(1)->Begin(), _Param(2)->Begin(), Min(_Param(1)->Length(), _Param(2)->Length()));
    if (cmp < 0) {
        return _this->_p0;
    } else if (cmp > 0) {
        return  VIVM_TAIL(_NextInstruction());
    } else if (_Param(1)->Length() < _Param(2)->Length()) {
        return _this->_p0;
    } else {
        return VIVM_TAIL(_NextInstruction());
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(BranchIfGTString, InstructionCore, StringRef, StringRef)
{
    int cmp = memcmp(_Param(1)->Begin(), _Param(2)->Begin(), Min(_Param(1)->Length(), _Param(2)->Length()));
    if (cmp > 0) {
        return _this->_p0;
    } else if (cmp < 0) {
        return  VIVM_TAIL(_NextInstruction());
    } else if (_Param(1)->Length() > _Param(2)->Length()) {
        return _this->_p0;
    } else {
        return VIVM_TAIL(_NextInstruction());
    }
}

DEFINE_VIREO_BEGIN(LabVIEW_String)
    DEFINE_VIREO_FUNCTION(ReplaceSubstring, "p(i(.String) i(.String) i(.Int32) i(.Int32) i(.String) o(.String))")
    DEFINE_VIREO_FUNCTION(SearchAndReplaceString, "p(o(.String) i(.String) i(.String) i(.String) i(.Int32) i(.Int32) i(.Int32) i(.Boolean) i(.Boolean))")
    DEFINE_VIREO_FUNCTION(SearchSplitString, "p(i(.String) i(.String) i(.Int32) o(.String) o(.String) o(.Int32))")
    DEFINE_VIREO_FUNCTION(StringLength, "p(i(.String) o(.Int32))")
    DEFINE_VIREO_FUNCTION(StringTrim, "p(i(.String) i(.Int32) o(.String))")
    DEFINE_VIREO_FUNCTION(StringReverse, "p(i(.String) o(.String))")
    DEFINE_VIREO_FUNCTION(StringRotate, "p(i(.String) o(.String))")
    DEFINE_VIREO_FUNCTION(StringIndexChar, "p(i(.String) i(.Int32) o(.Utf32Char))")
    DEFINE_VIREO_FUNCTION(StringToUpper, "p(i(.String) o(.String))")
    DEFINE_VIREO_FUNCTION(StringToLower, "p(i(.String) o(.String))")
    DEFINE_VIREO_FUNCTION(DecodeUrlString, "p(i(.String) o(.String))")
    // StringConcatenate input can be string, or array of string.
    DEFINE_VIREO_FUNCTION(StringConcatenate, "p(i(.VarArgCount) o(.String) i(.*))" )
    DEFINE_VIREO_FUNCTION(BranchIfEQString, "p(i(.BranchTarget) i(.String) i(.String))");
    DEFINE_VIREO_FUNCTION(BranchIfLTString, "p(i(.BranchTarget) i(.String) i(.String))")
    DEFINE_VIREO_FUNCTION(BranchIfGTString, "p(i(.BranchTarget) i(.String) i(.String))")
DEFINE_VIREO_END()
