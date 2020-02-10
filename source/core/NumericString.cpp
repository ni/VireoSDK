// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Native Vireo VIA functions.
 */

#include <stdarg.h>
#include <stdlib.h>
#include <ctype.h>
#include <stdio.h>
#include <algorithm>
#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include "../../ThirdParty/utfcpp/source/utf8.h"

#if !kVireoOS_windows
    #include <math.h>
#endif

namespace Vireo {

//------------------------------------------------------------
struct FormatOptions {
    Int32 ArgumentOrder;       // 3$, 2$ negative number means default order
    Boolean RemoveTrailing;    // #
    Boolean Valid;
    Boolean LeftJustify;
    Boolean ShowSign;           // + or - always
    Boolean SignPad;            // ' ' for positive '-' for negative
    Boolean BasePrefix;         // 0, 0x, or 0X
    Boolean ZeroPad;            // 00010 '0'
    Boolean VariablePrecision;
    char    FormatChar;         // my affect output 'x' or 'X'
    char OriginalFormatChar;
    char DecimalSeparator;
    char NumericLength[3];
    Boolean EngineerNotation;
    Int32   MinimumFieldWidth;  // If zero no padding
    Int32   Precision;     // .3
    Int32   Significant;   // _4
    SubString  FmtSubString;
    Boolean ConsumeArgument;
    Boolean OutOfOrder;
};
//------------------------------------------------------------
void ReadPercentFormatOptions(SubString *format, FormatOptions *pOptions)
{
    // Derived on the specification found here.
    // http://www.cplusplus.com/reference/cstdio/printf/
    // There will be some allowances for LV and since
    // data is typed codes that identify type size like
    // (hh, ll j, z, r, and L) are not needed.

    pOptions->ShowSign = false;
    pOptions->LeftJustify = false;
    pOptions->ZeroPad = false;
    pOptions->BasePrefix = false;
    pOptions->SignPad = false;
    pOptions->VariablePrecision = false;
    pOptions->MinimumFieldWidth = 0;
    pOptions->Precision = -1;
    pOptions->ArgumentOrder = -1;
    pOptions->RemoveTrailing = false;
    pOptions->Significant = -1;
    pOptions->NumericLength[0] = '\0';
    pOptions->NumericLength[1] = '\0';
    pOptions->NumericLength[2] = '\0';
    pOptions->EngineerNotation = false;
    pOptions->ConsumeArgument = true;
    pOptions->OutOfOrder = false;
    Boolean bPrecision = false;
    Boolean bValid = true;
    Utf8Char c;
    const Utf8Char* pBegin = format->Begin();
    Boolean validChar = format->ReadRawChar(&c);


    while (bValid && validChar) {
        SubString order("$");
        SubString percent("%");

        if (strchr("diuoxXfFeEgGaAcsptTbB%z", c)) {
            pOptions->FormatChar = c;
            break;
        }
        if (c == '[') {
            // only used for scan from string related function
            SubString charSet("]");
            IntIndex charSetIndex = format->FindFirstMatch(&charSet, 0, false);
            if (charSetIndex < 0) {
                bValid = false;
            } else {
                format->AliasAssign(format->Begin()+charSetIndex+1, format->End());
                pOptions->FormatChar = '[';
            }
            break;
        }
        if (c == '<') {
            SubString charSet(">");
            IntIndex charSetIndex = format->FindFirstMatch(&charSet, 0, false);
            if (charSetIndex < 0) {
                bValid = false;
            } else {
                char timeCode = *(format->Begin()+charSetIndex + 1);
                format->AliasAssign(format->Begin()+charSetIndex+2, format->End());
                if (timeCode == 't') {
                    pOptions->FormatChar = 't';
                } else if (timeCode == 'T') {
                    pOptions->FormatChar = 'T';
                } else {
                    bValid = false;
                }
            }
            break;
        }
        if (c == '+') {
            pOptions->ShowSign = true;
        } else if (c == '-') {
            pOptions->LeftJustify = true;
        } else if (c == '#') {
            pOptions->BasePrefix = true;
            pOptions->RemoveTrailing = true;
        } else if (c == '^') {
            pOptions->EngineerNotation = true;
        } else if (c == '.') {
            bPrecision = true;
            format->AliasAssign(format->Begin(), format->End());
            IntMax value = 0;
            if (format->ReadInt(&value)) {
                pOptions->Precision = (Int32)value;
            } else {
                bValid = false;
            }
        } else if (c == '_') {
            bPrecision = true;
            format->AliasAssign(format->Begin(), format->End());
            IntMax value = 0;
            if (format->ReadInt(&value)) {
                pOptions->Significant = (Int32)value;
            }
        } else if (bPrecision && c == '*') {
            // LabVIEW doesn't support variable precision, it would mess up with the argument index.
            pOptions->VariablePrecision = true;
        } else if (c == '$') {
        } else if (strchr("hl", c)) {
            if (format->Length() <= 0) {
                bValid = false;
                break;
            } else {
                Utf8Char nextC = *(format->Begin());
                if (strchr("duoxXfFeEgGpbB", nextC)) {
                    pOptions->NumericLength[0] = c;
                } else {
                    bValid = false;
                    break;
                }
            }
        } else {
            // Checking for the order number for %1$
            IntIndex orderIndex = format->FindFirstMatch(&order, 0, false);
            if ((c >= '0' && c <= '9') && orderIndex >= 0) {
                format->AliasAssign(format->Begin()-1, format->End());
                IntMax value = 0;
                if (format->ReadInt(&value)) {
                    pOptions->ArgumentOrder = (Int32)value;
                    pOptions->OutOfOrder = true;
                }
            } else if (c == '0') {
                pOptions->ZeroPad = true;
            } else if (c >= '0' && c <= '9') {
                // Back up and read the whole number.
                format->AliasAssign(format->Begin()-1, format->End());
                IntMax value = 0;
                if (format->ReadInt(&value)) {
                    pOptions->MinimumFieldWidth = (Int32) value;
                }
             } else {
                 bValid = false;
                 break;
             }
        }
        validChar = format->ReadRawChar(&c);
    }
    pOptions->Valid = bValid;
    if (!pOptions->Valid) {
        // if the format is invalid: provide the format character for error handling
        if (!validChar) {
            // the char could not be read
            pOptions->FormatChar = '0';
        } else {
            // the char previously read
            pOptions->FormatChar = c;
        }
    }
    pOptions->ConsumeArgument = (pOptions->FormatChar != '%') && (pOptions->FormatChar != ';');
    pOptions->OriginalFormatChar = pOptions->FormatChar;
    pOptions->FmtSubString.AliasAssign(pBegin, format->Begin());
}
//---------------------------------------------------------------------------------------------
void GenerateFinalNumeric(const FormatOptions*, char*, Int32*, TempStackCString*, Boolean);
void RefactorLVNumeric(const FormatOptions*, char* , Int32* , Int32 , Int32, Boolean);

void DefaultFormatCode(Int32 count, StaticTypeAndData arguments[], TempStackCString* buffer)
{
    Int32 index = 0;
    for (Int32 i = 0; i < count; i++) {
        if (i != 0) {
            buffer->AppendCStr(" ");
            index++;
        }
        TypeRef argType = arguments[i]._paramType;
        if (argType->IsTimestamp()) {
            buffer->AppendCStr("%T");
            return;
        }
        switch (argType->BitEncoding()) {
            case kEncoding_UInt: {
                buffer->AppendCStr("%u");
            }
            break;
            case kEncoding_Enum: {
                    buffer->AppendCStr("%s");
            }
            break;
            case kEncoding_S2CInt:
            case kEncoding_DimInt: {
                buffer->AppendCStr("%d");
            }
            break;
            case kEncoding_IEEE754Binary: {
                buffer->AppendCStr("%f");
            }
            break;
            case kEncoding_Array: {
                TypedArrayCoreRef* pArray = (TypedArrayCoreRef*)(arguments[i]._pData);
                TypeRef elementType = (*pArray)->ElementType();
                EncodingEnum elementEncoding = elementType->BitEncoding();
                if (argType->Rank() == 1 && (elementEncoding == kEncoding_Ascii || elementEncoding == kEncoding_Unicode)) {
                    buffer->AppendCStr("%s");
                } else {
                    // doesn't support yet
                    buffer->AppendCStr("%Z");
                }
            }
            break;
            case kEncoding_Boolean: {
                buffer->AppendCStr("%s");
            }
            break;
            default:
                buffer->AppendCStr("%Z");
            break;
        }
    }
}

// Format Into String/Scan From String (StringFormat/StringCan) error codes
enum { kFormatArgErr = 1, kFormatTypeMismatch = 81, kFormatCodeUnknown, kFormatTooFewFormatSpecs, kFormatTooManyFormatSpecs, kFormatScanFailed };

static Boolean SetFormatError(Int32 errCode, Int32 argNum, char formatCode, ErrorCluster *errPtr, Boolean isScan) {
    if (errPtr) {
        char argBuf[8];
        snprintf(argBuf, sizeof(argBuf), "%d", argNum+1);
        errPtr->SetError(true, errCode, isScan ? "Scan From String" : "Format Into String");
        if (errCode != kFormatTooManyFormatSpecs && errCode != kFormatTooFewFormatSpecs) {
            errPtr->source->AppendCStr(" (arg ");
            errPtr->source->AppendCStr(argBuf);
            errPtr->source->AppendCStr(")");
        }
        errPtr->source->AppendCStr(" in ");
        AppendCallChainString(errPtr->source);
        if (formatCode && (errCode == kFormatCodeUnknown || errCode == kFormatTypeMismatch)) {
            errPtr->AddAppendixPreamble();
            if (errCode == kFormatCodeUnknown) {
                errPtr->source->AppendCStr("Invalid format specifier: ");
            } else if (errCode == kFormatTypeMismatch) {
                errPtr->source->AppendCStr("Format specifier type mismatch: ");
            }
            snprintf(argBuf, sizeof(argBuf), "\"%%%c\"", formatCode);
            errPtr->source->AppendCStr(argBuf);
            errPtr->AddAppendixPostamble();
        }
        return true;
    }
    return false;
}

bool ReadLocalizedDecimalSeparator(SubString* format, Int32 count, StaticTypeAndData* arguments,
    StringRef buffer, SubString* f, Boolean *validFormatString, char *pDecimalSeparator,
    Boolean *parseFinished) {
    Utf8Char c;
    if (f->PeekRawChar(&c) && c == ';') {
        Utf8Char ignore;
        f->ReadRawChar(&ignore);
        return true;
    }
    if (f->PeekRawChar(&c, 1) && c == ';') {
        Utf8Char decimalSeparator;
        if (f->PeekRawChar(&decimalSeparator) && (decimalSeparator == ',' || decimalSeparator == '.')) {
            *pDecimalSeparator = decimalSeparator;
            Utf8Char ignore;
            f->ReadRawChar(&ignore);
            f->ReadRawChar(&ignore);
            return true;
        }
    }
    return false;
}

void UpdateNumericStringWithDecimalSeparator(FormatOptions fOptions, char *numericString, Int32 size) {
    for (int i = 0; i < size; i++) {
        if (numericString[i] == '.') {
            numericString[i] = fOptions.DecimalSeparator;
        }
    }
}

void TruncateLeadingZerosFromTimeString(StringRef buffer)
{
    // Leading Hours and Minutes should be truncated if 0. Seconds should not be truncated if 0.
    int indexToScan = 0;
    bool nonZeroFound = false;
    int numColon = 0;  // Track this to ensure not removing leading 0 in seconds.
    for (int i = 0; i < buffer->Capacity() && !nonZeroFound && numColon < 2; i++) {
        if (buffer->At(i) == ':') {
            numColon++;
            for (int k = indexToScan; k < i; k++) {
                if (buffer->At(k) != '0') {
                    nonZeroFound = true;
                    break;
                }
            }
            if (!nonZeroFound) {
                indexToScan = i + 1;
            }
        }
    }
    if (indexToScan != 0) {
        buffer->Remove1D(0, indexToScan);
    }
}

void CreateMismatchedFormatSpecifierError(SubString* format, Int32 count, StaticTypeAndData* arguments,
    StringRef buffer, FormatOptions fOptions, Boolean* validFormatString, Boolean* parseFinished,
    ErrorCluster *errPtr)
{
    *parseFinished = true;
    *validFormatString = false;
    SetFormatError(kFormatTypeMismatch, count, fOptions.FormatChar, errPtr, false);
    buffer->Resize1D(0);
}

// Extract a time format string from a %<>T general format string pre-parsed in fOptions, or provide a default if not supplied.
// TempStakString defaultTimeFormat is used for storage if needed (dateTimeFormat may alias it).
static void GetDateTimeFormatString(SubString *datetimeFormat, const FormatOptions &fOptions, TempStackCString *defaultTimeFormat) {
    SubString tempFormat(fOptions.FmtSubString.Begin(), fOptions.FmtSubString.End());
    Utf8Char subCode;

    char defaultFormatString[kTempCStringLength];

    while (tempFormat.ReadRawChar(&subCode)) {
        if (subCode == '<') {
            datetimeFormat->AliasAssign(tempFormat.Begin(), tempFormat.Begin());
        } else if (subCode == '>') {
            datetimeFormat->AliasAssign(datetimeFormat->Begin(), tempFormat.Begin()-1);
        }
    }
    if (datetimeFormat->Length() == 0) {
        Int32 fractionLen = -1;
        if (fOptions.FormatChar == 't') {
            fractionLen = 3;
            //  The %<digit>u is deep in this string.
            snprintf(defaultFormatString, kTempCStringLength, "%%H:%%M:%%S%%%du", (int)fractionLen);
        } else {
            if (fOptions.MinimumFieldWidth > 0) {
                fractionLen = fOptions.MinimumFieldWidth;
            }
            if (fOptions.Precision >= 0) {
                fractionLen = fOptions.Precision;
            }
            if (fractionLen < 0) {
                fractionLen = 3;
            }
            if (fractionLen > 0) {
                //  The %<digit>u is deep in this string.
                snprintf(defaultFormatString, kTempCStringLength, "%%#I:%%M:%%S%%%du %%p %%m/%%d/%%Y", (int)fractionLen);
            } else {
                strncpy(defaultFormatString, "%#I:%M:%S %p %m/%d/%Y", kTempCStringLength);
            }
        }
        defaultTimeFormat->AppendCStr(defaultFormatString);
        datetimeFormat->AliasAssign(defaultTimeFormat->Begin(), defaultTimeFormat->End());
    }
}

static Int32 GetTimeZoneOffsetFromTimeAndLocale(StaticTypeAndData *arg, const FormatOptions &fOptions) {
    Int32 tz = 0;
    TypeRef argType = arg->_paramType;
    if (fOptions.FormatChar == 'T' && !fOptions.EngineerNotation) {
        // (Engineer notation here means ^ flag, which in Time context means UTC)
        if (argType->IsTimestamp()) {
            Timestamp time = *((Timestamp*)arg->_pData);
            tz = Date::getLocaletimeZone(time.Integer());
        } else if (argType->IsNumeric()) {
            Double value = ReadDoubleFromMemory(argType,  arg->_pData);
            Timestamp time(value);
            tz = Date::getLocaletimeZone(time.Integer());
        }
    }
    return tz;
}

/**
 * main format function, all the %format functionality is done through this one
 * */
void Format(SubString *format, Int32 count, StaticTypeAndData arguments[], StringRef buffer, ErrorCluster *errPtr, SubString* formatName)
{
    IntIndex argumentIndex = 0;
    Boolean lastArgumentSpecified = false;
    IntIndex lastArgumentIndex = -1;
    IntIndex explicitPositionArgument = 0;
    Int32 totalArgument = 0;
    Int32 usedArguments = 0;
    SubString f(format);            // Make a copy to use locally

    buffer->Resize1D(0);              // Clear buffer (wont do anything for fixed size)
    Boolean validFormatString = true;
    Utf8Char c = 0;
    FormatOptions fOptions;
    // We should assign the local decimal point to DecimalSeparator.
    char defaultDecimalSeparator = '.';
    fOptions.DecimalSeparator = defaultDecimalSeparator;

    while (validFormatString && f.ReadRawChar(&c)) {
        Utf8Char c1, c2;
        if (c == '\\' && f.PeekRawChar(&c1) && f.PeekRawChar(&c2, 1) && isalnum(c1) && isalnum(c2) && !islower(c1) && !islower(c2)) {
            // Process ASCII escape codes. LabVIEW supports only uppercase alphabets in the hex codes
            f.ReadRawChar(&c1);
            f.ReadRawChar(&c2);
            char str[3];
            str[0] = c1;
            str[1] = c2;
            str[2] = 0;
            char ascii = static_cast<char>(strtol(str, nullptr, 16));
            buffer->Append(ascii);
        } else if (c == '\\' && f.ReadRawChar(&c)) {
            switch (c) {
                case 'n':       buffer->Append('\n');      break;
                case 'r':       buffer->Append('\r');      break;
                case 't':       buffer->Append('\t');      break;
                case 'b':       buffer->Append('\b');      break;
                case 'f':       buffer->Append('\f');      break;
                case 's':       buffer->Append(' ');       break;
                case '\\':      buffer->Append('\\');      break;
                default:  break;
            }
        } else if (c == '%') {
            Boolean parseFinished = false;
            if (ReadLocalizedDecimalSeparator(format, count, arguments, buffer, &f, &validFormatString, &fOptions.DecimalSeparator, &parseFinished))
                continue;
            ReadPercentFormatOptions(&f, &fOptions);
            totalArgument++;
            usedArguments++;
            if (lastArgumentIndex == argumentIndex) {
                // the previous argument is a legal argument. like %12$%
                --totalArgument;
                if (lastArgumentSpecified) {
                    --explicitPositionArgument;
                }
            }
            lastArgumentSpecified = false;
            if (fOptions.ArgumentOrder >= 0 && fOptions.OutOfOrder) {
                if (fOptions.ArgumentOrder > 0) {
                    argumentIndex = fOptions.ArgumentOrder-1;
                    ++explicitPositionArgument;
                    lastArgumentSpecified = true;
                }
                SubString *fmtSubString = &fOptions.FmtSubString;
                fmtSubString->AliasAssign(fmtSubString->Begin(), fmtSubString->End());
                SubString order("$");
                IntIndex dollarFlag = fmtSubString->FindFirstMatch(&order, 0, false);
                fmtSubString->AliasAssign(fmtSubString->Begin()+ dollarFlag + 1, fmtSubString->End());
            }
            lastArgumentIndex = argumentIndex;
            if (!fOptions.Valid) {
                // Format String is invalid
                parseFinished = true;
                validFormatString = false;
                SetFormatError(kFormatCodeUnknown, count, fOptions.FormatChar, errPtr, false);
                buffer->Resize1D(0);
                break;
            } else if (argumentIndex > count-1 && fOptions.ConsumeArgument) {
                // Incorrect number of arguments provided for format string
                parseFinished = true;
                validFormatString = false;
                SetFormatError(kFormatTooManyFormatSpecs, count, fOptions.FormatChar, errPtr, false);
                buffer->Resize1D(0);
                break;
            }

            // temp used for modifying string to support opts for sigDigits, engineering notation, etc.
            char replacementString[2*kTempCStringLength];
            Int32 complexArg = 0;  // when formatting complex data, 0==real, 1==imag, 2==finished
            Int32 truncateSignificant = 0;
            Int32 intDigits = 0;
            Int32 sizeOfNumericString = -1, skipPrev = 0;

            replacementString[0] = '\0';
            while (!parseFinished) {
                TypeRef argType = nullptr;
                void *pData = nullptr;
                parseFinished = true;
                if (fOptions.ConsumeArgument) {
                    argType = arguments[argumentIndex]._paramType;
                    pData = arguments[argumentIndex]._pData;
                    if (argType->IsComplex() &&
                        (fOptions.FormatChar == 'f' || fOptions.FormatChar == 'F' || fOptions.FormatChar == 'e' || fOptions.FormatChar == 'E')) {
                        if (complexArg >= 2) {
                            ++argumentIndex;
                            break;
                        }
                        parseFinished = false;
                        // will be incremented at end of loop, but we want to stay here to process both complex parts
                        --argumentIndex;
                        argType = argType->GetSubElement(complexArg++);
                        pData = (void*)((AQBlock1*)pData + argType->ElementOffset());
                    }
                }
                switch (fOptions.FormatChar) {
                    case 'g': case 'G':
                    {
                        // will re-parse the format later with new format code
                        parseFinished = false;
                        Double tempDouble = *(Double*) (arguments[argumentIndex]._pData);
                        Int32 exponent = 0;
                        Int32 precision = fOptions.Precision;
                        if (precision < 0) {
                               // 6 is the default value;
                               precision = 6;
                        }
                        if (tempDouble != 0.0) {
                            Double absDouble = tempDouble;
                            if (tempDouble < 0) {
                            absDouble = 0.0 - tempDouble;
                            }
                            exponent = Int32(floor(log10(absDouble)));
                        }
                        if (fOptions.Significant >= 0) {
                            precision = fOptions.Significant-1;
                            if (precision < 0) {
                                precision = 0;
                            }
                        }
                        if (exponent >= -4 && exponent <= precision) {
                            fOptions.FormatChar = 'f';
                        } else {
                            fOptions.FormatChar = 'e';
                        }
                    }
                    break;
                    case 'f': case 'F':
                    {
                        Double tempDouble = ReadDoubleFromMemory(argType, pData);
                        Int32 leadingZero = 0;
                        Int32 exponent = 0;
                        Int32 precision = fOptions.Precision;
                        if (complexArg == 2) {
                            if (!(tempDouble < 0.0))  // negation intentional; '>= 0.0' wouldn't match NaN
                                strncat(replacementString, " +", sizeof(replacementString) - strlen(replacementString) - 1);
                            else
                                strncat(replacementString, " ", sizeof(replacementString) - strlen(replacementString) - 1);
                        }
                        // calculate the exponent of the number, it also tell us whether should truncate the integer part.
                        if (fOptions.Significant >= 0) {
                            if (fOptions.Significant == 0) {
                                fOptions.Significant = 1;
                            }
                            if (tempDouble != 0) {
                                Double absDouble = tempDouble;
                                if (tempDouble < 0) {
                                    absDouble = 0.0 - tempDouble;
                                }
                                exponent = Int32(floor(log10(absDouble)));
                            }
                            // 0.12 has 1 leading zero
                            leadingZero = (exponent >= 0)? 0 : (0 - exponent);
                            precision = (exponent >= 0)? (fOptions.Significant - exponent - 1) : (fOptions.Significant + leadingZero - 1);
                            if (precision < 0) {
                                precision = 0;
                                truncateSignificant = exponent + 1 - fOptions.Significant;
                                // need to truncate the integer part of the float because the sprintf doesn't do this for us.
                            }
                        }
                        char formatCode[10];
                        skipPrev = Int32(strlen(replacementString));
                        if (precision >= 0) {
                            snprintf(formatCode, sizeof(formatCode), "%%.*%sf", fOptions.NumericLength);
                            // formatCode : %.*hf
                            sizeOfNumericString = snprintf(replacementString+skipPrev, sizeof(replacementString)-skipPrev, formatCode, precision, tempDouble);
                        } else {
                            snprintf(formatCode, sizeof(formatCode), "%%%sf", fOptions.NumericLength);
                            // formatCode: %hf
                            sizeOfNumericString = snprintf(replacementString+skipPrev, sizeof(replacementString)-skipPrev, formatCode, tempDouble);
                        }
                        sizeOfNumericString += skipPrev;
                        if (exponent > 0)
                            intDigits = exponent;
                        // further processing done by shared code which calls RefactorLVNumeric below switch
                        argumentIndex++;
                    }
                    break;
                    case 'e': case 'E':
                    {
                        Double tempDouble = ReadDoubleFromMemory(argType, pData);
                        Int32 precision = fOptions.Precision;
                        if (complexArg == 2) {
                            if (!(tempDouble < 0.0))  // negation intentional; '>= 0.0' wouldn't match NaN
                                strncat(replacementString, " +", sizeof(replacementString) - strlen(replacementString) - 1);
                            else
                                strncat(replacementString, " ", sizeof(replacementString) - strlen(replacementString) - 1);
                        }
                        if (precision >= 0 && fOptions.EngineerNotation) {
                            Int32 exponent = 0;
                            if (tempDouble != 0) {
                                Double absDouble = tempDouble;
                                if (tempDouble < 0) {
                                    absDouble = 0.0 - tempDouble;
                                }
                                exponent = Int32(floor(log10(absDouble)));
                            }
                            if (exponent%3 != 0) {
                                precision = (exponent >= 0)? precision + exponent%3 : precision + 3+exponent%3;
                            }
                        }
                        if (fOptions.Significant >= 0) {
                            precision =  fOptions.Significant - 1;
                        }
                        sizeOfNumericString = 0;
                        char formatCode[10];
                        skipPrev = Int32(strlen(replacementString));
                        if (precision >= 0) {
                            snprintf(formatCode, sizeof(formatCode), "%%.*%se", fOptions.NumericLength);
                            // formatCode : %.*he
                            sizeOfNumericString = snprintf(replacementString+skipPrev, kTempCStringLength-skipPrev, formatCode, (int)precision, tempDouble);
                        } else {
                            snprintf(formatCode, sizeof(formatCode), "%%%se", fOptions.NumericLength);
                            // formatCode : %he
                            sizeOfNumericString = snprintf(replacementString+skipPrev, kTempCStringLength-skipPrev, formatCode, tempDouble);
                        }
                        sizeOfNumericString += skipPrev;
                        intDigits = 0;
                        truncateSignificant = 0;
                        // further processing done by shared code which calls RefactorLVNumeric below switch
                        argumentIndex++;
                    }
                    break;
                    case 'p': case 'P':
                    {
                        parseFinished = false;
                        fOptions.OriginalFormatChar = 'p';
                        fOptions.FormatChar = 'e';
                        fOptions.EngineerNotation = true;
                    }
                    break;
                    case 'a': case 'A':
                    {
                        // TODO(PaulAustin): don't assume data type. This just becomes the default format for real numbers, then use formatter
                        SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                        TempStackCString tempFormat(&percentFormat);
                        // Get the numeric string that will replace the format string
                        Double tempDouble = *(Double*) (arguments[argumentIndex]._pData);
                        Int32 sizeOfNumericString2 = snprintf(replacementString, kTempCStringLength, tempFormat.BeginCStr(), tempDouble);
                        buffer->Append(sizeOfNumericString2, (Utf8Char*)replacementString);
                        argumentIndex++;
                    }
                    break;
                    case 'b': case 'B':
                    {
                        fOptions.FormatChar = 'B';
                        SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                        TempStackCString formattedNumber;
                        Int32 intSize = 8*argType->TopAQSize();
                        IntMax intValue = ReadIntFromMemory(argType, arguments[argumentIndex]._pData);
                        char BinaryString[2*kTempCStringLength];
                        char bits[2];
                        bits[0] = '0';
                        bits[1] = '1';
                        Int32 length = 0;
                        char* binaryindex = BinaryString;
                        if (intValue < 0) {
                            for (IntIndex i = intSize - 1; i >= 0; i--) {
                                if (intValue % 2 == 0) {
                                    BinaryString[i] = '0';
                                } else {
                                    BinaryString[i] = '1';
                                }
                                length++;
                                intValue = intValue >> 1;
                            }
                        } else {
                            if (intValue == 0) {
                                BinaryString[0] = bits[intValue];
                                length = 1;
                            } else {
                                while (intValue >= 1) {
                                    BinaryString[intSize - 1 - length] = bits[intValue % 2];
                                    intValue = intValue / 2;
                                    length++;
                                }
                                binaryindex = BinaryString + (intSize - length);
                            }
                        }

                        Int32 binaryStringLength = length;

                        RefactorLVNumeric(&fOptions, binaryindex, &binaryStringLength, 0, 0, false);
                        buffer->Append(binaryStringLength, (Utf8Char*)binaryindex);
                        argumentIndex++;
                    }
                    break;
                    case 'd':
                    case 'o': case 'u':
                    case 'x': case 'X':
                    {
                        // To cover the max range formats like %d need to be turned into %lld
                        SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                        TempStackCString tempFormat((Utf8Char*)"%", 1);
                        SubString *fmtSubString = &fOptions.FmtSubString;
                        fmtSubString->AliasAssign(fmtSubString->Begin(), fmtSubString->End()-1);
                        tempFormat.Append(fmtSubString);
                        char specifier[] = "d";
                        if (fOptions.FormatChar == 'x') {
                            fOptions.FormatChar = 'X';
                        }
                        if (fOptions.FormatChar == 'U') {
                            fOptions.FormatChar = 'u';
                        }
                        specifier[0] = fOptions.FormatChar;
                        if (fOptions.NumericLength[0] == '\0') {
                            tempFormat.AppendCStr("ll");
                        }
                        tempFormat.AppendCStr(specifier);

                        char formattedNumber[2*kTempCStringLength];
                        if (!argType->IsNumeric() && !argType->IsBoolean() && !argType->IsA(&TypeCommon::TypeStaticTypeAndData)) {
                            CreateMismatchedFormatSpecifierError(format, count, arguments, buffer, fOptions, &validFormatString, &parseFinished, errPtr);
                            break;
                        }
                        IntMax intValue;
                        EncodingEnum enc = argType->BitEncoding();
                        if (enc == kEncoding_IEEE754Binary) {
                            // When reading value from the double and format the value as integer, the max size is 4
                            if (fOptions.FormatChar == 'u') {
                                intValue = ReadIntFromMemory(argType, arguments[argumentIndex]._pData);
                                if (intValue < 0)
                                    intValue = 0;
                                intValue = ConvertNumericRange(kEncoding_UInt, 8, intValue);
                            } else {
                                intValue = ReadIntFromMemory(argType, arguments[argumentIndex]._pData);
                                intValue = ConvertNumericRange(kEncoding_S2CInt, 8, intValue);
                            }
                        } else if (enc == kEncoding_UInt || enc == kEncoding_S2CInt || enc == kEncoding_Boolean || enc == kEncoding_Enum) {
                            intValue = ReadIntFromMemory(argType, arguments[argumentIndex]._pData);
                            if (argType->BitLength() < 64 && fOptions.FormatChar != 'd')
                                intValue &= (1LL << (argType->BitLength()))-1;
                        } else {
                            intValue = 0;
                        }

                        Int32 length = snprintf(formattedNumber, kTempCStringLength, tempFormat.BeginCStr(), intValue);
                        if (fOptions.FormatChar == 'd') {
                            if (fOptions.Significant == 0) {
                                fOptions.Significant++;
                            }
                            if (fOptions.Significant > 0) {
                                fmtSubString->AliasAssign(fmtSubString->Begin(), fmtSubString->End()-strlen(fOptions.NumericLength));
                                tempFormat.AliasAssign(tempFormat.Begin(), tempFormat.Begin());
                                length = snprintf(formattedNumber, kTempCStringLength, "%lld", Int64(intValue));
                                RefactorLVNumeric(&fOptions, formattedNumber, &length, 0, 0, false);
                            }
                        }
                        buffer->Append(length, (Utf8Char*)formattedNumber);
                        argumentIndex++;
                    }
                    break;
                    case '%':      // %%
                        buffer->AppendCStr("%");
                    break;
                    case 'z':      // %z
                    case 's':      // %s
                    {
                        argType = arguments[argumentIndex]._paramType;
                        if (fOptions.FormatChar == 's' && !argType->IsString() && !argType->IsBoolean() && !argType->IsEnum()) {
                            CreateMismatchedFormatSpecifierError(format, count, arguments, buffer, fOptions, &validFormatString, &parseFinished, errPtr);
                            break;
                        }
                        STACK_VAR(String, tempString);
                        TDViaFormatter formatter(tempString.Value, false, 0, formatName);
                        formatter.FormatData(arguments[argumentIndex]._paramType, arguments[argumentIndex]._pData);

                        Int32 lengthTotal = -1;
                        Int32 lengthString = -1;
                        if (fOptions.MinimumFieldWidth >= 0) {
                            lengthTotal = fOptions.MinimumFieldWidth;
                        }
                        if (fOptions.Precision >= 0) {
                            lengthString = fOptions.Precision;
                        }
                        Int32 subIndex = tempString.Value->Length();
                        // Make sure the length is provided
                        if (lengthString > 0) {
                            if (lengthString > tempString.Value->Length()) {
                                // If the string total to display is longer than length, provide just the string
                                lengthString = tempString.Value->Length();
                            } else {
                                subIndex = lengthString;
                            }
                        } else {
                            // provide the length of the string as default
                            lengthString = tempString.Value->Length();
                        }

                        // partition the string depending on the provided lengthString (subIndex)
                        SubString partial(tempString.Value->Begin(), tempString.Value->Begin()+subIndex);

                        // Calculate how much to pad
                        Int32 extraPadding = 0;
                        if (lengthTotal > lengthString) {
                            extraPadding = lengthTotal - lengthString;
                        }

                        // Append the string with padding and partial substring
                        if (fOptions.LeftJustify)
                            buffer->AppendSubString(&partial);
                        if (extraPadding > 0) {
                            for (Int32 i = extraPadding; i > 0; i--) {
                                buffer->Append(' ');
                            }
                        }
                        if (!fOptions.LeftJustify)
                            buffer->AppendSubString(&partial);

                        argumentIndex++;
                    }
                    break;
                    case 't':
                    case 'T':
                    {
                        Int32 tz = GetTimeZoneOffsetFromTimeAndLocale(&arguments[argumentIndex], fOptions);
                        if ((fOptions.FormatChar == 'T' && !argType->IsTimestamp() && !argType->IsNumeric())
                            || (fOptions.FormatChar == 't' && !argType->IsNumeric())) {
                            CreateMismatchedFormatSpecifierError(format, count, arguments, buffer, fOptions, &validFormatString, &parseFinished, errPtr);
                            break;
                        }
#if defined(VIREO_TIME_FORMATTING)
                        SubString datetimeFormat;
                        TempStackCString defaultTimeFormat;
                        GetDateTimeFormatString(&datetimeFormat, fOptions, &defaultTimeFormat);
                        Boolean isUTC = (tz == 0);
                        if (argType->IsTimestamp()) {
                            Timestamp time = *((Timestamp*)arguments[argumentIndex]._pData);
                            Date date(time, tz);
                            validFormatString = DateTimeToString(date, isUTC, &datetimeFormat, buffer);
                        } else {
                            Double tempDouble = ReadDoubleFromMemory(argType,  arguments[argumentIndex]._pData);
                            if (fOptions.FormatChar == 't') {
                                validFormatString = RelTimeToString(tempDouble, &datetimeFormat, buffer);
                            } else {
                                Timestamp time(tempDouble);
                                Date date(time, tz);
                                validFormatString = DateTimeToString(date, isUTC, &datetimeFormat, buffer);
                            }
                        }
                        if (fOptions.FormatChar == 't') {
                            TruncateLeadingZerosFromTimeString(buffer);
                        }
#endif
                        argumentIndex++;
                    }
                    break;
                    default:
                        gPlatform.IO.Printf("special error character %c\n", fOptions.FormatChar);
                        // This is just part of the format specifier, let it become part of the percent format
                    break;
                }
                if (sizeOfNumericString > 0) {  // shared code, set by %e and %f above
                    sizeOfNumericString -= skipPrev;
                    RefactorLVNumeric(&fOptions, replacementString + skipPrev, &sizeOfNumericString, intDigits, truncateSignificant, complexArg > 0);
                    UpdateNumericStringWithDecimalSeparator(fOptions, replacementString + skipPrev, sizeOfNumericString);
                    sizeOfNumericString = Int32(strlen(replacementString));
                    if (complexArg == 2) {  // done with both parts of complex number
                        strncat(replacementString, " i", sizeof(replacementString) - sizeOfNumericString - 1);
                        Boolean negative = replacementString[0] == '-';
                        Utf8Char *tempNum = (Utf8Char*)replacementString;
                        if (negative) {
                            ++tempNum;  // skip '-', account for 'i'
                            ++sizeOfNumericString;
                        } else {
                            sizeOfNumericString += 2;  // account for 'i'
                        }
                        TempStackCString numberPart((Utf8Char*)tempNum, sizeOfNumericString);
                        GenerateFinalNumeric(&fOptions, replacementString, &sizeOfNumericString, &numberPart, negative);
                    }
                    if (complexArg != 1)  // arg not complex, or complex but we're done with both parts
                        buffer->Append(sizeOfNumericString, (Utf8Char*)replacementString);
                }
            }
        } else {
            buffer->Append(c);
        }
    }
    // Check if there are unused arguments provided
    if (argumentIndex < count) {
        // make sure at least all of the args are used (even if out of order)
        if (usedArguments != count) {
            SetFormatError(kFormatTooFewFormatSpecs, count - argumentIndex, fOptions.FormatChar, errPtr, false);
            buffer->Resize1D(0);
        }
    }
}

static char gSIPrefixesTable[] = {'y', 'z', 'a', 'f', 'p', 'n', 'u', 'm', '0', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'};

/* Adjust the numeric string.
 * 1. truncate the integer part if necessary for %f. %_2f   1345.55
 * 2. calculate the significant digits to guarantee the correctness.  %_2f 9.9
 * 3. Apply the engineer notation which means adjust the base and exponent part. %^_3e
 * 4. Remove the trailing zero if necessary. %#3f 1.0000
 * 5. Replace the C decimal pointer with the local decimal separator
 * Input of this function is like "-12.4" "7.450E+043"
 * If skipFinal is true, the function will not process the sign and padding and the width. It only process the pure number.
 * (This is used for complex numbers which need to be padded as one entity).
 * */
void RefactorLVNumeric(const FormatOptions* formatOptions, char* bufferBegin, Int32* pSize, Int32 IntDigits, Int32 truncateSignificant, Boolean skipFinal)
{
    Boolean negative = false;
    char* buffer = bufferBegin;

    // the positive number string always starts from the beginning
    Int32 numberStart = 0;
    Int32 numberEnd = *pSize - 1;
    Int32 decimalPoint = -1;
    Int32 exponentPos = -1;
    Int32 index = 0;
    Int32 size = *pSize;
    Boolean isInfNaN = false;
    if (strchr("DdoXxbB", formatOptions->FormatChar)) {
        decimalPoint = 0;
        exponentPos = 0;
    }

    if (strchr("fF", formatOptions->FormatChar)) {
        exponentPos = 0;
    }

    if (*(buffer + numberStart) == '-') {
        negative = true;
        numberStart++;
    }

    while (!(decimalPoint >= 0 && exponentPos >= 0) && index < size) {
        char digit = *(buffer+index);
        if (digit == '.') {
            decimalPoint = index;
        } else if (digit == 'E' || digit == 'e') {
             exponentPos = index;
        } else if (digit == 'i' || digit == 'n') {  // can only be inf/nan
             isInfNaN = true;
        }
        index++;
    }

    if (decimalPoint < 0) {
        decimalPoint = 0;
    }

    if (isInfNaN || formatOptions->FormatChar == 'f' || formatOptions->FormatChar == 'F') {
        if (truncateSignificant > 0) {
            // .0 in sprintf. no decimal point,
            // but still truncate the integer part which is not handled in sprintf

            Int32 trailing = numberStart + formatOptions->Significant;
            if (decimalPoint > 0 && numberStart + truncateSignificant >= decimalPoint) {
                trailing = numberStart + formatOptions->Significant + 1;
            }
            Boolean extend = false;
            if (*(buffer+trailing) > '5') {
                // LV typically uses Bankers rounding, but for
                // significant digits midpoints are always rounded down.
                *(buffer+trailing-1) = *(buffer+trailing-1) + 1;
            }
            for (Int32 i = trailing-1; i >= numberStart; i--) {
                if (*(buffer+i) > '9') {
                    *(buffer+i) = '0';
                    if (i == numberStart) {
                        extend = true;
                        break;
                    }
                    *(buffer+i-1) = *(buffer+i-1) +1;
                } else {
                    break;
                }
            }
            // It's guaranteed that the length of the float number doesn't change.
            for (Int32 i = trailing; i <= numberEnd; i++) {
                *(buffer+i) = '0';
            }
            if (extend) {
                numberEnd++;
                for (Int32 i = numberEnd; i > numberStart; i--) {
                    *(buffer+i) = *(buffer+i-1);
                }
                *(buffer+ numberStart) =  '1';
            }
        } else if (IntDigits+1 < decimalPoint - numberStart && formatOptions->Significant >= 0) {
            // generate extra significant digit at MSB.
            // There may be a decimal point in the string and the snprintf may generate another digit when rounding.
            // need to fix the redundancy digit

            *(buffer+numberEnd) = ' ';
            if (*(buffer+numberEnd-1) == '.') {
                *(buffer+numberEnd-1) = ' ';
                decimalPoint = 0;
                numberEnd--;
            }
            numberEnd--;
        }

        if (formatOptions->RemoveTrailing) {
            // only remove up to decimal point, and if just '0' keep that.
            while ((*(buffer + numberEnd) == '0' || *(buffer + numberEnd) == '.') && numberEnd > numberStart && numberEnd >= decimalPoint) {
                numberEnd--;
            }
        }

        buffer[1+numberEnd] = 0;
        if (!skipFinal) {
            TempStackCString numberPart((Utf8Char*)buffer+ numberStart, numberEnd + 1 - numberStart);
            GenerateFinalNumeric(formatOptions, bufferBegin, pSize, &numberPart, negative);
        }
    } else if (formatOptions->FormatChar == 'E' || formatOptions->FormatChar == 'e') {
        Int32 numberIndex = numberStart;
        Int32 baseIndex = 0;
        // baseIndex used to traverse the tempNumber char array.
        SubString ScientificFloat((Utf8Char*)buffer+exponentPos+1, (Utf8Char*)buffer+numberEnd+1);
        IntMax exponent;
        ScientificFloat.ReadInt(&exponent);
        Int32 paddingBase = exponent%3;
        char tempNumber[kTempCStringLength];
        if (formatOptions->EngineerNotation && (paddingBase%3 != 0)) {
            if (paddingBase < 0) {
                paddingBase += 3;
            }
            exponent = exponent - paddingBase;

            // we are lucky, this case will never generate extra significant digit at MSB.

            tempNumber[baseIndex] = *(buffer + numberIndex);
            baseIndex++;
            numberIndex++;
            while (baseIndex <= paddingBase) {
                Utf8Char movedChar = '0';
                if (*(buffer + numberIndex)== '.') {
                    numberIndex++;
                }
                if (*(buffer + numberIndex) != 'e') {
                       movedChar = *(buffer + numberIndex);
                   } else {
                       numberIndex--;
                   }
                tempNumber[baseIndex] = movedChar;
                baseIndex++;
                numberIndex++;
            }
            if (*(buffer + numberIndex) != 'e') {
                tempNumber[baseIndex] = formatOptions->DecimalSeparator;
                baseIndex++;
            }

            while (*(buffer + numberIndex) != 'e') {
                tempNumber[baseIndex] = *(buffer + numberIndex);
                baseIndex++;
                numberIndex++;
            }
            if (formatOptions->RemoveTrailing) {
                while ((tempNumber[baseIndex-1] == '0' || tempNumber[baseIndex-1] == formatOptions->DecimalSeparator) && baseIndex > 1) {
                    baseIndex--;
                }
            }
            // add support for %p
            if (exponent >= -24 && exponent <= 24 && (formatOptions->OriginalFormatChar == 'p')) {
                Int32 siIndex = (Int32)((exponent+24)/3);
                // Attention: -2 --- +2 will not be used
                if (gSIPrefixesTable[siIndex] != '0') {
                    tempNumber[baseIndex] = gSIPrefixesTable[siIndex];
                    baseIndex++;
                }

            } else {
                // we can use %d safely, because the exponent part is never long than Int32 in double
                Int32 sizeOfExponent = snprintf(tempNumber + baseIndex, kTempCStringLength-baseIndex, "E%+d", (int)exponent);
                baseIndex += sizeOfExponent;
            }
        } else {
            baseIndex = 0;
            for (Int32 i = numberStart; i < exponentPos; i++) {
                tempNumber[baseIndex] = *(buffer+i);
                baseIndex++;
            }
            if (formatOptions->RemoveTrailing) {
                while ((tempNumber[baseIndex-1] == '0' || tempNumber[baseIndex-1] == formatOptions->DecimalSeparator) && baseIndex > 1) {
                    baseIndex--;
                }
            }
            if (exponent >= -24 && exponent <= 24 && (formatOptions->OriginalFormatChar == 'p')) {
                Int32 siIndex = (Int32)((exponent+24)/3);
                // Attention: -2 --- +2 will not be used
                if (gSIPrefixesTable[siIndex] != '0') {
                    tempNumber[baseIndex] = gSIPrefixesTable[siIndex];
                    baseIndex++;
                }
            } else {
                Int32 sizeOfExponent = snprintf(tempNumber + baseIndex, kTempCStringLength-baseIndex, "E%+d", (int)exponent);
                baseIndex += sizeOfExponent;
            }
        }
        tempNumber[baseIndex] = 0;
        if (!skipFinal) {
            TempStackCString numberPart((Utf8Char*)tempNumber, baseIndex);
            GenerateFinalNumeric(formatOptions, bufferBegin, pSize, &numberPart, negative);
        } else {
            memcpy(bufferBegin, tempNumber, baseIndex+1);
        }
    } else if (formatOptions->FormatChar == 'B' || formatOptions->FormatChar == 'b') {
        Utf8Char* tempNumber = (Utf8Char*)bufferBegin + numberStart;
        bufferBegin[*pSize] = 0;
        if (!skipFinal) {
            TempStackCString numberPart(tempNumber, *pSize - numberStart);
            GenerateFinalNumeric(formatOptions, bufferBegin, pSize, &numberPart, false);
        }
    } else if (formatOptions->FormatChar == 'd') {
        Boolean extend = false;
        buffer = bufferBegin;
        Int32 significant = formatOptions->Significant;
        if (significant < *pSize - numberStart) {
            if (*(buffer + significant + numberStart) < '5') {
                for (Int32 i = numberEnd; i >= significant + numberStart; i--) {
                    *(buffer+i) = '0';
                }
            } else {
                for (Int32 i = numberEnd; i >= significant + numberStart; i--) {
                    *(buffer+i) = '0';
                }
                (*(buffer+significant+numberStart-1))++;
                for (Int32 i = significant + numberStart -1; i >= numberStart; i--) {
                    if (*(buffer+i) > '9') {
                        *(buffer+i) = '0';
                        if (i == numberStart) {
                            extend = true;
                            break;
                        }
                        *(buffer+i-1) = *(buffer+i-1) +1;
                    } else {
                        break;
                    }
                }
            }
            if (extend) {
                numberEnd++;
                for (Int32 i = numberEnd; i > numberStart; i--) {
                    *(buffer+i) = *(buffer+i-1);
                }
                *(buffer+ numberStart) = '1';
            }
        }
        buffer[1+numberEnd] = 0;
        if (!skipFinal) {
            Utf8Char* tempNumber = (Utf8Char*)bufferBegin + numberStart;
            TempStackCString numberPart(tempNumber, 1 + numberEnd - numberStart);
            GenerateFinalNumeric(formatOptions, bufferBegin, pSize, &numberPart, negative);
        }
    }
}

/* This function will calculate the length and fill the numeric string if necessary.
 *
 * */
void GenerateFinalNumeric(const FormatOptions* formatOptions, char* bufferBegin, Int32* pSize, TempStackCString* numberPart, Boolean negative)
{
    // the input buffer is pure numeric. will generate the final format numeric with '+' or padding zero.
    TempStackCString leadingPart;
    Int32 width = formatOptions->MinimumFieldWidth;

    if (!negative) {
        if (formatOptions->ShowSign) {
            leadingPart.AppendCStr("+");
        } else if (formatOptions->SignPad) {
            leadingPart.AppendCStr(" ");
        }
    } else {
        if (formatOptions->FormatChar == 'B' || formatOptions->FormatChar == 'X') {
            leadingPart.AppendCStr("+");
        } else {
            leadingPart.AppendCStr("-");
        }
    }
    if (formatOptions->LeftJustify) {
        width = width - leadingPart.Length();
        width = width > 0 ? width : 0;
        *pSize = snprintf(bufferBegin, kTempCStringLength, "%s%-*s", leadingPart.BeginCStr(), (int)width, numberPart->BeginCStr());
    } else {
        // calculate the padding
        width = width - leadingPart.Length();
        width = width - numberPart->Length();
        if (width <= 0) {
            *pSize = snprintf(bufferBegin, kTempCStringLength, "%s%s", leadingPart.BeginCStr(), numberPart->BeginCStr());
        } else {
            if (formatOptions->ZeroPad) {
                *pSize = snprintf(bufferBegin, kTempCStringLength, "%s%0*d%s", leadingPart.BeginCStr(), (int)width, 0, numberPart->BeginCStr());
            } else {
                *pSize = snprintf(bufferBegin, kTempCStringLength, "%*s%s%s", (int)width, " ", leadingPart.BeginCStr(), numberPart->BeginCStr());
            }
         }
    }
}
//--------------------------------------------------------------------------------------------
Boolean BelongsToCharSet(SubString* charSet, Utf8Char candidate) {
    if (charSet->Length() == 0) {
        return false;
    }
    IntIndex i = 0;
    Utf8Char* begin = (Utf8Char*)charSet->Begin();
    while (i< charSet->Length()) {
        if (i+2< charSet->Length() && (*(begin + 1 + i) == '-')) {
            IntIndex range = *(begin + 2 + i) - *(begin+i);

            for (IntIndex j = 0; j<= range; j++) {
                Utf8Char rangeChar = *(begin + i)+j;
                if (candidate == rangeChar) {
                    return true;
                }
            }
            i = i+3;
        } else {
            Utf8Char c = *(charSet->Begin()+i);
            if (c == candidate) {
                return true;
            }
            i++;
        }
    }
    return false;
}

//----------------------------------------------------------------------------------------------------
IntMax ScanIntBaseValues(char formatChar, char* beginPointer, char** endPointer)
{
    IntMax intValue = 0;
    switch (formatChar) {
        case 'x': {
                intValue = strtoull(beginPointer, endPointer, 16);
            }
            break;
        case 'd': {
                intValue = strtoll(beginPointer, endPointer, 10);
            }
            break;
        case 'u': {
                intValue = strtoull(beginPointer, endPointer, 10);
            }
            break;
        case 'b':
        case 'B': {
                intValue = strtoull(beginPointer, endPointer, 2);
            }
            break;
        case 'o': {
                intValue = strtoull(beginPointer, endPointer, 8);
            }
            break;
    }
    return intValue;
}

//----------------------------------------------------------------------------------------------------
IntMax ScanIntValues(char formatChar, char* beginPointer, char** endPointer)
{
    IntMax intValue = 0;
    switch (formatChar) {
        case 'x':
        case 'd':
        case 'u':
        case 'b':
        case 'B':
        case 'o': {
                intValue = ScanIntBaseValues(formatChar, beginPointer, endPointer);
            }
            break;
        case 'f':
        case 'e': {
                Double temp = strtold(beginPointer, endPointer);
                // or round to even
                intValue = (IntMax)temp;
            }
            break;
        default: {
                intValue = strtoull(beginPointer, endPointer, 10);
            }
            break;
    }

    return intValue;
}

static const char *validTrueValues[] = { "y", "t", "true", "on", "yes" };
static const char *validFalseValues[] = { "n", "f", "false", "off", "no" };

Boolean ScanBooleanValue(char* beginPointer, char** endPointer)
{
    SubString s(beginPointer);
    *endPointer = beginPointer;

    for (const char* trueValue : validTrueValues) {
        if (s.CompareCStrIgnoreCase(trueValue)) {
            *endPointer += strlen(trueValue);
            return true;
        }
    }

    for (const char* falseValue : validFalseValues) {
        if (s.CompareCStrIgnoreCase(falseValue)) {
            *endPointer += strlen(falseValue);
            return false;
        }
    }

    return false;
}

//----------------------------------------------------------------------------------------------------
void BooleanScanString(StaticTypeAndData* argument, TypeRef argumentType, char* beginPointer, char** endPointer)
{
    Boolean boolValue = ScanBooleanValue(beginPointer, endPointer);
    WriteIntToMemory(argumentType, argument->_pData, (IntMax)boolValue);
}

//----------------------------------------------------------------------------------------------------
void IntScanString(StaticTypeAndData* argument, TypeRef argumentType, char formatChar, char* beginPointer, char** endPointer)
{
    IntMax intValue = ScanIntValues(formatChar, beginPointer, endPointer);
    intValue = ConvertNumericRange(kEncoding_UInt, argumentType->TopAQSize(), intValue);
    WriteIntToMemory(argumentType, argument->_pData, intValue);
}

//----------------------------------------------------------------------------------------------------
void S2CIntScanString(StaticTypeAndData* argument, TypeRef argumentType, char formatChar, char* beginPointer, char** endPointer)
{
    IntMax intValue = ScanIntValues(formatChar, beginPointer, endPointer);
    intValue = ConvertNumericRange(kEncoding_S2CInt, argumentType->TopAQSize(), intValue);
    WriteIntToMemory(argumentType, argument->_pData, intValue);
}

//----------------------------------------------------------------------------------------------------
void DoubleScanString(StaticTypeAndData* argument, TypeRef argumentType, FixedHeapCArray<Utf8Char>* stringInput,
                      char formatChar, char decimalSeparator, char* beginPointer, char** endPointer, IntIndex offset = 0)
{
    Double doubleValue;
    IntMax intValue = 0;
    switch (formatChar) {
        case 'x':
        case 'd':
        case 'u':
        case 'b':
        case 'B':
        case 'o': {
                intValue = ScanIntBaseValues(formatChar, beginPointer, endPointer);
                doubleValue = Double(intValue);
            }
            break;
        case 'f':
        case 'e':
        case 'g':
        case 'p': {
                // replace comma if it exists with dot for strtold to be able to understand it.
                char* separator = strchr(beginPointer, decimalSeparator);
                char oldSeparator = decimalSeparator;
                if (separator) {
                    *separator = '.';
                }
                doubleValue = strtold(beginPointer, endPointer);
                if (separator) {
                    *separator = oldSeparator;
                }

                if (formatChar == 'p' && *endPointer != nullptr && *endPointer < ConstCStr(stringInput->End())) {
                    char siPrefixesTable[] = { 'y', 'z', 'a', 'f', 'p', 'n', 'u', 'm', '0', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' };
                    char prefix = **endPointer;
                    size_t i = 0;
                    for (; i < sizeof(siPrefixesTable); ++i)
                        if (siPrefixesTable[i] == prefix)
                            break;
                    if (i < sizeof(siPrefixesTable)) {
                        ++beginPointer;
                        doubleValue *= pow(10.0, (i - 8) * 3.0);
                    }
                }
            }
            break;
        default: {
                intValue = strtoll(beginPointer, endPointer, 10);
                doubleValue = Double(intValue);
            }
            break;
    }
    WriteDoubleToMemory(argumentType, (AQBlock1*)argument->_pData + offset, doubleValue);
}

//----------------------------------------------------------------------------------------------------
Boolean EnumScanString(SubString* in, StaticTypeAndData* argument, TypeRef argumentType, char formatChar, char* beginPointer, char** endPointer)
{
    Boolean found = false;
    if (formatChar == 's') {
        IntIndex longestMatchIndex = 0;
        IntIndex longestMatchLength = 0;
        for (IntIndex i = 0; i < argumentType->GetEnumItemCount(); i++) {
            SubString itemName = argumentType->GetEnumItemName(i)->MakeSubStringAlias();
            if (in->ComparePrefix(itemName.Begin(), itemName.Length())) {
                found = true;
                if (itemName.Length() > longestMatchLength) {
                    longestMatchIndex = i;
                    longestMatchLength = itemName.Length();
                }
            }
        }

        if (found) {
            IntMax intValue = longestMatchIndex;
            WriteIntToMemory(argumentType, argument->_pData, intValue);
            *endPointer = beginPointer + longestMatchLength;
        }
    } else {
        IntScanString(argument, argumentType, formatChar, beginPointer, endPointer);
        found = true;
    }

    return found;
}

void ComplexScanString(StaticTypeAndData* argument, TypeRef argumentType, FixedHeapCArray<Utf8Char>* stringInput,
    char formatChar, char decimalSeparator, char* beginPointer, char** endPointer) {
    bool clusterFormat = false;
    if (*beginPointer == '(') {
        ++beginPointer;
        clusterFormat = true;
    }
    DoubleScanString(argument, argumentType->GetSubElement(0), stringInput, formatChar, decimalSeparator, beginPointer, endPointer);
    beginPointer = *endPointer;
    while (isspace(*beginPointer))
        ++beginPointer;
    if (*beginPointer == '+')
        ++beginPointer;
    while (isspace(*beginPointer))
        ++beginPointer;
    DoubleScanString(argument, argumentType->GetSubElement(1), stringInput, formatChar, decimalSeparator,
                     beginPointer, endPointer, argumentType->GetSubElement(1)->ElementOffset());
    beginPointer = *endPointer;
    while (isspace(*beginPointer))
        ++beginPointer;
    if (!clusterFormat && (*beginPointer == 'i' || *beginPointer == 'I')) {
        ++beginPointer;
    } else {
        if (*beginPointer == ')')
            ++beginPointer;
    }
    *endPointer = beginPointer;
}

//----------------------------------------------------------------------------------------------------
Boolean TypedScanString(SubString* inputString, IntIndex* endToken, const FormatOptions* formatOptions, StaticTypeAndData* argument)
{
    if (argument == nullptr)
        return false;

    TypeRef argumentType = argument->_paramType;

    SubString in(inputString);
    if (formatOptions->MinimumFieldWidth > 0) {
        IntIndex leadingSpace = 0;
        for (IntIndex i = 0; i< in.Length(); i++) {
            if (isspace(*(in.Begin()+i))) {
                leadingSpace++;
            } else {
                break;
            }
        }
        in.AliasAssign(in.Begin(), in.Begin() + std::min(in.Length(), formatOptions->MinimumFieldWidth + leadingSpace));
    }
    FixedHeapCArray<Utf8Char> tempCStringInput(in.Length());
    tempCStringInput.Append(in.Begin(), in.Length());
    char* inpBegin = (char*)tempCStringInput.Begin();
    char* endPointer = nullptr;

    switch (argumentType->BitEncoding()) {
        case kEncoding_Boolean:
            BooleanScanString(argument, argumentType, inpBegin, &endPointer);
            break;
        case kEncoding_UInt:
            IntScanString(argument, argumentType, formatOptions->FormatChar, inpBegin, &endPointer);
            break;
        case kEncoding_Enum:
            if (!EnumScanString(&in, argument, argumentType, formatOptions->FormatChar, inpBegin, &endPointer))
                return false;
            break;
        case kEncoding_S2CInt:
        case kEncoding_DimInt:
            S2CIntScanString(argument, argumentType, formatOptions->FormatChar, inpBegin, &endPointer);
            break;
        case kEncoding_IEEE754Binary:
            DoubleScanString(argument, argumentType, &tempCStringInput, formatOptions->FormatChar, formatOptions->DecimalSeparator, inpBegin, &endPointer);
            break;
        case kEncoding_Array: {
            TypedArrayCoreRef* pArray = (TypedArrayCoreRef*)(argument->_pData);
            TypeRef elementType = (*pArray)->ElementType();
            EncodingEnum elementEncoding = elementType->BitEncoding();
            if (argumentType->Rank() == 1 && (elementEncoding == kEncoding_Ascii || elementEncoding == kEncoding_Unicode)) {
                if (formatOptions->FormatChar == 's') {
                    Boolean found = false;
                    char* start = (char*)in.Begin();
                    IntIndex stringStart = -1;
                    IntIndex i = 0;
                    for (i = 0; i < in.Length(); i++) {
                        char c = *(start + i);
                        if (found && isspace(c)) {
                            i--;
                            break;
                        }
                        if (!found && !isspace(c)) {
                            found = true;
                            stringStart = i;
                        }
                    }
                    if (!found) {
                        return false;
                    } else {
                        if (i == in.Length()) {
                            // reach the end of the input
                            i--;
                        }
                        if (formatOptions->MinimumFieldWidth > 0 && i+1-stringStart > formatOptions->MinimumFieldWidth) {
                            i = stringStart + formatOptions->MinimumFieldWidth - 1;
                        }
                        endPointer = inpBegin + i+1;
                        (*pArray)->Replace1D(0, i+1-stringStart, in.Begin()+stringStart, true);
                    }
                } else if (formatOptions->FormatChar == '[') {
                    SubString* charSet = (SubString*) &(formatOptions->FmtSubString);
                    charSet->AliasAssign(charSet->Begin()+1, charSet->End()-1);
                    if (charSet->Length() == 0) {
                        return false;
                    } else if (*((char *)charSet->Begin()) == '^') {
                        if (charSet->Length() == 1) {
                            return false;
                        } else {
                            Boolean found = false;
                            char* start = (char*)in.Begin();
                            IntIndex stringStart = -1;
                            IntIndex i = 0;
                            for (i = 0; i < in.Length(); i++) {
                                Utf8Char c = *(start + i);
                                if (found && BelongsToCharSet(charSet, c)) {
                                    i--;
                                    break;
                                }
                                if (!found && !BelongsToCharSet(charSet, c)) {
                                    found = true;
                                    stringStart = i;
                                }
                            }
                            if (!found) {
                                return false;
                            } else {
                                if (i == in.Length()) {
                                // reach the end of the input
                                    i--;
                                }
                                if (formatOptions->MinimumFieldWidth > 0 && i+1-stringStart > formatOptions->MinimumFieldWidth) {
                                    i = stringStart + formatOptions->MinimumFieldWidth - 1;
                                }
                                endPointer = inpBegin + i+1;
                                (*pArray)->Replace1D(0, i+1-stringStart, in.Begin()+stringStart, true);
                            }
                        }
                    } else {
                        Boolean found = false;
                        char* start = (char*)in.Begin();
                        IntIndex stringStart = -1;
                        IntIndex i = 0;
                        for (i = 0; i < in.Length(); i++) {
                            Utf8Char c = *(start + i);
                            if (found && !BelongsToCharSet(charSet, c)) {
                                i--;
                                break;
                            }
                            if (!found && BelongsToCharSet(charSet, c)) {
                                found = true;
                                stringStart = i;
                            }
                        }
                        if (!found) {
                            return false;
                        } else {
                            if (i == in.Length()) {
                            // reach the end of the input
                                i--;
                            }
                            if (formatOptions->MinimumFieldWidth > 0 && i+1-stringStart > formatOptions->MinimumFieldWidth) {
                                i = stringStart + formatOptions->MinimumFieldWidth - 1;
                            }
                            endPointer = inpBegin + i+1;
                            (*pArray)->Replace1D(0, i+1-stringStart, in.Begin()+stringStart, true);
                        }
                    }
                }
            } else {
                // doesn't support more complex array type
                return false;
            }
        }
            break;
        case kEncoding_Cluster:
        {
            if (argumentType->IsComplex())
                ComplexScanString(argument, argumentType, &tempCStringInput, formatOptions->FormatChar, formatOptions->DecimalSeparator, inpBegin, &endPointer);
        }
            break;
        default:
            // doesn't support this kind of data type yet.
            return false;
            break;
    }
    if (endPointer == nullptr || (endPointer == inpBegin)) {
        return false;
    }
    *endToken = (IntIndex)(endPointer-inpBegin);
    return true;
}
//---------------------------------------------------------------------------------------------
/*
 * The return value is the offset of the input string after the scan.
 * Several Special Scan rules:
 * */
Int32 FormatScan(SubString *input, SubString *format, Int32 argCount, StaticTypeAndData arguments[], ErrorCluster *errPtr)
{
    // the rules for ScanString in LabVIEW is a subset of the sscanf.
    // p will be treated as f;
    // binary should be processed.
    // should be very careful when try to parse a float with local decimal point

    IntIndex argumentIndex = 0;
    IntIndex filledItems = 0;
    char activeDecimalPoint = '.';
    Utf8Char c = 0;
    Utf8Char inputChar = 0;
    Boolean canScan = true;
    SubString f(format);
    const Utf8Char* origBegin = input->Begin();
    UInt32 offsetPastScan = 0;

    // if the format string is empty, use the auto format option (%g)
    if (f.Length() == 0) {
        const char* autoFormatString = "%g";
        f.AliasAssignCStr(autoFormatString);
    }

    while (canScan && f.ReadRawChar(&c)) {
        if (isspace(c)) {
            // eat all spaces
            const Utf8Char* begin = input->Begin();
            while (begin < input->End()) {
                if (isspace(*((char*)begin))) {
                    begin++;
                } else {
                    break;
                }
            }
            offsetPastScan += (begin - input->Begin());
            input->AliasAssign((Utf8Char*)begin, input->End());
        } else if (c == '%') {
            FormatOptions fOptions;
            Boolean parseFinished = false;
            if (ReadLocalizedDecimalSeparator(format, argCount, arguments, nullptr, &f, &canScan, &activeDecimalPoint, &parseFinished))
                continue;

            ReadPercentFormatOptions(&f, &fOptions);
            fOptions.DecimalSeparator = activeDecimalPoint;
            if (!fOptions.Valid) {
                parseFinished = true;
                canScan = false;
                SetFormatError(kFormatCodeUnknown, argumentIndex, fOptions.FormatChar, errPtr, true);
            } else if ((argumentIndex >= argCount && fOptions.ConsumeArgument) || input->Length() <= 0) {
                // Incorrect number of arguments provided for format string
                parseFinished = true;
                SetFormatError(kFormatTooManyFormatSpecs, argCount, fOptions.FormatChar, errPtr, true);
                input->AliasAssign(origBegin, input->End());
                offsetPastScan = 0;
            }
            IntIndex endPointer;
            while (!parseFinished) {
                StaticTypeAndData *pArg = (argumentIndex < argCount) ? &(arguments[argumentIndex]) : nullptr;
                parseFinished = true;
                switch (fOptions.FormatChar) {
                case 'b': case 'B':
                case 'd':
                case 'o': case 'u':
                case 'x': case 'X':
                {
                    canScan = TypedScanString(input, &endPointer, &fOptions, pArg);
                    if  (canScan) {
                        filledItems++;
                        input->AliasAssign(input->Begin()+endPointer, input->End());
                        offsetPastScan += endPointer;
                    } else {
                        TypeRef argType = pArg->_paramType;
                        if (!argType->IsNumeric() && !argType->IsBoolean() && !argType->IsA(&TypeCommon::TypeStaticTypeAndData))
                            SetFormatError(kFormatTypeMismatch, argumentIndex, fOptions.FormatChar, errPtr, true);
                        else
                            SetFormatError(kFormatScanFailed, argumentIndex, fOptions.FormatChar, errPtr, true);
                    }
                    argumentIndex++;
                }
                break;
                case 'g': case 'p':
                case 'e': case 'E':
                case 'f': case 'F':
                {
                    canScan = TypedScanString(input, &endPointer, &fOptions, pArg);
                    if (canScan) {
                        filledItems++;
                        input->AliasAssign(input->Begin()+endPointer, input->End());
                        offsetPastScan += endPointer;
                    } else {
                        SetFormatError(kFormatScanFailed, argumentIndex, fOptions.FormatChar, errPtr, true);
                    }
                    argumentIndex++;
                }
                break;
                case 's': case '[':
                {
                    canScan = TypedScanString(input, &endPointer, &fOptions, pArg);
                    if (canScan) {
                        filledItems++;
                        input->AliasAssign(input->Begin()+endPointer, input->End());
                        offsetPastScan += endPointer;
                    } else {
                        SetFormatError(kFormatScanFailed, argumentIndex, fOptions.FormatChar, errPtr, true);
                    }
                    argumentIndex++;
                }
                break;
                case 't':
                {
                    SubString datetimeFormat;
                    TempStackCString defaultTimeFormat;
                    Double relTimeSeconds = 0.0;
                    SubString timeInput = *input;
                    if (fOptions.FmtSubString.Length() > 1)
                        GetDateTimeFormatString(&datetimeFormat, fOptions, &defaultTimeFormat);
                    if (!arguments[argumentIndex]._paramType->IsNumeric()
                        || !StringToRelTime(&timeInput, &datetimeFormat, &relTimeSeconds)) {
                        SetFormatError(kFormatScanFailed, argumentIndex, fOptions.FormatChar, errPtr, true);
                    } else {
                        offsetPastScan += timeInput.Begin() - input->Begin();
                        input->AliasAssign(timeInput.Begin(), input->End());
                    }
                    WriteDoubleToMemory(arguments[argumentIndex]._paramType, arguments[argumentIndex]._pData, relTimeSeconds);
                    argumentIndex++;
                }
                break;
                case 'T':
                {
                    SubString datetimeFormat;
                    TempStackCString defaultTimeFormat;
                    Timestamp timestamp;
                    SubString timeInput = *input;
                    GetDateTimeFormatString(&datetimeFormat, fOptions, &defaultTimeFormat);
                    if (!StringToDateTime(&timeInput, fOptions.EngineerNotation, &datetimeFormat, &timestamp)) {
                        SetFormatError(kFormatScanFailed, argumentIndex, fOptions.FormatChar, errPtr, true);
                    } else {
                        offsetPastScan += timeInput.Begin() - input->Begin();
                        input->AliasAssign(timeInput.Begin(), input->End());
                        if (arguments[argumentIndex]._paramType->IsTimestamp()) {
                            *((Timestamp*)arguments[argumentIndex]._pData) = timestamp;
                        } else {
                            Double doubleTime = timestamp.ToDouble();
                            WriteDoubleToMemory(arguments[argumentIndex]._paramType, arguments[argumentIndex]._pData, doubleTime);
                        }
                    }
                    argumentIndex++;
                }
                break;
                case '%': {    //%%
                    input->ReadRawChar(&inputChar);
                    ++offsetPastScan;
                    if (inputChar != '%') {
                        canScan = false;
                    }
                }
                break;
                default: {
                    canScan = false;
                    SetFormatError(kFormatScanFailed, argumentIndex, fOptions.FormatChar, errPtr, true);
                }
                break;
                }
             }
        } else {
            if (input->ReadRawChar(&inputChar)) {
                ++offsetPastScan;
                if (inputChar != c) {
                    canScan = false;
                    input->AliasAssign(input->Begin()-1, input->End());
                    --offsetPastScan;
                }
            } else {
                canScan = false;
                SetFormatError(kFormatScanFailed, argumentIndex, 0, errPtr, true);
            }
        }
    }
    if (canScan && argumentIndex < argCount) {
        // make sure at least all of the args are used (even if out of order)
        SetFormatError(kFormatTooFewFormatSpecs, argCount - argumentIndex, 0, errPtr, true);
        input->AliasAssign(origBegin, input->End());
        offsetPastScan = 0;
    }
    return offsetPastScan;
}
//-------------------------------------------------------------
/**
 *case 1 The format length is 0:
 *         In labview FormatValue function:
 *             print the value as %f no matter what the data type it is.
 *         In Format into String function:
 *            print the value with the proper format code according to the data type.
 *                 %f for float, %d for int. etc.
 *case 2 The format contains only non-format code character. e.g. "  asvasd ":
 *         In labview FormatValue function:
 *             append the format string to the output no value String is printed.
 *         In Format into String function:
 *             will get the too few specifier error!.
 *case 3 The first format code is not valid:
 *         In labview Format Value function:
 *             Parse the format code end stop at the invalid position. then print the value as in case 1.
 *             And append the remaining part of the format code.
 *         In labview Format into String function:
 *             throw the error. Report which argument the parsing has stopped at.
 *case 4 The format string contains more format code that needed. The needed format code is correct.
 *        In labview Format Value function:
 *            Only recognize the first format code and append the entire remaining format string to the printed value string.
 *        In labview Format Into String function:
 *            Whether the extra format codes is valid ot not, the function doesn't output anything, Just throw the error.
 *case 5 The format code and the type of the input value doesn't match
 *        In labview Format Value function:
 *            Use the Type conversion to convert the input value to the correct data type. Then print it.
 *        In labview Format intoString function:
 *        case 5.1 complex double as the numeric
 *            If the  data type of the input value is complex, the print value should print both the real part and imaginary part.
 *        case 5.2 string as numeric %d , %f
 *            Will not accept this case, throw the error.
 *case 6 The length specifier
 *        In LV Format Value function:
 *            'h' 'l' is supported for %d and %f .. numeric type.
 *        In LV Format into String function:
 *            'h' is not supported.
 * */
//---------------------------------------------------------------------
void defaultFormatValue(StringRef output,  StringRef formatString, StaticTypeAndData Value)
{
    SubString format = formatString->MakeSubStringAlias();
    Utf8Char c = 0;
    SubString remainingFormat;
    TempStackCString tempformat;

    if (format.Length() == 0) {
        DefaultFormatCode(1, &Value, &tempformat);
    } else {
        Utf8Char* index = nullptr;
        while (format.ReadRawChar(&c)) {
            index = (Utf8Char*)format.Begin();
            if (c == '%') {
                FormatOptions fOptions;
                ReadPercentFormatOptions(&format, &fOptions);
                if (!fOptions.Valid) {
                    remainingFormat.AliasAssign(format.Begin(), format.End());
                    format.AliasAssign(formatString->Begin(), index);
                    tempformat.Append(&format);
                    DefaultFormatCode(1, &Value, &tempformat);
                    break;
                } else if (fOptions.ConsumeArgument) {
                    remainingFormat.AliasAssign(format.Begin(), format.End());
                    format.AliasAssign(formatString->Begin(), format.Begin());
                    tempformat.Append(&format);
                    break;
                }
            } else {
            }
        }
    }
    SubString labviewFormat(kLabVIEWEncoding);
    format.AliasAssign(tempformat.Begin(), tempformat.End());
    Format(&format, 1, &Value, output, nullptr);
    output->AppendSubString(&remainingFormat);
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(StringFormatValue, StringRef, StringRef, StaticType, void)
{
    StringRef output = _Param(0);
    StringRef formatString = _Param(1);
    StaticTypeAndData Value = {_ParamPointer(2), _ParamPointer(3)};
    defaultFormatValue(output, formatString, Value);

    return _NextInstruction();
}

//------------------------------------------------------------
struct StringFormatParamBlock : VarArgInstruction
{
    _ParamDef(StringRef, StringOut);
    _ParamDef(StringRef, StringFormat);
    _ParamDef(ErrorCluster, ErrClust);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(StringFormat, StringFormatParamBlock) {
    Int32 count = (_ParamVarArgCount() -3)/2;
    StaticTypeAndData *arguments =  _ParamImmediate(argument1);
    SubString format;
    if (_ParamPointer(StringFormat)) {
        format = _Param(StringFormat)->MakeSubStringAlias();
    }
    TempStackCString tempformat;
    if (format.Length() == 0) {
        DefaultFormatCode(count, arguments, &tempformat);
        format.AliasAssign(tempformat.Begin(), tempformat.End());
    }
    StringRef buffer = _Param(StringOut);
    ErrorCluster *errPtr = _ParamPointer(ErrClust);
    if (!errPtr || !errPtr->status) {
        SubString labviewFormat(kLabVIEWEncoding);
        Format(&format, count, arguments, buffer, errPtr, &labviewFormat);
    }
    return _NextInstruction();
}

/*
 * The scan function:
 *         case 1: must have format string
 *         case 2: invalid input format code
 *             scan value will not influence the output
 *             scan string will throw the error.
 *         case 3: The format code and the output value doesn't match.
 *            Parse the value according the format code. Then convert the parsed value to the output type. The default output type is double.
 *            The LabVIEW will automatically change the output value when your wire a input with the different input.
 *            e.g."10.85" %f -> int 11.0
 *                "10.85" %d -> int 10
 *                "10.85" %d ->double 10
 *            be careful, the conversion means different from the conversion in C++.
 *            It only reach the max value or min value.
 *            Be careful, complex double only support %f,
 *            if you use the %d, it only read the int.
 *
 * */
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(StringScanValue, StringRef, StringRef, StringRef, StaticType, void)
{
    StringRef inputString = _Param(0);
    StringRef remainingString = _Param(1);
    StringRef formatString = _Param(2);
    SubString format = formatString->MakeSubStringAlias();
    StaticTypeAndData Value =  {_ParamPointer(3), _ParamPointer(4)};
    SubString input = inputString->MakeSubStringAlias();
    FormatScan(&input, &format, 1, &Value, nullptr);
    if (remainingString != nullptr) {
        remainingString->Resize1D(input.Length());
        TypeRef elementType = remainingString->ElementType();
        elementType->CopyData(input.Begin(), remainingString->Begin(), input.Length());
    }
    return _NextInstruction();
}

static void MakeFormatString(StringRef format, ErrorCluster *error, Int32 argCount, StaticTypeAndData arguments[])
{
    for (Int32 i = 0; i < argCount; i++) {
        TypeRef argType = arguments[i]._paramType;
        if (argType->IsString() || argType->IsBoolean() || argType->IsEnum()) {
            format->AppendCStr("%s ");
        } else if (argType->IsNumeric()) {
            if (argType->IsFloat()) {
                format->AppendCStr("%f ");
            } else if (argType->BitEncoding() == kEncoding_UInt) {
                format->AppendCStr("%u ");
            } else {
                format->AppendCStr("%d ");
            }
        } else if (argType->IsTimestamp()) {
            format->AppendCStr("%T ");
        } else if (error) {
            error->code = -1;  // TODO(sanmut): ErrorCluster fix error codes
            error->status = true;
            break;
        }
        if (error && !error->status && format->Length() > 255) {
            error->code = -1;  // TODO(sanmut): ErrorCluster fix error codes
            error->status = true;
            break;
        }
    }
    if (!error || !error->status) {
        int len = format->Length();
        if (len > 0) {
            format->Remove1D(len - 1, 1);
        }
    }
}

//------------------------------------------------------------
struct StringScanParamBlock : VarArgInstruction
{
    _ParamDef(StringRef, StringInput);
    _ParamDef(StringRef, StringRemaining);
    _ParamDef(StringRef, StringFormat);
    _ParamDef(UInt32, InitialPos);
    _ParamDef(UInt32, OffsetPast);
    _ParamDef(ErrorCluster, ErrClust);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATUREV(StringScan, StringScanParamBlock)
{
    SubString input = _Param(StringInput)->MakeSubStringAlias();
    SubString format;
    if (_ParamPointer(StringFormat)) {
        format = _Param(StringFormat)->MakeSubStringAlias();
    }
    Int32 initPos = _ParamPointer(InitialPos) ? _Param(InitialPos) : 0;
    if (input.Begin() + initPos >= input.End())
        initPos = input.End() - input.Begin();
    input.AliasAssign(input.Begin() + initPos, input.End());
    UInt32 newOffset = initPos;
    StaticTypeAndData *arguments =  _ParamImmediate(argument1);
    ErrorCluster *errPtr = _ParamPointer(ErrClust);

    // Calculate number of parameters.
    // Each scan parameters has both type and data.
    Int32 argCount = (_ParamVarArgCount() - 6) / 2;
    STACK_VAR(String, tempFormat);
    if (!errPtr || !errPtr->status) {
        if (format.Length() == 0) {
            MakeFormatString(tempFormat.Value, errPtr, argCount, arguments);
            format.AliasAssignCStrLen(reinterpret_cast<ConstCStr>(tempFormat.Value->Begin()), tempFormat.Value->Capacity());
        }
        newOffset += FormatScan(&input, &format, argCount, arguments, errPtr);
    }
    if (_ParamPointer(OffsetPast))
        _Param(OffsetPast) = newOffset;
    if (_ParamPointer(StringRemaining)) {
        _Param(StringRemaining)->Resize1D(input.Length());
        TypeRef elementType = _Param(StringRemaining)->ElementType();
        elementType->CopyData(input.Begin(), _Param(StringRemaining)->Begin(), input.Length());
    }
    return _NextInstruction();
}

struct ByteArrayToStringParamBlock : InstructionCore
{
    _ParamDef(TypedArrayCoreRef, ByteArrayIn);
    _ParamDef(UInt16, StringEncodingIn);  // 0 = UTF-8 (only supported)
    _ParamDef(StringRef, StringOut);
    _ParamDef(ErrorCluster, ErrorInOut);
    NEXT_INSTRUCTION_METHOD()
};

static bool CheckUnsupportedEncodingError(ErrorCluster* errorCluster, UInt16 stringEncoding, TypedArrayCoreRef outputArray) {
    if (stringEncoding != 0) {
        if (errorCluster != nullptr) {
            errorCluster->SetErrorAndAppendCallChain(true, 1, "Encoding type not supported");
        }
        if (outputArray != nullptr)
            outputArray->Resize1D(0);
        return false;
    }
    return true;
}

static bool CheckValidUTF8Error(UInt8* begin, UInt8* end, ErrorCluster* errorCluster)
{
    if (!utf8::is_valid(begin, end)) {
        if (errorCluster != nullptr) {
            errorCluster->SetErrorAndAppendCallChain(true, 1, "Invalid UTF-8 characters found");
        }
        return false;
    }
    return true;
}

VIREO_FUNCTION_SIGNATURET(ByteArrayToString, ByteArrayToStringParamBlock)
{
    StringRef stringOut = _ParamPointer(StringOut) ? _Param(StringOut) : nullptr;
    ErrorCluster *errorCluster = _ParamPointer(ErrorInOut);
    if ((stringOut == nullptr && errorCluster == nullptr) || (errorCluster != nullptr && errorCluster->hasError()))
        return _NextInstruction();
    TypedArrayCoreRef byteArray = _Param(ByteArrayIn);
    TypeRef eltType = byteArray->ElementType();
    if (!eltType->IsA(&TypeCommon::TypeInt8) && !eltType->IsA(&TypeCommon::TypeUInt8)) {
        if (errorCluster != nullptr) {
            errorCluster->SetErrorAndAppendCallChain(true, 1, "Byte Array must be of type Int8 or UInt8");
        }
        return _NextInstruction();
    }
    IntIndex rank = byteArray->Rank();
    VIREO_ASSERT(rank == 1);
    UInt16 stringEncoding = _ParamPointer(StringEncodingIn) ? _Param(StringEncodingIn) : 0;
    Int32 arrayLength = byteArray->DimensionLengths()[0];
    if (!CheckUnsupportedEncodingError(errorCluster, stringEncoding, stringOut)) {
        return _NextInstruction();
    }
    if (!CheckValidUTF8Error(byteArray->RawBegin(), byteArray->RawBegin() + arrayLength, errorCluster)) {
        if (stringOut != nullptr)
            stringOut->Resize1D(0);
        return _NextInstruction();
    }
    stringOut->Replace1D(0, arrayLength, byteArray->RawBegin(), true);
    return _NextInstruction();
}

struct StringToByteArrayParamBlock : InstructionCore
{
    _ParamDef(StringRef, StringIn);
    _ParamDef(UInt16, StringEncodingIn);  // 0 = UTF-8 (only supported)
    _ParamDef(TypedArrayCoreRef, ByteArrayOut);
    _ParamDef(ErrorCluster, ErrorInOut);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(StringToByteArray, StringToByteArrayParamBlock)
{
    StringRef stringIn = _Param(StringIn);
    TypedArrayCoreRef byteArrayOut = _ParamPointer(ByteArrayOut) ? _Param(ByteArrayOut) : nullptr;
    ErrorCluster *errorCluster = _ParamPointer(ErrorInOut);
    if ((byteArrayOut == nullptr && errorCluster == nullptr) || (errorCluster != nullptr && errorCluster->hasError()))
        return _NextInstruction();
    UInt16 stringEncoding = _ParamPointer(StringEncodingIn) ? _Param(StringEncodingIn) : 0;
    if (!CheckUnsupportedEncodingError(errorCluster, stringEncoding, byteArrayOut)) {
        // If LV got string from an external source, it is possible the string may have
        // invalid characters for the chosen encoding. Unless and until we are sure that the LV string
        // is guaranteed to have only valid characters of chosen encoding, this is a useful debugging tool
        // to test LV strings with invalid characters by checking error cluster.
        return _NextInstruction();
    }
    const Int32 stringLength = stringIn->Length();
    if (errorCluster != nullptr) {
        // If the user did not pass errorCluster, no need to validate the string, as we are copying
        // to byteArrayOut unconditionally
        CheckValidUTF8Error(stringIn->RawBegin(), stringIn->RawBegin() + stringLength, errorCluster);
    }
    if (byteArrayOut != nullptr) {
        IntIndex rank = byteArrayOut->Rank();
        VIREO_ASSERT(rank == 1);
        TypeRef eltType = byteArrayOut->ElementType();
        if (!eltType->IsA(&TypeCommon::TypeUInt8)) {
            if (errorCluster != nullptr) {
                errorCluster->SetErrorAndAppendCallChain(true, 1, "Byte Array must be of type UInt8");
            }
        } else {
            // Even if invalid UTF-8 characters are found, we want to copy to byteArrayOut to allow users to examine
            byteArrayOut->Replace1D(0, stringLength, stringIn->RawBegin(), true);
        }
    }
    return _NextInstruction();
}

//------------------------------------------------------------
#if defined(VIREO_TIME_FORMATTING)
//------------------------------------------------------------
struct TimeFormatOptions {
    Boolean RemoveLeading;  // #
    Boolean Valid;
    char    FormatChar;         // my affect output 'x' or 'X'
    char OriginalFormatChar;
    Int32   MinimumFieldWidth;  // If zero no padding
    Int32   Precision;  // .3
    SubString  FmtSubString;
    Boolean ConsumeArgument;
};

//------------------------------------------------------------
void ReadTimeFormatOptions(SubString *format, TimeFormatOptions* pOption)
{
    pOption->RemoveLeading = false;
    pOption->Valid = true;
    pOption->MinimumFieldWidth = -1;
    pOption->Precision = -1;
    pOption->ConsumeArgument = true;
    Boolean bValid = true;
    Utf8Char c;
    const Utf8Char* pBegin = format->Begin();

    while (bValid && format->ReadRawChar(&c)) {
        if (strchr("aAbBcdDHIjmMpSuUwWxXyYzZ%", c)) {
            pOption->FormatChar = c;
            break;
        }
        if (c == '#') {
            pOption->RemoveLeading = true;
        } else if (c == '.') {
            IntMax value = 0;
            if (format->ReadInt(&value)) {
                pOption->Precision = (Int32)value;
                if (format->Length() == 0) {
                    bValid = false;
                }
            } else {
                bValid = false;
            }
        } else {
            if (c >= '0' && c <= '9') {
                // Back up and read the whole number.
                format->AliasAssign(format->Begin()-1, format->End());
                IntMax value = 0;
                if (format->ReadInt(&value)) {
                    pOption->MinimumFieldWidth = (Int32) value;
                }
            } else {
                bValid = false;
                break;
            }
        }
    }
    pOption->Valid = bValid;
    if (!pOption->Valid) {
        pOption->FormatChar = '0';
    }
    pOption->ConsumeArgument = (pOption->FormatChar != '%');
    pOption->OriginalFormatChar = pOption->FormatChar;
    pOption->FmtSubString.AliasAssign(pBegin, format->Begin());
}

static const char *abbrWeekDayName[] = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", nullptr };
static const char *weekDayName[] = { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", nullptr };
static const char *abbrMonthName[] = { "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec", nullptr };
static const char *monthName[] = { "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December", nullptr };

// Expand 'c', 'X', or 'x' time format codes to it's longform equivalent
static void ExpandDateTimeCode(const TimeFormatOptions &fOption, TempStackCString *localeFormatString, SubString *formatSubString) {
    if (fOption.FormatChar == 'c') {
        localeFormatString->AppendCStr("%");
        localeFormatString->Append(formatSubString);
        localeFormatString->AppendCStr("x %");
        localeFormatString->Append(formatSubString);
        localeFormatString->AppendCStr("X");
    } else if (fOption.FormatChar == 'x') {
        if (fOption.Precision == 1) {
            localeFormatString->AppendCStr("%A, %B %d, %Y");
        } else if (fOption.Precision == 2) {
            localeFormatString->AppendCStr("%a, %b %d, %Y");
        } else {
            // to do locale specific format
            if (fOption.RemoveLeading) {
                localeFormatString->AppendCStr("%#m/%#d/%Y");
            } else {
                localeFormatString->AppendCStr("%m/%d/%Y");
            }
        }
    } else if (fOption.FormatChar == 'X') {
        Int32 fractionLen = 0;
        if (fOption.MinimumFieldWidth >= 0) {
            fractionLen = fOption.MinimumFieldWidth;
        }
        if (fOption.Precision >= 0) {
            fractionLen = fOption.Precision;
        }
        localeFormatString->AppendCStr("%#I:%M:%S");
        if (fractionLen > 0) {
            char fractionPart[kTempCStringLength];
            snprintf(fractionPart, sizeof(fractionPart), "%%.%du", (int)fractionLen);
            localeFormatString->AppendCStr(fractionPart);
        }
        localeFormatString->AppendCStr(" %p");
    }
}

static void AppendFractionalSecond(StringRef output, Double fracSec, const TimeFormatOptions &fOption, char decimalSeparator) {
    char fractionString[10];
    Int32 size = 0;
    Int32 fractionLen = 0;
    if (fOption.MinimumFieldWidth >= 0)
        fractionLen = fOption.MinimumFieldWidth;
    if (fOption.Precision >= 0)
        fractionLen = fOption.Precision;
    if (fractionLen <= 0) {
        char buffer[2] = { decimalSeparator, '\0' };
        output->AppendCStr(buffer);
    } else {
        size = snprintf(fractionString, sizeof(fractionString), "%.*f", (int)fractionLen, fracSec);
        char* dot = strchr(fractionString, '.');
        if (dot)
            *dot = decimalSeparator;
        output->Append(size-1, (Utf8Char*)fractionString+1);
    }
}

//------------------------------------------------------------
Boolean RelTimeToString(Double relTimeSeconds, SubString* format, StringRef output) {
    Boolean validFormatString = true;
    Int64 seconds = Int64(relTimeSeconds);
    Int64 weeks = 0, days = 0, hours = 0, minutes = 0;
    Int32 pass;
    bool hasWeeks = false, hasDays = false, hasHours = false, hasMinutes = false;

    for (pass = 0; pass < 2; ++pass) {
        SubString tempFormat(format);
        Utf8Char c = 0;
        char decimalSeparator = '.';
        if (relTimeSeconds < 0) {
            if (pass)
                output->Append(1, (Utf8Char*)"-");
            else
                seconds = -seconds;
        }
        while (validFormatString && tempFormat.ReadRawChar(&c)) {
            if (c == '%') {
                TimeFormatOptions fOption;
                if (ReadLocalizedDecimalSeparator(&tempFormat, 0, nullptr, nullptr, &tempFormat, &validFormatString, &decimalSeparator, nullptr))
                    continue;
                ReadTimeFormatOptions(&tempFormat, &fOption);
                if (fOption.Valid) {
                    Int32 size = 0;
                    char outbuf[16];
                    const char *outFormatStr = "%02lld";
                    if (fOption.RemoveLeading)
                        outFormatStr = "%lld";
                    switch (fOption.FormatChar) {
                        case 'W':
                            if (pass) {
                                size = snprintf(outbuf, sizeof(outbuf), outFormatStr, weeks);
                                output->Append(size, (Utf8Char*)outbuf);
                            }
                            hasWeeks = true;
                        break;
                        case 'D':
                            if (pass) {
                                size = snprintf(outbuf, sizeof(outbuf), outFormatStr, days);
                                output->Append(size, (Utf8Char*)outbuf);
                            }
                            hasDays = true;
                        break;
                        case 'H':
                            if (pass) {
                                size = snprintf(outbuf, sizeof(outbuf), outFormatStr, hours);
                                output->Append(size, (Utf8Char*)outbuf);
                            }
                            hasHours = true;
                        break;
                        case 'M':
                            if (pass) {
                                size = snprintf(outbuf, sizeof(outbuf), outFormatStr, minutes);
                                output->Append(size, (Utf8Char*)outbuf);
                            }
                            hasMinutes = true;
                        break;
                        case 'S':
                            if (pass) {
                                size = snprintf(outbuf, sizeof(outbuf), outFormatStr, seconds);
                                output->Append(size, (Utf8Char*)outbuf);
                            }
                        break;
                        case 'u':
                        {
                            if (pass) {
                                if (relTimeSeconds < 0)
                                    relTimeSeconds = -relTimeSeconds;
                                Double fracSec = relTimeSeconds - Int64(relTimeSeconds);
                                AppendFractionalSecond(output, fracSec, fOption, decimalSeparator);
                            }
                        }
                        break;
                    }
                }
            } else if (pass) {
                output->Append(c);
            }
        }
        if (pass == 0) {
            if (hasWeeks) {
                weeks = Int32(seconds / kSecondsPerWeek);
                seconds -= weeks * kSecondsPerWeek;
            }
            if (hasDays) {
                days = Int32(seconds / kSecondsPerDay);
                seconds -= days * kSecondsPerDay;
            }
            if (hasHours) {
                hours = Int32(seconds / kSecondsPerHour);
                seconds -= hours * kSecondsPerHour;
            }
            if (hasMinutes) {
                minutes = Int32(seconds / kSecondsPerMinute);
                seconds -= minutes * kSecondsPerMinute;
            }
        }
    }
    return validFormatString;
}

//------------------------------------------------------------
Boolean DateTimeToString(const Date& date, Boolean isUTC, SubString* format, StringRef output)
{
    TempStackCString formatString;
    SubString tempFormat(format);
    if (format == nullptr || format->Length() == 0) {
        formatString.AppendCStr("%x %X");
        tempFormat.AliasAssign(formatString.Begin(), formatString.End());
    }

    Utf8Char c = 0;
    Boolean validFormatString = true;
    Int32 hourFormat = 0;
    char decimalSeparator = '.';
    while (validFormatString && tempFormat.ReadRawChar(&c)) {
        if (c == '%') {
            TimeFormatOptions fOption;
            Boolean parseFinished = false;
            if (ReadLocalizedDecimalSeparator(&tempFormat, 0, nullptr, nullptr, &tempFormat, &validFormatString, &decimalSeparator, &parseFinished))
                continue;
            ReadTimeFormatOptions(&tempFormat, &fOption);
            parseFinished = !fOption.Valid;
            while (!parseFinished) {
                parseFinished = true;
                switch (fOption.FormatChar) {
                    case 'a' : case 'A':
                    {
                        Int32 index = date.WeekDay();
                        fOption.FormatChar == 'a' ? output->AppendCStr(abbrWeekDayName[index]) : output->AppendCStr(weekDayName[index]);
                    }
                    break;
                    case 'b': case 'B':
                    {
                        Int32 index = date.Month();
                        fOption.FormatChar == 'b' ? output->AppendCStr(abbrMonthName[index]) : output->AppendCStr(monthName[index]);
                    }
                    break;
                    case 'c':
                    {
                        hourFormat = 12;
                        TempStackCString localeFormatString;
                        SubString formatSubString(fOption.FmtSubString.Begin(), fOption.FmtSubString.End()-1);
                        ExpandDateTimeCode(fOption, &localeFormatString, &formatSubString);
                        SubString localformat(localeFormatString.Begin(), localeFormatString.End());
                        validFormatString = DateTimeToString(date, isUTC, &localformat, output);
                    }
                        break;
                    case 'd':
                    {
                        char days[10];
                        Int32 size = 0;
                        if (fOption.RemoveLeading) {
                            size = snprintf(days, sizeof(days), "%d", (int)(date.Day()));
                        } else {
                            size = snprintf(days,  sizeof(days), "%02d", (int)(date.Day()));
                        }
                        output->Append(size, (Utf8Char*)days);
                    }
                        break;
                    case 'H':
                    {
                        char hours[10];
                        Int32 size = 0;
                        if (fOption.RemoveLeading) {
                            size = snprintf(hours, sizeof(hours), "%d", (int)date.Hour());
                        } else {
                            size = snprintf(hours, sizeof(hours), "%02d", (int)date.Hour());
                        }
                        hourFormat = 24;
                        output->Append(size, (Utf8Char*)hours);
                    }
                        break;
                    case 'I':
                    {
                        char hours12String[10];
                        Int32 size = 0;
                        Int32 hour12 = (date.Hour() > 12) ? (date.Hour() - 12) : date.Hour();
                        hour12 = hour12 == 0? 12:hour12;
                        if (fOption.RemoveLeading) {
                            size = snprintf(hours12String, sizeof(hours12String), "%d", (int)hour12);
                        } else {
                            size = snprintf(hours12String, sizeof(hours12String), "%02d", (int)hour12);
                        }
                        hourFormat = 12;
                        output->Append(size, (Utf8Char*)hours12String);
                    }
                        break;
                    case 'j':
                    {
                        char dayNumberString[10];
                        Int32 size = 0;
                        Int32 daynumber = (Int32) (1+date.SecondsOfYear()/(24*3600));
                        if (fOption.RemoveLeading) {
                            size = snprintf(dayNumberString, sizeof(dayNumberString), "%d", (int)daynumber);
                        } else {
                            size = snprintf(dayNumberString, sizeof(dayNumberString), "%03d", (int)daynumber);
                        }
                        output->Append(size, (Utf8Char*)dayNumberString);
                    }
                        break;
                    case 'm':
                    {
                        char monthString[10];
                        Int32 size = 0;
                        Int32 monthofYear = 1 + date.Month();
                        if (fOption.RemoveLeading) {
                            size = snprintf(monthString, sizeof(monthString), "%d", (int)monthofYear);
                        } else {
                            size = snprintf(monthString, sizeof(monthString), "%02d", (int)monthofYear);
                        }
                        output->Append(size, (Utf8Char*)monthString);
                    }
                        break;
                    case 'M':
                    {
                        char minuteString[10];
                        Int32 size = 0;
                        Int32 minute = date.Minute();
                        if (fOption.RemoveLeading) {
                            size = snprintf(minuteString, sizeof(minuteString), "%d", (int)minute);
                        } else {
                            size = snprintf(minuteString, sizeof(minuteString), "%02d", (int)minute);
                        }
                        output->Append(size, (Utf8Char*)minuteString);
                    }
                        break;
                    case 'p':
                        if (hourFormat == 12) {
                            (date.Hour() < 12) ? output->AppendCStr("AM") : output->AppendCStr("PM");
                        }
                        break;
                    case 'S':
                    {
                        char secondString[10];
                        Int32 size = 0;
                        Int32 second = date.Second();
                        if (fOption.RemoveLeading) {
                            size = snprintf(secondString, sizeof(secondString), "%d", (int)second);
                        } else {
                            size = snprintf(secondString, sizeof(secondString), "%02d", (int)second);
                        }
                        output->Append(size, (Utf8Char*)secondString);
                    }
                        break;
                    case 'u':
                    {
                        AppendFractionalSecond(output, date.FractionalSecond(), fOption, decimalSeparator);
                    }
                        break;
                    case 'W':
                    {
                        char weekNumberString[10];
                        Int32 size = 0;
                        Int32 weekofyear = 0;
                        // First Monday as week one.
                        Int32 firstWeekDay = (date.FirstWeekDay()+6)%7;
                        if (firstWeekDay == 0)
                            firstWeekDay = 7;
                        weekofyear = (Int32) ((date.SecondsOfYear()/(24*3600) + firstWeekDay)/7);
                        if (fOption.RemoveLeading) {
                            size = snprintf(weekNumberString, sizeof(weekNumberString), "%d", (int)weekofyear);
                        } else {
                            size = snprintf(weekNumberString, sizeof(weekNumberString), "%02d", (int)weekofyear);
                        }
                        output->Append(size, (Utf8Char*)weekNumberString);
                    }
                        break;
                    case 'w':
                    {
                        char weekday[10];
                        Int32 size = 0;
                        size = snprintf(weekday, sizeof(weekday), "%d", (int)((date.WeekDay()/*+1*/)%7));
                        output->Append(size, (Utf8Char*)weekday);
                    }
                        break;
                    case 'U':
                    {
                        char weekNumberString[10];
                        Int32 size = 0;
                        Int32 weekofyear = 0;
                        // First Sunday as week one.
                        Int32 firstWeekDay = date.FirstWeekDay();
                        if (firstWeekDay == 0)
                            firstWeekDay = 7;
                        weekofyear = (Int32) ((date.SecondsOfYear()/(24*3600) + firstWeekDay)/7);
                        if (fOption.RemoveLeading) {
                            size = snprintf(weekNumberString, sizeof(weekNumberString), "%d", (int)weekofyear);
                        } else {
                            size = snprintf(weekNumberString, sizeof(weekNumberString), "%02d", (int)weekofyear);
                        }
                        output->Append(size, (Utf8Char*)weekNumberString);
                    }
                        break;
                    case 'X':
                        hourFormat = 12;  // fall through...
                    case 'x':
                    {
                        TempStackCString localeFormatString;
                        ExpandDateTimeCode(fOption, &localeFormatString, nullptr);
                        SubString localformat(localeFormatString.Begin(), localeFormatString.End());
                        validFormatString = DateTimeToString(date, isUTC, &localformat, output);
                    }
                        break;
                        break;
                    case 'y':
                    {
                        char yearString[64];
                        Int32 size = 0;
                        Int32 year = date.Year() % 100;
                        if (fOption.RemoveLeading) {
                            size = snprintf(yearString, sizeof(yearString), "%d", (int)year);
                        } else {
                            size = snprintf(yearString, sizeof(yearString), "%02d", (int)year);
                        }
                        output->Append(size, (Utf8Char*)yearString);
                    }
                        break;
                    case 'Y':
                    {
                        char yearString[64];
                        Int32 size = 0;
                        Int32 year = date.Year();
                        if (fOption.RemoveLeading) {
                            size = snprintf(yearString, sizeof(yearString), "%d", (int)year);
                        } else {
                            size = snprintf(yearString, sizeof(yearString), "%04d", (int)year);
                        }
                        output->Append(size, (Utf8Char*)yearString);
                    }
                        break;
                    case 'z':
                    {
                        Int32 hourdiff = date.TimeZoneOffset() / 3600;
                        Int32 totalSeconds = date.TimeZoneOffset() % 3600;
                        totalSeconds = totalSeconds < 0 ? -totalSeconds : totalSeconds;
                        Int32 mindiff = totalSeconds / 60;
                        Int32 seconddiff = totalSeconds % 60;
                        char difference[64];
                        Int32 size = 0;
                        if (hourdiff < 0) {
                            size = snprintf(difference, sizeof(difference), "%03d:%02d:%02d", (int)hourdiff, (int)mindiff, (int)seconddiff);
                        } else {
                            size = snprintf(difference, sizeof(difference), "%02d:%02d:%02d", (int)hourdiff, (int)mindiff, (int)seconddiff);
                        }
                        output->Append(size, (Utf8Char*)difference);
                    }
                        break;
                    case 'Z':
                    {
                        if (isUTC)
                            output->AppendCStr("UTC");
                        else
                            output->AppendCStr(date.TimeZoneString());
                    }
                        break;
                    default:
                        break;
                }
            }
        } else {
            output->Append(c);
        }
    }
    return validFormatString;
}

static inline Boolean ReadDateTimeValue(SubString *input, Int32 *value, Int32 minLen, Int32 maxLen, Int32 minVal, Int32 maxVal) {
    const Utf8Char *begin = input->Begin(), *end = input->End();
    if (maxLen > 0 && end - begin > maxLen)
        end = begin + maxLen;
    Int32 charCount = 0;
    *value = 0;
    while (begin < end) {
        Int32 cValue = input->DigitValue(*begin, 10);
        if (cValue >= 0) {
            begin++;
            *value = (*value * 10) + cValue;
        } else {
            break;
        }
        ++charCount;
    }
    if (*value < minVal)
        *value = minVal;
    else if (maxVal > 0 && *value > maxVal)
        *value = maxVal;
    if (charCount < minLen)
        return false;
    input->AliasAssign(begin, input->End());
    return true;
}

static IntIndex MatchDateTimeName(SubString *input, const char *nameArray[]) {
    IntIndex index = 0;
    const char *nameToMatch;
    while ((nameToMatch = nameArray[index]) != nullptr) {
        if (input->ComparePrefixCStrIgnoreCase(nameToMatch)) {
            input->EatRawChars(Int32(strlen(nameToMatch)));
            return index;
            break;
        }
        ++index;
    }
    return -1;
}

Boolean StringToRelTime(SubString *input, SubString* format, Double *relTimeSecondsPtr) {
    SubString tempFormat(format);
    Double relTimeSeconds = 0.0;
    Utf8Char c = 0, matchChar;
    Int32 weeks = 0, days = 0, hours = 0, minutes = 0, seconds = 0;
    Int32 sign = 1;
    Double initSign = 1.0;
    Double fracsec = 0;

    Boolean validFormatString = true, canScan = true;
    char decimalSeparator = '.';

    // time scan allows any number of redundant initial sign chars; '-' only counts once and doesn't double-negate
    while (input->EatChar(' ') || input->EatChar('+')
           || (input->EatChar('-') && (initSign = -1.0)))
    {}
    if (tempFormat.Length() == 0) {  // just %t, dynamically parse [%H:[%M:[%S%u]]]
        Int32 colonCount = 0, component = 0;
        while (colonCount < 2) {
            if (input->PeekRawChar(&matchChar) && matchChar == ':' && input->PeekRawChar(&matchChar, 1) && isdigit(matchChar)) {
                input->ReadRawChar(&matchChar);
                relTimeSeconds *= 60;
                ++colonCount;
            }
            if (ReadDateTimeValue(input, &component, 1, 0, 0, 0)) {
                relTimeSeconds += component;
                if (input->PeekRawChar(&matchChar) && matchChar == decimalSeparator) {
                    input->ParseDouble(&fracsec);
                    break;
                }
            } else {
                break;
            }
        }
        *relTimeSecondsPtr = initSign * (relTimeSeconds + fracsec);
        return canScan;
    }
    while (canScan && validFormatString && tempFormat.ReadRawChar(&c)) {
        while (input->EatChar(' '))  // time scan is lenient about extra white space anywhere in input
        {}

        if (c == '%') {
            TimeFormatOptions fOption;
            Boolean parseFinished = false;
            if (ReadLocalizedDecimalSeparator(&tempFormat, 0, nullptr, nullptr, &tempFormat, &validFormatString, &decimalSeparator, &parseFinished))
                continue;
            ReadTimeFormatOptions(&tempFormat, &fOption);
            if  (fOption.Valid) {
                if (input->EatChar('-')) {
                    sign = -1;
                    while (input->EatChar(' '))
                    {}
                }
                switch (fOption.FormatChar) {
                    case 'W':
                        canScan = ReadDateTimeValue(input, &weeks, 0, 0, 0, 0);
                        weeks *= sign;
                        break;
                    case 'D':
                        canScan = ReadDateTimeValue(input, &days, 0, 0, 0, 0);
                        days *= sign;
                        break;
                    case 'H':
                        canScan = ReadDateTimeValue(input, &hours, 0, 0, 0, 0);
                        hours *= sign;
                        break;
                    case 'M':
                        canScan = ReadDateTimeValue(input, &minutes, 0, 0, 0, 0);
                        minutes *= sign;
                        break;
                    case 'S':
                        canScan = ReadDateTimeValue(input, &seconds, 0, 0, 0, 0);
                        seconds *= sign;
                        break;
                    case 'u':
                        if (input->PeekRawChar(&matchChar) && matchChar == decimalSeparator) {
                            input->ParseDouble(&fracsec);
                            if (seconds < 0.0)
                                fracsec = -fracsec;
                        }
                        break;
                    default:
                        break;
                }
            }
        } else if (c != ' ') {
            if (!input->ReadRawChar(&matchChar) || matchChar != c)
                return false;
        }
    }
    if (canScan) {
        relTimeSeconds = initSign * ((((Double(weeks) * 7 + days) * 24 + hours) * 60 + minutes) * 60 + seconds + fracsec);
    } else {
        relTimeSeconds = 0;
    }
    *relTimeSecondsPtr = relTimeSeconds;
    return validFormatString && canScan;
}

Boolean StringToDateTime(SubString *input, Boolean isUTC, SubString* format, Timestamp *tsPtr) {
    TempStackCString formatString;
    SubString tempFormat(format);
    if (format == nullptr || format->Length() == 0) {
        formatString.AppendCStr("%x %X");
        tempFormat.AliasAssign(formatString.Begin(), formatString.End());
    }

    Utf8Char c = 0, matchChar;
    Int32 year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0, weekday = -1, yearday = -1;
    Int32 hourFormat = 0;
    bool ampmIsPM = false, hourScannedBeforeYearDay = false;
    double fracsec = 0;

    Boolean validFormatString = true, canScan = true;
    char decimalSeparator = '.';
    while (canScan && validFormatString && tempFormat.ReadRawChar(&c)) {
        if (c == '%') {
            TimeFormatOptions fOption;
            Boolean parseFinished = false;
            if (ReadLocalizedDecimalSeparator(&tempFormat, 0, nullptr, nullptr, &tempFormat, &validFormatString, &decimalSeparator, &parseFinished))
                continue;
            ReadTimeFormatOptions(&tempFormat, &fOption);
            if  (fOption.Valid) {
                while (input->PeekRawChar(&matchChar) && isspace(matchChar))
                    input->ReadRawChar(&matchChar);
                switch (fOption.FormatChar) {
                    case 'a' : case 'A':
                    {
                        MatchDateTimeName(input, fOption.FormatChar == 'a' ? abbrWeekDayName : weekDayName);
                        // ignore weekday name when scanning
                    }
                        break;
                    case 'b': case 'B':
                    {
                        IntIndex matchIndex = MatchDateTimeName(input, fOption.FormatChar == 'b' ? abbrMonthName : monthName);
                        if (matchIndex >= 0)
                            month = matchIndex + 1;
                    }
                        break;
                    case 'c':
                    {
                        TempStackCString localeFormatString;
                        SubString formatSubString(fOption.FmtSubString.Begin(), fOption.FmtSubString.End()-1);
                        localeFormatString.AppendCStr("%");
                        localeFormatString.Append(&formatSubString);
                        localeFormatString.AppendCStr("x %");
                        localeFormatString.Append(&formatSubString);
                        localeFormatString.AppendCStr("X");
                        SubString localformat(localeFormatString.Begin(), localeFormatString.End());
                        validFormatString = StringToDateTime(input, isUTC, &localformat, tsPtr);
                    }
                        return validFormatString && canScan;
                    case 'd':
                    {
                        canScan = ReadDateTimeValue(input, &day, 1, 2, 1, 31);
                    }
                        break;
                    case 'H':
                    {
                        canScan = ReadDateTimeValue(input, &hour, 1, 2, 0, 23);
                        hourFormat = 24;
                    }
                        break;
                    case 'I':
                    {
                        canScan = ReadDateTimeValue(input, &hour, 1, 2, 1, 12);
                        hourFormat = 12;
                    }
                        break;
                    case 'j':
                    {
                        canScan = ReadDateTimeValue(input, &yearday, 1, 3, 1, 366);
                        if (hourFormat)
                            hourScannedBeforeYearDay = true;  // dutifully reproduce LV bug
                    }
                        break;
                    case 'm':
                    {
                        canScan = ReadDateTimeValue(input, &month, 1, 2, 1, 12);
                    }
                        break;
                    case 'M':
                    {
                        canScan = ReadDateTimeValue(input, &minute, 1, 2, 0, 59);
                    }
                        break;
                    case 'p':
                    {
                        Utf8Char ampmChar;
                        if (hourFormat == 12  // else %p is ignored and consumes no input; if AM/PM present it's an error
                            && input->PeekRawChar(&ampmChar) &&
                            (ampmChar == 'A' || ampmChar == 'a' || ampmChar == 'P' || ampmChar == 'p')
                            && input->PeekRawChar(&matchChar, 1)
                            && (matchChar == 'M' || matchChar == 'm')) {
                            input->ReadRawChar(&matchChar);
                            input->ReadRawChar(&matchChar);
                            if (ampmChar == 'P' || ampmChar == 'p')
                                ampmIsPM = true;
                        }
                    }
                        break;
                    case 'S':
                    {
                        canScan = ReadDateTimeValue(input, &second, 2, 2, 0, 59);
                    }
                        break;
                    case 'u':
                    {
                        if (input->PeekRawChar(&matchChar) && matchChar == decimalSeparator)
                            input->ParseDouble(&fracsec);
                    }
                        break;
                    case 'w':  // week day
                    {
                        // 'w', 'U', and 'W' are scanned but do not affect scan result
                        // (Note: Unix strptime+mktime does support this, but LV does not)
                        canScan = ReadDateTimeValue(input, &weekday, 1, 1, 0, 6);
                    }
                        break;
                    case 'U':  // week of year
                    case 'W':
                    {
                        canScan = ReadDateTimeValue(input, &yearday, 2, 2, 0, 53);
                    }
                        break;
                    case 'X':
                        hourFormat = 12;  // fall through...
                    case 'x':
                    {
                        TempStackCString localeFormatString;
                        ExpandDateTimeCode(fOption, &localeFormatString, nullptr);
                        SubString localformat(localeFormatString.Begin(), localeFormatString.End());
                        validFormatString = StringToDateTime(input, isUTC, &localformat, tsPtr);
                    }
                        return validFormatString && canScan;
                    case 'y':
                    {
                        canScan = ReadDateTimeValue(input, &year, 2, 2, 0, 99);
                        if (year <= 68)
                            year += 2000;
                        else
                            year += 1900;
                    }
                        break;
                    case 'Y':
                    {
                        canScan = ReadDateTimeValue(input, &year, 4, 4, 1600, 3000);
                    }
                        break;
                    case 'z':  // Scanning TZ offset is not supported; we will parse the value but it does not affect the result
                    {
                        Int32 relVal = 0;
                        while (input->EatChar('-') || input->EatChar('+'))
                        {}
                        ReadDateTimeValue(input, &relVal, 0, 0, 0, 0);  // scan hours
                        if (input->EatChar(':')) {  // scan :minutes
                            ReadDateTimeValue(input, &relVal, 0, 0, 0, 0);
                            if (input->EatChar(':')) {  // scan :seconds
                                ReadDateTimeValue(input, &relVal, 0, 0, 0, 0);
                            }
                        }
                    }
                        break;
                    case 'Z':  // Scanning TZ is not supported; we will parse the value but it does not affect the result
                    {
                        Timestamp tempTS(fracsec, second, minute, hour, day, month, year);
                        Date date(tempTS, isUTC);
                        ConstCStr tzStr = date.TimeZoneString();
                        if (input->CompareCStrIgnoreCase(tzStr))
                            input->EatRawChars(Int32(strlen(tzStr)));
                        else
                            canScan = false;
                    }
                        break;
                    default:
                        break;
                }
            }
        } else if (c == ' ') {
            while (input->PeekRawChar(&matchChar) && isspace(matchChar))
                input->ReadRawChar(&matchChar);
        } else if (!input->ReadRawChar(&matchChar) || matchChar != c) {
            return false;
        }
    }
    if (canScan) {
        if (!hourFormat && !isUTC) {  // if time not specified, default time is time from epoch in local TZ
            hour = Date(Timestamp()).Hour();
        }
        if (hourFormat == 12) {
            if (ampmIsPM) {
                if (hour < 12)
                    hour += 12;
            } else if (hour >= 12) {
                hour -= 12;
            }
        }
        if (month && day) {  // %j year day ignored if month/day provided
            yearday = 0;
        } else {
            month = 1;
            day = 1;
        }
        Timestamp timestamp(fracsec, second, minute, hour, day, month, year);
        Timestamp tsForTZ = timestamp;
        Int32 timeZoneOffset = 0;
        if (yearday) {
            timestamp = timestamp + (yearday * 24*60*60);
            if (!isUTC && hourScannedBeforeYearDay) {
                // %j scanned after time (hour) causes time to always be treated as standard time
                // even if DST should be in effect for the date. This is a LV bug, reproduced here
                // until it can be fixed in desktop LV.
                tsForTZ = Timestamp(0, 0, 0, hour, 1, 1, year);
            }
        }
        if (!isUTC)
            timeZoneOffset = Date::getLocaletimeZone(tsForTZ.Integer());
        *tsPtr = timestamp - timeZoneOffset;
    }
    return validFormatString && canScan;
}

//------------------------------------------------------------
// DateTimeString(0), FormatString(1), Timestamp(2), isUTC(3)
VIREO_FUNCTION_SIGNATURE4(FormatDateTimeString, StringRef, StringRef, Timestamp, Boolean)
{
    SubString format;
    if (_ParamPointer(1)) {
        format = _Param(1)->MakeSubStringAlias();
    } else {
        format.AliasAssignCStr("%c");
    }
    Timestamp timestamp;
    if (_ParamPointer(2))
        timestamp = _Param(2);
    else
        Timestamp::GetCurrentTimestamp(&timestamp);
    Boolean isUTC = _ParamPointer(3) ? _Param(3) : false;
    Int32 timeZoneOffset = isUTC ? 0 : Date::getLocaletimeZone(timestamp.Integer());
    Date date(timestamp, timeZoneOffset);
    StringRef output = _Param(0);
    // clear the buffer
    output->Resize1D(0);
    if (output != nullptr) {
        DateTimeToString(date, isUTC, &format, output);
    }
    return _NextInstruction();
}

#endif  // VIREO_TIME_FORMATTING

#if defined(VIREO_SPREADSHEET_FORMATTING)

//-------------------------------------------------------------
/**
 * recursion function to generate the format string for each element in the (multi - dimension)array.
 * */
void SpreadsheetDimension(StringRef output, StringRef formatString, StringRef delimiter, TypedArrayCoreRef array, IntIndex dimension, IntIndex* index)
{
    IntIndex rank = array->Rank();
    STACK_VAR(String, temp);
    if (dimension == 1) {
        // generate the value of this 1d array as a row.
        for (IntIndex i = 0; i< array->DimensionLengths()[dimension-1]; i++) {
            index[dimension-1] = i;
            StaticTypeAndData arrayElem;
            arrayElem._paramType = array->ElementType();
            arrayElem._pData = array->BeginAtND(rank, index);
            defaultFormatValue(temp.Value, formatString, arrayElem);
            if (i != 0) {
                output->Append(delimiter);
            }
            output->Append(temp.Value);
        }
        output->AppendCStr("\n");
    } else if (dimension >= 2) {
        if (rank >= 3 && dimension == 2 && array->DimensionLengths()[1] > 0) {
            // generate the first index line
            output->AppendCStr("[");
            char dimensionString[kTempCStringLength];
            for (IntIndex i = 0; i < array->Rank(); i++) {
                if (i != 0) {
                    output->AppendCStr(",");
                }
                snprintf(dimensionString, kTempCStringLength, "%d", (int)index[rank - 1 - i]);
                output->AppendCStr(dimensionString);
            }
            output->AppendCStr("]");
            output->AppendCStr("\n");
        }
        for (IntIndex i = 0; i< array->DimensionLengths()[dimension-1]; i++) {
            index[dimension-1] = i;
            for (IntIndex j = 0; j < dimension-1; j++) {
                index[j] = 0;
            }
            SpreadsheetDimension(output, formatString, delimiter, array, dimension-1, index);
        }
        if (dimension == 2 && rank >= 3) {
            output->AppendCStr("\n");
        }
    }
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArraySpreadsheet, StringRef, StringRef, StringRef, TypedArrayCoreRef)
{
    TypedArrayCoreRef inputArray = _Param(3);
    // clear the buffer
    _Param(0)->Resize1D(0);
    ArrayDimensionVector  index;
    if (_Param(2)->Length() == 0) {
        STACK_VAR(String, delimiter);
        delimiter.Value->AppendCStr("\t");
        SpreadsheetDimension(_Param(0), _Param(1), delimiter.Value, inputArray, inputArray->Rank(), index);
    } else {
        SpreadsheetDimension(_Param(0), _Param(1), _Param(2), inputArray, inputArray->Rank(), index);
    }
    return _NextInstruction();
}

// Find the next delimiter in a spreadsheet string starting at offset and return the matching offset (or -1)
// and the offset past the match; delimiterParam can be either a single StringRef or an array of StringRefs
static inline IntIndex FindDelimiter(SubString *input, TypedArrayCoreRef delimiterParam, IntIndex offset, IntIndex *next, Boolean isDelimArray) {
    if (!isDelimArray) {
        StringRef delimiterString = (StringRef)delimiterParam;
        SubString delimiter = delimiterString->MakeSubStringAlias();

        IntIndex index = input->FindFirstMatch(&delimiter, offset, false);
        *next = index >= 0 ? index + delimiter.Length() : -1;
        return index;
    } else {
        StringRefArray1D *delimArray = (StringRefArray1D*)delimiterParam;
        Int32 index = -1, pastMatch = -1;
        Int32 length = delimArray->Length();
        for (IntIndex i = 0; i < length; ++i) {
            StringRef delimiterString = delimArray->At(i);
            SubString delimiter = delimiterString->MakeSubStringAlias();
            IntIndex match = input->FindFirstMatch(&delimiter, offset, false);
            // Find the first match in the delimiter array, if multiple delims match, take the longest
            if (match >= 0 && (index == -1 || match < index
                || (match == index && index + delimiter.Length() > pastMatch))) {
                index = match;
                pastMatch = index + delimiter.Length();
            } else if (input->Length() - offset < delimiter.Length()) {
                // This dutifully replicates what is arguably a CG bug; if we have a successful partial match
                // of one of the delimiter string when we 'run out' of input string, we ignore the delimiter.
                delimiter.AliasAssignLen(delimiter.Begin(), input->Length() - offset);
                match = input->FindFirstMatch(&delimiter, offset, false);
                if (match >= 0) {
                    index = pastMatch = -1;
                    break;
                }
            }
        }
        *next = pastMatch;
        return index;
    }
}

// Wrapper around FormatScan:  %s for Spreadsheet Strings does not stop at whitespace the way it does
// for the other format functions.
static inline void FormatScanForSpreadsheet(SubString *elemString, SubString *format,  StaticTypeAndData *Value, Boolean formatIsString) {
    if (formatIsString) {
        StringRef *pString = (StringRef*)(Value->_pData);
        (*pString)->Replace1D(0, elemString->Length(), elemString->Begin(), true);
    } else {
        FormatScan(elemString, format, 1, Value, nullptr);
    }
}

//------------------------------------------------------------------------------------------------
void ScanSpreadsheet(StringRef inputString, StringRef formatString, TypedArrayCoreRef delimiterParam, TypedArrayCoreRef array, Boolean isDelimArray)
{
    SubString format = formatString->MakeSubStringAlias();
    SubString input = inputString->MakeSubStringAlias();
    ArrayDimensionVector  dimensionLength;
    IntIndex rank = array->Rank();
    Boolean formatIsString = format.CompareCStr("%s");
    SubString line;
    for (IntIndex i = 0; i < kArrayMaxRank; i++) {
        dimensionLength[i] = 0;
    }

    if (rank == 1) {
        IntIndex rowlen = 1;
        IntIndex split = 0;

        while (FindDelimiter(&input, delimiterParam, split, &split, isDelimArray) > -1) {
            rowlen++;
        }
        if (rowlen > dimensionLength[0]) {
            dimensionLength[0] = rowlen;
        }
    } else if (rank == 2) {
        Int32 lineIndex = 0;
        while (input.ReadLine(&line)) {
            if (line.Length() == 0) {
                lineIndex++;
                continue;
            }
            lineIndex++;
            IntIndex split = 0;
            IntIndex rowlen = 1;
            while (FindDelimiter(&line, delimiterParam, split, &split, isDelimArray) > -1) {
                rowlen++;
            }
            if (rowlen > dimensionLength[0]) {
                dimensionLength[0] = rowlen;
            }
        }
        dimensionLength[1] = lineIndex;

    } else {
        Int32 lineIndex = 0;
        while (input.ReadLine(&line)) {
            if (line.Length() == 0) {
                lineIndex = 0;
                continue;
            }
            if (lineIndex == 0) {
                IntIndex dimensionL = 0;
                IntIndex d = 0;
                line.EatRawChars(1);
                IntMax intValue = 0;
                while (line.ReadInt(&intValue)) {
                    line.EatRawChars(1);
                    dimensionL = (IntIndex)intValue;
                    if (dimensionLength[rank-1-d] < dimensionL+1) {
                        dimensionLength[rank-1-d] = dimensionL+1;
                    }
                    d++;
                }
            } else {
                IntIndex split = 0;
                IntIndex rowlen = 1;
                while (FindDelimiter(&line, delimiterParam, split, &split, isDelimArray) > -1) {
                    rowlen++;
                }
                if (rowlen > dimensionLength[0]) {
                    dimensionLength[0] = rowlen;
                }
                if (lineIndex > dimensionLength[1]) {
                    dimensionLength[1] = lineIndex;
                }
            }
            lineIndex++;
        }
        // make sure all the dimension length is positive
        for (IntIndex i = 0; i < rank; i++) {
            if (dimensionLength[i] <= 0) {
                dimensionLength[i] = 1;
            }
        }
        // resize the dimension and then fill the data
    }
    array->ResizeDimensions(rank, dimensionLength, false);
    input = inputString->MakeSubStringAlias();

    ArrayDimensionVector elemIndex;
    TypeRef elementType = array->ElementType();
    StaticTypeAndData Value = { elementType, array->BeginAtND(rank, elemIndex)};
    if (rank == 1) {
        IntIndex split = 0;
        elemIndex[0] = 0;

        SubString elemString;
        IntIndex pastDelim = 0, next = 0;
        while ((next = FindDelimiter(&input, delimiterParam, split, &pastDelim, isDelimArray)) > -1) {
            elemString.AliasAssign(input.Begin()+split, input.Begin()+next);
            Value._pData = array->BeginAtND(rank, elemIndex);
            FormatScanForSpreadsheet(&elemString, &format, &Value, formatIsString);
            split = pastDelim;
            elemIndex[0]++;
        }
        if (split > 0) {
            elemString.AliasAssign(input.Begin()+split, input.End());
            if (elemString.Length() > 0) {
                Value._pData = array->BeginAtND(rank, elemIndex);
                FormatScanForSpreadsheet(&elemString, &format, &Value, formatIsString);
            }
        }
    } else if (rank == 2) {
        elemIndex[0] = elemIndex[1] = 0;
        IntIndex lineIndex = 0;
        while (input.ReadLine(&line)) {
            if (line.Length() == 0) {
                lineIndex++;
                continue;
            }
            IntIndex split = 0;
            IntIndex pastDelim = 0, next = 0;
            SubString elemString;
            elemIndex[0] = 0;
            elemIndex[1] = lineIndex;
            while ((next = FindDelimiter(&line, delimiterParam, split, &pastDelim, isDelimArray)) > -1) {
                elemString.AliasAssign(line.Begin()+split, line.Begin()+next);
                Value._pData = array->BeginAtND(rank, elemIndex);
                FormatScanForSpreadsheet(&elemString, &format, &Value, formatIsString);
                split = pastDelim;
                elemIndex[0]++;
            }
            if (split > 0) {
                line.AliasAssign(line.Begin()+split, line.End());
                if (line.Length() > 0) {
                    Value._pData = array->BeginAtND(rank, elemIndex);
                    FormatScanForSpreadsheet(&line, &format, &Value, formatIsString);
                }
            }
            lineIndex++;
        }
    } else {
        for (IntIndex i = 0; i < kArrayMaxRank; i++) {
            elemIndex[i] = 0;
        }
        IntIndex lineIndex = 0;
        IntIndex dim = 2;
        while (input.ReadLine(&line)) {
            if (line.Length() == 0) {
                lineIndex = 0;
                elemIndex[dim]++;
                if (elemIndex[dim] >= array->GetLength(dim)) {
                    dim++;
                    elemIndex[dim] = 1;
                    for (IntIndex i = 0; i < dim; i++) {
                        elemIndex[i] = 0;
                    }
                }
                continue;
            }
            if (lineIndex == 0) {
                // this line specify the index block [1, 2, 1, 0]
            } else {
                IntIndex split = 0;
                IntIndex pastDelim = 0, next = 0;
                SubString elemString;
                elemIndex[0] = 0;
                elemIndex[1] = lineIndex -1;  // because the fist line is not for array data.
                while ((next = FindDelimiter(&line, delimiterParam, split, &pastDelim, isDelimArray)) > -1) {
                    elemString.AliasAssign(line.Begin()+split, line.Begin()+next);
                    Value._pData = array->BeginAtND(rank, elemIndex);
                    FormatScanForSpreadsheet(&elemString, &format, &Value, formatIsString);
                    split = pastDelim;
                    elemIndex[0]++;
                }
                if (split > 0) {
                    line.AliasAssign(line.Begin()+split, line.End());
                    if (line.Length() > 0) {
                        Value._pData = array->BeginAtND(rank, elemIndex);
                        FormatScanForSpreadsheet(&line, &format, &Value, formatIsString);
                    }
                }
            }
            lineIndex++;
        }
    }
}
//-------------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(SpreadsheetStringtoArray, StringRef, StringRef, StringRef, TypedArrayCoreRef)
// Params: InputString, FormatString, DelimiterString, OutputArray
{
    TypedArrayCoreRef outputArray = _Param(3);
    if (_Param(2)->Length() == 0) {
        STACK_VAR(String, delimiter);
        delimiter.Value->AppendCStr("\t");
        ScanSpreadsheet(_Param(0), _Param(1), delimiter.Value, outputArray, false);
    } else {
        ScanSpreadsheet(_Param(0), _Param(1), _Param(2), outputArray, false);
    }
    return _NextInstruction();
}
//-------------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(SpreadsheetStringtoArrayWithArrayDelim, StringRef, StringRef, TypedArrayCoreRef, TypedArrayCoreRef)
// Params: InputString, FormatString, DelimiterStringArray, OutputArray
{
    TypedArrayCoreRef outputArray = _Param(3);
    if (_Param(2)->Length() == 0) {
        STACK_VAR(String, delimiter);
        delimiter.Value->AppendCStr("\t");
        ScanSpreadsheet(_Param(0), _Param(1), delimiter.Value, outputArray, false);
    } else {
        ScanSpreadsheet(_Param(0), _Param(1), _Param(2), outputArray, true);
    }
    return _NextInstruction();
}
#endif  // VIREO_SPREADSHEET_FORMATTING

//-------------------------------------------------------------------
DEFINE_VIREO_BEGIN(NumericString)
    DEFINE_VIREO_REQUIRE(Timestamp)
    DEFINE_VIREO_FUNCTION(StringFormatValue, "p(o(String) i(String) i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(StringFormat, "p(i(VarArgCount) o(String)   i(String) io(ErrorCluster err) i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(StringScanValue, "p(i(String) o(String) i(String) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(StringScan, "p(i(VarArgCount) i(String) o(String) i(String) i(UInt32) o(UInt32) io(ErrorCluster err) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(ByteArrayToString, "p(i(Array) i(UInt16) o(String) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION(StringToByteArray, "p(i(String) i(UInt16) o(Array) io(ErrorCluster err))")

#if defined(VIREO_SPREADSHEET_FORMATTING)
    DEFINE_VIREO_FUNCTION(ArraySpreadsheet, "p(o(String) i(String) i(String) i(Array))")
    DEFINE_VIREO_FUNCTION(SpreadsheetStringtoArray, "p(i(String) i(String) i(String) o(Array))")
    DEFINE_VIREO_FUNCTION_CUSTOM(SpreadsheetStringtoArray, SpreadsheetStringtoArrayWithArrayDelim, "p(i(String) i(String) i(Array) o(Array))")
#endif

#if defined(VIREO_TIME_FORMATTING)
    DEFINE_VIREO_FUNCTION(FormatDateTimeString, "p(o(String) i(String) i(Timestamp) i(Boolean))")
#endif

DEFINE_VIREO_END()
}  // namespace Vireo
