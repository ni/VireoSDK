//
// Canvas2D.c
//
// This source for a sample DLL(windows) / sharedlibrary(linux) / framework(OSX)
// That LabVIEW will load as part of loadind a custom .RC file
//
// These are just stubs. This is just an example.

#import "Canvas2D.h"

typedef void* Canvas2DContextRef;

void ObtainCanvas2D(Canvas2DContextRef context, char* name)
{
}
void BeginPath(Canvas2DContextRef context)
{
}
void EndPath(Canvas2DContextRef context)
{
}
void Stroke(Canvas2DContextRef context)
{
}
void Fill(Canvas2DContextRef context)
{
}
void Save(Canvas2DContextRef context)
{
}
void Restore(Canvas2DContextRef context)
{
}
void MoveTo(Canvas2DContextRef context, double x, double y)
{
}
void LineTo(Canvas2DContextRef context, double x, double y)
{
}
void StrokeStyle(Canvas2DContextRef context, int color)
{
}
void StrokeStyleAlpha(Canvas2DContextRef context, int color, double alpha)
{
}
void FillStyle(Canvas2DContextRef context, int color)
{
}
void FillStyleAlpha(Canvas2DContextRef context, int color, double alpha)
{
}
void FillRect(Canvas2DContextRef context, double x, double y, double width, double height)
{
}
//Text
void Font(Canvas2DContextRef context, char* fontName)
{
}
void FillText(Canvas2DContextRef context, char* text, double x, double y, double width)
{
}
void StrokeText(Canvas2DContextRef context, char* text, double x, double y, double width)
{
}
void TextAlign(Canvas2DContextRef context, char* value)
{
}
void TextBaseLine(Canvas2DContextRef context, char* value)
{
}
//Transform
void Scale(Canvas2DContextRef context, double x, double y)
{
}
void Translate(Canvas2DContextRef context, double x, double y)
{
}
void Rotate(Canvas2DContextRef context, double angle)
{
}
