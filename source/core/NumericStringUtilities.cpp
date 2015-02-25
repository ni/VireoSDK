/**

Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Native Verio VIA functions.
 */

#include <stdarg.h>
#include "TypeDefiner.h"
#include "ExecutionContext.h"
//#include "TypeAndDataManager.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#if !(kVireoOS_win32U || kVireoOS_win64U )
    #include <math.h>
#endif

namespace Vireo
{
//------------------------------------------------------------
struct FormatOptions {
    Int32 ArgumentOrder; // 3$, 2$ negative number means default order
    Boolean RemoveTrailing; // #
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
    Boolean EngineerNotation;
    Int32   MinimumFieldWidth;  // If zero no padding
    Int32   Precision; //.3
    Int32   Significant; //_4
    SubString  FmtSubString;
};
//------------------------------------------------------------
void ReadPercentFormatOptions(SubString *format, FormatOptions *pOptions)
{
    // Derived on the specification found here.
    // http://www.cplusplus.com/reference/cstdio/printf/
    // There will be some allowances for LabVIEW and since
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
    pOptions->EngineerNotation = false;

    Boolean bPrecision = false;
    Boolean bValid = true;
    char c;
    const Utf8Char* pBegin = format->Begin();

    while (format->ReadRawChar(&c)) {

        SubString order("$");
        SubString percent("%");

        if (strchr("diuoxXfFeEgGaAcsptTbB%", c)) {
            pOptions->FormatChar = c;
            break;
        } if (c == '+') {
            pOptions->ShowSign = true;
        } else if (c == '-') {
            pOptions->LeftJustify = true;
        } else if (c == '#') {
            pOptions->BasePrefix = true;
            pOptions->RemoveTrailing = true;
        } else if (c == ' ') {
            // space flag not used in LabView
            pOptions->SignPad = true;
        } else if (c == '^') {
            pOptions->EngineerNotation = true;
        } else if (c == '.') {
            bPrecision = true;
            format->AliasAssign(format->Begin(), format->End());
            IntMax value = 0;
            if (format->ReadInt(&value)) {
                pOptions->Precision = value;
            }
        } else if (c == '_') {
            bPrecision = true;
            format->AliasAssign(format->Begin(), format->End());
            IntMax value = 0;
            if (format->ReadInt(&value)) {
                pOptions->Significant = value;
            }
        } else if (bPrecision && c == '*') {
            // Labview doesn't variable precision, it will mess up with the argument index.
            pOptions->VariablePrecision = true;
        } else if (c == '$') {
        } else if (c == ';') {
        } else {
            IntIndex orderIndex = format->FindFirstMatch(&order, 0, false);
            IntIndex nextFormat = format->FindFirstMatch(&percent, 0, false);
            if ((c >= '0' && c <= '9') && orderIndex>=0 && nextFormat > orderIndex) {
                format->AliasAssign(format->Begin()-1, format->End());
                IntMax value = 0;
                if (format->ReadInt(&value)) {
                    pOptions->ArgumentOrder = value;
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

    }
    pOptions->Valid = bValid;
    if (!pOptions->Valid) {
        pOptions->FormatChar = '0';
    }
    pOptions->OriginalFormatChar = pOptions->FormatChar;
    pOptions->FmtSubString.AliasAssign(pBegin, format->Begin());
}
//---------------------------------------------------------------------------------------------
void GenerateFinalNumeric (const FormatOptions* , char* , Int32* , TempStackCString* , Boolean );
void RefactorLabviewNumeric(const FormatOptions* , char* , Int32* , Int32 , Int32 );

void Format(SubString *format, Int32 count, StaticTypeAndData arguments[], StringRef buffer)
{
    IntIndex argumentIndex = 0;
    Boolean lastArgumentSpecified = false;
    IntIndex lastArgumentIndex = -1;
    IntIndex explicitPositionArgument = 0;
    Int32 totalArgument = 0;;
    const char decimalPointC = '.';
    char localDecimalPoint = '.';
    SubString f(format);            // Make a copy to use locally

    buffer->Resize1D(0);              // Clear buffer (wont do anything for fixed size)

    char c = 0;
    while (f.ReadRawChar(&c))
    {
        if (c == '\\' && f.ReadRawChar(&c)) {
            switch (c)
            {
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
            FormatOptions fOptions;
            ReadPercentFormatOptions(&f, &fOptions);
            // We should assign the local decimal point to DecimalSeparator.
            fOptions.DecimalSeparator = localDecimalPoint;
            totalArgument++;
            if (lastArgumentIndex == argumentIndex) {
                // the previous argument is a legal argument. like %12$%
                totalArgument --;
                if (lastArgumentSpecified) {
                    explicitPositionArgument --;
                }
            }
            lastArgumentSpecified = false;
            argumentIndex = totalArgument-explicitPositionArgument-1;
            if (fOptions.ArgumentOrder>=0) {
                if (fOptions.ArgumentOrder > 0 ) {
                    argumentIndex = fOptions.ArgumentOrder-1;
                    explicitPositionArgument ++;
                    lastArgumentSpecified = true;
                }
                SubString *fmtSubString = &fOptions.FmtSubString;
                fmtSubString->AliasAssign(fmtSubString->Begin(), fmtSubString->End());
                SubString order("$");
                IntIndex dollarFlag = fmtSubString->FindFirstMatch(&order, 0, false);
                fmtSubString->AliasAssign(fmtSubString->Begin()+ dollarFlag + 1, fmtSubString->End());
            }
            lastArgumentIndex = argumentIndex;
            Boolean parseFinished = false;
            if (!fOptions.Valid) {
                parseFinished = true;
            }
            while (!parseFinished){
                parseFinished = true;
                switch (fOptions.FormatChar)
                {
                    case 'g': case 'G':
                    {
                        // will re-parse the format later with new format code
                        parseFinished = false;
                        Double tempDouble = *(Double*) (arguments[argumentIndex]._pData);
                        Int32 exponent = 0;
                        Int32 precision = fOptions.Precision;
                        if (precision<0) {
                               // 6 is the default value;
                               precision = 6;
                        }
                        if (!tempDouble == 0) {
                            Double absDouble = tempDouble;
                            if (tempDouble < 0) {
                            absDouble = 0.0 - tempDouble;
                            }
                            exponent = floor(log10(absDouble));
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
                        Double tempDouble;
                        TypeRef argType = arguments[argumentIndex]._paramType;
                        ReadDoubleFromMemory(argType->BitEncoding(), argType->TopAQSize(),  arguments[argumentIndex]._pData, &tempDouble);
                        Int32 leadingZero = 0;
                        Int32 exponent = 0;
                        Int32 precision = fOptions.Precision;
                        Int32 truncateSignificant = 0;
                        // calculate the exponent of the number, it also tell us whether should truncate the integer part.
                        if (fOptions.Significant >= 0) {
                            if (!tempDouble == 0) {
                                Double absDouble = tempDouble;
                                if (tempDouble < 0) {
                                    absDouble = 0.0 - tempDouble;
                                }
                                exponent = floor(log10(absDouble));
                            }
                            // 0.12 has 1 leading zero
                            leadingZero = (exponent >= 0)? 0 : (0 - exponent);
                            precision = (exponent >= 0)? (fOptions.Significant - exponent - 1) : (fOptions.Significant + leadingZero - 1);
                            if (precision < 0) {
                                precision = 0;
                                truncateSignificant = exponent + 1 - fOptions.Significant;
                                // need truncate the integer part of the float because the sprintf doesnt do this for us.
                            }
                        }
                        char asciiReplacementString[100];
                        Int32 sizeOfNumericString = -1;
                        if (precision >= 0) {
                            sizeOfNumericString = snprintf(asciiReplacementString, 100, "%.*f", precision,tempDouble);
                        } else {
                            sizeOfNumericString = snprintf(asciiReplacementString, 100, "%f", tempDouble);
                        }
                        Int32 intDigits = (exponent >= 0)? (exponent): 0 ;
                        RefactorLabviewNumeric(&fOptions, asciiReplacementString, &sizeOfNumericString, intDigits, truncateSignificant);
                        buffer->Append(sizeOfNumericString, (Utf8Char*)asciiReplacementString);
                        argumentIndex++;
                    }
                    break;
                    case 'e': case 'E':
                    {
                        Double tempDouble;
                        TypeRef argType = arguments[argumentIndex]._paramType;
                        ReadDoubleFromMemory(argType->BitEncoding(), argType->TopAQSize(),  arguments[argumentIndex]._pData, &tempDouble);
                        Int32 precision = fOptions.Precision;
                        if (precision>0 && fOptions.EngineerNotation) {
                            Int32 exponent = 0;
                            if (!tempDouble == 0) {
                                Double absDouble = tempDouble;
                                if (tempDouble < 0) {
                                    absDouble = 0.0 - tempDouble;
                                }
                                exponent = floor(log10(absDouble));
                            }
                            if (exponent%3 != 0) {
                                precision = (exponent>=0)? precision + exponent%3 : precision + 3+exponent%3;
                            }
                        }
                        if (fOptions.Significant >= 0) {
                            precision =  fOptions.Significant - 1;
                        }
                        char asciiReplacementString[100];
                        Int32 sizeOfNumericString = 0;
                        if (precision >= 0) {
                            sizeOfNumericString += snprintf(asciiReplacementString, 100, "%.*e", precision, tempDouble);
                        } else {
                            sizeOfNumericString = snprintf(asciiReplacementString, 100, "%e", tempDouble);
                        }
                        RefactorLabviewNumeric(&fOptions, asciiReplacementString, &sizeOfNumericString, 0, 0);

                        buffer->Append(sizeOfNumericString, (Utf8Char*)asciiReplacementString);
                        argumentIndex++;
                    }
                    break;
                    case 'p': case 'P':
                    {
                        parseFinished = false;
                        fOptions.FormatChar = 'e';
                        fOptions.EngineerNotation = true;
                    }
                    break;
                    case 'a': case 'A':
                    {
                        // TODO don't assume data type. This just becomes the default format for real numbers, then use formatter
                        SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                        TempStackCString tempFormat(&percentFormat);
                        char asciiReplacementString[100];
                        //Get the numeric string that will replace the format string
                        Double tempDouble = *(Double*) (arguments[argumentIndex]._pData);
                        Int32 sizeOfNumericString = snprintf(asciiReplacementString, 100, tempFormat.BeginCStr(), tempDouble);
                        buffer->Append(sizeOfNumericString, (Utf8Char*)asciiReplacementString);
                        argumentIndex++;
                    }
                    break;
                    case 'b': case 'B':
                    {
                        SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                        TempStackCString formattedNumber;
                        TypeRef argType = arguments[argumentIndex]._paramType;
                        IntMax intValue;
                        Int32 intSize = 8*argType->TopAQSize();
                        ReadIntFromMemory(argType->BitEncoding(), argType->TopAQSize(), arguments[argumentIndex]._pData, &intValue);
                        char BinaryString[66];
                        char bits [2];
                        bits[0] = '0';
                        bits[1] = '1';
                        Int32 length = 0;
                        if (intValue < 0) {
                            intValue = intValue << (64 - intSize);
                            for (int i = 66-intSize; i<=65; i++) {
                                if (intValue >= 0) {
                                    BinaryString[i] = '0';
                                } else {
                                    BinaryString[i] = '1';
                                }
                                length ++;
                                intValue = intValue << 1;
                            }
                        } else {
                            if(intValue == 0) {
                                BinaryString[65-length] = bits[intValue];
                                length = 1;
                            }
                            while (intValue >= 1) {
                                    BinaryString[65-length] =  bits[intValue%2];
                                    intValue = intValue/2;
                                    length++;
                            }
                        }
                        if (fOptions.ShowSign) {
                            BinaryString[65-length] = '+';
                            length ++;
                            buffer->Append(length, (Utf8Char*)BinaryString+(66-length));
                        } else {
                            buffer->Append(length, (Utf8Char*)BinaryString+(66-length));
                        }
                        argumentIndex++;
                    }
                    break;
                    case 'd':
                    case 'o': case 'u':
                    case 'x': case 'X':
                    {
                        // To cover the max range formats like %d ned to beturned into %lld
                        SubString percentFormat(fOptions.FmtSubString.Begin()-1, fOptions.FmtSubString.End());
                        TempStackCString tempFormat((Utf8Char*)"%", 1);
                        SubString *fmtSubString = &fOptions.FmtSubString;
                        fmtSubString->AliasAssign(fmtSubString->Begin(), fmtSubString->End()-1);
                        tempFormat.Append(fmtSubString);
                        char specifier[] = "lld";
                        specifier[2] = fOptions.FormatChar;
                        if (specifier[2] == 'x') {
                             specifier[2] = 'X';
                        }
                        tempFormat.AppendCStr(specifier);

                        TempStackCString formattedNumber;
                        TypeRef argType = arguments[argumentIndex]._paramType;
                        IntMax intValue;
                        ReadIntFromMemory(argType->BitEncoding(), argType->TopAQSize(), arguments[argumentIndex]._pData, &intValue);
                        Int32 length = snprintf(formattedNumber.BeginCStr(), formattedNumber.Capacity(), tempFormat.BeginCStr(), intValue);
                        buffer->Append(length, (Utf8Char*)formattedNumber.Begin());
                        argumentIndex++;
                    }
                    break;
                    case '%':      //%%
                    buffer->Append('%');
                    break;
                    case 's':      //%s
                    {
                        STACK_VAR(String, tempString);
                        TDViaFormatter formatter(tempString.Value, false);
                        formatter.FormatData(arguments[argumentIndex]._paramType, arguments[argumentIndex]._pData);

                        Int32 extraPadding = fOptions.MinimumFieldWidth - tempString.Value->Length();

                        if (fOptions.LeftJustify)
                        buffer->Append(tempString.Value);
                        if (extraPadding > 0) {
                            for (Int32 i = extraPadding; i >0; i--) {
                                buffer->Append(' ');
                            }
                        }
                        if (!fOptions.LeftJustify)
                        buffer->Append(tempString.Value);

                        argumentIndex++;
                    }
                    break;
                    default:
                    printf("special error character %c\n",fOptions.FormatChar );
                    // This is just part of the format specifier, let it become part of the percent format
                    break;
                }
            }
        } else {
            buffer->Append(c);
        }
    }
}

/* Adjust the numeric string.
 * 1. truncate the integer part if necessary for %f. %_2f   1345.55
 * 2. calculate the significant digits to guarantee the correctness.  %_2f 9.9
 * 3. Apply the engineer notation which means adjust the base and exponent part. %^_3e
 * 4. Remove the trailing zero if necessary. %#3f 1.0000
 * 5. Replace the C decimal pointer with the local decimal separator
 * Input of this function is like "-12.4" "7.450E+043"
 * This function will not process the sign and padding and the width. It only process the pure number.
 * */
void RefactorLabviewNumeric(const FormatOptions* formatOptions, char* bufferBegin, Int32* pSize, Int32 IntDigits, Int32 truncateSignificant)
{
    Boolean negative = false;
    char* buffer = bufferBegin;

    // the positive number string always start from the beginning
    Int32 numberStart = 0;
    Int32 numberEnd = *pSize - 1;
    Int32 decimalPoint = -1;
    Int32 exponentPos = -1;
    Int32 index = 0;
    Int32 size = *pSize;
    if (strchr ("DdoXxbB", formatOptions->FormatChar)) {
        decimalPoint = 0;
        exponentPos = 0;
    }
    if (strchr ("fF", formatOptions->FormatChar)) {
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
         }
        index++;
    }
    if (decimalPoint < 0) {
        decimalPoint = 0;
    }

    if (formatOptions->FormatChar == 'f' || formatOptions->FormatChar == 'F') {
        if (truncateSignificant>0) {
            // .0 in sprintf. no decimal point,
            // but still truncate the integer part which is not handled in sprintf

            Int32 trailing = numberStart + formatOptions->Significant;
            if (decimalPoint > 0 && numberStart + truncateSignificant >= decimalPoint) {
                trailing = numberStart + formatOptions->Significant + 1;
            }
            Boolean extend = false;
            if (*(buffer+trailing) > '5') {
                // LabVIEW typically uses Bankers rounding, but for
                // significant digits it always round midpoints down.
                *(buffer+trailing-1) = *(buffer+trailing-1) + 1;
            }
            for (Int32 i = trailing-1; i >= numberStart; i++) {
                if (*(buffer+i) > '9') {
                    *(buffer+i) = '0';
                    if (i == numberStart) {
                        extend =true;
                        break;
                    }
                    *(buffer+i-1) = *(buffer+i-1) +1 ;
                } else {
                    break;
                }
            }
            // It's guaranteed that the length of the float number doesn't change.
            for (Int32 i = trailing; i <= numberEnd; i++) {
                *(buffer+i) = '0';
            }
            if (extend) {
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
            // dont remove the first zero for number 0
            while ((*(buffer+numberEnd)== '0' || *(buffer+numberEnd)== '.') && numberEnd > numberStart) {
                numberEnd--;
            }
        }
        TempStackCString numberPart((Utf8Char*)buffer+ numberStart, numberEnd + 1 - numberStart);
        GenerateFinalNumeric(formatOptions, bufferBegin, pSize, &numberPart, negative);
    }

    if (formatOptions->FormatChar == 'E' || formatOptions->FormatChar == 'e') {
        Int32 numberIndex = numberStart;
        Int32 baseIndex = 0;
        // baseIndex used to traverse the tempNumber char array.
        SubString ScientificFloat((Utf8Char*)buffer+exponentPos+1, (Utf8Char*)buffer+numberEnd+1);
        IntMax exponent;
        ScientificFloat.ReadInt(&exponent);
        Int32 paddingBase = exponent%3;
        if (formatOptions->EngineerNotation &&  (paddingBase%3 != 0)) {

            if (paddingBase < 0) {
                paddingBase += 3;
            }
            char tempNumber[100];
            exponent = exponent - paddingBase;

            // we are lucky, this case will never generate extra significant digit at MSB.

            tempNumber[baseIndex] = *(buffer + numberIndex);
            baseIndex++;
            numberIndex ++;
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
                baseIndex ++;
                numberIndex++;
            }
            if (*(buffer + numberIndex) != 'e') {
                tempNumber[baseIndex] = formatOptions->DecimalSeparator;
                baseIndex ++;
            }

            while (*(buffer + numberIndex) != 'e') {
                tempNumber[baseIndex] = *(buffer + numberIndex);
                baseIndex ++;
                numberIndex++;
            }
            if (formatOptions->RemoveTrailing) {
                while ((tempNumber[baseIndex-1]=='0' || tempNumber[baseIndex-1]==formatOptions->DecimalSeparator) && baseIndex > 1) {
                    baseIndex --;
                }
            }
            // add support for %p
            if (exponent>=-24 && exponent<=24 && (formatOptions->OriginalFormatChar == 'p' || formatOptions->OriginalFormatChar == 'P')) {
                char siPrefixesTable [50];
                for (Int32 i = 0 ; i<= 48; i++) {
                    siPrefixesTable[i] = ' ';
                }
                // Attention: -2 --- +2 will not be used
                siPrefixesTable[-24+24] = 'y';
                siPrefixesTable[-21+24] = 'z';
                siPrefixesTable[-18+24] = 'a';
                siPrefixesTable[-15+24] = 'f';
                siPrefixesTable[-12+24] = 'p';
                siPrefixesTable[-9+24]  = 'n';
                siPrefixesTable[-6+24]  = 'u';
                siPrefixesTable[-3+24]  = 'm';
                siPrefixesTable[-2+24]  = 'c';
                siPrefixesTable[-1+24]  = 'd';
                siPrefixesTable[0+24]   = '0';
                siPrefixesTable[+1+24]  = '1'; // 'da'
                siPrefixesTable[+2+24]  = 'h';
                siPrefixesTable[+3+24]  = 'k';
                siPrefixesTable[+6+24]  = 'M';
                siPrefixesTable[+9+24]  = 'G';
                siPrefixesTable[+12+24] = 'T';
                siPrefixesTable[+15+24] = 'P';
                siPrefixesTable[+18+24] = 'E';
                siPrefixesTable[+21+24] = 'Z';
                siPrefixesTable[+24+24] = 'Y';
                if (siPrefixesTable[exponent+24] != '0' ){
                    tempNumber[baseIndex] = siPrefixesTable[exponent+24];
                    baseIndex ++;
                }

            } else {
                // we can use %d safely, because the exponent part is never long than Int32 in double
                Int32 sizeOfExpoent = snprintf(tempNumber + baseIndex, 100, "E%+d", (Int32)exponent);
                baseIndex += sizeOfExpoent;
            }
            TempStackCString numberPart((Utf8Char*)tempNumber, baseIndex);
            GenerateFinalNumeric(formatOptions, bufferBegin, pSize, &numberPart, negative);

        } else {
            char tempNumber[100];
            baseIndex = 0;
            for (Int32 i = numberStart; i<exponentPos; i++) {
                tempNumber[baseIndex] = *(buffer+i);
                baseIndex ++;
            }
            if (formatOptions->RemoveTrailing) {
                while ((tempNumber[baseIndex-1]=='0' || tempNumber[baseIndex-1]==formatOptions->DecimalSeparator) && baseIndex > 1) {
                    baseIndex --;
                }
            }
            if (exponent>=-24 && exponent<=24 && (formatOptions->OriginalFormatChar == 'p' || formatOptions->OriginalFormatChar == 'P')) {
                char siPrefixesTable [50];
                for (Int32 i = 0 ; i<= 48; i++) {
                    siPrefixesTable[i] = ' ';
                }
                // Attention: -2 --- +2 will not be used
                siPrefixesTable[-24+24] = 'y';
                siPrefixesTable[-21+24] = 'z';
                siPrefixesTable[-18+24] = 'a';
                siPrefixesTable[-15+24] = 'f';
                siPrefixesTable[-12+24] = 'p';
                siPrefixesTable[-9+24]  = 'n';
                siPrefixesTable[-6+24]  = 'u';
                siPrefixesTable[-3+24]  = 'm';
                siPrefixesTable[-2+24]  = 'c';
                siPrefixesTable[-1+24]  = 'd';
                siPrefixesTable[0+24]   = '0';
                siPrefixesTable[+1+24]  = '1'; // 'da'
                siPrefixesTable[+2+24]  = 'h';
                siPrefixesTable[+3+24]  = 'k';
                siPrefixesTable[+6+24]  = 'M';
                siPrefixesTable[+9+24]  = 'G';
                siPrefixesTable[+12+24] = 'T';
                siPrefixesTable[+15+24] = 'P';
                siPrefixesTable[+18+24] = 'E';
                siPrefixesTable[+21+24] = 'Z';
                siPrefixesTable[+24+24] = 'Y';
                if (siPrefixesTable[exponent+24] != '0' ){
                    tempNumber[baseIndex] = siPrefixesTable[exponent+24];
                    baseIndex ++;
                }
            } else {
                Int32 sizeOfExpoent = snprintf(tempNumber + baseIndex, 100, "E%+d", (Int32)exponent);
                baseIndex += sizeOfExpoent;
            }
            TempStackCString numberPart((Utf8Char*)tempNumber, baseIndex);
            GenerateFinalNumeric(formatOptions, bufferBegin, pSize, &numberPart, negative);
        }
    }
}

/* This function will calculate the length and fill the numeric string if necessary.
 *
 * */
void GenerateFinalNumeric (const FormatOptions* formatOptions, char* bufferBegin, Int32* pSize, TempStackCString* numberPart, Boolean negative)
{
    // the input buffer is pure numeric. will generate the final format numeric with '+' or padding zero.
    TempStackCString leadingPart;
    Int32 width = formatOptions->MinimumFieldWidth;

    if (!negative) {
        if (formatOptions->ShowSign) {
            leadingPart.AppendCStr("+");
        } else if(formatOptions->SignPad) {
            leadingPart.AppendCStr(" ");
        }
    } else {
        leadingPart.AppendCStr("-");
    }
    if (formatOptions->LeftJustify) {
        width = width - leadingPart.Length();
        width = width>0? width : 0;
        *pSize = snprintf(bufferBegin, 100, "%s%-*s", leadingPart.BeginCStr(), width, numberPart->BeginCStr());
    } else {
        // calculate the padding
        width = width - leadingPart.Length();
        width = width - numberPart->Length();
        if (width <=0 ) {
            *pSize = snprintf(bufferBegin, 100, "%s%s", leadingPart.BeginCStr(), numberPart->BeginCStr());
        } else {
            if (formatOptions->ZeroPad) {
                *pSize = snprintf(bufferBegin, 100, "%s%0*d%s", leadingPart.BeginCStr(), width, 0, numberPart->BeginCStr());
            } else {
                *pSize = snprintf(bufferBegin, 100, "%*s%s%s", width, " ", leadingPart.BeginCStr(), numberPart->BeginCStr());
            }
         }
    }
}

//---------------------------------------------------------------------------------------------
void FormatScan(StringRef buffer, SubString *format, Int32 count, StaticTypeAndData arguments[])
{
	// the rules for ScanString in Labview is a subset of the sscanf.
	// p will be treated as f;
	// binary should be processed.
	// should be very careful when try to parse a float with local decimal point

    IntIndex argumentIndex = 0;
    SubString f(format);            // Make a copy to use locally
    const char decimalPointC = '.';
    char localDecimalPoint = '.';

    char c = 0;

    while (f.ReadRawChar(&c))
    {
        if (c == '\\' && f.ReadRawChar(&c)) {
            switch (c)
            {
                case 'n':       buffer->Append('\n');      break;
                case 'r':       buffer->Append('\r');      break;
                case 't':       buffer->Append('\t');      break;
                case 'b':       buffer->Append('\b');      break;
                case 'f':       buffer->Append('\f');      break;
                case 's':       buffer->Append(' ');       break;
                case '\\':      buffer->Append('\\');      break;
                default:  break;
            }
        } else if (c == ' ') {

        } else if (c == '%') {

        } else {

        }
    }


}

} // namespace Vireo
