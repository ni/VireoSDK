/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Native Vireo maths functions for core types.
 */

#include <cstdlib>
#include <cmath>
#include <limits>

#include "TypeDefiner.h"
#include "TimeTypes.h"

using namespace Vireo;

#if (kVireoOS_win32U || kVireoOS_win64U)
#define log2(x) log(x)/log(2.)
Double rint(Double x)
{
    Double fracPart, intPart;
    fracPart = modf(x, &intPart);
    if (abs(fracPart) > 0.5)
        intPart += (x > 0) - (x < 0);
    else if ((abs(fracPart) == 0.5) && (((long long int) intPart) % 2))
        intPart += (x > 0) - (x < 0);
    return intPart;
}
#endif

// Different compilers expose different sets of function signatures for
// integer abs, so we define our own.
inline Int8  IntAbs(Int8  value) { return abs(value); }
inline Int16 IntAbs(Int16 value) { return abs(value); }
inline Int32 IntAbs(Int32 value) { return abs(value); }
inline Int64 IntAbs(Int64 value) { return llabs(value); }

#if defined(VIREO_TYPE_ComplexSingle) || defined(VIREO_TYPE_ComplexDouble)
    #include <complex>
    #if defined(VIREO_TYPE_ComplexSingle)
        typedef std::complex<float> ComplexSingle;
    #endif
    #if defined(VIREO_TYPE_ComplexDouble)
        typedef std::complex<Double> ComplexDouble;
    #endif
#endif

extern "C" {

//For some platfroms isnan, isinf, abs are functions in std not macros
using namespace std;

// Basic Math
#define DECLARE_VIREO_MATH_PRIMITIVES(TYPE) \
    DECLARE_VIREO_PRIMITIVE3( Add##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) + _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( Sub##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) - _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( Mul##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) * _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE2( Sign##TYPE, TYPE, TYPE, (_Param(1) = (_Param(0) > 0) - (_Param(0) < 0)) )

#define DEFINE_VIREO_MATH_FUNCTIONS(TYPE) \
    DEFINE_VIREO_FUNCTION(Add##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Sub##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Mul##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Sign##TYPE, ".UnOp"#TYPE)
//------------------------------------------------------------

//Integer Math 	TODO: Add rotate, shift
#define DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(TYPE) \
    /* Integer division operator not needed by LabVIEW */ \
    /* DECLARE_VIREO_PRIMITIVE3( Div##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(1) ? (_Param(0) / _Param(1)) : 0 ) ) */ \
    DECLARE_VIREO_PRIMITIVE3( Mod##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(1) ? (_Param(0) % _Param(1)) : 0 ) ) \
    VIREO_FUNCTION_SIGNATURE3(Quotient##TYPE, TYPE, TYPE, TYPE) \
    { \
        TYPE quotient, remainder; \
        if (_Param(1) == 0) \
            quotient = 0; \
        else { \
            quotient  = _Param(0) / _Param(1); \
            remainder = _Param(0) - _Param(1) * quotient; \
            if (remainder && ((_Param(0) > 0) != (_Param(1) > 0))) \
            { \
                quotient--; \
                remainder += _Param(1); \
            } \
        } \
        _Param(2) = quotient; \
        return _NextInstruction(); \
    } \
    VIREO_FUNCTION_SIGNATURE3(Remainder##TYPE, TYPE, TYPE, TYPE ) \
    { \
        TYPE quotient, remainder; \
        if (_Param(1) == 0) \
            remainder = _Param(0); \
        else { \
            quotient  = _Param(0) / _Param(1); \
            remainder = _Param(0) - _Param(1) * quotient; \
            if (remainder && ((_Param(0) > 0) != (_Param(1) > 0))) \
            { \
                quotient--; \
                remainder += _Param(1); \
            } \
        } \
        _Param(2) = remainder; \
        return _NextInstruction(); \
    }

#define DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(TYPE) \
    /* Integer division operator not needed by LabVIEW */ \
    /* DEFINE_VIREO_FUNCTION(Div##TYPE, ".BinOp"#TYPE) */ \
    DEFINE_VIREO_FUNCTION(Mod##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Quotient##TYPE, "p(i(."#TYPE") i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(Remainder##TYPE, "p(i(."#TYPE") i(."#TYPE") o(."#TYPE"))")

#define DECLARE_VIREO_INTEGER_SPLIT(DEST, SOURCE) \
    VIREO_FUNCTION_SIGNATURE3(Split##SOURCE, SOURCE, DEST, DEST) \
    { \
        DEST *x = (DEST *) _ParamPointer(0); \
        _Param(1) = sizeof(SOURCE) == 1 ? 0 : x[1]; \
        _Param(2) = x[0]; \
        return _NextInstruction(); \
    }
#define DECLARE_VIREO_INTEGER_JOIN(DEST, SOURCE) \
    VIREO_FUNCTION_SIGNATURE3(Join##SOURCE, SOURCE, SOURCE, DEST) \
    { \
        SOURCE *result = (SOURCE *) _ParamPointer(2); \
        result[0] = _Param(1); \
        result[1] = _Param(0); \
        return _NextInstruction(); \
    }

#define DEFINE_VIREO_INTEGER_SPLIT(DEST, SOURCE) \
    DEFINE_VIREO_FUNCTION(Split##SOURCE, "p(i(."#SOURCE") i(."#DEST") o(."#DEST"))")
#define DEFINE_VIREO_INTEGER_JOIN(DEST, SOURCE) \
    DEFINE_VIREO_FUNCTION(Join##SOURCE, "p(i(."#SOURCE") i(."#SOURCE") o(."#DEST"))")
//------------------------------------------------------------

//Signed Integer Math
#define DECLARE_VIREO_SIGNED_INTEGER_MATH_PRIMITIVES(TYPE) \
    DECLARE_VIREO_PRIMITIVE2( Absolute##TYPE, TYPE, TYPE, (_Param(1) = IntAbs(_Param(0)) ) )

#define DEFINE_VIREO_SIGNED_INTEGER_MATH_FUNCTIONS(TYPE) \
    DEFINE_VIREO_FUNCTION(Absolute##TYPE, "p(i(."#TYPE") o(."#TYPE"))")
//------------------------------------------------------------

//Floating-point Math
#define DECLARE_VIREO_FLOAT_MATH_PRIMITIVES(TYPE) \
    DECLARE_VIREO_PRIMITIVE3( Div##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) / _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE2( Sine##TYPE, TYPE, TYPE, (_Param(1) = sin(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Cosine##TYPE, TYPE, TYPE, (_Param(1) = cos(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Tangent##TYPE,TYPE, TYPE, (_Param(1) = tan(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Secant##TYPE, TYPE, TYPE, (_Param(1) = 1.0/cos(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Cosecant##TYPE, TYPE, TYPE, (_Param(1) = 1.0/sin(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Log10##TYPE, TYPE, TYPE, (_Param(1) = log10(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Log##TYPE, TYPE, TYPE, (_Param(1) = log(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Log2##TYPE, TYPE, TYPE, (_Param(1) = log2(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Exp##TYPE, TYPE, TYPE, (_Param(1) = exp(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( SquareRoot##TYPE, TYPE, TYPE, (_Param(1) = sqrt(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE3( Pow##TYPE, TYPE, TYPE, TYPE, (_Param(2) = pow(_Param(0), _Param(1)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( ArcSine##TYPE,TYPE, TYPE, (_Param(1) = asin(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( ArcCosine##TYPE, TYPE, TYPE, (_Param(1) = acos(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( ArcTan##TYPE, TYPE, TYPE, (_Param(1) = atan(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE3( ArcTan2##TYPE, TYPE, TYPE, TYPE, (_Param(2) = atan2(_Param(0), _Param(1)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Ceil##TYPE, TYPE, TYPE, (_Param(1) = ceil(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Absolute##TYPE, TYPE, TYPE, (_Param(1) = abs(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE2( Floor##TYPE, TYPE, TYPE, (_Param(1) = floor(_Param(0)) ) ) \
    DECLARE_VIREO_PRIMITIVE3( Quotient##TYPE, TYPE, TYPE, TYPE, (_Param(2) = floor(_Param(0) / _Param(1)) ) ) \
    DECLARE_VIREO_PRIMITIVE3( Remainder##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) - _Param(1) * floor(_Param(0) / _Param(1)) ) ) \

#define DEFINE_VIREO_FLOAT_MATH_FUNCTIONS(TYPE) \
    DEFINE_VIREO_FUNCTION(Div##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Cosine##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Sine##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Tangent##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Secant##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Cosecant##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Log10##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Log##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Log2##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Exp##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(SquareRoot##TYPE, ".UnOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Pow##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(ArcSine##TYPE, "p(i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(ArcCosine##TYPE, "p(i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(ArcTan##TYPE, "p(i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(ArcTan2##TYPE, "p(i(."#TYPE") i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(Ceil##TYPE, "p(i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(Absolute##TYPE, "p(i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(Floor##TYPE, "p(i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(Quotient##TYPE, "p(i(."#TYPE") i(."#TYPE") o(."#TYPE"))") \
    DEFINE_VIREO_FUNCTION(Remainder##TYPE, "p(i(."#TYPE") i(."#TYPE") o(."#TYPE"))")
//------------------------------------------------------------

// Bitwise
#define DECLARE_VIREO_BITWISE_PRIMITIVES(TYPE) \
    DECLARE_VIREO_PRIMITIVE3( And##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) & _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( Or##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) | _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( Nor##TYPE, TYPE, TYPE, TYPE, (_Param(2) = ~(_Param(0) | _Param(1))) ) \
    DECLARE_VIREO_PRIMITIVE3( Nand##TYPE, TYPE, TYPE, TYPE, (_Param(2) = ~(_Param(0) & _Param(1))) ) \
    DECLARE_VIREO_PRIMITIVE3( Xor##TYPE, TYPE, TYPE, TYPE, (_Param(2) = _Param(0) ^ _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE2( Not##TYPE, TYPE, TYPE, (_Param(1) = ~_Param(0)) )

#define DEFINE_VIREO_BITWISE_FUNCTIONS(TYPE) \
    DEFINE_VIREO_FUNCTION(And##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Or##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Nor##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Nand##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Xor##TYPE, ".BinOp"#TYPE) \
    DEFINE_VIREO_FUNCTION(Not##TYPE, ".BinOp"#TYPE)
    
//------------------------------------------------------------

// Comparison
#define DECLARE_VIREO_COMPARISON_PRIMITIVES(TYPE) \
    DECLARE_VIREO_PRIMITIVE3( IsLT##TYPE, TYPE, TYPE, Boolean, (_Param(2) = _Param(0) <  _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( IsLE##TYPE, TYPE, TYPE, Boolean, (_Param(2) = _Param(0) <= _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( IsEQ##TYPE, TYPE, TYPE, Boolean, (_Param(2) = _Param(0) == _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( IsNE##TYPE, TYPE, TYPE, Boolean, (_Param(2) = _Param(0) != _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( IsGT##TYPE, TYPE, TYPE, Boolean, (_Param(2) = _Param(0) >  _Param(1)) ) \
    DECLARE_VIREO_PRIMITIVE3( IsGE##TYPE, TYPE, TYPE, Boolean, (_Param(2) = _Param(0) >= _Param(1)) )

#define DEFINE_VIREO_COMPARISON_FUNCTIONS(TYPE) \
    DEFINE_VIREO_FUNCTION( IsLT##TYPE, "p(i(."#TYPE") i(."#TYPE") o(.Boolean))") \
    DEFINE_VIREO_FUNCTION( IsLE##TYPE, "p(i(."#TYPE") i(."#TYPE") o(.Boolean))") \
    DEFINE_VIREO_FUNCTION( IsEQ##TYPE, "p(i(."#TYPE") i(."#TYPE") o(.Boolean))") \
    DEFINE_VIREO_FUNCTION( IsNE##TYPE, "p(i(."#TYPE") i(."#TYPE") o(.Boolean))") \
    DEFINE_VIREO_FUNCTION( IsGT##TYPE, "p(i(."#TYPE") i(."#TYPE") o(.Boolean))") \
    DEFINE_VIREO_FUNCTION( IsGE##TYPE, "p(i(."#TYPE") i(."#TYPE") o(.Boolean))")
//------------------------------------------------------------

// Conversion
//#define BOOLEAN 0 //TODO, do we need boolean conversions?
#define TC_UINT8 1
#define TC_UINT16 2
#define TC_UINT32 3
#define TC_UINT64 4
#define TC_INT8 5
#define TC_INT16 6
#define TC_INT32 7
#define TC_INT64 8
#define TC_SINGLE 9
#define TC_DOUBLE 10

#define DECLARE_VIREO_CONVERSION_PRIMITIVE(DEST, SOURCE) DECLARE_VIREO_PRIMITIVE2(SOURCE##Convert##DEST, SOURCE, DEST, (_Param(1) = (DEST) _Param(0)))
#define DECLARE_VIREO_FLOAT_TO_INT_CONVERSION_PRIMITIVE(DEST, SOURCE) \
    VIREO_FUNCTION_SIGNATURE2(SOURCE##Convert##DEST, SOURCE, DEST) \
    { \
        SOURCE src = _Param(0); \
        if (isnan(src)) \
            _Param(1) = numeric_limits<DEST>::max(); \
        else if (isinf(src)) \
            _Param(1) = src < 0 ? numeric_limits<DEST>::min() : numeric_limits<DEST>::max(); \
        else \
            _Param(1) = (DEST) rint(src); \
        return _NextInstruction(); \
    }

#define DEFINE_VIREO_CONVERSION_FUNCTION(DEST, SOURCE) DEFINE_VIREO_FUNCTION( SOURCE##Convert##DEST, "p(i(."#SOURCE") o(."#DEST"))")
#define DEFINE_VIREO_FLOAT_TO_INT_CONVERSION_FUNCTION(DEST, SOURCE) DEFINE_VIREO_FUNCTION( SOURCE##Convert##DEST, "p(i(."#SOURCE") o(."#DEST"))")

//------------------------------------------------------------

// Branch Instructions
#define DECLARE_VIREO_CONDITIONAL_BRANCHES(TYPE) \
    DECLARE_VIREO_CONDITIONAL_BRANCH( BranchIfGT##TYPE, TYPE, TYPE, (_Param(1) > _Param(2)) ) \
    DECLARE_VIREO_CONDITIONAL_BRANCH( BranchIfGE##TYPE, TYPE, TYPE, (_Param(1) >= _Param(2)) ) \
    DECLARE_VIREO_CONDITIONAL_BRANCH( BranchIfLT##TYPE, TYPE, TYPE, (_Param(1) < _Param(2)) ) \
    DECLARE_VIREO_CONDITIONAL_BRANCH( BranchIfLE##TYPE, TYPE, TYPE, (_Param(1) <= _Param(2)) ) \
    DECLARE_VIREO_CONDITIONAL_BRANCH( BranchIfEQ##TYPE, TYPE, TYPE, (_Param(1) == _Param(2)) ) \
    DECLARE_VIREO_CONDITIONAL_BRANCH( BranchIfNE##TYPE, TYPE, TYPE, (_Param(1) != _Param(2)) )

#define DEFINE_VIREO_BRANCH_FUNCTIONS(TYPE) \
    DEFINE_VIREO_FUNCTION(BranchIfGT##TYPE, "p(i(.BranchTarget) i(."#TYPE") i(."#TYPE"))" ); \
    DEFINE_VIREO_FUNCTION(BranchIfGE##TYPE, "p(i(.BranchTarget) i(."#TYPE") i(."#TYPE"))"); \
    DEFINE_VIREO_FUNCTION(BranchIfLT##TYPE, "p(i(.BranchTarget) i(."#TYPE") i(."#TYPE"))"); \
    DEFINE_VIREO_FUNCTION(BranchIfLE##TYPE, "p(i(.BranchTarget) i(."#TYPE") i(."#TYPE"))"); \
    DEFINE_VIREO_FUNCTION(BranchIfEQ##TYPE, "p(i(.BranchTarget) i(."#TYPE") i(."#TYPE"))"); \
    DEFINE_VIREO_FUNCTION(BranchIfNE##TYPE, "p(i(.BranchTarget) i(."#TYPE") i(."#TYPE"))");
//------------------------------------------------------------

// Boolean
DECLARE_VIREO_COMPARISON_PRIMITIVES(Boolean)
//DECLARE_VIREO_CONVERSION_PRIMITIVES(Boolean)
DECLARE_VIREO_CONDITIONAL_BRANCH1( BranchIfTrue, Boolean, (_Param(1)) )
DECLARE_VIREO_CONDITIONAL_BRANCH1( BranchIfFalse, Boolean, (!_Param(1)) )
DECLARE_VIREO_PRIMITIVE3( AndBoolean, Boolean, Boolean, Boolean, (_Param(2) = _Param(0) & _Param(1)) ) \
DECLARE_VIREO_PRIMITIVE3( OrBoolean, Boolean, Boolean, Boolean, (_Param(2) = _Param(0) | _Param(1)) ) \
DECLARE_VIREO_PRIMITIVE3( NorBoolean, Boolean, Boolean, Boolean, (_Param(2) = !(_Param(0) | _Param(1))) ) \
DECLARE_VIREO_PRIMITIVE3( NandBoolean, Boolean, Boolean, Boolean, (_Param(2) = !(_Param(0) & _Param(1))) ) \
DECLARE_VIREO_PRIMITIVE3( XorBoolean, Boolean, Boolean, Boolean, (_Param(2) = _Param(0) ^ _Param(1)) ) \
DECLARE_VIREO_PRIMITIVE2( NotBoolean, Boolean, Boolean, (_Param(1) = !_Param(0)) )
//------------------------------------------------------------

// UInt8
DECLARE_VIREO_MATH_PRIMITIVES(UInt8)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(UInt8)
DECLARE_VIREO_INTEGER_SPLIT(UInt8,UInt8)
DECLARE_VIREO_INTEGER_JOIN(UInt16,UInt8)
DECLARE_VIREO_BITWISE_PRIMITIVES(UInt8)
DECLARE_VIREO_COMPARISON_PRIMITIVES(UInt8)
DECLARE_VIREO_CONDITIONAL_BRANCHES(UInt8)

#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, UInt8)
#define TYPE_CODE TC_UINT8
#include "ConversionTable.def"
//------------------------------------------------------------

// UInt16 
DECLARE_VIREO_MATH_PRIMITIVES(UInt16)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(UInt16)
DECLARE_VIREO_INTEGER_SPLIT(UInt8,UInt16)
DECLARE_VIREO_INTEGER_JOIN(UInt32,UInt16)
DECLARE_VIREO_BITWISE_PRIMITIVES(UInt16)
DECLARE_VIREO_COMPARISON_PRIMITIVES(UInt16)
DECLARE_VIREO_CONDITIONAL_BRANCHES(UInt16)

#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, UInt16)
#define TYPE_CODE TC_UINT16
#include "ConversionTable.def"
//------------------------------------------------------------

//UInt32
DECLARE_VIREO_MATH_PRIMITIVES(UInt32)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(UInt32)
DECLARE_VIREO_INTEGER_SPLIT(UInt16,UInt32)
DECLARE_VIREO_INTEGER_JOIN(UInt64,UInt32)
DECLARE_VIREO_BITWISE_PRIMITIVES(UInt32)
DECLARE_VIREO_COMPARISON_PRIMITIVES(UInt32)
DECLARE_VIREO_CONDITIONAL_BRANCHES(UInt32)

#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, UInt32)
#define TYPE_CODE TC_UINT32
#include "ConversionTable.def"
//------------------------------------------------------------

//UInt64
DECLARE_VIREO_MATH_PRIMITIVES(UInt64)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(UInt64)
DECLARE_VIREO_INTEGER_SPLIT(UInt32,UInt64)
DECLARE_VIREO_BITWISE_PRIMITIVES(UInt64)
DECLARE_VIREO_COMPARISON_PRIMITIVES(UInt64)
DECLARE_VIREO_CONDITIONAL_BRANCHES(UInt64)
#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, UInt64)
#define TYPE_CODE TC_UINT64
#include "ConversionTable.def"
//------------------------------------------------------------

// Int8
DECLARE_VIREO_MATH_PRIMITIVES(Int8)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(Int8)
DECLARE_VIREO_INTEGER_SPLIT(UInt8,Int8)
DECLARE_VIREO_INTEGER_JOIN(UInt16,Int8)
DECLARE_VIREO_SIGNED_INTEGER_MATH_PRIMITIVES(Int8)
DECLARE_VIREO_BITWISE_PRIMITIVES(Int8)
DECLARE_VIREO_COMPARISON_PRIMITIVES(Int8)
DECLARE_VIREO_CONDITIONAL_BRANCHES(Int8)
#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, Int8)
#define TYPE_CODE TC_INT8
#include "ConversionTable.def"
//------------------------------------------------------------

// Int16 
DECLARE_VIREO_MATH_PRIMITIVES(Int16)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(Int16)
DECLARE_VIREO_INTEGER_SPLIT(UInt8,Int16)
DECLARE_VIREO_INTEGER_JOIN(UInt32,Int16)
DECLARE_VIREO_SIGNED_INTEGER_MATH_PRIMITIVES(Int16)
DECLARE_VIREO_BITWISE_PRIMITIVES(Int16)
DECLARE_VIREO_COMPARISON_PRIMITIVES(Int16)
DECLARE_VIREO_PRIMITIVE2(BooleanConvertInt16, Boolean, Int16, (_Param(1) = (Int16) _Param(0)))
DECLARE_VIREO_CONDITIONAL_BRANCHES(Int16)
#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, Int16)
#define TYPE_CODE TC_INT16
#include "ConversionTable.def"
//------------------------------------------------------------

// Int32
DECLARE_VIREO_MATH_PRIMITIVES(Int32)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(Int32)
DECLARE_VIREO_INTEGER_SPLIT(UInt16,Int32)
DECLARE_VIREO_INTEGER_JOIN(UInt64,Int32)
DECLARE_VIREO_SIGNED_INTEGER_MATH_PRIMITIVES(Int32)
DECLARE_VIREO_BITWISE_PRIMITIVES(Int32)
DECLARE_VIREO_COMPARISON_PRIMITIVES(Int32)
DECLARE_VIREO_CONDITIONAL_BRANCHES(Int32)
#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, Int32)
#define TYPE_CODE TC_INT32
#include "ConversionTable.def"
//------------------------------------------------------------

// Int64
DECLARE_VIREO_MATH_PRIMITIVES(Int64)
DECLARE_VIREO_INTEGER_MATH_PRIMITIVES(Int64)
DECLARE_VIREO_INTEGER_SPLIT(UInt32,Int64)
DECLARE_VIREO_SIGNED_INTEGER_MATH_PRIMITIVES(Int64)
DECLARE_VIREO_BITWISE_PRIMITIVES(Int64)
DECLARE_VIREO_COMPARISON_PRIMITIVES(Int64)
DECLARE_VIREO_CONDITIONAL_BRANCHES(Int64)
#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, Int64)
#define TYPE_CODE TC_INT64
#include "ConversionTable.def"
//--------------------------

// Single
#if defined(VIREO_TYPE_Single)
DECLARE_VIREO_MATH_PRIMITIVES(Single)
DECLARE_VIREO_FLOAT_MATH_PRIMITIVES(Single)
DECLARE_VIREO_COMPARISON_PRIMITIVES(Single)
DECLARE_VIREO_CONDITIONAL_BRANCHES(Single)
#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, Single)
#define Y(TYPE) DECLARE_VIREO_FLOAT_TO_INT_CONVERSION_PRIMITIVE(TYPE, Single)
#define TYPE_CODE TC_SINGLE
#include "ConversionTable.def"
#endif

//------------------------------------------------------------

// IEEE754 Double
#if defined(VIREO_TYPE_Double)
DECLARE_VIREO_MATH_PRIMITIVES(Double)
DECLARE_VIREO_FLOAT_MATH_PRIMITIVES(Double)
DECLARE_VIREO_COMPARISON_PRIMITIVES(Double)
DECLARE_VIREO_CONDITIONAL_BRANCHES(Double)
#define X(TYPE) DECLARE_VIREO_CONVERSION_PRIMITIVE(TYPE, Double)
#define Y(TYPE) DECLARE_VIREO_FLOAT_TO_INT_CONVERSION_PRIMITIVE(TYPE, Double)
#define TYPE_CODE TC_DOUBLE
#include "ConversionTable.def"
VIREO_FUNCTION_SIGNATURE1(Random, Double)
{
    static Boolean seeded = false;
    if (_ParamPointer(0))
    {
        if (!seeded)
        {
            srand((unsigned int)PlatformTime::TicCount());
            seeded = true;
        }
        _Param(0) = rand() / ((Double) RAND_MAX + 1);
    }
    return _NextInstruction();
}
#endif
//------------------------------------------------------------

// Utf8Char
DECLARE_VIREO_COMPARISON_PRIMITIVES(Utf8Char)
//------------------------------------------------------------

//TODO: Make this into a macro and move to INTEGER_MATH
VIREO_FUNCTION_SIGNATURE3(LogicalShiftInt32, UInt32, UInt32, Int32)
{
    Int32 shift = _Param(1);
    if ( shift < 0) {
        _Param(2) = _Param(0) >> -shift;
    } else {
        _Param(2) = _Param(0) << shift;
    }
    return _NextInstruction();
}
    
VIREO_FUNCTION_SIGNATURE3(RotateInt32, Int32, Int32, Int32)
{
    // TODO complete this function
    Int32 rotate = _Param(1);
    if ( rotate < 0) {
        _Param(2) = _Param(0) >> -rotate;
    } else {
        _Param(2) = _Param(0) << rotate;
    }
    return _NextInstruction();
}


} // extern "C"

DEFINE_VIREO_BEGIN(LabVIEW_Math)
    // Function signatures
    DEFINE_VIREO_TYPE(BinOpBoolean, "p(i(.Boolean,x) i(.Boolean y) o(.Boolean result))")
    DEFINE_VIREO_TYPE(UnOpBoolean, "p(i(.Boolean,x) o(.Boolean result))")

    DEFINE_VIREO_TYPE(UnOpUInt8, "p(i(.UInt8 x) o(.UInt8 result))")
    DEFINE_VIREO_TYPE(BinOpUInt8, "p(i(.UInt8 x) i(.UInt8 y) o(.UInt8 result))")

    DEFINE_VIREO_TYPE(UnOpUInt16, "p(i(.UInt16 x) o(.UInt16 result))")
    DEFINE_VIREO_TYPE(BinOpUInt16, "p(i(.UInt16 x) i(.UInt16 y) o(.UInt16 result))")

    DEFINE_VIREO_TYPE(UnOpUInt32, "p(i(.UInt32 x) o(.UInt32 result))")
    DEFINE_VIREO_TYPE(BinOpUInt32, "p(i(.UInt32 x) i(.UInt32 y) o(.UInt32 result))")

    DEFINE_VIREO_TYPE(UnOpUInt64, "p(i(.UInt64 x) o(.UInt64 result))")
    DEFINE_VIREO_TYPE(BinOpUInt64, "p(i(.UInt64 x) i(.UInt64 y) o(.UInt64 result))")

    DEFINE_VIREO_TYPE(UnOpInt8, "p(i(.Int8 x)o(.Int8 result))")
    DEFINE_VIREO_TYPE(BinOpInt8, "p(i(.Int8 x)i(.Int8,y)o(.Int8 result))")

    DEFINE_VIREO_TYPE(UnOpInt16, "p(i(.Int16 x) o(.Int16,result))")
    DEFINE_VIREO_TYPE(BinOpInt16, "p(i(.Int16 x) i(.Int16 y)o(.Int16 result))")

    DEFINE_VIREO_TYPE(UnOpInt32, "p(i(.Int32 x) o(.Int32 result))")
    DEFINE_VIREO_TYPE(BinOpInt32, "p(i(.Int32 x) i(.Int32 y) o(.Int32 result))")

    DEFINE_VIREO_TYPE(UnOpInt64, "p(i(.Int64 x) o(.Int64 result))")
    DEFINE_VIREO_TYPE(BinOpInt64, "p(i(.Int64 x) i(.Int64 y) o(.Int64 result))")
    //--------------------------

    // Int1 (Boolean)
    DEFINE_VIREO_BITWISE_FUNCTIONS(Boolean)
    DEFINE_VIREO_FUNCTION(BranchIfTrue, "p(i(.BranchTarget) i(.Boolean))" );
    DEFINE_VIREO_FUNCTION(BranchIfFalse, "p(i(.BranchTarget) i(.Boolean))");
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Boolean)
    //TODO do we need conversion functions for booleans?? just to int16?
    //--------------------------

    // UInt8
    DEFINE_VIREO_MATH_FUNCTIONS(UInt8)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(UInt8)
    DEFINE_VIREO_INTEGER_SPLIT(UInt8,UInt8)
    DEFINE_VIREO_INTEGER_JOIN(UInt16,UInt8)
    DEFINE_VIREO_BITWISE_FUNCTIONS(UInt8)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(UInt8)
    DEFINE_VIREO_BRANCH_FUNCTIONS(UInt8)

    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, UInt8)
    #define TYPE_CODE TC_UINT8
    #include "ConversionTable.def"
    //--------------------------

    // UInt16
    DEFINE_VIREO_MATH_FUNCTIONS(UInt16)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(UInt16)
    DEFINE_VIREO_INTEGER_SPLIT(UInt8,UInt16)
    DEFINE_VIREO_INTEGER_JOIN(UInt32,UInt16)
    DEFINE_VIREO_BITWISE_FUNCTIONS(UInt16)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(UInt16)
    DEFINE_VIREO_BRANCH_FUNCTIONS(UInt16)

    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, UInt16)
    #define TYPE_CODE TC_UINT16
    #include "ConversionTable.def"
    //--------------------------

    // UInt32
    DEFINE_VIREO_MATH_FUNCTIONS(UInt32)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(UInt32)
    DEFINE_VIREO_INTEGER_SPLIT(UInt16,UInt32)
    DEFINE_VIREO_INTEGER_JOIN(UInt64,UInt32)
    DEFINE_VIREO_BITWISE_FUNCTIONS(UInt32)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(UInt32)
    DEFINE_VIREO_BRANCH_FUNCTIONS(UInt32)

    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, UInt32)
    #define TYPE_CODE TC_UINT32
    #include "ConversionTable.def"
    //--------------------------

    // UInt64
    DEFINE_VIREO_MATH_FUNCTIONS(UInt64)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(UInt64)
    DEFINE_VIREO_INTEGER_SPLIT(UInt32,UInt64)
    DEFINE_VIREO_BITWISE_FUNCTIONS(UInt64)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(UInt64)
    DEFINE_VIREO_BRANCH_FUNCTIONS(UInt64)
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, UInt64)
    #define TYPE_CODE TC_UINT64
    #include "ConversionTable.def"
    //--------------------------

    // Int8
    DEFINE_VIREO_MATH_FUNCTIONS(Int8)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(Int8)
    DEFINE_VIREO_INTEGER_SPLIT(UInt8,Int8)
    DEFINE_VIREO_INTEGER_JOIN(UInt16,Int8)
    DEFINE_VIREO_SIGNED_INTEGER_MATH_FUNCTIONS(Int8)
    DEFINE_VIREO_BITWISE_FUNCTIONS(Int8)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Int8)
    DEFINE_VIREO_BRANCH_FUNCTIONS(Int8)
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, Int8)
    #define TYPE_CODE TC_INT8
    #include "ConversionTable.def"
    //--------------------------

    // Int16
    DEFINE_VIREO_MATH_FUNCTIONS(Int16)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(Int16)
    DEFINE_VIREO_INTEGER_SPLIT(UInt8,Int16)
    DEFINE_VIREO_INTEGER_JOIN(UInt32,Int16)
    DEFINE_VIREO_SIGNED_INTEGER_MATH_FUNCTIONS(Int16)
    DEFINE_VIREO_BITWISE_FUNCTIONS(Int16)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Int16)
    DEFINE_VIREO_FUNCTION( BooleanConvertInt16, "p(i(.Boolean) o(.Int16))")
    DEFINE_VIREO_BRANCH_FUNCTIONS(Int16)
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, Int16)
    #define TYPE_CODE TC_INT16
    #include "ConversionTable.def"
    //--------------------------

    // Int32
    DEFINE_VIREO_MATH_FUNCTIONS(Int32)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(Int32)
    DEFINE_VIREO_INTEGER_SPLIT(UInt16,Int32)
    DEFINE_VIREO_INTEGER_JOIN(UInt64,Int32)
    DEFINE_VIREO_SIGNED_INTEGER_MATH_FUNCTIONS(Int32)
    DEFINE_VIREO_BITWISE_FUNCTIONS(Int32)
    DEFINE_VIREO_FUNCTION(LogicalShiftInt32, ".BinOpInt32")
    DEFINE_VIREO_FUNCTION(RotateInt32, ".BinOpInt32")
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Int32)
    DEFINE_VIREO_BRANCH_FUNCTIONS(Int32)
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, Int32)
    #define TYPE_CODE TC_INT32
    #include "ConversionTable.def"
    //--------------------------

    // Int64
    DEFINE_VIREO_MATH_FUNCTIONS(Int64)
    DEFINE_VIREO_INTEGER_MATH_FUNCTIONS(Int64)
    DEFINE_VIREO_INTEGER_SPLIT(UInt32,Int64)
    DEFINE_VIREO_SIGNED_INTEGER_MATH_FUNCTIONS(Int64)
    DEFINE_VIREO_BITWISE_FUNCTIONS(Int64)
//    DEFINE_VIREO_FUNCTION(LogicalShiftInt64, ".BinOpInt64")
//    DEFINE_VIREO_FUNCTION(RotateInt64, ".BinOpInt64")
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Int64)
    DEFINE_VIREO_BRANCH_FUNCTIONS(Int64)
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, Int64)
    #define TYPE_CODE TC_INT64
    #include "ConversionTable.def"
    //--------------------------

    //Single
#if defined(VIREO_TYPE_Single)
#if 0
    // TODO, once type dpendecy sequencing works these definitions can be moved here.
    DEFINE_VIREO_TYPE(SingleAtomic, "c(e(bc(e(bb(32 IEEE754B)))))")
    DEFINE_VIREO_TYPE(SingleCluster, "c(e(bc(e(bb(1 Boolean) sign) e(bb(8 IntBiased) exponent) e(bb(23 Q1) fraction))))")
    DEFINE_VIREO_TYPE(Single, "eq(e(.SingleAtomic), e(.SingleCluster))")
#endif

    DEFINE_VIREO_TYPE(UnOpSingle, "p(i(.Single,x),o(.Single,result))")
    DEFINE_VIREO_TYPE(BinOpSingle, "p(i(.Single,x),i(.Single,y),o(.Single,result))")
    DEFINE_VIREO_MATH_FUNCTIONS(Single)
    DEFINE_VIREO_FLOAT_MATH_FUNCTIONS(Single)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Single)
    DEFINE_VIREO_BRANCH_FUNCTIONS(Single)

    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, Single)
    #define Y(TYPE) DEFINE_VIREO_FLOAT_TO_INT_CONVERSION_FUNCTION(TYPE, Single)
    #define TYPE_CODE TC_SINGLE
    #include "ConversionTable.def"
#endif
    //--------------------------

    // Double
#if defined(VIREO_TYPE_Double)
    DEFINE_VIREO_TYPE(UnOpDouble, "p(i(.Double,x),o(.Double,result))")
    DEFINE_VIREO_TYPE(BinOpDouble, "p(i(.Double,x),i(.Double,y),o(.Double,result))")
    DEFINE_VIREO_TYPE(E, "dv(.Double  2.7182818284590451)")
    DEFINE_VIREO_TYPE(Pi, "dv(.Double  3.1415926535897931)")
    DEFINE_VIREO_TYPE(Tau, "dv(.Double  6.283185307179586)")
    DEFINE_VIREO_MATH_FUNCTIONS(Double)
    DEFINE_VIREO_FLOAT_MATH_FUNCTIONS(Double)
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Double)
    DEFINE_VIREO_BRANCH_FUNCTIONS(Double)
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, Double)
    #define Y(TYPE) DEFINE_VIREO_FLOAT_TO_INT_CONVERSION_FUNCTION(TYPE, Double)
    #define TYPE_CODE TC_DOUBLE
    #include "ConversionTable.def"
    DEFINE_VIREO_FUNCTION(Random, "p(o(.Double))" );
#endif
    //--------------------------

    // Utf8Char
    DEFINE_VIREO_COMPARISON_FUNCTIONS(Utf8Char)
    //--------------------------
DEFINE_VIREO_END()

//------------------------------------------------------------
#if defined(VIREO_TYPE_ComplexSingle)

#define X(TYPE) DECLARE_VIREO_PRIMITIVE2(ComplexSingleConvert##TYPE, ComplexSingle, TYPE, (_Param(1) = (TYPE) _Param(0).real()))
#include "ConversionTable.def"

#define X(TYPE) DECLARE_VIREO_PRIMITIVE2(TYPE##ConvertComplexSingle, TYPE, ComplexSingle, (_Param(1) = (ComplexSingle) _Param(0)))
#include "ConversionTable.def"

// TODO: ArcSine, ArcCosine, ArcTan, ArcTan2
DECLARE_VIREO_PRIMITIVE3( AddComplexSingle, ComplexSingle, ComplexSingle, ComplexSingle, (_Param(2) = _Param(0) + _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( SubComplexSingle, ComplexSingle, ComplexSingle, ComplexSingle, (_Param(2) = _Param(0) - _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( MulComplexSingle, ComplexSingle, ComplexSingle, ComplexSingle, (_Param(2) = _Param(0) * _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( DivComplexSingle, ComplexSingle, ComplexSingle, ComplexSingle, (_Param(2) = _Param(0) / _Param(1)) )
DECLARE_VIREO_PRIMITIVE2( SignComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = _Param(0) / abs(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( AbsoluteComplexSingle, ComplexSingle, Single, (_Param(1) = abs(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( NormComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = norm(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( PhaseComplexSingle, ComplexSingle, Single, (_Param(1) = arg(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( ConjugateComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = conj(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( SquareRootComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = sqrt(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( SineComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = sin(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( CosineComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = cos(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( TanComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = tan(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( SecantComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = 1.0f/cos(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( CosecantComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = 1.0f/sin(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( Log10ComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = log10(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( LogComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = log(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( Log2ComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = log(_Param(0))/log(2.0f) ) )
DECLARE_VIREO_PRIMITIVE2( ExpComplexSingle, ComplexSingle, ComplexSingle, (_Param(1) = exp(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE3( PowComplexSingle, ComplexSingle, ComplexSingle, ComplexSingle, (_Param(2) = pow(_Param(0), _Param(1)) ) )

DEFINE_VIREO_BEGIN(LabVIEW_Math)
    DEFINE_VIREO_TYPE(UnOpComplexSingle, "p(i(.ComplexSingle,x) o(.ComplexSingle,result))")
    DEFINE_VIREO_TYPE(BinOpComplexSingle, "p(i(.ComplexSingle,x) i(.ComplexSingle,y) o(.ComplexSingle,result))")

    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, ComplexSingle)
    #include "ConversionTable.def"
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(ComplexSingle, TYPE)
    #include "ConversionTable.def"

    DEFINE_VIREO_FUNCTION(AddComplexSingle, "p(i(.ComplexSingle) i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(SubComplexSingle, "p(i(.ComplexSingle) i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(MulComplexSingle, "p(i(.ComplexSingle) i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(DivComplexSingle, "p(i(.ComplexSingle) i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(SignComplexSingle, "p(i(.ComplexSingle) o(.Single))")
    DEFINE_VIREO_FUNCTION(AbsoluteComplexSingle, "p(i(.ComplexSingle) o(.Single))")
    DEFINE_VIREO_FUNCTION(NormComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(PhaseComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(ConjugateComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(SquareRootComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(SineComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(CosineComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(TanComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(SecantComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(CosecantComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(Log10ComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(LogComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(Log2ComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(ExpComplexSingle, "p(i(.ComplexSingle) o(.ComplexSingle))")
    DEFINE_VIREO_FUNCTION(PowComplexSingle, "p(i(.ComplexSingle) i(.ComplexSingle) o(.ComplexSingle))")

DEFINE_VIREO_END()
#endif

//------------------------------------------------------------
#if defined(VIREO_TYPE_ComplexDouble)

#define X(TYPE) DECLARE_VIREO_PRIMITIVE2(ComplexDoubleConvert##TYPE, ComplexDouble, TYPE, (_Param(1) = (TYPE) _Param(0).real()))
#include "ConversionTable.def"

#define X(TYPE) DECLARE_VIREO_PRIMITIVE2(TYPE##ConvertComplexDouble, TYPE, ComplexDouble, (_Param(1) = (ComplexDouble) _Param(0)))
#include "ConversionTable.def"

DECLARE_VIREO_PRIMITIVE3( AddComplexDouble, ComplexDouble, ComplexDouble, ComplexDouble, (_Param(2) = _Param(0) + _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( SubComplexDouble, ComplexDouble, ComplexDouble, ComplexDouble, (_Param(2) = _Param(0) - _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( MulComplexDouble, ComplexDouble, ComplexDouble, ComplexDouble, (_Param(2) = _Param(0) * _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( DivComplexDouble, ComplexDouble, ComplexDouble, ComplexDouble, (_Param(2) = _Param(0) / _Param(1)) )
DECLARE_VIREO_PRIMITIVE2( SignComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = _Param(0) / abs(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( AbsoluteComplexDouble, ComplexDouble, Double, (_Param(1) = abs(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( NormComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = norm(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( PhaseComplexDouble, ComplexDouble, Double, (_Param(1) = arg(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( ConjugateComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = conj(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( SquareRootComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = sqrt(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( SineComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = sin(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( CosineComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = cos(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( TanComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = tan(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( SecantComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = 1.0/cos(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( CosecantComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = 1.0/sin(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( Log10ComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = log10(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( LogComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = log(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE2( Log2ComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = log(_Param(0))/log(2.0) ) )
DECLARE_VIREO_PRIMITIVE2( ExpComplexDouble, ComplexDouble, ComplexDouble, (_Param(1) = exp(_Param(0)) ) )
DECLARE_VIREO_PRIMITIVE3( PowComplexDouble, ComplexDouble, ComplexDouble, ComplexDouble, (_Param(2) = pow(_Param(0), _Param(1)) ) )
//TODO - DECLARE_VIREO_PRIMITIVE3( CxPolar, Double, Double, ComplexDouble, (_Param(2) = polar(_Param(0), _Param(1)) ) )

DEFINE_VIREO_BEGIN(LabVIEW_Math)
    DEFINE_VIREO_TYPE(UnOpComplexDouble, "p(i(.ComplexDouble,x) o(.ComplexDouble,result))")
    DEFINE_VIREO_TYPE(BinOpComplexDouble, "p(i(.ComplexDouble,x) i(.ComplexDouble,y) o(.ComplexDouble,result))")

    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(TYPE, ComplexDouble)
    #include "ConversionTable.def"
    #define X(TYPE) DEFINE_VIREO_CONVERSION_FUNCTION(ComplexDouble, TYPE)
    #include "ConversionTable.def"

    DEFINE_VIREO_FUNCTION(AddComplexDouble, "p(i(.ComplexDouble) i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(SubComplexDouble, "p(i(.ComplexDouble) i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(MulComplexDouble, "p(i(.ComplexDouble) i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(DivComplexDouble, "p(i(.ComplexDouble) i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(SignComplexDouble, "p(i(.ComplexDouble) o(.Double))")
    DEFINE_VIREO_FUNCTION(AbsoluteComplexDouble, "p(i(.ComplexDouble) o(.Double))")
    DEFINE_VIREO_FUNCTION(NormComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(PhaseComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(ConjugateComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(SquareRootComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(SineComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(CosineComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(TanComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(SecantComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(CosecantComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(Log10ComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(LogComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(Log2ComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(ExpComplexDouble, "p(i(.ComplexDouble) o(.ComplexDouble))")
    DEFINE_VIREO_FUNCTION(PowComplexDouble, "p(i(.ComplexDouble) i(.ComplexDouble) o(.ComplexDouble))")
DEFINE_VIREO_END()

#endif

