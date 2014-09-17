var __ctx;
var LibraryCanvas2D = {
jsObtainCanvas2D: function(style, len)
{
    var theCanvas = document.getElementById(Pointer_stringify(style, len));
    __ctx = theCanvas.getContext("2d");
    // Just a start, need to keep map of contexts
    // could return index or object
    return 0;
},
jsClip: function(c) {__ctx.clip()},
jsBeginPath: function(c) {__ctx.beginPath()},
jsClosePath: function(c) {__ctx.closePath()},
jsMoveTo: function(c,x,y) { __ctx.moveTo(x, y)},
jsLineTo: function(c,x,y) {__ctx.lineTo(x, y)},
jsIsPointInPath: function(c,x,y) {__ctx.isPointInPath(x,y)},
jsBezierCurveTo: function(c,c1x,c1y,c2x,c2y,x,y) {__ctx.bezierCurveTo(c1x,c1y,c2x,c2y,x,y)},
jsQuadraticCurveTo: function(c,cx,cy,x,y) {__ctx.quadraticCurveTo(cx,cy,x,y)},
jsArc: function(c,x1,y1,x2,y2,r) {__ctx.arc(x1,y1,x2,y2,r)},
jsArcTo: function(c,x1,y1,x2,y2,r) {__ctx.arcTo(x1,y1,x2,y2,r)},
jsStroke: function(c) {__ctx.stroke()},
jsFill: function(c) {__ctx.fill()},
//Style
jsFillStyle: function(c,s) {__ctx.fillStyle=Pointer_stringify(s)},
jsStrokeStyle: function(c,s) {__ctx.strokeStyle=Pointer_stringify(s)},
jsLineWidth: function(c,w) {__ctx.lineWidth=w},
jsLineCap: function(c,cap) {__ctx.lineCap=cap},
jsLineJoin: function(c,j) {__ctx.lineJoin=j},
jsMiterLimit: function(c,ml) {__ctx.miterLimit=ml},
jsCreateRadialGradiant: function(c,x1,y1,r1,x2,y2,r2) {return __ctx.createRadialGradiant(x1,y1,r1,x2,y2,r2)},
jsCreateLinearGradiant: function(c,x1,y1,x2,x2) {return __ctx.createLinearGradiant(x1,y1,x2,y2)},
jsAddColorStop: function(gradient,v,color) {gradient.createLinearGradiant(v,color)},
//Rect
jsRect: function(c,x,y,w,h) {__ctx.rect(x,y,w,h)},
jsFillRect: function(c,x,y,w,h) {__ctx.fillRect(x,y,w,h)},
jsClearRect: function(c,x,y,w,h) {__ctx.clearRect(x,y,w,h)},
//Text
jsFont: function(c,f,len) {__ctx.fillStyle=Pointer_stringify(f,len)},
jsFillText: function(c,t,len,x,y,w) {__ctx.fillText(Pointer_stringify(t,len),x,y,w)},
jsStrokeText: function(c,t,len,x,y,w) {__ctx.strokeText(Pointer_stringify(t,len),x,y,w)},
jsTextAlign: function(c,v) {__ctx.textAlign=Pointer_stringify(v)},
jsTextBaseline: function(c,v) {__ctx.textBaseline=Pointer_stringify(v)},
//Transform
jsScale: function(c,sx,sy) { __ctx.scale(sx,sy)},
jsTranslate: function(c,tx,ty) { __ctx.translate(tx,ty)},
jsRotate: function(c,a) { __ctx.rotate(a)},
jsTransform: function(cx,a,b,c,d,e,f) {__ctx.transform(a,b,c,d,e,f)},
jsSetTransform: function(cx,a,b,c,d,e,f) {__ctx.setTransform(a,b,c,d,e,f)},
};

mergeInto(LibraryManager.library, LibraryCanvas2D);