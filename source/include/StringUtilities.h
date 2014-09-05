/**
 
Copyright (c) 2014 National Instruments Corp.
 
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
    TokenTraits_UnRecognized = 0,
    TokenTraits_SingleQuotedString = 1, //  'abc'
    TokenTraits_DoubleQuotedString = 2, //  "ABC"
    TokenTraits_EscapeSequences = 2048, //  "abc\""  escape sequence is not decoded,
    TokenTraits_AlphaNum = 4,           //  a123
    TokenTraits_Integer = 8,            //  123
    TokenTraits_Negative = 16,          //  -123
    TokenTraits_RealNumber = 32,        //  1.23    also allow for scientific, inf, nan
    TokenTraits_EmbeddedDots = 64,      //  a.b.c.d  returned as one token
    TokenTraits_WildCard = 128,         //  *
    TokenTraits_Parens = 256,           //  ()    typically added to others to allow expressions
    TokenTraits_Boolean = 512,          //  t or f
    TokenTraits_Comma = 1024,
    
    TokenTraits_Any  = 0xFF, // TODO add all the fields above
};

//------------------------------------------------------------
// The VIA grammar considers many specail characters
// such as '.'and '*'to be identifier characters

enum AsciiCharTraitsEnum {
    kACT_Id          = 0x01,    // Valid part of an identier
    kACT_Symbol      = 0x02,
    kACT_Number      = 0x04,    // 0-9
    kACT_Letter      = 0x08,    // A-Z, a-z, utf8 to be added
    kACT_Space       = 0x10,
    kACT_Eol         = 0x20,
};

const UInt8 AsciiCharTraits[] =
{
    0,      //0
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    /* 09 ht*/  kACT_Space,
    /* 0A lf*/  kACT_Space | kACT_Eol,
    /* 0B vt*/  kACT_Space,
    /* 0C ff*/  kACT_Space,
    /* 0D cr*/  kACT_Space | kACT_Eol,
    0,
    0,
    0,      //16
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    /* 20    */   kACT_Space,   //32
    /* 21 !  */   kACT_Symbol,
    /* 22 "  */   0,
    /* 23 #  */   kACT_Symbol,
    /* 24 $  */   kACT_Symbol,
    /* 25 %  */   kACT_Id,
    /* 26 &  */   kACT_Symbol,
    /* 27 '  */   0,
    /* 28 (  */   kACT_Symbol,
    /* 29 )  */   kACT_Symbol,
    /* 2A *  */   kACT_Id,
    /* 2B +  */   kACT_Id,
    /* 2C ,  */   kACT_Symbol,
    /* 2D -  */   kACT_Id,
    /* 2E .  */   kACT_Id,
    /* 2F /  */   kACT_Symbol,
    /* 30 0  */   kACT_Id | kACT_Number,      //48
    /* 31 1  */   kACT_Id | kACT_Number,
    /* 32 2  */   kACT_Id | kACT_Number,
    /* 33 3  */   kACT_Id | kACT_Number,
    /* 34 4  */   kACT_Id | kACT_Number,
    /* 35 5  */   kACT_Id | kACT_Number,
    /* 36 6  */   kACT_Id | kACT_Number,
    /* 37 7  */   kACT_Id | kACT_Number,
    /* 38 8  */   kACT_Id | kACT_Number,
    /* 39 9  */   kACT_Id | kACT_Number,
    /* 3A :  */   0,
    /* 3B ;  */   0,
    /* 3C <  */   0,
    /* 3D =  */   0,
    /* 3E >  */   0,
    /* 3F ?  */   0,
    /* 40 @  */   0,      //64
    /* 41 A  */   kACT_Id | kACT_Letter,
    /* 42 B  */   kACT_Id | kACT_Letter,
    /* 43 C  */   kACT_Id | kACT_Letter,
    /* 44 D  */   kACT_Id | kACT_Letter,
    /* 45 E  */   kACT_Id | kACT_Letter,
    /* 46 F  */   kACT_Id | kACT_Letter,
    /* 47 G  */   kACT_Id | kACT_Letter,
    /* 48 H  */   kACT_Id | kACT_Letter,
    /* 49 I  */   kACT_Id | kACT_Letter,
    /* 4A J  */   kACT_Id | kACT_Letter,
    /* 4B L  */   kACT_Id | kACT_Letter,
    /* 4C L  */   kACT_Id | kACT_Letter,
    /* 4D M  */   kACT_Id | kACT_Letter,
    /* 4E N  */   kACT_Id | kACT_Letter,
    /* 4F O  */   kACT_Id | kACT_Letter,
    /* 50 P  */   kACT_Id | kACT_Letter,      //80
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
    /* 5B [  */   kACT_Symbol,
    /* 5C \  */   kACT_Symbol,
    /* 5D ]  */   kACT_Symbol,
    /* 5E ^  */   kACT_Symbol,
    /* 5F _  */   kACT_Id,
    /* 60 `  */   0,      //96
    /* 61 a  */   kACT_Id | kACT_Letter,
    /* 62 b  */   kACT_Id | kACT_Letter,
    /* 63 c  */   kACT_Id | kACT_Letter,
    /* 64 d  */   kACT_Id | kACT_Letter,
    /* 65 e  */   kACT_Id | kACT_Letter,
    /* 66 f  */   kACT_Id | kACT_Letter,
    /* 67 g  */   kACT_Id | kACT_Letter,
    /* 68 h  */   kACT_Id | kACT_Letter,
    /* 69 i  */   kACT_Id | kACT_Letter,
    /* 6A j  */   kACT_Id | kACT_Letter,
    /* 6B k  */   kACT_Id | kACT_Letter,
    /* 6C l  */   kACT_Id | kACT_Letter,
    /* 6D m  */   kACT_Id | kACT_Letter,
    /* 6E n  */   kACT_Id | kACT_Letter,
    /* 6F o  */   kACT_Id | kACT_Letter,
    /* 70 p  */   kACT_Id | kACT_Letter,
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
    /* 7B {  */   kACT_Symbol,
    /* 7C |  */   kACT_Symbol,
    /* 7D }  */   kACT_Symbol,
    /* 7E ~  */   kACT_Symbol,
    /* 7F del*/   0,
};
    
//------------------------------------------------------------
//! The core class for working with strings. The SubString never owns the data it points to.
class SubString : public SimpleSubVector<Utf8Char>
{
public:
    static Boolean IsAscii(char c)      { return !(c & 0x10); }
    static Boolean IsEolChar(char c)    { return (c == '\r') || (c == '\n'); }
    static Boolean IsSpaceChar(char c)  { return ((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Space); }
    static Boolean IsNumberChar(char c) { return (AsciiCharTraits[(UInt8)c] & kACT_Number); }
    static Boolean IsLetterChar(char c) { return (AsciiCharTraits[(UInt8)c] & kACT_Letter); }
    static Boolean IsIdentifierChar(char c) { return ((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Id); }
    static Boolean IsSymbolChar(char c) { return  ((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Symbol); }

public:
    SubString()                         {}
    SubString(const char * begin)       { AliasAssign((const Utf8Char*)begin, (const Utf8Char*)(begin ? (begin + strlen(begin)) : begin)); }
    SubString(const Utf8Char * begin, const Utf8Char *end) { AliasAssign(begin, end); }
    SubString(SubString* original)      { AliasAssign(original->Begin(), original->End()); }
    void AliasAssignCStr(const char* begin) { AliasAssign((const Utf8Char*)begin, (const Utf8Char*)(begin + strlen(begin))); }
    
    void EatToEol();
    void EatLeadingSpaces();
    void EatOptionalComma();
    Int32 ReadEscapeToken(SubString* token);
    bool SplitString(SubString* beforeMatch, SubString* afterMatch, char separator) const;
    
    Int32 LengthAferProcessingEscapes();
    void ProcessEscapes(char* begin, char* end);
    
    Boolean Compare(const SubString *string)  const { return Compare(string->Begin(), string->Length()); }
    Boolean Compare(const Utf8Char* begin, IntIndex length) const;
    Boolean Compare(const Utf8Char* begin, IntIndex length, Boolean ignoreCase) const;
    Boolean CompareCStr(const char* begin) const;
    Boolean ComparePrefix(const Utf8Char* begin, Int32 length) const ;
    Boolean ComparePrefixCStr(const char* begin) const { return ComparePrefix ((const Utf8Char*)begin, (IntIndex)strlen((const char*)begin)); }
    Boolean ReadRawChar(char* token);
    Boolean ReadChar(char token);
    Boolean ReadChar(const char* token) { return ReadChar(token[0]);};  // TODO deprecate, one used one place and that place is deprecated
    Boolean ReadInt(IntMax* value);
    Boolean ParseDouble(Double* value);
    Boolean ReadToken(SubString* token);
    Boolean ReadSubexpressionToken(SubString* token);
    Boolean IdentifierIsNext() const;

    Int32 CountMatches(char value);
    void TrimQuotedString();
    TokenTraits ReadValueToken(SubString* token, TokenTraits allowedTraits);
    IntIndex FindFirstMatch(SubString* searchString, IntIndex offset, Boolean ignoreCase);
};

//! Macro to help with %.* formats. Example => printf("%.*s", FMT_LEN_BEGIN(arg))
#define FMT_LEN_BEGIN(_substring_)   (int)(_substring_)->Length(), (_substring_)->Begin()

//------------------------------------------------------------
//! A comparing class used with the std:map<> class
class ComapreSubString
{
    public:
    bool operator()(const SubString &a, const SubString &b) const
    {
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
//! Make a null terminated copy of a SubString. Used for calling OS APIs
class TempStackCString
{
    enum { MaxLength = 255 };
private:
    Utf8Char    _buffer[MaxLength+1];
    Utf8Char*   _end;
public:
    
    TempStackCString(char* begin, Int32 length)
    {
        length = (length < MaxLength) ? length : MaxLength;
        _end = _buffer + length;
        memcpy(_buffer, begin, length);
        *_end = (Utf8Char) 0;
    }
    TempStackCString(SubString* string)
    {
        Int32 length = (string->Length() < MaxLength) ? string->Length() : MaxLength;
        _end = _buffer + length;
        memcpy(_buffer, string->Begin(), length);
        *_end = (Utf8Char) 0;
    }
    void Append(SubString* string)
    {
        Utf8Char* newEnd = _end + string->Length();
        if (newEnd > _buffer + MaxLength) {
            newEnd = _buffer + MaxLength;
        }
        size_t length = newEnd - _end;
        memcpy(_end, string->Begin(), length);
        _end = newEnd;
        *_end = (Utf8Char) 0;
    }
    
    char*       BeginCStr() { return (char*) _buffer; }
    Utf8Char*   End()       { return _end; }
};

} // namespace Vireo

#endif //StringUtilities_h
