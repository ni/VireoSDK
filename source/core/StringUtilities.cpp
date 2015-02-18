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
//! The core class for working with strings. The SubString never owns the data it points to.
Int32 SubString::CharLength(const Utf8Char* begin)
{
#if defined(VIREO_ASCII_ONLY)
    return begin + 1;
#else
    // For a UTF-8 reference
    // see:  http://tools.ietf.org/html/rfc3629
    
    Utf8Char leadByte = *begin;
    if (!leadByte & 0x80) {
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
Boolean SubString::CompareCStr(ConstCStr begin2) const
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
        // The forms of true and fasle are reserved key words.
        if (CompareCStr("true") || CompareCStr("false"))
            return false;
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
Boolean SubString::ReadGraphemeCluster(SubString* token, Int32* count)
{
	 const Utf8Char* next = _begin;
	 const Utf8Char* initialBegin = _begin;
	 Boolean characterEnd = false;
	 if (_begin >= _end) {
		 *count = -1;
		return false;
	 }
	 *count = 0;
	 Int32 rule = 0;
	 while (_begin < _end && !characterEnd) {
		 *count++;
		 next = _begin + CharLength(_begin);
		 if (next >= _end) {
			 characterEnd = true;
		 } else {
 			 // don't break the CR X LF 0x0D 0x0A
			 if (*_begin == 0x0D) {
				 if(*next == 0x0A) {
					 characterEnd = false;
					 rule = 3;
				 } else {
					 characterEnd = true;
					 rule = 4;
				 }
			 } else if(*_begin == 0x0A) {
				 rule = 4;
				 characterEnd = true;
			 } else if ( CharLength(next)== 1) {
				 rule = 10;
				 characterEnd = true;
		 	 } else {
		 		 Int32 firstByte = *next;
		 		 Int32 secondByte = *next + 1;
		 		 Int32 code = firstByte * 0x100 + secondByte;
		 		 // it only support cluster some extending LATIN character
		 		 if (code >= 0xCC80 && code <= 0xCDAF ){
		 			characterEnd = false;
			 		 rule = 9;
 		 		 } else {
		 			characterEnd = true;
		 		 }
		 	 }
		 }
		 _begin = next;
	 }
	 token->AliasAssign(initialBegin, _begin);
	 return characterEnd;
}
//------------------------------------------------------------
Boolean SubString::ReadUtf32(Utf32Char* value)
{
    Utf32Char uChar = 0;
#if defined(VIREO_ASCII_ONLY)
    if (_begin < _end) {
        uChar = *_begin++
        if (uChar & 0xFFFFFF80) {
            uChar = 0;
        }
    }
#else
    static Utf32Char LeadByteMasks[] = {0x0000007F, 0x0000001F, 0x0000000F, 0x00000007};
    
    if (_begin < _end) {
        Int32 continuationOctets = CharLength(_begin) - 1;
        Int32 octet = (*_begin++);

        if ((octet & 0xFFFFFF80) && (continuationOctets == 0)) {
            // Invalid lead octet (5 and 6 octet patterns are not supported.)
            uChar = 0;
        } else  {
            uChar = octet & LeadByteMasks[continuationOctets];
            while (continuationOctets--) {
                octet = (*_begin++);
                if ((octet & 0xFFFFFFC0) == 0x00000080) {
                    uChar = (uChar << 6) | (octet & 0x0000003F);
                } else {
                    // Invalid continuation octet
                    uChar = 0;
                    break;
                }
            }
        }
     }
#endif
    *value = uChar;
    return uChar != 0;
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
//! Read an expression that may be a single token or nested expression
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
//! Read an optional "Name:" prefix to a value.
Boolean SubString::ReadNameToken(SubString* token)
{
    EatLeadingSpaces();
    SubString tempString(this);

    if (tempString.ReadToken(token)) {
        tempString.EatLeadingSpaces();
        if (tempString.ReadChar(*tsNameSuffix)) {
            // Name was found, its removed from the front of 'this'
            // along with the colon
            _begin = tempString.Begin();
            return true;
        }
    }
    // Its not a name prefix, leave all as is
    token->AliasAssign(null, null);
    return false;
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
// ! Read an integer or one of the special symbolic numbers formats
Boolean SubString::ReadMetaInt(IntIndex *pValue)
{
    // Three formats are supported
    // 1. nnn  Simple integers negative or positive
    // 2. '*'  Which means roughtly variable or wild card
    // 3  $nn  Which also means variable but is identifies as a template parameter
    // Meta ints can only be used where the reasonable range of value does not
    // include extreme negative numbers.
    
    EatLeadingSpaces();
    if (_begin < _end) {
        if (*_begin == '*') {
            _begin++;
            *pValue = kArrayVariableLengthSentinel;
            return true;
        } else if (*_begin == '$') {
            IntMax templateIndex;
            SubString innerString(_begin+1, _end);
            if (innerString.ReadInt(&templateIndex) && templateIndex < kArrayMaxTemplatedDimLengths ) {
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
Boolean SubString::ReadInt(IntMax *pValue)
{
    IntMax value = 0;
    IntMax sign = 1;
    Boolean bNumberFound = false;
    
    EatLeadingSpaces();
    const Utf8Char* begin = _begin;
    
    Boolean bFirstChar = true;
    IntMax base = 10;
    if(ComparePrefixCStr("0x")) {
        begin += 2;
        base = 16;
    } else {
        base = 10;
    } // Any need for octal?
    
    while(begin < _end) {
        Utf8Char oneChar = *begin;
        Int32 cValue = -1;
        if (IsNumberChar(oneChar)) {
            cValue = (oneChar - '0');
        } else if ( bFirstChar && ((oneChar == '-') || (oneChar == '+')) ) {
            begin++;
            if (oneChar == '-') {
                sign = -1;
            }
        } else if (base == 16) {
            if (oneChar >= 'a' && oneChar <= 'f') {
                cValue = 10 + (oneChar - 'a');
            } else if (oneChar >= 'A' && oneChar <= 'F')  {
                cValue = 10 + (oneChar - 'A');
            } else {
                //No more hex number characters
                break;
            }
        } else {
            //No more number characters
            break;
        }
        if (cValue >= 0) {
            begin++;
            value = (value * base) + cValue;
            bNumberFound = true;
        }
        bFirstChar = false;
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
    ConstCStr current = tempCStr.BeginCStr();
    char* end = null;
    
    value = strtod(current, (char**)&end);
    Boolean bParsed = current != end;
    _begin += end - current;
    
#if (kVireoOS_win32U || kVireoOS_win64U )
    if (!bParsed) {
        Int32 length = Length();
        if (length >= 3 && strncmp("inf", (ConstCStr)_begin, 3) == 0) {
            value = std::numeric_limits<double>::infinity();
            bParsed = true;
            _begin += 3;
        } else if (length >= 3 && strncmp("nan", (ConstCStr)_begin, 3) == 0) {
            value = std::numeric_limits<double>::quiet_NaN();
            bParsed = true;
            _begin += 3;
        } else if (length >= 4 && strncmp("-inf", (ConstCStr)_begin, 4) == 0) {
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
//! The length of the string in logical characters, not bytes.
Int32 SubString::StringLength()
{
    const Utf8Char* pCharSequence  = _begin;
    const Utf8Char* pEnd = _end;

    // If the string contains invalid UTF-8 encodings the logical lenght
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
    IntIndex searchStringLength = searchString->Length();
    if (searchStringLength > Length())
        return -1;
   
    const Utf8Char* pStart = _begin;
    const Utf8Char* pEnd = _end - searchStringLength;    
    for (; pStart < pEnd; ) {
        if (searchString->Compare(pStart, searchStringLength, ignoreCase)) {
            return (IntIndex)(pStart - _begin);
        } else {
            pStart = pStart + CharLength(pStart);
        }
    }
    return -1;
}
#if 0
//------------------------------------------------------------
//! A tool for debugging UTF8 encodings
void PrintUTF8ArrayHex(const char* buffer, Int32 length)
{
    for (; length;) {
        Int32 x = SubString::NextChar((const Utf8Char*) buffer) - buffer;
        for(; x; x--) {
            printf("%02X",  (UInt8)(*buffer));
            buffer++;
            length--;
        }
        printf(" ");
    }
    printf("\n");
}
#endif
} // namespace Vireo

