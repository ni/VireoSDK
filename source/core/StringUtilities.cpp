// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 */

#include "DataTypes.h"
#include "StringUtilities.h"
#ifdef VIREO_UNICODE_BASIC_MULTILINGUAL_PLANE
#include "CharConversionsUTF16.h"
#endif
#include <stdlib.h>
#include <cmath>
#include <limits>

namespace Vireo
{
//------------------------------------------------------------
//! Length of the string in Unicode codepoints.
Int32 SubString::CharLength(const Utf8Char* begin)
{
#if defined(VIREO_ASCII_ONLY)
    return begin + 1;
#else
    // For a UTF-8 reference
    // see:  http://tools.ietf.org/html/rfc3629

    Utf8Char leadByte = *begin;
    if ((leadByte & 0x80) == 0x00) {
        return 1;
    } else if ((leadByte & 0xE0) == 0xC0) {
        return 2;
    } else if ((leadByte & 0xF0) == 0xE0) {
        return 3;
    } else if ((leadByte & 0xF8) == 0xF0) {
        return 4;
    } else {
        // 5 or 6 bytes encodings are not part of the
        // adopted UTF-8 standard. Bad encodings are
        // treated as a single byte.
        return 1;
    }
#endif
}
//------------------------------------------------------------
//! Numeric value of a codepoint, -1 if not a numeric codepoint.
Int32 SubString::DigitValue(Utf32Char codePoint, Int32 base)
{
    Int32 value = 0;
    if (IsNumberChar(codePoint)) {
        value = (codePoint - '0');
    } else if (codePoint >= 'a' && codePoint <= 'f') {
        value =  10 + (codePoint - 'a');
    } else if (codePoint >= 'A' && codePoint <= 'F')  {
        value =  10 + (codePoint - 'A');
    } else {
        value = -1;
    }

    if (value >= base) {
        value = -1;
    }

    return value;
}

// Helper function for comparing string.  Lengths are pre-tested by callers; sCompare2 string is at least as long as sCompare1
static inline Boolean CompareString(const Utf8Char* sCompare1, const Utf8Char* sEnd1, const Utf8Char* sCompare2) {
    while (sCompare1 < sEnd1) {
        if (*sCompare1++ != *sCompare2++) {
            return false;
        }
    }
    return true;
}
//------------------------------------------------------------
Boolean SubString::Compare(const Utf8Char* begin2, IntIndex length2) const
{
    if (length2 != Length())
        return false;
    return CompareString(_begin, _begin+length2, begin2);
}
//------------------------------------------------------------
Boolean SubString::Compare(const Utf8Char* begin2, IntIndex length2, Boolean ignoreCase) const
{
    if (length2 != Length()) {
        return false;
    }
    const Utf8Char* sCompare = _begin;
    const Utf8Char* sEnd = _begin+length2;
    if (!ignoreCase) {  // separate tighter loop for performance
        return CompareString(sCompare, sEnd, begin2);  // inlined
    }
    while (sCompare < sEnd) {
        Utf8Char c1 = *sCompare++;
        Utf8Char c2 = *begin2++;
        if (c1 != c2
            && ('A' > c1 || c1 > 'Z' || c1 + 'a' - 'A' != c2)
            && ('a' > c1 || c1 > 'z' || c1 + 'A' - 'a' != c2))
                return false;
    }
    return true;
}
//------------------------------------------------------------
// Compare to a nullptr terminated C string
Boolean SubString::CompareCStr(ConstCStr begin2) const
{
    const Utf8Char* sCompare = _begin;
    const Utf8Char* sEnd = _end;
    const Utf8Char* pBegin2 = (const Utf8Char*) begin2;
    // The source string cannot have a nullptr before it hit end
    // So if a nullptr is found in the supplied string first the test bails out false.
    while (sCompare < sEnd) {
        if (*sCompare++ != *pBegin2++)
            return false;
    }
    // Comparison is true if supplied string is the same length.
    return (*pBegin2 == 0);
}
//------------------------------------------------------------
Boolean SubString::ComparePrefix(const Utf8Char* begin2, Int32 length2) const
{
    if (length2 > Length())
        return false;

    return CompareString(_begin, _begin + length2, begin2);  // inlined
}
//------------------------------------------------------------
Boolean SubString::ComparePrefixIgnoreCase(const Utf8Char* begin2, Int32 length2) const
{
    if (length2 > Length())
        return false;

    const Utf8Char* sCompare = _begin;
    const Utf8Char* sEnd = _begin + length2;
    while (sCompare < sEnd) {
        Utf8Char c1 = *sCompare++;
        Utf8Char c2 = *begin2++;
        if (c1 != c2
            && ('A' > c1 || c1 > 'Z' || c1 + 'a' - 'A' != c2)
            && ('a' > c1 || c1 > 'z' || c1 + 'A' - 'a' != c2))
            return false;
    }
    return true;
}
//------------------------------------------------------------
TokenTraits SubString::ClassifyNextToken() const
{
    SubString temp = *this;
    SubString token;

    TokenTraits tt = temp.ReadToken(&token);

    if (temp.ComparePrefix('<')) {
        tt = TokenTraits_TemplateExpression;
    }
    return tt;
}
//------------------------------------------------------------
Boolean SubString::ReadRawChar(Utf8Char* token)
{
    if (_begin < _end) {
        *token = *_begin++;
        return true;
    } else {
        return false;
    }
}
//------------------------------------------------------------
Boolean SubString::PeekRawChar(Utf8Char* token, IntIndex pos) const
{
    if (_begin + pos < _end) {
        *token = *(_begin + pos);
        return true;
    } else {
        return false;
    }
}
//------------------------------------------------------------
Boolean SubString::ReadGraphemeCluster(SubString* token)
{
    const Utf8Char* next = _begin;
    const Utf8Char* initialBegin = _begin;
    Boolean characterEnd = false;
    if (_begin >= _end) {
        return false;
    }
    while (_begin < _end && !characterEnd) {
        next = _begin + CharLength(_begin);
        if (next >= _end) {
            characterEnd = true;
        } else {
            // don't break the CR X LF 0x0D 0x0A
            if (*_begin == 0x0D) {
                characterEnd = *next != 0x0A;
            } else if (*_begin == 0x0A) {
                characterEnd = true;
            } else if (CharLength(next) == 1) {
                characterEnd = true;
            } else {
                Int32 firstByte = *next;
                Int32 secondByte = *next + 1;
                Int32 code = firstByte * 0x100 + secondByte;
                // it only support cluster some extending LATIN character
                characterEnd = !(code >= 0xCC80 && code <= 0xCDAF);
            }
        }
        _begin = next;
    }
    token->AliasAssign(initialBegin, _begin);
    return characterEnd;
}

/**
 * read a line of text. A line is considered to be terminated by any one of a line feed '0x0a', a carriage return '0x0d',
 * or a carriage return followed immediately by a line feed
 * */
//-------------------------------------------------------
Boolean SubString::ReadLine(SubString* line)
{
     const Utf8Char* initialBegin = _begin;
     if (_begin >= _end) {
         return false;
     }
     while (_begin < _end) {
         if (*_begin == '\n') {
             line->AliasAssign(initialBegin, _begin);
             _begin++;
             return true;
         } else if (*_begin == '\r') {
             line->AliasAssign(initialBegin, _begin);
             if (_begin+1 < _end && *(_begin+1) == '\n') {
                 _begin++;
             }
             _begin++;
             return true;
         }
         _begin++;
     }
     line->AliasAssign(initialBegin, _begin);
     return true;
}
//------------------------------------------------------------
Boolean SubString::ReadUtf32(Utf32Char* value)
{
    Utf32Char codePoint = 0;
#if defined(VIREO_ASCII_ONLY)
    if (_begin < _end) {
        uChar = *_begin++
        if (uChar & 0xFFFFFF80) {
            uChar = 0;
        }
    }
#else
    static UInt32 LeadByteMasks[] = {0x0000007F, 0x0000001F, 0x0000000F, 0x00000007};

    if (_begin < _end) {
        Int32 continuationOctets = CharLength(_begin) - 1;
        UInt32 octet = (*_begin++);

        if ((octet & 0xFFFFFF80) && (continuationOctets == 0)) {
            // Invalid lead octet (5 and 6 octet patterns are not supported.)
            codePoint = 0;
        } else  {
            codePoint = (Utf32Char) (octet & LeadByteMasks[continuationOctets]);
            while (continuationOctets--) {
                octet = (*_begin++);
                if ((octet & 0xFFFFFFC0) == 0x00000080) {
                    codePoint = (Utf32Char) (((UInt32)codePoint << 6) | (octet & 0x0000003F));
                } else {
                    // Invalid continuation octet
                    codePoint = 0;
                    break;
                }
            }
        }
     }
#endif
    *value = codePoint;
    return codePoint != 0;
}
//------------------------------------------------------------
Boolean SubString::EatChar(char token)
{
    EatLeadingSpaces();

    if ((_begin < _end) && (*_begin == token)) {
        _begin++;
        return true;
    } else {
        return false;
    }
}
//------------------------------------------------------------
Int32 SubString::ReadEscapeToken(SubString* token)
{
    // On entry _begin should point to the character after the '\'
    // Supports escape sequences \n \r \t \b \\ \' \" \000 (octal) \x00(hex)
    // Unicode \uXXXX is a code point encoded in UTF-16, only BMP is supported
    //
    // If sequence is recognized then the expanded size is the number of bytes
    // the sequence expands to.

    const Utf8Char* newBegin = _begin;
    Int32 expandedSize = 0;

    if (_begin < _end) {
        char c = *_begin;
        if (c == 'x') {
            //  "...\xhh..."
            newBegin = _begin + 3;
            expandedSize = 1;
        } else if (c == 'u') {
            //  "...\uhhhh..."
            newBegin = _begin + 5;
            expandedSize = 1;  // TODO(PaulAustin): size will be UTF8 translation of UTF codepoint
        } else if (c >= '0' && c <= '7') {
            //  "...\ooo..."
            newBegin = _begin + 1;
            while (*newBegin >= '0' && *newBegin <= '7' && newBegin < _end && newBegin < _begin + 3)
                ++newBegin;
            expandedSize = 1;
        } else {
            //  "...\c..."
            // The default is that character following the '\'
            // maps to a single character. If its not a special character
            // then leave it as is. That's the c/c++ grammar
            newBegin = _begin + 1;
            expandedSize = 1;
        }
    } else {
        // else the escape was the last character, ignore it.
    }

    token->AliasAssign(_begin, newBegin);
    _begin = newBegin;

    return expandedSize;
}
//------------------------------------------------------------
Boolean SubString::SplitString(SubString* beforeMatch, SubString* afterMatch, char separator) const
{
    const Utf8Char* it = this->_begin;
    const Utf8Char* end = this->_end;

    while (it < end && *it != separator)
        it++;
    if (beforeMatch)
        beforeMatch->AliasAssign(this->_begin, it);
    if (afterMatch) {
        if (it < end) {
            // Might be an empty string if match was at end.
            afterMatch->AliasAssign(it + 1, end);
        } else {
            // Definitely an empty string.
            afterMatch->AliasAssign(nullptr, nullptr);
        }
    }
    return it < end;
}
//------------------------------------------------------------
Int32 SubString::LengthAfterProcessingEscapes()
{
    SubString temp(this);
    SubString escapeToken;
    Int32 FinalLength = 0;

    while (temp._begin < temp._end) {
        Utf8Char c = *temp._begin++;
        if (c == '\\') {
            FinalLength += temp.ReadEscapeToken(&escapeToken);
        } else {
            FinalLength += 1;
        }
    }
    return FinalLength;
}
//------------------------------------------------------------
void SubString::ProcessEscapes(Utf8Char* dest, Utf8Char* end)
{
    SubString temp(this);

    while (temp._begin < temp._end) {
        Utf8Char c = *temp._begin++;
        if (c == '\\') {
            SubString escapeToken;
            temp.ReadEscapeToken(&escapeToken);
            Int32 escapeTokenLength = escapeToken.Length();
            Utf8Char escapeChar = escapeTokenLength ?  *escapeToken.Begin() : '\0';
            if (escapeTokenLength == 1 && !(escapeChar >= '0' && escapeChar <= '7')) {
                switch (escapeChar) {
                    case 'n':   *dest = '\n';       break;
                    case 'r':   *dest = '\r';       break;
                    case 't':   *dest = '\t';       break;
                    case 'f':   *dest = '\f';       break;
                    case 'b':   *dest = '\b';       break;
                    // \uxxxx unicode characters
                    default :   *dest = escapeChar; break;
                }
                dest++;
            } else if (escapeTokenLength) {
                TempStackCString escapeTokenCString;
                escapeTokenCString.Append(&escapeToken);
                char* escapeCharPtr = escapeTokenCString.BeginCStr();
                char* escapeCharEnd = nullptr;
                int base = 0;
                if ((*escapeCharPtr >= '0' && *escapeCharPtr <= '3') || *escapeCharPtr == 'o') {
                    base = 8;
                } else {
                    if (*escapeCharPtr == 'x' || *escapeCharPtr == 'u')
                        base = 16;
                    else if (*escapeCharPtr == 'b')
                        base = 2;
                    else if (*escapeCharPtr == 'd')
                        base = 10;
                    if (base)
                        ++escapeCharPtr;
                }
                if (base) {
                    IntMax intValue = strtoull(escapeCharPtr, &escapeCharEnd, base);
                    *dest++ = (Utf8Char)intValue;
                } else {
                    *dest++ = (c & 255);
                }
                // TODO(spathiwa): Unicode \u codepoints > \u00ff
            } else {
                // Incorrectly formatted escape, ignore second char
            }
        } else {
            // copy over unmodified
            *dest++ = c;
        }
    }
}
//------------------------------------------------------------
//! Process all of the Escaped characters ('\t', '\n', etc.) to unescape
//! the '\' to '\\'. This will allow the string to be printed as viewed
//! in the source code.
IntIndex SubString::UnEscape(Utf8Char* dest, IntIndex length) {
    SubString temp(this);
    Utf8Char* b = dest + length;
    IntIndex total = 0;
    while (temp._begin < temp._end && b != dest) {
        Utf8Char c = *temp._begin++;
        // Check for the char and add the '\\'
        switch (c) {
            case '\a':
            case '\b':
            case '\f':
            case '\n':
            case '\r':
            case '\t':
            case '\'':
            case '\"':
            case '\\': *dest = '\\';
                       dest++;
                       total++;
                       break;
            default: break;
        }
        // Check the bounds of the buffer provided
        if (dest == b) {
            break;
        }
        // Then add the letter/character
        switch (c) {
            case '\a': *dest = 'a';  break;
            case '\b': *dest = 'b';  break;
            case '\f': *dest = 'f';  break;
            case '\n': *dest = 'n';  break;
            case '\r': *dest = 'r';  break;
            case '\t': *dest = 't';  break;
            case '\'': *dest = '\''; break;
            case '\"': *dest = '\"'; break;
            case '\\': *dest = '\\'; break;
            default: *dest = c; break;
        }
        dest++;
        total++;
    }
    if (dest != b)
        *dest = '\0';
    return total;
}
//------------------------------------------------------------
//! Read a token that represents a simple symbol or value, including *.
TokenTraits SubString::ReadToken(SubString* token, Boolean suppressInfNaN /*=false*/)
{
    TokenTraits tokenTraits = TokenTraits_Unrecognized;

    EatLeadingSpaces();

    const Utf8Char* initialBegin = _begin;
    if (!(_begin < _end))
        return tokenTraits;

    Utf8Char c = *_begin++;
    Utf8Char cPeek = (_begin < _end) ? *_begin : 0;

    if (IsPunctuationChar(c)) {
        tokenTraits = (c == '(') ? TokenTraits_NestedExpression : TokenTraits_Punctuation;
    } else if (('"' == c) || (('@' == c) && (cPeek == '"'))) {
        Boolean allowEscapes = true;
        tokenTraits = TokenTraits_String;
        //   "abc" or @"abc"
        if ((_begin < _end) && ('@' == c)) {
            _begin++;
            allowEscapes = false;
            tokenTraits = TokenTraits_VerbatimString;
        } else {
            tokenTraits = TokenTraits_String;
        }
        while (_begin < _end) {
            c = *_begin++;
            if (c == '\\' && allowEscapes) {
                SubString escapToken;
                ReadEscapeToken(&escapToken);
            } else if (c == '"') {
                break;
            }
        }
    } else if (('\'' == c) || (('@' == c) && (cPeek == '\''))) {
        Boolean allowEscapes = true;
        //   'abc' or @'abc'
        if ((_begin < _end) && ('@' == c)) {
            _begin++;
            allowEscapes = false;
            tokenTraits = TokenTraits_VerbatimString;
        } else {
            tokenTraits = TokenTraits_String;
        }
        while (_begin < _end) {
            c = *_begin++;
            if (c == '\\' && allowEscapes) {
                SubString escapToken;
                ReadEscapeToken(&escapToken);
            } else if (c == '\'') {
                break;
            }
        }
    } else if ('*' == c) {
        tokenTraits = TokenTraits_WildCard;
    } else if (('(' == c) || (')' == c)) {
        tokenTraits = TokenTraits_NestedExpression;
    } else if (IsIdentifierChar(c)) {
        // Read the identifier token.
        _begin = initialBegin;
        while (_begin < _end && (IsIdentifierChar(*_begin))) {
            _begin++;
        }
        SubString idToken(initialBegin, _begin);

        if (!suppressInfNaN) {
            ConstCStr specialIEEEVals[] =  {"infinity", "-infinity", "inf", "-inf", "nan", nullptr };
            ConstCStr *specValPtr = specialIEEEVals;
            while (*specValPtr) {
                if (idToken.ComparePrefixCStrIgnoreCase(*specValPtr)) {
                    IntIndex len = IntIndex(strlen(*specValPtr));
                    IntIndex tokenLen = idToken.Length();
                    // allow an exact token match or one followed by +/-/i to allow complex literals
                    if (tokenLen == len
                        || (tokenLen == len+1 && (initialBegin[len] == 'i'  || initialBegin[len] == 'I'))
                        || (tokenLen >= len+1 && (initialBegin[len] == '+'  || initialBegin[len] == '-'))) {
                        tokenTraits = TokenTraits_IEEE754;
                        _begin = initialBegin + len;
                    }
                    break;
                }
                ++specValPtr;
            }
        }
        if (tokenTraits != TokenTraits_Unrecognized) {  // set above
        } else if (('t' == c || 'f' == c) && (idToken.CompareCStr("true") || idToken.CompareCStr("false"))) {
            // Look for Boolean(ish) tokens.
            tokenTraits = TokenTraits_Boolean;
        } else if (idToken.ComparePrefixCStr("0x")) {
            // Look for hexadecimal tokens.
            idToken._begin += 2;
            if (idToken.EatCharsByTrait(kACT_Hex) && idToken.Length() == 0) {
                tokenTraits = TokenTraits_Integer;
            }
        } else if (IsNumberChar(c) || ((('+' == c) || ('-' == c)) && (idToken.Length() > 1))) {
            // Look for numeric tokens, both integer and real
            if (('+' == c) || ('-' == c)) {
                // Skip the sign
                idToken._begin++;
            }

            do {  // Block with short-cut breaks
                Int32 leadingDigits = idToken.EatCharsByTrait(kACT_Decimal);
                if (leadingDigits && idToken.Length() == 0) {
                    // Since it was all numbers and nothing's left
                    // It was an integer
                    tokenTraits = TokenTraits_Integer;
                    break;
                }
                if (idToken.EatChar('.')) {
                    Int32 fractionDigits = idToken.EatCharsByTrait(kACT_Decimal);
                    if (fractionDigits && idToken.Length() == 0) {
                        //  Simple nn.nn format with no exponent, exit
                        tokenTraits = TokenTraits_IEEE754;
                        break;
                    }
                }
                if (!idToken.EatChar('e') && !idToken.EatChar('E')) {
                    // Error if more characters remain and its not an exponent
                    break;
                }
                // Eat any sign (they are optional)
                if (!idToken.EatChar('+'))
                    idToken.EatChar('-');
                // make sure there are some digits
                Int32 exponentDigits = idToken.EatCharsByTrait(kACT_Decimal);
                if (exponentDigits && idToken.Length() == 0) {
                    tokenTraits = TokenTraits_IEEE754;
                    break;
                }
                // If it falls throuh then the token is not a valid number.
            } while (false);
            if (tokenTraits == TokenTraits_Unrecognized && idToken.Length() > 0)
                _begin = idToken._begin;
        } else {
            tokenTraits = TokenTraits_SymbolName;
        }
    }
    if (_begin > initialBegin) {
        token->AliasAssign(initialBegin, _begin);
    } else {
        token->AliasAssign(nullptr, nullptr);
    }
    return tokenTraits;
}
//------------------------------------------------------------
//! Read an expression that may be a single token or nested expression
TokenTraits SubString::ReadSubexpressionToken(SubString* token)
{
    EatLeadingSpaces();
    SubString tempString(this);
    TokenTraits tt = TokenTraits_Unrecognized;
    const Utf8Char* begin = Begin();
    Int32 depth = 0;

    do {
        tt = this->ReadToken(token);
        if (token->CompareCStr("(")) {
            depth++;
        } else if (token->CompareCStr(")")) {
            depth--;
            // The out going trait will be the last one recorded
            // unless ReadToken failed. In that case the last tt
            // will be TokenTraits_Unrecognized.
            tt = TokenTraits_NestedExpression;
        }
    } while (tt && (depth > 0));

    // Look for template parameters
    while (_begin < _end && *_begin == '<') {
        EatChar('<');
        tt = TokenTraits_TemplateExpression;
        // If the expression is followed by template parameters.
        // Then eat the arguments and closing brace
        while (true) {
            if (EatChar('>')) {
                break;
            }
            SubString templateParam;
            if (!ReadSubexpressionToken(&templateParam)) {
                break;
            }
        }
    }

    // The loop has reached an end state, go back and add
    // tokens that were skipped over to get to this point.
    token->AliasAssign(begin, this->Begin());

    return tt;
}
//------------------------------------------------------------
//! Read an optional "Name:" prefix to a value.
Boolean SubString::ReadNameToken(SubString* token)
{
    EatLeadingSpaces();
    SubString tempString(this);

    if (tempString.ReadToken(token)) {
        tempString.EatLeadingSpaces();
        if (tempString.EatChar(*tsNameSuffix)) {
            // Name was found, its removed from the front of 'this'
            // along with the colon
            _begin = tempString.Begin();
            return true;
        }
    }
    // Its not a name prefix, leave all as is
    token->AliasAssign(nullptr, nullptr);
    return false;
}
//---------------------------------------------------
//! Read 2 hex characters. Balk if there are not that many
Boolean SubString::ReadHex2(Int32 *pValue)
{
    if (Length() >= 2) {
        Int32 d1 = DigitValue(*_begin, 16);
        Int32 d2 = DigitValue(*(_begin+1), 16);
        if ((d1 >= 0) && (d2 >= 0)) {
            _begin += 2;
            *pValue = (d1 << 4) | d2;
            return true;
        }
    }
    return false;
}
//---------------------------------------------------
//! Read 2 hex characters. Balk if there are not that many
Boolean SubString::ReadIntWithBase(Int64 *pValue, Int32 base)
{
    Int64 value = 0, sign = 1;
    EatWhiteSpaces();
    if (base == 10) {  // allow negative other bases?
        if (EatChar('-')) {
            sign = -1;
        } else {
            EatChar('+');
        }
    }
    const Utf8Char *origBegin = _begin;
    while (_begin < _end) {
        Int32 d = DigitValue(*_begin, base);
        if (d >= 0)
            value = (value * base) + d;
        else
            break;
        ++_begin;
    }
    *pValue = value * sign;
    return _begin > origBegin;
}
//---------------------------------------------------
Boolean SubString::CompareViaEncodedString(SubString* encodedString) const
{
    Utf8Char c;
    Utf8Char decodedC;
    IntIndex length = 0;
    SubString ss(encodedString);

    while (ss.ReadRawChar(&c)) {
        if (c == '+') {
            decodedC = ' ';
        } else if (c != '%') {
            decodedC = c;
        } else {
            Int32 value = 0;
            if (ss.ReadHex2(&value)) {
                decodedC = (Utf8Char)value;
            } else {
                decodedC = '%';
            }
        }
        length++;
        if (length > this->Length()) {
            return false;
        }
        if (*(_begin+length-1) != decodedC) {
            return false;
        }
    }

    return length >= this->Length();
}
//------------------------------------------------------------
//! Read an integer or one of the special symbolic numbers formats
Boolean SubString::ReadIntDim(IntIndex *pValue)
{
    // Three formats are supported
    // 1. nnn   Simple integers negative or positive
    // 2. *     Which means variable or unspecified
    // 3  #n    Which also means variable but is identifies as a template parameter
    // Meta ints can only be used where the reasonable range of value does not
    // include extreme negative numbers.

    EatLeadingSpaces();
    if (_begin < _end) {
        if (*_begin == '*') {
            _begin++;
            *pValue = kArrayVariableLengthSentinel;
            return true;
        } else if (*_begin == *tsMetaIdPrefix) {
            IntMax templateIndex;
            SubString innerString(_begin+1, _end);
            if (innerString.ReadInt(&templateIndex) && templateIndex < kArrayMaxTemplatedDimLengths) {
                _begin = innerString.Begin();
                *pValue = kArrayVariableLengthSentinel + (IntIndex)templateIndex + 1;
                return true;
            }
        } else {
            IntMax temp;
            Boolean bNumber = ReadInt(&temp);
            if (bNumber && (temp > kArrayFirstTemplatedDimLength) && (temp < kArrayIndexMax)) {
                *pValue = (IntIndex)temp;
                return true;
            }
        }
    }
    *pValue = 0;
    return false;
}
//------------------------------------------------------------
Boolean SubString::ReadInt(IntMax *pValue, Boolean *overflow /*=nullptr*/)
{
    IntMax value = 0;
    IntMax sign = 1;
    Int32 base = 10;
    Boolean bNumberFound = false;

    EatLeadingSpaces();

    if (ComparePrefixCStr("0x")) {
        base = 16;
        _begin += 2;
    } else {
        base = 10;
        if (EatChar('-')) {
            sign = -1;
        } else {
            EatChar('+');
        }
    }  // Any need for octal?

    while (_begin < _end) {
        Int32 cValue = DigitValue(*_begin, base);

        if (cValue >= 0) {
            _begin++;
            if (overflow) {
                UIntMax newValue = (UIntMax(value) * base) + cValue;
                if (newValue < UIntMax(value)) {
                    *overflow = true;
                }
                value = newValue;
            } else {
                value = (value * base) + cValue;
            }
            bNumberFound = true;
        } else {
            break;
        }
    }

    if (pValue) {
        *pValue = value * sign;
    }

    return bNumberFound;
}
//------------------------------------------------------------
Boolean SubString::ParseDouble(Double *pValue, Boolean suppressInfNaN /*= false*/, Int32 *errCodePtr /*= nullptr*/)
{
    TempStackCString tempCStr(this);
    ConstCStr current = tempCStr.BeginCStr();
    char* end = nullptr;
    Int32 errCode = kLVError_NoError;

    Double value = strtod(current, (char**)&end);
    if (suppressInfNaN) {
        if (std::isinf(value)) {
            end = (char*)current;
            errCode = kLVError_JSONBadInf;
        }
        if (std::isnan(value)) {
            end = (char*)current;
            errCode = kLVError_JSONBadNaN;
        }
    }
    Boolean bParsed = current != end;
    _begin += end - current;

    // although strtod above (at least on non-Windows) can parse inf/nan, it only works if followed by
    // whitespace or EOS, and not the long forms so we have to check explicitly.
    if (!bParsed && !errCode) {
        Int32 length = Length();
        if (length >= 3 && ComparePrefixIgnoreCase(Utf8Ptr("inf"), 3)) {
            value = std::numeric_limits<double>::infinity();
            bParsed = true;
            _begin += 3;
            if (length >= 8 && ComparePrefixIgnoreCase(Utf8Ptr("inity"), 5))
                _begin += 5;
        } else if (length >= 3 && ComparePrefixIgnoreCase(Utf8Ptr("nan"), 3)) {
            value = std::numeric_limits<double>::quiet_NaN();
            bParsed = true;
            _begin += 3;
        } else if (length >= 4 && ComparePrefixIgnoreCase(Utf8Ptr("-inf"), 4)) {
            value = -std::numeric_limits<double>::infinity();
            bParsed = true;
            _begin += 4;
            if (length >= 9 && ComparePrefixIgnoreCase(Utf8Ptr("inity"), 5))
                _begin += 5;
        }
        if (bParsed && suppressInfNaN) {
            bParsed = false;
            errCode = std::isnan(value) ? kLVError_JSONBadNaN : kLVError_JSONBadInf;
        }
    }

    if (!bParsed) {
        value = 0.0;
        if (!errCode)
            errCode = kLVError_ArgError;
    }
    if (pValue) {
        *pValue = value;
    }
    if (errCodePtr) {
        *errCodePtr = errCode;
    }
    return bParsed;
}
//------------------------------------------------------------
void SubString::EatToEol()
{
    while ((_begin < _end) && !IsEolChar(*_begin)) {
        _begin++;
    }
    while ((_begin < _end) && IsEolChar(*_begin)) {
        _begin++;
    }
    return;
}
//------------------------------------------------------------
Int32 SubString::CountMatches(char value) const
{
    const Utf8Char* pChar = _begin;
    Int32 matchCount = 0;

    while (pChar < _end) {
        if (*pChar == value)
            matchCount++;
        pChar++;
    }
    return matchCount;
}
//------------------------------------------------------------
//! The length of the string in logical characters, not bytes.
Int32 SubString::StringLength() const
{
    const Utf8Char* pCharSequence = _begin;
    const Utf8Char* pEnd = _end;

    // If the string contains invalid UTF-8 encodings the logical length
    // may be shorter than expected.

    Int32 i = 0;
    while (pCharSequence < pEnd) {
        pCharSequence = pCharSequence + CharLength(pCharSequence);
        i++;
    }
    return i;
}
//------------------------------------------------------------
//! The core class for working with strings. The SubString never owns the data it points to.
void SubString::EatRawChars(Int32 count)
{
    if (count < 0 || count >= Length()) {
        _begin = _end;
    } else {
#if defined(VIREO_ASCII_ONLY)
        _begin = _begin + count;
#else
        while ((_begin < _end) && (count > 0)) {
            _begin = _begin + CharLength(_begin);
            count--;
        }
        // If the last character is malformed
        // then _begin may end up past _end, fix it.
        if (_begin > _end) {
            _begin = _end;
        }
#endif
    }
}
//------------------------------------------------------------
void SubString::EatLeadingSpaces()
{
    // Eat white spaces and EOL chars.
    // If a '//' comment is found skip to an EOL char or end of string
    // If at '/*' Comment is found skip till closing or end of string

    while (_begin < _end) {
        if (IsSpaceChar(*_begin)) {
            _begin++;
            continue;
        } else if (*_begin == '/') {
            if ((_begin+1) < _end && _begin[1] == '/') {
                //    A '//' comment
                // comment until EOL
                _begin += 2;
                while ((_begin < _end) && !IsEolChar(*_begin)) {
                    _begin++;
                }
                // Once any EOL character is found the loop goes
                // back to white space skipping.
            } else if ((_begin+1) < _end && _begin[1] == '*') {
                //  A '/*' comment
                _begin += 2;
                while ((_begin+1 < _end) && !(_begin[0] == '*' && _begin[1] == '/')) {
                    _begin++;
                }
                if (_begin+1 < _end) {
                    _begin += 2;
                } else {
                    _begin += 1;
                }
            } else {
                break;
            }
        } else {
            break;
        }
    }
}
//------------------------------------------------------------
void SubString::EatWhiteSpaces()
{
    while (_begin < _end) {
        if (IsSpaceChar(*_begin)) {
            _begin++;
        } else {
            break;
        }
    }
}
//------------------------------------------------------------
Int32 SubString::EatCharsByTrait(UInt8 trait)
{
    const Utf8Char* initialBegin = _begin;
    while ((_begin < _end) && (*_begin <= 127) && (AsciiCharTraits[(*_begin)] & trait)) {
        _begin++;
    }
    return (Int32)(_begin - initialBegin);
}
//------------------------------------------------------------
void SubString::TrimQuotedString(TokenTraits tt)
{
    // Warning: Trust TokenTrait information from ReadToken
    // So that checking is not done back to back.
    if (tt == TokenTraits_String && (Length() >= 2)) {
        _begin  += 1;
        _end    -= 1;
    } else if (tt == TokenTraits_VerbatimString && (Length() >= 3)) {
        _begin  += 2;  // remove '@' as well.
        _end    -= 1;
    }
}
//------------------------------------------------------------
IntIndex SubString::FindFirstMatch(const SubString* searchString, IntIndex offset, Boolean ignoreCase) const
{
    IntIndex searchStringLength = searchString->Length();
    if (Length() == 0 || searchStringLength > Length())
        return -1;
    if (offset < 0) {
        offset = 0;
    }
    const Utf8Char* pStart = _begin + offset;
    const Utf8Char* pEnd = (searchStringLength > 0) ? _end - searchStringLength + 1 : _end;
    for (; pStart < pEnd; ) {
        if (searchString->Compare(pStart, searchStringLength, ignoreCase)) {
            return (IntIndex)(pStart - _begin);
        } else {
            pStart = pStart + CharLength(pStart);
        }
    }
    return -1;
}
//------------------------------------------------------------
void PercentCodecSubString::Init(const SubString &s, bool convert, bool alwaysAlloc) {
    if (_convertedStr && _convertedStr != _buffer)
        delete[] _convertedStr;

    IntIndex len = convert ? ComputeConvertedLength(s): s.Length();

    if (alwaysAlloc || len >= kMaxInlineDecodedSize)
        _convertedStr = new Utf8Char[len+1];
    else
        _convertedStr = _buffer;

    if (convert) {
        Convert(s);
    } else {
        memcpy(_convertedStr, s.Begin(), len);
    }

    _convertedStr[len] = 0;
}
//------------------------------------------------------------
PercentCodecSubString::PercentCodecSubString(const SubString &s, bool convert, bool alwaysAlloc) : _convertedStr(nullptr) {
}
//------------------------------------------------------------
Boolean PercentEncodedSubString::NeedsEncoding(Utf8Char c) {
    return !SubString::IsNumberChar(c) && !SubString::IsLetterChar(c) && !IsReservedChar(c);
}
//------------------------------------------------------------
Boolean PercentEncodedSubString::IsReservedChar(Utf8Char c) {
    // We are using a custom encoding mechanism based on percent-encoding
    // which does not encode the following characters: + * _ - $
    // if this ever changes make sure to also update LabVIEW editor (C# side)
    // and Vireo.encodeVireoIdentifier in vireo.loader.staticHelpers.js
    return (c == '+' || c == '*' || c == '_' || c == '-' || c == '$');
}
//------------------------------------------------------------
Int32 PercentEncodedSubString::GetEncodedLength(const SubString &s) {
    const Utf8Char *cp = s.Begin();
    IntIndex len = s.Length();
    while (cp != s.End()) {
        if (cp == s.Begin() && !SubString::IsLetterChar(*cp)) {
            len += 2;
            ++cp;
            continue;
        }
        if (NeedsEncoding(*cp))
            len += 2;
        ++cp;
    }
    return len;
}
//------------------------------------------------------------
void PercentEncodedSubString::Encode(const SubString &s) const {
    SubString ss = s;
    Utf8Char c;
    Utf8Char *pDest = _convertedStr;

    // Custom encoder percent-encodes if first char
    // is not a letter [A-Za-z]
    if (ss.ReadRawChar(&c)) {
        if (SubString::IsLetterChar(c)) {
            *pDest++ = c;
        } else {
            PercentEncodeUtf8Char(c, &pDest);
        }
    }

    // Encode the rest of the string
    while (ss.ReadRawChar(&c)) {
        if (NeedsEncoding(c)) {
            PercentEncodeUtf8Char(c, &pDest);
        } else {
            *pDest++ = c;
        }
    }
}
const char* HEX_VALUES = "0123456789ABCDEF";
//------------------------------------------------------------
void PercentEncodedSubString::PercentEncodeUtf8Char(Utf8Char c, Utf8Char **pDest) {
    **pDest = '%';
    (*pDest)++;
    **pDest = (Utf8Char)(HEX_VALUES[(0xF0 & c) >> 4]);
    (*pDest)++;
    **pDest = (Utf8Char)(HEX_VALUES[0xF & c]);
    (*pDest)++;
}
//------------------------------------------------------------
Int32 PercentDecodedSubString::GetDecodedLength(const SubString &s)
{
    const Utf8Char *cp = s.Begin();
    IntIndex len = s.Length();
    while (cp != s.End()) {
        if (*cp == '%' && cp + 2 < s.End())
            len -= 2;
        ++cp;
    }
    return len;
}
//------------------------------------------------------------
void PercentDecodedSubString::Decode(const SubString &s) const {
    SubString ss = s;
    Utf8Char c;
    Int32 value;
    Utf8Char *pDest = _convertedStr;
    while (ss.ReadRawChar(&c)) {
        if (c == '%' && ss.ReadHex2(&value))
            *pDest++ = (Utf8Char)value;
        else if (c == '+')
            *pDest++ = ' ';
        else
            *pDest++ = c;
    }
}

#if 0
//------------------------------------------------------------
//! A tool for debugging UTF8 encodings
void PrintUTF8ArrayHex(const char* buffer, Int32 length)
{
    for (; length;) {
        Int32 x = SubString::NextChar((const Utf8Char*) buffer) - buffer;
        for (; x; x--) {
            PlatformIO::Printf("%02X", (UInt8)(*buffer));
            buffer++;
            length--;
        }
        PlatformIO::Print(" ");
    }
    PlatformIO::Print("\n");
}
#endif
}  // namespace Vireo

