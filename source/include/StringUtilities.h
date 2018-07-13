/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief  Tools for working with stings. Namely a SubString class that can wrap data where it is.
 */

#ifndef StringUtilities_h
#define StringUtilities_h

#include <string.h>

#include "DataTypes.h"

namespace Vireo {

//------------------------------------------------------------
enum TokenTraits
{
    // in/out traits used to define what is being looked for and what was found
    TokenTraits_Unrecognized = 0,
    TokenTraits_Boolean,         // true, false
    TokenTraits_Integer,         // 123
    TokenTraits_IEEE754,         // 123.0
    TokenTraits_String,          // 'abc', "abc"
    TokenTraits_VerbatimString,  // @'abc', @"abc"
    TokenTraits_Punctuation,     // ,  (Many 'punctuation' are reserved: * @ $ _)
    TokenTraits_SymbolName,      // a123
    TokenTraits_WildCard,        // *
    TokenTraits_Nesting,         // ( ) [ ] { }
    TokenTraits_NestedExpression,    // ( )
    TokenTraits_TemplateExpression,  // < >
};

//------------------------------------------------------------
// The VIA grammar considers many special characters
// such as '.'and '*'to be identifier characters

enum AsciiCharTraitsEnum {
    kACT_Id          = 0x01,    // Valid part of an identifier
    kACT_Punctuation = 0x02,
    kACT_Letter      = 0x04,    // A-Z, a-z, utf8 to be added
    kACT_Space       = 0x08,
    kACT_Decimal     = 0x10,
    kACT_Oct         = 0x20,
    kACT_Hex         = 0x40,
    kACT_Nesting     = 0x80,
};

const UInt8 AsciiCharTraits[] =
{
    /* 00   */  0,
    /* 01   */  0,
    /* 02   */  0,
    /* 03   */  0,
    /* 04   */  0,
    /* 05   */  0,
    /* 06   */  0,
    /* 07   */  0,
    /* 08   */  0,
    /* 09 ht*/  kACT_Space,
    /* 0A lf*/  kACT_Space,
    /* 0B vt*/  kACT_Space,
    /* 0C ff*/  kACT_Space,
    /* 0D cr*/  kACT_Space,
    /* 0E   */  0,
    /* 0F   */  0,
    /* 10   */  0,      // 16
    /* 11   */  0,
    /* 12   */  0,
    /* 13   */  0,
    /* 14   */  0,
    /* 15   */  0,
    /* 16   */  0,
    /* 17   */  0,
    /* 18   */  0,
    /* 19   */  0,
    /* 1A   */  0,
    /* 1B   */  0,
    /* 1C   */  0,
    /* 1D   */  0,
    /* 1E   */  0,
    /* 1F   */  0,
    /* 20    */   kACT_Space,   // 32
    /* 21 !  */   kACT_Punctuation,
    /* 22 "  */   0,
    /* 23 #  */   kACT_Punctuation,
    /* 24 $  */   kACT_Id,
    /* 25 %  */   kACT_Id,
    /* 26 &  */   kACT_Punctuation,
    /* 27 '  */   0,
    /* 28 (  */   kACT_Punctuation | kACT_Nesting,
    /* 29 )  */   kACT_Punctuation | kACT_Nesting,
    /* 2A *  */   kACT_Id,
    /* 2B +  */   kACT_Id,
    /* 2C ,  */   kACT_Punctuation,
    /* 2D -  */   kACT_Id,
    /* 2E .  */   kACT_Id,
    /* 2F /  */   kACT_Punctuation,
    /* 30 0  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,      // 48
    /* 31 1  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 32 2  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 33 3  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 34 4  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 35 5  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 36 6  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 37 7  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 38 8  */   kACT_Id | kACT_Decimal | kACT_Hex,
    /* 39 9  */   kACT_Id | kACT_Decimal | kACT_Hex,
    /* 3A :  */   kACT_Punctuation,
    /* 3B ;  */   0,
    /* 3C <  */   kACT_Punctuation | kACT_Nesting,
    /* 3D =  */   0,
    /* 3E >  */   kACT_Punctuation | kACT_Nesting,
    /* 3F ?  */   0,
    /* 40 @  */   0,      // 64
    /* 41 A  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 42 B  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 43 C  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 44 D  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 45 E  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 46 F  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 47 G  */   kACT_Id | kACT_Letter,
    /* 48 H  */   kACT_Id | kACT_Letter,
    /* 49 I  */   kACT_Id | kACT_Letter,
    /* 4A J  */   kACT_Id | kACT_Letter,
    /* 4B L  */   kACT_Id | kACT_Letter,
    /* 4C L  */   kACT_Id | kACT_Letter,
    /* 4D M  */   kACT_Id | kACT_Letter,
    /* 4E N  */   kACT_Id | kACT_Letter,
    /* 4F O  */   kACT_Id | kACT_Letter,
    /* 50 P  */   kACT_Id | kACT_Letter,      // 80
    /* 51 Q  */   kACT_Id | kACT_Letter,
    /* 52 R  */   kACT_Id | kACT_Letter,
    /* 53 S  */   kACT_Id | kACT_Letter,
    /* 54 T  */   kACT_Id | kACT_Letter,
    /* 55 U  */   kACT_Id | kACT_Letter,
    /* 56 V  */   kACT_Id | kACT_Letter,
    /* 57 W  */   kACT_Id | kACT_Letter,
    /* 58 X  */   kACT_Id | kACT_Letter,
    /* 59 Y  */   kACT_Id | kACT_Letter,
    /* 5A Z  */   kACT_Id | kACT_Letter,
    /* 5B [  */   kACT_Punctuation | kACT_Nesting,
    /* 5C \  */   kACT_Punctuation,
    /* 5D ]  */   kACT_Punctuation | kACT_Nesting,
    /* 5E ^  */   kACT_Id,
    /* 5F _  */   kACT_Id,
    /* 60 `  */   0,      // 96
    /* 61 a  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 62 b  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 63 c  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 64 d  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 65 e  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 66 f  */   kACT_Id | kACT_Letter | kACT_Hex,
    /* 67 g  */   kACT_Id | kACT_Letter,
    /* 68 h  */   kACT_Id | kACT_Letter,
    /* 69 i  */   kACT_Id | kACT_Letter,
    /* 6A j  */   kACT_Id | kACT_Letter,
    /* 6B k  */   kACT_Id | kACT_Letter,
    /* 6C l  */   kACT_Id | kACT_Letter,
    /* 6D m  */   kACT_Id | kACT_Letter,
    /* 6E n  */   kACT_Id | kACT_Letter,
    /* 6F o  */   kACT_Id | kACT_Letter,
    /* 70 p  */   kACT_Id | kACT_Letter,     //  112
    /* 71 q  */   kACT_Id | kACT_Letter,
    /* 72 r  */   kACT_Id | kACT_Letter,
    /* 73 s  */   kACT_Id | kACT_Letter,
    /* 74 t  */   kACT_Id | kACT_Letter,
    /* 75 u  */   kACT_Id | kACT_Letter,
    /* 76 v  */   kACT_Id | kACT_Letter,
    /* 77 w  */   kACT_Id | kACT_Letter,
    /* 78 x  */   kACT_Id | kACT_Letter,
    /* 79 y  */   kACT_Id | kACT_Letter,
    /* 7A z  */   kACT_Id | kACT_Letter,
    /* 7B {  */   kACT_Punctuation | kACT_Nesting,
    /* 7C |  */   kACT_Punctuation,
    /* 7D }  */   kACT_Punctuation | kACT_Nesting,
    /* 7E ~  */   kACT_Punctuation,
    /* 7F del*/   0,
};

//------------------------------------------------------------
//! JSON style separator between field name and value.
#define tsNameSuffix    ":"
#define tsEqualSuffix   "="
//! Prefix for meta identifiers used for template parameters.
#define tsMetaIdPrefix  "$"

//------------------------------------------------------------
//! The core class for working with strings. The SubString never owns the data it points to.
class SubString : public SubVector<Utf8Char>
{
 public:
    static Boolean IsAscii(Utf8Char c)      { return !(c & 0x10); }
    static Boolean IsEolChar(Utf8Char c)    { return (c == '\r') || (c == '\n'); }
    static Boolean IsSpaceChar(Utf8Char c)  {
        return (((UInt8)c <= 127) && (AsciiCharTraits[(UInt8)c] & kACT_Space));
    }
    static Boolean IsNumberChar(Utf8Char c) {
        return (((UInt8)c <= 127) && (AsciiCharTraits[(UInt8)c] & kACT_Decimal));
    }
    static Boolean IsHexChar(Utf8Char c)    {
        return (((UInt8)c <= 127) && (AsciiCharTraits[(UInt8)c] & kACT_Hex));
    }
    static Boolean IsIdentifierChar(Utf8Char c) {
        return (((UInt8)c <= 127) && (AsciiCharTraits[(UInt8)c] & kACT_Id)) || (c & 0x80);
    }
    static Boolean IsPunctuationChar(Utf8Char c) {
        return  ((UInt8)c <= 127) && (AsciiCharTraits[(UInt8)c] & kACT_Punctuation);
    }
    static Boolean IsLetterChar(Utf8Char c) {
        return ((UInt8)c <= 127) && (AsciiCharTraits[(UInt8)c] & kACT_Letter);
    }
    static Int32   CharLength(const Utf8Char* begin);
    static Int32   DigitValue(Utf32Char codepoint, Int32 base);

 public:
    SubString()                          { }
    explicit SubString(ConstCStr begin)   {
        AliasAssign((const Utf8Char*)begin, (const Utf8Char*)(begin ? (begin + strlen(begin)) : begin));
    }
    SubString(const Utf8Char* begin, const Utf8Char* end) { AliasAssign(begin, end); }
    explicit SubString(SubString* original)  { AliasAssign(original->Begin(), original->End()); }
    void AliasAssignCStrLen(ConstCStr begin, IntIndex n) {
        AliasAssign((const Utf8Char*)begin, (const Utf8Char*)(begin ? (begin + n) : begin));
    }
    void AliasAssignCStr(ConstCStr begin) { AliasAssignCStrLen(begin, IntIndex(strlen(begin))); }
    void AliasAssignLen(const Utf8Char *begin, IntIndex len) { AliasAssign(begin, begin + len); }

    //! Skip all tokens and comments up to the next eol sequence
    void EatToEol();

    //! Skip the next char if it matches the single character token specified
    Boolean EatChar(char token);

    //! Skip the next sequence of chars that match a specific trait (e.g. hexadecimal)
    Int32 EatCharsByTrait(UInt8 trait);

    //! Skip white space and comments
    void EatLeadingSpaces();

    //! Skip white space only
    void EatWhiteSpaces();

    //! Skip logical characters accounting for UTF-8 multibyte sequences
    void EatRawChars(Int32 count);

    //! Creat two sub strings base on the first occurrence of a separator
    Boolean SplitString(SubString* beforeMatch, SubString* afterMatch, char separator) const;

    //! Compare the SubString with a reference string.
    Boolean Compare(const SubString* str)  const { return Compare(str->Begin(), str->Length()); }
    Boolean Compare(const Utf8Char* begin, IntIndex length) const;
    Boolean Compare(const Utf8Char* begin, IntIndex length, Boolean ignoreCase) const;
    Boolean CompareCStr(ConstCStr begin) const;
    Boolean ComparePrefix(const Utf8Char* begin, Int32 length) const;
    Boolean ComparePrefixIgnoreCase(const Utf8Char* begin, Int32 length) const;
    Boolean ComparePrefix(char asciiChar) const { return (_begin != _end) && (*_begin == asciiChar); }
    Boolean ComparePrefixCStr(ConstCStr begin) const {
        return ComparePrefix((const Utf8Char*)begin, (IntIndex)strlen((ConstCStr)begin));
    }
    Boolean ComparePrefixCStrIgnoreCase(ConstCStr begin) const {
        return ComparePrefixIgnoreCase((const Utf8Char*)begin, (IntIndex)strlen((ConstCStr)begin));
    }

    //! Compare with the encoded string
    Boolean CompareViaEncodedString(SubString* str);

    //! Functions to work with backslash '\' escapes in strings
    Int32 ReadEscapeToken(SubString* token);
    Boolean ReadRawChar(Utf8Char* token);
    Boolean PeekRawChar(Utf8Char* token, IntIndex pos = 0);
    Int32 LengthAfterProcessingEscapes();
    void ProcessEscapes(Utf8Char* begin, Utf8Char* end);

    //! Process the escape characters in the substring ('\t','\n', etc.) to ('\\t', '\\n', etc.)
    IntIndex UnEscape(Utf8Char* begin, IntIndex length);

    //! Read the next UTF-8 sequence and decode it into a regular UTF-32 code point.
    Boolean ReadUtf32(Utf32Char* value);

    //! Read the next set of code points that make up a single grapheme.
    Boolean ReadGraphemeCluster(SubString* token);

    //! Read a line from the UTF-8 sequence
    Boolean ReadLine(SubString* line);

    //! Read the next sequence of digits and parse them as an integer.
    Boolean ReadInt(IntMax* value, Boolean *overflow = nullptr);

    //! Read the next sequence of digits and parse them as an IntDim. Like Int but adds '*' and '$n'
    Boolean ReadIntDim(IntIndex* value);

    //! Read the next sequence of digits and parse them as a Double.
    Boolean ParseDouble(Double* value, Boolean suppressInfNaN = false, Int32 *errCodePtr = nullptr);

    //! Read a simple token name, value, punctuation, etc.
    TokenTraits ReadToken(SubString* token, Boolean suppressInfNaN = false);

    //! Read 2 digit hex value
    Boolean ReadHex2(Int32* value);

    //! Read a 64-bit integer in given base
    Boolean ReadIntWithBase(Int64 *value, Int32 base);

    //! Read a simple name (like a field name in a JSON object)
    Boolean ReadNameToken(SubString* token);

    //! Read a token or parenthesized expression of arbitrary depth.
    TokenTraits ReadSubexpressionToken(SubString* token);

    //! Peek at the next token and classify it.
    TokenTraits ClassifyNextToken() const;

    //! Count occurrences of a specified Ascii character.
    Int32 CountMatches(char value);

    //! Length of the string in logical UTF-8 encoded code points.
    Int32 StringLength();

    //! Remove quotes (single or double) from the ends of a string
    //! based on previously determined token trait.
    void TrimQuotedString(TokenTraits tt);

    IntIndex FindFirstMatch(const SubString* searchString, IntIndex offset, Boolean ignoreCase);
};

//------------------------------------------------------------
//! Macro to help with %.* formats. Example => printf("%.*s", FMT_LEN_BEGIN(arg))
#define FMT_LEN_BEGIN(_substring_)   (int)(_substring_)->Length(), (_substring_)->Begin()

//------------------------------------------------------------
//! A comparing class used with the std:map<> class
class CompareSubString
{
 public:
    Boolean operator()(const SubString &a, const SubString &b) const {
        Int32 aSize = a.Length();
        Int32 bSize = b.Length();
        if (aSize != bSize) {
            return aSize < bSize;
        } else {
            const Utf8Char* ba = a.Begin();
            const Utf8Char* bb = b.Begin();
            const Utf8Char* ea = a.End();

            while (ba < ea) {
                if (*ba !=  *bb) {
                    return *ba < *bb;
                } else {
                    ba++;
                    bb++;
                }
            }
            return false;
        }
    }
};

//------------------------------------------------------------
//! A class for making temporary nullptr terminated strings for calling OS APIs
#define kTempCStringLength 255

class TempStackCString : public FixedCArray<Utf8Char, kTempCStringLength>
{
 public:
    //! Construct a empty string.
    TempStackCString() { }

    //! Construct a nullptr terminated from an existing SubString.
    explicit TempStackCString(SubString* str) : FixedCArray(str) { }

    //! Construct a nullptr terminated from rwa block of UTF-8 characters.
    TempStackCString(Utf8Char* begin, Int32 length) : FixedCArray((Utf8Char*)begin, length) { }

    //! Append a SubString.
    Boolean Append(SubString* str) {
        return FixedCArray::Append(str->Begin(), (size_t)str->Length());
    }

    //! Append a nullptr terminated String.
    Boolean AppendCStr(ConstCStr cstr) { return FixedCArray::Append((Utf8Char*)cstr, (IntIndex)strlen(cstr)); }

    //! Get the standard char* pointer to the nullptr terminated string.
    //! The pointer is only valid during the scope of the TempStackCString instance
    char* BeginCStr() {
        return (char*) _buffer;
    }
};

//------------------------------------------------------------
// Helper abstract class for storing a temporary copy a SubString to later be converted
// to another format or encoding.
class PercentCodecSubString {
 public:
    PercentCodecSubString() : _convertedStr(nullptr) { }
    explicit PercentCodecSubString(const SubString &s, bool convert = true, bool alwaysAlloc = false);

    void Init(const SubString &s, bool convert, bool alwaysAlloc = false);

    SubString GetSubString() {
        SubString s;
        s.AliasAssignLen(_convertedStr, IntIndex(strlen(ConstCStr(_convertedStr))));
        return s;
    }

    Utf8Char *DetachValue() {
        if (_convertedStr != _buffer) {
            Utf8Char *ret = _convertedStr;
            _convertedStr = nullptr;
            return ret;
        }
        return nullptr;
    }

    ~PercentCodecSubString() {
        if (_convertedStr && _convertedStr != _buffer)
            delete[] _convertedStr;
    }

 protected:
    Utf8Char *_convertedStr;

 private:
    enum { kMaxInlineDecodedSize = 1024 };
    Utf8Char _buffer[kMaxInlineDecodedSize];

 private:
    virtual Int32 ComputeConvertedLength(const SubString &s) { return s.Length(); }
    virtual void Convert(const SubString &s)                 { }
};

//------------------------------------------------------------
//! A class for making temporary %-code decoded SubStrings
// Examples:
// "MyVI%2egvi" => "MyVI.gvi"
// "_%54estVI_ToLowercase%2Egvi" => "_TestVI_ToLowercase.gvi"
class PercentDecodedSubString : public PercentCodecSubString {
 public:
    PercentDecodedSubString() : PercentCodecSubString() { }
    explicit PercentDecodedSubString(const SubString &encodedSubstring, bool decode = true, bool alwaysAlloc = false)
        : PercentCodecSubString(encodedSubstring, decode, alwaysAlloc) {
        Init(encodedSubstring, decode, alwaysAlloc);
    }

 private:
    Int32 ComputeConvertedLength(const SubString &s) {
        return GetDecodedLength(s);
    }
    void Convert(const SubString &s) {
        Decode(s);
    }
    Int32 GetDecodedLength(const SubString &s);
    void Decode(const SubString &s);
};

//------------------------------------------------------------
//! A class for making temporary %-code encoded SubStrings
// Examples:
// ":WebVi:" => "%2EWebVi%2E"
// "The answer is 42" => "The%20answer%20is%2042"
// "2018" => "%32018"
class PercentEncodedSubString : public PercentCodecSubString {
 public:
    PercentEncodedSubString() : PercentCodecSubString() { }
    explicit PercentEncodedSubString(const SubString &decodedSubstring, bool encode = true, bool alwaysAlloc = false) :
        PercentCodecSubString(decodedSubstring, encode, alwaysAlloc) {
        Init(decodedSubstring, encode, alwaysAlloc);
    }

    Boolean NeedsEncoding(Utf8Char c);
    void PercentEncodeUtf8Char(Utf8Char c, Utf8Char **pDest);

 private:
     Boolean IsReservedChar(Utf8Char c);
     Int32 ComputeConvertedLength(const SubString &s) {
         return GetEncodedLength(s);
     }
     void Convert(const SubString &s) {
         Encode(s);
     }
     Int32 GetEncodedLength(const SubString &s);
     void Encode(const SubString &s);
};

}  // namespace Vireo

#endif  // StringUtilities_h
