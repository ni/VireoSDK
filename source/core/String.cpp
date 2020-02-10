// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Native Vireo string functions.
 */

#include "BuildConfig.h"
#include "ExecutionContext.h"
#include "TypeDefiner.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include <ctype.h>

namespace Vireo {

//---------------------------------------------
//! Append a ViaEncoded string, decode it in the process.
void String::AppendViaDecoded(SubString* str)
{
    Int32 value = 0;
    Utf8Char c;
    SubString ss(*str);

    IntIndex originalLength = Length();
    Int32 decodedLength = originalLength + ss.Length();

    // Pass one, see how many %XX sequences exist.
    // Utf8 multibyte sequences are copied over byte by byte.
    while (ss.ReadRawChar(&c)) {
        if (c == '%' && ss.ReadHex2(&value)) {
            decodedLength  -= 2;
        }
    }

    if (Resize1D(decodedLength)) {
        // Pass two, copy over the characters and decode
        // valid %XX sequences. Warning, %XX values above
        // 127 could easily result in invalid Utf8 sequences.
        ss = *str;
        Utf8Char* pDest = BeginAt(originalLength);
        while (ss.ReadRawChar(&c)) {
            if (c == '%' && ss.ReadHex2(&value)) {
                *pDest++ = (Utf8Char)value;
            } else {
                *pDest++ = c;
            }
        }
    }
}

/**
 * This one will escape the input substring and then append it to current string
 * e.g. It is used for JSON formatting. See the document on http://json.org
 * dest is the location in the string to append.
 * This function is well implemented so that it support in place operation
 * which means the input substring could point to the String object.
 * This is possible because the escaped string is always longer than original one.
 * */
void String::AppendEscapeEncoded(const Utf8Char* source, IntIndex len)
{
    // if inplaceIndex is positive, it means it's an in place operation
    IntIndex inplaceIndex = -1;
    if (source >= this->Begin() && source < this->End()) {
        inplaceIndex = (IntIndex) (source - this->Begin());
    }
    Int32 needLength = 0;
    const Utf8Char* begin = source;
    for (IntIndex i = 0; i < len; i++) {
        Utf8Char c = *(begin+i);
        // TODO(mraj) should also replace multibyte line separator and paragraph separator for interop http://timelessrepo.com/json-isnt-a-javascript-subset
        switch (c) {
        case '\b': case '\t': case '\n':  // x08, x09, x0A
        case '\f': case '\r':             // x0C, x0D
        case '\\': case '"':
            needLength += 2;
            break;
        default:
            // escape control characters
            if ( (c >= '\x00' && c <= '\x07') ||
                 (c == '\x0B' || c == '\x0E' || c == '\x0F') ||
                 (c >= '\x10' && c <= '\x19') ||
                 (c >= '\x1A' && c<= '\x1F') ) {
                     needLength += 6;  // \uXXXX
            } else {
                needLength++;
            }
            break;
        }
    }
    IntIndex originLength = inplaceIndex > -1 ? inplaceIndex : Length();

    this->Resize1D(originLength+needLength);
    if (inplaceIndex > -1) {
        begin = this->BeginAt(inplaceIndex);
    }
    Utf8Char* ptr = this->End()-1;
    for (IntIndex i = len -1; i >= 0; i--) {
        Utf8Char c = *(begin + i);
        switch (c) {
        case '\b':  // x08
            *ptr-- = 'b'; *ptr-- = '\\';
            break;
        case '\t':  // x09
            *ptr-- = 't'; *ptr-- = '\\';
            break;
        case '\n':  // x0A
            *ptr-- = 'n'; *ptr-- = '\\';
            break;
        case '\f':  // x0C
            *ptr-- = 'f'; *ptr-- = '\\';
            break;
        case '\r':  // x0D
            *ptr-- = 'r'; *ptr-- = '\\';
            break;
        case '\\':
            *ptr-- = '\\'; *ptr-- = '\\';
            break;
        case '"':
            *ptr-- = '"'; *ptr-- = '\\';
            break;
        default:
            if (c >= '\x00' && c <= '\x07') {
                *ptr-- = c + '0'; *ptr-- = '0'; *ptr-- = '0'; *ptr-- = '0'; *ptr-- = 'u'; *ptr-- = '\\';
            } else if (c == '\x0B' || c == '\x0E' || c == '\x0F') {
                *ptr-- = c - '\x0A' + 'A'; *ptr-- = '0'; *ptr-- = '0'; *ptr-- = '0'; *ptr-- = 'u'; *ptr-- = '\\';
            } else if (c >= '\x10' && c <= '\x19') {
                *ptr-- = c - '\x10' + '0'; *ptr-- = '1'; *ptr-- = '0'; *ptr-- = '0'; *ptr-- = 'u'; *ptr-- = '\\';
            } else if (c >= '\x1A' && c<= '\x1F') {
                *ptr-- = c - '\x1A' + 'A'; *ptr-- = '1'; *ptr-- = '0'; *ptr-- = '0'; *ptr-- = 'u'; *ptr-- = '\\';
            } else {
                *ptr-- = c;
            }
            break;
       }
    }
}
//------------------------------------------------------------
struct ReplaceSubstringStruct : InstructionCore
{
    _ParamDef(StringRef, StringIn);
    _ParamDef(StringRef, ReplacementString);
    _ParamDef(Int32, Offset);
    _ParamDef(Int32, Length);
    _ParamDef(StringRef, ResultString);  // TODO(PaulAustin): cannot be in-place , might need to allow for this
    _ParamDef(StringRef, ReplacedSubString);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(ReplaceSubstring, ReplaceSubstringStruct)
{
    StringRef stringIn = _Param(StringIn);
    StringRef replacementString = _ParamPointer(ReplacementString) ? _Param(ReplacementString) : 0;
    IntIndex replacementStringLength = replacementString ? replacementString->Length() : 0;
    StringRef resultString = _ParamPointer(ResultString) ? _Param(ResultString) : nullptr;
    StringRef replacedSubString = _ParamPointer(ReplacedSubString) ? _Param(ReplacedSubString) : nullptr;
    IntIndex offset = _ParamPointer(Offset) ? _Param(Offset) : 0;
    IntIndex length =  _ParamPointer(Length) ? _Param(Length) : replacementStringLength;
    IntIndex stringInLength =  stringIn->Length();

    TypeRef eltType = stringIn->ElementType();
    length = Max(0, Min(length, stringInLength - offset));

    // Replace substring only if the offset is not past the end of the string
    if ((offset >= 0) && (offset <= stringInLength)) {
        VIREO_ASSERT(stringIn != resultString && stringIn != replacedSubString);
        VIREO_ASSERT(replacementString == nullptr || (replacementString != resultString && replacementString != replacedSubString));

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

struct SearchAndReplaceStringStruct : InstructionCore
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
    StringRef stringOut = _ParamPointer(StringOut) ? _Param(StringOut) : nullptr;
    StringRef stringIn = _Param(StringIn);
    StringRef searchString = _Param(SearchString);
    StringRef replacementString = _ParamPointer(ReplacementString) ? _Param(ReplacementString) : nullptr;
    IntIndex offset = _ParamPointer(Offset) ? _Param(Offset) : 0;
    IntIndex numOfReplacements = 0;
    Boolean replaceAll = _ParamPointer(ReplaceAll) ? _Param(ReplaceAll) : false;
    Boolean ignoreCase = _ParamPointer(IgnoreCase) ? _Param(IgnoreCase) : false;

    VIREO_ASSERT(stringIn != stringOut);
    VIREO_ASSERT(searchString != stringOut);
    VIREO_ASSERT(replacementString == nullptr || replacementString != stringOut);

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

struct SearchSplitStringStruct : InstructionCore
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
    StringRef beforeMatchString = _ParamPointer(BeforeMatchString) ? _Param(BeforeMatchString) : nullptr;
    StringRef matchPlusRestString = _ParamPointer(MatchPlusRestString) ? _Param(MatchPlusRestString) : nullptr;

    VIREO_ASSERT(stringIn != matchPlusRestString);

    SubString stringInSubString = stringIn->MakeSubStringAlias();
    SubString searchStringSubString = searchString->MakeSubStringAlias();
    IntIndex stringInLength = stringIn->Length();
    TypeRef eltType = stringIn->ElementType();

    offset = Max(0, Min(offset, stringInLength));
    IntIndex matchOffset = stringInSubString.FindFirstMatch(&searchStringSubString, offset, false);

    if (matchOffset != -1) {  // A match is found
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
    _Param(1) = _Param(0)->MakeSubStringAlias().StringLength();
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

    // TODO(PaulAustin): only works for U+0000 .. U+007F
    Utf8Char *pSourceChar      = _Param(0)->Begin();
    Utf8Char *pSourceCharEnd   = _Param(0)->End();
    Utf8Char *pDestChar        = _Param(1)->Begin();
    while (pSourceChar < pSourceCharEnd) {
        char c = *pSourceChar++;
        if ('a' <= c && c <= 'z') {
            c = (c - 0x20);
        }
        *pDestChar++ = c;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringToLower, StringRef, StringRef)
{
    IntIndex targetLength = _Param(0)->Length();  // TODO(PaulAustin): only works for Ascii

    _Param(1)->Resize1D(targetLength);

    // TODO(PaulAustin): only works for U+0000 .. U+007F
    // Adding Latin/Russian/Greek/Armenian not "too" hard
    // http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
    // ftp://ftp.unicode.org/Public/3.0-Update/UnicodeData-3.0.0.html

    Utf8Char *pSourceChar      = (Utf8Char*) _Param(0)->Begin();
    Utf8Char *pSourceCharEnd   = (Utf8Char*) _Param(0)->End();
    Utf8Char *pDestChar        = (Utf8Char*) _Param(1)->Begin();
    while (pSourceChar < pSourceCharEnd) {
        char c = *pSourceChar++;
        if ('A' <= c && c <= 'Z') {
            c = (c + 0x20);
        }
        *pDestChar++ = c;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringToUpperInt, Int8, Int8)
{
    char c = _Param(0);
    if ('a' <= c && c <= 'z') {
        c = (c - 0x20);
    }
    _Param(1) = c;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringToLowerInt, Int8, Int8)
{
    char c = _Param(0);
    if ('A' <= c && c <= 'Z') {
        c = (c + 0x20);
    }
    _Param(1) = c;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsEmptyString, StringRef, Boolean)
{
    if (!_Param(0) || _Param(0)->Length() == 0)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsEmptyPath, NIPath, Boolean)
{
    if (!_ParamPointer(0) || _ParamPointer(0)->components->Length() == 0) {
        if (_ParamPointer(0)->type->Length() > 0)
            _Param(1) = true;
        else
            _Param(1) = false;  // not-a-path is not considered empty
    } else {
        _Param(1) = false;
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsDecimalDigit, StringRef, Boolean)
{
    StringRef str = _Param(0);
    if (str->Length() == 0) {
        _Param(1) = false;
    } else {
        Utf8Char c = str->Begin()[0];
        _Param(1) = c >= '0' && c <= '9';
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE2(IsDecimalDigitInt, Int32, Boolean)
{
    Utf8Char c = _Param(0);
    _Param(1) = c >= '0' && c <= '9';
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE2(IsHexDigit, StringRef, Boolean)
{
    StringRef str = _Param(0);
    if (str->Length() == 0) {
        _Param(1) = false;
    } else {
        Utf8Char c = str->Begin()[0];
        _Param(1) = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE2(IsHexDigitInt, Int32, Boolean)
{
    Utf8Char c = _Param(0);
    _Param(1) = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsOctalDigit, StringRef, Boolean)
{
    StringRef str = _Param(0);
    if (str->Length() == 0) {
        _Param(1) = false;
    } else {
        Utf8Char c = str->Begin()[0];
        _Param(1) = c >= '0' && c <= '7';
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsOctalDigitInt, Int32, Boolean)
{
    Utf8Char c = _Param(0);
    _Param(1) = c >= '0' && c <= '7';
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsPrintable, StringRef, Boolean)
{
    StringRef str = _Param(0);
    if (str->Length() == 0) {
        _Param(1) = false;
    } else {
        Utf8Char c = str->Begin()[0];
        _Param(1) = (isprint(c) != 0);
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsPrintableInt, Int32, Boolean)
{
    Utf8Char c = _Param(0);
    _Param(1) = (isprint(c) != 0);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsWhiteSpace, StringRef, Boolean)
{
    StringRef str = _Param(0);
    if (str->Length() == 0) {
        _Param(1) = false;
    } else {
        Utf8Char c = str->Begin()[0];
        _Param(1) = (c == ' ' || c == '\t' || c == '\f' || c == '\r' || c == '\n' || c == '\v');
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsWhiteSpaceInt, Int32, Boolean)
{
    Utf8Char c = _Param(0);
    _Param(1) = (c == ' ' || c == '\t' || c == '\f' || c == '\r' || c == '\n' || c == '\v');
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsNotANumPathRefnum, StringRef, Boolean)
{
    if (!_Param(0) || _Param(0)->Length() == 0)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsNotAPath, NIPath, Boolean)
{
    if (!_ParamPointer(0) || (_Param(0).components->Length() == 0 && _Param(0).type->Length() == 0))
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}


//-----------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StringViaDecode, StringRef, StringRef)
{
    SubString viaString = _Param(0)->MakeSubStringAlias();
    _Param(1)->Resize1D(0);
    _Param(1)->AppendViaDecoded(&viaString);
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
    Boolean found = false;
    IntIndex leading = 0;
    IntIndex trailing = 0;
    const Utf8Char* spacePos = nullptr;
    Boolean last = false;
    while (pSourceChar < ss.End()) {
        IntIndex bytes = SubString::CharLength(pSourceChar);
        if (bytes == 1) {
            char c = *pSourceChar;
            if (!found && SubString::IsSpaceChar(c)) {
                leading++;
            } else {
                found = true;
                if (SubString::IsSpaceChar(c)) {
                    if (spacePos == nullptr || !last) {
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

//------------------------------------------------------------
struct StringConcatenateParamBlock : VarArgInstruction
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
    TypedArrayCoreRef** inputs = (_ParamImmediate(Element));
    for (Int32 i = 0; i < numInputs; i++) {
        TypedArrayCoreRef arrayInput = *(inputs[i]);
        if (arrayInput->ElementType()->IsArray()) {
            // TODO(PaulAustin): this needs to support N-Dim string arrays
            for (Int32 j = 0; j < arrayInput->Length(); j++) {
                StringRef stringInput = *(StringRef*) arrayInput->BeginAt(j);
                totalLength += stringInput->Length();
            }
        } else {
            totalLength += arrayInput->Length();
        }
    }
    pDest->Resize1D(totalLength);
    // TODO(PaulAustin): error check
    AQBlock1* pInsert = pDest->BeginAt(0);

    TypeRef elementType = pDest->ElementType();  // Flat char type

    for (Int32 i = 0; i < numInputs; i++) {
        TypedArrayCoreRef arrayInput = *(inputs[i]);
        if (arrayInput->ElementType()->IsArray())  {
            // TODO(PaulAustin): this needs to support N-Dim string arrays
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
    (_Param(1)->IsEqual(_Param(2))))

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(BranchIfLTString, InstructionCore, StringRef, StringRef)
{
    Int32 cmp = memcmp(_Param(1)->Begin(), _Param(2)->Begin(), Min(_Param(1)->Length(), _Param(2)->Length()));
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
    Int32 cmp = memcmp(_Param(1)->Begin(), _Param(2)->Begin(), Min(_Param(1)->Length(), _Param(2)->Length()));
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
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(BranchIfLEString, InstructionCore, StringRef, StringRef)
{
    Int32 cmp = memcmp(_Param(1)->Begin(), _Param(2)->Begin(), Min(_Param(1)->Length(), _Param(2)->Length()));
    if (cmp < 0) {
        return _this->_p0;
    } else if (cmp > 0) {
        return  VIVM_TAIL(_NextInstruction());
    } else if (_Param(1)->Length() <= _Param(2)->Length()) {
        return _this->_p0;
    } else {
        return VIVM_TAIL(_NextInstruction());
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(BranchIfGEString, InstructionCore, StringRef, StringRef)
{
    Int32 cmp = memcmp(_Param(1)->Begin(), _Param(2)->Begin(), Min(_Param(1)->Length(), _Param(2)->Length()));
    if (cmp > 0) {
        return _this->_p0;
    } else if (cmp < 0) {
        return  VIVM_TAIL(_NextInstruction());
    } else if (_Param(1)->Length() >= _Param(2)->Length()) {
        return _this->_p0;
    } else {
        return VIVM_TAIL(_NextInstruction());
    }
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(StringPickLine, StringRef, StringRef, Int32, StringRef)
{
    SubString initString;
    if (_ParamPointer(0)) {
      initString = _Param(0)->MakeSubStringAlias();
    }
    SubString multiLineInputStr = _Param(1)->MakeSubStringAlias();
    Int32 lineIndex = _Param(2);
    _Param(3)->CopyFromSubString(&initString);

    if (lineIndex >= 0) {
      const Utf8Char* ch = multiLineInputStr.Begin();
      while (ch < multiLineInputStr.End() && lineIndex > 0) {
         if (*ch == '\n') {
            --lineIndex;
         } else if (*ch == '\r') {
            if ((ch+1) < multiLineInputStr.End() && (*(ch+1) == '\n')) {
               ++ch;
            }
            --lineIndex;
         }
         ++ch;
      }
      const Utf8Char *start = ch;
      for (; ch < multiLineInputStr.End() && !(*ch == '\n' || *ch == '\r'); ++ch)
          continue;
      const Utf8Char *end = ch;
      SubString nthLineString;
      nthLineString.AliasAssign(start, end);
      Int32 initStrLength = initString.Length();
      _Param(3)->InsertSubString(initStrLength, &nthLineString);
    }
    return _NextInstruction();
}

DECLARE_VIREO_PRIMITIVE4(MaxAndMinEltsString, StringRef, StringRef, StringRef, StringRef,    \
                         Int32 cmp = memcmp(_Param(0)->Begin(), _Param(1)->Begin(), Min(_Param(0)->Length(), _Param(1)->Length())); \
                         StringRef *max = _ParamPointer(0); StringRef *min = _ParamPointer(1); \
                         if (cmp < 0) { \
                             max = _ParamPointer(1); min = _ParamPointer(0); \
                         } \
                         _Param(2)->Resize1D((*max)->Length()); \
                         TypeRef elementType = (*max)->ElementType(); \
                         elementType->CopyData((*max)->Begin(), _Param(2)->Begin(), (*max)->Length()); \
                         _Param(3)->Resize1D((*min)->Length()); \
                         elementType = (*min)->ElementType(); \
                         elementType->CopyData((*min)->Begin(), _Param(3)->Begin(), (*min)->Length()); )

DEFINE_VIREO_BEGIN(String)
    DEFINE_VIREO_FUNCTION(ReplaceSubstring, "p(i(String) i(String) i(Int32) i(Int32) i(String) o(String))")
    DEFINE_VIREO_FUNCTION(SearchAndReplaceString, "p(o(String) i(String) i(String) i(String) i(Int32) i(Int32) i(Int32) i(Boolean) i(Boolean))")
    DEFINE_VIREO_FUNCTION(SearchSplitString, "p(i(String) i(String) i(Int32) o(String) o(String) o(Int32))")
    DEFINE_VIREO_FUNCTION(StringLength, "p(i(String) o(Int32))")
    DEFINE_VIREO_FUNCTION(StringTrim, "p(i(String) i(Int32) o(String))")
    DEFINE_VIREO_FUNCTION(StringReverse, "p(i(String) o(String))")
    DEFINE_VIREO_FUNCTION(StringRotate, "p(i(String) o(String))")
    DEFINE_VIREO_FUNCTION(StringIndexChar, "p(i(String) i(Int32) o(Utf32Char))")
    DEFINE_VIREO_FUNCTION(StringToUpper, "p(i(String) o(String))")
    DEFINE_VIREO_FUNCTION(StringToLower, "p(i(String) o(String))")
    DEFINE_VIREO_FUNCTION_CUSTOM(StringToUpper, StringToUpperInt, "p(i(Int32) o(Int32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(StringToLower, StringToLowerInt, "p(i(Int32) o(Int32))")
    DEFINE_VIREO_FUNCTION(StringViaDecode, "p(i(String) o(String))")
    // StringConcatenate input can be string, or array of string.
    DEFINE_VIREO_FUNCTION(StringConcatenate, "p(i(VarArgCount) o(String) i(*))" )
    DEFINE_VIREO_FUNCTION(BranchIfEQString, "p(i(BranchTarget) i(String) i(String))");
    DEFINE_VIREO_FUNCTION(BranchIfLTString, "p(i(BranchTarget) i(String) i(String))")
    DEFINE_VIREO_FUNCTION(BranchIfLEString, "p(i(BranchTarget) i(String) i(String))")
    DEFINE_VIREO_FUNCTION(BranchIfGTString, "p(i(BranchTarget) i(String) i(String))")
    DEFINE_VIREO_FUNCTION(BranchIfGEString, "p(i(BranchTarget) i(String) i(String))")
    DEFINE_VIREO_FUNCTION(StringPickLine, "p(i(String) i(String) i(Int32) o(String))")
    DEFINE_VIREO_FUNCTION(IsEmptyString, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEmptyStringOrPath, IsEmptyString, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEmptyString, IsEmptyPath, "p(i(NIPath) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEmptyStringOrPath, IsEmptyPath, "p(i(NIPath) o(Boolean))")
    DEFINE_VIREO_FUNCTION(IsDecimalDigit, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION(IsHexDigit, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION(IsOctalDigit, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION(IsPrintable, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION(IsWhiteSpace, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsDecimalDigit, IsDecimalDigitInt, "p(i(Int32) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsHexDigit, IsHexDigitInt, "p(i(Int32) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsOctalDigit, IsOctalDigitInt, "p(i(Int32) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsPrintable, IsPrintableInt, "p(i(Int32) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsWhiteSpace, IsWhiteSpaceInt, "p(i(Int32) o(Boolean))")
    DEFINE_VIREO_FUNCTION(IsNotANumPathRefnum, "p(i(String) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAPath, "p(i(NIPath) o(Boolean))")

    DEFINE_VIREO_FUNCTION_CUSTOM(MaxAndMinElts, MaxAndMinEltsString, "p(i(String) i(String) o(String) o(String)")


DEFINE_VIREO_END()

}  // namespace Vireo
