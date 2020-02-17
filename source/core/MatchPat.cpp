// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 *  */

#include "TypeAndDataManager.h"
#include "TypeDefiner.h"
#include <ctype.h>

namespace Vireo {

static const UInt8 *AMatch(const UInt8 *, const Utf8Char*, const Utf8Char *);
static Int32 InSet(UInt8 c, const Utf8Char *s, const Utf8Char *se);
static Int32 MakePat(Int32, const Utf8Char *str, StringRef &pat);  // NOLINT(runtime/references)
static void MatchPat(StringRef pat, Int32 len, const Utf8Char *str, Int32 offset, SubString *bef, SubString *mat, SubString *aft, Int32 *offsetPastMatch);

Int32 LexClass(Utf8Char c)
{
    static char gLexicalClass[]= {
        1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        2, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
        3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 6, 6, 6, 6, 6, 6,
        6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6,
        6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 1
    };
    c &= 0xFF;
    return (c >= 128) ? 0 : gLexicalClass[c];
}

char ScanForBackslash(const Utf8Char **sp, const Utf8Char *se)
{
    const Utf8Char *s = *sp;
    char c = *s++;

    if (c == '\\') {
        if (s < se) {
            c = *s++;
            if (isdigit(c) || (c >= 'A' && c <= 'F')) {
                c -= (c >= 'A' ? 'A' - 10 : '0');
                if (s < se) {
                    if (isdigit(*s))
                        c = (c << 4) + *s++ - '0';
                    else if (*s >= 'A' && *s <= 'F')
                        c = (c << 4) + *s++ - 'A' + 10;
                }
            } else {
                switch (c) {
                    case 'b': c = '\b'; break;
                    case 'f': c = '\f'; break;
                    case 'n': c = '\n'; break;
                    case 'r': c = '\r'; break;
                    case 's': c = ' ';  break;
                    case 't': c = '\t'; break;
                    default:
                        break;
                }
            }
        }
    }
    *sp = s;
    return c;
}

/*
Construct a pattern string by encoding the regular expression in str.
(the pattern is a string if the expression is;
if the expression contains nulls, then so does the pattern).

Pattern syntax:
    ^    means anchor to start of line iff it's the first char
    .    means any char
    *    means indefinite repeat (0 or more) iff its preceded by an alternation or non-meta-char
    +    means indefinite repeat (1 or more) iff its preceded by an alternation or non-meta-char
    ?    means conditional (0 or 1) iff it's preceded by an alternation or non-meta-char
    $    means anchor to the end of the line iff it's the last char
    \    escapes any special char including itself; \b,\f,\n,\015,\t,\xx for special characters
    []    enclose alternates:
            if ^ is first it negates the set with reference to printable chars.
            if ~ is first it negates the set with reference to all chars.
            if - is between two alpha or numeric chars it means the inclusive set.
*/
#define mEOF    0
#define mStar   1
#define mPlus   2
#define mCond   4
#define mBOL    0x58
#define mAny    0x28
#define mEOS    0x20
#define mChr    0x60
#define mCCL    0x30

static Int32 MakePat(Int32 len, const Utf8Char *str, StringRef &pat)  // NOLINT(runtime/references)
{
    const Utf8Char *s, *ssav, *se;
    UInt8 *p, *lastP;
    Int32 c, n;
    bool regChar = false;

    n = len;
    if (!pat) {
        TypeRef type = TypeManagerScope::Current()->FindType("String");
        if (type)
            type->InitData(&pat);
        if (!pat)
            return kLVError_MemFull;
    }
    if (!pat->Resize1D(2*n + 10))
        return kLVError_MemFull;
    s = str;
    se = s + n;
    p = pat->Begin();
    for (lastP = nullptr; s < se; regChar ? (*p++ = mChr, *p++ = c) : 0) {
        Int32 charLen = SubString::CharLength(s);
        regChar = false;
        if (charLen > 1) {
            while (charLen-- > 0 && s < se) {
                *p++ = mChr;
                *p++ = *s++;
            }
            continue;
        }
        c = *s++;
        if (c != '*' && c != '+' && c != '?')
            lastP = p;
        switch (c) {
            case '^':
                if (p != pat->Begin()) {
                    regChar = true; continue;
                }
                *p++ = mBOL;
                break;
            case '.':
                *p++ = mAny;
                break;
            case '*':
                if (lastP == nullptr) {
                    regChar = true; continue;
                }
                *lastP |= mStar;
                lastP = nullptr;
                break;
            case '+':
                if (lastP == nullptr) {
                    regChar = true; continue;
                }
                *lastP |= mPlus;
                lastP = nullptr;
                break;
            case '?':
                if (lastP == nullptr) {
                    regChar = true; continue;
                }
                *lastP |= mCond;
                lastP = nullptr;
                break;
            case '$':
                if (s < se) {
                    regChar = true; continue;
                }
                *p++ = mEOS;
                break;
            case '\\':
                ssav = s-1;
                c = ScanForBackslash(&ssav, se);
                s = ssav;
                // fall through...
            default:
                *p++ = mChr;
                *p++ = c;
                break;
            case '[':
                *p++ = mCCL;
                for (p++; s < se && (c= *s++) != ']'; *p++ = c)
                    if (c == '\\') {
                        ssav = s-1;
                        c = ScanForBackslash(&ssav, se);
                        s = ssav;
                    }
                lastP[1] = p - lastP - 1;
                break;
        }
    }
    *p = mEOF;
    pat->Resize1D(IntIndex(p + 1 - pat->Begin()));
    return 0;
}

/*
Match pat to the string str starting at position idx.
If it matches return str up to the match point in bef,
the match string in mat, and the remainder of str in aft.
Return the index of the character past the match in odx.
If no match return -1 in odx;
One or more of bef, mat, and aft may be nullptr.
"pat" should not be an empty string.
*/
static void MatchPat(StringRef pat, Int32 len, const Utf8Char *str, Int32 offset, SubString *bef, SubString *mat, SubString *aft, Int32 *offsetPastMatch)
{
    const Utf8Char *s = nullptr, *se;
    const UInt8 *p, *t = nullptr;
    Int32 ns, nt;

    if (offset < 0)
        offset = 0;
    if (pat) {
        if (!str)
            str = (Utf8Char*)"";
        s = str + offset;
        se = str + len;
        p = pat->Begin();
        if (*p == mBOL) {
            t = AMatch(p + 1, s, se);
        } else if (*p == mChr) {
            for (; s < se; s++)
                if (*s == p[1]) {
                    t = AMatch(p, s, se);
                    if (t)
                        break;
                }
        } else {
            for (; s < se; s++) {
                t = AMatch(p, s, se);
                if (t)
                    break;
            }
        }
    }
    if (!t) { /* copy all of str to bef and set mat, aft to empty */
        if (bef)
            bef->AliasAssignLen(str, len);
        if (mat)
            mat->AliasAssignLen(nullptr, 0);
        if (aft)
            aft->AliasAssignLen(nullptr, 0);
        if (offsetPastMatch)
            *offsetPastMatch = -1;
    } else {  // copy str up to s to bef, from s to t to mat, remainder of str from t to aft
        ns = Int32(s - str);
        nt = Int32(t - str);
        if (bef)
            bef->AliasAssignLen(str, ns);
        if (mat)
            mat->AliasAssignLen(str + ns, nt - ns);
        if (aft)
            aft->AliasAssignLen(str + nt, len - nt);
        if (offsetPastMatch)
            *offsetPastMatch = nt;
    }
}

static const Utf8Char *AMatch(const UInt8 *p, const Utf8Char* s, const Utf8Char *se)
{
    const Utf8Char *sSave, *t;

    for (;;) {
        switch (*p++) {
            case mEOF:
                return s > se ? nullptr : s;
            case mChr:
                if (s >= se || *s++ != *p++)
                    return nullptr;
                continue;
            case mAny:
                if (s >= se)
                    return nullptr;
                s++;
                continue;
            case mEOS:
                if (s != se)
                    return nullptr;
                continue;
            case mCCL:
                if (s >= se || !InSet(*s++, p + 1, p + *p))
                    return nullptr;
                p += *p;
                continue;
            case mAny | mStar:
                sSave = s;
                s = se;
                break;
            case mChr | mStar:
                sSave = s;
                while (s < se && *s == *p)
                    s++;
                p++;
                break;
            case mCCL | mStar:
                sSave = s;
                while (s < se && InSet(*s, p + 1, p + *p))
                    s++;
                p += *p;
                break;
            case mAny | mPlus:
                sSave = s + 1;
                s = se;
                break;
            case mChr | mPlus:
                sSave = s;
                while (s < se && *s == *p)
                    s++;
                if (s == sSave)
                    return nullptr;
                sSave++;
                p++;
                break;
            case mCCL | mPlus:
                sSave = s;
                while (s < se && InSet(*s, p + 1, p + *p))
                    s++;
                if (s == sSave)
                    return nullptr;
                sSave++;
                p += *p;
                break;
            case mAny | mCond:
                sSave = s;
                s = s + 1;
                break;
            case mChr | mCond:
                sSave = s;
                if (s < se && *s == *p)
                    s++;
                p++;
                break;
            case mCCL | mCond:
                sSave = s;
                if (s < se && InSet(*s, p + 1, p + *p))
                    s++;
                p += *p;
                break;
            default:
                return nullptr;
        }
    // starloop:
        for (; s >= sSave; s--) {
            t = AMatch(p, s, se);
            if (t)
                return t;
        }
        return nullptr;
    }
}

static Int32 InSet(UInt8 c, const Utf8Char *s, const Utf8Char *se)
{
    Int32 i;
    bool sense;

    sense = false;
    if (s < se && (*s == '^' || *s == '~')) {
        if (c < ' ' && *s == '^')
            return 0;
        s++;
        sense = true;
    }
    while (s < se) {
        if (s < se-2 && s[1] == '-' && s[0] <= s[2] && (i=LexClass(s[0])) >= 3
           && i <= 5 && i == LexClass(s[2])) {
            if (c >= s[0] && c <= s[2])
                return !sense;
            s += 3;
        } else if (c == *s) {
            return !sense;
        } else {
            s++;
        }
    }
    return sense;
}


// Int32 MatchPattern(StringRef regexPattern, ConstCStr str, Int32 offset,
//                   ConstCStr before, ConstCStr match, ConstCStr after, Int32 *offsetPastMatch)

VIREO_FUNCTION_SIGNATURE7(MatchPattern, StringRef, StringRef, Int32, StringRef, StringRef, StringRef, Int32)
{
    StringRef *str = _ParamPointer(0);
    StringRef *pat = _ParamPointer(1);
    Int32 offset = _ParamPointer(2) ? _Param(2) : 0;
    StringRef *beforeStr = _ParamPointer(3);
    StringRef *matchStr = _ParamPointer(4);
    StringRef *afterStr = _ParamPointer(5);
    Int32 *offsetOutPtr = _ParamPointer(6);
    Int32 patLen = pat ? (*pat)->Length() : 0;
    const Utf8Char *cstr = str ? (*str)->Begin() : nullptr;
    Int32 strLen = str ? (*str)->Length() : 0;
    StringRef cpat = nullptr;
    SubString beforeSub, matchSub, afterSub;
    Int32 err = MakePat(patLen, pat ? (*pat)->Begin() : nullptr, cpat);
    beforeSub.AliasAssignLen(cstr, strLen);
    if (!err) {
        MatchPat(cpat, strLen, cstr, offset, &beforeSub, &matchSub, &afterSub, offsetOutPtr);
    } else {
        if (offsetOutPtr)
            *offsetOutPtr = -1;
    }
    if (beforeStr)
        (*beforeStr)->CopyFromSubString(&beforeSub);
    if (matchStr)
        (*matchStr)->CopyFromSubString(&matchSub);
    if (afterStr)
        (*afterStr)->CopyFromSubString(&afterSub);
    if (cpat)
        cpat->Type()->ClearData(&cpat);
    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(String)
DEFINE_VIREO_FUNCTION(MatchPattern, "p(i(String) i(String) i(Int32) o(String) o(String) o(String) o(Int32))")
DEFINE_VIREO_END()

}  // namespace Vireo
