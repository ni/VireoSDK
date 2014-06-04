// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [null,null,null,null,null,null,null,null,null,null],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;

function jsCall() {
  var args = Array.prototype.slice.call(arguments);
  return Runtime.functionPointers[args[0]].apply(null, args.slice(1));
}








//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===
var __ZTVN10__cxxabiv117__class_type_infoE = 32952;
var __ZTVN10__cxxabiv120__si_class_type_infoE = 32992;




STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(33723);
/* global initializers */ __ATINIT__.push();


/* memory initializer */ allocate([0,0,0,0,0,0,0,0,65,108,108,111,99,97,116,105,111,110,115,32,37,52,100,44,32,65,81,67,111,117,110,116,32,37,53,122,100,44,32,83,104,97,114,101,84,121,112,101,115,32,37,100,32,40,37,115,41,10,0,0,0,0,0,0,0,0,0,0,40,23,0,0,22,0,0,0,23,0,0,0,22,0,0,0,22,0,0,0,23,0,0,0,22,0,0,0,23,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,22,0,0,0,23,0,0,0,25,0,0,0,26,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,160,25,0,0,24,0,0,0,25,0,0,0,25,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,26,0,0,0,27,0,0,0,29,0,0,0,30,0,0,0,28,0,0,0,24,0,0,0,25,0,0,0,29,0,0,0,31,0,0,0,0,0,0,0,200,25,0,0,26,0,0,0,27,0,0,0,28,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,29,0,0,0,30,0,0,0,29,0,0,0,25,0,0,0,28,0,0,0,24,0,0,0,25,0,0,0,29,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,25,0,0,28,0,0,0,29,0,0,0,31,0,0,0,22,0,0,0,23,0,0,0,22,0,0,0,23,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,22,0,0,0,23,0,0,0,25,0,0,0,32,0,0,0,0,0,0,0,32,26,0,0,30,0,0,0,31,0,0,0,32,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,26,0,0,0,23,0,0,0,25,0,0,0,34,0,0,0,0,0,0,0,200,24,0,0,32,0,0,0,33,0,0,0,33,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,32,0,0,0,27,0,0,0,28,0,0,0,33,0,0,0,26,0,0,0,0,0,0,0,248,24,0,0,34,0,0,0,35,0,0,0,34,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,34,0,0,0,29,0,0,0,30,0,0,0,35,0,0,0,26,0,0,0,0,0,0,0,72,25,0,0,36,0,0,0,37,0,0,0,35,0,0,0,35,0,0,0,36,0,0,0,36,0,0,0,37,0,0,0,36,0,0,0,24,0,0,0,37,0,0,0,25,0,0,0,38,0,0,0,31,0,0,0,32,0,0,0,39,0,0,0,31,0,0,0,0,0,0,0,80,26,0,0,38,0,0,0,39,0,0,0,37,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,33,0,0,0,34,0,0,0,40,0,0,0,26,0,0,0,40,69,114,114,111,114,32,105,110,118,97,108,105,100,32,117,115,97,103,101,32,116,121,112,101,32,60,37,100,62,32,105,110,32,80,97,114,97,109,66,108,111,99,107,41,10,0,0,0,0,0,0,120,25,0,0,40,0,0,0,41,0,0,0,38,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,26,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,41,0,0,0,35,0,0,0,25,0,0,0,29,0,0,0,31,0,0,0,0,0,0,0,120,26,0,0,42,0,0,0,43,0,0,0,39,0,0,0,27,0,0,0,38,0,0,0,42,0,0,0,43,0,0,0,26,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,28,0,0,0,24,0,0,0,25,0,0,0,29,0,0,0,31,0,0,0,0,0,0,0,168,26,0,0,44,0,0,0,45,0,0,0,39,0,0,0,27,0,0,0,38,0,0,0,42,0,0,0,43,0,0,0,26,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,44,0,0,0,36,0,0,0,25,0,0,0,29,0,0,0,31,0,0,0,0,0,0,0,216,26,0,0,46,0,0,0,47,0,0,0,40,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,26,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,28,0,0,0,37,0,0,0,38,0,0,0,45,0,0,0,31,0,0,0,0,0,0,0,48,0,0,0,184,4,0,0,0,0,0,0,76,97,98,86,73,69,87,95,84,121,112,101,115,0,0,0,46,0,0,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,100,97,116,97,32,116,121,112,101,0,0,98,99,0,0,0,0,0,0,99,0,0,0,0,0,0,0,112,0,0,0,0,0,0,0,98,98,0,0,0,0,0,0,97,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,100,118,0,0,0,0,0,0,101,113,0,0,0,0,0,0,112,116,114,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,116,121,112,101,32,112,114,105,109,105,116,105,118,101,0,0,0,0,0,40,0,0,0,0,0,0,0,39,40,39,32,109,105,115,115,105,110,103,0,0,0,0,0,41,0,0,0,0,0,0,0,101,0,0,0,0,0,0,0,105,0,0,0,0,0,0,0,111,0,0,0,0,0,0,0,105,111,0,0,0,0,0,0,115,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,105,109,0,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,101,108,101,109,101,110,116,32,116,121,112,101,0,0,0,0,0,0,0,39,41,39,32,109,105,115,115,105,110,103,0,0,0,0,0,73,110,118,97,108,105,100,32,97,114,114,97,121,32,100,105,109,101,110,115,105,111,110,0,72,111,115,116,80,111,105,110,116,101,114,83,105,122,101,0,66,111,111,108,101,97,110,0,73,69,69,69,55,53,52,66,0,0,0,0,0,0,0,0,85,73,110,116,0,0,0,0,83,73,110,116,0,0,0,0,81,0,0,0,0,0,0,0,81,49,0,0,0,0,0,0,73,110,116,66,105,97,115,101,100,0,0,0,0,0,0,0,83,73,110,116,49,99,0,0,65,115,99,105,105,0,0,0,66,105,116,115,0,0,0,0,85,110,105,99,111,100,101,0,71,101,110,101,114,105,99,0,80,111,105,110,116,101,114,0,45,0,0,0,0,0,0,0,73,103,110,111,114,105,110,103,32,101,120,116,114,97,32,97,114,114,97,121,32,105,110,105,116,105,97,108,105,122,101,114,32,101,108,101,109,101,110,116,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,0,0,0,0,0,0,0,68,97,116,97,32,101,110,99,111,100,105,110,103,32,110,111,116,32,102,111,114,109,97,116,116,101,100,32,99,111,114,114,101,99,116,108,121,0,0,0,68,97,116,97,32,105,110,116,32,115,105,122,101,32,110,111,116,32,115,117,112,111,114,116,101,100,0,0,0,0,0,0,116,114,117,101,0,0,0,0,102,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,68,97,116,97,32,98,111,111,108,101,97,110,32,118,97,108,117,101,32,115,121,110,116,97,120,32,101,114,114,111,114,0,68,97,116,97,32,98,111,111,108,101,97,110,32,115,105,122,101,32,103,114,101,97,116,101,114,32,116,104,97,110,32,49,0,0,0,0,0,0,0,0,68,97,116,97,32,73,69,69,69,55,53,52,32,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,0,0,0,68,97,116,97,32,73,69,69,69,55,53,52,32,115,105,122,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,115,99,97,108,97,114,32,116,104,97,116,32,105,115,32,117,110,105,99,111,100,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,121,112,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,0,0,0,0,0,0,0,0,80,97,114,115,105,110,103,32,112,111,105,110,116,101,114,32,116,121,112,101,0,0,0,0,78,111,32,112,97,114,115,101,114,32,102,111,114,32,100,97,116,97,32,116,121,112,101,39,115,32,101,110,99,111,100,105,110,103,0,0,0,0,0,0,99,108,117,109,112,0,0,0,69,109,112,116,121,80,97,114,97,109,101,116,101,114,76,105,115,116,0,0,0,0,0,0,86,73,32,67,108,117,109,112,32,99,111,117,110,116,32,109,105,115,115,105,110,103,0,0,86,73,32,67,108,117,109,112,32,99,111,117,110,116,32,105,110,99,111,114,114,101,99,116,0,0,0,0,0,0,0,0,39,99,108,117,109,112,39,32,109,105,115,115,105,110,103,0,102,105,114,101,32,99,111,117,110,116,32,109,105,115,115,105,110,103,0,0,0,0,0,0,80,101,114,99,104,0,0,0,112,101,114,99,104,32,108,97,98,101,108,32,101,114,114,111,114,0,0,0,0,0,0,0,70,117,110,99,116,105,111,110,32,110,111,116,32,102,111,117,110,100,0,0,0,0,0,0,86,97,114,65,114,103,67,111,117,110,116,0,0,0,0,0,66,114,97,110,99,104,84,97,114,103,101,116,0,0,0,0,67,108,117,109,112,0,0,0,86,73,0,0,0,0,0,0,73,110,115,116,114,117,99,116,105,111,110,70,117,110,99,116,105,111,110,0,0,0,0,0,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,0,0,0,0,0,0,0,83,116,97,116,105,99,83,116,114,105,110,103,0,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,84,79,68,79,62,0,0,37,42,108,108,100,0,0,0,37,42,108,108,117,0,0,0,42,42,117,110,115,117,112,111,114,116,101,100,32,116,121,112,101,42,42,0,0,0,0,0,110,97,110,0,0,0,0,0,45,105,110,102,0,0,0,0,105,110,102,0,0,0,0,0,37,71,0,0,0,0,0,0,95,110,117,108,108,0,0,0,110,117,108,108,0,0,0,0,42,42,42,84,79,68,79,32,112,111,105,110,116,101,114,32,116,121,112,101,0,0,0,0,100,105,117,111,120,88,102,70,101,69,103,71,97,65,99,115,112,37,0,0,0,0,0,0,83,116,114,105,110,103,0,0,168,4,0,0,49,0,0,0,88,10,0,0,0,0,0,0,68,97,116,97,65,110,100,84,121,112,101,67,111,100,101,99,85,116,102,56,0,0,0,0,72,10,0,0,50,0,0,0,128,10,0,0,0,0,0,0,84,68,67,111,100,101,99,76,86,70,108,97,116,0,0,0,84,114,97,99,101,0,0,0,87,97,114,110,105,110,103,0,69,114,114,111,114,0,0,0,72,97,114,100,69,114,114,111,114,0,0,0,0,0,0,0,65,115,115,101,114,116,0,0,69,118,101,110,116,0,0,0,40,76,105,110,101,32,37,100,32,37,115,32,34,37,115,32,39,37,46,42,115,39,46,34,41,10,0,0,0,0,0,0,40,76,105,110,101,32,37,100,32,37,115,32,34,37,115,46,34,41,10,0,0,0,0,0,37,115,0,0,0,0,0,0,99,40,101,40,98,98,40,49,32,66,111,111,108,101,97,110,41,41,41,0,0,0,0,0,99,40,101,40,98,98,40,42,32,71,101,110,101,114,105,99,41,41,41,0,0,0,0,0,85,73,110,116,56,0,0,0,99,40,101,40,98,98,40,56,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,0,73,110,116,56,0,0,0,0,99,40,101,40,98,98,40,56,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,0,0,99,40,101,40,98,98,40,49,54,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,73,110,116,49,54,0,0,0,99,40,101,40,98,98,40,49,54,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,85,73,110,116,51,50,65,116,111,109,105,99,0,0,0,0,99,40,101,40,98,98,40,51,50,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,85,73,110,116,51,50,67,108,117,115,116,101,114,0,0,0,99,40,101,40,46,85,73,110,116,49,54,32,72,105,87,111,114,100,41,32,101,40,46,85,73,110,116,49,54,32,76,111,87,111,114,100,41,41,0,0,85,73,110,116,51,50,0,0,101,113,40,101,40,46,85,73,110,116,51,50,65,116,111,109,105,99,41,32,101,40,46,85,73,110,116,51,50,67,108,117,115,116,101,114,41,41,0,0,73,110,116,51,50,0,0,0,99,40,101,40,98,98,40,51,50,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,85,73,110,116,54,52,0,0,99,40,101,40,98,98,40,54,52,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,73,110,116,54,52,0,0,0,99,40,101,40,98,98,40,54,52,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,66,108,111,99,107,49,50,56,0,0,0,0,0,0,0,0,99,40,101,40,98,98,40,49,50,56,32,66,105,116,115,41,41,41,0,0,0,0,0,0,66,108,111,99,107,50,53,54,0,0,0,0,0,0,0,0,99,40,101,40,98,98,40,50,53,54,32,66,105,116,115,41,41,41,0,0,0,0,0,0,83,105,110,103,108,101,65,116,111,109,105,99,0,0,0,0,99,40,101,40,98,98,40,51,50,32,73,69,69,69,55,53,52,66,41,41,41,0,0,0,83,105,110,103,108,101,67,108,117,115,116,101,114,0,0,0,99,40,101,40,98,99,40,101,40,98,98,40,49,32,66,111,111,108,101,97,110,41,32,115,105,103,110,41,32,101,40,98,98,40,56,32,73,110,116,66,105,97,115,101,100,41,32,101,120,112,111,110,101,110,116,41,32,101,40,98,98,40,50,51,32,81,49,41,32,102,114,97,99,116,105,111,110,41,41,41,41,0,0,0,0,0,0,0,83,105,110,103,108,101,0,0,101,113,40,101,40,46,83,105,110,103,108,101,65,116,111,109,105,99,41,32,101,40,46,83,105,110,103,108,101,67,108,117,115,116,101,114,41,41,0,0,68,111,117,98,108,101,65,116,111,109,105,99,0,0,0,0,99,40,101,40,98,98,40,54,52,32,73,69,69,69,55,53,52,66,41,41,41,0,0,0,68,111,117,98,108,101,67,108,117,115,116,101,114,0,0,0,99,40,101,40,98,99,40,101,40,98,98,40,49,32,66,111,111,108,101,97,110,41,32,115,105,103,110,41,32,32,101,40,98,98,40,49,49,32,73,110,116,66,105,97,115,101,100,41,32,32,101,120,112,111,110,101,110,116,41,32,32,101,40,98,98,40,53,50,32,81,49,41,32,32,102,114,97,99,116,105,111,110,41,41,41,41,0,0,68,111,117,98,108,101,0,0,101,113,40,101,40,46,68,111,117,98,108,101,65,116,111,109,105,99,41,32,101,40,46,68,111,117,98,108,101,67,108,117,115,116,101,114,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,99,40,101,40,46,83,105,110,103,108,101,32,114,101,97,108,41,32,101,40,46,83,105,110,103,108,101,32,105,109,97,103,105,110,97,114,121,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,99,40,101,40,46,68,111,117,98,108,101,32,114,101,97,108,41,32,101,40,46,68,111,117,98,108,101,32,105,109,97,103,105,110,97,114,121,41,41,0,84,105,109,101,0,0,0,0,99,40,101,40,46,73,110,116,54,52,32,115,101,99,111,110,100,115,41,32,101,40,46,85,73,110,116,54,52,32,102,114,97,99,116,105,111,110,115,41,41,0,0,0,0,0,0,0,65,115,99,105,105,67,104,97,114,0,0,0,0,0,0,0,99,40,101,40,98,98,40,56,32,65,115,99,105,105,41,41,41,0,0,0,0,0,0,0,85,116,102,56,67,104,97,114,0,0,0,0,0,0,0,0,99,40,101,40,98,98,40,56,32,85,110,105,99,111,100,101,41,41,41,0,0,0,0,0,65,115,99,105,105,65,114,114,97,121,49,68,0,0,0,0,97,40,46,65,115,99,105,105,67,104,97,114,32,42,41,0,85,116,102,56,65,114,114,97,121,49,68,0,0,0,0,0,97,40,46,85,116,102,56,67,104,97,114,32,42,41,0,0,46,85,116,102,56,65,114,114,97,121,49,68,0,0,0,0,65,115,99,105,105,83,116,114,105,110,103,0,0,0,0,0,46,65,115,99,105,105,65,114,114,97,121,49,68,0,0,0,83,116,114,105,110,103,65,114,114,97,121,49,68,0,0,0,97,40,46,83,116,114,105,110,103,32,42,41,0,0,0,0,67,111,100,101,80,111,105,110,116,101,114,0,0,0,0,0,99,40,101,40,98,98,40,72,111,115,116,80,111,105,110,116,101,114,83,105,122,101,32,80,111,105,110,116,101,114,41,41,41,0,0,0,0,0,0,0,68,97,116,97,80,111,105,110,116,101,114,0,0,0,0,0,46,68,97,116,97,80,111,105,110,116,101,114,0,0,0,0,46,67,111,100,101,80,111,105,110,116,101,114,0,0,0,0,73,110,115,116,114,117,99,116,105,111,110,83,110,105,112,112,101,116,0,0,0,0,0,0,99,40,41,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,0,0,0,0,0,83,116,97,116,105,99,84,121,112,101,0,0,0,0,0,0,79,98,106,101,99,116,0,0,65,114,114,97,121,0,0,0,65,114,114,97,121,49,68,0,86,97,114,105,97,110,116,0,99,40,101,40,46,83,116,97,116,105,99,84,121,112,101,41,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,41,41,0,0,0,0,0,0,0,99,40,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,98,101,103,105,110,41,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,101,110,100,41,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,10,0,0,51,0,0,0,80,17,0,0,0,0,0,0,76,97,98,86,73,69,87,95,69,120,101,99,117,116,105,111,110,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,69,114,114,111,114,32,34,68,111,117,98,108,101,32,80,101,114,99,104,32,60,37,100,62,32,110,111,116,32,115,117,112,112,111,114,116,101,100,34,41,10,0,0,0,0,0,0,40,69,114,114,111,114,32,34,80,101,114,99,104,32,60,37,100,62,32,101,120,99,101,101,100,115,32,108,105,109,105,116,115,34,41,10,0,0,0,0,40,69,114,114,111,114,32,34,80,101,114,99,104,32,108,97,98,101,108,32,115,121,110,116,97,120,32,101,114,114,111,114,32,60,37,46,42,115,62,34,41,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,101,101,110,116,114,97,110,116,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,110,111,116,32,114,101,115,111,108,118,101,100,0,0,0,84,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,84,111,111,32,102,101,119,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,84,121,112,101,32,109,105,115,109,97,116,99,104,44,32,97,114,103,117,109,101,110,116,32,115,104,111,117,108,100,32,98,101,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,110,111,116,32,111,112,116,105,111,110,97,108,0,0,0,65,114,103,117,109,101,110,116,32,110,111,116,32,109,117,116,97,98,108,101,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,99,108,117,109,112,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,108,111,99,97,108,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,112,101,114,99,104,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,112,97,114,97,109,101,116,101,114,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,103,108,111,98,97,108,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,100,101,102,97,117,108,116,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,115,116,97,116,105,99,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,105,102,117,110,99,116,105,111,110,0,0,0,85,110,107,110,111,119,110,32,97,114,103,117,109,101,110,116,32,116,121,112,101,0,0,0,67,97,108,108,86,73,0,0,73,110,105,116,0,0,0,0,67,111,112,121,0,0,0,0,67,108,101,97,114,0,0,0,67,111,112,121,84,111,112,0,90,101,114,111,79,117,116,84,111,112,0,0,0,0,0,0,67,117,108,68,101,83,97,99,0,0,0,0,0,0,0,0,68,111,110,101,0,0,0,0,104,109,0,0,0,0,0,0,248,108,0,0,0,0,0,0,64,17,0,0,52,0,0,0,32,20,0,0,0,0,0,0,76,97,98,86,73,69,87,95,69,120,101,99,117,116,105,111,110,50,0,0,0,0,0,0,16,20,0,0,53,0,0,0,16,8,0,0,0,0,0,0,56,20,0,0,54,0,0,0,88,20,0,0,0,0,0,0,76,97,98,86,73,69,87,95,77,97,116,104,0,0,0,0,72,20,0,0,55,0,0,0,88,20,0,0,0,0,0,0,104,20,0,0,56,0,0,0,88,20,0,0,0,0,0,0,120,20,0,0,57,0,0,0,152,20,0,0,0,0,0,0,76,97,98,86,73,69,87,95,83,116,114,105,110,103,0,0,67,111,112,121,49,0,0,0,67,111,112,121,50,0,0,0,67,111,112,121,52,0,0,0,67,111,112,121,56,0,0,0,67,111,112,121,49,54,0,0,67,111,112,121,51,50,0,0,67,111,112,121,78,0,0,0,67,111,112,121,79,98,106,101,99,116,0,0,0,0,0,0,67,111,112,121,83,116,97,116,105,99,84,121,112,101,100,66,108,111,99,107,0,0,0,0,84,121,112,101,32,77,105,115,109,97,116,99,104,0,0,0,83,112,108,105,116,0,0,0,74,111,105,110,0,0,0,0,86,101,99,116,111,114,86,101,99,116,111,114,83,112,108,105,116,79,112,0,0,0,0,0,86,101,99,116,111,114,86,101,99,116,111,114,66,105,110,97,114,121,65,99,99,117,109,117,108,97,116,111,114,79,112,0,86,101,99,116,111,114,86,101,99,116,111,114,66,105,110,97,114,121,79,112,0,0,0,0,86,101,99,116,111,114,83,99,97,108,97,114,66,105,110,97,114,121,79,112,0,0,0,0,83,99,97,108,97,114,86,101,99,116,111,114,66,105,110,97,114,121,79,112,0,0,0,0,65,99,99,117,109,117,108,97,116,111,114,0,0,0,0,0,67,108,117,115,116,101,114,66,105,110,97,114,121,79,112,0,67,111,110,118,101,114,116,0,86,101,99,116,111,114,85,110,97,114,121,79,112,0,0,0,67,108,117,115,116,101,114,85,110,97,114,121,79,112,0,0,40,69,114,114,111,114,32,34,70,117,99,110,116,105,111,110,32,60,37,46,42,115,62,32,100,105,100,32,110,111,116,32,114,101,115,111,108,118,101,32,116,111,32,115,112,101,99,105,102,105,99,32,116,121,112,101,34,41,10,0,0,0,0,0,83,101,97,114,99,104,49,68,65,114,114,97,121,73,110,116,101,114,110,97,108,0,0,0,73,115,69,81,0,0,0,0,65,100,100,69,108,101,109,101,110,116,115,0,0,0,0,0,65,100,100,0,0,0,0,0,77,117,108,116,105,112,108,121,69,108,101,109,101,110,116,115,0,0,0,0,0,0,0,0,77,117,108,0,0,0,0,0,65,110,100,69,108,101,109,101,110,116,115,0,0,0,0,0,65,110,100,0,0,0,0,0,79,114,69,108,101,109,101,110,116,115,0,0,0,0,0,0,79,114,0,0,0,0,0,0,86,101,99,116,111,114,79,112,73,110,116,101,114,110,97,108,0,0,0,0,0,0,0,0,65,114,114,97,121,67,111,110,99,97,116,101,110,97,116,101,73,110,116,101,114,110,97,108,0,0,0,0,0,0,0,0,136,20,0,0,58,0,0,0,0,23,0,0,0,0,0,0,76,97,98,86,73,69,87,95,68,97,116,97,0,0,0,0,78,53,86,105,114,101,111,49,48,84,121,112,101,67,111,109,109,111,110,69,0,0,0,0,192,128,0,0,16,23,0,0,0,0,0,0,144,23,0,0,59,0,0,0,60,0,0,0,22,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,22,0,0,0,23,0,0,0,25,0,0,0,26,0,0,0,78,53,86,105,114,101,111,49,51,65,103,103,114,105,103,97,116,101,84,121,112,101,69,0,232,128,0,0,120,23,0,0,40,23,0,0,0,0,0,0,0,0,0,0,8,24,0,0,46,0,0,0,61,0,0,0,78,53,86,105,114,101,111,50,54,67,108,117,115,116,101,114,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,0,0,0,78,53,86,105,114,101,111,50,56,65,103,103,114,105,103,97,116,101,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,0,192,128,0,0,216,23,0,0,232,128,0,0,176,23,0,0,0,24,0,0,0,0,0,0,0,0,0,0,80,24,0,0,47,0,0,0,62,0,0,0,78,53,86,105,114,101,111,50,57,80,97,114,97,109,66,108,111,99,107,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,232,128,0,0,40,24,0,0,0,24,0,0,0,0,0,0,0,0,0,0,160,24,0,0,48,0,0,0,63,0,0,0,78,53,86,105,114,101,111,51,48,69,113,117,105,118,97,108,101,110,99,101,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,0,0,0,0,0,0,0,232,128,0,0,112,24,0,0,0,24,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,67,108,117,115,116,101,114,84,121,112,101,69,0,0,0,232,128,0,0,176,24,0,0,144,23,0,0,0,0,0,0,78,53,86,105,114,101,111,49,53,69,113,117,105,118,97,108,101,110,99,101,84,121,112,101,69,0,0,0,0,0,0,0,232,128,0,0,216,24,0,0,144,23,0,0,0,0,0,0,78,53,86,105,114,101,111,57,65,114,114,97,121,84,121,112,101,69,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,87,114,97,112,112,101,100,84,121,112,101,69,0,0,0,232,128,0,0,32,25,0,0,40,23,0,0,0,0,0,0,232,128,0,0,8,25,0,0,56,25,0,0,0,0,0,0,78,53,86,105,114,101,111,49,54,68,101,102,97,117,108,116,86,97,108,117,101,84,121,112,101,69,0,0,0,0,0,0,232,128,0,0,88,25,0,0,56,25,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,69,108,101,109,101,110,116,84,121,112,101,69,0,0,0,232,128,0,0,136,25,0,0,56,25,0,0,0,0,0,0,78,53,86,105,114,101,111,57,78,97,109,101,100,84,121,112,101,69,0,0,0,0,0,0,232,128,0,0,176,25,0,0,56,25,0,0,0,0,0,0,78,53,86,105,114,101,111,49,50,66,105,116,66,108,111,99,107,84,121,112,101,69,0,0,232,128,0,0,216,25,0,0,40,23,0,0,0,0,0,0,78,53,86,105,114,101,111,49,52,66,105,116,67,108,117,115,116,101,114,84,121,112,101,69,0,0,0,0,0,0,0,0,232,128,0,0,0,26,0,0,144,23,0,0,0,0,0,0,78,53,86,105,114,101,111,49,52,80,97,114,97,109,66,108,111,99,107,84,121,112,101,69,0,0,0,0,0,0,0,0,232,128,0,0,48,26,0,0,144,23,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,80,111,105,110,116,101,114,84,121,112,101,69,0,0,0,232,128,0,0,96,26,0,0,56,25,0,0,0,0,0,0,78,53,86,105,114,101,111,49,55,67,117,115,116,111,109,80,111,105,110,116,101,114,84,121,112,101,69,0,0,0,0,0,232,128,0,0,136,26,0,0,120,26,0,0,0,0,0,0,78,53,86,105,114,101,111,49,56,67,117,115,116,111,109,68,97,116,97,80,114,111,99,84,121,112,101,69,0,0,0,0,232,128,0,0,184,26,0,0,56,25,0,0,0,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,0,0,71,101,110,101,114,105,99,66,105,110,79,112,0,0,0,0,112,40,105,40,46,42,41,32,105,40,46,42,41,32,111,40,46,42,41,41,0,0,0,0,71,101,110,101,114,105,99,85,110,79,112,0,0,0,0,0,112,40,105,40,46,42,41,32,111,40,46,42,41,41,0,0,46,71,101,110,101,114,105,99,85,110,79,112,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,56,41,41,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,32,111,40,46,73,110,116,49,54,41,41,0,112,40,105,40,46,73,110,116,51,50,41,32,32,111,40,46,73,110,116,51,50,41,41,0,112,40,105,40,46,73,110,116,54,52,41,32,32,111,40,46,73,110,116,54,52,41,41,0,112,40,105,40,46,66,108,111,99,107,49,50,56,41,32,111,40,46,66,108,111,99,107,49,50,56,41,41,0,0,0,0,112,40,105,40,46,66,108,111,99,107,50,53,54,41,32,111,40,46,66,108,111,99,107,50,53,54,41,41,0,0,0,0,112,40,105,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,111,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,105,40,46,73,110,116,51,50,41,41,0,0,0,0,112,40,105,40,46,79,98,106,101,99,116,41,32,111,40,46,79,98,106,101,99,116,41,41,0,0,0,0,0,0,0,0,112,40,105,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,111,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,105,40,46,83,116,97,116,105,99,84,121,112,101,41,41,0,0,0,0,0,0,0,78,111,116,0,0,0,0,0,46,71,101,110,101,114,105,99,66,105,110,79,112,0,0,0,88,111,114,0,0,0,0,0,78,97,110,100,0,0,0,0,78,111,114,0,0,0,0,0,73,115,78,69,0,0,0,0,73,115,76,84,0,0,0,0,73,115,71,84,0,0,0,0,73,115,76,69,0,0,0,0,73,115,71,69,0,0,0,0,83,117,98,0,0,0,0,0,68,105,118,0,0,0,0,0,77,111,100,0,0,0,0,0,81,117,111,116,105,101,110,116,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,0,0,0,0,0,0,0,112,40,105,40,46,42,41,32,111,40,46,42,41,32,111,40,46,42,41,41,0,0,0,0,83,105,110,101,0,0,0,0,67,111,115,105,110,101,0,0,84,97,110,103,101,110,116,0,83,101,99,97,110,116,0,0,67,111,115,101,99,97,110,116,0,0,0,0,0,0,0,0,76,111,103,49,48,0,0,0,76,111,103,0,0,0,0,0,76,111,103,50,0,0,0,0,69,120,112,0,0,0,0,0,83,113,117,97,114,101,82,111,111,116,0,0,0,0,0,0,80,111,119,0,0,0,0,0,65,114,99,83,105,110,101,0,65,114,99,67,111,115,105,110,101,0,0,0,0,0,0,0,65,114,99,84,97,110,0,0,65,114,99,84,97,110,50,0,67,101,105,108,0,0,0,0,65,98,115,111,108,117,116,101,0,0,0,0,0,0,0,0,78,111,114,109,0,0,0,0,80,104,97,115,101,0,0,0,67,111,110,106,117,103,97,116,101,0,0,0,0,0,0,0,70,108,111,111,114,0,0,0,83,105,103,110,0,0,0,0,83,101,97,114,99,104,49,68,65,114,114,97,121,0,0,0,112,40,105,40,46,42,41,32,105,40,46,42,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,32,115,40,46,42,41,41,0,0,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,42,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,32,115,40,46,42,41,41,0,0,0,0,65,114,114,97,121,67,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,0,0,0,112,40,105,40,46,86,97,114,65,114,103,67,111,117,110,116,41,32,111,40,46,65,114,114,97,121,32,111,117,116,112,117,116,41,32,105,40,46,42,41,41,0,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,111,40,46,42,32,111,117,116,112,117,116,41,41,0,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,111,40,46,42,32,111,117,116,112,117,116,41,32,105,40,46,66,111,111,108,101,97,110,41,41,0,0,0,112,40,105,40,46,42,41,32,105,40,46,42,41,32,111,40,46,42,41,32,115,40,46,42,41,32,115,40,46,42,41,41,0,0,0,0,0,0,0,0,112,40,105,40,46,42,41,32,111,40,46,42,41,32,115,40,46,42,41,41,0,0,0,0,73,115,69,81,65,99,99,117,109,117,108,97,116,111,114,0,112,40,105,40,46,71,101,110,101,114,105,99,66,105,110,79,112,41,41,0,0,0,0,0,73,115,78,69,65,99,99,117,109,117,108,97,116,111,114,0,73,115,76,84,65,99,99,117,109,117,108,97,116,111,114,0,73,115,71,84,65,99,99,117,109,117,108,97,116,111,114,0,73,115,76,69,65,99,99,117,109,117,108,97,116,111,114,0,73,115,71,69,65,99,99,117,109,117,108,97,116,111,114,0,112,40,105,40,46,65,114,114,97,121,41,44,32,105,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,112,40,105,40,46,65,114,114,97,121,41,44,32,105,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,32,115,40,46,42,41,41,0,0,0,112,40,105,40,46,65,114,114,97,121,41,44,32,111,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,112,40,105,40,46,42,41,32,105,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,42,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,44,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,0,0,82,101,112,108,97,99,101,83,117,98,115,116,114,105,110,103,0,0,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,0,83,101,97,114,99,104,65,110,100,82,101,112,108,97,99,101,83,116,114,105,110,103,0,0,112,40,111,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,66,111,111,108,101,97,110,41,32,105,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,83,101,97,114,99,104,83,112,108,105,116,83,116,114,105,110,103,0,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,114,105,110,103,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,83,116,114,105,110,103,84,111,85,112,112,101,114,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,0,0,0,83,116,114,105,110,103,84,111,76,111,119,101,114,0,0,0,83,116,114,105,110,103,67,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,0,0,112,40,105,40,46,86,97,114,65,114,103,67,111,117,110,116,41,32,105,40,46,83,116,114,105,110,103,41,32,111,40,46,65,114,114,97,121,41,41,0,66,114,97,110,99,104,73,102,69,81,83,116,114,105,110,103,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,83,116,114,105,110,103,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,83,116,114,105,110,103,0,0,0,0,0,0,0,0,85,110,79,112,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,120,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,66,105,110,79,112,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,120,41,32,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,121,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,0,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,68,111], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([117,98,108,101,41,41,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,65,100,100,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,83,117,98,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,77,117,108,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,68,105,118,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,83,105,103,110,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,78,111,114,109,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,80,104,97,115,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,67,111,110,106,117,103,97,116,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,83,113,117,97,114,101,82,111,111,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,83,105,110,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,84,97,110,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,83,101,99,97,110,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,67,111,115,101,99,97,110,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,76,111,103,49,48,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,76,111,103,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,76,111,103,50,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,69,120,112,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,80,111,119,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,85,110,79,112,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,120,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,66,105,110,79,112,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,120,41,32,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,121,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,0,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,65,100,100,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,83,117,98,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,77,117,108,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,68,105,118,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,83,105,103,110,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,78,111,114,109,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,80,104,97,115,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,67,111,110,106,117,103,97,116,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,83,113,117,97,114,101,82,111,111,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,83,105,110,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,84,97,110,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,83,101,99,97,110,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,67,111,115,101,99,97,110,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,76,111,103,49,48,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,76,111,103,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,76,111,103,50,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,69,120,112,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,80,111,119,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,105,110,79,112,66,111,111,108,101,97,110,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,44,120,41,32,105,40,46,66,111,111,108,101,97,110,32,121,41,32,111,40,46,66,111,111,108,101,97,110,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,85,110,79,112,66,111,111,108,101,97,110,0,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,44,120,41,32,111,40,46,66,111,111,108,101,97,110,32,114,101,115,117,108,116,41,41,0,0,0,0,0,85,110,79,112,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,32,120,41,32,111,40,46,85,73,110,116,56,32,114,101,115,117,108,116,41,41,0,66,105,110,79,112,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,32,120,41,32,105,40,46,85,73,110,116,56,32,121,41,32,111,40,46,85,73,110,116,56,32,114,101,115,117,108,116,41,41,0,0,0,0,0,85,110,79,112,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,32,120,41,32,111,40,46,85,73,110,116,49,54,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,32,120,41,32,105,40,46,85,73,110,116,49,54,32,121,41,32,111,40,46,85,73,110,116,49,54,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,32,120,41,32,111,40,46,85,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,32,120,41,32,105,40,46,85,73,110,116,51,50,32,121,41,32,111,40,46,85,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,32,120,41,32,111,40,46,85,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,32,120,41,32,105,40,46,85,73,110,116,54,52,32,121,41,32,111,40,46,85,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,32,120,41,111,40,46,73,110,116,56,32,114,101,115,117,108,116,41,41,0,0,0,0,66,105,110,79,112,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,32,120,41,105,40,46,73,110,116,56,44,121,41,111,40,46,73,110,116,56,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,32,120,41,32,111,40,46,73,110,116,49,54,44,114,101,115,117,108,116,41,41,0,66,105,110,79,112,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,32,120,41,32,105,40,46,73,110,116,49,54,32,121,41,111,40,46,73,110,116,49,54,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,85,110,79,112,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,32,120,41,32,111,40,46,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,66,105,110,79,112,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,32,120,41,32,105,40,46,73,110,116,51,50,32,121,41,32,111,40,46,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,0,0,0,0,85,110,79,112,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,32,120,41,32,111,40,46,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,66,105,110,79,112,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,32,120,41,32,105,40,46,73,110,116,54,52,32,121,41,32,111,40,46,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,0,0,0,0,65,110,100,66,111,111,108,101,97,110,0,0,0,0,0,0,46,66,105,110,79,112,66,111,111,108,101,97,110,0,0,0,79,114,66,111,111,108,101,97,110,0,0,0,0,0,0,0,78,111,114,66,111,111,108,101,97,110,0,0,0,0,0,0,78,97,110,100,66,111,111,108,101,97,110,0,0,0,0,0,88,111,114,66,111,111,108,101,97,110,0,0,0,0,0,0,78,111,116,66,111,111,108,101,97,110,0,0,0,0,0,0,66,114,97,110,99,104,73,102,84,114,117,101,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,66,111,111,108,101,97,110,41,41,0,66,114,97,110,99,104,73,102,70,97,108,115,101,0,0,0,73,115,76,84,66,111,111,108,101,97,110,0,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,41,32,105,40,46,66,111,111,108,101,97,110,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,73,115,76,69,66,111,111,108,101,97,110,0,0,0,0,0,73,115,69,81,66,111,111,108,101,97,110,0,0,0,0,0,73,115,78,69,66,111,111,108,101,97,110,0,0,0,0,0,73,115,71,84,66,111,111,108,101,97,110,0,0,0,0,0,73,115,71,69,66,111,111,108,101,97,110,0,0,0,0,0,65,100,100,85,73,110,116,56,0,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,56,0,0,0,0,0,83,117,98,85,73,110,116,56,0,0,0,0,0,0,0,0,77,117,108,85,73,110,116,56,0,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,56,0,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,56,0,0,0,0,0,0,77,111,100,85,73,110,116,56,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,56,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,56,0,0,83,112,108,105,116,85,73,110,116,56,0,0,0,0,0,0,74,111,105,110,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,65,110,100,85,73,110,116,56,0,0,0,0,0,0,0,0,79,114,85,73,110,116,56,0,78,111,114,85,73,110,116,56,0,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,56,0,0,0,0,0,0,0,88,111,114,85,73,110,116,56,0,0,0,0,0,0,0,0,78,111,116,85,73,110,116,56,0,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,85,73,110,116,56,0,0,0,0,0,0,0,73,115,69,81,85,73,110,116,56,0,0,0,0,0,0,0,73,115,78,69,85,73,110,116,56,0,0,0,0,0,0,0,73,115,71,84,85,73,110,116,56,0,0,0,0,0,0,0,73,115,71,69,85,73,110,116,56,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,56,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,41,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,56,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,56,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,56,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,56,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,56,0,85,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,51,50,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,54,52,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,56,41,41,0,0,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,49,54,41,41,0,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,51,50,41,41,0,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,54,52,41,41,0,0,85,73,110,116,56,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,83,105,110,103,108,101,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,68,111,117,98,108,101,41,41,0,65,100,100,85,73,110,116,49,54,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,49,54,0,0,0,0,83,117,98,85,73,110,116,49,54,0,0,0,0,0,0,0,77,117,108,85,73,110,116,49,54,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,49,54,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,49,54,0,0,0,0,0,77,111,100,85,73,110,116,49,54,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,49,54,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,49,54,0,83,112,108,105,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,0,0,0,0,74,111,105,110,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,65,110,100,85,73,110,116,49,54,0,0,0,0,0,0,0,79,114,85,73,110,116,49,54,0,0,0,0,0,0,0,0,78,111,114,85,73,110,116,49,54,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,49,54,0,0,0,0,0,0,88,111,114,85,73,110,116,49,54,0,0,0,0,0,0,0,78,111,116,85,73,110,116,49,54,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,85,73,110,116,49,54,0,0,0,0,0,0,73,115,69,81,85,73,110,116,49,54,0,0,0,0,0,0,73,115,78,69,85,73,110,116,49,54,0,0,0,0,0,0,73,115,71,84,85,73,110,116,49,54,0,0,0,0,0,0,73,115,71,69,85,73,110,116,49,54,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,49,54,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,49,54,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,56,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,56,41,41,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,49,54,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,51,50,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,54,52,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,100,100,85,73,110,116,51,50,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,51,50,0,0,0,0,83,117,98,85,73,110,116,51,50,0,0,0,0,0,0,0,77,117,108,85,73,110,116,51,50,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,51,50,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,51,50,0,0,0,0,0,77,111,100,85,73,110,116,51,50,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,51,50,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,51,50,0,83,112,108,105,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,74,111,105,110,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,65,110,100,85,73,110,116,51,50,0,0,0,0,0,0,0,79,114,85,73,110,116,51,50,0,0,0,0,0,0,0,0,78,111,114,85,73,110,116,51,50,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,51,50,0,0,0,0,0,0,88,111,114,85,73,110,116,51,50,0,0,0,0,0,0,0,78,111,116,85,73,110,116,51,50,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,85,73,110,116,51,50,0,0,0,0,0,0,73,115,69,81,85,73,110,116,51,50,0,0,0,0,0,0,73,115,78,69,85,73,110,116,51,50,0,0,0,0,0,0,73,115,71,84,85,73,110,116,51,50,0,0,0,0,0,0,73,115,71,69,85,73,110,116,51,50,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,51,50,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,51,50,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,56,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,56,41,41,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,49,54,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,54,52,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,100,100,85,73,110,116,54,52,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,54,52,0,0,0,0,83,117,98,85,73,110,116,54,52,0,0,0,0,0,0,0,77,117,108,85,73,110,116,54,52,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,54,52,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,54,52,0,0,0,0,0,77,111,100,85,73,110,116,54,52,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,54,52,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,54,52,0,83,112,108,105,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,65,110,100,85,73,110,116,54,52,0,0,0,0,0,0,0,79,114,85,73,110,116,54,52,0,0,0,0,0,0,0,0,78,111,114,85,73,110,116,54,52,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,54,52,0,0,0,0,0,0,88,111,114,85,73,110,116,54,52,0,0,0,0,0,0,0,78,111,116,85,73,110,116,54,52,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,85,73,110,116,54,52,0,0,0,0,0,0,73,115,69,81,85,73,110,116,54,52,0,0,0,0,0,0,73,115,78,69,85,73,110,116,54,52,0,0,0,0,0,0,73,115,71,84,85,73,110,116,54,52,0,0,0,0,0,0,73,115,71,69,85,73,110,116,54,52,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,54,52,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,54,52,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,56,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,56,41,41,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,49,54,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,51,50,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,54,52,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,100,100,73,110,116,56,0,46,66,105,110,79,112,73,110,116,56,0,0,0,0,0,0,83,117,98,73,110,116,56,0,77,117,108,73,110,116,56,0,83,105,103,110,73,110,116,56,0,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,56,0,0,0,0,0,0,0,77,111,100,73,110,116,56,0,81,117,111,116,105,101,110,116,73,110,116,56,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,56,41,41,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,56,0,0,0,83,112,108,105,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,74,111,105,110,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,65,98,115,111,108,117,116,101,73,110,116,56,0,0,0,0,65,110,100,73,110,116,56,0,79,114,73,110,116,56,0,0,78,111,114,73,110,116,56,0,78,97,110,100,73,110,116,56,0,0,0,0,0,0,0,0,88,111,114,73,110,116,56,0,78,111,116,73,110,116,56,0,73,115,76,84,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,0,0,73,115,76,69,73,110,116,56,0,0,0,0,0,0,0,0,73,115,69,81,73,110,116,56,0,0,0,0,0,0,0,0,73,115,78,69,73,110,116,56,0,0,0,0,0,0,0,0,73,115,71,84,73,110,116,56,0,0,0,0,0,0,0,0,73,115,71,69,73,110,116,56,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,56,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,41,0,0,0,66,114,97,110,99,104,73,102,71,69,73,110,116,56,0,0,66,114,97,110,99,104,73,102,76,84,73,110,116,56,0,0,66,114,97,110,99,104,73,102,76,69,73,110,116,56,0,0,66,114,97,110,99,104,73,102,69,81,73,110,116,56,0,0,66,114,97,110,99,104,73,102,78,69,73,110,116,56,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,49,54,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,54,52,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,65,100,100,73,110,116,49,54,0,0,0,0,0,0,0,0,46,66,105,110,79,112,73,110,116,49,54,0,0,0,0,0,83,117,98,73,110,116,49,54,0,0,0,0,0,0,0,0,77,117,108,73,110,116,49,54,0,0,0,0,0,0,0,0,83,105,103,110,73,110,116,49,54,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,49,54,0,0,0,0,0,0,77,111,100,73,110,116,49,54,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,73,110,116,49,54,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,49,54,0,0,83,112,108,105,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,0,0,0,0,0,74,111,105,110,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,73,110,116,49,54,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,49,54,41,41,0,0,65,110,100,73,110,116,49,54,0,0,0,0,0,0,0,0,79,114,73,110,116,49,54,0,78,111,114,73,110,116,49,54,0,0,0,0,0,0,0,0,78,97,110,100,73,110,116,49,54,0,0,0,0,0,0,0,88,111,114,73,110,116,49,54,0,0,0,0,0,0,0,0,78,111,116,73,110,116,49,54,0,0,0,0,0,0,0,0,73,115,76,84,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,73,110,116,49,54,0,0,0,0,0,0,0,73,115,69,81,73,110,116,49,54,0,0,0,0,0,0,0,73,115,78,69,73,110,116,49,54,0,0,0,0,0,0,0,73,115,71,84,73,110,116,49,54,0,0,0,0,0,0,0,73,115,71,69,73,110,116,49,54,0,0,0,0,0,0,0,66,111,111,108,101,97,110,67,111,110,118,101,114,116,73,110], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([116,49,54,0,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,41,32,111,40,46,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,49,54,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,41,0,66,114,97,110,99,104,73,102,71,69,73,110,116,49,54,0,66,114,97,110,99,104,73,102,76,84,73,110,116,49,54,0,66,114,97,110,99,104,73,102,76,69,73,110,116,49,54,0,66,114,97,110,99,104,73,102,69,81,73,110,116,49,54,0,66,114,97,110,99,104,73,102,78,69,73,110,116,49,54,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,56,41,41,0,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,54,52,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,56,41,41,0,0,0,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,51,50,41,41,0,0,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,54,52,41,41,0,0,73,110,116,49,54,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,83,105,110,103,108,101,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,68,111,117,98,108,101,41,41,0,65,100,100,73,110,116,51,50,0,0,0,0,0,0,0,0,46,66,105,110,79,112,73,110,116,51,50,0,0,0,0,0,83,117,98,73,110,116,51,50,0,0,0,0,0,0,0,0,77,117,108,73,110,116,51,50,0,0,0,0,0,0,0,0,83,105,103,110,73,110,116,51,50,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,51,50,0,0,0,0,0,0,77,111,100,73,110,116,51,50,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,73,110,116,51,50,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,51,50,0,0,83,112,108,105,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,74,111,105,110,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,73,110,116,51,50,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,0,65,110,100,73,110,116,51,50,0,0,0,0,0,0,0,0,79,114,73,110,116,51,50,0,78,111,114,73,110,116,51,50,0,0,0,0,0,0,0,0,78,97,110,100,73,110,116,51,50,0,0,0,0,0,0,0,88,111,114,73,110,116,51,50,0,0,0,0,0,0,0,0,78,111,116,73,110,116,51,50,0,0,0,0,0,0,0,0,76,111,103,105,99,97,108,83,104,105,102,116,73,110,116,51,50,0,0,0,0,0,0,0,82,111,116,97,116,101,73,110,116,51,50,0,0,0,0,0,73,115,76,84,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,73,110,116,51,50,0,0,0,0,0,0,0,73,115,69,81,73,110,116,51,50,0,0,0,0,0,0,0,73,115,78,69,73,110,116,51,50,0,0,0,0,0,0,0,73,115,71,84,73,110,116,51,50,0,0,0,0,0,0,0,73,115,71,69,73,110,116,51,50,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,51,50,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,41,0,66,114,97,110,99,104,73,102,71,69,73,110,116,51,50,0,66,114,97,110,99,104,73,102,76,84,73,110,116,51,50,0,66,114,97,110,99,104,73,102,76,69,73,110,116,51,50,0,66,114,97,110,99,104,73,102,69,81,73,110,116,51,50,0,66,114,97,110,99,104,73,102,78,69,73,110,116,51,50,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,56,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,49,54,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,56,41,41,0,0,0,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,49,54,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,54,52,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,83,105,110,103,108,101,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,68,111,117,98,108,101,41,41,0,65,100,100,73,110,116,54,52,0,0,0,0,0,0,0,0,46,66,105,110,79,112,73,110,116,54,52,0,0,0,0,0,83,117,98,73,110,116,54,52,0,0,0,0,0,0,0,0,77,117,108,73,110,116,54,52,0,0,0,0,0,0,0,0,83,105,103,110,73,110,116,54,52,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,54,52,0,0,0,0,0,0,77,111,100,73,110,116,54,52,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,73,110,116,54,52,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,54,52,0,0,83,112,108,105,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,65,98,115,111,108,117,116,101,73,110,116,54,52,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,54,52,41,41,0,0,65,110,100,73,110,116,54,52,0,0,0,0,0,0,0,0,79,114,73,110,116,54,52,0,78,111,114,73,110,116,54,52,0,0,0,0,0,0,0,0,78,97,110,100,73,110,116,54,52,0,0,0,0,0,0,0,88,111,114,73,110,116,54,52,0,0,0,0,0,0,0,0,78,111,116,73,110,116,54,52,0,0,0,0,0,0,0,0,73,115,76,84,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,73,110,116,54,52,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,73,110,116,54,52,0,0,0,0,0,0,0,73,115,69,81,73,110,116,54,52,0,0,0,0,0,0,0,73,115,78,69,73,110,116,54,52,0,0,0,0,0,0,0,73,115,71,84,73,110,116,54,52,0,0,0,0,0,0,0,73,115,71,69,73,110,116,54,52,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,54,52,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,54,52,41,32,105,40,46,73,110,116,54,52,41,41,0,66,114,97,110,99,104,73,102,71,69,73,110,116,54,52,0,66,114,97,110,99,104,73,102,76,84,73,110,116,54,52,0,66,114,97,110,99,104,73,102,76,69,73,110,116,54,52,0,66,114,97,110,99,104,73,102,69,81,73,110,116,54,52,0,66,114,97,110,99,104,73,102,78,69,73,110,116,54,52,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,56,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,49,54,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,51,50,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,54,52,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,56,41,41,0,0,0,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,49,54,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,51,50,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,83,105,110,103,108,101,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,68,111,117,98,108,101,41,41,0,85,110,79,112,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,44,120,41,44,111,40,46,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,44,120,41,44,105,40,46,83,105,110,103,108,101,44,121,41,44,111,40,46,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,0,65,100,100,83,105,110,103,108,101,0,0,0,0,0,0,0,46,66,105,110,79,112,83,105,110,103,108,101,0,0,0,0,83,117,98,83,105,110,103,108,101,0,0,0,0,0,0,0,77,117,108,83,105,110,103,108,101,0,0,0,0,0,0,0,83,105,103,110,83,105,110,103,108,101,0,0,0,0,0,0,46,85,110,79,112,83,105,110,103,108,101,0,0,0,0,0,68,105,118,83,105,110,103,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,83,105,110,103,108,101,0,0,0,0,83,105,110,101,83,105,110,103,108,101,0,0,0,0,0,0,84,97,110,103,101,110,116,83,105,110,103,108,101,0,0,0,83,101,99,97,110,116,83,105,110,103,108,101,0,0,0,0,67,111,115,101,99,97,110,116,83,105,110,103,108,101,0,0,76,111,103,49,48,83,105,110,103,108,101,0,0,0,0,0,76,111,103,83,105,110,103,108,101,0,0,0,0,0,0,0,76,111,103,50,83,105,110,103,108,101,0,0,0,0,0,0,69,120,112,83,105,110,103,108,101,0,0,0,0,0,0,0,83,113,117,97,114,101,82,111,111,116,83,105,110,103,108,101,0,0,0,0,0,0,0,0,80,111,119,83,105,110,103,108,101,0,0,0,0,0,0,0,65,114,99,83,105,110,101,83,105,110,103,108,101,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,65,114,99,67,111,115,105,110,101,83,105,110,103,108,101,0,65,114,99,84,97,110,83,105,110,103,108,101,0,0,0,0,65,114,99,84,97,110,50,83,105,110,103,108,101,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,105,40,46,83,105,110,103,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,67,101,105,108,83,105,110,103,108,101,0,0,0,0,0,0,65,98,115,111,108,117,116,101,83,105,110,103,108,101,0,0,70,108,111,111,114,83,105,110,103,108,101,0,0,0,0,0,81,117,111,116,105,101,110,116,83,105,110,103,108,101,0,0,82,101,109,97,105,110,100,101,114,83,105,110,103,108,101,0,73,115,76,84,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,105,40,46,83,105,110,103,108,101,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,83,105,110,103,108,101,0,0,0,0,0,0,73,115,69,81,83,105,110,103,108,101,0,0,0,0,0,0,73,115,78,69,83,105,110,103,108,101,0,0,0,0,0,0,73,115,71,84,83,105,110,103,108,101,0,0,0,0,0,0,73,115,71,69,83,105,110,103,108,101,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,83,105,110,103,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,83,105,110,103,108,101,41,32,105,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,83,105,110,103,108,101,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,85,110,79,112,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,44,120,41,44,111,40,46,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,44,120,41,44,105,40,46,68,111,117,98,108,101,44,121,41,44,111,40,46,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,0,69,0,0,0,0,0,0,0,100,118,40,46,68,111,117,98,108,101,32,32,50,46,55,49,56,50,56,49,56,50,56,52,53,57,48,52,53,49,41,0,80,105,0,0,0,0,0,0,100,118,40,46,68,111,117,98,108,101,32,32,51,46,49,52,49,53,57,50,54,53,51,53,56,57,55,57,51,49,41,0,84,97,117,0,0,0,0,0,100,118,40,46,68,111,117,98,108,101,32,32,54,46,50,56,51,49,56,53,51,48,55,49,55,57,53,56,54,41,0,0,65,100,100,68,111,117,98,108,101,0,0,0,0,0,0,0,46,66,105,110,79,112,68,111,117,98,108,101,0,0,0,0,83,117,98,68,111,117,98,108,101,0,0,0,0,0,0,0,77,117,108,68,111,117,98,108,101,0,0,0,0,0,0,0,83,105,103,110,68,111,117,98,108,101,0,0,0,0,0,0,46,85,110,79,112,68,111,117,98,108,101,0,0,0,0,0,68,105,118,68,111,117,98,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,68,111,117,98,108,101,0,0,0,0,83,105,110,101,68,111,117,98,108,101,0,0,0,0,0,0,84,97,110,103,101,110,116,68,111,117,98,108,101,0,0,0,83,101,99,97,110,116,68,111,117,98,108,101,0,0,0,0,67,111,115,101,99,97,110,116,68,111,117,98,108,101,0,0,76,111,103,49,48,68,111,117,98,108,101,0,0,0,0,0,76,111,103,68,111,117,98,108,101,0,0,0,0,0,0,0,76,111,103,50,68,111,117,98,108,101,0,0,0,0,0,0,69,120,112,68,111,117,98,108,101,0,0,0,0,0,0,0,83,113,117,97,114,101,82,111,111,116,68,111,117,98,108,101,0,0,0,0,0,0,0,0,80,111,119,68,111,117,98,108,101,0,0,0,0,0,0,0,65,114,99,83,105,110,101,68,111,117,98,108,101,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,114,99,67,111,115,105,110,101,68,111,117,98,108,101,0,65,114,99,84,97,110,68,111,117,98,108,101,0,0,0,0,65,114,99,84,97,110,50,68,111,117,98,108,101,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,67,101,105,108,68,111,117,98,108,101,0,0,0,0,0,0,65,98,115,111,108,117,116,101,68,111,117,98,108,101,0,0,70,108,111,111,114,68,111,117,98,108,101,0,0,0,0,0,81,117,111,116,105,101,110,116,68,111,117,98,108,101,0,0,82,101,109,97,105,110,100,101,114,68,111,117,98,108,101,0,73,115,76,84,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,68,111,117,98,108,101,0,0,0,0,0,0,73,115,69,81,68,111,117,98,108,101,0,0,0,0,0,0,73,115,78,69,68,111,117,98,108,101,0,0,0,0,0,0,73,115,71,84,68,111,117,98,108,101,0,0,0,0,0,0,73,115,71,69,68,111,117,98,108,101,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,68,111,117,98,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,68,111,117,98,108,101,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,82,97,110,100,111,109,0,0,112,40,111,40,46,68,111,117,98,108,101,41,41,0,0,0,73,115,76,84,85,116,102,56,67,104,97,114,0,0,0,0,112,40,105,40,46,85,116,102,56,67,104,97,114,41,32,105,40,46,85,116,102,56,67,104,97,114,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,0,0,73,115,76,69,85,116,102,56,67,104,97,114,0,0,0,0,73,115,69,81,85,116,102,56,67,104,97,114,0,0,0,0,73,115,78,69,85,116,102,56,67,104,97,114,0,0,0,0,73,115,71,84,85,116,102,56,67,104,97,114,0,0,0,0,73,115,71,69,85,116,102,56,67,104,97,114,0,0,0,0,0,0,0,0,0,0,0,0,65,114,114,97,121,70,105,108,108,0,0,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,42,41,41,0,0,0,0,65,114,114,97,121,67,97,112,97,99,105,116,121,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,111,40,46,73,110,116,51,50,41,41,0,0,65,114,114,97,121,76,101,110,103,116,104,0,0,0,0,0,65,114,114,97,121,82,97,110,107,0,0,0,0,0,0,0,65,114,114,97,121,82,101,115,105,122,101,0,0,0,0,0,112,40,105,111,40,46,65,114,114,97,121,41,32,111,40,46,73,110,116,51,50,41,41,0,65,114,114,97,121,73,110,100,101,120,69,108,116,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,42,41,41,0,0,0,0,65,114,114,97,121,65,112,112,101,110,100,69,108,116,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,42,41,41,0,0,0,0,0,0,65,114,114,97,121,82,101,112,108,97,99,101,69,108,116,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,42,41,41,0,0,65,114,114,97,121,82,101,112,108,97,99,101,83,117,98,115,101,116,0,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,65,114,114,97,121,41,41,0,0,0,0,0,0,65,114,114,97,121,83,117,98,115,101,116,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,65,114,114,97,121,73,110,115,101,114,116,69,108,116,0,0,65,114,114,97,121,73,110,115,101,114,116,83,117,98,115,101,116,0,0,0,0,0,0,0,65,114,114,97,121,82,101,118,101,114,115,101,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,41,0,0,65,114,114,97,121,82,111,116,97,116,101,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,73,110,115,116,114,117,99,116,105,111,110,0,0,0,0,0,73,110,115,116,114,117,99,116,105,111,110,76,105,115,116,0,46,73,110,115,116,114,117,99,116,105,111,110,0,0,0,0,86,73,67,108,117,109,112,0,99,40,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,115,116,114,117,99,116,105,111,110,76,105,115,116,32,67,111,100,101,83,116,97,114,116,41,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,78,101,120,116,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,79,119,110,101,114,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,78,101,120,116,87,97,105,116,105,110,103,67,97,108,108,101,114,41,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,67,97,108,108,101,114,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,115,116,114,117,99,116,105,111,110,32,83,97,118,101,80,67,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,54,52,32,87,97,107,101,85,112,73,110,102,111,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,51,50,32,70,105,114,101,67,111,117,110,116,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,51,50,32,83,104,111,114,116,67,111,117,110,116,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,41,0,0,0,0,0,0,0,0,97,40,99,40,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,32,67,111,110,116,101,120,116,41,32,32,32,32,32,32,32,32,101,40,97,40,46,42,41,32,80,97,114,97,109,66,108,111,99,107,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,97,40,46,42,41,32,68,97,116,97,83,112,97,99,101,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,97,40,46,86,73,67,108,117,109,112,32,42,41,32,67,108,117,109,112,115,41,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,51,50,32,108,105,110,101,78,117,109,98,101,114,66,97,115,101,41,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,67,108,117,109,112,83,111,117,114,99,101,66,101,103,105,110,41,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,67,108,117,109,112,83,111,117,114,99,101,69,110,100,41,32,32,41,41,0,0,0,0,0,0,0,46,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,0,0,0,0,0,0,69,110,113,117,101,117,101,82,117,110,81,117,101,117,101,0,112,40,105,40,46,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,41,41,0,0,0,0,0,0,0,0,0,0,0,0,80,109,0,0,22,0,0,0,23,0,0,0,39,0,0,0,0,0,0,0,78,53,86,105,114,101,111,50,57,73,110,115,116,114,117,99,116,105,111,110,76,105,115,116,68,97,116,97,80,114,111,99,115,67,108,97,115,115,69,0,78,53,86,105,114,101,111,49,48,73,68,97,116,97,80,114,111,99,115,69,0,0,0,0,192,128,0,0,48,109,0,0,232,128,0,0,8,109,0,0,72,109,0,0,0,0,0,0,0,0,0,0,152,109,0,0,24,0,0,0,25,0,0,0,40,0,0,0,0,0,0,0,78,53,86,105,114,101,111,49,54,86,73,68,97,116,97,80,114,111,99,115,67,108,97,115,115,69,0,0,0,0,0,0,232,128,0,0,120,109,0,0,72,109,0,0,0,0,0,0,84,114,105,103,103,101,114,0,112,40,105,40,46,67,108,117,109,112,41,41,0,0,0,0,87,97,105,116,0,0,0,0,70,111,114,76,111,111,112,84,97,105,108,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,66,114,97,110,99,104,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,41,0,0,0,0,0,112,40,105,40,46,86,73,41,32,105,40,46,73,110,115,116,114,117,99,116,105,111,110,83,110,105,112,112,101,116,32,99,111,112,121,73,110,80,114,111,99,41,32,105,40,46,73,110,115,116,114,117,99,116,105,111,110,83,110,105,112,112,101,116,32,99,111,112,121,79,117,116,80,114,111,99,41,41,0,0,87,97,105,116,77,105,108,108,105,115,101,99,111,110,100,115,0,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,41,0,0,0,87,97,105,116,85,110,116,105,108,77,105,99,114,111,115,101,99,111,110,100,115,0,0,0,112,40,105,40,46,73,110,116,54,52,41,41,0,0,0,0,87,97,105,116,77,105,99,114,111,115,101,99,111,110,100,115,0,0,0,0,0,0,0,0,112,40,41,0,0,0,0,0,83,116,111,112,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,0,0,0,0,0,16,48,16,16,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,2,0,2,2,2,2,0,2,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,0,70,108,97,116,116,101,110,84,111,83,116,114,105,110,103,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,105,40,46,66,111,111,108,101,97,110,41,32,111,40,46,83,116,114,105,110,103,41,41,0,85,110,102,108,97,116,116,101,110,70,114,111,109,83,116,114,105,110,103,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,66,111,111,108,101,97,110,41,32,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,83,116,114,105,110,103,41,32,111,40,46,42,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,84,111,83,116,114,105,110,103,0,0,0,0,0,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,70,114,111,109,83,116,114,105,110,103,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,68,101,99,105,109,97,108,83,116,114,105,110,103,84,111,78,117,109,98,101,114,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,42,41,32,111,40,46,73,110,116,51,50,41,32,111,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,69,120,112,111,110,101,110,116,105,97,108,83,116,114,105,110,103,84,111,78,117,109,98,101,114,0,0,0,0,0,0,0,84,111,84,121,112,101,65,110,100,68,97,116,97,83,116,114,105,110,103,0,0,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,100,118,40,0,0,0,0,0,0,0,0,0,232,113,0,0,41,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,45,0,0,0,46,0,0,0,47,0,0,0,48,0,0,0,49,0,0,0,50,0,0,0,51,0,0,0,52,0,0,0,53,0,0,0,0,0,0,0,78,53,86,105,114,101,111,50,53,84,68,86,105,97,70,111,114,109,97,116,116,101,114,84,121,112,101,86,105,115,105,116,111,114,69,0,0,0,0,0,78,53,86,105,114,101,111,49,49,84,121,112,101,86,105,115,105,116,111,114,69,0,0,0,192,128,0,0,200,113,0,0,232,128,0,0,160,113,0,0,224,113,0,0,0,0,0,0,99,100,112,40,0,0,0,0,100,118,112,40,0,0,0,0,0,0,0,0,0,0,0,0,97,40,0,0,0,0,0,0,101,113,40,0,0,0,0,0,112,40,0,0,0,0,0,0,99,40,0,0,0,0,0,0,98,99,40,0,0,0,0,0,98,98,40,0,0,0,0,0,66,97,100,84,121,112,101,0,65,108,108,111,99,97,116,105,111,110,83,116,97,116,105,115,116,105,99,115,0,0,0,0,99,40,101,40,46,73,110,116,54,52,32,116,111,116,97,108,65,108,108,111,99,97,116,105,111,110,115,41,32,101,40,46,73,110,116,54,52,32,116,111,116,97,108,65,108,108,111,99,97,116,101,100,41,32,101,40,46,73,110,116,54,52,32,109,97,120,65,108,108,111,99,97,116,101,100,41,32,41,0,0,84,121,112,101,77,97,110,97,103,101,114,65,108,108,111,99,97,116,105,111,110,83,116,97,116,105,115,116,105,99,115,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,111,40,46,65,108,108,111,99,97,116,105,111,110,83,116,97,116,105,115,116,105,99,115,41,41,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,67,117,114,114,101,110,116,84,121,112,101,77,97,110,97,103,101,114,0,0,0,112,40,111,40,46,84,121,112,101,77,97,110,97,103,101,114,41,41,0,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,82,111,111,116,84,121,112,101,77,97,110,97,103,101,114,0,0,0,0,0,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,111,40,46,84,121,112,101,77,97,110,97,103,101,114,41,41,0,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,71,101,116,84,121,112,101,115,0,0,0,0,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,111,40,97,40,46,84,121,112,101,32,42,41,41,41,0,0,0,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,68,101,102,105,110,101,84,121,112,101,0,0,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,84,121,112,101,41,41,0,0,84,121,112,101,79,102,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,84,121,112,101,41,41,0,0,0,0,0,0,0,84,121,112,101,84,111,112,65,81,83,105,122,101,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,84,121,112,101,65,108,105,103,110,109,101,110,116,0,0,0,84,121,112,101,69,110,99,111,100,105,110,103,0,0,0,0,84,121,112,101,73,115,70,108,97,116,0,0,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,84,121,112,101,73,115,65,114,114,97,121,0,0,0,0,0,84,121,112,101,72,97,115,67,117,115,116,111,109,68,101,102,97,117,108,116,0,0,0,0,84,121,112,101,72,97,115,80,97,100,100,105,110,103,0,0,84,121,112,101,72,97,115,71,101,110,101,114,105,99,84,121,112,101,0,0,0,0,0,0,84,121,112,101,71,101,116,78,97,109,101,0,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,84,121,112,101,71,101,116,69,108,101,109,101,110,116,78,97,109,101,0,0,0,0,0,0,84,121,112,101,66,97,115,101,84,121,112,101,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,84,121,112,101,41,41,0,0,0,0,84,121,112,101,85,115,97,103,101,84,121,112,101,0,0,0,84,121,112,101,83,117,98,69,108,101,109,101,110,116,67,111,117,110,116,0,0,0,0,0,84,121,112,101,71,101,116,83,117,98,69,108,101,109,101,110,116,0,0,0,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,84,121,112,101,41,41,0,0,84,121,112,101,71,101,116,83,117,98,69,108,101,109,101,110,116,66,121,78,97,109,101,0,112,40,105,40,46,84,121,112,101,41,32,105,40,46,83,116,114,105,110,103,41,32,111,40,46,84,121,112,101,41,41,0,101,120,99,101,101,100,101,100,32,97,108,108,111,99,97,116,105,111,110,32,108,105,109,105,116,0,0,0,0,0,0,0,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,82,101,102,101,114,114,105,110,103,32,116,111,32,97,110,32,97,108,114,101,97,100,121,32,101,120,105,115,116,105,110,103,32,116,121,112,101,0,0,0,0,40,69,114,114,111,114,32,34,84,111,111,32,109,97,110,121,32,102,111,114,119,97,114,100,32,112,97,116,99,104,101,115,34,41,0,0,0,0,0,0,40,69,114,114,111,114,32,39,73,108,108,101,103,97,108,32,83,116,114,105,110,103,67,111,110,99,97,116,101,110,97,116,101,32,105,110,112,108,97,99,101,110,101,115,115,46,39,41,0,0,0,0,0,0,0,0,40,69,114,114,111,114,32,39,73,108,108,101,103,97,108,32,65,114,114,97,121,67,111,110,99,97,116,101,110,97,116,101,32,105,110,112,108,97,99,101,110,101,115,115,46,39,41,0,40,69,114,114,111,114,32,39,67,97,110,39,116,32,65,114,114,97,121,82,101,112,108,97,99,101,83,117,98,115,101,116,32,105,110,112,108,97,99,101,46,39,41,0,0,0,0,0,40,69,114,114,111,114,32,39,67,97,110,39,116,32,65,114,114,97,121,83,117,98,115,101,116,32,105,110,112,108,97,99,101,46,39,41,0,0,0,0,40,69,114,114,111,114,32,39,67,97,110,39,116,32,65,114,114,97,121,73,110,115,101,114,116,83,117,98,115,101,116,32,105,110,112,108,97,99,101,46,39,41,0,0,0,0,0,0,40,69,114,114,111,114,32,39,67,97,110,39,116,32,65,114,114,97,121,82,101,118,101,114,115,101,32,105,110,112,108,97,99,101,46,39,41,0,0,0,40,69,114,114,111,114,32,39,67,97,110,39,116,32,65,114,114,97,121,82,111,116,97,116,101,32,105,110,112,108,97,99,101,46,39,41,0,0,0,0,40,69,114,114,111,114,32,115,105,109,112,108,101,32,101,108,101,109,101,110,116,32,116,121,112,101,32,110,111,116,32,97,108,108,111,119,101,100,32,105,110,32,80,97,114,97,109,66,108,111,99,107,41,0,0,0,40,69,114,114,111,114,32,73,109,109,101,100,105,97,116,101,32,77,111,100,101,32,84,121,112,101,32,105,115,32,116,111], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20480);
/* memory initializer */ allocate([111,32,108,97,114,103,101,32,102,111,114,32,112,97,114,97,109,32,98,108,111,99,107,41,0,0,0,0,0,0,0,0,69,83,32,68,101,108,101,116,101,32,98,101,103,105,110,0,69,83,32,68,101,108,101,116,101,32,101,110,100,0,0,0,39,40,39,32,109,105,115,115,105,110,103,0,0,0,0,0,39,41,39,32,109,105,115,115,105,110,103,0,0,0,0,0,67,97,110,39,116,32,100,101,102,105,110,101,32,115,121,109,98,111,108,0,0,0,0,0,86,73,32,110,111,116,32,102,111,117,110,100,0,0,0,0,83,116,114,105,110,103,0,0,100,101,102,105,110,101,0,0,116,114,97,99,101,0,0,0,101,110,113,117,101,117,101,0,99,108,101,97,114,0,0,0,101,120,105,116,0,0,0,0,37,46,42,115,0,0,0,0,98,97,100,32,101,103,103,0,99,104,105,114,112,32,99,104,105,114,112,0,0,0,0,0,240,22,0,0,64,0,0,0,240,120,0,0,0,0,0,0,84,105,109,101,0,0,0,0,71,101,116,84,105,99,107,67,111,117,110,116,0,0,0,0,112,40,111,40,46,73,110,116,54,52,41,41,0,0,0,0,71,101,116,77,105,99,114,111,115,101,99,111,110,100,84,105,99,107,67,111,117,110,116,0,71,101,116,77,105,108,108,105,115,101,99,111,110,100,84,105,99,107,67,111,117,110,116,0,112,40,111,40,46,85,73,110,116,51,50,41,41,0,0,0,65,84,105,109,101,70,114,111,109,68,111,117,98,108,101,68,111,117,98,108,101,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,32,111,40,46,84,105,109,101,41,41,0,0,0,0,0,0,0,65,84,105,109,101,71,101,116,83,101,99,111,110,100,115,68,111,117,98,108,101,0,0,0,112,40,105,40,46,84,105,109,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,65,84,105,109,101,71,101,116,70,114,97,99,116,105,111,110,68,111,117,98,108,101,0,0,65,84,105,109,101,70,114,111,109,73,110,116,54,52,85,73,110,116,54,52,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,32,111,40,46,84,105,109,101,41,41,0,0,0,0,0,0,0,0,65,84,105,109,101,71,101,116,67,117,114,114,101,110,116,0,112,40,111,40,46,84,105,109,101,41,41,0,0,0,0,0,65,84,105,109,101,71,101,116,83,101,99,111,110,100,115,73,110,116,54,52,0,0,0,0,112,40,105,40,46,84,105,109,101,41,32,111,40,46,73,110,116,54,52,41,41,0,0,0,65,84,105,109,101,71,101,116,70,114,97,99,116,105,111,110,85,73,110,116,54,52,0,0,112,40,105,40,46,84,105,109,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,65,84,105,109,101,83,101,116,83,101,99,111,110,100,115,73,110,116,54,52,0,0,0,0,65,84,105,109,101,83,101,116,70,114,97,99,116,105,111,110,85,73,110,116,54,52,0,0,224,120,0,0,65,0,0,0,224,122,0,0,0,0,0,0,76,97,98,86,73,69,87,95,67,97,110,118,97,115,50,68,0,0,0,0,0,0,0,0,67,111,110,116,101,120,116,50,68,0,0,0,0,0,0,0,46,73,110,116,51,50,0,0,83,68,76,84,101,115,116,0,112,40,41,0,0,0,0,0,77,111,118,101,84,111,0,0,112,40,105,40,46,67,111,110,116,101,120,116,50,68,41,105,40,46,68,111,117,98,108,101,41,105,40,46,68,111,117,98,108,101,41,41,0,0,0,0,76,105,110,101,84,111,0,0,83,116,114,111,107,101,0,0,112,40,105,40,46,67,111,110,116,101,120,116,50,68,41,41,0,0,0,0,0,0,0,0,80,114,105,110,116,88,0,0,112,40,105,40,46,73,110,116,51,50,41,41,0,0,0,0,123,32,97,108,101,114,116,40,105,41,59,32,125,0,0,0,123,32,118,97,114,32,116,104,101,67,97,110,118,97,115,32,61,32,100,111,99,117,109,101,110,116,46,103,101,116,69,108,101,109,101,110,116,66,121,73,100,40,39,116,104,101,67,97,110,118,97,115,39,41,59,32,97,108,101,114,116,40,39,99,97,110,118,97,115,63,39,41,59,32,118,97,114,32,99,116,120,50,32,61,32,116,104,101,67,97,110,118,97,115,46,103,101,116,67,111,110,116,101,120,116,40,39,50,100,39,41,59,32,97,108,101,114,116,40,39,99,111,110,116,101,120,116,63,39,41,59,32,99,116,120,50,46,109,111,118,101,84,111,40,48,44,48,41,59,32,99,116,120,50,46,108,105,110,101,84,111,40,50,48,48,44,49,48,48,41,59,32,99,116,120,50,46,83,116,114,111,107,101,40,41,59,32,97,108,101,114,116,40,39,100,114,97,119,110,63,39,41,59,32,125,0,0,0,123,32,99,116,120,46,76,105,110,101,84,111,40,36,48,44,36,49,41,59,32,125,0,0,123,32,99,116,120,46,77,111,118,101,84,111,40,36,48,44,36,49,41,59,32,125,0,0,121,111,117,32,115,104,111,117,108,100,32,115,101,101,32,97,32,115,109,111,111,116,104,108,121,45,99,111,108,111,114,101,100,32,115,113,117,97,114,101,32,45,32,110,111,32,115,104,97,114,112,32,108,105,110,101,115,32,98,117,116,32,116,104,101,32,115,113,117,97,114,101,32,98,111,114,100,101,114,115,33,0,0,0,0,0,0,0,97,110,100,32,104,101,114,101,32,105,115,32,115,111,109,101,32,116,101,120,116,32,116,104,97,116,32,115,104,111,117,108,100,32,98,101,32,72,84,77,76,45,102,114,105,101,110,100,108,121,58,32,97,109,112,58,32,124,38,124,32,100,111,117,98,108,101,45,113,117,111,116,101,58,32,124,34,124,32,113,117,111,116,101,58,32,124,39,124,32,108,101,115,115,45,116,104,97,110,44,32,103,114,101,97,116,101,114,45,116,104,97,110,44,32,104,116,109,108,45,108,105,107,101,32,116,97,103,115,58,32,124,60,99,104,101,101,122,62,60,47,99,104,101,101,122,62,124,10,97,110,111,116,104,101,114,32,108,105,110,101,46,0,0,0,0,0,0,83,116,114,105,110,103,0,0,208,122,0,0,66,0,0,0,184,125,0,0,0,0,0,0,76,97,98,86,73,69,87,95,70,105,108,101,73,79,0,0,70,105,108,101,72,97,110,100,108,101,0,0,0,0,0,0,46,73,110,116,51,50,0,0,83,116,100,73,110,0,0,0,46,70,105,108,101,72,97,110,100,108,101,0,0,0,0,0,83,116,100,79,117,116,0,0,83,116,100,69,114,114,0,0,80,114,105,110,116,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,0,0,68,80,114,105,110,116,102,0,112,40,105,40,46,86,97,114,65,114,103,67,111,117,110,116,41,44,105,40,46,83,116,97,116,105,99,83,116,114,105,110,103,41,44,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,0,70,105,108,101,79,112,101,110,0,0,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,44,105,40,46,83,116,114,105,110,103,41,44,105,40,46,73,110,116,51,50,41,44,105,40,46,73,110,116,51,50,41,44,105,40,46,66,111,111,108,101,97,110,41,44,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,105,40,46,66,111,111,108,101,97,110,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,70,105,108,101,83,105,122,101,0,0,0,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,70,105,108,101,68,101,108,101,116,101,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,44,111,40,46,73,110,116,51,50,41,41,0,83,116,114,101,97,109,67,108,111,115,101,0,0,0,0,0,83,116,114,101,97,109,83,101,116,80,111,115,105,116,105,111,110,0,0,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,105,40,46,73,110,116,51,50,41,44,105,40,46,73,110,116,51,50,41,44,111,40,46,73,110,116,51,50,41,41,0,83,116,114,101,97,109,82,101,97,100,0,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,111,40,46,83,116,114,105,110,103,41,44,111,40,46,73,110,116,51,50,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,83,116,114,101,97,109,87,114,105,116,101,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,105,40,46,83,116,114,105,110,103,41,44,105,40,46,73,110,116,51,50,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,37,46,42,115,10,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,192,128,0,0,48,128,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,232,128,0,0,72,128,0,0,64,128,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,232,128,0,0,128,128,0,0,112,128,0,0,0,0,0,0,0,0,0,0,168,128,0,0,67,0,0,0,68,0,0,0,69,0,0,0,70,0,0,0,41,0,0,0,22,0,0,0,22,0,0,0,22,0,0,0,0,0,0,0,48,129,0,0,67,0,0,0,71,0,0,0,69,0,0,0,70,0,0,0,41,0,0,0,23,0,0,0,23,0,0,0,23,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,232,128,0,0,8,129,0,0,168,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,131,0,0,72,0,0,0,73,0,0,0,39,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,232,128,0,0,96,131,0,0,0,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+30720);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  
  function _cosh(x) {
      var p = Math.pow(Math.E, x);
      return (p + (1 / p)) / 2;
    }var _coshf=_cosh;

  
  
  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        
        // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
        // Module['forcedAspectRatio'] = 4 / 3;
        
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'] ||
                                    canvas['msRequestPointerLock'] ||
                                    function(){};
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 document['msExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};
  
  function _SDL_GetTicks() {
      return Math.floor(Date.now() - SDL.startTime);
    }var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,initFlags:0,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},TOUCH_DEFAULT_ID:0,keyCodes:{16:1249,17:1248,18:1250,20:1081,33:1099,34:1102,35:1101,36:1098,37:1104,38:1106,39:1103,40:1105,44:316,45:1097,46:127,91:1251,93:1125,96:1122,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,106:1109,107:1111,109:1110,110:1123,111:1108,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,124:1128,125:1129,126:1130,127:1131,128:1132,129:1133,130:1134,131:1135,132:1136,133:1137,134:1138,135:1139,144:1107,160:94,161:33,162:34,163:35,164:36,165:37,166:38,167:95,168:40,169:41,170:42,171:43,172:124,173:45,174:123,175:125,176:126,181:127,182:129,183:128,188:44,190:46,191:47,192:96,219:91,220:92,221:93,222:39},scanCodes:{8:42,9:43,13:40,27:41,32:44,35:204,39:53,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,58:203,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,127:76,305:224,308:226,316:70},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var is_SDL_HWSURFACE = flags & 0x00000001;
        var is_SDL_HWPALETTE = flags & 0x00200000;
        var is_SDL_OPENGL = flags & 0x04000000;
  
        var surf = _malloc(60);
        var pixelFormat = _malloc(44);
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        var buffer = 0;
  
        // preemptively initialize this for software surfaces,
        // otherwise it will be lazily initialized inside of SDL_LockSurface
        if (!is_SDL_HWSURFACE && !is_SDL_OPENGL) {
          buffer = _malloc(width * height * 4);
        }
  
        HEAP32[((surf)>>2)]=flags;
        HEAP32[(((surf)+(4))>>2)]=pixelFormat;
        HEAP32[(((surf)+(8))>>2)]=width;
        HEAP32[(((surf)+(12))>>2)]=height;
        HEAP32[(((surf)+(16))>>2)]=width * bpp;  // assuming RGBA or indexed for now,
                                                                                          // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer;
        HEAP32[(((surf)+(36))>>2)]=0;
        HEAP32[(((surf)+(56))>>2)]=1;
  
        HEAP32[((pixelFormat)>>2)]=0 /* XXX missing C define SDL_PIXELFORMAT_RGBA8888 */;
        HEAP32[(((pixelFormat)+(4))>>2)]=0;// TODO
        HEAP8[(((pixelFormat)+(8))|0)]=bpp * 8;
        HEAP8[(((pixelFormat)+(9))|0)]=bpp;
  
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff;
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00;
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000;
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000;
  
        // Decide if we want to use WebGL or not
        SDL.GL = SDL.GL || is_SDL_OPENGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
  
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0)
        };
        
        var ctx = Browser.createContext(canvas, is_SDL_OPENGL, usePageCanvas, webGLContextAttributes);
              
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
  
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
  
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
  
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        
        var buffer  = surfData.buffer;
        var data    = surfData.image.data;
        var colors  = surfData.colors;
  
        for (var y = startY; y < endY; ++y) {
          var indexBase = y * fullWidth;
          var colorBase = indexBase * 4;
          for (var x = startX; x < endX; ++x) {
            // HWPALETTE have only 256 colors (not rgba)
            var index = HEAPU8[((buffer + indexBase + x)|0)] * 3;
            var colorOffset = colorBase + x * 4;
  
            data[colorOffset   ] = colors[index   ];
            data[colorOffset +1] = colors[index +1];
            data[colorOffset +2] = colors[index +2];
            //unused: data[colorOffset +3] = color[index +3];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
  
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        if (info.buffer) _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
  
        if (surf === SDL.screen) {
          SDL.screen = null;
        }
      },downFingers:{},savedKeydown:null,receiveEvent:function (event) {
        switch(event.type) {
          case 'touchstart': case 'touchmove': {
            event.preventDefault();
  
            var touches = [];
            
            // Clear out any touchstart events that we've already processed
            if (event.type === 'touchstart') {
              for (var i = 0; i < event.touches.length; i++) {
                var touch = event.touches[i];
                if (SDL.downFingers[touch.identifier] != true) {
                  SDL.downFingers[touch.identifier] = true;
                  touches.push(touch);
                }
              }
            } else {
              touches = event.touches;
            }
            
            var firstTouch = touches[0];
            if (event.type == 'touchstart') {
              SDL.DOMButtons[0] = 1;
            }
            var mouseEventType;
            switch(event.type) {
              case 'touchstart': mouseEventType = 'mousedown'; break;
              case 'touchmove': mouseEventType = 'mousemove'; break;
            }
            var mouseEvent = {
              type: mouseEventType,
              button: 0,
              pageX: firstTouch.clientX,
              pageY: firstTouch.clientY
            };
            SDL.events.push(mouseEvent);
  
            for (var i = 0; i < touches.length; i++) {
              var touch = touches[i];
              SDL.events.push({
                type: event.type,
                touch: touch
              });
            };
            break;
          }
          case 'touchend': {
            event.preventDefault();
            
            // Remove the entry in the SDL.downFingers hash
            // because the finger is no longer down.
            for(var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              if (SDL.downFingers[touch.identifier] === true) {
                delete SDL.downFingers[touch.identifier];
              }
            }
  
            var mouseEvent = {
              type: 'mouseup',
              button: 0,
              pageX: event.changedTouches[0].clientX,
              pageY: event.changedTouches[0].clientY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(mouseEvent);
            
            for (var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              SDL.events.push({
                type: 'touchend',
                touch: touch
              });
            };
            break;
          }
          case 'mousemove':
            if (SDL.DOMButtons[0] === 1) {
              SDL.events.push({
                type: 'touchmove',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            }
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup': case 'DOMMouseScroll': case 'mousewheel':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (!SDL.unicode && !SDL.textInput) || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
  
            if (event.type == 'DOMMouseScroll' || event.type == 'mousewheel') {
              var button = Browser.getMouseWheelDelta(event) > 0 ? 4 : 3;
              var event2 = {
                type: 'mousedown',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
              SDL.events.push(event2);
              event = {
                type: 'mouseup',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
            } else if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
              SDL.events.push({
                type: 'touchstart',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
  
              SDL.events.push({
                type: 'touchend',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
              SDL.DOMButtons[event.button] = 0;
            }
  
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown' || event.type === 'mousedown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup' || event.type === 'mouseup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
  
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
  
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'blur':
          case 'visibilitychange': {
            // Un-press all pressed keys: TODO
            for (var code in SDL.keyboardMap) {
              SDL.events.push({
                type: 'keyup',
                keyCode: SDL.keyboardMap[code]
              });
            }
            event.preventDefault();
            break;
          }
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        return;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
  
        switch (event.type) {
          case 'touchstart': case 'touchend': case 'touchmove': {
            Browser.calculateMouseEvent(event);
            break;
          }
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = event.keyCode;
            if (code >= 65 && code <= 90) {
              code += 32; // make lowercase for SDL
            } else {
              code = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
  
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
  
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
  
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28); // XXX
          return;
        }
  
        SDL.handleEvent(event);
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //Module.print('Received key event: ' + event.keyCode);
            var key = event.keyCode;
            if (key >= 65 && key <= 90) {
              key += 32; // make lowercase for SDL
            } else {
              key = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
  
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(8))|0)]=down ? 1 : 0;
            HEAP8[(((ptr)+(9))|0)]=0; // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan;
            HEAP32[(((ptr)+(16))>>2)]=key;
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState;
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key;
  
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP8[(((ptr)+(16))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(17))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP32[(((ptr)+(16))>>2)]=SDL.buttonState;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(28))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(32))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'touchstart': case 'touchend': case 'touchmove': {
            var touch = event.touch;
            var w = Module['canvas'].width;
            var h = Module['canvas'].height;
            var x = Browser.touches[touch.identifier].x / w;
            var y = Browser.touches[touch.identifier].y / h;
            var lx = Browser.lastTouches[touch.identifier].x / w;
            var ly = Browser.lastTouches[touch.identifier].y / h;
            var dx = x - lx;
            var dy = y - ly;
            if (touch['deviceID'] === undefined) touch.deviceID = SDL.TOUCH_DEFAULT_ID;
            if (dx === 0 && dy === 0 && event.type === 'touchmove') return; // don't send these if nothing happened
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=_SDL_GetTicks();
            (tempI64 = [touch.deviceID>>>0,(tempDouble=touch.deviceID,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[(((ptr)+(8))>>2)]=tempI64[0],HEAP32[(((ptr)+(12))>>2)]=tempI64[1]);
            (tempI64 = [touch.identifier>>>0,(tempDouble=touch.identifier,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[(((ptr)+(16))>>2)]=tempI64[0],HEAP32[(((ptr)+(20))>>2)]=tempI64[1]);
            HEAPF32[(((ptr)+(24))>>2)]=x;
            HEAPF32[(((ptr)+(28))>>2)]=y;
            HEAPF32[(((ptr)+(32))>>2)]=dx;
            HEAPF32[(((ptr)+(36))>>2)]=dy;
            if (touch.force !== undefined) {
              HEAPF32[(((ptr)+(40))>>2)]=touch.force;
            } else { // No pressure data, send a digital 0/1 pressure.
              HEAPF32[(((ptr)+(40))>>2)]=event.type == "touchend" ? 0 : 1;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          case 'joystick_button_up': case 'joystick_button_down': {
            var state = event.type === 'joystick_button_up' ? 0 : 1;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.button;
            HEAP8[(((ptr)+(6))|0)]=state;
            break;
          }
          case 'joystick_axis_motion': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.axis;
            HEAP32[(((ptr)+(8))>>2)]=SDL.joystickAxisValueConversion(event.value);
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = volume / 128;
          if (info.audio) info.audio.volume = info.volume;
        }
        return ret;
      },fillWebAudioBufferFromHeap:function (heapPtr, sizeSamplesPerChannel, dstAudioBuffer) {
        // The input audio data is interleaved across the channels, i.e. [L, R, L, R, L, R, ...] and is either 8-bit or 16-bit as
        // supported by the SDL API. The output audio wave data for Web Audio API must be in planar buffers of [-1,1]-normalized Float32 data,
        // so perform a buffer conversion for the data.
        var numChannels = SDL.audio.channels;
        for(var c = 0; c < numChannels; ++c) {
          var channelData = dstAudioBuffer['getChannelData'](c);
          if (channelData.length != sizeSamplesPerChannel) {
            throw 'Web Audio output buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + sizeSamplesPerChannel + ' samples!';
          }
          if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              channelData[j] = (HEAP16[(((heapPtr)+((j*numChannels + c)*2))>>1)]) / 0x8000;
            }
          } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              var v = (HEAP8[(((heapPtr)+(j*numChannels + c))|0)]);
              channelData[j] = ((v >= 0) ? v-128 : v+128) /128;
            }
          }
        }
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      },joystickEventState:1,lastJoystickState:{},joystickNamePool:{},recordJoystickState:function (joystick, state) {
        // Standardize button state.
        var buttons = new Array(state.buttons.length);
        for (var i = 0; i < state.buttons.length; i++) {
          buttons[i] = SDL.getJoystickButtonState(state.buttons[i]);
        }
  
        SDL.lastJoystickState[joystick] = {
          buttons: buttons,
          axes: state.axes.slice(0),
          timestamp: state.timestamp,
          index: state.index,
          id: state.id
        };
      },getJoystickButtonState:function (button) {
        if (typeof button === 'object') {
          // Current gamepad API editor's draft (Firefox Nightly)
          // https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html#idl-def-GamepadButton
          return button.pressed;
        } else {
          // Current gamepad API working draft (Firefox / Chrome Stable)
          // http://www.w3.org/TR/2012/WD-gamepad-20120529/#gamepad-interface
          return button > 0;
        }
      },queryJoysticks:function () {
        for (var joystick in SDL.lastJoystickState) {
          var state = SDL.getGamepad(joystick - 1);
          var prevState = SDL.lastJoystickState[joystick];
          // Check only if the timestamp has differed.
          // NOTE: Timestamp is not available in Firefox.
          if (typeof state.timestamp !== 'number' || state.timestamp !== prevState.timestamp) {
            var i;
            for (i = 0; i < state.buttons.length; i++) {
              var buttonState = SDL.getJoystickButtonState(state.buttons[i]);
              // NOTE: The previous state already has a boolean representation of
              //       its button, so no need to standardize its button state here.
              if (buttonState !== prevState.buttons[i]) {
                // Insert button-press event.
                SDL.events.push({
                  type: buttonState ? 'joystick_button_down' : 'joystick_button_up',
                  joystick: joystick,
                  index: joystick - 1,
                  button: i
                });
              }
            }
            for (i = 0; i < state.axes.length; i++) {
              if (state.axes[i] !== prevState.axes[i]) {
                // Insert axes-change event.
                SDL.events.push({
                  type: 'joystick_axis_motion',
                  joystick: joystick,
                  index: joystick - 1,
                  axis: i,
                  value: state.axes[i]
                });
              }
            }
  
            SDL.recordJoystickState(joystick, state);
          }
        }
      },joystickAxisValueConversion:function (value) {
        // Ensures that 0 is 0, 1 is 32767, and -1 is 32768.
        return Math.ceil(((value+1) * 32767.5) - 32768);
      },getGamepads:function () {
        var fcn = navigator.getGamepads || navigator.webkitGamepads || navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
        if (fcn !== undefined) {
          // The function must be applied on the navigator object.
          return fcn.apply(navigator);
        } else {
          return [];
        }
      },getGamepad:function (deviceIndex) {
        var gamepads = SDL.getGamepads();
        if (gamepads.length > deviceIndex && deviceIndex >= 0) {
          return gamepads[deviceIndex];
        }
        return null;
      }};function _SDL_Flip(surf) {
      // We actually do this in Unlock, since the screen surface has as its canvas
      // backing the page canvas element
    }

  
  function _rint(x) {
      if (Math.abs(x % 1) !== 0.5) return Math.round(x);
      return x + x % 2 + ((x < 0) ? 1 : -1);
    }var _rintf=_rint;

  var _DtoILow=true;

  var _UItoD=true;

  
   
  Module["_rand_r"] = _rand_r;
  
  var ___rand_seed=allocate([0x0273459b, 0, 0, 0], "i32", ALLOC_STATIC); 
  Module["_rand"] = _rand;


  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  
  
  
  var ___cxa_last_thrown_exception=0;function ___resumeException(ptr) {
      if (!___cxa_last_thrown_exception) { ___cxa_last_thrown_exception = ptr; }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }
  
  var ___cxa_exception_header_size=8;function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = ___cxa_last_thrown_exception;
      header = thrown - ___cxa_exception_header_size;
      if (throwntype == -1) throwntype = HEAP32[((header)>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
  
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      var header = ptr - ___cxa_exception_header_size;
      HEAP32[((header)>>2)]=type;
      HEAP32[(((header)+(4))>>2)]=destructor;
      ___cxa_last_thrown_exception = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }

  var _FtoIHigh=true;

  
  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }var _log10f=_log10;

  
  
  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces "//" comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the "#" for "//" again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                url = url + addr + ':' + port;
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) return -1;
      return stream.fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }

  var _acosf=Math_acos;

  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['touchstart', 'touchend', 'touchmove', 'mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
  
      // (0,0) means 'use fullscreen' in native; in Emscripten, use the current canvas size.
      if (width == 0 && height == 0) {
        var canvas = Module['canvas'];
        width = canvas.width;
        height = canvas.height;
      }
  
      Browser.setCanvasSize(width, height, true);
      // Free the old surface first.
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        assert(!SDL.screen);
      }
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          SDL.receiveEvent({
            type: 'resize',
            w: w,
            h: h
          });
        });
      }
      return SDL.screen;
    }

  function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
  
      surfData.locked++;
      if (surfData.locked > 1) return 0;
  
      if (!surfData.buffer) {
        surfData.buffer = _malloc(surfData.width * surfData.height * 4);
        HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
      }
  
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
  
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
  
      surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      if (surf == SDL.screen) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
  
      if (SDL.defaults.copyOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ], 
          //     surfData.image.data[i*4 +1], 
          //     surfData.image.data[i*4 +2], 
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))|0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
        HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
  
      return 0;
    }

  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  var _sqrtf=Math_sqrt;

  var _fabsf=Math_abs;

  function _emscripten_asm_const_int(code) {
      var args = Array.prototype.slice.call(arguments, 1);
      return Runtime.getAsmConst(code, args.length).apply(null, args) | 0;
    }

  
  function _hypot(a, b) {
       return Math.sqrt(a*a + b*b);
    }var _hypotf=_hypot;

  
  function _log2(x) {
      return Math.log(x) / Math.LN2;
    }var _log2f=_log2;

   
  Module["_i64Add"] = _i64Add;

  function _SDL_UnlockSurface(surf) {
      assert(!SDL.GL); // in GL mode we do not keep around 2D canvases and contexts
  
      var surfData = SDL.surfaces[surf];
  
      if (!surfData.locked || --surfData.locked > 0) {
        return;
      }
  
      // Copy pixel data to image
      if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
        SDL.copyIndexedColorData(surfData);
      } else if (!surfData.colors) {
        var data = surfData.image.data;
        var buffer = surfData.buffer;
        assert(buffer % 4 == 0, 'Invalid buffer offset: ' + buffer);
        var src = buffer >> 2;
        var dst = 0;
        var isScreen = surf == SDL.screen;
        var num;
        if (typeof CanvasPixelArray !== 'undefined' && data instanceof CanvasPixelArray) {
          // IE10/IE11: ImageData objects are backed by the deprecated CanvasPixelArray,
          // not UInt8ClampedArray. These don't have buffers, so we need to revert
          // to copying a byte at a time. We do the undefined check because modern
          // browsers do not define CanvasPixelArray anymore.
          num = data.length;
          while (dst < num) {
            var val = HEAP32[src]; // This is optimized. Instead, we could do HEAP32[(((buffer)+(dst))>>2)];
            data[dst  ] = val & 0xff;
            data[dst+1] = (val >> 8) & 0xff;
            data[dst+2] = (val >> 16) & 0xff;
            data[dst+3] = isScreen ? 0xff : ((val >> 24) & 0xff);
            src++;
            dst += 4;
          }
        } else {
          var data32 = new Uint32Array(data.buffer);
          num = data32.length;
          if (isScreen) {
            while (dst < num) {
              // HEAP32[src++] is an optimization. Instead, we could do HEAP32[(((buffer)+(dst))>>2)];
              data32[dst++] = HEAP32[src++] | 0xff000000;
            }
          } else {
            while (dst < num) {
              data32[dst++] = HEAP32[src++];
            }
          }
        }
      } else {
        var width = Module['canvas'].width;
        var height = Module['canvas'].height;
        var s = surfData.buffer;
        var data = surfData.image.data;
        var colors = surfData.colors;
        for (var y = 0; y < height; y++) {
          var base = y*width*4;
          for (var x = 0; x < width; x++) {
            // See comment above about signs
            var val = HEAPU8[((s++)|0)] * 3;
            var start = base + x*4;
            data[start]   = colors[val];
            data[start+1] = colors[val+1];
            data[start+2] = colors[val+2];
          }
          s += width*3;
        }
      }
      // Copy to canvas
      surfData.ctx.putImageData(surfData.image, 0, 0);
      // Note that we save the image, so future writes are fast. But, memory is not yet released
    }

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;

  
  function _fmax(x, y) {
      return isNaN(x) ? y : isNaN(y) ? x : Math.max(x, y);
    }var _fmaxf=_fmax;

  var _llvm_pow_f32=Math_pow;

  function _emscripten_get_now() {
      if (!_emscripten_get_now.actual) {
        if (ENVIRONMENT_IS_NODE) {
          _emscripten_get_now.actual = function _emscripten_get_now_actual() {
            var t = process['hrtime']();
            return t[0] * 1e3 + t[1] / 1e6;
          }
        } else if (typeof dateNow !== 'undefined') {
          _emscripten_get_now.actual = dateNow;
        } else if (ENVIRONMENT_IS_WEB && window['performance'] && window['performance']['now']) {
          _emscripten_get_now.actual = function _emscripten_get_now_actual() { return window['performance']['now'](); };
        } else {
          _emscripten_get_now.actual = Date.now;
        }
      }
      return _emscripten_get_now.actual();
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }


  
  function _stat(path, buf, dontResolveLastLink) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/stat.html
      // int stat(const char *path, struct stat *buf);
      // NOTE: dontResolveLastLink is a shortcut for lstat(). It should never be
      //       used in client code.
      path = typeof path !== 'string' ? Pointer_stringify(path) : path;
      try {
        var stat = dontResolveLastLink ? FS.lstat(path) : FS.stat(path);
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        HEAP32[(((buf)+(36))>>2)]=stat.size;
        HEAP32[(((buf)+(40))>>2)]=4096;
        HEAP32[(((buf)+(44))>>2)]=stat.blocks;
        HEAP32[(((buf)+(48))>>2)]=Math.floor(stat.atime.getTime() / 1000);
        HEAP32[(((buf)+(52))>>2)]=0;
        HEAP32[(((buf)+(56))>>2)]=Math.floor(stat.mtime.getTime() / 1000);
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=Math.floor(stat.ctime.getTime() / 1000);
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=stat.ino;
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fstat(fildes, buf) {
      // int fstat(int fildes, struct stat *buf);
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/fstat.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      return _stat(stream.path, buf);
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

   
  Module["_bitshift64Lshr"] = _bitshift64Lshr;

  function _srand(seed) {
      HEAP32[((___rand_seed)>>2)]=seed
    }

  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  var _BDtoIHigh=true;

  var _asinf=Math_asin;

  var _ceil=Math_ceil;

  
  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }

  function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[((ptr)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((ptr)+(4))>>2)]=Math.floor((now-1000*Math.floor(now/1000))*1000); // microseconds
      return 0;
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _DtoIHigh=true;

  var _llvm_pow_f64=Math_pow;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

   
  Module["_memmove"] = _memmove;

  var _tanf=Math_tan;

  function ___errno_location() {
      return ___errno_state;
    }

  var _BItoD=true;

  
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = Pointer_stringify(path);
      try {
        FS.rmdir(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }

  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }

  function _SDL_Quit() {
      for (var i = 0; i < SDL.numChannels; ++i) {
        if (SDL.channels[i].audio) {
          SDL.channels[i].audio.pause();
        }
      }
      if (SDL.music.audio) {
        SDL.music.audio.pause();
      }
      Module.print('SDL_Quit called (and ignored)');
    }

  function _fmod(x, y) {
      return x % y;
    }

  function ___cxa_guard_release() {}

  var _expf=Math_exp;

  var _cosf=Math_cos;

  
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }

  var _SItoD=true;

  var _SItoF=true;

   
  Module["_memset"] = _memset;

  var _BDtoILow=true;


  var _logf=Math_log;

   
  Module["_bitshift64Shl"] = _bitshift64Shl;


  
  function _sinh(x) {
      var p = Math.pow(Math.E, x);
      return (p - (1 / p)) / 2;
    }var _sinhf=_sinh;

  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  var _tan=Math_tan;


  var _asin=Math_asin;

  function _emscripten_asm_const(code) {
      Runtime.getAsmConst(code, 0)();
    }

  var _atanf=Math_atan;

  var _fabs=Math_abs;

  function _abort() {
      Module['abort']();
    }

  function _SDL_MapRGBA(fmt, r, g, b, a) {
      // Canvas screens are always RGBA. We assume the machine is little-endian.
      return r&0xff|(g&0xff)<<8|(b&0xff)<<16|(a&0xff)<<24;
    }

  var _sqrt=Math_sqrt;



  var _atan2f=Math_atan2;

  var _sin=Math_sin;

  var _fmodl=_fmod;

  var _ceilf=Math_ceil;


  var _atan=Math_atan;


  function ___cxa_allocate_exception(size) {
      var ptr = _malloc(size + ___cxa_exception_header_size);
      return ptr + ___cxa_exception_header_size;
    }


  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }

  var _floorf=Math_floor;

  var _copysignf=_copysign;


  
  var ___cxa_caught_exceptions=[];function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      ___cxa_caught_exceptions.push(___cxa_last_thrown_exception);
      return ptr;
    }

  var _sinf=Math_sin;

  var _log=Math_log;

  var _cos=Math_cos;

   
  Module["_i64Subtract"] = _i64Subtract;

  
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      var fd = _fileno(stream);
      return _write(fd, s, _strlen(s));
    }
  
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var fd = _fileno(stream);
      var ret = _write(fd, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }

  function __ZNSt9exceptionD2Ev() {}

  function _SDL_Init(initFlags) {
      SDL.startTime = Date.now();
      SDL.initFlags = initFlags;
  
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        document.addEventListener("keydown", SDL.receiveEvent);
        document.addEventListener("keyup", SDL.receiveEvent);
        document.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
  
      if (initFlags & 0x200) {
        // SDL_INIT_JOYSTICK
        // Firefox will not give us Joystick data unless we register this NOP
        // callback.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
        addEventListener("gamepadconnected", function() {});
      }
  
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown']    = 0x300  /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup']      = 0x301  /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress']   = 0x303  /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown']  = 0x401  /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup']    = 0x402  /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove']  = 0x400  /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['touchstart'] = 0x700  /* SDL_FINGERDOWN */;
      SDL.DOMEventToSDLEvent['touchend']   = 0x701  /* SDL_FINGERUP */;
      SDL.DOMEventToSDLEvent['touchmove']  = 0x702  /* SDL_FINGERMOTION */;
      SDL.DOMEventToSDLEvent['unload']     = 0x100  /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize']     = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      // These are not technically DOM events; the HTML gamepad API is poll-based.
      // However, we define them here, as the rest of the SDL code assumes that
      // all SDL events originate as DOM events.
      SDL.DOMEventToSDLEvent['joystick_axis_motion'] = 0x600 /* SDL_JOYAXISMOTION */;
      SDL.DOMEventToSDLEvent['joystick_button_down'] = 0x603 /* SDL_JOYBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['joystick_button_up'] = 0x604 /* SDL_JOYBUTTONUP */;
      return 0; // success
    }

  var _floor=Math_floor;

  var _atan2=Math_atan2;

  var _exp=Math_exp;

  var _FtoILow=true;

  var _acos=Math_acos;

  var _UItoF=true;

  var __ZTISt9exception=allocate([allocate([1,0,0,0,0,0,0], "i8", ALLOC_STATIC)+8, 0], "i32", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env.___rand_seed|0;var p=env.__ZTISt9exception|0;var q=0;var r=0;var s=0;var t=0;var u=+env.NaN,v=+env.Infinity;var w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0,E=0.0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=global.Math.floor;var Q=global.Math.abs;var R=global.Math.sqrt;var S=global.Math.pow;var T=global.Math.cos;var U=global.Math.sin;var V=global.Math.tan;var W=global.Math.acos;var X=global.Math.asin;var Y=global.Math.atan;var Z=global.Math.atan2;var _=global.Math.exp;var $=global.Math.log;var aa=global.Math.ceil;var ba=global.Math.imul;var ca=env.abort;var da=env.assert;var ea=env.asmPrintInt;var fa=env.asmPrintFloat;var ga=env.min;var ha=env.jsCall;var ia=env.invoke_iiii;var ja=env.invoke_viiiii;var ka=env.invoke_vi;var la=env.invoke_vii;var ma=env.invoke_ii;var na=env.invoke_v;var oa=env.invoke_iiiii;var pa=env.invoke_viiiiii;var qa=env.invoke_iii;var ra=env.invoke_viiii;var sa=env._fabs;var ta=env._exp;var ua=env._sqrtf;var va=env.__ZSt9terminatev;var wa=env.___cxa_guard_acquire;var xa=env.__reallyNegative;var ya=env._fstat;var za=env.__ZSt18uncaught_exceptionv;var Aa=env._ceilf;var Ba=env.___cxa_begin_catch;var Ca=env._emscripten_memcpy_big;var Da=env._sinh;var Ea=env._sysconf;var Fa=env._close;var Ga=env._tanf;var Ha=env._cos;var Ia=env._puts;var Ja=env._unlink;var Ka=env._write;var La=env._expf;var Ma=env.__ZNSt9exceptionD2Ev;var Na=env.___cxa_does_inherit;var Oa=env._send;var Pa=env._hypot;var Qa=env._log2;var Ra=env._atan2;var Sa=env._SDL_GetTicks;var Ta=env._atan2f;var Ua=env.___cxa_find_matching_catch;var Va=env.___cxa_guard_release;var Wa=env._SDL_LockSurface;var Xa=env.___setErrNo;var Ya=env._llvm_pow_f32;var Za=env.___resumeException;var _a=env._srand;var $a=env._ceil;var ab=env._atanf;var bb=env._printf;var cb=env._logf;var db=env._emscripten_get_now;var eb=env._stat;var fb=env._read;var gb=env._SDL_SetVideoMode;var hb=env._fwrite;var ib=env._time;var jb=env._fprintf;var kb=env._gettimeofday;var lb=env._log10;var mb=env._exit;var nb=env._llvm_pow_f64;var ob=env._fmod;var pb=env._lseek;var qb=env._rmdir;var rb=env.___cxa_allocate_exception;var sb=env._asin;var tb=env._floor;var ub=env._pwrite;var vb=env._cosf;var wb=env._open;var xb=env._fabsf;var yb=env._remove;var zb=env._emscripten_asm_const;var Ab=env._SDL_Init;var Bb=env._snprintf;var Cb=env._SDL_Quit;var Db=env._sinf;var Eb=env._floorf;var Fb=env._log;var Gb=env._recv;var Hb=env._tan;var Ib=env._SDL_UnlockSurface;var Jb=env._abort;var Kb=env._SDL_MapRGBA;var Lb=env._SDL_Flip;var Mb=env._isspace;var Nb=env._sin;var Ob=env.___cxa_is_number_type;var Pb=env._acosf;var Qb=env._acos;var Rb=env._cosh;var Sb=env._emscripten_asm_const_int;var Tb=env._fmax;var Ub=env._fflush;var Vb=env._asinf;var Wb=env._fileno;var Xb=env.__exit;var Yb=env._atan;var Zb=env._fputs;var _b=env._pread;var $b=env._mkport;var ac=env._sbrk;var bc=env.___errno_location;var cc=env._copysign;var dc=env._fputc;var ec=env.___cxa_throw;var fc=env.__formatString;var gc=env._rint;var hc=env._sqrt;var ic=0.0;
// EMSCRIPTEN_START_FUNCS
function Dh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;f=c[c[b+4>>2]>>2]|0;e=c[c[b+8>>2]>>2]|0;g=c[b+12>>2]|0;if((g|0)==0){j=0}else{j=c[g>>2]|0}g=c[b+16>>2]|0;if((g|0)==0){g=0}else{g=c[g>>2]|0}k=c[b+20>>2]|0;if((k|0)==0){k=0}else{k=c[k>>2]|0}o=c[f>>2]|0;p=c[f+4>>2]|0;n=c[e>>2]|0;q=c[e+4>>2]|0;v=c[(c[f+8>>2]|0)+16>>2]&255;e=f+(v<<2)+16|0;if((v|0)==0){l=1}else{l=1;r=f+16|0;while(1){m=r+4|0;l=ba(c[r>>2]|0,l)|0;if(m>>>0<e>>>0){r=m}else{break}}}m=f+12|0;e=c[m>>2]|0;j=(j|0)<(l|0)?j:l;j=(j|0)<0?0:j;p=p-o|0;s=q-n|0;a:do{if((j+s|0)<=(p|0)){r=n+s|0;q=(s|0)>0;b:while(1){if(!q){break}t=o+j|0;u=n;while(1){v=u+1|0;if((a[u]|0)!=(a[t]|0)){break}if(v>>>0<r>>>0){t=t+1|0;u=v}else{break b}}j=j+1|0;if((j+s|0)>(p|0)){h=17;break a}}n=(k|0)!=0;if((j|0)==-1){if(n){h=47;break}else{h=54;break}}c:do{if(n){l=l-j|0;n=k+8|0;o=c[n>>2]|0;v=c[o+16>>2]&255;q=k+(v<<2)+16|0;if((v|0)==0){r=1}else{r=1;s=k+16|0;while(1){p=s+4|0;r=ba(c[s>>2]|0,r)|0;if(p>>>0<q>>>0){s=p}else{break}}}o=c[(nc[c[(c[o>>2]|0)+36>>2]&1023](o)|0)>>2]|0;if((!((c[(c[n>>2]|0)+16>>2]&255|0)!=1|(o|0)>-1)?!((o|0)!=-2147483648&(l|0)>(0-o|0)|(r|0)==(l|0)):0)?Wd(k,ba(c[(c[k+12>>2]|0)+12>>2]|0,l)|0,r,l,1)|0:0){c[k+16>>2]=l}n=c[f>>2]|0;p=ba(c[(c[m>>2]|0)+12>>2]|0,j)|0;m=n+p|0;o=c[k>>2]|0;k=c[e+12>>2]|0;q=ba(k,l)|0;if((c[e+16>>2]&2097152|0)!=0){Xt(o|0,m|0,q|0)|0;break}l=n+(q+p)|0;if((q|0)>0){while(1){if((jc[c[(c[e>>2]|0)+52>>2]&63](e,m,o)|0)!=0){break c}m=m+k|0;if(!(m>>>0<l>>>0)){break}else{o=o+k|0}}}}}while(0);if((g|0)!=0){k=g+8|0;l=c[k>>2]|0;v=c[l+16>>2]&255;m=g+(v<<2)+16|0;if((v|0)==0){p=1}else{p=1;o=g+16|0;while(1){n=o+4|0;p=ba(c[o>>2]|0,p)|0;if(n>>>0<m>>>0){o=n}else{break}}}l=c[(nc[c[(c[l>>2]|0)+36>>2]&1023](l)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(l|0)>-1)?!((l|0)!=-2147483648&(j|0)>(0-l|0)|(p|0)==(j|0)):0)?Wd(g,ba(c[(c[g+12>>2]|0)+12>>2]|0,j)|0,p,j,1)|0:0){c[g+16>>2]=j}if((f|0)!=(g|0)){k=c[f>>2]|0;l=c[g>>2]|0;f=c[e+12>>2]|0;m=ba(f,j)|0;if((c[e+16>>2]&2097152|0)!=0){Xt(l|0,k|0,m|0)|0;break}g=k+m|0;if((m|0)>0){while(1){if((jc[c[(c[e>>2]|0)+52>>2]&63](e,k,l)|0)!=0){break a}k=k+f|0;if(k>>>0<g>>>0){l=l+f|0}else{break}}}}}}else{h=17}}while(0);if((h|0)==17){if((k|0)==0){h=54}else{h=47}}if((h|0)==47){h=k+8|0;j=c[h>>2]|0;v=c[j+16>>2]&255;n=k+(v<<2)+16|0;if((v|0)==0){o=1}else{o=1;p=k+16|0;while(1){m=p+4|0;o=ba(c[p>>2]|0,o)|0;if(m>>>0<n>>>0){p=m}else{break}}}j=c[(nc[c[(c[j>>2]|0)+36>>2]&1023](j)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(j|0)>-1)?!((j|0)>0|(o|0)==0):0)?Wd(k,0,o,0,1)|0:0){c[k+16>>2]=0;h=54}else{h=54}}d:do{if((h|0)==54){if(!((g|0)==0|(f|0)==(g|0))){h=g+8|0;j=c[h>>2]|0;v=c[j+16>>2]&255;m=g+(v<<2)+16|0;if((v|0)==0){n=1}else{n=1;o=g+16|0;while(1){k=o+4|0;n=ba(c[o>>2]|0,n)|0;if(k>>>0<m>>>0){o=k}else{break}}}j=c[(nc[c[(c[j>>2]|0)+36>>2]&1023](j)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(j|0)>-1)?!((j|0)!=-2147483648&(l|0)>(0-j|0)|(n|0)==(l|0)):0)?Wd(g,ba(c[(c[g+12>>2]|0)+12>>2]|0,l)|0,n,l,1)|0:0){c[g+16>>2]=l}h=c[f>>2]|0;j=c[g>>2]|0;f=c[e+12>>2]|0;k=ba(f,l)|0;if((c[e+16>>2]&2097152|0)!=0){Xt(j|0,h|0,k|0)|0;j=-1;break}g=h+k|0;if((k|0)>0){while(1){if((jc[c[(c[e>>2]|0)+52>>2]&63](e,h,j)|0)!=0){j=-1;break d}h=h+f|0;if(h>>>0<g>>>0){j=j+f|0}else{j=-1;break}}}else{j=-1}}else{j=-1}}}while(0);e=c[b+24>>2]|0;if((e|0)==0){v=b+28|0;i=d;return v|0}c[e>>2]=j;v=b+28|0;i=d;return v|0}function Eh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;e=b+4|0;h=c[c[e>>2]>>2]|0;o=c[(c[h+8>>2]|0)+16>>2]&255;f=h+(o<<2)+16|0;if((o|0)==0){g=1}else{g=1;j=h+16|0;while(1){h=j+4|0;g=ba(c[j>>2]|0,g)|0;if(h>>>0<f>>>0){j=h}else{break}}}f=b+8|0;h=c[c[f>>2]>>2]|0;j=h+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;l=h+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=h+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(g|0)>(0-k|0)|(n|0)==(g|0)):0)?Wd(h,ba(c[(c[h+12>>2]|0)+12>>2]|0,g)|0,n,g,1)|0:0){c[h+16>>2]=g}e=c[c[e>>2]>>2]|0;g=c[e>>2]|0;e=c[e+4>>2]|0;if(!(g>>>0<e>>>0)){o=b+12|0;i=d;return o|0}f=c[c[c[f>>2]>>2]>>2]|0;h=g;while(1){g=h+1|0;h=a[h]|0;if((h+ -97<<24>>24&255)<26){h=(h&255)+224&255}a[f]=h;if((g|0)==(e|0)){break}else{f=f+1|0;h=g}}o=b+12|0;i=d;return o|0}function Fh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;e=b+4|0;h=c[c[e>>2]>>2]|0;o=c[(c[h+8>>2]|0)+16>>2]&255;f=h+(o<<2)+16|0;if((o|0)==0){g=1}else{g=1;j=h+16|0;while(1){h=j+4|0;g=ba(c[j>>2]|0,g)|0;if(h>>>0<f>>>0){j=h}else{break}}}f=b+8|0;h=c[c[f>>2]>>2]|0;j=h+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;l=h+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=h+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(g|0)>(0-k|0)|(n|0)==(g|0)):0)?Wd(h,ba(c[(c[h+12>>2]|0)+12>>2]|0,g)|0,n,g,1)|0:0){c[h+16>>2]=g}e=c[c[e>>2]>>2]|0;g=c[e>>2]|0;e=c[e+4>>2]|0;if(!(g>>>0<e>>>0)){o=b+12|0;i=d;return o|0}f=c[c[c[f>>2]>>2]>>2]|0;h=g;while(1){g=h+1|0;h=a[h]|0;if((h+ -65<<24>>24&255)<26){h=(h&255)+32&255}a[f]=h;if((g|0)==(e|0)){break}else{f=f+1|0;h=g}}o=b+12|0;i=d;return o|0}function Gh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;e=c[c[a+8>>2]>>2]|0;f=c[(c[e+8>>2]|0)+16>>2]&255;d=e+(f<<2)+16|0;f=(f|0)==0;if(f){h=1}else{h=1;j=e+16|0;while(1){g=j+4|0;h=ba(c[j>>2]|0,h)|0;if(g>>>0<d>>>0){j=g}else{break}}}g=c[c[a+12>>2]>>2]|0;m=c[(c[g+8>>2]|0)+16>>2]&255;j=g+(m<<2)+16|0;if((m|0)==0){m=1}else{m=1;l=g+16|0;while(1){k=l+4|0;m=ba(c[l>>2]|0,m)|0;if(k>>>0<j>>>0){l=k}else{break}}}if((h|0)==(m|0)){h=c[e>>2]|0;g=c[g>>2]|0;if(f){f=1}else{f=1;j=e+16|0;while(1){e=j+4|0;f=ba(c[j>>2]|0,f)|0;if(e>>>0<d>>>0){j=e}else{break}}}if((Pt(h,g,f)|0)==0){m=c[a+4>>2]|0;i=b;return m|0}}m=a+16|0;i=b;return m|0}function Hh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;g=c[c[a+8>>2]>>2]|0;k=c[g>>2]|0;d=c[c[a+12>>2]>>2]|0;l=c[d>>2]|0;j=c[(c[g+8>>2]|0)+16>>2]&255;f=g+(j<<2)+16|0;j=(j|0)==0;if(j){m=1}else{m=1;h=g+16|0;while(1){e=h+4|0;m=ba(c[h>>2]|0,m)|0;if(e>>>0<f>>>0){h=e}else{break}}}h=c[(c[d+8>>2]|0)+16>>2]&255;e=d+(h<<2)+16|0;h=(h|0)==0;if(h){p=1}else{p=1;o=d+16|0;while(1){n=o+4|0;p=ba(c[o>>2]|0,p)|0;if(n>>>0<e>>>0){o=n}else{break}}}k=Pt(k,l,(m|0)<(p|0)?m:p)|0;if((k|0)<0){p=c[a+4>>2]|0;i=b;return p|0}if((k|0)>0){p=a+16|0;p=nc[c[p>>2]&1023](p)|0;i=b;return p|0}if(j){f=1}else{j=1;k=g+16|0;while(1){g=k+4|0;j=ba(c[k>>2]|0,j)|0;if(g>>>0<f>>>0){k=g}else{f=j;break}}}if(h){g=1}else{g=1;h=d+16|0;while(1){d=h+4|0;g=ba(c[h>>2]|0,g)|0;if(d>>>0<e>>>0){h=d}else{break}}}if((f|0)<(g|0)){p=c[a+4>>2]|0;i=b;return p|0}else{p=a+16|0;p=nc[c[p>>2]&1023](p)|0;i=b;return p|0}return 0}function Ih(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;g=c[c[a+8>>2]>>2]|0;k=c[g>>2]|0;d=c[c[a+12>>2]>>2]|0;l=c[d>>2]|0;j=c[(c[g+8>>2]|0)+16>>2]&255;f=g+(j<<2)+16|0;j=(j|0)==0;if(j){m=1}else{m=1;h=g+16|0;while(1){e=h+4|0;m=ba(c[h>>2]|0,m)|0;if(e>>>0<f>>>0){h=e}else{break}}}h=c[(c[d+8>>2]|0)+16>>2]&255;e=d+(h<<2)+16|0;h=(h|0)==0;if(h){p=1}else{p=1;o=d+16|0;while(1){n=o+4|0;p=ba(c[o>>2]|0,p)|0;if(n>>>0<e>>>0){o=n}else{break}}}k=Pt(k,l,(m|0)<(p|0)?m:p)|0;if((k|0)>0){p=c[a+4>>2]|0;i=b;return p|0}if((k|0)<0){p=a+16|0;p=nc[c[p>>2]&1023](p)|0;i=b;return p|0}if(j){f=1}else{j=1;k=g+16|0;while(1){g=k+4|0;j=ba(c[k>>2]|0,j)|0;if(g>>>0<f>>>0){k=g}else{f=j;break}}}if(h){g=1}else{g=1;h=d+16|0;while(1){d=h+4|0;g=ba(c[h>>2]|0,g)|0;if(d>>>0<e>>>0){h=d}else{break}}}if((f|0)>(g|0)){p=c[a+4>>2]|0;i=b;return p|0}else{p=a+16|0;p=nc[c[p>>2]&1023](p)|0;i=b;return p|0}return 0}function Jh(b){b=b|0;a[c[b+8>>2]|0]=~~+h[c[b+4>>2]>>3];return b+12|0}function Kh(a){a=a|0;b[c[a+8>>2]>>1]=~~+h[c[a+4>>2]>>3];return a+12|0}function Lh(a){a=a|0;c[c[a+8>>2]>>2]=~~+h[c[a+4>>2]>>3]>>>0;return a+12|0}function Mh(a){a=a|0;var b=0.0,d=0,e=0;b=+h[c[a+4>>2]>>3];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Nh(b){b=b|0;a[c[b+8>>2]|0]=~~+h[c[b+4>>2]>>3];return b+12|0}function Oh(a){a=a|0;b[c[a+8>>2]>>1]=~~+h[c[a+4>>2]>>3];return a+12|0}function Ph(a){a=a|0;c[c[a+8>>2]>>2]=~~+h[c[a+4>>2]>>3];return a+12|0}function Qh(a){a=a|0;var b=0.0,d=0,e=0;b=+h[c[a+4>>2]>>3];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Rh(a){a=a|0;g[c[a+8>>2]>>2]=+h[c[a+4>>2]>>3];return a+12|0}function Sh(a){a=a|0;h[c[a+8>>2]>>3]=+h[c[a+4>>2]>>3];return a+12|0}function Th(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+(d[c[a+4>>2]|0]|0);h[b+8>>3]=0.0;return a+12|0}function Uh(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+(e[c[a+4>>2]>>1]|0);h[b+8>>3]=0.0;return a+12|0}function Vh(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+((c[c[a+4>>2]>>2]|0)>>>0);h[b+8>>3]=0.0;return a+12|0}function Wh(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;d=c[a+4>>2]|0;h[b>>3]=+((c[d>>2]|0)>>>0)+4294967296.0*+((c[d+4>>2]|0)>>>0);h[b+8>>3]=0.0;return a+12|0}function Xh(b){b=b|0;var d=0;d=c[b+8>>2]|0;h[d>>3]=+(a[c[b+4>>2]|0]|0);h[d+8>>3]=0.0;return b+12|0}function Yh(a){a=a|0;var d=0;d=c[a+8>>2]|0;h[d>>3]=+(b[c[a+4>>2]>>1]|0);h[d+8>>3]=0.0;return a+12|0}function Zh(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+(c[c[a+4>>2]>>2]|0);h[b+8>>3]=0.0;return a+12|0}function _h(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;d=c[a+4>>2]|0;h[b>>3]=+((c[d>>2]|0)>>>0)+4294967296.0*+(c[d+4>>2]|0);h[b+8>>3]=0.0;return a+12|0}function $h(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+g[c[a+4>>2]>>2];h[b+8>>3]=0.0;return a+12|0}function ai(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+h[c[a+4>>2]>>3];h[b+8>>3]=0.0;return a+12|0}function bi(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=c[a+12>>2]|0;f=c[a+4>>2]|0;e=c[a+8>>2]|0;d=+h[f+8>>3]+ +h[e+8>>3];h[b>>3]=+h[f>>3]+ +h[e>>3];h[b+8>>3]=d;return a+16|0}function ci(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=c[a+12>>2]|0;f=c[a+4>>2]|0;e=c[a+8>>2]|0;d=+h[f+8>>3]- +h[e+8>>3];h[b>>3]=+h[f>>3]- +h[e>>3];h[b+8>>3]=d;return a+16|0}function di(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;e=b;d=c[a+12>>2]|0;vi(e,c[a+4>>2]|0,c[a+8>>2]|0);c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+16|0}function ei(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;e=b;d=c[a+12>>2]|0;wi(e,c[a+4>>2]|0,c[a+8>>2]|0);c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+16|0}function fi(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+Pa(+(+h[g>>3]),+(+h[j>>3]));e=+h[j>>3]/f;h[d>>3]=+h[g>>3]/f;h[d+8>>3]=e;i=b;return a+12|0}function gi(a){a=a|0;var b=0,d=0.0,e=0;b=i;e=c[a+4>>2]|0;d=+Pa(+(+h[e>>3]),+(+h[e+8>>3]));h[c[a+8>>2]>>3]=d;i=b;return a+12|0}function hi(a){a=a|0;var b=0,d=0,e=0.0,f=0,g=0.0;b=i;d=c[a+8>>2]|0;f=c[a+4>>2]|0;e=+h[f>>3];h[k>>3]=e;do{if(!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)){g=+h[f+8>>3];h[k>>3]=g;if((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072){e=+Q(+g);break}else{e=e*e+g*g;break}}else{e=+Q(+e)}}while(0);h[d>>3]=e;h[d+8>>3]=0.0;i=b;return a+12|0}function ii(a){a=a|0;var b=0.0,d=0;d=c[a+4>>2]|0;b=+Z(+(+h[d+8>>3]),+(+h[d>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function ji(a){a=a|0;var b=0,d=0.0,e=0;b=c[a+8>>2]|0;e=c[a+4>>2]|0;d=-+h[e+8>>3];h[b>>3]=+h[e>>3];h[b+8>>3]=d;return a+12|0}function ki(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;e=b;d=c[a+8>>2]|0;yi(e,c[a+4>>2]|0);c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+12|0}function li(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0.0,j=0,l=0.0,m=0;d=i;b=c[a+8>>2]|0;j=c[a+4>>2]|0;l=+h[j+8>>3];f=-l;g=+h[j>>3];h[k>>3]=f;j=c[k+4>>2]|0;if((c[k>>2]|0)==0&(j&2147483647|0)==2146435072?(h[k>>3]=g,m=c[k+4>>2]&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=f;g=u}else{e=3}do{if((e|0)==3){if(l==-0.0?(h[k>>3]=g,m=c[k+4>>2]&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=f;g=u;break}if(g==0.0?(m=j&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=f;break}l=+Da(+f)*+T(+g);g=+Rb(+f)*+U(+g)}}while(0);h[b>>3]=g;h[b+8>>3]=-l;i=d;return a+12|0}function mi(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0.0,j=0,l=0.0,m=0;d=i;b=c[a+8>>2]|0;j=c[a+4>>2]|0;l=+h[j+8>>3];f=-l;g=+h[j>>3];h[k>>3]=f;j=c[k+4>>2]|0;if((c[k>>2]|0)==0&(j&2147483647|0)==2146435072?(h[k>>3]=g,m=c[k+4>>2]&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=+Q(+f);f=u}else{e=4}do{if((e|0)==4){if(l==-0.0){h[k>>3]=g;m=c[k+4>>2]&2146435072;if(!(m>>>0<2146435072|(m|0)==2146435072&0<0)){l=u;break}if(g==0.0){l=1.0;f=g;break}}if(g==0.0?(m=j&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=+Q(+f);f=g;break}l=+Rb(+f)*+T(+g);f=+Da(+f)*+U(+g)}}while(0);h[b>>3]=l;h[b+8>>3]=f;i=d;return a+12|0}function ni(a){a=a|0;var b=0,d=0,e=0.0,f=0,g=0,j=0;b=i;i=i+32|0;f=b+16|0;g=b;d=c[a+8>>2]|0;j=c[a+4>>2]|0;e=+h[j>>3];h[g>>3]=-+h[j+8>>3];h[g+8>>3]=e;xi(f,g);e=-+h[f>>3];h[d>>3]=+h[f+8>>3];h[d+8>>3]=e;i=b;return a+12|0}function oi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,l=0.0,m=0.0,n=0.0,o=0,p=0;f=i;i=i+48|0;d=f+32|0;b=f+16|0;g=f;e=c[a+8>>2]|0;o=c[a+4>>2]|0;n=+h[o+8>>3];m=-n;l=+h[o>>3];h[k>>3]=m;o=c[k+4>>2]|0;if((c[k>>2]|0)==0&(o&2147483647|0)==2146435072?(h[k>>3]=l,p=c[k+4>>2]&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=+Q(+m);l=u}else{j=4}do{if((j|0)==4){if(n==-0.0){h[k>>3]=l;p=c[k+4>>2]&2146435072;if(!(p>>>0<2146435072|(p|0)==2146435072&0<0)){n=u;l=m;break}if(l==0.0){n=1.0;break}}if(l==0.0?(p=o&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=+Q(+m);break}n=+Rb(+m)*+T(+l);l=+Da(+m)*+U(+l)}}while(0);h[g>>3]=1.0;h[g+8>>3]=0.0;h[b>>3]=n;h[b+8>>3]=l;wi(d,g,b);c[g+0>>2]=c[d+0>>2];c[g+4>>2]=c[d+4>>2];c[g+8>>2]=c[d+8>>2];c[g+12>>2]=c[d+12>>2];c[e+0>>2]=c[g+0>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];i=f;return a+12|0}function pi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,l=0.0,m=0.0,n=0.0,o=0,p=0;f=i;i=i+48|0;d=f+32|0;b=f+16|0;g=f;e=c[a+8>>2]|0;o=c[a+4>>2]|0;n=+h[o+8>>3];l=-n;m=+h[o>>3];h[k>>3]=l;o=c[k+4>>2]|0;if((c[k>>2]|0)==0&(o&2147483647|0)==2146435072?(h[k>>3]=m,p=c[k+4>>2]&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=l;m=u}else{j=3}do{if((j|0)==3){if(n==-0.0?(h[k>>3]=m,p=c[k+4>>2]&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=l;m=u;break}if(m==0.0?(p=o&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=l;break}n=+Da(+l)*+T(+m);m=+Rb(+l)*+U(+m)}}while(0);h[g>>3]=1.0;h[g+8>>3]=0.0;h[b>>3]=m;h[b+8>>3]=-n;wi(d,g,b);c[g+0>>2]=c[d+0>>2];c[g+4>>2]=c[d+4>>2];c[g+8>>2]=c[d+8>>2];c[g+12>>2]=c[d+12>>2];c[e+0>>2]=c[g+0>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];i=f;return a+12|0}function qi(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+$(+(+Pa(+(+h[g>>3]),+(+h[j>>3]))));e=+Z(+(+h[j>>3]),+(+h[g>>3]))/2.302585092994046;h[d>>3]=f/2.302585092994046;h[d+8>>3]=e;i=b;return a+12|0}function ri(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+$(+(+Pa(+(+h[g>>3]),+(+h[j>>3]))));e=+Z(+(+h[j>>3]),+(+h[g>>3]));h[d>>3]=f;h[d+8>>3]=e;i=b;return a+12|0}function si(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+$(+(+Pa(+(+h[g>>3]),+(+h[j>>3]))));e=+Z(+(+h[j>>3]),+(+h[g>>3]))/.6931471805599453;h[d>>3]=f/.6931471805599453;h[d+8>>3]=e;i=b;return a+12|0}function ti(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0,l=0,m=0.0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;f=+h[g+8>>3];e=+h[g>>3];h[k>>3]=e;g=c[k>>2]|0;j=c[k+4>>2]&2147483647;do{if(!((g|0)==0&(j|0)==2146435072)){if((j>>>0>2146435072|(j|0)==2146435072&g>>>0>0)&f==0.0){h[d>>3]=e;j=d+8|0;h[j>>3]=f;j=a+12|0;i=b;return j|0}}else{if(e<0.0){h[k>>3]=f;j=c[k+4>>2]&2146435072;f=j>>>0<2146435072|(j|0)==2146435072&0<0?f:1.0;break}h[k>>3]=f;g=c[k>>2]|0;j=c[k+4>>2]|0;if(!(f==0.0)?(l=j&2146435072,l>>>0<2146435072|(l|0)==2146435072&0<0):0){break}f=(g|0)==0&(j&2147483647|0)==2146435072?u:f;h[d>>3]=e;l=d+8|0;h[l>>3]=f;l=a+12|0;i=b;return l|0}}while(0);m=+_(+e);e=m*+U(+f);f=m*+T(+f);h[d>>3]=f;l=d+8|0;h[l>>3]=e;l=a+12|0;i=b;return l|0}function ui(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0,l=0,m=0,n=0,o=0.0;b=i;i=i+32|0;g=b+16|0;j=b;d=c[a+12>>2]|0;m=c[a+4>>2]|0;l=c[a+8>>2]|0;n=m+8|0;e=+$(+(+Pa(+(+h[m>>3]),+(+h[n>>3]))));f=+Z(+(+h[n>>3]),+(+h[m>>3]));h[j>>3]=e;h[j+8>>3]=f;vi(g,l,j);f=+h[g+8>>3];e=+h[g>>3];h[k>>3]=e;g=c[k>>2]|0;j=c[k+4>>2]&2147483647;do{if(!((g|0)==0&(j|0)==2146435072)){if((j>>>0>2146435072|(j|0)==2146435072&g>>>0>0)&f==0.0){h[d>>3]=e;n=d+8|0;h[n>>3]=f;n=a+16|0;i=b;return n|0}}else{if(e<0.0){h[k>>3]=f;n=c[k+4>>2]&2146435072;f=n>>>0<2146435072|(n|0)==2146435072&0<0?f:1.0;break}h[k>>3]=f;g=c[k>>2]|0;j=c[k+4>>2]|0;if(!(f==0.0)?(n=j&2146435072,n>>>0<2146435072|(n|0)==2146435072&0<0):0){break}f=(g|0)==0&(j&2147483647|0)==2146435072?u:f;h[d>>3]=e;n=d+8|0;h[n>>3]=f;n=a+16|0;i=b;return n|0}}while(0);o=+_(+e);e=o*+U(+f);f=o*+T(+f);h[d>>3]=f;n=d+8|0;h[n>>3]=e;n=a+16|0;i=b;return n|0}function vi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0,w=0,x=0;e=i;r=+h[b>>3];p=+h[b+8>>3];s=+h[d>>3];q=+h[d+8>>3];o=r*s;l=p*q;j=r*q;g=p*s;n=o-l;m=g+j;h[k>>3]=n;x=c[k+4>>2]&2147483647;if(!(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0)){r=n;s=m;h[a>>3]=r;x=a+8|0;h[x>>3]=s;i=e;return}h[k>>3]=m;x=c[k+4>>2]&2147483647;if(!(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0)){r=n;s=m;h[a>>3]=r;x=a+8|0;h[x>>3]=s;i=e;return}h[k>>3]=r;b=(c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072;h[k>>3]=p;d=c[k>>2]|0;t=c[k+4>>2]&2147483647;if(!b){if((d|0)==0&(t|0)==2146435072){d=0;t=2146435072;f=5}else{x=0}}else{f=5}if((f|0)==5){r=+cc(+(b?1.0:0.0),+r);p=+cc(+((d|0)==0&(t|0)==2146435072?1.0:0.0),+p);h[k>>3]=s;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){s=+cc(0.0,+s)}h[k>>3]=q;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){q=+cc(0.0,+q);x=1}else{x=1}}h[k>>3]=s;t=c[k>>2]|0;w=c[k+4>>2]&2147483647;u=(t|0)==0&(w|0)==2146435072;h[k>>3]=q;b=c[k>>2]|0;d=c[k+4>>2]&2147483647;if(!u){if(!((b|0)==0&(d|0)==2146435072)){if(!x){h[k>>3]=o;if(((!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)?(h[k>>3]=l,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0)?(h[k>>3]=j,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0)?(h[k>>3]=g,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0){r=n;s=m;h[a>>3]=r;x=a+8|0;h[x>>3]=s;i=e;return}h[k>>3]=r;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){r=+cc(0.0,+r)}h[k>>3]=p;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){p=+cc(0.0,+p)}if(w>>>0>2146435072|(w|0)==2146435072&t>>>0>0){s=+cc(0.0,+s)}if(d>>>0>2146435072|(d|0)==2146435072&b>>>0>0){q=+cc(0.0,+q)}}}else{b=0;d=2146435072;f=11}}else{f=11}if((f|0)==11){s=+cc(+(u?1.0:0.0),+s);q=+cc(+((b|0)==0&(d|0)==2146435072?1.0:0.0),+q);h[k>>3]=r;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){r=+cc(0.0,+r)}h[k>>3]=p;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){p=+cc(0.0,+p)}}o=(r*s-p*q)*v;s=(p*s+r*q)*v;h[a>>3]=o;x=a+8|0;h[x>>3]=s;i=e;return}function wi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0.0,g=0.0,j=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0;e=i;g=+h[b>>3];f=+h[b+8>>3];m=+h[d>>3];n=+h[d+8>>3];l=+et(+Tb(+(+Q(+m)),+(+Q(+n))));h[k>>3]=l;b=c[k>>2]|0;d=c[k+4>>2]|0;t=d&2146435072;if(t>>>0<2146435072|(t|0)==2146435072&0<0){r=~~l;t=0-r|0;m=+Kt(m,t);n=+Kt(n,t)}else{r=0}o=m*m+n*n;t=0-r|0;q=+Kt((g*m+f*n)/o,t);p=+Kt((f*m-g*n)/o,t);h[k>>3]=q;t=c[k+4>>2]&2147483647;if(!(t>>>0>2146435072|(t|0)==2146435072&(c[k>>2]|0)>>>0>0)){o=q;q=p;h[a>>3]=o;t=a+8|0;h[t>>3]=q;i=e;return}h[k>>3]=p;t=c[k+4>>2]&2147483647;if(!(t>>>0>2146435072|(t|0)==2146435072&(c[k>>2]|0)>>>0>0)){o=q;q=p;h[a>>3]=o;t=a+8|0;h[t>>3]=q;i=e;return}h[k>>3]=g;s=c[k>>2]|0;r=c[k+4>>2]|0;t=r&2147483647;do{if(o==0.0){if(t>>>0>2146435072|(t|0)==2146435072&s>>>0>0?(h[k>>3]=f,u=c[k+4>>2]&2147483647,u>>>0>2146435072|(u|0)==2146435072&(c[k>>2]|0)>>>0>0):0){break}q=+cc(v,+m);p=g*q;q=f*q;h[a>>3]=p;u=a+8|0;h[u>>3]=q;i=e;return}}while(0);s=(s|0)==0&(t|0)==2146435072;if(!(!s?(h[k>>3]=f,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0)){j=11}if(((j|0)==11?(h[k>>3]=m,u=c[k+4>>2]&2146435072,u>>>0<2146435072|(u|0)==2146435072&0<0):0)?(h[k>>3]=n,u=c[k+4>>2]&2146435072,u>>>0<2146435072|(u|0)==2146435072&0<0):0){g=+cc(+(s?1.0:0.0),+g);h[k>>3]=f;q=+cc(+((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?1.0:0.0),+f);p=(m*g+n*q)*v;q=(m*q-n*g)*v;h[a>>3]=p;u=a+8|0;h[u>>3]=q;i=e;return}if(!((b|0)==0&(d&2147483647|0)==2146435072&l>0.0)){o=q;q=p;h[a>>3]=o;u=a+8|0;h[u>>3]=q;i=e;return}u=r&2146435072;if(!(u>>>0<2146435072|(u|0)==2146435072&0<0)){o=q;q=p;h[a>>3]=o;u=a+8|0;h[u>>3]=q;i=e;return}h[k>>3]=f;u=c[k+4>>2]&2146435072;if(!(u>>>0<2146435072|(u|0)==2146435072&0<0)){o=q;q=p;h[a>>3]=o;u=a+8|0;h[u>>3]=q;i=e;return}h[k>>3]=m;l=+cc(+((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?1.0:0.0),+m);h[k>>3]=n;q=+cc(+((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?1.0:0.0),+n);p=(g*l+f*q)*0.0;q=(f*l-g*q)*0.0;h[a>>3]=p;u=a+8|0;h[u>>3]=q;i=e;return}function xi(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0,g=0,j=0.0,l=0.0;d=i;e=+h[b>>3];h[k>>3]=e;g=c[k>>2]|0;f=c[k+4>>2]&2147483647;if((g|0)==0&(f|0)==2146435072){e=+h[b+8>>3];h[k>>3]=e;b=c[k+4>>2]&2146435072;if(b>>>0<2146435072|(b|0)==2146435072&0<0){l=+cc(0.0,+(+U(+(e*2.0))));h[a>>3]=1.0;h[a+8>>3]=l;i=d;return}else{h[a>>3]=1.0;h[a+8>>3]=0.0;i=d;return}}j=+h[b+8>>3];if((f>>>0>2146435072|(f|0)==2146435072&g>>>0>0)&j==0.0){c[a+0>>2]=c[b+0>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];c[a+12>>2]=c[b+12>>2];i=d;return}e=e*2.0;j=j*2.0;l=+Rb(+e)+ +T(+j);e=+Da(+e);h[k>>3]=e;if((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?(h[k>>3]=l,(c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072):0){h[a>>3]=e>0.0?1.0:-1.0;h[a+8>>3]=j>0.0?0.0:-0.0;i=d;return}j=+U(+j)/l;h[a>>3]=e/l;h[a+8>>3]=j;i=d;return}function yi(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0.0,g=0,j=0,l=0,m=0.0;d=i;g=b+8|0;e=+h[g>>3];h[k>>3]=e;j=c[k>>2]|0;l=c[k+4>>2]&2147483647;if((j|0)==0&(l|0)==2146435072){h[a>>3]=v;h[a+8>>3]=e;i=d;return}f=+h[b>>3];h[k>>3]=f;if((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072){b=l>>>0>2146435072|(l|0)==2146435072&j>>>0>0;if(!(f>0.0)){f=+cc(+f,+e);h[a>>3]=b?e:0.0;h[a+8>>3]=f;i=d;return}if(!b){e=+cc(0.0,+e)}h[a>>3]=f;h[a+8>>3]=e;i=d;return}e=+R(+(+Pa(+f,+e)));f=+Z(+(+h[g>>3]),+(+h[b>>3]))*.5;h[k>>3]=e;b=c[k>>2]|0;l=c[k+4>>2]|0;g=l&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&b>>>0>0|(l|0)<0){h[a>>3]=u;h[a+8>>3]=u;i=d;return}h[k>>3]=f;j=c[k>>2]|0;l=c[k+4>>2]&2147483647;if(l>>>0>2146435072|(l|0)==2146435072&j>>>0>0){if((b|0)==0&(g|0)==2146435072){h[a>>3]=e;h[a+8>>3]=f;i=d;return}else{h[a>>3]=f;h[a+8>>3]=f;i=d;return}}if(!((j|0)==0&(l|0)==2146435072)){m=e*+T(+f);h[k>>3]=m;l=c[k+4>>2]&2147483647;m=l>>>0>2146435072|(l|0)==2146435072&(c[k>>2]|0)>>>0>0?0.0:m;e=e*+U(+f);h[k>>3]=e;l=c[k+4>>2]&2147483647;f=l>>>0>2146435072|(l|0)==2146435072&(c[k>>2]|0)>>>0>0?0.0:e;h[a>>3]=m;h[a+8>>3]=f;i=d;return}if((b|0)==0&(g|0)==2146435072){h[a>>3]=e;h[a+8>>3]=u;i=d;return}else{h[a>>3]=u;h[a+8>>3]=u;i=d;return}}function zi(b){b=b|0;a[c[b+8>>2]|0]=~~+g[c[b+4>>2]>>2];return b+12|0}function Ai(a){a=a|0;b[c[a+8>>2]>>1]=~~+g[c[a+4>>2]>>2];return a+12|0}function Bi(a){a=a|0;c[c[a+8>>2]>>2]=~~+g[c[a+4>>2]>>2]>>>0;return a+12|0}function Ci(a){a=a|0;var b=0.0,d=0,e=0;b=+g[c[a+4>>2]>>2];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Di(b){b=b|0;a[c[b+8>>2]|0]=~~+g[c[b+4>>2]>>2];return b+12|0}function Ei(a){a=a|0;b[c[a+8>>2]>>1]=~~+g[c[a+4>>2]>>2];return a+12|0}function Fi(a){a=a|0;c[c[a+8>>2]>>2]=~~+g[c[a+4>>2]>>2];return a+12|0}function Gi(a){a=a|0;var b=0.0,d=0,e=0;b=+g[c[a+4>>2]>>2];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Hi(a){a=a|0;g[c[a+8>>2]>>2]=+g[c[a+4>>2]>>2];return a+12|0}function Ii(a){a=a|0;h[c[a+8>>2]>>3]=+g[c[a+4>>2]>>2];return a+12|0}function Ji(a){a=a|0;var b=0,e=0;b=i;e=c[a+8>>2]|0;g[e>>2]=+(d[c[a+4>>2]|0]|0);c[e+4>>2]=0;i=b;return a+12|0}function Ki(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+(e[c[a+4>>2]>>1]|0);c[d+4>>2]=0;i=b;return a+12|0}function Li(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+((c[c[a+4>>2]>>2]|0)>>>0);c[d+4>>2]=0;i=b;return a+12|0}function Mi(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;g[d>>2]=+((c[e>>2]|0)>>>0)+4294967296.0*+((c[e+4>>2]|0)>>>0);c[d+4>>2]=0;i=b;return a+12|0}function Ni(b){b=b|0;var d=0,e=0;d=i;e=c[b+8>>2]|0;g[e>>2]=+(a[c[b+4>>2]|0]|0);c[e+4>>2]=0;i=d;return b+12|0}function Oi(a){a=a|0;var d=0,e=0;d=i;e=c[a+8>>2]|0;g[e>>2]=+(b[c[a+4>>2]>>1]|0);c[e+4>>2]=0;i=d;return a+12|0}function Pi(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+(c[c[a+4>>2]>>2]|0);c[d+4>>2]=0;i=b;return a+12|0}function Qi(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;g[d>>2]=+((c[e>>2]|0)>>>0)+4294967296.0*+(c[e+4>>2]|0);c[d+4>>2]=0;i=b;return a+12|0}function Ri(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+g[c[a+4>>2]>>2];c[d+4>>2]=0;i=b;return a+12|0}function Si(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+h[c[a+4>>2]>>3];c[d+4>>2]=0;i=b;return a+12|0}function Ti(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0;b=i;h=c[a+8>>2]|0;d=c[a+4>>2]|0;f=+g[h>>2]+ +g[d>>2];e=+g[h+4>>2]+ +g[d+4>>2];f=+f;e=+e;d=c[a+12>>2]|0;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+16|0}function Ui(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0;b=i;d=c[a+8>>2]|0;h=c[a+4>>2]|0;f=+g[h>>2]- +g[d>>2];e=+g[h+4>>2]- +g[d+4>>2];f=+f;e=+e;d=c[a+12>>2]|0;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+16|0}function Vi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;f=b;d=c[a+12>>2]|0;lj(f,c[a+4>>2]|0,c[a+8>>2]|0);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+16|0}function Wi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;f=b;d=c[a+12>>2]|0;mj(f,c[a+4>>2]|0,c[a+8>>2]|0);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+16|0}function Xi(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0,j=0;b=i;d=c[a+8>>2]|0;j=c[a+4>>2]|0;h=j+4|0;e=+Pa(+(+g[j>>2]),+(+g[h>>2]));f=+(+g[j>>2]/e);e=+(+g[h>>2]/e);g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function Yi(a){a=a|0;var b=0,d=0.0,e=0;b=i;e=c[a+4>>2]|0;d=+Pa(+(+g[e>>2]),+(+g[e+4>>2]));g[c[a+8>>2]>>2]=d;i=b;return a+12|0}function Zi(a){a=a|0;var b=0,d=0,e=0.0,f=0,h=0.0;b=i;d=c[a+8>>2]|0;f=c[a+4>>2]|0;e=+g[f>>2];do{if(((g[k>>2]=e,c[k>>2]|0)&2147483647|0)!=2139095040){h=+g[f+4>>2];if(((g[k>>2]=h,c[k>>2]|0)&2147483647|0)==2139095040){e=+Q(+h);break}else{e=e*e+h*h;break}}else{e=+Q(+e)}}while(0);g[d>>2]=e;g[d+4>>2]=0.0;i=b;return a+12|0}function _i(a){a=a|0;var b=0.0,d=0;d=c[a+4>>2]|0;b=+Z(+(+g[d+4>>2]),+(+g[d>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function $i(a){a=a|0;var b=0,d=0,e=0.0,f=0.0;b=i;d=c[a+4>>2]|0;f=+(+g[d>>2]);e=+-+g[d+4>>2];d=c[a+8>>2]|0;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function aj(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;f=b;d=c[a+8>>2]|0;pj(f,c[a+4>>2]|0);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+12|0}function bj(a){a=a|0;var b=0,d=0,e=0,f=0.0,h=0.0,j=0,l=0.0;d=i;b=c[a+8>>2]|0;j=c[a+4>>2]|0;l=+g[j+4>>2];f=-l;h=+g[j>>2];j=(g[k>>2]=f,c[k>>2]|0);if((j&2147483647|0)==2139095040?!(((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040):0){l=f;h=u}else{e=3}do{if((e|0)==3){if(l==-0.0?!(((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040):0){l=f;h=u;break}if(h==0.0?!((j&2139095040)>>>0<2139095040):0){l=f;break}l=+Da(+f);l=l*+T(+h);h=+Rb(+f)*+U(+h)}}while(0);h=+h;l=+-l;j=b;g[j>>2]=h;g[j+4>>2]=l;i=d;return a+12|0}function cj(a){a=a|0;var b=0,d=0,e=0,f=0,h=0.0,j=0;b=i;i=i+16|0;e=b+8|0;f=b;d=c[a+8>>2]|0;j=c[a+4>>2]|0;h=+g[j>>2];g[e>>2]=-+g[j+4>>2];g[e+4>>2]=h;nj(f,e);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+12|0}function dj(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0,j=0,k=0;b=i;i=i+16|0;h=b+8|0;j=b;d=c[a+8>>2]|0;k=c[a+4>>2]|0;f=+g[k>>2];g[j>>2]=-+g[k+4>>2];g[j+4>>2]=f;oj(h,j);f=+(+g[h+4>>2]);e=+-+g[h>>2];g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function ej(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,j=0.0,k=0,l=0;b=i;i=i+32|0;f=b+8|0;e=b+24|0;h=b;k=b+16|0;d=c[a+8>>2]|0;l=c[a+4>>2]|0;j=+g[l>>2];g[f>>2]=-+g[l+4>>2];g[f+4>>2]=j;nj(k,f);g[h>>2]=1.0;g[h+4>>2]=0.0;j=+g[k+4>>2];g[e>>2]=+g[k>>2];g[e+4>>2]=j;mj(f,h,e);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+12|0}function fj(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,j=0,l=0.0,m=0.0,n=0.0,o=0;f=i;i=i+32|0;d=f+8|0;b=f+16|0;h=f;e=c[a+8>>2]|0;o=c[a+4>>2]|0;n=+g[o+4>>2];l=-n;m=+g[o>>2];o=(g[k>>2]=l,c[k>>2]|0);if((o&2147483647|0)==2139095040?!(((g[k>>2]=m,c[k>>2]|0)&2139095040)>>>0<2139095040):0){n=l;m=u}else{j=3}do{if((j|0)==3){if(n==-0.0?!(((g[k>>2]=m,c[k>>2]|0)&2139095040)>>>0<2139095040):0){n=l;m=u;break}if(m==0.0?!((o&2139095040)>>>0<2139095040):0){n=l;break}n=+Da(+l);n=n*+T(+m);m=+Rb(+l)*+U(+m)}}while(0);g[h>>2]=1.0;g[h+4>>2]=0.0;g[b>>2]=m;g[b+4>>2]=-n;mj(d,h,b);h=d;j=c[h+4>>2]|0;o=e;c[o>>2]=c[h>>2];c[o+4>>2]=j;i=f;return a+12|0}function gj(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0.0,j=0,k=0;b=i;d=c[a+8>>2]|0;j=c[a+4>>2]|0;k=j+4|0;h=+$(+(+Pa(+(+g[j>>2]),+(+g[k>>2]))));f=+$(10.0);e=+Z(+(+g[k>>2]),+(+g[j>>2]))/f;f=+(h/f);e=+e;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function hj(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0,j=0;b=i;d=c[a+8>>2]|0;h=c[a+4>>2]|0;j=h+4|0;f=+$(+(+Pa(+(+g[h>>2]),+(+g[j>>2]))));e=+Z(+(+g[j>>2]),+(+g[h>>2]));f=+f;e=+e;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function ij(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0.0,j=0,k=0;b=i;d=c[a+8>>2]|0;j=c[a+4>>2]|0;k=j+4|0;h=+$(+(+Pa(+(+g[j>>2]),+(+g[k>>2]))));f=+$(2.0);e=+Z(+(+g[k>>2]),+(+g[j>>2]))/f;f=+(h/f);e=+e;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function jj(a){a=a|0;var b=0,d=0,e=0,f=0.0,h=0.0,j=0,l=0,m=0.0;d=i;e=c[a+8>>2]|0;j=c[a+4>>2]|0;h=+g[j+4>>2];f=+g[j>>2];l=(g[k>>2]=f,c[k>>2]|0)&2147483647;do{if((l|0)!=2139095040){if(l>>>0>2139095040&h==0.0){l=j;f=+g[l>>2];h=+g[l+4>>2]}else{b=9}}else{if(f<0.0){h=((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040?h:1.0;b=9;break}j=(g[k>>2]=h,c[k>>2]|0);if(!(h==0.0)?(j&2139095040)>>>0<2139095040:0){b=9;break}h=(j&2147483647|0)==2139095040?u:h}}while(0);if((b|0)==9){m=+_(+f);f=m*+T(+h);h=m*+U(+h)}f=+f;m=+h;l=e;g[l>>2]=f;g[l+4>>2]=m;i=d;return a+12|0}function kj(a){a=a|0;var b=0,d=0,e=0,f=0.0,h=0.0,j=0,l=0,m=0,n=0,o=0,p=0.0;b=i;i=i+16|0;j=b;l=b+8|0;d=c[a+12>>2]|0;n=c[a+4>>2]|0;m=c[a+8>>2]|0;o=n+4|0;f=+$(+(+Pa(+(+g[n>>2]),+(+g[o>>2]))));h=+Z(+(+g[o>>2]),+(+g[n>>2]));g[l>>2]=f;g[l+4>>2]=h;lj(j,m,l);h=+g[j+4>>2];f=+g[j>>2];l=(g[k>>2]=f,c[k>>2]|0)&2147483647;do{if((l|0)!=2139095040){if(l>>>0>2139095040&h==0.0){o=j;f=+g[o>>2];h=+g[o+4>>2]}else{e=9}}else{if(f<0.0){h=((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040?h:1.0;e=9;break}j=(g[k>>2]=h,c[k>>2]|0);if(!(h==0.0)?(j&2139095040)>>>0<2139095040:0){e=9;break}h=(j&2147483647|0)==2139095040?u:h}}while(0);if((e|0)==9){p=+_(+f);f=p*+T(+h);h=p*+U(+h)}f=+f;p=+h;o=d;g[o>>2]=f;g[o+4>>2]=p;i=b;return a+16|0}function lj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0;e=i;r=+g[b>>2];p=+g[b+4>>2];s=+g[d>>2];q=+g[d+4>>2];o=r*s;l=p*q;j=r*q;h=p*s;n=o-l;m=h+j;if(!(((g[k>>2]=n,c[k>>2]|0)&2147483647)>>>0>2139095040)){r=n;s=m;g[a>>2]=r;u=a+4|0;g[u>>2]=s;i=e;return}if(!(((g[k>>2]=m,c[k>>2]|0)&2147483647)>>>0>2139095040)){r=n;s=m;g[a>>2]=r;u=a+4|0;g[u>>2]=s;i=e;return}d=((g[k>>2]=r,c[k>>2]|0)&2147483647|0)==2139095040;b=(g[k>>2]=p,c[k>>2]|0)&2147483647;if(!d){if((b|0)==2139095040){b=2139095040;f=5}else{u=0}}else{f=5}if((f|0)==5){r=+cc(+(d?1.0:0.0),+r);p=+cc(+((b|0)==2139095040?1.0:0.0),+p);if(((g[k>>2]=s,c[k>>2]|0)&2147483647)>>>0>2139095040){s=+cc(0.0,+s)}if(((g[k>>2]=q,c[k>>2]|0)&2147483647)>>>0>2139095040){q=+cc(0.0,+q);u=1}else{u=1}}b=(g[k>>2]=s,c[k>>2]|0)&2147483647;t=(b|0)==2139095040;d=(g[k>>2]=q,c[k>>2]|0)&2147483647;if(!t){if((d|0)!=2139095040){if(!u){if(((((g[k>>2]=o,c[k>>2]|0)&2147483647|0)!=2139095040?((g[k>>2]=l,c[k>>2]|0)&2147483647|0)!=2139095040:0)?((g[k>>2]=j,c[k>>2]|0)&2147483647|0)!=2139095040:0)?((g[k>>2]=h,c[k>>2]|0)&2147483647|0)!=2139095040:0){r=n;s=m;g[a>>2]=r;u=a+4|0;g[u>>2]=s;i=e;return}if(((g[k>>2]=r,c[k>>2]|0)&2147483647)>>>0>2139095040){r=+cc(0.0,+r)}if(((g[k>>2]=p,c[k>>2]|0)&2147483647)>>>0>2139095040){p=+cc(0.0,+p)}if(b>>>0>2139095040){s=+cc(0.0,+s)}if(d>>>0>2139095040){q=+cc(0.0,+q)}}}else{d=2139095040;f=11}}else{f=11}if((f|0)==11){s=+cc(+(t?1.0:0.0),+s);q=+cc(+((d|0)==2139095040?1.0:0.0),+q);if(((g[k>>2]=r,c[k>>2]|0)&2147483647)>>>0>2139095040){r=+cc(0.0,+r)}if(((g[k>>2]=p,c[k>>2]|0)&2147483647)>>>0>2139095040){p=+cc(0.0,+p)}}o=(r*s-p*q)*v;s=(p*s+r*q)*v;g[a>>2]=o;u=a+4|0;g[u>>2]=s;i=e;return}function mj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0.0,h=0.0,j=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0;e=i;f=+g[b>>2];h=+g[b+4>>2];m=+g[d>>2];l=+g[d+4>>2];n=+ft(+Tb(+(+Q(+m)),+(+Q(+l))));d=(g[k>>2]=n,c[k>>2]|0);if((d&2139095040)>>>0<2139095040){b=~~n;r=0-b|0;m=+gt(m,r);l=+gt(l,r)}else{b=0}q=m*m+l*l;r=0-b|0;p=+gt((f*m+h*l)/q,r);o=+gt((h*m-f*l)/q,r);a:do{if(((g[k>>2]=p,c[k>>2]|0)&2147483647)>>>0>2139095040?((g[k>>2]=o,c[k>>2]|0)&2147483647)>>>0>2139095040:0){b=(g[k>>2]=f,c[k>>2]|0);r=b&2147483647;do{if(q==0.0){if(r>>>0>2139095040?((g[k>>2]=h,c[k>>2]|0)&2147483647)>>>0>2139095040:0){break}o=+cc(v,+m);p=f*o;o=h*o;break a}}while(0);r=(r|0)==2139095040;if(!(!r?((g[k>>2]=h,c[k>>2]|0)&2147483647|0)!=2139095040:0)){j=11}if(((j|0)==11?((g[k>>2]=m,c[k>>2]|0)&2139095040)>>>0<2139095040:0)?((g[k>>2]=l,c[k>>2]|0)&2139095040)>>>0<2139095040:0){f=+cc(+(r?1.0:0.0),+f);o=+cc(+(((g[k>>2]=h,c[k>>2]|0)&2147483647|0)==2139095040?1.0:0.0),+h);p=(m*f+l*o)*v;o=(m*o-l*f)*v;break}if(((d&2147483647|0)==2139095040&n>0.0?(b&2139095040)>>>0<2139095040:0)?((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040:0){m=+cc(+(((g[k>>2]=m,c[k>>2]|0)&2147483647|0)==2139095040?1.0:0.0),+m);o=+cc(+(((g[k>>2]=l,c[k>>2]|0)&2147483647|0)==2139095040?1.0:0.0),+l);p=(f*m+h*o)*0.0;o=(h*m-f*o)*0.0}}}while(0);g[a>>2]=p;g[a+4>>2]=o;i=e;return}function nj(a,b){a=a|0;b=b|0;var d=0.0,e=0,f=0,h=0.0,j=0,l=0.0;e=i;d=+g[b>>2];f=(g[k>>2]=d,c[k>>2]|0);if((f&2147483647|0)==2139095040?!(((g[k>>2]=+g[b+4>>2],c[k>>2]|0)&2139095040)>>>0<2139095040):0){g[a>>2]=+Q(+d);g[a+4>>2]=u;i=e;return}h=+g[b+4>>2];if(d==0.0){if(!(((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040)){g[a>>2]=u;g[a+4>>2]=d;i=e;return}h=+g[b+4>>2];if(h==0.0){g[a>>2]=1.0;g[a+4>>2]=h;i=e;return}}j=b+4|0;if(h==0.0?!((f&2139095040)>>>0<2139095040):0){g[a>>2]=+Q(+d);g[a+4>>2]=h;i=e;return}l=+Rb(+d);d=+g[j>>2];h=+Da(+(+g[b>>2]));d=l*+T(+d);h=h*+U(+(+g[j>>2]));g[a>>2]=d;g[a+4>>2]=h;i=e;return}function oj(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0,h=0.0,j=0.0,l=0;d=i;e=+g[b>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;if((f|0)==2139095040){e=+g[b+4>>2];if(((g[k>>2]=e,c[k>>2]|0)&2139095040)>>>0<2139095040){j=+cc(0.0,+(+U(+(e*2.0))));g[a>>2]=1.0;g[a+4>>2]=j;i=d;return}else{g[a>>2]=1.0;g[a+4>>2]=0.0;i=d;return}}h=+g[b+4>>2];if(f>>>0>2139095040&h==0.0){l=b;f=c[l+4>>2]|0;b=a;c[b>>2]=c[l>>2];c[b+4>>2]=f;i=d;return}e=e*2.0;h=h*2.0;j=+Rb(+e)+ +T(+h);e=+Da(+e);if(((g[k>>2]=e,c[k>>2]|0)&2147483647|0)==2139095040?((g[k>>2]=j,c[k>>2]|0)&2147483647|0)==2139095040:0){g[a>>2]=e>0.0?1.0:-1.0;g[a+4>>2]=h>0.0?0.0:-0.0;i=d;return}h=+U(+h)/j;g[a>>2]=e/j;g[a+4>>2]=h;i=d;return}function pj(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0.0,h=0,j=0,l=0.0;d=i;h=b+4|0;f=+g[h>>2];j=(g[k>>2]=f,c[k>>2]|0)&2147483647;if((j|0)==2139095040){g[a>>2]=v;g[a+4>>2]=f;i=d;return}e=+g[b>>2];if(((g[k>>2]=e,c[k>>2]|0)&2147483647|0)==2139095040){b=j>>>0>2139095040;if(!(e>0.0)){e=+cc(+e,+f);g[a>>2]=b?f:0.0;g[a+4>>2]=e;i=d;return}if(!b){f=+cc(0.0,+f)}g[a>>2]=e;g[a+4>>2]=f;i=d;return}e=+R(+(+Pa(+e,+f)));f=+Z(+(+g[h>>2]),+(+g[b>>2]))*.5;j=(g[k>>2]=e,c[k>>2]|0);b=j&2147483647;if(b>>>0>2139095040|(j|0)<0){g[a>>2]=u;g[a+4>>2]=u;i=d;return}h=(g[k>>2]=f,c[k>>2]|0)&2147483647;if(h>>>0>2139095040){if((b|0)==2139095040){g[a>>2]=e;g[a+4>>2]=f;i=d;return}else{g[a>>2]=f;g[a+4>>2]=f;i=d;return}}if((h|0)!=2139095040){l=e*+T(+f);l=((g[k>>2]=l,c[k>>2]|0)&2147483647)>>>0>2139095040?0.0:l;e=e*+U(+f);f=((g[k>>2]=e,c[k>>2]|0)&2147483647)>>>0>2139095040?0.0:e;g[a>>2]=l;g[a+4>>2]=f;i=d;return}if((b|0)==2139095040){g[a>>2]=e;g[a+4>>2]=u;i=d;return}else{g[a>>2]=u;g[a+4>>2]=u;i=d;return}}function qj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0];return b+16|0}function rj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]|a[c[b+4>>2]|0];return b+16|0}function sj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+8>>2]|0]|a[c[b+4>>2]|0])^1;return b+16|0}function tj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0]^1;return b+16|0}function uj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function vj(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]^1;return b+12|0}function wj(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==0){b=b+12|0;b=nc[c[b>>2]&1023](b)|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function xj(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==0){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+12|0;b=nc[c[b>>2]&1023](b)|0;i=d;return b|0}return 0}function yj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<(d[c[b+8>>2]|0]|0)|0;return b+16|0}function zj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Aj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+4>>2]|0]^1^a[c[b+8>>2]|0];return b+16|0}function Bj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function Cj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Dj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Ej(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+8>>2]|0]|0)+(d[c[b+4>>2]|0]|0);return b+16|0}function Fj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)-(d[c[b+8>>2]|0]|0);return b+16|0}function Gj(b){b=b|0;var e=0;e=(ba(d[c[b+8>>2]|0]|0,d[c[b+4>>2]|0]|0)|0)&255;a[c[b+12>>2]|0]=e;return b+16|0}function Hj(b){b=b|0;a[c[b+8>>2]|0]=(a[c[b+4>>2]|0]|0)!=0|0;return b+12|0}function Ij(b){b=b|0;var e=0;e=a[c[b+8>>2]|0]|0;if(e<<24>>24==0){e=0}else{e=(d[c[b+4>>2]|0]|0)%(e&255)|0}a[c[b+12>>2]|0]=e;return b+16|0}function Jj(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;e=a[c[b+8>>2]|0]|0;if(!(e<<24>>24==0)){g=a[c[b+4>>2]|0]|0;f=(g&255)/(e&255)|0;if(!(((g&255)-(ba(f&255,e&255)|0)&255)<<24>>24==0)){f=((g<<24>>24==0)<<31>>31)+f<<24>>24}}else{f=0}a[c[b+12>>2]|0]=f;i=d;return b+16|0}function Kj(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;g=a[c[b+8>>2]|0]|0;e=g&255;f=a[c[b+4>>2]|0]|0;if(!(g<<24>>24==0)){g=(f&255)-(ba(((f&255)/(g&255)|0)&255,e)|0)|0;h=g&255;if(!(h<<24>>24==0)){if(f<<24>>24==0){f=g+e&255}else{f=h}}else{f=0}}a[c[b+12>>2]|0]=f;i=d;return b+16|0}function Lj(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function Mj(b){b=b|0;var d=0;d=c[b+12>>2]|0;a[d]=a[c[b+8>>2]|0]|0;a[d+1|0]=a[c[b+4>>2]|0]|0;return b+16|0}function Nj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0];return b+16|0}function Oj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]|a[c[b+4>>2]|0];return b+16|0}function Pj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+8>>2]|0]|a[c[b+4>>2]|0])&255^255;return b+16|0}function Qj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0]&255^255;return b+16|0}function Rj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function Sj(b){b=b|0;a[c[b+8>>2]|0]=(d[c[b+4>>2]|0]|0)^255;return b+12|0}function Tj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Uj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Vj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)==(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Wj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)!=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Xj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Yj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Zj(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)>(d[c[a+12>>2]|0]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function _j(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)<(d[c[a+12>>2]|0]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function $j(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)<(d[c[a+12>>2]|0]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ak(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)>(d[c[a+12>>2]|0]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function bk(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function ck(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function dk(a){a=a|0;b[c[a+8>>2]>>1]=d[c[a+4>>2]|0]|0;return a+12|0}function ek(a){a=a|0;c[c[a+8>>2]>>2]=d[c[a+4>>2]|0]|0;return a+12|0}function fk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=d[c[a+4>>2]|0]|0;c[b+4>>2]=0;return a+12|0}function gk(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]|0;return b+12|0}function hk(a){a=a|0;b[c[a+8>>2]>>1]=d[c[a+4>>2]|0]|0;return a+12|0}function ik(a){a=a|0;c[c[a+8>>2]>>2]=d[c[a+4>>2]|0]|0;return a+12|0}function jk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=d[c[a+4>>2]|0]|0;c[b+4>>2]=0;return a+12|0}function kk(a){a=a|0;g[c[a+8>>2]>>2]=+(d[c[a+4>>2]|0]|0);return a+12|0}function lk(a){a=a|0;h[c[a+8>>2]>>3]=+(d[c[a+4>>2]|0]|0);return a+12|0}function mk(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+8>>2]>>1]|0)+(e[c[a+4>>2]>>1]|0);return a+16|0}function nk(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+4>>2]>>1]|0)-(e[c[a+8>>2]>>1]|0);return a+16|0}function ok(a){a=a|0;var d=0;d=(ba(e[c[a+8>>2]>>1]|0,e[c[a+4>>2]>>1]|0)|0)&65535;b[c[a+12>>2]>>1]=d;return a+16|0}function pk(a){a=a|0;b[c[a+8>>2]>>1]=(b[c[a+4>>2]>>1]|0)!=0|0;return a+12|0}function qk(a){a=a|0;var d=0;d=b[c[a+8>>2]>>1]|0;if(d<<16>>16==0){d=0}else{d=(e[c[a+4>>2]>>1]|0)%(d&65535)|0}b[c[a+12>>2]>>1]=d;return a+16|0}function rk(a){a=a|0;var d=0,e=0,f=0,g=0;d=i;e=b[c[a+8>>2]>>1]|0;if(!(e<<16>>16==0)){g=b[c[a+4>>2]>>1]|0;f=(g&65535)/(e&65535)|0;if(!(((g&65535)-(ba(f&65535,e&65535)|0)&65535)<<16>>16==0)){f=((g<<16>>16==0)<<31>>31)+f<<16>>16}}else{f=0}b[c[a+12>>2]>>1]=f;i=d;return a+16|0}function sk(a){a=a|0;var d=0,e=0,f=0,g=0,h=0;d=i;g=b[c[a+8>>2]>>1]|0;e=g&65535;f=b[c[a+4>>2]>>1]|0;if(!(g<<16>>16==0)){g=(f&65535)-(ba(((f&65535)/(g&65535)|0)&65535,e)|0)|0;h=g&65535;if(!(h<<16>>16==0)){if(f<<16>>16==0){f=g+e&65535}else{f=h}}else{f=0}}b[c[a+12>>2]>>1]=f;i=d;return a+16|0}function tk(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=a[d+1|0]|0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function uk(a){a=a|0;var d=0;d=c[a+12>>2]|0;b[d>>1]=b[c[a+8>>2]>>1]|0;b[d+2>>1]=b[c[a+4>>2]>>1]|0;return a+16|0}function vk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1];return a+16|0}function wk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1];return a+16|0}function xk(a){a=a|0;b[c[a+12>>2]>>1]=(b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1])&65535^65535;return a+16|0}function yk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1]&65535^65535;return a+16|0}function zk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]^b[c[a+4>>2]>>1];return a+16|0}function Ak(a){a=a|0;b[c[a+8>>2]>>1]=(e[c[a+4>>2]>>1]|0)^65535;return a+12|0}function Bk(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)<(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Ck(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)<=(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Dk(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)==(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function Ek(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)!=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function Fk(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)>(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Gk(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)>=(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Hk(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)>(e[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Ik(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)<(e[c[a+12>>2]>>1]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Jk(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)<(e[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Kk(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)>(e[c[a+12>>2]>>1]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Lk(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function Mk(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function Nk(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function Ok(a){a=a|0;c[c[a+8>>2]>>2]=e[c[a+4>>2]>>1]|0;return a+12|0}function Pk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=e[c[a+4>>2]>>1]|0;c[b+4>>2]=0;return a+12|0}function Qk(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function Rk(a){a=a|0;b[c[a+8>>2]>>1]=b[c[a+4>>2]>>1]|0;return a+12|0}function Sk(a){a=a|0;c[c[a+8>>2]>>2]=e[c[a+4>>2]>>1]|0;return a+12|0}function Tk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=e[c[a+4>>2]>>1]|0;c[b+4>>2]=0;return a+12|0}function Uk(a){a=a|0;g[c[a+8>>2]>>2]=+(e[c[a+4>>2]>>1]|0);return a+12|0}function Vk(a){a=a|0;h[c[a+8>>2]>>3]=+(e[c[a+4>>2]>>1]|0);return a+12|0}function Wk(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+8>>2]>>2]|0)+(c[c[a+4>>2]>>2]|0);return a+16|0}function Xk(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+4>>2]>>2]|0)-(c[c[a+8>>2]>>2]|0);return a+16|0}function Yk(a){a=a|0;var b=0;b=ba(c[c[a+8>>2]>>2]|0,c[c[a+4>>2]>>2]|0)|0;c[c[a+12>>2]>>2]=b;return a+16|0}function Zk(a){a=a|0;c[c[a+8>>2]>>2]=(c[c[a+4>>2]>>2]|0)!=0;return a+12|0}function _k(a){a=a|0;var b=0;b=c[c[a+8>>2]>>2]|0;if((b|0)==0){b=0}else{b=((c[c[a+4>>2]>>2]|0)>>>0)%(b>>>0)|0}c[c[a+12>>2]>>2]=b;return a+16|0}function $k(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;if((d|0)!=0){f=c[c[a+4>>2]>>2]|0;e=(f>>>0)/(d>>>0)|0;if((f|0)!=(ba(e,d)|0)){e=(((f|0)==0)<<31>>31)+e|0}}else{e=0}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function al(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)!=0){f=(e>>>0)%(d>>>0)|0;if((f|0)==0){e=0}else{e=f+((e|0)==0?d:0)|0}}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function bl(a){a=a|0;var d=0;d=c[a+4>>2]|0;b[c[a+8>>2]>>1]=b[d+2>>1]|0;b[c[a+12>>2]>>1]=b[d>>1]|0;return a+16|0}function cl(a){a=a|0;var b=0;b=c[a+12>>2]|0;c[b>>2]=c[c[a+8>>2]>>2];c[b+4>>2]=c[c[a+4>>2]>>2];return a+16|0}function dl(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2];return a+16|0}function el(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2];return a+16|0}function fl(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2]);return a+16|0}function gl(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2]);return a+16|0}function hl(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]^c[c[a+4>>2]>>2];return a+16|0}function il(a){a=a|0;c[c[a+8>>2]>>2]=~c[c[a+4>>2]>>2];return a+12|0}function jl(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0<(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function kl(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0<=(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function ll(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)==(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function ml(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)!=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function nl(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0>(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function ol(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0>=(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function pl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0>(c[c[a+12>>2]>>2]|0)>>>0){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ql(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0<(c[c[a+12>>2]>>2]|0)>>>0){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function rl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0<(c[c[a+12>>2]>>2]|0)>>>0){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function sl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0>(c[c[a+12>>2]>>2]|0)>>>0){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function tl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ul(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function vl(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function wl(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function xl(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=c[c[a+4>>2]>>2];c[b+4>>2]=0;return a+12|0}function yl(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function zl(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function Al(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function Bl(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=c[c[a+4>>2]>>2];c[b+4>>2]=0;return a+12|0}function Cl(a){a=a|0;g[c[a+8>>2]>>2]=+((c[c[a+4>>2]>>2]|0)>>>0);return a+12|0}function Dl(a){a=a|0;h[c[a+8>>2]>>3]=+((c[c[a+4>>2]>>2]|0)>>>0);return a+12|0}function El(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=Ut(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function Fl(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+4>>2]|0;e=c[a+8>>2]|0;e=_t(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function Gl(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=fu(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function Hl(a){a=a|0;var b=0,d=0;d=c[a+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=((c[d>>2]|0)!=0|(c[d+4>>2]|0)!=0)&1;c[b+4>>2]=0;return a+12|0}function Il(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;if((e|0)==0&(d|0)==0){e=0;d=0}else{f=c[a+4>>2]|0;e=hu(c[f>>2]|0,c[f+4>>2]|0,e|0,d|0)|0;d=F}f=c[a+12>>2]|0;c[f>>2]=e;c[f+4>>2]=d;i=b;return a+16|0}function Jl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;e=c[a+8>>2]|0;f=c[e>>2]|0;e=c[e+4>>2]|0;if(!((f|0)==0&(e|0)==0)){h=c[a+4>>2]|0;j=c[h>>2]|0;h=c[h+4>>2]|0;g=gu(j|0,h|0,f|0,e|0)|0;d=F;f=fu(g|0,d|0,f|0,e|0)|0;if(!((j|0)==(f|0)&(h|0)==(F|0))){j=((j|0)==0&(h|0)==0)<<31>>31;g=Ut(j|0,((j|0)<0)<<31>>31|0,g|0,d|0)|0;d=F}}else{g=0;d=0}j=c[a+12>>2]|0;c[j>>2]=g;c[j+4>>2]=d;i=b;return a+16|0}function Kl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;g=c[a+4>>2]|0;j=c[g>>2]|0;g=c[g+4>>2]|0;if(!((e|0)==0&(d|0)==0)){f=hu(j|0,g|0,e|0,d|0)|0;h=F;if((f|0)==0&(h|0)==0){j=0;g=0}else{g=(j|0)==0&(g|0)==0;j=Ut(f|0,h|0,(g?e:0)|0,(g?d:0)|0)|0;g=F}}h=c[a+12>>2]|0;c[h>>2]=j;c[h+4>>2]=g;i=b;return a+16|0}function Ll(a){a=a|0;var b=0;b=c[a+4>>2]|0;c[c[a+8>>2]>>2]=c[b+4>>2];c[c[a+12>>2]>>2]=c[b>>2];return a+16|0}function Ml(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]&c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]&c[e>>2];c[b+4>>2]=d;return a+16|0}function Nl(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]|c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]|c[e>>2];c[b+4>>2]=d;return a+16|0}function Ol(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]|c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]|c[e>>2]);c[b+4>>2]=d;return a+16|0}function Pl(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]&c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]&c[e>>2]);c[b+4>>2]=d;return a+16|0}function Ql(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]^c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]^c[e>>2];c[b+4>>2]=d;return a+16|0}function Rl(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=~c[e+4>>2];b=c[a+8>>2]|0;c[b>>2]=~c[e>>2];c[b+4>>2]=d;return a+12|0}function Sl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0)&1;return b+16|0}function Tl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<=(c[d>>2]|0)>>>0)&1;return b+16|0}function Ul(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=(c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)&1;return b+16|0}function Vl(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=((c[e>>2]|0)!=(c[d>>2]|0)|(c[e+4>>2]|0)!=(c[d+4>>2]|0))&1;return b+16|0}function Wl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0)&1;return b+16|0}function Xl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>=(c[d>>2]|0)>>>0)&1;return b+16|0}function Yl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function Zl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function _l(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function $l(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function am(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=c[a+4>>2]|0;i=b;return e|0}else{e=a+16|0;i=b;return e|0}return 0}function bm(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=a+16|0;i=b;return e|0}else{e=c[a+4>>2]|0;i=b;return e|0}return 0}function cm(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function dm(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function em(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function fm(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function gm(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function hm(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function im(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function jm(a){a=a|0;var b=0;b=c[a+4>>2]|0;g[c[a+8>>2]>>2]=+((c[b>>2]|0)>>>0)+4294967296.0*+((c[b+4>>2]|0)>>>0);return a+12|0}function km(a){a=a|0;var b=0;b=c[a+4>>2]|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+((c[b+4>>2]|0)>>>0);return a+12|0}function lm(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+8>>2]|0]|0)+(d[c[b+4>>2]|0]|0);return b+16|0}function mm(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)-(d[c[b+8>>2]|0]|0);return b+16|0}function nm(b){b=b|0;var d=0;d=(ba(a[c[b+8>>2]|0]|0,a[c[b+4>>2]|0]|0)|0)&255;a[c[b+12>>2]|0]=d;return b+16|0}function om(b){b=b|0;var d=0;d=a[c[b+4>>2]|0]|0;a[c[b+8>>2]|0]=(d<<24>>24>0)-((d&255)>>>7&255);return b+12|0}function pm(b){b=b|0;var d=0;d=a[c[b+8>>2]|0]|0;if(d<<24>>24==0){d=0}else{d=((a[c[b+4>>2]|0]|0)%(d<<24>>24|0)|0)&255}a[c[b+12>>2]|0]=d;return b+16|0}function qm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=a[c[b+8>>2]|0]|0;f=e<<24>>24;if(!(e<<24>>24==0)){h=a[c[b+4>>2]|0]|0;k=h<<24>>24;j=(k|0)/(f|0)|0;g=j&255;if(!((k-(ba(j<<24>>24,f)|0)&255)<<24>>24==0)){g=((h<<24>>24>0^e<<24>>24>0)<<31>>31)+g<<24>>24}}else{g=0}a[c[b+12>>2]|0]=g;i=d;return b+16|0}function rm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;g=a[c[b+8>>2]|0]|0;e=g<<24>>24;f=a[c[b+4>>2]|0]|0;if(!(g<<24>>24==0)){h=f<<24>>24;h=h-(ba(((h|0)/(e|0)|0)<<24>>24,e)|0)|0;j=h&255;if(!(j<<24>>24==0)){if(f<<24>>24>0^g<<24>>24>0){f=h+e&255}else{f=j}}else{f=0}}a[c[b+12>>2]|0]=f;i=d;return b+16|0}function sm(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function tm(b){b=b|0;var d=0;d=c[b+12>>2]|0;a[d]=a[c[b+8>>2]|0]|0;a[d+1|0]=a[c[b+4>>2]|0]|0;return b+16|0}function um(b){b=b|0;var d=0,e=0;e=a[c[b+4>>2]|0]|0;d=e<<24>>24;a[c[b+8>>2]|0]=e<<24>>24>-1?d:0-d|0;return b+12|0}function vm(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0];return b+16|0}function wm(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]|a[c[b+4>>2]|0];return b+16|0}function xm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+8>>2]|0]|a[c[b+4>>2]|0])&255^255;return b+16|0}function ym(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0]&255^255;return b+16|0}function zm(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function Am(b){b=b|0;a[c[b+8>>2]|0]=(d[c[b+4>>2]|0]|0)^255;return b+12|0}function Bm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)<(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Cm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)<=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Dm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)==(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Em(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)!=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Fm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)>(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Gm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)>=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Hm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)>(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function Im(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)<(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function Jm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)<(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function Km(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)>(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function Lm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function Mm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function Nm(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]|0;return b+12|0}function Om(d){d=d|0;b[c[d+8>>2]>>1]=a[c[d+4>>2]|0]|0;return d+12|0}function Pm(b){b=b|0;c[c[b+8>>2]>>2]=a[c[b+4>>2]|0]|0;return b+12|0}function Qm(b){b=b|0;var d=0,e=0;e=a[c[b+4>>2]|0]|0;d=c[b+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return b+12|0}function Rm(d){d=d|0;b[c[d+8>>2]>>1]=a[c[d+4>>2]|0]|0;return d+12|0}function Sm(b){b=b|0;c[c[b+8>>2]>>2]=a[c[b+4>>2]|0]|0;return b+12|0}function Tm(b){b=b|0;var d=0,e=0;e=a[c[b+4>>2]|0]|0;d=c[b+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return b+12|0}function Um(b){b=b|0;g[c[b+8>>2]>>2]=+(a[c[b+4>>2]|0]|0);return b+12|0}function Vm(b){b=b|0;h[c[b+8>>2]>>3]=+(a[c[b+4>>2]|0]|0);return b+12|0}function Wm(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+8>>2]>>1]|0)+(e[c[a+4>>2]>>1]|0);return a+16|0}function Xm(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+4>>2]>>1]|0)-(e[c[a+8>>2]>>1]|0);return a+16|0}function Ym(a){a=a|0;var d=0;d=(ba(b[c[a+8>>2]>>1]|0,b[c[a+4>>2]>>1]|0)|0)&65535;b[c[a+12>>2]>>1]=d;return a+16|0}function Zm(a){a=a|0;var d=0;d=b[c[a+4>>2]>>1]|0;b[c[a+8>>2]>>1]=(d<<16>>16>0)-((d&65535)>>>15&65535);return a+12|0}function _m(a){a=a|0;var d=0;d=b[c[a+8>>2]>>1]|0;if(d<<16>>16==0){d=0}else{d=((b[c[a+4>>2]>>1]|0)%(d<<16>>16|0)|0)&65535}b[c[a+12>>2]>>1]=d;return a+16|0}function $m(a){a=a|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=b[c[a+8>>2]>>1]|0;f=e<<16>>16;if(!(e<<16>>16==0)){h=b[c[a+4>>2]>>1]|0;k=h<<16>>16;j=(k|0)/(f|0)|0;g=j&65535;if(!((k-(ba(j<<16>>16,f)|0)&65535)<<16>>16==0)){g=((h<<16>>16>0^e<<16>>16>0)<<31>>31)+g<<16>>16}}else{g=0}b[c[a+12>>2]>>1]=g;i=d;return a+16|0}function an(a){a=a|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;g=b[c[a+8>>2]>>1]|0;e=g<<16>>16;f=b[c[a+4>>2]>>1]|0;if(!(g<<16>>16==0)){h=f<<16>>16;h=h-(ba(((h|0)/(e|0)|0)<<16>>16,e)|0)|0;j=h&65535;if(!(j<<16>>16==0)){if(f<<16>>16>0^g<<16>>16>0){f=h+e&65535}else{f=j}}else{f=0}}b[c[a+12>>2]>>1]=f;i=d;return a+16|0}function bn(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=a[d+1|0]|0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function cn(a){a=a|0;var d=0;d=c[a+12>>2]|0;b[d>>1]=b[c[a+8>>2]>>1]|0;b[d+2>>1]=b[c[a+4>>2]>>1]|0;return a+16|0}function dn(a){a=a|0;var d=0,e=0;e=b[c[a+4>>2]>>1]|0;d=e<<16>>16;b[c[a+8>>2]>>1]=e<<16>>16>-1?d:0-d|0;return a+12|0}function en(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1];return a+16|0}function fn(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1];return a+16|0}function gn(a){a=a|0;b[c[a+12>>2]>>1]=(b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1])&65535^65535;return a+16|0}function hn(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1]&65535^65535;return a+16|0}function jn(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]^b[c[a+4>>2]>>1];return a+16|0}function kn(a){a=a|0;b[c[a+8>>2]>>1]=(e[c[a+4>>2]>>1]|0)^65535;return a+12|0}function ln(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)<(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function mn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)<=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function nn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)==(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function on(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)!=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function pn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)>(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function qn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)>=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function rn(a){a=a|0;b[c[a+8>>2]>>1]=d[c[a+4>>2]|0]|0;return a+12|0}function sn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)>(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function tn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)<(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function un(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)<(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function vn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)>(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function wn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function xn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function yn(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function zn(a){a=a|0;b[c[a+8>>2]>>1]=b[c[a+4>>2]>>1]|0;return a+12|0}function An(a){a=a|0;c[c[a+8>>2]>>2]=b[c[a+4>>2]>>1]|0;return a+12|0}function Bn(a){a=a|0;var d=0,e=0;e=b[c[a+4>>2]>>1]|0;d=c[a+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return a+12|0}function Cn(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function Dn(a){a=a|0;c[c[a+8>>2]>>2]=b[c[a+4>>2]>>1]|0;return a+12|0}function En(a){a=a|0;var d=0,e=0;e=b[c[a+4>>2]>>1]|0;d=c[a+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return a+12|0}function Fn(a){a=a|0;g[c[a+8>>2]>>2]=+(b[c[a+4>>2]>>1]|0);return a+12|0}function Gn(a){a=a|0;h[c[a+8>>2]>>3]=+(b[c[a+4>>2]>>1]|0);return a+12|0}function Hn(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+8>>2]>>2]|0)+(c[c[a+4>>2]>>2]|0);return a+16|0}function In(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+4>>2]>>2]|0)-(c[c[a+8>>2]>>2]|0);return a+16|0}function Jn(a){a=a|0;var b=0;b=ba(c[c[a+8>>2]>>2]|0,c[c[a+4>>2]>>2]|0)|0;c[c[a+12>>2]>>2]=b;return a+16|0}function Kn(a){a=a|0;var b=0;b=c[c[a+4>>2]>>2]|0;c[c[a+8>>2]>>2]=((b|0)>0)-(b>>>31);return a+12|0}function Ln(a){a=a|0;var b=0;b=c[c[a+8>>2]>>2]|0;if((b|0)==0){b=0}else{b=(c[c[a+4>>2]>>2]|0)%(b|0)|0}c[c[a+12>>2]>>2]=b;return a+16|0}function Mn(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;if((d|0)!=0){f=c[c[a+4>>2]>>2]|0;e=(f|0)/(d|0)|0;if((f|0)!=(ba(e,d)|0)){e=(((f|0)>0^(d|0)>0)<<31>>31)+e|0}}else{e=0}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function Nn(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)!=0){f=(e|0)%(d|0)|0;if((f|0)==0){e=0}else{e=f+((e|0)>0^(d|0)>0?d:0)|0}}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function On(a){a=a|0;var d=0;d=c[a+4>>2]|0;b[c[a+8>>2]>>1]=b[d+2>>1]|0;b[c[a+12>>2]>>1]=b[d>>1]|0;return a+16|0}function Pn(a){a=a|0;var b=0;b=c[a+12>>2]|0;c[b>>2]=c[c[a+8>>2]>>2];c[b+4>>2]=c[c[a+4>>2]>>2];return a+16|0}function Qn(a){a=a|0;var b=0;b=c[c[a+4>>2]>>2]|0;c[c[a+8>>2]>>2]=(b|0)>-1?b:0-b|0;return a+12|0}function Rn(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2];return a+16|0}function Sn(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2];return a+16|0}function Tn(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2]);return a+16|0}function Un(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2]);return a+16|0}function Vn(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]^c[c[a+4>>2]>>2];return a+16|0}function Wn(a){a=a|0;c[c[a+8>>2]>>2]=~c[c[a+4>>2]>>2];return a+12|0}function Xn(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)<0){c[c[a+12>>2]>>2]=e>>>(0-d|0);e=a+16|0;i=b;return e|0}else{c[c[a+12>>2]>>2]=e<<d;e=a+16|0;i=b;return e|0}return 0}function Yn(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)<0){c[c[a+12>>2]>>2]=e>>0-d;e=a+16|0;i=b;return e|0}else{c[c[a+12>>2]>>2]=e<<d;e=a+16|0;i=b;return e|0}return 0}function Zn(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)<(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function _n(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)<=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function $n(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)==(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function ao(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)!=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function bo(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function co(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function eo(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function fo(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)<(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function go(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)<(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ho(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function io(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function jo(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function ko(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function lo(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function mo(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function no(a){a=a|0;var b=0,d=0;d=c[c[a+4>>2]>>2]|0;b=c[a+8>>2]|0;c[b>>2]=d;c[b+4>>2]=((d|0)<0)<<31>>31;return a+12|0}function oo(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function po(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function qo(a){a=a|0;var b=0,d=0;d=c[c[a+4>>2]>>2]|0;b=c[a+8>>2]|0;c[b>>2]=d;c[b+4>>2]=((d|0)<0)<<31>>31;return a+12|0}function ro(a){a=a|0;g[c[a+8>>2]>>2]=+(c[c[a+4>>2]>>2]|0);return a+12|0}function so(a){a=a|0;h[c[a+8>>2]>>3]=+(c[c[a+4>>2]>>2]|0);return a+12|0}function to(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=Ut(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function uo(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+4>>2]|0;e=c[a+8>>2]|0;e=_t(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function vo(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=fu(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function wo(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;f=c[a+4>>2]|0;d=c[f>>2]|0;f=c[f+4>>2]|0;e=Vt(d|0,f|0,63)|0;e=(((f|0)>0|(f|0)==0&d>>>0>0)&1)-e|0;d=c[a+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;i=b;return a+12|0}function xo(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;if((e|0)==0&(d|0)==0){e=0;d=0}else{f=c[a+4>>2]|0;e=eu(c[f>>2]|0,c[f+4>>2]|0,e|0,d|0)|0;d=F}f=c[a+12>>2]|0;c[f>>2]=e;c[f+4>>2]=d;i=b;return a+16|0}function yo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;e=c[a+8>>2]|0;f=c[e>>2]|0;e=c[e+4>>2]|0;if(!((f|0)==0&(e|0)==0)){j=c[a+4>>2]|0;h=c[j>>2]|0;j=c[j+4>>2]|0;g=du(h|0,j|0,f|0,e|0)|0;d=F;k=fu(g|0,d|0,f|0,e|0)|0;if(!((h|0)==(k|0)&(j|0)==(F|0))){k=(((j|0)>0|(j|0)==0&h>>>0>0)^((e|0)>0|(e|0)==0&f>>>0>0))<<31>>31;g=Ut(k|0,((k|0)<0)<<31>>31|0,g|0,d|0)|0;d=F}}else{g=0;d=0}k=c[a+12>>2]|0;c[k>>2]=g;c[k+4>>2]=d;i=b;return a+16|0}function zo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;f=c[a+4>>2]|0;j=c[f>>2]|0;f=c[f+4>>2]|0;if(!((e|0)==0&(d|0)==0)){h=eu(j|0,f|0,e|0,d|0)|0;g=F;if((h|0)==0&(g|0)==0){j=0;f=0}else{f=((f|0)>0|(f|0)==0&j>>>0>0)^((d|0)>0|(d|0)==0&e>>>0>0);j=Ut(h|0,g|0,(f?e:0)|0,(f?d:0)|0)|0;f=F}}h=c[a+12>>2]|0;c[h>>2]=j;c[h+4>>2]=f;i=b;return a+16|0}function Ao(a){a=a|0;var b=0;b=c[a+4>>2]|0;c[c[a+8>>2]>>2]=c[b+4>>2];c[c[a+12>>2]>>2]=c[b>>2];return a+16|0}function Bo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;d=i;e=c[a+4>>2]|0;g=c[e>>2]|0;e=c[e+4>>2]|0;f=(e|0)>-1|(e|0)==-1&g>>>0>4294967295;h=_t(0,0,g|0,e|0)|0;b=c[a+8>>2]|0;c[b>>2]=f?g:h;c[b+4>>2]=f?e:F;i=d;return a+12|0}function Co(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]&c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]&c[e>>2];c[b+4>>2]=d;return a+16|0}function Do(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]|c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]|c[e>>2];c[b+4>>2]=d;return a+16|0}function Eo(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]|c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]|c[e>>2]);c[b+4>>2]=d;return a+16|0}function Fo(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]&c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]&c[e>>2]);c[b+4>>2]=d;return a+16|0}function Go(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]^c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]^c[e>>2];c[b+4>>2]=d;return a+16|0}function Ho(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=~c[e+4>>2];b=c[a+8>>2]|0;c[b>>2]=~c[e>>2];c[b+4>>2]=d;return a+12|0}function Io(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0)&1;return b+16|0}function Jo(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<=(c[d>>2]|0)>>>0)&1;return b+16|0}function Ko(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=(c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)&1;return b+16|0}function Lo(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=((c[e>>2]|0)!=(c[d>>2]|0)|(c[e+4>>2]|0)!=(c[d+4>>2]|0))&1;return b+16|0}function Mo(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0)&1;return b+16|0}function No(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>=(c[d>>2]|0)>>>0)&1;return b+16|0}function Oo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function Po(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function Qo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function Ro(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function So(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=c[a+4>>2]|0;i=b;return e|0}else{e=a+16|0;i=b;return e|0}return 0}function To(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=a+16|0;i=b;return e|0}else{e=c[a+4>>2]|0;i=b;return e|0}return 0}function Uo(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function Vo(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function Wo(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function Xo(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function Yo(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function Zo(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function _o(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function $o(a){a=a|0;var b=0;b=c[a+4>>2]|0;g[c[a+8>>2]>>2]=+((c[b>>2]|0)>>>0)+4294967296.0*+(c[b+4>>2]|0);return a+12|0}function ap(a){a=a|0;var b=0;b=c[a+4>>2]|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+(c[b+4>>2]|0);return a+12|0}function bp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]+ +g[c[a+8>>2]>>2];return a+16|0}function cp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]- +g[c[a+8>>2]>>2];return a+16|0}function dp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]*+g[c[a+8>>2]>>2];return a+16|0}function ep(a){a=a|0;var b=0.0;b=+g[c[a+4>>2]>>2];g[c[a+8>>2]>>2]=+((b>0.0)-(b<0.0)|0);return a+12|0}function fp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]/+g[c[a+8>>2]>>2];return a+16|0}function gp(a){a=a|0;var b=0.0;b=+T(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function hp(a){a=a|0;var b=0.0;b=+U(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function ip(a){a=a|0;var b=0.0;b=+V(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function jp(a){a=a|0;var b=0.0;b=1.0/+T(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function kp(a){a=a|0;var b=0.0;b=1.0/+U(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function lp(a){a=a|0;var b=0,d=0.0;b=i;d=+lb(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=d;i=b;return a+12|0}function mp(a){a=a|0;var b=0.0;b=+$(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function np(a){a=a|0;var b=0,d=0.0;b=i;d=+Qa(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=d;i=b;return a+12|0}function op(a){a=a|0;var b=0.0;b=+_(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function pp(a){a=a|0;var b=0.0;b=+R(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function qp(a){a=a|0;var b=0.0;b=+S(+(+g[c[a+4>>2]>>2]),+(+g[c[a+8>>2]>>2]));g[c[a+12>>2]>>2]=b;return a+16|0}function rp(a){a=a|0;var b=0.0;b=+X(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function sp(a){a=a|0;var b=0.0;b=+W(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function tp(a){a=a|0;var b=0.0;b=+Y(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function up(a){a=a|0;var b=0.0;b=+Z(+(+g[c[a+4>>2]>>2]),+(+g[c[a+8>>2]>>2]));g[c[a+12>>2]>>2]=b;return a+16|0}function vp(a){a=a|0;var b=0.0;b=+aa(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function wp(a){a=a|0;var b=0.0;b=+Q(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function xp(a){a=a|0;var b=0.0;b=+P(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function yp(a){a=a|0;var b=0.0;b=+P(+(+g[c[a+4>>2]>>2]/+g[c[a+8>>2]>>2]));g[c[a+12>>2]>>2]=b;return a+16|0}function zp(a){a=a|0;var b=0.0,d=0.0;d=+g[c[a+4>>2]>>2];b=+g[c[a+8>>2]>>2];b=d-b*+P(+(d/b));g[c[a+12>>2]>>2]=b;return a+16|0}function Ap(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]<+g[c[b+8>>2]>>2]|0;return b+16|0}function Bp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]<=+g[c[b+8>>2]>>2]|0;return b+16|0}function Cp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]==+g[c[b+8>>2]>>2]|0;return b+16|0}function Dp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]!=+g[c[b+8>>2]>>2]|0;return b+16|0}function Ep(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]>+g[c[b+8>>2]>>2]|0;return b+16|0}function Fp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]>=+g[c[b+8>>2]>>2]|0;return b+16|0}function Gp(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]>+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Hp(a){a=a|0;var b=0;b=i;if(!(+g[c[a+8>>2]>>2]>=+g[c[a+12>>2]>>2])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Ip(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]<+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Jp(a){a=a|0;var b=0;b=i;if(!(+g[c[a+8>>2]>>2]<=+g[c[a+12>>2]>>2])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Kp(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]==+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Lp(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]!=+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Mp(b){b=b|0;var d=0,e=0.0,f=0;d=i;e=+g[c[b+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;do{if(!(f>>>0>2139095040)){if((f|0)==2139095040){a[c[b+8>>2]|0]=!(e<0.0)<<31>>31;break}else{f=~~+gc(+e)&255;a[c[b+8>>2]|0]=f;break}}else{a[c[b+8>>2]|0]=-1}}while(0);i=d;return b+12|0}function Np(a){a=a|0;var d=0,e=0.0,f=0;d=i;e=+g[c[a+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;if(f>>>0>2139095040){b[c[a+8>>2]>>1]=-1;f=a+12|0;i=d;return f|0}if((f|0)==2139095040){b[c[a+8>>2]>>1]=!(e<0.0)<<31>>31;f=a+12|0;i=d;return f|0}else{f=~~+gc(+e)&65535;b[c[a+8>>2]>>1]=f;f=a+12|0;i=d;return f|0}return 0}function Op(a){a=a|0;var b=0,d=0.0,e=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){c[c[a+8>>2]>>2]=-1;e=a+12|0;i=b;return e|0}if((e|0)==2139095040){c[c[a+8>>2]>>2]=!(d<0.0)<<31>>31;e=a+12|0;i=b;return e|0}else{e=~~+gc(+d)>>>0;c[c[a+8>>2]>>2]=e;e=a+12|0;i=b;return e|0}return 0}function Pp(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){e=c[a+8>>2]|0;c[e>>2]=-1;c[e+4>>2]=-1;e=a+12|0;i=b;return e|0}if((e|0)==2139095040){f=!(d<0.0)<<31>>31;e=c[a+8>>2]|0;c[e>>2]=f;c[e+4>>2]=((f|0)<0)<<31>>31;e=a+12|0;i=b;return e|0}else{d=+gc(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Qp(b){b=b|0;var d=0,e=0.0,f=0;d=i;e=+g[c[b+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;do{if(!(f>>>0>2139095040)){if((f|0)==2139095040){a[c[b+8>>2]|0]=e<0.0?-128:127;break}else{f=~~+gc(+e);a[c[b+8>>2]|0]=f;break}}else{a[c[b+8>>2]|0]=127}}while(0);i=d;return b+12|0}function Rp(a){a=a|0;var d=0,e=0.0,f=0;d=i;e=+g[c[a+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;if(f>>>0>2139095040){b[c[a+8>>2]>>1]=32767;f=a+12|0;i=d;return f|0}if((f|0)==2139095040){b[c[a+8>>2]>>1]=e<0.0?-32768:32767;f=a+12|0;i=d;return f|0}else{f=~~+gc(+e);b[c[a+8>>2]>>1]=f;f=a+12|0;i=d;return f|0}return 0}function Sp(a){a=a|0;var b=0,d=0.0,e=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){c[c[a+8>>2]>>2]=2147483647;e=a+12|0;i=b;return e|0}if((e|0)==2139095040){c[c[a+8>>2]>>2]=d<0.0?-2147483648:2147483647;e=a+12|0;i=b;return e|0}else{e=~~+gc(+d);c[c[a+8>>2]>>2]=e;e=a+12|0;i=b;return e|0}return 0}function Tp(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){f=c[a+8>>2]|0;c[f>>2]=-1;c[f+4>>2]=2147483647;f=a+12|0;i=b;return f|0}if((e|0)==2139095040){f=d<0.0;e=c[a+8>>2]|0;c[e>>2]=f?0:-1;c[e+4>>2]=f?-2147483648:2147483647;f=a+12|0;i=b;return f|0}else{d=+gc(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Up(a){a=a|0;h[c[a+8>>2]>>3]=+g[c[a+4>>2]>>2];return a+12|0}function Vp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]+ +h[c[a+8>>2]>>3];return a+16|0}function Wp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]- +h[c[a+8>>2]>>3];return a+16|0}function Xp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]*+h[c[a+8>>2]>>3];return a+16|0}function Yp(a){a=a|0;var b=0.0;b=+h[c[a+4>>2]>>3];h[c[a+8>>2]>>3]=+((b>0.0)-(b<0.0)|0);return a+12|0}function Zp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]/+h[c[a+8>>2]>>3];return a+16|0}function _p(a){a=a|0;var b=0.0;b=+T(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function $p(a){a=a|0;var b=0.0;b=+U(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function aq(a){a=a|0;var b=0.0;b=+V(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function bq(a){a=a|0;var b=0.0;b=1.0/+T(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function cq(a){a=a|0;var b=0.0;b=1.0/+U(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function dq(a){a=a|0;var b=0,d=0.0;b=i;d=+lb(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=d;i=b;return a+12|0}function eq(a){a=a|0;var b=0.0;b=+$(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function fq(a){a=a|0;var b=0,d=0.0;b=i;d=+Qa(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=d;i=b;return a+12|0}function gq(a){a=a|0;var b=0.0;b=+_(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function hq(a){a=a|0;var b=0.0;b=+R(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function iq(a){a=a|0;var b=0.0;b=+S(+(+h[c[a+4>>2]>>3]),+(+h[c[a+8>>2]>>3]));h[c[a+12>>2]>>3]=b;return a+16|0}function jq(a){a=a|0;var b=0.0;b=+X(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function kq(a){a=a|0;var b=0.0;b=+W(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function lq(a){a=a|0;var b=0.0;b=+Y(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function mq(a){a=a|0;var b=0.0;b=+Z(+(+h[c[a+4>>2]>>3]),+(+h[c[a+8>>2]>>3]));h[c[a+12>>2]>>3]=b;return a+16|0}function nq(a){a=a|0;var b=0.0;b=+aa(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function oq(a){a=a|0;var b=0.0;b=+Q(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function pq(a){a=a|0;var b=0.0;b=+P(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function qq(a){a=a|0;var b=0.0;b=+P(+(+h[c[a+4>>2]>>3]/+h[c[a+8>>2]>>3]));h[c[a+12>>2]>>3]=b;return a+16|0}function rq(a){a=a|0;var b=0.0,d=0.0;d=+h[c[a+4>>2]>>3];b=+h[c[a+8>>2]>>3];b=d-b*+P(+(d/b));h[c[a+12>>2]>>3]=b;return a+16|0}function sq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]<+h[c[b+8>>2]>>3]|0;return b+16|0}function tq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]<=+h[c[b+8>>2]>>3]|0;return b+16|0}function uq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]==+h[c[b+8>>2]>>3]|0;return b+16|0}function vq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]!=+h[c[b+8>>2]>>3]|0;return b+16|0}function wq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]>+h[c[b+8>>2]>>3]|0;return b+16|0}function xq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]>=+h[c[b+8>>2]>>3]|0;return b+16|0}function yq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]>+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function zq(a){a=a|0;var b=0;b=i;if(!(+h[c[a+8>>2]>>3]>=+h[c[a+12>>2]>>3])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Aq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]<+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Bq(a){a=a|0;var b=0;b=i;if(!(+h[c[a+8>>2]>>3]<=+h[c[a+12>>2]>>3])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Cq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]==+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Dq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]!=+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Eq(b){b=b|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[b+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){a[c[b+8>>2]|0]=-1;g=b+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){a[c[b+8>>2]|0]=!(e<0.0)<<31>>31;g=b+12|0;i=d;return g|0}else{g=~~+gc(+e)&255;a[c[b+8>>2]|0]=g;g=b+12|0;i=d;return g|0}return 0}function Fq(a){a=a|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[a+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){b[c[a+8>>2]>>1]=-1;g=a+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){b[c[a+8>>2]>>1]=!(e<0.0)<<31>>31;g=a+12|0;i=d;return g|0}else{g=~~+gc(+e)&65535;b[c[a+8>>2]>>1]=g;g=a+12|0;i=d;return g|0}return 0}function Gq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){c[c[a+8>>2]>>2]=-1;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){c[c[a+8>>2]>>2]=!(d<0.0)<<31>>31;f=a+12|0;i=b;return f|0}else{f=~~+gc(+d)>>>0;c[c[a+8>>2]>>2]=f;f=a+12|0;i=b;return f|0}return 0}function Hq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){f=c[a+8>>2]|0;c[f>>2]=-1;c[f+4>>2]=-1;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){e=!(d<0.0)<<31>>31;f=c[a+8>>2]|0;c[f>>2]=e;c[f+4>>2]=((e|0)<0)<<31>>31;f=a+12|0;i=b;return f|0}else{d=+gc(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Iq(b){b=b|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[b+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){a[c[b+8>>2]|0]=127;g=b+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){a[c[b+8>>2]|0]=e<0.0?-128:127;g=b+12|0;i=d;return g|0}else{g=~~+gc(+e);a[c[b+8>>2]|0]=g;g=b+12|0;i=d;return g|0}return 0}function Jq(a){a=a|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[a+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){b[c[a+8>>2]>>1]=32767;g=a+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){b[c[a+8>>2]>>1]=e<0.0?-32768:32767;g=a+12|0;i=d;return g|0}else{g=~~+gc(+e);b[c[a+8>>2]>>1]=g;g=a+12|0;i=d;return g|0}return 0}function Kq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){c[c[a+8>>2]>>2]=2147483647;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){c[c[a+8>>2]>>2]=d<0.0?-2147483648:2147483647;f=a+12|0;i=b;return f|0}else{f=~~+gc(+d);c[c[a+8>>2]>>2]=f;f=a+12|0;i=b;return f|0}return 0}function Lq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){f=c[a+8>>2]|0;c[f>>2]=-1;c[f+4>>2]=2147483647;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){f=d<0.0;e=c[a+8>>2]|0;c[e>>2]=f?0:-1;c[e+4>>2]=f?-2147483648:2147483647;f=a+12|0;i=b;return f|0}else{d=+gc(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Mq(a){a=a|0;g[c[a+8>>2]>>2]=+h[c[a+4>>2]>>3];return a+12|0}function Nq(b){b=b|0;var d=0,e=0,f=0,g=0.0;d=i;e=b+4|0;if((c[e>>2]|0)==0){e=b+8|0;i=d;return e|0}if((a[26472]|0)==0){f=us()|0;_a(f|0);a[26472]=1}g=+(St()|0)*4.656612873077393e-10;h[c[e>>2]>>3]=g;f=b+8|0;i=d;return f|0}function Oq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Pq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Qq(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)==(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Rq(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)!=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Sq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Tq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Uq(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;g=c[c[b+4>>2]>>2]|0;h=g+12|0;d=c[h>>2]|0;f=c[c[b+8>>2]>>2]|0;j=g+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;l=g+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=g+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((c[(c[j>>2]|0)+16>>2]&255|0)!=1){o=b+16|0;i=e;return o|0}do{if((k|0)>-1){if((k|0)<(f|0)){o=b+16|0;i=e;return o|0}}else{if((k|0)!=-2147483648&(f|0)>(0-k|0)){o=b+16|0;i=e;return o|0}if((n|0)!=(f|0)){if(Wd(g,ba(c[(c[h>>2]|0)+12>>2]|0,f)|0,n,f,1)|0){c[g+16>>2]=f;break}else{o=b+16|0;i=e;return o|0}}}}while(0);h=c[b+12>>2]|0;j=c[g>>2]|0;g=c[d+12>>2]|0;if((c[d+16>>2]&2097152|0)!=0&(g|0)==1){Yt(j|0,a[h]|0,f|0)|0;o=b+16|0;i=e;return o|0}o=ba(g,f)|0;f=j+o|0;if((o|0)<=0){o=b+16|0;i=e;return o|0}do{jc[c[(c[d>>2]|0)+52>>2]&63](d,h,j)|0;j=j+g|0}while(j>>>0<f>>>0);o=b+16|0;i=e;return o|0}function Vq(a){a=a|0;var b=0;b=c[c[a+4>>2]>>2]|0;c[c[a+8>>2]>>2]=((c[b+4>>2]|0)-(c[b>>2]|0)|0)/(c[(c[b+12>>2]|0)+12>>2]|0)|0;return a+12|0}function Wq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;f=c[c[a+4>>2]>>2]|0;g=c[(c[f+8>>2]|0)+16>>2]&255;d=f+(g<<2)+16|0;if((g|0)==0){e=1}else{e=1;g=f+16|0;while(1){f=g+4|0;e=ba(c[g>>2]|0,e)|0;if(f>>>0<d>>>0){g=f}else{break}}}c[c[a+8>>2]>>2]=e;i=b;return a+12|0}function Xq(a){a=a|0;c[c[a+8>>2]>>2]=c[(c[(c[c[a+4>>2]>>2]|0)+8>>2]|0)+16>>2]&255;return a+12|0}function Yq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;f=i;b=c[c[a+4>>2]>>2]|0;d=c[c[a+8>>2]>>2]|0;e=b+8|0;g=c[e>>2]|0;l=c[g+16>>2]&255;h=b+(l<<2)+16|0;if((l|0)==0){k=1}else{k=1;l=b+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}g=c[(nc[c[(c[g>>2]|0)+36>>2]&1023](g)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(g|0)>-1){l=a+12|0;i=f;return l|0}if((g|0)!=-2147483648&(d|0)>(0-g|0)|(k|0)==(d|0)){l=a+12|0;i=f;return l|0}if(!(Wd(b,ba(c[(c[b+12>>2]|0)+12>>2]|0,d)|0,k,d,1)|0)){l=a+12|0;i=f;return l|0}c[b+16>>2]=d;l=a+12|0;i=f;return l|0}function Zq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;d=i;b=c[c[a+4>>2]>>2]|0;h=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(h<<2)+16|0;if((h|0)==0){g=1}else{g=1;h=b+16|0;while(1){f=h+4|0;g=ba(c[h>>2]|0,g)|0;if(f>>>0<e>>>0){h=f}else{break}}}e=c[b+12>>2]|0;f=c[c[a+8>>2]>>2]|0;h=c[a+12>>2]|0;if((h|0)==0){h=a+16|0;i=d;return h|0}if((f|0)>-1&(f|0)<(g|0)){g=(c[b>>2]|0)+(ba(c[e+12>>2]|0,f)|0)|0;jc[c[(c[e>>2]|0)+52>>2]&63](e,g,h)|0;h=a+16|0;i=d;return h|0}else{jc[c[(c[e>>2]|0)+48>>2]&63](e,h,0)|0;h=a+16|0;i=d;return h|0}return 0}function _q(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;d=i;b=c[c[a+4>>2]>>2]|0;h=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(h<<2)+16|0;if((h|0)==0){g=1}else{g=1;h=b+16|0;while(1){f=h+4|0;g=ba(c[h>>2]|0,g)|0;if(f>>>0<e>>>0){h=f}else{break}}}Yd(b,g,1,c[a+8>>2]|0)|0;i=d;return a+12|0}function $q(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;j=i;b=c[a+4>>2]|0;d=c[b>>2]|0;h=c[a+8>>2]|0;k=c[h>>2]|0;e=d+12|0;g=c[e>>2]|0;f=c[c[a+12>>2]>>2]|0;o=c[(c[k+8>>2]|0)+16>>2]&255;l=k+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=k+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}if((d|0)!=(k|0)){o=c[d+8>>2]|0;jc[c[(c[o>>2]|0)+52>>2]&63](o,h,b)|0}if(!((f|0)>-1&(f|0)<(n|0))){o=a+20|0;i=j;return o|0}o=(c[d>>2]|0)+(ba(c[(c[e>>2]|0)+12>>2]|0,f)|0)|0;jc[c[(c[g>>2]|0)+52>>2]&63](g,c[a+16>>2]|0,o)|0;o=a+20|0;i=j;return o|0}function ar(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;j=c[a+4>>2]|0;d=c[j>>2]|0;h=c[a+8>>2]|0;g=c[h>>2]|0;e=c[c[a+12>>2]>>2]|0;f=c[c[a+16>>2]>>2]|0;if((d|0)==(f|0)){Ia(30424)|0;n=c[1102]|0;c[n+20>>2]=0;c[n+16>>2]=0;n=4392;i=b;return n|0}if((d|0)!=(g|0)){n=c[d+8>>2]|0;jc[c[(c[n>>2]|0)+52>>2]&63](n,h,j)|0}a:do{if((e|0)>-1){j=c[(c[d+8>>2]|0)+16>>2]&255;h=d+(j<<2)+16|0;j=(j|0)==0;if(j){m=1}else{m=1;l=d+16|0;while(1){k=l+4|0;m=ba(c[l>>2]|0,m)|0;if(k>>>0<h>>>0){l=k}else{break}}}if((e|0)<(m|0)){n=c[(c[f+8>>2]|0)+16>>2]&255;m=f+(n<<2)+16|0;if((n|0)==0){k=1}else{k=1;n=f+16|0;while(1){l=n+4|0;k=ba(c[n>>2]|0,k)|0;if(l>>>0<m>>>0){n=l}else{break}}}if(j){l=1}else{l=1;m=d+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<h>>>0){m=j}else{break}}}h=l-e|0;g=c[g+12>>2]|0;f=c[f>>2]|0;j=(c[d>>2]|0)+(ba(c[(c[d+12>>2]|0)+12>>2]|0,e)|0)|0;d=c[g+12>>2]|0;h=ba(d,(k|0)<(h|0)?k:h)|0;if((c[g+16>>2]&2097152|0)!=0){Xt(j|0,f|0,h|0)|0;break}e=f+h|0;if((h|0)>0){while(1){if((jc[c[(c[g>>2]|0)+52>>2]&63](g,f,j)|0)!=0){break a}f=f+d|0;if(!(f>>>0<e>>>0)){break}else{j=j+d|0}}}}}}while(0);n=a+20|0;i=b;return n|0}function br(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;d=c[c[a+4>>2]>>2]|0;e=c[c[a+8>>2]>>2]|0;f=c[a+12>>2]|0;if((f|0)!=0){f=c[f>>2]|0;f=(f|0)>0?f:0;if(!((d|0)!=(e|0)|(f|0)==0)){Ia(30472)|0;o=c[1102]|0;c[o+20>>2]=0;c[o+16>>2]=0;o=4392;i=b;return o|0}}else{f=0}h=e+8|0;o=c[(c[h>>2]|0)+16>>2]&255;j=e+(o<<2)+16|0;if((o|0)==0){l=1}else{l=1;k=e+16|0;while(1){g=k+4|0;l=ba(c[k>>2]|0,l)|0;if(g>>>0<j>>>0){k=g}else{break}}}g=l-f|0;g=(g|0)>0?g:0;j=c[a+16>>2]|0;if((j|0)==0){j=g}else{j=c[j>>2]|0}j=(j|0)>0?j:0;g=(j|0)<(g|0)?j:g;j=d+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;l=d+(o<<2)+16|0;if((o|0)==0){o=1}else{o=1;n=d+16|0;while(1){m=n+4|0;o=ba(c[n>>2]|0,o)|0;if(m>>>0<l>>>0){n=m}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(g|0)>(0-k|0)|(o|0)==(g|0)):0)?Wd(d,ba(c[(c[d+12>>2]|0)+12>>2]|0,g)|0,o,g,1)|0:0){c[d+16>>2]=g}o=c[(c[h>>2]|0)+16>>2]&255;j=e+(o<<2)+16|0;if((o|0)==0){l=1}else{l=1;k=e+16|0;while(1){h=k+4|0;l=ba(c[k>>2]|0,l)|0;if(h>>>0<j>>>0){k=h}else{break}}}a:do{if(!((f|0)>=(l|0)|(d|0)==(e|0))){h=c[d+12>>2]|0;j=c[e>>2]|0;k=ba(c[(c[e+12>>2]|0)+12>>2]|0,f)|0;e=j+k|0;f=c[d>>2]|0;d=c[h+12>>2]|0;l=ba(d,g)|0;if((c[h+16>>2]&2097152|0)!=0){Xt(f|0,e|0,l|0)|0;break}g=j+(l+k)|0;if((l|0)>0){while(1){if((jc[c[(c[h>>2]|0)+52>>2]&63](h,e,f)|0)!=0){break a}e=e+d|0;if(!(e>>>0<g>>>0)){break}else{f=f+d|0}}}}}while(0);o=a+20|0;i=b;return o|0}function cr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;g=i;e=c[a+4>>2]|0;b=c[e>>2]|0;d=c[a+8>>2]|0;f=c[d>>2]|0;l=c[(c[f+8>>2]|0)+16>>2]&255;h=f+(l<<2)+16|0;if((l|0)==0){k=1}else{k=1;l=f+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}h=c[a+12>>2]|0;if((h|0)==0){h=k}else{h=c[h>>2]|0}if((b|0)!=(f|0)){l=c[b+8>>2]|0;jc[c[(c[l>>2]|0)+52>>2]&63](l,d,e)|0}if((h|0)<0|(h|0)>(k|0)){l=a+20|0;i=g;return l|0}Yd(b,h,1,c[a+16>>2]|0)|0;l=a+20|0;i=g;return l|0}function dr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;k=c[a+4>>2]|0;d=c[k>>2]|0;l=c[a+8>>2]|0;e=c[l>>2]|0;r=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(r<<2)+16|0;if((r|0)==0){f=1}else{f=1;j=e+16|0;while(1){h=j+4|0;f=ba(c[j>>2]|0,f)|0;if(h>>>0<g>>>0){j=h}else{break}}}g=c[a+12>>2]|0;if((g|0)==0){g=f}else{g=c[g>>2]|0}j=c[c[a+16>>2]>>2]|0;r=c[(c[j+8>>2]|0)+16>>2]&255;n=j+(r<<2)+16|0;if((r|0)==0){h=1}else{h=1;o=j+16|0;while(1){m=o+4|0;h=ba(c[o>>2]|0,h)|0;if(m>>>0<n>>>0){o=m}else{break}}}if((d|0)==(j|0)){Ia(30512)|0;r=c[1102]|0;c[r+20>>2]=0;c[r+16>>2]=0;r=4392;i=b;return r|0}m=(d|0)==(e|0);a:do{if((g|0)<0|(g|0)>(f|0)){if(!m){r=c[d+8>>2]|0;jc[c[(c[r>>2]|0)+52>>2]&63](r,l,k)|0}}else{if(m){Yd(d,g,h,c[j>>2]|0)|0;break}k=h+f|0;l=d+8|0;m=c[l>>2]|0;r=c[m+16>>2]&255;n=d+(r<<2)+16|0;if((r|0)==0){p=1}else{p=1;q=d+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(nc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(k|0)>(0-m|0)|(p|0)==(k|0)):0)?Wd(d,ba(c[(c[d+12>>2]|0)+12>>2]|0,k)|0,p,k,1)|0:0){c[d+16>>2]=k}l=d+12|0;n=c[l>>2]|0;p=c[e>>2]|0;k=e+12|0;r=c[d>>2]|0;o=c[n+12>>2]|0;q=ba(o,g)|0;b:do{if((c[n+16>>2]&2097152|0)==0){m=p+q|0;if((q|0)>0){q=r;while(1){if((jc[c[(c[n>>2]|0)+52>>2]&63](n,p,q)|0)!=0){break b}p=p+o|0;if(!(p>>>0<m>>>0)){break}else{q=q+o|0}}}}else{Xt(r|0,p|0,q|0)|0}}while(0);m=c[l>>2]|0;o=c[j>>2]|0;j=c[m+12>>2]|0;p=(c[d>>2]|0)+(ba(j,g)|0)|0;q=ba(j,h)|0;c:do{if((c[m+16>>2]&2097152|0)==0){n=o+q|0;if((q|0)>0){while(1){if((jc[c[(c[m>>2]|0)+52>>2]&63](m,o,p)|0)!=0){break c}o=o+j|0;if(!(o>>>0<n>>>0)){break}else{p=p+j|0}}}}else{Xt(p|0,o|0,q|0)|0}}while(0);j=c[l>>2]|0;l=c[e>>2]|0;m=ba(c[(c[k>>2]|0)+12>>2]|0,g)|0;k=l+m|0;e=c[j+12>>2]|0;d=(c[d>>2]|0)+(ba(e,h+g|0)|0)|0;f=ba(e,f-g|0)|0;if((c[j+16>>2]&2097152|0)!=0){Xt(d|0,k|0,f|0)|0;break}g=l+(f+m)|0;if((f|0)>0){while(1){if((jc[c[(c[j>>2]|0)+52>>2]&63](j,k,d)|0)!=0){break a}k=k+e|0;if(!(k>>>0<g>>>0)){break}else{d=d+e|0}}}}}while(0);r=a+20|0;i=b;return r|0}function er(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;b=c[c[a+4>>2]>>2]|0;d=c[c[a+8>>2]>>2]|0;m=c[(c[d+8>>2]|0)+16>>2]&255;h=d+(m<<2)+16|0;if((m|0)==0){f=1}else{f=1;j=d+16|0;while(1){g=j+4|0;f=ba(c[j>>2]|0,f)|0;if(g>>>0<h>>>0){j=g}else{break}}}if((b|0)==(d|0)){Ia(30560)|0;m=c[1102]|0;c[m+20>>2]=0;c[m+16>>2]=0;m=4392;i=e;return m|0}g=b+8|0;h=c[g>>2]|0;m=c[h+16>>2]&255;j=b+(m<<2)+16|0;if((m|0)==0){l=1}else{l=1;m=b+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}h=c[(nc[c[(c[h>>2]|0)+36>>2]&1023](h)|0)>>2]|0;if((!((c[(c[g>>2]|0)+16>>2]&255|0)!=1|(h|0)>-1)?!((h|0)!=-2147483648&(f|0)>(0-h|0)|(l|0)==(f|0)):0)?Wd(b,ba(c[(c[b+12>>2]|0)+12>>2]|0,f)|0,l,f,1)|0:0){c[b+16>>2]=f}if((f|0)>0){j=b+12|0;g=d+12|0;h=f+ -1|0;k=0;do{n=c[j>>2]|0;l=(c[d>>2]|0)+(ba(c[(c[g>>2]|0)+12>>2]|0,k)|0)|0;m=(c[b>>2]|0)+(ba(c[n+12>>2]|0,h-k|0)|0)|0;jc[c[(c[n>>2]|0)+52>>2]&63](n,l,m)|0;k=k+1|0}while((k|0)!=(f|0))}n=a+12|0;i=e;return n|0}function fr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;d=c[c[a+4>>2]>>2]|0;e=c[c[a+8>>2]>>2]|0;g=c[c[a+12>>2]>>2]|0;if((d|0)==(e|0)){Ia(30600)|0;p=c[1102]|0;c[p+20>>2]=0;c[p+16>>2]=0;p=4392;i=b;return p|0}p=c[(c[e+8>>2]|0)+16>>2]&255;h=e+(p<<2)+16|0;if((p|0)==0){f=1}else{f=1;k=e+16|0;while(1){j=k+4|0;f=ba(c[k>>2]|0,f)|0;if(j>>>0<h>>>0){k=j}else{break}}}h=d+8|0;j=c[h>>2]|0;p=c[j+16>>2]&255;k=d+(p<<2)+16|0;if((p|0)==0){m=1}else{m=1;n=d+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<k>>>0){n=l}else{break}}}j=c[(nc[c[(c[j>>2]|0)+36>>2]&1023](j)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(j|0)>-1)?!((j|0)!=-2147483648&(f|0)>(0-j|0)|(m|0)==(f|0)):0)?Wd(d,ba(c[(c[d+12>>2]|0)+12>>2]|0,f)|0,m,f,1)|0:0){c[d+16>>2]=f}a:do{if((f|0)>0){g=(g|0)%(f|0)|0;g=((g|0)<0?f:0)+g|0;j=d+12|0;k=c[j>>2]|0;n=c[e>>2]|0;h=e+12|0;l=c[k+12>>2]|0;o=(c[d>>2]|0)+(ba(l,g)|0)|0;f=f-g|0;p=ba(l,f)|0;b:do{if((c[k+16>>2]&2097152|0)==0){m=n+p|0;if((p|0)>0){while(1){if((jc[c[(c[k>>2]|0)+52>>2]&63](k,n,o)|0)!=0){break b}n=n+l|0;if(!(n>>>0<m>>>0)){break}else{o=o+l|0}}}}else{Xt(o|0,n|0,p|0)|0}}while(0);j=c[j>>2]|0;e=c[e>>2]|0;k=ba(c[(c[h>>2]|0)+12>>2]|0,f)|0;f=e+k|0;h=c[d>>2]|0;d=c[j+12>>2]|0;g=ba(d,g)|0;if((c[j+16>>2]&2097152|0)!=0){Xt(h|0,f|0,g|0)|0;break}e=e+(g+k)|0;if((g|0)>0){while(1){if((jc[c[(c[j>>2]|0)+52>>2]&63](j,f,h)|0)!=0){break a}f=f+d|0;if(!(f>>>0<e>>>0)){break}else{h=h+d|0}}}}}while(0);p=a+16|0;i=b;return p|0}function gr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;f=c[c[c[a+4>>2]>>2]>>2]|0;b=c[c[f+12>>2]>>2]|0;if((b|0)==0){j=a+8|0;i=d;return j|0}e=b+36|0;if((c[e>>2]|0)<1){j=a+8|0;i=d;return j|0}h=c[f+4>>2]|0;f=c[h+12>>2]|0;h=c[h>>2]|0;j=nc[c[(c[f>>2]|0)+16>>2]&1023](f)|0;if((j|0)>0){g=0;do{l=rc[c[(c[f>>2]|0)+24>>2]&63](f,g)|0;k=c[l>>2]|0;m=c[k+48>>2]|0;k=h+(nc[c[k+40>>2]&1023](l)|0)|0;jc[m&63](l,k,0)|0;g=g+1|0}while((g|0)!=(j|0))}m=(c[e>>2]|0)+ -1|0;c[e>>2]=m;if((m|0)!=0){m=a+8|0;i=d;return m|0}e=c[1102]|0;f=e+4|0;if((c[f>>2]|0)==0){c[f>>2]=b;c[e+8>>2]=b;c[b+4>>2]=0;m=a+8|0;i=d;return m|0}else{m=e+8|0;c[(c[m>>2]|0)+4>>2]=b;c[m>>2]=b;m=a+8|0;i=d;return m|0}return 0}function hr(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;a=jc[c[(c[b>>2]|0)+48>>2]&63](b,d,e)|0;i=f;return a|0}function ir(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;a=jc[c[(c[b>>2]|0)+52>>2]&63](b,d,e)|0;i=f;return a|0}function jr(a,b,d){a=a|0;b=b|0;d=d|0;c[d>>2]=0;return 0}function kr(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;a=jc[c[(c[b>>2]|0)+48>>2]&63](b,d,e)|0;i=f;return a|0}function lr(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;a=i;jc[c[(c[b>>2]|0)+52>>2]&63](b,d,e)|0;e=c[c[e>>2]>>2]|0;d=c[e+12>>2]|0;b=c[d>>2]|0;d=c[d+4>>2]|0;if(!(b>>>0<d>>>0)){i=a;return 0}do{c[b+8>>2]=e;c[b+4>>2]=0;c[b>>2]=0;c[b+20>>2]=0;c[b+36>>2]=c[b+32>>2];b=b+40|0}while(b>>>0<d>>>0);i=a;return 0}function mr(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;a=i;j=c[c[d>>2]>>2]|0;h=c[c[j+12>>2]>>2]|0;if((h|0)!=0){m=c[c[j>>2]>>2]|0;k=c[h>>2]|0;if((k|0)!=0){n=m+52|0;l=(c[n>>2]|0)+ -1|0;c[n>>2]=l;n=m+44|0;c[n>>2]=(c[n>>2]|0)+ -1;m=m+56|0;if(l>>>0>(c[m>>2]|0)>>>0){c[m>>2]=l}xt(k)}if((c[h+16>>2]|0)==0?(g=c[j+4>>2]|0,f=c[g+12>>2]|0,g=c[g>>2]|0,e=nc[c[(c[f>>2]|0)+16>>2]&1023](f)|0,(e|0)>0):0){j=0;do{k=rc[c[(c[f>>2]|0)+24>>2]&63](f,j)|0;h=c[k+16>>2]|0;if((h&2097152|0)==0?(h&1342177280|0)==268435456|(h&1610612736|0)==536870912:0){n=c[k>>2]|0;m=c[n+56>>2]|0;n=g+(nc[c[n+40>>2]&1023](k)|0)|0;rc[m&63](k,n)|0}j=j+1|0}while((j|0)!=(e|0))}}n=rc[c[(c[b>>2]|0)+56>>2]&63](b,d)|0;i=a;return n|0}function nr(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[a+4>>2]|0;e=d+36|0;f=(c[e>>2]|0)+ -1|0;c[e>>2]=f;do{if((f|0)==0){e=c[1102]|0;f=e+4|0;if((c[f>>2]|0)==0){c[f>>2]=d;c[e+8>>2]=d;c[d+4>>2]=0;break}else{f=e+8|0;c[(c[f>>2]|0)+4>>2]=d;c[f>>2]=d;break}}}while(0);i=b;return a+8|0}function or(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=c[a+4>>2]|0;if((c[d+36>>2]|0)==(c[d+32>>2]|0)){g=a+8|0;i=b;return g|0}g=c[(c[1102]|0)+20>>2]|0;e=d+12|0;c[g+4>>2]=c[e>>2];c[e>>2]=g;e=c[1102]|0;d=e+20|0;c[(c[d>>2]|0)+20>>2]=a+8;g=e+4|0;a=c[g>>2]|0;f=e+8|0;do{if((c[f>>2]|0)==(a|0)){if((a|0)!=0){c[g>>2]=0;c[f>>2]=0;break}c[d>>2]=0;c[e+16>>2]=0;g=4392;i=b;return g|0}else{f=a+4|0;c[g>>2]=c[f>>2];c[f>>2]=0}}while(0);c[d>>2]=a;g=c[a+20>>2]|0;i=b;return g|0}function pr(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+8>>2]|0;e=(c[d>>2]|0)+1|0;if((e|0)<(c[c[a+12>>2]>>2]|0)){c[d>>2]=e;e=c[a+4>>2]|0;i=b;return e|0}else{e=a+16|0;i=b;return e|0}return 0}function qr(a){a=a|0;return c[a+4>>2]|0}function rr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=c[a+4>>2]|0;e=d+36|0;g=c[e>>2]|0;f=c[(c[1102]|0)+20>>2]|0;if((g|0)<=0){d=d+12|0;e=c[d>>2]|0;if((e|0)==0){c[d>>2]=f}else{do{d=e+4|0;e=c[d>>2]|0}while((e|0)!=0);c[d>>2]=f}e=c[1102]|0;d=e+20|0;c[(c[d>>2]|0)+20>>2]=a;a=e+4|0;f=c[a>>2]|0;g=e+8|0;do{if((c[g>>2]|0)==(f|0)){if((f|0)!=0){c[a>>2]=0;c[g>>2]=0;break}c[d>>2]=0;c[e+16>>2]=0;h=4392;i=b;return h|0}else{h=f+4|0;c[a>>2]=c[h>>2];c[h>>2]=0}}while(0);c[d>>2]=f;h=c[f+20>>2]|0;i=b;return h|0}c[d+16>>2]=f;f=a+16|0;h=c[f>>2]|0;if((h|0)!=(c[1100]|0)){do{f=nc[h&1023](f)|0;h=c[f>>2]|0}while((h|0)!=(c[1100]|0));g=c[e>>2]|0}h=g+ -1|0;c[e>>2]=h;do{if((h|0)==0){e=c[1102]|0;f=e+4|0;if((c[f>>2]|0)==0){c[f>>2]=d;c[e+8>>2]=d;c[d+4>>2]=0;break}else{h=e+8|0;c[(c[h>>2]|0)+4>>2]=d;c[h>>2]=d;break}}}while(0);d=c[1102]|0;e=d+20|0;c[(c[e>>2]|0)+20>>2]=a;a=d+4|0;g=c[a>>2]|0;f=d+8|0;do{if((c[f>>2]|0)==(g|0)){if((g|0)!=0){c[a>>2]=0;c[f>>2]=0;break}c[e>>2]=0;c[d+16>>2]=0;h=4392;i=b;return h|0}else{h=g+4|0;c[a>>2]=c[h>>2];c[h>>2]=0}}while(0);c[e>>2]=g;h=c[g+20>>2]|0;i=b;return h|0}function sr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;f=us()|0;e=F;j=vs((c[c[a+4>>2]>>2]|0)*1e3|0,0)|0;e=Ut(j|0,F|0,f|0,e|0)|0;f=F;j=c[1102]|0;g=j+20|0;d=c[g>>2]|0;c[d+20>>2]=a+8;a=j+4|0;k=c[a>>2]|0;l=j+8|0;do{if((c[l>>2]|0)==(k|0)){if((k|0)==0){c[g>>2]=0;c[j+16>>2]=0;g=4392;break}else{c[a>>2]=0;c[l>>2]=0;h=6;break}}else{h=k+4|0;c[a>>2]=c[h>>2];c[h>>2]=0;h=6}}while(0);if((h|0)==6){c[g>>2]=k;g=c[k+20>>2]|0}h=d+24|0;c[h>>2]=e;c[h+4>>2]=f;h=j+12|0;j=c[h>>2]|0;if((j|0)==0){c[d+4>>2]=0;c[h>>2]=d;i=b;return g|0}while(1){l=j+24|0;k=c[l+4>>2]|0;if(!((k|0)>(f|0)|(k|0)==(f|0)&(c[l>>2]|0)>>>0>e>>>0)){break}h=j+4|0;j=c[h>>2]|0;if((j|0)==0){j=0;break}}c[d+4>>2]=j;c[h>>2]=d;i=b;return g|0}function tr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;j=c[1102]|0;e=c[a+4>>2]|0;e=vs(c[e>>2]|0,c[e+4>>2]|0)|0;f=F;g=j+20|0;d=c[g>>2]|0;c[d+20>>2]=a+8;a=j+4|0;k=c[a>>2]|0;l=j+8|0;do{if((c[l>>2]|0)==(k|0)){if((k|0)==0){c[g>>2]=0;c[j+16>>2]=0;g=4392;break}else{c[a>>2]=0;c[l>>2]=0;h=6;break}}else{h=k+4|0;c[a>>2]=c[h>>2];c[h>>2]=0;h=6}}while(0);if((h|0)==6){c[g>>2]=k;g=c[k+20>>2]|0}h=d+24|0;c[h>>2]=e;c[h+4>>2]=f;h=j+12|0;j=c[h>>2]|0;if((j|0)==0){c[d+4>>2]=0;c[h>>2]=d;i=b;return g|0}while(1){l=j+24|0;k=c[l+4>>2]|0;if(!((k|0)>(f|0)|(k|0)==(f|0)&(c[l>>2]|0)>>>0>e>>>0)){break}h=j+4|0;j=c[h>>2]|0;if((j|0)==0){j=0;break}}c[d+4>>2]=j;c[h>>2]=d;i=b;return g|0}function ur(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;f=us()|0;e=F;j=vs(c[c[a+4>>2]>>2]|0,0)|0;e=Ut(j|0,F|0,f|0,e|0)|0;f=F;j=c[1102]|0;g=j+20|0;d=c[g>>2]|0;c[d+20>>2]=a+8;a=j+4|0;k=c[a>>2]|0;l=j+8|0;do{if((c[l>>2]|0)==(k|0)){if((k|0)==0){c[g>>2]=0;c[j+16>>2]=0;g=4392;break}else{c[a>>2]=0;c[l>>2]=0;h=6;break}}else{h=k+4|0;c[a>>2]=c[h>>2];c[h>>2]=0;h=6}}while(0);if((h|0)==6){c[g>>2]=k;g=c[k+20>>2]|0}h=d+24|0;c[h>>2]=e;c[h+4>>2]=f;h=j+12|0;j=c[h>>2]|0;if((j|0)==0){c[d+4>>2]=0;c[h>>2]=d;i=b;return g|0}while(1){l=j+24|0;k=c[l+4>>2]|0;if(!((k|0)>(f|0)|(k|0)==(f|0)&(c[l>>2]|0)>>>0>e>>>0)){break}h=j+4|0;j=c[h>>2]|0;if((j|0)==0){j=0;break}}c[d+4>>2]=j;c[h>>2]=d;i=b;return g|0}function vr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;a=i;b=c[1102]|0;d=b+20|0;e=c[d>>2]|0;j=e+16|0;f=c[j>>2]|0;do{if((f|0)!=0){g=f+20|0;h=c[g>>2]|0;k=c[h+12>>2]|0;l=c[k>>2]|0;if((l|0)!=(c[1100]|0)){do{k=nc[l&1023](k)|0;l=c[k>>2]|0}while((l|0)!=(c[1100]|0))}c[g>>2]=c[h+8>>2];c[j>>2]=0;g=b+4|0;if((c[g>>2]|0)==0){c[g>>2]=f;c[b+8>>2]=f;c[f+4>>2]=0;break}else{l=b+8|0;c[(c[l>>2]|0)+4>>2]=f;c[l>>2]=f;break}}}while(0);g=e+12|0;k=c[g>>2]|0;c[g>>2]=0;g=b+4|0;f=b+8|0;if((k|0)!=0){while(1){j=k+4|0;h=c[j>>2]|0;c[j>>2]=0;if((c[g>>2]|0)==0){c[g>>2]=k;c[f>>2]=k;c[j>>2]=0}else{c[(c[f>>2]|0)+4>>2]=k;c[f>>2]=k}if((h|0)==0){break}else{k=h}}c[b+16>>2]=0}c[e+36>>2]=c[e+32>>2];c[(c[d>>2]|0)+20>>2]=c[e>>2];e=c[g>>2]|0;do{if((c[f>>2]|0)==(e|0)){if((e|0)!=0){c[g>>2]=0;c[f>>2]=0;break}c[d>>2]=0;c[b+16>>2]=0;l=4392;i=a;return l|0}else{l=e+4|0;c[g>>2]=c[l>>2];c[l>>2]=0}}while(0);c[d>>2]=e;l=c[e+20>>2]|0;i=a;return l|0}function wr(b){b=b|0;var d=0,e=0;d=i;e=c[b+4>>2]|0;if((e|0)!=0?(a[e]|0)==0:0){e=b+8|0;i=d;return e|0}e=c[1102]|0;c[e+20>>2]=0;c[e+16>>2]=0;e=4392;i=d;return e|0}function xr(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=c[b+4>>2]|0;d=c[b+8>>2]|0;g=c[b+12>>2]|0;if((g|0)==0){h=1}else{h=(a[g]|0)!=0}j=c[c[b+16>>2]>>2]|0;g=j+8|0;k=c[g>>2]|0;o=c[k+16>>2]&255;l=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=j+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[g>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)>0|(n|0)==0):0)?Wd(j,0,n,0,1)|0:0){c[j+16>>2]=0}Oe(f,d,j,h)|0;i=e;return b+20|0}function yr(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=i;f=c[c[b+4>>2]>>2]|0;e=c[b+8>>2]|0;if((e|0)==0){g=1}else{g=(a[e]|0)!=0}k=c[b+12>>2]|0;l=c[b+16>>2]|0;e=c[b+20>>2]|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}m=c[b+24>>2]|0;j=Pe(f,g,0,l,k,m)|0;p=c[(c[f+8>>2]|0)+16>>2]&255;h=f+(p<<2)+16|0;if((p|0)==0){n=1}else{n=1;o=f+16|0;while(1){g=o+4|0;n=ba(c[o>>2]|0,n)|0;if(g>>>0<h>>>0){o=g}else{break}}}h=n-j|0;g=(j|0)==-1;if(g){jc[c[(c[k>>2]|0)+52>>2]&63](k,l,m)|0}if((e|0)!=0){k=e+8|0;l=c[k>>2]|0;p=c[l+16>>2]&255;n=e+(p<<2)+16|0;if((p|0)==0){p=1}else{p=1;o=e+16|0;while(1){m=o+4|0;p=ba(c[o>>2]|0,p)|0;if(m>>>0<n>>>0){o=m}else{break}}}l=c[(nc[c[(c[l>>2]|0)+36>>2]&1023](l)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(l|0)>-1)?!((l|0)>0|(p|0)==0):0)?Wd(e,0,p,0,1)|0:0){c[e+16>>2]=0}if(!g){f=(c[f>>2]|0)+(ba(c[(c[f+12>>2]|0)+12>>2]|0,j)|0)|0;p=c[(c[k>>2]|0)+16>>2]&255;j=e+(p<<2)+16|0;if((p|0)==0){l=1}else{l=1;m=e+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Yd(e,l,h,f)|0}}e=c[b+28>>2]|0;if((e|0)==0){p=b+32|0;i=d;return p|0}a[e]=g&1;p=b+32|0;i=d;return p|0}function zr(d){d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+16|0;f=e;g=d+16|0;h=c[c[g>>2]>>2]|0;j=h+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;m=h+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=h+16|0;while(1){l=o+4|0;n=ba(c[o>>2]|0,n)|0;if(l>>>0<m>>>0){o=l}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)>0|(n|0)==0):0)?Wd(h,0,n,0,1)|0:0){c[h+16>>2]=0}h=c[d+12>>2]|0;if((h|0)==0){h=0}else{h=b[h>>1]|0}c[f>>2]=c[c[g>>2]>>2];a[f+4|0]=0;c[f+8>>2]=h;Je(f,c[d+4>>2]|0,c[d+8>>2]|0);i=e;return d+20|0}function Ar(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+48|0;k=d+28|0;f=d;e=c[b+8>>2]|0;h=c[c[b+4>>2]>>2]|0;g=c[h>>2]|0;h=c[h+4>>2]|0;j=c[c[b+16>>2]>>2]|0;a[k+16|0]=0;c[k>>2]=j;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;j=c[c[1102]>>2]|0;c[f+24>>2]=k;c[f>>2]=j;c[f+4>>2]=g;c[f+8>>2]=h;c[f+12>>2]=g;c[f+16>>2]=1;a[f+20|0]=1;oe(f,e,c[b+12>>2]|0,c[e+16>>2]&255);i=d;return b+20|0}function Br(d){d=d|0;var e=0,f=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0;e=i;i=i+80|0;m=e+64|0;s=e+44|0;r=e+16|0;o=e;t=e+8|0;j=c[c[d+4>>2]>>2]|0;f=c[d+8>>2]|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}q=c[d+12>>2]|0;p=c[d+20>>2]|0;l=c[d+24>>2]|0;f=(f|0)<0?0:f;v=(c[j>>2]|0)+(ba(c[(c[j+12>>2]|0)+12>>2]|0,f)|0)|0;w=c[j+4>>2]|0;n=m+4|0;c[m>>2]=v;c[n>>2]=w;j=w-v|0;if((l|0)==0){r=le(m,0)|0;l=(c[n>>2]|0)-(c[m>>2]|0)|0}else{a[s+16|0]=0;c[s>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;c[s+12>>2]=0;y=c[1102]|0;z=c[y>>2]|0;m=r+8|0;n=r+4|0;u=r+24|0;c[u>>2]=s;c[r>>2]=z;c[n>>2]=v;c[m>>2]=w;c[r+12>>2]=v;c[r+16>>2]=1;a[r+20|0]=0;c[t>>2]=3208;c[t+4>>2]=3213;s=Zc(c[y>>2]|0,t)|0;if((s|0)==0){t=0}else{t=c[s>>2]|0}s=p+16|0;oe(r,t,o,c[s>>2]&255);r=c[u>>2]|0;r=(c[r+8>>2]|0)==(0-(c[r+4>>2]|0)|0);do{if(r){q=(c[s>>2]|0)>>>16&31;p=c[p+12>>2]|0;s=o;o=c[s>>2]|0;s=c[s+4>>2]|0;if((q|0)==12){x=+(o>>>0)+4294967296.0*+(s|0);if((p|0)==8){h[k>>3]=x;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else if((p|0)==4){g[l>>2]=x;break}else{break}}if((q+ -9|0)>>>0<2){if((p|0)==8){z=l;c[z>>2]=o;c[z+4>>2]=s;break}else if((p|0)==4){c[l>>2]=o;break}else if((p|0)==2){b[l>>1]=o;break}else if((p|0)==1){a[l]=o;break}else{break}}}else{if((q|0)!=0){jc[c[(c[p>>2]|0)+52>>2]&63](p,q,l)|0;break}o=(c[s>>2]|0)>>>16&31;p=c[p+12>>2]|0;if((o|0)==12){if((p|0)==8){h[k>>3]=0.0;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else if((p|0)==4){g[l>>2]=0.0;break}else{break}}if((o+ -9|0)>>>0<2){if((p|0)==8){z=l;c[z>>2]=0;c[z+4>>2]=0;break}else if((p|0)==4){c[l>>2]=0;break}else if((p|0)==2){b[l>>1]=0;break}else if((p|0)==1){a[l]=0;break}else{break}}}}while(0);l=(c[m>>2]|0)-(c[n>>2]|0)|0}m=c[d+16>>2]|0;if((m|0)==0){z=d+28|0;i=e;return z|0}c[m>>2]=(r?j-l|0:0)+f;z=d+28|0;i=e;return z|0}function Cr(d){d=d|0;var e=0,f=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0.0;e=i;i=i+336|0;p=e+68|0;q=e+64|0;s=e+44|0;o=e+16|0;m=e;t=e+8|0;j=c[c[d+4>>2]>>2]|0;f=c[d+8>>2]|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}r=c[d+12>>2]|0;n=c[d+20>>2]|0;l=c[d+24>>2]|0;f=(f|0)<0?0:f;w=c[j>>2]|0;x=ba(c[(c[j+12>>2]|0)+12>>2]|0,f)|0;u=w+x|0;v=c[j+4>>2]|0;y=v;j=y-u|0;if((l|0)==0){l=(j|0)<255?j:255;o=p+256|0;c[o>>2]=p+l;Wt(p|0,u|0,l|0)|0;a[c[o>>2]|0]=0;c[q>>2]=0;+Ot(p,q);o=c[q>>2]|0;l=y-(w+(x-p+o))|0;o=(p|0)!=(o|0)}else{a[s+16|0]=0;c[s>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;c[s+12>>2]=0;y=c[1102]|0;x=c[y>>2]|0;q=o+8|0;p=o+4|0;w=o+24|0;c[w>>2]=s;c[o>>2]=x;c[p>>2]=u;c[q>>2]=v;c[o+12>>2]=u;c[o+16>>2]=1;a[o+20|0]=0;c[t>>2]=3656;c[t+4>>2]=3662;s=Zc(c[y>>2]|0,t)|0;if((s|0)==0){t=0}else{t=c[s>>2]|0}s=n+16|0;oe(o,t,m,c[s>>2]&255);o=c[w>>2]|0;o=(c[o+8>>2]|0)==(0-(c[o+4>>2]|0)|0);do{if(o){r=(c[s>>2]|0)>>>16&31;n=c[n+12>>2]|0;z=+h[m>>3];if((r|0)==12){if((n|0)==4){g[l>>2]=z;break}else if((n|0)==8){h[k>>3]=z;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else{break}}m=~~z>>>0;s=+Q(z)>=1.0?z>0.0?(ga(+P(z/4294967296.0),4294967295.0)|0)>>>0:~~+aa((z- +(~~z>>>0))/4294967296.0)>>>0:0;if((r+ -9|0)>>>0<2){if((n|0)==8){y=l;c[y>>2]=m;c[y+4>>2]=s;break}else if((n|0)==4){c[l>>2]=m;break}else if((n|0)==2){b[l>>1]=m;break}else if((n|0)==1){a[l]=m;break}else{break}}}else{if((r|0)!=0){jc[c[(c[n>>2]|0)+52>>2]&63](n,r,l)|0;break}m=(c[s>>2]|0)>>>16&31;n=c[n+12>>2]|0;if((m|0)==12){if((n|0)==4){g[l>>2]=0.0;break}else if((n|0)==8){h[k>>3]=0.0;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else{break}}if((m+ -9|0)>>>0<2){if((n|0)==8){y=l;c[y>>2]=0;c[y+4>>2]=0;break}else if((n|0)==4){c[l>>2]=0;break}else if((n|0)==2){b[l>>1]=0;break}else if((n|0)==1){a[l]=0;break}else{break}}}}while(0);l=(c[q>>2]|0)-(c[p>>2]|0)|0}m=c[d+16>>2]|0;if((m|0)==0){y=d+28|0;i=e;return y|0}c[m>>2]=(o?j-l|0:0)+f;y=d+28|0;i=e;return y|0}function Dr(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+16|0;d=e+12|0;g=e;f=b+12|0;j=c[c[f>>2]>>2]|0;h=j+8|0;k=c[h>>2]|0;o=c[k+16>>2]&255;l=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=j+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)>0|(n|0)==0):0)?Wd(j,0,n,0,1)|0:0){c[j+16>>2]=0}h=c[c[f>>2]>>2]|0;o=c[(c[h+8>>2]|0)+16>>2]&255;k=h+(o<<2)+16|0;if((o|0)==0){l=1}else{l=1;m=h+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Yd(h,l,3,29016)|0;c[g>>2]=c[c[f>>2]>>2];a[g+4|0]=0;c[g+8>>2]=0;Je(g,c[b+4>>2]|0,c[b+8>>2]|0);f=c[c[f>>2]>>2]|0;a[d]=41;o=c[(c[f+8>>2]|0)+16>>2]&255;g=f+(o<<2)+16|0;if((o|0)==0){o=1;Yd(f,o,1,d)|0;o=b+16|0;i=e;return o|0}j=1;k=f+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}Yd(f,j,1,d)|0;o=b+16|0;i=e;return o|0}function Er(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;b=i;a=c[c[a+4>>2]>>2]|0;g=c[(c[a+8>>2]|0)+16>>2]&255;d=a+(g<<2)+16|0;if((g|0)==0){f=1}else{f=1;g=a+16|0;while(1){e=g+4|0;f=ba(c[g>>2]|0,f)|0;if(e>>>0<d>>>0){g=e}else{break}}}Yd(a,f,7,29248)|0;i=b;return}function Fr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+112|0;f=e;g=e+12|0;b=b+4|0;h=c[c[b>>2]>>2]|0;n=c[(c[h+8>>2]|0)+16>>2]&255;j=h+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=h+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Yd(h,l,3,29240)|0;n=nc[c[(c[d>>2]|0)+60>>2]&1023](d)|0;h=c[b>>2]|0;c[f>>2]=c[h+8>>2];j=f+4|0;c[j>>2]=n;c[j+4>>2]=((n|0)<0)<<31>>31;j=Bb(g|0,100,2488,f|0)|0;h=c[h>>2]|0;n=c[(c[h+8>>2]|0)+16>>2]&255;k=h+(n<<2)+16|0;if((n|0)==0){n=1}else{n=1;m=h+16|0;while(1){l=m+4|0;n=ba(c[m>>2]|0,n)|0;if(l>>>0<k>>>0){m=l}else{break}}}Yd(h,n,j,g)|0;g=c[c[b>>2]>>2]|0;a[f]=32;n=c[(c[g+8>>2]|0)+16>>2]&255;h=g+(n<<2)+16|0;if((n|0)==0){k=1}else{k=1;l=g+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}Yd(g,k,1,f)|0;switch((c[d+16>>2]|0)>>>16&31|0){case 7:{d=1624;break};case 15:{d=1648;break};case 12:{d=1544;break};case 9:{d=1560;break};case 13:{d=1616;break};case 6:{d=1536;break};case 10:{d=1568;break};default:{d=2480}}g=c[c[b>>2]>>2]|0;h=Tt(d|0)|0;n=c[(c[g+8>>2]|0)+16>>2]&255;j=g+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=g+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Yd(g,l,h,d)|0;b=c[c[b>>2]>>2]|0;a[f]=41;n=c[(c[b+8>>2]|0)+16>>2]&255;g=b+(n<<2)+16|0;if((n|0)==0){n=1;Yd(b,n,1,f)|0;i=e;return}h=1;j=b+16|0;while(1){d=j+4|0;h=ba(c[j>>2]|0,h)|0;if(d>>>0<g>>>0){j=d}else{break}}Yd(b,h,1,f)|0;i=e;return}function Gr(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,29232);i=c;return}function Hr(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,29224);i=c;return}function Ir(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,29216);i=c;return}function Jr(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,29208);i=c;return}function Kr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+112|0;h=e;f=e+12|0;g=b+4|0;j=c[c[g>>2]>>2]|0;o=c[(c[j+8>>2]|0)+16>>2]&255;l=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;m=j+16|0;while(1){k=m+4|0;n=ba(c[m>>2]|0,n)|0;if(k>>>0<l>>>0){m=k}else{break}}}Yd(j,n,2,29200)|0;j=rc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0;mc[c[(c[j>>2]|0)+8>>2]&63](j,b);b=nc[c[(c[d>>2]|0)+36>>2]&1023](d)|0;d=c[d+16>>2]&255;j=c[c[g>>2]>>2]|0;if((d|0)!=0){do{a[h]=32;o=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;m=j+16|0;while(1){l=m+4|0;n=ba(c[m>>2]|0,n)|0;if(l>>>0<k>>>0){m=l}else{break}}}Yd(j,n,1,h)|0;j=c[b>>2]|0;k=c[g>>2]|0;if((j|0)==-2147483648){j=c[k>>2]|0;a[h]=42;o=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;m=j+16|0;while(1){l=m+4|0;n=ba(c[m>>2]|0,n)|0;if(l>>>0<k>>>0){m=l}else{break}}}Yd(j,n,1,h)|0}else{b=b+4|0;c[h>>2]=c[k+8>>2];o=h+4|0;c[o>>2]=j;c[o+4>>2]=((j|0)<0)<<31>>31;j=Bb(f|0,100,2488,h|0)|0;k=c[k>>2]|0;o=c[(c[k+8>>2]|0)+16>>2]&255;m=k+(o<<2)+16|0;if((o|0)==0){o=1}else{o=1;n=k+16|0;while(1){l=n+4|0;o=ba(c[n>>2]|0,o)|0;if(l>>>0<m>>>0){n=l}else{break}}}Yd(k,o,j,f)|0}d=d+ -1|0;j=c[c[g>>2]>>2]|0}while((d|0)>0)}o=c[(c[j+8>>2]|0)+16>>2]&255;f=j+(o<<2)+16|0;if((o|0)==0){o=1;Yd(j,o,1,1384)|0;i=e;return}h=1;d=j+16|0;while(1){g=d+4|0;h=ba(c[d>>2]|0,h)|0;if(g>>>0<f>>>0){d=g}else{break}}Yd(j,h,1,1384)|0;i=e;return}



function Me(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;p=i;i=i+432|0;q=p;r=p+48|0;o=p+24|0;j=p+60|0;d=p+320|0;l=p+56|0;m=p+8|0;n=r+4|0;D=c[b>>2]|0;C=c[b+4>>2]|0;c[r>>2]=D;c[n>>2]=C;b=f+8|0;s=c[b>>2]|0;L=c[s+16>>2]&255;u=f+(L<<2)+16|0;if((L|0)==0){v=1}else{v=1;w=f+16|0;while(1){t=w+4|0;v=ba(c[w>>2]|0,v)|0;if(t>>>0<u>>>0){w=t}else{break}}}s=c[(nc[c[(c[s>>2]|0)+36>>2]&1023](s)|0)>>2]|0;if((!((c[(c[b>>2]|0)+16>>2]&255|0)!=1|(s|0)>-1)?!((s|0)>0|(v|0)==0):0)?Wd(f,0,v,0,1)|0:0){c[f+16>>2]=0}if(!(D>>>0<C>>>0)){i=p;return}y=f+16|0;s=o+20|0;A=o+16|0;x=o+7|0;z=j+256|0;v=j+256|0;w=m+4|0;u=m+8|0;t=o+8|0;B=o+1|0;E=C;C=0;do{G=D+1|0;c[r>>2]=G;F=a[D]|0;a:do{if(F<<24>>24==92){if(G>>>0<E>>>0){c[r>>2]=D+2;switch(a[G]|0){case 114:{a[q]=13;L=c[(c[b>>2]|0)+16>>2]&255;D=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=y;while(1){E=F+4|0;G=ba(c[F>>2]|0,G)|0;if(E>>>0<D>>>0){F=E}else{break}}}Yd(f,G,1,q)|0;break a};case 110:{a[q]=10;L=c[(c[b>>2]|0)+16>>2]&255;D=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=y;while(1){E=F+4|0;G=ba(c[F>>2]|0,G)|0;if(E>>>0<D>>>0){F=E}else{break}}}Yd(f,G,1,q)|0;break a};case 116:{a[q]=9;L=c[(c[b>>2]|0)+16>>2]&255;D=f+(L<<2)+16|0;if((L|0)==0){F=1}else{F=1;G=y;while(1){E=G+4|0;F=ba(c[G>>2]|0,F)|0;if(E>>>0<D>>>0){G=E}else{break}}}Yd(f,F,1,q)|0;break a};case 98:{a[q]=8;L=c[(c[b>>2]|0)+16>>2]&255;D=f+(L<<2)+16|0;if((L|0)==0){F=1}else{F=1;G=y;while(1){E=G+4|0;F=ba(c[G>>2]|0,F)|0;if(E>>>0<D>>>0){G=E}else{break}}}Yd(f,F,1,q)|0;break a};case 92:{a[q]=92;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){F=1}else{F=1;G=y;while(1){D=G+4|0;F=ba(c[G>>2]|0,F)|0;if(D>>>0<E>>>0){G=D}else{break}}}Yd(f,F,1,q)|0;break a};case 115:{a[q]=32;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=y;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Yd(f,G,1,q)|0;break a};case 102:{a[q]=12;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=y;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Yd(f,G,1,q)|0;break a};default:{break a}}}else{F=92;g=67}}else if(F<<24>>24==37){c[s>>2]=0;c[A>>2]=0;Le(r,o);switch(a[x]|0){case 65:case 97:case 69:case 101:case 70:case 102:case 71:case 103:{E=(c[A>>2]|0)+ -1|0;D=(c[s>>2]|0)-E|0;D=(D|0)<255?D:255;c[z>>2]=j+D;Wt(j|0,E|0,D|0)|0;a[c[z>>2]|0]=0;h[k>>3]=+h[c[e+(C<<3)+4>>2]>>3];c[q>>2]=c[k>>2];c[q+4>>2]=c[k+4>>2];D=Bb(d|0,100,j|0,q|0)|0;L=c[(c[b>>2]|0)+16>>2]&255;F=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;H=y;while(1){E=H+4|0;G=ba(c[H>>2]|0,G)|0;if(E>>>0<F>>>0){H=E}else{break}}}Yd(f,G,D,d)|0;C=C+1|0;break a};case 88:case 120:case 111:case 100:{E=(c[A>>2]|0)+ -1|0;D=(c[s>>2]|0)-E|0;D=(D|0)<255?D:255;c[v>>2]=j+D;Wt(j|0,E|0,D|0)|0;a[c[v>>2]|0]=0;c[q>>2]=c[c[e+(C<<3)+4>>2]>>2];D=Bb(d|0,100,j|0,q|0)|0;L=c[(c[b>>2]|0)+16>>2]&255;F=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;H=y;while(1){E=H+4|0;G=ba(c[H>>2]|0,G)|0;if(E>>>0<F>>>0){H=E}else{break}}}Yd(f,G,D,d)|0;C=C+1|0;break a};case 37:{a[q]=37;L=c[(c[b>>2]|0)+16>>2]&255;D=f+(L<<2)+16|0;if((L|0)==0){F=1}else{F=1;G=y;while(1){E=G+4|0;F=ba(c[G>>2]|0,F)|0;if(E>>>0<D>>>0){G=E}else{break}}}Yd(f,F,1,q)|0;break a};case 115:{Xg(l,2624);c[m>>2]=c[l>>2];a[w]=0;c[u>>2]=0;Je(m,c[e+(C<<3)>>2]|0,c[e+(C<<3)+4>>2]|0);D=c[t>>2]|0;E=c[l>>2]|0;G=c[(c[E+8>>2]|0)+16>>2]&255;F=E+(G<<2)+16|0;G=(G|0)==0;if(G){I=1}else{I=1;J=E+16|0;while(1){H=J+4|0;I=ba(c[J>>2]|0,I)|0;if(H>>>0<F>>>0){J=H}else{break}}}H=D-I|0;D=(a[B]|0)==0;if(!D){L=c[(c[b>>2]|0)+16>>2]&255;J=f+(L<<2)+16|0;if((L|0)==0){I=1}else{I=1;L=y;while(1){K=L+4|0;I=ba(c[L>>2]|0,I)|0;if(K>>>0<J>>>0){L=K}else{break}}}if(G){J=1}else{J=1;K=E+16|0;while(1){G=K+4|0;J=ba(c[K>>2]|0,J)|0;if(G>>>0<F>>>0){K=G}else{break}}}Yd(f,I,J,c[E>>2]|0)|0}if((H|0)>0){do{a[q]=32;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;I=y;while(1){F=I+4|0;G=ba(c[I>>2]|0,G)|0;if(F>>>0<E>>>0){I=F}else{break}}}Yd(f,G,1,q)|0;H=H+ -1|0}while((H|0)>0)}if(D){D=c[l>>2]|0;L=c[(c[b>>2]|0)+16>>2]&255;G=f+(L<<2)+16|0;if((L|0)==0){E=1}else{E=1;H=y;while(1){F=H+4|0;E=ba(c[H>>2]|0,E)|0;if(F>>>0<G>>>0){H=F}else{break}}}L=c[(c[D+8>>2]|0)+16>>2]&255;F=D+(L<<2)+16|0;if((L|0)==0){I=1}else{I=1;H=D+16|0;while(1){G=H+4|0;I=ba(c[H>>2]|0,I)|0;if(G>>>0<F>>>0){H=G}else{break}}}Yd(f,E,I,c[D>>2]|0)|0}C=C+1|0;D=c[l>>2]|0;if((D|0)==0){break a}L=c[D+8>>2]|0;rc[c[(c[L>>2]|0)+56>>2]&63](L,l)|0;break a};default:{break a}}}else{g=67}}while(0);if((g|0)==67){g=0;a[q]=F;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){F=1}else{F=1;G=y;while(1){D=G+4|0;F=ba(c[G>>2]|0,F)|0;if(D>>>0<E>>>0){G=D}else{break}}}Yd(f,F,1,q)|0}D=c[r>>2]|0;E=c[n>>2]|0}while(D>>>0<E>>>0);i=p;return}function Ne(a){a=a|0;var b=0;b=i;Ue(a,28704,61,28720,2);Ue(a,28768,62,28784,2);Ue(a,28832,63,28856,2);Ue(a,28920,64,28856,2);Ue(a,28952,65,28976,2);i=b;return}function Oe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+16|0;h=f;g=(c[a+16>>2]|0)>>>16&31;if((g|0)==3){g=c[b>>2]|0;if((g|0)==0){l=2;i=f;return l|0}b=rc[c[(c[a>>2]|0)+24>>2]&63](a,0)|0;a=g+8|0;if(e){l=c[(c[a>>2]|0)+16>>2]&255;e=g+(l<<2)+16|0;if((l|0)==0){l=1}else{l=1;k=g+16|0;while(1){j=k+4|0;l=ba(c[k>>2]|0,l)|0;if(j>>>0<e>>>0){k=j}else{break}}}c[h>>2]=l;l=c[(c[d+8>>2]|0)+16>>2]&255;j=d+(l<<2)+16|0;if((l|0)==0){k=1}else{k=1;l=d+16|0;while(1){e=l+4|0;k=ba(c[l>>2]|0,k)|0;if(e>>>0<j>>>0){l=e}else{break}}}Yd(d,k,4,h)|0}a=c[(c[a>>2]|0)+16>>2]&255;h=g+(a<<2)+16|0;if((c[b+16>>2]&2097152|0)==0){h=c[h>>2]|0;a=c[g>>2]|0;l=ba(c[g+16>>2]|0,h)|0;g=a+l|0;if((l|0)<=0){l=0;i=f;return l|0}while(1){Oe(b,a,d,1)|0;a=a+h|0;if(!(a>>>0<g>>>0)){d=0;break}}i=f;return d|0}if((a|0)==0){j=1}else{j=1;e=g+16|0;while(1){a=e+4|0;j=ba(c[e>>2]|0,j)|0;if(a>>>0<h>>>0){e=a}else{break}}}b=ba(c[b+12>>2]|0,j)|0;g=c[g>>2]|0;l=c[(c[d+8>>2]|0)+16>>2]&255;a=d+(l<<2)+16|0;if((l|0)==0){e=1}else{e=1;j=d+16|0;while(1){h=j+4|0;e=ba(c[j>>2]|0,e)|0;if(h>>>0<a>>>0){j=h}else{break}}}Yd(d,e,b,g)|0;l=0;i=f;return l|0}else if((g|0)==1){g=nc[c[(c[a>>2]|0)+16>>2]&1023](a)|0;if((g|0)<=0){l=0;i=f;return l|0}h=0;while(1){l=rc[c[(c[a>>2]|0)+24>>2]&63](a,h)|0;Oe(l,b+(nc[c[(c[l>>2]|0)+40>>2]&1023](l)|0)|0,d,1)|0;h=h+1|0;if((h|0)==(g|0)){d=0;break}}i=f;return d|0}else{g=c[a+12>>2]|0;l=c[(c[d+8>>2]|0)+16>>2]&255;h=d+(l<<2)+16|0;if((l|0)==0){j=1}else{j=1;e=d+16|0;while(1){a=e+4|0;j=ba(c[e>>2]|0,j)|0;if(a>>>0<h>>>0){e=a}else{break}}}Yd(d,j,g,b)|0;l=0;i=f;return l|0}return 0}function Pe(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;j=(c[f+16>>2]|0)>>>16&31;if((j|0)==3){k=(g|0)!=0;if(k){j=c[g>>2]|0}else{j=0}g=rc[c[(c[f>>2]|0)+24>>2]&63](f,0)|0;do{if(b){b=d+4|0;f=c[(c[a+8>>2]|0)+16>>2]|0;r=f&255;l=a+(r<<2)+16|0;if((r|0)==0){o=1}else{o=1;n=a+16|0;while(1){m=n+4|0;o=ba(c[n>>2]|0,o)|0;if(m>>>0<l>>>0){n=m}else{break}}}if((b|0)>(o|0)){r=-1;i=h;return r|0}else{l=c[(c[a>>2]|0)+(ba(c[(c[a+12>>2]|0)+12>>2]|0,d)|0)>>2]|0;break}}else{f=c[(c[a+8>>2]|0)+16>>2]|0;r=f&255;b=a+(r<<2)+16|0;if((r|0)==0){m=1}else{m=1;n=a+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<b>>>0){n=l}else{break}}}b=d;l=(m-d|0)/(c[g+12>>2]|0)|0}}while(0);d=a+8|0;r=f&255;f=a+(r<<2)+16|0;if((r|0)==0){o=1}else{o=1;n=a+16|0;while(1){m=n+4|0;o=ba(c[n>>2]|0,o)|0;if(m>>>0<f>>>0){n=m}else{break}}}if((l|0)>(o-b|0)){r=-1;i=h;return r|0}f=(j|0)!=0;if(f){m=j+8|0;n=c[m>>2]|0;r=c[n+16>>2]&255;p=j+(r<<2)+16|0;if((r|0)==0){r=1}else{r=1;q=j+16|0;while(1){o=q+4|0;r=ba(c[q>>2]|0,r)|0;if(o>>>0<p>>>0){q=o}else{break}}}n=c[(nc[c[(c[n>>2]|0)+36>>2]&1023](n)|0)>>2]|0;if((!((c[(c[m>>2]|0)+16>>2]&255|0)!=1|(n|0)>-1)?!((n|0)!=-2147483648&(l|0)>(0-n|0)|(r|0)==(l|0)):0)?Wd(j,ba(c[(c[j+12>>2]|0)+12>>2]|0,l)|0,r,l,1)|0:0){c[j+16>>2]=l}}if((c[g+16>>2]&2097152|0)!=0){g=ba(c[g+12>>2]|0,l)|0;e=g+b|0;r=c[(c[d>>2]|0)+16>>2]&255;k=a+(r<<2)+16|0;if((r|0)==0){m=1}else{m=1;l=a+16|0;while(1){d=l+4|0;m=ba(c[l>>2]|0,m)|0;if(d>>>0<k>>>0){l=d}else{break}}}k=(e|0)>(m|0);if(k|f^1){r=k?-1:e;i=h;return r|0}Wt(c[j>>2]|0,(c[a>>2]|0)+(ba(c[(c[a+12>>2]|0)+12>>2]|0,b)|0)|0,g|0)|0;r=e;i=h;return r|0}if(k){k=c[j+((c[(c[j+8>>2]|0)+16>>2]&255)<<2)+16>>2]|0;d=c[j>>2]|0;r=ba(c[j+16>>2]|0,k)|0;j=d+r|0;if((r|0)<=0){r=b;i=h;return r|0}while(1){b=Pe(a,1,b,e,g,d)|0;if((b|0)==-1){b=-1;a=51;break}d=d+k|0;if(!(d>>>0<j>>>0)){a=51;break}}if((a|0)==51){i=h;return b|0}}else{r=c[e>>2]|0;e=c[r+((c[(c[r+8>>2]|0)+16>>2]&255)<<2)+16>>2]|0;k=c[r>>2]|0;r=ba(c[r+16>>2]|0,e)|0;j=k+r|0;if((r|0)<=0){r=b;i=h;return r|0}while(1){b=Pe(a,1,b,k,g,0)|0;if((b|0)==-1){b=-1;a=51;break}k=k+e|0;if(!(k>>>0<j>>>0)){a=51;break}}if((a|0)==51){i=h;return b|0}}}else if((j|0)==1){j=nc[c[(c[f>>2]|0)+16>>2]&1023](f)|0;if((j|0)<=0){r=d;i=h;return r|0}k=(g|0)==0;b=d;d=0;while(1){l=rc[c[(c[f>>2]|0)+24>>2]&63](f,d)|0;m=nc[c[(c[l>>2]|0)+40>>2]&1023](l)|0;if(k){m=0}else{m=g+m|0}b=Pe(a,1,b,e,l,m)|0;d=d+1|0;if((b|0)==-1){b=-1;a=51;break}if((d|0)>=(j|0)){a=51;break}}if((a|0)==51){i=h;return b|0}}else{e=c[f+12>>2]|0;j=e+d|0;r=c[(c[a+8>>2]|0)+16>>2]&255;k=a+(r<<2)+16|0;if((r|0)==0){f=1}else{f=1;l=a+16|0;while(1){b=l+4|0;f=ba(c[l>>2]|0,f)|0;if(b>>>0<k>>>0){l=b}else{break}}}if((j|0)>(f|0)){r=-1;i=h;return r|0}if((g|0)==0){r=j;i=h;return r|0}Wt(g|0,(c[a>>2]|0)+(ba(c[(c[a+12>>2]|0)+12>>2]|0,d)|0)|0,e|0)|0;r=j;i=h;return r|0}return 0}function Qe(a){a=a|0;var b=0;b=i;Ue(a,28536,66,28552,2);Ue(a,28600,67,28624,2);i=b;return}function Re(b,d){b=b|0;d=d|0;a[b+16|0]=0;c[b>>2]=d;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;return}function Se(a){a=a|0;var b=0,d=0;b=i;if(32168==0){i=b;return}else{d=32168}do{lc[c[d+4>>2]&127](a);d=c[d>>2]|0}while((d|0)!=0);i=b;return}function Te(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+64|0;k=g+36|0;l=g+8|0;f=g;j=f+4|0;c[j>>2]=0;c[f>>2]=0;if((d|0)==0){h=0}else{h=d+(Tt(d|0)|0)|0}c[f>>2]=d;c[j>>2]=h;if((e|0)==0){m=0}else{m=e+(Tt(e|0)|0)|0}j=c[2]|0;c[2]=b;a[k+16|0]=0;c[k>>2]=1;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;c[l+24>>2]=k;c[l>>2]=b;c[l+4>>2]=e;c[l+8>>2]=m;c[l+12>>2]=e;c[l+16>>2]=1;a[l+20|0]=0;e=ce(l)|0;c[2]=b;if((h|0)==(d|0)){m=e;c[2]=j;i=g;return m|0}m=Sc(b,f,e)|0;c[2]=j;i=g;return m|0}function Ue(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;j=i;i=i+48|0;h=j+28|0;k=j;if((f|0)==0){l=0}else{l=f+(Tt(f|0)|0)|0}m=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[k+24>>2]=h;c[k>>2]=b;c[k+4>>2]=f;c[k+8>>2]=l;c[k+12>>2]=f;c[k+16>>2]=1;a[k+20|0]=0;l=ce(k)|0;c[2]=m;e=Rc(b,l,e,g)|0;if((e|0)==0){i=j;return}f=h+4|0;c[f>>2]=0;c[h>>2]=0;if((d|0)==0){k=0}else{k=d+(Tt(d|0)|0)|0}c[h>>2]=d;c[f>>2]=k;Sc(b,h,e)|0;i=j;return}function Ve(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;h=i;i=i+48|0;g=h+28|0;j=h;if((f|0)==0){k=0}else{k=f+(Tt(f|0)|0)|0}l=c[2]|0;c[2]=b;a[g+16|0]=0;c[g>>2]=1;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[j+24>>2]=g;c[j>>2]=b;c[j+4>>2]=f;c[j+8>>2]=k;c[j+12>>2]=f;c[j+16>>2]=1;a[j+20|0]=0;f=ce(j)|0;c[2]=l;f=Tc(b,f,e)|0;if((f|0)==0){i=h;return}j=g+4|0;c[j>>2]=0;c[g>>2]=0;if((d|0)==0){e=0}else{e=d+(Tt(d|0)|0)|0}c[g>>2]=d;c[j>>2]=e;Sc(b,g,f)|0;i=h;return}function We(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+48|0;h=g+32|0;k=g;j=h+4|0;c[j>>2]=0;c[h>>2]=0;if((f|0)==0){l=0}else{l=f+(Tt(f|0)|0)|0}c[h>>2]=f;c[j>>2]=l;c[k+24>>2]=0;c[k>>2]=b;c[k+4>>2]=f;c[k+8>>2]=l;c[k+12>>2]=f;c[k+16>>2]=1;a[k+20|0]=0;k=Qd(b,ce(k)|0)|0;if((c[k+16>>2]&2031616|0)!=655360){i=g;return}if((c[k+12>>2]|0)!=4){i=g;return}c[(rc[c[(c[k>>2]|0)+44>>2]&63](k,0)|0)>>2]=e;l=d+(Tt(d|0)|0)|0;c[h>>2]=d;c[j>>2]=l;Sc(b,h,k)|0;i=g;return}function Xe(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=1536;c[g+4>>2]=1543;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=2824;c[f+8>>2]=2843;c[f+12>>2]=2824;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=144;c[g+4>>2]=145;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=2848;c[f+8>>2]=2867;c[f+12>>2]=2848;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2872;c[g+4>>2]=2877;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=2880;c[f+8>>2]=2896;c[f+12>>2]=2880;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2904;c[g+4>>2]=2908;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=2912;c[f+8>>2]=2928;c[f+12>>2]=2912;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2936;c[g+4>>2]=2942;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=2944;c[f+8>>2]=2961;c[f+12>>2]=2944;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2968;c[g+4>>2]=2973;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=2976;c[f+8>>2]=2993;c[f+12>>2]=2976;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3e3;c[g+4>>2]=3012;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3016;c[f+8>>2]=3033;c[f+12>>2]=3016;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3040;c[g+4>>2]=3053;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3056;c[f+8>>2]=3094;c[f+12>>2]=3056;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3096;c[g+4>>2]=3102;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3104;c[f+8>>2]=3142;c[f+12>>2]=3104;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3144;c[g+4>>2]=3149;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3152;c[f+8>>2]=3169;c[f+12>>2]=3152;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3176;c[g+4>>2]=3182;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3184;c[f+8>>2]=3201;c[f+12>>2]=3184;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3208;c[g+4>>2]=3213;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3216;c[f+8>>2]=3233;c[f+12>>2]=3216;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3240;c[g+4>>2]=3248;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3256;c[f+8>>2]=3274;c[f+12>>2]=3256;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3280;c[g+4>>2]=3288;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3296;c[f+8>>2]=3314;c[f+12>>2]=3296;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3320;c[g+4>>2]=3332;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3336;c[f+8>>2]=3357;c[f+12>>2]=3336;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3360;c[g+4>>2]=3373;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3376;c[f+8>>2]=3457;c[f+12>>2]=3376;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3464;c[g+4>>2]=3470;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3472;c[f+8>>2]=3510;c[f+12>>2]=3472;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3512;c[g+4>>2]=3524;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3528;c[f+8>>2]=3549;c[f+12>>2]=3528;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3552;c[g+4>>2]=3565;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3568;c[f+8>>2]=3654;c[f+12>>2]=3568;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3656;c[g+4>>2]=3662;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3664;c[f+8>>2]=3702;c[f+12>>2]=3664;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3704;c[g+4>>2]=3717;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3720;c[f+8>>2]=3759;c[f+12>>2]=3720;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3760;c[g+4>>2]=3773;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3776;c[f+8>>2]=3815;c[f+12>>2]=3776;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3816;c[g+4>>2]=3820;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3824;c[f+8>>2]=3865;c[f+12>>2]=3824;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3872;c[g+4>>2]=3881;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3888;c[f+8>>2]=3905;c[f+12>>2]=3888;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3912;c[g+4>>2]=3920;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3928;c[f+8>>2]=3947;c[f+12>>2]=3928;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3952;c[g+4>>2]=3964;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3968;c[f+8>>2]=3983;c[f+12>>2]=3968;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=3984;c[g+4>>2]=3995;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4e3;c[f+8>>2]=4014;c[f+12>>2]=4e3;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2624;c[g+4>>2]=2630;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4016;c[f+8>>2]=4028;c[f+12>>2]=4016;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4032;c[g+4>>2]=4043;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4048;c[f+8>>2]=4061;c[f+12>>2]=4048;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4064;c[g+4>>2]=4077;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4080;c[f+8>>2]=4092;c[f+12>>2]=4080;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4096;c[g+4>>2]=4107;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4112;c[f+8>>2]=4145;c[f+12>>2]=4112;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4152;c[g+4>>2]=4163;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4112;c[f+8>>2]=4145;c[f+12>>2]=4112;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2352;c[g+4>>2]=2364;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2384;c[g+4>>2]=2403;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4184;c[f+8>>2]=4196;c[f+12>>2]=4184;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4200;c[g+4>>2]=4218;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2376;c[g+4>>2]=2378;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2160;c[g+4>>2]=2178;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4224;c[f+8>>2]=4227;c[f+12>>2]=4224;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2368;c[g+4>>2]=2373;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2032;c[g+4>>2]=2036;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4232;c[g+4>>2]=4243;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4248;c[g+4>>2]=4258;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4264;c[g+4>>2]=4270;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4272;c[g+4>>2]=4277;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4280;c[g+4>>2]=4287;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=4288;c[g+4>>2]=4295;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2336;c[g+4>>2]=2347;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2408;c[g+4>>2]=2425;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4296;c[f+8>>2]=4329;c[f+12>>2]=4296;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=2432;c[g+4>>2]=2444;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4336;c[f+8>>2]=4380;c[f+12>>2]=4336;c[f+16>>2]=1;a[f+20|0]=0;f=ce(f)|0;c[2]=b;Sc(b,g,f)|0;c[2]=e;i=d;return}function Ye(b,d){b=b|0;d=d|0;c[b+4>>2]=0;c[b+8>>2]=0;if((a[4384]|0)==0){a[4384]=1;c[1098]=68;c[1100]=68}c[b>>2]=d;c[b+16>>2]=0;c[b+20>>2]=0;c[b+12>>2]=0;return}function Ze(a){a=a|0;return a|0}function _e(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;h=c[2]|0;c[2]=c[a>>2];f=c[1102]|0;c[1102]=a;o=us()|0;n=F;d=Ut(o|0,n|0,d|0,e|0)|0;m=F;e=a+12|0;p=c[e>>2]|0;l=a+4|0;k=a+8|0;a:do{if((p|0)!=0){do{r=p+24|0;u=r;t=c[u+4>>2]|0;if((t|0)>(n|0)|(t|0)==(n|0)&(c[u>>2]|0)>>>0>o>>>0){break a}q=p+4|0;c[e>>2]=c[q>>2];c[q>>2]=0;u=r;c[u>>2]=0;c[u+4>>2]=0;if((c[l>>2]|0)==0){c[l>>2]=p;c[k>>2]=p;c[q>>2]=0}else{c[(c[k>>2]|0)+4>>2]=p;c[k>>2]=p}p=c[e>>2]|0}while((p|0)!=0)}}while(0);p=c[l>>2]|0;do{if((c[k>>2]|0)==(p|0)){if((p|0)!=0){c[l>>2]=0;c[k>>2]=0;break}c[a+20>>2]=0;b=c[l>>2]|0;b=(b|0)!=0;b=b&1;u=c[e>>2]|0;u=(u|0)==0;e=b|2;b=u?b:e;u=c[a>>2]|0;u=u+48|0;u=c[u>>2]|0;u=(u|0)>0;u=u?0:b;c[1102]=f;c[2]=h;i=g;return u|0}else{u=p+4|0;c[l>>2]=c[u>>2];c[u>>2]=0}}while(0);o=a+20|0;c[o>>2]=p;n=a+16|0;p=c[p+20>>2]|0;do{c[n>>2]=b;do{u=nc[c[p>>2]&1023](p)|0;u=nc[c[u>>2]&1023](u)|0;u=nc[c[u>>2]&1023](u)|0;u=nc[c[u>>2]&1023](u)|0;u=nc[c[u>>2]&1023](u)|0;u=nc[c[u>>2]&1023](u)|0;u=nc[c[u>>2]&1023](u)|0;u=nc[c[u>>2]&1023](u)|0;u=nc[c[u>>2]&1023](u)|0;p=nc[c[u>>2]&1023](u)|0;u=c[n>>2]|0;c[n>>2]=u+ -1}while((u|0)>0);r=us()|0;q=F;u=c[e>>2]|0;b:do{if((u|0)!=0){do{s=u+24|0;t=s;v=c[t+4>>2]|0;if((v|0)>(q|0)|(v|0)==(q|0)&(c[t>>2]|0)>>>0>r>>>0){break b}t=u+4|0;c[e>>2]=c[t>>2];c[t>>2]=0;v=s;c[v>>2]=0;c[v+4>>2]=0;if((c[l>>2]|0)==0){c[l>>2]=u;c[k>>2]=u;c[t>>2]=0}else{c[(c[k>>2]|0)+4>>2]=u;c[k>>2]=u}u=c[e>>2]|0}while((u|0)!=0)}}while(0);s=c[o>>2]|0;t=(s|0)!=0;do{if((q|0)<(m|0)|(q|0)==(m|0)&r>>>0<d>>>0){q=c[l>>2]|0;if(!t){if((c[k>>2]|0)==(q|0)){if((q|0)!=0){c[l>>2]=0;c[k>>2]=0}}else{v=q+4|0;c[l>>2]=c[v>>2];c[v>>2]=0}c[o>>2]=q;break}if((q|0)==0){j=38}else{c[s+20>>2]=p;q=c[o>>2]|0;c[o>>2]=0;if((c[l>>2]|0)==0){c[l>>2]=q;c[k>>2]=q;c[q+4>>2]=0;q=c[k>>2]|0}else{c[(c[k>>2]|0)+4>>2]=q;c[k>>2]=q}p=c[l>>2]|0;if((q|0)==(p|0)){if((q|0)!=0){c[l>>2]=0;c[k>>2]=0}}else{v=p+4|0;c[l>>2]=c[v>>2];c[v>>2]=0}c[o>>2]=p;q=p;p=c[p+20>>2]|0}}else{if(t){c[s+20>>2]=p;j=c[o>>2]|0;c[o>>2]=0;if((c[l>>2]|0)==0){c[l>>2]=j;c[k>>2]=j;c[j+4>>2]=0;j=38;break}else{c[(c[k>>2]|0)+4>>2]=j;c[k>>2]=j;j=38;break}}else{j=38}}}while(0);if((j|0)==38){j=0;q=c[o>>2]|0}}while((q|0)!=0);b=c[l>>2]|0;b=(b|0)!=0;b=b&1;v=c[e>>2]|0;v=(v|0)==0;e=b|2;b=v?b:e;v=c[a>>2]|0;v=v+48|0;v=c[v>>2]|0;v=(v|0)>0;v=v?0:b;c[1102]=f;c[2]=h;i=g;return v|0}function $e(a){a=a|0;var b=0;b=i;Ue(a,28072,69,28080,2);Ue(a,28096,70,28080,2);Ue(a,28104,71,28120,2);Ue(a,28160,72,28168,2);Ue(a,5040,73,28192,2);Ue(a,28272,74,28296,2);Ue(a,28312,75,28336,2);Ue(a,28352,76,28296,2);Ue(a,5112,77,28376,2);Ue(a,28384,78,28392,2);Ue(a,5096,68,28392,2);i=b;return}function af(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;d=c[c[a+12>>2]>>2]|0;if((d|0)==0){i=b;return}e=d+36|0;if((c[e>>2]|0)<1){i=b;return}f=c[a+4>>2]|0;a=c[f+12>>2]|0;f=c[f>>2]|0;g=nc[c[(c[a>>2]|0)+16>>2]&1023](a)|0;if((g|0)>0){h=0;do{k=rc[c[(c[a>>2]|0)+24>>2]&63](a,h)|0;j=c[k>>2]|0;l=c[j+48>>2]|0;j=f+(nc[c[j+40>>2]&1023](k)|0)|0;jc[l&63](k,j,0)|0;h=h+1|0}while((h|0)!=(g|0))}l=(c[e>>2]|0)+ -1|0;c[e>>2]=l;if((l|0)!=0){i=b;return}e=c[1102]|0;a=e+4|0;if((c[a>>2]|0)==0){c[a>>2]=d;c[e+8>>2]=d;c[d+4>>2]=0;i=b;return}else{l=e+8|0;c[(c[l>>2]|0)+4>>2]=d;c[l>>2]=d;i=b;return}}function bf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+48|0;m=f+40|0;n=f+32|0;p=f+24|0;k=f+16|0;j=f+8|0;h=f;g=b+3256|0;c[g>>2]=0;l=d+4|0;r=c[l>>2]|0;s=c[d>>2]|0;t=r-s|0;a:do{if((t|0)<1){q=144;p=s}else{q=s+1|0;u=1224;v=s;while(1){if(!(v>>>0<q>>>0)){break}if((a[v]|0)==(a[u]|0)){u=u+1|0;v=v+1|0}else{q=144;p=s;break a}}if(s>>>0<r>>>0){c[d>>2]=q}h=b+3232|0;v=Zc(c[c[c[(c[h>>2]|0)+8>>2]>>2]>>2]|0,d)|0;c[e>>2]=v;if((v|0)==0){i=f;return}if((c[(c[b+3252>>2]|0)+16>>2]&1879048192|0)!=268435456){c[e>>2]=0;c[b>>2]=5;i=f;return}c[p>>2]=2032;c[p+4>>2]=2036;e=Zc(c[c[c[(c[h>>2]|0)+8>>2]>>2]>>2]|0,p)|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}c[g>>2]=e;c[b>>2]=7;i=f;return}}while(0);while(1){if(!(p>>>0<r>>>0)){o=15;break}if((a[p]|0)==(a[q]|0)){q=q+1|0;p=p+1|0}else{break}}if((o|0)==15?(a[q]|0)==0:0){h=c[b+3252>>2]|0;c[g>>2]=h;if((c[h+16>>2]&2097152|0)==0){g=Qd(c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0,h)|0;g=rc[c[(c[g>>2]|0)+44>>2]&63](g,1)|0}else{g=0}c[e>>2]=g;c[b>>2]=8;i=f;return}u=c[b+3280>>2]|0;q=m+4|0;c[q>>2]=0;c[m>>2]=0;p=n+4|0;c[n>>2]=s;c[p>>2]=r;do{if((t|0)>0){o=s;s=0;while(1){b:do{if(o>>>0<r>>>0){t=o;while(1){v=t+1|0;if((a[t]|0)==46){break b}if(v>>>0<r>>>0){t=v}else{t=v;break}}}else{t=o}}while(0);c[m>>2]=o;c[q>>2]=t;c[n>>2]=t;c[p>>2]=r;u=rc[c[(c[u>>2]|0)+20>>2]&63](u,m)|0;if((u|0)==0){o=24;break}s=(nc[c[(c[u>>2]|0)+40>>2]&1023](u)|0)+s|0;gd(n,46)|0;r=c[p>>2]|0;o=c[n>>2]|0;if((r-o|0)<=0){o=26;break}}if((o|0)==24){c[g>>2]=0;break}else if((o|0)==26){c[g>>2]=u;o=28;break}}else{c[g>>2]=u;if((u|0)!=0){s=0;o=28}}}while(0);if((o|0)==28){c[e>>2]=(c[b+3284>>2]|0)+s;c[b>>2]=6;i=f;return}c:do{if((c[b+3276>>2]|0)!=0){t=c[b+3268>>2]|0;p=m+4|0;c[p>>2]=0;c[m>>2]=0;o=n+4|0;q=c[d>>2]|0;r=c[l>>2]|0;c[n>>2]=q;c[o>>2]=r;do{if((r-q|0)>0){s=0;while(1){d:do{if(q>>>0<r>>>0){u=q;while(1){v=u+1|0;if((a[u]|0)==46){break d}if(v>>>0<r>>>0){u=v}else{u=v;break}}}else{u=q}}while(0);c[m>>2]=q;c[p>>2]=u;c[n>>2]=u;c[o>>2]=r;t=rc[c[(c[t>>2]|0)+20>>2]&63](t,m)|0;if((t|0)==0){o=35;break}s=(nc[c[(c[t>>2]|0)+40>>2]&1023](t)|0)+s|0;gd(n,46)|0;r=c[o>>2]|0;q=c[n>>2]|0;if((r-q|0)<=0){o=37;break}}if((o|0)==35){c[g>>2]=0;break c}else if((o|0)==37){c[g>>2]=t;break}}else{c[g>>2]=t;if((t|0)==0){break c}else{s=0}}}while(0);c[e>>2]=(c[b+3272>>2]|0)+s;c[b>>2]=9;i=f;return}}while(0);n=k+4|0;c[n>>2]=0;c[k>>2]=0;m=j+4|0;c[m>>2]=0;c[j>>2]=0;d=c[d>>2]|0;l=c[l>>2]|0;e:do{if(d>>>0<l>>>0){o=d;while(1){p=o+1|0;if((a[o]|0)==46){break e}if(p>>>0<l>>>0){o=p}else{o=p;break}}}else{o=d}}while(0);c[k>>2]=d;c[n>>2]=o;c[j>>2]=o;c[m>>2]=l;k=Zc(c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0,k)|0;if((k|0)!=0){k=c[k>>2]|0;c[g>>2]=k;if((k|0)!=0){k=rc[c[(c[k>>2]|0)+44>>2]&63](k,1)|0;c[h>>2]=k;v=gd(j,46)|0;l=c[g>>2]|0;if(v){l=hd(l,j,k,h,0)|0;c[g>>2]=l}if((l|0)!=0){c[e>>2]=c[h>>2];c[b>>2]=7;i=f;return}}}else{c[g>>2]=0}c[e>>2]=0;c[g>>2]=0;i=f;return}function cf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;j=i;i=i+4160|0;m=j+4144|0;d=j+816|0;l=j+8|0;h=j+408|0;u=j+4152|0;y=j;z=j+808|0;g=j+4136|0;k=j+4128|0;c[d+3264>>2]=0;c[d+3260>>2]=0;v=b+3232|0;x=c[v>>2]|0;p=b+8|0;r=c[p>>2]|0;I=c[b+4>>2]|0;s=d+3236|0;c[s>>2]=0;n=d+3240|0;c[n>>2]=0;o=d+3244|0;c[o>>2]=0;q=d+12|0;c[q>>2]=0;c[d+1216>>2]=0;c[d+2420>>2]=0;f=d+3304|0;c[f>>2]=0;c[d+3232>>2]=x;x=c[x+8>>2]|0;c[d+3228>>2]=x;c[d+4>>2]=I;c[d+8>>2]=r;a[d+3308|0]=0;r=c[x+4>>2]|0;c[d+3276>>2]=r;c[d+3272>>2]=c[r>>2];c[d+3268>>2]=c[r+12>>2];x=c[x+8>>2]|0;c[d+3288>>2]=x;c[d+3284>>2]=c[x>>2];c[d+3280>>2]=c[x+12>>2];c[d+2424>>2]=0;c[d+3300>>2]=-1;Yt(d+2428|0,0,800)|0;Yt(d+1220|0,0,1200)|0;x=b+12|0;r=(c[x>>2]|0)+ -1|0;if((r|0)>99){I=0;i=j;return I|0}w=c[b+16>>2]|0;t=(r|0)>0;if(t){A=b+20|0;I=r<<2;Wt(l|0,A|0,I|0)|0;B=b+420|0;Wt(h|0,B|0,I|0)|0}else{A=b+20|0;B=b+420|0}c[B>>2]=0;c[x>>2]=2;c[A>>2]=0;A=b+3304|0;B=c[A>>2]|0;if((B|0)==0){B=2}else{c[B>>2]=(c[B>>2]|0)+1;B=c[x>>2]|0}c[b+(B<<2)+416>>2]=0;I=c[x>>2]|0;c[x>>2]=I+1;c[b+(I<<2)+16>>2]=0;A=c[A>>2]|0;if((A|0)!=0){c[A>>2]=(c[A>>2]|0)+1}B=c[x>>2]|0;A=B+ -1|0;a[b+3308|0]=0;c[u>>2]=5040;c[u+4>>2]=5046;u=Zc(c[c[c[(c[v>>2]|0)+8>>2]>>2]>>2]|0,u)|0;if((u|0)==0){v=0}else{v=c[u>>2]|0}c[b+3292>>2]=v;u=b+3296|0;c[u>>2]=rc[c[(c[v>>2]|0)+24>>2]&63](v,0)|0;v=Ce(b)|0;x=c[(c[w+8>>2]|0)+4>>2]|0;w=c[x+12>>2]|0;x=c[x>>2]|0;c[y>>2]=5048;c[y+4>>2]=5052;c[z>>2]=5056;c[z+4>>2]=5060;c[g>>2]=5072;c[g+4>>2]=5079;c[k>>2]=5080;c[k+4>>2]=5090;c[s>>2]=0;if(t){C=0;do{E=rc[c[(c[w>>2]|0)+24>>2]&63](w,C)|0;D=nc[c[(c[E>>2]|0)+40>>2]&1023](E)|0;F=E+16|0;I=c[F>>2]|0;G=c[l+(C<<2)>>2]|0;H=(G|0)!=0;if((I&2097152|0)==0){if(H){xe(d,g)|0;c[d+(c[q>>2]<<2)+416>>2]=c[h+(C<<2)>>2];H=c[q>>2]|0;c[q>>2]=H+1;c[d+(H<<2)+16>>2]=G;H=c[f>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}c[d+(c[q>>2]<<2)+416>>2]=E;H=c[q>>2]|0;c[q>>2]=H+1;c[d+(H<<2)+16>>2]=x+D;H=c[f>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}Ce(d)|0;H=27}else{H=29}}else{if(H){if((I&1342177280|0)==268435456){xe(d,z)|0;c[d+(c[q>>2]<<2)+416>>2]=c[h+(C<<2)>>2];H=c[q>>2]|0;c[q>>2]=H+1;c[d+(H<<2)+16>>2]=G;H=c[f>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}c[d+(c[q>>2]<<2)+416>>2]=E;H=c[q>>2]|0;c[q>>2]=H+1;c[d+(H<<2)+16>>2]=x+D;H=c[f>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}Ce(d)|0;H=27}else{H=28}}else{H=29}}if((H|0)==27){if((G|0)==0){H=29}else{H=28}}if((H|0)==28?(H=0,(c[F>>2]&1627389952|0)==553648128):0){H=29}if((H|0)==29){xe(d,y)|0;c[d+(c[q>>2]<<2)+416>>2]=0;F=c[q>>2]|0;c[q>>2]=F+1;c[d+(F<<2)+16>>2]=E;F=c[f>>2]|0;if((F|0)!=0){c[F>>2]=(c[F>>2]|0)+1}c[d+(c[q>>2]<<2)+416>>2]=E;I=c[q>>2]|0;c[q>>2]=I+1;c[d+(I<<2)+16>>2]=x+D;D=c[f>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}Ce(d)|0}C=C+1|0}while((C|0)!=(r|0))}c[m>>2]=5096;c[m+4>>2]=5104;xe(d,m)|0;Ce(d)|0;y=b+3240|0;c[y>>2]=(c[y>>2]|0)+(c[n>>2]|0);z=b+3244|0;c[z>>2]=(c[z>>2]|0)+(c[o>>2]|0);if((B|0)>0){A=v+4+(A<<2)|0}else{A=0}c[s>>2]=A;if(t){s=0;do{t=rc[c[(c[w>>2]|0)+24>>2]&63](w,s)|0;A=t+16|0;B=c[A>>2]|0;if(!((B&1610612736|0)!=536870912|(B&2031616|0)==196608)?(e=c[l+(s<<2)>>2]|0,(e|0)!=0):0){I=nc[c[(c[t>>2]|0)+40>>2]&1023](t)|0;xe(d,g)|0;c[d+(c[q>>2]<<2)+416>>2]=t;B=c[q>>2]|0;c[q>>2]=B+1;c[d+(B<<2)+16>>2]=x+I;B=c[f>>2]|0;if((B|0)!=0){c[B>>2]=(c[B>>2]|0)+1}c[d+(c[q>>2]<<2)+416>>2]=c[h+(s<<2)>>2];B=c[q>>2]|0;c[q>>2]=B+1;c[d+(B<<2)+16>>2]=e;B=c[f>>2]|0;if((B|0)!=0){c[B>>2]=(c[B>>2]|0)+1}Ce(d)|0;B=c[A>>2]|0}if((B&2097152|0)==0){A=nc[c[(c[t>>2]|0)+40>>2]&1023](t)|0;xe(d,k)|0;c[d+(c[q>>2]<<2)+416>>2]=0;B=c[q>>2]|0;c[q>>2]=B+1;c[d+(B<<2)+16>>2]=t;B=c[f>>2]|0;if((B|0)!=0){c[B>>2]=(c[B>>2]|0)+1}c[d+(c[q>>2]<<2)+416>>2]=t;t=c[q>>2]|0;c[q>>2]=t+1;c[d+(t<<2)+16>>2]=x+A;t=c[f>>2]|0;if((t|0)!=0){c[t>>2]=(c[t>>2]|0)+1}Ce(d)|0}s=s+1|0}while((s|0)!=(r|0))}c[m>>2]=5096;c[m+4>>2]=5104;xe(d,m)|0;Ce(d)|0;c[y>>2]=(c[y>>2]|0)+(c[n>>2]|0);c[z>>2]=(c[z>>2]|0)+(c[o>>2]|0);c[u>>2]=0;if((c[(c[p>>2]|0)+4>>2]|0)==0){I=v;i=j;return I|0}c[b+3236>>2]=v+8;I=v;i=j;return I|0}function df(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=2064;c[g+4>>2]=2080;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=27056;c[g+4>>2]=27067;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4168;c[f+8>>2]=4180;c[f+12>>2]=4168;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[2]=e;Ve(b,27072,5128,27088);c[g>>2]=27104;c[g+4>>2]=27111;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=27112;c[f+8>>2]=27512;c[f+12>>2]=27112;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[2]=e;Ve(b,1728,5120,27520);c[g>>2]=4632;c[g+4>>2]=4658;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=27816;c[f+8>>2]=27834;c[f+12>>2]=27816;c[f+16>>2]=1;a[f+20|0]=0;f=ce(f)|0;c[2]=b;Sc(b,g,f)|0;c[2]=e;Ue(b,27840,79,27856,2);i=d;return}function ef(a){a=a|0;var b=0;b=i;Ue(a,26480,80,26496,2);Ue(a,26528,81,26544,2);Ue(a,26568,82,26544,2);Ue(a,26584,83,26544,2);Ue(a,26600,84,26616,2);Ue(a,26640,85,26656,2);Ue(a,26688,86,26704,2);Ue(a,26728,87,26744,2);Ue(a,26784,88,26808,2);Ue(a,26856,89,26872,2);Ue(a,26920,90,26744,2);Ue(a,26936,91,26808,2);Ue(a,26960,92,26976,2);Ue(a,27e3,93,27016,2);i=b;return}function ff(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=13e3;c[g+4>>2]=13012;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13016;c[f+8>>2]=13065;c[f+12>>2]=13016;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13072;c[g+4>>2]=13083;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13088;c[f+8>>2]=13123;c[f+12>>2]=13088;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13128;c[g+4>>2]=13137;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13144;c[f+8>>2]=13175;c[f+12>>2]=13144;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13176;c[g+4>>2]=13186;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13192;c[f+8>>2]=13235;c[f+12>>2]=13192;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13240;c[g+4>>2]=13250;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13256;c[f+8>>2]=13289;c[f+12>>2]=13256;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13296;c[g+4>>2]=13307;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13312;c[f+8>>2]=13358;c[f+12>>2]=13312;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13360;c[g+4>>2]=13370;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13376;c[f+8>>2]=13409;c[f+12>>2]=13376;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13416;c[g+4>>2]=13427;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13432;c[f+8>>2]=13478;c[f+12>>2]=13432;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13480;c[g+4>>2]=13490;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13496;c[f+8>>2]=13529;c[f+12>>2]=13496;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13536;c[g+4>>2]=13547;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13552;c[f+8>>2]=13598;c[f+12>>2]=13552;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13600;c[g+4>>2]=13608;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13616;c[f+8>>2]=13644;c[f+12>>2]=13616;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13648;c[g+4>>2]=13657;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13664;c[f+8>>2]=13702;c[f+12>>2]=13664;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13704;c[g+4>>2]=13713;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13720;c[f+8>>2]=13751;c[f+12>>2]=13720;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13752;c[g+4>>2]=13762;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13768;c[f+8>>2]=13810;c[f+12>>2]=13768;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13816;c[g+4>>2]=13825;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13832;c[f+8>>2]=13863;c[f+12>>2]=13832;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13864;c[g+4>>2]=13874;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13880;c[f+8>>2]=13923;c[f+12>>2]=13880;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13928;c[g+4>>2]=13937;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13944;c[f+8>>2]=13975;c[f+12>>2]=13944;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=13976;c[g+4>>2]=13986;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13992;c[f+8>>2]=14035;c[f+12>>2]=13992;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[2]=e;Ue(b,14040,94,14056,2);Ue(b,14072,95,14056,2);Ue(b,14088,96,14056,2);Ue(b,14104,97,14056,2);Ue(b,14120,98,14056,2);Ue(b,14136,99,14056,2);Ue(b,14152,100,14168,2);Ue(b,14200,101,14168,2);Ue(b,14216,102,14232,2);Ue(b,14272,103,14232,2);Ue(b,14288,104,14232,2);Ue(b,14304,105,14232,2);Ue(b,14320,106,14232,2);Ue(b,14336,107,14232,2);Ue(b,14352,108,14368,2);Ue(b,14384,109,14368,2);Ue(b,14400,110,14368,2);Ue(b,14416,111,14432,2);Ue(b,14448,112,14368,2);Ue(b,14464,113,14480,2);Ue(b,14520,114,14480,2);Ue(b,14536,115,14480,2);Ue(b,14552,116,14568,2);Ue(b,14608,117,14368,2);Ue(b,14624,118,14368,2);Ue(b,14632,119,14368,2);Ue(b,14648,120,14368,2);Ue(b,14664,121,14368,2);Ue(b,14680,122,14368,2);Ue(b,14696,123,14712,2);Ue(b,14752,124,14712,2);Ue(b,14768,125,14712,2);Ue(b,14784,126,14712,2);Ue(b,14800,127,14712,2);Ue(b,14816,128,14712,2);Ue(b,14832,129,14848,2);Ue(b,14888,130,14848,2);Ue(b,14904,131,14848,2);Ue(b,14920,132,14848,2);Ue(b,14936,133,14848,2);Ue(b,14952,134,14848,2);Ue(b,14968,135,14992,2);Ue(b,15016,136,15040,2);Ue(b,15064,137,15088,2);Ue(b,15112,138,15136,2);Ue(b,15160,139,15184,2);Ue(b,15208,140,15232,2);Ue(b,15256,141,15280,2);Ue(b,15304,142,15328,2);Ue(b,15352,143,15376,2);Ue(b,15400,144,15416,2);Ue(b,15432,145,15416,2);Ue(b,15448,146,15416,2);Ue(b,15464,147,15480,2);Ue(b,15496,148,15416,2);Ue(b,15512,149,15528,2);Ue(b,15568,150,15528,2);Ue(b,15584,151,15600,2);Ue(b,15640,152,15656,2);Ue(b,15696,153,15416,2);Ue(b,15712,154,15416,2);Ue(b,15728,155,15416,2);Ue(b,15744,156,15416,2);Ue(b,15760,157,15416,2);Ue(b,15776,158,15416,2);Ue(b,15792,159,15808,2);Ue(b,15848,160,15808,2);Ue(b,15864,161,15808,2);Ue(b,15880,162,15808,2);Ue(b,15896,163,15808,2);Ue(b,15912,164,15808,2);Ue(b,15928,165,15952,2);Ue(b,16e3,166,15952,2);Ue(b,16024,167,15952,2);Ue(b,16048,168,15952,2);Ue(b,16072,169,15952,2);Ue(b,16096,170,15952,2);Ue(b,16120,171,16144,2);Ue(b,16168,172,16192,2);Ue(b,16224,173,16248,2);Ue(b,16280,174,16304,2);Ue(b,16328,175,16352,2);Ue(b,16376,176,16400,2);Ue(b,16424,177,16448,2);Ue(b,16472,178,16496,2);Ue(b,16528,179,16552,2);Ue(b,16584,180,16600,2);Ue(b,16616,181,16600,2);Ue(b,16632,182,16600,2);Ue(b,16648,183,16664,2);Ue(b,16680,184,16600,2);Ue(b,16696,185,16712,2);Ue(b,16752,186,16712,2);Ue(b,16768,187,16784,2);Ue(b,16824,188,16840,2);Ue(b,16880,189,16600,2);Ue(b,16896,190,16600,2);Ue(b,16912,191,16600,2);Ue(b,16928,192,16600,2);Ue(b,16944,193,16600,2);Ue(b,16960,194,16600,2);Ue(b,16976,195,16992,2);Ue(b,17032,196,16992,2);Ue(b,17048,197,16992,2);Ue(b,17064,198,16992,2);Ue(b,17080,199,16992,2);Ue(b,17096,200,16992,2);Ue(b,17112,201,17136,2);Ue(b,17184,202,17136,2);Ue(b,17208,203,17136,2);Ue(b,17232,204,17136,2);Ue(b,17256,205,17136,2);Ue(b,17280,206,17136,2);Ue(b,17304,207,17328,2);Ue(b,17352,208,17376,2);Ue(b,17408,209,17432,2);Ue(b,17464,210,17488,2);Ue(b,17512,211,17536,2);Ue(b,17560,212,17584,2);Ue(b,17608,213,17632,2);Ue(b,17656,214,17680,2);Ue(b,17712,215,17736,2);Ue(b,17768,216,17784,2);Ue(b,17800,217,17784,2);Ue(b,17816,218,17784,2);Ue(b,17832,219,17848,2);Ue(b,17864,220,17784,2);Ue(b,17880,221,17896,2);Ue(b,17936,222,17896,2);Ue(b,17952,223,17968,2);Ue(b,18008,224,17784,2);Ue(b,18024,225,17784,2);Ue(b,18040,226,17784,2);Ue(b,18056,227,17784,2);Ue(b,18072,228,17784,2);Ue(b,18088,229,17784,2);Ue(b,18104,230,18120,2);Ue(b,18160,231,18120,2);Ue(b,18176,232,18120,2);Ue(b,18192,233,18120,2);Ue(b,18208,234,18120,2);Ue(b,18224,235,18120,2);Ue(b,18240,236,18264,2);Ue(b,18312,237,18264,2);Ue(b,18336,238,18264,2);Ue(b,18360,239,18264,2);Ue(b,18384,240,18264,2);Ue(b,18408,241,18264,2);Ue(b,18432,242,18456,2);Ue(b,18480,243,18504,2);Ue(b,18536,244,18560,2);Ue(b,18592,245,18616,2);Ue(b,18640,246,18664,2);Ue(b,18688,247,18712,2);Ue(b,18736,248,18760,2);Ue(b,18784,249,18808,2);Ue(b,18840,250,18864,2);Ue(b,18896,251,18904,2);Ue(b,18920,252,18904,2);Ue(b,18928,253,18904,2);Ue(b,18936,254,18952,2);Ue(b,18968,255,18904,2);Ue(b,18976,256,18992,2);Ue(b,19024,257,18992,2);Ue(b,19040,258,19056,2);Ue(b,19088,259,19104,2);Ue(b,19136,260,7008,2);Ue(b,19152,261,18904,2);Ue(b,19160,262,18904,2);Ue(b,19168,263,18904,2);Ue(b,19176,264,18904,2);Ue(b,19192,265,18904,2);Ue(b,19200,266,18904,2);Ue(b,19208,267,19224,2);Ue(b,19264,268,19224,2);Ue(b,19280,269,19224,2);Ue(b,19296,270,19224,2);Ue(b,19312,271,19224,2);Ue(b,19328,272,19224,2);Ue(b,19344,273,19360,2);Ue(b,19400,274,19360,2);Ue(b,19416,275,19360,2);Ue(b,19432,276,19360,2);Ue(b,19448,277,19360,2);Ue(b,19464,278,19360,2);Ue(b,19480,279,19504,2);Ue(b,19528,280,19552,2);Ue(b,19576,281,19600,2);Ue(b,19624,282,19648,2);Ue(b,19672,283,19696,2);Ue(b,19720,284,19744,2);Ue(b,19768,285,19792,2);Ue(b,19816,286,19840,2);Ue(b,19864,287,19888,2);Ue(b,19912,288,19928,2);Ue(b,19944,289,19928,2);Ue(b,19960,290,19928,2);Ue(b,19976,291,19992,2);Ue(b,20008,292,19928,2);Ue(b,20024,293,20040,2);Ue(b,20080,294,20040,2);Ue(b,20096,295,20112,2);Ue(b,20152,296,20168,2);Ue(b,20208,297,20224,2);Ue(b,20248,298,19928,2);Ue(b,20264,299,19928,2);Ue(b,20272,300,19928,2);Ue(b,20288,301,19928,2);Ue(b,20304,302,19928,2);Ue(b,20320,303,19928,2);Ue(b,20336,304,20352,2);Ue(b,20392,305,20352,2);Ue(b,20408,306,20352,2);Ue(b,20424,307,20352,2);Ue(b,20440,308,20352,2);Ue(b,20456,309,20352,2);Ue(b,20472,310,20496,2);Ue(b,20528,311,20544,2);Ue(b,20584,312,20544,2);Ue(b,20600,313,20544,2);Ue(b,20616,314,20544,2);Ue(b,20632,315,20544,2);Ue(b,20648,316,20544,2);Ue(b,20664,317,20688,2);Ue(b,20712,318,20736,2);Ue(b,20760,319,20784,2);Ue(b,20808,320,20832,2);Ue(b,20856,321,20880,2);Ue(b,20904,322,20928,2);Ue(b,20952,323,20976,2);Ue(b,21e3,324,21024,2);Ue(b,21048,325,21072,2);Ue(b,21096,326,21112,2);Ue(b,21128,327,21112,2);Ue(b,21144,328,21112,2);Ue(b,21160,329,21176,2);Ue(b,21192,330,21112,2);Ue(b,21208,331,21224,2);Ue(b,21264,332,21224,2);Ue(b,21280,333,21296,2);Ue(b,21336,334,21352,2);Ue(b,21392,335,21408,2);Ue(b,21432,336,21112,2);Ue(b,21448,337,21112,2);Ue(b,21456,338,21112,2);Ue(b,21472,339,21112,2);Ue(b,21488,340,21112,2);Ue(b,21504,341,21112,2);Ue(b,21520,342,21112,2);Ue(b,21544,343,21112,2);Ue(b,21560,344,21576,2);Ue(b,21616,345,21576,2);Ue(b,21632,346,21576,2);Ue(b,21648,347,21576,2);Ue(b,21664,348,21576,2);Ue(b,21680,349,21576,2);Ue(b,21696,350,21712,2);Ue(b,21752,351,21712,2);Ue(b,21768,352,21712,2);Ue(b,21784,353,21712,2);Ue(b,21800,354,21712,2);Ue(b,21816,355,21712,2);Ue(b,21832,356,21856,2);Ue(b,21880,357,21904,2);Ue(b,21928,358,21952,2);Ue(b,21976,359,22e3,2);Ue(b,22024,360,22048,2);Ue(b,22072,361,22096,2);Ue(b,22120,362,22144,2);Ue(b,22168,363,22192,2);Ue(b,22216,364,22240,2);Ue(b,22264,365,22280,2);Ue(b,22296,366,22280,2);Ue(b,22312,367,22280,2);Ue(b,22328,368,22344,2);Ue(b,22360,369,22280,2);Ue(b,22376,370,22392,2);Ue(b,22432,371,22392,2);Ue(b,22448,372,22464,2);Ue(b,22504,373,22520,2);Ue(b,22544,374,22280,2);Ue(b,22560,375,22280,2);Ue(b,22568,376,22280,2);Ue(b,22584,377,22280,2);Ue(b,22600,378,22280,2);Ue(b,22616,379,22280,2);Ue(b,22632,380,22648,2);Ue(b,22688,381,22648,2);Ue(b,22704,382,22648,2);Ue(b,22720,383,22648,2);Ue(b,22736,384,22648,2);Ue(b,22752,385,22648,2);Ue(b,22768,386,22784,2);Ue(b,22824,387,22784,2);Ue(b,22840,388,22784,2);Ue(b,22856,389,22784,2);Ue(b,22872,390,22784,2);Ue(b,22888,391,22784,2);Ue(b,22904,392,22928,2);Ue(b,22952,393,22976,2);Ue(b,23e3,394,23024,2);Ue(b,23048,395,23072,2);Ue(b,23096,396,23120,2);Ue(b,23144,397,23168,2);Ue(b,23192,398,23216,2);Ue(b,23240,399,23264,2);Ue(b,23288,400,23312,2);c[g>>2]=23336;c[g+4>>2]=23346;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=23352;c[f+8>>2]=23385;c[f+12>>2]=23352;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=23392;c[g+4>>2]=23403;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=23408;c[f+8>>2]=23454;c[f+12>>2]=23408;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[2]=e;Ue(b,23456,401,23472,2);Ue(b,23488,402,23472,2);Ue(b,23504,403,23472,2);Ue(b,23520,404,23536,2);Ue(b,23552,405,23472,2);Ue(b,23568,406,23536,2);Ue(b,23584,407,23536,2);Ue(b,23600,408,23536,2);Ue(b,23616,409,23536,2);Ue(b,23632,410,23536,2);Ue(b,23648,411,23536,2);Ue(b,23664,412,23536,2);Ue(b,23680,413,23536,2);Ue(b,23696,414,23536,2);Ue(b,23712,415,23536,2);Ue(b,23736,416,23472,2);Ue(b,23752,417,23768,2);Ue(b,23800,418,23768,2);Ue(b,23816,419,23768,2);Ue(b,23832,420,23848,2);Ue(b,23888,421,23768,2);Ue(b,23904,422,23768,2);Ue(b,23920,423,23768,2);Ue(b,23936,424,23848,2);Ue(b,23952,425,23848,2);Ue(b,23968,426,23984,2);Ue(b,24024,427,23984,2);Ue(b,24040,428,23984,2);Ue(b,24056,429,23984,2);Ue(b,24072,430,23984,2);Ue(b,24088,431,23984,2);Ue(b,24104,432,24128,2);Ue(b,24176,433,24128,2);Ue(b,24200,434,24128,2);Ue(b,24224,435,24128,2);Ue(b,24248,436,24128,2);Ue(b,24272,437,24128,2);Ue(b,24296,438,24320,2);Ue(b,24344,439,24368,2);Ue(b,24400,440,24424,2);Ue(b,24456,441,24480,2);Ue(b,24512,442,24536,2);Ue(b,24560,443,24584,2);Ue(b,24608,444,24632,2);Ue(b,24656,445,24680,2);Ue(b,24704,446,24728,2);c[g>>2]=24760;c[g+4>>2]=24770;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=24776;c[f+8>>2]=24809;c[f+12>>2]=24776;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=24816;c[g+4>>2]=24827;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=24832;c[f+8>>2]=24878;c[f+12>>2]=24832;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=24880;c[g+4>>2]=24881;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=24888;c[f+8>>2]=24919;c[f+12>>2]=24888;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=24920;c[g+4>>2]=24922;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=24928;c[f+8>>2]=24959;c[f+12>>2]=24928;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=24960;c[g+4>>2]=24963;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=24968;c[f+8>>2]=24998;c[f+12>>2]=24968;c[f+16>>2]=1;a[f+20|0]=0;f=ce(f)|0;c[2]=b;Sc(b,g,f)|0;c[2]=e;Ue(b,25e3,447,25016,2);Ue(b,25032,448,25016,2);Ue(b,25048,449,25016,2);Ue(b,25064,450,25080,2);Ue(b,25096,451,25016,2);Ue(b,25112,452,25080,2);Ue(b,25128,453,25080,2);Ue(b,25144,454,25080,2);Ue(b,25160,455,25080,2);Ue(b,25176,456,25080,2);Ue(b,25192,457,25080,2);Ue(b,25208,458,25080,2);Ue(b,25224,459,25080,2);Ue(b,25240,460,25080,2);Ue(b,25256,461,25080,2);Ue(b,25280,462,25016,2);Ue(b,25296,463,25312,2);Ue(b,25344,464,25312,2);Ue(b,25360,465,25312,2);Ue(b,25376,466,25392,2);Ue(b,25432,467,25312,2);Ue(b,25448,468,25312,2);Ue(b,25464,469,25312,2);Ue(b,25480,470,25392,2);Ue(b,25496,471,25392,2);Ue(b,25512,472,25528,2);Ue(b,25568,473,25528,2);Ue(b,25584,474,25528,2);Ue(b,25600,475,25528,2);Ue(b,25616,476,25528,2);Ue(b,25632,477,25528,2);Ue(b,25648,478,25672,2);Ue(b,25720,479,25672,2);Ue(b,25744,480,25672,2);Ue(b,25768,481,25672,2);Ue(b,25792,482,25672,2);Ue(b,25816,483,25672,2);Ue(b,25840,484,25864,2);Ue(b,25888,485,25912,2);Ue(b,25944,486,25968,2);Ue(b,26e3,487,26024,2);Ue(b,26056,488,26080,2);Ue(b,26104,489,26128,2);Ue(b,26152,490,26176,2);Ue(b,26200,491,26224,2);Ue(b,26248,492,26272,2);Ue(b,26304,493,26312,2);Ue(b,26328,494,26344,2);Ue(b,26392,495,26344,2);Ue(b,26408,496,26344,2);Ue(b,26424,497,26344,2);Ue(b,26440,498,26344,2);Ue(b,26456,499,26344,2);i=d;return}function gf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=10968;c[g+4>>2]=10985;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=10992;c[f+8>>2]=11039;c[f+12>>2]=10992;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=11040;c[g+4>>2]=11058;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=11064;c[f+8>>2]=11131;c[f+12>>2]=11064;c[f+16>>2]=1;a[f+20|0]=0;f=ce(f)|0;c[2]=b;Sc(b,g,f)|0;c[2]=e;Ue(b,11136,500,11168,2);Ue(b,11200,501,11232,2);Ue(b,11264,502,11296,2);Ue(b,11328,503,11360,2);Ue(b,11392,504,11424,2);Ue(b,11456,505,11488,2);Ue(b,11520,506,11552,2);Ue(b,11584,507,11616,2);Ue(b,11648,508,11680,2);Ue(b,11712,509,11744,2);Ue(b,11776,510,11808,2);Ue(b,11840,511,11872,2);Ue(b,11904,512,11936,2);Ue(b,11968,513,12e3,2);Ue(b,12032,514,12064,2);Ue(b,12096,515,12128,2);Ue(b,12160,516,12192,2);Ue(b,12224,517,12256,2);Ue(b,12288,518,12320,2);Ue(b,12352,519,12384,2);Ue(b,12416,520,12440,2);Ue(b,12504,521,12440,2);Ue(b,12528,522,12440,2);Ue(b,12552,523,12440,2);Ue(b,12576,524,11680,2);Ue(b,12600,525,11680,2);Ue(b,12624,526,12648,2);Ue(b,12688,527,12648,2);Ue(b,12712,528,12648,2);Ue(b,12736,529,12648,2);Ue(b,12760,530,12648,2);Ue(b,12784,531,12648,2);Ue(b,12808,532,12648,2);Ue(b,12832,533,12648,2);Ue(b,12856,534,12648,2);Ue(b,12880,535,12648,2);Ue(b,12904,536,12648,2);Ue(b,12928,537,12648,2);Ue(b,12952,538,12648,2);Ue(b,12976,539,12440,2);i=d;return}function hf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=8936;c[g+4>>2]=8953;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=8960;c[f+8>>2]=9007;c[f+12>>2]=8960;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=9008;c[g+4>>2]=9026;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=9032;c[f+8>>2]=9099;c[f+12>>2]=9032;c[f+16>>2]=1;a[f+20|0]=0;f=ce(f)|0;c[2]=b;Sc(b,g,f)|0;c[2]=e;Ue(b,9104,540,9136,2);Ue(b,9168,541,9200,2);Ue(b,9232,542,9264,2);Ue(b,9296,543,9328,2);Ue(b,9360,544,9392,2);Ue(b,9424,545,9456,2);Ue(b,9488,546,9520,2);Ue(b,9552,547,9584,2);Ue(b,9616,548,9648,2);Ue(b,9680,549,9712,2);Ue(b,9744,550,9776,2);Ue(b,9808,551,9840,2);Ue(b,9872,552,9904,2);Ue(b,9936,553,9968,2);Ue(b,1e4,554,10032,2);Ue(b,10064,555,10096,2);Ue(b,10128,556,10160,2);Ue(b,10192,557,10224,2);Ue(b,10256,558,10288,2);Ue(b,10320,559,10352,2);Ue(b,10384,560,10408,2);Ue(b,10472,561,10408,2);Ue(b,10496,562,10408,2);Ue(b,10520,563,10408,2);Ue(b,10544,564,9712,2);Ue(b,10568,565,9712,2);Ue(b,10592,566,10616,2);Ue(b,10656,567,10616,2);Ue(b,10680,568,10616,2);Ue(b,10704,569,10616,2);Ue(b,10728,570,10616,2);Ue(b,10752,571,10616,2);Ue(b,10776,572,10616,2);Ue(b,10800,573,10616,2);Ue(b,10824,574,10616,2);Ue(b,10848,575,10616,2);Ue(b,10872,576,10616,2);Ue(b,10896,577,10616,2);Ue(b,10920,578,10616,2);Ue(b,10944,579,10408,2);i=d;return}function jf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;d=a+4|0;b=(c[d>>2]|0)+ -1|0;f=c[c[a+8>>2]>>2]|0;h=f+8|0;j=c[h>>2]|0;m=c[j+16>>2]&255;k=f+(m<<2)+16|0;m=(m|0)==0;if(m){g=1}else{g=1;n=f+16|0;while(1){l=n+4|0;g=ba(c[n>>2]|0,g)|0;if(l>>>0<k>>>0){n=l}else{break}}}l=(b|0)>0;if(l){n=0;u=0;do{p=c[c[a+(n<<2)+12>>2]>>2]|0;q=c[p+12>>2]|0;s=c[(c[p+8>>2]|0)+16>>2]&255;o=p+(s<<2)+16|0;s=(s|0)==0;a:do{if((c[q+16>>2]&2031616|0)==196608){r=p+16|0;t=0;while(1){if(s){w=1}else{w=1;x=r;while(1){v=x+4|0;w=ba(c[x>>2]|0,w)|0;if(v>>>0<o>>>0){x=v}else{break}}}if((t|0)>=(w|0)){break a}w=c[(c[p>>2]|0)+(ba(c[q+12>>2]|0,t)|0)>>2]|0;y=c[(c[w+8>>2]|0)+16>>2]&255;v=w+(y<<2)+16|0;if((y|0)==0){x=1}else{x=1;y=w+16|0;while(1){w=y+4|0;x=ba(c[y>>2]|0,x)|0;if(w>>>0<v>>>0){y=w}else{break}}}t=t+1|0;u=x+u|0}}else{if(s){q=1}else{q=1;r=p+16|0;while(1){p=r+4|0;q=ba(c[r>>2]|0,q)|0;if(p>>>0<o>>>0){r=p}else{break}}}u=q+u|0}}while(0);n=n+1|0}while((n|0)!=(b|0))}else{u=0}if(m){o=1}else{o=1;n=f+16|0;while(1){m=n+4|0;o=ba(c[n>>2]|0,o)|0;if(m>>>0<k>>>0){n=m}else{break}}}j=c[(nc[c[(c[j>>2]|0)+36>>2]&1023](j)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(j|0)>-1)?!((j|0)!=-2147483648&(u|0)>(0-j|0)|(o|0)==(u|0)):0)?Wd(f,ba(c[(c[f+12>>2]|0)+12>>2]|0,u)|0,o,u,1)|0:0){c[f+16>>2]=u}h=c[f+12>>2]|0;b:do{if(l){l=h+16|0;k=h+12|0;j=0;r=c[f>>2]|0;c:while(1){m=c[c[a+(j<<2)+12>>2]>>2]|0;n=m+12|0;d:do{if((c[(c[n>>2]|0)+16>>2]&2031616|0)==196608){p=m+8|0;q=m+16|0;o=0;while(1){y=c[(c[p>>2]|0)+16>>2]&255;t=m+(y<<2)+16|0;if((y|0)==0){u=1}else{u=1;v=q;while(1){s=v+4|0;u=ba(c[v>>2]|0,u)|0;if(s>>>0<t>>>0){v=s}else{break}}}if((o|0)>=(u|0)){break d}t=c[(c[m>>2]|0)+(ba(c[(c[n>>2]|0)+12>>2]|0,o)|0)>>2]|0;y=c[(c[t+8>>2]|0)+16>>2]&255;v=t+(y<<2)+16|0;if((y|0)==0){s=1}else{s=1;w=t+16|0;while(1){u=w+4|0;s=ba(c[w>>2]|0,s)|0;if(u>>>0<v>>>0){w=u}else{break}}}v=c[t>>2]|0;t=c[k>>2]|0;w=ba(t,s)|0;e:do{if((c[l>>2]&2097152|0)==0){u=v+w|0;if((w|0)>0){w=r;while(1){if((jc[c[(c[h>>2]|0)+52>>2]&63](h,v,w)|0)!=0){break e}v=v+t|0;if(!(v>>>0<u>>>0)){break}else{w=w+t|0}}}}else{Xt(r|0,v|0,w|0)|0}}while(0);o=o+1|0;r=r+s|0}}else{if((m|0)==(f|0)){if((j|0)!=0){break c}r=r+g|0;break}y=c[(c[m+8>>2]|0)+16>>2]&255;p=m+(y<<2)+16|0;if((y|0)==0){n=1}else{n=1;q=m+16|0;while(1){o=q+4|0;n=ba(c[q>>2]|0,n)|0;if(o>>>0<p>>>0){q=o}else{break}}}p=c[m>>2]|0;m=c[k>>2]|0;q=ba(m,n)|0;f:do{if((c[l>>2]&2097152|0)==0){o=p+q|0;if((q|0)>0){q=r;while(1){if((jc[c[(c[h>>2]|0)+52>>2]&63](h,p,q)|0)!=0){break f}p=p+m|0;if(!(p>>>0<o>>>0)){break}else{q=q+m|0}}}}else{Xt(r|0,p|0,q|0)|0}}while(0);r=r+n|0}}while(0);j=j+1|0;if((j|0)>=(b|0)){break b}}Ia(30320)|0;y=c[1102]|0;c[y+20>>2]=0;c[y+16>>2]=0;y=4392;i=e;return y|0}}while(0);y=a+8+(c[d>>2]<<2)|0;i=e;return y|0}function kf(a){a=a|0;var b=0;b=i;Ue(a,8368,580,8392,2);Ue(a,8464,581,8488,2);Ue(a,8592,582,8616,2);Ue(a,8688,583,8704,2);Ue(a,8736,584,8704,2);Ue(a,8752,585,8776,2);Ue(a,8816,586,8840,2);Ue(a,8888,587,8840,2);Ue(a,8912,588,8840,2);i=b;return}function lf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+16|0;m=d+8|0;g=d;f=b+12|0;if((c[f>>2]|0)!=2){o=0;i=d;return o|0}k=c[b+416>>2]|0;j=c[b+420>>2]|0;n=m+4|0;c[n>>2]=0;c[m>>2]=0;e=b+3292|0;o=c[e>>2]|0;mc[c[(c[o>>2]|0)+28>>2]&63](o,m);if(!(ed(k,j,1)|0)?!(ed(j,k,1)|0):0){ee(c[b+4>>2]|0,2,0,5384,0);o=0;i=d;return o|0}j=c[b+16>>2]|0;l=c[b+20>>2]|0;o=c[n>>2]|0;n=5072;m=c[m>>2]|0;while(1){if(!(m>>>0<o>>>0)){m=7;break}if((a[m]|0)==(a[n]|0)){n=n+1|0;m=m+1|0}else{m=17;break}}a:do{if((m|0)==7){if((a[n]|0)==0){k=c[k+12>>2]|0;b:do{if(((j>>>0)%(k>>>0)|0|0)==0?((l>>>0)%(k>>>0)|0|0)==0:0){switch(k|0){case 32:{j=5328;k=0;break a};case 16:{j=5320;k=0;break a};case 8:{j=5312;k=0;break a};case 1:{j=5288;k=0;break a};case 4:{j=5304;k=0;break a};case 2:{j=5296;k=0;break a};default:{break b}}}}while(0);j=5336}else{m=17}}}while(0);c:do{if((m|0)==17){m=c[k+16>>2]|0;if((m&2097152|0)==0){if((m&2031616|0)==196608){j=5344;k=0;break}j=5360;break}k=c[k+12>>2]|0;d:do{if(((j>>>0)%(k>>>0)|0|0)==0?((l>>>0)%(k>>>0)|0|0)==0:0){switch(k|0){case 16:{j=5320;k=0;break c};case 1:{j=5288;k=0;break c};case 2:{j=5296;k=0;break c};case 4:{j=5304;k=0;break c};case 32:{j=5328;k=0;break c};case 8:{j=5312;k=0;break c};default:{break d}}}}while(0);j=5336}}while(0);o=j+(Tt(j|0)|0)|0;c[g>>2]=j;c[g+4>>2]=o;if((k|0)!=0?(c[b+(c[f>>2]<<2)+416>>2]=0,h=c[f>>2]|0,c[f>>2]=h+1,c[b+(h<<2)+16>>2]=k,h=c[b+3304>>2]|0,(h|0)!=0):0){c[h>>2]=(c[h>>2]|0)+1}f=Zc(c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0,g)|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}c[e>>2]=f;c[b+3296>>2]=rc[c[(c[f>>2]|0)+24>>2]&63](f,0)|0;o=Ce(b)|0;i=d;return o|0}function mf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=i;i=i+288|0;q=f+280|0;o=f+272|0;j=f+8|0;k=f;r=q+4|0;c[r>>2]=0;c[q>>2]=0;t=b+3292|0;s=c[t>>2]|0;mc[c[(c[s>>2]|0)+28>>2]&63](s,q);s=(e|0)==0;p=o+4|0;h=j+256|0;n=j+255|0;l=k+4|0;m=b+3232|0;g=b+3296|0;while(1){a:do{if(s){x=0}else{v=(d|0)==0;w=e;do{c[p>>2]=0;c[o>>2]=0;if(v){x=0;y=0}else{mc[c[(c[d>>2]|0)+28>>2]&63](d,o);x=c[o>>2]|0;y=c[p>>2]|0}y=y-x|0;y=(y|0)<255?y:255;c[h>>2]=j+y;Wt(j|0,x|0,y|0)|0;a[c[h>>2]|0]=0;x=c[h>>2]|0;y=c[q>>2]|0;z=x+((c[r>>2]|0)-y)|0;z=z>>>0>n>>>0?n:z;Wt(x|0,y|0,z-x|0)|0;c[h>>2]=z;a[z]=0;mc[c[(c[w>>2]|0)+28>>2]&63](w,o);z=c[p>>2]|0;y=c[o>>2]|0;if((z|0)==(y|0)){x=0;break a}x=c[h>>2]|0;z=x+(z-y)|0;z=z>>>0>n>>>0?n:z;Wt(x|0,y|0,z-x|0)|0;c[h>>2]=z;a[z]=0;x=c[h>>2]|0;c[k>>2]=j;c[l>>2]=x;x=Zc(c[c[c[(c[m>>2]|0)+8>>2]>>2]>>2]|0,k)|0;if(((x|0)!=0?(u=c[x>>2]|0,(u|0)!=0):0)?(c[t>>2]=u,z=rc[c[(c[u>>2]|0)+24>>2]&63](u,0)|0,c[g>>2]=z,(z|0)!=0):0){x=Ce(b)|0}else{x=0}w=nc[c[(c[w>>2]|0)+12>>2]&1023](w)|0}while(!((x|0)!=0|(w|0)==0))}}while(0);if((d|0)==0){b=15;break}d=nc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;if(!((d|0)!=0&(x|0)==0)){b=15;break}}if((b|0)==15){i=f;return x|0}return 0}function nf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+6960|0;e=d+6680|0;x=d+3336|0;q=d;u=d+3360|0;f=d+3368|0;o=d+6688|0;m=d+3328|0;r=d+3352|0;w=d+3344|0;n=d+16|0;p=d+8|0;k=c[b+416>>2]|0;j=c[b+420>>2]|0;h=c[b+424>>2]|0;y=x+4|0;c[y>>2]=0;c[x>>2]=0;t=b+3292|0;l=c[t>>2]|0;mc[c[(c[l>>2]|0)+28>>2]&63](l,x);l=k+16|0;g=c[l>>2]&2031616;if((g|0)==65536){v=5}else if((g|0)==196608?(c[j+16>>2]&2031616|0)==196608:0){if((c[h+16>>2]&2031616|0)==196608){if((g|0)==65536){v=5}else{v=7}}else{s=k;g=1}}else{v=7}if((v|0)==5){if((c[j+16>>2]&2031616|0)==65536?(c[h+16>>2]&2031616|0)!=65536:0){s=k;g=1}else{v=7}}if((v|0)==7){s=(c[h+16>>2]&2031616|0)==393216?k:h;g=0}x=c[x>>2]|0;y=c[y>>2]|0;z=5400;v=x;while(1){if(!(v>>>0<y>>>0)){v=11;break}if((a[v]|0)==(a[z]|0)){z=z+1|0;v=v+1|0}else{z=5408;v=12;break}}if((v|0)==11){if((a[z]|0)==0){v=15}else{z=5408;v=12}}a:do{if((v|0)==12){while(1){v=0;if(!(x>>>0<y>>>0)){break}if((a[x]|0)==(a[z]|0)){z=z+1|0;x=x+1|0;v=12}else{break a}}if((a[z]|0)==0){v=15}}}while(0);if((v|0)==15){s=k}x=mf(b,0,s)|0;if((x|0)!=0){D=x;i=d;return D|0}x=(c[s+16>>2]|0)>>>16&31;if((x|0)==3){n=q+4|0;c[n>>2]=0;c[q>>2]=0;p=c[t>>2]|0;mc[c[(c[p>>2]|0)+28>>2]&63](p,q);p=(c[l>>2]&2031616|0)==196608;do{if(p?(c[j+16>>2]&2031616|0)==196608:0){s=c[n>>2]|0;r=5400;p=c[q>>2]|0;while(1){if(!(p>>>0<s>>>0)){v=23;break}if((a[p]|0)==(a[r]|0)){r=r+1|0;p=p+1|0}else{break}}if((v|0)==23?(a[r]|0)==0:0){p=5416;break}p=g?5440:5472}else{v=25}}while(0);if((v|0)==25){p=p?5496:5520}v=p+(Tt(p|0)|0)|0;c[u>>2]=p;c[u+4>>2]=v;v=b+3232|0;p=Zc(c[c[c[(c[v>>2]|0)+8>>2]>>2]>>2]|0,u)|0;if((p|0)==0){p=0}else{p=c[p>>2]|0}c[t>>2]=p;c[b+3296>>2]=rc[c[(c[p>>2]|0)+24>>2]&63](p,0)|0;p=b+12|0;c[b+(c[p>>2]<<2)+416>>2]=0;t=c[p>>2]|0;c[p>>2]=t+1;c[b+(t<<2)+16>>2]=0;t=b+3304|0;r=c[t>>2]|0;if((r|0)!=0){c[r>>2]=(c[r>>2]|0)+1}z=c[p>>2]|0;c[b+(z<<2)+416>>2]=0;r=c[p>>2]|0;c[p>>2]=r+1;c[b+(r<<2)+16>>2]=0;r=c[t>>2]|0;if((r|0)!=0){c[r>>2]=(c[r>>2]|0)+1}r=c[p>>2]|0;s=r+ -1|0;c[b+(r<<2)+416>>2]=0;D=c[p>>2]|0;c[p>>2]=D+1;c[b+(D<<2)+16>>2]=0;p=c[t>>2]|0;if((p|0)!=0){c[p>>2]=(c[p>>2]|0)+1}p=Ce(b)|0;c[f+3264>>2]=0;c[f+3260>>2]=0;D=c[v>>2]|0;u=b+8|0;C=c[u>>2]|0;B=c[b+4>>2]|0;y=f+3236|0;c[y>>2]=0;v=f+3240|0;c[v>>2]=0;t=f+3244|0;c[t>>2]=0;w=f+12|0;c[w>>2]=0;c[f+1216>>2]=0;c[f+2420>>2]=0;x=f+3304|0;c[x>>2]=0;c[f+3232>>2]=D;D=c[D+8>>2]|0;c[f+3228>>2]=D;c[f+4>>2]=B;c[f+8>>2]=C;a[f+3308|0]=0;C=c[D+4>>2]|0;c[f+3276>>2]=C;c[f+3272>>2]=c[C>>2];c[f+3268>>2]=c[C+12>>2];D=c[D+8>>2]|0;c[f+3288>>2]=D;c[f+3284>>2]=c[D>>2];c[f+3280>>2]=c[D+12>>2];c[f+2424>>2]=0;c[f+3300>>2]=-1;Yt(f+2428|0,0,800)|0;Yt(f+1220|0,0,1200)|0;if((z|0)>0){z=p+4+(z+ -1<<2)|0}else{z=0}c[y>>2]=z;xe(f,q)|0;if((c[l>>2]&2031616|0)==196608){k=rc[c[(c[k>>2]|0)+24>>2]&63](k,0)|0}c[f+(c[w>>2]<<2)+416>>2]=k;k=c[w>>2]|0;c[w>>2]=k+1;c[f+(k<<2)+16>>2]=0;k=c[x>>2]|0;if((k|0)!=0){c[k>>2]=(c[k>>2]|0)+1}if((c[j+16>>2]&2031616|0)==196608){j=rc[c[(c[j>>2]|0)+24>>2]&63](j,0)|0}c[f+(c[w>>2]<<2)+416>>2]=j;j=c[w>>2]|0;c[w>>2]=j+1;c[f+(j<<2)+16>>2]=0;j=c[x>>2]|0;if((j|0)!=0){c[j>>2]=(c[j>>2]|0)+1}if((c[h+16>>2]&2031616|0)==196608){h=rc[c[(c[h>>2]|0)+24>>2]&63](h,0)|0}c[f+(c[w>>2]<<2)+416>>2]=h;h=c[w>>2]|0;c[w>>2]=h+1;c[f+(h<<2)+16>>2]=0;h=c[x>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}Ce(f)|0;c[e>>2]=5096;c[e+4>>2]=5104;xe(f,e)|0;Ce(f)|0;h=b+3240|0;c[h>>2]=(c[h>>2]|0)+(c[v>>2]|0);j=b+3244|0;c[j>>2]=(c[j>>2]|0)+(c[t>>2]|0);if(g){k=c[q>>2]|0;g=(c[n>>2]|0)-k|0;n=(g|0)<255?g:255;g=o+256|0;c[g>>2]=o+n;Wt(o|0,k|0,n|0)|0;a[c[g>>2]|0]=0;k=c[g>>2]|0;n=k+11|0;l=o+255|0;D=n>>>0>l>>>0?l:n;Wt(k|0,5544,D-k|0)|0;c[g>>2]=D;a[D]=0;D=o+(Tt(o|0)|0)|0;c[m>>2]=o;c[m+4>>2]=D;if((r|0)>0){g=p+4+(s<<2)|0}else{g=0}c[y>>2]=g;xe(f,m)|0;if((p|0)==1){g=0}else{g=c[p+16>>2]|0}c[f+(c[w>>2]<<2)+416>>2]=0;D=c[w>>2]|0;c[w>>2]=D+1;c[f+(D<<2)+16>>2]=g;g=c[x>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}Ce(f)|0;c[e>>2]=5096;c[e+4>>2]=5104;xe(f,e)|0;Ce(f)|0;c[h>>2]=(c[h>>2]|0)+(c[v>>2]|0);c[j>>2]=(c[j>>2]|0)+(c[t>>2]|0)}if((c[(c[u>>2]|0)+4>>2]|0)==0){D=p;i=d;return D|0}c[b+3236>>2]=p+24;D=p;i=d;return D|0}else if((x|0)==1){m=r+4|0;c[m>>2]=0;c[r>>2]=0;u=c[t>>2]|0;mc[c[(c[u>>2]|0)+28>>2]&63](u,r);c[w>>2]=5560;c[w+4>>2]=5575;u=b+3232|0;o=Zc(c[c[c[(c[u>>2]|0)+8>>2]>>2]>>2]|0,w)|0;if((o|0)==0){o=0}else{o=c[o>>2]|0}c[t>>2]=o;c[b+3296>>2]=rc[c[(c[o>>2]|0)+24>>2]&63](o,0)|0;v=b+12|0;c[b+(c[v>>2]<<2)+416>>2]=0;o=c[v>>2]|0;c[v>>2]=o+1;c[b+(o<<2)+16>>2]=0;o=b+3304|0;q=c[o>>2]|0;if((q|0)!=0){c[q>>2]=(c[q>>2]|0)+1}A=c[v>>2]|0;c[b+(A<<2)+416>>2]=0;q=c[v>>2]|0;c[v>>2]=q+1;c[b+(q<<2)+16>>2]=0;q=c[o>>2]|0;if((q|0)!=0){c[q>>2]=(c[q>>2]|0)+1}q=c[v>>2]|0;t=q+ -1|0;c[b+(q<<2)+416>>2]=0;D=c[v>>2]|0;c[v>>2]=D+1;c[b+(D<<2)+16>>2]=0;o=c[o>>2]|0;if((o|0)!=0){c[o>>2]=(c[o>>2]|0)+1}o=Ce(b)|0;c[n+3264>>2]=0;c[n+3260>>2]=0;D=c[u>>2]|0;w=b+8|0;C=c[w>>2]|0;B=c[b+4>>2]|0;z=n+3236|0;c[z>>2]=0;v=n+3240|0;c[v>>2]=0;u=n+3244|0;c[u>>2]=0;y=n+12|0;c[y>>2]=0;c[n+1216>>2]=0;c[n+2420>>2]=0;x=n+3304|0;c[x>>2]=0;c[n+3232>>2]=D;D=c[D+8>>2]|0;c[n+3228>>2]=D;c[n+4>>2]=B;c[n+8>>2]=C;a[n+3308|0]=0;C=c[D+4>>2]|0;c[n+3276>>2]=C;c[n+3272>>2]=c[C>>2];c[n+3268>>2]=c[C+12>>2];D=c[D+8>>2]|0;c[n+3288>>2]=D;c[n+3284>>2]=c[D>>2];c[n+3280>>2]=c[D+12>>2];c[n+2424>>2]=0;c[n+3300>>2]=-1;Yt(n+2428|0,0,800)|0;Yt(n+1220|0,0,1200)|0;if((A|0)>0){A=o+4+(A+ -1<<2)|0}else{A=0}c[z>>2]=A;if((nc[c[(c[s>>2]|0)+16>>2]&1023](s)|0)>0){B=j+16|0;C=h+16|0;A=0;do{xe(n,r)|0;if((c[l>>2]&2031616|0)==65536){D=rc[c[(c[k>>2]|0)+24>>2]&63](k,A)|0;E=nc[c[(c[D>>2]|0)+40>>2]&1023](D)|0;c[n+(c[y>>2]<<2)+416>>2]=D;D=c[y>>2]|0;c[y>>2]=D+1;c[n+(D<<2)+16>>2]=E;D=c[x>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}else{c[n+(c[y>>2]<<2)+416>>2]=k;D=c[y>>2]|0;c[y>>2]=D+1;c[n+(D<<2)+16>>2]=0;D=c[x>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}if((c[B>>2]&2031616|0)==65536){D=rc[c[(c[j>>2]|0)+24>>2]&63](j,A)|0;E=nc[c[(c[D>>2]|0)+40>>2]&1023](D)|0;c[n+(c[y>>2]<<2)+416>>2]=D;D=c[y>>2]|0;c[y>>2]=D+1;c[n+(D<<2)+16>>2]=E;D=c[x>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}else{c[n+(c[y>>2]<<2)+416>>2]=j;D=c[y>>2]|0;c[y>>2]=D+1;c[n+(D<<2)+16>>2]=0;D=c[x>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}if((c[C>>2]&2031616|0)==65536){D=rc[c[(c[h>>2]|0)+24>>2]&63](h,A)|0;E=nc[c[(c[D>>2]|0)+40>>2]&1023](D)|0;c[n+(c[y>>2]<<2)+416>>2]=D;D=c[y>>2]|0;c[y>>2]=D+1;c[n+(D<<2)+16>>2]=E;D=c[x>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}else{c[n+(c[y>>2]<<2)+416>>2]=h;D=c[y>>2]|0;c[y>>2]=D+1;c[n+(D<<2)+16>>2]=0;D=c[x>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}Ce(n)|0;A=A+1|0}while((A|0)<(nc[c[(c[s>>2]|0)+16>>2]&1023](s)|0))}c[e>>2]=5096;c[e+4>>2]=5104;xe(n,e)|0;Ce(n)|0;j=b+3240|0;c[j>>2]=(c[j>>2]|0)+(c[v>>2]|0);h=b+3244|0;c[h>>2]=(c[h>>2]|0)+(c[u>>2]|0);if(g){k=c[r>>2]|0;g=(c[m>>2]|0)-k|0;m=(g|0)<255?g:255;g=f+256|0;c[g>>2]=f+m;Wt(f|0,k|0,m|0)|0;a[c[g>>2]|0]=0;m=c[g>>2]|0;k=m+11|0;l=f+255|0;E=k>>>0>l>>>0?l:k;Wt(m|0,5544,E-m|0)|0;c[g>>2]=E;a[E]=0;E=f+(Tt(f|0)|0)|0;c[p>>2]=f;c[p+4>>2]=E;if((q|0)>0){f=o+4+(t<<2)|0}else{f=0}c[z>>2]=f;xe(n,p)|0;if((o|0)==1){f=0}else{f=c[o+16>>2]|0}c[n+(c[y>>2]<<2)+416>>2]=0;E=c[y>>2]|0;c[y>>2]=E+1;c[n+(E<<2)+16>>2]=f;f=c[x>>2]|0;if((f|0)!=0){c[f>>2]=(c[f>>2]|0)+1}Ce(n)|0;c[e>>2]=5096;c[e+4>>2]=5104;xe(n,e)|0;Ce(n)|0;c[j>>2]=(c[j>>2]|0)+(c[v>>2]|0);c[h>>2]=(c[h>>2]|0)+(c[u>>2]|0)}if((c[(c[w>>2]|0)+4>>2]|0)==0){E=o;i=d;return E|0}c[b+3236>>2]=o+24;E=o;i=d;return E|0}else{E=0;i=d;return E|0}return 0}function of(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+6672|0;e=d;g=d+3320|0;t=d+3344|0;s=d+3336|0;m=d+3352|0;k=d+8|0;n=d+3328|0;j=d+3360|0;h=c[b+416>>2]|0;f=c[b+420>>2]|0;o=g+4|0;c[o>>2]=0;c[g>>2]=0;l=b+3292|0;q=c[l>>2]|0;mc[c[(c[q>>2]|0)+28>>2]&63](q,g);q=c[o>>2]|0;u=5576;r=c[g>>2]|0;while(1){if(!(r>>>0<q>>>0)){p=4;break}if((a[r]|0)==(a[u]|0)){u=u+1|0;r=r+1|0}else{q=0;r=h;break}}if((p|0)==4){if((a[u]|0)==0){u=t+4|0;c[u>>2]=0;c[t>>2]=0;mc[c[(c[f>>2]|0)+28>>2]&63](f,t);if(((c[u>>2]|0)-(c[t>>2]|0)|0)>0?dd(h,f)|0:0){c[s>>2]=5056;c[s+4>>2]=5060;e=Zc(c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0,s)|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}c[l>>2]=e;c[b+3296>>2]=rc[c[(c[e>>2]|0)+24>>2]&63](e,0)|0;u=Ce(b)|0;i=d;return u|0}else{q=h;r=f}}else{q=0;r=h}}p=mf(b,q,r)|0;if((p|0)!=0){u=p;i=d;return u|0}p=(c[f+16>>2]|0)>>>16&31;if((p|0)==3){c[m>>2]=5584;c[m+4>>2]=5597;n=b+3232|0;j=Zc(c[c[c[(c[n>>2]|0)+8>>2]>>2]>>2]|0,m)|0;if((j|0)==0){j=0}else{j=c[j>>2]|0}c[l>>2]=j;c[b+3296>>2]=rc[c[(c[j>>2]|0)+24>>2]&63](j,0)|0;l=b+12|0;c[b+(c[l>>2]<<2)+416>>2]=0;j=c[l>>2]|0;c[l>>2]=j+1;c[b+(j<<2)+16>>2]=0;j=c[b+3304>>2]|0;if((j|0)!=0){c[j>>2]=(c[j>>2]|0)+1}q=c[l>>2]|0;j=Ce(b)|0;c[k+3264>>2]=0;c[k+3260>>2]=0;u=c[n>>2]|0;n=b+8|0;t=c[n>>2]|0;s=c[b+4>>2]|0;r=k+3236|0;c[r>>2]=0;l=k+3240|0;c[l>>2]=0;m=k+3244|0;c[m>>2]=0;o=k+12|0;c[o>>2]=0;c[k+1216>>2]=0;c[k+2420>>2]=0;p=k+3304|0;c[p>>2]=0;c[k+3232>>2]=u;u=c[u+8>>2]|0;c[k+3228>>2]=u;c[k+4>>2]=s;c[k+8>>2]=t;a[k+3308|0]=0;t=c[u+4>>2]|0;c[k+3276>>2]=t;c[k+3272>>2]=c[t>>2];c[k+3268>>2]=c[t+12>>2];u=c[u+8>>2]|0;c[k+3288>>2]=u;c[k+3284>>2]=c[u>>2];c[k+3280>>2]=c[u+12>>2];c[k+2424>>2]=0;c[k+3300>>2]=-1;Yt(k+2428|0,0,800)|0;Yt(k+1220|0,0,1200)|0;if((q|0)>0){q=j+4+(q+ -1<<2)|0}else{q=0}c[r>>2]=q;xe(k,g)|0;g=rc[c[(c[h>>2]|0)+24>>2]&63](h,0)|0;c[k+(c[o>>2]<<2)+416>>2]=g;g=c[o>>2]|0;c[o>>2]=g+1;c[k+(g<<2)+16>>2]=0;g=c[p>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}f=rc[c[(c[f>>2]|0)+24>>2]&63](f,0)|0;c[k+(c[o>>2]<<2)+416>>2]=f;f=c[o>>2]|0;c[o>>2]=f+1;c[k+(f<<2)+16>>2]=0;f=c[p>>2]|0;if((f|0)!=0){c[f>>2]=(c[f>>2]|0)+1}Ce(k)|0;c[e>>2]=5096;c[e+4>>2]=5104;xe(k,e)|0;Ce(k)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[l>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[m>>2]|0);if((c[(c[n>>2]|0)+4>>2]|0)==0){u=j;i=d;return u|0}c[b+3236>>2]=j+12;u=j;i=d;return u|0}else if((p|0)==1){c[n>>2]=5600;c[n+4>>2]=5614;m=b+3232|0;k=Zc(c[c[c[(c[m>>2]|0)+8>>2]>>2]>>2]|0,n)|0;if((k|0)==0){k=0}else{k=c[k>>2]|0}c[l>>2]=k;c[b+3296>>2]=rc[c[(c[k>>2]|0)+24>>2]&63](k,0)|0;k=b+12|0;c[b+(c[k>>2]<<2)+416>>2]=0;l=c[k>>2]|0;c[k>>2]=l+1;c[b+(l<<2)+16>>2]=0;l=c[b+3304>>2]|0;if((l|0)!=0){c[l>>2]=(c[l>>2]|0)+1}q=c[k>>2]|0;k=Ce(b)|0;c[j+3264>>2]=0;c[j+3260>>2]=0;u=c[m>>2]|0;o=b+8|0;t=c[o>>2]|0;s=c[b+4>>2]|0;r=j+3236|0;c[r>>2]=0;m=j+3240|0;c[m>>2]=0;n=j+3244|0;c[n>>2]=0;p=j+12|0;c[p>>2]=0;c[j+1216>>2]=0;c[j+2420>>2]=0;l=j+3304|0;c[l>>2]=0;c[j+3232>>2]=u;u=c[u+8>>2]|0;c[j+3228>>2]=u;c[j+4>>2]=s;c[j+8>>2]=t;a[j+3308|0]=0;t=c[u+4>>2]|0;c[j+3276>>2]=t;c[j+3272>>2]=c[t>>2];c[j+3268>>2]=c[t+12>>2];u=c[u+8>>2]|0;c[j+3288>>2]=u;c[j+3284>>2]=c[u>>2];c[j+3280>>2]=c[u+12>>2];c[j+2424>>2]=0;c[j+3300>>2]=-1;Yt(j+2428|0,0,800)|0;Yt(j+1220|0,0,1200)|0;if((q|0)>0){q=k+4+(q+ -1<<2)|0}else{q=0}c[r>>2]=q;if((nc[c[(c[f>>2]|0)+16>>2]&1023](f)|0)>0){q=h+16|0;r=0;do{xe(j,g)|0;s=rc[c[(c[f>>2]|0)+24>>2]&63](f,r)|0;if((c[q>>2]&2031616|0)==65536){t=rc[c[(c[h>>2]|0)+24>>2]&63](h,r)|0;u=nc[c[(c[t>>2]|0)+40>>2]&1023](t)|0}else{u=0;t=h}c[j+(c[p>>2]<<2)+416>>2]=t;t=c[p>>2]|0;c[p>>2]=t+1;c[j+(t<<2)+16>>2]=u;t=c[l>>2]|0;if((t|0)!=0){c[t>>2]=(c[t>>2]|0)+1}u=nc[c[(c[s>>2]|0)+40>>2]&1023](s)|0;c[j+(c[p>>2]<<2)+416>>2]=s;s=c[p>>2]|0;c[p>>2]=s+1;c[j+(s<<2)+16>>2]=u;s=c[l>>2]|0;if((s|0)!=0){c[s>>2]=(c[s>>2]|0)+1}Ce(j)|0;r=r+1|0}while((r|0)<(nc[c[(c[f>>2]|0)+16>>2]&1023](f)|0))}c[e>>2]=5096;c[e+4>>2]=5104;xe(j,e)|0;Ce(j)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[m>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[n>>2]|0);if((c[(c[o>>2]|0)+4>>2]|0)==0){u=k;i=d;return u|0}c[b+3236>>2]=k+12;u=k;i=d;return u|0}else{u=c[g>>2]|0;c[e>>2]=(c[o>>2]|0)-u;c[e+4>>2]=u;bb(5616,e|0)|0;u=0;i=d;return u|0}return 0}function pf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+3344|0;e=d+3336|0;h=d+3328|0;g=d+3320|0;l=d+3312|0;f=d;c[h>>2]=5680;c[h+4>>2]=5701;k=b+3232|0;h=Zc(c[c[c[(c[k>>2]|0)+8>>2]>>2]>>2]|0,h)|0;if((h|0)==0){h=0}else{h=c[h>>2]|0}c[b+3292>>2]=h;c[b+3296>>2]=rc[c[(c[h>>2]|0)+24>>2]&63](h,0)|0;h=c[b+420>>2]|0;c[g>>2]=5704;c[g+4>>2]=5708;m=b+12|0;c[b+(c[m>>2]<<2)+416>>2]=0;j=c[m>>2]|0;c[m>>2]=j+1;c[b+(j<<2)+16>>2]=0;j=c[b+3304>>2]|0;if((j|0)!=0){c[j>>2]=(c[j>>2]|0)+1}q=c[m>>2]|0;j=Ce(b)|0;c[l>>2]=1536;c[l+4>>2]=1543;l=Zc(c[c[c[(c[k>>2]|0)+8>>2]>>2]>>2]|0,l)|0;if((l|0)==0){m=0}else{m=c[l>>2]|0}c[f+3264>>2]=0;c[f+3260>>2]=0;s=c[k>>2]|0;k=b+8|0;t=c[k>>2]|0;u=c[b+4>>2]|0;r=f+3236|0;c[r>>2]=0;l=f+3240|0;c[l>>2]=0;n=f+3244|0;c[n>>2]=0;p=f+12|0;c[p>>2]=0;c[f+1216>>2]=0;c[f+2420>>2]=0;o=f+3304|0;c[o>>2]=0;c[f+3232>>2]=s;s=c[s+8>>2]|0;c[f+3228>>2]=s;c[f+4>>2]=u;c[f+8>>2]=t;a[f+3308|0]=0;t=c[s+4>>2]|0;c[f+3276>>2]=t;c[f+3272>>2]=c[t>>2];c[f+3268>>2]=c[t+12>>2];s=c[s+8>>2]|0;c[f+3288>>2]=s;c[f+3284>>2]=c[s>>2];c[f+3280>>2]=c[s+12>>2];c[f+2424>>2]=0;c[f+3300>>2]=-1;Yt(f+2428|0,0,800)|0;Yt(f+1220|0,0,1200)|0;if((q|0)>0){q=j+4+(q+ -1<<2)|0}else{q=0}c[r>>2]=q;xe(f,g)|0;c[f+(c[p>>2]<<2)+416>>2]=h;g=c[p>>2]|0;c[p>>2]=g+1;c[f+(g<<2)+16>>2]=0;g=c[o>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}u=c[b+20>>2]|0;c[f+(c[p>>2]<<2)+416>>2]=h;g=c[p>>2]|0;c[p>>2]=g+1;c[f+(g<<2)+16>>2]=u;g=c[o>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}c[f+(c[p>>2]<<2)+416>>2]=m;g=c[p>>2]|0;c[p>>2]=g+1;c[f+(g<<2)+16>>2]=0;g=c[o>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}Ce(f)|0;c[e>>2]=5096;c[e+4>>2]=5104;xe(f,e)|0;Ce(f)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[l>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[n>>2]|0);if((c[(c[k>>2]|0)+4>>2]|0)==0){i=d;return j|0}c[b+3236>>2]=j+20;i=d;return j|0}function qf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+3344|0;e=f+3336|0;o=f+3328|0;h=f+3320|0;l=f+3312|0;d=f;j=c[b+416>>2]|0;g=c[b+420>>2]|0;n=o+4|0;c[n>>2]=0;c[o>>2]=0;k=b+3292|0;p=c[k>>2]|0;mc[c[(c[p>>2]|0)+28>>2]&63](p,o);o=c[o>>2]|0;n=c[n>>2]|0;p=5712;m=o;while(1){if(!(m>>>0<n>>>0)){m=4;break}if((a[m]|0)==(a[p]|0)){p=p+1|0;m=m+1|0}else{q=5736;p=o;m=5;break}}if((m|0)==4){if((a[p]|0)==0){n=0;q=5728;m=14}else{q=5736;p=o;m=5}}do{if((m|0)==5){while(1){m=0;if(!(p>>>0<n>>>0)){m=7;break}if((a[p]|0)==(a[q]|0)){q=q+1|0;p=p+1|0;m=5}else{p=5768;q=o;break}}if((m|0)==7){if((a[q]|0)==0){n=1;q=5760;m=14;break}else{p=5768;q=o}}while(1){if(!(q>>>0<n>>>0)){m=10;break}if((a[q]|0)==(a[p]|0)){p=p+1|0;q=q+1|0}else{p=5792;break}}if((m|0)==10){if((a[p]|0)==0){n=1;q=5784;m=14;break}else{p=5792}}while(1){if(!(o>>>0<n>>>0)){m=15;break}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{m=13;break}}if((m|0)==13){r=h+4|0;c[r>>2]=0;c[h>>2]=0;o=h;p=0;n=0;q=0;break}else if((m|0)==15){q=(a[p]|0)==0;r=h+4|0;c[r>>2]=0;c[h>>2]=0;if(q){o=h;n=0;q=5808;m=16;break}else{o=h;p=0;n=0;q=0;break}}}}while(0);if((m|0)==14){r=h+4|0;c[r>>2]=0;c[h>>2]=0;o=h;m=16}if((m|0)==16){p=q+(Tt(q|0)|0)|0}c[o>>2]=q;c[r>>2]=p;c[l>>2]=5816;c[l+4>>2]=5832;m=b+3232|0;l=Zc(c[c[c[(c[m>>2]|0)+8>>2]>>2]>>2]|0,l)|0;if((l|0)==0){l=0}else{l=c[l>>2]|0}c[k>>2]=l;c[b+3296>>2]=rc[c[(c[l>>2]|0)+24>>2]&63](l,0)|0;k=b+12|0;c[b+(c[k>>2]<<2)+416>>2]=0;l=c[k>>2]|0;c[k>>2]=l+1;c[b+(l<<2)+16>>2]=n;n=b+3304|0;l=c[n>>2]|0;if((l|0)!=0){c[l>>2]=(c[l>>2]|0)+1}c[b+(c[k>>2]<<2)+416>>2]=0;l=c[k>>2]|0;c[k>>2]=l+1;c[b+(l<<2)+16>>2]=0;l=c[n>>2]|0;if((l|0)!=0){c[l>>2]=(c[l>>2]|0)+1}q=c[k>>2]|0;k=Ce(b)|0;c[d+3264>>2]=0;c[d+3260>>2]=0;s=c[m>>2]|0;l=b+8|0;t=c[l>>2]|0;u=c[b+4>>2]|0;r=d+3236|0;c[r>>2]=0;n=d+3240|0;c[n>>2]=0;m=d+3244|0;c[m>>2]=0;o=d+12|0;c[o>>2]=0;c[d+1216>>2]=0;c[d+2420>>2]=0;p=d+3304|0;c[p>>2]=0;c[d+3232>>2]=s;s=c[s+8>>2]|0;c[d+3228>>2]=s;c[d+4>>2]=u;c[d+8>>2]=t;a[d+3308|0]=0;t=c[s+4>>2]|0;c[d+3276>>2]=t;c[d+3272>>2]=c[t>>2];c[d+3268>>2]=c[t+12>>2];s=c[s+8>>2]|0;c[d+3288>>2]=s;c[d+3284>>2]=c[s>>2];c[d+3280>>2]=c[s+12>>2];c[d+2424>>2]=0;c[d+3300>>2]=-1;Yt(d+2428|0,0,800)|0;Yt(d+1220|0,0,1200)|0;if((q|0)>0){q=k+4+(q+ -1<<2)|0}else{q=0}c[r>>2]=q;xe(d,h)|0;h=rc[c[(c[j>>2]|0)+24>>2]&63](j,0)|0;c[d+(c[o>>2]<<2)+416>>2]=h;h=c[o>>2]|0;c[o>>2]=h+1;c[d+(h<<2)+16>>2]=0;h=c[p>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}j=c[b+20>>2]|0;c[d+(c[o>>2]<<2)+416>>2]=g;h=c[o>>2]|0;c[o>>2]=h+1;c[d+(h<<2)+16>>2]=j;h=c[p>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}c[d+(c[o>>2]<<2)+416>>2]=g;g=c[o>>2]|0;c[o>>2]=g+1;c[d+(g<<2)+16>>2]=j;g=c[p>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}Ce(d)|0;c[e>>2]=5096;c[e+4>>2]=5104;xe(d,e)|0;Ce(d)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[n>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[m>>2]|0);if((c[(c[l>>2]|0)+4>>2]|0)==0){i=f;return k|0}c[b+3236>>2]=k+16;i=f;return k|0}function rf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+16|0;e=d;c[e>>2]=5840;c[e+4>>2]=5864;e=Zc(c[c[c[(c[a+3232>>2]|0)+8>>2]>>2]>>2]|0,e)|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}c[a+3292>>2]=e;c[a+3296>>2]=rc[c[(c[e>>2]|0)+24>>2]&63](e,0)|0;e=a+12|0;g=c[e>>2]|0;j=c[a+420>>2]|0;if((g|0)<=2){k=Ce(a)|0;i=d;return k|0}f=a+3304|0;h=2;do{k=a+(h<<2)+416|0;if(dd(j,c[k>>2]|0)|0){l=c[a+(h<<2)+16>>2]|0;c[a+(c[e>>2]<<2)+416>>2]=0;k=c[e>>2]|0;c[e>>2]=k+1;c[a+(k<<2)+16>>2]=l;k=c[f>>2]|0;if((k|0)!=0){c[k>>2]=(c[k>>2]|0)+1}}else{l=rc[c[(c[j>>2]|0)+24>>2]&63](j,0)|0;if(dd(l,c[k>>2]|0)|0?(c[a+(c[e>>2]<<2)+416>>2]=0,b=c[e>>2]|0,c[e>>2]=b+1,c[a+(b<<2)+16>>2]=0,b=c[f>>2]|0,(b|0)!=0):0){c[b>>2]=(c[b>>2]|0)+1}}h=h+1|0}while((h|0)!=(g|0));l=Ce(a)|0;i=d;return l|0}function sf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;d=a+4|0;p=(c[d>>2]|0)+ -1|0;k=(p|0)/2|0;b=c[c[a+8>>2]>>2]|0;f=b+8|0;u=c[(c[f>>2]|0)+16>>2]&255;q=b+(u<<2)+16|0;if((u|0)==0){o=1}else{o=1;s=b+16|0;while(1){r=s+4|0;o=ba(c[s>>2]|0,o)|0;if(r>>>0<q>>>0){s=r}else{break}}}p=(p|0)>1;if(p){q=0;r=0;do{if((c[a+(q+k<<2)+12>>2]|0)!=0?(n=c[c[a+(q<<2)+12>>2]>>2]|0,u=c[(c[n+8>>2]|0)+16>>2]&255,m=n+(u<<2)+16|0,(u|0)!=0):0){u=1;t=n+16|0;while(1){s=t+4|0;u=ba(c[t>>2]|0,u)|0;if(s>>>0<m>>>0){t=s}else{break}}}else{u=1}r=u+r|0;q=q+1|0}while((q|0)<(k|0))}else{r=0}a:do{if(Vc(b,r)|0?(h=c[b+12>>2]|0,j=h+12|0,g=c[j>>2]|0,p):0){n=ba(g,o)|0;o=h+16|0;p=0;m=c[b>>2]|0;b:while(1){do{if((c[a+(p+k<<2)+12>>2]|0)==0){q=g;t=jc[c[(c[h>>2]|0)+52>>2]&63](h,c[a+(p<<2)+12>>2]|0,m)|0;l=28}else{q=c[c[a+(p<<2)+12>>2]>>2]|0;if((q|0)==(b|0)){if((p|0)==0){q=n;break}else{l=26;break b}}u=c[(c[q+8>>2]|0)+16>>2]&255;r=q+(u<<2)+16|0;if((u|0)==0){l=1}else{l=1;t=q+16|0;while(1){s=t+4|0;l=ba(c[t>>2]|0,l)|0;if(s>>>0<r>>>0){t=s}else{break}}}t=c[q>>2]|0;r=c[j>>2]|0;s=ba(r,l)|0;c:do{if((c[o>>2]&2097152|0)==0){q=t+s|0;if((s|0)>0){s=m;u=t;while(1){t=jc[c[(c[h>>2]|0)+52>>2]&63](h,u,s)|0;if((t|0)!=0){break c}u=u+r|0;if(u>>>0<q>>>0){s=s+r|0}else{t=0;break}}}else{t=0}}else{Xt(m|0,t|0,s|0)|0;t=0}}while(0);q=ba(l,g)|0;l=28}}while(0);if((l|0)==28){l=0;if((t|0)!=0){break}}p=p+1|0;if((p|0)>=(k|0)){break a}else{m=m+q|0}}if((l|0)==26){Ia(30376)|0;u=c[1102]|0;c[u+20>>2]=0;c[u+16>>2]=0;u=4392;i=e;return u|0}g=c[f>>2]|0;u=c[g+16>>2]&255;h=b+(u<<2)+16|0;if((u|0)==0){k=1}else{k=1;l=b+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}g=c[(nc[c[(c[g>>2]|0)+36>>2]&1023](g)|0)>>2]|0;if((!((c[(c[f>>2]|0)+16>>2]&255|0)!=1|(g|0)>-1)?!((g|0)>0|(k|0)==0):0)?Wd(b,0,k,0,1)|0:0){c[b+16>>2]=0}}}while(0);u=a+8+(c[d>>2]<<2)|0;i=e;return u|0}function tf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;Ue(b,5048,589,6888,2);Ue(b,5064,590,6888,2);Ue(b,5080,591,6888,2);c[g>>2]=6920;c[g+4>>2]=6932;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=6936;c[f+8>>2]=6956;c[f+12>>2]=6936;c[f+16>>2]=1;a[f+20|0]=0;j=ce(f)|0;c[2]=b;Sc(b,g,j)|0;c[g>>2]=6960;c[g+4>>2]=6971;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=6976;c[f+8>>2]=6990;c[f+12>>2]=6976;c[f+16>>2]=1;a[f+20|0]=0;f=ce(f)|0;c[2]=b;Sc(b,g,f)|0;c[2]=e;Ue(b,5056,592,6992,4);Ue(b,5072,592,6992,4);Ue(b,5288,593,7008,2);Ue(b,5296,594,7032,2);Ue(b,5304,595,7056,2);Ue(b,5312,596,7080,2);Ue(b,5320,597,7104,2);Ue(b,5328,598,7136,2);Ue(b,5336,599,7168,2);Ue(b,5344,600,7216,2);Ue(b,5360,601,7248,2);Ue(b,7304,602,6992,4);Ue(b,5784,603,7312,4);Ue(b,5808,603,7312,4);Ue(b,7328,603,7312,4);Ue(b,7336,603,7312,4);Ue(b,7344,603,7312,4);Ue(b,5704,603,7312,4);Ue(b,7352,603,7312,4);Ue(b,7360,603,7312,4);Ue(b,7368,603,7312,4);Ue(b,7376,603,7312,4);Ue(b,7384,603,7312,4);Ue(b,5728,603,7312,4);Ue(b,7392,603,7312,4);Ue(b,5760,603,7312,4);Ue(b,7400,603,7312,4);Ue(b,7408,603,7312,4);Ue(b,7416,603,7312,4);Ue(b,7432,603,7312,4);Ue(b,5400,603,7448,4);Ue(b,5408,603,7312,4);Ue(b,7472,602,6992,4);Ue(b,7480,602,6992,4);Ue(b,7488,602,6992,4);Ue(b,7496,602,6992,4);Ue(b,7504,602,6992,4);Ue(b,7520,602,6992,4);Ue(b,7528,602,6992,4);Ue(b,7536,602,6992,4);Ue(b,7544,602,6992,4);Ue(b,7552,602,6992,4);Ue(b,7568,603,7312,4);Ue(b,7576,602,6992,4);Ue(b,7584,602,6992,4);Ue(b,7600,602,6992,4);Ue(b,7608,603,7312,4);Ue(b,7616,602,6992,4);Ue(b,7624,602,6992,4);Ue(b,7640,602,6992,4);Ue(b,7648,602,6992,4);Ue(b,7656,602,6992,4);Ue(b,7672,602,6992,4);Ue(b,5576,602,6992,4);Ue(b,7680,602,6992,4);Ue(b,7688,604,7704,4);Ue(b,5680,605,7752,2);Ue(b,7800,606,7824,4);Ue(b,5840,607,7824,2);Ue(b,5712,608,7872,4);Ue(b,5736,608,7872,4);Ue(b,5768,608,7872,4);Ue(b,5792,608,7872,4);Ue(b,5816,609,7904,2);Ue(b,5560,610,7944,2);Ue(b,5600,611,7984,2);Ue(b,8008,612,8024,2);Ue(b,8048,613,8024,2);Ue(b,8064,614,8024,2);Ue(b,8080,615,8024,2);Ue(b,8096,616,8024,2);Ue(b,8112,617,8024,2);Ue(b,5472,618,8128,2);Ue(b,5440,619,8168,2);Ue(b,5416,620,8216,2);Ue(b,5520,621,8256,2);Ue(b,5496,622,8296,2);Ue(b,5584,623,8336,2);i=d;return}function uf(a){a=a|0;return}function vf(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function wf(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[c[b>>2]>>2]&63](b,a);i=d;return}function xf(a){a=a|0;return 0}function yf(a){a=a|0;return 0}function zf(a,b){a=a|0;b=b|0;return 0}function Af(a,b){a=a|0;b=b|0;return 0}function Bf(a,b){a=a|0;b=b|0;c[b>>2]=0;c[b+4>>2]=0;return}function Cf(a,b){a=a|0;b=b|0;c[b>>2]=0;c[b+4>>2]=0;return}function Df(a){a=a|0;return 0}function Ef(a){a=a|0;return 0}function Ff(a,b){a=a|0;b=b|0;return 0}function Gf(a){a=a|0;return c[a+12>>2]<<3|0}function Hf(a){a=a|0;return}function If(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Jf(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+12>>2]&63](b,a);i=d;return}function Kf(a){a=a|0;return}function Lf(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Mf(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+20>>2]&63](b,a);i=d;return}function Nf(a){a=a|0;return}function Of(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Pf(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+24>>2]&63](b,a);i=d;return}function Qf(a){a=a|0;return 0}function Rf(a){a=a|0;return 1}function Sf(a,b){a=a|0;b=b|0;var d=0;d=i;if((c[a+16>>2]&255|0)!=0){b=0;i=d;return b|0}a=c[a+24>>2]|0;b=rc[c[(c[a>>2]|0)+20>>2]&63](a,b)|0;i=d;return b|0}function Tf(a,b){a=a|0;b=b|0;if((b|0)==0){a=c[a+24>>2]|0}else{a=0}return a|0}function Uf(a,b){a=a|0;b=b|0;c[b>>2]=4272;c[b+4>>2]=4277;return}function Vf(a){a=a|0;return a+32|0}function Wf(a){a=a|0;var b=0;b=i;a=c[a+24>>2]|0;a=nc[c[(c[a>>2]|0)+60>>2]&1023](a)|0;i=b;return a|0}function Xf(a){a=a|0;return}function Yf(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Zf(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+40>>2]&63](b,a);i=d;return}function _f(a){a=a|0;return c[a+24>>2]|0}function $f(a){a=a|0;var b=0;b=i;a=c[a+24>>2]|0;a=nc[c[(c[a>>2]|0)+16>>2]&1023](a)|0;i=b;return a|0}function ag(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=rc[c[(c[a>>2]|0)+20>>2]&63](a,b)|0;i=d;return a|0}function bg(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=rc[c[(c[a>>2]|0)+24>>2]&63](a,b)|0;i=d;return a|0}function cg(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;mc[c[(c[a>>2]|0)+28>>2]&63](a,b);i=d;return}function dg(a){a=a|0;var b=0;b=i;a=c[a+24>>2]|0;a=nc[c[(c[a>>2]|0)+36>>2]&1023](a)|0;i=b;return a|0}function eg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;a=c[a+24>>2]|0;a=jc[c[(c[a>>2]|0)+52>>2]&63](a,b,d)|0;i=e;return a|0}function fg(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=rc[c[(c[a>>2]|0)+56>>2]&63](a,b)|0;i=d;return a|0}function gg(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=rc[c[(c[a>>2]|0)+44>>2]&63](a,b)|0;i=d;return a|0}function hg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=c[a+24>>2]|0;f=jc[c[(c[f>>2]|0)+48>>2]&63](f,b,(d|0)==0?a:d)|0;i=e;return f|0}function ig(a){a=a|0;return}function jg(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function kg(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+28>>2]&63](b,a);i=d;return}function lg(a,b){a=a|0;b=b|0;var d=0;d=a+(c[a+32>>2]|0)+36|0;c[b>>2]=a+36;c[b+4>>2]=d;return}function mg(a){a=a|0;return c[a+28>>2]|0}function ng(a){a=a|0;return}function og(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function pg(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+32>>2]&63](b,a);i=d;return}function qg(a,b){a=a|0;b=b|0;var d=0;d=a+(c[a+28>>2]|0)+32|0;c[b>>2]=a+32;c[b+4>>2]=d;return}function rg(a,b){a=a|0;b=b|0;c[b>>2]=0;c[b+4>>2]=0;return}function sg(a){a=a|0;return}function tg(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function ug(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+4>>2]&63](b,a);i=d;return}function vg(a){a=a|0;return c[a+24>>2]|0}function wg(a){a=a|0;return}function xg(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function yg(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+8>>2]&63](b,a);i=d;return}function zg(a,b,c){a=a|0;b=b|0;c=c|0;return 0}function Ag(a){a=a|0;return c[a+24>>2]|0}function Bg(a){a=a|0;return}function Cg(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Dg(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+16>>2]&63](b,a);i=d;return}function Eg(a,b,c){a=a|0;b=b|0;c=c|0;return 0}function Fg(a,b,c){a=a|0;b=b|0;c=c|0;return 1}function Gg(a,b){a=a|0;b=b|0;return 1}function Hg(a){a=a|0;return}function Ig(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Jg(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+36>>2]&63](b,a);i=d;return}function Kg(a){a=a|0;return 1}function Lg(a,b){a=a|0;b=b|0;return 0}function Mg(a,b){a=a|0;b=b|0;if((b|0)==0){a=c[a+24>>2]|0}else{a=0}return a|0}function Ng(a){a=a|0;return}function Og(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Pg(a,b){a=a|0;b=b|0;return a+28|0}function Qg(a,b,d){a=a|0;b=b|0;d=d|0;c[b>>2]=c[a+28>>2];return 0}function Rg(a){a=a|0;return}function Sg(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function Tg(a,b){a=a|0;b=b|0;var d=0;d=i;mc[c[(c[b>>2]|0)+36>>2]&63](b,c[a+24>>2]|0);i=d;return}function Ug(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=c[a+28>>2]|0;f=pc[c[c[f>>2]>>2]&31](f,c[a+24>>2]|0,b,(d|0)==0?a:d)|0;i=e;return f|0}function Vg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=c[a+28>>2]|0;a=pc[c[(c[f>>2]|0)+4>>2]&31](f,c[a+24>>2]|0,b,d)|0;i=e;return a|0}function Wg(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=c[a+28>>2]|0;a=jc[c[(c[e>>2]|0)+8>>2]&63](e,c[a+24>>2]|0,b)|0;i=d;return a|0}function Xg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;f=e+4|0;c[f>>2]=0;c[e>>2]=0;if((b|0)==0){g=0}else{g=b+(Tt(b|0)|0)|0}c[e>>2]=b;c[f>>2]=g;e=Zc(c[c[1102]>>2]|0,e)|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}c[a>>2]=0;if((e|0)==0){i=d;return}jc[c[(c[e>>2]|0)+48>>2]&63](e,a,0)|0;i=d;return}function Yg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;j=c[b+4>>2]|0;if((j|0)==0){r=b+4|0;c[d>>2]=r;i=f;return r|0}h=c[e+4>>2]|0;e=c[e>>2]|0;b=h-e|0;a:do{if(e>>>0<h>>>0){while(1){l=c[j+20>>2]|0;m=c[j+16>>2]|0;k=l-m|0;r=(b|0)==(k|0);do{if(r){o=e;n=m;while(1){p=a[o]|0;q=a[n]|0;if(!(p<<24>>24==q<<24>>24)){g=6;break}o=o+1|0;if(!(o>>>0<h>>>0)){break}else{n=n+1|0}}if((g|0)==6?(g=0,(p&255)<(q&255)):0){g=7;break}if(r){if(m>>>0<l>>>0){n=e}else{g=27;break a}while(1){p=a[m]|0;o=a[n]|0;if(!(p<<24>>24==o<<24>>24)){break}m=m+1|0;if(m>>>0<l>>>0){n=n+1|0}else{g=27;break a}}if(!((p&255)<(o&255))){g=27;break a}}else{g=10}}else{if((b|0)<(k|0)){g=7}else{g=10}}}while(0);if((g|0)==7){g=0;k=c[j>>2]|0;if((k|0)==0){e=j;b=j;g=19;break}else{j=k;continue}}else if((g|0)==10?(g=0,(k|0)>=(b|0)):0){g=27;break a}l=j+4|0;k=c[l>>2]|0;if((k|0)==0){g=26;break}else{j=k}}}else{b:while(1){g=c[j+20>>2]|0;l=c[j+16>>2]|0;h=g-l|0;do{if((b|0)==(h|0)){if(l>>>0<g>>>0){h=e}else{g=27;break a}while(1){k=a[l]|0;m=a[h]|0;if(!(k<<24>>24==m<<24>>24)){break}l=l+1|0;if(l>>>0<g>>>0){h=h+1|0}else{g=27;break a}}if(!((k&255)<(m&255))){g=27;break a}}else{if((b|0)<(h|0)){g=c[j>>2]|0;if((g|0)==0){e=j;b=j;g=19;break a}else{j=g;continue b}}else{if((h|0)<(b|0)){break}else{g=27;break a}}}}while(0);l=j+4|0;g=c[l>>2]|0;if((g|0)==0){g=26;break}else{j=g}}}}while(0);if((g|0)==19){c[d>>2]=b;r=e;i=f;return r|0}else if((g|0)==26){c[d>>2]=j;r=l;i=f;return r|0}else if((g|0)==27){c[d>>2]=j;r=d;i=f;return r|0}return 0}function Zg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;l=(d|0)==(b|0);a[d+12|0]=l&1;if(l){i=e;return}while(1){j=d+8|0;f=c[j>>2]|0;k=f+12|0;if((a[k]|0)!=0){b=37;break}g=f+8|0;h=c[g>>2]|0;l=c[h>>2]|0;if((l|0)==(f|0)){j=c[h+4>>2]|0;if((j|0)==0){b=7;break}j=j+12|0;if((a[j]|0)!=0){b=7;break}a[k]=1;a[h+12|0]=(h|0)==(b|0)|0;a[j]=1}else{if((l|0)==0){b=24;break}l=l+12|0;if((a[l]|0)!=0){b=24;break}a[k]=1;a[h+12|0]=(h|0)==(b|0)|0;a[l]=1}if((h|0)==(b|0)){b=37;break}else{d=h}}if((b|0)==7){if((c[f>>2]|0)==(d|0)){d=f}else{l=f+4|0;d=c[l>>2]|0;j=c[d>>2]|0;c[l>>2]=j;if((j|0)!=0){c[j+8>>2]=f;h=c[g>>2]|0}j=d+8|0;c[j>>2]=h;h=c[g>>2]|0;if((c[h>>2]|0)==(f|0)){c[h>>2]=d}else{c[h+4>>2]=d}c[d>>2]=f;c[g>>2]=d;f=c[j>>2]|0;h=f;f=c[f>>2]|0}a[d+12|0]=1;a[h+12|0]=0;g=f+4|0;d=c[g>>2]|0;c[h>>2]=d;if((d|0)!=0){c[d+8>>2]=h}d=h+8|0;c[f+8>>2]=c[d>>2];j=c[d>>2]|0;if((c[j>>2]|0)==(h|0)){c[j>>2]=f}else{c[j+4>>2]=f}c[g>>2]=h;c[d>>2]=f;i=e;return}else if((b|0)==24){if((c[f>>2]|0)==(d|0)){b=d+4|0;k=c[b>>2]|0;c[f>>2]=k;if((k|0)!=0){c[k+8>>2]=f;h=c[g>>2]|0}c[j>>2]=h;h=c[g>>2]|0;if((c[h>>2]|0)==(f|0)){c[h>>2]=d}else{c[h+4>>2]=d}c[b>>2]=f;c[g>>2]=d;f=d;h=c[j>>2]|0}a[f+12|0]=1;a[h+12|0]=0;l=h+4|0;f=c[l>>2]|0;g=c[f>>2]|0;c[l>>2]=g;if((g|0)!=0){c[g+8>>2]=h}g=h+8|0;c[f+8>>2]=c[g>>2];d=c[g>>2]|0;if((c[d>>2]|0)==(h|0)){c[d>>2]=f}else{c[d+4>>2]=f}c[f>>2]=h;c[g>>2]=f;i=e;return}else if((b|0)==37){i=e;return}}function _g(a,b){a=a|0;b=b|0;var d=0;d=i;if((b|0)==0){i=d;return}else{_g(a,c[b>>2]|0);_g(a,c[b+4>>2]|0);Ct(b);i=d;return}}function $g(a){a=a|0;var b=0,d=0;b=i;d=c[a+4>>2]|0;jc[c[(c[d>>2]|0)+48>>2]&63](d,c[a+8>>2]|0,0)|0;i=b;return a+12|0}function ah(a){a=a|0;var b=0,d=0;b=i;d=c[a+4>>2]|0;rc[c[(c[d>>2]|0)+56>>2]&63](d,c[a+8>>2]|0)|0;i=b;return a+12|0}function bh(a){a=a|0;var b=0;b=i;Yt(c[a+8>>2]|0,0,c[(c[a+4>>2]|0)+12>>2]|0)|0;i=b;return a+12|0}function ch(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]|0;return b+12|0}function dh(a){a=a|0;b[c[a+8>>2]>>1]=b[c[a+4>>2]>>1]|0;return a+12|0}function eh(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function fh(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function gh(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+8>>2]|0;e=c[a+4>>2]|0;c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+12|0}function hh(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+8>>2]|0;e=c[a+4>>2]|0;c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];c[d+16>>2]=c[e+16>>2];c[d+20>>2]=c[e+20>>2];c[d+24>>2]=c[e+24>>2];c[d+28>>2]=c[e+28>>2];i=b;return a+12|0}function ih(a){a=a|0;var b=0;b=i;Xt(c[a+8>>2]|0,c[a+4>>2]|0,c[a+12>>2]|0)|0;i=b;return a+16|0}function jh(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+4>>2]|0;e=c[(c[d>>2]|0)+8>>2]|0;jc[c[(c[e>>2]|0)+52>>2]&63](e,d,c[a+8>>2]|0)|0;i=b;return a+12|0}function kh(a){a=a|0;var b=0,d=0;b=i;d=c[a+12>>2]|0;jc[c[(c[d>>2]|0)+52>>2]&63](d,c[a+4>>2]|0,c[a+8>>2]|0)|0;i=b;return a+16|0}function lh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+16|0;d=e;g=c[c[b+4>>2]>>2]|0;f=c[b+12>>2]|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}h=(f|0)<0?0:f;f=b+24|0;m=c[(c[g+8>>2]|0)+16>>2]&255;k=g+(m<<2)+16|0;if((m|0)==0){j=1}else{j=1;m=g+16|0;while(1){l=m+4|0;j=ba(c[m>>2]|0,j)|0;if(l>>>0<k>>>0){m=l}else{break}}}l=c[(c[g+12>>2]|0)+12>>2]|0;a[d]=0;a:do{if((h|0)<(j|0)){k=f+4|0;c[k>>2]=(c[g>>2]|0)+(ba(l,h)|0);c[f+12>>2]=d;while(1){nc[c[f>>2]&1023](f)|0;if((a[d]|0)!=0){break}c[k>>2]=(c[k>>2]|0)+l;h=h+1|0;if((h|0)>=(j|0)){break a}}c[c[b+16>>2]>>2]=h;m=b+20|0;m=c[m>>2]|0;i=e;return m|0}}while(0);c[c[b+16>>2]>>2]=-1;m=b+20|0;m=c[m>>2]|0;i=e;return m|0}function mh(d){d=d|0;var e=0,f=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;j=c[c[d+4>>2]>>2]|0;e=d+20|0;k=a[d+12|0]|0;o=c[(c[j+8>>2]|0)+16>>2]&255;l=j+(o<<2)+16|0;if((o|0)==0){m=1}else{m=1;o=j+16|0;while(1){n=o+4|0;m=ba(c[o>>2]|0,m)|0;if(n>>>0<l>>>0){o=n}else{break}}}n=c[j+12>>2]|0;l=c[n+12>>2]|0;n=(c[n+16>>2]|0)>>>16&31;do{if((n|0)==6){a[c[e+12>>2]|0]=k}else if((n|0)==12){k=k<<24>>24!=0;if((l|0)==4){g[c[e+12>>2]>>2]=+(k&1);break}else{h[c[e+12>>2]>>3]=+(k&1);break}}else{if((l|0)==1){a[c[e+12>>2]|0]=k;break}else if((l|0)==2){b[c[e+12>>2]>>1]=k&255;break}else if((l|0)==8){o=c[e+12>>2]|0;c[o>>2]=k&255;c[o+4>>2]=0;break}else if((l|0)==4){c[c[e+12>>2]>>2]=k&255;break}else{break}}}while(0);k=e+4|0;c[k>>2]=c[j>>2];if((m|0)<=0){o=d+16|0;o=c[o>>2]|0;i=f;return o|0}do{m=m+ -1|0;nc[c[e>>2]&1023](e)|0;c[k>>2]=(c[k>>2]|0)+l}while((m|0)>0);o=d+16|0;o=c[o>>2]|0;i=f;return o|0}function nh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;f=a+16|0;d=c[f>>2]|0;e=c[a+20>>2]|0;g=c[d>>2]|0;h=(g|0)==(c[1100]|0);if((e|0)==0){if(h){k=a+24|0;k=c[k>>2]|0;i=b;return k|0}e=a+4|0;f=a+8|0;h=a+12|0;do{l=d+4|0;c[l>>2]=(c[l>>2]|0)+(c[e>>2]|0);j=d+8|0;c[j>>2]=(c[j>>2]|0)+(c[f>>2]|0);k=d+12|0;c[k>>2]=(c[k>>2]|0)+(c[h>>2]|0);d=nc[g&1023](d)|0;c[l>>2]=(c[l>>2]|0)+(0-(c[e>>2]|0));c[j>>2]=(c[j>>2]|0)+(0-(c[f>>2]|0));c[k>>2]=(c[k>>2]|0)+(0-(c[h>>2]|0));g=c[d>>2]|0}while((g|0)!=(c[1100]|0));l=a+24|0;l=c[l>>2]|0;i=b;return l|0}if(!h){h=a+4|0;j=a+8|0;k=a+12|0;do{l=d+4|0;c[l>>2]=(c[l>>2]|0)+(c[h>>2]|0);l=d+8|0;c[l>>2]=(c[l>>2]|0)+(c[j>>2]|0);c[d+12>>2]=c[k>>2];if((g|0)==619|(g|0)==610){d=c[d+24>>2]|0}else{d=d+16|0}g=c[d>>2]|0}while((g|0)!=(c[1100]|0))}nc[c[e>>2]&1023](e)|0;g=c[f>>2]|0;f=c[g>>2]|0;if((f|0)==(c[1100]|0)){l=a+24|0;l=c[l>>2]|0;i=b;return l|0}d=a+4|0;e=a+8|0;do{l=g+4|0;c[l>>2]=(c[l>>2]|0)+(0-(c[d>>2]|0));l=g+8|0;c[l>>2]=(c[l>>2]|0)+(0-(c[e>>2]|0));if((f|0)==619|(f|0)==610){g=c[g+24>>2]|0}else{g=g+16|0}f=c[g>>2]|0}while((f|0)!=(c[1100]|0));l=a+24|0;l=c[l>>2]|0;i=b;return l|0}function oh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;g=a+16|0;if((c[g>>2]|0)==(c[1100]|0)){g=a+12|0;g=c[g>>2]|0;i=b;return g|0}d=a+4|0;e=a+8|0;f=g;while(1){j=g+4|0;c[j>>2]=(c[j>>2]|0)+(c[d>>2]|0);h=g+8|0;c[h>>2]=(c[h>>2]|0)+(c[e>>2]|0);g=nc[c[f>>2]&1023](g)|0;c[j>>2]=(c[j>>2]|0)+(0-(c[d>>2]|0));c[h>>2]=(c[h>>2]|0)+(0-(c[e>>2]|0));if((c[g>>2]|0)==(c[1100]|0)){break}else{f=g}}j=a+12|0;j=c[j>>2]|0;i=b;return j|0}function ph(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;g=c[h+4>>2]|0;j=c[h+8>>2]|0;a:do{if((g|0)!=0){if((j|0)==0){j=0;e=4}else{while(1){g=c[h>>2]|0;if((g|0)==(c[1100]|0)){break a}h=nc[g&1023](h)|0;if((a[f]|0)==0){e=0;break}}i=d;return e|0}}else{e=4}}while(0);if((e|0)==4){a[f]=(g|0)==(j|0)|0}j=b;i=d;return j|0}function qh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;g=c[h+4>>2]|0;j=c[h+8>>2]|0;a:do{if((g|0)!=0){if((j|0)==0){j=0;e=4}else{while(1){g=c[h>>2]|0;if((g|0)==(c[1100]|0)){break a}h=nc[g&1023](h)|0;if((a[f]|0)!=0){e=0;break}}i=d;return e|0}}else{e=4}}while(0);if((e|0)==4){a[f]=(g|0)!=(j|0)|0}j=b;i=d;return j|0}function rh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+8>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}if((c[h+4>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1100]|0)){g=h;while(1){j=nc[c[h>>2]&1023](g)|0;if((a[f]|0)!=0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;nc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)!=0){break}if((c[j>>2]|0)==(c[1100]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=0;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function sh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+4>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}if((c[h+8>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1100]|0)){g=h;while(1){j=nc[c[h>>2]&1023](g)|0;if((a[f]|0)!=0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;nc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)!=0){break}if((c[j>>2]|0)==(c[1100]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=0;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function th(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+4>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}if((c[h+8>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1100]|0)){g=h;while(1){j=nc[c[h>>2]&1023](g)|0;if((a[f]|0)==0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;nc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)==0){break}if((c[j>>2]|0)==(c[1100]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=1;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function uh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+8>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}if((c[h+4>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1100]|0)){g=h;while(1){j=nc[c[h>>2]&1023](g)|0;if((a[f]|0)==0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;nc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)==0){break}if((c[j>>2]|0)==(c[1100]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=1;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function vh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;h=c[c[a+4>>2]>>2]|0;l=c[c[a+8>>2]>>2]|0;j=c[c[a+12>>2]>>2]|0;f=c[a+16>>2]|0;g=c[(c[h+12>>2]|0)+12>>2]|0;d=c[(c[l+12>>2]|0)+12>>2]|0;k=j+12|0;e=c[(c[k>>2]|0)+12>>2]|0;s=c[(c[h+8>>2]|0)+16>>2]&255;n=h+(s<<2)+16|0;if((s|0)==0){m=1}else{m=1;p=h+16|0;while(1){o=p+4|0;m=ba(c[p>>2]|0,m)|0;if(o>>>0<n>>>0){p=o}else{break}}}s=c[(c[l+8>>2]|0)+16>>2]&255;o=l+(s<<2)+16|0;if((s|0)==0){q=1}else{q=1;p=l+16|0;while(1){n=p+4|0;q=ba(c[p>>2]|0,q)|0;if(n>>>0<o>>>0){p=n}else{break}}}n=(m|0)<(q|0)?m:q;m=j+8|0;o=c[m>>2]|0;s=c[o+16>>2]&255;q=j+(s<<2)+16|0;if((s|0)==0){r=1}else{r=1;s=j+16|0;while(1){p=s+4|0;r=ba(c[s>>2]|0,r)|0;if(p>>>0<q>>>0){s=p}else{break}}}o=c[(nc[c[(c[o>>2]|0)+36>>2]&1023](o)|0)>>2]|0;if((!((c[(c[m>>2]|0)+16>>2]&255|0)!=1|(o|0)>-1)?!((o|0)!=-2147483648&(n|0)>(0-o|0)|(r|0)==(n|0)):0)?Wd(j,ba(c[(c[k>>2]|0)+12>>2]|0,n)|0,r,n,1)|0:0){c[j+16>>2]=n}l=c[l>>2]|0;r=c[j>>2]|0;s=ba(n,e)|0;k=r+s|0;j=f+4|0;c[j>>2]=c[h>>2];h=f+8|0;c[h>>2]=l;l=f+12|0;c[l>>2]=r;if((s|0)<=0){s=a+24|0;s=c[s>>2]|0;i=b;return s|0}do{nc[c[f>>2]&1023](f)|0;c[j>>2]=(c[j>>2]|0)+g;c[h>>2]=(c[h>>2]|0)+d;s=(c[l>>2]|0)+e|0;c[l>>2]=s}while(s>>>0<k>>>0);s=a+24|0;s=c[s>>2]|0;i=b;return s|0}function wh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;j=c[c[a+4>>2]>>2]|0;k=c[c[a+8>>2]>>2]|0;h=c[a+12>>2]|0;g=c[a+16>>2]|0;e=c[a+20>>2]|0;b=c[(c[j+12>>2]|0)+12>>2]|0;d=c[(c[k+12>>2]|0)+12>>2]|0;p=c[(c[j+8>>2]|0)+16>>2]&255;n=j+(p<<2)+16|0;if((p|0)==0){l=1}else{l=1;o=j+16|0;while(1){m=o+4|0;l=ba(c[o>>2]|0,l)|0;if(m>>>0<n>>>0){o=m}else{break}}}p=c[(c[k+8>>2]|0)+16>>2]&255;o=k+(p<<2)+16|0;if((p|0)==0){n=1}else{n=1;p=k+16|0;while(1){m=p+4|0;n=ba(c[p>>2]|0,n)|0;if(m>>>0<o>>>0){p=m}else{break}}}m=(l|0)<(n|0);o=m?l:n;p=c[k>>2]|0;k=g+4|0;c[k>>2]=c[j>>2];j=g+8|0;c[j>>2]=p;c[g+12>>2]=h;if((n|l|0)==0){c[k>>2]=0;c[j>>2]=0;nc[c[e>>2]&1023](e)|0;p=a+24|0;p=c[p>>2]|0;i=f;return p|0}a:do{if((o|0)>0){while(1){o=o+ -1|0;if((nc[c[e>>2]&1023](e)|0)==0){break}c[k>>2]=(c[k>>2]|0)+b;c[j>>2]=(c[j>>2]|0)+d;if((o|0)<=0){break a}}p=a+24|0;p=c[p>>2]|0;i=f;return p|0}}while(0);if((l|0)==(n|0)){p=a+24|0;p=c[p>>2]|0;i=f;return p|0}if(m){c[k>>2]=0}else{c[j>>2]=0}nc[c[e>>2]&1023](e)|0;p=a+24|0;p=c[p>>2]|0;i=f;return p|0}function xh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;b=i;h=c[c[a+4>>2]>>2]|0;k=c[c[a+8>>2]>>2]|0;j=c[c[a+12>>2]>>2]|0;f=c[a+16>>2]|0;g=c[(c[h+12>>2]|0)+12>>2]|0;n=k+12|0;d=c[(c[n>>2]|0)+12>>2]|0;l=j+12|0;e=c[(c[l>>2]|0)+12>>2]|0;t=c[(c[h+8>>2]|0)+16>>2]&255;p=h+(t<<2)+16|0;if((t|0)==0){m=1}else{m=1;q=h+16|0;while(1){o=q+4|0;m=ba(c[q>>2]|0,m)|0;if(o>>>0<p>>>0){q=o}else{break}}}o=k+8|0;p=c[o>>2]|0;t=c[p+16>>2]&255;r=k+(t<<2)+16|0;if((t|0)==0){s=1}else{s=1;t=k+16|0;while(1){q=t+4|0;s=ba(c[t>>2]|0,s)|0;if(q>>>0<r>>>0){t=q}else{break}}}p=c[(nc[c[(c[p>>2]|0)+36>>2]&1023](p)|0)>>2]|0;if((!((c[(c[o>>2]|0)+16>>2]&255|0)!=1|(p|0)>-1)?!((p|0)!=-2147483648&(m|0)>(0-p|0)|(s|0)==(m|0)):0)?Wd(k,ba(c[(c[n>>2]|0)+12>>2]|0,m)|0,s,m,1)|0:0){c[k+16>>2]=m}n=j+8|0;o=c[n>>2]|0;t=c[o+16>>2]&255;q=j+(t<<2)+16|0;if((t|0)==0){s=1}else{s=1;r=j+16|0;while(1){p=r+4|0;s=ba(c[r>>2]|0,s)|0;if(p>>>0<q>>>0){r=p}else{break}}}o=c[(nc[c[(c[o>>2]|0)+36>>2]&1023](o)|0)>>2]|0;if((!((c[(c[n>>2]|0)+16>>2]&255|0)!=1|(o|0)>-1)?!((o|0)!=-2147483648&(m|0)>(0-o|0)|(s|0)==(m|0)):0)?Wd(j,ba(c[(c[l>>2]|0)+12>>2]|0,m)|0,s,m,1)|0:0){c[j+16>>2]=m}l=c[k>>2]|0;s=c[j>>2]|0;t=ba(m,e)|0;k=s+t|0;j=f+4|0;c[j>>2]=c[h>>2];h=f+8|0;c[h>>2]=l;l=f+12|0;c[l>>2]=s;if((t|0)<=0){t=a+24|0;t=c[t>>2]|0;i=b;return t|0}do{nc[c[f>>2]&1023](f)|0;c[j>>2]=(c[j>>2]|0)+g;c[h>>2]=(c[h>>2]|0)+d;t=(c[l>>2]|0)+e|0;c[l>>2]=t}while(t>>>0<k>>>0);t=a+24|0;t=c[t>>2]|0;i=b;return t|0}function yh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;b=c[a+16>>2]|0;g=c[c[a+8>>2]>>2]|0;h=c[c[a+12>>2]>>2]|0;d=c[(c[g+12>>2]|0)+12>>2]|0;j=h+12|0;e=c[(c[j>>2]|0)+12>>2]|0;q=c[(c[g+8>>2]|0)+16>>2]&255;k=g+(q<<2)+16|0;if((q|0)==0){l=1}else{l=1;n=g+16|0;while(1){m=n+4|0;l=ba(c[n>>2]|0,l)|0;if(m>>>0<k>>>0){n=m}else{break}}}k=h+8|0;m=c[k>>2]|0;q=c[m+16>>2]&255;n=h+(q<<2)+16|0;if((q|0)==0){p=1}else{p=1;q=h+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(nc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(l|0)>(0-m|0)|(p|0)==(l|0)):0)?Wd(h,ba(c[(c[j>>2]|0)+12>>2]|0,l)|0,p,l,1)|0:0){c[h+16>>2]=l}o=c[g>>2]|0;p=c[h>>2]|0;q=ba(l,e)|0;j=p+q|0;c[b+4>>2]=c[a+4>>2];g=b+8|0;c[g>>2]=o;h=b+12|0;c[h>>2]=p;if((q|0)<=0){q=a+24|0;q=c[q>>2]|0;i=f;return q|0}do{nc[c[b>>2]&1023](b)|0;c[g>>2]=(c[g>>2]|0)+d;q=(c[h>>2]|0)+e|0;c[h>>2]=q}while(q>>>0<j>>>0);q=a+24|0;q=c[q>>2]|0;i=f;return q|0}function zh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;b=c[a+16>>2]|0;g=c[c[a+4>>2]>>2]|0;h=c[c[a+12>>2]>>2]|0;d=c[(c[g+12>>2]|0)+12>>2]|0;j=h+12|0;e=c[(c[j>>2]|0)+12>>2]|0;q=c[(c[g+8>>2]|0)+16>>2]&255;k=g+(q<<2)+16|0;if((q|0)==0){l=1}else{l=1;n=g+16|0;while(1){m=n+4|0;l=ba(c[n>>2]|0,l)|0;if(m>>>0<k>>>0){n=m}else{break}}}k=h+8|0;m=c[k>>2]|0;q=c[m+16>>2]&255;n=h+(q<<2)+16|0;if((q|0)==0){p=1}else{p=1;q=h+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(nc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(l|0)>(0-m|0)|(p|0)==(l|0)):0)?Wd(h,ba(c[(c[j>>2]|0)+12>>2]|0,l)|0,p,l,1)|0:0){c[h+16>>2]=l}p=c[h>>2]|0;q=ba(l,e)|0;j=p+q|0;h=b+4|0;c[h>>2]=c[g>>2];c[b+8>>2]=c[a+8>>2];g=b+12|0;c[g>>2]=p;if((q|0)<=0){q=a+24|0;q=c[q>>2]|0;i=f;return q|0}do{nc[c[b>>2]&1023](b)|0;c[h>>2]=(c[h>>2]|0)+d;q=(c[g>>2]|0)+e|0;c[g>>2]=q}while(q>>>0<j>>>0);q=a+24|0;q=c[q>>2]|0;i=f;return q|0}function Ah(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;g=c[c[a+4>>2]>>2]|0;h=c[c[a+8>>2]>>2]|0;b=a+16|0;d=c[(c[g+12>>2]|0)+12>>2]|0;j=h+12|0;e=c[(c[j>>2]|0)+12>>2]|0;q=c[(c[g+8>>2]|0)+16>>2]&255;k=g+(q<<2)+16|0;if((q|0)==0){l=1}else{l=1;n=g+16|0;while(1){m=n+4|0;l=ba(c[n>>2]|0,l)|0;if(m>>>0<k>>>0){n=m}else{break}}}k=h+8|0;m=c[k>>2]|0;q=c[m+16>>2]&255;n=h+(q<<2)+16|0;if((q|0)==0){p=1}else{p=1;q=h+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(nc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(l|0)>(0-m|0)|(p|0)==(l|0)):0)?Wd(h,ba(c[(c[j>>2]|0)+12>>2]|0,l)|0,p,l,1)|0:0){c[h+16>>2]=l}p=c[h>>2]|0;q=ba(l,e)|0;j=p+q|0;h=b+4|0;c[h>>2]=c[g>>2];g=b+8|0;c[g>>2]=p;if((q|0)<=0){q=a+12|0;q=c[q>>2]|0;i=f;return q|0}do{nc[c[b>>2]&1023](b)|0;c[h>>2]=(c[h>>2]|0)+d;q=(c[g>>2]|0)+e|0;c[g>>2]=q}while(q>>>0<j>>>0);q=a+12|0;q=c[q>>2]|0;i=f;return q|0}function Bh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;b=i;i=i+16|0;e=b+4|0;d=b;o=c[c[a+4>>2]>>2]|0;c[e>>2]=o;f=c[a+8>>2]|0;if((f|0)!=0?(k=c[f>>2]|0,(k|0)!=0):0){u=c[(c[k+8>>2]|0)+16>>2]&255;h=k+(u<<2)+16|0;if((u|0)==0){l=1;f=1}else{f=1;j=k+16|0;while(1){g=j+4|0;f=ba(c[j>>2]|0,f)|0;if(g>>>0<h>>>0){j=g}else{l=1;break}}}}else{k=0;l=0;f=0}g=c[a+20>>2]|0;if((g|0)==0){p=0}else{p=c[g>>2]|0}c[d>>2]=p;g=c[a+24>>2]|0;if((g|0)==0){n=0}else{n=c[g>>2]|0}g=c[a+12>>2]|0;if((g|0)==0){h=0}else{h=c[g>>2]|0}g=c[a+16>>2]|0;if((g|0)==0){m=f}else{m=c[g>>2]|0}q=c[o+8>>2]|0;u=c[q+16>>2]&255;r=o+(u<<2)+16|0;if((u|0)==0){j=1}else{j=1;s=o+16|0;while(1){g=s+4|0;j=ba(c[s>>2]|0,j)|0;if(g>>>0<r>>>0){s=g}else{break}}}g=c[o+12>>2]|0;r=j-h|0;m=(m|0)<(r|0)?m:r;m=(m|0)<0?0:m;if((h|0)<0|(h|0)>(j|0)){if(!((p|0)==0|(o|0)==(p|0))){jc[c[(c[q>>2]|0)+52>>2]&63](q,e,d)|0}if((n|0)==0){u=a+28|0;i=b;return u|0}d=n+8|0;e=c[d>>2]|0;u=c[e+16>>2]&255;f=n+(u<<2)+16|0;if((u|0)==0){j=1}else{j=1;h=n+16|0;while(1){g=h+4|0;j=ba(c[h>>2]|0,j)|0;if(g>>>0<f>>>0){h=g}else{break}}}e=c[(nc[c[(c[e>>2]|0)+36>>2]&1023](e)|0)>>2]|0;if((c[(c[d>>2]|0)+16>>2]&255|0)!=1|(e|0)>-1){u=a+28|0;i=b;return u|0}if((e|0)>0|(j|0)==0){u=a+28|0;i=b;return u|0}if(!(Wd(n,0,j,0,1)|0)){u=a+28|0;i=b;return u|0}c[n+16>>2]=0;u=a+28|0;i=b;return u|0}o=f-m+j|0;a:do{if((n|0)!=0){p=n+8|0;q=c[p>>2]|0;u=c[q+16>>2]&255;s=n+(u<<2)+16|0;if((u|0)==0){u=1}else{u=1;t=n+16|0;while(1){r=t+4|0;u=ba(c[t>>2]|0,u)|0;if(r>>>0<s>>>0){t=r}else{break}}}q=c[(nc[c[(c[q>>2]|0)+36>>2]&1023](q)|0)>>2]|0;if((!((c[(c[p>>2]|0)+16>>2]&255|0)!=1|(q|0)>-1)?!((q|0)!=-2147483648&(m|0)>(0-q|0)|(u|0)==(m|0)):0)?Wd(n,ba(c[(c[n+12>>2]|0)+12>>2]|0,m)|0,u,m,1)|0:0){c[n+16>>2]=m}r=c[e>>2]|0;s=c[r>>2]|0;r=ba(c[(c[r+12>>2]|0)+12>>2]|0,h)|0;p=s+r|0;t=c[n>>2]|0;n=c[g+12>>2]|0;q=ba(n,m)|0;if((c[g+16>>2]&2097152|0)!=0){Xt(t|0,p|0,q|0)|0;break}r=s+(q+r)|0;if((q|0)>0){while(1){if((jc[c[(c[g>>2]|0)+52>>2]&63](g,p,t)|0)!=0){break a}p=p+n|0;if(!(p>>>0<r>>>0)){break}else{t=t+n|0}}}}}while(0);n=c[d>>2]|0;if((n|0)==0){u=a+28|0;i=b;return u|0}p=n+8|0;q=c[p>>2]|0;u=c[q+16>>2]&255;s=n+(u<<2)+16|0;if((u|0)==0){u=1}else{u=1;t=n+16|0;while(1){r=t+4|0;u=ba(c[t>>2]|0,u)|0;if(r>>>0<s>>>0){t=r}else{break}}}q=c[(nc[c[(c[q>>2]|0)+36>>2]&1023](q)|0)>>2]|0;if((!((c[(c[p>>2]|0)+16>>2]&255|0)!=1|(q|0)>-1)?!((q|0)!=-2147483648&(o|0)>(0-q|0)|(u|0)==(o|0)):0)?Wd(n,ba(c[(c[n+12>>2]|0)+12>>2]|0,o)|0,u,o,1)|0:0){c[n+16>>2]=o}r=c[c[e>>2]>>2]|0;s=c[c[d>>2]>>2]|0;n=g+16|0;o=g+12|0;q=c[o>>2]|0;t=ba(q,h)|0;b:do{if((c[n>>2]&2097152|0)==0){p=r+t|0;if((t|0)>0){while(1){if((jc[c[(c[g>>2]|0)+52>>2]&63](g,r,s)|0)!=0){break b}r=r+q|0;if(!(r>>>0<p>>>0)){break}else{s=s+q|0}}}}else{Xt(s|0,r|0,t|0)|0}}while(0);c:do{if(l){p=c[k>>2]|0;q=c[d>>2]|0;q=(c[q>>2]|0)+(ba(c[(c[q+12>>2]|0)+12>>2]|0,h)|0)|0;k=c[o>>2]|0;r=ba(k,f)|0;if((c[n>>2]&2097152|0)!=0){Xt(q|0,p|0,r|0)|0;break}l=p+r|0;if((r|0)>0){while(1){if((jc[c[(c[g>>2]|0)+52>>2]&63](g,p,q)|0)!=0){break c}p=p+k|0;if(!(p>>>0<l>>>0)){break}else{q=q+k|0}}}}}while(0);u=m+h|0;l=c[e>>2]|0;k=c[l>>2]|0;l=ba(c[(c[l+12>>2]|0)+12>>2]|0,u)|0;e=k+l|0;d=c[d>>2]|0;f=(c[d>>2]|0)+(ba(c[(c[d+12>>2]|0)+12>>2]|0,h+f|0)|0)|0;d=c[o>>2]|0;h=ba(d,j-u|0)|0;if((c[n>>2]&2097152|0)!=0){Xt(f|0,e|0,h|0)|0;u=a+28|0;i=b;return u|0}j=k+(h+l)|0;if((h|0)<=0){u=a+28|0;i=b;return u|0}while(1){if((jc[c[(c[g>>2]|0)+52>>2]&63](g,e,f)|0)!=0){d=65;break}e=e+d|0;if(e>>>0<j>>>0){f=f+d|0}else{d=65;break}}if((d|0)==65){u=a+28|0;i=b;return u|0}return 0}function Ch(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;d=i;e=c[b+4>>2]|0;if((e|0)==0){f=0}else{f=c[e>>2]|0}e=c[c[b+8>>2]>>2]|0;n=c[c[b+12>>2]>>2]|0;g=c[b+16>>2]|0;if((g|0)==0){g=0}else{g=c[g>>2]|0}h=c[b+20>>2]|0;if((h|0)==0){r=0}else{r=c[h>>2]|0}h=c[b+32>>2]|0;if((h|0)==0){j=0}else{j=(a[h]|0)!=0}h=c[b+36>>2]|0;if((h|0)==0){k=0}else{k=(a[h]|0)!=0}l=c[e>>2]|0;y=c[e+4>>2]|0;m=c[n>>2]|0;x=c[n+4>>2]|0;O=c[(c[e+8>>2]|0)+16>>2]&255;p=e+(O<<2)+16|0;if((O|0)==0){h=1}else{h=1;q=e+16|0;while(1){o=q+4|0;h=ba(c[q>>2]|0,h)|0;if(o>>>0<p>>>0){q=o}else{break}}}O=c[(c[n+8>>2]|0)+16>>2]&255;o=n+(O<<2)+16|0;if((O|0)==0){p=1}else{p=1;q=n+16|0;while(1){n=q+4|0;p=ba(c[q>>2]|0,p)|0;if(n>>>0<o>>>0){q=n}else{break}}}o=(g|0)!=0;if(o){O=c[(c[g+8>>2]|0)+16>>2]&255;n=g+(O<<2)+16|0;if((O|0)==0){s=1}else{s=1;t=g+16|0;while(1){q=t+4|0;s=ba(c[t>>2]|0,s)|0;if(q>>>0<n>>>0){t=q}else{break}}}}else{s=0}q=e+12|0;n=c[q>>2]|0;r=(r|0)<(h|0)?r:h;H=(r|0)<0?0:r;r=(f|0)!=0;t=f+8|0;a:do{if(r){u=c[t>>2]|0;O=c[u+16>>2]&255;v=f+(O<<2)+16|0;if((O|0)==0){z=1}else{z=1;A=f+16|0;while(1){w=A+4|0;z=ba(c[A>>2]|0,z)|0;if(w>>>0<v>>>0){A=w}else{break}}}u=c[(nc[c[(c[u>>2]|0)+36>>2]&1023](u)|0)>>2]|0;if((!((c[(c[t>>2]|0)+16>>2]&255|0)!=1|(u|0)>-1)?!((u|0)!=-2147483648&(h|0)>(0-u|0)|(z|0)==(h|0)):0)?Wd(f,ba(c[(c[f+12>>2]|0)+12>>2]|0,h)|0,z,h,1)|0:0){c[f+16>>2]=h}B=c[e>>2]|0;A=c[f>>2]|0;u=n+16|0;w=n+12|0;v=c[w>>2]|0;C=ba(v,H)|0;if((c[u>>2]&2097152|0)!=0){Xt(A|0,B|0,C|0)|0;v=f;break}z=B+C|0;if((C|0)>0){while(1){if((jc[c[(c[n>>2]|0)+52>>2]&63](n,B,A)|0)!=0){v=f;break a}B=B+v|0;if(B>>>0<z>>>0){A=A+v|0}else{v=f;break}}}else{v=f}}else{v=f;u=n+16|0;w=n+12|0}}while(0);y=y-l|0;E=x-m|0;z=m+E|0;A=(E|0)>0;B=s-p|0;x=f+12|0;D=f+16|0;C=(p|0)==0;F=0;G=H;b:do{if((G+E|0)>(y|0)){break}else{I=G}c:while(1){if(!A){break}M=l+I|0;K=m;d:while(1){J=K+1|0;K=a[K]|0;L=M+1|0;O=a[M]|0;N=K&255;M=O&255;do{if(!(K<<24>>24==O<<24>>24)){if((K&255)>64&k&(K&255)<91?(N+32|0)==(M|0):0){break}if(!((K&255)>96&k&(K&255)<123)){break d}if((N+ -32|0)!=(M|0)){break d}}}while(0);if(J>>>0<z>>>0){M=L;K=J}else{break c}}I=I+1|0;if((I+E|0)>(y|0)){break b}}if((I|0)==-1){break}e:do{if(r){J=c[t>>2]|0;M=c[J+16>>2]&255;K=f+(M<<2)+16|0;M=(M|0)==0;if(!M){N=1;O=D;while(1){L=O+4|0;N=ba(c[O>>2]|0,N)|0;if(L>>>0<K>>>0){O=L}else{break}}L=B+N|0;if(M){N=1}else{N=1;O=D;while(1){M=O+4|0;N=ba(c[O>>2]|0,N)|0;if(M>>>0<K>>>0){O=M}else{break}}}}else{L=B+1|0;N=1}J=c[(nc[c[(c[J>>2]|0)+36>>2]&1023](J)|0)>>2]|0;if((!((c[(c[t>>2]|0)+16>>2]&255|0)!=1|(J|0)>-1)?!((J|0)!=-2147483648&(L|0)>(0-J|0)|(N|0)==(L|0)):0)?Wd(f,ba(c[(c[x>>2]|0)+12>>2]|0,L)|0,N,L,1)|0:0){c[D>>2]=L}M=c[e>>2]|0;O=ba(c[(c[q>>2]|0)+12>>2]|0,G)|0;K=M+O|0;N=(c[v>>2]|0)+(ba(c[(c[x>>2]|0)+12>>2]|0,H)|0)|0;J=c[w>>2]|0;L=ba(J,I-G|0)|0;f:do{if((c[u>>2]&2097152|0)==0){M=M+(L+O)|0;if((L|0)>0){while(1){if((jc[c[(c[n>>2]|0)+52>>2]&63](n,K,N)|0)!=0){break f}K=K+J|0;if(!(K>>>0<M>>>0)){break}else{N=N+J|0}}}}else{Xt(N|0,K|0,L|0)|0}}while(0);if(o){L=c[g>>2]|0;M=(c[v>>2]|0)+(ba(c[(c[x>>2]|0)+12>>2]|0,H-G+I|0)|0)|0;K=c[w>>2]|0;N=ba(K,s)|0;if((c[u>>2]&2097152|0)!=0){Xt(M|0,L|0,N|0)|0;break}J=L+N|0;if((N|0)>0){while(1){if((jc[c[(c[n>>2]|0)+52>>2]&63](n,L,M)|0)!=0){break e}L=L+K|0;if(!(L>>>0<J>>>0)){break}else{M=M+K|0}}}}}}while(0);H=s-G+H+I|0;G=I+p|0;F=F+1|0;if(C){if(r){O=a[(c[e>>2]|0)+(ba(c[(c[q>>2]|0)+12>>2]|0,G)|0)|0]|0;a[(c[v>>2]|0)+(ba(c[(c[x>>2]|0)+12>>2]|0,H)|0)|0]=O}G=G+1|0;H=H+1|0}}while(j);g:do{if(r&(G|0)<(h|0)){f=c[e>>2]|0;g=ba(c[(c[q>>2]|0)+12>>2]|0,G)|0;e=f+g|0;k=(c[v>>2]|0)+(ba(c[(c[x>>2]|0)+12>>2]|0,H)|0)|0;j=c[w>>2]|0;h=ba(j,h-G|0)|0;if((c[u>>2]&2097152|0)!=0){Xt(k|0,e|0,h|0)|0;break}f=f+(h+g)|0;if((h|0)>0){while(1){if((jc[c[(c[n>>2]|0)+52>>2]&63](n,e,k)|0)!=0){break g}e=e+j|0;if(!(e>>>0<f>>>0)){break}else{k=k+j|0}}}}}while(0);e=c[b+24>>2]|0;if((e|0)!=0){c[e>>2]=F}e=c[b+28>>2]|0;if((e|0)==0){O=b+40|0;i=d;return O|0}c[e>>2]=(F|0)!=0?H:-1;O=b+40|0;i=d;return O|0}



function tc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function uc(){return i|0}function vc(a){a=a|0;i=a}function wc(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function xc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function yc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function zc(a){a=a|0;F=a}function Ac(a){a=a|0;G=a}function Bc(a){a=a|0;H=a}function Cc(a){a=a|0;I=a}function Dc(a){a=a|0;J=a}function Ec(a){a=a|0;K=a}function Fc(a){a=a|0;L=a}function Gc(a){a=a|0;M=a}function Hc(a){a=a|0;N=a}function Ic(a){a=a|0;O=a}function Jc(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;e=wt(96)|0;if((e|0)==0){e=0}else{g=e+0|0;f=g+96|0;do{a[g]=0;g=g+1|0}while((g|0)<(f|0));Mc(e,b)}f=e+52|0;b=(c[f>>2]|0)+96|0;c[f>>2]=b;f=e+44|0;c[f>>2]=(c[f>>2]|0)+1;f=e+56|0;if(!(b>>>0>(c[f>>2]|0)>>>0)){i=d;return e|0}c[f>>2]=b;i=d;return e|0}function Kc(a){a=a|0;var b=0;b=i;_g(a+16|0,c[a+20>>2]|0);_g(a+4|0,c[a+8>>2]|0);xt(a);i=b;return}function Lc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e;g=c[a+44>>2]|0;if((g|0)==1&d){if((c[a+52>>2]|0)==96){i=e;return}else{g=1}}h=c[a+52>>2]|0;d=c[a+88>>2]|0;c[f>>2]=g;c[f+4>>2]=h;c[f+8>>2]=d;c[f+12>>2]=b;bb(16,f|0)|0;i=e;return}function Mc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;c[b+8>>2]=0;c[b+12>>2]=0;c[b+4>>2]=b+8;c[b+20>>2]=0;c[b+24>>2]=0;c[b+16>>2]=b+20;h=b+64|0;g=b+44|0;e=b+60|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[h+0>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[h+16>>2]=0;c[h+20>>2]=0;c[h+24>>2]=0;c[e>>2]=16777216;e=b+40|0;c[e>>2]=0;c[b>>2]=d;c[b+28>>2]=8;h=c[2]|0;c[2]=b;d=wt(24)|0;if((d|0)==0){l=0;m=b+36|0;c[m>>2]=l;c[2]=h;i=f;return}l=b+56|0;k=b+52|0;m=d+0|0;j=m+24|0;do{a[m]=0;m=m+1|0}while((m|0)<(j|0));c[k>>2]=1;c[g>>2]=1;c[l>>2]=1;c[d>>2]=80;c[d+8>>2]=b;c[d+4>>2]=c[e>>2];c[e>>2]=d;c[d+12>>2]=0;a[d+20|0]=0;c[d+16>>2]=2097152;l=d;m=b+36|0;c[m>>2]=l;c[2]=h;i=f;return}function Nc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;f=a+52|0;g=c[f>>2]|0;if((g+b|0)>>>0>(c[a+60>>2]|0)>>>0){b=a+48|0;c[b>>2]=(c[b>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;b=0;i=d;return b|0}e=wt(b)|0;if((e|0)==0){b=0;i=d;return b|0}Yt(e|0,0,b|0)|0;g=g+1|0;c[f>>2]=g;b=a+44|0;c[b>>2]=(c[b>>2]|0)+1;a=a+56|0;if(!(g>>>0>(c[a>>2]|0)>>>0)){b=e;i=d;return b|0}c[a>>2]=g;b=e;i=d;return b|0}function Oc(a){a=a|0;Ba(a|0)|0;va()}function Pc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;if((b|0)==0){i=d;return}f=a+52|0;e=(c[f>>2]|0)+ -1|0;c[f>>2]=e;f=a+44|0;c[f>>2]=(c[f>>2]|0)+ -1;a=a+56|0;if(e>>>0>(c[a>>2]|0)>>>0){c[a>>2]=e}xt(b);i=d;return}function Qc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;e=c[2]|0;c[2]=b;g=b+40|0;j=c[g>>2]|0;if((j|0)!=0){while(1){h=c[j+4>>2]|0;if(!((a[j+20|0]&8)==0)){n=rc[c[(c[j>>2]|0)+44>>2]&63](j,4)|0;rc[c[(c[j>>2]|0)+56>>2]&63](j,n)|0}if((h|0)==0){break}else{j=h}}l=c[g>>2]|0;if((l|0)!=0){j=b+52|0;k=b+44|0;h=b+56|0;while(1){n=c[l+4>>2]|0;lc[c[c[l>>2]>>2]&127](l);if((l|0)!=0){m=(c[j>>2]|0)+ -1|0;c[j>>2]=m;c[k>>2]=(c[k>>2]|0)+ -1;if(m>>>0>(c[h>>2]|0)>>>0){c[h>>2]=m}xt(l)}if((n|0)==0){break}else{l=n}}}}c[g>>2]=0;n=b+4|0;_g(n,c[b+8>>2]|0);c[b+12>>2]=0;m=b+8|0;c[n>>2]=m;c[m>>2]=0;m=b+16|0;_g(m,c[b+20>>2]|0);c[b+24>>2]=0;n=b+20|0;c[m>>2]=n;c[n>>2]=0;if(d){c[2]=e;i=f;return}h=c[2]|0;j=h+52|0;k=c[j>>2]|0;if(!((k+24|0)>>>0>(c[h+60>>2]|0)>>>0)){d=wt(24)|0;if((d|0)==0){d=0}else{m=d+0|0;l=m+24|0;do{a[m]=0;m=m+1|0}while((m|0)<(l|0));k=k+1|0;c[j>>2]=k;n=h+44|0;c[n>>2]=(c[n>>2]|0)+1;h=h+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}c[d>>2]=80;c[d+8>>2]=b;c[d+4>>2]=c[g>>2];c[g>>2]=d;c[d+12>>2]=0;n=d+16|0;m=c[n>>2]|0;l=d+20|0;a[l]=a[l]&-8;c[n>>2]=m&-2113929216|2097152}}else{d=h+48|0;c[d>>2]=(c[d>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;d=0}c[b+36>>2]=d;c[2]=e;i=f;return}function Rc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;h=i;k=c[2]|0;j=k+52|0;l=c[j>>2]|0;if((l+32|0)>>>0>(c[k+60>>2]|0)>>>0){n=k+48|0;c[n>>2]=(c[n>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;n=0;i=h;return n|0}g=wt(32)|0;if((g|0)==0){n=0;i=h;return n|0}n=g+0|0;m=n+32|0;do{a[n]=0;n=n+1|0}while((n|0)<(m|0));l=l+1|0;c[j>>2]=l;j=k+44|0;c[j>>2]=(c[j>>2]|0)+1;j=k+56|0;if(l>>>0>(c[j>>2]|0)>>>0){c[j>>2]=l}c[g+8>>2]=b;l=b+40|0;c[g+4>>2]=c[l>>2];c[l>>2]=g;l=g+16|0;n=g+20|0;m=a[n]&-8;j=c[l>>2]&-2113929216;c[g+24>>2]=d;k=c[d+16>>2]|0;c[g>>2]=1056;c[g+12>>2]=4;c[l>>2]=k&65280|j|k&255|k&2097152|k&4194304|k&134217728|k&67108864|k&8388608|17760256;c[g+28>>2]=e;a[n]=m|f&7;n=g;i=h;return n|0}function Sc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+16|0;j=f+8|0;k=f;h=b+4|0;g=b+8|0;r=c[g>>2]|0;p=b+8|0;do{if((r|0)!=0){m=c[d+4>>2]|0;o=c[d>>2]|0;n=m-o|0;q=p;a:while(1){b:while(1){s=c[r+20>>2]|0;t=c[r+16>>2]|0;u=s-t|0;if((u|0)==(n|0)){if(t>>>0<s>>>0){w=o}else{break}while(1){v=a[t]|0;u=a[w]|0;if(!(v<<24>>24==u<<24>>24)){break}t=t+1|0;if(!(t>>>0<s>>>0)){break b}else{w=w+1|0}}if(!((v&255)<(u&255))){break}}else{if((u|0)>=(n|0)){break}}r=c[r+4>>2]|0;if((r|0)==0){break a}}s=c[r>>2]|0;if((s|0)==0){q=r;break}else{q=r;r=s}}if((q|0)!=(p|0)){p=c[q+16>>2]|0;q=(c[q+20>>2]|0)-p|0;if((n|0)!=(q|0)){if((n|0)<(q|0)){break}else{b=0}i=f;return b|0}if(!(o>>>0<m>>>0)){w=0;i=f;return w|0}while(1){q=a[o]|0;n=a[p]|0;if(!(q<<24>>24==n<<24>>24)){break}o=o+1|0;if(o>>>0<m>>>0){p=p+1|0}else{b=0;l=24;break}}if((l|0)==24){i=f;return b|0}if(!((q&255)<(n&255))){w=0;i=f;return w|0}}}}while(0);l=Xc(b,d,e)|0;c[k+4>>2]=0;c[k>>2]=0;mc[c[(c[l>>2]|0)+28>>2]&63](l,k);e=Yg(h,j,k)|0;d=c[e>>2]|0;if((d|0)==0){d=Bt(28)|0;u=k;v=c[u+4>>2]|0;w=d+16|0;c[w>>2]=c[u>>2];c[w+4>>2]=v;c[d+24>>2]=0;j=c[j>>2]|0;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=j;c[e>>2]=d;j=c[c[h>>2]>>2]|0;if((j|0)==0){h=d}else{c[h>>2]=j;h=c[e>>2]|0}Zg(c[g>>2]|0,h);w=b+12|0;c[w>>2]=(c[w>>2]|0)+1}c[d+24>>2]=l;w=l;i=f;return w|0}function Tc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;g=i;j=c[2]|0;h=j+52|0;k=c[h>>2]|0;if((k+32|0)>>>0>(c[j+60>>2]|0)>>>0){m=j+48|0;c[m>>2]=(c[m>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;m=0;i=g;return m|0}f=wt(32)|0;if((f|0)==0){m=0;i=g;return m|0}m=f+0|0;l=m+32|0;do{a[m]=0;m=m+1|0}while((m|0)<(l|0));k=k+1|0;c[h>>2]=k;h=j+44|0;c[h>>2]=(c[h>>2]|0)+1;h=j+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}c[f+8>>2]=b;m=b+40|0;c[f+4>>2]=c[m>>2];c[m>>2]=f;m=f+16|0;j=f+20|0;h=a[j]&-8;k=c[m>>2]&-2113929216;c[f+24>>2]=d;c[f+12>>2]=c[d+12>>2];l=c[d+16>>2]|0;a[j]=a[d+20|0]&7|h;c[f>>2]=1128;c[m>>2]=l&65280|k|l&255|l&4194304|l&16777216|l&134217728|l&67108864|l&2031616|l&8388608;c[f+28>>2]=e;m=f;i=g;return m|0}function Uc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;j=c[a+12>>2]|0;Vc(b,j)|0;e=b+8|0;f=c[e>>2]|0;h=c[f+16>>2]&255;g=b+(h<<2)+16|0;h=(h|0)==0;if(h){l=1}else{l=1;m=b+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<g>>>0){m=k}else{break}}}if((l|0)==(j|0)){f=c[a+4>>2]|0;e=a+8|0;if((f|0)==(e|0)){i=d;return}b=c[b>>2]|0;do{c[b>>2]=c[f+24>>2];b=b+4|0;g=c[f+4>>2]|0;if((g|0)==0){while(1){g=c[f+8>>2]|0;if((c[g>>2]|0)==(f|0)){f=g;break}else{f=g}}}else{f=g;while(1){g=c[f>>2]|0;if((g|0)==0){break}else{f=g}}}}while((f|0)!=(e|0));i=d;return}if(h){j=1}else{j=1;h=b+16|0;while(1){a=h+4|0;j=ba(c[h>>2]|0,j)|0;if(a>>>0<g>>>0){h=a}else{break}}}f=c[(nc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(f|0)>-1){i=d;return}if((f|0)>0|(j|0)==0){i=d;return}if(!(Wd(b,0,j,0,1)|0)){i=d;return}c[b+16>>2]=0;i=d;return}function Vc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=a+8|0;f=c[e>>2]|0;k=c[f+16>>2]&255;g=a+(k<<2)+16|0;if((k|0)==0){k=1}else{k=1;j=a+16|0;while(1){h=j+4|0;k=ba(c[j>>2]|0,k)|0;if(h>>>0<g>>>0){j=h}else{break}}}h=c[(nc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;f=c[e>>2]|0;g=c[f+16>>2]|0;do{if((g&255|0)==1){if((h|0)>-1){if((h|0)<(b|0)){b=f;break}else{a=1}i=d;return a|0}if(!((h|0)!=-2147483648&(b|0)>(0-h|0))){if((k|0)==(b|0)){k=1;i=d;return k|0}if(!(Wd(a,ba(c[(c[a+12>>2]|0)+12>>2]|0,b)|0,k,b,1)|0)){b=c[e>>2]|0;g=c[b+16>>2]|0;break}c[a+16>>2]=b;k=1;i=d;return k|0}else{b=f}}else{b=f}}while(0);k=g&255;f=a+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;h=a+16|0;while(1){g=h+4|0;j=ba(c[h>>2]|0,j)|0;if(g>>>0<f>>>0){h=g}else{break}}}b=c[(nc[c[(c[b>>2]|0)+36>>2]&1023](b)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(b|0)>-1){k=0;i=d;return k|0}if((b|0)>0|(j|0)==0){k=0;i=d;return k|0}if(!(Wd(a,0,j,0,1)|0)){k=0;i=d;return k|0}c[a+16>>2]=0;k=0;i=d;return k|0}function Wc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;e=i;d=a+8|0;f=c[d>>2]|0;k=c[f+16>>2]&255;g=a+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=a+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}f=c[(nc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;if((c[(c[d>>2]|0)+16>>2]&255|0)!=1){k=0;i=e;return k|0}if((f|0)>-1){k=(f|0)>=(b|0);i=e;return k|0}if((f|0)!=-2147483648&(b|0)>(0-f|0)){k=0;i=e;return k|0}if((j|0)==(b|0)){k=1;i=e;return k|0}if(!(Wd(a,ba(c[(c[a+12>>2]|0)+12>>2]|0,b)|0,j,b,1)|0)){k=0;i=e;return k|0}c[a+16>>2]=b;k=1;i=e;return k|0}function Xc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;h=i;j=c[2]|0;f=d+4|0;m=(c[f>>2]|0)+35-(c[d>>2]|0)|0;k=j+52|0;l=c[k>>2]|0;if((m+l|0)>>>0>(c[j+60>>2]|0)>>>0){m=j+48|0;c[m>>2]=(c[m>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;m=0;i=h;return m|0}g=wt(m)|0;if((g|0)==0){m=0;i=h;return m|0}Yt(g|0,0,m|0)|0;l=l+1|0;c[k>>2]=l;m=j+44|0;c[m>>2]=(c[m>>2]|0)+1;j=j+56|0;if(l>>>0>(c[j>>2]|0)>>>0){c[j>>2]=l}c[g+8>>2]=b;k=b+40|0;c[g+4>>2]=c[k>>2];c[k>>2]=g;k=g+16|0;l=g+20|0;m=a[l]&-8;b=c[k>>2]&-2113929216;c[g+24>>2]=e;c[g+12>>2]=c[e+12>>2];j=c[e+16>>2]|0;c[k>>2]=j&65280|b|j&255|j&2097152|j&4194304|j&16777216|j&134217728|j&67108864|j&2031616|j&8388608;a[l]=a[e+20|0]&7|m;c[g>>2]=232;l=c[d>>2]|0;m=(c[f>>2]|0)-l|0;c[g+28>>2]=m;Wt(g+32|0,l|0,m|0)|0;m=g;i=h;return m|0}function Yc(a,b){a=a|0;b=b|0;var d=0;d=i;b=Zc(a,b)|0;if((b|0)==0){a=0;i=d;return a|0}a=c[b>>2]|0;i=d;return a|0}function Zc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;l=c[b+8>>2]|0;j=b+8|0;a:do{if((l|0)!=0){f=c[d+4>>2]|0;g=c[d>>2]|0;h=f-g|0;k=j;b:while(1){c:while(1){m=c[l+20>>2]|0;o=c[l+16>>2]|0;n=m-o|0;if((n|0)==(h|0)){if(o>>>0<m>>>0){p=g}else{break}while(1){q=a[o]|0;n=a[p]|0;if(!(q<<24>>24==n<<24>>24)){break}o=o+1|0;if(!(o>>>0<m>>>0)){break c}else{p=p+1|0}}if(!((q&255)<(n&255))){break}}else{if((n|0)>=(h|0)){break}}l=c[l+4>>2]|0;if((l|0)==0){break b}}m=c[l>>2]|0;if((m|0)==0){k=l;break}else{k=l;l=m}}if((k|0)!=(j|0)){j=c[k+16>>2]|0;l=(c[k+20>>2]|0)-j|0;d:do{if((h|0)==(l|0)){if(g>>>0<f>>>0){while(1){l=a[g]|0;h=a[j]|0;if(!(l<<24>>24==h<<24>>24)){break}g=g+1|0;if(!(g>>>0<f>>>0)){break d}else{j=j+1|0}}if((l&255)<(h&255)){f=20;break a}}}else{if((h|0)<(l|0)){f=20;break a}}}while(0);d=k+24|0;f=22}else{f=20}}else{f=20}}while(0);if((f|0)==20){g=c[b>>2]|0;if((g|0)==0){d=0;f=22}else{q=b+72|0;p=q;p=Ut(c[p>>2]|0,c[p+4>>2]|0,1,0)|0;c[q>>2]=p;c[q+4>>2]=F;d=Zc(g,d)|0}}if((f|0)==22){q=b+64|0;p=q;p=Ut(c[p>>2]|0,c[p+4>>2]|0,1,0)|0;c[q>>2]=p;c[q+4>>2]=F}if((d|0)!=0){i=e;return d|0}q=b+80|0;p=q;p=Ut(c[p>>2]|0,c[p+4>>2]|0,1,0)|0;c[q>>2]=p;c[q+4>>2]=F;i=e;return d|0}function _c(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;b=Zc(a,b)|0;if(((b|0)!=0?(f=c[b>>2]|0,(f|0)!=0):0)?(e=rc[c[(c[f>>2]|0)+44>>2]&63](f,1)|0,(e|0)!=0):0){e=c[c[e>>2]>>2]|0}else{e=0}i=d;return e|0}function $c(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+16|0;h=f;g=b+16|0;a:do{if((b|0)!=0){n=c[b+20>>2]|0;l=b+20|0;o=(n|0)==0;m=e+4|0;k=b;b:while(1){do{if(!o){j=c[m>>2]|0;q=c[e>>2]|0;p=j-q|0;r=l;s=n;c:while(1){d:while(1){t=c[s+20>>2]|0;u=c[s+16>>2]|0;v=t-u|0;if((v|0)==(p|0)){if(u>>>0<t>>>0){v=q}else{break}while(1){x=a[u]|0;w=a[v]|0;if(!(x<<24>>24==w<<24>>24)){break}u=u+1|0;if(!(u>>>0<t>>>0)){break d}else{v=v+1|0}}if(!((x&255)<(w&255))){break}}else{if((v|0)>=(p|0)){break}}s=c[s+4>>2]|0;if((s|0)==0){break c}}t=c[s>>2]|0;if((t|0)==0){r=s;break}else{r=s;s=t}}if((r|0)!=(l|0)){s=c[r+16>>2]|0;t=(c[r+20>>2]|0)-s|0;if((p|0)!=(t|0)){if((p|0)<(t|0)){break}else{break b}}if(!(q>>>0<j>>>0)){break b}while(1){t=a[q]|0;p=a[s]|0;if(!(t<<24>>24==p<<24>>24)){break}q=q+1|0;if(!(q>>>0<j>>>0)){break b}else{s=s+1|0}}if(!((t&255)<(p&255))){break b}}}}while(0);k=c[k>>2]|0;if((k|0)==0){break a}}x=d+4|0;c[b+40>>2]=c[x>>2];c[x>>2]=0;if((d|0)!=0){g=b+52|0;e=(c[g>>2]|0)+ -1|0;c[g>>2]=e;g=b+44|0;c[g>>2]=(c[g>>2]|0)+ -1;g=b+56|0;if(e>>>0>(c[g>>2]|0)>>>0){c[g>>2]=e}xt(d)}x=c[r+24>>2]|0;w=b+88|0;c[w>>2]=(c[w>>2]|0)+1;i=f;return x|0}}while(0);j=Yg(g,h,e)|0;k=c[j>>2]|0;if((k|0)==0){k=Bt(28)|0;w=e;x=c[w+4>>2]|0;e=k+16|0;c[e>>2]=c[w>>2];c[e+4>>2]=x;c[k+24>>2]=0;e=c[h>>2]|0;c[k>>2]=0;c[k+4>>2]=0;c[k+8>>2]=e;c[j>>2]=k;e=c[c[g>>2]>>2]|0;if((e|0)==0){g=k}else{c[g>>2]=e;g=c[j>>2]|0}Zg(c[b+20>>2]|0,g);x=b+24|0;c[x>>2]=(c[x>>2]|0)+1}c[k+24>>2]=d;x=d;i=f;return x|0}function ad(a,b,d){a=a|0;b=b|0;d=d|0;d=i;Yt(b|0,0,c[a+12>>2]|0)|0;i=d;return 0}function bd(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;d=c[d+12>>2]|0;if(((e>>>0)%(d>>>0)|0|0)==0?((f>>>0)%(d>>>0)|0|0)==0:0){if((d|0)==4){c[f>>2]=c[e>>2];i=g;return 0}else if((d|0)==8){h=e;e=c[h+4>>2]|0;d=f;c[d>>2]=c[h>>2];c[d+4>>2]=e;i=g;return 0}else if((d|0)==2){b[f>>1]=b[e>>1]|0;i=g;return 0}else if((d|0)==1){a[f]=a[e]|0;i=g;return 0}else{Wt(f|0,e|0,d|0)|0;i=g;return 0}}Wt(f|0,e|0,d|0)|0;i=g;return 0}function cd(a,b){a=a|0;b=b|0;var d=0;d=i;Yt(b|0,-2,c[a+12>>2]|0)|0;i=d;return 0}function dd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+32|0;l=e+24|0;g=e+16|0;f=e+8|0;k=e;h=c[b+16>>2]|0;n=h>>>16&31;m=c[d+16>>2]|0;o=m>>>16&31;if((b|0)==(d|0)){q=1;i=e;return q|0}a:do{if((n|0)==3&(o|0)==3){if(((m^h)&255|0)==0){q=rc[c[(c[b>>2]|0)+24>>2]&63](b,0)|0;q=dd(q,rc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0)|0;i=e;return q|0}}else{if((n|0)==1&(o|0)==1){q=nc[c[(c[b>>2]|0)+16>>2]&1023](b)|0;if((q|0)!=(nc[c[(c[d>>2]|0)+16>>2]&1023](d)|0)){break}if((nc[c[(c[b>>2]|0)+16>>2]&1023](b)|0)<=0){q=1;i=e;return q|0}g=0;while(1){q=rc[c[(c[b>>2]|0)+24>>2]&63](b,g)|0;f=g+1|0;if(!(dd(q,rc[c[(c[d>>2]|0)+24>>2]&63](d,g)|0)|0)){f=0;j=34;break}if((f|0)<(nc[c[(c[b>>2]|0)+16>>2]&1023](b)|0)){g=f}else{f=1;j=34;break}}if((j|0)==34){i=e;return f|0}}h=f+4|0;c[h>>2]=0;c[f>>2]=0;mc[c[(c[b>>2]|0)+28>>2]&63](b,f);m=k+4|0;c[m>>2]=0;c[k>>2]=0;mc[c[(c[d>>2]|0)+28>>2]&63](d,k);b:do{if((b|0)!=0){n=l+4|0;c:while(1){c[n>>2]=0;c[l>>2]=0;mc[c[(c[b>>2]|0)+28>>2]&63](b,l);q=c[k>>2]|0;p=(c[m>>2]|0)-q|0;o=c[l>>2]|0;if(((c[n>>2]|0)-o|0)==(p|0)){p=o+p|0;while(1){if(!(o>>>0<p>>>0)){f=1;break c}if((a[o]|0)==(a[q]|0)){q=q+1|0;o=o+1|0}else{break}}}b=nc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;if((b|0)==0){break b}}i=e;return f|0}}while(0);l=c[m>>2]|0;m=144;k=c[k>>2]|0;while(1){if(!(k>>>0<l>>>0)){j=21;break}if((a[k]|0)==(a[m]|0)){m=m+1|0;k=k+1|0}else{break}}if((j|0)==21?(a[m]|0)==0:0){q=1;i=e;return q|0}d:do{if((d|0)!=0){j=g+4|0;e:while(1){c[j>>2]=0;c[g>>2]=0;mc[c[(c[d>>2]|0)+28>>2]&63](d,g);m=c[f>>2]|0;k=(c[h>>2]|0)-m|0;l=c[g>>2]|0;if(((c[j>>2]|0)-l|0)==(k|0)){k=l+k|0;while(1){if(!(l>>>0<k>>>0)){f=1;break e}if((a[l]|0)==(a[m]|0)){m=m+1|0;l=l+1|0}else{break}}}d=nc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;if((d|0)==0){break d}}i=e;return f|0}}while(0);g=c[h>>2]|0;h=144;f=c[f>>2]|0;while(1){if(!(f>>>0<g>>>0)){break}if((a[f]|0)==(a[h]|0)){h=h+1|0;f=f+1|0}else{break a}}if((a[h]|0)==0){q=1;i=e;return q|0}}}while(0);q=0;i=e;return q|0}function ed(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+16|0;k=f+8|0;h=f;l=h+4|0;c[l>>2]=0;c[h>>2]=0;mc[c[(c[d>>2]|0)+28>>2]&63](d,h);a:do{if((b|0)!=0){j=k+4|0;m=b;b:while(1){c[j>>2]=0;c[k>>2]=0;mc[c[(c[m>>2]|0)+28>>2]&63](m,k);p=c[h>>2]|0;n=(c[l>>2]|0)-p|0;o=c[k>>2]|0;if(((c[j>>2]|0)-o|0)==(n|0)){n=o+n|0;while(1){if(!(o>>>0<n>>>0)){e=1;break b}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{break}}}m=nc[c[(c[m>>2]|0)+12>>2]&1023](m)|0;if((m|0)==0){break a}}i=f;return e|0}}while(0);k=c[l>>2]|0;j=144;h=c[h>>2]|0;while(1){if(!(h>>>0<k>>>0)){g=11;break}if((a[h]|0)==(a[j]|0)){j=j+1|0;h=h+1|0}else{h=0;break}}if((g|0)==11){h=(a[j]|0)==0}if(h|e^1){p=h;i=f;return p|0}g=c[b+16>>2]|0;h=g>>>16&31;k=c[d+16>>2]|0;j=k>>>16&31;if((h|0)==3&(j|0)==3?((k^g)&255|0)==0:0){p=rc[c[(c[b>>2]|0)+24>>2]&63](b,0)|0;p=ed(p,rc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0,e)|0;i=f;return p|0}if(!((h+ -9|0)>>>0<2|(h|0)==13|(h|0)==14)){p=0;i=f;return p|0}if(!((j+ -9|0)>>>0<2|(j|0)==13|(j|0)==14)){p=0;i=f;return p|0}p=(c[b+12>>2]|0)==(c[d+12>>2]|0);i=f;return p|0}function fd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;f=i;g=c[b+4>>2]|0;b=c[b>>2]|0;while(1){if(!(b>>>0<g>>>0)){break}if((a[b]|0)==(a[d]|0)){d=d+1|0;b=b+1|0}else{g=0;e=5;break}}if((e|0)==5){i=f;return g|0}b=(a[d]|0)==0;i=f;return b|0}function gd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;k=c[b>>2]|0;f=c[b+4>>2]|0;a:do{if(k>>>0<f>>>0){do{j=a[k]|0;if(!((j&255)<127)){break a}b:do{if((a[28408+(j&255)|0]&16)==0){if(!(j<<24>>24==47)){break a}j=k+1|0;if(j>>>0<f>>>0){j=a[j]|0;if(j<<24>>24==47){k=k+2|0;c[b>>2]=k;if(!(k>>>0<f>>>0)){break}while(1){l=a[k]|0;if(l<<24>>24==10|l<<24>>24==13){break b}k=k+1|0;c[b>>2]=k;if(!(k>>>0<f>>>0)){break b}}}else if(!(j<<24>>24==42)){break}j=k+2|0;c[b>>2]=j;l=k+3|0;c:do{if(l>>>0<f>>>0){while(1){if((a[j]|0)==42){k=j+1|0;if((a[l]|0)==47){break c}else{j=k}}else{j=j+1|0}c[b>>2]=j;l=j+1|0;if(!(l>>>0<f>>>0)){h=13;break}}}else{h=13}}while(0);if((h|0)==13){h=0;k=j+1|0}if(k>>>0<f>>>0){k=j+2|0;c[b>>2]=k;break}else{c[b>>2]=k;break}}}else{k=k+1|0;c[b>>2]=k}}while(0)}while(k>>>0<f>>>0)}}while(0);if(!(k>>>0<f>>>0)){l=0;i=g;return l|0}if((d[k]|0)!=(e<<24>>24|0)){l=0;i=g;return l|0}c[b>>2]=k+1;l=1;i=g;return l|0}function hd(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+16|0;l=j+8|0;k=j;r=c[b+16>>2]|0;if((r&2031616|0)==196608){if((r&255|0)==0){t=c[e>>2]|0;t=hd(c[t+12>>2]|0,d,c[t>>2]|0,f,g)|0;i=j;return t|0}else{c[f>>2]=0;t=0;i=j;return t|0}}g=l+4|0;c[g>>2]=0;c[l>>2]=0;p=k+4|0;q=c[d>>2]|0;d=c[d+4>>2]|0;c[k>>2]=q;c[p>>2]=d;a:do{if((d-q|0)<=0){if((b|0)!=0){m=r;o=0;n=b;h=10}}else{r=0;do{b:do{if(q>>>0<d>>>0){t=q;while(1){s=t+1|0;if((a[t]|0)==46){s=t;break b}if(s>>>0<d>>>0){t=s}else{break}}}else{s=q}}while(0);c[l>>2]=q;c[g>>2]=s;c[k>>2]=s;c[p>>2]=d;b=rc[c[(c[b>>2]|0)+20>>2]&63](b,l)|0;if((b|0)==0){break a}r=(nc[c[(c[b>>2]|0)+40>>2]&1023](b)|0)+r|0;gd(k,46)|0;d=c[p>>2]|0;q=c[k>>2]|0}while((d-q|0)>0);m=c[b+16>>2]|0;o=r;n=b;h=10}}while(0);if((h|0)==10?(m&4194304|0)!=0:0){c[f>>2]=e+o;t=n;i=j;return t|0}c[f>>2]=0;t=0;i=j;return t|0}function id(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;j=i;i=i+16|0;h=j;m=c[2]|0;l=d+4|0;p=(c[l>>2]|0)+39-(c[d>>2]|0)|0;n=m+52|0;o=c[n>>2]|0;if((p+o|0)>>>0>(c[m+60>>2]|0)>>>0){k=m+48|0;c[k>>2]=(c[k>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0}k=wt(p)|0;Yt(k|0,0,p|0)|0;o=o+1|0;c[n>>2]=o;p=m+44|0;c[p>>2]=(c[p>>2]|0)+1;m=m+56|0;if(o>>>0>(c[m>>2]|0)>>>0){c[m>>2]=o}c[k+8>>2]=b;o=b+40|0;c[k+4>>2]=c[o>>2];c[o>>2]=k;o=k+12|0;n=k+16|0;p=k+20|0;q=a[p]&-8;r=c[n>>2]&-2113929216;c[k+24>>2]=e;c[o>>2]=c[e+12>>2];m=c[e+16>>2]|0;m=m&65280|r|m&255|m&2097152|m&4194304|m&16777216|m&134217728|m&67108864|m&2031616|m&8388608;c[n>>2]=m;a[p]=a[e+20|0]&7|q;c[k>>2]=160;d=c[d>>2]|0;p=(c[l>>2]|0)-d|0;c[k+32>>2]=p;Wt(k+36|0,d|0,p|0)|0;c[n>>2]=m&-1879048193|f<<28&1879048192;c[k+28>>2]=g;c[h>>2]=o;c[h+4>>2]=k+p+36;p=$c(b,k,h)|0;i=j;return p|0}function jd(a){a=a|0;return c[a+32>>2]|0}function kd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;h=c[d+4>>2]|0;d=c[d>>2]|0;if((h|0)==(d|0)){n=0;i=f;return n|0}g=c[b+32>>2]|0;if((g|0)==0){n=0;i=f;return n|0}h=h-d|0;k=b+36|0;a:while(1){m=c[k>>2]|0;if((h|0)==(c[m+32>>2]|0)){n=d+h|0;l=m+36|0;j=d;while(1){if(!(j>>>0<n>>>0)){break a}if((a[j]|0)==(a[l]|0)){l=l+1|0;j=j+1|0}else{break}}}k=k+4|0;if((k|0)==(b+(g<<2)+36|0)){b=0;e=10;break}}if((e|0)==10){i=f;return b|0}n=m;i=f;return n|0}function ld(a,b){a=a|0;b=b|0;var d=0;d=i;if((b|0)>=0?(c[a+32>>2]|0)>(b|0):0){a=c[a+(b<<2)+36>>2]|0}else{a=0}i=d;return a|0}function md(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=c[2]|0;j=h+52|0;k=c[j>>2]|0;if((k+28|0)>>>0>(c[h+60>>2]|0)>>>0){m=h+48|0;c[m>>2]=(c[m>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;m=0;i=g;return m|0}f=wt(28)|0;if((f|0)==0){m=0;i=g;return m|0}m=f+0|0;l=m+28|0;do{a[m]=0;m=m+1|0}while((m|0)<(l|0));k=k+1|0;c[j>>2]=k;m=h+44|0;c[m>>2]=(c[m>>2]|0)+1;h=h+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}c[f+8>>2]=b;b=b+40|0;c[f+4>>2]=c[b>>2];c[b>>2]=f;c[f+12>>2]=0;b=f+16|0;h=c[b>>2]|0;m=f+20|0;a[m]=a[m]&-8;h=h&-2113929216;c[b>>2]=h|2097152;c[f>>2]=432;if((d|0)==-2147483648){d=0}else{d=(d|0)<0?0-d|0:d}c[f+24>>2]=d;h=h|e<<16&2031616;c[b>>2]=h|14680064;if((e|0)==4){c[b>>2]=h|81788928;m=f;i=g;return m|0}else if((e|0)==0){if((d|0)<=0){m=f;i=g;return m|0}c[b>>2]=h|10485760;m=f;i=g;return m|0}else{m=f;i=g;return m|0}return 0}function nd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;g=e;h=c[2]|0;l=(d<<2)+36|0;j=h+52|0;k=c[j>>2]|0;if((k+l|0)>>>0>(c[h+60>>2]|0)>>>0){f=h+48|0;c[f>>2]=(c[f>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0}f=wt(l)|0;Yt(f|0,0,l|0)|0;k=k+1|0;c[j>>2]=k;l=h+44|0;c[l>>2]=(c[l>>2]|0)+1;h=h+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}od(f,a,b,d);l=f+(c[f+32>>2]<<2)+36|0;c[g>>2]=f+12;c[g+4>>2]=l;l=$c(a,f,g)|0;i=e;return l|0}function od(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;c[b+8>>2]=d;j=d+40|0;c[b+4>>2]=c[j>>2];c[j>>2]=b;j=b+12|0;c[j>>2]=0;h=b+16|0;k=c[h>>2]|0;d=b+20|0;o=a[d]&-8;a[d]=o;k=k&-2113929216|2097152;c[h>>2]=k;c[b>>2]=5944;l=b+32|0;c[l>>2]=f;c[b+28>>2]=0;p=b+36|0;Wt(p|0,e|0,f<<2|0)|0;c[b>>2]=504;if((f|0)==0){l=0;n=0;m=0;e=0;f=1}else{n=0;m=0;e=0;f=1;do{q=c[p>>2]|0;c[q+28>>2]=n;n=(nc[c[(c[q>>2]|0)+60>>2]&1023](q)|0)+n|0;q=c[q+16>>2]|0;f=f&(q&2097152|0)!=0;m=m|(q&16777216|0)!=0;e=e|(q&67108864|0)!=0;p=p+4|0;o=c[l>>2]|0}while((p|0)!=(b+(o<<2)+36|0));k=c[h>>2]|0;l=(o|0)>1?65536:q&2031616;o=a[d]|0}c[j>>2]=0;c[b+24>>2]=n;c[h>>2]=(m&1)<<24|(e&1)<<26|(f&1)<<21|k&-100663296|l|12582912;a[d]=o&-8;i=g;return}function pd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;j=b+12|0;c[j>>2]=(c[j>>2]|0)+1;j=e+16|0;k=b+25|0;a[k]=(c[j>>2]|0)>>>22&(d[k]|0);k=c[e+12>>2]|0;f=b+24|0;a[f]=d[f]|0|(c[j>>2]|0)>>>27&1;l=b+26|0;a[l]=(c[j>>2]|0)>>>21&(d[l]|0);if((k|0)==0){k=c[b+4>>2]|0;l=nc[c[(c[e>>2]|0)+60>>2]&1023](e)|0;k=c[k+28>>2]|0;k=(l+ -1+k|0)/(k|0)|0;if((k|0)>=2){if((k|0)<4){j=2}else{j=(k|0)<8?4:8}}else{j=1}}else{j=(c[j>>2]|0)>>>8&255}e=b+16|0;l=c[e>>2]|0;c[e>>2]=(l|0)>(j|0)?l:j;e=b+8|0;b=c[e>>2]|0;if((j|0)!=0?(h=(b|0)%(j|0)|0,(h|0)!=0):0){h=b+j-h|0}else{h=b}a[f]=d[f]|0|(h|0)!=(b|0);c[e>>2]=h+k;i=g;return h|0}function qd(b){b=b|0;var e=0,f=0,g=0,h=0,j=0;g=i;f=c[b+8>>2]|0;e=b+20|0;c[e>>2]=f;h=c[b+16>>2]|0;if((h|0)!=0?(j=(f|0)%(h|0)|0,(j|0)!=0):0){h=h+f-j|0}else{h=f}c[e>>2]=h;j=b+24|0;a[j]=d[j]|0|(h|0)!=(f|0);i=g;return}function rd(b,e){b=b|0;e=e|0;var f=0;f=b+25|0;a[f]=(c[e+16>>2]|0)>>>22&(d[f]|0);b=b+12|0;e=c[b>>2]|0;c[b>>2]=e+1;return(e<<2)+4|0}function sd(a){a=a|0;c[a+20>>2]=(c[a+12>>2]<<2)+4;return}function td(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+25|0;a[g]=(c[e+16>>2]|0)>>>22&(d[g]|0);g=b+12|0;h=c[g>>2]|0;if((h|0)!=0){b=h+1|0;c[g>>2]=b;i=f;return 0}c[b+20>>2]=c[e+12>>2];b=h+1|0;c[g>>2]=b;i=f;return 0}function ud(a){a=a|0;return}function vd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;g=e;h=c[2]|0;l=(d<<2)+36|0;j=h+52|0;k=c[j>>2]|0;if((k+l|0)>>>0>(c[h+60>>2]|0)>>>0){f=h+48|0;c[f>>2]=(c[f>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0}f=wt(l)|0;Yt(f|0,0,l|0)|0;k=k+1|0;c[j>>2]=k;l=h+44|0;c[l>>2]=(c[l>>2]|0)+1;h=h+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}wd(f,a,b,d);l=f+(c[f+32>>2]<<2)+36|0;c[g>>2]=f+12;c[g+4>>2]=l;l=$c(a,f,g)|0;i=e;return l|0}function wd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+32|0;h=g;n=b+8|0;c[n>>2]=d;d=d+40|0;c[b+4>>2]=c[d>>2];c[d>>2]=b;d=b+12|0;c[d>>2]=0;j=b+16|0;m=c[j>>2]|0;k=b+20|0;a[k]=a[k]&-8;c[j>>2]=m&-2113929216|2097152;c[b>>2]=5944;m=b+32|0;c[m>>2]=f;c[b+28>>2]=0;k=b+36|0;Wt(k|0,e|0,f<<2|0)|0;c[b>>2]=576;c[h+4>>2]=c[n>>2];n=h+8|0;q=h+26|0;c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;c[n+12>>2]=0;a[n+16|0]=0;a[q]=1;a[h+25|0]=1;c[h>>2]=6056;if((f|0)!=0){e=0;f=0;p=k;do{o=c[p>>2]|0;pd(h,o)|0;o=c[o+16>>2]|0;e=e|(o&16777216|0)!=0;f=f|(o&67108864|0)!=0;p=p+4|0;k=c[m>>2]|0}while((p|0)!=(b+(k<<2)+36|0));b=(o&8388608|0)==0;m=o&2031616;p=c[n>>2]|0;n=h+16|0;q=c[n>>2]|0;o=h+20|0;c[o>>2]=p;if((q|0)!=0?(l=(p|0)%(q|0)|0,(l|0)!=0):0){l=q+p-l|0}else{l=p}}else{o=h+20|0;c[o>>2]=0;l=0;n=h+16|0;p=0;k=0;m=0;e=0;f=0;b=1}c[o>>2]=l;q=h+24|0;o=c[q>>2]|0;p=o|(l|0)!=(p|0);a[q]=p;q=c[j>>2]&-226492161|o<<14&851443712|c[n>>2]<<8&65280;c[d>>2]=l;c[j>>2]=p<<27|(f&1)<<26|(o<<5&333447168|(e&1)<<24|q)|((k|0)!=1|b?65536:m);i=g;return}function xd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;d=i;if((c[a+16>>2]&18874368|0)==2097152){Yt(b|0,0,c[a+12>>2]|0)|0;i=d;return 0}e=a+32|0;if((c[e>>2]|0)==0){i=d;return 0}f=a+36|0;do{g=c[f>>2]|0;h=c[g+16>>2]|0;if((h&2097152|0)==0?(h&1342177280|0)==268435456|(h&1610612736|0)==536870912:0){Yt(b+(c[g+28>>2]|0)|0,0,c[g+12>>2]|0)|0}else{jc[c[(c[g>>2]|0)+48>>2]&63](g,b+(c[g+28>>2]|0)|0,0)|0}f=f+4|0}while((f|0)!=(a+(c[e>>2]<<2)+36|0));i=d;return 0}function yd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;if((c[a+16>>2]&2097152|0)!=0){Yt(b|0,-2,c[a+12>>2]|0)|0;i=d;return 0}e=a+32|0;g=c[e>>2]|0;if((g|0)==0){i=d;return 0}f=a+36|0;do{h=c[f>>2]|0;j=c[h+16>>2]|0;if(!((j&1342177280|0)==268435456|(j&1610612736|0)==536870912)){rc[c[(c[h>>2]|0)+56>>2]&63](h,b+(c[h+28>>2]|0)|0)|0;g=c[e>>2]|0}f=f+4|0}while((f|0)!=(a+(g<<2)+36|0));i=d;return 0}function zd(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;if((c[d+16>>2]&2097152|0)==0){h=d+32|0;if((c[h>>2]|0)==0){i=g;return 0}j=d+36|0;do{l=c[j>>2]|0;k=c[l+28>>2]|0;jc[c[(c[l>>2]|0)+52>>2]&63](l,e+k|0,f+k|0)|0;j=j+4|0}while((j|0)!=(d+(c[h>>2]<<2)+36|0));i=g;return 0}d=c[d+12>>2]|0;if(((e>>>0)%(d>>>0)|0|0)==0?((f>>>0)%(d>>>0)|0|0)==0:0){if((d|0)==2){b[f>>1]=b[e>>1]|0;i=g;return 0}else if((d|0)==8){j=e;k=c[j+4>>2]|0;l=f;c[l>>2]=c[j>>2];c[l+4>>2]=k;i=g;return 0}else if((d|0)==4){c[f>>2]=c[e>>2];i=g;return 0}else if((d|0)==1){a[f]=a[e]|0;i=g;return 0}else{Wt(f|0,e|0,d|0)|0;i=g;return 0}}Wt(f|0,e|0,d|0)|0;i=g;return 0}function Ad(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((d|0)==1){j=c[b+12>>2]|0;if((c[b+16>>2]&18874368|0)==2097152&(j|0)<128){c[b+28>>2]=296;j=296;i=e;return j|0}f=b+20|0;a[f]=a[f]|8;f=c[b+8>>2]|0;g=f+52|0;h=c[g>>2]|0;if(!((h+j|0)>>>0>(c[f+60>>2]|0)>>>0)){d=wt(j)|0;if((d|0)!=0){Yt(d|0,0,j|0)|0;h=h+1|0;c[g>>2]=h;j=f+44|0;c[j>>2]=(c[j>>2]|0)+1;f=f+56|0;if(h>>>0>(c[f>>2]|0)>>>0){c[f>>2]=h}}else{d=0}}else{d=f+48|0;c[d>>2]=(c[d>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;d=0}j=b+28|0;c[j>>2]=d;jc[c[(c[b>>2]|0)+48>>2]&63](b,d,0)|0;j=c[j>>2]|0;i=e;return j|0}else if((d|0)==4?(f=c[b+28>>2]|0,(f|0)!=296):0){j=f;i=e;return j|0}j=0;i=e;return j|0}function Bd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;c[a>>2]=576;d=c[a+28>>2]|0;if((d|0)==0|(d|0)==296){Ct(a);i=b;return}e=c[a+8>>2]|0;g=e+52|0;f=(c[g>>2]|0)+ -1|0;c[g>>2]=f;g=e+44|0;c[g>>2]=(c[g>>2]|0)+ -1;e=e+56|0;if(f>>>0>(c[e>>2]|0)>>>0){c[e>>2]=f}xt(d);Ct(a);i=b;return}function Cd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;c[a>>2]=576;e=a+28|0;d=c[e>>2]|0;if((d|0)==0|(d|0)==296){i=b;return}a=c[a+8>>2]|0;g=a+52|0;f=(c[g>>2]|0)+ -1|0;c[g>>2]=f;g=a+44|0;c[g>>2]=(c[g>>2]|0)+ -1;a=a+56|0;if(f>>>0>(c[a>>2]|0)>>>0){c[a>>2]=f}xt(d);c[e>>2]=0;i=b;return}function Dd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;g=i;j=c[2]|0;h=e<<2;m=h+36|0;k=j+52|0;l=c[k>>2]|0;if((l+m|0)>>>0>(c[j+60>>2]|0)>>>0){m=j+48|0;c[m>>2]=(c[m>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;m=0;i=g;return m|0}f=wt(m)|0;if((f|0)==0){m=0;i=g;return m|0}Yt(f|0,0,m|0)|0;l=l+1|0;c[k>>2]=l;m=j+44|0;c[m>>2]=(c[m>>2]|0)+1;j=j+56|0;if(l>>>0>(c[j>>2]|0)>>>0){c[j>>2]=l}c[f+8>>2]=b;k=b+40|0;c[f+4>>2]=c[k>>2];c[k>>2]=f;k=f+12|0;c[k>>2]=0;b=f+16|0;j=c[b>>2]|0;l=f+20|0;a[l]=a[l]&-8;j=j&-2113929216;c[b>>2]=j|2097152;c[f+32>>2]=e;c[f+28>>2]=0;l=f+36|0;Wt(l|0,d|0,h|0)|0;c[f>>2]=648;if((e|0)>0){d=c[l>>2]|0;l=c[d+16>>2]|0;h=l&65280;d=c[d+12>>2]|0;m=l&2031616;e=l&2097152;l=l&4194304}else{h=0;d=0;m=0;e=2097152;l=4194304}c[k>>2]=d;c[b>>2]=h|j|m|l|e;m=f;i=g;return m|0}function Ed(a,b){a=a|0;b=b|0;var d=0;d=i;if((c[a+32>>2]|0)<=0){b=0;i=d;return b|0}a=c[a+36>>2]|0;b=rc[c[(c[a>>2]|0)+44>>2]&63](a,b)|0;i=d;return b|0}function Fd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;if((c[a+32>>2]|0)<=0){d=0;i=e;return d|0}a=c[a+36>>2]|0;d=jc[c[(c[a>>2]|0)+48>>2]&63](a,b,d)|0;i=e;return d|0}function Gd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;if((c[a+32>>2]|0)<=0){d=0;i=e;return d|0}a=c[a+36>>2]|0;d=jc[c[(c[a>>2]|0)+52>>2]&63](a,b,d)|0;i=e;return d|0}function Hd(a,b){a=a|0;b=b|0;var d=0;d=i;if((c[a+32>>2]|0)<=0){b=0;i=d;return b|0}a=c[a+36>>2]|0;b=rc[c[(c[a>>2]|0)+56>>2]&63](a,b)|0;i=d;return b|0}function Id(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+16|0;h=g;m=c[2]|0;j=e<<2;o=j+32|0;l=m+52|0;n=c[l>>2]|0;if(!((n+o|0)>>>0>(c[m+60>>2]|0)>>>0)){k=wt(o)|0;if((k|0)==0){k=0}else{Yt(k|0,0,o|0)|0;n=n+1|0;c[l>>2]=n;l=m+44|0;c[l>>2]=(c[l>>2]|0)+1;l=m+56|0;if(n>>>0>(c[l>>2]|0)>>>0){c[l>>2]=n}c[k+8>>2]=b;o=b+40|0;c[k+4>>2]=c[o>>2];c[o>>2]=k;o=k+16|0;l=k+20|0;p=a[l]&-8;m=c[o>>2]&-2113929216;c[k+24>>2]=d;n=c[d+16>>2]|0;a[l]=a[d+20|0]&7|p;c[k>>2]=720;c[k+12>>2]=4;c[o>>2]=e&255|(m|n&4194304|n&134217728)|n&67108864|197632;Wt(k+32|0,f|0,j|0)|0}}else{k=m+48|0;c[k>>2]=(c[k>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;k=0}c[h>>2]=k+12;c[h+4>>2]=k+(e<<2)+32;p=$c(b,k,h)|0;i=g;return p|0}function Jd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=c[b>>2]|0;if((f|0)==0){d=(d|0)==0?a:d;j=c[2]|0;g=d+16|0;k=(c[g>>2]<<3&2040)+16|0;h=j+52|0;l=c[h>>2]|0;if(!((k+l|0)>>>0>(c[j+60>>2]|0)>>>0)){f=wt(k)|0;if((f|0)!=0){Yt(f|0,0,k|0)|0;k=l+1|0;c[h>>2]=k;h=j+44|0;c[h>>2]=(c[h>>2]|0)+1;h=j+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}Ud(f,d);c[b>>2]=f;if((c[g>>2]&16777216|0)==0){l=0;i=e;return l|0}k=c[(c[a>>2]|0)+52>>2]|0;l=rc[c[(c[d>>2]|0)+44>>2]&63](d,1)|0;l=jc[k&63](a,l,b)|0;i=e;return l|0}}else{l=j+48|0;c[l>>2]=(c[l>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0}c[b>>2]=0;l=1;i=e;return l|0}else{b=f+8|0;a=c[b>>2]|0;l=c[a+16>>2]&255;d=f+(l<<2)+16|0;if((l|0)==0){h=1}else{h=1;j=f+16|0;while(1){g=j+4|0;h=ba(c[j>>2]|0,h)|0;if(g>>>0<d>>>0){j=g}else{break}}}a=nc[c[(c[a>>2]|0)+36>>2]&1023](a)|0;if((c[(c[b>>2]|0)+16>>2]&255|0)!=1){l=1;i=e;return l|0}if((c[a>>2]|0)>-1|(h|0)==0){l=0;i=e;return l|0}if(!(Wd(f,0,h,0,1)|0)){l=1;i=e;return l|0}c[f+16>>2]=0;l=0;i=e;return l|0}return 0}function Kd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;a=i;h=c[b>>2]|0;d=c[d>>2]|0;if((h|0)==0&(d|0)==0){t=0;i=a;return t|0}f=c[h+12>>2]|0;e=d+12|0;b=c[e>>2]|0;if(((b|0)!=(f|0)?(c[b+16>>2]&67108864|0)!=0:0)?(c[(c[d+8>>2]|0)+16>>2]&255|0)==0:0){rc[c[(c[b>>2]|0)+56>>2]&63](b,c[d>>2]|0)|0;c[e>>2]=f;Vd(d,c[f+12>>2]|0,0)|0;t=c[e>>2]|0;jc[c[(c[t>>2]|0)+48>>2]&63](t,c[d>>2]|0,0)|0}b=d+8|0;m=(c[b>>2]|0)+16|0;p=c[m>>2]|0;n=p&255;k=h+8|0;if((n|0)!=(c[(c[k>>2]|0)+16>>2]&255|0)){t=1;i=a;return t|0}j=h+16|0;l=h+(n<<2)+16|0;o=c[(c[e>>2]|0)+12>>2]|0;e=d+16|0;r=d+(n<<2)+16|0;if((n|0)==0){n=1}else{n=1;q=e;while(1){p=q+4|0;n=ba(c[q>>2]|0,n)|0;if(p>>>0<r>>>0){q=p}else{p=e;q=j;s=r;break}}while(1){r=s+4|0;c[s>>2]=o;t=c[q>>2]|0;do{if(!((t|0)==-2147483648)){if((t|0)>-1){s=t;o=ba(t,o)|0;break}else{s=0;o=ba(t,0-o|0)|0;break}}else{s=0;o=0}}while(0);c[p>>2]=s;q=q+4|0;if(q>>>0<l>>>0){p=p+4|0;s=r}else{break}}p=c[m>>2]|0}t=p&255;l=d+(t<<2)+16|0;if((t|0)==0){q=1}else{q=1;p=e;while(1){m=p+4|0;q=ba(c[p>>2]|0,q)|0;if(m>>>0<l>>>0){p=m}else{break}}}if(!(Wd(d,o,n,q,1)|0)){t=1;i=a;return t|0}if((c[f+16>>2]&2097152|0)!=0){t=c[(c[k>>2]|0)+16>>2]&255;b=h+(t<<2)+16|0;if((t|0)==0){g=1}else{g=1;while(1){e=j+4|0;g=ba(c[j>>2]|0,g)|0;if(e>>>0<b>>>0){j=e}else{break}}}t=ba(c[f+12>>2]|0,g)|0;Xt(c[d>>2]|0,c[h>>2]|0,t|0)|0;t=0;i=a;return t|0}m=c[h>>2]|0;n=c[d>>2]|0;l=c[f+12>>2]|0;t=c[(c[k>>2]|0)+16>>2]&255;h=h+(t<<2)+16|0;if((t|0)!=0){k=1;while(1){o=j+4|0;j=ba(c[j>>2]|0,k)|0;if(o>>>0<h>>>0){k=j;j=o}else{break}}if((j|0)<=0){t=0;i=a;return t|0}}else{j=1}k=0;while(1){h=jc[c[(c[f>>2]|0)+52>>2]&63](f,m,n)|0;if((h|0)!=0){break}k=k+1|0;if((k|0)<(j|0)){n=n+l|0;m=m+l|0}else{d=0;g=34;break}}if((g|0)==34){i=a;return d|0}f=c[b>>2]|0;t=c[f+16>>2]&255;j=d+(t<<2)+16|0;if((t|0)==0){l=1}else{l=1;k=e;while(1){g=k+4|0;l=ba(c[k>>2]|0,l)|0;if(g>>>0<j>>>0){k=g}else{break}}}f=c[(nc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;if((c[(c[b>>2]|0)+16>>2]&255|0)!=1|(f|0)>-1){t=h;i=a;return t|0}if((f|0)>0|(l|0)==0){t=h;i=a;return t|0}if(!(Wd(d,0,l,0,1)|0)){t=h;i=a;return t|0}c[e>>2]=0;t=h;i=a;return t|0}function Ld(a,b){a=a|0;b=b|0;var d=0;a=i;d=c[b>>2]|0;if((d|0)==0){i=a;return 0}c[b>>2]=0;Md(d);i=a;return 0}function Md(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;h=c[(c[a+8>>2]|0)+16>>2]&255;e=a+(h<<2)+16|0;if((h|0)==0){f=1}else{g=1;f=a+16|0;while(1){d=f+4|0;g=ba(c[f>>2]|0,g)|0;if(d>>>0<e>>>0){f=d}else{f=g;break}}}d=c[a+12>>2]|0;g=c[a>>2]|0;e=c[d+12>>2]|0;h=ba(e,f)|0;if((c[d+16>>2]&2097152|0)==0){f=g+h|0;if((h|0)>0){do{rc[c[(c[d>>2]|0)+56>>2]&63](d,g)|0;g=g+e|0}while(g>>>0<f>>>0)}}else{Yt(g|0,0,h|0)|0}d=c[a>>2]|0;if((d|0)!=0){e=c[2]|0;h=e+52|0;f=(c[h>>2]|0)+ -1|0;c[h>>2]=f;h=e+44|0;c[h>>2]=(c[h>>2]|0)+ -1;e=e+56|0;if(f>>>0>(c[e>>2]|0)>>>0){c[e>>2]=f}xt(d);c[a>>2]=0;c[a+4>>2]=0}e=c[2]|0;if((a|0)==0){i=b;return}h=e+52|0;d=(c[h>>2]|0)+ -1|0;c[h>>2]=d;h=e+44|0;c[h>>2]=(c[h>>2]|0)+ -1;e=e+56|0;if(d>>>0>(c[e>>2]|0)>>>0){c[e>>2]=d}xt(a);i=b;return}function Nd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;do{if((d|0)==4){d=b+28|0}else if((d|0)==1){d=b+28|0;if((c[d>>2]|0)==0){f=c[2]|0;c[2]=c[b+8>>2];g=b+20|0;a[g]=a[g]|8;jc[c[(c[b>>2]|0)+48>>2]&63](b,d,0)|0;c[2]=f;break}else{break}}else{d=0}}while(0);i=e;return d|0}function Od(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;g=e;h=c[2]|0;l=(d<<2)+36|0;j=h+52|0;k=c[j>>2]|0;if((k+l|0)>>>0>(c[h+60>>2]|0)>>>0){f=h+48|0;c[f>>2]=(c[f>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0}f=wt(l)|0;Yt(f|0,0,l|0)|0;k=k+1|0;c[j>>2]=k;l=h+44|0;c[l>>2]=(c[l>>2]|0)+1;h=h+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}Pd(f,a,b,d);l=f+(c[f+32>>2]<<2)+36|0;c[g>>2]=f+12;c[g+4>>2]=l;l=$c(a,f,g)|0;i=e;return l|0}function Pd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;j=i;i=i+16|0;g=j;c[b+8>>2]=d;k=d+40|0;c[b+4>>2]=c[k>>2];c[k>>2]=b;k=b+12|0;c[k>>2]=0;l=b+16|0;m=c[l>>2]|0;d=b+20|0;a[d]=a[d]&-8;m=m&-2113929216|2097152;c[l>>2]=m;c[b>>2]=5944;d=b+32|0;c[d>>2]=f;c[b+28>>2]=0;n=b+36|0;Wt(n|0,e|0,f<<2|0)|0;c[b>>2]=792;if((f|0)==0){r=m;o=4;p=0;q=1;c[k>>2]=o;q=q&1;q=q<<21;r=r&-75497217;r=r|131072;p=p&1;p=p<<26;q=p|q;r=q|r;r=r|4195328;c[l>>2]=r;i=j;return}else{e=4;f=0;o=1}do{q=c[n>>2]|0;m=q+16|0;p=(c[m>>2]|0)>>>28;r=p&7;do{if(!((r+ -1|0)>>>0<5)){if((r|0)==6){if((c[q+12>>2]|0)<5){q=4;break}Ia(30696)|0;q=0;h=8;break}else if((r|0)==0){Ia(30640)|0;q=0;break}else{c[g>>2]=r;bb(856,g|0)|0;q=0;h=8;break}}else{q=4;h=8}}while(0);if((h|0)==8){h=0;if((p&6|0)==4){o=o&(c[m>>2]&2097152|0)!=0}}e=q+e|0;f=f|(c[m>>2]&67108864|0)!=0;n=n+4|0}while((n|0)!=(b+(c[d>>2]<<2)+36|0));r=c[l>>2]|0;n=e;p=f;q=o;c[k>>2]=n;q=q&1;q=q<<21;r=r&-75497217;r=r|131072;p=p&1;p=p<<26;q=p|q;r=q|r;r=r|4195328;c[l>>2]=r;i=j;return}function Qd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;f=i;h=c[2]|0;e=d+12|0;k=(c[e>>2]|0)+28|0;j=h+52|0;l=c[j>>2]|0;if((l+k|0)>>>0>(c[h+60>>2]|0)>>>0){l=h+48|0;c[l>>2]=(c[l>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;l=0;i=f;return l|0}g=wt(k)|0;if((g|0)==0){l=0;i=f;return l|0}Yt(g|0,0,k|0)|0;k=l+1|0;c[j>>2]=k;l=h+44|0;c[l>>2]=(c[l>>2]|0)+1;h=h+56|0;if(k>>>0>(c[h>>2]|0)>>>0){c[h>>2]=k}c[g+8>>2]=b;h=b+40|0;c[g+4>>2]=c[h>>2];c[h>>2]=g;h=g+16|0;l=g+20|0;j=a[l]&-16;b=c[h>>2]&-2113929216;c[g+24>>2]=d;c[g+12>>2]=c[e>>2];e=c[d+16>>2]|0;k=a[d+20|0]&7;c[g>>2]=912;c[h>>2]=e&65280|b|e&255|e&2097152|e&4194304|e&16777216|e&134217728|e&67108864|e&2031616|e&8388608|16777216;a[l]=j|k|8;jc[c[(c[d>>2]|0)+48>>2]&63](d,g+28|0,d)|0;l=g;i=f;return l|0}function Rd(a,b){a=a|0;b=b|0;if((b&-2|0)==2){a=0}else{a=a+28|0}return a|0}function Sd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((c[a+16>>2]&2097152|0)==0){f=c[a+24>>2]|0;jc[c[(c[f>>2]|0)+48>>2]&63](f,b,d)|0}f=c[a>>2]|0;d=c[f+52>>2]|0;f=rc[c[f+44>>2]&63](a,1)|0;f=jc[d&63](a,f,b)|0;i=e;return f|0}function Td(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;f=i;h=c[2]|0;g=h+52|0;j=c[g>>2]|0;if((j+28|0)>>>0>(c[h+60>>2]|0)>>>0){l=h+48|0;c[l>>2]=(c[l>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;l=0;i=f;return l|0}e=wt(28)|0;if((e|0)==0){l=0;i=f;return l|0}l=e+0|0;k=l+28|0;do{a[l]=0;l=l+1|0}while((l|0)<(k|0));j=j+1|0;c[g>>2]=j;g=h+44|0;c[g>>2]=(c[g>>2]|0)+1;g=h+56|0;if(j>>>0>(c[g>>2]|0)>>>0){c[g>>2]=j}c[e+8>>2]=b;j=b+40|0;c[e+4>>2]=c[j>>2];c[j>>2]=e;j=e+16|0;l=e+20|0;k=a[l]&-8;g=c[j>>2]&-2113929216;c[e+24>>2]=d;c[e+12>>2]=c[d+12>>2];h=c[d+16>>2]|0;c[j>>2]=h&65280|g|h&255|h&2097152|h&4194304|h&16777216|h&134217728|h&67108864|h&2031616|h&8388608;a[l]=a[d+20|0]&7|k;c[e>>2]=984;l=e;i=f;return l|0}function Ud(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;j=a+8|0;c[j>>2]=b;e=a+12|0;c[e>>2]=rc[c[(c[b>>2]|0)+24>>2]&63](b,0)|0;g=c[b+16>>2]&255;k=nc[c[(c[b>>2]|0)+36>>2]&1023](b)|0;b=(c[j>>2]|0)+16|0;j=c[b>>2]|0;if((j&255|0)!=(g|0)){i=d;return}f=k+(g<<2)|0;h=c[(c[e>>2]|0)+12>>2]|0;e=a+16|0;l=a+(g<<2)+16|0;if((g|0)==0){g=1}else{g=1;m=e;while(1){j=m+4|0;g=ba(c[m>>2]|0,g)|0;if(j>>>0<l>>>0){m=j}else{j=e;break}}while(1){m=l+4|0;c[l>>2]=h;n=c[k>>2]|0;do{if(!((n|0)==-2147483648)){if((n|0)>-1){l=n;h=ba(n,h)|0;break}else{l=0;h=ba(n,0-h|0)|0;break}}else{l=0;h=0}}while(0);c[j>>2]=l;k=k+4|0;if(k>>>0<f>>>0){j=j+4|0;l=m}else{break}}j=c[b>>2]|0}n=j&255;b=a+(n<<2)+16|0;if((n|0)==0){f=1}else{f=1;while(1){j=e+4|0;f=ba(c[e>>2]|0,f)|0;if(j>>>0<b>>>0){e=j}else{break}}}Wd(a,h,g,f,0)|0;i=d;return}function Vd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;g=c[a>>2]|0;h=(b|0)==0;if((g|0)==0){if(h){c[a+4>>2]=0;c[a>>2]=0;m=1;i=e;return m|0}h=c[2]|0;g=h+52|0;d=c[g>>2]|0;if(!((d+b|0)>>>0>(c[h+60>>2]|0)>>>0)){f=wt(b)|0;if((f|0)!=0){Yt(f|0,0,b|0)|0;d=d+1|0;c[g>>2]=d;g=h+44|0;c[g>>2]=(c[g>>2]|0)+1;g=h+56|0;if(d>>>0>(c[g>>2]|0)>>>0){c[g>>2]=d}c[a>>2]=f;c[a+4>>2]=f+b;m=1;i=e;return m|0}}else{m=h+48|0;c[m>>2]=(c[m>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0}c[a>>2]=0;c[a+4>>2]=0;m=0;i=e;return m|0}f=c[2]|0;if(h){m=f+52|0;b=(c[m>>2]|0)+ -1|0;c[m>>2]=b;m=f+44|0;c[m>>2]=(c[m>>2]|0)+ -1;f=f+56|0;if(b>>>0>(c[f>>2]|0)>>>0){c[f>>2]=b}xt(g);c[a>>2]=0;c[a+4>>2]=0;m=1;i=e;return m|0}g=yt(g,b)|0;if((g|0)==0){m=0;i=e;return m|0}if(d>>>0<b>>>0){Yt(g+d|0,0,b-d|0)|0}h=f+52|0;j=c[h>>2]|0;l=j+ -1|0;c[h>>2]=l;d=f+44|0;k=c[d>>2]|0;c[d>>2]=k+ -1;f=f+56|0;m=c[f>>2]|0;if(l>>>0>m>>>0){c[f>>2]=l}else{l=m}c[h>>2]=j;c[d>>2]=k;if(j>>>0>l>>>0){c[f>>2]=j}c[a>>2]=g;c[a+4>>2]=g+b;m=1;i=e;return m|0}function Wd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;f=f?d:0;do{if((e|0)>=(d|0)){if((e|0)>(d|0)){b=Vd(a,b,ba(c[(c[a+12>>2]|0)+12>>2]|0,d)|0)|0;break}if((b|0)!=0?(c[a>>2]|0)==0:0){b=Vd(a,b,0)|0}else{b=1}}else{l=c[a+12>>2]|0;if((c[l+16>>2]&2097152|0)==0?(k=c[a>>2]|0,h=c[l+12>>2]|0,j=k+(ba(h,d)|0)|0,(ba(h,d-e|0)|0)>0):0){d=k+(ba(h,e)|0)|0;do{rc[c[(c[l>>2]|0)+56>>2]&63](l,d)|0;d=d+h|0}while(d>>>0<j>>>0)}b=Vd(a,b,b)|0}}while(0);if(!(b&(f|0)<(e|0))){l=b;i=g;return l|0}b=c[a+12>>2]|0;j=c[a>>2]|0;a=c[b+12>>2]|0;h=j+(ba(a,f)|0)|0;f=ba(a,e-f|0)|0;a:do{if((c[b+16>>2]&2097152|0)==0){e=j+(ba(a,e)|0)|0;if((f|0)>0){while(1){f=jc[c[(c[b>>2]|0)+48>>2]&63](b,h,0)|0;if((f|0)!=0){break a}h=h+a|0;if(!(h>>>0<e>>>0)){f=0;break}}}else{f=0}}else{Yt(h|0,0,f|0)|0;f=0}}while(0);l=(f|0)==0;i=g;return l|0}function Xd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;if((b|0)==-1){l=c[(c[a+8>>2]|0)+16>>2]&255;j=a+(l<<2)+16|0;if((l|0)==0){b=1}else{b=1;k=a+16|0;while(1){h=k+4|0;b=ba(c[k>>2]|0,b)|0;if(h>>>0<j>>>0){k=h}else{break}}}}if((d|0)<1){l=0;i=g;return l|0}l=c[(c[a+8>>2]|0)+16>>2]&255;j=a+(l<<2)+16|0;if((l|0)==0){l=1}else{l=1;k=a+16|0;while(1){h=k+4|0;l=ba(c[k>>2]|0,l)|0;if(h>>>0<j>>>0){k=h}else{break}}}h=b+d|0;if((h|0)>(l|0)){f=Yd(a,l,h-l|0,0)|0;if((f|0)!=0){l=f;i=g;return l|0}}else{if((h|0)<(l|0)&f){Zd(a,h,l-h|0)|0}}f=c[a+12>>2]|0;h=c[f+12>>2]|0;a=(c[a>>2]|0)+(ba(h,b)|0)|0;b=ba(h,d)|0;if((c[f+16>>2]&2097152|0)!=0){Xt(a|0,e|0,b|0)|0;l=0;i=g;return l|0}d=e+b|0;if((b|0)<=0){l=0;i=g;return l|0}while(1){if((jc[c[(c[f>>2]|0)+52>>2]&63](f,e,a)|0)!=0){d=0;e=18;break}e=e+h|0;if(e>>>0<d>>>0){a=a+h|0}else{d=0;e=18;break}}if((e|0)==18){i=g;return d|0}return 0}function Yd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;if((b|0)==-1){o=c[(c[a+8>>2]|0)+16>>2]&255;h=a+(o<<2)+16|0;if((o|0)==0){b=1}else{b=1;j=a+16|0;while(1){g=j+4|0;b=ba(c[j>>2]|0,b)|0;if(g>>>0<h>>>0){j=g}else{break}}}}if((d|0)<1){o=0;i=f;return o|0}g=a+8|0;h=c[g>>2]|0;m=c[h+16>>2]&255;k=a+(m<<2)+16|0;m=(m|0)==0;if(!m){j=1;n=a+16|0;while(1){l=n+4|0;j=ba(c[n>>2]|0,j)|0;if(l>>>0<k>>>0){n=l}else{break}}l=j+d|0;if(m){n=1}else{n=1;o=a+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<k>>>0){o=m}else{break}}}}else{l=d+1|0;n=1;j=1}h=c[(nc[c[(c[h>>2]|0)+36>>2]&1023](h)|0)>>2]|0;if((c[(c[g>>2]|0)+16>>2]&255|0)!=1){o=1;i=f;return o|0}do{if((h|0)>-1){if((h|0)<(l|0)){o=1;i=f;return o|0}}else{if((h|0)!=-2147483648&(l|0)>(0-h|0)){o=1;i=f;return o|0}if((n|0)!=(l|0)){if(Wd(a,ba(c[(c[a+12>>2]|0)+12>>2]|0,l)|0,n,l,1)|0){c[a+16>>2]=l;break}else{o=1;i=f;return o|0}}}}while(0);h=c[a>>2]|0;g=a+12|0;l=c[g>>2]|0;m=c[l+12>>2]|0;k=ba(m,b)|0;a=h+k|0;if((j|0)!=(b|0)){Xt(h+(ba(m,b+d|0)|0)|0,a|0,ba(m,j-b|0)|0)|0;l=c[g>>2]|0}a:do{if((c[l+16>>2]&2097152|0)==0){Yt(a|0,0,ba(c[l+12>>2]|0,d)|0)|0;b=c[g>>2]|0;j=c[b+12>>2]|0;l=ba(j,d)|0;if((c[b+16>>2]&2097152|0)!=0){Yt(a|0,0,l|0)|0;break}h=h+(l+k)|0;if((l|0)>0){k=a;do{if((jc[c[(c[b>>2]|0)+48>>2]&63](b,k,0)|0)!=0){break a}k=k+j|0}while(k>>>0<h>>>0)}}}while(0);if((e|0)==0){o=0;i=f;return o|0}b=c[g>>2]|0;g=c[b+12>>2]|0;h=ba(g,d)|0;if((c[b+16>>2]&2097152|0)!=0){Xt(a|0,e|0,h|0)|0;o=0;i=f;return o|0}d=e+h|0;if((h|0)<=0){o=0;i=f;return o|0}while(1){if((jc[c[(c[b>>2]|0)+52>>2]&63](b,e,a)|0)!=0){d=0;e=34;break}e=e+g|0;if(e>>>0<d>>>0){a=a+g|0}else{d=0;e=34;break}}if((e|0)==34){i=f;return d|0}return 0}function Zd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;n=c[a>>2]|0;g=a+12|0;h=c[g>>2]|0;m=c[h+12>>2]|0;k=n+(ba(m,b)|0)|0;o=d+b|0;j=n+(ba(m,o)|0)|0;f=a+8|0;s=c[(c[f>>2]|0)+16>>2]&255;q=a+(s<<2)+16|0;if((s|0)==0){r=1}else{r=1;s=a+16|0;while(1){p=s+4|0;r=ba(c[s>>2]|0,r)|0;if(p>>>0<q>>>0){s=p}else{break}}}o=ba(m,r-o|0)|0;if((c[h+16>>2]&2097152|0)==0?(l=n+(ba(m,d+b|0)|0)|0,(ba(m,d)|0)>0):0){n=k;do{rc[c[(c[h>>2]|0)+56>>2]&63](h,n)|0;n=n+m|0}while(n>>>0<l>>>0)}Xt(k|0,j|0,o|0)|0;h=r-d|0;j=c[f>>2]|0;s=c[j+16>>2]&255;k=a+(s<<2)+16|0;if((s|0)==0){m=1}else{m=1;d=a+16|0;while(1){l=d+4|0;m=ba(c[d>>2]|0,m)|0;if(l>>>0<k>>>0){d=l}else{break}}}j=c[(nc[c[(c[j>>2]|0)+36>>2]&1023](j)|0)>>2]|0;if((c[(c[f>>2]|0)+16>>2]&255|0)!=1|(j|0)>-1){i=e;return 0}if((j|0)!=-2147483648&(h|0)>(0-j|0)|(m|0)==(h|0)){i=e;return 0}if(!(Wd(a,ba(c[(c[g>>2]|0)+12>>2]|0,h)|0,m,h,1)|0)){i=e;return 0}c[a+16>>2]=h;i=e;return 0}function _d(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=29256;c[g+4>>2]=29276;e=c[2]|0;c[2]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=29280;c[f+8>>2]=29358;c[f+12>>2]=29280;c[f+16>>2]=1;a[f+20|0]=0;f=ce(f)|0;c[2]=b;Sc(b,g,f)|0;c[2]=e;Ue(b,29360,40,29392,2);Ue(b,29440,41,29472,2);Ue(b,29496,42,29528,2);Ue(b,29568,43,29592,2);Ue(b,29632,44,29656,2);Ue(b,29696,45,29704,2);Ue(b,29744,46,29760,2);Ue(b,29784,47,29760,2);Ue(b,29800,48,29760,2);Ue(b,29816,49,29832,2);Ue(b,29856,50,29832,2);Ue(b,29872,51,29832,2);Ue(b,29896,52,29832,2);Ue(b,29912,53,29832,2);Ue(b,29936,54,29952,2);Ue(b,29976,55,29952,2);Ue(b,3e4,56,30016,2);Ue(b,30040,57,29760,2);Ue(b,30056,58,29760,2);Ue(b,30080,59,30104,2);Ue(b,30136,60,30160,2);i=d;return}function $d(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;h=b+8|0;c[h>>2]=0;i=b+4|0;c[i>>2]=0;c[b+24>>2]=f;c[b>>2]=d;if((e|0)==0){c[i>>2]=0;c[h>>2]=0}else{c[i>>2]=c[e>>2];c[h>>2]=c[e+4>>2]}c[b+12>>2]=c[e>>2];c[b+16>>2]=g;a[b+20|0]=0;return}function ae(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;g=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(g>>>0<e>>>0){f=0}else{g=0;g=g+b|0;i=d;return g|0}do{f=((a[g]|0)==10)+f|0;g=g+1|0}while((g|0)!=(e|0));g=f+b|0;i=d;return g|0}function be(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;e=i;d=b+12|0;j=c[d>>2]|0;f=c[b+4>>2]|0;g=b+16|0;b=c[g>>2]|0;if(j>>>0<f>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(f|0))}else{h=0}c[g>>2]=h+b;c[d>>2]=f;i=e;return}function ce(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+4048|0;m=e+4008|0;l=e+8|0;f=e;d=c[2]|0;c[2]=c[b>>2];h=f+4|0;c[h>>2]=0;c[f>>2]=0;k=b+4|0;de(k,f)|0;h=c[h>>2]|0;j=c[f>>2]|0;a:do{if((h-j|0)<1){n=1256;o=j}else{n=j+1|0;o=1224;p=j;while(1){if(!(p>>>0<n>>>0)){break}if((a[p]|0)==(a[o]|0)){o=o+1|0;p=p+1|0}else{n=1256;o=j;break a}}if(j>>>0<h>>>0){c[f>>2]=n}g=Zc(c[b>>2]|0,f)|0;if((g|0)==0){g=0}else{g=c[g>>2]|0}if((g|0)!=0){p=g;c[2]=d;i=e;return p|0}g=c[b+24>>2]|0;l=c[b+12>>2]|0;j=c[b+4>>2]|0;h=c[b+16>>2]|0;if(l>>>0<j>>>0){k=0;do{k=((a[l]|0)==10)+k|0;l=l+1|0}while((l|0)!=(j|0))}else{k=0}ee(g,2,k+h|0,1232,f);p=c[(c[b>>2]|0)+36>>2]|0;c[2]=d;i=e;return p|0}}while(0);while(1){if(!(o>>>0<h>>>0)){g=15;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{o=1264;n=j;break}}if((g|0)==15){if((a[n]|0)==0){c[m+4>>2]=c[b>>2];o=m+8|0;p=m+26|0;c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;c[o+12>>2]=0;a[o+16|0]=0;a[p]=1;a[m+25|0]=1;c[m>>2]=6056;ie(b,l,m);p=nd(c[b>>2]|0,l,c[m+12>>2]|0)|0;c[2]=d;i=e;return p|0}else{o=1264;n=j}}while(1){if(!(n>>>0<h>>>0)){g=19;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{n=1272;o=j;break}}if((g|0)==19){if((a[o]|0)==0){c[m+4>>2]=c[b>>2];o=m+8|0;p=m+26|0;c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;c[o+12>>2]=0;a[o+16|0]=0;a[p]=1;a[m+25|0]=1;c[m>>2]=6056;ie(b,l,m);p=vd(c[b>>2]|0,l,c[m+12>>2]|0)|0;c[2]=d;i=e;return p|0}else{n=1272;o=j}}while(1){if(!(o>>>0<h>>>0)){g=23;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{n=1280;o=j;break}}if((g|0)==23){if((a[n]|0)==0){c[m+4>>2]=c[b>>2];o=m+8|0;p=m+26|0;c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;c[o+12>>2]=0;a[o+16|0]=0;a[p]=1;a[m+25|0]=1;c[m>>2]=6176;ie(b,l,m);p=Od(c[b>>2]|0,l,c[m+12>>2]|0)|0;c[2]=d;i=e;return p|0}else{n=1280;o=j}}while(1){if(!(o>>>0<h>>>0)){g=27;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{n=1288;o=j;break}}if((g|0)==27){if((a[n]|0)==0){p=fe(b)|0;c[2]=d;i=e;return p|0}else{n=1288;o=j}}while(1){if(!(o>>>0<h>>>0)){g=31;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{o=1296;n=j;break}}if((g|0)==31){if((a[n]|0)==0){p=ge(b)|0;c[2]=d;i=e;return p|0}else{o=1296;n=j}}while(1){if(!(n>>>0<h>>>0)){g=35;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{o=1304;n=j;g=36;break}}if((g|0)==35?(a[o]|0)!=0:0){o=1304;n=j;g=36}do{if((g|0)==36){while(1){g=0;if(!(n>>>0<h>>>0)){g=38;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0;g=36}else{o=1312;n=j;break}}if((g|0)==38){if((a[o]|0)==0){break}else{o=1312;n=j}}while(1){if(!(n>>>0<h>>>0)){g=42;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{l=1320;m=j;break}}if((g|0)==42){if((a[o]|0)==0){c[m+4>>2]=c[b>>2];o=m+8|0;p=m+26|0;c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;c[o+12>>2]=0;a[o+16|0]=0;a[p]=1;a[m+25|0]=1;c[m>>2]=6248;ie(b,l,m);p=Dd(c[b>>2]|0,l,c[m+12>>2]|0)|0;c[2]=d;i=e;return p|0}else{l=1320;m=j}}while(1){if(!(m>>>0<h>>>0)){g=46;break}if((a[m]|0)==(a[l]|0)){l=l+1|0;m=m+1|0}else{k=144;break}}if((g|0)==46){if((a[l]|0)==0){if(!(gd(k,40)|0)){p=c[(c[b>>2]|0)+36>>2]|0;c[2]=d;i=e;return p|0}f=ce(b)|0;f=Td(c[b>>2]|0,f)|0;if(gd(k,41)|0){p=f;c[2]=d;i=e;return p|0}else{p=c[(c[b>>2]|0)+36>>2]|0;c[2]=d;i=e;return p|0}}else{k=144}}while(1){if(!(j>>>0<h>>>0)){g=54;break}if((a[j]|0)==(a[k]|0)){k=k+1|0;j=j+1|0}else{break}}if((g|0)==54?(a[k]|0)==0:0){p=ce(b)|0;p=Td(c[b>>2]|0,p)|0;c[2]=d;i=e;return p|0}g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1328,f);p=0;c[2]=d;i=e;return p|0}}while(0);p=he(b)|0;c[2]=d;i=e;return p|0}function de(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;j=c[b>>2]|0;f=c[b+4>>2]|0;a:do{if(j>>>0<f>>>0){while(1){h=a[j]|0;if(!((h&255)<127)){g=j;break a}b:do{if((a[28408+(h&255)|0]&16)==0){if(!(h<<24>>24==47)){g=j;break a}h=j+1|0;if(h>>>0<f>>>0){h=a[h]|0;if(h<<24>>24==47){j=j+2|0;c[b>>2]=j;if(!(j>>>0<f>>>0)){break}while(1){k=a[j]|0;if(k<<24>>24==10|k<<24>>24==13){break b}j=j+1|0;c[b>>2]=j;if(!(j>>>0<f>>>0)){break b}}}else if(!(h<<24>>24==42)){break}h=j+2|0;c[b>>2]=h;k=j+3|0;c:do{if(k>>>0<f>>>0){while(1){if((a[h]|0)==42){j=h+1|0;if((a[k]|0)==47){break c}else{h=j}}else{h=h+1|0}c[b>>2]=h;k=h+1|0;if(!(k>>>0<f>>>0)){g=13;break}}}else{g=13}}while(0);if((g|0)==13){g=0;j=h+1|0}if(j>>>0<f>>>0){j=h+2|0;c[b>>2]=j;break}else{c[b>>2]=j;break}}}else{j=j+1|0;c[b>>2]=j}}while(0);if(!(j>>>0<f>>>0)){g=j;break}}}else{g=j}}while(0);h=a[g]|0;do{if(g>>>0<f>>>0){if(h<<24>>24==64|h<<24>>24==34|h<<24>>24==39){if((re(b,d,3)|0)==0){break}else{d=1}i=e;return d|0}if((h&255)<127?!((a[28408+(h&255)|0]&2)==0):0){k=g+1|0;c[b>>2]=k;c[d>>2]=g;c[d+4>>2]=k;k=1;i=e;return k|0}else{j=g}while(1){if(!((h&255)<127)){break}if((a[28408+(h&255)|0]&1)==0){break}j=j+1|0;c[b>>2]=j;if(!(j>>>0<f>>>0)){break}h=a[j]|0}if(!(j>>>0>g>>>0)){k=1;i=e;return k|0}c[d>>2]=g;c[d+4>>2]=j;k=1;i=e;return k|0}}while(0);c[d>>2]=0;c[d+4>>2]=0;k=0;i=e;return k|0}function ee(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;h=i;i=i+224|0;j=h;g=h+24|0;switch(b|0){case 2:{b=a+4|0;c[b>>2]=(c[b>>2]|0)+1;b=2720;break};case 1:{b=2712;break};case 4:{b=a+8|0;c[b>>2]=(c[b>>2]|0)+1;b=2744;break};case 0:{b=2704;break};case 3:{b=a+8|0;c[b>>2]=(c[b>>2]|0)+1;b=2728;break};default:{b=2752}}if((c[a>>2]|0)==0){i=h;return}if((f|0)==0){c[j>>2]=d;c[j+4>>2]=b;c[j+8>>2]=e;e=Bb(g|0,200,2792,j|0)|0}else{k=c[f>>2]|0;f=(c[f+4>>2]|0)-k|0;c[j>>2]=d;c[j+4>>2]=b;c[j+8>>2]=e;c[j+12>>2]=f;c[j+16>>2]=k;e=Bb(g|0,200,2760,j|0)|0}a=c[a>>2]|0;d=a;if((d|0)==0){i=h;return}else if((d|0)==1){c[j>>2]=g;bb(2816,j|0)|0;i=h;return}else{k=c[(c[a+8>>2]|0)+16>>2]&255;j=a+(k<<2)+16|0;if((k|0)==0){f=1}else{f=1;b=a+16|0;while(1){d=b+4|0;f=ba(c[b>>2]|0,f)|0;if(d>>>0<j>>>0){b=d}else{break}}}Yd(a,f,e,g)|0;i=h;return}}function fe(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;h=i;i=i+32|0;f=h;e=h+16|0;d=h+8|0;j=e+4|0;c[j>>2]=0;c[e>>2]=0;c[d+4>>2]=0;c[d>>2]=0;g=b+4|0;if(!(gd(g,40)|0)){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}if(!(de(g,e)|0)){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}k=c[j>>2]|0;j=1520;l=c[e>>2]|0;while(1){if(!(l>>>0<k>>>0)){k=8;break}if((a[l]|0)==(a[j]|0)){j=j+1|0;l=l+1|0}else{k=10;break}}if((k|0)==8){if((a[j]|0)==0){j=c[(c[b>>2]|0)+28>>2]<<2;l=f;c[l>>2]=j;c[l+4>>2]=((j|0)<0)<<31>>31}else{k=10}}if((k|0)==10?!(le(e,f)|0):0){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}je(g);if(!(de(g,d)|0)){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}if(gd(g,41)|0){l=ne(0,d)|0;l=md(c[b>>2]|0,c[f>>2]|0,l)|0;i=h;return l|0}else{l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}return 0}function ge(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+80|0;d=e+72|0;o=e+8|0;g=e;h=d+4|0;c[h>>2]=0;c[d>>2]=0;j=b+4|0;if(!(gd(j,40)|0)){p=c[(c[b>>2]|0)+36>>2]|0;i=e;return p|0}l=ke(b)|0;je(j);de(j,d)|0;m=0;while(1){f=c[h>>2]|0;n=1384;p=c[d>>2]|0;while(1){if(!(p>>>0<f>>>0)){k=7;break}if((a[p]|0)==(a[n]|0)){n=n+1|0;p=p+1|0}else{break}}if((k|0)==7?(k=0,(a[n]|0)==0):0){k=13;break}if(!(le(d,g)|0)){break}c[o+(m<<2)>>2]=c[g>>2];je(j);de(j,d)|0;m=m+1|0}if((k|0)==13){p=Id(c[b>>2]|0,l,m,o)|0;i=e;return p|0}f=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;g=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(f,3,j+g|0,1496,d);p=c[(c[b>>2]|0)+36>>2]|0;i=e;return p|0}function he(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=a+4|0;if(!(gd(d,40)|0)){e=c[(c[a>>2]|0)+36>>2]|0;i=b;return e|0}f=ce(a)|0;e=Qd(c[a>>2]|0,f)|0;je(d);g=rc[c[(c[e>>2]|0)+44>>2]&63](e,0)|0;oe(a,f,g,c[f+16>>2]&255);if(gd(d,41)|0){g=e;i=b;return g|0}else{g=c[(c[a>>2]|0)+36>>2]|0;i=b;return g|0}return 0}function ie(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+16|0;g=f+8|0;j=f;h=g+4|0;c[h>>2]=0;c[g>>2]=0;k=j+4|0;c[k>>2]=0;c[j>>2]=0;m=b+4|0;de(m,g)|0;o=c[h>>2]|0;p=1360;n=c[g>>2]|0;while(1){if(!(n>>>0<o>>>0)){l=4;break}if((a[n]|0)==(a[p]|0)){p=p+1|0;n=n+1|0}else{break}}if((l|0)==4?(a[p]|0)==0:0){de(m,g)|0;n=e+12|0;a:while(1){p=c[g>>2]|0;o=c[h>>2]|0;r=1384;q=p;while(1){if(!(q>>>0<o>>>0)){l=12;break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0}else{q=1392;r=p;break}}if((l|0)==12){if((a[r]|0)==0){g=1384;l=56;break}else{q=1392;r=p}}while(1){if(!(r>>>0<o>>>0)){l=15;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{r=1400;q=p;l=16;break}}if((l|0)==15){l=0;if((a[q]|0)==0){o=0}else{r=1400;q=p;l=16}}do{if((l|0)==16){while(1){l=0;if(!(q>>>0<o>>>0)){l=18;break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0;l=16}else{q=1408;r=p;break}}if((l|0)==18){l=0;if((a[r]|0)==0){o=1;break}else{q=1408;r=p}}while(1){if(!(r>>>0<o>>>0)){l=21;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{q=1416;r=p;break}}if((l|0)==21){l=0;if((a[q]|0)==0){o=2;break}else{q=1416;r=p}}while(1){if(!(r>>>0<o>>>0)){l=24;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{q=1424;r=p;break}}if((l|0)==24){l=0;if((a[q]|0)==0){o=3;break}else{q=1424;r=p}}while(1){if(!(r>>>0<o>>>0)){l=27;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{r=1432;q=p;break}}if((l|0)==27){l=0;if((a[q]|0)==0){o=4;break}else{r=1432;q=p}}while(1){if(!(q>>>0<o>>>0)){l=30;break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0}else{q=1440;break}}if((l|0)==30){if((a[r]|0)==0){o=5;break}else{q=1440}}while(1){if(!(p>>>0<o>>>0)){break}if((a[p]|0)==(a[q]|0)){q=q+1|0;p=p+1|0}else{l=34;break a}}if((a[q]|0)==0){o=5}else{l=34;break a}}}while(0);if(!(gd(m,40)|0)){l=38;break}p=ce(b)|0;if((p|0)==0){p=c[(c[b>>2]|0)+36>>2]|0}je(m);de(m,g)|0;s=c[g>>2]|0;r=c[h>>2]|0;q=1384;l=s;while(1){if(!(l>>>0<r>>>0)){l=46;break}if((a[l]|0)==(a[q]|0)){q=q+1|0;l=l+1|0}else{l=48;break}}if((l|0)==46){l=0;if((a[q]|0)==0){c[j>>2]=0;c[k>>2]=0}else{l=48}}if((l|0)==48){l=0;c[j>>2]=s;c[j+4>>2]=r;de(m,g)|0;r=c[h>>2]|0;s=1384;q=c[g>>2]|0;while(1){if(!(q>>>0<r>>>0)){break}if((a[q]|0)==(a[s]|0)){s=s+1|0;q=q+1|0}else{l=52;break a}}if((a[s]|0)!=0){l=52;break}}s=rc[c[c[e>>2]>>2]&63](e,p)|0;s=id(c[b>>2]|0,j,p,o,s)|0;c[d+((c[n>>2]|0)+ -1<<2)>>2]=s;je(m);de(m,g)|0}if((l|0)==34){h=c[b+24>>2]|0;e=c[b+12>>2]|0;j=c[b+4>>2]|0;b=c[b+16>>2]|0;if(e>>>0<j>>>0){k=0;do{k=((a[e]|0)==10)+k|0;e=e+1|0}while((e|0)!=(j|0))}else{k=0}ee(h,2,k+b|0,1448,g);i=f;return}else if((l|0)==38){g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1368,0);i=f;return}else if((l|0)==52){g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1480,0);i=f;return}else if((l|0)==56){while(1){l=0;if(!(p>>>0<o>>>0)){l=58;break}if((a[p]|0)==(a[g]|0)){g=g+1|0;p=p+1|0;l=56}else{break}}if((l|0)==58?(a[g]|0)==0:0){i=f;return}g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1480,0);i=f;return}}g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1368,0);i=f;return}function je(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;e=i;h=c[b>>2]|0;d=c[b+4>>2]|0;a:do{if(h>>>0<d>>>0){do{g=a[h]|0;if(!((g&255)<127)){break a}b:do{if((a[28408+(g&255)|0]&16)==0){if(!(g<<24>>24==47)){break a}g=h+1|0;if(g>>>0<d>>>0){g=a[g]|0;if(g<<24>>24==47){h=h+2|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break}while(1){j=a[h]|0;if(j<<24>>24==10|j<<24>>24==13){break b}h=h+1|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break b}}}else if(!(g<<24>>24==42)){break}g=h+2|0;c[b>>2]=g;j=h+3|0;c:do{if(j>>>0<d>>>0){while(1){if((a[g]|0)==42){h=g+1|0;if((a[j]|0)==47){break c}else{g=h}}else{g=g+1|0}c[b>>2]=g;h=g+1|0;if(h>>>0<d>>>0){j=h}else{f=13;break}}}else{f=13}}while(0);if((f|0)==13){f=0;h=g+1|0}if(h>>>0<d>>>0){h=g+2|0;c[b>>2]=h;break}else{c[b>>2]=h;break}}}else{h=h+1|0;c[b>>2]=h}}while(0)}while(h>>>0<d>>>0)}}while(0);if(!(h>>>0<d>>>0)){i=e;return}if((a[h]|0)!=44){i=e;return}c[b>>2]=h+1;i=e;return}function ke(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=b+4|0;j=c[e>>2]|0;f=c[b+8>>2]|0;a:do{if(j>>>0<f>>>0){do{h=a[j]|0;if(!((h&255)<127)){break a}b:do{if((a[28408+(h&255)|0]&16)==0){if(!(h<<24>>24==47)){break a}h=j+1|0;if(h>>>0<f>>>0){h=a[h]|0;if(h<<24>>24==47){j=j+2|0;c[e>>2]=j;if(!(j>>>0<f>>>0)){break}while(1){k=a[j]|0;if(k<<24>>24==10|k<<24>>24==13){break b}j=j+1|0;c[e>>2]=j;if(!(j>>>0<f>>>0)){break b}}}else if(!(h<<24>>24==42)){break}h=j+2|0;c[e>>2]=h;k=j+3|0;c:do{if(k>>>0<f>>>0){while(1){if((a[h]|0)==42){j=h+1|0;if((a[k]|0)==47){break c}else{h=j}}else{h=h+1|0}c[e>>2]=h;k=h+1|0;if(!(k>>>0<f>>>0)){g=13;break}}}else{g=13}}while(0);if((g|0)==13){g=0;j=h+1|0}if(j>>>0<f>>>0){j=h+2|0;c[e>>2]=j;break}else{c[e>>2]=j;break}}}else{j=j+1|0;c[e>>2]=j}}while(0)}while(j>>>0<f>>>0)}}while(0);d:do{if((f-j|0)>1){f=j+1|0;g=1392;while(1){if(!(j>>>0<f>>>0)){break d}if((a[j]|0)==(a[g]|0)){g=g+1|0;j=j+1|0}else{break}}k=ce(b)|0;i=d;return k|0}}while(0);if(!(gd(e,101)|0)){k=c[(c[b>>2]|0)+36>>2]|0;i=d;return k|0}if(!(gd(e,40)|0)){k=c[(c[b>>2]|0)+36>>2]|0;i=d;return k|0}f=ce(b)|0;if(gd(e,41)|0){k=f;i=d;return k|0}k=c[(c[b>>2]|0)+36>>2]|0;i=d;return k|0}function le(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;n=c[b>>2]|0;f=c[b+4>>2]|0;a:do{if(n>>>0<f>>>0){do{h=a[n]|0;if(!((h&255)<127)){break a}b:do{if((a[28408+(h&255)|0]&16)==0){if(!(h<<24>>24==47)){break a}h=n+1|0;if(h>>>0<f>>>0){h=a[h]|0;if(h<<24>>24==47){n=n+2|0;c[b>>2]=n;if(!(n>>>0<f>>>0)){break}while(1){p=a[n]|0;if(p<<24>>24==10|p<<24>>24==13){break b}n=n+1|0;c[b>>2]=n;if(!(n>>>0<f>>>0)){break b}}}else if(!(h<<24>>24==42)){break}h=n+2|0;c[b>>2]=h;j=n+3|0;c:do{if(j>>>0<f>>>0){while(1){if((a[h]|0)==42){n=h+1|0;if((a[j]|0)==47){break c}}else{n=h+1|0}c[b>>2]=n;j=n+1|0;if(j>>>0<f>>>0){h=n}else{h=n;g=13;break}}}else{g=13}}while(0);if((g|0)==13){g=0;n=h+1|0}if(n>>>0<f>>>0){n=h+2|0;c[b>>2]=n;break}else{c[b>>2]=n;break}}}else{n=n+1|0;c[b>>2]=n}}while(0)}while(n>>>0<f>>>0)}}while(0);d:do{if(n>>>0<f>>>0){e:do{if((a[n]|0)!=42){k=1;j=0;h=0;g=0;o=1;l=0;m=1;while(1){while(1){p=a[n]|0;if(!((p+ -48<<24>>24&255)<10)){break}n=n+1|0;p=(p&255)+ -48|0;h=fu(h|0,g|0,10,0)|0;h=Ut(p|0,((p|0)<0)<<31>>31|0,h|0,F|0)|0;g=F;if(n>>>0<f>>>0){o=0;l=1;m=0}else{break e}}if(!o){break}o=p<<24>>24==45;if(!(p<<24>>24==43|p<<24>>24==45)){break}n=n+1|0;k=o?-1:k;j=o?-1:j;m=l<<24>>24==0;if(n>>>0<f>>>0){o=0}else{break}}if(m){b=0;break d}}else{h=-2147483648;g=-1;k=1;j=0;n=n+1|0}}while(0);c[b>>2]=n;b=1}else{k=1;j=0;h=0;g=0;b=0}}while(0);if((d|0)==0){i=e;return b|0}o=fu(k|0,j|0,h|0,g|0)|0;p=d;c[p>>2]=o;c[p+4>>2]=F;i=e;return b|0}function me(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;f=i;h=c[b>>2]|0;d=c[b+4>>2]|0;if(!(h>>>0<d>>>0)){i=f;return}a:while(1){g=a[h]|0;if(!((g&255)<127)){e=22;break}b:do{if((a[28408+(g&255)|0]&16)==0){if(!(g<<24>>24==47)){e=22;break a}g=h+1|0;if(g>>>0<d>>>0){if((a[g]|0)==47){h=h+2|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break}while(1){j=a[h]|0;if(j<<24>>24==10|j<<24>>24==13){break b}h=h+1|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break b}}}if((a[g]|0)==42){g=h+2|0;c[b>>2]=g;h=h+3|0;c:do{if(h>>>0<d>>>0){j=h;while(1){if((a[g]|0)==42){h=g+1|0;if((a[j]|0)==47){break c}else{g=h}}else{g=g+1|0}c[b>>2]=g;h=g+1|0;if(h>>>0<d>>>0){j=h}else{e=14;break}}}else{e=14}}while(0);if((e|0)==14){e=0;h=g+1|0}if(h>>>0<d>>>0){h=g+2|0;c[b>>2]=h;break}else{c[b>>2]=h;break}}}}else{h=h+1|0;c[b>>2]=h}}while(0);if(!(h>>>0<d>>>0)){e=22;break}}if((e|0)==22){i=f;return}}function ne(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;b=i;f=c[d>>2]|0;d=c[d+4>>2]|0;g=1536;h=f;while(1){if(!(h>>>0<d>>>0)){e=4;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1544;h=f;break}}if((e|0)==4){if((a[g]|0)==0){h=6;i=b;return h|0}else{g=1544;h=f}}while(1){if(!(h>>>0<d>>>0)){e=7;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1560;h=f;break}}if((e|0)==7){if((a[g]|0)==0){h=12;i=b;return h|0}else{g=1560;h=f}}while(1){if(!(h>>>0<d>>>0)){e=10;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1568;h=f;break}}if((e|0)==10){if((a[g]|0)==0){h=9;i=b;return h|0}else{g=1568;h=f}}while(1){if(!(h>>>0<d>>>0)){e=13;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1576;h=f;break}}if((e|0)==13){if((a[g]|0)==0){h=10;i=b;return h|0}else{g=1576;h=f}}while(1){if(!(h>>>0<d>>>0)){e=16;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1584;h=f;break}}if((e|0)==16){if((a[g]|0)==0){h=16;i=b;return h|0}else{g=1584;h=f}}while(1){if(!(h>>>0<d>>>0)){e=19;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1592;h=f;break}}if((e|0)==19){if((a[g]|0)==0){h=17;i=b;return h|0}else{g=1592;h=f}}while(1){if(!(h>>>0<d>>>0)){e=22;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1608;h=f;break}}if((e|0)==22){if((a[g]|0)==0){h=18;i=b;return h|0}else{g=1608;h=f}}while(1){if(!(h>>>0<d>>>0)){e=25;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1616;h=f;break}}if((e|0)==25){if((a[g]|0)==0){h=11;i=b;return h|0}else{g=1616;h=f}}while(1){if(!(h>>>0<d>>>0)){e=28;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1624;h=f;break}}if((e|0)==28){if((a[g]|0)==0){h=13;i=b;return h|0}else{g=1624;h=f}}while(1){if(!(h>>>0<d>>>0)){e=31;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=1632;h=f;break}}if((e|0)==31){if((a[g]|0)==0){h=7;i=b;return h|0}else{g=1632;h=f}}while(1){if(!(h>>>0<d>>>0)){e=34;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{h=1640;g=f;break}}if((e|0)==34){if((a[g]|0)==0){h=14;i=b;return h|0}else{h=1640;g=f}}while(1){if(!(g>>>0<d>>>0)){e=37;break}if((a[g]|0)==(a[h]|0)){h=h+1|0;g=g+1|0}else{g=1648;break}}if((e|0)==37){if((a[h]|0)==0){h=4;i=b;return h|0}else{g=1648}}while(1){if(!(f>>>0<d>>>0)){break}if((a[f]|0)==(a[g]|0)){g=g+1|0;f=f+1|0}else{f=0;e=41;break}}if((e|0)==41){i=b;return f|0}h=(a[g]|0)==0?15:0;i=b;return h|0}function oe(d,e,f,j){d=d|0;e=e|0;f=f|0;j=j|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0.0;l=i;i=i+336|0;t=l;p=l+304|0;s=l+296|0;C=l+280|0;D=l+288|0;n=l+272|0;E=l+264|0;m=l+312|0;B=l+320|0;if((a[1720]|0)==0?(wa(1720)|0)!=0:0){c[428]=1728;c[1716>>2]=1745;Va(1720)}r=(e|0)==0;a:do{if(r){o=11}else{q=D+4|0;F=e;while(1){c[q>>2]=0;c[D>>2]=0;mc[c[(c[F>>2]|0)+28>>2]&63](F,D);I=c[428]|0;H=(c[1716>>2]|0)-I|0;G=c[D>>2]|0;if(((c[q>>2]|0)-G|0)==(H|0)){H=G+H|0;while(1){if(!(G>>>0<H>>>0)){break a}if((a[G]|0)==(a[I]|0)){I=I+1|0;G=G+1|0}else{break}}}F=nc[c[(c[F>>2]|0)+12>>2]&1023](F)|0;if((F|0)==0){o=11;break}}}}while(0);do{if((o|0)==11){F=c[1716>>2]|0;D=144;q=c[428]|0;while(1){if(!(q>>>0<F>>>0)){o=14;break}if((a[q]|0)==(a[D]|0)){D=D+1|0;q=q+1|0}else{break}}if((o|0)==14?(a[D]|0)==0:0){break}D=c[e+12>>2]|0;F=(c[e+16>>2]|0)>>>16&31;q=n+4|0;c[q>>2]=0;c[n>>2]=0;switch(F|0){case 3:{qe(d,e,f,j);i=l;return};case 10:case 9:{I=E;c[I>>2]=0;c[I+4>>2]=0;if(!(le(d+4|0,E)|0)){f=c[d+24>>2]|0;n=c[d+12>>2]|0;m=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<m>>>0){e=0;do{e=((a[n]|0)==10)+e|0;n=n+1|0}while((n|0)!=(m|0))}else{e=0}ee(f,2,e+d|0,1752,0);i=l;return}if((f|0)==0){i=l;return}m=E;e=c[m>>2]|0;m=c[m+4>>2]|0;do{if((F+ -9|0)>>>0<2){if((D|0)==8){I=f;c[I>>2]=e;c[I+4>>2]=m;i=l;return}else if((D|0)==4){c[f>>2]=e;i=l;return}else if((D|0)==2){b[f>>1]=e;i=l;return}else if((D|0)==1){a[f]=e;i=l;return}else{break}}}while(0);f=c[d+24>>2]|0;n=c[d+12>>2]|0;m=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<m>>>0){e=0;do{e=((a[n]|0)==10)+e|0;n=n+1|0}while((n|0)!=(m|0))}else{e=0}ee(f,2,e+d|0,1792,0);i=l;return};case 14:case 13:{re(d+4|0,n,255)|0;e=c[q>>2]|0;d=c[n>>2]|0;m=e-d|0;if((m|0)>2?(a[d]|0)==64:0){d=d+2|0;c[n>>2]=d;e=e+ -1|0;c[q>>2]=e}else{if((m|0)>1){d=d+1|0;c[n>>2]=d;e=e+ -1|0;c[q>>2]=e}}if((D|0)==1?(e-d|0)>0:0){a[f]=a[d]|0;i=l;return}bb(1984,t|0)|0;i=l;return};case 15:{if((a[2024]|0)==0?(wa(2024)|0)!=0:0){c[502]=2032;c[504]=2036;Va(2024)}if((a[2056]|0)==0?(wa(2056)|0)!=0:0){c[510]=2064;c[512]=2080;Va(2056)}b:do{if(r){o=87}else{t=s+4|0;u=e;while(1){c[t>>2]=0;c[s>>2]=0;mc[c[(c[u>>2]|0)+28>>2]&63](u,s);x=c[502]|0;v=(c[504]|0)-x|0;w=c[s>>2]|0;if(((c[t>>2]|0)-w|0)==(v|0)){v=w+v|0;while(1){if(!(w>>>0<v>>>0)){break b}if((a[w]|0)==(a[x]|0)){x=x+1|0;w=w+1|0}else{break}}}u=nc[c[(c[u>>2]|0)+12>>2]&1023](u)|0;if((u|0)==0){o=87;break}}}}while(0);do{if((o|0)==87){s=c[504]|0;u=144;t=c[502]|0;while(1){if(!(t>>>0<s>>>0)){o=90;break}if((a[t]|0)==(a[u]|0)){u=u+1|0;t=t+1|0}else{break}}if((o|0)==90?(a[u]|0)==0:0){break}c:do{if(r){o=100}else{o=p+4|0;r=e;while(1){c[o>>2]=0;c[p>>2]=0;mc[c[(c[r>>2]|0)+28>>2]&63](r,p);u=c[510]|0;t=(c[512]|0)-u|0;s=c[p>>2]|0;if(((c[o>>2]|0)-s|0)==(t|0)){t=s+t|0;while(1){if(!(s>>>0<t>>>0)){o=104;break c}if((a[s]|0)==(a[u]|0)){u=u+1|0;s=s+1|0}else{break}}}r=nc[c[(c[r>>2]|0)+12>>2]&1023](r)|0;if((r|0)==0){o=100;break}}}}while(0);d:do{if((o|0)==100){r=c[512]|0;p=144;s=c[510]|0;while(1){if(!(s>>>0<r>>>0)){break}if((a[s]|0)==(a[p]|0)){p=p+1|0;s=s+1|0}else{break d}}if((a[p]|0)==0){o=104}}}while(0);e:do{if((o|0)==104){de(d+4|0,n)|0;o=c[q>>2]|0;p=144;n=c[n>>2]|0;while(1){if(!(n>>>0<o>>>0)){break}if((a[n]|0)==(a[p]|0)){p=p+1|0;n=n+1|0}else{break e}}if((a[p]|0)==0){c[f>>2]=c[1102];i=l;return}}}while(0);c[m+4>>2]=0;c[m>>2]=0;mc[c[(c[e>>2]|0)+28>>2]&63](e,m);f=c[d+24>>2]|0;o=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(o>>>0<e>>>0){n=0;do{n=((a[o]|0)==10)+n|0;o=o+1|0}while((o|0)!=(e|0))}else{n=0}ee(f,3,n+d|0,2088,m);i=l;return}}while(0);d=ce(d)|0;if((f|0)==0){i=l;return}c[f>>2]=d;i=l;return};case 6:{re(d+4|0,n,255)|0;m=c[n>>2]|0;e=c[q>>2]|0;n=1432;o=m;while(1){if(!(o>>>0<e>>>0)){o=35;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{v=1824;y=m;o=36;break}}if((o|0)==35){if((a[n]|0)==0){z=1}else{v=1824;y=m;o=36}}do{if((o|0)==36){while(1){o=0;if(!(y>>>0<e>>>0)){o=38;break}if((a[y]|0)==(a[v]|0)){v=v+1|0;y=y+1|0}else{w=1832;x=m;break}}if((o|0)==38){if((a[v]|0)==0){z=1;break}else{w=1832;x=m}}while(1){if(!(x>>>0<e>>>0)){o=41;break}if((a[x]|0)==(a[w]|0)){w=w+1|0;x=x+1|0}else{A=1840;u=m;break}}if((o|0)==41){if((a[w]|0)==0){z=0;break}else{A=1840;u=m}}while(1){if(!(u>>>0<e>>>0)){o=44;break}if((a[u]|0)==(a[A]|0)){A=A+1|0;u=u+1|0}else{break}}if((o|0)==44?(a[A]|0)==0:0){z=0;break}f=c[d+24>>2]|0;n=c[d+12>>2]|0;m=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<m>>>0){e=0;do{e=((a[n]|0)==10)+e|0;n=n+1|0}while((n|0)!=(m|0))}else{e=0}ee(f,2,e+d|0,1848,0);i=l;return}}while(0);if((f|0)==0){i=l;return}if((D|0)==1){a[f]=z;i=l;return}f=c[d+24>>2]|0;n=c[d+12>>2]|0;m=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<m>>>0){e=0;do{e=((a[n]|0)==10)+e|0;n=n+1|0}while((n|0)!=(m|0))}else{e=0}ee(f,2,e+d|0,1880,0);i=l;return};case 12:{re(d+4|0,n,255)|0;m=c[n>>2]|0;e=(c[q>>2]|0)-m|0;e=(e|0)<255?e:255;I=t+256|0;c[I>>2]=t+e;Wt(t|0,m|0,e|0)|0;a[c[I>>2]|0]=0;c[C>>2]=0;J=+Ot(t,C);I=c[C>>2]|0;e=(t|0)!=(I|0);c[n>>2]=m+(I-t);J=e?J:0.0;if(!e){f=c[d+24>>2]|0;n=c[d+12>>2]|0;m=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<m>>>0){e=0;do{e=((a[n]|0)==10)+e|0;n=n+1|0}while((n|0)!=(m|0))}else{e=0}ee(f,2,e+d|0,1920,0);i=l;return}if((f|0)==0){i=l;return}if((D|0)==4){g[f>>2]=J;i=l;return}else if((D|0)==8){h[k>>3]=J;a[f]=a[k];a[f+1|0]=a[k+1|0];a[f+2|0]=a[k+2|0];a[f+3|0]=a[k+3|0];a[f+4|0]=a[k+4|0];a[f+5|0]=a[k+5|0];a[f+6|0]=a[k+6|0];a[f+7|0]=a[k+7|0];i=l;return}else{f=c[d+24>>2]|0;n=c[d+12>>2]|0;m=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<m>>>0){e=0;do{e=((a[n]|0)==10)+e|0;n=n+1|0}while((n|0)!=(m|0))}else{e=0}ee(f,2,e+d|0,1952,0);i=l;return}};case 1:{p=B+4|0;c[p>>2]=0;c[B>>2]=0;m=d+4|0;re(m,B,255)|0;p=c[p>>2]|0;n=1360;q=c[B>>2]|0;while(1){if(!(q>>>0<p>>>0)){break}if((a[q]|0)==(a[n]|0)){n=n+1|0;q=q+1|0}else{o=126;break}}if((o|0)==126){i=l;return}if((a[n]|0)!=0){i=l;return}q=d+8|0;if(gd(m,41)|0){i=l;return}p=(f|0)==0;o=0;while(1){if(((c[q>>2]|0)-(c[m>>2]|0)|0)<=0){o=126;break}if((o|0)>=(nc[c[(c[e>>2]|0)+16>>2]&1023](e)|0)){o=126;break}n=rc[c[(c[e>>2]|0)+24>>2]&63](e,o)|0;if(p){r=0}else{r=f+(nc[c[(c[n>>2]|0)+40>>2]&1023](n)|0)|0}oe(d,n,r,c[n+16>>2]&255);if(gd(m,41)|0){o=126;break}else{o=o+1|0}}if((o|0)==126){i=l;return}break};case 0:case 8:{i=l;return};default:{f=c[d+24>>2]|0;n=c[d+12>>2]|0;m=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<m>>>0){e=0;do{e=((a[n]|0)==10)+e|0;n=n+1|0}while((n|0)!=(m|0))}else{e=0}ee(f,3,e+d|0,2112,0);i=l;return}}}}while(0);se(d,e,f);i=l;return}function pe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;i=i+16|0;f=h+8|0;j=h;g=f+4|0;c[g>>2]=0;c[f>>2]=0;m=b+4|0;n=c[m+4>>2]|0;o=j;c[o>>2]=c[m>>2];c[o+4>>2]=n;if((d|0)>0){Yt(e|0,0,d<<2|0)|0;b=0}else{b=0}do{de(j,f)|0;m=c[f>>2]|0;l=c[g>>2]|0;n=1360;k=m;while(1){if(!(k>>>0<l>>>0)){k=6;break}if((a[k]|0)==(a[n]|0)){n=n+1|0;k=k+1|0}else{n=1384;o=m;k=10;break}}if((k|0)==6){k=0;if((a[n]|0)==0){if((b|0)<(d|0)){o=e+(b<<2)|0;c[o>>2]=(c[o>>2]|0)+1}b=b+1|0}else{n=1384;o=m;k=10}}do{if((k|0)==10){while(1){k=0;if(!(o>>>0<l>>>0)){k=12;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0;k=10}else{o=1224;n=m;break}}if((k|0)==12){k=0;if((a[n]|0)==0){b=b+ -1|0;break}else{o=1224;n=m}}while(1){if(!(n>>>0<l>>>0)){k=16;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{n=1656;break}}if((k|0)==16){k=0;if((a[o]|0)==0){break}else{n=1656}}while(1){if(!(m>>>0<l>>>0)){k=19;break}if((a[m]|0)==(a[n]|0)){n=n+1|0;m=m+1|0}else{l=1;break}}if((k|0)==19){l=(a[n]|0)!=0}if(l&(b|0)<(d|0)){o=e+(b<<2)|0;c[o>>2]=(c[o>>2]|0)+1}}}while(0);je(j)}while((b|0)>-1);i=h;return}function qe(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+224|0;j=g;h=g+24|0;m=g+16|0;n=g+12|0;d=rc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0;e=c[e>>2]|0;if((f|0)<=0){if((f|0)!=0){i=g;return}oe(b,d,c[e>>2]|0,c[d+16>>2]&255);i=g;return}p=m+4|0;c[p>>2]=0;c[m>>2]=0;k=b+4|0;o=re(k,m,255)|0;if((f|0)==1?(o&3|0)!=0:0){h=c[p>>2]|0;j=c[m>>2]|0;b=h-j|0;if((b|0)>2?(a[j]|0)==64:0){j=j+2|0;c[m>>2]=j;h=h+ -1|0;c[p>>2]=h}else{if((b|0)>1){j=j+1|0;c[m>>2]=j;h=h+ -1|0;c[p>>2]=h}}b=h-j|0;if((o&2048|0)==0){h=e+8|0;k=c[h>>2]|0;r=c[k+16>>2]&255;m=e+(r<<2)+16|0;if((r|0)==0){f=1}else{f=1;n=e+16|0;while(1){l=n+4|0;f=ba(c[n>>2]|0,f)|0;if(l>>>0<m>>>0){n=l}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(b|0)>(0-k|0)|(f|0)==(b|0)):0)?Wd(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,b)|0,f,b,1)|0:0){c[e+16>>2]=b}if((c[d+12>>2]|0)!=1){i=g;return}d=c[d+16>>2]&2031616;if((d|0)==851968){Wt(c[e>>2]|0,j|0,b|0)|0;i=g;return}else if((d|0)==917504){Wt(c[e>>2]|0,j|0,b|0)|0;i=g;return}else{i=g;return}}if(j>>>0<h>>>0){l=j;b=0;while(1){k=l+1|0;if((a[l]|0)==92){a:do{if(k>>>0<h>>>0){m=l+2|0;l=a[k]|0;switch(l<<24>>24){case 85:case 117:case 120:case 92:case 34:case 39:case 116:case 114:case 110:{k=m;l=1;break a};default:{}}k=m;l=(l+ -48<<24>>24&255)<8|0}else{l=0}}while(0);b=l+b|0}else{b=b+1|0}if(k>>>0<h>>>0){l=k}else{break}}}else{b=0}k=e+8|0;l=c[k>>2]|0;r=c[l+16>>2]&255;m=e+(r<<2)+16|0;if((r|0)==0){f=1}else{f=1;o=e+16|0;while(1){n=o+4|0;f=ba(c[o>>2]|0,f)|0;if(n>>>0<m>>>0){o=n}else{break}}}l=c[(nc[c[(c[l>>2]|0)+36>>2]&1023](l)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(l|0)>-1)?!((l|0)!=-2147483648&(b|0)>(0-l|0)|(f|0)==(b|0)):0)?Wd(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,b)|0,f,b,1)|0:0){c[e+16>>2]=b}if((c[d+12>>2]|0)!=1){i=g;return}d=c[d+16>>2]&2031616;if((d|0)==851968){d=c[e>>2]|0;b:while(1){while(1){if(!(j>>>0<h>>>0)){break b}e=j+1|0;b=a[j]|0;if(!(b<<24>>24==92)){l=41;break}c:do{if(e>>>0<h>>>0){b=j+2|0;switch(a[e]|0){case 92:case 34:case 39:case 116:case 114:case 110:{break};default:{j=b;b=e;break c}}j=b}else{j=e;b=e}}while(0);if((b-e|0)==1){l=35;break}}do{if((l|0)==35){e=a[e]|0;b=e<<24>>24;if((b|0)==114){a[d]=13;break}else if((b|0)==116){a[d]=9;break}else if((b|0)==110){a[d]=10;break}else{a[d]=e;break}}else if((l|0)==41){a[d]=b;j=e}}while(0);d=d+1|0}i=g;return}else if((d|0)==917504){d=c[e>>2]|0;d:while(1){while(1){if(!(j>>>0<h>>>0)){break d}e=j+1|0;b=a[j]|0;if(!(b<<24>>24==92)){l=56;break}e:do{if(e>>>0<h>>>0){b=j+2|0;switch(a[e]|0){case 92:case 34:case 39:case 116:case 114:case 110:{break};default:{j=b;b=e;break e}}j=b}else{j=e;b=e}}while(0);if((b-e|0)==1){l=50;break}}do{if((l|0)==50){e=a[e]|0;b=e<<24>>24;if((b|0)==114){a[d]=13;break}else if((b|0)==116){a[d]=9;break}else if((b|0)==110){a[d]=10;break}else{a[d]=e;break}}else if((l|0)==56){a[d]=b;j=e}}while(0);d=d+1|0}i=g;return}else{i=g;return}}p=c[p>>2]|0;o=1360;m=c[m>>2]|0;while(1){if(!(m>>>0<p>>>0)){l=71;break}if((a[m]|0)==(a[o]|0)){o=o+1|0;m=m+1|0}else{break}}if((l|0)==71?(a[o]|0)==0:0){l=e+8|0;m=c[l>>2]|0;m=c[(nc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)+(f+ -1<<2)>>2]|0;c[n>>2]=0;pe(b,1,n);do{if((m|0)==-2147483648){m=c[n>>2]|0;n=c[l>>2]|0;r=c[n+16>>2]&255;o=e+(r<<2)+16|0;if((r|0)==0){q=1}else{q=1;p=e+16|0;while(1){f=p+4|0;q=ba(c[p>>2]|0,q)|0;if(f>>>0<o>>>0){p=f}else{break}}}n=c[(nc[c[(c[n>>2]|0)+36>>2]&1023](n)|0)>>2]|0;if((!((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(n|0)>-1)?!((n|0)!=-2147483648&(m|0)>(0-n|0)|(q|0)==(m|0)):0)?Wd(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,m)|0,q,m,1)|0:0){c[e+16>>2]=m}}else{if((m|0)>=0){n=c[l>>2]|0;r=c[n+16>>2]&255;o=e+(r<<2)+16|0;if((r|0)==0){q=1}else{q=1;p=e+16|0;while(1){f=p+4|0;q=ba(c[p>>2]|0,q)|0;if(f>>>0<o>>>0){p=f}else{break}}}n=c[(nc[c[(c[n>>2]|0)+36>>2]&1023](n)|0)>>2]|0;if((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(n|0)>-1){break}if((n|0)!=-2147483648&(m|0)>(0-n|0)|(q|0)==(m|0)){break}if(!(Wd(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,m)|0,q,m,1)|0)){break}c[e+16>>2]=m;break}m=0-m|0;o=c[n>>2]|0;n=c[l>>2]|0;p=c[n+16>>2]&255;f=e+(p<<2)+16|0;p=(p|0)==0;if((o|0)>(m|0)){if(p){q=1}else{q=1;p=e+16|0;while(1){o=p+4|0;q=ba(c[p>>2]|0,q)|0;if(o>>>0<f>>>0){p=o}else{break}}}n=c[(nc[c[(c[n>>2]|0)+36>>2]&1023](n)|0)>>2]|0;if((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(n|0)>-1){break}if((n|0)!=-2147483648&(m|0)>(0-n|0)|(q|0)==(m|0)){break}if(!(Wd(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,m)|0,q,m,1)|0)){break}c[e+16>>2]=m;break}else{if(p){r=1}else{r=1;q=e+16|0;while(1){p=q+4|0;r=ba(c[q>>2]|0,r)|0;if(p>>>0<f>>>0){q=p}else{break}}}n=c[(nc[c[(c[n>>2]|0)+36>>2]&1023](n)|0)>>2]|0;if((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(n|0)>-1){break}if((n|0)!=-2147483648&(o|0)>(0-n|0)|(r|0)==(o|0)){break}if(!(Wd(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,o)|0,r,o,1)|0)){break}c[e+16>>2]=o;break}}}while(0);p=c[e>>2]|0;f=c[d+12>>2]|0;n=b+8|0;if(gd(k,41)|0){i=g;return}l=d+16|0;o=0;e=0;while(1){if(((c[n>>2]|0)-(c[k>>2]|0)|0)<=0){break}r=(e|0)<(m|0)?p:0;o=(r|0)==0|o;oe(b,d,r,c[l>>2]&255);je(k);if(gd(k,41)|0){break}else{e=e+1|0;p=p+f|0}}if(!o){i=g;return}d=c[b+24>>2]|0;l=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(l>>>0<e>>>0){k=0;do{k=((a[l]|0)==10)+k|0;l=l+1|0}while((l|0)!=(e|0))}else{k=0}if((c[d>>2]|0)==0){i=g;return}c[j>>2]=k+b;c[j+4>>2]=2712;c[j+8>>2]=1664;e=Bb(h|0,200,2792,j|0)|0;d=c[d>>2]|0;b=d;if((b|0)==1){c[j>>2]=h;bb(2816,j|0)|0;i=g;return}else if((b|0)==0){i=g;return}else{r=c[(c[d+8>>2]|0)+16>>2]&255;b=d+(r<<2)+16|0;if((r|0)==0){k=1}else{k=1;l=d+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<b>>>0){l=j}else{break}}}Yd(d,k,e,h)|0;i=g;return}}d=c[b+24>>2]|0;k=c[b+12>>2]|0;e=c[b+4>>2]|0;h=c[b+16>>2]|0;if(k>>>0<e>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(e|0))}else{j=0}ee(d,3,j+h|0,1368,0);i=g;return}function re(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;h=c[b>>2]|0;g=c[b+4>>2]|0;a:do{if(h>>>0<g>>>0){do{k=a[h]|0;if(!((k&255)<127)){break a}b:do{if((a[28408+(k&255)|0]&16)==0){if(!(k<<24>>24==47)){break a}k=h+1|0;if(k>>>0<g>>>0){k=a[k]|0;if(k<<24>>24==47){h=h+2|0;c[b>>2]=h;if(!(h>>>0<g>>>0)){break}while(1){p=a[h]|0;if(p<<24>>24==10|p<<24>>24==13){break b}h=h+1|0;c[b>>2]=h;if(!(h>>>0<g>>>0)){break b}}}else if(!(k<<24>>24==42)){break}k=h+2|0;c[b>>2]=k;l=h+3|0;c:do{if(l>>>0<g>>>0){while(1){if((a[k]|0)==42){h=k+1|0;if((a[l]|0)==47){break c}}else{h=k+1|0}c[b>>2]=h;l=h+1|0;if(l>>>0<g>>>0){k=h}else{k=h;j=13;break}}}else{j=13}}while(0);if((j|0)==13){j=0;h=k+1|0}if(h>>>0<g>>>0){h=k+2|0;c[b>>2]=h;break}else{c[b>>2]=h;break}}}else{h=h+1|0;c[b>>2]=h}}while(0)}while(h>>>0<g>>>0)}}while(0);if(!(h>>>0<g>>>0)){p=0;i=f;return p|0}n=h+1|0;c[b>>2]=n;k=a[h]|0;j=n>>>0<g>>>0;if(j){l=a[n]|0}else{l=0}d:do{if((e|0)==0){e=0;j=87}else{e:do{if(k<<24>>24==64){if(l<<24>>24==39){if(!j){k=0;j=39;break}n=h+2|0;c[b>>2]=n;k=1;j=39;break}else if(!(l<<24>>24==34)){j=55;break}if(j){n=h+2|0;c[b>>2]=n;while(1){if(!(n>>>0<g>>>0)){e=0;j=36;break e}j=n+1|0;c[b>>2]=j;if((a[n]|0)==34){n=j;e=0;j=36;break}else{n=j}}}else{e=0;j=31}}else if(k<<24>>24==34){e=0;j=31}else if(k<<24>>24==39){k=0;j=39}else{e=k<<24>>24==42;if(e){e=e?128:0;j=87;break d}if(!(k<<24>>24==102|k<<24>>24==116)){if((k+ -40<<24>>24&255)<2){e=256;j=87;break d}j=k<<24>>24==44;if(j){e=j?1024:0;j=87;break d}else{j=55;break}}if(!j){e=512;j=87;break d}while(1){j=a[n]|0;if(!((j&255)<127)){e=512;j=88;break e}if((a[28408+(j&255)|0]&1)==0){e=512;j=88;break e}n=n+1|0;c[b>>2]=n;if(!(n>>>0<g>>>0)){e=512;j=88;break}}}}while(0);f:do{if((j|0)==31){while(1){while(1){if(!(n>>>0<g>>>0)){j=36;break f}j=n+1|0;c[b>>2]=j;k=a[n]|0;if(k<<24>>24==34){n=j;j=36;break f}else if(k<<24>>24==92){break}else{n=j}}if(!(j>>>0<g>>>0)){n=j;e=1;j=31;continue}n=n+2|0;c[b>>2]=n;e=1;j=31}}else if((j|0)==39){e=1;while(1){if(k){break}while(1){if(!(n>>>0<g>>>0)){j=88;break f}l=n+1|0;c[b>>2]=l;j=a[n]|0;if(j<<24>>24==92){break}else if(j<<24>>24==39){n=l;j=88;break f}else{n=l}}if(!(l>>>0<g>>>0)){n=l;e=2049;continue}n=n+2|0;c[b>>2]=n;e=2049}while(1){if(!(n>>>0<g>>>0)){j=88;break f}j=n+1|0;c[b>>2]=j;if((a[n]|0)==39){n=j;j=88;break}else{n=j}}}else if((j|0)==55){c[b>>2]=h;e=g-h|0;k=(e|0)<3;g:do{if(!k){m=h+3|0;l=2544;j=h;while(1){if(!(j>>>0<m>>>0)){j=63;break}if((a[j]|0)==(a[l]|0)){l=l+1|0;j=j+1|0}else{j=59;break}}h:do{if((j|0)==59){if(k){break g}n=h+3|0;l=2528;k=h;while(1){if(!(k>>>0<n>>>0)){break h}if((a[k]|0)==(a[l]|0)){l=l+1|0;k=k+1|0}else{break}}if((e|0)<4){break g}n=h+4|0;e=2536;k=h;while(1){if(!(k>>>0<n>>>0)){break}if((a[k]|0)==(a[e]|0)){e=e+1|0;k=k+1|0}else{break g}}c[b>>2]=n;e=48;j=87;break d}else if((j|0)==63){n=h+3|0}}while(0);c[b>>2]=n;e=32;j=88;break f}}while(0);if(h>>>0<g>>>0){n=h;k=0;m=0;o=0;l=0;e=0}else{b=d;e=0;break}i:while(1){p=a[n]|0;do{if(p<<24>>24!=46|k){if(p<<24>>24==45){if((n|0)!=(h|0)|l){j=88;break f}n=h;l=1;e=e|16;break}else if(p<<24>>24==101|p<<24>>24==69){j=77}if((j|0)==77?(j=0,!(o|m^1)):0){n=n+1|0;c[b>>2]=n;if(!(n>>>0<g>>>0)){d=0;j=91;break i}if((a[n]|0)==43){o=1;e=e|32;break}if((a[n]|0)!=45){d=0;j=91;break i}o=1;e=e|48;break}if(!((p+ -48<<24>>24&255)<10)?!(p<<24>>24==102|p<<24>>24==116|p<<24>>24==120):0){j=88;break f}m=1;e=e|40}else{k=1;e=e|32}}while(0);n=n+1|0;c[b>>2]=n;if(!(n>>>0<g>>>0)){j=88;break f}}if((j|0)==91){i=f;return d|0}}}while(0);if((j|0)==36){e=e?2050:2;j=88}if((j|0)==88){if(n>>>0>h>>>0){b=d;break}else{b=d}}c[b>>2]=0;c[d+4>>2]=0;p=e;i=f;return p|0}}while(0);if((j|0)==87){b=d}c[b>>2]=h;c[d+4>>2]=n;p=e;i=f;return p|0}function se(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+32|0;j=f;n=f+24|0;l=f+16|0;g=f+8|0;q=n+4|0;c[q>>2]=0;c[n>>2]=0;h=b+4|0;m=b+8|0;r=c[h>>2]|0;a:do{if(((c[m>>2]|0)-r|0)>=1){o=r+1|0;p=1224;while(1){if(!(r>>>0<o>>>0)){break}if((a[r]|0)==(a[p]|0)){p=p+1|0;r=r+1|0}else{break a}}Ia(30224)|0;t=ce(b)|0;s=c[(c[d>>2]|0)+52>>2]|0;t=rc[c[(c[t>>2]|0)+44>>2]&63](t,1)|0;jc[s&63](d,t,e)|0}}while(0);de(h,n)|0;p=c[q>>2]|0;o=1360;n=c[n>>2]|0;while(1){if(!(n>>>0<p>>>0)){k=9;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{break}}if((k|0)==9?(a[o]|0)==0:0){n=ce(b)|0;je(h);p=c[h>>2]|0;o=c[m>>2]|0;b:do{if(p>>>0<o>>>0){do{d=a[p]|0;if(!((d&255)<127)){break b}c:do{if((a[28408+(d&255)|0]&16)==0){if(!(d<<24>>24==47)){break b}d=p+1|0;if(d>>>0<o>>>0){d=a[d]|0;if(d<<24>>24==47){p=p+2|0;c[h>>2]=p;if(!(p>>>0<o>>>0)){break}while(1){t=a[p]|0;if(t<<24>>24==10|t<<24>>24==13){break c}p=p+1|0;c[h>>2]=p;if(!(p>>>0<o>>>0)){break c}}}else if(!(d<<24>>24==42)){break}d=p+2|0;c[h>>2]=d;q=p+3|0;d:do{if(q>>>0<o>>>0){while(1){if((a[d]|0)==42){p=d+1|0;if((a[q]|0)==47){break d}}else{p=d+1|0}c[h>>2]=p;q=p+1|0;if(q>>>0<o>>>0){d=p}else{d=p;k=25;break}}}else{k=25}}while(0);if((k|0)==25){k=0;p=d+1|0}if(p>>>0<o>>>0){p=d+2|0;c[h>>2]=p;break}else{c[h>>2]=p;break}}}else{p=p+1|0;c[h>>2]=p}}while(0)}while(p>>>0<o>>>0)}}while(0);o=o-p|0;e:do{if((o|0)<1){k=42}else{d=p+1|0;q=1264;r=p;while(1){if(!(r>>>0<d>>>0)){break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{k=42;break e}}if((o|0)>=5){d=p+5|0;o=2152;while(1){if(!(p>>>0<d>>>0)){k=42;break e}if((a[p]|0)==(a[o]|0)){o=o+1|0;p=p+1|0}else{break}}}l=ce(b)|0;je(h)}}while(0);if((k|0)==42){c[l>>2]=2160;c[l+4>>2]=2178;l=Zc(c[b>>2]|0,l)|0;if((l|0)==0){o=0}else{o=c[l>>2]|0}l=n;n=o}p=c[h>>2]|0;m=c[m>>2]|0;f:do{if(p>>>0<m>>>0){do{o=a[p]|0;if(!((o&255)<127)){break f}g:do{if((a[28408+(o&255)|0]&16)==0){if(!(o<<24>>24==47)){break f}o=p+1|0;if(o>>>0<m>>>0){o=a[o]|0;if(o<<24>>24==47){p=p+2|0;c[h>>2]=p;if(!(p>>>0<m>>>0)){break}while(1){t=a[p]|0;if(t<<24>>24==10|t<<24>>24==13){break g}p=p+1|0;c[h>>2]=p;if(!(p>>>0<m>>>0)){break g}}}else if(!(o<<24>>24==42)){break}o=p+2|0;c[h>>2]=o;d=p+3|0;h:do{if(d>>>0<m>>>0){while(1){if((a[o]|0)==42){p=o+1|0;if((a[d]|0)==47){break h}else{o=p}}else{o=o+1|0}c[h>>2]=o;d=o+1|0;if(!(d>>>0<m>>>0)){k=57;break}}}else{k=57}}while(0);if((k|0)==57){k=0;p=o+1|0}if(p>>>0<m>>>0){p=o+2|0;c[h>>2]=p;break}else{c[h>>2]=p;break}}}else{p=p+1|0;c[h>>2]=p}}while(0)}while(p>>>0<m>>>0)}}while(0);i:do{if((m-p|0)<5){k=70}else{m=p+5|0;o=2152;while(1){if(!(p>>>0<m>>>0)){break}if((a[p]|0)==(a[o]|0)){o=o+1|0;p=p+1|0}else{k=70;break i}}t=j;c[t>>2]=-2147483648;c[t+4>>2]=-1}}while(0);if((k|0)==70?!(le(h,j)|0):0){g=c[b+24>>2]|0;j=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(j>>>0<e>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(e|0))}else{h=0}ee(g,3,h+b|0,2184,0);i=f;return}je(h);p=b+12|0;s=c[p>>2]|0;o=b+4|0;d=c[o>>2]|0;m=b+16|0;q=c[m>>2]|0;if(s>>>0<d>>>0){r=0;do{r=((a[s]|0)==10)+r|0;s=s+1|0}while((s|0)!=(d|0))}else{r=0}s=r+q|0;r=b+24|0;t=0;do{te(b,0);t=t+1|0;if((c[(c[r>>2]|0)+8>>2]|0)>0){k=86;break}je(h);q=c[h>>2]|0}while(!(gd(h,41)|0));if((k|0)==86){i=f;return}h=c[j>>2]|0;j=c[j+4>>2]|0;if(!((h|0)==-2147483648&(j|0)==-1)?!((t|0)==(h|0)&(((t|0)<0)<<31>>31|0)==(j|0)):0){b=c[r>>2]|0;h=c[p>>2]|0;e=c[o>>2]|0;g=c[m>>2]|0;if(h>>>0<e>>>0){j=0;do{j=((a[h]|0)==10)+j|0;h=h+1|0}while((h|0)!=(e|0))}else{j=0}ee(b,2,j+g|0,2208,0);i=f;return}e=c[c[e>>2]>>2]|0;c[g>>2]=d;c[g+4>>2]=q;ue(e,c[1102]|0,t,n,l,s,g)|0;if((a[b+20|0]|0)==0){i=f;return}ve(e,c[r>>2]|0);i=f;return}g=c[b+24>>2]|0;j=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(j>>>0<e>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(e|0))}else{h=0}ee(g,3,h+b|0,1368,0);i=f;return}function te(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;h=d+8|0;m=d;g=h+4|0;c[g>>2]=0;c[h>>2]=0;f=b+4|0;de(f,h)|0;k=c[g>>2]|0;j=2152;l=c[h>>2]|0;while(1){if(!(l>>>0<k>>>0)){e=4;break}if((a[l]|0)==(a[j]|0)){j=j+1|0;l=l+1|0}else{break}}if((e|0)==4?(a[j]|0)==0:0){if(!(gd(f,40)|0)){e=c[b+24>>2]|0;h=c[b+12>>2]|0;f=c[b+4>>2]|0;b=c[b+16>>2]|0;if(h>>>0<f>>>0){g=0;do{g=((a[h]|0)==10)+g|0;h=h+1|0}while((h|0)!=(f|0))}else{g=0}ee(e,3,g+b|0,1368,0);i=d;return}de(f,h)|0;if(!(le(h,m)|0)){e=c[b+24>>2]|0;h=c[b+12>>2]|0;f=c[b+4>>2]|0;b=c[b+16>>2]|0;if(h>>>0<f>>>0){g=0;do{g=((a[h]|0)==10)+g|0;h=h+1|0}while((h|0)!=(f|0))}else{g=0}ee(e,3,g+b|0,2256,0);i=d;return}je(f);b=0;a:while(1){b:while(1){de(f,h)|0;k=c[h>>2]|0;j=c[g>>2]|0;l=1360;m=k;while(1){if(!(m>>>0<j>>>0)){e=21;break}if((a[m]|0)==(a[l]|0)){l=l+1|0;m=m+1|0}else{break}}if((e|0)==21?(e=0,(a[l]|0)==0):0){b=1;continue a}c:do{if(b){l=1384;m=k;while(1){if(!(m>>>0<j>>>0)){break}if((a[m]|0)==(a[l]|0)){l=l+1|0;m=m+1|0}else{l=1384;break c}}if((a[l]|0)==0){b=0;continue a}else{l=1384}}else{l=1384}}while(0);while(1){if(!(k>>>0<j>>>0)){break}if((a[k]|0)==(a[l]|0)){l=l+1|0;k=k+1|0}else{continue b}}if((a[l]|0)==0){break a}}}i=d;return}e=c[b+24>>2]|0;h=c[b+12>>2]|0;f=c[b+4>>2]|0;b=c[b+16>>2]|0;if(h>>>0<f>>>0){g=0;do{g=((a[h]|0)==10)+g|0;h=h+1|0}while((h|0)!=(f|0))}else{g=0}ee(e,3,g+b|0,2240,0);i=d;return}function ue(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0;j=i;c[a>>2]=b;b=c[a+4>>2]|0;if((c[(c[b+8>>2]|0)+16>>2]&255|0)==0){o=b+12|0;n=c[o>>2]|0;rc[c[(c[n>>2]|0)+56>>2]&63](n,c[b>>2]|0)|0;c[o>>2]=e;Vd(b,c[e+12>>2]|0,0)|0;o=c[o>>2]|0;jc[c[(c[o>>2]|0)+48>>2]&63](o,c[b>>2]|0,0)|0}e=c[a+8>>2]|0;if((c[(c[e+8>>2]|0)+16>>2]&255|0)==0){o=e+12|0;n=c[o>>2]|0;rc[c[(c[n>>2]|0)+56>>2]&63](n,c[e>>2]|0)|0;c[o>>2]=f;Vd(e,c[f+12>>2]|0,0)|0;o=c[o>>2]|0;jc[c[(c[o>>2]|0)+48>>2]&63](o,c[e>>2]|0,0)|0}f=a+12|0;b=c[f>>2]|0;e=b+8|0;k=c[e>>2]|0;o=c[k+16>>2]&255;l=b+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=b+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(nc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(d|0)>(0-k|0)|(n|0)==(d|0)):0)?Wd(b,ba(c[(c[b+12>>2]|0)+12>>2]|0,d)|0,n,d,1)|0:0){c[b+16>>2]=d}c[a+16>>2]=g;n=c[h+4>>2]|0;o=a+20|0;c[o>>2]=c[h>>2];c[o+4>>2]=n;if((d|0)<=0){i=j;return 0}g=0;h=c[c[f>>2]>>2]|0;while(1){c[h+32>>2]=1;c[h+36>>2]=1;c[h+8>>2]=a;g=g+1|0;if((g|0)==(d|0)){break}else{h=h+40|0}}i=j;return 0}function ve(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+96|0;e=f+80|0;r=f+56|0;n=f+28|0;h=f;m=b+20|0;l=c[m>>2]|0;m=c[m+4>>2]|0;o=b+12|0;q=c[o>>2]|0;p=c[q>>2]|0;g=c[q+4>>2]|0;if((p|0)==0){i=f;return}if((c[p>>2]|0)!=0){i=f;return}c[e>>2]=0;j=e+4|0;c[j>>2]=0;c[r+0>>2]=0;c[r+4>>2]=0;c[r+8>>2]=0;c[r+12>>2]=0;a[r+16|0]=0;t=c[c[b>>2]>>2]|0;k=b+16|0;s=c[k>>2]|0;c[n+24>>2]=r;c[n>>2]=t;c[n+4>>2]=l;c[n+8>>2]=m;c[n+12>>2]=l;c[n+16>>2]=s;a[n+20|0]=0;if(p>>>0<g>>>0){do{we(n,p,e);p=p+40|0}while(p>>>0<g>>>0);q=c[o>>2]|0;p=c[e>>2]|0}else{p=0}n=c[q>>2]|0;r=c[c[c[n+8>>2]>>2]>>2]|0;q=r+52|0;s=c[q>>2]|0;if(!((s+p|0)>>>0>(c[r+60>>2]|0)>>>0)){o=wt(p)|0;if((o|0)!=0){Yt(o|0,0,p|0)|0;p=s+1|0;c[q>>2]=p;q=r+44|0;c[q>>2]=(c[q>>2]|0)+1;q=r+56|0;if(p>>>0>(c[q>>2]|0)>>>0){c[q>>2]=p}}else{o=0}}else{o=r+48|0;c[o>>2]=(c[o>>2]|0)+1;c[(c[1102]|0)+16>>2]=0;Ia(30192)|0;o=0}c[j>>2]=o;s=c[c[b>>2]>>2]|0;t=c[k>>2]|0;c[h+24>>2]=d;c[h>>2]=s;c[h+4>>2]=l;c[h+8>>2]=m;c[h+12>>2]=l;c[h+16>>2]=t;a[h+20|0]=0;if(!(n>>>0<g>>>0)){i=f;return}do{we(h,n,e);n=n+40|0}while(n>>>0<g>>>0);i=f;return}function we(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;f=i;i=i+3392|0;y=f+32|0;t=f+16|0;o=f+8|0;v=f+56|0;l=f+72|0;A=f+24|0;k=f+64|0;E=f;q=f+48|0;r=f+40|0;h=b+24|0;w=c[h>>2]|0;c[l+3264>>2]=0;c[l+3260>>2]=0;j=l+3236|0;c[j>>2]=0;c[l+3240>>2]=0;c[l+3244>>2]=0;u=l+12|0;c[u>>2]=0;c[l+1216>>2]=0;z=l+2420|0;c[z>>2]=0;p=l+3304|0;c[p>>2]=0;x=l+3232|0;c[x>>2]=d;B=c[d+8>>2]|0;s=l+3228|0;c[s>>2]=B;n=l+4|0;c[n>>2]=w;w=l+8|0;c[w>>2]=e;a[l+3308|0]=0;C=c[B+4>>2]|0;c[l+3276>>2]=C;c[l+3272>>2]=c[C>>2];c[l+3268>>2]=c[C+12>>2];B=c[B+8>>2]|0;c[l+3288>>2]=B;c[l+3284>>2]=c[B>>2];c[l+3280>>2]=c[B+12>>2];c[l+2424>>2]=0;B=l+3300|0;c[B>>2]=-1;Yt(l+2428|0,0,800)|0;Yt(l+1220|0,0,1200)|0;C=A+4|0;c[C>>2]=0;c[A>>2]=0;e=k+4|0;c[e>>2]=0;c[k>>2]=0;D=b+4|0;de(D,A)|0;H=c[C>>2]|0;G=2152;F=c[A>>2]|0;while(1){if(!(F>>>0<H>>>0)){g=4;break}if((a[F]|0)==(a[G]|0)){G=G+1|0;F=F+1|0}else{break}}if((g|0)==4?(a[G]|0)==0:0){if(!(gd(D,40)|0)){g=c[h>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1368,0);i=f;return}de(D,A)|0;if(!(le(A,E)|0)){g=c[h>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,2256,0);i=f;return}E=c[E>>2]|0;G=c[x>>2]|0;F=G+32|0;G=G+36|0;if((c[F>>2]|0)==(c[G>>2]|0)){c[G>>2]=E}c[F>>2]=E;c[j>>2]=d;je(D);de(D,k)|0;d=b+12|0;j=b+4|0;b=b+16|0;J=l+3296|0;I=l+3260|0;K=v+4|0;H=l+3252|0;E=l+3248|0;G=r+4|0;F=q+4|0;a:while(1){M=c[k>>2]|0;L=c[e>>2]|0;N=1384;O=M;while(1){if(!(O>>>0<L>>>0)){g=22;break}if((a[O]|0)==(a[N]|0)){N=N+1|0;O=O+1|0}else{N=2280;break}}if((g|0)==22){if((a[N]|0)==0){g=134;break}else{N=2280}}while(1){if(!(M>>>0<L>>>0)){g=25;break}if((a[M]|0)==(a[N]|0)){N=N+1|0;M=M+1|0}else{g=46;break}}do{if((g|0)==25){g=0;if((a[N]|0)==0){if(!(gd(D,40)|0)){g=27;break a}c[F>>2]=0;c[q>>2]=0;if(!(de(D,q)|0)){g=31;break a}if(!(gd(D,41)|0)){g=35;break a}if((c[(c[w>>2]|0)+4>>2]|0)!=0){if(!(le(q,o)|0)){R=c[q>>2]|0;c[y>>2]=(c[F>>2]|0)-R;c[y+4>>2]=R;bb(4560,y|0)|0;break}R=o;L=c[R>>2]|0;R=c[R+4>>2]|0;if(!((R|0)<0|(R|0)==0&L>>>0<200)){c[y>>2]=L;bb(4520,y|0)|0;break}if((c[B>>2]|0)<0){c[l+(L<<2)+2428>>2]=1;c[B>>2]=L;break}else{c[y>>2]=L;bb(4472,y|0)|0;break}}}else{g=46}}}while(0);if((g|0)==46){g=0;if((xe(l,k)|0)==0){L=c[h>>2]|0;P=c[d>>2]|0;N=c[j>>2]|0;M=c[b>>2]|0;if(P>>>0<N>>>0){O=0;do{O=((a[P]|0)==10)+O|0;P=P+1|0}while((P|0)!=(N|0))}else{O=0}ee(L,2,O+M|0,2312,k)}if(!(gd(D,40)|0)){g=51;break}de(D,A)|0;b:while(1){L=c[C>>2]|0;N=1384;M=c[A>>2]|0;while(1){if(!(M>>>0<L>>>0)){g=58;break}if((a[M]|0)==(a[N]|0)){N=N+1|0;M=M+1|0}else{break}}if((g|0)==58?(g=0,(a[N]|0)==0):0){break}c[l>>2]=0;M=c[J>>2]|0;c:do{if((M|0)==0){g=64}else{R=c[(c[M>>2]|0)+24>>2]|0;N=c[E>>2]|0;c[E>>2]=N+1;N=rc[R&63](M,N)|0;do{if((N|0)==0){if((c[p>>2]|0)!=0){N=c[H>>2]|0;Q=A;M=c[Q>>2]|0;Q=c[Q+4>>2]|0;R=I;c[R>>2]=M;c[R+4>>2]=Q;if((N|0)==0){break c}else{break}}else{c[H>>2]=0;c[l>>2]=1;g=64;break c}}else{c[H>>2]=N;Q=A;M=c[Q>>2]|0;Q=c[Q+4>>2]|0;R=I;c[R>>2]=M;c[R+4>>2]=Q}}while(0);c[G>>2]=0;c[r>>2]=0;mc[c[(c[N>>2]|0)+28>>2]&63](N,r);O=c[r>>2]|0;N=c[G>>2]|0;Q=2336;P=O;while(1){if(!(P>>>0<N>>>0)){g=69;break}if((a[P]|0)==(a[Q]|0)){Q=Q+1|0;P=P+1|0}else{Q=2352;P=O;break}}if((g|0)==69){g=0;if((a[Q]|0)==0){R=c[u>>2]|0;c[u>>2]=R+1;R=l+(R<<2)+16|0;c[p>>2]=R;c[R>>2]=0;continue b}else{Q=2352;P=O}}while(1){if(!(P>>>0<N>>>0)){g=73;break}if((a[P]|0)==(a[Q]|0)){Q=Q+1|0;P=P+1|0}else{P=2368;Q=O;break}}if((g|0)==73){g=0;if((a[Q]|0)==0){ye(l,A);break}else{P=2368;Q=O}}while(1){if(!(Q>>>0<N>>>0)){g=77;break}if((a[Q]|0)==(a[P]|0)){P=P+1|0;Q=Q+1|0}else{P=2376;Q=O;break}}if((g|0)==77){g=0;if((a[P]|0)==0){le(A,t)|0;N=t;L=c[N>>2]|0;N=c[N+4>>2]|0;if((N|0)>=0){M=c[(c[s>>2]|0)+12>>2]|0;R=c[(c[M+8>>2]|0)+16>>2]&255;P=M+(R<<2)+16|0;if((R|0)==0){O=0;Q=1}else{Q=1;R=M+16|0;while(1){O=R+4|0;Q=ba(c[R>>2]|0,Q)|0;if(O>>>0<P>>>0){R=O}else{break}}O=((Q|0)<0)<<31>>31}if((N|0)<(O|0)|(N|0)==(O|0)&L>>>0<Q>>>0){c[l>>2]=10;R=(c[M>>2]|0)+(ba(c[(c[M+12>>2]|0)+12>>2]|0,L)|0)|0;c[l+(c[u>>2]<<2)+416>>2]=0;L=c[u>>2]|0;c[u>>2]=L+1;c[l+(L<<2)+16>>2]=R;L=c[p>>2]|0;if((L|0)==0){break}c[L>>2]=(c[L>>2]|0)+1;break}}c[l>>2]=0;break}else{P=2376;Q=O}}while(1){if(!(Q>>>0<N>>>0)){g=89;break}if((a[Q]|0)==(a[P]|0)){P=P+1|0;Q=Q+1|0}else{P=2384;Q=O;break}}if((g|0)==89){g=0;if((a[P]|0)==0){ze(l,A)|0;break}else{P=2384;Q=O}}while(1){if(!(Q>>>0<N>>>0)){g=93;break}if((a[Q]|0)==(a[P]|0)){P=P+1|0;Q=Q+1|0}else{P=2408;Q=O;break}}if((g|0)==93){g=0;if((a[P]|0)==0){Ae(l,A);break}else{P=2408;Q=O}}while(1){if(!(Q>>>0<N>>>0)){g=97;break}if((a[Q]|0)==(a[P]|0)){P=P+1|0;Q=Q+1|0}else{P=2432;break}}if((g|0)==97){g=0;if((a[P]|0)==0){Be(l,A,1);break}else{P=2432}}while(1){if(!(O>>>0<N>>>0)){g=101;break}if((a[O]|0)==(a[P]|0)){P=P+1|0;O=O+1|0}else{break}}if((g|0)==101?(g=0,(a[P]|0)==0):0){c[l>>2]=12;c[l+(c[u>>2]<<2)+416>>2]=0;R=c[u>>2]|0;c[u>>2]=R+1;c[l+(R<<2)+16>>2]=M+1;M=c[p>>2]|0;if((M|0)!=0){c[M>>2]=(c[M>>2]|0)+1}c[l+(c[u>>2]<<2)+416>>2]=0;R=c[u>>2]|0;c[u>>2]=R+1;c[l+(R<<2)+16>>2]=L+ -1;L=c[p>>2]|0;if((L|0)==0){break}c[L>>2]=(c[L>>2]|0)+1;break}Be(l,A,0)}}while(0);if((g|0)==64){g=0;P=A;Q=c[P+4>>2]|0;R=I;c[R>>2]=c[P>>2];c[R+4>>2]=Q}je(D);M=c[l>>2]|0;L=(M|0)<6;if(!(!L?(a[(c[h>>2]|0)+16|0]|0)==0:0)){g=109}d:do{if((g|0)==109){g=0;Q=c[d>>2]|0;O=c[j>>2]|0;N=c[b>>2]|0;if(Q>>>0<O>>>0){P=0;do{P=((a[Q]|0)==10)+P|0;Q=Q+1|0}while((Q|0)!=(O|0))}else{P=0}N=P+N|0;switch(M|0){case 2:{M=4712;break};case 4:{M=4776;break};case 5:{M=4800;break};case 3:{c[K>>2]=0;c[v>>2]=0;R=c[H>>2]|0;mc[c[(c[R>>2]|0)+28>>2]&63](R,v);ee(c[n>>2]|0,2,N,4736,v);break d};case 10:{M=4824;break};case 6:{M=4848;break};case 11:{M=4872;break};case 9:{M=4896;break};case 7:{M=4920;break};case 8:{M=4944;break};case 12:{M=4968;break};case 13:{M=4992;break};case 0:{M=(c[J>>2]|0)==0;if(M){break d}else{M=M?0:4664}break};case 1:{M=4688;break};default:{M=5016}}ee(c[n>>2]|0,L?2:0,N,M,I)}}while(0);de(D,A)|0}Ce(l)|0}de(D,k)|0;N=c[e>>2]|0;L=2448;M=c[k>>2]|0;while(1){if(!(M>>>0<N>>>0)){break}if((a[M]|0)==(a[L]|0)){L=L+1|0;M=M+1|0}else{continue a}}if((a[L]|0)!=0){continue}de(D,k)|0}if((g|0)==27){g=c[h>>2]|0;k=c[d>>2]|0;h=c[j>>2]|0;b=c[b>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1368,0);i=f;return}else if((g|0)==31){g=c[h>>2]|0;k=c[d>>2]|0;h=c[j>>2]|0;b=c[b>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,2288,0);i=f;return}else if((g|0)==35){g=c[h>>2]|0;k=c[d>>2]|0;h=c[j>>2]|0;b=c[b>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1480,0);i=f;return}else if((g|0)==51){g=c[h>>2]|0;k=c[d>>2]|0;h=c[j>>2]|0;b=c[b>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1368,0);i=f;return}else if((g|0)==134){c[y>>2]=5112;c[y+4>>2]=5116;xe(l,y)|0;Ce(l)|0;R=c[x>>2]|0;c[R+20>>2]=c[R>>2];if((c[(c[w>>2]|0)+4>>2]|0)!=0?(m=c[z>>2]|0,(m|0)>0):0){n=0;do{c[c[l+(n*12|0)+1228>>2]>>2]=c[c[l+(n*12|0)+1224>>2]>>2];n=n+1|0}while((n|0)!=(m|0))}l=c[e>>2]|0;m=1384;k=c[k>>2]|0;while(1){if(!(k>>>0<l>>>0)){g=140;break}if((a[k]|0)==(a[m]|0)){m=m+1|0;k=k+1|0}else{break}}if((g|0)==140?(a[m]|0)==0:0){i=f;return}g=c[h>>2]|0;k=c[d>>2]|0;h=c[j>>2]|0;b=c[b>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,1480,0);i=f;return}}g=c[h>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}ee(g,3,j+b|0,2240,0);i=f;return}function xe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+16|0;k=h;if((a[4464]|0)==0?(wa(4464)|0)!=0:0){c[1114]=1728;c[4460>>2]=1745;Va(4464)}f=b+3296|0;c[f>>2]=0;c[b+3248>>2]=0;c[b+3252>>2]=0;c[b+12>>2]=0;c[b+1216>>2]=0;g=b+3308|0;a[g]=0;j=Zc(c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0,d)|0;if((j|0)==0){p=c[f>>2]|0;i=h;return p|0}j=c[j>>2]|0;if((j|0)==0){p=c[f>>2]|0;i=h;return p|0}if((c[j+16>>2]&2031616|0)==983040){c[b+3292>>2]=j;c[f>>2]=rc[c[(c[j>>2]|0)+24>>2]&63](j,0)|0;p=c[f>>2]|0;i=h;return p|0}l=k+4|0;m=j;a:while(1){c[l>>2]=0;c[k>>2]=0;mc[c[(c[m>>2]|0)+28>>2]&63](m,k);p=c[1114]|0;o=(c[4460>>2]|0)-p|0;n=c[k>>2]|0;if(((c[l>>2]|0)-n|0)==(o|0)){o=n+o|0;while(1){if(!(n>>>0<o>>>0)){break a}if((a[n]|0)==(a[p]|0)){p=p+1|0;n=n+1|0}else{break}}}m=nc[c[(c[m>>2]|0)+12>>2]&1023](m)|0;if((m|0)==0){e=15;break}}if((e|0)==15){l=c[4460>>2]|0;k=144;m=c[1114]|0;while(1){if(!(m>>>0<l>>>0)){break}if((a[m]|0)==(a[k]|0)){k=k+1|0;m=m+1|0}else{e=20;break}}if((e|0)==20){p=c[f>>2]|0;i=h;return p|0}if((a[k]|0)!=0){p=c[f>>2]|0;i=h;return p|0}}a[g]=1;p=ze(b,d)|0;c[b+3292>>2]=j;c[f>>2]=c[(c[p+4>>2]|0)+12>>2];p=c[f>>2]|0;i=h;return p|0}function ye(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d;if(!(le(b,e)|0)){c[a>>2]=0;i=d;return}g=e;b=c[g>>2]|0;g=c[g+4>>2]|0;if(!((g|0)<0|(g|0)==0&b>>>0<200)){i=d;return}g=a+(b<<2)+2428|0;f=(c[g>>2]|0)>>>0<2>>>0;c[a>>2]=11;if(!f){f=c[g>>2]|0;e=a+12|0;c[a+(c[e>>2]<<2)+416>>2]=0;g=c[e>>2]|0;c[e>>2]=g+1;c[a+(g<<2)+16>>2]=f;a=c[a+3304>>2]|0;if((a|0)==0){i=d;return}c[a>>2]=(c[a>>2]|0)+1;i=d;return}b=a+12|0;f=c[b>>2]|0;h=a+1216|0;e=c[h>>2]|0;c[h>>2]=e+1;c[a+(e<<2)+816>>2]=f;e=a+2420|0;f=c[e>>2]|0;if((f|0)>=100){Ia(30280)|0;i=d;return}c[e>>2]=f+1;e=a+(f*12|0)+1220|0;c[e>>2]=0;c[a+(f*12|0)+1224>>2]=g;c[a+(c[b>>2]<<2)+416>>2]=0;h=c[b>>2]|0;c[b>>2]=h+1;c[a+(h<<2)+16>>2]=e;a=c[a+3304>>2]|0;if((a|0)==0){i=d;return}c[a>>2]=(c[a>>2]|0)+1;i=d;return}function ze(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+16|0;h=e;if((a[4624]|0)==0?(wa(4624)|0)!=0:0){c[1152]=4632;c[1154]=4658;Va(4624)}f=b+3228|0;d=Zc(c[c[c[f>>2]>>2]>>2]|0,d)|0;if((d|0)==0){n=0;i=e;return n|0}g=c[d>>2]|0;if((g|0)==0){n=0;i=e;return n|0}d=rc[c[(c[g>>2]|0)+44>>2]&63](g,1)|0;k=c[(c[d>>2]|0)+8>>2]|0;a:do{if((k|0)==0){h=14}else{j=h+4|0;while(1){c[j>>2]=0;c[h>>2]=0;mc[c[(c[k>>2]|0)+28>>2]&63](k,h);n=c[1152]|0;l=(c[1154]|0)-n|0;m=c[h>>2]|0;if(((c[j>>2]|0)-m|0)==(l|0)){l=m+l|0;while(1){if(!(m>>>0<l>>>0)){h=18;break a}if((a[m]|0)==(a[n]|0)){n=n+1|0;m=m+1|0}else{break}}}k=nc[c[(c[k>>2]|0)+12>>2]&1023](k)|0;if((k|0)==0){h=14;break}}}}while(0);b:do{if((h|0)==14){k=c[1154]|0;j=144;h=c[1152]|0;while(1){if(!(h>>>0<k>>>0)){break}if((a[h]|0)==(a[j]|0)){j=j+1|0;h=h+1|0}else{h=20;break b}}if((a[j]|0)==0){h=18}else{h=20}}}while(0);if((h|0)==18){if((c[(c[b+8>>2]|0)+4>>2]|0)==0){h=20}else{f=Qd(c[c[c[f>>2]>>2]>>2]|0,g)|0;f=c[(rc[c[(c[f>>2]|0)+44>>2]&63](f,1)|0)>>2]|0}}if((h|0)==20){f=c[d>>2]|0}f=c[f>>2]|0;if((f|0)==0){n=f;i=e;return n|0}c[b>>2]=10;m=c[c[f+12>>2]>>2]|0;l=b+12|0;c[b+(c[l>>2]<<2)+416>>2]=0;n=c[l>>2]|0;c[l>>2]=n+1;c[b+(n<<2)+16>>2]=m;b=c[b+3304>>2]|0;if((b|0)==0){n=f;i=e;return n|0}c[b>>2]=(c[b>>2]|0)+1;n=f;i=e;return n|0}function Ae(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d;b=Zc(c[c[c[a+3228>>2]>>2]>>2]|0,b)|0;if((b|0)==0){b=0}else{b=c[b>>2]|0}jc[c[(c[b>>2]|0)+48>>2]&63](b,e,0)|0;c[a>>2]=13;e=c[e>>2]|0;f=a+12|0;c[a+(c[f>>2]<<2)+416>>2]=0;b=c[f>>2]|0;c[f>>2]=b+1;c[a+(b<<2)+16>>2]=e;a=c[a+3304>>2]|0;if((a|0)==0){i=d;return}c[a>>2]=(c[a>>2]|0)+1;i=d;return}function Be(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+32|0;k=f+24|0;g=f+16|0;m=f+8|0;j=f;c[g>>2]=0;bf(b,d,g);d=b+3256|0;n=c[d>>2]|0;if((n|0)==0){i=f;return}o=m+4|0;c[o>>2]=0;c[m>>2]=0;l=j+4|0;c[l>>2]=0;c[j>>2]=0;mc[c[(c[n>>2]|0)+28>>2]&63](n,m);p=c[b+3252>>2]|0;mc[c[(c[p>>2]|0)+28>>2]&63](p,j);a:do{if(e){p=c[d>>2]|0;o=b+12|0;c[b+(c[o>>2]<<2)+416>>2]=0;h=c[o>>2]|0;c[o>>2]=h+1;c[b+(h<<2)+16>>2]=p;h=c[b+3304>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}}else{n=c[o>>2]|0;e=144;m=c[m>>2]|0;while(1){if(!(m>>>0<n>>>0)){h=8;break}if((a[m]|0)==(a[e]|0)){e=e+1|0;m=m+1|0}else{break}}if((h|0)==8?(a[e]|0)==0:0){break}e=c[d>>2]|0;if((e|0)!=0){m=k+4|0;do{c[m>>2]=0;c[k>>2]=0;mc[c[(c[e>>2]|0)+28>>2]&63](e,k);p=c[j>>2]|0;n=(c[l>>2]|0)-p|0;o=c[k>>2]|0;if(((c[m>>2]|0)-o|0)==(n|0)){n=o+n|0;while(1){if(!(o>>>0<n>>>0)){break a}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{break}}}e=nc[c[(c[e>>2]|0)+12>>2]&1023](e)|0}while((e|0)!=0)}k=c[l>>2]|0;l=144;j=c[j>>2]|0;while(1){if(!(j>>>0<k>>>0)){h=19;break}if((a[j]|0)==(a[l]|0)){l=l+1|0;j=j+1|0}else{break}}if((h|0)==19?(a[l]|0)==0:0){break}c[b>>2]=3}}while(0);o=c[g>>2]|0;n=b+12|0;c[b+(c[n>>2]<<2)+416>>2]=c[d>>2];p=c[n>>2]|0;c[n>>2]=p+1;c[b+(p<<2)+16>>2]=o;b=c[b+3304>>2]|0;if((b|0)==0){i=f;return}c[b>>2]=(c[b>>2]|0)+1;i=f;return}function Ce(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;h=d;g=c[b+3296>>2]|0;if((g|0)==0){m=0;i=d;return m|0}if((a[b+3308|0]|0)!=0){m=cf(b)|0;i=d;return m|0}f=b+3292|0;if(((c[g+16>>2]&67108864|0)!=0?(j=c[f>>2]|0,(a[j+20|0]&7)==4):0)?(jc[c[(c[j>>2]|0)+48>>2]&63](j,h,0)|0,e=c[h>>2]|0,(e|0)!=0):0){m=nc[e&1023](b)|0;i=d;return m|0}c[b+3304>>2]=0;e=b+3240|0;c[e>>2]=(c[e>>2]|0)+1;e=c[b+12>>2]|0;m=b+3244|0;c[m>>2]=e+1+(c[m>>2]|0);f=c[f>>2]|0;if((c[f+12>>2]|0)==4?(c[f+16>>2]&16777216|0)!=0:0){l=(e<<2)+4|0;g=b+8|0;k=c[g>>2]|0;m=k+4|0;h=c[m>>2]|0;j=c[k>>2]|0;if((h|0)!=0){c[k>>2]=j-l;c[m>>2]=h+l;c[h>>2]=0;j=b+3236|0;k=c[j>>2]|0;if((k|0)!=0){c[k>>2]=h;c[j>>2]=0}}else{c[k>>2]=j+l;h=1}if((c[(c[g>>2]|0)+4>>2]|0)!=0?(jc[c[(c[f>>2]|0)+48>>2]&63](f,h,0)|0,(e|0)>0):0){f=h+4|0;g=0;do{c[f+(g<<2)>>2]=c[b+(g<<2)+16>>2];g=g+1|0}while((g|0)!=(e|0))}}else{h=0}if((c[(c[b+8>>2]|0)+4>>2]|0)==0){m=h;i=d;return m|0}e=b+3300|0;f=c[e>>2]|0;if((f|0)>-1){c[b+(f<<2)+2428>>2]=h;c[e>>2]=-1}f=c[b+1216>>2]|0;if((f|0)<=0){m=h;i=d;return m|0}e=h+4|0;g=0;do{l=e+(g<<2)|0;m=c[l>>2]|0;c[l>>2]=0;c[m+8>>2]=e+(c[b+(g<<2)+816>>2]<<2);g=g+1|0}while((g|0)<(f|0));i=d;return h|0}function De(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+16|0;e=g;if((a[2472]|0)==0?(wa(2472)|0)!=0:0){c[614]=1728;c[616]=1745;Va(2472)}b=b+40|0;j=e+4|0;k=0;h=c[b>>2]|0;while(1){if((h|0)==(k|0)){f=20;break}else{l=h}do{a:do{if((c[l+16>>2]&16777216|0)!=0){b:do{if((l|0)==0){f=13}else{m=l;while(1){c[j>>2]=0;c[e>>2]=0;mc[c[(c[m>>2]|0)+28>>2]&63](m,e);p=c[614]|0;o=(c[616]|0)-p|0;n=c[e>>2]|0;if(((c[j>>2]|0)-n|0)==(o|0)){o=n+o|0;while(1){if(!(n>>>0<o>>>0)){break b}if((a[n]|0)==(a[p]|0)){p=p+1|0;n=n+1|0}else{break}}}m=nc[c[(c[m>>2]|0)+12>>2]&1023](m)|0;if((m|0)==0){f=13;break}}}}while(0);if((f|0)==13){f=0;m=c[616]|0;o=144;n=c[614]|0;while(1){if(!(n>>>0<m>>>0)){break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{break a}}if((a[o]|0)!=0){break}}ve(c[c[(rc[c[(c[l>>2]|0)+44>>2]&63](l,1)|0)>>2]>>2]|0,d)}}while(0);l=c[l+4>>2]|0}while((l|0)!=(k|0));k=c[b>>2]|0;if((k|0)==(h|0)){f=20;break}else{p=h;h=k;k=p}}if((f|0)==20){i=g;return}}function Ee(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;c[b>>2]=d;a[b+4|0]=e&1;c[b+8>>2]=f;return}function Fe(f,g,h,j){f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0;k=i;i=i+112|0;m=k;l=k+12|0;do{if((g|0)==9){if((h|0)==2){j=e[j>>1]|0;h=0;g=2496;break}else if((h|0)==4){j=c[j>>2]|0;h=0;g=2496;break}else if((h|0)==1){j=d[j]|0;h=0;g=2496;break}else if((h|0)==8){h=j;j=c[h>>2]|0;h=c[h+4>>2]|0;g=2496;break}else{j=0;h=0;g=2496;break}}else if((g|0)==10){if((h|0)==8){h=j;j=c[h>>2]|0;h=c[h+4>>2]|0;g=2488;break}else if((h|0)==4){h=c[j>>2]|0;j=h;h=((h|0)<0)<<31>>31;g=2488;break}else if((h|0)==2){h=b[j>>1]|0;j=h;h=((h|0)<0)<<31>>31;g=2488;break}else if((h|0)==1){h=a[j]|0;j=h;h=((h|0)<0)<<31>>31;g=2488;break}else{j=0;h=0;g=2488;break}}else{j=0;h=0;g=2504}}while(0);c[m>>2]=c[f+8>>2];n=m+4|0;c[n>>2]=j;c[n+4>>2]=h;m=Bb(l|0,100,g|0,m|0)|0;f=c[f>>2]|0;n=c[(c[f+8>>2]|0)+16>>2]&255;h=f+(n<<2)+16|0;if((n|0)==0){n=1;Yd(f,n,m,l)|0;i=k;return}j=1;n=f+16|0;while(1){g=n+4|0;j=ba(c[n>>2]|0,j)|0;if(g>>>0<h>>>0){n=g}else{break}}Yd(f,j,m,l)|0;i=k;return}function Ge(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+16|0;j=f+8|0;h=f;g=h+4|0;c[g>>2]=0;c[h>>2]=0;mc[c[(c[d>>2]|0)+28>>2]&63](d,h);l=c[g>>2]|0;m=2032;d=c[h>>2]|0;while(1){if(!(d>>>0<l>>>0)){k=4;break}if((a[d]|0)==(a[m]|0)){m=m+1|0;d=d+1|0}else{break}}if((k|0)==4?(a[m]|0)==0:0){e=c[e>>2]|0;if((e|0)!=0){c[j>>2]=29032;c[j+4>>2]=b;mc[c[(c[e>>2]|0)+8>>2]&63](e,j);i=f;return}b=c[b>>2]|0;n=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;h=b+16|0;while(1){g=h+4|0;j=ba(c[h>>2]|0,j)|0;if(g>>>0<e>>>0){h=g}else{break}}}Yd(b,j,4,2568)|0;i=f;return}k=c[b>>2]|0;a[j]=94;n=c[(c[k+8>>2]|0)+16>>2]&255;d=k+(n<<2)+16|0;if((n|0)==0){m=1}else{m=1;n=k+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<d>>>0){n=l}else{break}}}Yd(k,m,1,j)|0;j=c[b>>2]|0;h=c[h>>2]|0;g=(c[g>>2]|0)-h|0;n=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=j+16|0;while(1){d=m+4|0;l=ba(c[m>>2]|0,l)|0;if(d>>>0<k>>>0){m=d}else{break}}}Yd(j,l,g,h)|0;if((c[e>>2]|0)!=0){i=f;return}b=c[b>>2]|0;n=c[(c[b+8>>2]|0)+16>>2]&255;g=b+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;h=b+16|0;while(1){e=h+4|0;j=ba(c[h>>2]|0,j)|0;if(e>>>0<g>>>0){h=e}else{break}}}Yd(b,j,5,2560)|0;i=f;return}function He(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+16|0;g=d;h=c[e+12>>2]|0;if((f|0)==1){if((((c[h+16>>2]|0)>>>16&31)+ -13|0)>>>0<2){f=b+4|0;if((a[f]|0)!=0){h=c[b>>2]|0;a[g]=39;n=c[(c[h+8>>2]|0)+16>>2]&255;j=h+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=h+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Yd(h,l,1,g)|0}h=c[b>>2]|0;n=c[(c[e+8>>2]|0)+16>>2]&255;l=e+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;m=e+16|0;while(1){k=m+4|0;j=ba(c[m>>2]|0,j)|0;if(k>>>0<l>>>0){m=k}else{break}}}e=c[e>>2]|0;n=c[(c[h+8>>2]|0)+16>>2]&255;l=h+(n<<2)+16|0;if((n|0)==0){m=1}else{m=1;n=h+16|0;while(1){k=n+4|0;m=ba(c[n>>2]|0,m)|0;if(k>>>0<l>>>0){n=k}else{break}}}Yd(h,m,j,e)|0;if((a[f]|0)==0){i=d;return}b=c[b>>2]|0;a[g]=39;n=c[(c[b+8>>2]|0)+16>>2]&255;f=b+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;h=b+16|0;while(1){e=h+4|0;j=ba(c[h>>2]|0,j)|0;if(e>>>0<f>>>0){h=e}else{break}}}Yd(b,j,1,g)|0;i=d;return}}else{if((f|0)<=0){if((f|0)!=0){i=d;return}Je(b,h,c[e>>2]|0);i=d;return}}a[b+4|0]=1;Ie(b,h,f,c[e>>2]|0,e+16|0,e+((c[(c[e+8>>2]|0)+16>>2]&255)<<2)+16|0);i=d;return}function Ie(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;k=i;i=i+16|0;j=k;l=e+ -1|0;e=c[h+(l<<2)>>2]|0;n=c[g+(l<<2)>>2]|0;m=c[b>>2]|0;a[j]=40;s=c[(c[m+8>>2]|0)+16>>2]&255;p=m+(s<<2)+16|0;if((s|0)==0){r=1}else{r=1;q=m+16|0;while(1){o=q+4|0;r=ba(c[q>>2]|0,r)|0;if(o>>>0<p>>>0){q=o}else{break}}}Yd(m,r,1,j)|0;if((n|0)>0){m=(l|0)==0;o=0;while(1){n=n+ -1|0;if(o){o=c[b>>2]|0;a[j]=32;s=c[(c[o+8>>2]|0)+16>>2]&255;q=o+(s<<2)+16|0;if((s|0)==0){s=1}else{s=1;r=o+16|0;while(1){p=r+4|0;s=ba(c[r>>2]|0,s)|0;if(p>>>0<q>>>0){r=p}else{break}}}Yd(o,s,1,j)|0}if(m){Je(b,d,f)}else{Ie(b,d,l,f,g,h)}if((n|0)<=0){break}else{o=1;f=f+e|0}}}b=c[b>>2]|0;a[j]=41;s=c[(c[b+8>>2]|0)+16>>2]&255;h=b+(s<<2)+16|0;if((s|0)==0){s=1;Yd(b,s,1,j)|0;i=k;return}e=1;g=b+16|0;while(1){d=g+4|0;e=ba(c[g>>2]|0,e)|0;if(d>>>0<h>>>0){g=d}else{break}}Yd(b,e,1,j)|0;i=k;return}function Je(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,j=0,l=0,m=0,n=0,o=0,p=0.0;f=i;i=i+208|0;j=f;m=f+108|0;l=f+8|0;o=c[d+16>>2]|0;n=o>>>16&31;switch(n|0){case 4:{b=c[b>>2]|0;a[j]=42;o=c[(c[b+8>>2]|0)+16>>2]&255;m=b+(o<<2)+16|0;if((o|0)==0){e=1}else{e=1;n=b+16|0;while(1){l=n+4|0;e=ba(c[n>>2]|0,e)|0;if(l>>>0<m>>>0){n=l}else{break}}}Yd(b,e,1,j)|0;i=f;return};case 10:case 9:{Fe(b,n,c[d+12>>2]|0,e);i=f;return};case 3:{He(b,0,c[e>>2]|0,o&255);i=f;return};case 1:{Ke(b,d,e);i=f;return};case 12:{l=c[d+12>>2]|0;if((l|0)==8){a[k]=a[e];a[k+1|0]=a[e+1|0];a[k+2|0]=a[e+2|0];a[k+3|0]=a[e+3|0];a[k+4|0]=a[e+4|0];a[k+5|0]=a[e+5|0];a[k+6|0]=a[e+6|0];a[k+7|0]=a[e+7|0];p=+h[k>>3]}else if((l|0)==4){p=+g[e>>2]}else{p=0.0}h[k>>3]=p;l=c[k>>2]|0;e=c[k+4>>2]&2147483647;do{if(!(e>>>0>2146435072|(e|0)==2146435072&l>>>0>0)){if((l|0)==0&(e|0)==2146435072){l=p<0.0;j=l?4:3;m=l?2536:2544;break}else{h[k>>3]=p;c[j>>2]=c[k>>2];c[j+4>>2]=c[k+4>>2];j=Bb(m|0,100,2552,j|0)|0;break}}else{j=3;m=2528}}while(0);b=c[b>>2]|0;o=c[(c[b+8>>2]|0)+16>>2]&255;l=b+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;d=b+16|0;while(1){e=d+4|0;n=ba(c[d>>2]|0,n)|0;if(e>>>0<l>>>0){d=e}else{break}}}Yd(b,n,j,m)|0;i=f;return};case 6:{b=c[b>>2]|0;a[j]=(a[e]|0)!=0?116:102;o=c[(c[b+8>>2]|0)+16>>2]&255;m=b+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;e=b+16|0;while(1){l=e+4|0;n=ba(c[e>>2]|0,n)|0;if(l>>>0<m>>>0){e=l}else{break}}}Yd(b,n,1,j)|0;i=f;return};case 15:{Ge(b,d,e);i=f;return};default:{j=Bb(l|0,100,2576,j|0)|0;b=c[b>>2]|0;o=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;d=b+16|0;while(1){m=d+4|0;n=ba(c[d>>2]|0,n)|0;if(m>>>0<e>>>0){d=m}else{break}}}Yd(b,n,j,l)|0;i=f;return}}}function Ke(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+16|0;g=f;h=nc[c[(c[d>>2]|0)+16>>2]&1023](d)|0;a[b+4|0]=1;j=c[b>>2]|0;a[g]=40;o=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(o<<2)+16|0;if((o|0)==0){m=1}else{m=1;n=j+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<k>>>0){n=l}else{break}}}Yd(j,m,1,g)|0;if((h|0)>0){j=0;while(1){if((j|0)>0){k=c[b>>2]|0;a[g]=32;o=c[(c[k+8>>2]|0)+16>>2]&255;m=k+(o<<2)+16|0;if((o|0)==0){o=1}else{o=1;n=k+16|0;while(1){l=n+4|0;o=ba(c[n>>2]|0,o)|0;if(l>>>0<m>>>0){n=l}else{break}}}Yd(k,o,1,g)|0}k=j+1|0;o=rc[c[(c[d>>2]|0)+24>>2]&63](d,j)|0;Je(b,o,e+(nc[c[(c[o>>2]|0)+40>>2]&1023](o)|0)|0);if((k|0)==(h|0)){break}else{j=k}}}b=c[b>>2]|0;a[g]=41;o=c[(c[b+8>>2]|0)+16>>2]&255;d=b+(o<<2)+16|0;if((o|0)==0){o=1;Yd(b,o,1,g)|0;i=f;return}h=1;j=b+16|0;while(1){e=j+4|0;h=ba(c[j>>2]|0,h)|0;if(e>>>0<d>>>0){j=e}else{break}}Yd(b,h,1,g)|0;i=f;return}function Le(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+16|0;q=e+8|0;p=e;h=d+2|0;l=d+1|0;k=d+5|0;j=d+4|0;g=d+3|0;m=d+6|0;o=d+8|0;c[o>>2]=0;n=d+12|0;c[n>>2]=0;a[l+0|0]=0;a[l+1|0]=0;a[l+2|0]=0;a[l+3|0]=0;a[l+4|0]=0;a[l+5|0]=0;f=c[b>>2]|0;s=b+4|0;v=c[s>>2]|0;a:do{if(f>>>0<v>>>0){r=q+4|0;t=f;u=0;while(1){c[b>>2]=t+1;w=a[t]|0;if((ht(2600,w<<24>>24,19)|0)!=0){break}b:do{switch(w<<24>>24){case 46:{u=1;break};case 32:{a[g]=1;break};case 43:{a[h]=1;break};case 35:{a[j]=1;break};case 48:{a[k]=1;break};case 45:{a[l]=1;break};default:{if(u&w<<24>>24==42){a[m]=1;u=1;break b}if(!((w+ -48<<24>>24&255)<10)){g=0;break a}c[q>>2]=t;c[r>>2]=v;w=p;c[w>>2]=0;c[w+4>>2]=0;if(!(le(q,p)|0)){g=0;break a}t=c[p>>2]|0;if(u){c[n>>2]=t;u=1;break b}else{c[o>>2]=t;u=0;break b}}}}while(0);t=c[b>>2]|0;v=c[s>>2]|0;if(!(t>>>0<v>>>0)){g=1;break a}}a[d+7|0]=w;g=1}else{g=1}}while(0);a[d]=g;w=c[b>>2]|0;c[d+16>>2]=f;c[d+20>>2]=w;i=e;return}



function Lr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+16|0;f=e+8|0;h=e;g=b+4|0;switch((c[d+16>>2]|0)>>>28&7|0){case 1:{l=1400;break};case 0:{l=1392;break};case 5:{l=1432;break};case 3:{l=1416;break};case 2:{l=1408;break};case 6:{l=1440;break};case 4:{l=1424;break};default:{l=2480}}j=c[c[g>>2]>>2]|0;k=Tt(l|0)|0;p=c[(c[j+8>>2]|0)+16>>2]&255;n=j+(p<<2)+16|0;if((p|0)==0){o=1}else{o=1;p=j+16|0;while(1){m=p+4|0;o=ba(c[p>>2]|0,o)|0;if(m>>>0<n>>>0){p=m}else{break}}}Yd(j,o,k,l)|0;j=c[c[g>>2]>>2]|0;a[f]=40;p=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(p<<2)+16|0;if((p|0)==0){m=1}else{m=1;n=j+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<k>>>0){n=l}else{break}}}Yd(j,m,1,f)|0;p=nc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;mc[c[(c[p>>2]|0)+8>>2]&63](p,b);b=h+4|0;c[b>>2]=0;c[h>>2]=0;mc[c[(c[d>>2]|0)+32>>2]&63](d,h);if(((c[b>>2]|0)-(c[h>>2]|0)|0)>0){d=c[c[g>>2]>>2]|0;a[f]=32;p=c[(c[d+8>>2]|0)+16>>2]&255;k=d+(p<<2)+16|0;if((p|0)==0){l=1}else{l=1;m=d+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Yd(d,l,1,f)|0;d=c[c[g>>2]>>2]|0;h=c[h>>2]|0;b=(c[b>>2]|0)-h|0;p=c[(c[d+8>>2]|0)+16>>2]&255;k=d+(p<<2)+16|0;if((p|0)==0){m=1}else{m=1;l=d+16|0;while(1){j=l+4|0;m=ba(c[l>>2]|0,m)|0;if(j>>>0<k>>>0){l=j}else{break}}}Yd(d,m,b,h)|0}g=c[c[g>>2]>>2]|0;a[f]=41;p=c[(c[g+8>>2]|0)+16>>2]&255;h=g+(p<<2)+16|0;if((p|0)==0){p=1;Yd(g,p,1,f)|0;i=e;return}b=1;j=g+16|0;while(1){d=j+4|0;b=ba(c[j>>2]|0,b)|0;if(d>>>0<h>>>0){j=d}else{break}}Yd(g,b,1,f)|0;i=e;return}function Mr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+16|0;h=e+8|0;g=e;f=g+4|0;c[f>>2]=0;c[g>>2]=0;mc[c[(c[d>>2]|0)+28>>2]&63](d,g);if(((c[f>>2]|0)-(c[g>>2]|0)|0)<=0){i=e;return}b=b+4|0;d=c[c[b>>2]>>2]|0;a[h]=46;m=c[(c[d+8>>2]|0)+16>>2]&255;k=d+(m<<2)+16|0;if((m|0)==0){l=1}else{l=1;m=d+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Yd(d,l,1,h)|0;h=c[c[b>>2]>>2]|0;g=c[g>>2]|0;f=(c[f>>2]|0)-g|0;m=c[(c[h+8>>2]|0)+16>>2]&255;d=h+(m<<2)+16|0;if((m|0)==0){k=1}else{k=1;j=h+16|0;while(1){b=j+4|0;k=ba(c[j>>2]|0,k)|0;if(b>>>0<d>>>0){j=b}else{break}}}Yd(h,k,f,g)|0;i=e;return}function Nr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Yd(e,j,1,144)|0;b=nc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;mc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Yd(b,k,0,29192)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Yd(b,a,0,29192)|0;i=d;return}function Or(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Yd(e,j,3,29016)|0;b=nc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;mc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Yd(b,k,1,1384)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Yd(b,a,1,1384)|0;i=d;return}function Pr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Yd(e,j,4,29184)|0;b=nc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;mc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Yd(b,k,1,1384)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Yd(b,a,1,1384)|0;i=d;return}function Qr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Yd(e,j,4,29176)|0;b=nc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;mc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Yd(b,k,1,1384)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Yd(b,a,1,1384)|0;i=d;return}function Rr(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=a+4|0;g=c[c[f>>2]>>2]|0;h=Tt(d|0)|0;m=c[(c[g+8>>2]|0)+16>>2]&255;j=g+(m<<2)+16|0;if((m|0)==0){m=1}else{m=1;l=g+16|0;while(1){k=l+4|0;m=ba(c[l>>2]|0,m)|0;if(k>>>0<j>>>0){l=k}else{break}}}Yd(g,m,h,d)|0;h=nc[c[(c[b>>2]|0)+16>>2]&1023](b)|0;if((h|0)>0){g=0;do{m=rc[c[(c[b>>2]|0)+24>>2]&63](b,g)|0;mc[c[(c[m>>2]|0)+8>>2]&63](m,a);g=g+1|0}while((g|0)!=(h|0))}b=c[c[f>>2]>>2]|0;m=c[(c[b+8>>2]|0)+16>>2]&255;a=b+(m<<2)+16|0;if((m|0)==0){m=1;Yd(b,m,1,1384)|0;i=e;return}g=1;h=b+16|0;while(1){f=h+4|0;g=ba(c[h>>2]|0,g)|0;if(f>>>0<a>>>0){h=f}else{break}}Yd(b,g,1,1384)|0;i=e;return}function Sr(a){a=a|0;var b=0,d=0,e=0,f=0;d=c[c[a+4>>2]>>2]|0;b=c[a+8>>2]|0;f=c[d+44>>2]|0;e=b;c[e>>2]=f;c[e+4>>2]=((f|0)<0)<<31>>31;e=b+8|0;c[e>>2]=c[d+52>>2];c[e+4>>2]=0;b=b+16|0;c[b>>2]=c[d+56>>2];c[b+4>>2]=0;return a+12|0}function Tr(a){a=a|0;c[c[a+4>>2]>>2]=c[c[1102]>>2];return a+8|0}function Ur(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;if((d|0)==0){c[c[a+8>>2]>>2]=0;d=a+12|0;i=b;return d|0}else{c[c[a+8>>2]>>2]=c[d>>2];d=a+12|0;i=b;return d|0}return 0}function Vr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;d=c[a+4>>2]|0;if((d|0)==0){d=c[1102]|0}e=c[d>>2]|0;d=c[c[a+8>>2]>>2]|0;if((e|0)!=0){Uc(e,d);k=a+12|0;i=b;return k|0}e=d+8|0;f=c[e>>2]|0;k=c[f+16>>2]&255;h=d+(k<<2)+16|0;if((k|0)==0){k=1}else{k=1;j=d+16|0;while(1){g=j+4|0;k=ba(c[j>>2]|0,k)|0;if(g>>>0<h>>>0){j=g}else{break}}}f=c[(nc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(f|0)>-1){k=a+12|0;i=b;return k|0}if((f|0)>0|(k|0)==0){k=a+12|0;i=b;return k|0}if(!(Wd(d,0,k,0,1)|0)){k=a+12|0;i=b;return k|0}c[d+16>>2]=0;k=a+12|0;i=b;return k|0}function Wr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;d=b;e=c[a+4>>2]|0;if((e|0)==0){e=c[1102]|0}e=c[e>>2]|0;g=c[c[a+8>>2]>>2]|0;f=c[g+4>>2]|0;c[d>>2]=c[g>>2];c[d+4>>2]=f;if((e|0)==0){g=a+16|0;i=b;return g|0}Sc(e,d,c[c[a+12>>2]>>2]|0)|0;g=a+16|0;i=b;return g|0}function Xr(a){a=a|0;c[c[a+12>>2]>>2]=c[a+4>>2];return a+16|0}function Yr(a){a=a|0;c[c[a+8>>2]>>2]=c[(c[c[a+4>>2]>>2]|0)+12>>2];return a+12|0}function Zr(a){a=a|0;c[c[a+8>>2]>>2]=(c[(c[c[a+4>>2]>>2]|0)+16>>2]|0)>>>8&255;return a+12|0}function _r(a){a=a|0;c[c[a+8>>2]>>2]=(c[(c[c[a+4>>2]>>2]|0)+16>>2]|0)>>>16&31;return a+12|0}function $r(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>21&1;return b+12|0}function as(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]&2031616|0)==196608|0;return b+12|0}function bs(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>24&1;return b+12|0}function cs(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>27&1;return b+12|0}function ds(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>24&1;return b+12|0}function es(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b;f=c[c[a+4>>2]>>2]|0;e=d+4|0;c[e>>2]=0;c[d>>2]=0;mc[c[(c[f>>2]|0)+28>>2]&63](f,d);d=c[d>>2]|0;Xd(c[c[a+8>>2]>>2]|0,0,(c[e>>2]|0)-d|0,d,1)|0;i=b;return a+12|0}function fs(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b;f=c[c[a+4>>2]>>2]|0;e=d+4|0;c[e>>2]=0;c[d>>2]=0;mc[c[(c[f>>2]|0)+32>>2]&63](f,d);d=c[d>>2]|0;Xd(c[c[a+8>>2]>>2]|0,0,(c[e>>2]|0)-d|0,d,1)|0;i=b;return a+12|0}function gs(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;d=nc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;c[c[a+8>>2]>>2]=d;i=b;return a+12|0}function hs(a){a=a|0;c[c[a+8>>2]>>2]=(c[(c[c[a+4>>2]>>2]|0)+16>>2]|0)>>>28&7;return a+12|0}function is(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;d=nc[c[(c[d>>2]|0)+16>>2]&1023](d)|0;c[c[a+8>>2]>>2]=d;i=b;return a+12|0}function js(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;d=rc[c[(c[d>>2]|0)+24>>2]&63](d,c[c[a+8>>2]>>2]|0)|0;c[c[a+12>>2]>>2]=d;i=b;return a+16|0}function ks(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b;f=c[c[a+8>>2]>>2]|0;e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;e=c[c[a+4>>2]>>2]|0;d=rc[c[(c[e>>2]|0)+20>>2]&63](e,d)|0;c[c[a+12>>2]>>2]=d;i=b;return a+16|0}function ls(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;if((a|0)==0){d=Jc(0)|0;a=c[2]|0;c[2]=d;Xe(d);Se(d);e=c[2]|0}else{d=Jc(c[a>>2]|0)|0;a=c[2]|0;c[2]=d;e=d}e=Nc(e,24)|0;if((e|0)==0){e=0}else{Ye(e,d)}f=Nc(c[2]|0,32)|0;if((f|0)==0){f=0;c[2]=a;i=b;return f|0}g=f+16|0;c[g>>2]=0;c[g+4>>2]=0;c[f>>2]=d;c[f+4>>2]=e;c[f+8>>2]=0;c[2]=a;i=b;return f|0}function ms(b){b=b|0;var d=0,e=0,f=0,g=0;e=i;d=c[b>>2]|0;if((a[b+24|0]|0)!=0){Lc(d,30760,0)}f=b+8|0;g=c[f>>2]|0;if((g|0)!=0){Pc(c[b>>2]|0,g);c[f>>2]=0}Qc(d,1);Pc(d,c[b+4>>2]|0);Pc(d,b);Lc(d,30776,1);Kc(d);i=e;return 0}function ns(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;c[e+4>>2]=0;c[e>>2]=0;f=b+4|0;if(!(gd(f,40)|0)){g=c[b+24>>2]|0;ee(g,3,ae(b)|0,30792,0);i=d;return}de(f,e)|0;je(f);g=ce(b)|0;if(!(gd(f,41)|0)){g=c[b+24>>2]|0;ee(g,3,ae(b)|0,30808,0);i=d;return}if((Sc(c[c[a+4>>2]>>2]|0,e,g)|0)!=0){i=d;return}g=c[b+24>>2]|0;ee(g,3,ae(b)|0,30824,0);i=d;return}function os(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d;c[e+4>>2]=0;c[e>>2]=0;f=b+4|0;if(!(gd(f,40)|0)){a=c[b+24>>2]|0;ee(a,3,ae(b)|0,30792,0);i=d;return}de(f,e)|0;if(!(gd(f,41)|0)){a=c[b+24>>2]|0;ee(a,3,ae(b)|0,30808,0);i=d;return}f=_c(c[c[a+4>>2]>>2]|0,e)|0;if((f|0)==0){a=c[b+24>>2]|0;ee(a,3,ae(b)|0,30848,e);i=d;return}else{af(f);i=d;return}}function ps(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+80|0;j=g;f=g+64|0;m=g+44|0;o=g+16|0;n=g+8|0;l=b+4|0;k=c[l>>2]|0;h=c[2]|0;c[2]=c[k>>2];e=c[1102]|0;c[1102]=k;c[j>>2]=30864;c[j+4>>2]=30870;k=Yc(c[k>>2]|0,j)|0;c[f>>2]=0;if((k|0)==0){k=0}else{jc[c[(c[k>>2]|0)+48>>2]&63](k,f,0)|0;k=c[f>>2]|0}Re(m,k);$d(o,c[c[l>>2]>>2]|0,d,m,1);c[n+4>>2]=0;c[n>>2]=0;p=o+4|0;r=o+8|0;k=m+4|0;d=m+8|0;q=b+16|0;s=m+16|0;a:while(1){if(((c[r>>2]|0)-(c[p>>2]|0)|0)<=0){b=18;break}if((c[d>>2]|0)!=(0-(c[k>>2]|0)|0)){b=18;break}de(p,n)|0;u=q;u=Ut(c[u>>2]|0,c[u+4>>2]|0,1,0)|0;t=q;c[t>>2]=u;c[t+4>>2]=F;do{if(fd(n,30872)|0){ns(b,o)}else{if(fd(n,30880)|0){a[s]=1;break}if(fd(n,30888)|0){os(b,o);break}if(!(fd(n,30896)|0)){b=14;break a}Qc(c[b>>2]|0,0)}}while(0);me(p);be(o)}do{if((b|0)==14){if(fd(n,30904)|0){Ia(30928)|0;j=2;break}else{Ia(30920)|0;b=18;break}}}while(0);if((b|0)==18){De(c[c[l>>2]>>2]|0,m);l=c[f>>2]|0;n=c[(c[l+8>>2]|0)+16>>2]&255;m=l+(n<<2)+16|0;n=(n|0)==0;if(!n){p=1;q=l+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<m>>>0){q=o}else{break}}if((p|0)>0){if(n){o=1;b=25}else{o=1;b=l+16|0;while(1){n=b+4|0;o=ba(c[b>>2]|0,o)|0;if(n>>>0<m>>>0){b=n}else{b=25;break}}}}}else{o=1;b=25}if((b|0)==25){u=c[l>>2]|0;c[j>>2]=o;c[j+4>>2]=u;bb(30912,j|0)|0}j=(c[d>>2]|0)==(0-(c[k>>2]|0)|0)?0:4}d=c[f>>2]|0;if((d|0)==0){c[1102]=e;c[2]=h;i=g;return j|0}u=c[d+8>>2]|0;rc[c[(c[u>>2]|0)+56>>2]&63](u,f)|0;c[1102]=e;c[2]=h;i=g;return j|0}function qs(a){a=a|0;return}function rs(a){a=a|0;return}function ss(a){a=a|0;return}function ts(a){a=a|0;return}function us(){var a=0,b=0.0;a=i;b=+db();F=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;i=a;return~~b>>>0|0}function vs(a,b){a=a|0;b=b|0;var c=0;c=i;a=du(a|0,b|0,1e3,0)|0;i=c;return a|0}function ws(a){a=a|0;var b=0;b=i;Ue(a,30968,624,30984,2);Ue(a,31e3,625,30984,2);Ue(a,31024,626,31048,2);Ue(a,31064,627,31088,2);Ue(a,31128,628,31152,2);Ue(a,31176,629,31152,2);Ue(a,31200,630,31224,2);Ue(a,31264,631,31280,2);Ue(a,31296,632,31320,2);Ue(a,31344,633,31368,2);Ue(a,31392,634,31320,2);Ue(a,31416,635,31368,2);i=b;return}function xs(a){a=a|0;var b=0.0,d=0,e=0,f=0;d=i;b=+db();f=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;e=c[a+4>>2]|0;c[e>>2]=~~b>>>0;c[e+4>>2]=f;i=d;return a+8|0}function ys(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+db();f=fu(~~d>>>0|0,(+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0)|0,1e3,0)|0;e=c[a+4>>2]|0;c[e>>2]=f;c[e+4>>2]=F;i=b;return a+8|0}function zs(a){a=a|0;var b=0.0,d=0;d=i;b=+db();+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;c[c[a+4>>2]>>2]=~~b>>>0;i=d;return a+8|0}function As(a){a=a|0;var b=0,d=0.0,e=0,f=0.0,g=0,i=0;b=c[a+12>>2]|0;d=+h[c[a+4>>2]>>3];e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=+h[c[a+8>>2]>>3];g=+Q(f)>=1.0?f>0.0?(ga(+P(f/4294967296.0),4294967295.0)|0)>>>0:~~+aa((f- +(~~f>>>0))/4294967296.0)>>>0:0;i=b;c[i>>2]=~~d>>>0;c[i+4>>2]=e;e=b+8|0;c[e>>2]=~~f>>>0;c[e+4>>2]=g;return a+16|0}function Bs(a){a=a|0;var b=0;b=c[a+4>>2]|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+(c[b+4>>2]|0);return a+12|0}function Cs(a){a=a|0;var b=0;b=(c[a+4>>2]|0)+8|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+((c[b+4>>2]|0)>>>0);return a+12|0}function Ds(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=c[a+12>>2]|0;h=c[a+4>>2]|0;g=c[h+4>>2]|0;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;f=b;c[f>>2]=c[h>>2];c[f+4>>2]=g;b=b+8|0;c[b>>2]=e;c[b+4>>2]=d;return a+16|0}function Es(a){a=a|0;var b=0,d=0,e=0.0,f=0,g=0,h=0.0,j=0;b=i;i=i+16|0;g=b;d=c[a+4>>2]|0;if((kb(g|0,0)|0)==-1){c[d+0>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;g=a+8|0;i=b;return g|0}else{e=+(c[g>>2]|0);f=+Q(e)>=1.0?e>0.0?(ga(+P(e/4294967296.0),4294967295.0)|0)>>>0:~~+aa((e- +(~~e>>>0))/4294967296.0)>>>0:0;h=+(c[g+4>>2]|0)/1.0e6;j=+Q(h)>=1.0?h>0.0?(ga(+P(h/4294967296.0),4294967295.0)|0)>>>0:~~+aa((h- +(~~h>>>0))/4294967296.0)>>>0:0;g=d;c[g>>2]=~~e>>>0;c[g+4>>2]=f;g=d+8|0;c[g>>2]=~~h>>>0;c[g+4>>2]=j;g=a+8|0;i=b;return g|0}return 0}function Fs(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function Gs(a){a=a|0;var b=0,d=0,e=0;e=(c[a+4>>2]|0)+8|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function Hs(a){a=a|0;return a+12|0}function Is(a){a=a|0;return a+12|0}function Js(a){a=a|0;var b=0;b=i;Te(a,31480,31496)|0;Ue(a,31504,636,31512,2);Ue(a,31520,637,31528,2);Ue(a,31568,638,31528,2);Ue(a,31576,639,31584,2);Ue(a,31608,640,31616,2);i=b;return}function Ks(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;Ab(32)|0;b=gb(256,256,32,0)|0;Wa(b|0)|0;f=b+4|0;g=b+20|0;e=0;do{h=e&255;j=255-e&255;k=e<<8;l=0;do{m=Kb(c[f>>2]|0,h|0,l&255|0,j|0,((l+e|0)%255|0)&255|0)|0;c[(c[g>>2]|0)+(l+k<<2)>>2]=m;l=l+1|0}while((l|0)!=256);e=e+1|0}while((e|0)!=256);Ib(b|0);Lb(b|0)|0;Ia(31904)|0;Ia(31992)|0;Cb();i=d;return a+4|0}function Ls(a){a=a|0;var b=0;b=i;Sb(31880,c[c[a+4>>2]>>2]|0,c[c[a+8>>2]>>2]|0)|0;i=b;return a+16|0}function Ms(a){a=a|0;var b=0;b=i;Sb(31856,c[c[a+4>>2]>>2]|0,c[c[a+8>>2]>>2]|0)|0;i=b;return a+16|0}function Ns(a){a=a|0;var b=0;b=i;zb(31648);i=b;return a+8|0}function Os(a){a=a|0;var b=0;b=i;zb(31632);i=b;return a+8|0}function Ps(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+32|0;g=e+16|0;d=e+8|0;h=e;c[g>>2]=32160;c[g+4>>2]=32166;f=Yc(c[c[1102]>>2]|0,g)|0;c[d>>2]=0;if((f|0)==0){j=0}else{jc[c[(c[f>>2]|0)+48>>2]&63](f,d,0)|0;j=c[d>>2]|0}f=b+4|0;m=c[f>>2]|0;k=c[b+12>>2]|0;c[h>>2]=c[b+8>>2];c[h+4>>2]=k;Me(h,(m+ -2|0)/2|0,b+16|0,j);h=c[d>>2]|0;a[g]=10;m=c[(c[h+8>>2]|0)+16>>2]&255;k=h+(m<<2)+16|0;if((m|0)==0){l=1}else{l=1;m=h+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Yd(h,l,1,g)|0;j=c[d>>2]|0;g=c[j>>2]|0;m=c[(c[j+8>>2]|0)+16>>2]&255;h=j+(m<<2)+16|0;if((m|0)==0){k=1}else{k=1;l=j+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}Ka(1,g|0,k|0)|0;b=b+8+(c[f>>2]<<2)|0;f=c[d>>2]|0;if((f|0)==0){i=e;return b|0}m=c[f+8>>2]|0;rc[c[(c[m>>2]|0)+56>>2]&63](m,d)|0;i=e;return b|0}function Qs(a){a=a|0;var b=0;b=i;Te(a,32200,32216)|0;We(a,32224,0,32232);We(a,32248,1,32232);We(a,32256,2,32232);Ue(a,32264,641,32272,2);Ue(a,32304,642,32312,2);Ue(a,32376,643,32392,2);Ue(a,32488,644,32504,2);Ue(a,32536,645,32552,2);Ue(a,32576,646,32504,2);Ue(a,32592,647,32616,2);Ue(a,32664,648,32680,2);Ue(a,32736,649,32752,2);i=b;return}function Rs(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+32|0;e=d;b=d+20|0;h=d+8|0;c[e>>2]=32160;c[e+4>>2]=32166;g=Yc(c[c[1102]>>2]|0,e)|0;c[b>>2]=0;if((g|0)!=0?(jc[c[(c[g>>2]|0)+48>>2]&63](g,b,0)|0,f=c[b>>2]|0,(f|0)!=0):0){Ee(h,f,0,0);Je(h,c[a+4>>2]|0,c[a+8>>2]|0);f=c[b>>2]|0;k=c[(c[f+8>>2]|0)+16>>2]&255;h=f+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=f+16|0;while(1){g=k+4|0;j=ba(c[k>>2]|0,j)|0;if(g>>>0<h>>>0){k=g}else{break}}}k=c[f>>2]|0;c[e>>2]=j;c[e+4>>2]=k;bb(32808,e|0)|0;e=c[b>>2]|0;a=a+12|0;if((e|0)==0){k=a;i=d;return k|0}k=c[e+8>>2]|0;rc[c[(c[k>>2]|0)+56>>2]&63](k,b)|0;k=a;i=d;return k|0}k=a+12|0;i=d;return k|0}function Ss(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+272|0;d=e;f=e+4|0;g=c[c[b+12>>2]>>2]|0;if((g|0)==2){h=1}else if((g|0)==0){h=2}else{h=0}g=c[c[b+8>>2]>>2]|0;if((g|0)==2){h=h|192}else if((g|0)==4){h=h|576}else if((g|0)==3){h=h|64}else if((g|0)==1){h=h|512}l=c[c[b+4>>2]>>2]|0;g=c[l>>2]|0;m=c[(c[l+8>>2]|0)+16>>2]&255;j=l+(m<<2)+16|0;if((m|0)==0){k=1}else{k=1;m=l+16|0;while(1){l=m+4|0;k=ba(c[m>>2]|0,k)|0;if(l>>>0<j>>>0){m=l}else{break}}}l=(k|0)<255?k:255;m=f+256|0;c[m>>2]=f+l;Wt(f|0,g|0,l|0)|0;a[c[m>>2]|0]=0;c[d>>2]=511;m=wb(f|0,h|0,d|0)|0;c[c[b+16>>2]>>2]=m;i=e;return b+20|0}function Ts(a){a=a|0;var b=0,d=0;b=i;i=i+80|0;d=b;ya(c[c[a+4>>2]>>2]|0,d|0)|0;c[c[a+8>>2]>>2]=c[d+36>>2];i=b;return a+12|0}function Us(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+272|0;f=e;h=c[c[b+4>>2]>>2]|0;d=c[h>>2]|0;k=c[(c[h+8>>2]|0)+16>>2]&255;g=h+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=h+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}j=(j|0)<255?j:255;k=f+256|0;c[k>>2]=f+j;Wt(f|0,d|0,j|0)|0;a[c[k>>2]|0]=0;k=yb(f|0)|0;c[c[b+8>>2]>>2]=k;i=e;return b+12|0}function Vs(a){a=a|0;var b=0,d=0;b=i;d=Fa(c[c[a+4>>2]>>2]|0)|0;c[c[a+8>>2]>>2]=d;i=b;return a+12|0}function Ws(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;e=c[c[a+4>>2]>>2]|0;d=c[c[a+8>>2]>>2]|0;f=c[c[a+12>>2]>>2]|0;if((f|0)==2){f=1}else if((f|0)==1){f=2}else{f=0}f=pb(e|0,d|0,f|0)|0;c[c[a+16>>2]>>2]=f;i=b;return a+20|0}function Xs(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+80|0;g=d;e=c[c[a+4>>2]>>2]|0;b=c[c[a+8>>2]>>2]|0;f=c[c[a+12>>2]>>2]|0;if((f|0)==-1){ya(e|0,g|0)|0;f=(c[g+36>>2]|0)/(c[(c[b+12>>2]|0)+12>>2]|0)|0}if(!(Vc(b,f)|0)){j=a+20|0;i=d;return j|0}j=c[(c[b+8>>2]|0)+16>>2]&255;g=b+(j<<2)+16|0;if((j|0)==0){h=1}else{h=1;j=b+16|0;while(1){f=j+4|0;h=ba(c[j>>2]|0,h)|0;if(f>>>0<g>>>0){j=f}else{break}}}f=b+12|0;g=ba(c[(c[f>>2]|0)+12>>2]|0,h)|0;e=fb(e|0,c[b>>2]|0,g|0)|0;if((e|0)<0){c[c[a+16>>2]>>2]=e;Wc(b,0)|0;j=a+20|0;i=d;return j|0}if((g|0)==(e|0)){j=a+20|0;i=d;return j|0}Wc(b,(e|0)/(c[(c[f>>2]|0)+12>>2]|0)|0)|0;j=a+20|0;i=d;return j|0}function Ys(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;e=i;d=c[c[a+4>>2]>>2]|0;b=c[c[a+8>>2]>>2]|0;j=c[(c[b+8>>2]|0)+16>>2]&255;f=b+(j<<2)+16|0;if((j|0)==0){h=1}else{h=1;j=b+16|0;while(1){g=j+4|0;h=ba(c[j>>2]|0,h)|0;if(g>>>0<f>>>0){j=g}else{break}}}j=ba(c[(c[b+12>>2]|0)+12>>2]|0,h)|0;j=Ka(d|0,c[b>>2]|0,j|0)|0;c[c[a+12>>2]>>2]=j;i=e;return a+16|0}function Zs(){return 65539}function _s(a){a=a|0;var b=0;b=i;a=ls(a)|0;i=b;return a|0}function $s(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;if((d|0)==-1){d=Tt(b|0)|0}c[f>>2]=b;c[f+4>>2]=b+d;ps(a,f)|0;i=e;return}function at(a,b){a=a|0;b=b|0;var d=0;d=i;a=_e(c[a+4>>2]|0,b,20,0)|0;i=d;return a|0}function bt(a){a=a|0;var b=0;b=i;if((a|0)!=0){ms(a)|0}i=b;return}function ct(a){a=+a;var b=0,d=0,e=0,f=0,j=0,l=0;b=i;i=i+16|0;d=b+4|0;e=b;h[k>>3]=a;f=c[k>>2]|0;l=c[k+4>>2]|0;j=Vt(f|0,l|0,52)|0;j=j&2047;if((j|0)==0){e=Zt(f|0,l|0,12)|0;f=F;if((e|0)==0&(f|0)==0){g[d>>2]=u;l=-2147483648;i=b;return l|0}if((f|0)>-1|(f|0)==-1&e>>>0>4294967295){d=e;e=-1023}else{l=-1023;i=b;return l|0}do{e=e+ -1|0;d=Zt(d|0,f|0,1)|0;f=F}while((f|0)>-1|(f|0)==-1&d>>>0>4294967295);i=b;return e|0}else if((j|0)==2047){g[e>>2]=u;l=(f|0)!=0|(l&1048575|0)!=0?-2147483648:2147483647;i=b;return l|0}else{l=j+ -1023|0;i=b;return l|0}return 0}function dt(a){a=+a;var b=0,d=0,e=0,f=0,h=0;b=i;i=i+16|0;d=b+4|0;e=b;f=(g[k>>2]=a,c[k>>2]|0);h=f>>>23&255;do{if((h|0)==0){e=f<<9;if((e|0)==0){g[d>>2]=u;d=-2147483648;break}if((e|0)>-1){d=-127;do{d=d+ -1|0;e=e<<1}while((e|0)>-1)}else{d=-127}}else if((h|0)==255){g[e>>2]=u;d=(f&8388607|0)!=0?-2147483648:2147483647}else{d=h+ -127|0}}while(0);i=b;return d|0}function et(a){a=+a;var b=0,d=0;b=i;h[k>>3]=a;d=c[k+4>>2]&2146435072;if(!(d>>>0<2146435072|(d|0)==2146435072&0<0)){a=a*a;i=b;return+a}if(a==0.0){a=-1.0/(a*a);i=b;return+a}else{a=+(ct(a)|0);i=b;return+a}return 0.0}function ft(a){a=+a;var b=0;b=i;do{if(((g[k>>2]=a,c[k>>2]|0)&2139095040)>>>0<2139095040){if(a==0.0){a=-1.0/(a*a);break}else{a=+(dt(a)|0);break}}else{a=a*a}}while(0);i=b;return+a}function gt(a,b){a=+a;b=b|0;var d=0,e=0;d=i;if((b|0)>127){a=a*1.7014118346046923e+38;e=b+ -127|0;if((e|0)>127){b=b+ -254|0;b=(b|0)>127?127:b;a=a*1.7014118346046923e+38}else{b=e}}else{if((b|0)<-126){a=a*1.1754943508222875e-38;e=b+126|0;if((e|0)<-126){b=b+252|0;b=(b|0)<-126?-126:b;a=a*1.1754943508222875e-38}else{b=e}}}a=a*(c[k>>2]=(b<<23)+1065353216,+g[k>>2]);i=d;return+a}function ht(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=d&255;j=(e|0)==0;a:do{if((b&3|0)==0|j){h=e;e=5}else{h=d&255;while(1){if((a[b]|0)==h<<24>>24){h=e;e=6;break a}b=b+1|0;e=e+ -1|0;j=(e|0)==0;if((b&3|0)==0|j){h=e;e=5;break}}}}while(0);if((e|0)==5){if(j){h=0}else{e=6}}b:do{if((e|0)==6){d=d&255;if(!((a[b]|0)==d<<24>>24)){g=ba(g,16843009)|0;c:do{if(h>>>0>3){do{j=c[b>>2]^g;if(((j&-2139062144^-2139062144)&j+ -16843009|0)!=0){break c}b=b+4|0;h=h+ -4|0}while(h>>>0>3)}}while(0);if((h|0)==0){h=0}else{while(1){if((a[b]|0)==d<<24>>24){break b}b=b+1|0;h=h+ -1|0;if((h|0)==0){h=0;break}}}}}}while(0);i=f;return((h|0)!=0?b:0)|0}function it(a){a=a|0;return}function jt(a){a=a|0;return}function kt(a){a=a|0;return}function lt(a){a=a|0;return}function mt(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function nt(a){a=a|0;var b=0;b=i;Ct(a);i=b;return}function ot(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+64|0;f=e;if((a|0)==(b|0)){h=1;i=e;return h|0}if((b|0)==0){h=0;i=e;return h|0}b=rt(b,32880,32936,0)|0;if((b|0)==0){h=0;i=e;return h|0}h=f+0|0;g=h+56|0;do{c[h>>2]=0;h=h+4|0}while((h|0)<(g|0));c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;sc[c[(c[b>>2]|0)+28>>2]&31](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){h=0;i=e;return h|0}c[d>>2]=c[f+16>>2];h=1;i=e;return h|0}function pt(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((c[d+8>>2]|0)!=(b|0)){i=g;return}b=d+16|0;h=c[b>>2]|0;if((h|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;i=g;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;i=g;return}e=d+24|0;if((c[e>>2]|0)!=2){i=g;return}c[e>>2]=f;i=g;return}function qt(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((b|0)!=(c[d+8>>2]|0)){h=c[b+8>>2]|0;sc[c[(c[h>>2]|0)+28>>2]&31](h,d,e,f);i=g;return}b=d+16|0;h=c[b>>2]|0;if((h|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;i=g;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;i=g;return}e=d+24|0;if((c[e>>2]|0)!=2){i=g;return}c[e>>2]=f;i=g;return}function rt(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=i;i=i+64|0;j=h;k=c[d>>2]|0;l=d+(c[k+ -8>>2]|0)|0;k=c[k+ -4>>2]|0;c[j>>2]=f;c[j+4>>2]=d;c[j+8>>2]=e;c[j+12>>2]=g;n=j+16|0;o=j+20|0;e=j+24|0;m=j+28|0;g=j+32|0;d=j+40|0;p=(k|0)==(f|0);q=n+0|0;f=q+36|0;do{c[q>>2]=0;q=q+4|0}while((q|0)<(f|0));b[n+36>>1]=0;a[n+38|0]=0;if(p){c[j+48>>2]=1;qc[c[(c[k>>2]|0)+20>>2]&31](k,j,l,l,1,0);q=(c[e>>2]|0)==1?l:0;i=h;return q|0}kc[c[(c[k>>2]|0)+24>>2]&31](k,j,l,1,0);j=c[j+36>>2]|0;if((j|0)==1){if((c[e>>2]|0)!=1){if((c[d>>2]|0)!=0){q=0;i=h;return q|0}if((c[m>>2]|0)!=1){q=0;i=h;return q|0}if((c[g>>2]|0)!=1){q=0;i=h;return q|0}}q=c[n>>2]|0;i=h;return q|0}else if((j|0)==0){if((c[d>>2]|0)!=1){q=0;i=h;return q|0}if((c[m>>2]|0)!=1){q=0;i=h;return q|0}q=(c[g>>2]|0)==1?c[o>>2]|0:0;i=h;return q|0}else{q=0;i=h;return q|0}return 0}function st(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;if((b|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){i=h;return}j=d+28|0;if((c[j>>2]|0)==1){i=h;return}c[j>>2]=f;i=h;return}if((b|0)!=(c[d>>2]|0)){l=c[b+8>>2]|0;kc[c[(c[l>>2]|0)+24>>2]&31](l,d,e,f,g);i=h;return}if((c[d+16>>2]|0)!=(e|0)?(k=d+20|0,(c[k>>2]|0)!=(e|0)):0){c[d+32>>2]=f;f=d+44|0;if((c[f>>2]|0)==4){i=h;return}l=d+52|0;a[l]=0;m=d+53|0;a[m]=0;b=c[b+8>>2]|0;qc[c[(c[b>>2]|0)+20>>2]&31](b,d,e,e,1,g);if((a[m]|0)!=0){if((a[l]|0)==0){b=1;j=13}}else{b=0;j=13}do{if((j|0)==13){c[k>>2]=e;m=d+40|0;c[m>>2]=(c[m>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54|0]=1;if(b){break}}else{j=16}if((j|0)==16?b:0){break}c[f>>2]=4;i=h;return}}while(0);c[f>>2]=3;i=h;return}if((f|0)!=1){i=h;return}c[d+32>>2]=1;i=h;return}function tt(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;g=i;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){i=g;return}d=d+28|0;if((c[d>>2]|0)==1){i=g;return}c[d>>2]=f;i=g;return}if((c[d>>2]|0)!=(b|0)){i=g;return}if((c[d+16>>2]|0)!=(e|0)?(h=d+20|0,(c[h>>2]|0)!=(e|0)):0){c[d+32>>2]=f;c[h>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54|0]=1}c[d+44>>2]=4;i=g;return}if((f|0)!=1){i=g;return}c[d+32>>2]=1;i=g;return}function ut(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0;j=i;if((b|0)!=(c[d+8>>2]|0)){b=c[b+8>>2]|0;qc[c[(c[b>>2]|0)+20>>2]&31](b,d,e,f,g,h);i=j;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){i=j;return}a[d+52|0]=1;b=d+16|0;f=c[b>>2]|0;if((f|0)==0){c[b>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}if((f|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;a[d+54|0]=1;i=j;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g}else{g=b}if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}function vt(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;h=i;if((c[d+8>>2]|0)!=(b|0)){i=h;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){i=h;return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=h;return}a[d+54|0]=1;i=h;return}if((b|0)!=(e|0)){b=d+36|0;c[b>>2]=(c[b>>2]|0)+1;a[d+54|0]=1;i=h;return}e=d+24|0;f=c[e>>2]|0;if((f|0)==2){c[e>>2]=g}else{g=f}if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=h;return}a[d+54|0]=1;i=h;return}function wt(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;b=i;do{if(a>>>0<245){if(a>>>0<11){a=16}else{a=a+11&-8}v=a>>>3;t=c[8272]|0;w=t>>>v;if((w&3|0)!=0){h=(w&1^1)+v|0;g=h<<1;e=33128+(g<<2)|0;g=33128+(g+2<<2)|0;j=c[g>>2]|0;d=j+8|0;f=c[d>>2]|0;do{if((e|0)!=(f|0)){if(f>>>0<(c[33104>>2]|0)>>>0){Jb()}k=f+12|0;if((c[k>>2]|0)==(j|0)){c[k>>2]=e;c[g>>2]=f;break}else{Jb()}}else{c[8272]=t&~(1<<h)}}while(0);H=h<<3;c[j+4>>2]=H|3;H=j+(H|4)|0;c[H>>2]=c[H>>2]|1;H=d;i=b;return H|0}if(a>>>0>(c[33096>>2]|0)>>>0){if((w|0)!=0){j=2<<v;j=w<<v&(j|0-j);j=(j&0-j)+ -1|0;d=j>>>12&16;j=j>>>d;h=j>>>5&8;j=j>>>h;g=j>>>2&4;j=j>>>g;f=j>>>1&2;j=j>>>f;e=j>>>1&1;e=(h|d|g|f|e)+(j>>>e)|0;j=e<<1;f=33128+(j<<2)|0;j=33128+(j+2<<2)|0;g=c[j>>2]|0;d=g+8|0;h=c[d>>2]|0;do{if((f|0)!=(h|0)){if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}k=h+12|0;if((c[k>>2]|0)==(g|0)){c[k>>2]=f;c[j>>2]=h;break}else{Jb()}}else{c[8272]=t&~(1<<e)}}while(0);h=e<<3;f=h-a|0;c[g+4>>2]=a|3;e=g+a|0;c[g+(a|4)>>2]=f|1;c[g+h>>2]=f;h=c[33096>>2]|0;if((h|0)!=0){g=c[33108>>2]|0;k=h>>>3;l=k<<1;h=33128+(l<<2)|0;j=c[8272]|0;k=1<<k;if((j&k|0)!=0){j=33128+(l+2<<2)|0;k=c[j>>2]|0;if(k>>>0<(c[33104>>2]|0)>>>0){Jb()}else{D=j;C=k}}else{c[8272]=j|k;D=33128+(l+2<<2)|0;C=h}c[D>>2]=g;c[C+12>>2]=g;c[g+8>>2]=C;c[g+12>>2]=h}c[33096>>2]=f;c[33108>>2]=e;H=d;i=b;return H|0}t=c[33092>>2]|0;if((t|0)!=0){d=(t&0-t)+ -1|0;G=d>>>12&16;d=d>>>G;F=d>>>5&8;d=d>>>F;H=d>>>2&4;d=d>>>H;h=d>>>1&2;d=d>>>h;e=d>>>1&1;e=c[33392+((F|G|H|h|e)+(d>>>e)<<2)>>2]|0;d=(c[e+4>>2]&-8)-a|0;h=e;while(1){g=c[h+16>>2]|0;if((g|0)==0){g=c[h+20>>2]|0;if((g|0)==0){break}}h=(c[g+4>>2]&-8)-a|0;f=h>>>0<d>>>0;d=f?h:d;h=g;e=f?g:e}h=c[33104>>2]|0;if(e>>>0<h>>>0){Jb()}f=e+a|0;if(!(e>>>0<f>>>0)){Jb()}g=c[e+24>>2]|0;j=c[e+12>>2]|0;do{if((j|0)==(e|0)){k=e+20|0;j=c[k>>2]|0;if((j|0)==0){k=e+16|0;j=c[k>>2]|0;if((j|0)==0){B=0;break}}while(1){m=j+20|0;l=c[m>>2]|0;if((l|0)!=0){j=l;k=m;continue}m=j+16|0;l=c[m>>2]|0;if((l|0)==0){break}else{j=l;k=m}}if(k>>>0<h>>>0){Jb()}else{c[k>>2]=0;B=j;break}}else{k=c[e+8>>2]|0;if(k>>>0<h>>>0){Jb()}h=k+12|0;if((c[h>>2]|0)!=(e|0)){Jb()}l=j+8|0;if((c[l>>2]|0)==(e|0)){c[h>>2]=j;c[l>>2]=k;B=j;break}else{Jb()}}}while(0);do{if((g|0)!=0){j=c[e+28>>2]|0;h=33392+(j<<2)|0;if((e|0)==(c[h>>2]|0)){c[h>>2]=B;if((B|0)==0){c[33092>>2]=c[33092>>2]&~(1<<j);break}}else{if(g>>>0<(c[33104>>2]|0)>>>0){Jb()}h=g+16|0;if((c[h>>2]|0)==(e|0)){c[h>>2]=B}else{c[g+20>>2]=B}if((B|0)==0){break}}if(B>>>0<(c[33104>>2]|0)>>>0){Jb()}c[B+24>>2]=g;g=c[e+16>>2]|0;do{if((g|0)!=0){if(g>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[B+16>>2]=g;c[g+24>>2]=B;break}}}while(0);g=c[e+20>>2]|0;if((g|0)!=0){if(g>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[B+20>>2]=g;c[g+24>>2]=B;break}}}}while(0);if(d>>>0<16){H=d+a|0;c[e+4>>2]=H|3;H=e+(H+4)|0;c[H>>2]=c[H>>2]|1}else{c[e+4>>2]=a|3;c[e+(a|4)>>2]=d|1;c[e+(d+a)>>2]=d;h=c[33096>>2]|0;if((h|0)!=0){g=c[33108>>2]|0;k=h>>>3;l=k<<1;h=33128+(l<<2)|0;j=c[8272]|0;k=1<<k;if((j&k|0)!=0){j=33128+(l+2<<2)|0;k=c[j>>2]|0;if(k>>>0<(c[33104>>2]|0)>>>0){Jb()}else{A=j;z=k}}else{c[8272]=j|k;A=33128+(l+2<<2)|0;z=h}c[A>>2]=g;c[z+12>>2]=g;c[g+8>>2]=z;c[g+12>>2]=h}c[33096>>2]=d;c[33108>>2]=f}H=e+8|0;i=b;return H|0}}}else{if(!(a>>>0>4294967231)){z=a+11|0;a=z&-8;B=c[33092>>2]|0;if((B|0)!=0){A=0-a|0;z=z>>>8;if((z|0)!=0){if(a>>>0>16777215){C=31}else{G=(z+1048320|0)>>>16&8;H=z<<G;F=(H+520192|0)>>>16&4;H=H<<F;C=(H+245760|0)>>>16&2;C=14-(F|G|C)+(H<<C>>>15)|0;C=a>>>(C+7|0)&1|C<<1}}else{C=0}F=c[33392+(C<<2)>>2]|0;a:do{if((F|0)==0){E=0;z=0}else{if((C|0)==31){z=0}else{z=25-(C>>>1)|0}E=0;D=a<<z;z=0;while(1){H=c[F+4>>2]&-8;G=H-a|0;if(G>>>0<A>>>0){if((H|0)==(a|0)){A=G;E=F;z=F;break a}else{A=G;z=F}}G=c[F+20>>2]|0;F=c[F+(D>>>31<<2)+16>>2]|0;E=(G|0)==0|(G|0)==(F|0)?E:G;if((F|0)==0){break}else{D=D<<1}}}}while(0);if((E|0)==0&(z|0)==0){H=2<<C;B=B&(H|0-H);if((B|0)==0){break}H=(B&0-B)+ -1|0;D=H>>>12&16;H=H>>>D;C=H>>>5&8;H=H>>>C;F=H>>>2&4;H=H>>>F;G=H>>>1&2;H=H>>>G;E=H>>>1&1;E=c[33392+((C|D|F|G|E)+(H>>>E)<<2)>>2]|0}if((E|0)!=0){while(1){C=(c[E+4>>2]&-8)-a|0;B=C>>>0<A>>>0;A=B?C:A;z=B?E:z;B=c[E+16>>2]|0;if((B|0)!=0){E=B;continue}E=c[E+20>>2]|0;if((E|0)==0){break}}}if((z|0)!=0?A>>>0<((c[33096>>2]|0)-a|0)>>>0:0){f=c[33104>>2]|0;if(z>>>0<f>>>0){Jb()}d=z+a|0;if(!(z>>>0<d>>>0)){Jb()}e=c[z+24>>2]|0;h=c[z+12>>2]|0;do{if((h|0)==(z|0)){h=z+20|0;g=c[h>>2]|0;if((g|0)==0){h=z+16|0;g=c[h>>2]|0;if((g|0)==0){x=0;break}}while(1){k=g+20|0;j=c[k>>2]|0;if((j|0)!=0){g=j;h=k;continue}j=g+16|0;k=c[j>>2]|0;if((k|0)==0){break}else{g=k;h=j}}if(h>>>0<f>>>0){Jb()}else{c[h>>2]=0;x=g;break}}else{g=c[z+8>>2]|0;if(g>>>0<f>>>0){Jb()}j=g+12|0;if((c[j>>2]|0)!=(z|0)){Jb()}f=h+8|0;if((c[f>>2]|0)==(z|0)){c[j>>2]=h;c[f>>2]=g;x=h;break}else{Jb()}}}while(0);do{if((e|0)!=0){f=c[z+28>>2]|0;g=33392+(f<<2)|0;if((z|0)==(c[g>>2]|0)){c[g>>2]=x;if((x|0)==0){c[33092>>2]=c[33092>>2]&~(1<<f);break}}else{if(e>>>0<(c[33104>>2]|0)>>>0){Jb()}f=e+16|0;if((c[f>>2]|0)==(z|0)){c[f>>2]=x}else{c[e+20>>2]=x}if((x|0)==0){break}}if(x>>>0<(c[33104>>2]|0)>>>0){Jb()}c[x+24>>2]=e;e=c[z+16>>2]|0;do{if((e|0)!=0){if(e>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[x+16>>2]=e;c[e+24>>2]=x;break}}}while(0);e=c[z+20>>2]|0;if((e|0)!=0){if(e>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[x+20>>2]=e;c[e+24>>2]=x;break}}}}while(0);b:do{if(!(A>>>0<16)){c[z+4>>2]=a|3;c[z+(a|4)>>2]=A|1;c[z+(A+a)>>2]=A;f=A>>>3;if(A>>>0<256){h=f<<1;e=33128+(h<<2)|0;g=c[8272]|0;f=1<<f;if((g&f|0)!=0){g=33128+(h+2<<2)|0;f=c[g>>2]|0;if(f>>>0<(c[33104>>2]|0)>>>0){Jb()}else{w=g;v=f}}else{c[8272]=g|f;w=33128+(h+2<<2)|0;v=e}c[w>>2]=d;c[v+12>>2]=d;c[z+(a+8)>>2]=v;c[z+(a+12)>>2]=e;break}e=A>>>8;if((e|0)!=0){if(A>>>0>16777215){e=31}else{G=(e+1048320|0)>>>16&8;H=e<<G;F=(H+520192|0)>>>16&4;H=H<<F;e=(H+245760|0)>>>16&2;e=14-(F|G|e)+(H<<e>>>15)|0;e=A>>>(e+7|0)&1|e<<1}}else{e=0}h=33392+(e<<2)|0;c[z+(a+28)>>2]=e;c[z+(a+20)>>2]=0;c[z+(a+16)>>2]=0;f=c[33092>>2]|0;g=1<<e;if((f&g|0)==0){c[33092>>2]=f|g;c[h>>2]=d;c[z+(a+24)>>2]=h;c[z+(a+12)>>2]=d;c[z+(a+8)>>2]=d;break}f=c[h>>2]|0;if((e|0)==31){e=0}else{e=25-(e>>>1)|0}c:do{if((c[f+4>>2]&-8|0)!=(A|0)){e=A<<e;while(1){h=f+(e>>>31<<2)+16|0;g=c[h>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(A|0)){t=g;break c}else{e=e<<1;f=g}}if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[h>>2]=d;c[z+(a+24)>>2]=f;c[z+(a+12)>>2]=d;c[z+(a+8)>>2]=d;break b}}else{t=f}}while(0);f=t+8|0;e=c[f>>2]|0;g=c[33104>>2]|0;if(t>>>0<g>>>0){Jb()}if(e>>>0<g>>>0){Jb()}else{c[e+12>>2]=d;c[f>>2]=d;c[z+(a+8)>>2]=e;c[z+(a+12)>>2]=t;c[z+(a+24)>>2]=0;break}}else{H=A+a|0;c[z+4>>2]=H|3;H=z+(H+4)|0;c[H>>2]=c[H>>2]|1}}while(0);H=z+8|0;i=b;return H|0}}}else{a=-1}}}while(0);t=c[33096>>2]|0;if(!(a>>>0>t>>>0)){e=t-a|0;d=c[33108>>2]|0;if(e>>>0>15){c[33108>>2]=d+a;c[33096>>2]=e;c[d+(a+4)>>2]=e|1;c[d+t>>2]=e;c[d+4>>2]=a|3}else{c[33096>>2]=0;c[33108>>2]=0;c[d+4>>2]=t|3;H=d+(t+4)|0;c[H>>2]=c[H>>2]|1}H=d+8|0;i=b;return H|0}t=c[33100>>2]|0;if(a>>>0<t>>>0){G=t-a|0;c[33100>>2]=G;H=c[33112>>2]|0;c[33112>>2]=H+a;c[H+(a+4)>>2]=G|1;c[H+4>>2]=a|3;H=H+8|0;i=b;return H|0}do{if((c[8390]|0)==0){t=Ea(30)|0;if((t+ -1&t|0)==0){c[33568>>2]=t;c[33564>>2]=t;c[33572>>2]=-1;c[33576>>2]=-1;c[33580>>2]=0;c[33532>>2]=0;c[8390]=(ib(0)|0)&-16^1431655768;break}else{Jb()}}}while(0);v=a+48|0;A=c[33568>>2]|0;w=a+47|0;x=A+w|0;A=0-A|0;t=x&A;if(!(t>>>0>a>>>0)){H=0;i=b;return H|0}z=c[33528>>2]|0;if((z|0)!=0?(G=c[33520>>2]|0,H=G+t|0,H>>>0<=G>>>0|H>>>0>z>>>0):0){H=0;i=b;return H|0}d:do{if((c[33532>>2]&4|0)==0){B=c[33112>>2]|0;e:do{if((B|0)!=0){z=33536|0;while(1){C=c[z>>2]|0;if(!(C>>>0>B>>>0)?(y=z+4|0,(C+(c[y>>2]|0)|0)>>>0>B>>>0):0){break}z=c[z+8>>2]|0;if((z|0)==0){o=182;break e}}if((z|0)!=0){A=x-(c[33100>>2]|0)&A;if(A>>>0<2147483647){o=ac(A|0)|0;B=(o|0)==((c[z>>2]|0)+(c[y>>2]|0)|0);x=o;z=A;y=B?o:-1;A=B?A:0;o=191}else{A=0}}else{o=182}}else{o=182}}while(0);do{if((o|0)==182){y=ac(0)|0;if((y|0)!=(-1|0)){z=y;x=c[33564>>2]|0;A=x+ -1|0;if((A&z|0)==0){A=t}else{A=t-z+(A+z&0-x)|0}z=c[33520>>2]|0;B=z+A|0;if(A>>>0>a>>>0&A>>>0<2147483647){x=c[33528>>2]|0;if((x|0)!=0?B>>>0<=z>>>0|B>>>0>x>>>0:0){A=0;break}x=ac(A|0)|0;o=(x|0)==(y|0);z=A;y=o?y:-1;A=o?A:0;o=191}else{A=0}}else{A=0}}}while(0);f:do{if((o|0)==191){o=0-z|0;if((y|0)!=(-1|0)){s=y;p=A;o=202;break d}do{if((x|0)!=(-1|0)&z>>>0<2147483647&z>>>0<v>>>0?(u=c[33568>>2]|0,u=w-z+u&0-u,u>>>0<2147483647):0){if((ac(u|0)|0)==(-1|0)){ac(o|0)|0;break f}else{z=u+z|0;break}}}while(0);if((x|0)!=(-1|0)){s=x;p=z;o=202;break d}}}while(0);c[33532>>2]=c[33532>>2]|4;o=199}else{A=0;o=199}}while(0);if((((o|0)==199?t>>>0<2147483647:0)?(s=ac(t|0)|0,r=ac(0)|0,(r|0)!=(-1|0)&(s|0)!=(-1|0)&s>>>0<r>>>0):0)?(q=r-s|0,p=q>>>0>(a+40|0)>>>0,p):0){p=p?q:A;o=202}if((o|0)==202){q=(c[33520>>2]|0)+p|0;c[33520>>2]=q;if(q>>>0>(c[33524>>2]|0)>>>0){c[33524>>2]=q}q=c[33112>>2]|0;g:do{if((q|0)!=0){w=33536|0;while(1){r=c[w>>2]|0;u=w+4|0;v=c[u>>2]|0;if((s|0)==(r+v|0)){o=214;break}t=c[w+8>>2]|0;if((t|0)==0){break}else{w=t}}if(((o|0)==214?(c[w+12>>2]&8|0)==0:0)?q>>>0>=r>>>0&q>>>0<s>>>0:0){c[u>>2]=v+p;d=(c[33100>>2]|0)+p|0;e=q+8|0;if((e&7|0)==0){e=0}else{e=0-e&7}H=d-e|0;c[33112>>2]=q+e;c[33100>>2]=H;c[q+(e+4)>>2]=H|1;c[q+(d+4)>>2]=40;c[33116>>2]=c[33576>>2];break}if(s>>>0<(c[33104>>2]|0)>>>0){c[33104>>2]=s}u=s+p|0;r=33536|0;while(1){if((c[r>>2]|0)==(u|0)){o=224;break}t=c[r+8>>2]|0;if((t|0)==0){break}else{r=t}}if((o|0)==224?(c[r+12>>2]&8|0)==0:0){c[r>>2]=s;h=r+4|0;c[h>>2]=(c[h>>2]|0)+p;h=s+8|0;if((h&7|0)==0){h=0}else{h=0-h&7}j=s+(p+8)|0;if((j&7|0)==0){o=0}else{o=0-j&7}q=s+(o+p)|0;k=h+a|0;j=s+k|0;m=q-(s+h)-a|0;c[s+(h+4)>>2]=a|3;h:do{if((q|0)!=(c[33112>>2]|0)){if((q|0)==(c[33108>>2]|0)){H=(c[33096>>2]|0)+m|0;c[33096>>2]=H;c[33108>>2]=j;c[s+(k+4)>>2]=H|1;c[s+(H+k)>>2]=H;break}a=p+4|0;t=c[s+(a+o)>>2]|0;if((t&3|0)==1){n=t&-8;r=t>>>3;do{if(!(t>>>0<256)){l=c[s+((o|24)+p)>>2]|0;u=c[s+(p+12+o)>>2]|0;do{if((u|0)==(q|0)){u=o|16;t=s+(a+u)|0;r=c[t>>2]|0;if((r|0)==0){t=s+(u+p)|0;r=c[t>>2]|0;if((r|0)==0){g=0;break}}while(1){v=r+20|0;u=c[v>>2]|0;if((u|0)!=0){r=u;t=v;continue}u=r+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{r=v;t=u}}if(t>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[t>>2]=0;g=r;break}}else{t=c[s+((o|8)+p)>>2]|0;if(t>>>0<(c[33104>>2]|0)>>>0){Jb()}r=t+12|0;if((c[r>>2]|0)!=(q|0)){Jb()}v=u+8|0;if((c[v>>2]|0)==(q|0)){c[r>>2]=u;c[v>>2]=t;g=u;break}else{Jb()}}}while(0);if((l|0)!=0){r=c[s+(p+28+o)>>2]|0;t=33392+(r<<2)|0;if((q|0)==(c[t>>2]|0)){c[t>>2]=g;if((g|0)==0){c[33092>>2]=c[33092>>2]&~(1<<r);break}}else{if(l>>>0<(c[33104>>2]|0)>>>0){Jb()}r=l+16|0;if((c[r>>2]|0)==(q|0)){c[r>>2]=g}else{c[l+20>>2]=g}if((g|0)==0){break}}if(g>>>0<(c[33104>>2]|0)>>>0){Jb()}c[g+24>>2]=l;q=o|16;l=c[s+(q+p)>>2]|0;do{if((l|0)!=0){if(l>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[g+16>>2]=l;c[l+24>>2]=g;break}}}while(0);l=c[s+(a+q)>>2]|0;if((l|0)!=0){if(l>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[g+20>>2]=l;c[l+24>>2]=g;break}}}}else{g=c[s+((o|8)+p)>>2]|0;a=c[s+(p+12+o)>>2]|0;t=33128+(r<<1<<2)|0;if((g|0)!=(t|0)){if(g>>>0<(c[33104>>2]|0)>>>0){Jb()}if((c[g+12>>2]|0)!=(q|0)){Jb()}}if((a|0)==(g|0)){c[8272]=c[8272]&~(1<<r);break}if((a|0)!=(t|0)){if(a>>>0<(c[33104>>2]|0)>>>0){Jb()}r=a+8|0;if((c[r>>2]|0)==(q|0)){l=r}else{Jb()}}else{l=a+8|0}c[g+12>>2]=a;c[l>>2]=g}}while(0);q=s+((n|o)+p)|0;m=n+m|0}g=q+4|0;c[g>>2]=c[g>>2]&-2;c[s+(k+4)>>2]=m|1;c[s+(m+k)>>2]=m;g=m>>>3;if(m>>>0<256){m=g<<1;d=33128+(m<<2)|0;l=c[8272]|0;g=1<<g;if((l&g|0)!=0){l=33128+(m+2<<2)|0;g=c[l>>2]|0;if(g>>>0<(c[33104>>2]|0)>>>0){Jb()}else{e=l;f=g}}else{c[8272]=l|g;e=33128+(m+2<<2)|0;f=d}c[e>>2]=j;c[f+12>>2]=j;c[s+(k+8)>>2]=f;c[s+(k+12)>>2]=d;break}e=m>>>8;if((e|0)!=0){if(m>>>0>16777215){e=31}else{G=(e+1048320|0)>>>16&8;H=e<<G;F=(H+520192|0)>>>16&4;H=H<<F;e=(H+245760|0)>>>16&2;e=14-(F|G|e)+(H<<e>>>15)|0;e=m>>>(e+7|0)&1|e<<1}}else{e=0}f=33392+(e<<2)|0;c[s+(k+28)>>2]=e;c[s+(k+20)>>2]=0;c[s+(k+16)>>2]=0;l=c[33092>>2]|0;g=1<<e;if((l&g|0)==0){c[33092>>2]=l|g;c[f>>2]=j;c[s+(k+24)>>2]=f;c[s+(k+12)>>2]=j;c[s+(k+8)>>2]=j;break}f=c[f>>2]|0;if((e|0)==31){e=0}else{e=25-(e>>>1)|0}i:do{if((c[f+4>>2]&-8|0)!=(m|0)){e=m<<e;while(1){g=f+(e>>>31<<2)+16|0;l=c[g>>2]|0;if((l|0)==0){break}if((c[l+4>>2]&-8|0)==(m|0)){d=l;break i}else{e=e<<1;f=l}}if(g>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[g>>2]=j;c[s+(k+24)>>2]=f;c[s+(k+12)>>2]=j;c[s+(k+8)>>2]=j;break h}}else{d=f}}while(0);f=d+8|0;e=c[f>>2]|0;g=c[33104>>2]|0;if(d>>>0<g>>>0){Jb()}if(e>>>0<g>>>0){Jb()}else{c[e+12>>2]=j;c[f>>2]=j;c[s+(k+8)>>2]=e;c[s+(k+12)>>2]=d;c[s+(k+24)>>2]=0;break}}else{H=(c[33100>>2]|0)+m|0;c[33100>>2]=H;c[33112>>2]=j;c[s+(k+4)>>2]=H|1}}while(0);H=s+(h|8)|0;i=b;return H|0}e=33536|0;while(1){d=c[e>>2]|0;if(!(d>>>0>q>>>0)?(n=c[e+4>>2]|0,m=d+n|0,m>>>0>q>>>0):0){break}e=c[e+8>>2]|0}e=d+(n+ -39)|0;if((e&7|0)==0){e=0}else{e=0-e&7}d=d+(n+ -47+e)|0;d=d>>>0<(q+16|0)>>>0?q:d;e=d+8|0;f=s+8|0;if((f&7|0)==0){f=0}else{f=0-f&7}H=p+ -40-f|0;c[33112>>2]=s+f;c[33100>>2]=H;c[s+(f+4)>>2]=H|1;c[s+(p+ -36)>>2]=40;c[33116>>2]=c[33576>>2];c[d+4>>2]=27;c[e+0>>2]=c[33536>>2];c[e+4>>2]=c[33540>>2];c[e+8>>2]=c[33544>>2];c[e+12>>2]=c[33548>>2];c[33536>>2]=s;c[33540>>2]=p;c[33548>>2]=0;c[33544>>2]=e;f=d+28|0;c[f>>2]=7;if((d+32|0)>>>0<m>>>0){while(1){e=f+4|0;c[e>>2]=7;if((f+8|0)>>>0<m>>>0){f=e}else{break}}}if((d|0)!=(q|0)){d=d-q|0;e=q+(d+4)|0;c[e>>2]=c[e>>2]&-2;c[q+4>>2]=d|1;c[q+d>>2]=d;e=d>>>3;if(d>>>0<256){f=e<<1;d=33128+(f<<2)|0;g=c[8272]|0;e=1<<e;if((g&e|0)!=0){f=33128+(f+2<<2)|0;e=c[f>>2]|0;if(e>>>0<(c[33104>>2]|0)>>>0){Jb()}else{j=f;k=e}}else{c[8272]=g|e;j=33128+(f+2<<2)|0;k=d}c[j>>2]=q;c[k+12>>2]=q;c[q+8>>2]=k;c[q+12>>2]=d;break}e=d>>>8;if((e|0)!=0){if(d>>>0>16777215){e=31}else{G=(e+1048320|0)>>>16&8;H=e<<G;F=(H+520192|0)>>>16&4;H=H<<F;e=(H+245760|0)>>>16&2;e=14-(F|G|e)+(H<<e>>>15)|0;e=d>>>(e+7|0)&1|e<<1}}else{e=0}j=33392+(e<<2)|0;c[q+28>>2]=e;c[q+20>>2]=0;c[q+16>>2]=0;f=c[33092>>2]|0;g=1<<e;if((f&g|0)==0){c[33092>>2]=f|g;c[j>>2]=q;c[q+24>>2]=j;c[q+12>>2]=q;c[q+8>>2]=q;break}f=c[j>>2]|0;if((e|0)==31){e=0}else{e=25-(e>>>1)|0}j:do{if((c[f+4>>2]&-8|0)!=(d|0)){e=d<<e;while(1){j=f+(e>>>31<<2)+16|0;g=c[j>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(d|0)){h=g;break j}else{e=e<<1;f=g}}if(j>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[j>>2]=q;c[q+24>>2]=f;c[q+12>>2]=q;c[q+8>>2]=q;break g}}else{h=f}}while(0);f=h+8|0;e=c[f>>2]|0;d=c[33104>>2]|0;if(h>>>0<d>>>0){Jb()}if(e>>>0<d>>>0){Jb()}else{c[e+12>>2]=q;c[f>>2]=q;c[q+8>>2]=e;c[q+12>>2]=h;c[q+24>>2]=0;break}}}else{H=c[33104>>2]|0;if((H|0)==0|s>>>0<H>>>0){c[33104>>2]=s}c[33536>>2]=s;c[33540>>2]=p;c[33548>>2]=0;c[33124>>2]=c[8390];c[33120>>2]=-1;d=0;do{H=d<<1;G=33128+(H<<2)|0;c[33128+(H+3<<2)>>2]=G;c[33128+(H+2<<2)>>2]=G;d=d+1|0}while((d|0)!=32);d=s+8|0;if((d&7|0)==0){d=0}else{d=0-d&7}H=p+ -40-d|0;c[33112>>2]=s+d;c[33100>>2]=H;c[s+(d+4)>>2]=H|1;c[s+(p+ -36)>>2]=40;c[33116>>2]=c[33576>>2]}}while(0);d=c[33100>>2]|0;if(d>>>0>a>>>0){G=d-a|0;c[33100>>2]=G;H=c[33112>>2]|0;c[33112>>2]=H+a;c[H+(a+4)>>2]=G|1;c[H+4>>2]=a|3;H=H+8|0;i=b;return H|0}}c[(bc()|0)>>2]=12;H=0;i=b;return H|0}function xt(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=i;if((a|0)==0){i=b;return}q=a+ -8|0;r=c[33104>>2]|0;if(q>>>0<r>>>0){Jb()}o=c[a+ -4>>2]|0;n=o&3;if((n|0)==1){Jb()}j=o&-8;h=a+(j+ -8)|0;do{if((o&1|0)==0){u=c[q>>2]|0;if((n|0)==0){i=b;return}q=-8-u|0;o=a+q|0;n=u+j|0;if(o>>>0<r>>>0){Jb()}if((o|0)==(c[33108>>2]|0)){d=a+(j+ -4)|0;if((c[d>>2]&3|0)!=3){d=o;m=n;break}c[33096>>2]=n;c[d>>2]=c[d>>2]&-2;c[a+(q+4)>>2]=n|1;c[h>>2]=n;i=b;return}t=u>>>3;if(u>>>0<256){d=c[a+(q+8)>>2]|0;m=c[a+(q+12)>>2]|0;p=33128+(t<<1<<2)|0;if((d|0)!=(p|0)){if(d>>>0<r>>>0){Jb()}if((c[d+12>>2]|0)!=(o|0)){Jb()}}if((m|0)==(d|0)){c[8272]=c[8272]&~(1<<t);d=o;m=n;break}if((m|0)!=(p|0)){if(m>>>0<r>>>0){Jb()}p=m+8|0;if((c[p>>2]|0)==(o|0)){s=p}else{Jb()}}else{s=m+8|0}c[d+12>>2]=m;c[s>>2]=d;d=o;m=n;break}s=c[a+(q+24)>>2]|0;t=c[a+(q+12)>>2]|0;do{if((t|0)==(o|0)){u=a+(q+20)|0;t=c[u>>2]|0;if((t|0)==0){u=a+(q+16)|0;t=c[u>>2]|0;if((t|0)==0){p=0;break}}while(1){w=t+20|0;v=c[w>>2]|0;if((v|0)!=0){t=v;u=w;continue}v=t+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{t=w;u=v}}if(u>>>0<r>>>0){Jb()}else{c[u>>2]=0;p=t;break}}else{u=c[a+(q+8)>>2]|0;if(u>>>0<r>>>0){Jb()}r=u+12|0;if((c[r>>2]|0)!=(o|0)){Jb()}v=t+8|0;if((c[v>>2]|0)==(o|0)){c[r>>2]=t;c[v>>2]=u;p=t;break}else{Jb()}}}while(0);if((s|0)!=0){t=c[a+(q+28)>>2]|0;r=33392+(t<<2)|0;if((o|0)==(c[r>>2]|0)){c[r>>2]=p;if((p|0)==0){c[33092>>2]=c[33092>>2]&~(1<<t);d=o;m=n;break}}else{if(s>>>0<(c[33104>>2]|0)>>>0){Jb()}r=s+16|0;if((c[r>>2]|0)==(o|0)){c[r>>2]=p}else{c[s+20>>2]=p}if((p|0)==0){d=o;m=n;break}}if(p>>>0<(c[33104>>2]|0)>>>0){Jb()}c[p+24>>2]=s;r=c[a+(q+16)>>2]|0;do{if((r|0)!=0){if(r>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[p+16>>2]=r;c[r+24>>2]=p;break}}}while(0);q=c[a+(q+20)>>2]|0;if((q|0)!=0){if(q>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[p+20>>2]=q;c[q+24>>2]=p;d=o;m=n;break}}else{d=o;m=n}}else{d=o;m=n}}else{d=q;m=j}}while(0);if(!(d>>>0<h>>>0)){Jb()}n=a+(j+ -4)|0;o=c[n>>2]|0;if((o&1|0)==0){Jb()}if((o&2|0)==0){if((h|0)==(c[33112>>2]|0)){w=(c[33100>>2]|0)+m|0;c[33100>>2]=w;c[33112>>2]=d;c[d+4>>2]=w|1;if((d|0)!=(c[33108>>2]|0)){i=b;return}c[33108>>2]=0;c[33096>>2]=0;i=b;return}if((h|0)==(c[33108>>2]|0)){w=(c[33096>>2]|0)+m|0;c[33096>>2]=w;c[33108>>2]=d;c[d+4>>2]=w|1;c[d+w>>2]=w;i=b;return}m=(o&-8)+m|0;n=o>>>3;do{if(!(o>>>0<256)){l=c[a+(j+16)>>2]|0;q=c[a+(j|4)>>2]|0;do{if((q|0)==(h|0)){o=a+(j+12)|0;n=c[o>>2]|0;if((n|0)==0){o=a+(j+8)|0;n=c[o>>2]|0;if((n|0)==0){k=0;break}}while(1){p=n+20|0;q=c[p>>2]|0;if((q|0)!=0){n=q;o=p;continue}p=n+16|0;q=c[p>>2]|0;if((q|0)==0){break}else{n=q;o=p}}if(o>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[o>>2]=0;k=n;break}}else{o=c[a+j>>2]|0;if(o>>>0<(c[33104>>2]|0)>>>0){Jb()}p=o+12|0;if((c[p>>2]|0)!=(h|0)){Jb()}n=q+8|0;if((c[n>>2]|0)==(h|0)){c[p>>2]=q;c[n>>2]=o;k=q;break}else{Jb()}}}while(0);if((l|0)!=0){n=c[a+(j+20)>>2]|0;o=33392+(n<<2)|0;if((h|0)==(c[o>>2]|0)){c[o>>2]=k;if((k|0)==0){c[33092>>2]=c[33092>>2]&~(1<<n);break}}else{if(l>>>0<(c[33104>>2]|0)>>>0){Jb()}n=l+16|0;if((c[n>>2]|0)==(h|0)){c[n>>2]=k}else{c[l+20>>2]=k}if((k|0)==0){break}}if(k>>>0<(c[33104>>2]|0)>>>0){Jb()}c[k+24>>2]=l;h=c[a+(j+8)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[k+16>>2]=h;c[h+24>>2]=k;break}}}while(0);h=c[a+(j+12)>>2]|0;if((h|0)!=0){if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[k+20>>2]=h;c[h+24>>2]=k;break}}}}else{k=c[a+j>>2]|0;a=c[a+(j|4)>>2]|0;j=33128+(n<<1<<2)|0;if((k|0)!=(j|0)){if(k>>>0<(c[33104>>2]|0)>>>0){Jb()}if((c[k+12>>2]|0)!=(h|0)){Jb()}}if((a|0)==(k|0)){c[8272]=c[8272]&~(1<<n);break}if((a|0)!=(j|0)){if(a>>>0<(c[33104>>2]|0)>>>0){Jb()}j=a+8|0;if((c[j>>2]|0)==(h|0)){l=j}else{Jb()}}else{l=a+8|0}c[k+12>>2]=a;c[l>>2]=k}}while(0);c[d+4>>2]=m|1;c[d+m>>2]=m;if((d|0)==(c[33108>>2]|0)){c[33096>>2]=m;i=b;return}}else{c[n>>2]=o&-2;c[d+4>>2]=m|1;c[d+m>>2]=m}h=m>>>3;if(m>>>0<256){a=h<<1;e=33128+(a<<2)|0;j=c[8272]|0;h=1<<h;if((j&h|0)!=0){h=33128+(a+2<<2)|0;a=c[h>>2]|0;if(a>>>0<(c[33104>>2]|0)>>>0){Jb()}else{f=h;g=a}}else{c[8272]=j|h;f=33128+(a+2<<2)|0;g=e}c[f>>2]=d;c[g+12>>2]=d;c[d+8>>2]=g;c[d+12>>2]=e;i=b;return}f=m>>>8;if((f|0)!=0){if(m>>>0>16777215){f=31}else{v=(f+1048320|0)>>>16&8;w=f<<v;u=(w+520192|0)>>>16&4;w=w<<u;f=(w+245760|0)>>>16&2;f=14-(u|v|f)+(w<<f>>>15)|0;f=m>>>(f+7|0)&1|f<<1}}else{f=0}g=33392+(f<<2)|0;c[d+28>>2]=f;c[d+20>>2]=0;c[d+16>>2]=0;a=c[33092>>2]|0;h=1<<f;a:do{if((a&h|0)!=0){g=c[g>>2]|0;if((f|0)==31){f=0}else{f=25-(f>>>1)|0}b:do{if((c[g+4>>2]&-8|0)!=(m|0)){f=m<<f;a=g;while(1){h=a+(f>>>31<<2)+16|0;g=c[h>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(m|0)){e=g;break b}else{f=f<<1;a=g}}if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[h>>2]=d;c[d+24>>2]=a;c[d+12>>2]=d;c[d+8>>2]=d;break a}}else{e=g}}while(0);g=e+8|0;f=c[g>>2]|0;h=c[33104>>2]|0;if(e>>>0<h>>>0){Jb()}if(f>>>0<h>>>0){Jb()}else{c[f+12>>2]=d;c[g>>2]=d;c[d+8>>2]=f;c[d+12>>2]=e;c[d+24>>2]=0;break}}else{c[33092>>2]=a|h;c[g>>2]=d;c[d+24>>2]=g;c[d+12>>2]=d;c[d+8>>2]=d}}while(0);w=(c[33120>>2]|0)+ -1|0;c[33120>>2]=w;if((w|0)==0){d=33544|0}else{i=b;return}while(1){d=c[d>>2]|0;if((d|0)==0){break}else{d=d+8|0}}c[33120>>2]=-1;i=b;return}function yt(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;do{if((a|0)!=0){if(b>>>0>4294967231){c[(bc()|0)>>2]=12;e=0;break}if(b>>>0<11){e=16}else{e=b+11&-8}e=zt(a+ -8|0,e)|0;if((e|0)!=0){e=e+8|0;break}e=wt(b)|0;if((e|0)==0){e=0}else{f=c[a+ -4>>2]|0;f=(f&-8)-((f&3|0)==0?8:4)|0;Wt(e|0,a|0,(f>>>0<b>>>0?f:b)|0)|0;xt(a)}}else{e=wt(b)|0}}while(0);i=d;return e|0}function zt(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;e=a+4|0;g=c[e>>2]|0;j=g&-8;f=a+j|0;l=c[33104>>2]|0;if(a>>>0<l>>>0){Jb()}n=g&3;if(!((n|0)!=1&a>>>0<f>>>0)){Jb()}h=a+(j|4)|0;o=c[h>>2]|0;if((o&1|0)==0){Jb()}if((n|0)==0){if(b>>>0<256){q=0;i=d;return q|0}if(!(j>>>0<(b+4|0)>>>0)?!((j-b|0)>>>0>c[33568>>2]<<1>>>0):0){q=a;i=d;return q|0}q=0;i=d;return q|0}if(!(j>>>0<b>>>0)){f=j-b|0;if(!(f>>>0>15)){q=a;i=d;return q|0}c[e>>2]=g&1|b|2;c[a+(b+4)>>2]=f|3;c[h>>2]=c[h>>2]|1;At(a+b|0,f);q=a;i=d;return q|0}if((f|0)==(c[33112>>2]|0)){f=(c[33100>>2]|0)+j|0;if(!(f>>>0>b>>>0)){q=0;i=d;return q|0}q=f-b|0;c[e>>2]=g&1|b|2;c[a+(b+4)>>2]=q|1;c[33112>>2]=a+b;c[33100>>2]=q;q=a;i=d;return q|0}if((f|0)==(c[33108>>2]|0)){h=(c[33096>>2]|0)+j|0;if(h>>>0<b>>>0){q=0;i=d;return q|0}f=h-b|0;if(f>>>0>15){c[e>>2]=g&1|b|2;c[a+(b+4)>>2]=f|1;c[a+h>>2]=f;q=a+(h+4)|0;c[q>>2]=c[q>>2]&-2;b=a+b|0}else{c[e>>2]=g&1|h|2;b=a+(h+4)|0;c[b>>2]=c[b>>2]|1;b=0;f=0}c[33096>>2]=f;c[33108>>2]=b;q=a;i=d;return q|0}if((o&2|0)!=0){q=0;i=d;return q|0}h=(o&-8)+j|0;if(h>>>0<b>>>0){q=0;i=d;return q|0}g=h-b|0;n=o>>>3;do{if(!(o>>>0<256)){m=c[a+(j+24)>>2]|0;o=c[a+(j+12)>>2]|0;do{if((o|0)==(f|0)){o=a+(j+20)|0;n=c[o>>2]|0;if((n|0)==0){o=a+(j+16)|0;n=c[o>>2]|0;if((n|0)==0){k=0;break}}while(1){q=n+20|0;p=c[q>>2]|0;if((p|0)!=0){n=p;o=q;continue}q=n+16|0;p=c[q>>2]|0;if((p|0)==0){break}else{n=p;o=q}}if(o>>>0<l>>>0){Jb()}else{c[o>>2]=0;k=n;break}}else{n=c[a+(j+8)>>2]|0;if(n>>>0<l>>>0){Jb()}p=n+12|0;if((c[p>>2]|0)!=(f|0)){Jb()}l=o+8|0;if((c[l>>2]|0)==(f|0)){c[p>>2]=o;c[l>>2]=n;k=o;break}else{Jb()}}}while(0);if((m|0)!=0){l=c[a+(j+28)>>2]|0;n=33392+(l<<2)|0;if((f|0)==(c[n>>2]|0)){c[n>>2]=k;if((k|0)==0){c[33092>>2]=c[33092>>2]&~(1<<l);break}}else{if(m>>>0<(c[33104>>2]|0)>>>0){Jb()}l=m+16|0;if((c[l>>2]|0)==(f|0)){c[l>>2]=k}else{c[m+20>>2]=k}if((k|0)==0){break}}if(k>>>0<(c[33104>>2]|0)>>>0){Jb()}c[k+24>>2]=m;f=c[a+(j+16)>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[k+16>>2]=f;c[f+24>>2]=k;break}}}while(0);f=c[a+(j+20)>>2]|0;if((f|0)!=0){if(f>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[k+20>>2]=f;c[f+24>>2]=k;break}}}}else{k=c[a+(j+8)>>2]|0;j=c[a+(j+12)>>2]|0;o=33128+(n<<1<<2)|0;if((k|0)!=(o|0)){if(k>>>0<l>>>0){Jb()}if((c[k+12>>2]|0)!=(f|0)){Jb()}}if((j|0)==(k|0)){c[8272]=c[8272]&~(1<<n);break}if((j|0)!=(o|0)){if(j>>>0<l>>>0){Jb()}l=j+8|0;if((c[l>>2]|0)==(f|0)){m=l}else{Jb()}}else{m=j+8|0}c[k+12>>2]=j;c[m>>2]=k}}while(0);if(g>>>0<16){c[e>>2]=h|c[e>>2]&1|2;q=a+(h|4)|0;c[q>>2]=c[q>>2]|1;q=a;i=d;return q|0}else{c[e>>2]=c[e>>2]&1|b|2;c[a+(b+4)>>2]=g|3;q=a+(h|4)|0;c[q>>2]=c[q>>2]|1;At(a+b|0,g);q=a;i=d;return q|0}return 0}function At(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;h=a+b|0;l=c[a+4>>2]|0;do{if((l&1|0)==0){p=c[a>>2]|0;if((l&3|0)==0){i=d;return}l=a+(0-p)|0;m=p+b|0;q=c[33104>>2]|0;if(l>>>0<q>>>0){Jb()}if((l|0)==(c[33108>>2]|0)){e=a+(b+4)|0;if((c[e>>2]&3|0)!=3){e=l;n=m;break}c[33096>>2]=m;c[e>>2]=c[e>>2]&-2;c[a+(4-p)>>2]=m|1;c[h>>2]=m;i=d;return}s=p>>>3;if(p>>>0<256){e=c[a+(8-p)>>2]|0;n=c[a+(12-p)>>2]|0;o=33128+(s<<1<<2)|0;if((e|0)!=(o|0)){if(e>>>0<q>>>0){Jb()}if((c[e+12>>2]|0)!=(l|0)){Jb()}}if((n|0)==(e|0)){c[8272]=c[8272]&~(1<<s);e=l;n=m;break}if((n|0)!=(o|0)){if(n>>>0<q>>>0){Jb()}o=n+8|0;if((c[o>>2]|0)==(l|0)){r=o}else{Jb()}}else{r=n+8|0}c[e+12>>2]=n;c[r>>2]=e;e=l;n=m;break}r=c[a+(24-p)>>2]|0;t=c[a+(12-p)>>2]|0;do{if((t|0)==(l|0)){u=16-p|0;t=a+(u+4)|0;s=c[t>>2]|0;if((s|0)==0){t=a+u|0;s=c[t>>2]|0;if((s|0)==0){o=0;break}}while(1){u=s+20|0;v=c[u>>2]|0;if((v|0)!=0){s=v;t=u;continue}v=s+16|0;u=c[v>>2]|0;if((u|0)==0){break}else{s=u;t=v}}if(t>>>0<q>>>0){Jb()}else{c[t>>2]=0;o=s;break}}else{s=c[a+(8-p)>>2]|0;if(s>>>0<q>>>0){Jb()}u=s+12|0;if((c[u>>2]|0)!=(l|0)){Jb()}q=t+8|0;if((c[q>>2]|0)==(l|0)){c[u>>2]=t;c[q>>2]=s;o=t;break}else{Jb()}}}while(0);if((r|0)!=0){q=c[a+(28-p)>>2]|0;s=33392+(q<<2)|0;if((l|0)==(c[s>>2]|0)){c[s>>2]=o;if((o|0)==0){c[33092>>2]=c[33092>>2]&~(1<<q);e=l;n=m;break}}else{if(r>>>0<(c[33104>>2]|0)>>>0){Jb()}q=r+16|0;if((c[q>>2]|0)==(l|0)){c[q>>2]=o}else{c[r+20>>2]=o}if((o|0)==0){e=l;n=m;break}}if(o>>>0<(c[33104>>2]|0)>>>0){Jb()}c[o+24>>2]=r;p=16-p|0;q=c[a+p>>2]|0;do{if((q|0)!=0){if(q>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[o+16>>2]=q;c[q+24>>2]=o;break}}}while(0);p=c[a+(p+4)>>2]|0;if((p|0)!=0){if(p>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[o+20>>2]=p;c[p+24>>2]=o;e=l;n=m;break}}else{e=l;n=m}}else{e=l;n=m}}else{e=a;n=b}}while(0);l=c[33104>>2]|0;if(h>>>0<l>>>0){Jb()}m=a+(b+4)|0;o=c[m>>2]|0;if((o&2|0)==0){if((h|0)==(c[33112>>2]|0)){v=(c[33100>>2]|0)+n|0;c[33100>>2]=v;c[33112>>2]=e;c[e+4>>2]=v|1;if((e|0)!=(c[33108>>2]|0)){i=d;return}c[33108>>2]=0;c[33096>>2]=0;i=d;return}if((h|0)==(c[33108>>2]|0)){v=(c[33096>>2]|0)+n|0;c[33096>>2]=v;c[33108>>2]=e;c[e+4>>2]=v|1;c[e+v>>2]=v;i=d;return}n=(o&-8)+n|0;m=o>>>3;do{if(!(o>>>0<256)){k=c[a+(b+24)>>2]|0;m=c[a+(b+12)>>2]|0;do{if((m|0)==(h|0)){o=a+(b+20)|0;m=c[o>>2]|0;if((m|0)==0){o=a+(b+16)|0;m=c[o>>2]|0;if((m|0)==0){j=0;break}}while(1){q=m+20|0;p=c[q>>2]|0;if((p|0)!=0){m=p;o=q;continue}p=m+16|0;q=c[p>>2]|0;if((q|0)==0){break}else{m=q;o=p}}if(o>>>0<l>>>0){Jb()}else{c[o>>2]=0;j=m;break}}else{o=c[a+(b+8)>>2]|0;if(o>>>0<l>>>0){Jb()}l=o+12|0;if((c[l>>2]|0)!=(h|0)){Jb()}p=m+8|0;if((c[p>>2]|0)==(h|0)){c[l>>2]=m;c[p>>2]=o;j=m;break}else{Jb()}}}while(0);if((k|0)!=0){l=c[a+(b+28)>>2]|0;m=33392+(l<<2)|0;if((h|0)==(c[m>>2]|0)){c[m>>2]=j;if((j|0)==0){c[33092>>2]=c[33092>>2]&~(1<<l);break}}else{if(k>>>0<(c[33104>>2]|0)>>>0){Jb()}l=k+16|0;if((c[l>>2]|0)==(h|0)){c[l>>2]=j}else{c[k+20>>2]=j}if((j|0)==0){break}}if(j>>>0<(c[33104>>2]|0)>>>0){Jb()}c[j+24>>2]=k;h=c[a+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[j+16>>2]=h;c[h+24>>2]=j;break}}}while(0);h=c[a+(b+20)>>2]|0;if((h|0)!=0){if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}else{c[j+20>>2]=h;c[h+24>>2]=j;break}}}}else{j=c[a+(b+8)>>2]|0;a=c[a+(b+12)>>2]|0;b=33128+(m<<1<<2)|0;if((j|0)!=(b|0)){if(j>>>0<l>>>0){Jb()}if((c[j+12>>2]|0)!=(h|0)){Jb()}}if((a|0)==(j|0)){c[8272]=c[8272]&~(1<<m);break}if((a|0)!=(b|0)){if(a>>>0<l>>>0){Jb()}b=a+8|0;if((c[b>>2]|0)==(h|0)){k=b}else{Jb()}}else{k=a+8|0}c[j+12>>2]=a;c[k>>2]=j}}while(0);c[e+4>>2]=n|1;c[e+n>>2]=n;if((e|0)==(c[33108>>2]|0)){c[33096>>2]=n;i=d;return}}else{c[m>>2]=o&-2;c[e+4>>2]=n|1;c[e+n>>2]=n}a=n>>>3;if(n>>>0<256){b=a<<1;h=33128+(b<<2)|0;j=c[8272]|0;a=1<<a;if((j&a|0)!=0){b=33128+(b+2<<2)|0;a=c[b>>2]|0;if(a>>>0<(c[33104>>2]|0)>>>0){Jb()}else{g=b;f=a}}else{c[8272]=j|a;g=33128+(b+2<<2)|0;f=h}c[g>>2]=e;c[f+12>>2]=e;c[e+8>>2]=f;c[e+12>>2]=h;i=d;return}f=n>>>8;if((f|0)!=0){if(n>>>0>16777215){f=31}else{u=(f+1048320|0)>>>16&8;v=f<<u;t=(v+520192|0)>>>16&4;v=v<<t;f=(v+245760|0)>>>16&2;f=14-(t|u|f)+(v<<f>>>15)|0;f=n>>>(f+7|0)&1|f<<1}}else{f=0}a=33392+(f<<2)|0;c[e+28>>2]=f;c[e+20>>2]=0;c[e+16>>2]=0;h=c[33092>>2]|0;g=1<<f;if((h&g|0)==0){c[33092>>2]=h|g;c[a>>2]=e;c[e+24>>2]=a;c[e+12>>2]=e;c[e+8>>2]=e;i=d;return}g=c[a>>2]|0;if((f|0)==31){f=0}else{f=25-(f>>>1)|0}a:do{if((c[g+4>>2]&-8|0)!=(n|0)){f=n<<f;a=g;while(1){h=a+(f>>>31<<2)+16|0;g=c[h>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(n|0)){break a}else{f=f<<1;a=g}}if(h>>>0<(c[33104>>2]|0)>>>0){Jb()}c[h>>2]=e;c[e+24>>2]=a;c[e+12>>2]=e;c[e+8>>2]=e;i=d;return}}while(0);f=g+8|0;a=c[f>>2]|0;h=c[33104>>2]|0;if(g>>>0<h>>>0){Jb()}if(a>>>0<h>>>0){Jb()}c[a+12>>2]=e;c[f>>2]=e;c[e+8>>2]=a;c[e+12>>2]=g;c[e+24>>2]=0;i=d;return}function Bt(a){a=a|0;var b=0,d=0;b=i;a=(a|0)==0?1:a;while(1){d=wt(a)|0;if((d|0)!=0){a=6;break}d=c[8396]|0;c[8396]=d+0;if((d|0)==0){a=5;break}oc[d&31]()}if((a|0)==5){d=rb(4)|0;c[d>>2]=33600;ec(d|0,33648,72)}else if((a|0)==6){i=b;return d|0}return 0}function Ct(a){a=a|0;var b=0;b=i;if((a|0)!=0){xt(a)}i=b;return}function Dt(a){a=a|0;var b=0;b=i;Ma(a|0);Ct(a);i=b;return}function Et(a){a=a|0;var b=0;b=i;Ma(a|0);i=b;return}function Ft(a){a=a|0;return 33616}function Gt(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0.0,J=0,K=0.0,L=0.0,M=0.0,N=0.0;g=i;i=i+512|0;k=g;if((e|0)==0){e=24;h=-149}else if((e|0)==2){e=53;h=-1074}else if((e|0)==1){e=53;h=-1074}else{L=0.0;i=g;return+L}n=b+4|0;o=b+100|0;do{j=c[n>>2]|0;if(j>>>0<(c[o>>2]|0)>>>0){c[n>>2]=j+1;z=d[j]|0}else{z=Jt(b)|0}}while((Mb(z|0)|0)!=0);do{if((z|0)==43|(z|0)==45){j=1-(((z|0)==45)<<1)|0;m=c[n>>2]|0;if(m>>>0<(c[o>>2]|0)>>>0){c[n>>2]=m+1;z=d[m]|0;break}else{z=Jt(b)|0;break}}else{j=1}}while(0);m=0;do{if((z|32|0)!=(a[33664+m|0]|0)){break}do{if(m>>>0<7){p=c[n>>2]|0;if(p>>>0<(c[o>>2]|0)>>>0){c[n>>2]=p+1;z=d[p]|0;break}else{z=Jt(b)|0;break}}}while(0);m=m+1|0}while(m>>>0<8);do{if((m|0)==3){q=23}else if((m|0)!=8){p=(f|0)==0;if(!(m>>>0<4|p)){if((m|0)==8){break}else{q=23;break}}a:do{if((m|0)==0){m=0;do{if((z|32|0)!=(a[33680+m|0]|0)){break a}do{if(m>>>0<2){s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0;break}else{z=Jt(b)|0;break}}}while(0);m=m+1|0}while(m>>>0<3)}}while(0);if((m|0)==3){e=c[n>>2]|0;if(e>>>0<(c[o>>2]|0)>>>0){c[n>>2]=e+1;e=d[e]|0}else{e=Jt(b)|0}if((e|0)==40){e=1}else{if((c[o>>2]|0)==0){L=u;i=g;return+L}c[n>>2]=(c[n>>2]|0)+ -1;L=u;i=g;return+L}while(1){h=c[n>>2]|0;if(h>>>0<(c[o>>2]|0)>>>0){c[n>>2]=h+1;h=d[h]|0}else{h=Jt(b)|0}if(!((h+ -48|0)>>>0<10|(h+ -65|0)>>>0<26)?!((h+ -97|0)>>>0<26|(h|0)==95):0){break}e=e+1|0}if((h|0)==41){L=u;i=g;return+L}h=(c[o>>2]|0)==0;if(!h){c[n>>2]=(c[n>>2]|0)+ -1}if(p){c[(bc()|0)>>2]=22;It(b,0);L=0.0;i=g;return+L}if((e|0)==0|h){L=u;i=g;return+L}while(1){e=e+ -1|0;c[n>>2]=(c[n>>2]|0)+ -1;if((e|0)==0){r=u;break}}i=g;return+r}else if((m|0)==0){do{if((z|0)==48){m=c[n>>2]|0;if(m>>>0<(c[o>>2]|0)>>>0){c[n>>2]=m+1;m=d[m]|0}else{m=Jt(b)|0}if((m|32|0)!=120){if((c[o>>2]|0)==0){z=48;break}c[n>>2]=(c[n>>2]|0)+ -1;z=48;break}k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0;y=0}else{A=Jt(b)|0;y=0}while(1){if((A|0)==46){q=70;break}else if((A|0)!=48){k=0;m=0;s=0;t=0;x=0;z=0;I=1.0;w=0;r=0.0;break}k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0;y=1;continue}else{A=Jt(b)|0;y=1;continue}}b:do{if((q|0)==70){k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0}else{A=Jt(b)|0}if((A|0)==48){s=-1;t=-1;while(1){k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0}else{A=Jt(b)|0}if((A|0)!=48){k=0;m=0;y=1;x=1;z=0;I=1.0;w=0;r=0.0;break b}J=Ut(s|0,t|0,-1,-1)|0;s=J;t=F}}else{k=0;m=0;s=0;t=0;x=1;z=0;I=1.0;w=0;r=0.0}}}while(0);c:while(1){B=A+ -48|0;do{if(!(B>>>0<10)){C=A|32;D=(A|0)==46;if(!((C+ -97|0)>>>0<6|D)){break c}if(D){if((x|0)==0){s=m;t=k;x=1;break}else{A=46;break c}}else{B=(A|0)>57?C+ -87|0:B;q=84;break}}else{q=84}}while(0);if((q|0)==84){q=0;do{if(!((k|0)<0|(k|0)==0&m>>>0<8)){if((k|0)<0|(k|0)==0&m>>>0<14){L=I*.0625;K=L;r=r+L*+(B|0);break}if((B|0)!=0&(z|0)==0){z=1;K=I;r=r+I*.5}else{K=I}}else{K=I;w=B+(w<<4)|0}}while(0);m=Ut(m|0,k|0,1,0)|0;k=F;y=1;I=K}A=c[n>>2]|0;if(A>>>0<(c[o>>2]|0)>>>0){c[n>>2]=A+1;A=d[A]|0;continue}else{A=Jt(b)|0;continue}}if((y|0)==0){e=(c[o>>2]|0)==0;if(!e){c[n>>2]=(c[n>>2]|0)+ -1}if(!p){if(!e?(l=c[n>>2]|0,c[n>>2]=l+ -1,(x|0)!=0):0){c[n>>2]=l+ -2}}else{It(b,0)}L=+(j|0)*0.0;i=g;return+L}q=(x|0)==0;l=q?m:s;q=q?k:t;if((k|0)<0|(k|0)==0&m>>>0<8){do{w=w<<4;m=Ut(m|0,k|0,1,0)|0;k=F}while((k|0)<0|(k|0)==0&m>>>0<8)}do{if((A|32|0)==112){m=Ht(b,f)|0;k=F;if((m|0)==0&(k|0)==-2147483648){if(p){It(b,0);L=0.0;i=g;return+L}else{if((c[o>>2]|0)==0){m=0;k=0;break}c[n>>2]=(c[n>>2]|0)+ -1;m=0;k=0;break}}}else{if((c[o>>2]|0)==0){m=0;k=0}else{c[n>>2]=(c[n>>2]|0)+ -1;m=0;k=0}}}while(0);l=Zt(l|0,q|0,2)|0;l=Ut(l|0,F|0,-32,-1)|0;k=Ut(l|0,F|0,m|0,k|0)|0;l=F;if((w|0)==0){L=+(j|0)*0.0;i=g;return+L}if((l|0)>0|(l|0)==0&k>>>0>(0-h|0)>>>0){c[(bc()|0)>>2]=34;L=+(j|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+L}J=h+ -106|0;H=((J|0)<0)<<31>>31;if((l|0)<(H|0)|(l|0)==(H|0)&k>>>0<J>>>0){c[(bc()|0)>>2]=34;L=+(j|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+L}if((w|0)>-1){do{w=w<<1;if(!(r>=.5)){I=r}else{I=r+-1.0;w=w|1}r=r+I;k=Ut(k|0,l|0,-1,-1)|0;l=F}while((w|0)>-1)}h=_t(32,0,h|0,((h|0)<0)<<31>>31|0)|0;h=Ut(k|0,l|0,h|0,F|0)|0;J=F;if(0>(J|0)|0==(J|0)&e>>>0>h>>>0){e=(h|0)<0?0:h}if((e|0)<53){I=+(j|0);K=+cc(+(+Kt(1.0,84-e|0)),+I);if((e|0)<32&r!=0.0){J=w&1;w=(J^1)+w|0;r=(J|0)==0?0.0:r}}else{I=+(j|0);K=0.0}r=I*r+(K+I*+(w>>>0))-K;if(!(r!=0.0)){c[(bc()|0)>>2]=34}L=+Lt(r,k);i=g;return+L}}while(0);m=h+e|0;l=0-m|0;A=0;while(1){if((z|0)==46){q=139;break}else if((z|0)!=48){D=0;B=0;y=0;break}s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0;A=1;continue}else{z=Jt(b)|0;A=1;continue}}d:do{if((q|0)==139){s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0}else{z=Jt(b)|0}if((z|0)==48){D=-1;B=-1;while(1){s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0}else{z=Jt(b)|0}if((z|0)!=48){A=1;y=1;break d}J=Ut(D|0,B|0,-1,-1)|0;D=J;B=F}}else{D=0;B=0;y=1}}}while(0);c[k>>2]=0;G=z+ -48|0;H=(z|0)==46;e:do{if(G>>>0<10|H){s=k+496|0;E=0;C=0;x=0;w=0;t=0;while(1){do{if(H){if((y|0)==0){D=E;B=C;y=1}else{break e}}else{H=Ut(E|0,C|0,1,0)|0;C=F;J=(z|0)!=48;if((w|0)>=125){if(!J){E=H;break}c[s>>2]=c[s>>2]|1;E=H;break}A=k+(w<<2)|0;if((x|0)!=0){G=z+ -48+((c[A>>2]|0)*10|0)|0}c[A>>2]=G;x=x+1|0;z=(x|0)==9;E=H;A=1;x=z?0:x;w=(z&1)+w|0;t=J?H:t}}while(0);z=c[n>>2]|0;if(z>>>0<(c[o>>2]|0)>>>0){c[n>>2]=z+1;z=d[z]|0}else{z=Jt(b)|0}G=z+ -48|0;H=(z|0)==46;if(!(G>>>0<10|H)){q=162;break}}}else{E=0;C=0;x=0;w=0;t=0;q=162}}while(0);if((q|0)==162){q=(y|0)==0;D=q?E:D;B=q?C:B}q=(A|0)!=0;if(q?(z|32|0)==101:0){s=Ht(b,f)|0;f=F;do{if((s|0)==0&(f|0)==-2147483648){if(p){It(b,0);L=0.0;i=g;return+L}else{if((c[o>>2]|0)==0){s=0;f=0;break}c[n>>2]=(c[n>>2]|0)+ -1;s=0;f=0;break}}}while(0);D=Ut(s|0,f|0,D|0,B|0)|0;B=F}else{if((z|0)>-1?(c[o>>2]|0)!=0:0){c[n>>2]=(c[n>>2]|0)+ -1}}if(!q){c[(bc()|0)>>2]=22;It(b,0);L=0.0;i=g;return+L}b=c[k>>2]|0;if((b|0)==0){L=+(j|0)*0.0;i=g;return+L}do{if((D|0)==(E|0)&(B|0)==(C|0)&((C|0)<0|(C|0)==0&E>>>0<10)){if(!(e>>>0>30)?(b>>>e|0)!=0:0){break}L=+(j|0)*+(b>>>0);i=g;return+L}}while(0);J=(h|0)/-2|0;H=((J|0)<0)<<31>>31;if((B|0)>(H|0)|(B|0)==(H|0)&D>>>0>J>>>0){c[(bc()|0)>>2]=34;L=+(j|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+L}J=h+ -106|0;H=((J|0)<0)<<31>>31;if((B|0)<(H|0)|(B|0)==(H|0)&D>>>0<J>>>0){c[(bc()|0)>>2]=34;L=+(j|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+L}if((x|0)!=0){if((x|0)<9){b=k+(w<<2)|0;n=c[b>>2]|0;do{n=n*10|0;x=x+1|0}while((x|0)!=9);c[b>>2]=n}w=w+1|0}do{if((t|0)<9?(t|0)<=(D|0)&(D|0)<18:0){if((D|0)==9){L=+(j|0)*+((c[k>>2]|0)>>>0);i=g;return+L}if((D|0)<9){L=+(j|0)*+((c[k>>2]|0)>>>0)/+(c[33696+(8-D<<2)>>2]|0);i=g;return+L}b=e+27+(ba(D,-3)|0)|0;n=c[k>>2]|0;if((b|0)<=30?(n>>>b|0)!=0:0){break}L=+(j|0)*+(n>>>0)*+(c[33696+(D+ -10<<2)>>2]|0);i=g;return+L}}while(0);b=(D|0)%9|0;if((b|0)==0){n=0;o=0;b=D}else{b=(D|0)>-1?b:b+9|0;f=c[33696+(8-b<<2)>>2]|0;if((w|0)!=0){o=1e9/(f|0)|0;n=0;s=0;q=0;while(1){H=k+(q<<2)|0;p=c[H>>2]|0;J=((p>>>0)/(f>>>0)|0)+s|0;c[H>>2]=J;s=ba((p>>>0)%(f>>>0)|0,o)|0;p=q+1|0;if((q|0)==(n|0)&(J|0)==0){n=p&127;D=D+ -9|0}if((p|0)==(w|0)){break}else{q=p}}if((s|0)!=0){c[k+(w<<2)>>2]=s;w=w+1|0}}else{n=0;w=0}o=0;b=9-b+D|0}f:while(1){f=k+(n<<2)|0;if((b|0)<18){do{q=0;f=w+127|0;while(1){f=f&127;p=k+(f<<2)|0;s=Zt(c[p>>2]|0,0,29)|0;s=Ut(s|0,F|0,q|0,0)|0;q=F;if(q>>>0>0|(q|0)==0&s>>>0>1e9){J=gu(s|0,q|0,1e9,0)|0;s=hu(s|0,q|0,1e9,0)|0;q=J}else{q=0}c[p>>2]=s;p=(f|0)==(n|0);if(!((f|0)!=(w+127&127|0)|p)){w=(s|0)==0?f:w}if(p){break}else{f=f+ -1|0}}o=o+ -29|0}while((q|0)==0)}else{if((b|0)!=18){break}do{if(!((c[f>>2]|0)>>>0<9007199)){b=18;break f}q=0;p=w+127|0;while(1){p=p&127;s=k+(p<<2)|0;t=Zt(c[s>>2]|0,0,29)|0;t=Ut(t|0,F|0,q|0,0)|0;q=F;if(q>>>0>0|(q|0)==0&t>>>0>1e9){J=gu(t|0,q|0,1e9,0)|0;t=hu(t|0,q|0,1e9,0)|0;q=J}else{q=0}c[s>>2]=t;s=(p|0)==(n|0);if(!((p|0)!=(w+127&127|0)|s)){w=(t|0)==0?p:w}if(s){break}else{p=p+ -1|0}}o=o+ -29|0}while((q|0)==0)}n=n+127&127;if((n|0)==(w|0)){J=w+127&127;w=k+((w+126&127)<<2)|0;c[w>>2]=c[w>>2]|c[k+(J<<2)>>2];w=J}c[k+(n<<2)>>2]=q;b=b+9|0}g:while(1){f=w+1&127;p=k+((w+127&127)<<2)|0;while(1){s=(b|0)==18;q=(b|0)>27?9:1;while(1){t=0;while(1){x=t+n&127;if((x|0)==(w|0)){t=2;break}z=c[k+(x<<2)>>2]|0;x=c[33688+(t<<2)>>2]|0;if(z>>>0<x>>>0){t=2;break}y=t+1|0;if(z>>>0>x>>>0){break}if((y|0)<2){t=y}else{t=y;break}}if((t|0)==2&s){break g}o=q+o|0;if((n|0)==(w|0)){n=w}else{break}}x=(1<<q)+ -1|0;y=1e9>>>q;s=n;t=0;do{H=k+(n<<2)|0;J=c[H>>2]|0;z=(J>>>q)+t|0;c[H>>2]=z;t=ba(J&x,y)|0;z=(n|0)==(s|0)&(z|0)==0;n=n+1&127;b=z?b+ -9|0:b;s=z?n:s}while((n|0)!=(w|0));if((t|0)==0){n=s;continue}if((f|0)!=(s|0)){break}c[p>>2]=c[p>>2]|1;n=s}c[k+(w<<2)>>2]=t;n=s;w=f}b=n&127;if((b|0)==(w|0)){c[k+(f+ -1<<2)>>2]=0;w=f}I=+((c[k+(b<<2)>>2]|0)>>>0);b=n+1&127;if((b|0)==(w|0)){w=w+1&127;c[k+(w+ -1<<2)>>2]=0}r=+(j|0);K=r*(I*1.0e9+ +((c[k+(b<<2)>>2]|0)>>>0));j=o+53|0;h=j-h|0;if((h|0)<(e|0)){e=(h|0)<0?0:h;b=1}else{b=0}if((e|0)<53){N=+cc(+(+Kt(1.0,105-e|0)),+K);M=+ob(+K,+(+Kt(1.0,53-e|0)));I=N;L=M;K=N+(K-M)}else{I=0.0;L=0.0}f=n+2&127;if((f|0)!=(w|0)){k=c[k+(f<<2)>>2]|0;do{if(!(k>>>0<5e8)){if(k>>>0>5e8){L=r*.75+L;break}if((n+3&127|0)==(w|0)){L=r*.5+L;break}else{L=r*.75+L;break}}else{if((k|0)==0?(n+3&127|0)==(w|0):0){break}L=r*.25+L}}while(0);if((53-e|0)>1?!(+ob(+L,1.0)!=0.0):0){L=L+1.0}}r=K+L-I;do{if((j&2147483647|0)>(-2-m|0)){if(+Q(+r)>=9007199254740992.0){b=(b|0)!=0&(e|0)==(h|0)?0:b;o=o+1|0;r=r*.5}if((o+50|0)<=(l|0)?!((b|0)!=0&L!=0.0):0){break}c[(bc()|0)>>2]=34}}while(0);N=+Lt(r,o);i=g;return+N}else{if((c[o>>2]|0)!=0){c[n>>2]=(c[n>>2]|0)+ -1}c[(bc()|0)>>2]=22;It(b,0);N=0.0;i=g;return+N}}}while(0);if((q|0)==23){e=(c[o>>2]|0)==0;if(!e){c[n>>2]=(c[n>>2]|0)+ -1}if(!(m>>>0<4|(f|0)==0|e)){do{c[n>>2]=(c[n>>2]|0)+ -1;m=m+ -1|0}while(m>>>0>3)}}N=+(j|0)*v;i=g;return+N}function Ht(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=a+4|0;h=c[f>>2]|0;g=a+100|0;if(h>>>0<(c[g>>2]|0)>>>0){c[f>>2]=h+1;k=d[h]|0}else{k=Jt(a)|0}if((k|0)==43|(k|0)==45){h=(k|0)==45|0;j=c[f>>2]|0;if(j>>>0<(c[g>>2]|0)>>>0){c[f>>2]=j+1;k=d[j]|0}else{k=Jt(a)|0}if(!((k+ -48|0)>>>0<10|(b|0)==0)?(c[g>>2]|0)!=0:0){c[f>>2]=(c[f>>2]|0)+ -1}}else{h=0}if((k+ -48|0)>>>0>9){if((c[g>>2]|0)==0){j=-2147483648;k=0;F=j;i=e;return k|0}c[f>>2]=(c[f>>2]|0)+ -1;j=-2147483648;k=0;F=j;i=e;return k|0}else{b=0}while(1){b=k+ -48+b|0;j=c[f>>2]|0;if(j>>>0<(c[g>>2]|0)>>>0){c[f>>2]=j+1;k=d[j]|0}else{k=Jt(a)|0}if(!((k+ -48|0)>>>0<10&(b|0)<214748364)){break}b=b*10|0}j=((b|0)<0)<<31>>31;if((k+ -48|0)>>>0<10){do{j=fu(b|0,j|0,10,0)|0;b=F;k=Ut(k|0,((k|0)<0)<<31>>31|0,-48,-1)|0;b=Ut(k|0,F|0,j|0,b|0)|0;j=F;k=c[f>>2]|0;if(k>>>0<(c[g>>2]|0)>>>0){c[f>>2]=k+1;k=d[k]|0}else{k=Jt(a)|0}}while((k+ -48|0)>>>0<10&((j|0)<21474836|(j|0)==21474836&b>>>0<2061584302))}if((k+ -48|0)>>>0<10){do{k=c[f>>2]|0;if(k>>>0<(c[g>>2]|0)>>>0){c[f>>2]=k+1;k=d[k]|0}else{k=Jt(a)|0}}while((k+ -48|0)>>>0<10)}if((c[g>>2]|0)!=0){c[f>>2]=(c[f>>2]|0)+ -1}a=(h|0)!=0;f=_t(0,0,b|0,j|0)|0;g=a?F:j;k=a?f:b;F=g;i=e;return k|0}function It(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a+104>>2]=b;f=c[a+8>>2]|0;e=c[a+4>>2]|0;g=f-e|0;c[a+108>>2]=g;if((b|0)!=0&(g|0)>(b|0)){c[a+100>>2]=e+b;i=d;return}else{c[a+100>>2]=f;i=d;return}}function Jt(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;f=i;k=b+104|0;j=c[k>>2]|0;if(!((j|0)!=0?(c[b+108>>2]|0)>=(j|0):0)){l=3}if((l|0)==3?(e=Nt(b)|0,(e|0)>=0):0){k=c[k>>2]|0;j=c[b+8>>2]|0;if((k|0)!=0?(g=c[b+4>>2]|0,h=k-(c[b+108>>2]|0)+ -1|0,(j-g|0)>(h|0)):0){c[b+100>>2]=g+h}else{c[b+100>>2]=j}g=c[b+4>>2]|0;if((j|0)!=0){l=b+108|0;c[l>>2]=j+1-g+(c[l>>2]|0)}b=g+ -1|0;if((d[b]|0|0)==(e|0)){l=e;i=f;return l|0}a[b]=e;l=e;i=f;return l|0}c[b+100>>2]=0;l=-1;i=f;return l|0}function Kt(a,b){a=+a;b=b|0;var d=0,e=0;d=i;if((b|0)>1023){a=a*8.98846567431158e+307;e=b+ -1023|0;if((e|0)>1023){b=b+ -2046|0;b=(b|0)>1023?1023:b;a=a*8.98846567431158e+307}else{b=e}}else{if((b|0)<-1022){a=a*2.2250738585072014e-308;e=b+1022|0;if((e|0)<-1022){b=b+2044|0;b=(b|0)<-1022?-1022:b;a=a*2.2250738585072014e-308}else{b=e}}}b=Zt(b+1023|0,0,52)|0;e=F;c[k>>2]=b;c[k+4>>2]=e;a=a*+h[k>>3];i=d;return+a}function Lt(a,b){a=+a;b=b|0;var c=0;c=i;a=+Kt(a,b);i=c;return+a}function Mt(b){b=b|0;var d=0,e=0,f=0;e=i;f=b+74|0;d=a[f]|0;a[f]=d+255|d;f=b+20|0;d=b+44|0;if((c[f>>2]|0)>>>0>(c[d>>2]|0)>>>0){jc[c[b+36>>2]&63](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[f>>2]=0;f=c[b>>2]|0;if((f&20|0)==0){f=c[d>>2]|0;c[b+8>>2]=f;c[b+4>>2]=f;f=0;i=e;return f|0}if((f&4|0)==0){f=-1;i=e;return f|0}c[b>>2]=f|32;f=-1;i=e;return f|0}function Nt(a){a=a|0;var b=0,e=0;b=i;i=i+16|0;e=b;if((c[a+8>>2]|0)==0?(Mt(a)|0)!=0:0){a=-1}else{if((jc[c[a+32>>2]&63](a,e,1)|0)==1){a=d[e]|0}else{a=-1}}i=b;return a|0}function Ot(a,b){a=a|0;b=b|0;var d=0,e=0,f=0.0,g=0,h=0;d=i;i=i+112|0;e=d;h=e+0|0;g=h+112|0;do{c[h>>2]=0;h=h+4|0}while((h|0)<(g|0));g=e+4|0;c[g>>2]=a;h=e+8|0;c[h>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;It(e,0);f=+Gt(e,1,1);e=(c[g>>2]|0)-(c[h>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){i=d;return+f}if((e|0)!=0){a=a+e|0}c[b>>2]=a;i=d;return+f}function Pt(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=i;a:do{if((d|0)==0){b=0}else{while(1){g=a[b]|0;f=a[c]|0;if(!(g<<24>>24==f<<24>>24)){break}d=d+ -1|0;if((d|0)==0){b=0;break a}else{b=b+1|0;c=c+1|0}}b=(g&255)-(f&255)|0}}while(0);i=e;return b|0}function Qt(){c[8414]=p}function Rt(a){a=a|0;var b=0;b=(ba(c[a>>2]|0,31010991)|0)+1735287159&2147483647;c[a>>2]=b;return b|0}function St(){return Rt(o)|0}function Tt(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function Ut(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return(F=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function Vt(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=0;return b>>>c-32|0}function Wt(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return Ca(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function Xt(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{Wt(b,c,d)|0}return b|0}function Yt(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;i=b&3;h=d|d<<8|d<<16|d<<24;g=f&~3;if(i){i=b+4-i|0;while((b|0)<(i|0)){a[b]=d;b=b+1|0}}while((b|0)<(g|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function Zt(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}F=a<<c-32;return 0}function _t(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=b-d-(c>>>0>a>>>0|0)>>>0;return(F=b,a-c>>>0|0)|0}function $t(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=(b|0)<0?-1:0;return b>>c-32|0}function au(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function bu(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function cu(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;d=b&65535;c=ba(d,f)|0;e=a>>>16;d=(c>>>16)+(ba(d,e)|0)|0;b=b>>>16;a=ba(b,f)|0;return(F=(d>>>16)+(ba(b,e)|0)+(((d&65535)+a|0)>>>16)|0,d+a<<16|c&65535|0)|0}function du(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;a=_t(e^a,f^b,e,f)|0;b=F;e=g^e;f=h^f;g=_t((iu(a,b,_t(g^c,h^d,g,h)|0,F,0)|0)^e,F^f,e,f)|0;return g|0}function eu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;i=i+8|0;f=g|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;a=_t(h^a,j^b,h,j)|0;b=F;iu(a,b,_t(k^d,l^e,k,l)|0,F,f)|0;k=_t(c[f>>2]^h,c[f+4>>2]^j,h,j)|0;j=F;i=g;return(F=j,k)|0}function fu(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;a=cu(e,f)|0;c=F;return(F=(ba(b,f)|0)+(ba(d,e)|0)+c|c&0,a|0|0)|0}function gu(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;a=iu(a,b,c,d,0)|0;return a|0}function hu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;g=i;i=i+8|0;f=g|0;iu(a,b,d,e,f)|0;i=g;return(F=c[f+4>>2]|0,c[f>>2]|0)|0}function iu(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=a;j=b;i=j;k=d;g=e;l=g;if((i|0)==0){d=(f|0)!=0;if((l|0)==0){if(d){c[f>>2]=(h>>>0)%(k>>>0);c[f+4>>2]=0}l=0;m=(h>>>0)/(k>>>0)>>>0;return(F=l,m)|0}else{if(!d){l=0;m=0;return(F=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;l=0;m=0;return(F=l,m)|0}}m=(l|0)==0;do{if((k|0)!=0){if(!m){k=(au(l|0)|0)-(au(i|0)|0)|0;if(k>>>0<=31){l=k+1|0;m=31-k|0;b=k-31>>31;j=l;a=h>>>(l>>>0)&b|i<<m;b=i>>>(l>>>0)&b;l=0;i=h<<m;break}if((f|0)==0){l=0;m=0;return(F=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;l=0;m=0;return(F=l,m)|0}l=k-1|0;if((l&k|0)!=0){m=(au(k|0)|0)+33-(au(i|0)|0)|0;p=64-m|0;k=32-m|0;n=k>>31;o=m-32|0;b=o>>31;j=m;a=k-1>>31&i>>>(o>>>0)|(i<<k|h>>>(m>>>0))&b;b=b&i>>>(m>>>0);l=h<<p&n;i=(i<<p|h>>>(o>>>0))&n|h<<k&m-33>>31;break}if((f|0)!=0){c[f>>2]=l&h;c[f+4>>2]=0}if((k|0)==1){o=j|b&0;p=a|0|0;return(F=o,p)|0}else{p=bu(k|0)|0;o=i>>>(p>>>0)|0;p=i<<32-p|h>>>(p>>>0)|0;return(F=o,p)|0}}else{if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(k>>>0);c[f+4>>2]=0}o=0;p=(i>>>0)/(k>>>0)>>>0;return(F=o,p)|0}if((h|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}o=0;p=(i>>>0)/(l>>>0)>>>0;return(F=o,p)|0}k=l-1|0;if((k&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=k&i|b&0}o=0;p=i>>>((bu(l|0)|0)>>>0);return(F=o,p)|0}k=(au(l|0)|0)-(au(i|0)|0)|0;if(k>>>0<=30){b=k+1|0;p=31-k|0;j=b;a=i<<p|h>>>(b>>>0);b=i>>>(b>>>0);l=0;i=h<<p;break}if((f|0)==0){o=0;p=0;return(F=o,p)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;o=0;p=0;return(F=o,p)|0}}while(0);if((j|0)==0){m=a;d=0;a=0}else{d=d|0|0;g=g|e&0;e=Ut(d,g,-1,-1)|0;h=F;k=b;m=a;a=0;while(1){b=l>>>31|i<<1;l=a|l<<1;i=m<<1|i>>>31|0;k=m>>>31|k<<1|0;_t(e,h,i,k)|0;m=F;p=m>>31|((m|0)<0?-1:0)<<1;a=p&1;m=_t(i,k,p&d,(((m|0)<0?-1:0)>>31|((m|0)<0?-1:0)<<1)&g)|0;k=F;j=j-1|0;if((j|0)==0){break}else{i=b}}i=b;b=k;d=0}g=0;if((f|0)!=0){c[f>>2]=m;c[f+4>>2]=b}o=(l|0)>>>31|(i|g)<<1|(g<<1|l>>>31)&0|d;p=(l<<1|0>>>31)&-2|a;return(F=o,p)|0}function ju(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return jc[a&63](b|0,c|0,d|0)|0}function ku(a,b,c){a=a|0;b=b|0;c=c|0;return ha(0,a|0,b|0,c|0)|0}function lu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(1,a|0,b|0,c|0)|0}function mu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(2,a|0,b|0,c|0)|0}function nu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(3,a|0,b|0,c|0)|0}function ou(a,b,c){a=a|0;b=b|0;c=c|0;return ha(4,a|0,b|0,c|0)|0}function pu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(5,a|0,b|0,c|0)|0}function qu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(6,a|0,b|0,c|0)|0}function ru(a,b,c){a=a|0;b=b|0;c=c|0;return ha(7,a|0,b|0,c|0)|0}function su(a,b,c){a=a|0;b=b|0;c=c|0;return ha(8,a|0,b|0,c|0)|0}function tu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(9,a|0,b|0,c|0)|0}function uu(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;kc[a&31](b|0,c|0,d|0,e|0,f|0)}function vu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(0,a|0,b|0,c|0,d|0,e|0)}function wu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(1,a|0,b|0,c|0,d|0,e|0)}function xu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(2,a|0,b|0,c|0,d|0,e|0)}function yu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(3,a|0,b|0,c|0,d|0,e|0)}function zu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(4,a|0,b|0,c|0,d|0,e|0)}function Au(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(5,a|0,b|0,c|0,d|0,e|0)}function Bu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(6,a|0,b|0,c|0,d|0,e|0)}function Cu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(7,a|0,b|0,c|0,d|0,e|0)}function Du(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(8,a|0,b|0,c|0,d|0,e|0)}function Eu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(9,a|0,b|0,c|0,d|0,e|0)}function Fu(a,b){a=a|0;b=b|0;lc[a&127](b|0)}function Gu(a){a=a|0;ha(0,a|0)}function Hu(a){a=a|0;ha(1,a|0)}function Iu(a){a=a|0;ha(2,a|0)}function Ju(a){a=a|0;ha(3,a|0)}function Ku(a){a=a|0;ha(4,a|0)}function Lu(a){a=a|0;ha(5,a|0)}function Mu(a){a=a|0;ha(6,a|0)}function Nu(a){a=a|0;ha(7,a|0)}function Ou(a){a=a|0;ha(8,a|0)}function Pu(a){a=a|0;ha(9,a|0)}function Qu(a,b,c){a=a|0;b=b|0;c=c|0;mc[a&63](b|0,c|0)}function Ru(a,b){a=a|0;b=b|0;ha(0,a|0,b|0)}function Su(a,b){a=a|0;b=b|0;ha(1,a|0,b|0)}function Tu(a,b){a=a|0;b=b|0;ha(2,a|0,b|0)}function Uu(a,b){a=a|0;b=b|0;ha(3,a|0,b|0)}function Vu(a,b){a=a|0;b=b|0;ha(4,a|0,b|0)}function Wu(a,b){a=a|0;b=b|0;ha(5,a|0,b|0)}function Xu(a,b){a=a|0;b=b|0;ha(6,a|0,b|0)}function Yu(a,b){a=a|0;b=b|0;ha(7,a|0,b|0)}function Zu(a,b){a=a|0;b=b|0;ha(8,a|0,b|0)}function _u(a,b){a=a|0;b=b|0;ha(9,a|0,b|0)}function $u(a,b){a=a|0;b=b|0;return nc[a&1023](b|0)|0}function av(a){a=a|0;return ha(0,a|0)|0}function bv(a){a=a|0;return ha(1,a|0)|0}function cv(a){a=a|0;return ha(2,a|0)|0}function dv(a){a=a|0;return ha(3,a|0)|0}function ev(a){a=a|0;return ha(4,a|0)|0}function fv(a){a=a|0;return ha(5,a|0)|0}function gv(a){a=a|0;return ha(6,a|0)|0}function hv(a){a=a|0;return ha(7,a|0)|0}function iv(a){a=a|0;return ha(8,a|0)|0}function jv(a){a=a|0;return ha(9,a|0)|0}function kv(a){a=a|0;oc[a&31]()}function lv(){ha(0)}function mv(){ha(1)}function nv(){ha(2)}function ov(){ha(3)}function pv(){ha(4)}function qv(){ha(5)}function rv(){ha(6)}function sv(){ha(7)}function tv(){ha(8)}function uv(){ha(9)}function vv(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return pc[a&31](b|0,c|0,d|0,e|0)|0}function wv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(0,a|0,b|0,c|0,d|0)|0}function xv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(1,a|0,b|0,c|0,d|0)|0}function yv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(2,a|0,b|0,c|0,d|0)|0}function zv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(3,a|0,b|0,c|0,d|0)|0}function Av(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(4,a|0,b|0,c|0,d|0)|0}function Bv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(5,a|0,b|0,c|0,d|0)|0}function Cv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(6,a|0,b|0,c|0,d|0)|0}function Dv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(7,a|0,b|0,c|0,d|0)|0}function Ev(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(8,a|0,b|0,c|0,d|0)|0}function Fv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(9,a|0,b|0,c|0,d|0)|0}function Gv(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;qc[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function Hv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(0,a|0,b|0,c|0,d|0,e|0,f|0)}function Iv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(1,a|0,b|0,c|0,d|0,e|0,f|0)}function Jv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(2,a|0,b|0,c|0,d|0,e|0,f|0)}function Kv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(3,a|0,b|0,c|0,d|0,e|0,f|0)}function Lv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(4,a|0,b|0,c|0,d|0,e|0,f|0)}function Mv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(5,a|0,b|0,c|0,d|0,e|0,f|0)}function Nv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(6,a|0,b|0,c|0,d|0,e|0,f|0)}function Ov(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(7,a|0,b|0,c|0,d|0,e|0,f|0)}function Pv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(8,a|0,b|0,c|0,d|0,e|0,f|0)}function Qv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(9,a|0,b|0,c|0,d|0,e|0,f|0)}function Rv(a,b,c){a=a|0;b=b|0;c=c|0;return rc[a&63](b|0,c|0)|0}function Sv(a,b){a=a|0;b=b|0;return ha(0,a|0,b|0)|0}function Tv(a,b){a=a|0;b=b|0;return ha(1,a|0,b|0)|0}function Uv(a,b){a=a|0;b=b|0;return ha(2,a|0,b|0)|0}function Vv(a,b){a=a|0;b=b|0;return ha(3,a|0,b|0)|0}function Wv(a,b){a=a|0;b=b|0;return ha(4,a|0,b|0)|0}function Xv(a,b){a=a|0;b=b|0;return ha(5,a|0,b|0)|0}function Yv(a,b){a=a|0;b=b|0;return ha(6,a|0,b|0)|0}function Zv(a,b){a=a|0;b=b|0;return ha(7,a|0,b|0)|0}function _v(a,b){a=a|0;b=b|0;return ha(8,a|0,b|0)|0}function $v(a,b){a=a|0;b=b|0;return ha(9,a|0,b|0)|0}function aw(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;sc[a&31](b|0,c|0,d|0,e|0)}function bw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(0,a|0,b|0,c|0,d|0)}function cw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(1,a|0,b|0,c|0,d|0)}function dw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(2,a|0,b|0,c|0,d|0)}function ew(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(3,a|0,b|0,c|0,d|0)}function fw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(4,a|0,b|0,c|0,d|0)}function gw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(5,a|0,b|0,c|0,d|0)}function hw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(6,a|0,b|0,c|0,d|0)}function iw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(7,a|0,b|0,c|0,d|0)}function jw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(8,a|0,b|0,c|0,d|0)}function kw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(9,a|0,b|0,c|0,d|0)}function lw(a,b,c){a=a|0;b=b|0;c=c|0;ca(0);return 0}function mw(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ca(1)}function nw(a){a=a|0;ca(2)}function ow(a,b){a=a|0;b=b|0;ca(3)}function pw(a){a=a|0;ca(4);return 0}function qw(){ca(5)}function rw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ca(6);return 0}function sw(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ca(7)}function tw(a,b){a=a|0;b=b|0;ca(8);return 0}function uw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ca(9)}




// EMSCRIPTEN_END_FUNCS
var jc=[lw,lw,ku,lw,lu,lw,mu,lw,nu,lw,ou,lw,pu,lw,qu,lw,ru,lw,su,lw,tu,lw,ad,bd,hg,eg,zg,xd,zd,Fd,Gd,Jd,Kd,Eg,Fg,Sd,Qg,Ug,Vg,jr,mr,ot,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw];var kc=[mw,mw,vu,mw,wu,mw,xu,mw,yu,mw,zu,mw,Au,mw,Bu,mw,Cu,mw,Du,mw,Eu,mw,tt,st,mw,mw,mw,mw,mw,mw,mw,mw];var lc=[nw,nw,Gu,nw,Hu,nw,Iu,nw,Ju,nw,Ku,nw,Lu,nw,Mu,nw,Nu,nw,Ou,nw,Pu,nw,uf,vf,ig,jg,ng,og,sg,tg,wg,xg,Cd,Bd,Kf,Lf,Nf,Of,Bg,Cg,Xf,Yf,Hg,Ig,Ng,Og,Rg,Sg,_d,Ne,Qe,$e,df,ef,ff,gf,hf,kf,tf,Hf,If,qd,sd,ud,ws,Js,Qs,jt,mt,kt,lt,nt,Et,Dt,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw,nw];var mc=[ow,ow,Ru,ow,Su,ow,Tu,ow,Uu,ow,Vu,ow,Wu,ow,Xu,ow,Yu,ow,Zu,ow,_u,ow,wf,Bf,Cf,kg,cg,lg,pg,qg,rg,ug,yg,Jf,Mf,Pf,Uf,Dg,Zf,Jg,Tg,Er,Fr,Gr,Hr,Ir,Jr,Kr,Lr,Mr,Nr,Or,Pr,Qr,ow,ow,ow,ow,ow,ow,ow,ow,ow,ow];var nc=[pw,pw,av,pw,bv,pw,cv,pw,dv,pw,ev,pw,fv,pw,gv,pw,hv,pw,iv,pw,jv,pw,xf,yf,Df,Ef,Gf,_f,$f,dg,mg,Wf,vg,jd,Ag,Qf,Rf,Vf,Kg,Ft,Sr,Tr,Ur,Vr,Wr,Xr,Yr,Zr,_r,$r,as,bs,cs,ds,es,fs,gs,hs,is,js,ks,zr,Ar,Br,Cr,Dr,xr,yr,Ze,nr,or,pr,qr,rr,sr,tr,ur,vr,wr,gr,Uq,Vq,Wq,Xq,Yq,Zq,_q,$q,ar,br,cr,dr,er,fr,qj,rj,sj,tj,uj,vj,wj,xj,yj,zj,Aj,Bj,Cj,Dj,Ej,Fj,Gj,Hj,Ij,Jj,Kj,Lj,Mj,Nj,Oj,Pj,Qj,Rj,Sj,Tj,Uj,Vj,Wj,Xj,Yj,Zj,_j,$j,ak,bk,ck,dk,ek,fk,gk,hk,ik,jk,kk,lk,mk,nk,ok,pk,qk,rk,sk,tk,uk,vk,wk,xk,yk,zk,Ak,Bk,Ck,Dk,Ek,Fk,Gk,Hk,Ik,Jk,Kk,Lk,Mk,Nk,Ok,Pk,Qk,Rk,Sk,Tk,Uk,Vk,Wk,Xk,Yk,Zk,_k,$k,al,bl,cl,dl,el,fl,gl,hl,il,jl,kl,ll,ml,nl,ol,pl,ql,rl,sl,tl,ul,vl,wl,xl,yl,zl,Al,Bl,Cl,Dl,El,Fl,Gl,Hl,Il,Jl,Kl,Ll,Ml,Nl,Ol,Pl,Ql,Rl,Sl,Tl,Ul,Vl,Wl,Xl,Yl,Zl,_l,$l,am,bm,cm,dm,em,fm,gm,hm,im,jm,km,lm,mm,nm,om,pm,qm,rm,sm,tm,um,vm,wm,xm,ym,zm,Am,Bm,Cm,Dm,Em,Fm,Gm,Hm,Im,Jm,Km,Lm,Mm,Nm,Om,Pm,Qm,Rm,Sm,Tm,Um,Vm,Wm,Xm,Ym,Zm,_m,$m,an,bn,cn,dn,en,fn,gn,hn,jn,kn,ln,mn,nn,on,pn,qn,rn,sn,tn,un,vn,wn,xn,yn,zn,An,Bn,Cn,Dn,En,Fn,Gn,Hn,In,Jn,Kn,Ln,Mn,Nn,On,Pn,Qn,Rn,Sn,Tn,Un,Vn,Wn,Xn,Yn,Zn,_n,$n,ao,bo,co,eo,fo,go,ho,io,jo,ko,lo,mo,no,oo,po,qo,ro,so,to,uo,vo,wo,xo,yo,zo,Ao,Bo,Co,Do,Eo,Fo,Go,Ho,Io,Jo,Ko,Lo,Mo,No,Oo,Po,Qo,Ro,So,To,Uo,Vo,Wo,Xo,Yo,Zo,_o,$o,ap,bp,cp,dp,ep,fp,gp,hp,ip,jp,kp,lp,mp,np,op,pp,qp,rp,sp,tp,up,vp,wp,xp,yp,zp,Ap,Bp,Cp,Dp,Ep,Fp,Gp,Hp,Ip,Jp,Kp,Lp,Mp,Np,Op,Pp,Qp,Rp,Sp,Tp,Up,Vp,Wp,Xp,Yp,Zp,_p,$p,aq,bq,cq,dq,eq,fq,gq,hq,iq,jq,kq,lq,mq,nq,oq,pq,qq,rq,sq,tq,uq,vq,wq,xq,yq,zq,Aq,Bq,Cq,Dq,Eq,Fq,Gq,Hq,Iq,Jq,Kq,Lq,Mq,Nq,Oq,Pq,Qq,Rq,Sq,Tq,zi,Ai,Bi,Ci,Di,Ei,Fi,Gi,Hi,Ii,Ji,Ki,Li,Mi,Ni,Oi,Pi,Qi,Ri,Si,Ti,Ui,Vi,Wi,Xi,Yi,Zi,_i,$i,aj,bj,cj,dj,ej,fj,gj,hj,ij,jj,kj,Jh,Kh,Lh,Mh,Nh,Oh,Ph,Qh,Rh,Sh,Th,Uh,Vh,Wh,Xh,Yh,Zh,_h,$h,ai,bi,ci,di,ei,fi,gi,hi,ii,ji,ki,li,mi,ni,oi,pi,qi,ri,si,ti,ui,Bh,Ch,Dh,Eh,Fh,jf,Gh,Hh,Ih,$g,ah,bh,lf,ch,dh,eh,fh,gh,hh,ih,jh,kh,of,nf,pf,lh,rf,sf,qf,mh,nh,oh,ph,qh,rh,sh,th,uh,vh,wh,xh,yh,zh,Ah,xs,ys,zs,As,Bs,Cs,Ds,Es,Fs,Gs,Hs,Is,Ks,Ls,Ms,Ns,Os,Rs,Ps,Ss,Ts,Us,Vs,Ws,Xs,Ys,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw];var oc=[qw,qw,lv,qw,mv,qw,nv,qw,ov,qw,pv,qw,qv,qw,rv,qw,sv,qw,tv,qw,uv,qw,qw,qw,qw,qw,qw,qw,qw,qw,qw,qw];var pc=[rw,rw,wv,rw,xv,rw,yv,rw,zv,rw,Av,rw,Bv,rw,Cv,rw,Dv,rw,Ev,rw,Fv,rw,hr,ir,kr,lr,rw,rw,rw,rw,rw,rw];var qc=[sw,sw,Hv,sw,Iv,sw,Jv,sw,Kv,sw,Lv,sw,Mv,sw,Nv,sw,Ov,sw,Pv,sw,Qv,sw,vt,ut,sw,sw,sw,sw,sw,sw,sw,sw];var rc=[tw,tw,Sv,tw,Tv,tw,Uv,tw,Vv,tw,Wv,tw,Xv,tw,Yv,tw,Zv,tw,_v,tw,$v,tw,zf,Af,Ff,cd,ag,bg,gg,fg,kd,ld,Ad,yd,Ed,Hd,Sf,Tf,Nd,Ld,Gg,Rd,Lg,Mg,Pg,Wg,pd,rd,td,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw];var sc=[uw,uw,bw,uw,cw,uw,dw,uw,ew,uw,fw,uw,gw,uw,hw,uw,iw,uw,jw,uw,kw,uw,pt,qt,uw,uw,uw,uw,uw,uw,uw,uw];return{_strlen:Tt,_free:xt,_rand_r:Rt,_EggShell_ExecuteSlices:at,_EggShell_Create:_s,_i64Add:Ut,_memmove:Xt,_EggShell_REPL:$s,_realloc:yt,_memset:Yt,_malloc:wt,_memcpy:Wt,_Vireo_Version:Zs,_EggShell_Delete:bt,_bitshift64Lshr:Vt,_rand:St,_i64Subtract:_t,_bitshift64Shl:Zt,runPostSets:Qt,stackAlloc:tc,stackSave:uc,stackRestore:vc,setThrew:wc,setTempRet0:zc,setTempRet1:Ac,setTempRet2:Bc,setTempRet3:Cc,setTempRet4:Dc,setTempRet5:Ec,setTempRet6:Fc,setTempRet7:Gc,setTempRet8:Hc,setTempRet9:Ic,dynCall_iiii:ju,dynCall_viiiii:uu,dynCall_vi:Fu,dynCall_vii:Qu,dynCall_ii:$u,dynCall_v:kv,dynCall_iiiii:vv,dynCall_viiiiii:Gv,dynCall_iii:Rv,dynCall_viiii:aw}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "jsCall": jsCall, "invoke_iiii": invoke_iiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iiiii": invoke_iiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_viiii": invoke_viiii, "_fabs": _fabs, "_exp": _exp, "_sqrtf": _sqrtf, "__ZSt9terminatev": __ZSt9terminatev, "___cxa_guard_acquire": ___cxa_guard_acquire, "__reallyNegative": __reallyNegative, "_fstat": _fstat, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_ceilf": _ceilf, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sinh": _sinh, "_sysconf": _sysconf, "_close": _close, "_tanf": _tanf, "_cos": _cos, "_puts": _puts, "_unlink": _unlink, "_write": _write, "_expf": _expf, "__ZNSt9exceptionD2Ev": __ZNSt9exceptionD2Ev, "___cxa_does_inherit": ___cxa_does_inherit, "_send": _send, "_hypot": _hypot, "_log2": _log2, "_atan2": _atan2, "_SDL_GetTicks": _SDL_GetTicks, "_atan2f": _atan2f, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "___cxa_guard_release": ___cxa_guard_release, "_SDL_LockSurface": _SDL_LockSurface, "___setErrNo": ___setErrNo, "_llvm_pow_f32": _llvm_pow_f32, "___resumeException": ___resumeException, "_srand": _srand, "_ceil": _ceil, "_atanf": _atanf, "_printf": _printf, "_logf": _logf, "_emscripten_get_now": _emscripten_get_now, "_stat": _stat, "_read": _read, "_SDL_SetVideoMode": _SDL_SetVideoMode, "_fwrite": _fwrite, "_time": _time, "_fprintf": _fprintf, "_gettimeofday": _gettimeofday, "_log10": _log10, "_exit": _exit, "_llvm_pow_f64": _llvm_pow_f64, "_fmod": _fmod, "_lseek": _lseek, "_rmdir": _rmdir, "___cxa_allocate_exception": ___cxa_allocate_exception, "_asin": _asin, "_floor": _floor, "_pwrite": _pwrite, "_cosf": _cosf, "_open": _open, "_fabsf": _fabsf, "_remove": _remove, "_emscripten_asm_const": _emscripten_asm_const, "_SDL_Init": _SDL_Init, "_snprintf": _snprintf, "_SDL_Quit": _SDL_Quit, "_sinf": _sinf, "_floorf": _floorf, "_log": _log, "_recv": _recv, "_tan": _tan, "_SDL_UnlockSurface": _SDL_UnlockSurface, "_abort": _abort, "_SDL_MapRGBA": _SDL_MapRGBA, "_SDL_Flip": _SDL_Flip, "_isspace": _isspace, "_sin": _sin, "___cxa_is_number_type": ___cxa_is_number_type, "_acosf": _acosf, "_acos": _acos, "_cosh": _cosh, "_emscripten_asm_const_int": _emscripten_asm_const_int, "_fmax": _fmax, "_fflush": _fflush, "_asinf": _asinf, "_fileno": _fileno, "__exit": __exit, "_atan": _atan, "_fputs": _fputs, "_pread": _pread, "_mkport": _mkport, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_copysign": _copysign, "_fputc": _fputc, "___cxa_throw": ___cxa_throw, "__formatString": __formatString, "_rint": _rint, "_sqrt": _sqrt, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "___rand_seed": ___rand_seed, "NaN": NaN, "Infinity": Infinity, "__ZTISt9exception": __ZTISt9exception }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _rand_r = Module["_rand_r"] = asm["_rand_r"];
var _EggShell_ExecuteSlices = Module["_EggShell_ExecuteSlices"] = asm["_EggShell_ExecuteSlices"];
var _EggShell_Create = Module["_EggShell_Create"] = asm["_EggShell_Create"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _EggShell_REPL = Module["_EggShell_REPL"] = asm["_EggShell_REPL"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _Vireo_Version = Module["_Vireo_Version"] = asm["_Vireo_Version"];
var _EggShell_Delete = Module["_EggShell_Delete"] = asm["_EggShell_Delete"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _rand = Module["_rand"] = asm["_rand"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };


// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

Module["noExitRuntime"] = true;

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






