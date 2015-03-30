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
    // in/out traits used to define what is being looked for and what was found
    TokenTraits_Unrecognized = 0,
    TokenTraits_Boolean,        // t, f, true, false
    TokenTraits_Integer,        // 123
    TokenTraits_IEEE754,        // 123.0
    TokenTraits_String,         // 'abc', "abc"
    TokenTraits_VerbatimString, // @'abc', @"abc"
    TokenTraits_AlphaNum,       // a123
    TokenTraits_WildCard,       // *
    TokenTraits_Parens,         // ()    typically added to others to allow expressions
};

//------------------------------------------------------------
// The VIA grammar considers many specail characters
// such as '.'and '*'to be identifier characters

enum AsciiCharTraitsEnum {
    kACT_Id          = 0x01,    // Valid part of an identier
    kACT_Symbol      = 0x02,
    kACT_Letter      = 0x04,    // A-Z, a-z, utf8 to be added
    kACT_Space       = 0x08,
    kACT_Decimal     = 0x10,
    kACT_Oct         = 0x20,
    kACT_Hex         = 0x40,
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
    /* 0A lf*/  kACT_Space,
    /* 0B vt*/  kACT_Space,
    /* 0C ff*/  kACT_Space,
    /* 0D cr*/  kACT_Space,
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
    /* 24 $  */   kACT_Id,
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
    /* 30 0  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,      //48
    /* 31 1  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 32 2  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 33 3  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 34 4  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 35 5  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 36 6  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 37 7  */   kACT_Id | kACT_Decimal | kACT_Hex | kACT_Oct,
    /* 38 8  */   kACT_Id | kACT_Decimal | kACT_Hex,
    /* 39 9  */   kACT_Id | kACT_Decimal | kACT_Hex,
    /* 3A :  */   0,
    /* 3B ;  */   0,
    /* 3C <  */   0,
    /* 3D =  */   0,
    /* 3E >  */   0,
    /* 3F ?  */   0,
    /* 40 @  */   0,      //64
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
class SubString : public SubVector<Utf8Char>
{
public:
    static Boolean IsAscii(Utf8Char c)      { return !(c & 0x10); }
    static Boolean IsEolChar(Utf8Char c)    { return (c == '\r') || (c == '\n'); }
    static Boolean IsSpaceChar(Utf8Char c)  { return (((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Space)); }
    static Boolean IsNumberChar(Utf8Char c) { return (((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Decimal)); }
    static Boolean IsLetterChar(Utf8Char c) { return (((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Letter)); }
    static Boolean IsIdentifierChar(Utf8Char c) { return ((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Id); }
    static Boolean IsSymbolChar(Utf8Char c) { return  ((UInt8)c < 127) && (AsciiCharTraits[(UInt8)c] & kACT_Symbol); }
    static Int32   CharLength(const Utf8Char* begin);
    
    
public:
    SubString()                         {}
    SubString(ConstCStr begin)          { AliasAssign((const Utf8Char*)begin, (const Utf8Char*)(begin ? (begin + strlen(begin)) : begin)); }
    SubString(const Utf8Char* begin, const Utf8Char* end) { AliasAssign(begin, end); }
    SubString(SubString* original)      { AliasAssign(original->Begin(), original->End()); }
    void AliasAssignCStr(ConstCStr begin) { AliasAssign((const Utf8Char*)begin, (const Utf8Char*)(begin + strlen(begin))); }
    
    void EatToEol();
    Boolean EatChar(char token);
    Int32 EatCharsByTrait(UInt8 trait);
    void EatLeadingSpaces();
    void EatOptionalComma();
    void EatRawChars(Int32 count);

    Int32 ReadEscapeToken(SubString* token);
    bool SplitString(SubString* beforeMatch, SubString* afterMatch, char separator) const;
    
    Int32 LengthAferProcessingEscapes();
    void ProcessEscapes(Utf8Char* begin, Utf8Char* end);
    
    Boolean Compare(const SubString* string)  const { return Compare(string->Begin(), string->Length()); }
    Boolean Compare(const Utf8Char* begin, IntIndex length) const;
    Boolean Compare(const Utf8Char* begin, IntIndex length, Boolean ignoreCase) const;
    Boolean CompareCStr(ConstCStr begin) const;
    Boolean ComparePrefix(const Utf8Char* begin, Int32 length) const ;
    Boolean ComparePrefixCStr(ConstCStr begin) const { return ComparePrefix ((const Utf8Char*)begin, (IntIndex)strlen((ConstCStr)begin)); }
    Boolean ReadRawChar(Utf8Char* token);
    Boolean ReadUtf32(Utf32Char* value);
    Boolean ReadGraphemeCluster(SubString* token);
    Boolean ReadMetaInt(IntIndex* value);
    Boolean ReadInt(IntMax* value);
    Boolean ParseDouble(Double* value);
    Boolean ReadNameToken(SubString* token);
    Boolean ReadToken(SubString* token);
    Boolean ReadSubexpressionToken(SubString* token);
    Boolean IdentifierIsNext() const;
    TokenTraits ClassifyNextToken() const;

    Int32 CountMatches(char value);
    Int32 StringLength();
    void TrimQuotedString();
    TokenTraits ReadValueToken(SubString* token);
    IntIndex FindFirstMatch(SubString* searchString, IntIndex offset, Boolean ignoreCase);
};

#define END_OF_LINE "\n"
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
//! A null terminated copy of a SubString. Used for calling OS APIs
class TempStackCString : public FixedCArray<Utf8Char, 255>
{
public:
    TempStackCString() {}
    TempStackCString(SubString* string) : FixedCArray(string) {}
    TempStackCString(Utf8Char* begin, Int32 length) : FixedCArray((Utf8Char*)begin, length) {}
    
    Boolean Append(SubString* string)
    {
        return FixedCArray::Append(string->Begin(), (size_t)string->Length());
    }
    // Append a Null Terminated String
    Boolean AppendCStr(ConstCStr cstr) { return FixedCArray::Append((Utf8Char*)cstr, (IntIndex)strlen(cstr)); }

    char* BeginCStr()
    {
        return (char*) _buffer;
    }
};

} // namespace Vireo

#endif //StringUtilities_h
