/**
 
 Copyright (c) 2014 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#if kVireoOS_emscripten
    #include "Emscripten.h"
#endif

using namespace Vireo;

typedef Int32 Canvas2D;

#if kVireoOS_emscripten
extern "C" {
extern Int32 jsObtainCanvas2D(const char*, int);
extern void jsBeginPath(Int32);
extern void jsClosePath(Int32);
extern void jsStroke(Int32);
extern void jsFill(Int32);
extern void jsMoveTo(Int32, double, double);
extern void jsLineTo(Int32, double, double);
extern void jsBezierCurveTo(Int32, double, double, double, double, double, double);
extern void jsFillStyle(Int32, const char*);
extern void jsStrokeStyle(Int32, const char*);
extern void jsLineWidth(Int32, Int32);
extern void jsFillRect(Int32, double, double, double, double);
extern void jsFillText(Int32, const char*, int, double, double, double);
extern void jsStrokeText(Int32, const char*, int, double, double, double);
extern void jsFont(Int32, const char*, int);
}
#endif

//------------------------------------------------------------
typedef  char JSColorString[64];
void ColorToJSColor(Int32 value, JSColorString pBuffer)
{
    // Format "#xxxxxxxx"  - 9 characters + zero
    static const char *hexChars = "0123456789AFCDEF";
    char* pCurrent = pBuffer + 7;
    *pCurrent-- = 0;
    *pBuffer = '#';
    while (pCurrent > pBuffer) {
        *pCurrent-- = hexChars[value & 0x0000000F];
        value >>= 4;
    }
}
//------------------------------------------------------------
void ColorAlphaToJSColor(Int32 value, Double alpha, JSColorString pBuffer)
{
    // Format "rgb(nnn,nnn,nnn,1.nnn" - roughly 21 characters + zero
    
    if (alpha > 1.0)
        alpha = 1.0;
    
    // Comentary, Java script has pretty complex way to set color with alpha.
    // hard to believe it's necessary to format a string, but for now it works.
    snprintf(pBuffer, sizeof(JSColorString), "rgba(%u,%u,%u,%1.3f)",
            (unsigned int)((value & 0x00FF0000) >> 16),
            (unsigned int)((value & 0x0000FF00) >> 8),
            (unsigned int)(value & 0x000000FF),
            alpha);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ObtainCanvas2D, Canvas2D, StringRef)
{
#if kVireoOS_emscripten
    _Param(0) = jsObtainCanvas2D((char*)_Param(1)->Begin(), _Param(1)->Length());
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(BeginPath, Canvas2D)
{
    
#if kVireoOS_emscripten
    jsBeginPath(_Param(0));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(ClosePath, Canvas2D)
{
    
#if kVireoOS_emscripten
    jsClosePath(_Param(0));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(MoveTo, Canvas2D, const Double, const Double)
{

#if kVireoOS_emscripten
    jsMoveTo(_Param(0),_Param(1),_Param(2));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(LineTo, Canvas2D, const Double, const Double)
{
    
#if kVireoOS_emscripten
    jsLineTo(_Param(0),_Param(1),_Param(2));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE7(BezierCurveTo, Canvas2D, const Double, const Double, const Double, const Double, const Double, const Double)
{
    
#if kVireoOS_emscripten
    jsBezierCurveTo(_Param(0),_Param(1),_Param(2),_Param(3),_Param(4),_Param(5),_Param(6));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(FillStyle, Canvas2D, Int32)
{
#if kVireoOS_emscripten
    JSColorString xstr;
    ColorToJSColor(_Param(1), xstr);
    jsFillStyle(_Param(0), xstr);
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(StrokeStyle, Canvas2D, Int32)
{
#if kVireoOS_emscripten
    JSColorString xstr;
    ColorToJSColor(_Param(1), xstr);
    jsStrokeStyle(_Param(0), xstr);
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(FillStyleAlpha, Canvas2D, Int32, Double)
{
#if kVireoOS_emscripten
    JSColorString xstr;
    ColorAlphaToJSColor(_Param(1), _Param(2), xstr);
    jsFillStyle(_Param(0), xstr);
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(FillText, Canvas2D, StringRef, Double, Double, Double)
{
#if kVireoOS_emscripten
    jsFillText(_Param(0), (char*)_Param(1)->Begin(), _Param(1)->Length(), _Param(2), _Param(3), _Param(4));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(Font, Canvas2D, StringRef)
{
#if kVireoOS_emscripten
    jsFont(_Param(0), (char*)_Param(1)->Begin(), _Param(1)->Length());
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(StrokeStyleAlpha, Canvas2D, Int32, Double)
{
#if kVireoOS_emscripten
    JSColorString xstr;
    ColorAlphaToJSColor(_Param(1), _Param(2), xstr);
    jsStrokeStyle(_Param(0), xstr);
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(LineWidth, Canvas2D, Double)
{
#if kVireoOS_emscripten
    jsLineWidth(_Param(0), _Param(1));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(FillRect, Int32, Double, Double, Double, Double)
{
#if kVireoOS_emscripten
    jsFillRect(_Param(0), _Param(1), _Param(2), _Param(3), _Param(4));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(Stroke, Canvas2D)
{
#if kVireoOS_emscripten
    jsStroke(_Param(0));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(Fill, Canvas2D)
{
#if kVireoOS_emscripten
    jsFill(_Param(0));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_Canvas2D)

    DEFINE_VIREO_TYPE(Canvas2D, ".Int32")
    // Primitives
    DEFINE_VIREO_FUNCTION(ObtainCanvas2D, "p(io(.Canvas2D)i(.String))");
    DEFINE_VIREO_FUNCTION(BeginPath, "p(io(.Canvas2D))");
    DEFINE_VIREO_FUNCTION(ClosePath, "p(io(.Canvas2D))");
    DEFINE_VIREO_FUNCTION(FillStyle, "p(io(.Canvas2D)i(.Int32))");
    DEFINE_VIREO_FUNCTION(StrokeStyle, "p(io(.Canvas2D)i(.Int32))");
    DEFINE_VIREO_FUNCTION(FillStyleAlpha, "p(io(.Canvas2D)i(.Int32)i(.Double))");
    DEFINE_VIREO_FUNCTION(StrokeStyleAlpha, "p(io(.Canvas2D)i(.Int32)i(.Double))");
    DEFINE_VIREO_FUNCTION(LineWidth, "p(io(.Canvas2D)i(.Double))");
    DEFINE_VIREO_FUNCTION(FillRect, "p(io(.Canvas2D)i(.Double)i(.Double)i(.Double)i(.Double))");
    DEFINE_VIREO_FUNCTION(MoveTo, "p(io(.Canvas2D)i(.Double)i(.Double))");
    DEFINE_VIREO_FUNCTION(BezierCurveTo, "p(io(.Canvas2D)i(.Double)i(.Double)i(.Double)i(.Double)i(.Double)i(.Double))");
//    DEFINE_VIREO_FUNCTION(ArcTo, "p(i(.Canvas2D)i(.Double)i(.Double)i(.Double)i(.Double)i(.Double)i(.Double))");

    DEFINE_VIREO_FUNCTION(LineTo, "p(io(.Canvas2D)i(.Double)i(.Double))");
    DEFINE_VIREO_FUNCTION(Stroke, "p(io(.Canvas2D))");
    DEFINE_VIREO_FUNCTION(Fill, "p(io(.Canvas2D))");
    DEFINE_VIREO_FUNCTION(Font, "p(io(.Canvas2D)i(.String))");
    DEFINE_VIREO_FUNCTION(FillText, "p(io(.Canvas2D)i(.String)i(.Double)i(.Double)i(.Double))");

DEFINE_VIREO_END()
