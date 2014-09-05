/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include "DataTypes.h"
#include "StringUtilities.h"
#ifdef VIREO_UNICODE_BASIC_MULTILINGUAL_PLANE
#include "CharConversionsUTF16.h"
#endif
#include <stdlib.h>
#if (kVireoOS_win32U || kVireoOS_win64U )
#include <limits>
#endif
namespace Vireo
{

//------------------------------------------------------------
Boolean SubString::Compare(const Utf8Char* begin2, IntIndex length2) const
{
    if (length2 != Length()) {
        return false;
    }
    const Utf8Char* sCompare = _begin;
    const Utf8Char* sEnd = _begin+length2;
    while(sCompare < sEnd) {
        if (*sCompare++ != *begin2++) {
            return false;
        }
    }
    return true;
}
//------------------------------------------------------------
Boolean SubString::Compare(const Utf8Char* begin2, IntIndex length2, Boolean ignoreCase) const
{
    if (length2 != Length()) {
        return false;
    }
    const Utf8Char* sCompare = _begin;
    const Utf8Char* sEnd = _begin+length2;
    while(sCompare < sEnd) {
        Utf8Char c1 = *sCompare++;
        Utf8Char c2 = *begin2++;
        if (c1 != c2) {
            if (ignoreCase && ('A' <= c1) && (c1 <= 'Z') && (c1 + 'a' - 'A' == c2))
                continue;
            else if (ignoreCase && ('a' <= c1) && (c1 <= 'z') && (c1 + 'A' - 'a' == c2))
                continue;
            else
                return false;
        }
    }
    return true;
}
//------------------------------------------------------------
// Compare to a null terminated C string
Boolean SubString::CompareCStr(const char* begin2) const
{
    const Utf8Char* sCompare = _begin;
    const Utf8Char* sEnd = _end;
    const Utf8Char* pBegin2 = (const Utf8Char*) begin2;
    // The source string cannot have a null before it hit end
    // So if a null is found in the supplied string first the test bails out false.
    while(sCompare < sEnd) {
        if (*sCompare++ != *pBegin2++) {
            return false;
        }
    }
    // Comparison is true if supplied string is the same length.
    return (*pBegin2 == 0);
}
//------------------------------------------------------------
Boolean SubString::ComparePrefix(const Utf8Char* begin2, Int32 length2) const
{
    if (length2 > Length()) {
        return false;
    }
    const Utf8Char* sCompare = _begin;
    const Utf8Char* sEnd = _begin + length2;
    while(sCompare < sEnd) {
        if (*sCompare++ != *begin2++) {
            return false;
        }
    }
    return true;
}
//------------------------------------------------------------
Boolean SubString::IdentifierIsNext() const
{
    // ID tokens must start with a letter, under score,
    // or URL style escaped characer %20. Needs to be
    // extended to UTF8 support
    if (_begin <_end) {
        if (IsLetterChar(*_begin) || *_begin == '_' || *_begin == '%')
            return true;
    }
    return false;
}
//------------------------------------------------------------
Boolean SubString::ReadRawChar(char* token)
{
    if (_begin < _end) {
        *token = *_begin++;
        return true;
    } else {
        return false;
    }
}
//------------------------------------------------------------
Boolean SubString::ReadChar(char token)
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
    // On entry _begin should point to the character after the /
    // Supports escape sequences /n /r /t /' /" /000 (octal) /x00(hex)
    // perhaps Utf8 allowing for 1 to 5 hex bytes following /u00 /u0000 /u000000 ...
    // If it is recognized then the expanded size will be the number of bytes the sequence will expand to
    // when encoded in Utf8. If it is not recognized then the expanded size will be 0

    const Utf8Char* begin = _begin;
    const Utf8Char* end = _begin;
    Int32 expandedSize = 0;
    
    if (_begin < _end) {
        char c = *_begin++;
        if (c == 'n' || c == 'r' || c == 't' || c == '\'' || c == '"' || c == '\\') {
            end = _begin;
            expandedSize = 1;
        } else if (c == 'x') {
            expandedSize = 1;
        } else if (c == 'u') {
            expandedSize = 1; //TODO could be 1-5 in utf8
        } else if (c == 'U') {
            expandedSize = 1; //TODO could be 1-5 in utf8
        } else if (c >= '0' && c <= '7') {
            expandedSize = 1; // TODO
        }
        //else it is unrecognised, ignore it
    }
    // else the escape was the last character, ignore it
    token->AliasAssign(begin, end);
    return expandedSize;
}

bool SubString::SplitString(SubString* beforeMatch, SubString* afterMatch, char separator) const
{
    const Utf8Char* it = this->_begin;
    const Utf8Char* end = this->_end;
    while(it < end && *it != separator)
        it++;
    beforeMatch->AliasAssign(this->_begin, it);
    afterMatch->AliasAssign(it, end);
    return (it != end);
}

Int32 SubString::LengthAferProcessingEscapes()
{
    SubString temp(this);
    SubString escapeToken;
    Int32 FinalLength = 0;
    
    while(temp._begin < temp._end) {
        char c = *temp._begin++;
        if (c == '\\') {
            FinalLength += temp.ReadEscapeToken(&escapeToken);
        } else {
            FinalLength += 1;
        }
    }
    return FinalLength;
}

void SubString::ProcessEscapes(char* dest, char* end)
{    
    SubString temp(this);
    
    while(temp._begin < temp._end) {
        char c = *temp._begin++;
        if (c == '\\') {
            SubString escapeToken;
            temp.ReadEscapeToken(&escapeToken);
            Int32 escapeTokenLength = escapeToken.Length();
            if (escapeTokenLength == 1) {
                char escapeChar = *escapeToken.Begin();
                switch (escapeChar) {
                    case 'n':   *dest = '\n';       break;
                    case 'r':   *dest = '\r';       break;
                    case 't':   *dest = '\t';       break;
                    default :   *dest = escapeChar; break;
                }
                dest++;
            } else if (escapeTokenLength > 1) {
                // TODO octal, hex, Unicode stuff
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
// Read a token that represents a value. This includes
// quoted strings and "*" which is used as a wild card character.
// TODO refine the options and have test for them all.
TokenTraits SubString::ReadValueToken(SubString* token, TokenTraits allowedTraits)
{
    TokenTraits tokenTraits = TokenTraits_UnRecognized;
    Boolean allowEscapes = true;
    Boolean escapeSequencesFound = false;

    EatLeadingSpaces();
    
    const Utf8Char* initialBegin = _begin;
    if (!(_begin < _end))
        return tokenTraits;
    
    char c = *_begin++;
    char cPeek = (_begin < _end) ? *_begin : 0;
    
    if ((allowedTraits && TokenTraits_DoubleQuotedString) && (('"' == c) || (('@' == c) && (cPeek == '"')) )) {
        tokenTraits = TokenTraits_DoubleQuotedString;
        //   "abc" or @"abc"
        if ((_begin < _end) && ('@' == c)) {
            _begin++;
            allowEscapes = false; 
        }
        while (_begin < _end) {
            char c = *_begin++;
            if (c == '\\' && allowEscapes) {
                SubString escapToken;
                ReadEscapeToken(&escapToken);
                escapeSequencesFound = true;
            } else if (c == '"') {
                break;
            }
        }
        if (escapeSequencesFound) {
            tokenTraits = (TokenTraits) (tokenTraits | TokenTraits_EscapeSequences);
        }
    } else if ((allowedTraits && TokenTraits_SingleQuotedString) && (('\'' == c) || (('@' == c) && (cPeek == '\'')) )) {
        tokenTraits = TokenTraits_SingleQuotedString;
        //   'abc' or @'abc'
        if ((_begin < _end) && ('@' == c)) {
            _begin++;
            allowEscapes = false; 
        }
        while (_begin < _end) {
            char c = *_begin++;
            if (c == '\\' && allowEscapes) {
                SubString escapToken;
                ReadEscapeToken(&escapToken);
                escapeSequencesFound = true;
            } else if (c == '\'') {
                break;
            }
        }
        if (escapeSequencesFound) {
            tokenTraits = (TokenTraits) (tokenTraits | TokenTraits_EscapeSequences);
        }
    } else if ((allowedTraits && TokenTraits_WildCard) && ('*' == c)) {
        tokenTraits = TokenTraits_WildCard;
    } else if ((allowedTraits && TokenTraits_Boolean) && (('t' == c) || ('f' == c))) {
        while ((_begin < _end) && IsIdentifierChar(*_begin)) {
            _begin++;
        }
        tokenTraits = TokenTraits_Boolean;
    } else if ((allowedTraits && TokenTraits_Parens) && (('(' == c) || (')' == c))) {
        tokenTraits = TokenTraits_Parens;
    } else if ((allowedTraits && TokenTraits_Comma) && (',' == c)) {
        tokenTraits = TokenTraits_Comma;
    } else if (allowedTraits && (TokenTraits_Integer | TokenTraits_RealNumber)) {
        _begin--; // back up a character
        if (ComparePrefixCStr("inf") || ComparePrefixCStr("nan")) {
            _begin+=3;
            tokenTraits = (TokenTraits) (TokenTraits_RealNumber);
        } else if (ComparePrefixCStr("-inf")) {
            _begin+=4;
            tokenTraits = (TokenTraits) (TokenTraits_RealNumber | TokenTraits_Negative);
        } else {
            Boolean foundDigits = false;
            Boolean foundNegaitveSign = false;
            Boolean foundDecimalSeperatorSign = false;
            Boolean foundExponent = false;
            while (_begin < _end) {
                // TODO further refine the parsing
                char c = *_begin;
                if ('.' == c && !foundDecimalSeperatorSign) {
                    foundDecimalSeperatorSign = true;
                    tokenTraits = (TokenTraits) (tokenTraits | (TokenTraits)TokenTraits_RealNumber);
                    // TODO remove integer trait
                } else if ('-' == c && (_begin == initialBegin) && !foundNegaitveSign) {
                    tokenTraits = (TokenTraits) (tokenTraits | (TokenTraits)TokenTraits_Negative);
                    foundNegaitveSign = true;
                } else if (('E' == c || 'e' == c) && foundDigits && !foundExponent) {
                    _begin++;
                    if ((_begin < _end) && (*_begin == '+')) {
                        tokenTraits = (TokenTraits) (tokenTraits | (TokenTraits)TokenTraits_RealNumber);
                        foundExponent = true;
                    } else if ((_begin < _end) && (*_begin == '-')) {
                        tokenTraits = (TokenTraits) (tokenTraits | (TokenTraits)(TokenTraits_RealNumber | TokenTraits_Negative));
                        foundExponent = true;
                    } else {
                        return TokenTraits_UnRecognized;
                    }
                    // TODO remove integer trait
                } else if ((IsNumberChar(c) || ('t'== c) || ('f'== c) || ('x'== c))) {
                    tokenTraits = (TokenTraits) (tokenTraits | (TokenTraits_Integer | TokenTraits_RealNumber));
                    foundDigits = true;
                } else {
                    break;
                }
                _begin++;
            }
        }
    }
    if (_begin > initialBegin) {
        token->AliasAssign(initialBegin, _begin);
    } else {
        token->AliasAssign(null, null);
    }
    return tokenTraits;
}
//------------------------------------------------------------
Boolean SubString::ReadSubexpressionToken(SubString* token)
{
    EatLeadingSpaces();
    SubString tempString(this);
    Boolean tokenFound;
    const Utf8Char* begin = Begin();
    Int32 depth = 0;
    
    do {
        tokenFound = this->ReadToken(token);
        if (token->CompareCStr("(")) {
            depth++;
        } else if (token->CompareCStr(")")) {
            depth--;
        }
    } while (tokenFound && (depth>0));
    
    
    // The loop has reached an end state, go back and
    // add tokens that were skipped over to get to this point.
    token->AliasAssign(begin, this->Begin());
    
    return tokenFound;
}
//------------------------------------------------------------
Boolean SubString::ReadToken(SubString* token)
{
    EatLeadingSpaces();
    
    Boolean tokenFound = true;
    const Utf8Char* initialBegin = _begin;
    char c = *initialBegin;
    
    if (!(_begin < _end)) {
        tokenFound = false;
    } else if (c == '\'' || c == '"' || c == '@') {
        // Quoted strings count as simple tokens, partly so that symbols can have special characters in them
        TokenTraits traits = ReadValueToken(token, (TokenTraits) (TokenTraits_DoubleQuotedString | TokenTraits_SingleQuotedString) );
        tokenFound = (traits && (TokenTraits_DoubleQuotedString | TokenTraits_SingleQuotedString)) != 0;
    } else if (IsSymbolChar(c)) {
        // Single character tokens, checked second so ',", and @ have priority
        _begin++;
        token->AliasAssign(initialBegin, _begin);
    } else {
        // Alpha-numeric and underscore tokens
        while (_begin < _end && (IsIdentifierChar(*_begin))) {
            _begin++;
        }
        if (_begin > initialBegin) {
            token->AliasAssign(initialBegin, _begin);
            tokenFound = true;
        }
    }
    if (!tokenFound) {
        token->AliasAssign(null, null);
    }
    return tokenFound;
}
//------------------------------------------------------------
Boolean SubString::ReadInt(IntMax *pValue)
{
    IntMax value = 0;
    IntMax sign = 1;
    Boolean bNumberFound = false;
    
    EatLeadingSpaces();
    
    const Utf8Char* begin = _begin;
    
    if (!(begin < _end)) {
        value = 0;
    } else if (*begin == '*') {
        begin++;
        value = kVariableSizeSentinel;
        bNumberFound = true;
    } else {
        Boolean bFirstChar = true;
        while(begin < _end) {
            Utf8Char oneChar = *begin;
            if ((oneChar >= '0' && oneChar <= '9')) {
                begin++;
                value = (oneChar - '0') + (value * 10);
                bNumberFound = true;
            } else if ( bFirstChar && ((oneChar == '-') || (oneChar == '+')) ) {
                begin++;
                if (oneChar == '-') {
                    sign = -1;
                }
            } else {
                break; //No more number characters
            }
            bFirstChar = false;
        }
    }
    
    if (bNumberFound) {
        _begin = begin;
    }
    if (pValue) {
        *pValue = value * sign;
    }
    
    return bNumberFound;
}
//------------------------------------------------------------
Boolean SubString::ParseDouble(Double *pValue)
{
    // TODO not so pleased with the standard functions for parsing  numbers
    // many are not thread safe, none seem to be bound on how many characters they will read
    //
    Double value;
    TempStackCString tempCStr(this);
    const char* current = tempCStr.BeginCStr();
    char* end = null;
    
    value = strtod(current, (char**)&end);
    Boolean bParsed = current != end;
    _begin += end - current;
    
#if (kVireoOS_win32U || kVireoOS_win64U )
    if (!bParsed) {
        Int32 length = Length();
        if (length >= 3 && strncmp("inf", (const char*)_begin, 3) == 0) {
            value = std::numeric_limits<double>::infinity();
            bParsed = true;
            _begin += 3;
        } else if (length >= 3 && strncmp("nan", (const char*)_begin, 3) == 0) {
            value = std::numeric_limits<double>::quiet_NaN();
            bParsed = true;
            _begin += 3;
        } else if (length >= 4 && strncmp("-inf", (const char*)_begin, 4) == 0) {
            value = -std::numeric_limits<double>::infinity();
            bParsed = true;
            _begin += 4;
        }
    }
#endif

    if (!bParsed) {
        value = 0.0;
    }
    if (pValue) {
        *pValue = value;
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
Int32 SubString::CountMatches(char value)
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
void SubString::EatLeadingSpaces()
{
    // Eat white spaces and EOL chars.
    // If a '//' comment is found skip to an EOL char or end of string
    // If at '/*' Comment is found skip till closing or end of string
    
    while (_begin < _end)
    {
        if (IsSpaceChar(*_begin)) {
            _begin++;
            continue;
        } else if ( *_begin == '/') {
            if ((_begin+1) < _end && _begin[1] == '/') {
                //    A '//' comment
                // comment until EOL
                _begin += 2;
                while ((_begin < _end) && !IsEolChar(*_begin)) {
                    _begin++;
                }
                // Once any EOL character is found the loop goes
                // back to white space skipping.
            } else if ((_begin+1) < _end && _begin[1]=='*') {
                //    A '/*' comment
                _begin += 2;
                while ((_begin+1 < _end) && !(_begin[0]=='*' && _begin[1] =='/')) {
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
void SubString::EatOptionalComma()
{
    EatLeadingSpaces();
    if ((_begin < _end) && (*_begin == ',')) {
        _begin++;
    }
}
//------------------------------------------------------------
void SubString::TrimQuotedString()
{
    if (Length() >= 3 && *_begin == '@' ) {
        _begin  += 2;
        _end    -= 1;
    } else if (Length() >=2) {
        _begin  += 1;
        _end    -= 1;
    }
}
//------------------------------------------------------------
IntIndex SubString::FindFirstMatch(SubString* searchString, IntIndex offset, Boolean ignoreCase)
{
    IntIndex length = Length();
    IntIndex searchStringLength = searchString->Length();

    for (; offset + searchStringLength <= length; offset++) {
        if (searchString->Compare(_begin + offset, searchStringLength, ignoreCase))
            return offset;
    }

    return -1;
}
//------------------------------------------------------------
#if 0
Utf16Char ToUpperInvariant(Utf16Char c)
{
#ifdef VIREO_UNICODE_BASIC_MULTILINGUAL_PLANE
    if (c <= 0x24e9)
    {
        return ToUpperDataLow[c];
    }
    if (c >= 0xff21)
    {
        return ToUpperDataHigh[c - 0xff21];
    }
#endif
    return c;
}

Utf16Char ToUpper(Utf8Char* c)
{
    // Quick ASCII range check
    if (c < 0x60)
        return c;
    else if ('a' <= c && c <= 'z')
        return  (c - 0x20);
    
    switch (c)
    {
        case L'\u01c5': // LATIN CAPITAL LETTER D WITH SMALL LETTER Z WITH CARON
            return L'\u01c4';
        case L'\u01c8': // LATIN CAPITAL LETTER L WITH SMALL LETTER J
            return L'\u01c7';
        case L'\u01cb': // LATIN CAPITAL LETTER N WITH SMALL LETTER J
            return L'\u01ca';
        case L'\u01f2': // LATIN CAPITAL LETTER D WITH SMALL LETTER Z
            return L'\u01f1';
        case L'\u0390': // GREEK SMALL LETTER IOTA WITH DIALYTIKA AND TONOS
            return L'\u03aa'; // it is not in ICU
        case L'\u03b0': // GREEK SMALL LETTER UPSILON WITH DIALYTIKA AND TONOS
            return L'\u03ab'; // it is not in ICU
        case L'\u03d0': // GREEK BETA
            return L'\u0392';
        case L'\u03d1': // GREEK THETA
            return L'\u0398';
        case L'\u03d5': // GREEK PHI
            return L'\u03a6';
        case L'\u03d6': // GREEK PI
            return L'\u03a0';
        case L'\u03f0': // GREEK KAPPA
            return L'\u039a';
        case L'\u03f1': // GREEK RHO
            return L'\u03a1';
    }
    return ToUpperInvariant(c);
}

Utf16Char ToLowerInvariant(Utf16Char c)
{
#ifdef VIREO_UNICODE_BASIC_MULTILINGUAL_PLANE
    if (c <= 0x24cf)
    {
        return ToLowerDataLow[c];
    }
    if (c >= 0xff21)
    {
        return ToLowerDataHigh[c - 0xff21];
    }
#else
#endif
    return c;
}

Utf16Char ToLower(Utf16Char c)
{
    // Quick ASCII range check
    if (c < 0x40 || (0x60 < c && c < 128))
        return c;
    else if ('A' <= c && c <= 'Z')
        return (c + 0x20);
    
    switch (c)
    {
        case L'\u01c5': // LATIN CAPITAL LETTER D WITH SMALL LETTER Z WITH CARON
            return L'\u01c6';
        case L'\u01c8': // LATIN CAPITAL LETTER L WITH SMALL LETTER J
            return L'\u01c9';
        case L'\u01cb': // LATIN CAPITAL LETTER N WITH SMALL LETTER J
            return L'\u01cc';
        case L'\u01f2': // LATIN CAPITAL LETTER D WITH SMALL LETTER Z
            return L'\u01f3';
        case L'\u03d2':  // ? it is not in ICU
            return L'\u03c5';
        case L'\u03d3':  // ? it is not in ICU
            return L'\u03cd';
        case L'\u03d4':  // ? it is not in ICU
            return L'\u03cb';
    }
    return ToLowerInvariant(c);
}
void Utf16toAscii (Int32 count, Utf16Char* stringIn, char* stringOut)
{
    Utf16Char* stringEnd = stringIn + count;
    
    while (stringIn < stringEnd)
    {
        Utf16Char utf16Char = *stringIn++;
        *stringOut++ = (utf16Char > 127) ? '*' : utf16Char & 0xff;
    }
}

void AsciiToUtf16 (Int32 count, const char* stringIn, Utf16Char* stringOut)
{
    const char* stringEnd = stringIn + count;
    
    while (stringIn < stringEnd)
    {
        *stringOut++ = (AsciiChar) *stringIn++;   // TODO simple expansion of lower 127 ascii
    }
}
#endif

} // namespace Vireo

