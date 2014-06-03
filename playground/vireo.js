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
var __ZTVN10__cxxabiv117__class_type_infoE = 35448;
var __ZTVN10__cxxabiv120__si_class_type_infoE = 35488;




STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(36219);
/* global initializers */ __ATINIT__.push();


/* memory initializer */ allocate([97,115,115,101,114,116,32,37,115,32,102,97,105,108,101,100,32,105,110,32,37,115,44,32,108,105,110,101,32,37,100,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,108,108,111,99,97,116,105,111,110,115,32,37,52,100,44,32,65,81,67,111,117,110,116,32,37,53,122,100,44,32,83,104,97,114,101,84,121,112,101,115,32,37,100,32,40,37,115,41,10,0,0,0,0,0,0,99,111,117,110,116,65,81,32,33,61,32,48,0,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,84,121,112,101,65,110,100,68,97,116,97,77,97,110,97,103,101,114,46,99,112,112,0,0,0,112,66,117,102,102,101,114,32,33,61,32,110,117,108,108,0,116,104,105,115,32,61,61,32,40,40,77,97,108,108,111,99,73,110,102,111,42,41,112,78,101,119,66,117,102,102,101,114,41,45,62,95,109,97,110,97,103,101,114,0,0,0,0,0,116,104,105,115,32,61,61,32,40,40,77,97,108,108,111,99,73,110,102,111,42,41,112,66,117,102,102,101,114,41,45,62,95,109,97,110,97,103,101,114,0,0,0,0,0,0,0,0,110,117,108,108,32,33,61,32,116,121,112,101,0,0,0,0,95,116,121,112,101,76,105,115,116,32,61,61,32,116,121,112,101,0,0,0,0,0,0,0,0,0,0,0,248,30,0,0,22,0,0,0,23,0,0,0,22,0,0,0,22,0,0,0,23,0,0,0,22,0,0,0,23,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,22,0,0,0,23,0,0,0,25,0,0,0,26,0,0,0,73,115,70,108,97,116,40,41,0,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,8,33,0,0,24,0,0,0,25,0,0,0,22,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,25,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,28,0,0,0,24,0,0,0,25,0,0,0,29,0,0,0,30,0,0,0,0,0,0,0,112,33,0,0,26,0,0,0,27,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,25,0,0,0,27,0,0,0,29,0,0,0,31,0,0,0,28,0,0,0,24,0,0,0,25,0,0,0,29,0,0,0,30,0,0,0,0,0,0,0,152,33,0,0,28,0,0,0,29,0,0,0,28,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,29,0,0,0,30,0,0,0,29,0,0,0,25,0,0,0,28,0,0,0,24,0,0,0,25,0,0,0,29,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,33,0,0,30,0,0,0,31,0,0,0,31,0,0,0,22,0,0,0,23,0,0,0,22,0,0,0,23,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,22,0,0,0,23,0,0,0,25,0,0,0,32,0,0,0,0,0,0,0,240,33,0,0,32,0,0,0,33,0,0,0,32,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,26,0,0,0,23,0,0,0,25,0,0,0,34,0,0,0,65,103,103,114,105,103,97,116,101,83,105,122,101,32,61,61,32,101,108,101,109,101,110,116,45,62,84,111,112,65,81,83,105,122,101,40,41,0,0,0,0,0,0,0,152,32,0,0,34,0,0,0,35,0,0,0,33,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,32,0,0,0,27,0,0,0,28,0,0,0,33,0,0,0,26,0,0,0,101,108,101,109,101,110,116,45,62,95,111,102,102,115,101,116,32,61,61,32,111,102,102,115,101,116,0,0,0,0,0,0,102,97,108,115,101,0,0,0,0,0,0,0,200,32,0,0,36,0,0,0,37,0,0,0,34,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,34,0,0,0,29,0,0,0,30,0,0,0,35,0,0,0,26,0,0,0,0,0,0,0,24,33,0,0,38,0,0,0,39,0,0,0,35,0,0,0,35,0,0,0,36,0,0,0,36,0,0,0,37,0,0,0,36,0,0,0,24,0,0,0,37,0,0,0,25,0,0,0,38,0,0,0,31,0,0,0,32,0,0,0,39,0,0,0,30,0,0,0,0,0,0,0,32,34,0,0,40,0,0,0,41,0,0,0,37,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,33,0,0,0,34,0,0,0,40,0,0,0,26,0,0,0,101,108,101,109,101,110,116,45,62,95,111,102,102,115,101,116,32,61,61,32,97,113,67,111,117,110,116,0,0,0,0,0,40,69,114,114,111,114,32,105,110,118,97,108,105,100,32,117,115,97,103,101,32,116,121,112,101,32,60,37,100,62,32,105,110,32,80,97,114,97,109,66,108,111,99,107,41,10,0,0,0,0,0,0,72,33,0,0,42,0,0,0,43,0,0,0,38,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,25,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,41,0,0,0,35,0,0,0,25,0,0,0,29,0,0,0,30,0,0,0,0,0,0,0,72,34,0,0,44,0,0,0,45,0,0,0,39,0,0,0,27,0,0,0,38,0,0,0,42,0,0,0,43,0,0,0,25,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,28,0,0,0,24,0,0,0,25,0,0,0,29,0,0,0,30,0,0,0,0,0,0,0,120,34,0,0,46,0,0,0,47,0,0,0,39,0,0,0,27,0,0,0,38,0,0,0,42,0,0,0,43,0,0,0,25,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,44,0,0,0,36,0,0,0,25,0,0,0,29,0,0,0,30,0,0,0,0,0,0,0,168,34,0,0,48,0,0,0,49,0,0,0,40,0,0,0,27,0,0,0,28,0,0,0,26,0,0,0,27,0,0,0,25,0,0,0,24,0,0,0,29,0,0,0,25,0,0,0,28,0,0,0,37,0,0,0,38,0,0,0,45,0,0,0,30,0,0,0,95,112,82,97,119,66,117,102,102,101,114,66,101,103,105,110,32,61,61,32,110,117,108,108,0,0,0,0,0,0,0,0,95,112,82,97,119,66,117,102,102,101,114,69,110,100,32,61,61,32,110,117,108,108,0,0,112,65,114,114,97,121,45,62,95,101,108,116,84,121,112,101,82,101,102,32,33,61,32,110,117,108,108,0,0,0,0,0,99,111,117,110,116,66,121,116,101,115,32,62,61,32,48,0,95,112,82,97,119,66,117,102,102,101,114,69,110,100,32,33,61,32,110,117,108,108,0,0,0,0,0,0,50,0,0,0,248,6,0,0,0,0,0,0,76,97,98,86,73,69,87,95,84,121,112,101,115,0,0,0,46,0,0,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,100,97,116,97,32,116,121,112,101,0,0,98,99,0,0,0,0,0,0,99,0,0,0,0,0,0,0,112,0,0,0,0,0,0,0,98,98,0,0,0,0,0,0,97,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,100,118,0,0,0,0,0,0,101,113,0,0,0,0,0,0,112,116,114,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,116,121,112,101,32,112,114,105,109,105,116,105,118,101,0,0,0,0,0,40,0,0,0,0,0,0,0,39,40,39,32,109,105,115,115,105,110,103,0,0,0,0,0,41,0,0,0,0,0,0,0,101,0,0,0,0,0,0,0,105,0,0,0,0,0,0,0,111,0,0,0,0,0,0,0,105,111,0,0,0,0,0,0,115,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,105,109,0,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,101,108,101,109,101,110,116,32,116,121,112,101,0,0,0,0,0,0,0,39,41,39,32,109,105,115,115,105,110,103,0,0,0,0,0,73,110,118,97,108,105,100,32,97,114,114,97,121,32,100,105,109,101,110,115,105,111,110,0,72,111,115,116,80,111,105,110,116,101,114,83,105,122,101,0,66,111,111,108,101,97,110,0,73,69,69,69,55,53,52,66,0,0,0,0,0,0,0,0,85,73,110,116,0,0,0,0,83,73,110,116,0,0,0,0,81,0,0,0,0,0,0,0,81,49,0,0,0,0,0,0,73,110,116,66,105,97,115,101,100,0,0,0,0,0,0,0,83,73,110,116,49,99,0,0,65,115,99,105,105,0,0,0,66,105,116,115,0,0,0,0,85,110,105,99,111,100,101,0,71,101,110,101,114,105,99,0,80,111,105,110,116,101,114,0,45,0,0,0,0,0,0,0,112,68,97,116,97,32,33,61,32,110,117,108,108,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,84,68,67,111,100,101,99,86,105,97,46,99,112,112,0,0,0,112,65,114,114,97,121,32,33,61,32,110,117,108,108,0,0,112,76,101,110,103,116,104,115,32,33,61,32,110,117,108,108,0,0,0,0,0,0,0,0,73,103,110,111,114,105,110,103,32,101,120,116,114,97,32,97,114,114,97,121,32,105,110,105,116,105,97,108,105,122,101,114,32,101,108,101,109,101,110,116,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,0,0,0,0,0,0,0,68,97,116,97,32,101,110,99,111,100,105,110,103,32,110,111,116,32,102,111,114,109,97,116,116,101,100,32,99,111,114,114,101,99,116,108,121,0,0,0,68,97,116,97,32,105,110,116,32,115,105,122,101,32,110,111,116,32,115,117,112,111,114,116,101,100,0,0,0,0,0,0,116,114,117,101,0,0,0,0,102,0,0,0,0,0,0,0,68,97,116,97,32,98,111,111,108,101,97,110,32,118,97,108,117,101,32,115,121,110,116,97,120,32,101,114,114,111,114,0,68,97,116,97,32,98,111,111,108,101,97,110,32,115,105,122,101,32,103,114,101,97,116,101,114,32,116,104,97,110,32,49,0,0,0,0,0,0,0,0,68,97,116,97,32,73,69,69,69,55,53,52,32,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,0,0,0,68,97,116,97,32,73,69,69,69,55,53,52,32,115,105,122,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,115,99,97,108,97,114,32,116,104,97,116,32,105,115,32,117,110,105,99,111,100,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,121,112,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,0,0,0,0,0,0,0,0,80,97,114,115,105,110,103,32,112,111,105,110,116,101,114,32,116,121,112,101,0,0,0,0,78,111,32,112,97,114,115,101,114,32,102,111,114,32,100,97,116,97,32,116,121,112,101,39,115,32,101,110,99,111,100,105,110,103,0,0,0,0,0,0,99,108,117,109,112,0,0,0,69,109,112,116,121,80,97,114,97,109,101,116,101,114,76,105,115,116,0,0,0,0,0,0,112,97,114,97,109,101,116,101,114,66,108,111,99,107,84,121,112,101,32,33,61,32,110,117,108,108,0,0,0,0,0,0,100,97,116,97,83,112,97,99,101,84,121,112,101,32,33,61,32,110,117,108,108,0,0,0,86,73,32,67,108,117,109,112,32,99,111,117,110,116,32,109,105,115,115,105,110,103,0,0,86,73,32,67,108,117,109,112,32,99,111,117,110,116,32,105,110,99,111,114,114,101,99,116,0,0,0,0,0,0,0,0,99,105,97,46,95,115,105,122,101,32,61,61,32,48,0,0,39,99,108,117,109,112,39,32,109,105,115,115,105,110,103,0,102,105,114,101,32,99,111,117,110,116,32,109,105,115,115,105,110,103,0,0,0,0,0,0,80,101,114,99,104,0,0,0,112,101,114,99,104,32,108,97,98,101,108,32,101,114,114,111,114,0,0,0,0,0,0,0,70,117,110,99,116,105,111,110,32,110,111,116,32,102,111,117,110,100,0,0,0,0,0,0,86,97,114,65,114,103,67,111,117,110,116,0,0,0,0,0,33,115,116,97,116,101,46,86,97,114,65,114,103,80,97,114,97,109,101,116,101,114,68,101,116,101,99,116,101,100,40,41,0,0,0,0,0,0,0,0,66,114,97,110,99,104,84,97,114,103,101,116,0,0,0,0,67,108,117,109,112,0,0,0,86,73,0,0,0,0,0,0,73,110,115,116,114,117,99,116,105,111,110,70,117,110,99,116,105,111,110,0,0,0,0,0,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,0,0,0,0,0,0,0,83,116,97,116,105,99,83,116,114,105,110,103,0,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,84,79,68,79,62,0,0,37,42,108,108,100,0,0,0,37,42,108,108,117,0,0,0,42,42,117,110,115,117,112,111,114,116,101,100,32,116,121,112,101,42,42,0,0,0,0,0,110,97,110,0,0,0,0,0,45,105,110,102,0,0,0,0,105,110,102,0,0,0,0,0,37,71,0,0,0,0,0,0,95,110,117,108,108,0,0,0,110,117,108,108,0,0,0,0,42,42,42,84,79,68,79,32,112,111,105,110,116,101,114,32,116,121,112,101,0,0,0,0,100,105,117,111,120,88,102,70,101,69,103,71,97,65,99,115,112,37,0,0,0,0,0,0,83,116,114,105,110,103,0,0,232,6,0,0,51,0,0,0,88,13,0,0,0,0,0,0,68,97,116,97,65,110,100,84,121,112,101,67,111,100,101,99,85,116,102,56,0,0,0,0,72,13,0,0,52,0,0,0,128,13,0,0,0,0,0,0,84,68,67,111,100,101,99,76,86,70,108,97,116,0,0,0,84,114,97,99,101,0,0,0,87,97,114,110,105,110,103,0,69,114,114,111,114,0,0,0,72,97,114,100,69,114,114,111,114,0,0,0,0,0,0,0,65,115,115,101,114,116,0,0,69,118,101,110,116,0,0,0,40,76,105,110,101,32,37,100,32,37,115,32,34,37,115,32,39,37,46,42,115,39,46,34,41,10,0,0,0,0,0,0,40,76,105,110,101,32,37,100,32,37,115,32,34,37,115,46,34,41,10,0,0,0,0,0,37,115,0,0,0,0,0,0,99,40,101,40,98,98,40,49,32,66,111,111,108,101,97,110,41,41,41,0,0,0,0,0,99,40,101,40,98,98,40,42,32,71,101,110,101,114,105,99,41,41,41,0,0,0,0,0,85,73,110,116,56,0,0,0,99,40,101,40,98,98,40,56,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,0,73,110,116,56,0,0,0,0,99,40,101,40,98,98,40,56,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,0,0,99,40,101,40,98,98,40,49,54,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,73,110,116,49,54,0,0,0,99,40,101,40,98,98,40,49,54,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,85,73,110,116,51,50,65,116,111,109,105,99,0,0,0,0,99,40,101,40,98,98,40,51,50,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,85,73,110,116,51,50,67,108,117,115,116,101,114,0,0,0,99,40,101,40,46,85,73,110,116,49,54,32,72,105,87,111,114,100,41,32,101,40,46,85,73,110,116,49,54,32,76,111,87,111,114,100,41,41,0,0,85,73,110,116,51,50,0,0,101,113,40,101,40,46,85,73,110,116,51,50,65,116,111,109,105,99,41,32,101,40,46,85,73,110,116,51,50,67,108,117,115,116,101,114,41,41,0,0,73,110,116,51,50,0,0,0,99,40,101,40,98,98,40,51,50,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,85,73,110,116,54,52,0,0,99,40,101,40,98,98,40,54,52,32,85,73,110,116,41,41,41,0,0,0,0,0,0,0,73,110,116,54,52,0,0,0,99,40,101,40,98,98,40,54,52,32,83,73,110,116,41,41,41,0,0,0,0,0,0,0,66,108,111,99,107,49,50,56,0,0,0,0,0,0,0,0,99,40,101,40,98,98,40,49,50,56,32,66,105,116,115,41,41,41,0,0,0,0,0,0,66,108,111,99,107,50,53,54,0,0,0,0,0,0,0,0,99,40,101,40,98,98,40,50,53,54,32,66,105,116,115,41,41,41,0,0,0,0,0,0,83,105,110,103,108,101,65,116,111,109,105,99,0,0,0,0,99,40,101,40,98,98,40,51,50,32,73,69,69,69,55,53,52,66,41,41,41,0,0,0,83,105,110,103,108,101,67,108,117,115,116,101,114,0,0,0,99,40,101,40,98,99,40,101,40,98,98,40,49,32,66,111,111,108,101,97,110,41,32,115,105,103,110,41,32,101,40,98,98,40,56,32,73,110,116,66,105,97,115,101,100,41,32,101,120,112,111,110,101,110,116,41,32,101,40,98,98,40,50,51,32,81,49,41,32,102,114,97,99,116,105,111,110,41,41,41,41,0,0,0,0,0,0,0,83,105,110,103,108,101,0,0,101,113,40,101,40,46,83,105,110,103,108,101,65,116,111,109,105,99,41,32,101,40,46,83,105,110,103,108,101,67,108,117,115,116,101,114,41,41,0,0,68,111,117,98,108,101,65,116,111,109,105,99,0,0,0,0,99,40,101,40,98,98,40,54,52,32,73,69,69,69,55,53,52,66,41,41,41,0,0,0,68,111,117,98,108,101,67,108,117,115,116,101,114,0,0,0,99,40,101,40,98,99,40,101,40,98,98,40,49,32,66,111,111,108,101,97,110,41,32,115,105,103,110,41,32,32,101,40,98,98,40,49,49,32,73,110,116,66,105,97,115,101,100,41,32,32,101,120,112,111,110,101,110,116,41,32,32,101,40,98,98,40,53,50,32,81,49,41,32,32,102,114,97,99,116,105,111,110,41,41,41,41,0,0,68,111,117,98,108,101,0,0,101,113,40,101,40,46,68,111,117,98,108,101,65,116,111,109,105,99,41,32,101,40,46,68,111,117,98,108,101,67,108,117,115,116,101,114,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,99,40,101,40,46,83,105,110,103,108,101,32,114,101,97,108,41,32,101,40,46,83,105,110,103,108,101,32,105,109,97,103,105,110,97,114,121,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,99,40,101,40,46,68,111,117,98,108,101,32,114,101,97,108,41,32,101,40,46,68,111,117,98,108,101,32,105,109,97,103,105,110,97,114,121,41,41,0,84,105,109,101,0,0,0,0,99,40,101,40,46,73,110,116,54,52,32,115,101,99,111,110,100,115,41,32,101,40,46,85,73,110,116,54,52,32,102,114,97,99,116,105,111,110,115,41,41,0,0,0,0,0,0,0,65,115,99,105,105,67,104,97,114,0,0,0,0,0,0,0,99,40,101,40,98,98,40,56,32,65,115,99,105,105,41,41,41,0,0,0,0,0,0,0,85,116,102,56,67,104,97,114,0,0,0,0,0,0,0,0,99,40,101,40,98,98,40,56,32,85,110,105,99,111,100,101,41,41,41,0,0,0,0,0,65,115,99,105,105,65,114,114,97,121,49,68,0,0,0,0,97,40,46,65,115,99,105,105,67,104,97,114,32,42,41,0,85,116,102,56,65,114,114,97,121,49,68,0,0,0,0,0,97,40,46,85,116,102,56,67,104,97,114,32,42,41,0,0,46,85,116,102,56,65,114,114,97,121,49,68,0,0,0,0,65,115,99,105,105,83,116,114,105,110,103,0,0,0,0,0,46,65,115,99,105,105,65,114,114,97,121,49,68,0,0,0,83,116,114,105,110,103,65,114,114,97,121,49,68,0,0,0,97,40,46,83,116,114,105,110,103,32,42,41,0,0,0,0,67,111,100,101,80,111,105,110,116,101,114,0,0,0,0,0,99,40,101,40,98,98,40,72,111,115,116,80,111,105,110,116,101,114,83,105,122,101,32,80,111,105,110,116,101,114,41,41,41,0,0,0,0,0,0,0,68,97,116,97,80,111,105,110,116,101,114,0,0,0,0,0,46,68,97,116,97,80,111,105,110,116,101,114,0,0,0,0,46,67,111,100,101,80,111,105,110,116,101,114,0,0,0,0,73,110,115,116,114,117,99,116,105,111,110,83,110,105,112,112,101,116,0,0,0,0,0,0,99,40,41,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,0,0,0,0,0,83,116,97,116,105,99,84,121,112,101,0,0,0,0,0,0,79,98,106,101,99,116,0,0,65,114,114,97,121,0,0,0,65,114,114,97,121,49,68,0,86,97,114,105,97,110,116,0,99,40,101,40,46,83,116,97,116,105,99,84,121,112,101,41,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,41,41,0,0,0,0,0,0,0,99,40,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,98,101,103,105,110,41,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,101,110,100,41,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,99,117,114,114,101,110,116,45,62,95,110,101,120,116,32,61,61,32,110,117,108,108,41,0,0,0,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,46,99,112,112,0,0,0,0,0,40,99,117,114,114,101,110,116,45,62,95,115,104,111,114,116,67,111,117,110,116,32,61,61,32,48,41,0,0,0,0,0,0,0,0,0,0,0,0,0,110,117,108,108,32,33,61,32,95,114,117,110,110,105,110,103,81,117,101,117,101,69,108,116,0,0,0,0,0,0,0,0,40,95,114,117,110,110,105,110,103,81,117,101,117,101,69,108,116,32,61,61,32,110,117,108,108,41,0,0,0,0,0,0,40,99,117,114,114,101,110,116,73,110,115,116,114,117,99,116,105,111,110,32,33,61,32,110,117,108,108,41,0,0,0,0,40,110,117,108,108,32,61,61,32,95,114,117,110,110,105,110,103,81,117,101,117,101,69,108,116,45,62,95,110,101,120,116,41,0,0,0,0,0,0,0,40,48,32,61,61,32,95,114,117,110,110,105,110,103,81,117,101,117,101,69,108,116,45,62,95,115,104,111,114,116,67,111,117,110,116,41,0,0,0,0,95,114,117,110,110,105,110,103,81,117,101,117,101,69,108,116,32,61,61,32,110,117,108,108,0,0,0,0,0,0,0,0,99,117,114,114,101,110,116,73,110,115,116,114,117,99,116,105,111,110,32,33,61,32,110,117,108,108,0,0,0,0,0,0,95,114,117,110,110,105,110,103,81,117,101,117,101,69,108,116,32,33,61,32,110,117,108,108,0,0,0,0,0,0,0,0,40,48,32,61,61,32,101,108,116,45,62,95,115,104,111,114,116,67,111,117,110,116,41,0,112,13,0,0,53,0,0,0,224,21,0,0,0,0,0,0,76,97,98,86,73,69,87,95,69,120,101,99,117,116,105,111,110,49,0,0,0,0,0,0,40,110,117,108,108,32,61,61,32,101,108,116,45,62,95,110,101,120,116,32,41,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,81,117,101,117,101,46,99,112,112,0,0,0,0,0,0,0,0,40,110,117,108,108,32,61,61,32,40,116,104,105,115,45,62,95,116,97,105,108,41,45,62,95,110,101,120,116,32,41,0,95,101,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,32,61,61,32,110,117,108,108,0,0,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,46,99,112,112,0,0,0,0,115,105,122,101,111,102,40,86,73,67,108,117,109,112,41,32,61,61,32,95,99,108,117,109,112,115,45,62,69,108,101,109,101,110,116,84,121,112,101,40,41,45,62,84,111,112,65,81,83,105,122,101,40,41,0,0,114,111,111,116,67,108,117,109,112,45,62,70,105,114,101,67,111,117,110,116,40,41,32,61,61,32,49,0,0,0,0,0,95,115,104,111,114,116,67,111,117,110,116,32,62,32,48,0,110,117,108,108,32,61,61,32,101,108,116,45,62,95,110,101,120,116,0,0,0,0,0,0,95,110,101,120,116,32,61,61,32,110,117,108,108,0,0,0,95,112,87,104,101,114,101,84,111,80,97,116,99,104,32,61,61,32,110,117,108,108,0,0,105,110,115,116,114,117,99,116,105,111,110,84,121,112,101,45,62,84,111,112,65,81,83,105,122,101,40,41,32,61,61,32,115,105,122,101,111,102,40,118,111,105,100,42,41,0,0,0,95,105,110,115,116,114,117,99,116,105,111,110,84,121,112,101,32,33,61,32,110,117,108,108,0,0,0,0,0,0,0,0,95,105,110,115,116,114,117,99,116,105,111,110,80,111,105,110,116,101,114,84,121,112,101,32,33,61,32,110,117,108,108,0,95,105,110,115,116,114,117,99,116,105,111,110,80,111,105,110,116,101,114,84,121,112,101,45,62,66,105,116,69,110,99,111,100,105,110,103,40,41,32,61,61,32,107,69,110,99,111,100,105,110,103,95,80,111,105,110,116,101,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,69,114,114,111,114,32,34,68,111,117,98,108,101,32,80,101,114,99,104,32,60,37,100,62,32,110,111,116,32,115,117,112,112,111,114,116,101,100,34,41,10,0,0,0,0,0,0,40,69,114,114,111,114,32,34,80,101,114,99,104,32,60,37,100,62,32,101,120,99,101,101,100,115,32,108,105,109,105,116,115,34,41,10,0,0,0,0,40,69,114,114,111,114,32,34,80,101,114,99,104,32,108,97,98,101,108,32,115,121,110,116,97,120,32,101,114,114,111,114,32,60,37,46,42,115,62,34,41,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,101,101,110,116,114,97,110,116,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,110,111,116,32,114,101,115,111,108,118,101,100,0,0,0,84,111,111,32,109,97,110,121,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,84,111,111,32,102,101,119,32,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,84,121,112,101,32,109,105,115,109,97,116,99,104,44,32,97,114,103,117,109,101,110,116,32,115,104,111,117,108,100,32,98,101,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,110,111,116,32,111,112,116,105,111,110,97,108,0,0,0,65,114,103,117,109,101,110,116,32,110,111,116,32,109,117,116,97,98,108,101,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,99,108,117,109,112,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,108,111,99,97,108,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,112,101,114,99,104,0,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,112,97,114,97,109,101,116,101,114,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,103,108,111,98,97,108,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,100,101,102,97,117,108,116,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,115,116,97,116,105,99,0,0,0,0,0,0,65,114,103,117,109,101,110,116,32,105,115,32,105,102,117,110,99,116,105,111,110,0,0,0,85,110,107,110,111,119,110,32,97,114,103,117,109,101,110,116,32,116,121,112,101,0,0,0,116,104,105,115,45,62,95,97,114,103,67,111,117,110,116,32,62,48,0,0,0,0,0,0,67,97,108,108,86,73,0,0,73,110,105,116,0,0,0,0,67,111,112,121,0,0,0,0,67,108,101,97,114,0,0,0,67,111,112,121,84,111,112,0,90,101,114,111,79,117,116,84,111,112,0,0,0,0,0,0,118,105,65,114,103,80,111,105,110,116,101,114,115,91,105,93,32,33,61,32,110,117,108,108,0,0,0,0,0,0,0,0,95,112,101,114,99,104,101,115,91,95,114,101,99,111,114,100,78,101,120,116,73,110,115,116,114,117,99,116,105,111,110,65,100,100,114,101,115,115,93,32,61,61,32,107,80,101,114,99,104,66,101,105,110,103,65,108,111,99,97,116,101,100,0,0,112,80,97,116,99,104,45,62,95,119,104,101,114,101,84,111,80,97,116,99,104,32,61,61,32,110,117,108,108,0,0,0,67,117,108,68,101,83,97,99,0,0,0,0,0,0,0,0,68,111,110,101,0,0,0,0,160,119,0,0,0,0,0,0,48,119,0,0,0,0,0,0,208,21,0,0,54,0,0,0,64,27,0,0,0,0,0,0,76,97,98,86,73,69,87,95,69,120,101,99,117,116,105,111,110,50,0,0,0,0,0,0,48,27,0,0,55,0,0,0,160,10,0,0,0,0,0,0,88,27,0,0,56,0,0,0,120,27,0,0,0,0,0,0,76,97,98,86,73,69,87,95,77,97,116,104,0,0,0,0,104,27,0,0,57,0,0,0,120,27,0,0,0,0,0,0,136,27,0,0,58,0,0,0,120,27,0,0,0,0,0,0,115,116,114,105,110,103,73,110,112,117,116,32,33,61,32,112,68,101,115,116,0,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,83,116,114,105,110,103,46,99,112,112,0,0,0,0,0,0,0,105,32,61,61,32,48,0,0,152,27,0,0,59,0,0,0,248,27,0,0,0,0,0,0,76,97,98,86,73,69,87,95,83,116,114,105,110,103,0,0,67,111,112,121,49,0,0,0,67,111,112,121,50,0,0,0,67,111,112,121,52,0,0,0,67,111,112,121,56,0,0,0,67,111,112,121,49,54,0,0,67,111,112,121,51,50,0,0,67,111,112,121,78,0,0,0,67,111,112,121,79,98,106,101,99,116,0,0,0,0,0,0,67,111,112,121,83,116,97,116,105,99,84,121,112,101,100,66,108,111,99,107,0,0,0,0,84,121,112,101,32,77,105,115,109,97,116,99,104,0,0,0,83,112,108,105,116,0,0,0,74,111,105,110,0,0,0,0,86,101,99,116,111,114,86,101,99,116,111,114,83,112,108,105,116,79,112,0,0,0,0,0,86,101,99,116,111,114,86,101,99,116,111,114,66,105,110,97,114,121,65,99,99,117,109,117,108,97,116,111,114,79,112,0,86,101,99,116,111,114,86,101,99,116,111,114,66,105,110,97,114,121,79,112,0,0,0,0,86,101,99,116,111,114,83,99,97,108,97,114,66,105,110,97,114,121,79,112,0,0,0,0,83,99,97,108,97,114,86,101,99,116,111,114,66,105,110,97,114,121,79,112,0,0,0,0,65,99,99,117,109,117,108,97,116,111,114,0,0,0,0,0,67,108,117,115,116,101,114,66,105,110,97,114,121,79,112,0,67,111,110,118,101,114,116,0,86,101,99,116,111,114,85,110,97,114,121,79,112,0,0,0,67,108,117,115,116,101,114,85,110,97,114,121,79,112,0,0,40,69,114,114,111,114,32,34,70,117,99,110,116,105,111,110,32,60,37,46,42,115,62,32,100,105,100,32,110,111,116,32,114,101,115,111,108,118,101,32,116,111,32,115,112,101,99,105,102,105,99,32,116,121,112,101,34,41,10,0,0,0,0,0,83,101,97,114,99,104,49,68,65,114,114,97,121,73,110,116,101,114,110,97,108,0,0,0,112,73,110,115,116,114,117,99,116,105,111,110,66,117,105,108,100,101,114,45,62,95,97,114,103,84,121,112,101,115,91,48,93,45,62,66,105,116,69,110,99,111,100,105,110,103,40,41,32,61,61,32,107,69,110,99,111,100,105,110,103,95,65,114,114,97,121,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,71,101,110,101,114,105,99,70,117,110,99,116,105,111,110,115,46,99,112,112,0,0,0,0,0,73,115,69,81,0,0,0,0,65,100,100,69,108,101,109,101,110,116,115,0,0,0,0,0,65,100,100,0,0,0,0,0,77,117,108,116,105,112,108,121,69,108,101,109,101,110,116,115,0,0,0,0,0,0,0,0,77,117,108,0,0,0,0,0,65,110,100,69,108,101,109,101,110,116,115,0,0,0,0,0,65,110,100,0,0,0,0,0,79,114,69,108,101,109,101,110,116,115,0,0,0,0,0,0,79,114,0,0,0,0,0,0,86,101,99,116,111,114,79,112,73,110,116,101,114,110,97,108,0,0,0,0,0,0,0,0,65,114,114,97,121,67,111,110,99,97,116,101,110,97,116,101,73,110,116,101,114,110,97,108,0,0,0,0,0,0,0,0,232,27,0,0,60,0,0,0,208,30,0,0,0,0,0,0,76,97,98,86,73,69,87,95,68,97,116,97,0,0,0,0,78,53,86,105,114,101,111,49,48,84,121,112,101,67,111,109,109,111,110,69,0,0,0,0,128,138,0,0,224,30,0,0,0,0,0,0,96,31,0,0,61,0,0,0,62,0,0,0,22,0,0,0,22,0,0,0,33,0,0,0,30,0,0,0,31,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,24,0,0,0,22,0,0,0,23,0,0,0,25,0,0,0,26,0,0,0,78,53,86,105,114,101,111,49,51,65,103,103,114,105,103,97,116,101,84,121,112,101,69,0,168,138,0,0,72,31,0,0,248,30,0,0,0,0,0,0,0,0,0,0,216,31,0,0,46,0,0,0,63,0,0,0,78,53,86,105,114,101,111,50,54,67,108,117,115,116,101,114,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,0,0,0,78,53,86,105,114,101,111,50,56,65,103,103,114,105,103,97,116,101,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,0,128,138,0,0,168,31,0,0,168,138,0,0,128,31,0,0,208,31,0,0,0,0,0,0,0,0,0,0,32,32,0,0,47,0,0,0,64,0,0,0,78,53,86,105,114,101,111,50,57,80,97,114,97,109,66,108,111,99,107,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,168,138,0,0,248,31,0,0,208,31,0,0,0,0,0,0,0,0,0,0,112,32,0,0,48,0,0,0,65,0,0,0,78,53,86,105,114,101,111,51,48,69,113,117,105,118,97,108,101,110,99,101,65,108,105,103,110,109,101,110,116,67,97,108,99,117,108,97,116,111,114,69,0,0,0,0,0,0,0,0,168,138,0,0,64,32,0,0,208,31,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,67,108,117,115,116,101,114,84,121,112,101,69,0,0,0,168,138,0,0,128,32,0,0,96,31,0,0,0,0,0,0,78,53,86,105,114,101,111,49,53,69,113,117,105,118,97,108,101,110,99,101,84,121,112,101,69,0,0,0,0,0,0,0,168,138,0,0,168,32,0,0,96,31,0,0,0,0,0,0,78,53,86,105,114,101,111,57,65,114,114,97,121,84,121,112,101,69,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,87,114,97,112,112,101,100,84,121,112,101,69,0,0,0,168,138,0,0,240,32,0,0,248,30,0,0,0,0,0,0,168,138,0,0,216,32,0,0,8,33,0,0,0,0,0,0,78,53,86,105,114,101,111,49,54,68,101,102,97,117,108,116,86,97,108,117,101,84,121,112,101,69,0,0,0,0,0,0,168,138,0,0,40,33,0,0,8,33,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,69,108,101,109,101,110,116,84,121,112,101,69,0,0,0,168,138,0,0,88,33,0,0,8,33,0,0,0,0,0,0,78,53,86,105,114,101,111,57,78,97,109,101,100,84,121,112,101,69,0,0,0,0,0,0,168,138,0,0,128,33,0,0,8,33,0,0,0,0,0,0,78,53,86,105,114,101,111,49,50,66,105,116,66,108,111,99,107,84,121,112,101,69,0,0,168,138,0,0,168,33,0,0,248,30,0,0,0,0,0,0,78,53,86,105,114,101,111,49,52,66,105,116,67,108,117,115,116,101,114,84,121,112,101,69,0,0,0,0,0,0,0,0,168,138,0,0,208,33,0,0,96,31,0,0,0,0,0,0,78,53,86,105,114,101,111,49,52,80,97,114,97,109,66,108,111,99,107,84,121,112,101,69,0,0,0,0,0,0,0,0,168,138,0,0,0,34,0,0,96,31,0,0,0,0,0,0,78,53,86,105,114,101,111,49,49,80,111,105,110,116,101,114,84,121,112,101,69,0,0,0,168,138,0,0,48,34,0,0,8,33,0,0,0,0,0,0,78,53,86,105,114,101,111,49,55,67,117,115,116,111,109,80,111,105,110,116,101,114,84,121,112,101,69,0,0,0,0,0,168,138,0,0,88,34,0,0,72,34,0,0,0,0,0,0,78,53,86,105,114,101,111,49,56,67,117,115,116,111,109,68,97,116,97,80,114,111,99,84,121,112,101,69,0,0,0,0,168,138,0,0,136,34,0,0,8,33,0,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,105,110,99,108,117,100,101,47,84,121,112,101,65,110,100,68,97,116,97,77,97,110,97,103,101,114,46,104,0,0,116,121,112,101,45,62,73,115,65,114,114,97,121,40,41,32,38,38,32,33,116,121,112,101,45,62,73,115,70,108,97,116,40,41,0,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,105,110,99,108,117,100,101,47,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,46,104,0,0,0,0,105,110,100,101,120,32,60,61,32,95,108,101,110,103,116,104,0,0,0,0,0,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,0,0,71,101,110,101,114,105,99,66,105,110,79,112,0,0,0,0,112,40,105,40,46,42,41,32,105,40,46,42,41,32,111,40,46,42,41,41,0,0,0,0,71,101,110,101,114,105,99,85,110,79,112,0,0,0,0,0,112,40,105,40,46,42,41,32,111,40,46,42,41,41,0,0,46,71,101,110,101,114,105,99,85,110,79,112,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,56,41,41,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,32,111,40,46,73,110,116,49,54,41,41,0,112,40,105,40,46,73,110,116,51,50,41,32,32,111,40,46,73,110,116,51,50,41,41,0,112,40,105,40,46,73,110,116,54,52,41,32,32,111,40,46,73,110,116,54,52,41,41,0,112,40,105,40,46,66,108,111,99,107,49,50,56,41,32,111,40,46,66,108,111,99,107,49,50,56,41,41,0,0,0,0,112,40,105,40,46,66,108,111,99,107,50,53,54,41,32,111,40,46,66,108,111,99,107,50,53,54,41,41,0,0,0,0,112,40,105,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,111,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,105,40,46,73,110,116,51,50,41,41,0,0,0,0,112,40,105,40,46,79,98,106,101,99,116,41,32,111,40,46,79,98,106,101,99,116,41,41,0,0,0,0,0,0,0,0,112,40,105,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,111,40,46,68,97,116,97,80,111,105,110,116,101,114,41,32,105,40,46,83,116,97,116,105,99,84,121,112,101,41,41,0,0,0,0,0,0,0,78,111,116,0,0,0,0,0,46,71,101,110,101,114,105,99,66,105,110,79,112,0,0,0,88,111,114,0,0,0,0,0,78,97,110,100,0,0,0,0,78,111,114,0,0,0,0,0,73,115,78,69,0,0,0,0,73,115,76,84,0,0,0,0,73,115,71,84,0,0,0,0,73,115,76,69,0,0,0,0,73,115,71,69,0,0,0,0,83,117,98,0,0,0,0,0,68,105,118,0,0,0,0,0,77,111,100,0,0,0,0,0,81,117,111,116,105,101,110,116,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,0,0,0,0,0,0,0,112,40,105,40,46,42,41,32,111,40,46,42,41,32,111,40,46,42,41,41,0,0,0,0,83,105,110,101,0,0,0,0,67,111,115,105,110,101,0,0,84,97,110,103,101,110,116,0,83,101,99,97,110,116,0,0,67,111,115,101,99,97,110,116,0,0,0,0,0,0,0,0,76,111,103,49,48,0,0,0,76,111,103,0,0,0,0,0,76,111,103,50,0,0,0,0,69,120,112,0,0,0,0,0,83,113,117,97,114,101,82,111,111,116,0,0,0,0,0,0,80,111,119,0,0,0,0,0,65,114,99,83,105,110,101,0,65,114,99,67,111,115,105,110,101,0,0,0,0,0,0,0,65,114,99,84,97,110,0,0,65,114,99,84,97,110,50,0,67,101,105,108,0,0,0,0,65,98,115,111,108,117,116,101,0,0,0,0,0,0,0,0,78,111,114,109,0,0,0,0,80,104,97,115,101,0,0,0,67,111,110,106,117,103,97,116,101,0,0,0,0,0,0,0,70,108,111,111,114,0,0,0,83,105,103,110,0,0,0,0,83,101,97,114,99,104,49,68,65,114,114,97,121,0,0,0,112,40,105,40,46,42,41,32,105,40,46,42,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,32,115,40,46,42,41,41,0,0,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,42,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,32,115,40,46,42,41,41,0,0,0,0,65,114,114,97,121,67,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,0,0,0,112,40,105,40,46,86,97,114,65,114,103,67,111,117,110,116,41,32,111,40,46,65,114,114,97,121,32,111,117,116,112,117,116,41,32,105,40,46,42,41,41,0,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,111,40,46,42,32,111,117,116,112,117,116,41,41,0,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,111,40,46,42,32,111,117,116,112,117,116,41,32,105,40,46,66,111,111,108,101,97,110,41,41,0,0,0,112,40,105,40,46,42,41,32,105,40,46,42,41,32,111,40,46,42,41,32,115,40,46,42,41,32,115,40,46,42,41,41,0,0,0,0,0,0,0,0,112,40,105,40,46,42,41,32,111,40,46,42,41,32,115,40,46,42,41,41,0,0,0,0,73,115,69,81,65,99,99,117,109,117,108,97,116,111,114,0,112,40,105,40,46,71,101,110,101,114,105,99,66,105,110,79,112,41,41,0,0,0,0,0,73,115,78,69,65,99,99,117,109,117,108,97,116,111,114,0,73,115,76,84,65,99,99,117,109,117,108,97,116,111,114,0,73,115,71,84,65,99,99,117,109,117,108,97,116,111,114,0,73,115,76,69,65,99,99,117], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([109,117,108,97,116,111,114,0,73,115,71,69,65,99,99,117,109,117,108,97,116,111,114,0,112,40,105,40,46,65,114,114,97,121,41,44,32,105,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,112,40,105,40,46,65,114,114,97,121,41,44,32,105,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,32,115,40,46,42,41,41,0,0,0,112,40,105,40,46,65,114,114,97,121,41,44,32,111,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,112,40,105,40,46,42,41,32,105,40,46,65,114,114,97,121,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,42,41,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,0,0,0,0,0,112,40,105,40,46,65,114,114,97,121,41,44,32,111,40,46,65,114,114,97,121,41,32,115,40,46,42,41,41,0,0,0,97,114,114,97,121,45,62,84,121,112,101,40,41,45,62,82,97,110,107,40,41,32,61,61,32,49,0,0,0,0,0,0,82,101,112,108,97,99,101,83,117,98,115,116,114,105,110,103,0,0,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,0,83,101,97,114,99,104,65,110,100,82,101,112,108,97,99,101,83,116,114,105,110,103,0,0,112,40,111,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,66,111,111,108,101,97,110,41,32,105,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,83,101,97,114,99,104,83,112,108,105,116,83,116,114,105,110,103,0,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,114,105,110,103,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,83,116,114,105,110,103,84,111,85,112,112,101,114,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,0,0,0,83,116,114,105,110,103,84,111,76,111,119,101,114,0,0,0,83,116,114,105,110,103,67,111,110,99,97,116,101,110,97,116,101,0,0,0,0,0,0,0,112,40,105,40,46,86,97,114,65,114,103,67,111,117,110,116,41,32,105,40,46,83,116,114,105,110,103,41,32,111,40,46,65,114,114,97,121,41,41,0,66,114,97,110,99,104,73,102,69,81,83,116,114,105,110,103,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,83,116,114,105,110,103,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,83,116,114,105,110,103,0,0,0,0,0,0,0,0,115,116,114,105,110,103,73,110,32,33,61,32,109,97,116,99,104,80,108,117,115,82,101,115,116,83,116,114,105,110,103,0,115,116,114,105,110,103,73,110,32,33,61,32,115,116,114,105,110,103,79,117,116,0,0,0,115,101,97,114,99,104,83,116,114,105,110,103,32,33,61,32,115,116,114,105,110,103,79,117,116,0,0,0,0,0,0,0,114,101,112,108,97,99,101,109,101,110,116,83,116,114,105,110,103,32,61,61,32,110,117,108,108,32,124,124,32,114,101,112,108,97,99,101,109,101,110,116,83,116,114,105,110,103,32,33,61,32,115,116,114,105,110,103,79,117,116,0,0,0,0,0,115,116,114,105,110,103,73,110,32,33,61,32,114,101,115,117,108,116,83,116,114,105,110,103,32,38,38,32,115,116,114,105,110,103,73,110,32,33,61,32,114,101,112,108,97,99,101,100,83,117,98,83,116,114,105,110,103,0,0,0,0,0,0,0,114,101,112,108,97,99,101,109,101,110,116,83,116,114,105,110,103,32,61,61,32,110,117,108,108,32,124,124,32,40,114,101,112,108,97,99,101,109,101,110,116,83,116,114,105,110,103,32,33,61,32,114,101,115,117,108,116,83,116,114,105,110,103,32,38,38,32,114,101,112,108,97,99,101,109,101,110,116,83,116,114,105,110,103,32,33,61,32,114,101,112,108,97,99,101,100,83,117,98,83,116,114,105,110,103,41,0,0,0,0,0,0,85,110,79,112,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,120,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,66,105,110,79,112,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,120,41,32,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,121,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,67,111,109,112,108,101,120,68,111,117,98,108,101,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,0,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,65,100,100,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,83,117,98,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,77,117,108,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,68,105,118,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,83,105,103,110,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,78,111,114,109,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,68,111,117,98,108,101,41,41,0,0,80,104,97,115,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,67,111,110,106,117,103,97,116,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,83,113,117,97,114,101,82,111,111,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,83,105,110,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,84,97,110,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,83,101,99,97,110,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,67,111,115,101,99,97,110,116,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,76,111,103,49,48,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,76,111,103,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,76,111,103,50,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,69,120,112,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,80,111,119,67,111,109,112,108,101,120,68,111,117,98,108,101,0,0,0,0,0,0,0,0,85,110,79,112,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,120,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,66,105,110,79,112,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,120,41,32,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,121,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,67,111,109,112,108,101,120,83,105,110,103,108,101,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,73,110,116,56,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,0,73,110,116,49,54,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,65,100,100,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,83,117,98,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,77,117,108,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,68,105,118,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,83,105,103,110,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,78,111,114,109,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,32,111,40,46,67,111,109,112,108,101,120,83,105,110,103,108,101,41,41,0,0,80,104,97,115,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,67,111,110,106,117,103,97,116,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,83,113,117,97,114,101,82,111,111,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,83,105,110,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,84,97,110,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,83,101,99,97,110,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,67,111,115,101,99,97,110,116,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,76,111,103,49,48,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,76,111,103,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,76,111,103,50,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,69,120,112,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,80,111,119,67,111,109,112,108,101,120,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,105,110,79,112,66,111,111,108,101,97,110,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,44,120,41,32,105,40,46,66,111,111,108,101,97,110,32,121,41,32,111,40,46,66,111,111,108,101,97,110,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,85,110,79,112,66,111,111,108,101,97,110,0,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,44,120,41,32,111,40,46,66,111,111,108,101,97,110,32,114,101,115,117,108,116,41,41,0,0,0,0,0,85,110,79,112,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,32,120,41,32,111,40,46,85,73,110,116,56,32,114,101,115,117,108,116,41,41,0,66,105,110,79,112,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,32,120,41,32,105,40,46,85,73,110,116,56,32,121,41,32,111,40,46,85,73,110,116,56,32,114,101,115,117,108,116,41,41,0,0,0,0,0,85,110,79,112,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,32,120,41,32,111,40,46,85,73,110,116,49,54,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,32,120,41,32,105,40,46,85,73,110,116,49,54,32,121,41,32,111,40,46,85,73,110,116,49,54,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,32,120,41,32,111,40,46,85,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,32,120,41,32,105,40,46,85,73,110,116,51,50,32,121,41,32,111,40,46,85,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,32,120,41,32,111,40,46,85,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,32,120,41,32,105,40,46,85,73,110,116,54,52,32,121,41,32,111,40,46,85,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,32,120,41,111,40,46,73,110,116,56,32,114,101,115,117,108,116,41,41,0,0,0,0,66,105,110,79,112,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,32,120,41,105,40,46,73,110,116,56,44,121,41,111,40,46,73,110,116,56,32,114,101,115,117,108,116,41,41,0,0,85,110,79,112,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,32,120,41,32,111,40,46,73,110,116,49,54,44,114,101,115,117,108,116,41,41,0,66,105,110,79,112,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,32,120,41,32,105,40,46,73,110,116,49,54,32,121,41,111,40,46,73,110,116,49,54,32,114,101,115,117,108,116,41,41,0,0,0,0,0,0,85,110,79,112,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,32,120,41,32,111,40,46,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,66,105,110,79,112,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,32,120,41,32,105,40,46,73,110,116,51,50,32,121,41,32,111,40,46,73,110,116,51,50,32,114,101,115,117,108,116,41,41,0,0,0,0,0,85,110,79,112,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,32,120,41,32,111,40,46,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,66,105,110,79,112,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,32,120,41,32,105,40,46,73,110,116,54,52,32,121,41,32,111,40,46,73,110,116,54,52,32,114,101,115,117,108,116,41,41,0,0,0,0,0,65,110,100,66,111,111,108,101,97,110,0,0,0,0,0,0,46,66,105,110,79,112,66,111,111,108,101,97,110,0,0,0,79,114,66,111,111,108,101,97,110,0,0,0,0,0,0,0,78,111,114,66,111,111,108,101,97,110,0,0,0,0,0,0,78,97,110,100,66,111,111,108,101,97,110,0,0,0,0,0,88,111,114,66,111,111,108,101,97,110,0,0,0,0,0,0,78,111,116,66,111,111,108,101,97,110,0,0,0,0,0,0,66,114,97,110,99,104,73,102,84,114,117,101,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,66,111,111,108,101,97,110,41,41,0,66,114,97,110,99,104,73,102,70,97,108,115,101,0,0,0,73,115,76,84,66,111,111,108,101,97,110,0,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,41,32,105,40,46,66,111,111,108,101,97,110,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,73,115,76,69,66,111,111,108,101,97,110,0,0,0,0,0,73,115,69,81,66,111,111,108,101,97,110,0,0,0,0,0,73,115,78,69,66,111,111,108,101,97,110,0,0,0,0,0,73,115,71,84,66,111,111,108,101,97,110,0,0,0,0,0,73,115,71,69,66,111,111,108,101,97,110,0,0,0,0,0,65,100,100,85,73,110,116,56,0,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,56,0,0,0,0,0,83,117,98,85,73,110,116,56,0,0,0,0,0,0,0,0,77,117,108,85,73,110,116,56,0,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,56,0,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,56,0,0,0,0,0,0,77,111,100,85,73,110,116,56,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,56,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,56,0,0,83,112,108,105,116,85,73,110,116,56,0,0,0,0,0,0,74,111,105,110,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,65,110,100,85,73,110,116,56,0,0,0,0,0,0,0,0,79,114,85,73,110,116,56,0,78,111,114,85,73,110,116,56,0,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,56,0,0,0,0,0,0,0,88,111,114,85,73,110,116,56,0,0,0,0,0,0,0,0,78,111,116,85,73,110,116,56,0,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,85,73,110,116,56,0,0,0,0,0,0,0,73,115,69,81,85,73,110,116,56,0,0,0,0,0,0,0,73,115,78,69,85,73,110,116,56,0,0,0,0,0,0,0,73,115,71,84,85,73,110,116,56,0,0,0,0,0,0,0,73,115,71,69,85,73,110,116,56,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,56,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,41,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,56,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,56,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,56,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,56,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,56,0,85,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,51,50,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,54,52,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,56,41,41,0,0,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,49,54,41,41,0,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,51,50,41,41,0,0,85,73,110,116,56,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,73,110,116,54,52,41,41,0,0,85,73,110,116,56,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,83,105,110,103,108,101,41,41,0,85,73,110,116,56,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,56,41,32,111,40,46,68,111,117,98,108,101,41,41,0,65,100,100,85,73,110,116,49,54,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,49,54,0,0,0,0,83,117,98,85,73,110,116,49,54,0,0,0,0,0,0,0,77,117,108,85,73,110,116,49,54,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,49,54,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,49,54,0,0,0,0,0,77,111,100,85,73,110,116,49,54,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,49,54,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,49,54,0,83,112,108,105,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,0,0,0,0,74,111,105,110,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,65,110,100,85,73,110,116,49,54,0,0,0,0,0,0,0,79,114,85,73,110,116,49,54,0,0,0,0,0,0,0,0,78,111,114,85,73,110,116,49,54,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,49,54,0,0,0,0,0,0,88,111,114,85,73,110,116,49,54,0,0,0,0,0,0,0,78,111,116,85,73,110,116,49,54,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,85,73,110,116,49,54,0,0,0,0,0,0,73,115,69,81,85,73,110,116,49,54,0,0,0,0,0,0,73,115,78,69,85,73,110,116,49,54,0,0,0,0,0,0,73,115,71,84,85,73,110,116,49,54,0,0,0,0,0,0,73,115,71,69,85,73,110,116,49,54,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,49,54,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,49,54,41,32,105,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,49,54,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,49,54,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,56,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,56,41,41,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,49,54,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,51,50,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,73,110,116,54,52,41,41,0,85,73,110,116,49,54,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,85,73,110,116,49,54,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,49,54,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,100,100,85,73,110,116,51,50,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,51,50,0,0,0,0,83,117,98,85,73,110,116,51,50,0,0,0,0,0,0,0,77,117,108,85,73,110,116,51,50,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,51,50,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,51,50,0,0,0,0,0,77,111,100,85,73,110,116,51,50,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,51,50,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,51,50,0,83,112,108,105,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,74,111,105,110,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,65,110,100,85,73,110,116,51,50,0,0,0,0,0,0,0,79,114,85,73,110,116,51,50,0,0,0,0,0,0,0,0,78,111,114,85,73,110,116,51,50,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,51,50,0,0,0,0,0,0,88,111,114,85,73,110,116,51,50,0,0,0,0,0,0,0,78,111,116,85,73,110,116,51,50,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,85,73,110,116,51,50,0,0,0,0,0,0,73,115,69,81,85,73,110,116,51,50,0,0,0,0,0,0,73,115,78,69,85,73,110,116,51,50,0,0,0,0,0,0,73,115,71,84,85,73,110,116,51,50,0,0,0,0,0,0,73,115,71,69,85,73,110,116,51,50,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,51,50,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,51,50,41,32,105,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,51,50,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,51,50,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,56,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,56,41,41,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,49,54,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,73,110,116,54,52,41,41,0,85,73,110,116,51,50,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,85,73,110,116,51,50,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,100,100,85,73,110,116,54,52,0,0,0,0,0,0,0,46,66,105,110,79,112,85,73,110,116,54,52,0,0,0,0,83,117,98,85,73,110,116,54,52,0,0,0,0,0,0,0,77,117,108,85,73,110,116,54,52,0,0,0,0,0,0,0,83,105,103,110,85,73,110,116,54,52,0,0,0,0,0,0,46,85,110,79,112,85,73,110,116,54,52,0,0,0,0,0,77,111,100,85,73,110,116,54,52,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,85,73,110,116,54,52,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,82,101,109,97,105,110,100,101,114,85,73,110,116,54,52,0,83,112,108,105,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,105,40,46], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,65,110,100,85,73,110,116,54,52,0,0,0,0,0,0,0,79,114,85,73,110,116,54,52,0,0,0,0,0,0,0,0,78,111,114,85,73,110,116,54,52,0,0,0,0,0,0,0,78,97,110,100,85,73,110,116,54,52,0,0,0,0,0,0,88,111,114,85,73,110,116,54,52,0,0,0,0,0,0,0,78,111,116,85,73,110,116,54,52,0,0,0,0,0,0,0,73,115,76,84,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,85,73,110,116,54,52,0,0,0,0,0,0,73,115,69,81,85,73,110,116,54,52,0,0,0,0,0,0,73,115,78,69,85,73,110,116,54,52,0,0,0,0,0,0,73,115,71,84,85,73,110,116,54,52,0,0,0,0,0,0,73,115,71,69,85,73,110,116,54,52,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,85,73,110,116,54,52,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,85,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,85,73,110,116,54,52,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,85,73,110,116,54,52,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,56,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,56,41,41,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,49,54,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,51,50,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,73,110,116,54,52,41,41,0,85,73,110,116,54,52,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,85,73,110,116,54,52,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,85,73,110,116,54,52,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,100,100,73,110,116,56,0,46,66,105,110,79,112,73,110,116,56,0,0,0,0,0,0,83,117,98,73,110,116,56,0,77,117,108,73,110,116,56,0,83,105,103,110,73,110,116,56,0,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,56,0,0,0,0,0,0,0,77,111,100,73,110,116,56,0,81,117,111,116,105,101,110,116,73,110,116,56,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,56,41,41,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,56,0,0,0,83,112,108,105,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,74,111,105,110,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,65,98,115,111,108,117,116,101,73,110,116,56,0,0,0,0,65,110,100,73,110,116,56,0,79,114,73,110,116,56,0,0,78,111,114,73,110,116,56,0,78,97,110,100,73,110,116,56,0,0,0,0,0,0,0,0,88,111,114,73,110,116,56,0,78,111,116,73,110,116,56,0,73,115,76,84,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,0,0,73,115,76,69,73,110,116,56,0,0,0,0,0,0,0,0,73,115,69,81,73,110,116,56,0,0,0,0,0,0,0,0,73,115,78,69,73,110,116,56,0,0,0,0,0,0,0,0,73,115,71,84,73,110,116,56,0,0,0,0,0,0,0,0,73,115,71,69,73,110,116,56,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,56,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,56,41,32,105,40,46,73,110,116,56,41,41,0,0,0,66,114,97,110,99,104,73,102,71,69,73,110,116,56,0,0,66,114,97,110,99,104,73,102,76,84,73,110,116,56,0,0,66,114,97,110,99,104,73,102,76,69,73,110,116,56,0,0,66,114,97,110,99,104,73,102,69,81,73,110,116,56,0,0,66,114,97,110,99,104,73,102,78,69,73,110,116,56,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,49,54,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,73,110,116,54,52,41,41,0,0,0,73,110,116,56,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,73,110,116,56,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,56,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,65,100,100,73,110,116,49,54,0,0,0,0,0,0,0,0,46,66,105,110,79,112,73,110,116,49,54,0,0,0,0,0,83,117,98,73,110,116,49,54,0,0,0,0,0,0,0,0,77,117,108,73,110,116,49,54,0,0,0,0,0,0,0,0,83,105,103,110,73,110,116,49,54,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,49,54,0,0,0,0,0,0,77,111,100,73,110,116,49,54,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,73,110,116,49,54,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,49,54,0,0,83,112,108,105,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,85,73,110,116,56,41,32,111,40,46,85,73,110,116,56,41,41,0,0,0,0,0,0,0,0,74,111,105,110,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,73,110,116,49,54,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,49,54,41,41,0,0,65,110,100,73,110,116,49,54,0,0,0,0,0,0,0,0,79,114,73,110,116,49,54,0,78,111,114,73,110,116,49,54,0,0,0,0,0,0,0,0,78,97,110,100,73,110,116,49,54,0,0,0,0,0,0,0,88,111,114,73,110,116,49,54,0,0,0,0,0,0,0,0,78,111,116,73,110,116,49,54,0,0,0,0,0,0,0,0,73,115,76,84,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,73,110,116,49,54,0,0,0,0,0,0,0,73,115,69,81,73,110,116,49,54,0,0,0,0,0,0,0,73,115,78,69,73,110,116,49,54,0,0,0,0,0,0,0,73,115,71,84,73,110,116,49,54,0,0,0,0,0,0,0,73,115,71,69,73,110,116,49,54,0,0,0,0,0,0,0,66,111,111,108,101,97,110,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,41,32,111,40,46,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,49,54,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,49,54,41,32,105,40,46,73,110,116,49,54,41,41,0,66,114,97,110,99,104,73,102,71,69,73,110,116,49,54,0,66,114,97,110,99,104,73,102,76,84,73,110,116,49,54,0,66,114,97,110,99,104,73,102,76,69,73,110,116,49,54,0,66,114,97,110,99,104,73,102,69,81,73,110,116,49,54,0,66,114,97,110,99,104,73,102,78,69,73,110,116,49,54,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,56,41,41,0,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,51,50,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,85,73,110,116,54,52,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,56,41,41,0,0,0,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,51,50,41,41,0,0,73,110,116,49,54,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,73,110,116,54,52,41,41,0,0,73,110,116,49,54,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,83,105,110,103,108,101,41,41,0,73,110,116,49,54,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,49,54,41,32,111,40,46,68,111,117,98,108,101,41,41,0,65,100,100,73,110,116,51,50,0,0,0,0,0,0,0,0,46,66,105,110,79,112,73,110,116,51,50,0,0,0,0,0,83,117,98,73,110,116,51,50,0,0,0,0,0,0,0,0,77,117,108,73,110,116,51,50,0,0,0,0,0,0,0,0,83,105,103,110,73,110,116,51,50,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,51,50,0,0,0,0,0,0,77,111,100,73,110,116,51,50,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,73,110,116,51,50,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,51,50,0,0,83,112,108,105,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,85,73,110,116,49,54,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,74,111,105,110,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,65,98,115,111,108,117,116,101,73,110,116,51,50,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,0,65,110,100,73,110,116,51,50,0,0,0,0,0,0,0,0,79,114,73,110,116,51,50,0,78,111,114,73,110,116,51,50,0,0,0,0,0,0,0,0,78,97,110,100,73,110,116,51,50,0,0,0,0,0,0,0,88,111,114,73,110,116,51,50,0,0,0,0,0,0,0,0,78,111,116,73,110,116,51,50,0,0,0,0,0,0,0,0,76,111,103,105,99,97,108,83,104,105,102,116,73,110,116,51,50,0,0,0,0,0,0,0,82,111,116,97,116,101,73,110,116,51,50,0,0,0,0,0,73,115,76,84,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,73,110,116,51,50,0,0,0,0,0,0,0,73,115,69,81,73,110,116,51,50,0,0,0,0,0,0,0,73,115,78,69,73,110,116,51,50,0,0,0,0,0,0,0,73,115,71,84,73,110,116,51,50,0,0,0,0,0,0,0,73,115,71,69,73,110,116,51,50,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,51,50,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,41,0,66,114,97,110,99,104,73,102,71,69,73,110,116,51,50,0,66,114,97,110,99,104,73,102,76,84,73,110,116,51,50,0,66,114,97,110,99,104,73,102,76,69,73,110,116,51,50,0,66,114,97,110,99,104,73,102,69,81,73,110,116,51,50,0,66,114,97,110,99,104,73,102,78,69,73,110,116,51,50,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,56,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,49,54,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,85,73,110,116,54,52,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,56,41,41,0,0,0,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,49,54,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,54,52,41,41,0,0,73,110,116,51,50,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,83,105,110,103,108,101,41,41,0,73,110,116,51,50,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,51,50,41,32,111,40,46,68,111,117,98,108,101,41,41,0,65,100,100,73,110,116,54,52,0,0,0,0,0,0,0,0,46,66,105,110,79,112,73,110,116,54,52,0,0,0,0,0,83,117,98,73,110,116,54,52,0,0,0,0,0,0,0,0,77,117,108,73,110,116,54,52,0,0,0,0,0,0,0,0,83,105,103,110,73,110,116,54,52,0,0,0,0,0,0,0,46,85,110,79,112,73,110,116,54,52,0,0,0,0,0,0,77,111,100,73,110,116,54,52,0,0,0,0,0,0,0,0,81,117,111,116,105,101,110,116,73,110,116,54,52,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,82,101,109,97,105,110,100,101,114,73,110,116,54,52,0,0,83,112,108,105,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,85,73,110,116,51,50,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,65,98,115,111,108,117,116,101,73,110,116,54,52,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,54,52,41,41,0,0,65,110,100,73,110,116,54,52,0,0,0,0,0,0,0,0,79,114,73,110,116,54,52,0,78,111,114,73,110,116,54,52,0,0,0,0,0,0,0,0,78,97,110,100,73,110,116,54,52,0,0,0,0,0,0,0,88,111,114,73,110,116,54,52,0,0,0,0,0,0,0,0,78,111,116,73,110,116,54,52,0,0,0,0,0,0,0,0,73,115,76,84,73,110,116,54,52,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,73,110,116,54,52,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,73,115,76,69,73,110,116,54,52,0,0,0,0,0,0,0,73,115,69,81,73,110,116,54,52,0,0,0,0,0,0,0,73,115,78,69,73,110,116,54,52,0,0,0,0,0,0,0,73,115,71,84,73,110,116,54,52,0,0,0,0,0,0,0,73,115,71,69,73,110,116,54,52,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,73,110,116,54,52,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,54,52,41,32,105,40,46,73,110,116,54,52,41,41,0,66,114,97,110,99,104,73,102,71,69,73,110,116,54,52,0,66,114,97,110,99,104,73,102,76,84,73,110,116,54,52,0,66,114,97,110,99,104,73,102,76,69,73,110,116,54,52,0,66,114,97,110,99,104,73,102,69,81,73,110,116,54,52,0,66,114,97,110,99,104,73,102,78,69,73,110,116,54,52,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,56,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,49,54,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,51,50,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,85,73,110,116,54,52,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,56,41,41,0,0,0,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,49,54,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,73,110,116,51,50,41,41,0,0,73,110,116,54,52,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,83,105,110,103,108,101,41,41,0,73,110,116,54,52,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,111,40,46,68,111,117,98,108,101,41,41,0,85,110,79,112,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,44,120,41,44,111,40,46,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,44,120,41,44,105,40,46,83,105,110,103,108,101,44,121,41,44,111,40,46,83,105,110,103,108,101,44,114,101,115,117,108,116,41,41,0,0,65,100,100,83,105,110,103,108,101,0,0,0,0,0,0,0,46,66,105,110,79,112,83,105,110,103,108,101,0,0,0,0,83,117,98,83,105,110,103,108,101,0,0,0,0,0,0,0,77,117,108,83,105,110,103,108,101,0,0,0,0,0,0,0,83,105,103,110,83,105,110,103,108,101,0,0,0,0,0,0,46,85,110,79,112,83,105,110,103,108,101,0,0,0,0,0,68,105,118,83,105,110,103,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,83,105,110,103,108,101,0,0,0,0,83,105,110,101,83,105,110,103,108,101,0,0,0,0,0,0,84,97,110,103,101,110,116,83,105,110,103,108,101,0,0,0,83,101,99,97,110,116,83,105,110,103,108,101,0,0,0,0,67,111,115,101,99,97,110,116,83,105,110,103,108,101,0,0,76,111,103,49,48,83,105,110,103,108,101,0,0,0,0,0,76,111,103,83,105,110,103,108,101,0,0,0,0,0,0,0,76,111,103,50,83,105,110,103,108,101,0,0,0,0,0,0,69,120,112,83,105,110,103,108,101,0,0,0,0,0,0,0,83,113,117,97,114,101,82,111,111,116,83,105,110,103,108,101,0,0,0,0,0,0,0,0,80,111,119,83,105,110,103,108,101,0,0,0,0,0,0,0,65,114,99,83,105,110,101,83,105,110,103,108,101,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,65,114,99,67,111,115,105,110,101,83,105,110,103,108,101,0,65,114,99,84,97,110,83,105,110,103,108,101,0,0,0,0,65,114,99,84,97,110,50,83,105,110,103,108,101,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,105,40,46,83,105,110,103,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,67,101,105,108,83,105,110,103,108,101,0,0,0,0,0,0,65,98,115,111,108,117,116,101,83,105,110,103,108,101,0,0,70,108,111,111,114,83,105,110,103,108,101,0,0,0,0,0,81,117,111,116,105,101,110,116,83,105,110,103,108,101,0,0,82,101,109,97,105,110,100,101,114,83,105,110,103,108,101,0,73,115,76,84,83,105,110,103,108,101,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,105,40,46,83,105,110,103,108,101,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,83,105,110,103,108,101,0,0,0,0,0,0,73,115,69,81,83,105,110,103,108,101,0,0,0,0,0,0,73,115,78,69,83,105,110,103,108,101,0,0,0,0,0,0,73,115,71,84,83,105,110,103,108,101,0,0,0,0,0,0,73,115,71,69,83,105,110,103,108,101,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,83,105,110,103,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,83,105,110,103,108,101,41,32,105,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,83,105,110,103,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,83,105,110,103,108,101,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,83,105,110,103,108,101,67,111,110,118,101,114,116,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,83,105,110,103,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,85,110,79,112,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,44,120,41,44,111,40,46,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,0,0,0,0,0,0,66,105,110,79,112,68,111,117,98,108,101,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,44,120,41,44,105,40,46,68,111,117,98,108,101,44,121,41,44,111,40,46,68,111,117,98,108,101,44,114,101,115,117,108,116,41,41,0,0,69,0,0,0,0,0,0,0,100,118,40,46,68,111,117,98,108,101,32,32,50,46,55,49,56,50,56,49,56,50,56,52,53,57,48,52,53,49,41,0,80,105,0,0,0,0,0,0,100,118,40,46,68,111,117,98,108,101,32,32,51,46,49,52,49,53,57,50,54,53,51,53,56,57,55,57,51,49,41,0,84,97,117,0,0,0,0,0,100,118,40,46,68,111,117,98,108,101,32,32,54,46,50,56,51,49,56,53,51,48,55,49,55,57,53,56,54,41,0,0,65,100,100,68,111,117,98,108,101,0,0,0,0,0,0,0,46,66,105,110,79,112,68,111,117,98,108,101,0,0,0,0,83,117,98,68,111,117,98,108,101,0,0,0,0,0,0,0,77,117,108,68,111,117,98,108,101,0,0,0,0,0,0,0,83,105,103,110,68,111,117,98,108,101,0,0,0,0,0,0,46,85,110,79,112,68,111,117,98,108,101,0,0,0,0,0,68,105,118,68,111,117,98,108,101,0,0,0,0,0,0,0,67,111,115,105,110,101,68,111,117,98,108,101,0,0,0,0,83,105,110,101,68,111,117,98,108,101,0,0,0,0,0,0,84,97,110,103,101,110,116,68,111,117,98,108,101,0,0,0,83,101,99,97,110,116,68,111,117,98,108,101,0,0,0,0,67,111,115,101,99,97,110,116,68,111,117,98,108,101,0,0,76,111,103,49,48,68,111,117,98,108,101,0,0,0,0,0,76,111,103,68,111,117,98,108,101,0,0,0,0,0,0,0,76,111,103,50,68,111,117,98,108,101,0,0,0,0,0,0,69,120,112,68,111,117,98,108,101,0,0,0,0,0,0,0,83,113,117,97,114,101,82,111,111,116,68,111,117,98,108,101,0,0,0,0,0,0,0,0,80,111,119,68,111,117,98,108,101,0,0,0,0,0,0,0,65,114,99,83,105,110,101,68,111,117,98,108,101,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,0,65,114,99,67,111,115,105,110,101,68,111,117,98,108,101,0,65,114,99,84,97,110,68,111,117,98,108,101,0,0,0,0,65,114,99,84,97,110,50,68,111,117,98,108,101,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,67,101,105,108,68,111,117,98,108,101,0,0,0,0,0,0,65,98,115,111,108,117,116,101,68,111,117,98,108,101,0,0,70,108,111,111,114,68,111,117,98,108,101,0,0,0,0,0,81,117,111,116,105,101,110,116,68,111,117,98,108,101,0,0,82,101,109,97,105,110,100,101,114,68,111,117,98,108,101,0,73,115,76,84,68,111,117,98,108,101,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,73,115,76,69,68,111,117,98,108,101,0,0,0,0,0,0,73,115,69,81,68,111,117,98,108,101,0,0,0,0,0,0,73,115,78,69,68,111,117,98,108,101,0,0,0,0,0,0,73,115,71,84,68,111,117,98,108,101,0,0,0,0,0,0,73,115,71,69,68,111,117,98,108,101,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,84,68,111,117,98,108,101,0,0,0,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,71,69,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,84,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,76,69,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,69,81,68,111,117,98,108,101,0,0,0,0,0,0,0,0,66,114,97,110,99,104,73,102,78,69,68,111,117,98,108,101,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,56,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,56,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,49,54,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,49,54,41,41,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,51,50,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,85,73,110,116,54,52,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,0,0,0,0,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,56,0,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,56,41,41,0,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,49,54,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,49,54,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,51,50,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,51,50,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,73,110,116,54,52,0,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,73,110,116,54,52,41,41,0,68,111,117,98,108,101,67,111,110,118,101,114,116,83,105,110,103,108,101,0,0,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,111,40,46,83,105,110,103,108,101,41,41,0,0,0,0,0,0,0,0,82,97,110,100,111,109,0,0,112,40,111,40,46,68,111,117,98,108,101,41,41,0,0,0,73,115,76,84,85,116,102,56,67,104,97,114,0,0,0,0,112,40,105,40,46,85,116,102,56,67,104,97,114,41,32,105,40,46,85,116,102,56,67,104,97,114,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,0,0,0,0,73,115,76,69,85,116,102,56,67,104,97,114,0,0,0,0,73,115,69,81,85,116,102,56,67,104,97,114,0,0,0,0,73,115,78,69,85,116,102,56,67,104,97,114,0,0,0,0,73,115,71,84,85,116,102,56,67,104,97,114,0,0,0,0,73,115,71,69,85,116,102,56,67,104,97,114,0,0,0,0,0,0,0,0,0,0,0,0,65,114,114,97,121,70,105,108,108,0,0,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,42,41,41,0,0,0,0,65,114,114,97,121,67,97,112,97,99,105,116,121,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,111,40,46,73,110,116,51,50,41,41,0,0,65,114,114,97,121,76,101,110,103,116,104,0,0,0,0,0,65,114,114,97,121,82,97,110,107,0,0,0,0,0,0,0,65,114,114,97,121,82,101,115,105,122,101,0,0,0,0,0,112,40,105,111,40,46,65,114,114,97,121,41,32,111,40,46,73,110,116,51,50,41,41,0,65,114,114,97,121,73,110,100,101,120,69,108,116,0,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,42,41,41,0,0,0,0,65,114,114,97,121,65,112,112,101,110,100,69,108,116,0,0,112,40,105,40,46,65,114,114,97,121,41,32,105,40,46,42,41,41,0,0,0,0,0,0,65,114,114,97,121,82,101,112,108,97,99,101,69,108,116,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,42,41,41,0,0,65,114,114,97,121,82,101,112,108,97,99,101,83,117,98,115,101,116,0,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,65,114,114,97,121,41,41,0,0,0,0,0,0,65,114,114,97,121,83,117,98,115,101,116,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,65,114,114,97,121,73,110,115,101,114,116,69,108,116,0,0,65,114,114,97,121,73,110,115,101,114,116,83,117,98,115,101,116,0,0,0,0,0,0,0,65,114,114,97,121,82,101,118,101,114,115,101,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,41,0,0,65,114,114,97,121,82,111,116,97,116,101,0,0,0,0,0,112,40,111,40,46,65,114,114,97,121,41,32,105,40,46,65,114,114,97,121,41,32,105,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,97,114,114,97,121,79,117,116,32,33,61,32,97,114,114,97,121,73,110,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,99,111,114,101,47,65,114,114,97,121,46,99,112,112,0,0,0,0,0,0,0,0,97,114,114,97,121,79,117,116,32,33,61,32,115,117,98,65,114,114,97,121,0,0,0,0,97,114,114,97,121,79,117,116,32,33,61,32,97,114,114,97,121,73,110,32,124,124,32,105,100,120,32,61,61,32,48,0,73,110,115,116,114,117,99,116,105,111,110,0,0,0,0,0,73,110,115,116,114,117,99,116,105,111,110,76,105,115,116,0,46,73,110,115,116,114,117,99,116,105,111,110,0,0,0,0,86,73,67,108,117,109,112,0,99,40,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,115,116,114,117,99,116,105,111,110,76,105,115,116,32,67,111,100,101,83,116,97,114,116,41,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,78,101,120,116,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,79,119,110,101,114,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,78,101,120,116,87,97,105,116,105,110,103,67,97,108,108,101,114,41,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,67,97,108,108,101,114,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,115,116,114,117,99,116,105,111,110,32,83,97,118,101,80,67,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,54,52,32,87,97,107,101,85,112,73,110,102,111,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,51,50,32,70,105,114,101,67,111,117,110,116,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,51,50,32,83,104,111,114,116,67,111,117,110,116,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,41,0,0,0,0,0,0,0,0,97,40,99,40,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,32,67,111,110,116,101,120,116,41,32,32,32,32,32,32,32,32,101,40,97,40,46,42,41,32,80,97,114,97,109,66,108,111,99,107,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,97,40,46,42,41,32,68,97,116,97,83,112,97,99,101,41,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,97,40,46,86,73,67,108,117,109,112,32,42,41,32,67,108,117,109,112,115,41,32,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,73,110,116,51,50,32,108,105,110,101,78,117,109,98,101,114,66,97,115,101,41,32,32,32,32,32,32,32,32,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,67,108,117,109,112,83,111,117,114,99,101,66,101,103,105,110,41,32,32,32,32,101,40,46,68,97,116,97,80,111,105,110,116,101,114,32,67,108,117,109,112,83,111,117,114,99,101,69,110,100,41,32,32,41,41,0,0,0,0,0,0,0,46,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,0,0,0,0,0,0,69,110,113,117,101,117,101,82,117,110,81,117,101,117,101,0,112,40,105,40,46,86,105,114,116,117,97,108,73,110,115,116,114,117,109,101,110,116,41,41,0,0,0,0,0,0,0,0,0,0,0,0,136,119,0,0,22,0,0,0,23,0,0,0,39,0,0,0,0,0,0,0,78,53,86,105,114,101,111,50,57,73,110,115,116,114,117,99,116,105,111,110,76,105,115,116,68,97,116,97,80,114,111,99,115,67,108,97,115,115,69,0,78,53,86,105,114,101,111,49,48,73,68,97,116,97,80,114,111,99,115,69,0,0,0,0,128,138,0,0,104,119,0,0,168,138,0,0,64,119,0,0,128,119,0,0,0,0,0,0,0,0,0,0,208,119,0,0,24,0,0,0,25,0,0,0,40,0,0,0,0,0,0,0,78,53,86,105,114,101,111,49,54,86,73,68,97,116,97,80,114,111,99,115,67,108,97,115,115,69,0,0,0,0,0,0,168,138,0,0,176,119,0,0,128,119,0,0,0,0,0,0,84,114,105,103,103,101,114,0,112,40,105,40,46,67,108,117,109,112,41,41,0,0,0,0,87,97,105,116,0,0,0,0,70,111,114,76,111,111,112,84], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20480);
/* memory initializer */ allocate([97,105,108,0,0,0,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,73,110,116,51,50,41,41,0,66,114,97,110,99,104,0,0,112,40,105,40,46,66,114,97,110,99,104,84,97,114,103,101,116,41,41,0,0,0,0,0,112,40,105,40,46,86,73,41,32,105,40,46,73,110,115,116,114,117,99,116,105,111,110,83,110,105,112,112,101,116,32,99,111,112,121,73,110,80,114,111,99,41,32,105,40,46,73,110,115,116,114,117,99,116,105,111,110,83,110,105,112,112,101,116,32,99,111,112,121,79,117,116,80,114,111,99,41,41,0,0,87,97,105,116,77,105,108,108,105,115,101,99,111,110,100,115,0,0,0,0,0,0,0,0,112,40,105,40,46,85,73,110,116,51,50,41,41,0,0,0,87,97,105,116,85,110,116,105,108,77,105,99,114,111,115,101,99,111,110,100,115,0,0,0,112,40,105,40,46,73,110,116,54,52,41,41,0,0,0,0,87,97,105,116,77,105,99,114,111,115,101,99,111,110,100,115,0,0,0,0,0,0,0,0,112,40,41,0,0,0,0,0,83,116,111,112,0,0,0,0,112,40,105,40,46,66,111,111,108,101,97,110,41,41,0,0,114,117,110,110,105,110,103,81,117,101,117,101,69,108,116,32,33,61,32,110,117,108,108,0,40,112,67,97,108,108,73,110,115,116,114,117,99,116,105,111,110,32,33,61,32,110,117,108,108,41,0,0,0,0,0,0,40,113,101,45,62,95,115,104,111,114,116,67,111,117,110,116,32,61,61,32,49,41,0,0,40,113,101,45,62,95,99,97,108,108,101,114,32,61,61,32,110,117,108,108,41,0,0,0,0,0,0,0,0,0,0,0,0,16,48,16,16,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,2,0,2,2,2,2,0,2,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,0,70,108,97,116,116,101,110,84,111,83,116,114,105,110,103,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,105,40,46,66,111,111,108,101,97,110,41,32,111,40,46,83,116,114,105,110,103,41,41,0,85,110,102,108,97,116,116,101,110,70,114,111,109,83,116,114,105,110,103,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,66,111,111,108,101,97,110,41,32,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,83,116,114,105,110,103,41,32,111,40,46,42,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,0,0,0,84,111,83,116,114,105,110,103,0,0,0,0,0,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,105,40,46,73,110,116,49,54,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,70,114,111,109,83,116,114,105,110,103,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,111,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,68,101,99,105,109,97,108,83,116,114,105,110,103,84,111,78,117,109,98,101,114,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,32,105,40,46,73,110,116,51,50,41,32,105,40,46,42,41,32,111,40,46,73,110,116,51,50,41,32,111,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,69,120,112,111,110,101,110,116,105,97,108,83,116,114,105,110,103,84,111,78,117,109,98,101,114,0,0,0,0,0,0,0,84,111,84,121,112,101,65,110,100,68,97,116,97,83,116,114,105,110,103,0,0,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,0,0,0,100,118,40,0,0,0,0,0,0,0,0,0,136,124,0,0,41,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,45,0,0,0,46,0,0,0,47,0,0,0,48,0,0,0,49,0,0,0,50,0,0,0,51,0,0,0,52,0,0,0,53,0,0,0,0,0,0,0,78,53,86,105,114,101,111,50,53,84,68,86,105,97,70,111,114,109,97,116,116,101,114,84,121,112,101,86,105,115,105,116,111,114,69,0,0,0,0,0,78,53,86,105,114,101,111,49,49,84,121,112,101,86,105,115,105,116,111,114,69,0,0,0,128,138,0,0,104,124,0,0,168,138,0,0,64,124,0,0,128,124,0,0,0,0,0,0,99,100,112,40,0,0,0,0,100,118,112,40,0,0,0,0,0,0,0,0,0,0,0,0,97,40,0,0,0,0,0,0,101,113,40,0,0,0,0,0,112,40,0,0,0,0,0,0,99,40,0,0,0,0,0,0,98,99,40,0,0,0,0,0,98,98,40,0,0,0,0,0,66,97,100,84,121,112,101,0,65,108,108,111,99,97,116,105,111,110,83,116,97,116,105,115,116,105,99,115,0,0,0,0,99,40,101,40,46,73,110,116,54,52,32,116,111,116,97,108,65,108,108,111,99,97,116,105,111,110,115,41,32,101,40,46,73,110,116,54,52,32,116,111,116,97,108,65,108,108,111,99,97,116,101,100,41,32,101,40,46,73,110,116,54,52,32,109,97,120,65,108,108,111,99,97,116,101,100,41,32,41,0,0,84,121,112,101,77,97,110,97,103,101,114,65,108,108,111,99,97,116,105,111,110,83,116,97,116,105,115,116,105,99,115,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,111,40,46,65,108,108,111,99,97,116,105,111,110,83,116,97,116,105,115,116,105,99,115,41,41,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,67,117,114,114,101,110,116,84,121,112,101,77,97,110,97,103,101,114,0,0,0,112,40,111,40,46,84,121,112,101,77,97,110,97,103,101,114,41,41,0,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,82,111,111,116,84,121,112,101,77,97,110,97,103,101,114,0,0,0,0,0,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,111,40,46,84,121,112,101,77,97,110,97,103,101,114,41,41,0,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,71,101,116,84,121,112,101,115,0,0,0,0,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,111,40,97,40,46,84,121,112,101,32,42,41,41,41,0,0,0,0,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,68,101,102,105,110,101,84,121,112,101,0,0,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,84,121,112,101,41,41,0,0,84,121,112,101,77,97,110,97,103,101,114,79,98,116,97,105,110,86,97,108,117,101,84,121,112,101,0,0,0,0,0,0,112,40,105,40,46,84,121,112,101,77,97,110,97,103,101,114,41,32,105,40,46,83,116,114,105,110,103,41,32,105,40,46,84,121,112,101,41,32,105,40,46,66,111,111,108,101,97,110,41,32,111,40,46,84,121,112,101,41,41,0,0,0,0,0,84,121,112,101,79,102,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,32,111,40,46,84,121,112,101,41,41,0,0,0,0,0,0,0,84,121,112,101,84,111,112,65,81,83,105,122,101,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,73,110,116,51,50,41,41,0,0,0,84,121,112,101,65,108,105,103,110,109,101,110,116,0,0,0,84,121,112,101,69,110,99,111,100,105,110,103,0,0,0,0,84,121,112,101,73,115,70,108,97,116,0,0,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,66,111,111,108,101,97,110,41,41,0,84,121,112,101,73,115,65,114,114,97,121,0,0,0,0,0,84,121,112,101,72,97,115,67,117,115,116,111,109,68,101,102,97,117,108,116,0,0,0,0,84,121,112,101,72,97,115,80,97,100,100,105,110,103,0,0,84,121,112,101,72,97,115,71,101,110,101,114,105,99,84,121,112,101,0,0,0,0,0,0,84,121,112,101,71,101,116,78,97,109,101,0,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,83,116,114,105,110,103,41,41,0,0,84,121,112,101,71,101,116,69,108,101,109,101,110,116,78,97,109,101,0,0,0,0,0,0,84,121,112,101,66,97,115,101,84,121,112,101,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,84,121,112,101,41,41,0,0,0,0,84,121,112,101,85,115,97,103,101,84,121,112,101,0,0,0,84,121,112,101,83,117,98,69,108,101,109,101,110,116,67,111,117,110,116,0,0,0,0,0,84,121,112,101,71,101,116,83,117,98,69,108,101,109,101,110,116,0,0,0,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,105,40,46,73,110,116,51,50,41,32,111,40,46,84,121,112,101,41,41,0,0,84,121,112,101,71,101,116,83,117,98,69,108,101,109,101,110,116,66,121,78,97,109,101,0,112,40,105,40,46,84,121,112,101,41,32,105,40,46,83,116,114,105,110,103,41,32,111,40,46,84,121,112,101,41,41,0,84,121,112,101,83,101,116,86,97,108,117,101,0,0,0,0,112,40,105,111,40,46,84,121,112,101,41,32,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,84,121,112,101,71,101,116,86,97,108,117,101,0,0,0,0,112,40,105,40,46,84,121,112,101,41,32,111,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,0,84,121,112,101,87,114,105,116,101,86,97,108,117,101,0,0,105,110,100,101,120,32,62,61,32,48,0,0,0,0,0,0,69,108,101,109,101,110,116,84,121,112,101,40,41,32,33,61,32,110,117,108,108,0,0,0,98,101,103,105,110,32,60,61,32,95,112,82,97,119,66,117,102,102,101,114,69,110,100,0,95,116,121,112,101,82,101,102,45,62,82,97,110,107,40,41,32,61,61,32,48,0,0,0,84,121,112,101,77,97,110,97,103,101,114,83,99,111,112,101,58,58,84,104,114,101,97,100,115,84,121,112,101,77,97,110,97,103,101,114,32,33,61,32,110,117,108,108,0,0,0,0,101,120,99,101,101,100,101,100,32,97,108,108,111,99,97,116,105,111,110,32,108,105,109,105,116,0,0,0,0,0,0,0,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,82,101,102,101,114,114,105,110,103,32,116,111,32,97,110,32,97,108,114,101,97,100,121,32,101,120,105,115,116,105,110,103,32,116,121,112,101,0,0,0,0,40,69,114,114,111,114,32,34,84,111,111,32,109,97,110,121,32,102,111,114,119,97,114,100,32,112,97,116,99,104,101,115,34,41,0,0,0,0,0,0,40,69,114,114,111,114,32,115,105,109,112,108,101,32,101,108,101,109,101,110,116,32,116,121,112,101,32,110,111,116,32,97,108,108,111,119,101,100,32,105,110,32,80,97,114,97,109,66,108,111,99,107,41,0,0,0,40,69,114,114,111,114,32,73,109,109,101,100,105,97,116,101,32,77,111,100,101,32,84,121,112,101,32,105,115,32,116,111,111,32,108,97,114,103,101,32,102,111,114,32,112,97,114,97,109,32,98,108,111,99,107,41,0,0,0,0,0,0,0,0,69,83,32,68,101,108,101,116,101,32,98,101,103,105,110,0,69,83,32,68,101,108,101,116,101,32,101,110,100,0,0,0,39,40,39,32,109,105,115,115,105,110,103,0,0,0,0,0,39,41,39,32,109,105,115,115,105,110,103,0,0,0,0,0,67,97,110,39,116,32,100,101,102,105,110,101,32,115,121,109,98,111,108,0,0,0,0,0,86,73,32,110,111,116,32,102,111,117,110,100,0,0,0,0,83,116,114,105,110,103,0,0,100,101,102,105,110,101,0,0,116,114,97,99,101,0,0,0,101,110,113,117,101,117,101,0,99,108,101,97,114,0,0,0,101,120,105,116,0,0,0,0,37,46,42,115,0,0,0,0,116,121,112,101,45,62,73,115,65,114,114,97,121,40,41,32,38,38,32,33,116,121,112,101,45,62,73,115,70,108,97,116,40,41,0,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,105,110,99,108,117,100,101,47,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,46,104,0,0,0,0,84,121,112,101,77,97,110,97,103,101,114,83,99,111,112,101,58,58,84,104,114,101,97,100,115,84,121,112,101,77,97,110,97,103,101,114,32,33,61,32,110,117,108,108,0,0,0,0,46,46,47,115,111,117,114,99,101,47,105,110,99,108,117,100,101,47,84,121,112,101,65,110,100,68,97,116,97,77,97,110,97,103,101,114,46,104,0,0,98,97,100,32,101,103,103,0,99,104,105,114,112,32,99,104,105,114,112,0,0,0,0,0,192,30,0,0,66,0,0,0,96,132,0,0,0,0,0,0,84,105,109,101,0,0,0,0,71,101,116,84,105,99,107,67,111,117,110,116,0,0,0,0,112,40,111,40,46,73,110,116,54,52,41,41,0,0,0,0,71,101,116,77,105,99,114,111,115,101,99,111,110,100,84,105,99,107,67,111,117,110,116,0,71,101,116,77,105,108,108,105,115,101,99,111,110,100,84,105,99,107,67,111,117,110,116,0,112,40,111,40,46,85,73,110,116,51,50,41,41,0,0,0,65,84,105,109,101,70,114,111,109,68,111,117,98,108,101,68,111,117,98,108,101,0,0,0,112,40,105,40,46,68,111,117,98,108,101,41,32,105,40,46,68,111,117,98,108,101,41,32,111,40,46,84,105,109,101,41,41,0,0,0,0,0,0,0,65,84,105,109,101,71,101,116,83,101,99,111,110,100,115,68,111,117,98,108,101,0,0,0,112,40,105,40,46,84,105,109,101,41,32,111,40,46,68,111,117,98,108,101,41,41,0,0,65,84,105,109,101,71,101,116,70,114,97,99,116,105,111,110,68,111,117,98,108,101,0,0,65,84,105,109,101,70,114,111,109,73,110,116,54,52,85,73,110,116,54,52,0,0,0,0,112,40,105,40,46,73,110,116,54,52,41,32,105,40,46,85,73,110,116,54,52,41,32,111,40,46,84,105,109,101,41,41,0,0,0,0,0,0,0,0,65,84,105,109,101,71,101,116,67,117,114,114,101,110,116,0,112,40,111,40,46,84,105,109,101,41,41,0,0,0,0,0,65,84,105,109,101,71,101,116,83,101,99,111,110,100,115,73,110,116,54,52,0,0,0,0,112,40,105,40,46,84,105,109,101,41,32,111,40,46,73,110,116,54,52,41,41,0,0,0,65,84,105,109,101,71,101,116,70,114,97,99,116,105,111,110,85,73,110,116,54,52,0,0,112,40,105,40,46,84,105,109,101,41,32,111,40,46,85,73,110,116,54,52,41,41,0,0,65,84,105,109,101,83,101,116,83,101,99,111,110,100,115,73,110,116,54,52,0,0,0,0,65,84,105,109,101,83,101,116,70,114,97,99,116,105,111,110,85,73,110,116,54,52,0,0,80,132,0,0,67,0,0,0,80,134,0,0,0,0,0,0,76,97,98,86,73,69,87,95,67,97,110,118,97,115,50,68,0,0,0,0,0,0,0,0,67,97,110,118,97,115,50,68,0,0,0,0,0,0,0,0,46,73,110,116,51,50,0,0,67,97,110,118,97,115,95,77,111,118,101,84,111,0,0,0,112,40,105,40,46,67,97,110,118,97,115,50,68,41,105,40,46,68,111,117,98,108,101,41,105,40,46,68,111,117,98,108,101,41,41,0,0,0,0,0,67,97,110,118,97,115,95,76,105,110,101,84,111,0,0,0,67,97,110,118,97,115,95,83,116,114,111,107,101,0,0,0,112,40,105,40,46,67,97,110,118,97,115,50,68,41,41,0,77,111,118,101,32,116,111,32,0,0,0,0,0,0,0,0,76,105,110,101,32,116,111,32,0,0,0,0,0,0,0,0,83,116,114,111,107,101,32,0,83,116,114,105,110,103,0,0,64,134,0,0,68,0,0,0,40,135,0,0,0,0,0,0,76,97,98,86,73,69,87,95,70,105,108,101,73,79,0,0,116,121,112,101,45,62,73,115,65,114,114,97,121,40,41,32,38,38,32,33,116,121,112,101,45,62,73,115,70,108,97,116,40,41,0,0,0,0,0,0,46,46,47,115,111,117,114,99,101,47,105,110,99,108,117,100,101,47,69,120,101,99,117,116,105,111,110,67,111,110,116,101,120,116,46,104,0,0,0,0,70,105,108,101,72,97,110,100,108,101,0,0,0,0,0,0,46,73,110,116,51,50,0,0,83,116,100,73,110,0,0,0,46,70,105,108,101,72,97,110,100,108,101,0,0,0,0,0,83,116,100,79,117,116,0,0,83,116,100,69,114,114,0,0,80,114,105,110,116,0,0,0,112,40,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,0,0,68,80,114,105,110,116,102,0,112,40,105,40,46,86,97,114,65,114,103,67,111,117,110,116,41,44,105,40,46,83,116,97,116,105,99,83,116,114,105,110,103,41,44,105,40,46,83,116,97,116,105,99,84,121,112,101,65,110,100,68,97,116,97,41,41,0,0,0,0,0,0,0,70,105,108,101,79,112,101,110,0,0,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,44,105,40,46,83,116,114,105,110,103,41,44,105,40,46,73,110,116,51,50,41,44,105,40,46,73,110,116,51,50,41,44,105,40,46,66,111,111,108,101,97,110,41,44,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,105,40,46,66,111,111,108,101,97,110,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,70,105,108,101,83,105,122,101,0,0,0,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,70,105,108,101,68,101,108,101,116,101,0,0,0,0,0,0,112,40,105,40,46,83,116,114,105,110,103,41,44,111,40,46,73,110,116,51,50,41,41,0,83,116,114,101,97,109,67,108,111,115,101,0,0,0,0,0,83,116,114,101,97,109,83,101,116,80,111,115,105,116,105,111,110,0,0,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,105,40,46,73,110,116,51,50,41,44,105,40,46,73,110,116,51,50,41,44,111,40,46,73,110,116,51,50,41,41,0,83,116,114,101,97,109,82,101,97,100,0,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,111,40,46,83,116,114,105,110,103,41,44,111,40,46,73,110,116,51,50,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,83,116,114,101,97,109,87,114,105,116,101,0,0,0,0,0,112,40,105,40,46,70,105,108,101,72,97,110,100,108,101,41,44,105,40,46,83,116,114,105,110,103,41,44,105,40,46,73,110,116,51,50,41,44,111,40,46,73,110,116,51,50,41,41,0,0,0,0,0,0,0,0,37,46,42,115,10,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,128,138,0,0,240,137,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,168,138,0,0,8,138,0,0,0,138,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,168,138,0,0,64,138,0,0,48,138,0,0,0,0,0,0,0,0,0,0,104,138,0,0,69,0,0,0,70,0,0,0,71,0,0,0,72,0,0,0,41,0,0,0,22,0,0,0,22,0,0,0,22,0,0,0,0,0,0,0,240,138,0,0,69,0,0,0,73,0,0,0,71,0,0,0,72,0,0,0,41,0,0,0,23,0,0,0,23,0,0,0,23,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,168,138,0,0,200,138,0,0,104,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,141,0,0,74,0,0,0,75,0,0,0,39,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,168,138,0,0,32,141,0,0,0,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+30720);




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

  
  function _hypot(a, b) {
       return Math.sqrt(a*a + b*b);
    }var _hypotf=_hypot;

  
  function _log2(x) {
      return Math.log(x) / Math.LN2;
    }var _log2f=_log2;

   
  Module["_i64Add"] = _i64Add;

   
  Module["_i64Subtract"] = _i64Subtract;

  
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

  var _FtoILow=true;

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

  function _abort() {
      Module['abort']();
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

  var _atanf=Math_atan;

  var _fabs=Math_abs;

  var _floor=Math_floor;

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

  var _atan2=Math_atan2;

  var _exp=Math_exp;

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  var _acos=Math_acos;

  var _UItoF=true;

  var __ZTISt9exception=allocate([allocate([1,0,0,0,0,0,0], "i8", ALLOC_STATIC)+8, 0], "i32", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
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
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env.___rand_seed|0;var p=env.__ZTISt9exception|0;var q=0;var r=0;var s=0;var t=0;var u=+env.NaN,v=+env.Infinity;var w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0,E=0.0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=global.Math.floor;var Q=global.Math.abs;var R=global.Math.sqrt;var S=global.Math.pow;var T=global.Math.cos;var U=global.Math.sin;var V=global.Math.tan;var W=global.Math.acos;var X=global.Math.asin;var Y=global.Math.atan;var Z=global.Math.atan2;var _=global.Math.exp;var $=global.Math.log;var aa=global.Math.ceil;var ba=global.Math.imul;var ca=env.abort;var da=env.assert;var ea=env.asmPrintInt;var fa=env.asmPrintFloat;var ga=env.min;var ha=env.jsCall;var ia=env.invoke_iiii;var ja=env.invoke_viiiii;var ka=env.invoke_vi;var la=env.invoke_vii;var ma=env.invoke_ii;var na=env.invoke_v;var oa=env.invoke_iiiii;var pa=env.invoke_viiiiii;var qa=env.invoke_iii;var ra=env.invoke_viiii;var sa=env._fabs;var ta=env._exp;var ua=env._sqrtf;var va=env.__ZSt9terminatev;var wa=env.___cxa_guard_acquire;var xa=env.__reallyNegative;var ya=env._fstat;var za=env.__ZSt18uncaught_exceptionv;var Aa=env._ceilf;var Ba=env.___cxa_begin_catch;var Ca=env._emscripten_memcpy_big;var Da=env._sinh;var Ea=env._sysconf;var Fa=env._close;var Ga=env._tanf;var Ha=env._cos;var Ia=env._puts;var Ja=env.___resumeException;var Ka=env._write;var La=env._expf;var Ma=env.__ZNSt9exceptionD2Ev;var Na=env.___cxa_does_inherit;var Oa=env._send;var Pa=env._hypot;var Qa=env._log2;var Ra=env._atan2;var Sa=env.___cxa_is_number_type;var Ta=env._atan2f;var Ua=env.___cxa_find_matching_catch;var Va=env.___cxa_guard_release;var Wa=env.___setErrNo;var Xa=env._llvm_pow_f32;var Ya=env._unlink;var Za=env._srand;var _a=env._atanf;var $a=env._printf;var ab=env._logf;var bb=env._emscripten_get_now;var cb=env._stat;var db=env._read;var eb=env._fwrite;var fb=env._time;var gb=env._fprintf;var hb=env._gettimeofday;var ib=env._log10;var jb=env._exit;var kb=env._llvm_pow_f64;var lb=env._fmod;var mb=env._lseek;var nb=env._rmdir;var ob=env.___cxa_allocate_exception;var pb=env._asin;var qb=env._sbrk;var rb=env._pwrite;var sb=env._cosf;var tb=env._open;var ub=env._fabsf;var vb=env._remove;var wb=env._snprintf;var xb=env._sinf;var yb=env._floorf;var zb=env._log;var Ab=env._recv;var Bb=env._tan;var Cb=env._abort;var Db=env._ceil;var Eb=env._isspace;var Fb=env._floor;var Gb=env._sin;var Hb=env._acosf;var Ib=env._acos;var Jb=env._cosh;var Kb=env._fmax;var Lb=env._fflush;var Mb=env._asinf;var Nb=env._fileno;var Ob=env.__exit;var Pb=env._atan;var Qb=env._fputs;var Rb=env._pread;var Sb=env._mkport;var Tb=env.___errno_location;var Ub=env._copysign;var Vb=env._fputc;var Wb=env.___cxa_throw;var Xb=env.__formatString;var Yb=env._rint;var Zb=env._sqrt;var _b=0.0;
// EMSCRIPTEN_START_FUNCS
function Ch(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=i;i=i+16|0;j=d;e=c[b+4>>2]|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}f=c[c[b+8>>2]>>2]|0;n=c[c[b+12>>2]>>2]|0;g=c[b+16>>2]|0;if((g|0)==0){g=0}else{g=c[g>>2]|0}h=c[b+20>>2]|0;if((h|0)==0){q=0}else{q=c[h>>2]|0}h=c[b+32>>2]|0;if((h|0)==0){h=0}else{h=(a[h]|0)!=0}k=c[b+36>>2]|0;if((k|0)==0){k=0}else{k=(a[k]|0)!=0}if((f|0)==(e|0)){c[j>>2]=11144;c[j+4>>2]=7119;c[j+8>>2]=117;$a(8,j|0)|0;jb(1)}if((n|0)==(e|0)){c[j>>2]=11168;c[j+4>>2]=7119;c[j+8>>2]=118;$a(8,j|0)|0;jb(1)}if(!((g|0)==0|(g|0)!=(e|0))){c[j>>2]=11200;c[j+4>>2]=7119;c[j+8>>2]=119;$a(8,j|0)|0;jb(1)}m=c[f>>2]|0;v=c[f+4>>2]|0;l=c[n>>2]|0;w=c[n+4>>2]|0;M=c[(c[f+8>>2]|0)+16>>2]&255;o=f+(M<<2)+16|0;if((M|0)==0){j=1}else{j=1;r=f+16|0;while(1){p=r+4|0;j=ba(c[r>>2]|0,j)|0;if(p>>>0<o>>>0){r=p}else{break}}}M=c[(c[n+8>>2]|0)+16>>2]&255;o=n+(M<<2)+16|0;if((M|0)==0){p=1}else{p=1;r=n+16|0;while(1){n=r+4|0;p=ba(c[r>>2]|0,p)|0;if(n>>>0<o>>>0){r=n}else{break}}}o=(g|0)!=0;if(o){M=c[(c[g+8>>2]|0)+16>>2]&255;n=g+(M<<2)+16|0;if((M|0)==0){r=1}else{r=1;t=g+16|0;while(1){s=t+4|0;r=ba(c[t>>2]|0,r)|0;if(s>>>0<n>>>0){t=s}else{break}}}}else{r=0}n=c[f+12>>2]|0;q=(q|0)<(j|0)?q:j;F=(q|0)<0?0:q;q=(e|0)!=0;s=e+8|0;a:do{if(q){t=c[s>>2]|0;M=c[t+16>>2]&255;u=e+(M<<2)+16|0;if((M|0)==0){z=1}else{z=1;y=e+16|0;while(1){x=y+4|0;z=ba(c[y>>2]|0,z)|0;if(x>>>0<u>>>0){y=x}else{break}}}t=c[(dc[c[(c[t>>2]|0)+36>>2]&1023](t)|0)>>2]|0;if((!((c[(c[s>>2]|0)+16>>2]&255|0)!=1|(t|0)>-1)?!((t|0)!=-2147483648&(j|0)>(0-t|0)|(z|0)==(j|0)):0)?Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,j)|0,z,j,1)|0:0){c[e+16>>2]=j}A=c[f>>2]|0;z=c[e>>2]|0;t=n+16|0;u=n+12|0;y=c[u>>2]|0;B=ba(y,F)|0;if((c[t>>2]&2097152|0)!=0){au(z|0,A|0,B|0)|0;break}x=A+B|0;if((B|0)>0){while(1){if(($b[c[(c[n>>2]|0)+52>>2]&63](n,A,z)|0)!=0){break a}A=A+y|0;if(A>>>0<x>>>0){z=z+y|0}else{break}}}}else{t=n+16|0;u=n+12|0}}while(0);v=v-m|0;x=w-l|0;w=l+x|0;B=(x|0)>0;C=r-p|0;z=e+12|0;A=e+16|0;y=(p|0)==0;D=0;E=F;b:do{if((E+x|0)>(v|0)){break}else{G=E}c:while(1){if(!B){break}K=m+G|0;I=l;d:while(1){H=I+1|0;I=a[I]|0;J=K+1|0;M=a[K]|0;K=I&255;L=M&255;do{if(!(I<<24>>24==M<<24>>24)){if((I&255)>64&k&(I&255)<91?(K+32|0)==(L|0):0){break}if(!((I&255)>96&k&(I&255)<123)){break d}if((K+ -32|0)!=(L|0)){break d}}}while(0);if(H>>>0<w>>>0){K=J;I=H}else{break c}}G=G+1|0;if((G+x|0)>(v|0)){break b}}if((G|0)==-1){break}e:do{if(q){H=c[s>>2]|0;J=c[H+16>>2]&255;I=e+(J<<2)+16|0;J=(J|0)==0;if(!J){L=1;M=A;while(1){K=M+4|0;L=ba(c[M>>2]|0,L)|0;if(K>>>0<I>>>0){M=K}else{break}}K=C+L|0;if(J){M=1}else{M=1;L=A;while(1){J=L+4|0;M=ba(c[L>>2]|0,M)|0;if(J>>>0<I>>>0){L=J}else{break}}}}else{K=C+1|0;M=1}H=c[(dc[c[(c[H>>2]|0)+36>>2]&1023](H)|0)>>2]|0;if((!((c[(c[s>>2]|0)+16>>2]&255|0)!=1|(H|0)>-1)?!((H|0)!=-2147483648&(K|0)>(0-H|0)|(M|0)==(K|0)):0)?Md(e,ba(c[(c[z>>2]|0)+12>>2]|0,K)|0,M,K,1)|0:0){c[A>>2]=K}J=Nd(f,E)|0;K=Nd(e,F)|0;H=c[u>>2]|0;L=ba(H,G-E|0)|0;f:do{if((c[t>>2]&2097152|0)==0){I=J+L|0;if((L|0)>0){while(1){if(($b[c[(c[n>>2]|0)+52>>2]&63](n,J,K)|0)!=0){break f}J=J+H|0;if(!(J>>>0<I>>>0)){break}else{K=K+H|0}}}}else{au(K|0,J|0,L|0)|0}}while(0);if(o){J=c[g>>2]|0;K=Nd(e,F-E+G|0)|0;I=c[u>>2]|0;L=ba(I,r)|0;if((c[t>>2]&2097152|0)!=0){au(K|0,J|0,L|0)|0;break}H=J+L|0;if((L|0)>0){while(1){if(($b[c[(c[n>>2]|0)+52>>2]&63](n,J,K)|0)!=0){break e}J=J+I|0;if(!(J>>>0<H>>>0)){break}else{K=K+I|0}}}}}}while(0);F=r-E+F+G|0;E=G+p|0;D=D+1|0;if(y){if(q){M=a[Nd(f,E)|0]|0;a[Nd(e,F)|0]=M}E=E+1|0;F=F+1|0}}while(h);g:do{if(q&(E|0)<(j|0)){f=Nd(f,E)|0;g=Nd(e,F)|0;e=c[u>>2]|0;j=ba(e,j-E|0)|0;if((c[t>>2]&2097152|0)!=0){au(g|0,f|0,j|0)|0;break}h=f+j|0;if((j|0)>0){while(1){if(($b[c[(c[n>>2]|0)+52>>2]&63](n,f,g)|0)!=0){break g}f=f+e|0;if(!(f>>>0<h>>>0)){break}else{g=g+e|0}}}}}while(0);e=c[b+24>>2]|0;if((e|0)!=0){c[e>>2]=D}e=c[b+28>>2]|0;if((e|0)==0){M=b+40|0;i=d;return M|0}c[e>>2]=(D|0)!=0?F:-1;M=b+40|0;i=d;return M|0}function Dh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+16|0;l=d;f=c[c[b+4>>2]>>2]|0;e=c[c[b+8>>2]>>2]|0;g=c[b+12>>2]|0;if((g|0)==0){j=0}else{j=c[g>>2]|0}g=c[b+16>>2]|0;if((g|0)==0){g=0}else{g=c[g>>2]|0}k=c[b+20>>2]|0;if((k|0)==0){k=0}else{k=c[k>>2]|0}if((f|0)==(k|0)){c[l>>2]=11112;c[l+4>>2]=7119;c[l+8>>2]=198;$a(8,l|0)|0;jb(1)}m=c[f>>2]|0;o=c[f+4>>2]|0;n=c[e>>2]|0;p=c[e+4>>2]|0;u=c[(c[f+8>>2]|0)+16>>2]&255;e=f+(u<<2)+16|0;if((u|0)==0){l=1}else{l=1;r=f+16|0;while(1){q=r+4|0;l=ba(c[r>>2]|0,l)|0;if(q>>>0<e>>>0){r=q}else{break}}}e=c[f+12>>2]|0;j=(j|0)<(l|0)?j:l;j=(j|0)<0?0:j;o=o-m|0;r=p-n|0;a:do{if((j+r|0)<=(o|0)){p=n+r|0;q=(r|0)>0;b:while(1){if(!q){break}s=m+j|0;t=n;while(1){u=t+1|0;if((a[t]|0)!=(a[s]|0)){break}if(u>>>0<p>>>0){s=s+1|0;t=u}else{break b}}j=j+1|0;if((j+r|0)>(o|0)){h=19;break a}}m=(k|0)!=0;if((j|0)==-1){if(m){h=49;break}else{h=56;break}}c:do{if(m){l=l-j|0;m=k+8|0;n=c[m>>2]|0;u=c[n+16>>2]&255;p=k+(u<<2)+16|0;if((u|0)==0){q=1}else{q=1;r=k+16|0;while(1){o=r+4|0;q=ba(c[r>>2]|0,q)|0;if(o>>>0<p>>>0){r=o}else{break}}}n=c[(dc[c[(c[n>>2]|0)+36>>2]&1023](n)|0)>>2]|0;if((!((c[(c[m>>2]|0)+16>>2]&255|0)!=1|(n|0)>-1)?!((n|0)!=-2147483648&(l|0)>(0-n|0)|(q|0)==(l|0)):0)?Md(k,ba(c[(c[k+12>>2]|0)+12>>2]|0,l)|0,q,l,1)|0:0){c[k+16>>2]=l}m=Nd(f,j)|0;n=c[k>>2]|0;k=c[e+12>>2]|0;o=ba(k,l)|0;if((c[e+16>>2]&2097152|0)!=0){au(n|0,m|0,o|0)|0;break}l=m+o|0;if((o|0)>0){while(1){if(($b[c[(c[e>>2]|0)+52>>2]&63](e,m,n)|0)!=0){break c}m=m+k|0;if(!(m>>>0<l>>>0)){break}else{n=n+k|0}}}}}while(0);if((g|0)!=0){k=g+8|0;l=c[k>>2]|0;u=c[l+16>>2]&255;m=g+(u<<2)+16|0;if((u|0)==0){o=1}else{o=1;p=g+16|0;while(1){n=p+4|0;o=ba(c[p>>2]|0,o)|0;if(n>>>0<m>>>0){p=n}else{break}}}l=c[(dc[c[(c[l>>2]|0)+36>>2]&1023](l)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(l|0)>-1)?!((l|0)!=-2147483648&(j|0)>(0-l|0)|(o|0)==(j|0)):0)?Md(g,ba(c[(c[g+12>>2]|0)+12>>2]|0,j)|0,o,j,1)|0:0){c[g+16>>2]=j}if((f|0)!=(g|0)){k=c[f>>2]|0;l=c[g>>2]|0;g=c[e+12>>2]|0;m=ba(g,j)|0;if((c[e+16>>2]&2097152|0)!=0){au(l|0,k|0,m|0)|0;break}f=k+m|0;if((m|0)>0){while(1){if(($b[c[(c[e>>2]|0)+52>>2]&63](e,k,l)|0)!=0){break a}k=k+g|0;if(k>>>0<f>>>0){l=l+g|0}else{break}}}}}}else{h=19}}while(0);if((h|0)==19){if((k|0)==0){h=56}else{h=49}}if((h|0)==49){h=k+8|0;j=c[h>>2]|0;u=c[j+16>>2]&255;n=k+(u<<2)+16|0;if((u|0)==0){p=1}else{p=1;o=k+16|0;while(1){m=o+4|0;p=ba(c[o>>2]|0,p)|0;if(m>>>0<n>>>0){o=m}else{break}}}j=c[(dc[c[(c[j>>2]|0)+36>>2]&1023](j)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(j|0)>-1)?!((j|0)>0|(p|0)==0):0)?Md(k,0,p,0,1)|0:0){c[k+16>>2]=0;h=56}else{h=56}}d:do{if((h|0)==56){if(!((g|0)==0|(f|0)==(g|0))){h=g+8|0;j=c[h>>2]|0;u=c[j+16>>2]&255;k=g+(u<<2)+16|0;if((u|0)==0){o=1}else{o=1;n=g+16|0;while(1){m=n+4|0;o=ba(c[n>>2]|0,o)|0;if(m>>>0<k>>>0){n=m}else{break}}}j=c[(dc[c[(c[j>>2]|0)+36>>2]&1023](j)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(j|0)>-1)?!((j|0)!=-2147483648&(l|0)>(0-j|0)|(o|0)==(l|0)):0)?Md(g,ba(c[(c[g+12>>2]|0)+12>>2]|0,l)|0,o,l,1)|0:0){c[g+16>>2]=l}h=c[f>>2]|0;j=c[g>>2]|0;f=c[e+12>>2]|0;k=ba(f,l)|0;if((c[e+16>>2]&2097152|0)!=0){au(j|0,h|0,k|0)|0;j=-1;break}g=h+k|0;if((k|0)>0){while(1){if(($b[c[(c[e>>2]|0)+52>>2]&63](e,h,j)|0)!=0){j=-1;break d}h=h+f|0;if(h>>>0<g>>>0){j=j+f|0}else{j=-1;break}}}else{j=-1}}else{j=-1}}}while(0);e=c[b+24>>2]|0;if((e|0)==0){u=b+28|0;i=d;return u|0}c[e>>2]=j;u=b+28|0;i=d;return u|0}function Eh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;e=b+4|0;h=c[c[e>>2]>>2]|0;o=c[(c[h+8>>2]|0)+16>>2]&255;f=h+(o<<2)+16|0;if((o|0)==0){g=1}else{g=1;j=h+16|0;while(1){h=j+4|0;g=ba(c[j>>2]|0,g)|0;if(h>>>0<f>>>0){j=h}else{break}}}f=b+8|0;h=c[c[f>>2]>>2]|0;j=h+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;l=h+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=h+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(g|0)>(0-k|0)|(n|0)==(g|0)):0)?Md(h,ba(c[(c[h+12>>2]|0)+12>>2]|0,g)|0,n,g,1)|0:0){c[h+16>>2]=g}e=c[c[e>>2]>>2]|0;g=c[e>>2]|0;e=c[e+4>>2]|0;if(!(g>>>0<e>>>0)){o=b+12|0;i=d;return o|0}f=c[c[c[f>>2]>>2]>>2]|0;h=g;while(1){g=h+1|0;h=a[h]|0;if((h+ -97<<24>>24&255)<26){h=(h&255)+224&255}a[f]=h;if((g|0)==(e|0)){break}else{f=f+1|0;h=g}}o=b+12|0;i=d;return o|0}function Fh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;e=b+4|0;h=c[c[e>>2]>>2]|0;o=c[(c[h+8>>2]|0)+16>>2]&255;f=h+(o<<2)+16|0;if((o|0)==0){g=1}else{g=1;j=h+16|0;while(1){h=j+4|0;g=ba(c[j>>2]|0,g)|0;if(h>>>0<f>>>0){j=h}else{break}}}f=b+8|0;h=c[c[f>>2]>>2]|0;j=h+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;l=h+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=h+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(g|0)>(0-k|0)|(n|0)==(g|0)):0)?Md(h,ba(c[(c[h+12>>2]|0)+12>>2]|0,g)|0,n,g,1)|0:0){c[h+16>>2]=g}e=c[c[e>>2]>>2]|0;g=c[e>>2]|0;e=c[e+4>>2]|0;if(!(g>>>0<e>>>0)){o=b+12|0;i=d;return o|0}f=c[c[c[f>>2]>>2]>>2]|0;h=g;while(1){g=h+1|0;h=a[h]|0;if((h+ -65<<24>>24&255)<26){h=(h&255)+32&255}a[f]=h;if((g|0)==(e|0)){break}else{f=f+1|0;h=g}}o=b+12|0;i=d;return o|0}function Gh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;e=c[c[a+8>>2]>>2]|0;f=c[(c[e+8>>2]|0)+16>>2]&255;d=e+(f<<2)+16|0;f=(f|0)==0;if(f){h=1}else{h=1;j=e+16|0;while(1){g=j+4|0;h=ba(c[j>>2]|0,h)|0;if(g>>>0<d>>>0){j=g}else{break}}}g=c[c[a+12>>2]>>2]|0;m=c[(c[g+8>>2]|0)+16>>2]&255;j=g+(m<<2)+16|0;if((m|0)==0){m=1}else{m=1;l=g+16|0;while(1){k=l+4|0;m=ba(c[l>>2]|0,m)|0;if(k>>>0<j>>>0){l=k}else{break}}}if((h|0)==(m|0)){h=c[e>>2]|0;g=c[g>>2]|0;if(f){f=1}else{f=1;j=e+16|0;while(1){e=j+4|0;f=ba(c[j>>2]|0,f)|0;if(e>>>0<d>>>0){j=e}else{break}}}if((Tt(h,g,f)|0)==0){m=c[a+4>>2]|0;i=b;return m|0}}m=a+16|0;i=b;return m|0}function Hh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;g=c[c[a+8>>2]>>2]|0;k=c[g>>2]|0;d=c[c[a+12>>2]>>2]|0;l=c[d>>2]|0;j=c[(c[g+8>>2]|0)+16>>2]&255;f=g+(j<<2)+16|0;j=(j|0)==0;if(j){m=1}else{m=1;h=g+16|0;while(1){e=h+4|0;m=ba(c[h>>2]|0,m)|0;if(e>>>0<f>>>0){h=e}else{break}}}h=c[(c[d+8>>2]|0)+16>>2]&255;e=d+(h<<2)+16|0;h=(h|0)==0;if(h){p=1}else{p=1;o=d+16|0;while(1){n=o+4|0;p=ba(c[o>>2]|0,p)|0;if(n>>>0<e>>>0){o=n}else{break}}}k=Tt(k,l,(m|0)<(p|0)?m:p)|0;if((k|0)<0){p=c[a+4>>2]|0;i=b;return p|0}if((k|0)>0){p=a+16|0;p=dc[c[p>>2]&1023](p)|0;i=b;return p|0}if(j){f=1}else{j=1;k=g+16|0;while(1){g=k+4|0;j=ba(c[k>>2]|0,j)|0;if(g>>>0<f>>>0){k=g}else{f=j;break}}}if(h){g=1}else{g=1;h=d+16|0;while(1){d=h+4|0;g=ba(c[h>>2]|0,g)|0;if(d>>>0<e>>>0){h=d}else{break}}}if((f|0)<(g|0)){p=c[a+4>>2]|0;i=b;return p|0}else{p=a+16|0;p=dc[c[p>>2]&1023](p)|0;i=b;return p|0}return 0}function Ih(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;g=c[c[a+8>>2]>>2]|0;k=c[g>>2]|0;d=c[c[a+12>>2]>>2]|0;l=c[d>>2]|0;j=c[(c[g+8>>2]|0)+16>>2]&255;f=g+(j<<2)+16|0;j=(j|0)==0;if(j){m=1}else{m=1;h=g+16|0;while(1){e=h+4|0;m=ba(c[h>>2]|0,m)|0;if(e>>>0<f>>>0){h=e}else{break}}}h=c[(c[d+8>>2]|0)+16>>2]&255;e=d+(h<<2)+16|0;h=(h|0)==0;if(h){p=1}else{p=1;o=d+16|0;while(1){n=o+4|0;p=ba(c[o>>2]|0,p)|0;if(n>>>0<e>>>0){o=n}else{break}}}k=Tt(k,l,(m|0)<(p|0)?m:p)|0;if((k|0)>0){p=c[a+4>>2]|0;i=b;return p|0}if((k|0)<0){p=a+16|0;p=dc[c[p>>2]&1023](p)|0;i=b;return p|0}if(j){f=1}else{j=1;k=g+16|0;while(1){g=k+4|0;j=ba(c[k>>2]|0,j)|0;if(g>>>0<f>>>0){k=g}else{f=j;break}}}if(h){g=1}else{g=1;h=d+16|0;while(1){d=h+4|0;g=ba(c[h>>2]|0,g)|0;if(d>>>0<e>>>0){h=d}else{break}}}if((f|0)>(g|0)){p=c[a+4>>2]|0;i=b;return p|0}else{p=a+16|0;p=dc[c[p>>2]&1023](p)|0;i=b;return p|0}return 0}function Jh(b){b=b|0;a[c[b+8>>2]|0]=~~+h[c[b+4>>2]>>3];return b+12|0}function Kh(a){a=a|0;b[c[a+8>>2]>>1]=~~+h[c[a+4>>2]>>3];return a+12|0}function Lh(a){a=a|0;c[c[a+8>>2]>>2]=~~+h[c[a+4>>2]>>3]>>>0;return a+12|0}function Mh(a){a=a|0;var b=0.0,d=0,e=0;b=+h[c[a+4>>2]>>3];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Nh(b){b=b|0;a[c[b+8>>2]|0]=~~+h[c[b+4>>2]>>3];return b+12|0}function Oh(a){a=a|0;b[c[a+8>>2]>>1]=~~+h[c[a+4>>2]>>3];return a+12|0}function Ph(a){a=a|0;c[c[a+8>>2]>>2]=~~+h[c[a+4>>2]>>3];return a+12|0}function Qh(a){a=a|0;var b=0.0,d=0,e=0;b=+h[c[a+4>>2]>>3];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Rh(a){a=a|0;g[c[a+8>>2]>>2]=+h[c[a+4>>2]>>3];return a+12|0}function Sh(a){a=a|0;h[c[a+8>>2]>>3]=+h[c[a+4>>2]>>3];return a+12|0}function Th(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+(d[c[a+4>>2]|0]|0);h[b+8>>3]=0.0;return a+12|0}function Uh(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+(e[c[a+4>>2]>>1]|0);h[b+8>>3]=0.0;return a+12|0}function Vh(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+((c[c[a+4>>2]>>2]|0)>>>0);h[b+8>>3]=0.0;return a+12|0}function Wh(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;d=c[a+4>>2]|0;h[b>>3]=+((c[d>>2]|0)>>>0)+4294967296.0*+((c[d+4>>2]|0)>>>0);h[b+8>>3]=0.0;return a+12|0}function Xh(b){b=b|0;var d=0;d=c[b+8>>2]|0;h[d>>3]=+(a[c[b+4>>2]|0]|0);h[d+8>>3]=0.0;return b+12|0}function Yh(a){a=a|0;var d=0;d=c[a+8>>2]|0;h[d>>3]=+(b[c[a+4>>2]>>1]|0);h[d+8>>3]=0.0;return a+12|0}function Zh(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+(c[c[a+4>>2]>>2]|0);h[b+8>>3]=0.0;return a+12|0}function _h(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;d=c[a+4>>2]|0;h[b>>3]=+((c[d>>2]|0)>>>0)+4294967296.0*+(c[d+4>>2]|0);h[b+8>>3]=0.0;return a+12|0}function $h(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+g[c[a+4>>2]>>2];h[b+8>>3]=0.0;return a+12|0}function ai(a){a=a|0;var b=0;b=c[a+8>>2]|0;h[b>>3]=+h[c[a+4>>2]>>3];h[b+8>>3]=0.0;return a+12|0}function bi(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=c[a+12>>2]|0;f=c[a+4>>2]|0;e=c[a+8>>2]|0;d=+h[f+8>>3]+ +h[e+8>>3];h[b>>3]=+h[f>>3]+ +h[e>>3];h[b+8>>3]=d;return a+16|0}function ci(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=c[a+12>>2]|0;f=c[a+4>>2]|0;e=c[a+8>>2]|0;d=+h[f+8>>3]- +h[e+8>>3];h[b>>3]=+h[f>>3]- +h[e>>3];h[b+8>>3]=d;return a+16|0}function di(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;e=b;d=c[a+12>>2]|0;vi(e,c[a+4>>2]|0,c[a+8>>2]|0);c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+16|0}function ei(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;e=b;d=c[a+12>>2]|0;wi(e,c[a+4>>2]|0,c[a+8>>2]|0);c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+16|0}function fi(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+Pa(+(+h[g>>3]),+(+h[j>>3]));e=+h[j>>3]/f;h[d>>3]=+h[g>>3]/f;h[d+8>>3]=e;i=b;return a+12|0}function gi(a){a=a|0;var b=0,d=0.0,e=0;b=i;e=c[a+4>>2]|0;d=+Pa(+(+h[e>>3]),+(+h[e+8>>3]));h[c[a+8>>2]>>3]=d;i=b;return a+12|0}function hi(a){a=a|0;var b=0,d=0,e=0.0,f=0,g=0.0;b=i;d=c[a+8>>2]|0;f=c[a+4>>2]|0;e=+h[f>>3];h[k>>3]=e;do{if(!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)){g=+h[f+8>>3];h[k>>3]=g;if((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072){e=+Q(+g);break}else{e=e*e+g*g;break}}else{e=+Q(+e)}}while(0);h[d>>3]=e;h[d+8>>3]=0.0;i=b;return a+12|0}function ii(a){a=a|0;var b=0.0,d=0;d=c[a+4>>2]|0;b=+Z(+(+h[d+8>>3]),+(+h[d>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function ji(a){a=a|0;var b=0,d=0.0,e=0;b=c[a+8>>2]|0;e=c[a+4>>2]|0;d=-+h[e+8>>3];h[b>>3]=+h[e>>3];h[b+8>>3]=d;return a+12|0}function ki(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;e=b;d=c[a+8>>2]|0;yi(e,c[a+4>>2]|0);c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+12|0}function li(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0.0,j=0,l=0.0,m=0;d=i;b=c[a+8>>2]|0;j=c[a+4>>2]|0;l=+h[j+8>>3];f=-l;g=+h[j>>3];h[k>>3]=f;j=c[k+4>>2]|0;if((c[k>>2]|0)==0&(j&2147483647|0)==2146435072?(h[k>>3]=g,m=c[k+4>>2]&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=f;g=u}else{e=3}do{if((e|0)==3){if(l==-0.0?(h[k>>3]=g,m=c[k+4>>2]&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=f;g=u;break}if(g==0.0?(m=j&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=f;break}l=+Da(+f)*+T(+g);g=+Jb(+f)*+U(+g)}}while(0);h[b>>3]=g;h[b+8>>3]=-l;i=d;return a+12|0}function mi(a){a=a|0;var b=0,d=0,e=0,f=0.0,g=0.0,j=0,l=0.0,m=0;d=i;b=c[a+8>>2]|0;j=c[a+4>>2]|0;l=+h[j+8>>3];f=-l;g=+h[j>>3];h[k>>3]=f;j=c[k+4>>2]|0;if((c[k>>2]|0)==0&(j&2147483647|0)==2146435072?(h[k>>3]=g,m=c[k+4>>2]&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=+Q(+f);f=u}else{e=4}do{if((e|0)==4){if(l==-0.0){h[k>>3]=g;m=c[k+4>>2]&2146435072;if(!(m>>>0<2146435072|(m|0)==2146435072&0<0)){l=u;break}if(g==0.0){l=1.0;f=g;break}}if(g==0.0?(m=j&2146435072,!(m>>>0<2146435072|(m|0)==2146435072&0<0)):0){l=+Q(+f);f=g;break}l=+Jb(+f)*+T(+g);f=+Da(+f)*+U(+g)}}while(0);h[b>>3]=l;h[b+8>>3]=f;i=d;return a+12|0}function ni(a){a=a|0;var b=0,d=0,e=0.0,f=0,g=0,j=0;b=i;i=i+32|0;f=b+16|0;g=b;d=c[a+8>>2]|0;j=c[a+4>>2]|0;e=+h[j>>3];h[g>>3]=-+h[j+8>>3];h[g+8>>3]=e;xi(f,g);e=-+h[f>>3];h[d>>3]=+h[f+8>>3];h[d+8>>3]=e;i=b;return a+12|0}function oi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,l=0.0,m=0.0,n=0.0,o=0,p=0;f=i;i=i+48|0;d=f+32|0;b=f+16|0;g=f;e=c[a+8>>2]|0;o=c[a+4>>2]|0;n=+h[o+8>>3];m=-n;l=+h[o>>3];h[k>>3]=m;o=c[k+4>>2]|0;if((c[k>>2]|0)==0&(o&2147483647|0)==2146435072?(h[k>>3]=l,p=c[k+4>>2]&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=+Q(+m);l=u}else{j=4}do{if((j|0)==4){if(n==-0.0){h[k>>3]=l;p=c[k+4>>2]&2146435072;if(!(p>>>0<2146435072|(p|0)==2146435072&0<0)){n=u;l=m;break}if(l==0.0){n=1.0;break}}if(l==0.0?(p=o&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=+Q(+m);break}n=+Jb(+m)*+T(+l);l=+Da(+m)*+U(+l)}}while(0);h[g>>3]=1.0;h[g+8>>3]=0.0;h[b>>3]=n;h[b+8>>3]=l;wi(d,g,b);c[g+0>>2]=c[d+0>>2];c[g+4>>2]=c[d+4>>2];c[g+8>>2]=c[d+8>>2];c[g+12>>2]=c[d+12>>2];c[e+0>>2]=c[g+0>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];i=f;return a+12|0}function pi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,l=0.0,m=0.0,n=0.0,o=0,p=0;f=i;i=i+48|0;d=f+32|0;b=f+16|0;g=f;e=c[a+8>>2]|0;o=c[a+4>>2]|0;n=+h[o+8>>3];l=-n;m=+h[o>>3];h[k>>3]=l;o=c[k+4>>2]|0;if((c[k>>2]|0)==0&(o&2147483647|0)==2146435072?(h[k>>3]=m,p=c[k+4>>2]&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=l;m=u}else{j=3}do{if((j|0)==3){if(n==-0.0?(h[k>>3]=m,p=c[k+4>>2]&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=l;m=u;break}if(m==0.0?(p=o&2146435072,!(p>>>0<2146435072|(p|0)==2146435072&0<0)):0){n=l;break}n=+Da(+l)*+T(+m);m=+Jb(+l)*+U(+m)}}while(0);h[g>>3]=1.0;h[g+8>>3]=0.0;h[b>>3]=m;h[b+8>>3]=-n;wi(d,g,b);c[g+0>>2]=c[d+0>>2];c[g+4>>2]=c[d+4>>2];c[g+8>>2]=c[d+8>>2];c[g+12>>2]=c[d+12>>2];c[e+0>>2]=c[g+0>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];i=f;return a+12|0}function qi(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+$(+(+Pa(+(+h[g>>3]),+(+h[j>>3]))));e=+Z(+(+h[j>>3]),+(+h[g>>3]))/2.302585092994046;h[d>>3]=f/2.302585092994046;h[d+8>>3]=e;i=b;return a+12|0}function ri(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+$(+(+Pa(+(+h[g>>3]),+(+h[j>>3]))));e=+Z(+(+h[j>>3]),+(+h[g>>3]));h[d>>3]=f;h[d+8>>3]=e;i=b;return a+12|0}function si(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;j=g+8|0;f=+$(+(+Pa(+(+h[g>>3]),+(+h[j>>3]))));e=+Z(+(+h[j>>3]),+(+h[g>>3]))/.6931471805599453;h[d>>3]=f/.6931471805599453;h[d+8>>3]=e;i=b;return a+12|0}function ti(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0,l=0,m=0.0;b=i;d=c[a+8>>2]|0;g=c[a+4>>2]|0;f=+h[g+8>>3];e=+h[g>>3];h[k>>3]=e;g=c[k>>2]|0;j=c[k+4>>2]&2147483647;do{if(!((g|0)==0&(j|0)==2146435072)){if((j>>>0>2146435072|(j|0)==2146435072&g>>>0>0)&f==0.0){h[d>>3]=e;j=d+8|0;h[j>>3]=f;j=a+12|0;i=b;return j|0}}else{if(e<0.0){h[k>>3]=f;j=c[k+4>>2]&2146435072;f=j>>>0<2146435072|(j|0)==2146435072&0<0?f:1.0;break}h[k>>3]=f;g=c[k>>2]|0;j=c[k+4>>2]|0;if(!(f==0.0)?(l=j&2146435072,l>>>0<2146435072|(l|0)==2146435072&0<0):0){break}f=(g|0)==0&(j&2147483647|0)==2146435072?u:f;h[d>>3]=e;l=d+8|0;h[l>>3]=f;l=a+12|0;i=b;return l|0}}while(0);m=+_(+e);e=m*+U(+f);f=m*+T(+f);h[d>>3]=f;l=d+8|0;h[l>>3]=e;l=a+12|0;i=b;return l|0}function ui(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0,j=0,l=0,m=0,n=0,o=0.0;b=i;i=i+32|0;g=b+16|0;j=b;d=c[a+12>>2]|0;m=c[a+4>>2]|0;l=c[a+8>>2]|0;n=m+8|0;e=+$(+(+Pa(+(+h[m>>3]),+(+h[n>>3]))));f=+Z(+(+h[n>>3]),+(+h[m>>3]));h[j>>3]=e;h[j+8>>3]=f;vi(g,l,j);f=+h[g+8>>3];e=+h[g>>3];h[k>>3]=e;g=c[k>>2]|0;j=c[k+4>>2]&2147483647;do{if(!((g|0)==0&(j|0)==2146435072)){if((j>>>0>2146435072|(j|0)==2146435072&g>>>0>0)&f==0.0){h[d>>3]=e;n=d+8|0;h[n>>3]=f;n=a+16|0;i=b;return n|0}}else{if(e<0.0){h[k>>3]=f;n=c[k+4>>2]&2146435072;f=n>>>0<2146435072|(n|0)==2146435072&0<0?f:1.0;break}h[k>>3]=f;g=c[k>>2]|0;j=c[k+4>>2]|0;if(!(f==0.0)?(n=j&2146435072,n>>>0<2146435072|(n|0)==2146435072&0<0):0){break}f=(g|0)==0&(j&2147483647|0)==2146435072?u:f;h[d>>3]=e;n=d+8|0;h[n>>3]=f;n=a+16|0;i=b;return n|0}}while(0);o=+_(+e);e=o*+U(+f);f=o*+T(+f);h[d>>3]=f;n=d+8|0;h[n>>3]=e;n=a+16|0;i=b;return n|0}function vi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0,w=0,x=0;e=i;r=+h[b>>3];p=+h[b+8>>3];s=+h[d>>3];q=+h[d+8>>3];o=r*s;l=p*q;j=r*q;g=p*s;n=o-l;m=g+j;h[k>>3]=n;x=c[k+4>>2]&2147483647;if(!(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0)){r=n;s=m;h[a>>3]=r;x=a+8|0;h[x>>3]=s;i=e;return}h[k>>3]=m;x=c[k+4>>2]&2147483647;if(!(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0)){r=n;s=m;h[a>>3]=r;x=a+8|0;h[x>>3]=s;i=e;return}h[k>>3]=r;b=(c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072;h[k>>3]=p;d=c[k>>2]|0;t=c[k+4>>2]&2147483647;if(!b){if((d|0)==0&(t|0)==2146435072){d=0;t=2146435072;f=5}else{x=0}}else{f=5}if((f|0)==5){r=+Ub(+(b?1.0:0.0),+r);p=+Ub(+((d|0)==0&(t|0)==2146435072?1.0:0.0),+p);h[k>>3]=s;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){s=+Ub(0.0,+s)}h[k>>3]=q;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){q=+Ub(0.0,+q);x=1}else{x=1}}h[k>>3]=s;t=c[k>>2]|0;w=c[k+4>>2]&2147483647;u=(t|0)==0&(w|0)==2146435072;h[k>>3]=q;b=c[k>>2]|0;d=c[k+4>>2]&2147483647;if(!u){if(!((b|0)==0&(d|0)==2146435072)){if(!x){h[k>>3]=o;if(((!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)?(h[k>>3]=l,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0)?(h[k>>3]=j,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0)?(h[k>>3]=g,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0){r=n;s=m;h[a>>3]=r;x=a+8|0;h[x>>3]=s;i=e;return}h[k>>3]=r;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){r=+Ub(0.0,+r)}h[k>>3]=p;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){p=+Ub(0.0,+p)}if(w>>>0>2146435072|(w|0)==2146435072&t>>>0>0){s=+Ub(0.0,+s)}if(d>>>0>2146435072|(d|0)==2146435072&b>>>0>0){q=+Ub(0.0,+q)}}}else{b=0;d=2146435072;f=11}}else{f=11}if((f|0)==11){s=+Ub(+(u?1.0:0.0),+s);q=+Ub(+((b|0)==0&(d|0)==2146435072?1.0:0.0),+q);h[k>>3]=r;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){r=+Ub(0.0,+r)}h[k>>3]=p;x=c[k+4>>2]&2147483647;if(x>>>0>2146435072|(x|0)==2146435072&(c[k>>2]|0)>>>0>0){p=+Ub(0.0,+p)}}o=(r*s-p*q)*v;s=(p*s+r*q)*v;h[a>>3]=o;x=a+8|0;h[x>>3]=s;i=e;return}function wi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0.0,g=0.0,j=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0;e=i;g=+h[b>>3];f=+h[b+8>>3];m=+h[d>>3];n=+h[d+8>>3];l=+gt(+Kb(+(+Q(+m)),+(+Q(+n))));h[k>>3]=l;b=c[k>>2]|0;d=c[k+4>>2]|0;t=d&2146435072;if(t>>>0<2146435072|(t|0)==2146435072&0<0){r=~~l;t=0-r|0;m=+Ot(m,t);n=+Ot(n,t)}else{r=0}o=m*m+n*n;t=0-r|0;q=+Ot((g*m+f*n)/o,t);p=+Ot((f*m-g*n)/o,t);h[k>>3]=q;t=c[k+4>>2]&2147483647;if(!(t>>>0>2146435072|(t|0)==2146435072&(c[k>>2]|0)>>>0>0)){o=q;q=p;h[a>>3]=o;t=a+8|0;h[t>>3]=q;i=e;return}h[k>>3]=p;t=c[k+4>>2]&2147483647;if(!(t>>>0>2146435072|(t|0)==2146435072&(c[k>>2]|0)>>>0>0)){o=q;q=p;h[a>>3]=o;t=a+8|0;h[t>>3]=q;i=e;return}h[k>>3]=g;s=c[k>>2]|0;r=c[k+4>>2]|0;t=r&2147483647;do{if(o==0.0){if(t>>>0>2146435072|(t|0)==2146435072&s>>>0>0?(h[k>>3]=f,u=c[k+4>>2]&2147483647,u>>>0>2146435072|(u|0)==2146435072&(c[k>>2]|0)>>>0>0):0){break}q=+Ub(v,+m);p=g*q;q=f*q;h[a>>3]=p;u=a+8|0;h[u>>3]=q;i=e;return}}while(0);s=(s|0)==0&(t|0)==2146435072;if(!(!s?(h[k>>3]=f,!((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072)):0)){j=11}if(((j|0)==11?(h[k>>3]=m,u=c[k+4>>2]&2146435072,u>>>0<2146435072|(u|0)==2146435072&0<0):0)?(h[k>>3]=n,u=c[k+4>>2]&2146435072,u>>>0<2146435072|(u|0)==2146435072&0<0):0){g=+Ub(+(s?1.0:0.0),+g);h[k>>3]=f;q=+Ub(+((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?1.0:0.0),+f);p=(m*g+n*q)*v;q=(m*q-n*g)*v;h[a>>3]=p;u=a+8|0;h[u>>3]=q;i=e;return}if(!((b|0)==0&(d&2147483647|0)==2146435072&l>0.0)){o=q;q=p;h[a>>3]=o;u=a+8|0;h[u>>3]=q;i=e;return}u=r&2146435072;if(!(u>>>0<2146435072|(u|0)==2146435072&0<0)){o=q;q=p;h[a>>3]=o;u=a+8|0;h[u>>3]=q;i=e;return}h[k>>3]=f;u=c[k+4>>2]&2146435072;if(!(u>>>0<2146435072|(u|0)==2146435072&0<0)){o=q;q=p;h[a>>3]=o;u=a+8|0;h[u>>3]=q;i=e;return}h[k>>3]=m;l=+Ub(+((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?1.0:0.0),+m);h[k>>3]=n;q=+Ub(+((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?1.0:0.0),+n);p=(g*l+f*q)*0.0;q=(f*l-g*q)*0.0;h[a>>3]=p;u=a+8|0;h[u>>3]=q;i=e;return}function xi(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0,g=0,j=0.0,l=0.0;d=i;e=+h[b>>3];h[k>>3]=e;g=c[k>>2]|0;f=c[k+4>>2]&2147483647;if((g|0)==0&(f|0)==2146435072){e=+h[b+8>>3];h[k>>3]=e;b=c[k+4>>2]&2146435072;if(b>>>0<2146435072|(b|0)==2146435072&0<0){l=+Ub(0.0,+(+U(+(e*2.0))));h[a>>3]=1.0;h[a+8>>3]=l;i=d;return}else{h[a>>3]=1.0;h[a+8>>3]=0.0;i=d;return}}j=+h[b+8>>3];if((f>>>0>2146435072|(f|0)==2146435072&g>>>0>0)&j==0.0){c[a+0>>2]=c[b+0>>2];c[a+4>>2]=c[b+4>>2];c[a+8>>2]=c[b+8>>2];c[a+12>>2]=c[b+12>>2];i=d;return}e=e*2.0;j=j*2.0;l=+Jb(+e)+ +T(+j);e=+Da(+e);h[k>>3]=e;if((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072?(h[k>>3]=l,(c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072):0){h[a>>3]=e>0.0?1.0:-1.0;h[a+8>>3]=j>0.0?0.0:-0.0;i=d;return}j=+U(+j)/l;h[a>>3]=e/l;h[a+8>>3]=j;i=d;return}function yi(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0.0,g=0,j=0,l=0,m=0.0;d=i;g=b+8|0;e=+h[g>>3];h[k>>3]=e;j=c[k>>2]|0;l=c[k+4>>2]&2147483647;if((j|0)==0&(l|0)==2146435072){h[a>>3]=v;h[a+8>>3]=e;i=d;return}f=+h[b>>3];h[k>>3]=f;if((c[k>>2]|0)==0&(c[k+4>>2]&2147483647|0)==2146435072){b=l>>>0>2146435072|(l|0)==2146435072&j>>>0>0;if(!(f>0.0)){f=+Ub(+f,+e);h[a>>3]=b?e:0.0;h[a+8>>3]=f;i=d;return}if(!b){e=+Ub(0.0,+e)}h[a>>3]=f;h[a+8>>3]=e;i=d;return}e=+R(+(+Pa(+f,+e)));f=+Z(+(+h[g>>3]),+(+h[b>>3]))*.5;h[k>>3]=e;b=c[k>>2]|0;l=c[k+4>>2]|0;g=l&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&b>>>0>0|(l|0)<0){h[a>>3]=u;h[a+8>>3]=u;i=d;return}h[k>>3]=f;j=c[k>>2]|0;l=c[k+4>>2]&2147483647;if(l>>>0>2146435072|(l|0)==2146435072&j>>>0>0){if((b|0)==0&(g|0)==2146435072){h[a>>3]=e;h[a+8>>3]=f;i=d;return}else{h[a>>3]=f;h[a+8>>3]=f;i=d;return}}if(!((j|0)==0&(l|0)==2146435072)){m=e*+T(+f);h[k>>3]=m;l=c[k+4>>2]&2147483647;m=l>>>0>2146435072|(l|0)==2146435072&(c[k>>2]|0)>>>0>0?0.0:m;e=e*+U(+f);h[k>>3]=e;l=c[k+4>>2]&2147483647;f=l>>>0>2146435072|(l|0)==2146435072&(c[k>>2]|0)>>>0>0?0.0:e;h[a>>3]=m;h[a+8>>3]=f;i=d;return}if((b|0)==0&(g|0)==2146435072){h[a>>3]=e;h[a+8>>3]=u;i=d;return}else{h[a>>3]=u;h[a+8>>3]=u;i=d;return}}function zi(b){b=b|0;a[c[b+8>>2]|0]=~~+g[c[b+4>>2]>>2];return b+12|0}function Ai(a){a=a|0;b[c[a+8>>2]>>1]=~~+g[c[a+4>>2]>>2];return a+12|0}function Bi(a){a=a|0;c[c[a+8>>2]>>2]=~~+g[c[a+4>>2]>>2]>>>0;return a+12|0}function Ci(a){a=a|0;var b=0.0,d=0,e=0;b=+g[c[a+4>>2]>>2];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Di(b){b=b|0;a[c[b+8>>2]|0]=~~+g[c[b+4>>2]>>2];return b+12|0}function Ei(a){a=a|0;b[c[a+8>>2]>>1]=~~+g[c[a+4>>2]>>2];return a+12|0}function Fi(a){a=a|0;c[c[a+8>>2]>>2]=~~+g[c[a+4>>2]>>2];return a+12|0}function Gi(a){a=a|0;var b=0.0,d=0,e=0;b=+g[c[a+4>>2]>>2];e=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;d=c[a+8>>2]|0;c[d>>2]=~~b>>>0;c[d+4>>2]=e;return a+12|0}function Hi(a){a=a|0;g[c[a+8>>2]>>2]=+g[c[a+4>>2]>>2];return a+12|0}function Ii(a){a=a|0;h[c[a+8>>2]>>3]=+g[c[a+4>>2]>>2];return a+12|0}function Ji(a){a=a|0;var b=0,e=0;b=i;e=c[a+8>>2]|0;g[e>>2]=+(d[c[a+4>>2]|0]|0);c[e+4>>2]=0;i=b;return a+12|0}function Ki(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+(e[c[a+4>>2]>>1]|0);c[d+4>>2]=0;i=b;return a+12|0}function Li(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+((c[c[a+4>>2]>>2]|0)>>>0);c[d+4>>2]=0;i=b;return a+12|0}function Mi(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;g[d>>2]=+((c[e>>2]|0)>>>0)+4294967296.0*+((c[e+4>>2]|0)>>>0);c[d+4>>2]=0;i=b;return a+12|0}function Ni(b){b=b|0;var d=0,e=0;d=i;e=c[b+8>>2]|0;g[e>>2]=+(a[c[b+4>>2]|0]|0);c[e+4>>2]=0;i=d;return b+12|0}function Oi(a){a=a|0;var d=0,e=0;d=i;e=c[a+8>>2]|0;g[e>>2]=+(b[c[a+4>>2]>>1]|0);c[e+4>>2]=0;i=d;return a+12|0}function Pi(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+(c[c[a+4>>2]>>2]|0);c[d+4>>2]=0;i=b;return a+12|0}function Qi(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;g[d>>2]=+((c[e>>2]|0)>>>0)+4294967296.0*+(c[e+4>>2]|0);c[d+4>>2]=0;i=b;return a+12|0}function Ri(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+g[c[a+4>>2]>>2];c[d+4>>2]=0;i=b;return a+12|0}function Si(a){a=a|0;var b=0,d=0;b=i;d=c[a+8>>2]|0;g[d>>2]=+h[c[a+4>>2]>>3];c[d+4>>2]=0;i=b;return a+12|0}function Ti(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0;b=i;h=c[a+8>>2]|0;d=c[a+4>>2]|0;f=+g[h>>2]+ +g[d>>2];e=+g[h+4>>2]+ +g[d+4>>2];f=+f;e=+e;d=c[a+12>>2]|0;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+16|0}function Ui(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0;b=i;d=c[a+8>>2]|0;h=c[a+4>>2]|0;f=+g[h>>2]- +g[d>>2];e=+g[h+4>>2]- +g[d+4>>2];f=+f;e=+e;d=c[a+12>>2]|0;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+16|0}function Vi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;f=b;d=c[a+12>>2]|0;lj(f,c[a+4>>2]|0,c[a+8>>2]|0);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+16|0}function Wi(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;f=b;d=c[a+12>>2]|0;mj(f,c[a+4>>2]|0,c[a+8>>2]|0);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+16|0}function Xi(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0,j=0;b=i;d=c[a+8>>2]|0;j=c[a+4>>2]|0;h=j+4|0;e=+Pa(+(+g[j>>2]),+(+g[h>>2]));f=+(+g[j>>2]/e);e=+(+g[h>>2]/e);g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function Yi(a){a=a|0;var b=0,d=0.0,e=0;b=i;e=c[a+4>>2]|0;d=+Pa(+(+g[e>>2]),+(+g[e+4>>2]));g[c[a+8>>2]>>2]=d;i=b;return a+12|0}function Zi(a){a=a|0;var b=0,d=0,e=0.0,f=0,h=0.0;b=i;d=c[a+8>>2]|0;f=c[a+4>>2]|0;e=+g[f>>2];do{if(((g[k>>2]=e,c[k>>2]|0)&2147483647|0)!=2139095040){h=+g[f+4>>2];if(((g[k>>2]=h,c[k>>2]|0)&2147483647|0)==2139095040){e=+Q(+h);break}else{e=e*e+h*h;break}}else{e=+Q(+e)}}while(0);g[d>>2]=e;g[d+4>>2]=0.0;i=b;return a+12|0}function _i(a){a=a|0;var b=0.0,d=0;d=c[a+4>>2]|0;b=+Z(+(+g[d+4>>2]),+(+g[d>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function $i(a){a=a|0;var b=0,d=0,e=0.0,f=0.0;b=i;d=c[a+4>>2]|0;f=+(+g[d>>2]);e=+-+g[d+4>>2];d=c[a+8>>2]|0;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function aj(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;f=b;d=c[a+8>>2]|0;pj(f,c[a+4>>2]|0);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+12|0}function bj(a){a=a|0;var b=0,d=0,e=0,f=0.0,h=0.0,j=0,l=0.0;d=i;b=c[a+8>>2]|0;j=c[a+4>>2]|0;l=+g[j+4>>2];f=-l;h=+g[j>>2];j=(g[k>>2]=f,c[k>>2]|0);if((j&2147483647|0)==2139095040?!(((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040):0){l=f;h=u}else{e=3}do{if((e|0)==3){if(l==-0.0?!(((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040):0){l=f;h=u;break}if(h==0.0?!((j&2139095040)>>>0<2139095040):0){l=f;break}l=+Da(+f);l=l*+T(+h);h=+Jb(+f)*+U(+h)}}while(0);h=+h;l=+-l;j=b;g[j>>2]=h;g[j+4>>2]=l;i=d;return a+12|0}function cj(a){a=a|0;var b=0,d=0,e=0,f=0,h=0.0,j=0;b=i;i=i+16|0;e=b+8|0;f=b;d=c[a+8>>2]|0;j=c[a+4>>2]|0;h=+g[j>>2];g[e>>2]=-+g[j+4>>2];g[e+4>>2]=h;nj(f,e);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+12|0}function dj(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0,j=0,k=0;b=i;i=i+16|0;h=b+8|0;j=b;d=c[a+8>>2]|0;k=c[a+4>>2]|0;f=+g[k>>2];g[j>>2]=-+g[k+4>>2];g[j+4>>2]=f;oj(h,j);f=+(+g[h+4>>2]);e=+-+g[h>>2];g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function ej(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,j=0.0,k=0,l=0;b=i;i=i+32|0;f=b+8|0;e=b+24|0;h=b;k=b+16|0;d=c[a+8>>2]|0;l=c[a+4>>2]|0;j=+g[l>>2];g[f>>2]=-+g[l+4>>2];g[f+4>>2]=j;nj(k,f);g[h>>2]=1.0;g[h+4>>2]=0.0;j=+g[k+4>>2];g[e>>2]=+g[k>>2];g[e+4>>2]=j;mj(f,h,e);e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;i=b;return a+12|0}function fj(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,j=0,l=0.0,m=0.0,n=0.0,o=0;f=i;i=i+32|0;d=f+8|0;b=f+16|0;h=f;e=c[a+8>>2]|0;o=c[a+4>>2]|0;n=+g[o+4>>2];l=-n;m=+g[o>>2];o=(g[k>>2]=l,c[k>>2]|0);if((o&2147483647|0)==2139095040?!(((g[k>>2]=m,c[k>>2]|0)&2139095040)>>>0<2139095040):0){n=l;m=u}else{j=3}do{if((j|0)==3){if(n==-0.0?!(((g[k>>2]=m,c[k>>2]|0)&2139095040)>>>0<2139095040):0){n=l;m=u;break}if(m==0.0?!((o&2139095040)>>>0<2139095040):0){n=l;break}n=+Da(+l);n=n*+T(+m);m=+Jb(+l)*+U(+m)}}while(0);g[h>>2]=1.0;g[h+4>>2]=0.0;g[b>>2]=m;g[b+4>>2]=-n;mj(d,h,b);h=d;j=c[h+4>>2]|0;o=e;c[o>>2]=c[h>>2];c[o+4>>2]=j;i=f;return a+12|0}function gj(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0.0,j=0,k=0;b=i;d=c[a+8>>2]|0;j=c[a+4>>2]|0;k=j+4|0;h=+$(+(+Pa(+(+g[j>>2]),+(+g[k>>2]))));f=+$(10.0);e=+Z(+(+g[k>>2]),+(+g[j>>2]))/f;f=+(h/f);e=+e;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function hj(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0,j=0;b=i;d=c[a+8>>2]|0;h=c[a+4>>2]|0;j=h+4|0;f=+$(+(+Pa(+(+g[h>>2]),+(+g[j>>2]))));e=+Z(+(+g[j>>2]),+(+g[h>>2]));f=+f;e=+e;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function ij(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,h=0.0,j=0,k=0;b=i;d=c[a+8>>2]|0;j=c[a+4>>2]|0;k=j+4|0;h=+$(+(+Pa(+(+g[j>>2]),+(+g[k>>2]))));f=+$(2.0);e=+Z(+(+g[k>>2]),+(+g[j>>2]))/f;f=+(h/f);e=+e;g[d>>2]=f;g[d+4>>2]=e;i=b;return a+12|0}function jj(a){a=a|0;var b=0,d=0,e=0,f=0.0,h=0.0,j=0,l=0,m=0.0;d=i;e=c[a+8>>2]|0;j=c[a+4>>2]|0;h=+g[j+4>>2];f=+g[j>>2];l=(g[k>>2]=f,c[k>>2]|0)&2147483647;do{if((l|0)!=2139095040){if(l>>>0>2139095040&h==0.0){l=j;f=+g[l>>2];h=+g[l+4>>2]}else{b=9}}else{if(f<0.0){h=((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040?h:1.0;b=9;break}j=(g[k>>2]=h,c[k>>2]|0);if(!(h==0.0)?(j&2139095040)>>>0<2139095040:0){b=9;break}h=(j&2147483647|0)==2139095040?u:h}}while(0);if((b|0)==9){m=+_(+f);f=m*+T(+h);h=m*+U(+h)}f=+f;m=+h;l=e;g[l>>2]=f;g[l+4>>2]=m;i=d;return a+12|0}function kj(a){a=a|0;var b=0,d=0,e=0,f=0.0,h=0.0,j=0,l=0,m=0,n=0,o=0,p=0.0;b=i;i=i+16|0;j=b;l=b+8|0;d=c[a+12>>2]|0;n=c[a+4>>2]|0;m=c[a+8>>2]|0;o=n+4|0;f=+$(+(+Pa(+(+g[n>>2]),+(+g[o>>2]))));h=+Z(+(+g[o>>2]),+(+g[n>>2]));g[l>>2]=f;g[l+4>>2]=h;lj(j,m,l);h=+g[j+4>>2];f=+g[j>>2];l=(g[k>>2]=f,c[k>>2]|0)&2147483647;do{if((l|0)!=2139095040){if(l>>>0>2139095040&h==0.0){o=j;f=+g[o>>2];h=+g[o+4>>2]}else{e=9}}else{if(f<0.0){h=((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040?h:1.0;e=9;break}j=(g[k>>2]=h,c[k>>2]|0);if(!(h==0.0)?(j&2139095040)>>>0<2139095040:0){e=9;break}h=(j&2147483647|0)==2139095040?u:h}}while(0);if((e|0)==9){p=+_(+f);f=p*+T(+h);h=p*+U(+h)}f=+f;p=+h;o=d;g[o>>2]=f;g[o+4>>2]=p;i=b;return a+16|0}function lj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0.0,j=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0;e=i;r=+g[b>>2];p=+g[b+4>>2];s=+g[d>>2];q=+g[d+4>>2];o=r*s;l=p*q;j=r*q;h=p*s;n=o-l;m=h+j;if(!(((g[k>>2]=n,c[k>>2]|0)&2147483647)>>>0>2139095040)){r=n;s=m;g[a>>2]=r;u=a+4|0;g[u>>2]=s;i=e;return}if(!(((g[k>>2]=m,c[k>>2]|0)&2147483647)>>>0>2139095040)){r=n;s=m;g[a>>2]=r;u=a+4|0;g[u>>2]=s;i=e;return}d=((g[k>>2]=r,c[k>>2]|0)&2147483647|0)==2139095040;b=(g[k>>2]=p,c[k>>2]|0)&2147483647;if(!d){if((b|0)==2139095040){b=2139095040;f=5}else{u=0}}else{f=5}if((f|0)==5){r=+Ub(+(d?1.0:0.0),+r);p=+Ub(+((b|0)==2139095040?1.0:0.0),+p);if(((g[k>>2]=s,c[k>>2]|0)&2147483647)>>>0>2139095040){s=+Ub(0.0,+s)}if(((g[k>>2]=q,c[k>>2]|0)&2147483647)>>>0>2139095040){q=+Ub(0.0,+q);u=1}else{u=1}}b=(g[k>>2]=s,c[k>>2]|0)&2147483647;t=(b|0)==2139095040;d=(g[k>>2]=q,c[k>>2]|0)&2147483647;if(!t){if((d|0)!=2139095040){if(!u){if(((((g[k>>2]=o,c[k>>2]|0)&2147483647|0)!=2139095040?((g[k>>2]=l,c[k>>2]|0)&2147483647|0)!=2139095040:0)?((g[k>>2]=j,c[k>>2]|0)&2147483647|0)!=2139095040:0)?((g[k>>2]=h,c[k>>2]|0)&2147483647|0)!=2139095040:0){r=n;s=m;g[a>>2]=r;u=a+4|0;g[u>>2]=s;i=e;return}if(((g[k>>2]=r,c[k>>2]|0)&2147483647)>>>0>2139095040){r=+Ub(0.0,+r)}if(((g[k>>2]=p,c[k>>2]|0)&2147483647)>>>0>2139095040){p=+Ub(0.0,+p)}if(b>>>0>2139095040){s=+Ub(0.0,+s)}if(d>>>0>2139095040){q=+Ub(0.0,+q)}}}else{d=2139095040;f=11}}else{f=11}if((f|0)==11){s=+Ub(+(t?1.0:0.0),+s);q=+Ub(+((d|0)==2139095040?1.0:0.0),+q);if(((g[k>>2]=r,c[k>>2]|0)&2147483647)>>>0>2139095040){r=+Ub(0.0,+r)}if(((g[k>>2]=p,c[k>>2]|0)&2147483647)>>>0>2139095040){p=+Ub(0.0,+p)}}o=(r*s-p*q)*v;s=(p*s+r*q)*v;g[a>>2]=o;u=a+4|0;g[u>>2]=s;i=e;return}function mj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0.0,h=0.0,j=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0;e=i;f=+g[b>>2];h=+g[b+4>>2];m=+g[d>>2];l=+g[d+4>>2];n=+ht(+Kb(+(+Q(+m)),+(+Q(+l))));d=(g[k>>2]=n,c[k>>2]|0);if((d&2139095040)>>>0<2139095040){b=~~n;r=0-b|0;m=+it(m,r);l=+it(l,r)}else{b=0}q=m*m+l*l;r=0-b|0;p=+it((f*m+h*l)/q,r);o=+it((h*m-f*l)/q,r);a:do{if(((g[k>>2]=p,c[k>>2]|0)&2147483647)>>>0>2139095040?((g[k>>2]=o,c[k>>2]|0)&2147483647)>>>0>2139095040:0){b=(g[k>>2]=f,c[k>>2]|0);r=b&2147483647;do{if(q==0.0){if(r>>>0>2139095040?((g[k>>2]=h,c[k>>2]|0)&2147483647)>>>0>2139095040:0){break}o=+Ub(v,+m);p=f*o;o=h*o;break a}}while(0);r=(r|0)==2139095040;if(!(!r?((g[k>>2]=h,c[k>>2]|0)&2147483647|0)!=2139095040:0)){j=11}if(((j|0)==11?((g[k>>2]=m,c[k>>2]|0)&2139095040)>>>0<2139095040:0)?((g[k>>2]=l,c[k>>2]|0)&2139095040)>>>0<2139095040:0){f=+Ub(+(r?1.0:0.0),+f);o=+Ub(+(((g[k>>2]=h,c[k>>2]|0)&2147483647|0)==2139095040?1.0:0.0),+h);p=(m*f+l*o)*v;o=(m*o-l*f)*v;break}if(((d&2147483647|0)==2139095040&n>0.0?(b&2139095040)>>>0<2139095040:0)?((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040:0){m=+Ub(+(((g[k>>2]=m,c[k>>2]|0)&2147483647|0)==2139095040?1.0:0.0),+m);o=+Ub(+(((g[k>>2]=l,c[k>>2]|0)&2147483647|0)==2139095040?1.0:0.0),+l);p=(f*m+h*o)*0.0;o=(h*m-f*o)*0.0}}}while(0);g[a>>2]=p;g[a+4>>2]=o;i=e;return}function nj(a,b){a=a|0;b=b|0;var d=0.0,e=0,f=0,h=0.0,j=0,l=0.0;e=i;d=+g[b>>2];f=(g[k>>2]=d,c[k>>2]|0);if((f&2147483647|0)==2139095040?!(((g[k>>2]=+g[b+4>>2],c[k>>2]|0)&2139095040)>>>0<2139095040):0){g[a>>2]=+Q(+d);g[a+4>>2]=u;i=e;return}h=+g[b+4>>2];if(d==0.0){if(!(((g[k>>2]=h,c[k>>2]|0)&2139095040)>>>0<2139095040)){g[a>>2]=u;g[a+4>>2]=d;i=e;return}h=+g[b+4>>2];if(h==0.0){g[a>>2]=1.0;g[a+4>>2]=h;i=e;return}}j=b+4|0;if(h==0.0?!((f&2139095040)>>>0<2139095040):0){g[a>>2]=+Q(+d);g[a+4>>2]=h;i=e;return}l=+Jb(+d);d=+g[j>>2];h=+Da(+(+g[b>>2]));d=l*+T(+d);h=h*+U(+(+g[j>>2]));g[a>>2]=d;g[a+4>>2]=h;i=e;return}function oj(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0,h=0.0,j=0.0,l=0;d=i;e=+g[b>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;if((f|0)==2139095040){e=+g[b+4>>2];if(((g[k>>2]=e,c[k>>2]|0)&2139095040)>>>0<2139095040){j=+Ub(0.0,+(+U(+(e*2.0))));g[a>>2]=1.0;g[a+4>>2]=j;i=d;return}else{g[a>>2]=1.0;g[a+4>>2]=0.0;i=d;return}}h=+g[b+4>>2];if(f>>>0>2139095040&h==0.0){l=b;f=c[l+4>>2]|0;b=a;c[b>>2]=c[l>>2];c[b+4>>2]=f;i=d;return}e=e*2.0;h=h*2.0;j=+Jb(+e)+ +T(+h);e=+Da(+e);if(((g[k>>2]=e,c[k>>2]|0)&2147483647|0)==2139095040?((g[k>>2]=j,c[k>>2]|0)&2147483647|0)==2139095040:0){g[a>>2]=e>0.0?1.0:-1.0;g[a+4>>2]=h>0.0?0.0:-0.0;i=d;return}h=+U(+h)/j;g[a>>2]=e/j;g[a+4>>2]=h;i=d;return}function pj(a,b){a=a|0;b=b|0;var d=0,e=0.0,f=0.0,h=0,j=0,l=0.0;d=i;h=b+4|0;f=+g[h>>2];j=(g[k>>2]=f,c[k>>2]|0)&2147483647;if((j|0)==2139095040){g[a>>2]=v;g[a+4>>2]=f;i=d;return}e=+g[b>>2];if(((g[k>>2]=e,c[k>>2]|0)&2147483647|0)==2139095040){b=j>>>0>2139095040;if(!(e>0.0)){e=+Ub(+e,+f);g[a>>2]=b?f:0.0;g[a+4>>2]=e;i=d;return}if(!b){f=+Ub(0.0,+f)}g[a>>2]=e;g[a+4>>2]=f;i=d;return}e=+R(+(+Pa(+e,+f)));f=+Z(+(+g[h>>2]),+(+g[b>>2]))*.5;j=(g[k>>2]=e,c[k>>2]|0);b=j&2147483647;if(b>>>0>2139095040|(j|0)<0){g[a>>2]=u;g[a+4>>2]=u;i=d;return}h=(g[k>>2]=f,c[k>>2]|0)&2147483647;if(h>>>0>2139095040){if((b|0)==2139095040){g[a>>2]=e;g[a+4>>2]=f;i=d;return}else{g[a>>2]=f;g[a+4>>2]=f;i=d;return}}if((h|0)!=2139095040){l=e*+T(+f);l=((g[k>>2]=l,c[k>>2]|0)&2147483647)>>>0>2139095040?0.0:l;e=e*+U(+f);f=((g[k>>2]=e,c[k>>2]|0)&2147483647)>>>0>2139095040?0.0:e;g[a>>2]=l;g[a+4>>2]=f;i=d;return}if((b|0)==2139095040){g[a>>2]=e;g[a+4>>2]=u;i=d;return}else{g[a>>2]=u;g[a+4>>2]=u;i=d;return}}function qj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0];return b+16|0}function rj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]|a[c[b+4>>2]|0];return b+16|0}function sj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+8>>2]|0]|a[c[b+4>>2]|0])^1;return b+16|0}function tj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0]^1;return b+16|0}function uj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function vj(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]^1;return b+12|0}function wj(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==0){b=b+12|0;b=dc[c[b>>2]&1023](b)|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function xj(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==0){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+12|0;b=dc[c[b>>2]&1023](b)|0;i=d;return b|0}return 0}function yj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<(d[c[b+8>>2]|0]|0)|0;return b+16|0}function zj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Aj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+4>>2]|0]^1^a[c[b+8>>2]|0];return b+16|0}function Bj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function Cj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Dj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Ej(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+8>>2]|0]|0)+(d[c[b+4>>2]|0]|0);return b+16|0}function Fj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)-(d[c[b+8>>2]|0]|0);return b+16|0}function Gj(b){b=b|0;var e=0;e=(ba(d[c[b+8>>2]|0]|0,d[c[b+4>>2]|0]|0)|0)&255;a[c[b+12>>2]|0]=e;return b+16|0}function Hj(b){b=b|0;a[c[b+8>>2]|0]=(a[c[b+4>>2]|0]|0)!=0|0;return b+12|0}function Ij(b){b=b|0;var e=0;e=a[c[b+8>>2]|0]|0;if(e<<24>>24==0){e=0}else{e=(d[c[b+4>>2]|0]|0)%(e&255)|0}a[c[b+12>>2]|0]=e;return b+16|0}function Jj(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;e=a[c[b+8>>2]|0]|0;if(!(e<<24>>24==0)){g=a[c[b+4>>2]|0]|0;f=(g&255)/(e&255)|0;if(!(((g&255)-(ba(f&255,e&255)|0)&255)<<24>>24==0)){f=((g<<24>>24==0)<<31>>31)+f<<24>>24}}else{f=0}a[c[b+12>>2]|0]=f;i=d;return b+16|0}function Kj(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;g=a[c[b+8>>2]|0]|0;e=g&255;f=a[c[b+4>>2]|0]|0;if(!(g<<24>>24==0)){g=(f&255)-(ba(((f&255)/(g&255)|0)&255,e)|0)|0;h=g&255;if(!(h<<24>>24==0)){if(f<<24>>24==0){f=g+e&255}else{f=h}}else{f=0}}a[c[b+12>>2]|0]=f;i=d;return b+16|0}function Lj(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function Mj(b){b=b|0;var d=0;d=c[b+12>>2]|0;a[d]=a[c[b+8>>2]|0]|0;a[d+1|0]=a[c[b+4>>2]|0]|0;return b+16|0}function Nj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0];return b+16|0}function Oj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]|a[c[b+4>>2]|0];return b+16|0}function Pj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+8>>2]|0]|a[c[b+4>>2]|0])&255^255;return b+16|0}function Qj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0]&255^255;return b+16|0}function Rj(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function Sj(b){b=b|0;a[c[b+8>>2]|0]=(d[c[b+4>>2]|0]|0)^255;return b+12|0}function Tj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Uj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Vj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)==(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Wj(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)!=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Xj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Yj(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Zj(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)>(d[c[a+12>>2]|0]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function _j(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)<(d[c[a+12>>2]|0]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function $j(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)<(d[c[a+12>>2]|0]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ak(a){a=a|0;var b=0;b=i;if((d[c[a+8>>2]|0]|0)>(d[c[a+12>>2]|0]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function bk(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function ck(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function dk(a){a=a|0;b[c[a+8>>2]>>1]=d[c[a+4>>2]|0]|0;return a+12|0}function ek(a){a=a|0;c[c[a+8>>2]>>2]=d[c[a+4>>2]|0]|0;return a+12|0}function fk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=d[c[a+4>>2]|0]|0;c[b+4>>2]=0;return a+12|0}function gk(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]|0;return b+12|0}function hk(a){a=a|0;b[c[a+8>>2]>>1]=d[c[a+4>>2]|0]|0;return a+12|0}function ik(a){a=a|0;c[c[a+8>>2]>>2]=d[c[a+4>>2]|0]|0;return a+12|0}function jk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=d[c[a+4>>2]|0]|0;c[b+4>>2]=0;return a+12|0}function kk(a){a=a|0;g[c[a+8>>2]>>2]=+(d[c[a+4>>2]|0]|0);return a+12|0}function lk(a){a=a|0;h[c[a+8>>2]>>3]=+(d[c[a+4>>2]|0]|0);return a+12|0}function mk(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+8>>2]>>1]|0)+(e[c[a+4>>2]>>1]|0);return a+16|0}function nk(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+4>>2]>>1]|0)-(e[c[a+8>>2]>>1]|0);return a+16|0}function ok(a){a=a|0;var d=0;d=(ba(e[c[a+8>>2]>>1]|0,e[c[a+4>>2]>>1]|0)|0)&65535;b[c[a+12>>2]>>1]=d;return a+16|0}function pk(a){a=a|0;b[c[a+8>>2]>>1]=(b[c[a+4>>2]>>1]|0)!=0|0;return a+12|0}function qk(a){a=a|0;var d=0;d=b[c[a+8>>2]>>1]|0;if(d<<16>>16==0){d=0}else{d=(e[c[a+4>>2]>>1]|0)%(d&65535)|0}b[c[a+12>>2]>>1]=d;return a+16|0}function rk(a){a=a|0;var d=0,e=0,f=0,g=0;d=i;e=b[c[a+8>>2]>>1]|0;if(!(e<<16>>16==0)){g=b[c[a+4>>2]>>1]|0;f=(g&65535)/(e&65535)|0;if(!(((g&65535)-(ba(f&65535,e&65535)|0)&65535)<<16>>16==0)){f=((g<<16>>16==0)<<31>>31)+f<<16>>16}}else{f=0}b[c[a+12>>2]>>1]=f;i=d;return a+16|0}function sk(a){a=a|0;var d=0,e=0,f=0,g=0,h=0;d=i;g=b[c[a+8>>2]>>1]|0;e=g&65535;f=b[c[a+4>>2]>>1]|0;if(!(g<<16>>16==0)){g=(f&65535)-(ba(((f&65535)/(g&65535)|0)&65535,e)|0)|0;h=g&65535;if(!(h<<16>>16==0)){if(f<<16>>16==0){f=g+e&65535}else{f=h}}else{f=0}}b[c[a+12>>2]>>1]=f;i=d;return a+16|0}function tk(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=a[d+1|0]|0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function uk(a){a=a|0;var d=0;d=c[a+12>>2]|0;b[d>>1]=b[c[a+8>>2]>>1]|0;b[d+2>>1]=b[c[a+4>>2]>>1]|0;return a+16|0}function vk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1];return a+16|0}function wk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1];return a+16|0}function xk(a){a=a|0;b[c[a+12>>2]>>1]=(b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1])&65535^65535;return a+16|0}function yk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1]&65535^65535;return a+16|0}function zk(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]^b[c[a+4>>2]>>1];return a+16|0}function Ak(a){a=a|0;b[c[a+8>>2]>>1]=(e[c[a+4>>2]>>1]|0)^65535;return a+12|0}function Bk(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)<(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Ck(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)<=(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Dk(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)==(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function Ek(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)!=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function Fk(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)>(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Gk(b){b=b|0;a[c[b+12>>2]|0]=(e[c[b+4>>2]>>1]|0)>=(e[c[b+8>>2]>>1]|0)|0;return b+16|0}function Hk(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)>(e[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Ik(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)<(e[c[a+12>>2]>>1]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Jk(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)<(e[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Kk(a){a=a|0;var b=0;b=i;if((e[c[a+8>>2]>>1]|0)>(e[c[a+12>>2]>>1]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Lk(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function Mk(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function Nk(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function Ok(a){a=a|0;c[c[a+8>>2]>>2]=e[c[a+4>>2]>>1]|0;return a+12|0}function Pk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=e[c[a+4>>2]>>1]|0;c[b+4>>2]=0;return a+12|0}function Qk(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function Rk(a){a=a|0;b[c[a+8>>2]>>1]=b[c[a+4>>2]>>1]|0;return a+12|0}function Sk(a){a=a|0;c[c[a+8>>2]>>2]=e[c[a+4>>2]>>1]|0;return a+12|0}function Tk(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=e[c[a+4>>2]>>1]|0;c[b+4>>2]=0;return a+12|0}function Uk(a){a=a|0;g[c[a+8>>2]>>2]=+(e[c[a+4>>2]>>1]|0);return a+12|0}function Vk(a){a=a|0;h[c[a+8>>2]>>3]=+(e[c[a+4>>2]>>1]|0);return a+12|0}function Wk(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+8>>2]>>2]|0)+(c[c[a+4>>2]>>2]|0);return a+16|0}function Xk(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+4>>2]>>2]|0)-(c[c[a+8>>2]>>2]|0);return a+16|0}function Yk(a){a=a|0;var b=0;b=ba(c[c[a+8>>2]>>2]|0,c[c[a+4>>2]>>2]|0)|0;c[c[a+12>>2]>>2]=b;return a+16|0}function Zk(a){a=a|0;c[c[a+8>>2]>>2]=(c[c[a+4>>2]>>2]|0)!=0;return a+12|0}function _k(a){a=a|0;var b=0;b=c[c[a+8>>2]>>2]|0;if((b|0)==0){b=0}else{b=((c[c[a+4>>2]>>2]|0)>>>0)%(b>>>0)|0}c[c[a+12>>2]>>2]=b;return a+16|0}function $k(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;if((d|0)!=0){f=c[c[a+4>>2]>>2]|0;e=(f>>>0)/(d>>>0)|0;if((f|0)!=(ba(e,d)|0)){e=(((f|0)==0)<<31>>31)+e|0}}else{e=0}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function al(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)!=0){f=(e>>>0)%(d>>>0)|0;if((f|0)==0){e=0}else{e=f+((e|0)==0?d:0)|0}}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function bl(a){a=a|0;var d=0;d=c[a+4>>2]|0;b[c[a+8>>2]>>1]=b[d+2>>1]|0;b[c[a+12>>2]>>1]=b[d>>1]|0;return a+16|0}function cl(a){a=a|0;var b=0;b=c[a+12>>2]|0;c[b>>2]=c[c[a+8>>2]>>2];c[b+4>>2]=c[c[a+4>>2]>>2];return a+16|0}function dl(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2];return a+16|0}function el(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2];return a+16|0}function fl(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2]);return a+16|0}function gl(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2]);return a+16|0}function hl(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]^c[c[a+4>>2]>>2];return a+16|0}function il(a){a=a|0;c[c[a+8>>2]>>2]=~c[c[a+4>>2]>>2];return a+12|0}function jl(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0<(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function kl(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0<=(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function ll(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)==(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function ml(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)!=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function nl(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0>(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function ol(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>>>0>=(c[c[b+8>>2]>>2]|0)>>>0|0;return b+16|0}function pl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0>(c[c[a+12>>2]>>2]|0)>>>0){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ql(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0<(c[c[a+12>>2]>>2]|0)>>>0){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function rl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0<(c[c[a+12>>2]>>2]|0)>>>0){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function sl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>>>0>(c[c[a+12>>2]>>2]|0)>>>0){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function tl(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ul(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function vl(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function wl(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function xl(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=c[c[a+4>>2]>>2];c[b+4>>2]=0;return a+12|0}function yl(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function zl(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function Al(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function Bl(a){a=a|0;var b=0;b=c[a+8>>2]|0;c[b>>2]=c[c[a+4>>2]>>2];c[b+4>>2]=0;return a+12|0}function Cl(a){a=a|0;g[c[a+8>>2]>>2]=+((c[c[a+4>>2]>>2]|0)>>>0);return a+12|0}function Dl(a){a=a|0;h[c[a+8>>2]>>3]=+((c[c[a+4>>2]>>2]|0)>>>0);return a+12|0}function El(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=Yt(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function Fl(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+4>>2]|0;e=c[a+8>>2]|0;e=Zt(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function Gl(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=ju(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function Hl(a){a=a|0;var b=0,d=0;d=c[a+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=((c[d>>2]|0)!=0|(c[d+4>>2]|0)!=0)&1;c[b+4>>2]=0;return a+12|0}function Il(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;if((e|0)==0&(d|0)==0){e=0;d=0}else{f=c[a+4>>2]|0;e=lu(c[f>>2]|0,c[f+4>>2]|0,e|0,d|0)|0;d=F}f=c[a+12>>2]|0;c[f>>2]=e;c[f+4>>2]=d;i=b;return a+16|0}function Jl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;e=c[a+8>>2]|0;f=c[e>>2]|0;e=c[e+4>>2]|0;if(!((f|0)==0&(e|0)==0)){h=c[a+4>>2]|0;j=c[h>>2]|0;h=c[h+4>>2]|0;g=ku(j|0,h|0,f|0,e|0)|0;d=F;f=ju(g|0,d|0,f|0,e|0)|0;if(!((j|0)==(f|0)&(h|0)==(F|0))){j=((j|0)==0&(h|0)==0)<<31>>31;g=Yt(j|0,((j|0)<0)<<31>>31|0,g|0,d|0)|0;d=F}}else{g=0;d=0}j=c[a+12>>2]|0;c[j>>2]=g;c[j+4>>2]=d;i=b;return a+16|0}function Kl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;g=c[a+4>>2]|0;j=c[g>>2]|0;g=c[g+4>>2]|0;if(!((e|0)==0&(d|0)==0)){f=lu(j|0,g|0,e|0,d|0)|0;h=F;if((f|0)==0&(h|0)==0){j=0;g=0}else{g=(j|0)==0&(g|0)==0;j=Yt(f|0,h|0,(g?e:0)|0,(g?d:0)|0)|0;g=F}}h=c[a+12>>2]|0;c[h>>2]=j;c[h+4>>2]=g;i=b;return a+16|0}function Ll(a){a=a|0;var b=0;b=c[a+4>>2]|0;c[c[a+8>>2]>>2]=c[b+4>>2];c[c[a+12>>2]>>2]=c[b>>2];return a+16|0}function Ml(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]&c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]&c[e>>2];c[b+4>>2]=d;return a+16|0}function Nl(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]|c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]|c[e>>2];c[b+4>>2]=d;return a+16|0}function Ol(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]|c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]|c[e>>2]);c[b+4>>2]=d;return a+16|0}function Pl(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]&c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]&c[e>>2]);c[b+4>>2]=d;return a+16|0}function Ql(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]^c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]^c[e>>2];c[b+4>>2]=d;return a+16|0}function Rl(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=~c[e+4>>2];b=c[a+8>>2]|0;c[b>>2]=~c[e>>2];c[b+4>>2]=d;return a+12|0}function Sl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0)&1;return b+16|0}function Tl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<=(c[d>>2]|0)>>>0)&1;return b+16|0}function Ul(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=(c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)&1;return b+16|0}function Vl(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=((c[e>>2]|0)!=(c[d>>2]|0)|(c[e+4>>2]|0)!=(c[d+4>>2]|0))&1;return b+16|0}function Wl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0)&1;return b+16|0}function Xl(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>=(c[d>>2]|0)>>>0)&1;return b+16|0}function Yl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function Zl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function _l(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0<f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function $l(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if(g>>>0>f>>>0|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function am(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=c[a+4>>2]|0;i=b;return e|0}else{e=a+16|0;i=b;return e|0}return 0}function bm(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=a+16|0;i=b;return e|0}else{e=c[a+4>>2]|0;i=b;return e|0}return 0}function cm(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function dm(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function em(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function fm(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function gm(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function hm(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function im(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function jm(a){a=a|0;var b=0;b=c[a+4>>2]|0;g[c[a+8>>2]>>2]=+((c[b>>2]|0)>>>0)+4294967296.0*+((c[b+4>>2]|0)>>>0);return a+12|0}function km(a){a=a|0;var b=0;b=c[a+4>>2]|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+((c[b+4>>2]|0)>>>0);return a+12|0}function lm(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+8>>2]|0]|0)+(d[c[b+4>>2]|0]|0);return b+16|0}function mm(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)-(d[c[b+8>>2]|0]|0);return b+16|0}function nm(b){b=b|0;var d=0;d=(ba(a[c[b+8>>2]|0]|0,a[c[b+4>>2]|0]|0)|0)&255;a[c[b+12>>2]|0]=d;return b+16|0}function om(b){b=b|0;var d=0;d=a[c[b+4>>2]|0]|0;a[c[b+8>>2]|0]=(d<<24>>24>0)-((d&255)>>>7&255);return b+12|0}function pm(b){b=b|0;var d=0;d=a[c[b+8>>2]|0]|0;if(d<<24>>24==0){d=0}else{d=((a[c[b+4>>2]|0]|0)%(d<<24>>24|0)|0)&255}a[c[b+12>>2]|0]=d;return b+16|0}function qm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=a[c[b+8>>2]|0]|0;f=e<<24>>24;if(!(e<<24>>24==0)){h=a[c[b+4>>2]|0]|0;k=h<<24>>24;j=(k|0)/(f|0)|0;g=j&255;if(!((k-(ba(j<<24>>24,f)|0)&255)<<24>>24==0)){g=((h<<24>>24>0^e<<24>>24>0)<<31>>31)+g<<24>>24}}else{g=0}a[c[b+12>>2]|0]=g;i=d;return b+16|0}function rm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;g=a[c[b+8>>2]|0]|0;e=g<<24>>24;f=a[c[b+4>>2]|0]|0;if(!(g<<24>>24==0)){h=f<<24>>24;h=h-(ba(((h|0)/(e|0)|0)<<24>>24,e)|0)|0;j=h&255;if(!(j<<24>>24==0)){if(f<<24>>24>0^g<<24>>24>0){f=h+e&255}else{f=j}}else{f=0}}a[c[b+12>>2]|0]=f;i=d;return b+16|0}function sm(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function tm(b){b=b|0;var d=0;d=c[b+12>>2]|0;a[d]=a[c[b+8>>2]|0]|0;a[d+1|0]=a[c[b+4>>2]|0]|0;return b+16|0}function um(b){b=b|0;var d=0,e=0;e=a[c[b+4>>2]|0]|0;d=e<<24>>24;a[c[b+8>>2]|0]=e<<24>>24>-1?d:0-d|0;return b+12|0}function vm(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0];return b+16|0}function wm(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]|a[c[b+4>>2]|0];return b+16|0}function xm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+8>>2]|0]|a[c[b+4>>2]|0])&255^255;return b+16|0}function ym(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]&a[c[b+4>>2]|0]&255^255;return b+16|0}function zm(b){b=b|0;a[c[b+12>>2]|0]=a[c[b+8>>2]|0]^a[c[b+4>>2]|0];return b+16|0}function Am(b){b=b|0;a[c[b+8>>2]|0]=(d[c[b+4>>2]|0]|0)^255;return b+12|0}function Bm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)<(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Cm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)<=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Dm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)==(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Em(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)!=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Fm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)>(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Gm(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)>=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Hm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)>(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function Im(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)<(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function Jm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)<(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function Km(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)>(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function Lm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=c[b+4>>2]|0;i=d;return b|0}else{b=b+16|0;i=d;return b|0}return 0}function Mm(b){b=b|0;var d=0;d=i;if((a[c[b+8>>2]|0]|0)==(a[c[b+12>>2]|0]|0)){b=b+16|0;i=d;return b|0}else{b=c[b+4>>2]|0;i=d;return b|0}return 0}function Nm(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]|0;return b+12|0}function Om(d){d=d|0;b[c[d+8>>2]>>1]=a[c[d+4>>2]|0]|0;return d+12|0}function Pm(b){b=b|0;c[c[b+8>>2]>>2]=a[c[b+4>>2]|0]|0;return b+12|0}function Qm(b){b=b|0;var d=0,e=0;e=a[c[b+4>>2]|0]|0;d=c[b+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return b+12|0}function Rm(d){d=d|0;b[c[d+8>>2]>>1]=a[c[d+4>>2]|0]|0;return d+12|0}function Sm(b){b=b|0;c[c[b+8>>2]>>2]=a[c[b+4>>2]|0]|0;return b+12|0}function Tm(b){b=b|0;var d=0,e=0;e=a[c[b+4>>2]|0]|0;d=c[b+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return b+12|0}function Um(b){b=b|0;g[c[b+8>>2]>>2]=+(a[c[b+4>>2]|0]|0);return b+12|0}function Vm(b){b=b|0;h[c[b+8>>2]>>3]=+(a[c[b+4>>2]|0]|0);return b+12|0}function Wm(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+8>>2]>>1]|0)+(e[c[a+4>>2]>>1]|0);return a+16|0}function Xm(a){a=a|0;b[c[a+12>>2]>>1]=(e[c[a+4>>2]>>1]|0)-(e[c[a+8>>2]>>1]|0);return a+16|0}function Ym(a){a=a|0;var d=0;d=(ba(b[c[a+8>>2]>>1]|0,b[c[a+4>>2]>>1]|0)|0)&65535;b[c[a+12>>2]>>1]=d;return a+16|0}function Zm(a){a=a|0;var d=0;d=b[c[a+4>>2]>>1]|0;b[c[a+8>>2]>>1]=(d<<16>>16>0)-((d&65535)>>>15&65535);return a+12|0}function _m(a){a=a|0;var d=0;d=b[c[a+8>>2]>>1]|0;if(d<<16>>16==0){d=0}else{d=((b[c[a+4>>2]>>1]|0)%(d<<16>>16|0)|0)&65535}b[c[a+12>>2]>>1]=d;return a+16|0}function $m(a){a=a|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=b[c[a+8>>2]>>1]|0;f=e<<16>>16;if(!(e<<16>>16==0)){h=b[c[a+4>>2]>>1]|0;k=h<<16>>16;j=(k|0)/(f|0)|0;g=j&65535;if(!((k-(ba(j<<16>>16,f)|0)&65535)<<16>>16==0)){g=((h<<16>>16>0^e<<16>>16>0)<<31>>31)+g<<16>>16}}else{g=0}b[c[a+12>>2]>>1]=g;i=d;return a+16|0}function an(a){a=a|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;g=b[c[a+8>>2]>>1]|0;e=g<<16>>16;f=b[c[a+4>>2]>>1]|0;if(!(g<<16>>16==0)){h=f<<16>>16;h=h-(ba(((h|0)/(e|0)|0)<<16>>16,e)|0)|0;j=h&65535;if(!(j<<16>>16==0)){if(f<<16>>16>0^g<<16>>16>0){f=h+e&65535}else{f=j}}else{f=0}}b[c[a+12>>2]>>1]=f;i=d;return a+16|0}function bn(b){b=b|0;var d=0;d=c[b+4>>2]|0;a[c[b+8>>2]|0]=a[d+1|0]|0;a[c[b+12>>2]|0]=a[d]|0;return b+16|0}function cn(a){a=a|0;var d=0;d=c[a+12>>2]|0;b[d>>1]=b[c[a+8>>2]>>1]|0;b[d+2>>1]=b[c[a+4>>2]>>1]|0;return a+16|0}function dn(a){a=a|0;var d=0,e=0;e=b[c[a+4>>2]>>1]|0;d=e<<16>>16;b[c[a+8>>2]>>1]=e<<16>>16>-1?d:0-d|0;return a+12|0}function en(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1];return a+16|0}function fn(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1];return a+16|0}function gn(a){a=a|0;b[c[a+12>>2]>>1]=(b[c[a+8>>2]>>1]|b[c[a+4>>2]>>1])&65535^65535;return a+16|0}function hn(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]&b[c[a+4>>2]>>1]&65535^65535;return a+16|0}function jn(a){a=a|0;b[c[a+12>>2]>>1]=b[c[a+8>>2]>>1]^b[c[a+4>>2]>>1];return a+16|0}function kn(a){a=a|0;b[c[a+8>>2]>>1]=(e[c[a+4>>2]>>1]|0)^65535;return a+12|0}function ln(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)<(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function mn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)<=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function nn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)==(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function on(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)!=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function pn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)>(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function qn(d){d=d|0;a[c[d+12>>2]|0]=(b[c[d+4>>2]>>1]|0)>=(b[c[d+8>>2]>>1]|0)|0;return d+16|0}function rn(a){a=a|0;b[c[a+8>>2]>>1]=d[c[a+4>>2]|0]|0;return a+12|0}function sn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)>(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function tn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)<(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function un(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)<(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function vn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)>(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function wn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=c[a+4>>2]|0;i=d;return a|0}else{a=a+16|0;i=d;return a|0}return 0}function xn(a){a=a|0;var d=0;d=i;if((b[c[a+8>>2]>>1]|0)==(b[c[a+12>>2]>>1]|0)){a=a+16|0;i=d;return a|0}else{a=c[a+4>>2]|0;i=d;return a|0}return 0}function yn(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function zn(a){a=a|0;b[c[a+8>>2]>>1]=b[c[a+4>>2]>>1]|0;return a+12|0}function An(a){a=a|0;c[c[a+8>>2]>>2]=b[c[a+4>>2]>>1]|0;return a+12|0}function Bn(a){a=a|0;var d=0,e=0;e=b[c[a+4>>2]>>1]|0;d=c[a+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return a+12|0}function Cn(d){d=d|0;a[c[d+8>>2]|0]=b[c[d+4>>2]>>1];return d+12|0}function Dn(a){a=a|0;c[c[a+8>>2]>>2]=b[c[a+4>>2]>>1]|0;return a+12|0}function En(a){a=a|0;var d=0,e=0;e=b[c[a+4>>2]>>1]|0;d=c[a+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;return a+12|0}function Fn(a){a=a|0;g[c[a+8>>2]>>2]=+(b[c[a+4>>2]>>1]|0);return a+12|0}function Gn(a){a=a|0;h[c[a+8>>2]>>3]=+(b[c[a+4>>2]>>1]|0);return a+12|0}function Hn(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+8>>2]>>2]|0)+(c[c[a+4>>2]>>2]|0);return a+16|0}function In(a){a=a|0;c[c[a+12>>2]>>2]=(c[c[a+4>>2]>>2]|0)-(c[c[a+8>>2]>>2]|0);return a+16|0}function Jn(a){a=a|0;var b=0;b=ba(c[c[a+8>>2]>>2]|0,c[c[a+4>>2]>>2]|0)|0;c[c[a+12>>2]>>2]=b;return a+16|0}function Kn(a){a=a|0;var b=0;b=c[c[a+4>>2]>>2]|0;c[c[a+8>>2]>>2]=((b|0)>0)-(b>>>31);return a+12|0}function Ln(a){a=a|0;var b=0;b=c[c[a+8>>2]>>2]|0;if((b|0)==0){b=0}else{b=(c[c[a+4>>2]>>2]|0)%(b|0)|0}c[c[a+12>>2]>>2]=b;return a+16|0}function Mn(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;if((d|0)!=0){f=c[c[a+4>>2]>>2]|0;e=(f|0)/(d|0)|0;if((f|0)!=(ba(e,d)|0)){e=(((f|0)>0^(d|0)>0)<<31>>31)+e|0}}else{e=0}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function Nn(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)!=0){f=(e|0)%(d|0)|0;if((f|0)==0){e=0}else{e=f+((e|0)>0^(d|0)>0?d:0)|0}}c[c[a+12>>2]>>2]=e;i=b;return a+16|0}function On(a){a=a|0;var d=0;d=c[a+4>>2]|0;b[c[a+8>>2]>>1]=b[d+2>>1]|0;b[c[a+12>>2]>>1]=b[d>>1]|0;return a+16|0}function Pn(a){a=a|0;var b=0;b=c[a+12>>2]|0;c[b>>2]=c[c[a+8>>2]>>2];c[b+4>>2]=c[c[a+4>>2]>>2];return a+16|0}function Qn(a){a=a|0;var b=0;b=c[c[a+4>>2]>>2]|0;c[c[a+8>>2]>>2]=(b|0)>-1?b:0-b|0;return a+12|0}function Rn(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2];return a+16|0}function Sn(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2];return a+16|0}function Tn(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]|c[c[a+4>>2]>>2]);return a+16|0}function Un(a){a=a|0;c[c[a+12>>2]>>2]=~(c[c[a+8>>2]>>2]&c[c[a+4>>2]>>2]);return a+16|0}function Vn(a){a=a|0;c[c[a+12>>2]>>2]=c[c[a+8>>2]>>2]^c[c[a+4>>2]>>2];return a+16|0}function Wn(a){a=a|0;c[c[a+8>>2]>>2]=~c[c[a+4>>2]>>2];return a+12|0}function Xn(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)<0){c[c[a+12>>2]>>2]=e>>>(0-d|0);e=a+16|0;i=b;return e|0}else{c[c[a+12>>2]>>2]=e<<d;e=a+16|0;i=b;return e|0}return 0}function Yn(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[c[a+8>>2]>>2]|0;e=c[c[a+4>>2]>>2]|0;if((d|0)<0){c[c[a+12>>2]>>2]=e>>0-d;e=a+16|0;i=b;return e|0}else{c[c[a+12>>2]>>2]=e<<d;e=a+16|0;i=b;return e|0}return 0}function Zn(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)<(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function _n(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)<=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function $n(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)==(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function ao(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)!=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function bo(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function co(b){b=b|0;a[c[b+12>>2]|0]=(c[c[b+4>>2]>>2]|0)>=(c[c[b+8>>2]>>2]|0)|0;return b+16|0}function eo(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function fo(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)<(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function go(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)<(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function ho(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)>(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function io(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function jo(a){a=a|0;var b=0;b=i;if((c[c[a+8>>2]>>2]|0)==(c[c[a+12>>2]>>2]|0)){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function ko(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function lo(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function mo(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function no(a){a=a|0;var b=0,d=0;d=c[c[a+4>>2]>>2]|0;b=c[a+8>>2]|0;c[b>>2]=d;c[b+4>>2]=((d|0)<0)<<31>>31;return a+12|0}function oo(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function po(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function qo(a){a=a|0;var b=0,d=0;d=c[c[a+4>>2]>>2]|0;b=c[a+8>>2]|0;c[b>>2]=d;c[b+4>>2]=((d|0)<0)<<31>>31;return a+12|0}function ro(a){a=a|0;g[c[a+8>>2]>>2]=+(c[c[a+4>>2]>>2]|0);return a+12|0}function so(a){a=a|0;h[c[a+8>>2]>>3]=+(c[c[a+4>>2]>>2]|0);return a+12|0}function to(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=Yt(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function uo(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+4>>2]|0;e=c[a+8>>2]|0;e=Zt(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function vo(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+4>>2]|0;d=c[a+8>>2]|0;e=ju(c[d>>2]|0,c[d+4>>2]|0,c[e>>2]|0,c[e+4>>2]|0)|0;d=c[a+12>>2]|0;c[d>>2]=e;c[d+4>>2]=F;i=b;return a+16|0}function wo(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;f=c[a+4>>2]|0;d=c[f>>2]|0;f=c[f+4>>2]|0;e=_t(d|0,f|0,63)|0;e=(((f|0)>0|(f|0)==0&d>>>0>0)&1)-e|0;d=c[a+8>>2]|0;c[d>>2]=e;c[d+4>>2]=((e|0)<0)<<31>>31;i=b;return a+12|0}function xo(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;if((e|0)==0&(d|0)==0){e=0;d=0}else{f=c[a+4>>2]|0;e=iu(c[f>>2]|0,c[f+4>>2]|0,e|0,d|0)|0;d=F}f=c[a+12>>2]|0;c[f>>2]=e;c[f+4>>2]=d;i=b;return a+16|0}function yo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;e=c[a+8>>2]|0;f=c[e>>2]|0;e=c[e+4>>2]|0;if(!((f|0)==0&(e|0)==0)){j=c[a+4>>2]|0;h=c[j>>2]|0;j=c[j+4>>2]|0;g=hu(h|0,j|0,f|0,e|0)|0;d=F;k=ju(g|0,d|0,f|0,e|0)|0;if(!((h|0)==(k|0)&(j|0)==(F|0))){k=(((j|0)>0|(j|0)==0&h>>>0>0)^((e|0)>0|(e|0)==0&f>>>0>0))<<31>>31;g=Yt(k|0,((k|0)<0)<<31>>31|0,g|0,d|0)|0;d=F}}else{g=0;d=0}k=c[a+12>>2]|0;c[k>>2]=g;c[k+4>>2]=d;i=b;return a+16|0}function zo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;f=c[a+4>>2]|0;j=c[f>>2]|0;f=c[f+4>>2]|0;if(!((e|0)==0&(d|0)==0)){h=iu(j|0,f|0,e|0,d|0)|0;g=F;if((h|0)==0&(g|0)==0){j=0;f=0}else{f=((f|0)>0|(f|0)==0&j>>>0>0)^((d|0)>0|(d|0)==0&e>>>0>0);j=Yt(h|0,g|0,(f?e:0)|0,(f?d:0)|0)|0;f=F}}h=c[a+12>>2]|0;c[h>>2]=j;c[h+4>>2]=f;i=b;return a+16|0}function Ao(a){a=a|0;var b=0;b=c[a+4>>2]|0;c[c[a+8>>2]>>2]=c[b+4>>2];c[c[a+12>>2]>>2]=c[b>>2];return a+16|0}function Bo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;d=i;e=c[a+4>>2]|0;g=c[e>>2]|0;e=c[e+4>>2]|0;f=(e|0)>-1|(e|0)==-1&g>>>0>4294967295;h=Zt(0,0,g|0,e|0)|0;b=c[a+8>>2]|0;c[b>>2]=f?g:h;c[b+4>>2]=f?e:F;i=d;return a+12|0}function Co(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]&c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]&c[e>>2];c[b+4>>2]=d;return a+16|0}function Do(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]|c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]|c[e>>2];c[b+4>>2]=d;return a+16|0}function Eo(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]|c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]|c[e>>2]);c[b+4>>2]=d;return a+16|0}function Fo(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=~(c[f+4>>2]&c[e+4>>2]);b=c[a+12>>2]|0;c[b>>2]=~(c[f>>2]&c[e>>2]);c[b+4>>2]=d;return a+16|0}function Go(a){a=a|0;var b=0,d=0,e=0,f=0;e=c[a+4>>2]|0;f=c[a+8>>2]|0;d=c[f+4>>2]^c[e+4>>2];b=c[a+12>>2]|0;c[b>>2]=c[f>>2]^c[e>>2];c[b+4>>2]=d;return a+16|0}function Ho(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=~c[e+4>>2];b=c[a+8>>2]|0;c[b>>2]=~c[e>>2];c[b+4>>2]=d;return a+12|0}function Io(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0)&1;return b+16|0}function Jo(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<=(c[d>>2]|0)>>>0)&1;return b+16|0}function Ko(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=(c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)&1;return b+16|0}function Lo(b){b=b|0;var d=0,e=0;e=c[b+4>>2]|0;d=c[b+8>>2]|0;a[c[b+12>>2]|0]=((c[e>>2]|0)!=(c[d>>2]|0)|(c[e+4>>2]|0)!=(c[d+4>>2]|0))&1;return b+16|0}function Mo(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0)&1;return b+16|0}function No(b){b=b|0;var d=0,e=0,f=0,g=0;e=c[b+4>>2]|0;g=c[e+4>>2]|0;d=c[b+8>>2]|0;f=c[d+4>>2]|0;a[c[b+12>>2]|0]=((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>=(c[d>>2]|0)>>>0)&1;return b+16|0}function Oo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function Po(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function Qo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)<(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0<(c[d>>2]|0)>>>0){g=c[a+4>>2]|0;i=b;return g|0}else{g=a+16|0;i=b;return g|0}return 0}function Ro(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;e=c[a+8>>2]|0;g=c[e+4>>2]|0;d=c[a+12>>2]|0;f=c[d+4>>2]|0;if((g|0)>(f|0)|(g|0)==(f|0)&(c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){g=a+16|0;i=b;return g|0}else{g=c[a+4>>2]|0;i=b;return g|0}return 0}function So(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=c[a+4>>2]|0;i=b;return e|0}else{e=a+16|0;i=b;return e|0}return 0}function To(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[a+8>>2]|0;d=c[a+12>>2]|0;if((c[e>>2]|0)==(c[d>>2]|0)&(c[e+4>>2]|0)==(c[d+4>>2]|0)){e=a+16|0;i=b;return e|0}else{e=c[a+4>>2]|0;i=b;return e|0}return 0}function Uo(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function Vo(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function Wo(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function Xo(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function Yo(b){b=b|0;a[c[b+8>>2]|0]=c[c[b+4>>2]>>2];return b+12|0}function Zo(a){a=a|0;b[c[a+8>>2]>>1]=c[c[a+4>>2]>>2];return a+12|0}function _o(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function $o(a){a=a|0;var b=0;b=c[a+4>>2]|0;g[c[a+8>>2]>>2]=+((c[b>>2]|0)>>>0)+4294967296.0*+(c[b+4>>2]|0);return a+12|0}function ap(a){a=a|0;var b=0;b=c[a+4>>2]|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+(c[b+4>>2]|0);return a+12|0}function bp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]+ +g[c[a+8>>2]>>2];return a+16|0}function cp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]- +g[c[a+8>>2]>>2];return a+16|0}function dp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]*+g[c[a+8>>2]>>2];return a+16|0}function ep(a){a=a|0;var b=0.0;b=+g[c[a+4>>2]>>2];g[c[a+8>>2]>>2]=+((b>0.0)-(b<0.0)|0);return a+12|0}function fp(a){a=a|0;g[c[a+12>>2]>>2]=+g[c[a+4>>2]>>2]/+g[c[a+8>>2]>>2];return a+16|0}function gp(a){a=a|0;var b=0.0;b=+T(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function hp(a){a=a|0;var b=0.0;b=+U(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function ip(a){a=a|0;var b=0.0;b=+V(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function jp(a){a=a|0;var b=0.0;b=1.0/+T(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function kp(a){a=a|0;var b=0.0;b=1.0/+U(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function lp(a){a=a|0;var b=0,d=0.0;b=i;d=+ib(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=d;i=b;return a+12|0}function mp(a){a=a|0;var b=0.0;b=+$(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function np(a){a=a|0;var b=0,d=0.0;b=i;d=+Qa(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=d;i=b;return a+12|0}function op(a){a=a|0;var b=0.0;b=+_(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function pp(a){a=a|0;var b=0.0;b=+R(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function qp(a){a=a|0;var b=0.0;b=+S(+(+g[c[a+4>>2]>>2]),+(+g[c[a+8>>2]>>2]));g[c[a+12>>2]>>2]=b;return a+16|0}function rp(a){a=a|0;var b=0.0;b=+X(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function sp(a){a=a|0;var b=0.0;b=+W(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function tp(a){a=a|0;var b=0.0;b=+Y(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function up(a){a=a|0;var b=0.0;b=+Z(+(+g[c[a+4>>2]>>2]),+(+g[c[a+8>>2]>>2]));g[c[a+12>>2]>>2]=b;return a+16|0}function vp(a){a=a|0;var b=0.0;b=+aa(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function wp(a){a=a|0;var b=0.0;b=+Q(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function xp(a){a=a|0;var b=0.0;b=+P(+(+g[c[a+4>>2]>>2]));g[c[a+8>>2]>>2]=b;return a+12|0}function yp(a){a=a|0;var b=0.0;b=+P(+(+g[c[a+4>>2]>>2]/+g[c[a+8>>2]>>2]));g[c[a+12>>2]>>2]=b;return a+16|0}function zp(a){a=a|0;var b=0.0,d=0.0;d=+g[c[a+4>>2]>>2];b=+g[c[a+8>>2]>>2];b=d-b*+P(+(d/b));g[c[a+12>>2]>>2]=b;return a+16|0}function Ap(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]<+g[c[b+8>>2]>>2]|0;return b+16|0}function Bp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]<=+g[c[b+8>>2]>>2]|0;return b+16|0}function Cp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]==+g[c[b+8>>2]>>2]|0;return b+16|0}function Dp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]!=+g[c[b+8>>2]>>2]|0;return b+16|0}function Ep(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]>+g[c[b+8>>2]>>2]|0;return b+16|0}function Fp(b){b=b|0;a[c[b+12>>2]|0]=+g[c[b+4>>2]>>2]>=+g[c[b+8>>2]>>2]|0;return b+16|0}function Gp(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]>+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Hp(a){a=a|0;var b=0;b=i;if(!(+g[c[a+8>>2]>>2]>=+g[c[a+12>>2]>>2])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Ip(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]<+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Jp(a){a=a|0;var b=0;b=i;if(!(+g[c[a+8>>2]>>2]<=+g[c[a+12>>2]>>2])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Kp(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]==+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Lp(a){a=a|0;var b=0;b=i;if(+g[c[a+8>>2]>>2]!=+g[c[a+12>>2]>>2]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Mp(b){b=b|0;var d=0,e=0.0,f=0;d=i;e=+g[c[b+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;do{if(!(f>>>0>2139095040)){if((f|0)==2139095040){a[c[b+8>>2]|0]=!(e<0.0)<<31>>31;break}else{f=~~+Yb(+e)&255;a[c[b+8>>2]|0]=f;break}}else{a[c[b+8>>2]|0]=-1}}while(0);i=d;return b+12|0}function Np(a){a=a|0;var d=0,e=0.0,f=0;d=i;e=+g[c[a+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;if(f>>>0>2139095040){b[c[a+8>>2]>>1]=-1;f=a+12|0;i=d;return f|0}if((f|0)==2139095040){b[c[a+8>>2]>>1]=!(e<0.0)<<31>>31;f=a+12|0;i=d;return f|0}else{f=~~+Yb(+e)&65535;b[c[a+8>>2]>>1]=f;f=a+12|0;i=d;return f|0}return 0}function Op(a){a=a|0;var b=0,d=0.0,e=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){c[c[a+8>>2]>>2]=-1;e=a+12|0;i=b;return e|0}if((e|0)==2139095040){c[c[a+8>>2]>>2]=!(d<0.0)<<31>>31;e=a+12|0;i=b;return e|0}else{e=~~+Yb(+d)>>>0;c[c[a+8>>2]>>2]=e;e=a+12|0;i=b;return e|0}return 0}function Pp(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){e=c[a+8>>2]|0;c[e>>2]=-1;c[e+4>>2]=-1;e=a+12|0;i=b;return e|0}if((e|0)==2139095040){f=!(d<0.0)<<31>>31;e=c[a+8>>2]|0;c[e>>2]=f;c[e+4>>2]=((f|0)<0)<<31>>31;e=a+12|0;i=b;return e|0}else{d=+Yb(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Qp(b){b=b|0;var d=0,e=0.0,f=0;d=i;e=+g[c[b+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;do{if(!(f>>>0>2139095040)){if((f|0)==2139095040){a[c[b+8>>2]|0]=e<0.0?-128:127;break}else{f=~~+Yb(+e);a[c[b+8>>2]|0]=f;break}}else{a[c[b+8>>2]|0]=127}}while(0);i=d;return b+12|0}function Rp(a){a=a|0;var d=0,e=0.0,f=0;d=i;e=+g[c[a+4>>2]>>2];f=(g[k>>2]=e,c[k>>2]|0)&2147483647;if(f>>>0>2139095040){b[c[a+8>>2]>>1]=32767;f=a+12|0;i=d;return f|0}if((f|0)==2139095040){b[c[a+8>>2]>>1]=e<0.0?-32768:32767;f=a+12|0;i=d;return f|0}else{f=~~+Yb(+e);b[c[a+8>>2]>>1]=f;f=a+12|0;i=d;return f|0}return 0}function Sp(a){a=a|0;var b=0,d=0.0,e=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){c[c[a+8>>2]>>2]=2147483647;e=a+12|0;i=b;return e|0}if((e|0)==2139095040){c[c[a+8>>2]>>2]=d<0.0?-2147483648:2147483647;e=a+12|0;i=b;return e|0}else{e=~~+Yb(+d);c[c[a+8>>2]>>2]=e;e=a+12|0;i=b;return e|0}return 0}function Tp(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+g[c[a+4>>2]>>2];e=(g[k>>2]=d,c[k>>2]|0)&2147483647;if(e>>>0>2139095040){f=c[a+8>>2]|0;c[f>>2]=-1;c[f+4>>2]=2147483647;f=a+12|0;i=b;return f|0}if((e|0)==2139095040){f=d<0.0;e=c[a+8>>2]|0;c[e>>2]=f?0:-1;c[e+4>>2]=f?-2147483648:2147483647;f=a+12|0;i=b;return f|0}else{d=+Yb(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Up(a){a=a|0;h[c[a+8>>2]>>3]=+g[c[a+4>>2]>>2];return a+12|0}function Vp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]+ +h[c[a+8>>2]>>3];return a+16|0}function Wp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]- +h[c[a+8>>2]>>3];return a+16|0}function Xp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]*+h[c[a+8>>2]>>3];return a+16|0}function Yp(a){a=a|0;var b=0.0;b=+h[c[a+4>>2]>>3];h[c[a+8>>2]>>3]=+((b>0.0)-(b<0.0)|0);return a+12|0}function Zp(a){a=a|0;h[c[a+12>>2]>>3]=+h[c[a+4>>2]>>3]/+h[c[a+8>>2]>>3];return a+16|0}function _p(a){a=a|0;var b=0.0;b=+T(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function $p(a){a=a|0;var b=0.0;b=+U(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function aq(a){a=a|0;var b=0.0;b=+V(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function bq(a){a=a|0;var b=0.0;b=1.0/+T(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function cq(a){a=a|0;var b=0.0;b=1.0/+U(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function dq(a){a=a|0;var b=0,d=0.0;b=i;d=+ib(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=d;i=b;return a+12|0}function eq(a){a=a|0;var b=0.0;b=+$(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function fq(a){a=a|0;var b=0,d=0.0;b=i;d=+Qa(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=d;i=b;return a+12|0}function gq(a){a=a|0;var b=0.0;b=+_(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function hq(a){a=a|0;var b=0.0;b=+R(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function iq(a){a=a|0;var b=0.0;b=+S(+(+h[c[a+4>>2]>>3]),+(+h[c[a+8>>2]>>3]));h[c[a+12>>2]>>3]=b;return a+16|0}function jq(a){a=a|0;var b=0.0;b=+X(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function kq(a){a=a|0;var b=0.0;b=+W(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function lq(a){a=a|0;var b=0.0;b=+Y(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function mq(a){a=a|0;var b=0.0;b=+Z(+(+h[c[a+4>>2]>>3]),+(+h[c[a+8>>2]>>3]));h[c[a+12>>2]>>3]=b;return a+16|0}function nq(a){a=a|0;var b=0.0;b=+aa(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function oq(a){a=a|0;var b=0.0;b=+Q(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function pq(a){a=a|0;var b=0.0;b=+P(+(+h[c[a+4>>2]>>3]));h[c[a+8>>2]>>3]=b;return a+12|0}function qq(a){a=a|0;var b=0.0;b=+P(+(+h[c[a+4>>2]>>3]/+h[c[a+8>>2]>>3]));h[c[a+12>>2]>>3]=b;return a+16|0}function rq(a){a=a|0;var b=0.0,d=0.0;d=+h[c[a+4>>2]>>3];b=+h[c[a+8>>2]>>3];b=d-b*+P(+(d/b));h[c[a+12>>2]>>3]=b;return a+16|0}function sq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]<+h[c[b+8>>2]>>3]|0;return b+16|0}function tq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]<=+h[c[b+8>>2]>>3]|0;return b+16|0}function uq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]==+h[c[b+8>>2]>>3]|0;return b+16|0}function vq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]!=+h[c[b+8>>2]>>3]|0;return b+16|0}function wq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]>+h[c[b+8>>2]>>3]|0;return b+16|0}function xq(b){b=b|0;a[c[b+12>>2]|0]=+h[c[b+4>>2]>>3]>=+h[c[b+8>>2]>>3]|0;return b+16|0}function yq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]>+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function zq(a){a=a|0;var b=0;b=i;if(!(+h[c[a+8>>2]>>3]>=+h[c[a+12>>2]>>3])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Aq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]<+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Bq(a){a=a|0;var b=0;b=i;if(!(+h[c[a+8>>2]>>3]<=+h[c[a+12>>2]>>3])){a=a+16|0;i=b;return a|0}else{a=c[a+4>>2]|0;i=b;return a|0}return 0}function Cq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]==+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Dq(a){a=a|0;var b=0;b=i;if(+h[c[a+8>>2]>>3]!=+h[c[a+12>>2]>>3]){a=c[a+4>>2]|0;i=b;return a|0}else{a=a+16|0;i=b;return a|0}return 0}function Eq(b){b=b|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[b+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){a[c[b+8>>2]|0]=-1;g=b+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){a[c[b+8>>2]|0]=!(e<0.0)<<31>>31;g=b+12|0;i=d;return g|0}else{g=~~+Yb(+e)&255;a[c[b+8>>2]|0]=g;g=b+12|0;i=d;return g|0}return 0}function Fq(a){a=a|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[a+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){b[c[a+8>>2]>>1]=-1;g=a+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){b[c[a+8>>2]>>1]=!(e<0.0)<<31>>31;g=a+12|0;i=d;return g|0}else{g=~~+Yb(+e)&65535;b[c[a+8>>2]>>1]=g;g=a+12|0;i=d;return g|0}return 0}function Gq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){c[c[a+8>>2]>>2]=-1;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){c[c[a+8>>2]>>2]=!(d<0.0)<<31>>31;f=a+12|0;i=b;return f|0}else{f=~~+Yb(+d)>>>0;c[c[a+8>>2]>>2]=f;f=a+12|0;i=b;return f|0}return 0}function Hq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){f=c[a+8>>2]|0;c[f>>2]=-1;c[f+4>>2]=-1;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){e=!(d<0.0)<<31>>31;f=c[a+8>>2]|0;c[f>>2]=e;c[f+4>>2]=((e|0)<0)<<31>>31;f=a+12|0;i=b;return f|0}else{d=+Yb(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Iq(b){b=b|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[b+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){a[c[b+8>>2]|0]=127;g=b+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){a[c[b+8>>2]|0]=e<0.0?-128:127;g=b+12|0;i=d;return g|0}else{g=~~+Yb(+e);a[c[b+8>>2]|0]=g;g=b+12|0;i=d;return g|0}return 0}function Jq(a){a=a|0;var d=0,e=0.0,f=0,g=0;d=i;e=+h[c[a+4>>2]>>3];h[k>>3]=e;f=c[k>>2]|0;g=c[k+4>>2]&2147483647;if(g>>>0>2146435072|(g|0)==2146435072&f>>>0>0){b[c[a+8>>2]>>1]=32767;g=a+12|0;i=d;return g|0}if((f|0)==0&(g|0)==2146435072){b[c[a+8>>2]>>1]=e<0.0?-32768:32767;g=a+12|0;i=d;return g|0}else{g=~~+Yb(+e);b[c[a+8>>2]>>1]=g;g=a+12|0;i=d;return g|0}return 0}function Kq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){c[c[a+8>>2]>>2]=2147483647;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){c[c[a+8>>2]>>2]=d<0.0?-2147483648:2147483647;f=a+12|0;i=b;return f|0}else{f=~~+Yb(+d);c[c[a+8>>2]>>2]=f;f=a+12|0;i=b;return f|0}return 0}function Lq(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+h[c[a+4>>2]>>3];h[k>>3]=d;e=c[k>>2]|0;f=c[k+4>>2]&2147483647;if(f>>>0>2146435072|(f|0)==2146435072&e>>>0>0){f=c[a+8>>2]|0;c[f>>2]=-1;c[f+4>>2]=2147483647;f=a+12|0;i=b;return f|0}if((e|0)==0&(f|0)==2146435072){f=d<0.0;e=c[a+8>>2]|0;c[e>>2]=f?0:-1;c[e+4>>2]=f?-2147483648:2147483647;f=a+12|0;i=b;return f|0}else{d=+Yb(+d);e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=c[a+8>>2]|0;c[f>>2]=~~d>>>0;c[f+4>>2]=e;f=a+12|0;i=b;return f|0}return 0}function Mq(a){a=a|0;g[c[a+8>>2]>>2]=+h[c[a+4>>2]>>3];return a+12|0}function Nq(b){b=b|0;var d=0,e=0,f=0,g=0.0;d=i;e=b+4|0;if((c[e>>2]|0)==0){e=b+8|0;i=d;return e|0}if((a[28976]|0)==0){f=ys()|0;Za(f|0);a[28976]=1}g=+(Wt()|0)*4.656612873077393e-10;h[c[e>>2]>>3]=g;f=b+8|0;i=d;return f|0}function Oq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Pq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)<=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Qq(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)==(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Rq(b){b=b|0;a[c[b+12>>2]|0]=(a[c[b+4>>2]|0]|0)!=(a[c[b+8>>2]|0]|0)|0;return b+16|0}function Sq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Tq(b){b=b|0;a[c[b+12>>2]|0]=(d[c[b+4>>2]|0]|0)>=(d[c[b+8>>2]|0]|0)|0;return b+16|0}function Uq(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;g=c[c[b+4>>2]>>2]|0;h=g+12|0;d=c[h>>2]|0;f=c[c[b+8>>2]>>2]|0;j=g+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;l=g+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=g+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((c[(c[j>>2]|0)+16>>2]&255|0)!=1){o=b+16|0;i=e;return o|0}do{if((k|0)>-1){if((k|0)<(f|0)){o=b+16|0;i=e;return o|0}}else{if((k|0)!=-2147483648&(f|0)>(0-k|0)){o=b+16|0;i=e;return o|0}if((n|0)!=(f|0)){if(Md(g,ba(c[(c[h>>2]|0)+12>>2]|0,f)|0,n,f,1)|0){c[g+16>>2]=f;break}else{o=b+16|0;i=e;return o|0}}}}while(0);h=c[b+12>>2]|0;j=c[g>>2]|0;g=c[d+12>>2]|0;if((c[d+16>>2]&2097152|0)!=0&(g|0)==1){bu(j|0,a[h]|0,f|0)|0;o=b+16|0;i=e;return o|0}o=ba(g,f)|0;f=j+o|0;if((o|0)<=0){o=b+16|0;i=e;return o|0}do{$b[c[(c[d>>2]|0)+52>>2]&63](d,h,j)|0;j=j+g|0}while(j>>>0<f>>>0);o=b+16|0;i=e;return o|0}function Vq(a){a=a|0;var b=0;b=c[c[a+4>>2]>>2]|0;c[c[a+8>>2]>>2]=((c[b+4>>2]|0)-(c[b>>2]|0)|0)/(c[(c[b+12>>2]|0)+12>>2]|0)|0;return a+12|0}function Wq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;f=c[c[a+4>>2]>>2]|0;g=c[(c[f+8>>2]|0)+16>>2]&255;d=f+(g<<2)+16|0;if((g|0)==0){e=1}else{e=1;g=f+16|0;while(1){f=g+4|0;e=ba(c[g>>2]|0,e)|0;if(f>>>0<d>>>0){g=f}else{break}}}c[c[a+8>>2]>>2]=e;i=b;return a+12|0}function Xq(a){a=a|0;c[c[a+8>>2]>>2]=c[(c[(c[c[a+4>>2]>>2]|0)+8>>2]|0)+16>>2]&255;return a+12|0}function Yq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;f=i;b=c[c[a+4>>2]>>2]|0;d=c[c[a+8>>2]>>2]|0;e=b+8|0;g=c[e>>2]|0;l=c[g+16>>2]&255;h=b+(l<<2)+16|0;if((l|0)==0){k=1}else{k=1;l=b+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}g=c[(dc[c[(c[g>>2]|0)+36>>2]&1023](g)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(g|0)>-1){l=a+12|0;i=f;return l|0}if((g|0)!=-2147483648&(d|0)>(0-g|0)|(k|0)==(d|0)){l=a+12|0;i=f;return l|0}if(!(Md(b,ba(c[(c[b+12>>2]|0)+12>>2]|0,d)|0,k,d,1)|0)){l=a+12|0;i=f;return l|0}c[b+16>>2]=d;l=a+12|0;i=f;return l|0}function Zq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;d=i;b=c[c[a+4>>2]>>2]|0;j=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(j<<2)+16|0;if((j|0)==0){e=1}else{h=1;g=b+16|0;while(1){f=g+4|0;h=ba(c[g>>2]|0,h)|0;if(f>>>0<e>>>0){g=f}else{e=h;break}}}f=c[b+12>>2]|0;g=c[c[a+8>>2]>>2]|0;h=a+12|0;j=c[h>>2]|0;if((j|0)==0){j=a+16|0;i=d;return j|0}if((g|0)>-1&(g|0)<(e|0)){e=c[(c[f>>2]|0)+52>>2]|0;j=Nd(b,g)|0;$b[e&63](f,j,c[h>>2]|0)|0;j=a+16|0;i=d;return j|0}else{$b[c[(c[f>>2]|0)+48>>2]&63](f,j,0)|0;j=a+16|0;i=d;return j|0}return 0}function _q(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;d=i;b=c[c[a+4>>2]>>2]|0;h=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(h<<2)+16|0;if((h|0)==0){g=1}else{g=1;h=b+16|0;while(1){f=h+4|0;g=ba(c[h>>2]|0,g)|0;if(f>>>0<e>>>0){h=f}else{break}}}Pd(b,g,1,c[a+8>>2]|0)|0;i=d;return a+12|0}function $q(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;j=i;h=c[a+4>>2]|0;d=c[h>>2]|0;g=c[a+8>>2]|0;b=c[g>>2]|0;f=c[d+12>>2]|0;e=c[c[a+12>>2]>>2]|0;n=c[(c[b+8>>2]|0)+16>>2]&255;k=b+(n<<2)+16|0;if((n|0)==0){m=1}else{m=1;n=b+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<k>>>0){n=l}else{break}}}if((d|0)!=(b|0)){n=c[d+8>>2]|0;$b[c[(c[n>>2]|0)+52>>2]&63](n,g,h)|0}if(!((e|0)>-1&(e|0)<(m|0))){n=a+20|0;i=j;return n|0}n=Nd(d,e)|0;$b[c[(c[f>>2]|0)+52>>2]&63](f,c[a+16>>2]|0,n)|0;n=a+20|0;i=j;return n|0}function ar(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;i=i+16|0;g=b;k=c[a+4>>2]|0;f=c[k>>2]|0;j=c[a+8>>2]|0;h=c[j>>2]|0;d=c[c[a+12>>2]>>2]|0;e=c[c[a+16>>2]>>2]|0;if((f|0)==(e|0)){c[g>>2]=29616;c[g+4>>2]=29599;c[g+8>>2]=94;$a(8,g|0)|0;jb(1)}if((f|0)!=(h|0)){o=c[f+8>>2]|0;$b[c[(c[o>>2]|0)+52>>2]&63](o,j,k)|0}if(!((d|0)>-1)){o=a+20|0;i=b;return o|0}l=c[(c[f+8>>2]|0)+16>>2]&255;j=f+(l<<2)+16|0;l=(l|0)==0;if(l){n=1}else{n=1;m=f+16|0;while(1){k=m+4|0;n=ba(c[m>>2]|0,n)|0;if(k>>>0<j>>>0){m=k}else{break}}}if((d|0)>=(n|0)){o=a+20|0;i=b;return o|0}o=c[(c[e+8>>2]|0)+16>>2]&255;n=e+(o<<2)+16|0;if((o|0)==0){k=1}else{k=1;o=e+16|0;while(1){m=o+4|0;k=ba(c[o>>2]|0,k)|0;if(m>>>0<n>>>0){o=m}else{break}}}if(l){m=1}else{m=1;n=f+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<j>>>0){n=l}else{break}}}l=m-d|0;h=c[h+12>>2]|0;if((c[e+12>>2]|0)==0){c[g>>2]=33152;c[g+4>>2]=8906;c[g+8>>2]=856;$a(8,g|0)|0;jb(1)}j=c[e>>2]|0;if(j>>>0>(c[e+4>>2]|0)>>>0){c[g>>2]=33176;c[g+4>>2]=8906;c[g+8>>2]=858;$a(8,g|0)|0;jb(1)}f=Nd(f,d)|0;d=c[h+12>>2]|0;g=ba(d,(k|0)<(l|0)?k:l)|0;if((c[h+16>>2]&2097152|0)!=0){au(f|0,j|0,g|0)|0;o=a+20|0;i=b;return o|0}e=j+g|0;if((g|0)<=0){o=a+20|0;i=b;return o|0}while(1){if(($b[c[(c[h>>2]|0)+52>>2]&63](h,j,f)|0)!=0){d=25;break}j=j+d|0;if(j>>>0<e>>>0){f=f+d|0}else{d=25;break}}if((d|0)==25){o=a+20|0;i=b;return o|0}return 0}function br(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=i;i=i+16|0;e=b;d=c[c[a+4>>2]>>2]|0;f=c[c[a+8>>2]>>2]|0;j=c[a+12>>2]|0;if((j|0)!=0){j=c[j>>2]|0;k=(j|0)>0?j:0;j=(d|0)!=(f|0);if(j|(k|0)==0){g=k;h=j}else{c[e>>2]=29640;c[e+4>>2]=29599;c[e+8>>2]=112;$a(8,e|0)|0;jb(1)}}else{g=0;h=(d|0)!=(f|0)}j=f+8|0;q=c[(c[j>>2]|0)+16>>2]&255;l=f+(q<<2)+16|0;if((q|0)==0){m=1}else{m=1;n=f+16|0;while(1){k=n+4|0;m=ba(c[n>>2]|0,m)|0;if(k>>>0<l>>>0){n=k}else{break}}}k=m-g|0;k=(k|0)>0?k:0;l=c[a+16>>2]|0;if((l|0)==0){l=k}else{l=c[l>>2]|0}l=(l|0)>0?l:0;k=(l|0)<(k|0)?l:k;l=d+8|0;m=c[l>>2]|0;q=c[m+16>>2]&255;n=d+(q<<2)+16|0;if((q|0)==0){p=1}else{p=1;q=d+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(k|0)>(0-m|0)|(p|0)==(k|0)):0)?Md(d,ba(c[(c[d+12>>2]|0)+12>>2]|0,k)|0,p,k,1)|0:0){c[d+16>>2]=k}q=c[(c[j>>2]|0)+16>>2]&255;l=f+(q<<2)+16|0;if((q|0)==0){n=1}else{n=1;m=f+16|0;while(1){j=m+4|0;n=ba(c[m>>2]|0,n)|0;if(j>>>0<l>>>0){m=j}else{break}}}if((g|0)>=(n|0)|h^1){q=a+20|0;i=b;return q|0}q=d+12|0;h=c[q>>2]|0;f=Nd(f,g)|0;if((c[q>>2]|0)==0){c[e>>2]=33152;c[e+4>>2]=8906;c[e+8>>2]=856;$a(8,e|0)|0;jb(1)}g=c[d>>2]|0;if(g>>>0>(c[d+4>>2]|0)>>>0){c[e>>2]=33176;c[e+4>>2]=8906;c[e+8>>2]=858;$a(8,e|0)|0;jb(1)}d=c[h+12>>2]|0;j=ba(d,k)|0;if((c[h+16>>2]&2097152|0)!=0){au(g|0,f|0,j|0)|0;q=a+20|0;i=b;return q|0}e=f+j|0;if((j|0)<=0){q=a+20|0;i=b;return q|0}while(1){if(($b[c[(c[h>>2]|0)+52>>2]&63](h,f,g)|0)!=0){d=30;break}f=f+d|0;if(f>>>0<e>>>0){g=g+d|0}else{d=30;break}}if((d|0)==30){q=a+20|0;i=b;return q|0}return 0}function cr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;g=i;e=c[a+4>>2]|0;b=c[e>>2]|0;d=c[a+8>>2]|0;f=c[d>>2]|0;l=c[(c[f+8>>2]|0)+16>>2]&255;h=f+(l<<2)+16|0;if((l|0)==0){k=1}else{k=1;l=f+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}h=c[a+12>>2]|0;if((h|0)==0){h=k}else{h=c[h>>2]|0}if((b|0)!=(f|0)){l=c[b+8>>2]|0;$b[c[(c[l>>2]|0)+52>>2]&63](l,d,e)|0}if((h|0)<0|(h|0)>(k|0)){l=a+20|0;i=g;return l|0}Pd(b,h,1,c[a+16>>2]|0)|0;l=a+20|0;i=g;return l|0}function dr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;i=i+16|0;h=b;l=c[a+4>>2]|0;d=c[l>>2]|0;m=c[a+8>>2]|0;e=c[m>>2]|0;r=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(r<<2)+16|0;if((r|0)==0){f=1}else{f=1;k=e+16|0;while(1){j=k+4|0;f=ba(c[k>>2]|0,f)|0;if(j>>>0<g>>>0){k=j}else{break}}}g=c[a+12>>2]|0;if((g|0)==0){g=f}else{g=c[g>>2]|0}k=c[c[a+16>>2]>>2]|0;r=c[(c[k+8>>2]|0)+16>>2]&255;o=k+(r<<2)+16|0;if((r|0)==0){j=1}else{j=1;p=k+16|0;while(1){n=p+4|0;j=ba(c[p>>2]|0,j)|0;if(n>>>0<o>>>0){p=n}else{break}}}if((d|0)==(k|0)){c[h>>2]=29616;c[h+4>>2]=29599;c[h+8>>2]=155;$a(8,h|0)|0;jb(1)}n=(d|0)==(e|0);if((g|0)<0|(g|0)>(f|0)){if(n){r=a+20|0;i=b;return r|0}r=c[d+8>>2]|0;$b[c[(c[r>>2]|0)+52>>2]&63](r,m,l)|0;r=a+20|0;i=b;return r|0}if(n){if((c[k+12>>2]|0)==0){c[h>>2]=33152;c[h+4>>2]=8906;c[h+8>>2]=856;$a(8,h|0)|0;jb(1)}e=c[k>>2]|0;if(e>>>0>(c[k+4>>2]|0)>>>0){c[h>>2]=33176;c[h+4>>2]=8906;c[h+8>>2]=858;$a(8,h|0)|0;jb(1)}Pd(d,g,j,e)|0;r=a+20|0;i=b;return r|0}m=j+f|0;l=d+8|0;n=c[l>>2]|0;r=c[n+16>>2]&255;o=d+(r<<2)+16|0;if((r|0)==0){r=1}else{r=1;q=d+16|0;while(1){p=q+4|0;r=ba(c[q>>2]|0,r)|0;if(p>>>0<o>>>0){q=p}else{break}}}n=c[(dc[c[(c[n>>2]|0)+36>>2]&1023](n)|0)>>2]|0;if((!((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(n|0)>-1)?!((n|0)!=-2147483648&(m|0)>(0-n|0)|(r|0)==(m|0)):0)?Md(d,ba(c[(c[d+12>>2]|0)+12>>2]|0,m)|0,r,m,1)|0:0){c[d+16>>2]=m}l=d+12|0;m=c[l>>2]|0;if((c[e+12>>2]|0)==0){c[h>>2]=33152;c[h+4>>2]=8906;c[h+8>>2]=856;$a(8,h|0)|0;jb(1)}p=c[e>>2]|0;if(p>>>0>(c[e+4>>2]|0)>>>0){c[h>>2]=33176;c[h+4>>2]=8906;c[h+8>>2]=858;$a(8,h|0)|0;jb(1)}if((m|0)==0){c[h>>2]=33152;c[h+4>>2]=8906;c[h+8>>2]=856;$a(8,h|0)|0;jb(1)}q=c[d>>2]|0;if(q>>>0>(c[d+4>>2]|0)>>>0){c[h>>2]=33176;c[h+4>>2]=8906;c[h+8>>2]=858;$a(8,h|0)|0;jb(1)}o=c[m+12>>2]|0;r=ba(o,g)|0;a:do{if((c[m+16>>2]&2097152|0)==0){n=p+r|0;if((r|0)>0){while(1){if(($b[c[(c[m>>2]|0)+52>>2]&63](m,p,q)|0)!=0){break a}p=p+o|0;if(!(p>>>0<n>>>0)){break}else{q=q+o|0}}}}else{au(q|0,p|0,r|0)|0}}while(0);m=c[l>>2]|0;if((c[k+12>>2]|0)==0){c[h>>2]=33152;c[h+4>>2]=8906;c[h+8>>2]=856;$a(8,h|0)|0;jb(1)}n=c[k>>2]|0;if(n>>>0>(c[k+4>>2]|0)>>>0){c[h>>2]=33176;c[h+4>>2]=8906;c[h+8>>2]=858;$a(8,h|0)|0;jb(1)}o=Nd(d,g)|0;k=c[m+12>>2]|0;p=ba(k,j)|0;b:do{if((c[m+16>>2]&2097152|0)==0){h=n+p|0;if((p|0)>0){while(1){if(($b[c[(c[m>>2]|0)+52>>2]&63](m,n,o)|0)!=0){break b}n=n+k|0;if(!(n>>>0<h>>>0)){break}else{o=o+k|0}}}}else{au(o|0,n|0,p|0)|0}}while(0);h=c[l>>2]|0;e=Nd(e,g)|0;j=Nd(d,j+g|0)|0;d=c[h+12>>2]|0;g=ba(d,f-g|0)|0;if((c[h+16>>2]&2097152|0)!=0){au(j|0,e|0,g|0)|0;r=a+20|0;i=b;return r|0}f=e+g|0;if((g|0)<=0){r=a+20|0;i=b;return r|0}while(1){if(($b[c[(c[h>>2]|0)+52>>2]&63](h,e,j)|0)!=0){d=54;break}e=e+d|0;if(e>>>0<f>>>0){j=j+d|0}else{d=54;break}}if((d|0)==54){r=a+20|0;i=b;return r|0}return 0}function er(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+16|0;g=e;b=c[c[a+4>>2]>>2]|0;d=c[c[a+8>>2]>>2]|0;m=c[(c[d+8>>2]|0)+16>>2]&255;j=d+(m<<2)+16|0;if((m|0)==0){f=1}else{f=1;k=d+16|0;while(1){h=k+4|0;f=ba(c[k>>2]|0,f)|0;if(h>>>0<j>>>0){k=h}else{break}}}if((b|0)==(d|0)){c[g>>2]=29560;c[g+4>>2]=29599;c[g+8>>2]=182;$a(8,g|0)|0;jb(1)}g=b+8|0;h=c[g>>2]|0;m=c[h+16>>2]&255;j=b+(m<<2)+16|0;if((m|0)==0){l=1}else{l=1;m=b+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}h=c[(dc[c[(c[h>>2]|0)+36>>2]&1023](h)|0)>>2]|0;if((!((c[(c[g>>2]|0)+16>>2]&255|0)!=1|(h|0)>-1)?!((h|0)!=-2147483648&(f|0)>(0-h|0)|(l|0)==(f|0)):0)?Md(b,ba(c[(c[b+12>>2]|0)+12>>2]|0,f)|0,l,f,1)|0:0){c[b+16>>2]=f}if((f|0)<=0){m=a+12|0;i=e;return m|0}g=b+12|0;h=f+ -1|0;j=0;do{k=c[g>>2]|0;n=c[(c[k>>2]|0)+52>>2]|0;l=Nd(d,j)|0;m=Nd(b,h-j|0)|0;$b[n&63](k,l,m)|0;j=j+1|0}while((j|0)!=(f|0));n=a+12|0;i=e;return n|0}function fr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;i=i+16|0;d=b;e=c[c[a+4>>2]>>2]|0;f=c[c[a+8>>2]>>2]|0;h=c[c[a+12>>2]>>2]|0;if((e|0)==(f|0)){c[d>>2]=29560;c[d+4>>2]=29599;c[d+8>>2]=196;$a(8,d|0)|0;jb(1)}p=c[(c[f+8>>2]|0)+16>>2]&255;k=f+(p<<2)+16|0;if((p|0)==0){g=1}else{g=1;l=f+16|0;while(1){j=l+4|0;g=ba(c[l>>2]|0,g)|0;if(j>>>0<k>>>0){l=j}else{break}}}j=e+8|0;k=c[j>>2]|0;p=c[k+16>>2]&255;m=e+(p<<2)+16|0;if((p|0)==0){o=1}else{o=1;n=e+16|0;while(1){l=n+4|0;o=ba(c[n>>2]|0,o)|0;if(l>>>0<m>>>0){n=l}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(g|0)>(0-k|0)|(o|0)==(g|0)):0)?Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,g)|0,o,g,1)|0:0){c[e+16>>2]=g}if((g|0)<=0){p=a+16|0;i=b;return p|0}h=(h|0)%(g|0)|0;h=((h|0)<0?g:0)+h|0;j=e+12|0;k=c[j>>2]|0;if((c[f+12>>2]|0)==0){c[d>>2]=33152;c[d+4>>2]=8906;c[d+8>>2]=856;$a(8,d|0)|0;jb(1)}m=c[f>>2]|0;if(m>>>0>(c[f+4>>2]|0)>>>0){c[d>>2]=33176;c[d+4>>2]=8906;c[d+8>>2]=858;$a(8,d|0)|0;jb(1)}o=Nd(e,h)|0;l=g-h|0;g=c[k+12>>2]|0;p=ba(g,l)|0;a:do{if((c[k+16>>2]&2097152|0)==0){n=m+p|0;if((p|0)>0){while(1){if(($b[c[(c[k>>2]|0)+52>>2]&63](k,m,o)|0)!=0){break a}m=m+g|0;if(!(m>>>0<n>>>0)){break}else{o=o+g|0}}}}else{au(o|0,m|0,p|0)|0}}while(0);g=c[j>>2]|0;f=Nd(f,l)|0;if((c[j>>2]|0)==0){c[d>>2]=33152;c[d+4>>2]=8906;c[d+8>>2]=856;$a(8,d|0)|0;jb(1)}j=c[e>>2]|0;if(j>>>0>(c[e+4>>2]|0)>>>0){c[d>>2]=33176;c[d+4>>2]=8906;c[d+8>>2]=858;$a(8,d|0)|0;jb(1)}d=c[g+12>>2]|0;h=ba(d,h)|0;if((c[g+16>>2]&2097152|0)!=0){au(j|0,f|0,h|0)|0;p=a+16|0;i=b;return p|0}e=f+h|0;if((h|0)<=0){p=a+16|0;i=b;return p|0}while(1){if(($b[c[(c[g>>2]|0)+52>>2]&63](g,f,j)|0)!=0){d=32;break}f=f+d|0;if(f>>>0<e>>>0){j=j+d|0}else{d=32;break}}if((d|0)==32){p=a+16|0;i=b;return p|0}return 0}function gr(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;e=b;d=c[c[a+4>>2]>>2]|0;if((c[(c[d+8>>2]|0)+16>>2]&255|0)==0){Ye(c[d>>2]|0);i=b;return a+8|0}else{c[e>>2]=33200;c[e+4>>2]=8906;c[e+8>>2]=862;$a(8,e|0)|0;jb(1)}return 0}function hr(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;a=$b[c[(c[b>>2]|0)+48>>2]&63](b,d,e)|0;i=f;return a|0}function ir(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;a=$b[c[(c[b>>2]|0)+52>>2]&63](b,d,e)|0;i=f;return a|0}function jr(a,b,d){a=a|0;b=b|0;d=d|0;c[d>>2]=0;return 0}function kr(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;a=$b[c[(c[b>>2]|0)+48>>2]&63](b,d,e)|0;i=f;return a|0}function lr(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;a=i;i=i+16|0;f=a;$b[c[(c[b>>2]|0)+52>>2]&63](b,d,e)|0;e=c[e>>2]|0;if((c[(c[e+8>>2]|0)+16>>2]&255|0)!=0){c[f>>2]=33200;c[f+4>>2]=8906;c[f+8>>2]=862;$a(8,f|0)|0;jb(1)}e=c[e>>2]|0;f=c[e+12>>2]|0;d=c[f>>2]|0;f=c[f+4>>2]|0;if(!(d>>>0<f>>>0)){i=a;return 0}do{c[d+8>>2]=e;c[d+4>>2]=0;c[d>>2]=0;c[d+20>>2]=0;c[d+36>>2]=c[d+32>>2];d=d+40|0}while(d>>>0<f>>>0);i=a;return 0}function mr(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;a=i;i=i+16|0;h=a;j=c[d>>2]|0;if((c[(c[j+8>>2]|0)+16>>2]&255|0)!=0){c[h>>2]=33200;c[h+4>>2]=8906;c[h+8>>2]=862;$a(8,h|0)|0;jb(1)}h=c[j>>2]|0;j=c[c[h+12>>2]>>2]|0;if(((j|0)!=0?(Hc(c[c[h>>2]>>2]|0,c[j>>2]|0),(c[j+16>>2]|0)==0):0)?(f=c[h+4>>2]|0,e=c[f+12>>2]|0,f=c[f>>2]|0,g=dc[c[(c[e>>2]|0)+16>>2]&1023](e)|0,(g|0)>0):0){h=0;do{j=hc[c[(c[e>>2]|0)+24>>2]&63](e,h)|0;k=c[j+16>>2]|0;if((k&2097152|0)==0?(k&1342177280|0)==268435456|(k&1610612736|0)==536870912:0){k=c[j>>2]|0;l=c[k+56>>2]|0;k=f+(dc[c[k+40>>2]&1023](j)|0)|0;hc[l&63](j,k)|0}h=h+1|0}while((h|0)!=(g|0))}l=hc[c[(c[b>>2]|0)+56>>2]&63](b,d)|0;i=a;return l|0}function nr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;g=b;d=c[a+4>>2]|0;f=d+36|0;e=c[f>>2]|0;if((e|0)<=0){c[g>>2]=5872;c[g+4>>2]=5759;c[g+8>>2]=131;$a(8,g|0)|0;jb(1)}g=e+ -1|0;c[f>>2]=g;if((g|0)!=0){g=a+8|0;i=b;return g|0}We(c[1320]|0,d);g=a+8|0;i=b;return g|0}function or(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;e=b;g=c[a+4>>2]|0;if((c[g+36>>2]|0)==(c[g+32>>2]|0)){g=a+8|0;i=b;return g|0}d=c[(c[1320]|0)+20>>2]|0;f=d+4|0;if((c[f>>2]|0)!=0){c[e>>2]=5888;c[e+4>>2]=5759;c[e+8>>2]=141;$a(8,e|0)|0;jb(1)}g=g+12|0;c[f>>2]=c[g>>2];c[g>>2]=d;f=c[1320]|0;d=f+20|0;g=c[d>>2]|0;if((g|0)==0){c[e>>2]=5288;c[e+4>>2]=5223;c[e+8>>2]=263;$a(8,e|0)|0;jb(1)}c[g+20>>2]=a+8;g=f+4|0;e=c[g>>2]|0;a=f+8|0;do{if((c[a>>2]|0)==(e|0)){if((e|0)!=0){c[g>>2]=0;c[a>>2]=0;break}c[d>>2]=0;c[f+16>>2]=0;g=5160;i=b;return g|0}else{a=e+4|0;c[g>>2]=c[a>>2];c[a>>2]=0}}while(0);c[d>>2]=e;g=c[e+20>>2]|0;i=b;return g|0}function pr(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+8>>2]|0;e=(c[d>>2]|0)+1|0;if((e|0)<(c[c[a+12>>2]>>2]|0)){c[d>>2]=e;e=c[a+4>>2]|0;i=b;return e|0}else{e=a+16|0;i=b;return e|0}return 0}function qr(a){a=a|0;return c[a+4>>2]|0}function rr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+16|0;d=b;e=c[a+4>>2]|0;f=e+36|0;h=c[f>>2]|0;if((h|0)<=0){f=c[(c[1320]|0)+20>>2]|0;if((c[f+4>>2]|0)!=0){c[d>>2]=5888;c[d+4>>2]=5759;c[d+8>>2]=150;$a(8,d|0)|0;jb(1)}g=e+12|0;e=c[g>>2]|0;if((e|0)==0){c[g>>2]=f}else{do{g=e+4|0;e=c[g>>2]|0}while((e|0)!=0);c[g>>2]=f}f=c[1320]|0;e=f+20|0;g=c[e>>2]|0;if((g|0)==0){c[d>>2]=5288;c[d+4>>2]=5223;c[d+8>>2]=263;$a(8,d|0)|0;jb(1)}c[g+20>>2]=a;d=f+4|0;g=c[d>>2]|0;a=f+8|0;do{if((c[a>>2]|0)==(g|0)){if((g|0)!=0){c[d>>2]=0;c[a>>2]=0;break}c[e>>2]=0;c[f+16>>2]=0;j=5160;i=b;return j|0}else{j=g+4|0;c[d>>2]=c[j>>2];c[j>>2]=0}}while(0);c[e>>2]=g;j=c[g+20>>2]|0;i=b;return j|0}if((h|0)!=1){c[d>>2]=31080;c[d+4>>2]=5223;c[d+8>>2]=185;$a(8,d|0)|0;jb(1)}h=e+16|0;if((c[h>>2]|0)!=0){c[d>>2]=31104;c[d+4>>2]=5223;c[d+8>>2]=186;$a(8,d|0)|0;jb(1)}c[h>>2]=c[(c[1320]|0)+20>>2];h=a+16|0;j=c[h>>2]|0;do{if((j|0)!=(c[1292]|0)){do{h=dc[j&1023](h)|0;j=c[h>>2]|0}while((j|0)!=(c[1292]|0));h=c[f>>2]|0;if((h|0)>0){j=h+ -1|0;c[f>>2]=j;if((j|0)==0){g=12;break}else{break}}else{c[d>>2]=5872;c[d+4>>2]=5759;c[d+8>>2]=131;$a(8,d|0)|0;jb(1)}}else{c[f>>2]=0;g=12}}while(0);if((g|0)==12){We(c[1320]|0,e)}e=c[1320]|0;f=e+20|0;g=c[f>>2]|0;if((g|0)==0){c[d>>2]=5288;c[d+4>>2]=5223;c[d+8>>2]=263;$a(8,d|0)|0;jb(1)}c[g+20>>2]=a;a=e+4|0;d=c[a>>2]|0;g=e+8|0;do{if((c[g>>2]|0)==(d|0)){if((d|0)!=0){c[a>>2]=0;c[g>>2]=0;break}c[f>>2]=0;c[e+16>>2]=0;j=5160;i=b;return j|0}else{j=d+4|0;c[a>>2]=c[j>>2];c[j>>2]=0}}while(0);c[f>>2]=d;j=c[d+20>>2]|0;i=b;return j|0}function sr(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;e=ys()|0;d=F;f=zs((c[c[a+4>>2]>>2]|0)*1e3|0,0)|0;d=Yt(f|0,F|0,e|0,d|0)|0;a=Se(c[1320]|0,d,F,a+8|0)|0;i=b;return a|0}function tr(a){a=a|0;var b=0,d=0,e=0;b=i;e=c[1320]|0;d=c[a+4>>2]|0;d=zs(c[d>>2]|0,c[d+4>>2]|0)|0;a=Se(e,d,F,a+8|0)|0;i=b;return a|0}function ur(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;e=ys()|0;d=F;f=zs(c[c[a+4>>2]>>2]|0,0)|0;d=Yt(f|0,F|0,e|0,d|0)|0;a=Se(c[1320]|0,d,F,a+8|0)|0;i=b;return a|0}function vr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;i=i+16|0;e=b;d=c[1320]|0;a=d+20|0;f=c[a>>2]|0;if((f|0)==0){c[e>>2]=31024;c[e+4>>2]=5223;c[e+8>>2]=51;$a(8,e|0)|0;jb(1)}h=f+16|0;j=c[h>>2]|0;if((j|0)!=0){g=j+20|0;k=c[g>>2]|0;if((k|0)==0){c[e>>2]=31048;c[e+4>>2]=5223;c[e+8>>2]=59;$a(8,e|0)|0;jb(1)}m=c[k+12>>2]|0;l=c[m>>2]|0;if((l|0)!=(c[1292]|0)){do{m=dc[l&1023](m)|0;l=c[m>>2]|0}while((l|0)!=(c[1292]|0))}c[g>>2]=c[k+8>>2];c[h>>2]=0;We(d,j)}m=f+12|0;h=c[m>>2]|0;c[m>>2]=0;if((h|0)!=0){g=d+16|0;while(1){m=h+4|0;j=c[m>>2]|0;c[m>>2]=0;We(d,h);c[g>>2]=0;if((j|0)==0){break}else{h=j}}}c[f+36>>2]=c[f+32>>2];g=c[a>>2]|0;if((g|0)==0){c[e>>2]=5288;c[e+4>>2]=5223;c[e+8>>2]=263;$a(8,e|0)|0;jb(1)}c[g+20>>2]=c[f>>2];e=d+4|0;f=c[e>>2]|0;g=d+8|0;do{if((c[g>>2]|0)==(f|0)){if((f|0)!=0){c[e>>2]=0;c[g>>2]=0;break}c[a>>2]=0;c[d+16>>2]=0;m=5160;i=b;return m|0}else{m=f+4|0;c[e>>2]=c[m>>2];c[m>>2]=0}}while(0);c[a>>2]=f;m=c[f+20>>2]|0;i=b;return m|0}function wr(b){b=b|0;var d=0,e=0;d=i;e=c[b+4>>2]|0;if((e|0)!=0?(a[e]|0)==0:0){e=b+8|0;i=d;return e|0}e=c[1320]|0;c[e+20>>2]=0;c[e+16>>2]=0;e=5160;i=d;return e|0}function xr(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=c[b+4>>2]|0;d=c[b+8>>2]|0;g=c[b+12>>2]|0;if((g|0)==0){h=1}else{h=(a[g]|0)!=0}j=c[c[b+16>>2]>>2]|0;g=j+8|0;k=c[g>>2]|0;o=c[k+16>>2]&255;l=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=j+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[g>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)>0|(n|0)==0):0)?Md(j,0,n,0,1)|0:0){c[j+16>>2]=0}Ie(f,d,j,h)|0;i=e;return b+20|0}function yr(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=i;f=c[c[b+4>>2]>>2]|0;e=c[b+8>>2]|0;if((e|0)==0){g=1}else{g=(a[e]|0)!=0}k=c[b+12>>2]|0;l=c[b+16>>2]|0;e=c[b+20>>2]|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}m=c[b+24>>2]|0;j=Je(f,g,0,l,k,m)|0;p=c[(c[f+8>>2]|0)+16>>2]&255;h=f+(p<<2)+16|0;if((p|0)==0){n=1}else{n=1;o=f+16|0;while(1){g=o+4|0;n=ba(c[o>>2]|0,n)|0;if(g>>>0<h>>>0){o=g}else{break}}}h=n-j|0;g=(j|0)==-1;if(g){$b[c[(c[k>>2]|0)+52>>2]&63](k,l,m)|0}if((e|0)!=0){k=e+8|0;l=c[k>>2]|0;p=c[l+16>>2]&255;n=e+(p<<2)+16|0;if((p|0)==0){p=1}else{p=1;o=e+16|0;while(1){m=o+4|0;p=ba(c[o>>2]|0,p)|0;if(m>>>0<n>>>0){o=m}else{break}}}l=c[(dc[c[(c[l>>2]|0)+36>>2]&1023](l)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(l|0)>-1)?!((l|0)>0|(p|0)==0):0)?Md(e,0,p,0,1)|0:0){c[e+16>>2]=0}if(!g){f=Nd(f,j)|0;p=c[(c[k>>2]|0)+16>>2]&255;j=e+(p<<2)+16|0;if((p|0)==0){l=1}else{l=1;m=e+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Pd(e,l,h,f)|0}}e=c[b+28>>2]|0;if((e|0)==0){p=b+32|0;i=d;return p|0}a[e]=g&1;p=b+32|0;i=d;return p|0}function zr(d){d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+16|0;f=e;g=d+16|0;h=c[c[g>>2]>>2]|0;j=h+8|0;k=c[j>>2]|0;o=c[k+16>>2]&255;m=h+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=h+16|0;while(1){l=o+4|0;n=ba(c[o>>2]|0,n)|0;if(l>>>0<m>>>0){o=l}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)>0|(n|0)==0):0)?Md(h,0,n,0,1)|0:0){c[h+16>>2]=0}h=c[d+12>>2]|0;if((h|0)==0){h=0}else{h=b[h>>1]|0}c[f>>2]=c[c[g>>2]>>2];a[f+4|0]=0;c[f+8>>2]=h;De(f,c[d+4>>2]|0,c[d+8>>2]|0);i=e;return d+20|0}function Ar(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+48|0;k=d+28|0;f=d;e=c[b+8>>2]|0;h=c[c[b+4>>2]>>2]|0;g=c[h>>2]|0;h=c[h+4>>2]|0;j=c[c[b+16>>2]>>2]|0;a[k+16|0]=0;c[k>>2]=j;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;j=c[c[1320]>>2]|0;c[f+24>>2]=k;c[f>>2]=j;c[f+4>>2]=g;c[f+8>>2]=h;c[f+12>>2]=g;c[f+16>>2]=1;a[f+20|0]=1;ie(f,e,c[b+12>>2]|0,c[e+16>>2]&255);i=d;return b+20|0}function Br(d){d=d|0;var e=0,f=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0;e=i;i=i+80|0;m=e+64|0;s=e+44|0;r=e+16|0;o=e;t=e+8|0;j=c[c[d+4>>2]>>2]|0;f=c[d+8>>2]|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}q=c[d+12>>2]|0;p=c[d+20>>2]|0;l=c[d+24>>2]|0;f=(f|0)<0?0:f;v=Nd(j,f)|0;w=c[j+4>>2]|0;n=m+4|0;c[m>>2]=v;c[n>>2]=w;j=w-v|0;if((l|0)==0){r=fe(m,0)|0;l=(c[n>>2]|0)-(c[m>>2]|0)|0}else{a[s+16|0]=0;c[s>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;c[s+12>>2]=0;y=c[1320]|0;z=c[y>>2]|0;m=r+8|0;n=r+4|0;u=r+24|0;c[u>>2]=s;c[r>>2]=z;c[n>>2]=v;c[m>>2]=w;c[r+12>>2]=v;c[r+16>>2]=1;a[r+20|0]=0;c[t>>2]=3976;c[t+4>>2]=3981;s=Qc(c[y>>2]|0,t)|0;if((s|0)==0){t=0}else{t=c[s>>2]|0}s=p+16|0;ie(r,t,o,c[s>>2]&255);r=c[u>>2]|0;r=(c[r+8>>2]|0)==(0-(c[r+4>>2]|0)|0);do{if(r){q=(c[s>>2]|0)>>>16&31;p=c[p+12>>2]|0;s=o;o=c[s>>2]|0;s=c[s+4>>2]|0;if((q|0)==12){x=+(o>>>0)+4294967296.0*+(s|0);if((p|0)==4){g[l>>2]=x;break}else if((p|0)==8){h[k>>3]=x;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else{break}}if((q+ -9|0)>>>0<2){if((p|0)==8){z=l;c[z>>2]=o;c[z+4>>2]=s;break}else if((p|0)==4){c[l>>2]=o;break}else if((p|0)==2){b[l>>1]=o;break}else if((p|0)==1){a[l]=o;break}else{break}}}else{if((q|0)!=0){$b[c[(c[p>>2]|0)+52>>2]&63](p,q,l)|0;break}o=(c[s>>2]|0)>>>16&31;p=c[p+12>>2]|0;if((o|0)==12){if((p|0)==4){g[l>>2]=0.0;break}else if((p|0)==8){h[k>>3]=0.0;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else{break}}if((o+ -9|0)>>>0<2){if((p|0)==4){c[l>>2]=0;break}else if((p|0)==2){b[l>>1]=0;break}else if((p|0)==1){a[l]=0;break}else if((p|0)==8){z=l;c[z>>2]=0;c[z+4>>2]=0;break}else{break}}}}while(0);l=(c[m>>2]|0)-(c[n>>2]|0)|0}m=c[d+16>>2]|0;if((m|0)==0){z=d+28|0;i=e;return z|0}c[m>>2]=(r?j-l|0:0)+f;z=d+28|0;i=e;return z|0}function Cr(d){d=d|0;var e=0,f=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0;e=i;i=i+336|0;n=e+68|0;p=e+64|0;t=e+44|0;r=e+16|0;m=e;s=e+8|0;j=c[c[d+4>>2]>>2]|0;f=c[d+8>>2]|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}q=c[d+12>>2]|0;o=c[d+20>>2]|0;l=c[d+24>>2]|0;f=(f|0)<0?0:f;u=Nd(j,f)|0;v=c[j+4>>2]|0;w=v;j=w-u|0;if((l|0)==0){l=(j|0)<255?j:255;r=n+256|0;c[r>>2]=n+l;$t(n|0,u|0,l|0)|0;a[c[r>>2]|0]=0;c[p>>2]=0;+St(n,p);r=c[p>>2]|0;l=w-(u+(r-n))|0;r=(n|0)!=(r|0)}else{a[t+16|0]=0;c[t>>2]=0;c[t+4>>2]=0;c[t+8>>2]=0;c[t+12>>2]=0;y=c[1320]|0;z=c[y>>2]|0;p=r+8|0;n=r+4|0;w=r+24|0;c[w>>2]=t;c[r>>2]=z;c[n>>2]=u;c[p>>2]=v;c[r+12>>2]=u;c[r+16>>2]=1;a[r+20|0]=0;c[s>>2]=4424;c[s+4>>2]=4430;s=Qc(c[y>>2]|0,s)|0;if((s|0)==0){t=0}else{t=c[s>>2]|0}s=o+16|0;ie(r,t,m,c[s>>2]&255);r=c[w>>2]|0;r=(c[r+8>>2]|0)==(0-(c[r+4>>2]|0)|0);do{if(r){q=(c[s>>2]|0)>>>16&31;o=c[o+12>>2]|0;x=+h[m>>3];if((q|0)==12){if((o|0)==4){g[l>>2]=x;break}else if((o|0)==8){h[k>>3]=x;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else{break}}m=~~x>>>0;s=+Q(x)>=1.0?x>0.0?(ga(+P(x/4294967296.0),4294967295.0)|0)>>>0:~~+aa((x- +(~~x>>>0))/4294967296.0)>>>0:0;if((q+ -9|0)>>>0<2){if((o|0)==4){c[l>>2]=m;break}else if((o|0)==2){b[l>>1]=m;break}else if((o|0)==8){z=l;c[z>>2]=m;c[z+4>>2]=s;break}else if((o|0)==1){a[l]=m;break}else{break}}}else{if((q|0)!=0){$b[c[(c[o>>2]|0)+52>>2]&63](o,q,l)|0;break}m=(c[s>>2]|0)>>>16&31;o=c[o+12>>2]|0;if((m|0)==12){if((o|0)==8){h[k>>3]=0.0;a[l]=a[k];a[l+1|0]=a[k+1|0];a[l+2|0]=a[k+2|0];a[l+3|0]=a[k+3|0];a[l+4|0]=a[k+4|0];a[l+5|0]=a[k+5|0];a[l+6|0]=a[k+6|0];a[l+7|0]=a[k+7|0];break}else if((o|0)==4){g[l>>2]=0.0;break}else{break}}if((m+ -9|0)>>>0<2){if((o|0)==1){a[l]=0;break}else if((o|0)==8){z=l;c[z>>2]=0;c[z+4>>2]=0;break}else if((o|0)==4){c[l>>2]=0;break}else if((o|0)==2){b[l>>1]=0;break}else{break}}}}while(0);l=(c[p>>2]|0)-(c[n>>2]|0)|0}m=c[d+16>>2]|0;if((m|0)==0){z=d+28|0;i=e;return z|0}c[m>>2]=(r?j-l|0:0)+f;z=d+28|0;i=e;return z|0}



function Ge(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;q=i;i=i+432|0;o=q;j=q+48|0;l=q+24|0;n=q+60|0;r=q+320|0;p=q+56|0;d=q+8|0;m=j+4|0;D=c[b>>2]|0;C=c[b+4>>2]|0;c[j>>2]=D;c[m>>2]=C;b=f+8|0;s=c[b>>2]|0;L=c[s+16>>2]&255;u=f+(L<<2)+16|0;if((L|0)==0){w=1}else{w=1;v=f+16|0;while(1){t=v+4|0;w=ba(c[v>>2]|0,w)|0;if(t>>>0<u>>>0){v=t}else{break}}}s=c[(dc[c[(c[s>>2]|0)+36>>2]&1023](s)|0)>>2]|0;if((!((c[(c[b>>2]|0)+16>>2]&255|0)!=1|(s|0)>-1)?!((s|0)>0|(w|0)==0):0)?Md(f,0,w,0,1)|0:0){c[f+16>>2]=0}if(!(D>>>0<C>>>0)){i=q;return}A=f+16|0;v=l+20|0;y=l+16|0;s=l+7|0;z=n+256|0;x=n+256|0;B=d+4|0;u=d+8|0;t=l+8|0;w=l+1|0;E=C;C=0;do{G=D+1|0;c[j>>2]=G;F=a[D]|0;a:do{if(F<<24>>24==37){c[v>>2]=0;c[y>>2]=0;Fe(j,l);switch(a[s]|0){case 65:case 97:case 69:case 101:case 70:case 102:case 71:case 103:{E=(c[y>>2]|0)+ -1|0;D=(c[v>>2]|0)-E|0;D=(D|0)<255?D:255;c[z>>2]=n+D;$t(n|0,E|0,D|0)|0;a[c[z>>2]|0]=0;h[k>>3]=+h[c[e+(C<<3)+4>>2]>>3];c[o>>2]=c[k>>2];c[o+4>>2]=c[k+4>>2];D=wb(r|0,100,n|0,o|0)|0;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;H=A;while(1){F=H+4|0;G=ba(c[H>>2]|0,G)|0;if(F>>>0<E>>>0){H=F}else{break}}}Pd(f,G,D,r)|0;C=C+1|0;break a};case 88:case 120:case 111:case 100:{E=(c[y>>2]|0)+ -1|0;D=(c[v>>2]|0)-E|0;D=(D|0)<255?D:255;c[x>>2]=n+D;$t(n|0,E|0,D|0)|0;a[c[x>>2]|0]=0;c[o>>2]=c[c[e+(C<<3)+4>>2]>>2];D=wb(r|0,100,n|0,o|0)|0;L=c[(c[b>>2]|0)+16>>2]&255;F=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;H=A;while(1){E=H+4|0;G=ba(c[H>>2]|0,G)|0;if(E>>>0<F>>>0){H=E}else{break}}}Pd(f,G,D,r)|0;C=C+1|0;break a};case 37:{a[o]=37;L=c[(c[b>>2]|0)+16>>2]&255;D=f+(L<<2)+16|0;if((L|0)==0){F=1}else{F=1;G=A;while(1){E=G+4|0;F=ba(c[G>>2]|0,F)|0;if(E>>>0<D>>>0){G=E}else{break}}}Pd(f,F,1,o)|0;break a};case 115:{Xg(p,3392);c[d>>2]=c[p>>2];a[B]=0;c[u>>2]=0;De(d,c[e+(C<<3)>>2]|0,c[e+(C<<3)+4>>2]|0);D=c[t>>2]|0;E=c[p>>2]|0;G=c[(c[E+8>>2]|0)+16>>2]&255;F=E+(G<<2)+16|0;G=(G|0)==0;if(G){I=1}else{I=1;J=E+16|0;while(1){H=J+4|0;I=ba(c[J>>2]|0,I)|0;if(H>>>0<F>>>0){J=H}else{break}}}H=D-I|0;D=(a[w]|0)==0;if(!D){L=c[(c[b>>2]|0)+16>>2]&255;J=f+(L<<2)+16|0;if((L|0)==0){I=1}else{I=1;L=A;while(1){K=L+4|0;I=ba(c[L>>2]|0,I)|0;if(K>>>0<J>>>0){L=K}else{break}}}if(G){J=1}else{J=1;K=E+16|0;while(1){G=K+4|0;J=ba(c[K>>2]|0,J)|0;if(G>>>0<F>>>0){K=G}else{break}}}Pd(f,I,J,c[E>>2]|0)|0}if((H|0)>0){do{a[o]=32;L=c[(c[b>>2]|0)+16>>2]&255;F=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;I=A;while(1){E=I+4|0;G=ba(c[I>>2]|0,G)|0;if(E>>>0<F>>>0){I=E}else{break}}}Pd(f,G,1,o)|0;H=H+ -1|0}while((H|0)>0)}if(D){D=c[p>>2]|0;L=c[(c[b>>2]|0)+16>>2]&255;F=f+(L<<2)+16|0;if((L|0)==0){E=1}else{E=1;H=A;while(1){G=H+4|0;E=ba(c[H>>2]|0,E)|0;if(G>>>0<F>>>0){H=G}else{break}}}L=c[(c[D+8>>2]|0)+16>>2]&255;F=D+(L<<2)+16|0;if((L|0)==0){H=1}else{H=1;I=D+16|0;while(1){G=I+4|0;H=ba(c[I>>2]|0,H)|0;if(G>>>0<F>>>0){I=G}else{break}}}Pd(f,E,H,c[D>>2]|0)|0}C=C+1|0;D=c[p>>2]|0;if((D|0)==0){break a}L=c[D+8>>2]|0;hc[c[(c[L>>2]|0)+56>>2]&63](L,p)|0;break a};default:{break a}}}else if(F<<24>>24==92){if(G>>>0<E>>>0){c[j>>2]=D+2;switch(a[G]|0){case 114:{a[o]=13;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=A;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Pd(f,G,1,o)|0;break a};case 92:{a[o]=92;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=A;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Pd(f,G,1,o)|0;break a};case 110:{a[o]=10;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=A;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Pd(f,G,1,o)|0;break a};case 102:{a[o]=12;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=A;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Pd(f,G,1,o)|0;break a};case 98:{a[o]=8;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){F=1}else{F=1;G=A;while(1){D=G+4|0;F=ba(c[G>>2]|0,F)|0;if(D>>>0<E>>>0){G=D}else{break}}}Pd(f,F,1,o)|0;break a};case 116:{a[o]=9;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=A;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Pd(f,G,1,o)|0;break a};case 115:{a[o]=32;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=A;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Pd(f,G,1,o)|0;break a};default:{break a}}}else{F=92;g=67}}else{g=67}}while(0);if((g|0)==67){g=0;a[o]=F;L=c[(c[b>>2]|0)+16>>2]&255;E=f+(L<<2)+16|0;if((L|0)==0){G=1}else{G=1;F=A;while(1){D=F+4|0;G=ba(c[F>>2]|0,G)|0;if(D>>>0<E>>>0){F=D}else{break}}}Pd(f,G,1,o)|0}D=c[j>>2]|0;E=c[m>>2]|0}while(D>>>0<E>>>0);i=q;return}function He(a){a=a|0;var b=0;b=i;Oe(a,31424,65,31440,2);Oe(a,31488,66,31504,2);Oe(a,31552,67,31576,2);Oe(a,31640,68,31576,2);Oe(a,31672,69,31696,2);i=b;return}function Ie(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;g=f;h=f+12|0;j=(c[a+16>>2]|0)>>>16&31;if((j|0)==1){g=dc[c[(c[a>>2]|0)+16>>2]&1023](a)|0;if((g|0)<=0){m=0;i=f;return m|0}h=0;while(1){m=hc[c[(c[a>>2]|0)+24>>2]&63](a,h)|0;Ie(m,b+(dc[c[(c[m>>2]|0)+40>>2]&1023](m)|0)|0,d,1)|0;h=h+1|0;if((h|0)==(g|0)){d=0;break}}i=f;return d|0}else if((j|0)==3){b=c[b>>2]|0;if((b|0)==0){m=2;i=f;return m|0}a=hc[c[(c[a>>2]|0)+24>>2]&63](a,0)|0;j=b+8|0;if(e){m=c[(c[j>>2]|0)+16>>2]&255;k=b+(m<<2)+16|0;if((m|0)==0){m=1}else{m=1;l=b+16|0;while(1){e=l+4|0;m=ba(c[l>>2]|0,m)|0;if(e>>>0<k>>>0){l=e}else{break}}}c[h>>2]=m;m=c[(c[d+8>>2]|0)+16>>2]&255;k=d+(m<<2)+16|0;if((m|0)==0){m=1}else{m=1;l=d+16|0;while(1){e=l+4|0;m=ba(c[l>>2]|0,m)|0;if(e>>>0<k>>>0){l=e}else{break}}}Pd(d,m,4,h)|0}j=c[(c[j>>2]|0)+16>>2]&255;h=b+(j<<2)+16|0;if((c[a+16>>2]&2097152|0)==0){h=c[h>>2]|0;if((c[b+12>>2]|0)==0){c[g>>2]=33152;c[g+4>>2]=8906;c[g+8>>2]=856;$a(8,g|0)|0;jb(1)}j=c[b>>2]|0;if(j>>>0>(c[b+4>>2]|0)>>>0){c[g>>2]=33176;c[g+4>>2]=8906;c[g+8>>2]=858;$a(8,g|0)|0;jb(1)}m=ba(c[b+16>>2]|0,h)|0;g=j+m|0;if((m|0)<=0){m=0;i=f;return m|0}while(1){Ie(a,j,d,1)|0;j=j+h|0;if(!(j>>>0<g>>>0)){d=0;break}}i=f;return d|0}if((j|0)==0){k=1}else{k=1;e=b+16|0;while(1){j=e+4|0;k=ba(c[e>>2]|0,k)|0;if(j>>>0<h>>>0){e=j}else{break}}}a=ba(c[a+12>>2]|0,k)|0;if((c[b+12>>2]|0)==0){c[g>>2]=33152;c[g+4>>2]=8906;c[g+8>>2]=856;$a(8,g|0)|0;jb(1)}h=c[b>>2]|0;if(h>>>0>(c[b+4>>2]|0)>>>0){c[g>>2]=33176;c[g+4>>2]=8906;c[g+8>>2]=858;$a(8,g|0)|0;jb(1)}m=c[(c[d+8>>2]|0)+16>>2]&255;b=d+(m<<2)+16|0;if((m|0)==0){e=1}else{e=1;j=d+16|0;while(1){g=j+4|0;e=ba(c[j>>2]|0,e)|0;if(g>>>0<b>>>0){j=g}else{break}}}Pd(d,e,a,h)|0;m=0;i=f;return m|0}else{g=c[a+12>>2]|0;m=c[(c[d+8>>2]|0)+16>>2]&255;a=d+(m<<2)+16|0;if((m|0)==0){e=1}else{e=1;j=d+16|0;while(1){h=j+4|0;e=ba(c[j>>2]|0,e)|0;if(h>>>0<a>>>0){j=h}else{break}}}Pd(d,e,g,b)|0;m=0;i=f;return m|0}return 0}function Je(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+16|0;j=h;k=(c[f+16>>2]|0)>>>16&31;if((k|0)==3){l=(g|0)!=0;if(l){k=c[g>>2]|0}else{k=0}g=hc[c[(c[f>>2]|0)+24>>2]&63](f,0)|0;do{if(b){b=d+4|0;f=a+8|0;s=c[(c[f>>2]|0)+16>>2]&255;n=a+(s<<2)+16|0;if((s|0)==0){p=1}else{p=1;o=a+16|0;while(1){m=o+4|0;p=ba(c[o>>2]|0,p)|0;if(m>>>0<n>>>0){o=m}else{break}}}if((b|0)>(p|0)){s=-1;i=h;return s|0}else{m=c[(Nd(a,d)|0)>>2]|0;f=c[(c[f>>2]|0)+16>>2]|0;break}}else{f=c[(c[a+8>>2]|0)+16>>2]|0;s=f&255;m=a+(s<<2)+16|0;if((s|0)==0){n=1}else{n=1;o=a+16|0;while(1){b=o+4|0;n=ba(c[o>>2]|0,n)|0;if(b>>>0<m>>>0){o=b}else{break}}}b=d;m=(n-d|0)/(c[g+12>>2]|0)|0}}while(0);d=a+8|0;s=f&255;f=a+(s<<2)+16|0;if((s|0)==0){p=1}else{p=1;o=a+16|0;while(1){n=o+4|0;p=ba(c[o>>2]|0,p)|0;if(n>>>0<f>>>0){o=n}else{break}}}if((m|0)>(p-b|0)){s=-1;i=h;return s|0}f=(k|0)!=0;if(f){n=k+8|0;o=c[n>>2]|0;s=c[o+16>>2]&255;q=k+(s<<2)+16|0;if((s|0)==0){s=1}else{s=1;r=k+16|0;while(1){p=r+4|0;s=ba(c[r>>2]|0,s)|0;if(p>>>0<q>>>0){r=p}else{break}}}o=c[(dc[c[(c[o>>2]|0)+36>>2]&1023](o)|0)>>2]|0;if((!((c[(c[n>>2]|0)+16>>2]&255|0)!=1|(o|0)>-1)?!((o|0)!=-2147483648&(m|0)>(0-o|0)|(s|0)==(m|0)):0)?Md(k,ba(c[(c[k+12>>2]|0)+12>>2]|0,m)|0,s,m,1)|0:0){c[k+16>>2]=m}}if((c[g+16>>2]&2097152|0)!=0){e=ba(c[g+12>>2]|0,m)|0;g=e+b|0;s=c[(c[d>>2]|0)+16>>2]&255;d=a+(s<<2)+16|0;if((s|0)==0){m=1}else{m=1;n=a+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<d>>>0){n=l}else{break}}}l=(g|0)>(m|0);if(l|f^1){s=l?-1:g;i=h;return s|0}if((c[k+12>>2]|0)==0){c[j>>2]=33152;c[j+4>>2]=8906;c[j+8>>2]=856;$a(8,j|0)|0;jb(1)}l=c[k>>2]|0;if(l>>>0>(c[k+4>>2]|0)>>>0){c[j>>2]=33176;c[j+4>>2]=8906;c[j+8>>2]=858;$a(8,j|0)|0;jb(1)}$t(l|0,Nd(a,b)|0,e|0)|0;s=g;i=h;return s|0}if(l){l=c[k+((c[(c[k+8>>2]|0)+16>>2]&255)<<2)+16>>2]|0;if((c[k+12>>2]|0)==0){c[j>>2]=33152;c[j+4>>2]=8906;c[j+8>>2]=856;$a(8,j|0)|0;jb(1)}d=c[k>>2]|0;if(d>>>0>(c[k+4>>2]|0)>>>0){c[j>>2]=33176;c[j+4>>2]=8906;c[j+8>>2]=858;$a(8,j|0)|0;jb(1)}s=ba(c[k+16>>2]|0,l)|0;j=d+s|0;if((s|0)<=0){s=b;i=h;return s|0}while(1){b=Je(a,1,b,e,g,d)|0;if((b|0)==-1){b=-1;a=63;break}d=d+l|0;if(!(d>>>0<j>>>0)){a=63;break}}if((a|0)==63){i=h;return b|0}}else{l=c[e>>2]|0;e=c[l+((c[(c[l+8>>2]|0)+16>>2]&255)<<2)+16>>2]|0;if((c[l+12>>2]|0)==0){c[j>>2]=33152;c[j+4>>2]=8906;c[j+8>>2]=856;$a(8,j|0)|0;jb(1)}k=c[l>>2]|0;if(k>>>0>(c[l+4>>2]|0)>>>0){c[j>>2]=33176;c[j+4>>2]=8906;c[j+8>>2]=858;$a(8,j|0)|0;jb(1)}s=ba(c[l+16>>2]|0,e)|0;j=k+s|0;if((s|0)<=0){s=b;i=h;return s|0}while(1){b=Je(a,1,b,k,g,0)|0;if((b|0)==-1){b=-1;a=63;break}k=k+e|0;if(!(k>>>0<j>>>0)){a=63;break}}if((a|0)==63){i=h;return b|0}}}else if((k|0)==1){j=dc[c[(c[f>>2]|0)+16>>2]&1023](f)|0;if((j|0)<=0){s=d;i=h;return s|0}k=(g|0)==0;b=d;l=0;while(1){d=hc[c[(c[f>>2]|0)+24>>2]&63](f,l)|0;m=dc[c[(c[d>>2]|0)+40>>2]&1023](d)|0;if(k){m=0}else{m=g+m|0}b=Je(a,1,b,e,d,m)|0;l=l+1|0;if((b|0)==-1){b=-1;a=63;break}if((l|0)>=(j|0)){a=63;break}}if((a|0)==63){i=h;return b|0}}else{e=c[f+12>>2]|0;j=e+d|0;s=c[(c[a+8>>2]|0)+16>>2]&255;k=a+(s<<2)+16|0;if((s|0)==0){l=1}else{l=1;f=a+16|0;while(1){b=f+4|0;l=ba(c[f>>2]|0,l)|0;if(b>>>0<k>>>0){f=b}else{break}}}if((j|0)>(l|0)){s=-1;i=h;return s|0}if((g|0)==0){s=j;i=h;return s|0}$t(g|0,Nd(a,d)|0,e|0)|0;s=j;i=h;return s|0}return 0}function Ke(a){a=a|0;var b=0;b=i;Oe(a,31256,70,31272,2);Oe(a,31320,71,31344,2);i=b;return}function Le(b,d){b=b|0;d=d|0;a[b+16|0]=0;c[b>>2]=d;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;return}function Me(a){a=a|0;var b=0,d=0;b=i;if(34584==0){i=b;return}else{d=34584}do{bc[c[d+4>>2]&127](a);d=c[d>>2]|0}while((d|0)!=0);i=b;return}function Ne(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+64|0;k=g+36|0;l=g+8|0;f=g;j=f+4|0;c[j>>2]=0;c[f>>2]=0;if((d|0)==0){h=0}else{h=d+(Xt(d|0)|0)|0}c[f>>2]=d;c[j>>2]=h;if((e|0)==0){m=0}else{m=e+(Xt(e|0)|0)|0}j=c[12]|0;c[12]=b;a[k+16|0]=0;c[k>>2]=1;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;c[l+24>>2]=k;c[l>>2]=b;c[l+4>>2]=e;c[l+8>>2]=m;c[l+12>>2]=e;c[l+16>>2]=1;a[l+20|0]=0;e=Vd(l)|0;c[12]=b;if((h|0)==(d|0)){m=e;c[12]=j;i=g;return m|0}m=Kc(b,f,e)|0;c[12]=j;i=g;return m|0}function Oe(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;j=i;i=i+48|0;h=j+28|0;k=j;if((f|0)==0){l=0}else{l=f+(Xt(f|0)|0)|0}m=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[k+24>>2]=h;c[k>>2]=b;c[k+4>>2]=f;c[k+8>>2]=l;c[k+12>>2]=f;c[k+16>>2]=1;a[k+20|0]=0;l=Vd(k)|0;c[12]=m;e=Jc(b,l,e,g)|0;if((e|0)==0){i=j;return}f=h+4|0;c[f>>2]=0;c[h>>2]=0;if((d|0)==0){k=0}else{k=d+(Xt(d|0)|0)|0}c[h>>2]=d;c[f>>2]=k;Kc(b,h,e)|0;i=j;return}function Pe(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;h=i;i=i+48|0;g=h+28|0;j=h;if((f|0)==0){k=0}else{k=f+(Xt(f|0)|0)|0}l=c[12]|0;c[12]=b;a[g+16|0]=0;c[g>>2]=1;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[j+24>>2]=g;c[j>>2]=b;c[j+4>>2]=f;c[j+8>>2]=k;c[j+12>>2]=f;c[j+16>>2]=1;a[j+20|0]=0;f=Vd(j)|0;c[12]=l;f=Lc(b,f,e)|0;if((f|0)==0){i=h;return}j=g+4|0;c[j>>2]=0;c[g>>2]=0;if((d|0)==0){e=0}else{e=d+(Xt(d|0)|0)|0}c[g>>2]=d;c[j>>2]=e;Kc(b,g,f)|0;i=h;return}function Qe(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;j=i;i=i+48|0;k=j;g=j+40|0;l=j+12|0;h=g+4|0;c[h>>2]=0;c[g>>2]=0;if((f|0)==0){m=0}else{m=f+(Xt(f|0)|0)|0}c[g>>2]=f;c[h>>2]=m;c[l+24>>2]=0;c[l>>2]=b;c[l+4>>2]=f;c[l+8>>2]=m;c[l+12>>2]=f;c[l+16>>2]=1;a[l+20|0]=0;l=Vd(l)|0;f=c[12]|0;if((f|0)==0){c[k>>2]=33224;c[k+4>>2]=8906;c[k+8>>2]=284;$a(8,k|0)|0;jb(1)}k=Ec(f,(c[l+12>>2]|0)+28|0)|0;if((k|0)==0){k=0}else{$c(k,b,l);c[k>>2]=1360;m=k+16|0;c[m>>2]=c[m>>2]|16777216;m=k+20|0;a[m]=a[m]|8;$b[c[(c[l>>2]|0)+48>>2]&63](l,k+28|0,l)|0}if((c[k+16>>2]&2031616|0)!=655360){i=j;return}if((c[k+12>>2]|0)!=4){i=j;return}c[(hc[c[(c[k>>2]|0)+44>>2]&63](k,0)|0)>>2]=e;m=d+(Xt(d|0)|0)|0;c[g>>2]=d;c[h>>2]=m;Kc(b,g,k)|0;i=j;return}function Re(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=2112;c[g+4>>2]=2119;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3592;c[f+8>>2]=3611;c[f+12>>2]=3592;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=408;c[g+4>>2]=409;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3616;c[f+8>>2]=3635;c[f+12>>2]=3616;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3640;c[g+4>>2]=3645;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3648;c[f+8>>2]=3664;c[f+12>>2]=3648;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3672;c[g+4>>2]=3676;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3680;c[f+8>>2]=3696;c[f+12>>2]=3680;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3704;c[g+4>>2]=3710;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3712;c[f+8>>2]=3729;c[f+12>>2]=3712;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3736;c[g+4>>2]=3741;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3744;c[f+8>>2]=3761;c[f+12>>2]=3744;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3768;c[g+4>>2]=3780;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3784;c[f+8>>2]=3801;c[f+12>>2]=3784;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3808;c[g+4>>2]=3821;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3824;c[f+8>>2]=3862;c[f+12>>2]=3824;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3864;c[g+4>>2]=3870;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3872;c[f+8>>2]=3910;c[f+12>>2]=3872;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3912;c[g+4>>2]=3917;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3920;c[f+8>>2]=3937;c[f+12>>2]=3920;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3944;c[g+4>>2]=3950;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3952;c[f+8>>2]=3969;c[f+12>>2]=3952;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3976;c[g+4>>2]=3981;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=3984;c[f+8>>2]=4001;c[f+12>>2]=3984;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4008;c[g+4>>2]=4016;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4024;c[f+8>>2]=4042;c[f+12>>2]=4024;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4048;c[g+4>>2]=4056;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4064;c[f+8>>2]=4082;c[f+12>>2]=4064;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4088;c[g+4>>2]=4100;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4104;c[f+8>>2]=4125;c[f+12>>2]=4104;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4128;c[g+4>>2]=4141;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4144;c[f+8>>2]=4225;c[f+12>>2]=4144;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4232;c[g+4>>2]=4238;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4240;c[f+8>>2]=4278;c[f+12>>2]=4240;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4280;c[g+4>>2]=4292;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4296;c[f+8>>2]=4317;c[f+12>>2]=4296;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4320;c[g+4>>2]=4333;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4336;c[f+8>>2]=4422;c[f+12>>2]=4336;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4424;c[g+4>>2]=4430;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4432;c[f+8>>2]=4470;c[f+12>>2]=4432;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4472;c[g+4>>2]=4485;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4488;c[f+8>>2]=4527;c[f+12>>2]=4488;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4528;c[g+4>>2]=4541;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4544;c[f+8>>2]=4583;c[f+12>>2]=4544;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4584;c[g+4>>2]=4588;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4592;c[f+8>>2]=4633;c[f+12>>2]=4592;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4640;c[g+4>>2]=4649;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4656;c[f+8>>2]=4673;c[f+12>>2]=4656;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4680;c[g+4>>2]=4688;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4696;c[f+8>>2]=4715;c[f+12>>2]=4696;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4720;c[g+4>>2]=4732;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4736;c[f+8>>2]=4751;c[f+12>>2]=4736;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4752;c[g+4>>2]=4763;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4768;c[f+8>>2]=4782;c[f+12>>2]=4768;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3392;c[g+4>>2]=3398;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4784;c[f+8>>2]=4796;c[f+12>>2]=4784;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4800;c[g+4>>2]=4811;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4816;c[f+8>>2]=4829;c[f+12>>2]=4816;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4832;c[g+4>>2]=4845;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4848;c[f+8>>2]=4860;c[f+12>>2]=4848;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4864;c[g+4>>2]=4875;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4880;c[f+8>>2]=4913;c[f+12>>2]=4880;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4920;c[g+4>>2]=4931;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4880;c[f+8>>2]=4913;c[f+12>>2]=4880;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3120;c[g+4>>2]=3132;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3152;c[g+4>>2]=3171;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4952;c[f+8>>2]=4964;c[f+12>>2]=4952;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=4968;c[g+4>>2]=4986;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3144;c[g+4>>2]=3146;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=2816;c[g+4>>2]=2834;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4992;c[f+8>>2]=4995;c[f+12>>2]=4992;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3136;c[g+4>>2]=3141;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=2688;c[g+4>>2]=2692;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=5e3;c[g+4>>2]=5011;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=5016;c[g+4>>2]=5026;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=5032;c[g+4>>2]=5038;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=5040;c[g+4>>2]=5045;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=5048;c[g+4>>2]=5055;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=5056;c[g+4>>2]=5063;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3064;c[g+4>>2]=3075;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3176;c[g+4>>2]=3193;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=5064;c[f+8>>2]=5097;c[f+12>>2]=5064;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=3200;c[g+4>>2]=3212;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=5104;c[f+8>>2]=5148;c[f+12>>2]=5104;c[f+16>>2]=1;a[f+20|0]=0;f=Vd(f)|0;c[12]=b;Kc(b,g,f)|0;c[12]=e;i=d;return}function Se(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;g=f;k=a+20|0;h=c[k>>2]|0;if((h|0)==0){c[g>>2]=5288;c[g+4>>2]=5223;c[g+8>>2]=263;$a(8,g|0)|0;jb(1)}c[h+20>>2]=e;m=a+4|0;e=c[m>>2]|0;l=a+8|0;do{if((c[l>>2]|0)==(e|0)){if((e|0)==0){c[k>>2]=0;c[a+16>>2]=0;k=5160;break}else{c[m>>2]=0;c[l>>2]=0;j=8;break}}else{j=e+4|0;c[m>>2]=c[j>>2];c[j>>2]=0;j=8}}while(0);if((j|0)==8){c[k>>2]=e;k=c[e+20>>2]|0}j=h+4|0;if((c[j>>2]|0)!=0){c[g>>2]=5176;c[g+4>>2]=5223;c[g+8>>2]=140;$a(8,g|0)|0;jb(1)}if((c[h+36>>2]|0)==0){m=h+24|0;c[m>>2]=b;c[m+4>>2]=d;m=a+12|0;c[j>>2]=c[m>>2];c[m>>2]=h;i=f;return k|0}else{c[g>>2]=5248;c[g+4>>2]=5223;c[g+8>>2]=141;$a(8,g|0)|0;jb(1)}return 0}function Te(b,d){b=b|0;d=d|0;c[b+4>>2]=0;c[b+8>>2]=0;if((a[5152]|0)==0){a[5152]=1;c[1290]=72;c[1292]=72}c[b>>2]=d;c[b+16>>2]=0;c[b+20>>2]=0;c[b+12>>2]=0;return}function Ue(a){a=a|0;return a|0}function Ve(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+16|0;h=f;e=c[12]|0;c[12]=c[a>>2];d=c[1320]|0;c[1320]=a;j=a+20|0;if((c[j>>2]|0)!=0){c[h>>2]=5320;c[h+4>>2]=5223;c[h+8>>2]=283;$a(8,h|0)|0;jb(1)}g=a+12|0;a:do{if((c[g>>2]|0)!=0?(l=ys()|0,o=F,q=c[g>>2]|0,(q|0)!=0):0){p=a+4|0;n=a+8|0;m=g;b:while(1){while(1){t=q+24|0;u=t;v=c[u+4>>2]|0;r=q+4|0;s=c[r>>2]|0;if((v|0)>(o|0)|(v|0)==(o|0)&(c[u>>2]|0)>>>0>l>>>0){break}c[m>>2]=s;c[r>>2]=0;v=t;c[v>>2]=0;c[v+4>>2]=0;if((c[p>>2]|0)==0){c[p>>2]=q;c[n>>2]=q;c[r>>2]=0}else{r=(c[n>>2]|0)+4|0;if((c[r>>2]|0)!=0){break b}c[r>>2]=q;c[n>>2]=q}q=c[m>>2]|0;if((q|0)==0){break a}}if((s|0)==0){break a}else{m=r;q=s}}c[h>>2]=5680;c[h+4>>2]=5663;c[h+8>>2]=39;$a(8,h|0)|0;jb(1)}}while(0);l=a+4|0;n=c[l>>2]|0;m=a+8|0;do{if((c[m>>2]|0)==(n|0)){if((n|0)!=0){c[l>>2]=0;c[m>>2]=0;break}c[j>>2]=0;h=c[l>>2]|0;h=(h|0)!=0;h=h&1;v=c[g>>2]|0;v=(v|0)==0;g=h|2;g=v?h:g;v=c[a>>2]|0;v=v+48|0;v=c[v>>2]|0;v=(v|0)>0;v=v?0:g;c[1320]=d;c[12]=e;i=f;return v|0}else{v=n+4|0;c[l>>2]=c[v>>2];c[v>>2]=0}}while(0);c[j>>2]=n;p=c[n+20>>2]|0;o=a+16|0;c[o>>2]=b;if((p|0)==0){c[h>>2]=5352;c[h+4>>2]=5223;c[h+8>>2]=295;$a(8,h|0)|0;jb(1)}if((c[n+4>>2]|0)!=0){c[h>>2]=5384;c[h+4>>2]=5223;c[h+8>>2]=296;$a(8,h|0)|0;jb(1)}if((c[n+36>>2]|0)==0){k=p}else{c[h>>2]=5424;c[h+4>>2]=5223;c[h+8>>2]=297;$a(8,h|0)|0;jb(1)}do{v=dc[c[k>>2]&1023](k)|0;v=dc[c[v>>2]&1023](v)|0;v=dc[c[v>>2]&1023](v)|0;v=dc[c[v>>2]&1023](v)|0;v=dc[c[v>>2]&1023](v)|0;v=dc[c[v>>2]&1023](v)|0;v=dc[c[v>>2]&1023](v)|0;v=dc[c[v>>2]&1023](v)|0;v=dc[c[v>>2]&1023](v)|0;k=dc[c[v>>2]&1023](v)|0;v=c[o>>2]|0;c[o>>2]=v+ -1}while((v|0)>0);if((k|0)==5160){if((c[j>>2]|0)==0){h=c[l>>2]|0;h=(h|0)!=0;h=h&1;v=c[g>>2]|0;v=(v|0)==0;g=h|2;g=v?h:g;v=c[a>>2]|0;v=v+48|0;v=c[v>>2]|0;v=(v|0)>0;v=v?0:g;c[1320]=d;c[12]=e;i=f;return v|0}else{c[h>>2]=5464;c[h+4>>2]=5223;c[h+8>>2]=314;$a(8,h|0)|0;jb(1)}}if((k|0)==0){c[h>>2]=5496;c[h+4>>2]=5223;c[h+8>>2]=316;$a(8,h|0)|0;jb(1)}b=c[j>>2]|0;if((b|0)==0){c[h>>2]=5528;c[h+4>>2]=5223;c[h+8>>2]=317;$a(8,h|0)|0;jb(1)}c[b+20>>2]=k;k=c[j>>2]|0;c[j>>2]=0;j=k+4|0;if((c[j>>2]|0)!=0){c[h>>2]=5624;c[h+4>>2]=5663;c[h+8>>2]=28;$a(8,h|0)|0;jb(1)}if((c[l>>2]|0)==0){c[l>>2]=k;c[m>>2]=k;c[j>>2]=0;h=c[l>>2]|0;h=(h|0)!=0;h=h&1;v=c[g>>2]|0;v=(v|0)==0;g=h|2;g=v?h:g;v=c[a>>2]|0;v=v+48|0;v=c[v>>2]|0;v=(v|0)>0;v=v?0:g;c[1320]=d;c[12]=e;i=f;return v|0}j=(c[m>>2]|0)+4|0;if((c[j>>2]|0)!=0){c[h>>2]=5680;c[h+4>>2]=5663;c[h+8>>2]=39;$a(8,h|0)|0;jb(1)}c[j>>2]=k;c[m>>2]=k;h=c[l>>2]|0;h=(h|0)!=0;h=h&1;v=c[g>>2]|0;v=(v|0)==0;g=h|2;g=v?h:g;v=c[a>>2]|0;v=v+48|0;v=c[v>>2]|0;v=(v|0)>0;v=v?0:g;c[1320]=d;c[12]=e;i=f;return v|0}function We(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;if((c[b+36>>2]|0)!=0){c[e>>2]=5560;c[e+4>>2]=5223;c[e+8>>2]=343;$a(8,e|0)|0;jb(1)}f=b+4|0;if((c[f>>2]|0)!=0){c[e>>2]=5624;c[e+4>>2]=5663;c[e+8>>2]=28;$a(8,e|0)|0;jb(1)}g=a+4|0;if((c[g>>2]|0)==0){c[g>>2]=b;c[a+8>>2]=b;c[f>>2]=0;i=d;return}a=a+8|0;f=(c[a>>2]|0)+4|0;if((c[f>>2]|0)!=0){c[e>>2]=5680;c[e+4>>2]=5663;c[e+8>>2]=39;$a(8,e|0)|0;jb(1)}c[f>>2]=b;c[a>>2]=b;i=d;return}function Xe(a){a=a|0;var b=0;b=i;Oe(a,30688,73,30696,2);Oe(a,30712,74,30696,2);Oe(a,30720,75,30736,2);Oe(a,30776,76,30784,2);Oe(a,6736,77,30808,2);Oe(a,30888,78,30912,2);Oe(a,30928,79,30952,2);Oe(a,30968,80,30912,2);Oe(a,6936,81,30992,2);Oe(a,31e3,82,31008,2);Oe(a,6920,72,31008,2);i=b;return}function Ye(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;i=i+16|0;d=b;e=c[c[a+12>>2]>>2]|0;if((e|0)==0){i=b;return}f=e+36|0;if((c[f>>2]|0)<1){i=b;return}g=c[a+4>>2]|0;a=c[g+12>>2]|0;g=c[g>>2]|0;h=dc[c[(c[a>>2]|0)+16>>2]&1023](a)|0;if((h|0)>0){j=0;do{l=hc[c[(c[a>>2]|0)+24>>2]&63](a,j)|0;k=c[l>>2]|0;m=c[k+48>>2]|0;k=g+(dc[c[k+40>>2]&1023](l)|0)|0;$b[m&63](l,k,0)|0;j=j+1|0}while((j|0)!=(h|0))}if((c[e+32>>2]|0)!=1){c[d>>2]=5840;c[d+4>>2]=5759;c[d+8>>2]=93;$a(8,d|0)|0;jb(1)}a=c[f>>2]|0;if((a|0)<=0){c[d>>2]=5872;c[d+4>>2]=5759;c[d+8>>2]=131;$a(8,d|0)|0;jb(1)}m=a+ -1|0;c[f>>2]=m;if((m|0)!=0){i=b;return}We(c[1320]|0,e);i=b;return}function Ze(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+16|0;l=f;if((c[b+12>>2]|0)!=4){c[l>>2]=5952;c[l+4>>2]=5759;c[l+8>>2]=296;$a(8,l|0)|0;jb(1)}if((c[b+16>>2]&16777216|0)==0){n=0;i=f;return n|0}j=(d<<2)+4|0;g=a+8|0;m=c[g>>2]|0;n=m+4|0;h=c[n>>2]|0;k=c[m>>2]|0;if((h|0)!=0){if(k>>>0<j>>>0){c[l>>2]=1048;c[l+4>>2]=5759;c[l+8>>2]=192;$a(8,l|0)|0;jb(1)}c[m>>2]=k-j;c[n>>2]=h+j;c[h>>2]=0;j=a+3236|0;a=c[j>>2]|0;if((a|0)!=0){c[a>>2]=h;c[j>>2]=0}}else{c[m>>2]=k+j;h=1}if((c[(c[g>>2]|0)+4>>2]|0)==0){n=h;i=f;return n|0}$b[c[(c[b>>2]|0)+48>>2]&63](b,h,0)|0;if((d|0)<=0){n=h;i=f;return n|0}b=h+4|0;g=0;do{c[b+(g<<2)>>2]=c[e+(g<<2)>>2];g=g+1|0}while((g|0)!=(d|0));i=f;return h|0}function _e(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;g=e;f=a+3296|0;if((c[f>>2]|0)==0){c[g>>2]=6e3;c[g+4>>2]=5759;c[g+8>>2]=350;$a(8,g|0)|0;jb(1)}b=Qc(c[c[c[(c[a+3232>>2]|0)+8>>2]>>2]>>2]|0,b)|0;if((b|0)==0){b=0}else{b=c[b>>2]|0}if(!((b|0)!=0|d^1)){b=0;i=e;return b|0}c[a+3292>>2]=b;if((b|0)==0){c[g>>2]=6032;c[g+4>>2]=5759;c[g+8>>2]=357;$a(8,g|0)|0;jb(1)}if((c[b+16>>2]&2031616|0)!=983040){c[g>>2]=6064;c[g+4>>2]=5759;c[g+8>>2]=358;$a(8,g|0)|0;jb(1)}a=hc[c[(c[b>>2]|0)+24>>2]&63](b,0)|0;c[f>>2]=a;if((a|0)==0){c[g>>2]=6e3;c[g+4>>2]=5759;c[g+8>>2]=360;$a(8,g|0)|0;jb(1)}else{b=a;i=e;return b|0}return 0}function $e(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+48|0;m=f;n=f+40|0;q=f+32|0;k=f+24|0;j=f+16|0;h=f+12|0;g=b+3256|0;c[g>>2]=0;l=d+4|0;r=c[l>>2]|0;s=c[d>>2]|0;t=r-s|0;a:do{if((t|0)<1){u=408;q=s}else{v=s+1|0;w=1800;u=s;while(1){if(!(u>>>0<v>>>0)){break}if((a[u]|0)==(a[w]|0)){w=w+1|0;u=u+1|0}else{u=408;q=s;break a}}if(s>>>0<r>>>0){c[d>>2]=v}h=b+3232|0;w=Qc(c[c[c[(c[h>>2]|0)+8>>2]>>2]>>2]|0,d)|0;c[e>>2]=w;if((w|0)==0){i=f;return}if((c[(c[b+3252>>2]|0)+16>>2]&1879048192|0)!=268435456){c[e>>2]=0;c[b>>2]=5;i=f;return}c[q>>2]=2688;c[q+4>>2]=2692;e=Qc(c[c[c[(c[h>>2]|0)+8>>2]>>2]>>2]|0,q)|0;if((e|0)==0){e=0}else{e=c[e>>2]|0}c[g>>2]=e;c[b>>2]=7;i=f;return}}while(0);while(1){if(!(q>>>0<r>>>0)){o=15;break}if((a[q]|0)==(a[u]|0)){u=u+1|0;q=q+1|0}else{break}}if((o|0)==15?(a[u]|0)==0:0){h=c[b+3252>>2]|0;c[g>>2]=h;do{if((c[h+16>>2]&2097152|0)==0){g=c[12]|0;if((g|0)==0){c[m>>2]=33224;c[m+4>>2]=8906;c[m+8>>2]=284;$a(8,m|0)|0;jb(1)}else{w=c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0;p=Ec(g,(c[h+12>>2]|0)+28|0)|0;$c(p,w,h);c[p>>2]=1360;w=p+16|0;c[w>>2]=c[w>>2]|16777216;w=p+20|0;a[w]=a[w]|8;$b[c[(c[h>>2]|0)+48>>2]&63](h,p+28|0,h)|0;p=hc[c[(c[p>>2]|0)+44>>2]&63](p,1)|0;break}}else{p=0}}while(0);c[e>>2]=p;c[b>>2]=8;i=f;return}u=c[b+3280>>2]|0;p=m+4|0;c[p>>2]=0;c[m>>2]=0;q=n+4|0;c[n>>2]=s;c[q>>2]=r;do{if((t|0)>0){o=0;t=u;while(1){b:do{if(s>>>0<r>>>0){u=s;while(1){v=u+1|0;if((a[u]|0)==46){break b}if(v>>>0<r>>>0){u=v}else{u=v;break}}}else{u=s}}while(0);c[m>>2]=s;c[p>>2]=u;c[n>>2]=u;c[q>>2]=r;t=hc[c[(c[t>>2]|0)+20>>2]&63](t,m)|0;if((t|0)==0){o=26;break}u=(dc[c[(c[t>>2]|0)+40>>2]&1023](t)|0)+o|0;Zc(n,46)|0;r=c[q>>2]|0;s=c[n>>2]|0;if((r-s|0)>0){o=u}else{o=28;break}}if((o|0)==26){c[g>>2]=0;break}else if((o|0)==28){c[g>>2]=t;o=30;break}}else{c[g>>2]=u;if((u|0)!=0){u=0;o=30}}}while(0);if((o|0)==30){c[e>>2]=(c[b+3284>>2]|0)+u;c[b>>2]=6;i=f;return}c:do{if((c[b+3276>>2]|0)!=0){t=c[b+3268>>2]|0;p=m+4|0;c[p>>2]=0;c[m>>2]=0;o=n+4|0;q=c[d>>2]|0;r=c[l>>2]|0;c[n>>2]=q;c[o>>2]=r;do{if((r-q|0)>0){s=0;while(1){d:do{if(q>>>0<r>>>0){v=q;while(1){u=v+1|0;if((a[v]|0)==46){u=v;break d}if(u>>>0<r>>>0){v=u}else{break}}}else{u=q}}while(0);c[m>>2]=q;c[p>>2]=u;c[n>>2]=u;c[o>>2]=r;t=hc[c[(c[t>>2]|0)+20>>2]&63](t,m)|0;if((t|0)==0){o=37;break}s=(dc[c[(c[t>>2]|0)+40>>2]&1023](t)|0)+s|0;Zc(n,46)|0;r=c[o>>2]|0;q=c[n>>2]|0;if((r-q|0)<=0){o=39;break}}if((o|0)==37){c[g>>2]=0;break c}else if((o|0)==39){c[g>>2]=t;break}}else{c[g>>2]=t;if((t|0)==0){break c}else{s=0}}}while(0);c[e>>2]=(c[b+3272>>2]|0)+s;c[b>>2]=9;i=f;return}}while(0);n=k+4|0;c[n>>2]=0;c[k>>2]=0;m=j+4|0;c[m>>2]=0;c[j>>2]=0;d=c[d>>2]|0;l=c[l>>2]|0;e:do{if(d>>>0<l>>>0){p=d;while(1){o=p+1|0;if((a[p]|0)==46){o=p;break e}if(o>>>0<l>>>0){p=o}else{break}}}else{o=d}}while(0);c[k>>2]=d;c[n>>2]=o;c[j>>2]=o;c[m>>2]=l;k=Qc(c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0,k)|0;if((k|0)!=0){k=c[k>>2]|0;c[g>>2]=k;if((k|0)!=0){l=hc[c[(c[k>>2]|0)+44>>2]&63](k,1)|0;c[h>>2]=l;w=Zc(j,46)|0;k=c[g>>2]|0;if(w){k=_c(k,j,l,h,0)|0;c[g>>2]=k}if((k|0)!=0){c[e>>2]=c[h>>2];c[b>>2]=7;i=f;return}}}else{c[g>>2]=0}c[e>>2]=0;c[g>>2]=0;i=f;return}function af(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;e=i;i=i+4176|0;d=e;f=e+840|0;h=e+440|0;j=e+24|0;s=e+432|0;y=e+16|0;z=e+424|0;k=e+4152|0;l=e+4160|0;t=b+12|0;r=c[t>>2]|0;if((r|0)<=0){c[d>>2]=6712;c[d+4>>2]=5759;c[d+8>>2]=759;$a(8,d|0)|0;jb(1)}c[f+3264>>2]=0;c[f+3260>>2]=0;I=c[b+3232>>2]|0;g=b+8|0;H=c[g>>2]|0;G=c[b+4>>2]|0;v=f+3236|0;c[v>>2]=0;p=f+3240|0;c[p>>2]=0;q=f+3244|0;c[q>>2]=0;n=f+12|0;c[n>>2]=0;c[f+1216>>2]=0;c[f+2420>>2]=0;o=f+3304|0;c[o>>2]=0;c[f+3232>>2]=I;I=c[I+8>>2]|0;c[f+3228>>2]=I;c[f+4>>2]=G;c[f+8>>2]=H;a[f+3308|0]=0;H=c[I+4>>2]|0;c[f+3276>>2]=H;c[f+3272>>2]=c[H>>2];c[f+3268>>2]=c[H+12>>2];I=c[I+8>>2]|0;c[f+3288>>2]=I;c[f+3284>>2]=c[I>>2];c[f+3280>>2]=c[I+12>>2];c[f+2424>>2]=0;c[f+3300>>2]=-1;bu(f+2428|0,0,800)|0;bu(f+1220|0,0,1200)|0;r=r+ -1|0;if((r|0)>99){I=0;i=e;return I|0}u=c[b+16>>2]|0;x=(r|0)>0;if(x){A=b+20|0;I=r<<2;$t(h|0,A|0,I|0)|0;w=b+420|0;$t(j|0,w|0,I|0)|0}else{A=b+20|0;w=b+420|0}c[w>>2]=0;c[t>>2]=2;c[A>>2]=0;w=b+3304|0;A=c[w>>2]|0;if((A|0)==0){A=2}else{c[A>>2]=(c[A>>2]|0)+1;A=c[t>>2]|0}c[b+(A<<2)+416>>2]=0;I=c[t>>2]|0;c[t>>2]=I+1;c[b+(I<<2)+16>>2]=0;w=c[w>>2]|0;if((w|0)!=0){c[w>>2]=(c[w>>2]|0)+1}A=c[t>>2]|0;B=A+ -1|0;a[b+3308|0]=0;c[s>>2]=6736;c[s+4>>2]=6742;t=b+3296|0;c[t>>2]=_e(b,s,0)|0;s=we(b)|0;u=c[(c[u+8>>2]|0)+4>>2]|0;w=c[u+12>>2]|0;u=c[u>>2]|0;c[y>>2]=6744;c[y+4>>2]=6748;c[z>>2]=6752;c[z+4>>2]=6756;c[k>>2]=6768;c[k+4>>2]=6775;c[l>>2]=6776;c[l+4>>2]=6786;c[v>>2]=0;if(x){C=0;do{E=hc[c[(c[w>>2]|0)+24>>2]&63](w,C)|0;D=dc[c[(c[E>>2]|0)+40>>2]&1023](E)|0;F=E+16|0;I=c[F>>2]|0;G=c[h+(C<<2)>>2]|0;H=(G|0)!=0;if((I&2097152|0)==0){if(H){re(f,k)|0;c[f+(c[n>>2]<<2)+416>>2]=c[j+(C<<2)>>2];H=c[n>>2]|0;c[n>>2]=H+1;c[f+(H<<2)+16>>2]=G;H=c[o>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}c[f+(c[n>>2]<<2)+416>>2]=E;H=c[n>>2]|0;c[n>>2]=H+1;c[f+(H<<2)+16>>2]=u+D;H=c[o>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}we(f)|0;H=27}else{H=29}}else{if(H){if((I&1342177280|0)==268435456){re(f,z)|0;c[f+(c[n>>2]<<2)+416>>2]=c[j+(C<<2)>>2];H=c[n>>2]|0;c[n>>2]=H+1;c[f+(H<<2)+16>>2]=G;H=c[o>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}c[f+(c[n>>2]<<2)+416>>2]=E;H=c[n>>2]|0;c[n>>2]=H+1;c[f+(H<<2)+16>>2]=u+D;H=c[o>>2]|0;if((H|0)!=0){c[H>>2]=(c[H>>2]|0)+1}we(f)|0;H=27}else{H=28}}else{H=29}}if((H|0)==27){if((G|0)==0){H=29}else{H=28}}if((H|0)==28?(H=0,(c[F>>2]&1627389952|0)==553648128):0){H=29}if((H|0)==29){re(f,y)|0;c[f+(c[n>>2]<<2)+416>>2]=0;F=c[n>>2]|0;c[n>>2]=F+1;c[f+(F<<2)+16>>2]=E;F=c[o>>2]|0;if((F|0)!=0){c[F>>2]=(c[F>>2]|0)+1}c[f+(c[n>>2]<<2)+416>>2]=E;I=c[n>>2]|0;c[n>>2]=I+1;c[f+(I<<2)+16>>2]=u+D;D=c[o>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}we(f)|0}C=C+1|0}while((C|0)!=(r|0))}c[d>>2]=6920;c[d+4>>2]=6928;re(f,d)|0;we(f)|0;y=b+3240|0;c[y>>2]=(c[y>>2]|0)+(c[p>>2]|0);z=b+3244|0;c[z>>2]=(c[z>>2]|0)+(c[q>>2]|0);if((A|0)>0){A=s+4+(B<<2)|0}else{A=0}c[v>>2]=A;a:do{if(x){v=0;while(1){x=hc[c[(c[w>>2]|0)+24>>2]&63](w,v)|0;A=x+16|0;B=c[A>>2]|0;if(!((B&1610612736|0)!=536870912|(B&2031616|0)==196608)?(m=c[h+(v<<2)>>2]|0,(m|0)!=0):0){I=dc[c[(c[x>>2]|0)+40>>2]&1023](x)|0;re(f,k)|0;c[f+(c[n>>2]<<2)+416>>2]=x;B=c[n>>2]|0;c[n>>2]=B+1;c[f+(B<<2)+16>>2]=u+I;B=c[o>>2]|0;if((B|0)!=0){c[B>>2]=(c[B>>2]|0)+1}c[f+(c[n>>2]<<2)+416>>2]=c[j+(v<<2)>>2];B=c[n>>2]|0;c[n>>2]=B+1;c[f+(B<<2)+16>>2]=m;B=c[o>>2]|0;if((B|0)!=0){c[B>>2]=(c[B>>2]|0)+1}we(f)|0;B=c[A>>2]|0}if((B&2097152|0)==0){if((c[h+(v<<2)>>2]|0)==0){break}B=dc[c[(c[x>>2]|0)+40>>2]&1023](x)|0;re(f,l)|0;c[f+(c[n>>2]<<2)+416>>2]=0;A=c[n>>2]|0;c[n>>2]=A+1;c[f+(A<<2)+16>>2]=x;A=c[o>>2]|0;if((A|0)!=0){c[A>>2]=(c[A>>2]|0)+1}c[f+(c[n>>2]<<2)+416>>2]=x;x=c[n>>2]|0;c[n>>2]=x+1;c[f+(x<<2)+16>>2]=u+B;x=c[o>>2]|0;if((x|0)!=0){c[x>>2]=(c[x>>2]|0)+1}we(f)|0}v=v+1|0;if((v|0)>=(r|0)){break a}}c[d>>2]=6792;c[d+4>>2]=5759;c[d+8>>2]=873;$a(8,d|0)|0;jb(1)}}while(0);c[d>>2]=6920;c[d+4>>2]=6928;re(f,d)|0;we(f)|0;c[y>>2]=(c[y>>2]|0)+(c[p>>2]|0);c[z>>2]=(c[z>>2]|0)+(c[q>>2]|0);c[t>>2]=0;if((c[(c[g>>2]|0)+4>>2]|0)==0){I=s;i=e;return I|0}f=b+3236|0;if((c[f>>2]|0)!=0){c[d>>2]=5928;c[d+4>>2]=5759;c[d+8>>2]=251;$a(8,d|0)|0;jb(1)}c[f>>2]=s+8;I=s;i=e;return I|0}function bf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=2720;c[g+4>>2]=2736;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=29672;c[g+4>>2]=29683;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=4936;c[f+8>>2]=4948;c[f+12>>2]=4936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[12]=e;Pe(b,29688,6952,29704);c[g>>2]=29720;c[g+4>>2]=29727;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=29728;c[f+8>>2]=30128;c[f+12>>2]=29728;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[12]=e;Pe(b,2392,6944,30136);c[g>>2]=6304;c[g+4>>2]=6330;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=30432;c[f+8>>2]=30450;c[f+12>>2]=30432;c[f+16>>2]=1;a[f+20|0]=0;f=Vd(f)|0;c[12]=b;Kc(b,g,f)|0;c[12]=e;Oe(b,30456,83,30472,2);i=d;return}function cf(a){a=a|0;var b=0;b=i;Oe(a,28984,84,29e3,2);Oe(a,29032,85,29048,2);Oe(a,29072,86,29048,2);Oe(a,29088,87,29048,2);Oe(a,29104,88,29120,2);Oe(a,29144,89,29160,2);Oe(a,29192,90,29208,2);Oe(a,29232,91,29248,2);Oe(a,29288,92,29312,2);Oe(a,29360,93,29376,2);Oe(a,29424,94,29248,2);Oe(a,29440,95,29312,2);Oe(a,29464,96,29480,2);Oe(a,29504,97,29520,2);i=b;return}function df(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=15504;c[g+4>>2]=15516;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15520;c[f+8>>2]=15569;c[f+12>>2]=15520;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15576;c[g+4>>2]=15587;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15592;c[f+8>>2]=15627;c[f+12>>2]=15592;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15632;c[g+4>>2]=15641;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15648;c[f+8>>2]=15679;c[f+12>>2]=15648;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15680;c[g+4>>2]=15690;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15696;c[f+8>>2]=15739;c[f+12>>2]=15696;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15744;c[g+4>>2]=15754;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15760;c[f+8>>2]=15793;c[f+12>>2]=15760;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15800;c[g+4>>2]=15811;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15816;c[f+8>>2]=15862;c[f+12>>2]=15816;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15864;c[g+4>>2]=15874;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15880;c[f+8>>2]=15913;c[f+12>>2]=15880;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15920;c[g+4>>2]=15931;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=15936;c[f+8>>2]=15982;c[f+12>>2]=15936;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=15984;c[g+4>>2]=15994;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16e3;c[f+8>>2]=16033;c[f+12>>2]=16e3;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16040;c[g+4>>2]=16051;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16056;c[f+8>>2]=16102;c[f+12>>2]=16056;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16104;c[g+4>>2]=16112;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16120;c[f+8>>2]=16148;c[f+12>>2]=16120;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16152;c[g+4>>2]=16161;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16168;c[f+8>>2]=16206;c[f+12>>2]=16168;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16208;c[g+4>>2]=16217;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16224;c[f+8>>2]=16255;c[f+12>>2]=16224;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16256;c[g+4>>2]=16266;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16272;c[f+8>>2]=16314;c[f+12>>2]=16272;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16320;c[g+4>>2]=16329;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16336;c[f+8>>2]=16367;c[f+12>>2]=16336;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16368;c[g+4>>2]=16378;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16384;c[f+8>>2]=16427;c[f+12>>2]=16384;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16432;c[g+4>>2]=16441;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16448;c[f+8>>2]=16479;c[f+12>>2]=16448;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=16480;c[g+4>>2]=16490;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=16496;c[f+8>>2]=16539;c[f+12>>2]=16496;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[12]=e;Oe(b,16544,98,16560,2);Oe(b,16576,99,16560,2);Oe(b,16592,100,16560,2);Oe(b,16608,101,16560,2);Oe(b,16624,102,16560,2);Oe(b,16640,103,16560,2);Oe(b,16656,104,16672,2);Oe(b,16704,105,16672,2);Oe(b,16720,106,16736,2);Oe(b,16776,107,16736,2);Oe(b,16792,108,16736,2);Oe(b,16808,109,16736,2);Oe(b,16824,110,16736,2);Oe(b,16840,111,16736,2);Oe(b,16856,112,16872,2);Oe(b,16888,113,16872,2);Oe(b,16904,114,16872,2);Oe(b,16920,115,16936,2);Oe(b,16952,116,16872,2);Oe(b,16968,117,16984,2);Oe(b,17024,118,16984,2);Oe(b,17040,119,16984,2);Oe(b,17056,120,17072,2);Oe(b,17112,121,16872,2);Oe(b,17128,122,16872,2);Oe(b,17136,123,16872,2);Oe(b,17152,124,16872,2);Oe(b,17168,125,16872,2);Oe(b,17184,126,16872,2);Oe(b,17200,127,17216,2);Oe(b,17256,128,17216,2);Oe(b,17272,129,17216,2);Oe(b,17288,130,17216,2);Oe(b,17304,131,17216,2);Oe(b,17320,132,17216,2);Oe(b,17336,133,17352,2);Oe(b,17392,134,17352,2);Oe(b,17408,135,17352,2);Oe(b,17424,136,17352,2);Oe(b,17440,137,17352,2);Oe(b,17456,138,17352,2);Oe(b,17472,139,17496,2);Oe(b,17520,140,17544,2);Oe(b,17568,141,17592,2);Oe(b,17616,142,17640,2);Oe(b,17664,143,17688,2);Oe(b,17712,144,17736,2);Oe(b,17760,145,17784,2);Oe(b,17808,146,17832,2);Oe(b,17856,147,17880,2);Oe(b,17904,148,17920,2);Oe(b,17936,149,17920,2);Oe(b,17952,150,17920,2);Oe(b,17968,151,17984,2);Oe(b,18e3,152,17920,2);Oe(b,18016,153,18032,2);Oe(b,18072,154,18032,2);Oe(b,18088,155,18104,2);Oe(b,18144,156,18160,2);Oe(b,18200,157,17920,2);Oe(b,18216,158,17920,2);Oe(b,18232,159,17920,2);Oe(b,18248,160,17920,2);Oe(b,18264,161,17920,2);Oe(b,18280,162,17920,2);Oe(b,18296,163,18312,2);Oe(b,18352,164,18312,2);Oe(b,18368,165,18312,2);Oe(b,18384,166,18312,2);Oe(b,18400,167,18312,2);Oe(b,18416,168,18312,2);Oe(b,18432,169,18456,2);Oe(b,18504,170,18456,2);Oe(b,18528,171,18456,2);Oe(b,18552,172,18456,2);Oe(b,18576,173,18456,2);Oe(b,18600,174,18456,2);Oe(b,18624,175,18648,2);Oe(b,18672,176,18696,2);Oe(b,18728,177,18752,2);Oe(b,18784,178,18808,2);Oe(b,18832,179,18856,2);Oe(b,18880,180,18904,2);Oe(b,18928,181,18952,2);Oe(b,18976,182,19e3,2);Oe(b,19032,183,19056,2);Oe(b,19088,184,19104,2);Oe(b,19120,185,19104,2);Oe(b,19136,186,19104,2);Oe(b,19152,187,19168,2);Oe(b,19184,188,19104,2);Oe(b,19200,189,19216,2);Oe(b,19256,190,19216,2);Oe(b,19272,191,19288,2);Oe(b,19328,192,19344,2);Oe(b,19384,193,19104,2);Oe(b,19400,194,19104,2);Oe(b,19416,195,19104,2);Oe(b,19432,196,19104,2);Oe(b,19448,197,19104,2);Oe(b,19464,198,19104,2);Oe(b,19480,199,19496,2);Oe(b,19536,200,19496,2);Oe(b,19552,201,19496,2);Oe(b,19568,202,19496,2);Oe(b,19584,203,19496,2);Oe(b,19600,204,19496,2);Oe(b,19616,205,19640,2);Oe(b,19688,206,19640,2);Oe(b,19712,207,19640,2);Oe(b,19736,208,19640,2);Oe(b,19760,209,19640,2);Oe(b,19784,210,19640,2);Oe(b,19808,211,19832,2);Oe(b,19856,212,19880,2);Oe(b,19912,213,19936,2);Oe(b,19968,214,19992,2);Oe(b,20016,215,20040,2);Oe(b,20064,216,20088,2);Oe(b,20112,217,20136,2);Oe(b,20160,218,20184,2);Oe(b,20216,219,20240,2);Oe(b,20272,220,20288,2);Oe(b,20304,221,20288,2);Oe(b,20320,222,20288,2);Oe(b,20336,223,20352,2);Oe(b,20368,224,20288,2);Oe(b,20384,225,20400,2);Oe(b,20440,226,20400,2);Oe(b,20456,227,20472,2);Oe(b,20512,228,20288,2);Oe(b,20528,229,20288,2);Oe(b,20544,230,20288,2);Oe(b,20560,231,20288,2);Oe(b,20576,232,20288,2);Oe(b,20592,233,20288,2);Oe(b,20608,234,20624,2);Oe(b,20664,235,20624,2);Oe(b,20680,236,20624,2);Oe(b,20696,237,20624,2);Oe(b,20712,238,20624,2);Oe(b,20728,239,20624,2);Oe(b,20744,240,20768,2);Oe(b,20816,241,20768,2);Oe(b,20840,242,20768,2);Oe(b,20864,243,20768,2);Oe(b,20888,244,20768,2);Oe(b,20912,245,20768,2);Oe(b,20936,246,20960,2);Oe(b,20984,247,21008,2);Oe(b,21040,248,21064,2);Oe(b,21096,249,21120,2);Oe(b,21144,250,21168,2);Oe(b,21192,251,21216,2);Oe(b,21240,252,21264,2);Oe(b,21288,253,21312,2);Oe(b,21344,254,21368,2);Oe(b,21400,255,21408,2);Oe(b,21424,256,21408,2);Oe(b,21432,257,21408,2);Oe(b,21440,258,21456,2);Oe(b,21472,259,21408,2);Oe(b,21480,260,21496,2);Oe(b,21528,261,21496,2);Oe(b,21544,262,21560,2);Oe(b,21592,263,21608,2);Oe(b,21640,264,9152,2);Oe(b,21656,265,21408,2);Oe(b,21664,266,21408,2);Oe(b,21672,267,21408,2);Oe(b,21680,268,21408,2);Oe(b,21696,269,21408,2);Oe(b,21704,270,21408,2);Oe(b,21712,271,21728,2);Oe(b,21768,272,21728,2);Oe(b,21784,273,21728,2);Oe(b,21800,274,21728,2);Oe(b,21816,275,21728,2);Oe(b,21832,276,21728,2);Oe(b,21848,277,21864,2);Oe(b,21904,278,21864,2);Oe(b,21920,279,21864,2);Oe(b,21936,280,21864,2);Oe(b,21952,281,21864,2);Oe(b,21968,282,21864,2);Oe(b,21984,283,22008,2);Oe(b,22032,284,22056,2);Oe(b,22080,285,22104,2);Oe(b,22128,286,22152,2);Oe(b,22176,287,22200,2);Oe(b,22224,288,22248,2);Oe(b,22272,289,22296,2);Oe(b,22320,290,22344,2);Oe(b,22368,291,22392,2);Oe(b,22416,292,22432,2);Oe(b,22448,293,22432,2);Oe(b,22464,294,22432,2);Oe(b,22480,295,22496,2);Oe(b,22512,296,22432,2);Oe(b,22528,297,22544,2);Oe(b,22584,298,22544,2);Oe(b,22600,299,22616,2);Oe(b,22656,300,22672,2);Oe(b,22712,301,22728,2);Oe(b,22752,302,22432,2);Oe(b,22768,303,22432,2);Oe(b,22776,304,22432,2);Oe(b,22792,305,22432,2);Oe(b,22808,306,22432,2);Oe(b,22824,307,22432,2);Oe(b,22840,308,22856,2);Oe(b,22896,309,22856,2);Oe(b,22912,310,22856,2);Oe(b,22928,311,22856,2);Oe(b,22944,312,22856,2);Oe(b,22960,313,22856,2);Oe(b,22976,314,23e3,2);Oe(b,23032,315,23048,2);Oe(b,23088,316,23048,2);Oe(b,23104,317,23048,2);Oe(b,23120,318,23048,2);Oe(b,23136,319,23048,2);Oe(b,23152,320,23048,2);Oe(b,23168,321,23192,2);Oe(b,23216,322,23240,2);Oe(b,23264,323,23288,2);Oe(b,23312,324,23336,2);Oe(b,23360,325,23384,2);Oe(b,23408,326,23432,2);Oe(b,23456,327,23480,2);Oe(b,23504,328,23528,2);Oe(b,23552,329,23576,2);Oe(b,23600,330,23616,2);Oe(b,23632,331,23616,2);Oe(b,23648,332,23616,2);Oe(b,23664,333,23680,2);Oe(b,23696,334,23616,2);Oe(b,23712,335,23728,2);Oe(b,23768,336,23728,2);Oe(b,23784,337,23800,2);Oe(b,23840,338,23856,2);Oe(b,23896,339,23912,2);Oe(b,23936,340,23616,2);Oe(b,23952,341,23616,2);Oe(b,23960,342,23616,2);Oe(b,23976,343,23616,2);Oe(b,23992,344,23616,2);Oe(b,24008,345,23616,2);Oe(b,24024,346,23616,2);Oe(b,24048,347,23616,2);Oe(b,24064,348,24080,2);Oe(b,24120,349,24080,2);Oe(b,24136,350,24080,2);Oe(b,24152,351,24080,2);Oe(b,24168,352,24080,2);Oe(b,24184,353,24080,2);Oe(b,24200,354,24216,2);Oe(b,24256,355,24216,2);Oe(b,24272,356,24216,2);Oe(b,24288,357,24216,2);Oe(b,24304,358,24216,2);Oe(b,24320,359,24216,2);Oe(b,24336,360,24360,2);Oe(b,24384,361,24408,2);Oe(b,24432,362,24456,2);Oe(b,24480,363,24504,2);Oe(b,24528,364,24552,2);Oe(b,24576,365,24600,2);Oe(b,24624,366,24648,2);Oe(b,24672,367,24696,2);Oe(b,24720,368,24744,2);Oe(b,24768,369,24784,2);Oe(b,24800,370,24784,2);Oe(b,24816,371,24784,2);Oe(b,24832,372,24848,2);Oe(b,24864,373,24784,2);Oe(b,24880,374,24896,2);Oe(b,24936,375,24896,2);Oe(b,24952,376,24968,2);Oe(b,25008,377,25024,2);Oe(b,25048,378,24784,2);Oe(b,25064,379,24784,2);Oe(b,25072,380,24784,2);Oe(b,25088,381,24784,2);Oe(b,25104,382,24784,2);Oe(b,25120,383,24784,2);Oe(b,25136,384,25152,2);Oe(b,25192,385,25152,2);Oe(b,25208,386,25152,2);Oe(b,25224,387,25152,2);Oe(b,25240,388,25152,2);Oe(b,25256,389,25152,2);Oe(b,25272,390,25288,2);Oe(b,25328,391,25288,2);Oe(b,25344,392,25288,2);Oe(b,25360,393,25288,2);Oe(b,25376,394,25288,2);Oe(b,25392,395,25288,2);Oe(b,25408,396,25432,2);Oe(b,25456,397,25480,2);Oe(b,25504,398,25528,2);Oe(b,25552,399,25576,2);Oe(b,25600,400,25624,2);Oe(b,25648,401,25672,2);Oe(b,25696,402,25720,2);Oe(b,25744,403,25768,2);Oe(b,25792,404,25816,2);c[g>>2]=25840;c[g+4>>2]=25850;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=25856;c[f+8>>2]=25889;c[f+12>>2]=25856;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=25896;c[g+4>>2]=25907;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=25912;c[f+8>>2]=25958;c[f+12>>2]=25912;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[12]=e;Oe(b,25960,405,25976,2);Oe(b,25992,406,25976,2);Oe(b,26008,407,25976,2);Oe(b,26024,408,26040,2);Oe(b,26056,409,25976,2);Oe(b,26072,410,26040,2);Oe(b,26088,411,26040,2);Oe(b,26104,412,26040,2);Oe(b,26120,413,26040,2);Oe(b,26136,414,26040,2);Oe(b,26152,415,26040,2);Oe(b,26168,416,26040,2);Oe(b,26184,417,26040,2);Oe(b,26200,418,26040,2);Oe(b,26216,419,26040,2);Oe(b,26240,420,25976,2);Oe(b,26256,421,26272,2);Oe(b,26304,422,26272,2);Oe(b,26320,423,26272,2);Oe(b,26336,424,26352,2);Oe(b,26392,425,26272,2);Oe(b,26408,426,26272,2);Oe(b,26424,427,26272,2);Oe(b,26440,428,26352,2);Oe(b,26456,429,26352,2);Oe(b,26472,430,26488,2);Oe(b,26528,431,26488,2);Oe(b,26544,432,26488,2);Oe(b,26560,433,26488,2);Oe(b,26576,434,26488,2);Oe(b,26592,435,26488,2);Oe(b,26608,436,26632,2);Oe(b,26680,437,26632,2);Oe(b,26704,438,26632,2);Oe(b,26728,439,26632,2);Oe(b,26752,440,26632,2);Oe(b,26776,441,26632,2);Oe(b,26800,442,26824,2);Oe(b,26848,443,26872,2);Oe(b,26904,444,26928,2);Oe(b,26960,445,26984,2);Oe(b,27016,446,27040,2);Oe(b,27064,447,27088,2);Oe(b,27112,448,27136,2);Oe(b,27160,449,27184,2);Oe(b,27208,450,27232,2);c[g>>2]=27264;c[g+4>>2]=27274;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=27280;c[f+8>>2]=27313;c[f+12>>2]=27280;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=27320;c[g+4>>2]=27331;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=27336;c[f+8>>2]=27382;c[f+12>>2]=27336;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=27384;c[g+4>>2]=27385;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=27392;c[f+8>>2]=27423;c[f+12>>2]=27392;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=27424;c[g+4>>2]=27426;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=27432;c[f+8>>2]=27463;c[f+12>>2]=27432;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=27464;c[g+4>>2]=27467;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=27472;c[f+8>>2]=27502;c[f+12>>2]=27472;c[f+16>>2]=1;a[f+20|0]=0;f=Vd(f)|0;c[12]=b;Kc(b,g,f)|0;c[12]=e;Oe(b,27504,451,27520,2);Oe(b,27536,452,27520,2);Oe(b,27552,453,27520,2);Oe(b,27568,454,27584,2);Oe(b,27600,455,27520,2);Oe(b,27616,456,27584,2);Oe(b,27632,457,27584,2);Oe(b,27648,458,27584,2);Oe(b,27664,459,27584,2);Oe(b,27680,460,27584,2);Oe(b,27696,461,27584,2);Oe(b,27712,462,27584,2);Oe(b,27728,463,27584,2);Oe(b,27744,464,27584,2);Oe(b,27760,465,27584,2);Oe(b,27784,466,27520,2);Oe(b,27800,467,27816,2);Oe(b,27848,468,27816,2);Oe(b,27864,469,27816,2);Oe(b,27880,470,27896,2);Oe(b,27936,471,27816,2);Oe(b,27952,472,27816,2);Oe(b,27968,473,27816,2);Oe(b,27984,474,27896,2);Oe(b,28e3,475,27896,2);Oe(b,28016,476,28032,2);Oe(b,28072,477,28032,2);Oe(b,28088,478,28032,2);Oe(b,28104,479,28032,2);Oe(b,28120,480,28032,2);Oe(b,28136,481,28032,2);Oe(b,28152,482,28176,2);Oe(b,28224,483,28176,2);Oe(b,28248,484,28176,2);Oe(b,28272,485,28176,2);Oe(b,28296,486,28176,2);Oe(b,28320,487,28176,2);Oe(b,28344,488,28368,2);Oe(b,28392,489,28416,2);Oe(b,28448,490,28472,2);Oe(b,28504,491,28528,2);Oe(b,28560,492,28584,2);Oe(b,28608,493,28632,2);Oe(b,28656,494,28680,2);Oe(b,28704,495,28728,2);Oe(b,28752,496,28776,2);Oe(b,28808,497,28816,2);Oe(b,28832,498,28848,2);Oe(b,28896,499,28848,2);Oe(b,28912,500,28848,2);Oe(b,28928,501,28848,2);Oe(b,28944,502,28848,2);Oe(b,28960,503,28848,2);i=d;return}function ef(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=13472;c[g+4>>2]=13489;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13496;c[f+8>>2]=13543;c[f+12>>2]=13496;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=13544;c[g+4>>2]=13562;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=13568;c[f+8>>2]=13635;c[f+12>>2]=13568;c[f+16>>2]=1;a[f+20|0]=0;f=Vd(f)|0;c[12]=b;Kc(b,g,f)|0;c[12]=e;Oe(b,13640,504,13672,2);Oe(b,13704,505,13736,2);Oe(b,13768,506,13800,2);Oe(b,13832,507,13864,2);Oe(b,13896,508,13928,2);Oe(b,13960,509,13992,2);Oe(b,14024,510,14056,2);Oe(b,14088,511,14120,2);Oe(b,14152,512,14184,2);Oe(b,14216,513,14248,2);Oe(b,14280,514,14312,2);Oe(b,14344,515,14376,2);Oe(b,14408,516,14440,2);Oe(b,14472,517,14504,2);Oe(b,14536,518,14568,2);Oe(b,14600,519,14632,2);Oe(b,14664,520,14696,2);Oe(b,14728,521,14760,2);Oe(b,14792,522,14824,2);Oe(b,14856,523,14888,2);Oe(b,14920,524,14944,2);Oe(b,15008,525,14944,2);Oe(b,15032,526,14944,2);Oe(b,15056,527,14944,2);Oe(b,15080,528,14184,2);Oe(b,15104,529,14184,2);Oe(b,15128,530,15152,2);Oe(b,15192,531,15152,2);Oe(b,15216,532,15152,2);Oe(b,15240,533,15152,2);Oe(b,15264,534,15152,2);Oe(b,15288,535,15152,2);Oe(b,15312,536,15152,2);Oe(b,15336,537,15152,2);Oe(b,15360,538,15152,2);Oe(b,15384,539,15152,2);Oe(b,15408,540,15152,2);Oe(b,15432,541,15152,2);Oe(b,15456,542,15152,2);Oe(b,15480,543,14944,2);i=d;return}function ff(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=11440;c[g+4>>2]=11457;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=11464;c[f+8>>2]=11511;c[f+12>>2]=11464;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=11512;c[g+4>>2]=11530;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=11536;c[f+8>>2]=11603;c[f+12>>2]=11536;c[f+16>>2]=1;a[f+20|0]=0;f=Vd(f)|0;c[12]=b;Kc(b,g,f)|0;c[12]=e;Oe(b,11608,544,11640,2);Oe(b,11672,545,11704,2);Oe(b,11736,546,11768,2);Oe(b,11800,547,11832,2);Oe(b,11864,548,11896,2);Oe(b,11928,549,11960,2);Oe(b,11992,550,12024,2);Oe(b,12056,551,12088,2);Oe(b,12120,552,12152,2);Oe(b,12184,553,12216,2);Oe(b,12248,554,12280,2);Oe(b,12312,555,12344,2);Oe(b,12376,556,12408,2);Oe(b,12440,557,12472,2);Oe(b,12504,558,12536,2);Oe(b,12568,559,12600,2);Oe(b,12632,560,12664,2);Oe(b,12696,561,12728,2);Oe(b,12760,562,12792,2);Oe(b,12824,563,12856,2);Oe(b,12888,564,12912,2);Oe(b,12976,565,12912,2);Oe(b,13e3,566,12912,2);Oe(b,13024,567,12912,2);Oe(b,13048,568,12216,2);Oe(b,13072,569,12216,2);Oe(b,13096,570,13120,2);Oe(b,13160,571,13120,2);Oe(b,13184,572,13120,2);Oe(b,13208,573,13120,2);Oe(b,13232,574,13120,2);Oe(b,13256,575,13120,2);Oe(b,13280,576,13120,2);Oe(b,13304,577,13120,2);Oe(b,13328,578,13120,2);Oe(b,13352,579,13120,2);Oe(b,13376,580,13120,2);Oe(b,13400,581,13120,2);Oe(b,13424,582,13120,2);Oe(b,13448,583,12912,2);i=d;return}function gf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;d=i;i=i+16|0;e=d;b=a+4|0;g=(c[b>>2]|0)+ -1|0;f=c[c[a+8>>2]>>2]|0;j=f+8|0;l=c[j>>2]|0;m=c[l+16>>2]|0;w=m&255;k=f+(w<<2)+16|0;if((w|0)==0){h=1}else{h=1;o=f+16|0;while(1){n=o+4|0;h=ba(c[o>>2]|0,h)|0;if(n>>>0<k>>>0){o=n}else{break}}}k=(g|0)>0;if(k){l=0;q=0;do{m=c[c[a+(l<<2)+12>>2]>>2]|0;o=m+8|0;a:do{if((c[(c[m+12>>2]|0)+16>>2]&2031616|0)==196608){p=m+16|0;n=0;while(1){w=c[(c[o>>2]|0)+16>>2]&255;s=m+(w<<2)+16|0;if((w|0)==0){t=1}else{t=1;u=p;while(1){r=u+4|0;t=ba(c[u>>2]|0,t)|0;if(r>>>0<s>>>0){u=r}else{break}}}if((n|0)>=(t|0)){break a}t=c[(Nd(m,n)|0)>>2]|0;w=c[(c[t+8>>2]|0)+16>>2]&255;r=t+(w<<2)+16|0;if((w|0)==0){s=1}else{s=1;u=t+16|0;while(1){t=u+4|0;s=ba(c[u>>2]|0,s)|0;if(t>>>0<r>>>0){u=t}else{break}}}n=n+1|0;q=s+q|0}}else{w=c[(c[o>>2]|0)+16>>2]&255;n=m+(w<<2)+16|0;if((w|0)==0){o=1}else{o=1;p=m+16|0;while(1){m=p+4|0;o=ba(c[p>>2]|0,o)|0;if(m>>>0<n>>>0){p=m}else{break}}}q=o+q|0}}while(0);l=l+1|0}while((l|0)!=(g|0));l=c[j>>2]|0;m=c[l+16>>2]|0}else{q=0}w=m&255;m=f+(w<<2)+16|0;if((w|0)==0){o=1}else{o=1;p=f+16|0;while(1){n=p+4|0;o=ba(c[p>>2]|0,o)|0;if(n>>>0<m>>>0){p=n}else{break}}}l=c[(dc[c[(c[l>>2]|0)+36>>2]&1023](l)|0)>>2]|0;if((!((c[(c[j>>2]|0)+16>>2]&255|0)!=1|(l|0)>-1)?!((l|0)!=-2147483648&(q|0)>(0-l|0)|(o|0)==(q|0)):0)?Md(f,ba(c[(c[f+12>>2]|0)+12>>2]|0,q)|0,o,q,1)|0:0){c[f+16>>2]=q}j=c[f+12>>2]|0;if((j|0)==0){c[e>>2]=33152;c[e+4>>2]=8906;c[e+8>>2]=856;$a(8,e|0)|0;jb(1)}r=c[f>>2]|0;if(r>>>0>(c[f+4>>2]|0)>>>0){c[e>>2]=33176;c[e+4>>2]=8906;c[e+8>>2]=858;$a(8,e|0)|0;jb(1)}if(!k){v=a+8|0;w=c[b>>2]|0;w=v+(w<<2)|0;i=d;return w|0}l=j+16|0;k=j+12|0;m=0;b:while(1){n=c[c[a+(m<<2)+12>>2]>>2]|0;p=c[n+12>>2]|0;c:do{if((c[p+16>>2]&2031616|0)==196608){p=n+8|0;o=n+16|0;q=0;while(1){w=c[(c[p>>2]|0)+16>>2]&255;t=n+(w<<2)+16|0;if((w|0)==0){u=1}else{u=1;v=o;while(1){s=v+4|0;u=ba(c[v>>2]|0,u)|0;if(s>>>0<t>>>0){v=s}else{break}}}if((q|0)>=(u|0)){break c}t=c[(Nd(n,q)|0)>>2]|0;if((t|0)==(f|0)){f=39;break b}w=c[(c[t+8>>2]|0)+16>>2]&255;u=t+(w<<2)+16|0;if((w|0)==0){s=1}else{s=1;w=t+16|0;while(1){v=w+4|0;s=ba(c[w>>2]|0,s)|0;if(v>>>0<u>>>0){w=v}else{break}}}if((c[t+12>>2]|0)==0){f=44;break b}u=c[t>>2]|0;if(u>>>0>(c[t+4>>2]|0)>>>0){f=46;break b}v=c[k>>2]|0;w=ba(v,s)|0;d:do{if((c[l>>2]&2097152|0)==0){t=u+w|0;if((w|0)>0){w=r;while(1){if(($b[c[(c[j>>2]|0)+52>>2]&63](j,u,w)|0)!=0){break d}u=u+v|0;if(!(u>>>0<t>>>0)){break}else{w=w+v|0}}}}else{au(r|0,u|0,w|0)|0}}while(0);q=q+1|0;r=r+s|0}}else{if((n|0)==(f|0)){if((m|0)!=0){f=68;break b}r=r+h|0;break}w=c[(c[n+8>>2]|0)+16>>2]&255;q=n+(w<<2)+16|0;if((w|0)==0){o=1}else{o=1;t=n+16|0;while(1){s=t+4|0;o=ba(c[t>>2]|0,o)|0;if(s>>>0<q>>>0){t=s}else{break}}}if((p|0)==0){f=58;break b}p=c[n>>2]|0;if(p>>>0>(c[n+4>>2]|0)>>>0){f=60;break b}n=c[k>>2]|0;s=ba(n,o)|0;e:do{if((c[l>>2]&2097152|0)==0){q=p+s|0;if((s|0)>0){s=r;while(1){if(($b[c[(c[j>>2]|0)+52>>2]&63](j,p,s)|0)!=0){break e}p=p+n|0;if(!(p>>>0<q>>>0)){break}else{s=s+n|0}}}}else{au(r|0,p|0,s|0)|0}}while(0);r=r+o|0}}while(0);m=m+1|0;if((m|0)>=(g|0)){f=71;break}}if((f|0)==39){c[e>>2]=7080;c[e+4>>2]=7119;c[e+8>>2]=333;$a(8,e|0)|0;jb(1)}else if((f|0)==44){c[e>>2]=33152;c[e+4>>2]=8906;c[e+8>>2]=856;$a(8,e|0)|0;jb(1)}else if((f|0)==46){c[e>>2]=33176;c[e+4>>2]=8906;c[e+8>>2]=858;$a(8,e|0)|0;jb(1)}else if((f|0)==58){c[e>>2]=33152;c[e+4>>2]=8906;c[e+8>>2]=856;$a(8,e|0)|0;jb(1)}else if((f|0)==60){c[e>>2]=33176;c[e+4>>2]=8906;c[e+8>>2]=858;$a(8,e|0)|0;jb(1)}else if((f|0)==68){c[e>>2]=7136;c[e+4>>2]=7119;c[e+8>>2]=343;$a(8,e|0)|0;jb(1)}else if((f|0)==71){v=a+8|0;w=c[b>>2]|0;w=v+(w<<2)|0;i=d;return w|0}return 0}function hf(a){a=a|0;var b=0;b=i;Oe(a,10544,584,10568,2);Oe(a,10640,585,10664,2);Oe(a,10768,586,10792,2);Oe(a,10864,587,10880,2);Oe(a,10912,588,10880,2);Oe(a,10928,589,10952,2);Oe(a,10992,590,11016,2);Oe(a,11064,591,11016,2);Oe(a,11088,592,11016,2);i=b;return}function jf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+16|0;l=f+8|0;e=f;d=b+12|0;if((c[d>>2]|0)!=2){n=0;i=f;return n|0}j=c[b+416>>2]|0;h=c[b+420>>2]|0;m=l+4|0;c[m>>2]=0;c[l>>2]=0;n=c[b+3292>>2]|0;cc[c[(c[n>>2]|0)+28>>2]&63](n,l);if(!(Xc(j,h,1)|0)?!(Xc(h,j,1)|0):0){Xd(c[b+4>>2]|0,2,0,7272,0);n=0;i=f;return n|0}h=c[b+16>>2]|0;k=c[b+20>>2]|0;n=c[m>>2]|0;m=6768;l=c[l>>2]|0;while(1){if(!(l>>>0<n>>>0)){l=7;break}if((a[l]|0)==(a[m]|0)){m=m+1|0;l=l+1|0}else{l=17;break}}a:do{if((l|0)==7){if((a[m]|0)==0){j=c[j+12>>2]|0;b:do{if(((h>>>0)%(j>>>0)|0|0)==0?((k>>>0)%(j>>>0)|0|0)==0:0){switch(j|0){case 8:{h=7200;j=0;break a};case 16:{h=7208;j=0;break a};case 4:{h=7192;j=0;break a};case 1:{h=7176;j=0;break a};case 32:{h=7216;j=0;break a};case 2:{h=7184;j=0;break a};default:{break b}}}}while(0);h=7224}else{l=17}}}while(0);c:do{if((l|0)==17){l=c[j+16>>2]|0;if((l&2097152|0)==0){if((l&2031616|0)==196608){h=7232;j=0;break}h=7248;break}j=c[j+12>>2]|0;d:do{if(((h>>>0)%(j>>>0)|0|0)==0?((k>>>0)%(j>>>0)|0|0)==0:0){switch(j|0){case 4:{h=7192;j=0;break c};case 2:{h=7184;j=0;break c};case 1:{h=7176;j=0;break c};case 16:{h=7208;j=0;break c};case 32:{h=7216;j=0;break c};case 8:{h=7200;j=0;break c};default:{break d}}}}while(0);h=7224}}while(0);n=h+(Xt(h|0)|0)|0;c[e>>2]=h;c[e+4>>2]=n;if((j|0)!=0?(c[b+(c[d>>2]<<2)+416>>2]=0,g=c[d>>2]|0,c[d>>2]=g+1,c[b+(g<<2)+16>>2]=j,g=c[b+3304>>2]|0,(g|0)!=0):0){c[g>>2]=(c[g>>2]|0)+1}_e(b,e,0)|0;n=we(b)|0;i=f;return n|0}function kf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+288|0;n=f+280|0;l=f+272|0;p=f+8|0;h=f;o=n+4|0;c[o>>2]=0;c[n>>2]=0;g=c[b+3292>>2]|0;cc[c[(c[g>>2]|0)+28>>2]&63](g,n);g=(e|0)==0;m=l+4|0;q=p+256|0;k=p+255|0;j=h+4|0;while(1){a:do{if(g){t=0}else{r=(d|0)==0;s=e;do{c[m>>2]=0;c[l>>2]=0;if(r){t=0;u=0}else{cc[c[(c[d>>2]|0)+28>>2]&63](d,l);t=c[l>>2]|0;u=c[m>>2]|0}u=u-t|0;u=(u|0)<255?u:255;c[q>>2]=p+u;$t(p|0,t|0,u|0)|0;a[c[q>>2]|0]=0;t=c[q>>2]|0;u=c[n>>2]|0;v=t+((c[o>>2]|0)-u)|0;v=v>>>0>k>>>0?k:v;$t(t|0,u|0,v-t|0)|0;c[q>>2]=v;a[v]=0;cc[c[(c[s>>2]|0)+28>>2]&63](s,l);v=c[m>>2]|0;u=c[l>>2]|0;if((v|0)==(u|0)){t=0;break a}t=c[q>>2]|0;v=t+(v-u)|0;v=v>>>0>k>>>0?k:v;$t(t|0,u|0,v-t|0)|0;c[q>>2]=v;a[v]=0;v=c[q>>2]|0;c[h>>2]=p;c[j>>2]=v;if((_e(b,h,1)|0)==0){t=0}else{t=we(b)|0}s=dc[c[(c[s>>2]|0)+12>>2]&1023](s)|0}while(!((t|0)!=0|(s|0)==0))}}while(0);if((d|0)==0){g=12;break}d=dc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;if(!((d|0)!=0&(t|0)==0)){g=12;break}}if((g|0)==12){i=f;return t|0}return 0}function lf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+6960|0;e=d;y=d+272|0;q=d+296|0;t=d+288|0;f=d+304|0;o=d+12|0;n=d+280|0;r=d+3616|0;w=d+3624|0;m=d+3632|0;p=d+6944|0;k=c[b+416>>2]|0;j=c[b+420>>2]|0;h=c[b+424>>2]|0;x=y+4|0;c[x>>2]=0;c[y>>2]=0;v=b+3292|0;l=c[v>>2]|0;cc[c[(c[l>>2]|0)+28>>2]&63](l,y);l=k+16|0;g=c[l>>2]&2031616;if((g|0)==65536){u=5}else if((g|0)==196608?(c[j+16>>2]&2031616|0)==196608:0){if((c[h+16>>2]&2031616|0)==196608){if((g|0)==65536){u=5}else{u=7}}else{s=k;g=1}}else{u=7}if((u|0)==5){if((c[j+16>>2]&2031616|0)==65536?(c[h+16>>2]&2031616|0)!=65536:0){s=k;g=1}else{u=7}}if((u|0)==7){s=(c[h+16>>2]&2031616|0)==393216?k:h;g=0}y=c[y>>2]|0;x=c[x>>2]|0;z=7288;u=y;while(1){if(!(u>>>0<x>>>0)){u=11;break}if((a[u]|0)==(a[z]|0)){z=z+1|0;u=u+1|0}else{z=7296;u=12;break}}if((u|0)==11){if((a[z]|0)==0){u=15}else{z=7296;u=12}}a:do{if((u|0)==12){while(1){u=0;if(!(y>>>0<x>>>0)){break}if((a[y]|0)==(a[z]|0)){z=z+1|0;y=y+1|0;u=12}else{break a}}if((a[z]|0)==0){u=15}}}while(0);if((u|0)==15){s=k}x=kf(b,0,s)|0;if((x|0)!=0){D=x;i=d;return D|0}x=(c[s+16>>2]|0)>>>16&31;if((x|0)==1){y=r+4|0;c[y>>2]=0;c[r>>2]=0;t=c[v>>2]|0;cc[c[(c[t>>2]|0)+28>>2]&63](t,r);c[w>>2]=7448;c[w+4>>2]=7463;_e(b,w,0)|0;t=b+12|0;c[b+(c[t>>2]<<2)+416>>2]=0;n=c[t>>2]|0;c[t>>2]=n+1;c[b+(n<<2)+16>>2]=0;n=b+3304|0;o=c[n>>2]|0;if((o|0)!=0){c[o>>2]=(c[o>>2]|0)+1}A=c[t>>2]|0;c[b+(A<<2)+416>>2]=0;o=c[t>>2]|0;c[t>>2]=o+1;c[b+(o<<2)+16>>2]=0;o=c[n>>2]|0;if((o|0)!=0){c[o>>2]=(c[o>>2]|0)+1}o=c[t>>2]|0;q=o+ -1|0;c[b+(o<<2)+416>>2]=0;D=c[t>>2]|0;c[t>>2]=D+1;c[b+(D<<2)+16>>2]=0;n=c[n>>2]|0;if((n|0)!=0){c[n>>2]=(c[n>>2]|0)+1}n=we(b)|0;c[m+3264>>2]=0;c[m+3260>>2]=0;D=c[b+3232>>2]|0;t=b+8|0;C=c[t>>2]|0;B=c[b+4>>2]|0;z=m+3236|0;c[z>>2]=0;v=m+3240|0;c[v>>2]=0;u=m+3244|0;c[u>>2]=0;x=m+12|0;c[x>>2]=0;c[m+1216>>2]=0;c[m+2420>>2]=0;w=m+3304|0;c[w>>2]=0;c[m+3232>>2]=D;D=c[D+8>>2]|0;c[m+3228>>2]=D;c[m+4>>2]=B;c[m+8>>2]=C;a[m+3308|0]=0;C=c[D+4>>2]|0;c[m+3276>>2]=C;c[m+3272>>2]=c[C>>2];c[m+3268>>2]=c[C+12>>2];D=c[D+8>>2]|0;c[m+3288>>2]=D;c[m+3284>>2]=c[D>>2];c[m+3280>>2]=c[D+12>>2];c[m+2424>>2]=0;c[m+3300>>2]=-1;bu(m+2428|0,0,800)|0;bu(m+1220|0,0,1200)|0;if((A|0)>0){A=n+4+(A+ -1<<2)|0}else{A=0}c[z>>2]=A;if((dc[c[(c[s>>2]|0)+16>>2]&1023](s)|0)>0){B=j+16|0;A=h+16|0;C=0;do{re(m,r)|0;if((c[l>>2]&2031616|0)==65536){D=hc[c[(c[k>>2]|0)+24>>2]&63](k,C)|0;E=dc[c[(c[D>>2]|0)+40>>2]&1023](D)|0;c[m+(c[x>>2]<<2)+416>>2]=D;D=c[x>>2]|0;c[x>>2]=D+1;c[m+(D<<2)+16>>2]=E;D=c[w>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}else{c[m+(c[x>>2]<<2)+416>>2]=k;D=c[x>>2]|0;c[x>>2]=D+1;c[m+(D<<2)+16>>2]=0;D=c[w>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}if((c[B>>2]&2031616|0)==65536){D=hc[c[(c[j>>2]|0)+24>>2]&63](j,C)|0;E=dc[c[(c[D>>2]|0)+40>>2]&1023](D)|0;c[m+(c[x>>2]<<2)+416>>2]=D;D=c[x>>2]|0;c[x>>2]=D+1;c[m+(D<<2)+16>>2]=E;D=c[w>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}else{c[m+(c[x>>2]<<2)+416>>2]=j;D=c[x>>2]|0;c[x>>2]=D+1;c[m+(D<<2)+16>>2]=0;D=c[w>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}if((c[A>>2]&2031616|0)==65536){D=hc[c[(c[h>>2]|0)+24>>2]&63](h,C)|0;E=dc[c[(c[D>>2]|0)+40>>2]&1023](D)|0;c[m+(c[x>>2]<<2)+416>>2]=D;D=c[x>>2]|0;c[x>>2]=D+1;c[m+(D<<2)+16>>2]=E;D=c[w>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}else{c[m+(c[x>>2]<<2)+416>>2]=h;D=c[x>>2]|0;c[x>>2]=D+1;c[m+(D<<2)+16>>2]=0;D=c[w>>2]|0;if((D|0)!=0){c[D>>2]=(c[D>>2]|0)+1}}we(m)|0;C=C+1|0}while((C|0)<(dc[c[(c[s>>2]|0)+16>>2]&1023](s)|0))}c[e>>2]=6920;c[e+4>>2]=6928;re(m,e)|0;we(m)|0;j=b+3240|0;c[j>>2]=(c[j>>2]|0)+(c[v>>2]|0);h=b+3244|0;c[h>>2]=(c[h>>2]|0)+(c[u>>2]|0);if(g){k=c[r>>2]|0;g=(c[y>>2]|0)-k|0;l=(g|0)<255?g:255;g=f+256|0;c[g>>2]=f+l;$t(f|0,k|0,l|0)|0;a[c[g>>2]|0]=0;k=c[g>>2]|0;l=k+11|0;r=f+255|0;E=l>>>0>r>>>0?r:l;$t(k|0,7432,E-k|0)|0;c[g>>2]=E;a[E]=0;E=f+(Xt(f|0)|0)|0;c[p>>2]=f;c[p+4>>2]=E;if((o|0)>0){f=n+4+(q<<2)|0}else{f=0}c[z>>2]=f;re(m,p)|0;if((n|0)==1){f=0}else{f=c[n+16>>2]|0}c[m+(c[x>>2]<<2)+416>>2]=0;E=c[x>>2]|0;c[x>>2]=E+1;c[m+(E<<2)+16>>2]=f;f=c[w>>2]|0;if((f|0)!=0){c[f>>2]=(c[f>>2]|0)+1}we(m)|0;c[e>>2]=6920;c[e+4>>2]=6928;re(m,e)|0;we(m)|0;c[j>>2]=(c[j>>2]|0)+(c[v>>2]|0);c[h>>2]=(c[h>>2]|0)+(c[u>>2]|0)}if((c[(c[t>>2]|0)+4>>2]|0)==0){E=n;i=d;return E|0}b=b+3236|0;if((c[b>>2]|0)!=0){c[e>>2]=5928;c[e+4>>2]=5759;c[e+8>>2]=251;$a(8,e|0)|0;jb(1)}c[b>>2]=n+24;E=n;i=d;return E|0}else if((x|0)==3){m=q+4|0;c[m>>2]=0;c[q>>2]=0;p=c[v>>2]|0;cc[c[(c[p>>2]|0)+28>>2]&63](p,q);p=(c[l>>2]&2031616|0)==196608;do{if(p?(c[j+16>>2]&2031616|0)==196608:0){r=c[m>>2]|0;s=7288;p=c[q>>2]|0;while(1){if(!(p>>>0<r>>>0)){u=23;break}if((a[p]|0)==(a[s]|0)){s=s+1|0;p=p+1|0}else{break}}if((u|0)==23?(a[s]|0)==0:0){p=7304;break}p=g?7328:7360}else{u=25}}while(0);if((u|0)==25){p=p?7384:7408}s=p+(Xt(p|0)|0)|0;c[t>>2]=p;c[t+4>>2]=s;_e(b,t,0)|0;s=b+12|0;c[b+(c[s>>2]<<2)+416>>2]=0;p=c[s>>2]|0;c[s>>2]=p+1;c[b+(p<<2)+16>>2]=0;p=b+3304|0;r=c[p>>2]|0;if((r|0)!=0){c[r>>2]=(c[r>>2]|0)+1}z=c[s>>2]|0;c[b+(z<<2)+416>>2]=0;r=c[s>>2]|0;c[s>>2]=r+1;c[b+(r<<2)+16>>2]=0;r=c[p>>2]|0;if((r|0)!=0){c[r>>2]=(c[r>>2]|0)+1}v=c[s>>2]|0;r=v+ -1|0;c[b+(v<<2)+416>>2]=0;E=c[s>>2]|0;c[s>>2]=E+1;c[b+(E<<2)+16>>2]=0;p=c[p>>2]|0;if((p|0)!=0){c[p>>2]=(c[p>>2]|0)+1}p=we(b)|0;c[f+3264>>2]=0;c[f+3260>>2]=0;E=c[b+3232>>2]|0;t=b+8|0;D=c[t>>2]|0;C=c[b+4>>2]|0;y=f+3236|0;c[y>>2]=0;u=f+3240|0;c[u>>2]=0;s=f+3244|0;c[s>>2]=0;x=f+12|0;c[x>>2]=0;c[f+1216>>2]=0;c[f+2420>>2]=0;w=f+3304|0;c[w>>2]=0;c[f+3232>>2]=E;E=c[E+8>>2]|0;c[f+3228>>2]=E;c[f+4>>2]=C;c[f+8>>2]=D;a[f+3308|0]=0;D=c[E+4>>2]|0;c[f+3276>>2]=D;c[f+3272>>2]=c[D>>2];c[f+3268>>2]=c[D+12>>2];E=c[E+8>>2]|0;c[f+3288>>2]=E;c[f+3284>>2]=c[E>>2];c[f+3280>>2]=c[E+12>>2];c[f+2424>>2]=0;c[f+3300>>2]=-1;bu(f+2428|0,0,800)|0;bu(f+1220|0,0,1200)|0;if((z|0)>0){z=p+4+(z+ -1<<2)|0}else{z=0}c[y>>2]=z;re(f,q)|0;if((c[l>>2]&2031616|0)==196608){k=hc[c[(c[k>>2]|0)+24>>2]&63](k,0)|0}c[f+(c[x>>2]<<2)+416>>2]=k;k=c[x>>2]|0;c[x>>2]=k+1;c[f+(k<<2)+16>>2]=0;k=c[w>>2]|0;if((k|0)!=0){c[k>>2]=(c[k>>2]|0)+1}if((c[j+16>>2]&2031616|0)==196608){j=hc[c[(c[j>>2]|0)+24>>2]&63](j,0)|0}c[f+(c[x>>2]<<2)+416>>2]=j;j=c[x>>2]|0;c[x>>2]=j+1;c[f+(j<<2)+16>>2]=0;j=c[w>>2]|0;if((j|0)!=0){c[j>>2]=(c[j>>2]|0)+1}if((c[h+16>>2]&2031616|0)==196608){h=hc[c[(c[h>>2]|0)+24>>2]&63](h,0)|0}c[f+(c[x>>2]<<2)+416>>2]=h;h=c[x>>2]|0;c[x>>2]=h+1;c[f+(h<<2)+16>>2]=0;h=c[w>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}we(f)|0;c[e>>2]=6920;c[e+4>>2]=6928;re(f,e)|0;we(f)|0;j=b+3240|0;c[j>>2]=(c[j>>2]|0)+(c[u>>2]|0);h=b+3244|0;c[h>>2]=(c[h>>2]|0)+(c[s>>2]|0);if(g){k=c[q>>2]|0;g=(c[m>>2]|0)-k|0;m=(g|0)<255?g:255;g=o+256|0;c[g>>2]=o+m;$t(o|0,k|0,m|0)|0;a[c[g>>2]|0]=0;m=c[g>>2]|0;k=m+11|0;l=o+255|0;E=k>>>0>l>>>0?l:k;$t(m|0,7432,E-m|0)|0;c[g>>2]=E;a[E]=0;E=o+(Xt(o|0)|0)|0;c[n>>2]=o;c[n+4>>2]=E;if((v|0)>0){g=p+4+(r<<2)|0}else{g=0}c[y>>2]=g;re(f,n)|0;if((p|0)==1){g=0}else{g=c[p+16>>2]|0}c[f+(c[x>>2]<<2)+416>>2]=0;E=c[x>>2]|0;c[x>>2]=E+1;c[f+(E<<2)+16>>2]=g;g=c[w>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}we(f)|0;c[e>>2]=6920;c[e+4>>2]=6928;re(f,e)|0;we(f)|0;c[j>>2]=(c[j>>2]|0)+(c[u>>2]|0);c[h>>2]=(c[h>>2]|0)+(c[s>>2]|0)}if((c[(c[t>>2]|0)+4>>2]|0)==0){E=p;i=d;return E|0}b=b+3236|0;if((c[b>>2]|0)!=0){c[e>>2]=5928;c[e+4>>2]=5759;c[e+8>>2]=251;$a(8,e|0)|0;jb(1)}c[b>>2]=p+24;E=p;i=d;return E|0}else{E=0;i=d;return E|0}return 0}function mf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+6688|0;e=d;h=d+3328|0;s=d+3352|0;p=d+3344|0;n=d+3360|0;k=d+16|0;m=d+3336|0;j=d+3368|0;g=c[b+416>>2]|0;f=c[b+420>>2]|0;l=h+4|0;c[l>>2]=0;c[h>>2]=0;q=c[b+3292>>2]|0;cc[c[(c[q>>2]|0)+28>>2]&63](q,h);q=c[l>>2]|0;r=7464;t=c[h>>2]|0;while(1){if(!(t>>>0<q>>>0)){o=4;break}if((a[t]|0)==(a[r]|0)){r=r+1|0;t=t+1|0}else{p=0;q=g;break}}if((o|0)==4){if((a[r]|0)==0){u=s+4|0;c[u>>2]=0;c[s>>2]=0;cc[c[(c[f>>2]|0)+28>>2]&63](f,s);if(((c[u>>2]|0)-(c[s>>2]|0)|0)>0?Wc(g,f)|0:0){c[p>>2]=6752;c[p+4>>2]=6756;_e(b,p,0)|0;u=we(b)|0;i=d;return u|0}else{p=g;q=f}}else{p=0;q=g}}o=kf(b,p,q)|0;if((o|0)!=0){u=o;i=d;return u|0}o=(c[f+16>>2]|0)>>>16&31;if((o|0)==1){c[m>>2]=7488;c[m+4>>2]=7502;_e(b,m,0)|0;k=b+12|0;c[b+(c[k>>2]<<2)+416>>2]=0;l=c[k>>2]|0;c[k>>2]=l+1;c[b+(l<<2)+16>>2]=0;l=c[b+3304>>2]|0;if((l|0)!=0){c[l>>2]=(c[l>>2]|0)+1}r=c[k>>2]|0;k=we(b)|0;c[j+3264>>2]=0;c[j+3260>>2]=0;u=c[b+3232>>2]|0;n=b+8|0;t=c[n>>2]|0;s=c[b+4>>2]|0;q=j+3236|0;c[q>>2]=0;p=j+3240|0;c[p>>2]=0;o=j+3244|0;c[o>>2]=0;m=j+12|0;c[m>>2]=0;c[j+1216>>2]=0;c[j+2420>>2]=0;l=j+3304|0;c[l>>2]=0;c[j+3232>>2]=u;u=c[u+8>>2]|0;c[j+3228>>2]=u;c[j+4>>2]=s;c[j+8>>2]=t;a[j+3308|0]=0;t=c[u+4>>2]|0;c[j+3276>>2]=t;c[j+3272>>2]=c[t>>2];c[j+3268>>2]=c[t+12>>2];u=c[u+8>>2]|0;c[j+3288>>2]=u;c[j+3284>>2]=c[u>>2];c[j+3280>>2]=c[u+12>>2];c[j+2424>>2]=0;c[j+3300>>2]=-1;bu(j+2428|0,0,800)|0;bu(j+1220|0,0,1200)|0;if((r|0)>0){r=k+4+(r+ -1<<2)|0}else{r=0}c[q>>2]=r;if((dc[c[(c[f>>2]|0)+16>>2]&1023](f)|0)>0){r=g+16|0;q=0;do{re(j,h)|0;s=hc[c[(c[f>>2]|0)+24>>2]&63](f,q)|0;if((c[r>>2]&2031616|0)==65536){t=hc[c[(c[g>>2]|0)+24>>2]&63](g,q)|0;u=dc[c[(c[t>>2]|0)+40>>2]&1023](t)|0}else{u=0;t=g}c[j+(c[m>>2]<<2)+416>>2]=t;t=c[m>>2]|0;c[m>>2]=t+1;c[j+(t<<2)+16>>2]=u;t=c[l>>2]|0;if((t|0)!=0){c[t>>2]=(c[t>>2]|0)+1}u=dc[c[(c[s>>2]|0)+40>>2]&1023](s)|0;c[j+(c[m>>2]<<2)+416>>2]=s;s=c[m>>2]|0;c[m>>2]=s+1;c[j+(s<<2)+16>>2]=u;s=c[l>>2]|0;if((s|0)!=0){c[s>>2]=(c[s>>2]|0)+1}we(j)|0;q=q+1|0}while((q|0)<(dc[c[(c[f>>2]|0)+16>>2]&1023](f)|0))}c[e>>2]=6920;c[e+4>>2]=6928;re(j,e)|0;we(j)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[p>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[o>>2]|0);if((c[(c[n>>2]|0)+4>>2]|0)==0){u=k;i=d;return u|0}b=b+3236|0;if((c[b>>2]|0)!=0){c[e>>2]=5928;c[e+4>>2]=5759;c[e+8>>2]=251;$a(8,e|0)|0;jb(1)}c[b>>2]=k+12;u=k;i=d;return u|0}else if((o|0)==3){c[n>>2]=7472;c[n+4>>2]=7485;_e(b,n,0)|0;l=b+12|0;c[b+(c[l>>2]<<2)+416>>2]=0;j=c[l>>2]|0;c[l>>2]=j+1;c[b+(j<<2)+16>>2]=0;j=c[b+3304>>2]|0;if((j|0)!=0){c[j>>2]=(c[j>>2]|0)+1}r=c[l>>2]|0;j=we(b)|0;c[k+3264>>2]=0;c[k+3260>>2]=0;u=c[b+3232>>2]|0;n=b+8|0;t=c[n>>2]|0;s=c[b+4>>2]|0;q=k+3236|0;c[q>>2]=0;l=k+3240|0;c[l>>2]=0;m=k+3244|0;c[m>>2]=0;p=k+12|0;c[p>>2]=0;c[k+1216>>2]=0;c[k+2420>>2]=0;o=k+3304|0;c[o>>2]=0;c[k+3232>>2]=u;u=c[u+8>>2]|0;c[k+3228>>2]=u;c[k+4>>2]=s;c[k+8>>2]=t;a[k+3308|0]=0;t=c[u+4>>2]|0;c[k+3276>>2]=t;c[k+3272>>2]=c[t>>2];c[k+3268>>2]=c[t+12>>2];u=c[u+8>>2]|0;c[k+3288>>2]=u;c[k+3284>>2]=c[u>>2];c[k+3280>>2]=c[u+12>>2];c[k+2424>>2]=0;c[k+3300>>2]=-1;bu(k+2428|0,0,800)|0;bu(k+1220|0,0,1200)|0;if((r|0)>0){r=j+4+(r+ -1<<2)|0}else{r=0}c[q>>2]=r;re(k,h)|0;g=hc[c[(c[g>>2]|0)+24>>2]&63](g,0)|0;c[k+(c[p>>2]<<2)+416>>2]=g;g=c[p>>2]|0;c[p>>2]=g+1;c[k+(g<<2)+16>>2]=0;g=c[o>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}f=hc[c[(c[f>>2]|0)+24>>2]&63](f,0)|0;c[k+(c[p>>2]<<2)+416>>2]=f;f=c[p>>2]|0;c[p>>2]=f+1;c[k+(f<<2)+16>>2]=0;f=c[o>>2]|0;if((f|0)!=0){c[f>>2]=(c[f>>2]|0)+1}we(k)|0;c[e>>2]=6920;c[e+4>>2]=6928;re(k,e)|0;we(k)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[l>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[m>>2]|0);if((c[(c[n>>2]|0)+4>>2]|0)==0){u=j;i=d;return u|0}b=b+3236|0;if((c[b>>2]|0)!=0){c[e>>2]=5928;c[e+4>>2]=5759;c[e+8>>2]=251;$a(8,e|0)|0;jb(1)}c[b>>2]=j+12;u=j;i=d;return u|0}else{u=c[h>>2]|0;c[e>>2]=(c[l>>2]|0)-u;c[e+4>>2]=u;$a(7504,e|0)|0;u=0;i=d;return u|0}return 0}function nf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+3360|0;e=d;h=d+3344|0;j=d+3336|0;k=d+3328|0;f=d+16|0;c[h>>2]=7568;c[h+4>>2]=7589;_e(b,h,0)|0;h=c[b+420>>2]|0;if((c[(c[b+416>>2]|0)+16>>2]&2031616|0)!=196608){c[e>>2]=7592;c[e+4>>2]=7679;c[e+8>>2]=543;$a(8,e|0)|0;jb(1)}c[j>>2]=7704;c[j+4>>2]=7708;l=b+12|0;c[b+(c[l>>2]<<2)+416>>2]=0;g=c[l>>2]|0;c[l>>2]=g+1;c[b+(g<<2)+16>>2]=0;g=c[b+3304>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}q=c[l>>2]|0;g=we(b)|0;c[k>>2]=2112;c[k+4>>2]=2119;l=b+3232|0;k=Qc(c[c[c[(c[l>>2]|0)+8>>2]>>2]>>2]|0,k)|0;if((k|0)==0){k=0}else{k=c[k>>2]|0}c[f+3264>>2]=0;c[f+3260>>2]=0;s=c[l>>2]|0;n=b+8|0;t=c[n>>2]|0;u=c[b+4>>2]|0;r=f+3236|0;c[r>>2]=0;l=f+3240|0;c[l>>2]=0;m=f+3244|0;c[m>>2]=0;p=f+12|0;c[p>>2]=0;c[f+1216>>2]=0;c[f+2420>>2]=0;o=f+3304|0;c[o>>2]=0;c[f+3232>>2]=s;s=c[s+8>>2]|0;c[f+3228>>2]=s;c[f+4>>2]=u;c[f+8>>2]=t;a[f+3308|0]=0;t=c[s+4>>2]|0;c[f+3276>>2]=t;c[f+3272>>2]=c[t>>2];c[f+3268>>2]=c[t+12>>2];s=c[s+8>>2]|0;c[f+3288>>2]=s;c[f+3284>>2]=c[s>>2];c[f+3280>>2]=c[s+12>>2];c[f+2424>>2]=0;c[f+3300>>2]=-1;bu(f+2428|0,0,800)|0;bu(f+1220|0,0,1200)|0;if((q|0)>0){q=g+4+(q+ -1<<2)|0}else{q=0}c[r>>2]=q;re(f,j)|0;c[f+(c[p>>2]<<2)+416>>2]=h;j=c[p>>2]|0;c[p>>2]=j+1;c[f+(j<<2)+16>>2]=0;j=c[o>>2]|0;if((j|0)!=0){c[j>>2]=(c[j>>2]|0)+1}u=c[b+20>>2]|0;c[f+(c[p>>2]<<2)+416>>2]=h;h=c[p>>2]|0;c[p>>2]=h+1;c[f+(h<<2)+16>>2]=u;h=c[o>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}c[f+(c[p>>2]<<2)+416>>2]=k;h=c[p>>2]|0;c[p>>2]=h+1;c[f+(h<<2)+16>>2]=0;h=c[o>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}we(f)|0;c[e>>2]=6920;c[e+4>>2]=6928;re(f,e)|0;we(f)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[l>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[m>>2]|0);if((c[(c[n>>2]|0)+4>>2]|0)==0){i=d;return g|0}b=b+3236|0;if((c[b>>2]|0)!=0){c[e>>2]=5928;c[e+4>>2]=5759;c[e+8>>2]=251;$a(8,e|0)|0;jb(1)}c[b>>2]=g+20;i=d;return g|0}function of(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+3360|0;e=d;p=d+3344|0;j=d+3336|0;m=d+3328|0;f=d+16|0;h=c[b+416>>2]|0;g=c[b+420>>2]|0;l=p+4|0;c[l>>2]=0;c[p>>2]=0;q=c[b+3292>>2]|0;cc[c[(c[q>>2]|0)+28>>2]&63](q,p);p=c[p>>2]|0;l=c[l>>2]|0;q=7712;o=p;while(1){if(!(o>>>0<l>>>0)){o=4;break}if((a[o]|0)==(a[q]|0)){q=q+1|0;o=o+1|0}else{q=7736;r=p;o=5;break}}if((o|0)==4){if((a[q]|0)==0){k=0;n=7728}else{q=7736;r=p;o=5}}do{if((o|0)==5){while(1){o=0;if(!(r>>>0<l>>>0)){o=7;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0;o=5}else{r=7768;q=p;break}}if((o|0)==7){if((a[q]|0)==0){k=1;n=7760;break}else{r=7768;q=p}}while(1){if(!(q>>>0<l>>>0)){o=10;break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0}else{q=7792;break}}if((o|0)==10){if((a[r]|0)==0){k=1;n=7784;break}else{q=7792}}while(1){if(!(p>>>0<l>>>0)){break}if((a[p]|0)==(a[q]|0)){q=q+1|0;p=p+1|0}else{o=14;break}}if((o|0)==14){c[e>>2]=1048;r=e+4|0;c[r>>2]=7679;r=e+8|0;c[r>>2]=640;$a(8,e|0)|0;jb(1)}if((a[q]|0)==0){k=0;n=7808}else{c[e>>2]=1048;r=e+4|0;c[r>>2]=7679;r=e+8|0;c[r>>2]=640;$a(8,e|0)|0;jb(1)}}}while(0);l=n+(Xt(n|0)|0)|0;c[j>>2]=n;c[j+4>>2]=l;c[m>>2]=7816;c[m+4>>2]=7832;_e(b,m,0)|0;l=b+12|0;c[b+(c[l>>2]<<2)+416>>2]=0;m=c[l>>2]|0;c[l>>2]=m+1;c[b+(m<<2)+16>>2]=k;k=b+3304|0;m=c[k>>2]|0;if((m|0)!=0){c[m>>2]=(c[m>>2]|0)+1}c[b+(c[l>>2]<<2)+416>>2]=0;r=c[l>>2]|0;c[l>>2]=r+1;c[b+(r<<2)+16>>2]=0;k=c[k>>2]|0;if((k|0)!=0){c[k>>2]=(c[k>>2]|0)+1}r=c[l>>2]|0;k=we(b)|0;c[f+3264>>2]=0;c[f+3260>>2]=0;s=c[b+3232>>2]|0;n=b+8|0;t=c[n>>2]|0;u=c[b+4>>2]|0;q=f+3236|0;c[q>>2]=0;l=f+3240|0;c[l>>2]=0;m=f+3244|0;c[m>>2]=0;o=f+12|0;c[o>>2]=0;c[f+1216>>2]=0;c[f+2420>>2]=0;p=f+3304|0;c[p>>2]=0;c[f+3232>>2]=s;s=c[s+8>>2]|0;c[f+3228>>2]=s;c[f+4>>2]=u;c[f+8>>2]=t;a[f+3308|0]=0;t=c[s+4>>2]|0;c[f+3276>>2]=t;c[f+3272>>2]=c[t>>2];c[f+3268>>2]=c[t+12>>2];s=c[s+8>>2]|0;c[f+3288>>2]=s;c[f+3284>>2]=c[s>>2];c[f+3280>>2]=c[s+12>>2];c[f+2424>>2]=0;c[f+3300>>2]=-1;bu(f+2428|0,0,800)|0;bu(f+1220|0,0,1200)|0;if((r|0)>0){r=k+4+(r+ -1<<2)|0}else{r=0}c[q>>2]=r;re(f,j)|0;h=hc[c[(c[h>>2]|0)+24>>2]&63](h,0)|0;c[f+(c[o>>2]<<2)+416>>2]=h;h=c[o>>2]|0;c[o>>2]=h+1;c[f+(h<<2)+16>>2]=0;h=c[p>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}j=c[b+20>>2]|0;c[f+(c[o>>2]<<2)+416>>2]=g;h=c[o>>2]|0;c[o>>2]=h+1;c[f+(h<<2)+16>>2]=j;h=c[p>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}c[f+(c[o>>2]<<2)+416>>2]=g;g=c[o>>2]|0;c[o>>2]=g+1;c[f+(g<<2)+16>>2]=j;g=c[p>>2]|0;if((g|0)!=0){c[g>>2]=(c[g>>2]|0)+1}we(f)|0;c[e>>2]=6920;c[e+4>>2]=6928;re(f,e)|0;we(f)|0;u=b+3240|0;c[u>>2]=(c[u>>2]|0)+(c[l>>2]|0);u=b+3244|0;c[u>>2]=(c[u>>2]|0)+(c[m>>2]|0);if((c[(c[n>>2]|0)+4>>2]|0)==0){i=d;return k|0}b=b+3236|0;if((c[b>>2]|0)!=0){c[e>>2]=5928;c[e+4>>2]=5759;c[e+8>>2]=251;$a(8,e|0)|0;jb(1)}c[b>>2]=k+16;i=d;return k|0}function pf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+32|0;b=d;e=d+16|0;c[e>>2]=7840;c[e+4>>2]=7864;_e(a,e,0)|0;e=a+12|0;h=c[e>>2]|0;f=c[a+420>>2]|0;if((h|0)<=2){k=we(a)|0;i=d;return k|0}g=a+3304|0;j=2;while(1){k=a+(j<<2)+416|0;if(Wc(f,c[k>>2]|0)|0){l=c[a+(j<<2)+16>>2]|0;c[a+(c[e>>2]<<2)+416>>2]=0;k=c[e>>2]|0;c[e>>2]=k+1;c[a+(k<<2)+16>>2]=l;k=c[g>>2]|0;if((k|0)!=0){c[k>>2]=(c[k>>2]|0)+1}}else{l=hc[c[(c[f>>2]|0)+24>>2]&63](f,0)|0;if(!(Wc(l,c[k>>2]|0)|0)){e=9;break}c[a+(c[e>>2]<<2)+416>>2]=0;k=c[e>>2]|0;c[e>>2]=k+1;c[a+(k<<2)+16>>2]=0;k=c[g>>2]|0;if((k|0)!=0){c[k>>2]=(c[k>>2]|0)+1}}j=j+1|0;if((j|0)>=(h|0)){e=11;break}}if((e|0)==9){c[b>>2]=1048;c[b+4>>2]=7679;c[b+8>>2]=732;$a(8,b|0)|0;jb(1)}else if((e|0)==11){l=we(a)|0;i=d;return l|0}return 0}function qf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+16|0;g=e;d=a+4|0;m=(c[d>>2]|0)+ -1|0;h=(m|0)/2|0;f=c[c[a+8>>2]>>2]|0;b=f+8|0;v=c[(c[b>>2]|0)+16>>2]&255;o=f+(v<<2)+16|0;if((v|0)==0){n=1}else{n=1;q=f+16|0;while(1){p=q+4|0;n=ba(c[q>>2]|0,n)|0;if(p>>>0<o>>>0){q=p}else{break}}}o=(m|0)>1;if(o){m=0;p=0;do{if((c[a+(m+h<<2)+12>>2]|0)!=0?(l=c[c[a+(m<<2)+12>>2]>>2]|0,v=c[(c[l+8>>2]|0)+16>>2]&255,k=l+(v<<2)+16|0,(v|0)!=0):0){r=1;s=l+16|0;while(1){q=s+4|0;r=ba(c[s>>2]|0,r)|0;if(q>>>0<k>>>0){s=q}else{break}}}else{r=1}p=r+p|0;m=m+1|0}while((m|0)<(h|0))}else{p=0}if(!(Nc(f,p)|0)){u=a+8|0;v=c[d>>2]|0;v=u+(v<<2)|0;i=e;return v|0}m=c[f+12>>2]|0;if((m|0)==0){c[g>>2]=33152;c[g+4>>2]=8906;c[g+8>>2]=856;$a(8,g|0)|0;jb(1)}p=c[f>>2]|0;l=m+12|0;if(p>>>0>(c[f+4>>2]|0)>>>0){c[g>>2]=33176;c[g+4>>2]=8906;c[g+8>>2]=858;$a(8,g|0)|0;jb(1)}k=c[l>>2]|0;if(!o){u=a+8|0;v=c[d>>2]|0;v=u+(v<<2)|0;i=e;return v|0}o=ba(k,n)|0;n=m+16|0;q=0;a:while(1){do{if((c[a+(q+h<<2)+12>>2]|0)==0){r=k;v=$b[c[(c[m>>2]|0)+52>>2]&63](m,c[a+(q<<2)+12>>2]|0,p)|0;j=36}else{r=c[c[a+(q<<2)+12>>2]>>2]|0;if((r|0)==(f|0)){if((q|0)==0){r=o;break}else{j=34;break a}}v=c[(c[r+8>>2]|0)+16>>2]&255;t=r+(v<<2)+16|0;if((v|0)==0){j=1}else{j=1;u=r+16|0;while(1){s=u+4|0;j=ba(c[u>>2]|0,j)|0;if(s>>>0<t>>>0){u=s}else{break}}}if((c[r+12>>2]|0)==0){j=24;break a}u=c[r>>2]|0;if(u>>>0>(c[r+4>>2]|0)>>>0){j=26;break a}r=c[l>>2]|0;t=ba(r,j)|0;b:do{if((c[n>>2]&2097152|0)==0){s=u+t|0;if((t|0)>0){t=p;while(1){v=$b[c[(c[m>>2]|0)+52>>2]&63](m,u,t)|0;if((v|0)!=0){break b}u=u+r|0;if(u>>>0<s>>>0){t=t+r|0}else{v=0;break}}}else{v=0}}else{au(p|0,u|0,t|0)|0;v=0}}while(0);r=ba(j,k)|0;j=36}}while(0);if((j|0)==36){j=0;if((v|0)!=0){j=37;break}}q=q+1|0;if((q|0)<(h|0)){p=p+r|0}else{j=44;break}}if((j|0)==24){c[g>>2]=33152;c[g+4>>2]=8906;c[g+8>>2]=856;$a(8,g|0)|0;jb(1)}else if((j|0)==26){c[g>>2]=33176;c[g+4>>2]=8906;c[g+8>>2]=858;$a(8,g|0)|0;jb(1)}else if((j|0)==34){c[g>>2]=7136;c[g+4>>2]=7679;c[g+8>>2]=782;$a(8,g|0)|0;jb(1)}else if((j|0)==37){g=c[b>>2]|0;v=c[g+16>>2]&255;j=f+(v<<2)+16|0;if((v|0)==0){k=1}else{k=1;l=f+16|0;while(1){h=l+4|0;k=ba(c[l>>2]|0,k)|0;if(h>>>0<j>>>0){l=h}else{break}}}g=c[(dc[c[(c[g>>2]|0)+36>>2]&1023](g)|0)>>2]|0;if((c[(c[b>>2]|0)+16>>2]&255|0)!=1|(g|0)>-1){u=a+8|0;v=c[d>>2]|0;v=u+(v<<2)|0;i=e;return v|0}if((g|0)>0|(k|0)==0){u=a+8|0;v=c[d>>2]|0;v=u+(v<<2)|0;i=e;return v|0}if(!(Md(f,0,k,0,1)|0)){u=a+8|0;v=c[d>>2]|0;v=u+(v<<2)|0;i=e;return v|0}c[f+16>>2]=0;u=a+8|0;v=c[d>>2]|0;v=u+(v<<2)|0;i=e;return v|0}else if((j|0)==44){u=a+8|0;v=c[d>>2]|0;v=u+(v<<2)|0;i=e;return v|0}return 0}function rf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;Oe(b,6744,593,9032,2);Oe(b,6760,594,9032,2);Oe(b,6776,595,9032,2);c[g>>2]=9064;c[g+4>>2]=9076;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=9080;c[f+8>>2]=9100;c[f+12>>2]=9080;c[f+16>>2]=1;a[f+20|0]=0;j=Vd(f)|0;c[12]=b;Kc(b,g,j)|0;c[g>>2]=9104;c[g+4>>2]=9115;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=9120;c[f+8>>2]=9134;c[f+12>>2]=9120;c[f+16>>2]=1;a[f+20|0]=0;f=Vd(f)|0;c[12]=b;Kc(b,g,f)|0;c[12]=e;Oe(b,6752,596,9136,4);Oe(b,6768,596,9136,4);Oe(b,7176,597,9152,2);Oe(b,7184,598,9176,2);Oe(b,7192,599,9200,2);Oe(b,7200,600,9224,2);Oe(b,7208,601,9248,2);Oe(b,7216,602,9280,2);Oe(b,7224,603,9312,2);Oe(b,7232,604,9360,2);Oe(b,7248,605,9392,2);Oe(b,9448,606,9136,4);Oe(b,7784,607,9456,4);Oe(b,7808,607,9456,4);Oe(b,9472,607,9456,4);Oe(b,9480,607,9456,4);Oe(b,9488,607,9456,4);Oe(b,7704,607,9456,4);Oe(b,9496,607,9456,4);Oe(b,9504,607,9456,4);Oe(b,9512,607,9456,4);Oe(b,9520,607,9456,4);Oe(b,9528,607,9456,4);Oe(b,7728,607,9456,4);Oe(b,9536,607,9456,4);Oe(b,7760,607,9456,4);Oe(b,9544,607,9456,4);Oe(b,9552,607,9456,4);Oe(b,9560,607,9456,4);Oe(b,9576,607,9456,4);Oe(b,7288,607,9592,4);Oe(b,7296,607,9456,4);Oe(b,9616,606,9136,4);Oe(b,9624,606,9136,4);Oe(b,9632,606,9136,4);Oe(b,9640,606,9136,4);Oe(b,9648,606,9136,4);Oe(b,9664,606,9136,4);Oe(b,9672,606,9136,4);Oe(b,9680,606,9136,4);Oe(b,9688,606,9136,4);Oe(b,9696,606,9136,4);Oe(b,9712,607,9456,4);Oe(b,9720,606,9136,4);Oe(b,9728,606,9136,4);Oe(b,9744,606,9136,4);Oe(b,9752,607,9456,4);Oe(b,9760,606,9136,4);Oe(b,9768,606,9136,4);Oe(b,9784,606,9136,4);Oe(b,9792,606,9136,4);Oe(b,9800,606,9136,4);Oe(b,9816,606,9136,4);Oe(b,7464,606,9136,4);Oe(b,9824,606,9136,4);Oe(b,9832,608,9848,4);Oe(b,7568,609,9896,2);Oe(b,9944,610,9968,4);Oe(b,7840,611,9968,2);Oe(b,7712,612,10016,4);Oe(b,7736,612,10016,4);Oe(b,7768,612,10016,4);Oe(b,7792,612,10016,4);Oe(b,7816,613,10048,2);Oe(b,7448,614,10088,2);Oe(b,7488,615,10128,2);Oe(b,10152,616,10168,2);Oe(b,10192,617,10168,2);Oe(b,10208,618,10168,2);Oe(b,10224,619,10168,2);Oe(b,10240,620,10168,2);Oe(b,10256,621,10168,2);Oe(b,7360,622,10272,2);Oe(b,7328,623,10312,2);Oe(b,7304,624,10360,2);Oe(b,7408,625,10400,2);Oe(b,7384,626,10440,2);Oe(b,7472,627,10480,2);i=d;return}function sf(a){a=a|0;return}function tf(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function uf(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[c[b>>2]>>2]&63](b,a);i=d;return}function vf(a){a=a|0;return 0}function wf(a){a=a|0;return 0}function xf(a,b){a=a|0;b=b|0;return 0}function yf(a,b){a=a|0;b=b|0;return 0}function zf(a,b){a=a|0;b=b|0;c[b>>2]=0;c[b+4>>2]=0;return}function Af(a,b){a=a|0;b=b|0;c[b>>2]=0;c[b+4>>2]=0;return}function Bf(a){a=a|0;return 0}function Cf(a){a=a|0;return 0}function Df(a,b){a=a|0;b=b|0;return 0}function Ef(a){a=a|0;return c[a+12>>2]<<3|0}function Ff(a){a=a|0;return}function Gf(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Hf(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+12>>2]&63](b,a);i=d;return}function If(a){a=a|0;return}function Jf(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Kf(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+20>>2]&63](b,a);i=d;return}function Lf(a){a=a|0;return}function Mf(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Nf(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+24>>2]&63](b,a);i=d;return}function Of(a){a=a|0;return 0}function Pf(a){a=a|0;return 1}function Qf(a,b){a=a|0;b=b|0;var d=0;d=i;if((c[a+16>>2]&255|0)!=0){b=0;i=d;return b|0}a=c[a+24>>2]|0;b=hc[c[(c[a>>2]|0)+20>>2]&63](a,b)|0;i=d;return b|0}function Rf(a,b){a=a|0;b=b|0;if((b|0)==0){a=c[a+24>>2]|0}else{a=0}return a|0}function Sf(a,b){a=a|0;b=b|0;c[b>>2]=5040;c[b+4>>2]=5045;return}function Tf(a){a=a|0;return a+32|0}function Uf(a){a=a|0;var b=0;b=i;a=c[a+24>>2]|0;a=dc[c[(c[a>>2]|0)+60>>2]&1023](a)|0;i=b;return a|0}function Vf(a){a=a|0;return}function Wf(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Xf(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+40>>2]&63](b,a);i=d;return}function Yf(a){a=a|0;return c[a+24>>2]|0}function Zf(a){a=a|0;var b=0;b=i;a=c[a+24>>2]|0;a=dc[c[(c[a>>2]|0)+16>>2]&1023](a)|0;i=b;return a|0}function _f(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=hc[c[(c[a>>2]|0)+20>>2]&63](a,b)|0;i=d;return a|0}function $f(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=hc[c[(c[a>>2]|0)+24>>2]&63](a,b)|0;i=d;return a|0}function ag(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;cc[c[(c[a>>2]|0)+28>>2]&63](a,b);i=d;return}function bg(a){a=a|0;var b=0;b=i;a=c[a+24>>2]|0;a=dc[c[(c[a>>2]|0)+36>>2]&1023](a)|0;i=b;return a|0}function cg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;a=c[a+24>>2]|0;a=$b[c[(c[a>>2]|0)+52>>2]&63](a,b,d)|0;i=e;return a|0}function dg(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=hc[c[(c[a>>2]|0)+56>>2]&63](a,b)|0;i=d;return a|0}function eg(a){a=a|0;return}function fg(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function gg(a,b){a=a|0;b=b|0;var d=0;d=i;a=c[a+24>>2]|0;a=hc[c[(c[a>>2]|0)+44>>2]&63](a,b)|0;i=d;return a|0}function hg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=c[a+24>>2]|0;f=$b[c[(c[f>>2]|0)+48>>2]&63](f,b,(d|0)==0?a:d)|0;i=e;return f|0}function ig(a){a=a|0;return}function jg(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function kg(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+28>>2]&63](b,a);i=d;return}function lg(a,b){a=a|0;b=b|0;var d=0;d=a+(c[a+32>>2]|0)+36|0;c[b>>2]=a+36;c[b+4>>2]=d;return}function mg(a){a=a|0;return c[a+28>>2]|0}function ng(a){a=a|0;return}function og(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function pg(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+32>>2]&63](b,a);i=d;return}function qg(a,b){a=a|0;b=b|0;var d=0;d=a+(c[a+28>>2]|0)+32|0;c[b>>2]=a+32;c[b+4>>2]=d;return}function rg(a,b){a=a|0;b=b|0;c[b>>2]=0;c[b+4>>2]=0;return}function sg(a){a=a|0;return}function tg(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function ug(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+4>>2]&63](b,a);i=d;return}function vg(a){a=a|0;return c[a+24>>2]|0}function wg(a){a=a|0;return}function xg(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function yg(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+8>>2]&63](b,a);i=d;return}function zg(a,b,c){a=a|0;b=b|0;c=c|0;return 0}function Ag(a){a=a|0;return c[a+24>>2]|0}function Bg(a){a=a|0;return}function Cg(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Dg(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+16>>2]&63](b,a);i=d;return}function Eg(a,b,c){a=a|0;b=b|0;c=c|0;return 0}function Fg(a,b,d){a=a|0;b=b|0;d=d|0;d=i;i=i+16|0;c[d>>2]=1048;c[d+4>>2]=8906;c[d+8>>2]=707;$a(8,d|0)|0;jb(1);return 0}function Gg(a,b){a=a|0;b=b|0;return 1}function Hg(a){a=a|0;return}function Ig(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Jg(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+36>>2]&63](b,a);i=d;return}function Kg(a){a=a|0;return 1}function Lg(a,b){a=a|0;b=b|0;return 0}function Mg(a,b){a=a|0;b=b|0;if((b|0)==0){a=c[a+24>>2]|0}else{a=0}return a|0}function Ng(a){a=a|0;return}function Og(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Pg(a,b){a=a|0;b=b|0;return a+28|0}function Qg(a,b,d){a=a|0;b=b|0;d=d|0;c[b>>2]=c[a+28>>2];return 0}function Rg(a){a=a|0;return}function Sg(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function Tg(a,b){a=a|0;b=b|0;var d=0;d=i;cc[c[(c[b>>2]|0)+36>>2]&63](b,c[a+24>>2]|0);i=d;return}function Ug(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=c[a+28>>2]|0;f=fc[c[c[f>>2]>>2]&31](f,c[a+24>>2]|0,b,(d|0)==0?a:d)|0;i=e;return f|0}function Vg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=c[a+28>>2]|0;a=fc[c[(c[f>>2]|0)+4>>2]&31](f,c[a+24>>2]|0,b,d)|0;i=e;return a|0}function Wg(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=c[a+28>>2]|0;a=$b[c[(c[e>>2]|0)+8>>2]&63](e,c[a+24>>2]|0,b)|0;i=d;return a|0}function Xg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+32|0;e=d;f=d+16|0;g=f+4|0;c[g>>2]=0;c[f>>2]=0;if((b|0)==0){h=0}else{h=b+(Xt(b|0)|0)|0}c[f>>2]=b;c[g>>2]=h;f=Qc(c[c[1320]>>2]|0,f)|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}if((c[f+16>>2]&4128768|0)!=196608){c[e>>2]=8928;c[e+4>>2]=8986;c[e+8>>2]=182;$a(8,e|0)|0;jb(1)}c[a>>2]=0;if((f|0)==0){i=d;return}$b[c[(c[f>>2]|0)+48>>2]&63](f,a,0)|0;i=d;return}function Yg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;j=c[b+4>>2]|0;if((j|0)==0){r=b+4|0;c[d>>2]=r;i=f;return r|0}h=c[e+4>>2]|0;e=c[e>>2]|0;b=h-e|0;a:do{if(e>>>0<h>>>0){while(1){l=c[j+20>>2]|0;m=c[j+16>>2]|0;k=l-m|0;r=(b|0)==(k|0);do{if(r){o=e;n=m;while(1){p=a[o]|0;q=a[n]|0;if(!(p<<24>>24==q<<24>>24)){g=6;break}o=o+1|0;if(!(o>>>0<h>>>0)){break}else{n=n+1|0}}if((g|0)==6?(g=0,(p&255)<(q&255)):0){g=7;break}if(r){if(m>>>0<l>>>0){n=e}else{g=27;break a}while(1){p=a[m]|0;o=a[n]|0;if(!(p<<24>>24==o<<24>>24)){break}m=m+1|0;if(m>>>0<l>>>0){n=n+1|0}else{g=27;break a}}if(!((p&255)<(o&255))){g=27;break a}}else{g=10}}else{if((b|0)<(k|0)){g=7}else{g=10}}}while(0);if((g|0)==7){g=0;k=c[j>>2]|0;if((k|0)==0){e=j;b=j;g=19;break a}else{j=k;continue}}else if((g|0)==10?(g=0,(k|0)>=(b|0)):0){g=27;break a}l=j+4|0;k=c[l>>2]|0;if((k|0)==0){g=26;break}else{j=k}}}else{b:while(1){g=c[j+20>>2]|0;l=c[j+16>>2]|0;h=g-l|0;do{if((b|0)==(h|0)){if(l>>>0<g>>>0){h=e}else{g=27;break a}while(1){k=a[l]|0;m=a[h]|0;if(!(k<<24>>24==m<<24>>24)){break}l=l+1|0;if(l>>>0<g>>>0){h=h+1|0}else{g=27;break a}}if(!((k&255)<(m&255))){g=27;break a}}else{if((b|0)<(h|0)){g=c[j>>2]|0;if((g|0)==0){e=j;b=j;g=19;break a}else{j=g;continue b}}else{if((h|0)<(b|0)){break}else{g=27;break a}}}}while(0);l=j+4|0;g=c[l>>2]|0;if((g|0)==0){g=26;break}else{j=g}}}}while(0);if((g|0)==19){c[d>>2]=b;r=e;i=f;return r|0}else if((g|0)==26){c[d>>2]=j;r=l;i=f;return r|0}else if((g|0)==27){c[d>>2]=j;r=d;i=f;return r|0}return 0}function Zg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;l=(d|0)==(b|0);a[d+12|0]=l&1;if(l){i=e;return}while(1){j=d+8|0;f=c[j>>2]|0;k=f+12|0;if((a[k]|0)!=0){b=37;break}g=f+8|0;h=c[g>>2]|0;l=c[h>>2]|0;if((l|0)==(f|0)){j=c[h+4>>2]|0;if((j|0)==0){b=7;break}j=j+12|0;if((a[j]|0)!=0){b=7;break}a[k]=1;a[h+12|0]=(h|0)==(b|0)|0;a[j]=1}else{if((l|0)==0){b=24;break}l=l+12|0;if((a[l]|0)!=0){b=24;break}a[k]=1;a[h+12|0]=(h|0)==(b|0)|0;a[l]=1}if((h|0)==(b|0)){b=37;break}else{d=h}}if((b|0)==7){if((c[f>>2]|0)==(d|0)){d=f}else{l=f+4|0;d=c[l>>2]|0;j=c[d>>2]|0;c[l>>2]=j;if((j|0)!=0){c[j+8>>2]=f;h=c[g>>2]|0}j=d+8|0;c[j>>2]=h;h=c[g>>2]|0;if((c[h>>2]|0)==(f|0)){c[h>>2]=d}else{c[h+4>>2]=d}c[d>>2]=f;c[g>>2]=d;f=c[j>>2]|0;h=f;f=c[f>>2]|0}a[d+12|0]=1;a[h+12|0]=0;g=f+4|0;d=c[g>>2]|0;c[h>>2]=d;if((d|0)!=0){c[d+8>>2]=h}d=h+8|0;c[f+8>>2]=c[d>>2];j=c[d>>2]|0;if((c[j>>2]|0)==(h|0)){c[j>>2]=f}else{c[j+4>>2]=f}c[g>>2]=h;c[d>>2]=f;i=e;return}else if((b|0)==24){if((c[f>>2]|0)==(d|0)){b=d+4|0;k=c[b>>2]|0;c[f>>2]=k;if((k|0)!=0){c[k+8>>2]=f;h=c[g>>2]|0}c[j>>2]=h;h=c[g>>2]|0;if((c[h>>2]|0)==(f|0)){c[h>>2]=d}else{c[h+4>>2]=d}c[b>>2]=f;c[g>>2]=d;f=d;h=c[j>>2]|0}a[f+12|0]=1;a[h+12|0]=0;l=h+4|0;f=c[l>>2]|0;g=c[f>>2]|0;c[l>>2]=g;if((g|0)!=0){c[g+8>>2]=h}g=h+8|0;c[f+8>>2]=c[g>>2];d=c[g>>2]|0;if((c[d>>2]|0)==(h|0)){c[d>>2]=f}else{c[d+4>>2]=f}c[f>>2]=h;c[g>>2]=f;i=e;return}else if((b|0)==37){i=e;return}}function _g(a,b){a=a|0;b=b|0;var d=0;d=i;if((b|0)==0){i=d;return}else{_g(a,c[b>>2]|0);_g(a,c[b+4>>2]|0);Gt(b);i=d;return}}function $g(a){a=a|0;var b=0,d=0;b=i;d=c[a+4>>2]|0;$b[c[(c[d>>2]|0)+48>>2]&63](d,c[a+8>>2]|0,0)|0;i=b;return a+12|0}function ah(a){a=a|0;var b=0,d=0;b=i;d=c[a+4>>2]|0;hc[c[(c[d>>2]|0)+56>>2]&63](d,c[a+8>>2]|0)|0;i=b;return a+12|0}function bh(a){a=a|0;var b=0;b=i;bu(c[a+8>>2]|0,0,c[(c[a+4>>2]|0)+12>>2]|0)|0;i=b;return a+12|0}function ch(b){b=b|0;a[c[b+8>>2]|0]=a[c[b+4>>2]|0]|0;return b+12|0}function dh(a){a=a|0;b[c[a+8>>2]>>1]=b[c[a+4>>2]>>1]|0;return a+12|0}function eh(a){a=a|0;c[c[a+8>>2]>>2]=c[c[a+4>>2]>>2];return a+12|0}function fh(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function gh(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+8>>2]|0;e=c[a+4>>2]|0;c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];i=b;return a+12|0}function hh(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+8>>2]|0;e=c[a+4>>2]|0;c[d+0>>2]=c[e+0>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];c[d+16>>2]=c[e+16>>2];c[d+20>>2]=c[e+20>>2];c[d+24>>2]=c[e+24>>2];c[d+28>>2]=c[e+28>>2];i=b;return a+12|0}function ih(a){a=a|0;var b=0;b=i;au(c[a+8>>2]|0,c[a+4>>2]|0,c[a+12>>2]|0)|0;i=b;return a+16|0}function jh(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+4>>2]|0;e=c[(c[d>>2]|0)+8>>2]|0;$b[c[(c[e>>2]|0)+52>>2]&63](e,d,c[a+8>>2]|0)|0;i=b;return a+12|0}function kh(a){a=a|0;var b=0,d=0;b=i;d=c[a+12>>2]|0;$b[c[(c[d>>2]|0)+52>>2]&63](d,c[a+4>>2]|0,c[a+8>>2]|0)|0;i=b;return a+16|0}function lh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+16|0;j=e;d=e+12|0;g=c[c[b+4>>2]>>2]|0;f=c[b+12>>2]|0;if((f|0)==0){f=0}else{f=c[f>>2]|0}h=(f|0)<0?0:f;f=b+24|0;if((c[(c[g+8>>2]|0)+16>>2]&255|0)!=1){c[j>>2]=10512;c[j+4>>2]=7679;c[j+8>>2]=578;$a(8,j|0)|0;jb(1)}k=g+20|0;j=1;m=g+16|0;while(1){l=m+4|0;j=ba(c[m>>2]|0,j)|0;if(l>>>0<k>>>0){m=l}else{break}}l=c[(c[g+12>>2]|0)+12>>2]|0;a[d]=0;a:do{if((h|0)<(j|0)){k=f+4|0;c[k>>2]=Nd(g,h)|0;c[f+12>>2]=d;while(1){dc[c[f>>2]&1023](f)|0;if((a[d]|0)!=0){break}c[k>>2]=(c[k>>2]|0)+l;h=h+1|0;if((h|0)>=(j|0)){break a}}c[c[b+16>>2]>>2]=h;m=b+20|0;m=c[m>>2]|0;i=e;return m|0}}while(0);c[c[b+16>>2]>>2]=-1;m=b+20|0;m=c[m>>2]|0;i=e;return m|0}function mh(d){d=d|0;var e=0,f=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+16|0;k=f;j=c[c[d+4>>2]>>2]|0;e=d+20|0;n=a[d+12|0]|0;if((c[(c[j+8>>2]|0)+16>>2]&255|0)!=1){c[k>>2]=10512;c[k+4>>2]=7679;c[k+8>>2]=677;$a(8,k|0)|0;jb(1)}m=j+20|0;l=1;p=j+16|0;while(1){o=p+4|0;l=ba(c[p>>2]|0,l)|0;if(o>>>0<m>>>0){p=o}else{break}}p=j+12|0;o=c[p>>2]|0;m=c[o+12>>2]|0;q=(c[o+16>>2]|0)>>>16&31;do{if((q|0)==6){a[c[e+12>>2]|0]=n}else if((q|0)==12){n=n<<24>>24!=0;if((m|0)==4){g[c[e+12>>2]>>2]=+(n&1);break}else{h[c[e+12>>2]>>3]=+(n&1);break}}else{if((m|0)==2){b[c[e+12>>2]>>1]=n&255;break}else if((m|0)==4){c[c[e+12>>2]>>2]=n&255;break}else if((m|0)==1){a[c[e+12>>2]|0]=n;o=c[p>>2]|0;break}else if((m|0)==8){q=c[e+12>>2]|0;c[q>>2]=n&255;c[q+4>>2]=0;break}else{break}}}while(0);if((o|0)==0){c[k>>2]=33152;c[k+4>>2]=8906;c[k+8>>2]=856;$a(8,k|0)|0;jb(1)}n=c[j>>2]|0;if(n>>>0>(c[j+4>>2]|0)>>>0){c[k>>2]=33176;c[k+4>>2]=8906;c[k+8>>2]=858;$a(8,k|0)|0;jb(1)}j=e+4|0;c[j>>2]=n;if((l|0)<=0){q=d+16|0;q=c[q>>2]|0;i=f;return q|0}do{l=l+ -1|0;dc[c[e>>2]&1023](e)|0;c[j>>2]=(c[j>>2]|0)+m}while((l|0)>0);q=d+16|0;q=c[q>>2]|0;i=f;return q|0}function nh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;f=a+16|0;d=c[f>>2]|0;e=c[a+20>>2]|0;g=c[d>>2]|0;h=(g|0)==(c[1292]|0);if((e|0)==0){if(h){k=a+24|0;k=c[k>>2]|0;i=b;return k|0}e=a+4|0;f=a+8|0;h=a+12|0;do{l=d+4|0;c[l>>2]=(c[l>>2]|0)+(c[e>>2]|0);j=d+8|0;c[j>>2]=(c[j>>2]|0)+(c[f>>2]|0);k=d+12|0;c[k>>2]=(c[k>>2]|0)+(c[h>>2]|0);d=dc[g&1023](d)|0;c[l>>2]=(c[l>>2]|0)+(0-(c[e>>2]|0));c[j>>2]=(c[j>>2]|0)+(0-(c[f>>2]|0));c[k>>2]=(c[k>>2]|0)+(0-(c[h>>2]|0));g=c[d>>2]|0}while((g|0)!=(c[1292]|0));l=a+24|0;l=c[l>>2]|0;i=b;return l|0}if(!h){h=a+4|0;j=a+8|0;k=a+12|0;do{l=d+4|0;c[l>>2]=(c[l>>2]|0)+(c[h>>2]|0);l=d+8|0;c[l>>2]=(c[l>>2]|0)+(c[j>>2]|0);c[d+12>>2]=c[k>>2];if((g|0)==623|(g|0)==614){d=c[d+24>>2]|0}else{d=d+16|0}g=c[d>>2]|0}while((g|0)!=(c[1292]|0))}dc[c[e>>2]&1023](e)|0;g=c[f>>2]|0;f=c[g>>2]|0;if((f|0)==(c[1292]|0)){l=a+24|0;l=c[l>>2]|0;i=b;return l|0}d=a+4|0;e=a+8|0;do{l=g+4|0;c[l>>2]=(c[l>>2]|0)+(0-(c[d>>2]|0));l=g+8|0;c[l>>2]=(c[l>>2]|0)+(0-(c[e>>2]|0));if((f|0)==623|(f|0)==614){g=c[g+24>>2]|0}else{g=g+16|0}f=c[g>>2]|0}while((f|0)!=(c[1292]|0));l=a+24|0;l=c[l>>2]|0;i=b;return l|0}function oh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;g=a+16|0;if((c[g>>2]|0)==(c[1292]|0)){g=a+12|0;g=c[g>>2]|0;i=b;return g|0}d=a+4|0;e=a+8|0;f=g;while(1){j=g+4|0;c[j>>2]=(c[j>>2]|0)+(c[d>>2]|0);h=g+8|0;c[h>>2]=(c[h>>2]|0)+(c[e>>2]|0);g=dc[c[f>>2]&1023](g)|0;c[j>>2]=(c[j>>2]|0)+(0-(c[d>>2]|0));c[h>>2]=(c[h>>2]|0)+(0-(c[e>>2]|0));if((c[g>>2]|0)==(c[1292]|0)){break}else{f=g}}j=a+12|0;j=c[j>>2]|0;i=b;return j|0}function ph(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;g=c[h+4>>2]|0;j=c[h+8>>2]|0;a:do{if((g|0)!=0){if((j|0)==0){j=0;e=4}else{while(1){g=c[h>>2]|0;if((g|0)==(c[1292]|0)){break a}h=dc[g&1023](h)|0;if((a[f]|0)==0){e=0;break}}i=d;return e|0}}else{e=4}}while(0);if((e|0)==4){a[f]=(g|0)==(j|0)|0}j=b;i=d;return j|0}function qh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;g=c[h+4>>2]|0;j=c[h+8>>2]|0;a:do{if((g|0)!=0){if((j|0)==0){j=0;e=4}else{while(1){g=c[h>>2]|0;if((g|0)==(c[1292]|0)){break a}h=dc[g&1023](h)|0;if((a[f]|0)!=0){e=0;break}}i=d;return e|0}}else{e=4}}while(0);if((e|0)==4){a[f]=(g|0)!=(j|0)|0}j=b;i=d;return j|0}function rh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+8>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}if((c[h+4>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1292]|0)){g=h;while(1){j=dc[c[h>>2]&1023](g)|0;if((a[f]|0)!=0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;dc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)!=0){break}if((c[j>>2]|0)==(c[1292]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=0;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function sh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+4>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}if((c[h+8>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1292]|0)){g=h;while(1){j=dc[c[h>>2]&1023](g)|0;if((a[f]|0)!=0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;dc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)!=0){break}if((c[j>>2]|0)==(c[1292]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=0;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function th(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+4>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}if((c[h+8>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1292]|0)){g=h;while(1){j=dc[c[h>>2]&1023](g)|0;if((a[f]|0)==0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;dc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)==0){break}if((c[j>>2]|0)==(c[1292]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=1;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function uh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;h=c[b+4>>2]|0;f=c[h+12>>2]|0;if((c[h+8>>2]|0)==0){a[f]=1;j=0;i=e;return j|0}if((c[h+4>>2]|0)==0){a[f]=0;j=0;i=e;return j|0}a:do{if((c[h>>2]|0)!=(c[1292]|0)){g=h;while(1){j=dc[c[h>>2]&1023](g)|0;if((a[f]|0)==0){f=0;d=12;break}k=h+4|0;l=c[k>>2]|0;m=h+8|0;c[k>>2]=c[m>>2];c[m>>2]=l;dc[c[h>>2]&1023](g)|0;c[m>>2]=c[k>>2];c[k>>2]=l;if((a[f]|0)==0){break}if((c[j>>2]|0)==(c[1292]|0)){break a}else{g=j;h=j}}if((d|0)==12){i=e;return f|0}a[f]=1;m=0;i=e;return m|0}}while(0);m=b;i=e;return m|0}function vh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;h=c[c[a+4>>2]>>2]|0;l=c[c[a+8>>2]>>2]|0;j=c[c[a+12>>2]>>2]|0;f=c[a+16>>2]|0;g=c[(c[h+12>>2]|0)+12>>2]|0;d=c[(c[l+12>>2]|0)+12>>2]|0;k=j+12|0;e=c[(c[k>>2]|0)+12>>2]|0;s=c[(c[h+8>>2]|0)+16>>2]&255;n=h+(s<<2)+16|0;if((s|0)==0){m=1}else{m=1;p=h+16|0;while(1){o=p+4|0;m=ba(c[p>>2]|0,m)|0;if(o>>>0<n>>>0){p=o}else{break}}}s=c[(c[l+8>>2]|0)+16>>2]&255;o=l+(s<<2)+16|0;if((s|0)==0){q=1}else{q=1;p=l+16|0;while(1){n=p+4|0;q=ba(c[p>>2]|0,q)|0;if(n>>>0<o>>>0){p=n}else{break}}}n=(m|0)<(q|0)?m:q;m=j+8|0;o=c[m>>2]|0;s=c[o+16>>2]&255;q=j+(s<<2)+16|0;if((s|0)==0){r=1}else{r=1;s=j+16|0;while(1){p=s+4|0;r=ba(c[s>>2]|0,r)|0;if(p>>>0<q>>>0){s=p}else{break}}}o=c[(dc[c[(c[o>>2]|0)+36>>2]&1023](o)|0)>>2]|0;if((!((c[(c[m>>2]|0)+16>>2]&255|0)!=1|(o|0)>-1)?!((o|0)!=-2147483648&(n|0)>(0-o|0)|(r|0)==(n|0)):0)?Md(j,ba(c[(c[k>>2]|0)+12>>2]|0,n)|0,r,n,1)|0:0){c[j+16>>2]=n}l=c[l>>2]|0;r=c[j>>2]|0;s=ba(n,e)|0;k=r+s|0;j=f+4|0;c[j>>2]=c[h>>2];h=f+8|0;c[h>>2]=l;l=f+12|0;c[l>>2]=r;if((s|0)<=0){s=a+24|0;s=c[s>>2]|0;i=b;return s|0}do{dc[c[f>>2]&1023](f)|0;c[j>>2]=(c[j>>2]|0)+g;c[h>>2]=(c[h>>2]|0)+d;s=(c[l>>2]|0)+e|0;c[l>>2]=s}while(s>>>0<k>>>0);s=a+24|0;s=c[s>>2]|0;i=b;return s|0}function wh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;j=c[c[a+4>>2]>>2]|0;k=c[c[a+8>>2]>>2]|0;h=c[a+12>>2]|0;g=c[a+16>>2]|0;e=c[a+20>>2]|0;b=c[(c[j+12>>2]|0)+12>>2]|0;d=c[(c[k+12>>2]|0)+12>>2]|0;p=c[(c[j+8>>2]|0)+16>>2]&255;n=j+(p<<2)+16|0;if((p|0)==0){l=1}else{l=1;o=j+16|0;while(1){m=o+4|0;l=ba(c[o>>2]|0,l)|0;if(m>>>0<n>>>0){o=m}else{break}}}p=c[(c[k+8>>2]|0)+16>>2]&255;o=k+(p<<2)+16|0;if((p|0)==0){n=1}else{n=1;p=k+16|0;while(1){m=p+4|0;n=ba(c[p>>2]|0,n)|0;if(m>>>0<o>>>0){p=m}else{break}}}m=(l|0)<(n|0);o=m?l:n;p=c[k>>2]|0;k=g+4|0;c[k>>2]=c[j>>2];j=g+8|0;c[j>>2]=p;c[g+12>>2]=h;if((n|l|0)==0){c[k>>2]=0;c[j>>2]=0;dc[c[e>>2]&1023](e)|0;p=a+24|0;p=c[p>>2]|0;i=f;return p|0}a:do{if((o|0)>0){while(1){o=o+ -1|0;if((dc[c[e>>2]&1023](e)|0)==0){break}c[k>>2]=(c[k>>2]|0)+b;c[j>>2]=(c[j>>2]|0)+d;if((o|0)<=0){break a}}p=a+24|0;p=c[p>>2]|0;i=f;return p|0}}while(0);if((l|0)==(n|0)){p=a+24|0;p=c[p>>2]|0;i=f;return p|0}if(m){c[k>>2]=0}else{c[j>>2]=0}dc[c[e>>2]&1023](e)|0;p=a+24|0;p=c[p>>2]|0;i=f;return p|0}function xh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;b=i;h=c[c[a+4>>2]>>2]|0;k=c[c[a+8>>2]>>2]|0;j=c[c[a+12>>2]>>2]|0;f=c[a+16>>2]|0;g=c[(c[h+12>>2]|0)+12>>2]|0;n=k+12|0;d=c[(c[n>>2]|0)+12>>2]|0;l=j+12|0;e=c[(c[l>>2]|0)+12>>2]|0;t=c[(c[h+8>>2]|0)+16>>2]&255;p=h+(t<<2)+16|0;if((t|0)==0){m=1}else{m=1;q=h+16|0;while(1){o=q+4|0;m=ba(c[q>>2]|0,m)|0;if(o>>>0<p>>>0){q=o}else{break}}}o=k+8|0;p=c[o>>2]|0;t=c[p+16>>2]&255;r=k+(t<<2)+16|0;if((t|0)==0){s=1}else{s=1;t=k+16|0;while(1){q=t+4|0;s=ba(c[t>>2]|0,s)|0;if(q>>>0<r>>>0){t=q}else{break}}}p=c[(dc[c[(c[p>>2]|0)+36>>2]&1023](p)|0)>>2]|0;if((!((c[(c[o>>2]|0)+16>>2]&255|0)!=1|(p|0)>-1)?!((p|0)!=-2147483648&(m|0)>(0-p|0)|(s|0)==(m|0)):0)?Md(k,ba(c[(c[n>>2]|0)+12>>2]|0,m)|0,s,m,1)|0:0){c[k+16>>2]=m}n=j+8|0;o=c[n>>2]|0;t=c[o+16>>2]&255;q=j+(t<<2)+16|0;if((t|0)==0){s=1}else{s=1;r=j+16|0;while(1){p=r+4|0;s=ba(c[r>>2]|0,s)|0;if(p>>>0<q>>>0){r=p}else{break}}}o=c[(dc[c[(c[o>>2]|0)+36>>2]&1023](o)|0)>>2]|0;if((!((c[(c[n>>2]|0)+16>>2]&255|0)!=1|(o|0)>-1)?!((o|0)!=-2147483648&(m|0)>(0-o|0)|(s|0)==(m|0)):0)?Md(j,ba(c[(c[l>>2]|0)+12>>2]|0,m)|0,s,m,1)|0:0){c[j+16>>2]=m}l=c[k>>2]|0;s=c[j>>2]|0;t=ba(m,e)|0;k=s+t|0;j=f+4|0;c[j>>2]=c[h>>2];h=f+8|0;c[h>>2]=l;l=f+12|0;c[l>>2]=s;if((t|0)<=0){t=a+24|0;t=c[t>>2]|0;i=b;return t|0}do{dc[c[f>>2]&1023](f)|0;c[j>>2]=(c[j>>2]|0)+g;c[h>>2]=(c[h>>2]|0)+d;t=(c[l>>2]|0)+e|0;c[l>>2]=t}while(t>>>0<k>>>0);t=a+24|0;t=c[t>>2]|0;i=b;return t|0}function yh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;b=c[a+16>>2]|0;g=c[c[a+8>>2]>>2]|0;h=c[c[a+12>>2]>>2]|0;d=c[(c[g+12>>2]|0)+12>>2]|0;j=h+12|0;e=c[(c[j>>2]|0)+12>>2]|0;q=c[(c[g+8>>2]|0)+16>>2]&255;k=g+(q<<2)+16|0;if((q|0)==0){l=1}else{l=1;n=g+16|0;while(1){m=n+4|0;l=ba(c[n>>2]|0,l)|0;if(m>>>0<k>>>0){n=m}else{break}}}k=h+8|0;m=c[k>>2]|0;q=c[m+16>>2]&255;n=h+(q<<2)+16|0;if((q|0)==0){p=1}else{p=1;q=h+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(l|0)>(0-m|0)|(p|0)==(l|0)):0)?Md(h,ba(c[(c[j>>2]|0)+12>>2]|0,l)|0,p,l,1)|0:0){c[h+16>>2]=l}o=c[g>>2]|0;p=c[h>>2]|0;q=ba(l,e)|0;j=p+q|0;c[b+4>>2]=c[a+4>>2];g=b+8|0;c[g>>2]=o;h=b+12|0;c[h>>2]=p;if((q|0)<=0){q=a+24|0;q=c[q>>2]|0;i=f;return q|0}do{dc[c[b>>2]&1023](b)|0;c[g>>2]=(c[g>>2]|0)+d;q=(c[h>>2]|0)+e|0;c[h>>2]=q}while(q>>>0<j>>>0);q=a+24|0;q=c[q>>2]|0;i=f;return q|0}function zh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;b=c[a+16>>2]|0;g=c[c[a+4>>2]>>2]|0;h=c[c[a+12>>2]>>2]|0;d=c[(c[g+12>>2]|0)+12>>2]|0;j=h+12|0;e=c[(c[j>>2]|0)+12>>2]|0;q=c[(c[g+8>>2]|0)+16>>2]&255;k=g+(q<<2)+16|0;if((q|0)==0){l=1}else{l=1;n=g+16|0;while(1){m=n+4|0;l=ba(c[n>>2]|0,l)|0;if(m>>>0<k>>>0){n=m}else{break}}}k=h+8|0;m=c[k>>2]|0;q=c[m+16>>2]&255;n=h+(q<<2)+16|0;if((q|0)==0){p=1}else{p=1;q=h+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(l|0)>(0-m|0)|(p|0)==(l|0)):0)?Md(h,ba(c[(c[j>>2]|0)+12>>2]|0,l)|0,p,l,1)|0:0){c[h+16>>2]=l}p=c[h>>2]|0;q=ba(l,e)|0;j=p+q|0;h=b+4|0;c[h>>2]=c[g>>2];c[b+8>>2]=c[a+8>>2];g=b+12|0;c[g>>2]=p;if((q|0)<=0){q=a+24|0;q=c[q>>2]|0;i=f;return q|0}do{dc[c[b>>2]&1023](b)|0;c[h>>2]=(c[h>>2]|0)+d;q=(c[g>>2]|0)+e|0;c[g>>2]=q}while(q>>>0<j>>>0);q=a+24|0;q=c[q>>2]|0;i=f;return q|0}function Ah(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;g=c[c[a+4>>2]>>2]|0;h=c[c[a+8>>2]>>2]|0;b=a+16|0;d=c[(c[g+12>>2]|0)+12>>2]|0;j=h+12|0;e=c[(c[j>>2]|0)+12>>2]|0;q=c[(c[g+8>>2]|0)+16>>2]&255;k=g+(q<<2)+16|0;if((q|0)==0){l=1}else{l=1;n=g+16|0;while(1){m=n+4|0;l=ba(c[n>>2]|0,l)|0;if(m>>>0<k>>>0){n=m}else{break}}}k=h+8|0;m=c[k>>2]|0;q=c[m+16>>2]&255;n=h+(q<<2)+16|0;if((q|0)==0){p=1}else{p=1;q=h+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<n>>>0){q=o}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(l|0)>(0-m|0)|(p|0)==(l|0)):0)?Md(h,ba(c[(c[j>>2]|0)+12>>2]|0,l)|0,p,l,1)|0:0){c[h+16>>2]=l}p=c[h>>2]|0;q=ba(l,e)|0;j=p+q|0;h=b+4|0;c[h>>2]=c[g>>2];g=b+8|0;c[g>>2]=p;if((q|0)<=0){q=a+12|0;q=c[q>>2]|0;i=f;return q|0}do{dc[c[b>>2]&1023](b)|0;c[h>>2]=(c[h>>2]|0)+d;q=(c[g>>2]|0)+e|0;c[g>>2]=q}while(q>>>0<j>>>0);q=a+12|0;q=c[q>>2]|0;i=f;return q|0}function Bh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;b=i;i=i+32|0;p=b;e=b+16|0;d=b+12|0;o=c[c[a+4>>2]>>2]|0;c[e>>2]=o;f=c[a+8>>2]|0;if((f|0)!=0?(l=c[f>>2]|0,(l|0)!=0):0){u=c[(c[l+8>>2]|0)+16>>2]&255;h=l+(u<<2)+16|0;if((u|0)==0){j=1;f=1}else{f=1;j=l+16|0;while(1){g=j+4|0;f=ba(c[j>>2]|0,f)|0;if(g>>>0<h>>>0){j=g}else{j=1;break}}}}else{j=0;l=0;f=0}g=c[a+20>>2]|0;if((g|0)==0){q=0}else{q=c[g>>2]|0}c[d>>2]=q;g=c[a+24>>2]|0;if((g|0)==0){n=0}else{n=c[g>>2]|0}g=c[a+12>>2]|0;if((g|0)==0){h=0}else{h=c[g>>2]|0}g=c[a+16>>2]|0;if((g|0)==0){m=f}else{m=c[g>>2]|0}r=c[o+8>>2]|0;u=c[r+16>>2]&255;s=o+(u<<2)+16|0;if((u|0)==0){k=1}else{k=1;t=o+16|0;while(1){g=t+4|0;k=ba(c[t>>2]|0,k)|0;if(g>>>0<s>>>0){t=g}else{break}}}g=c[o+12>>2]|0;s=k-h|0;m=(m|0)<(s|0)?m:s;m=(m|0)<0?0:m;if((h|0)<0|(h|0)>(k|0)){if(!((q|0)==0|(o|0)==(q|0))){$b[c[(c[r>>2]|0)+52>>2]&63](r,e,d)|0}if((n|0)==0){u=a+28|0;i=b;return u|0}d=n+8|0;e=c[d>>2]|0;u=c[e+16>>2]&255;g=n+(u<<2)+16|0;if((u|0)==0){h=1}else{h=1;j=n+16|0;while(1){f=j+4|0;h=ba(c[j>>2]|0,h)|0;if(f>>>0<g>>>0){j=f}else{break}}}e=c[(dc[c[(c[e>>2]|0)+36>>2]&1023](e)|0)>>2]|0;if((c[(c[d>>2]|0)+16>>2]&255|0)!=1|(e|0)>-1){u=a+28|0;i=b;return u|0}if((e|0)>0|(h|0)==0){u=a+28|0;i=b;return u|0}if(!(Md(n,0,h,0,1)|0)){u=a+28|0;i=b;return u|0}c[n+16>>2]=0;u=a+28|0;i=b;return u|0}if(!((o|0)!=(n|0)&(o|0)!=(q|0))){c[p>>2]=11264;c[p+4>>2]=7119;c[p+8>>2]=61;$a(8,p|0)|0;jb(1)}if((l|0)!=0?!((l|0)!=(n|0)&(l|0)!=(q|0)):0){c[p>>2]=11328;c[p+4>>2]=7119;c[p+8>>2]=62;$a(8,p|0)|0;jb(1)}o=f-m+k|0;a:do{if((n|0)!=0){p=n+8|0;q=c[p>>2]|0;u=c[q+16>>2]&255;r=n+(u<<2)+16|0;if((u|0)==0){u=1}else{u=1;t=n+16|0;while(1){s=t+4|0;u=ba(c[t>>2]|0,u)|0;if(s>>>0<r>>>0){t=s}else{break}}}q=c[(dc[c[(c[q>>2]|0)+36>>2]&1023](q)|0)>>2]|0;if((!((c[(c[p>>2]|0)+16>>2]&255|0)!=1|(q|0)>-1)?!((q|0)!=-2147483648&(m|0)>(0-q|0)|(u|0)==(m|0)):0)?Md(n,ba(c[(c[n+12>>2]|0)+12>>2]|0,m)|0,u,m,1)|0:0){c[n+16>>2]=m}q=Nd(c[e>>2]|0,h)|0;r=c[n>>2]|0;p=c[g+12>>2]|0;s=ba(p,m)|0;if((c[g+16>>2]&2097152|0)!=0){au(r|0,q|0,s|0)|0;break}n=q+s|0;if((s|0)>0){while(1){if(($b[c[(c[g>>2]|0)+52>>2]&63](g,q,r)|0)!=0){break a}q=q+p|0;if(!(q>>>0<n>>>0)){break}else{r=r+p|0}}}}}while(0);p=c[d>>2]|0;if((p|0)==0){u=a+28|0;i=b;return u|0}n=p+8|0;q=c[n>>2]|0;u=c[q+16>>2]&255;s=p+(u<<2)+16|0;if((u|0)==0){u=1}else{u=1;t=p+16|0;while(1){r=t+4|0;u=ba(c[t>>2]|0,u)|0;if(r>>>0<s>>>0){t=r}else{break}}}q=c[(dc[c[(c[q>>2]|0)+36>>2]&1023](q)|0)>>2]|0;if((!((c[(c[n>>2]|0)+16>>2]&255|0)!=1|(q|0)>-1)?!((q|0)!=-2147483648&(o|0)>(0-q|0)|(u|0)==(o|0)):0)?Md(p,ba(c[(c[p+12>>2]|0)+12>>2]|0,o)|0,u,o,1)|0:0){c[p+16>>2]=o}r=c[c[e>>2]>>2]|0;s=c[c[d>>2]>>2]|0;n=g+16|0;o=g+12|0;p=c[o>>2]|0;t=ba(p,h)|0;b:do{if((c[n>>2]&2097152|0)==0){q=r+t|0;if((t|0)>0){while(1){if(($b[c[(c[g>>2]|0)+52>>2]&63](g,r,s)|0)!=0){break b}r=r+p|0;if(!(r>>>0<q>>>0)){break}else{s=s+p|0}}}}else{au(s|0,r|0,t|0)|0}}while(0);c:do{if(j){p=c[l>>2]|0;q=Nd(c[d>>2]|0,h)|0;l=c[o>>2]|0;r=ba(l,f)|0;if((c[n>>2]&2097152|0)!=0){au(q|0,p|0,r|0)|0;break}j=p+r|0;if((r|0)>0){while(1){if(($b[c[(c[g>>2]|0)+52>>2]&63](g,p,q)|0)!=0){break c}p=p+l|0;if(!(p>>>0<j>>>0)){break}else{q=q+l|0}}}}}while(0);j=m+h|0;e=Nd(c[e>>2]|0,j)|0;f=Nd(c[d>>2]|0,h+f|0)|0;d=c[o>>2]|0;j=ba(d,k-j|0)|0;if((c[n>>2]&2097152|0)!=0){au(f|0,e|0,j|0)|0;u=a+28|0;i=b;return u|0}h=e+j|0;if((j|0)<=0){u=a+28|0;i=b;return u|0}while(1){if(($b[c[(c[g>>2]|0)+52>>2]&63](g,e,f)|0)!=0){d=70;break}e=e+d|0;if(e>>>0<h>>>0){f=f+d|0}else{d=70;break}}if((d|0)==70){u=a+28|0;i=b;return u|0}return 0}



function jc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function kc(){return i|0}function lc(a){a=a|0;i=a}function mc(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function nc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function oc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function pc(a){a=a|0;F=a}function qc(a){a=a|0;G=a}function rc(a){a=a|0;H=a}function sc(a){a=a|0;I=a}function tc(a){a=a|0;J=a}function uc(a){a=a|0;K=a}function vc(a){a=a|0;L=a}function wc(a){a=a|0;M=a}function xc(a){a=a|0;N=a}function yc(a){a=a|0;O=a}function zc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;g=i;i=i+16|0;f=g;if(a){i=g;return}g=lt(d,47)|0;if((g|0)==0){g=lt(d,92)|0;d=(g|0)==0?d:g+1|0}else{d=g+1|0}c[f>>2]=b;c[f+4>>2]=d;c[f+8>>2]=e;$a(8,f|0)|0;jb(1)}function Ac(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;e=At(96)|0;if((e|0)==0){e=0}else{g=e+0|0;f=g+96|0;do{a[g]=0;g=g+1|0}while((g|0)<(f|0));Dc(e,b)}f=e+52|0;b=(c[f>>2]|0)+96|0;c[f>>2]=b;f=e+44|0;c[f>>2]=(c[f>>2]|0)+1;f=e+56|0;if(!(b>>>0>(c[f>>2]|0)>>>0)){i=d;return e|0}c[f>>2]=b;i=d;return e|0}function Bc(a){a=a|0;var b=0;b=i;_g(a+16|0,c[a+20>>2]|0);_g(a+4|0,c[a+8>>2]|0);Bt(a);i=b;return}function Cc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e;g=c[a+44>>2]|0;if((g|0)==1&d){if((c[a+52>>2]|0)==96){i=e;return}else{g=1}}h=c[a+52>>2]|0;d=c[a+88>>2]|0;c[f>>2]=g;c[f+4>>2]=h;c[f+8>>2]=d;c[f+12>>2]=b;$a(56,f|0)|0;i=e;return}function Dc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;c[b+8>>2]=0;c[b+12>>2]=0;c[b+4>>2]=b+8;c[b+20>>2]=0;c[b+24>>2]=0;c[b+16>>2]=b+20;h=b+64|0;g=b+44|0;e=b+60|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[h+0>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[h+16>>2]=0;c[h+20>>2]=0;c[h+24>>2]=0;c[e>>2]=16777216;e=b+40|0;c[e>>2]=0;c[b>>2]=d;c[b+28>>2]=8;h=c[12]|0;c[12]=b;d=At(32)|0;if((d|0)==0){l=0;m=b+36|0;c[m>>2]=l;c[12]=h;i=f;return}l=b+56|0;k=b+52|0;m=d+0|0;j=m+32|0;do{a[m]=0;m=m+1|0}while((m|0)<(j|0));c[k>>2]=32;c[g>>2]=1;c[l>>2]=32;c[d>>2]=32;c[d+4>>2]=b;l=d+8|0;c[l>>2]=328;c[d+16>>2]=b;c[d+12>>2]=c[e>>2];c[e>>2]=l;c[d+20>>2]=0;a[d+28|0]=0;c[d+24>>2]=2097152;m=b+36|0;c[m>>2]=l;c[12]=h;i=f;return}function Ec(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;g=d;if((b|0)==0){c[g>>2]=112;c[g+4>>2]=143;c[g+8>>2]=118;$a(8,g|0)|0;jb(1)}e=a+52|0;h=c[e>>2]|0;if((h+b|0)>>>0>(c[a+60>>2]|0)>>>0){h=a+48|0;c[h>>2]=(c[h>>2]|0)+1;c[(c[1320]|0)+16>>2]=0;Ia(33272)|0;h=0;i=d;return h|0}b=b+8|0;f=At(b)|0;if((f|0)==0){h=0;i=d;return h|0}bu(f|0,0,b|0)|0;if((b|0)==0){c[g>>2]=112;c[g+4>>2]=143;c[g+8>>2]=282;$a(8,g|0)|0;jb(1)}g=h+b|0;c[e>>2]=g;e=a+44|0;c[e>>2]=(c[e>>2]|0)+1;e=a+56|0;if(g>>>0>(c[e>>2]|0)>>>0){c[e>>2]=g}c[f>>2]=b;c[f+4>>2]=a;h=f+8|0;i=d;return h|0}function Fc(a){a=a|0;Ba(a|0)|0;va()}function Gc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;g=f;if((d|0)==0){c[g>>2]=112;c[g+4>>2]=143;c[g+8>>2]=151;$a(8,g|0)|0;jb(1)}if((b|0)==0){c[g>>2]=168;c[g+4>>2]=143;c[g+8>>2]=152;$a(8,g|0)|0;jb(1)}m=b+ -8|0;h=c[m>>2]|0;d=d+8|0;b=e+8|0;e=Ct(m,d)|0;if((e|0)==0){m=0;i=f;return m|0}if(b>>>0<d>>>0){bu(e+b|0,0,d-b|0)|0}if((h|0)==0){c[g>>2]=112;c[g+4>>2]=143;c[g+8>>2]=282;$a(8,g|0)|0;jb(1)}b=a+52|0;m=(c[b>>2]|0)-h|0;c[b>>2]=m;h=a+44|0;j=c[h>>2]|0;c[h>>2]=j+ -1;k=a+56|0;l=c[k>>2]|0;if(m>>>0>l>>>0){c[k>>2]=m;l=m}if((d|0)==0){c[g>>2]=112;c[g+4>>2]=143;c[g+8>>2]=282;$a(8,g|0)|0;jb(1)}m=m+d|0;c[b>>2]=m;c[h>>2]=j;if(m>>>0>l>>>0){c[k>>2]=m}c[e>>2]=d;if((c[e+4>>2]|0)!=(a|0)){c[g>>2]=184;c[g+4>>2]=143;c[g+8>>2]=172;$a(8,g|0)|0;jb(1)}m=e+8|0;i=f;return m|0}function Hc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;f=d;if((b|0)==0){i=d;return}e=b+ -8|0;g=c[e>>2]|0;if((c[b+ -4>>2]|0)!=(a|0)){c[f>>2]=232;c[f+4>>2]=143;c[f+8>>2]=193;$a(8,f|0)|0;jb(1)}if((g|0)==0){c[f>>2]=112;c[f+4>>2]=143;c[f+8>>2]=282;$a(8,f|0)|0;jb(1)}b=a+52|0;f=(c[b>>2]|0)-g|0;c[b>>2]=f;g=a+44|0;c[g>>2]=(c[g>>2]|0)+ -1;a=a+56|0;if(f>>>0>(c[a>>2]|0)>>>0){c[a>>2]=f}Bt(e);i=d;return}function Ic(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;h=f;e=c[12]|0;c[12]=b;g=b+40|0;j=c[g>>2]|0;if((j|0)==0){j=0}else{while(1){k=c[j+4>>2]|0;if(!((a[j+20|0]&8)==0)){m=hc[c[(c[j>>2]|0)+44>>2]&63](j,4)|0;hc[c[(c[j>>2]|0)+56>>2]&63](j,m)|0}if((k|0)==0){break}else{j=k}}j=c[g>>2]|0}while(1){if((j|0)==0){break}m=c[j+4>>2]|0;bc[c[c[j>>2]>>2]&127](j);Hc(b,j);j=m}c[g>>2]=0;m=b+4|0;_g(m,c[b+8>>2]|0);c[b+12>>2]=0;l=b+8|0;c[m>>2]=l;c[l>>2]=0;l=b+16|0;_g(l,c[b+20>>2]|0);c[b+24>>2]=0;m=b+20|0;c[l>>2]=m;c[m>>2]=0;if(d){c[12]=e;i=f;return}d=c[12]|0;if((d|0)==0){c[h>>2]=33224;c[h+4>>2]=8906;c[h+8>>2]=284;$a(8,h|0)|0;jb(1)}j=d+52|0;l=c[j>>2]|0;if(!((l+24|0)>>>0>(c[d+60>>2]|0)>>>0)){h=At(32)|0;if((h|0)==0){g=0}else{k=h+0|0;m=k+32|0;do{a[k]=0;k=k+1|0}while((k|0)<(m|0));k=l+32|0;c[j>>2]=k;j=d+44|0;c[j>>2]=(c[j>>2]|0)+1;j=d+56|0;if(k>>>0>(c[j>>2]|0)>>>0){c[j>>2]=k}c[h>>2]=32;c[h+4>>2]=d;m=h+8|0;c[m>>2]=328;c[h+16>>2]=b;c[h+12>>2]=c[g>>2];c[g>>2]=m;c[h+20>>2]=0;g=h+24|0;l=c[g>>2]|0;k=h+28|0;a[k]=a[k]&-8;c[g>>2]=l&-2113929216|2097152;g=m}}else{g=d+48|0;c[g>>2]=(c[g>>2]|0)+1;c[(c[1320]|0)+16>>2]=0;Ia(33272)|0;g=0}c[b+36>>2]=g;c[12]=e;i=f;return}function Jc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+16|0;j=g;h=c[12]|0;if((h|0)==0){c[j>>2]=33224;c[j+4>>2]=8906;c[j+8>>2]=284;$a(8,j|0)|0;jb(1)}k=h+52|0;l=c[k>>2]|0;if((l+32|0)>>>0>(c[h+60>>2]|0)>>>0){n=h+48|0;c[n>>2]=(c[n>>2]|0)+1;c[(c[1320]|0)+16>>2]=0;Ia(33272)|0;n=0;i=g;return n|0}j=At(40)|0;if((j|0)==0){n=0;i=g;return n|0}m=j+0|0;n=m+40|0;do{a[m]=0;m=m+1|0}while((m|0)<(n|0));l=l+40|0;c[k>>2]=l;k=h+44|0;c[k>>2]=(c[k>>2]|0)+1;k=h+56|0;if(l>>>0>(c[k>>2]|0)>>>0){c[k>>2]=l}c[j>>2]=40;c[j+4>>2]=h;n=j+8|0;$c(n,b,d);c[n>>2]=1504;m=j+24|0;l=c[m>>2]|0;c[j+20>>2]=4;c[m>>2]=l&-18808833|17760256;c[j+36>>2]=e;m=j+28|0;a[m]=a[m]&-8|f&7;i=g;return n|0}function Kc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+32|0;k=f+8|0;j=f;h=b+4|0;g=b+8|0;r=c[g>>2]|0;p=b+8|0;do{if((r|0)!=0){m=c[d+4>>2]|0;o=c[d>>2]|0;n=m-o|0;q=p;a:while(1){b:while(1){s=c[r+20>>2]|0;w=c[r+16>>2]|0;t=s-w|0;if((t|0)==(n|0)){if(w>>>0<s>>>0){v=o}else{break}while(1){u=a[w]|0;t=a[v]|0;if(!(u<<24>>24==t<<24>>24)){break}w=w+1|0;if(!(w>>>0<s>>>0)){break b}else{v=v+1|0}}if(!((u&255)<(t&255))){break}}else{if((t|0)>=(n|0)){break}}r=c[r+4>>2]|0;if((r|0)==0){break a}}s=c[r>>2]|0;if((s|0)==0){q=r;break}else{q=r;r=s}}if((q|0)!=(p|0)){p=c[q+16>>2]|0;q=(c[q+20>>2]|0)-p|0;if((n|0)!=(q|0)){if((n|0)<(q|0)){break}else{b=0}i=f;return b|0}if(!(o>>>0<m>>>0)){w=0;i=f;return w|0}while(1){n=a[o]|0;q=a[p]|0;if(!(n<<24>>24==q<<24>>24)){break}o=o+1|0;if(o>>>0<m>>>0){p=p+1|0}else{b=0;l=28;break}}if((l|0)==28){i=f;return b|0}if(!((n&255)<(q&255))){w=0;i=f;return w|0}}}}while(0);m=c[12]|0;if((m|0)==0){c[k>>2]=33224;c[k+4>>2]=8906;c[k+8>>2]=284;$a(8,k|0)|0;jb(1)}l=d+4|0;m=Ec(m,(c[l>>2]|0)+35-(c[d>>2]|0)|0)|0;if((m|0)==0){e=0}else{$c(m,b,e);c[m>>2]=568;w=c[d>>2]|0;e=(c[l>>2]|0)-w|0;c[m+28>>2]=e;$t(m+32|0,w|0,e|0)|0;e=m}c[j+4>>2]=0;c[j>>2]=0;cc[c[(c[e>>2]|0)+28>>2]&63](e,j);d=Yg(h,k,j)|0;l=c[d>>2]|0;if((l|0)==0){l=Ft(28)|0;v=j;w=c[v+4>>2]|0;j=l+16|0;c[j>>2]=c[v>>2];c[j+4>>2]=w;c[l+24>>2]=0;j=c[k>>2]|0;c[l>>2]=0;c[l+4>>2]=0;c[l+8>>2]=j;c[d>>2]=l;j=c[c[h>>2]>>2]|0;if((j|0)==0){h=l}else{c[h>>2]=j;h=c[d>>2]|0}Zg(c[g>>2]|0,h);w=b+12|0;c[w>>2]=(c[w>>2]|0)+1}c[l+24>>2]=e;w=e;i=f;return w|0}function Lc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;h=f;g=c[12]|0;if((g|0)==0){c[h>>2]=33224;c[h+4>>2]=8906;c[h+8>>2]=284;$a(8,h|0)|0;jb(1)}j=g+52|0;l=c[j>>2]|0;if((l+32|0)>>>0>(c[g+60>>2]|0)>>>0){m=g+48|0;c[m>>2]=(c[m>>2]|0)+1;c[(c[1320]|0)+16>>2]=0;Ia(33272)|0;m=0;i=f;return m|0}h=At(40)|0;if((h|0)==0){m=0;i=f;return m|0}k=h+0|0;m=k+40|0;do{a[k]=0;k=k+1|0}while((k|0)<(m|0));k=l+40|0;c[j>>2]=k;j=g+44|0;c[j>>2]=(c[j>>2]|0)+1;j=g+56|0;if(k>>>0>(c[j>>2]|0)>>>0){c[j>>2]=k}c[h>>2]=40;c[h+4>>2]=g;m=h+8|0;$c(m,b,d);c[m>>2]=1576;l=h+24|0;c[l>>2]=c[l>>2]&-2097153;c[h+36>>2]=e;i=f;return m|0}function Mc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;j=c[a+12>>2]|0;Nc(b,j)|0;e=b+8|0;f=c[e>>2]|0;h=c[f+16>>2]&255;g=b+(h<<2)+16|0;h=(h|0)==0;if(h){l=1}else{l=1;m=b+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<g>>>0){m=k}else{break}}}if((l|0)==(j|0)){f=c[a+4>>2]|0;e=a+8|0;if((f|0)==(e|0)){i=d;return}b=c[b>>2]|0;do{c[b>>2]=c[f+24>>2];b=b+4|0;g=c[f+4>>2]|0;if((g|0)==0){while(1){g=c[f+8>>2]|0;if((c[g>>2]|0)==(f|0)){f=g;break}else{f=g}}}else{f=g;while(1){g=c[f>>2]|0;if((g|0)==0){break}else{f=g}}}}while((f|0)!=(e|0));i=d;return}if(h){j=1}else{j=1;h=b+16|0;while(1){a=h+4|0;j=ba(c[h>>2]|0,j)|0;if(a>>>0<g>>>0){h=a}else{break}}}f=c[(dc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(f|0)>-1){i=d;return}if((f|0)>0|(j|0)==0){i=d;return}if(!(Md(b,0,j,0,1)|0)){i=d;return}c[b+16>>2]=0;i=d;return}function Nc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=a+8|0;f=c[e>>2]|0;k=c[f+16>>2]&255;g=a+(k<<2)+16|0;if((k|0)==0){k=1}else{k=1;j=a+16|0;while(1){h=j+4|0;k=ba(c[j>>2]|0,k)|0;if(h>>>0<g>>>0){j=h}else{break}}}h=c[(dc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;f=c[e>>2]|0;g=c[f+16>>2]|0;do{if((g&255|0)==1){if((h|0)>-1){if((h|0)<(b|0)){b=f;break}else{a=1}i=d;return a|0}if(!((h|0)!=-2147483648&(b|0)>(0-h|0))){if((k|0)==(b|0)){k=1;i=d;return k|0}if(!(Md(a,ba(c[(c[a+12>>2]|0)+12>>2]|0,b)|0,k,b,1)|0)){b=c[e>>2]|0;g=c[b+16>>2]|0;break}c[a+16>>2]=b;k=1;i=d;return k|0}else{b=f}}else{b=f}}while(0);k=g&255;f=a+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;h=a+16|0;while(1){g=h+4|0;j=ba(c[h>>2]|0,j)|0;if(g>>>0<f>>>0){h=g}else{break}}}b=c[(dc[c[(c[b>>2]|0)+36>>2]&1023](b)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(b|0)>-1){k=0;i=d;return k|0}if((b|0)>0|(j|0)==0){k=0;i=d;return k|0}if(!(Md(a,0,j,0,1)|0)){k=0;i=d;return k|0}c[a+16>>2]=0;k=0;i=d;return k|0}function Oc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;e=i;d=a+8|0;f=c[d>>2]|0;k=c[f+16>>2]&255;g=a+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=a+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}f=c[(dc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;if((c[(c[d>>2]|0)+16>>2]&255|0)!=1){k=0;i=e;return k|0}if((f|0)>-1){k=(f|0)>=(b|0);i=e;return k|0}if((f|0)!=-2147483648&(b|0)>(0-f|0)){k=0;i=e;return k|0}if((j|0)==(b|0)){k=1;i=e;return k|0}if(!(Md(a,ba(c[(c[a+12>>2]|0)+12>>2]|0,b)|0,j,b,1)|0)){k=0;i=e;return k|0}c[a+16>>2]=b;k=1;i=e;return k|0}function Pc(a,b){a=a|0;b=b|0;var d=0;d=i;b=Qc(a,b)|0;if((b|0)==0){a=0;i=d;return a|0}a=c[b>>2]|0;i=d;return a|0}function Qc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;l=c[b+8>>2]|0;j=b+8|0;a:do{if((l|0)!=0){f=c[d+4>>2]|0;g=c[d>>2]|0;h=f-g|0;k=j;b:while(1){c:while(1){m=c[l+20>>2]|0;o=c[l+16>>2]|0;n=m-o|0;if((n|0)==(h|0)){if(o>>>0<m>>>0){p=g}else{break}while(1){q=a[o]|0;n=a[p]|0;if(!(q<<24>>24==n<<24>>24)){break}o=o+1|0;if(!(o>>>0<m>>>0)){break c}else{p=p+1|0}}if(!((q&255)<(n&255))){break}}else{if((n|0)>=(h|0)){break}}l=c[l+4>>2]|0;if((l|0)==0){break b}}m=c[l>>2]|0;if((m|0)==0){k=l;break}else{k=l;l=m}}if((k|0)!=(j|0)){j=c[k+16>>2]|0;l=(c[k+20>>2]|0)-j|0;d:do{if((h|0)==(l|0)){if(g>>>0<f>>>0){while(1){l=a[g]|0;h=a[j]|0;if(!(l<<24>>24==h<<24>>24)){break}g=g+1|0;if(!(g>>>0<f>>>0)){break d}else{j=j+1|0}}if((l&255)<(h&255)){f=20;break a}}}else{if((h|0)<(l|0)){f=20;break a}}}while(0);d=k+24|0;f=22}else{f=20}}else{f=20}}while(0);if((f|0)==20){g=c[b>>2]|0;if((g|0)==0){d=0;f=22}else{q=b+72|0;p=q;p=Yt(c[p>>2]|0,c[p+4>>2]|0,1,0)|0;c[q>>2]=p;c[q+4>>2]=F;d=Qc(g,d)|0}}if((f|0)==22){q=b+64|0;p=q;p=Yt(c[p>>2]|0,c[p+4>>2]|0,1,0)|0;c[q>>2]=p;c[q+4>>2]=F}if((d|0)!=0){i=e;return d|0}q=b+80|0;p=q;p=Yt(c[p>>2]|0,c[p+4>>2]|0,1,0)|0;c[q>>2]=p;c[q+4>>2]=F;i=e;return d|0}function Rc(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+16|0;e=d;b=Qc(a,b)|0;if((b|0)==0){a=0;i=d;return a|0}b=c[b>>2]|0;if((b|0)==0){a=0;i=d;return a|0}b=hc[c[(c[b>>2]|0)+44>>2]&63](b,1)|0;if((b|0)==0){a=0;i=d;return a|0}b=c[b>>2]|0;if((c[(c[b+8>>2]|0)+16>>2]&255|0)!=0){c[e>>2]=33200;c[e+4>>2]=8906;c[e+8>>2]=862;$a(8,e|0)|0;jb(1)}a=c[b>>2]|0;i=d;return a|0}function Sc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+16|0;h=f;g=b+16|0;a:do{if((b|0)!=0){n=c[b+20>>2]|0;l=b+20|0;o=(n|0)==0;m=e+4|0;k=b;b:while(1){do{if(!o){j=c[m>>2]|0;p=c[e>>2]|0;q=j-p|0;r=l;s=n;c:while(1){d:while(1){t=c[s+20>>2]|0;v=c[s+16>>2]|0;u=t-v|0;if((u|0)==(q|0)){if(v>>>0<t>>>0){w=p}else{break}while(1){x=a[v]|0;u=a[w]|0;if(!(x<<24>>24==u<<24>>24)){break}v=v+1|0;if(!(v>>>0<t>>>0)){break d}else{w=w+1|0}}if(!((x&255)<(u&255))){break}}else{if((u|0)>=(q|0)){break}}s=c[s+4>>2]|0;if((s|0)==0){break c}}t=c[s>>2]|0;if((t|0)==0){r=s;break}else{r=s;s=t}}if((r|0)!=(l|0)){s=c[r+16>>2]|0;t=(c[r+20>>2]|0)-s|0;if((q|0)!=(t|0)){if((q|0)<(t|0)){break}else{break b}}if(!(p>>>0<j>>>0)){break b}while(1){t=a[p]|0;q=a[s]|0;if(!(t<<24>>24==q<<24>>24)){break}p=p+1|0;if(!(p>>>0<j>>>0)){break b}else{s=s+1|0}}if(!((t&255)<(q&255))){break b}}}}while(0);k=c[k>>2]|0;if((k|0)==0){break a}}g=b+40|0;if((c[g>>2]|0)!=(d|0)){c[h>>2]=296;c[h+4>>2]=143;c[h+8>>2]=275;$a(8,h|0)|0;jb(1)}x=d+4|0;c[g>>2]=c[x>>2];c[x>>2]=0;Hc(b,d);x=c[r+24>>2]|0;w=b+88|0;c[w>>2]=(c[w>>2]|0)+1;i=f;return x|0}}while(0);j=Yg(g,h,e)|0;k=c[j>>2]|0;if((k|0)==0){k=Ft(28)|0;v=e;w=c[v+4>>2]|0;x=k+16|0;c[x>>2]=c[v>>2];c[x+4>>2]=w;c[k+24>>2]=0;h=c[h>>2]|0;c[k>>2]=0;c[k+4>>2]=0;c[k+8>>2]=h;c[j>>2]=k;h=c[c[g>>2]>>2]|0;if((h|0)==0){g=k}else{c[g>>2]=h;g=c[j>>2]|0}Zg(c[b+20>>2]|0,g);x=b+24|0;c[x>>2]=(c[x>>2]|0)+1}c[k+24>>2]=d;x=d;i=f;return x|0}function Tc(a,b,d){a=a|0;b=b|0;d=d|0;d=i;bu(b|0,0,c[a+12>>2]|0)|0;i=d;return 0}function Uc(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+16|0;h=g;if((c[d+16>>2]&2097152|0)==0){c[h>>2]=392;c[h+4>>2]=143;c[h+8>>2]=526;$a(8,h|0)|0;jb(1)}h=c[d+12>>2]|0;if(((e>>>0)%(h>>>0)|0|0)==0?((f>>>0)%(h>>>0)|0|0)==0:0){if((h|0)==1){a[f]=a[e]|0;i=g;return 0}else if((h|0)==4){c[f>>2]=c[e>>2];i=g;return 0}else if((h|0)==8){h=c[e+4>>2]|0;d=f;c[d>>2]=c[e>>2];c[d+4>>2]=h;i=g;return 0}else if((h|0)==2){b[f>>1]=b[e>>1]|0;i=g;return 0}else{$t(f|0,e|0,h|0)|0;i=g;return 0}}$t(f|0,e|0,h|0)|0;i=g;return 0}function Vc(a,b){a=a|0;b=b|0;var d=0;d=i;bu(b|0,-2,c[a+12>>2]|0)|0;i=d;return 0}function Wc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+32|0;l=e+24|0;g=e+16|0;f=e+8|0;k=e;h=c[b+16>>2]|0;n=h>>>16&31;m=c[d+16>>2]|0;o=m>>>16&31;if((b|0)==(d|0)){q=1;i=e;return q|0}a:do{if((n|0)==3&(o|0)==3){if(((m^h)&255|0)==0){q=hc[c[(c[b>>2]|0)+24>>2]&63](b,0)|0;q=Wc(q,hc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0)|0;i=e;return q|0}}else{if((n|0)==1&(o|0)==1){q=dc[c[(c[b>>2]|0)+16>>2]&1023](b)|0;if((q|0)!=(dc[c[(c[d>>2]|0)+16>>2]&1023](d)|0)){break}if((dc[c[(c[b>>2]|0)+16>>2]&1023](b)|0)<=0){q=1;i=e;return q|0}g=0;while(1){q=hc[c[(c[b>>2]|0)+24>>2]&63](b,g)|0;f=g+1|0;if(!(Wc(q,hc[c[(c[d>>2]|0)+24>>2]&63](d,g)|0)|0)){f=0;j=34;break}if((f|0)<(dc[c[(c[b>>2]|0)+16>>2]&1023](b)|0)){g=f}else{f=1;j=34;break}}if((j|0)==34){i=e;return f|0}}h=f+4|0;c[h>>2]=0;c[f>>2]=0;cc[c[(c[b>>2]|0)+28>>2]&63](b,f);m=k+4|0;c[m>>2]=0;c[k>>2]=0;cc[c[(c[d>>2]|0)+28>>2]&63](d,k);b:do{if((b|0)!=0){n=l+4|0;c:while(1){c[n>>2]=0;c[l>>2]=0;cc[c[(c[b>>2]|0)+28>>2]&63](b,l);q=c[k>>2]|0;p=(c[m>>2]|0)-q|0;o=c[l>>2]|0;if(((c[n>>2]|0)-o|0)==(p|0)){p=o+p|0;while(1){if(!(o>>>0<p>>>0)){f=1;break c}if((a[o]|0)==(a[q]|0)){q=q+1|0;o=o+1|0}else{break}}}b=dc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;if((b|0)==0){break b}}i=e;return f|0}}while(0);l=c[m>>2]|0;m=408;k=c[k>>2]|0;while(1){if(!(k>>>0<l>>>0)){j=21;break}if((a[k]|0)==(a[m]|0)){m=m+1|0;k=k+1|0}else{break}}if((j|0)==21?(a[m]|0)==0:0){q=1;i=e;return q|0}d:do{if((d|0)!=0){j=g+4|0;e:while(1){c[j>>2]=0;c[g>>2]=0;cc[c[(c[d>>2]|0)+28>>2]&63](d,g);m=c[f>>2]|0;k=(c[h>>2]|0)-m|0;l=c[g>>2]|0;if(((c[j>>2]|0)-l|0)==(k|0)){k=l+k|0;while(1){if(!(l>>>0<k>>>0)){f=1;break e}if((a[l]|0)==(a[m]|0)){m=m+1|0;l=l+1|0}else{break}}}d=dc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;if((d|0)==0){break d}}i=e;return f|0}}while(0);g=c[h>>2]|0;h=408;f=c[f>>2]|0;while(1){if(!(f>>>0<g>>>0)){break}if((a[f]|0)==(a[h]|0)){h=h+1|0;f=f+1|0}else{break a}}if((a[h]|0)==0){q=1;i=e;return q|0}}}while(0);q=0;i=e;return q|0}function Xc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+16|0;k=f+8|0;h=f;l=h+4|0;c[l>>2]=0;c[h>>2]=0;cc[c[(c[d>>2]|0)+28>>2]&63](d,h);a:do{if((b|0)!=0){j=k+4|0;m=b;b:while(1){c[j>>2]=0;c[k>>2]=0;cc[c[(c[m>>2]|0)+28>>2]&63](m,k);p=c[h>>2]|0;n=(c[l>>2]|0)-p|0;o=c[k>>2]|0;if(((c[j>>2]|0)-o|0)==(n|0)){n=o+n|0;while(1){if(!(o>>>0<n>>>0)){e=1;break b}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{break}}}m=dc[c[(c[m>>2]|0)+12>>2]&1023](m)|0;if((m|0)==0){break a}}i=f;return e|0}}while(0);k=c[l>>2]|0;j=408;h=c[h>>2]|0;while(1){if(!(h>>>0<k>>>0)){g=11;break}if((a[h]|0)==(a[j]|0)){j=j+1|0;h=h+1|0}else{h=0;break}}if((g|0)==11){h=(a[j]|0)==0}if(h|e^1){p=h;i=f;return p|0}g=c[b+16>>2]|0;h=g>>>16&31;k=c[d+16>>2]|0;j=k>>>16&31;if((h|0)==3&(j|0)==3?((k^g)&255|0)==0:0){p=hc[c[(c[b>>2]|0)+24>>2]&63](b,0)|0;p=Xc(p,hc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0,e)|0;i=f;return p|0}if(!((h+ -9|0)>>>0<2|(h|0)==13|(h|0)==14)){p=0;i=f;return p|0}if(!((j+ -9|0)>>>0<2|(j|0)==13|(j|0)==14)){p=0;i=f;return p|0}p=(c[b+12>>2]|0)==(c[d+12>>2]|0);i=f;return p|0}function Yc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;f=i;g=c[b+4>>2]|0;b=c[b>>2]|0;while(1){if(!(b>>>0<g>>>0)){break}if((a[b]|0)==(a[d]|0)){d=d+1|0;b=b+1|0}else{g=0;e=5;break}}if((e|0)==5){i=f;return g|0}b=(a[d]|0)==0;i=f;return b|0}function Zc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;k=c[b>>2]|0;f=c[b+4>>2]|0;a:do{if(k>>>0<f>>>0){do{j=a[k]|0;if(!((j&255)<127)){break a}b:do{if((a[31128+(j&255)|0]&16)==0){if(!(j<<24>>24==47)){break a}j=k+1|0;if(j>>>0<f>>>0){j=a[j]|0;if(j<<24>>24==47){k=k+2|0;c[b>>2]=k;if(!(k>>>0<f>>>0)){break}while(1){l=a[k]|0;if(l<<24>>24==10|l<<24>>24==13){break b}k=k+1|0;c[b>>2]=k;if(!(k>>>0<f>>>0)){break b}}}else if(!(j<<24>>24==42)){break}j=k+2|0;c[b>>2]=j;l=k+3|0;c:do{if(l>>>0<f>>>0){while(1){if((a[j]|0)==42){k=j+1|0;if((a[l]|0)==47){break c}else{j=k}}else{j=j+1|0}c[b>>2]=j;l=j+1|0;if(!(l>>>0<f>>>0)){h=13;break}}}else{h=13}}while(0);if((h|0)==13){h=0;k=j+1|0}if(k>>>0<f>>>0){k=j+2|0;c[b>>2]=k;break}else{c[b>>2]=k;break}}}else{k=k+1|0;c[b>>2]=k}}while(0)}while(k>>>0<f>>>0)}}while(0);if(!(k>>>0<f>>>0)){l=0;i=g;return l|0}if((d[k]|0)!=(e<<24>>24|0)){l=0;i=g;return l|0}c[b>>2]=k+1;l=1;i=g;return l|0}function _c(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+32|0;h=j;l=j+16|0;r=c[b+16>>2]|0;if((r&2031616|0)==196608){if((r&255|0)!=0){c[f>>2]=0;t=0;i=j;return t|0}k=c[e>>2]|0;if((c[(c[k+8>>2]|0)+16>>2]&255|0)!=0){c[h>>2]=33200;c[h+4>>2]=8906;c[h+8>>2]=862;$a(8,h|0)|0;jb(1)}t=_c(c[k+12>>2]|0,d,c[k>>2]|0,f,g)|0;i=j;return t|0}g=h+4|0;c[g>>2]=0;c[h>>2]=0;p=l+4|0;q=c[d>>2]|0;d=c[d+4>>2]|0;c[l>>2]=q;c[p>>2]=d;a:do{if((d-q|0)<=0){if((b|0)!=0){m=r;o=0;n=b;k=10}}else{r=0;do{b:do{if(q>>>0<d>>>0){t=q;while(1){s=t+1|0;if((a[t]|0)==46){s=t;break b}if(s>>>0<d>>>0){t=s}else{break}}}else{s=q}}while(0);c[h>>2]=q;c[g>>2]=s;c[l>>2]=s;c[p>>2]=d;b=hc[c[(c[b>>2]|0)+20>>2]&63](b,h)|0;if((b|0)==0){break a}r=(dc[c[(c[b>>2]|0)+40>>2]&1023](b)|0)+r|0;Zc(l,46)|0;d=c[p>>2]|0;q=c[l>>2]|0}while((d-q|0)>0);m=c[b+16>>2]|0;o=r;n=b;k=10}}while(0);if((k|0)==10?(m&4194304|0)!=0:0){c[f>>2]=e+o;t=n;i=j;return t|0}c[f>>2]=0;t=0;i=j;return t|0}function $c(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;g=i;i=i+16|0;f=g;c[b>>2]=328;c[b+8>>2]=d;if((b|0)==0){c[f>>2]=280;c[f+4>>2]=143;c[f+8>>2]=268;$a(8,f|0)|0;jb(1)}else{k=d+40|0;c[b+4>>2]=c[k>>2];c[k>>2]=b;k=b+12|0;c[k>>2]=0;h=b+16|0;j=c[h>>2]|0;f=b+20|0;d=a[f]&-8;a[f]=d;j=j&-2113929216|2097152;c[h>>2]=j;c[b>>2]=424;c[b+24>>2]=e;c[k>>2]=c[e+12>>2];b=e+16|0;j=j|c[b>>2]&65280;c[h>>2]=j;j=j|c[b>>2]&255;c[h>>2]=j;j=j&-2113863681|c[b>>2]&2097152;c[h>>2]=j;j=j|c[b>>2]&4194304;c[h>>2]=j;j=j|c[b>>2]&16777216;c[h>>2]=j;j=j|c[b>>2]&134217728;c[h>>2]=j;j=j|c[b>>2]&67108864;c[h>>2]=j;j=j&-2031617|c[b>>2]&2031616;c[h>>2]=j;c[h>>2]=j&-8388609|c[b>>2]&8388608;a[f]=d|a[e+20|0]&7;i=g;return}}function ad(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;h=i;i=i+32|0;g=h;j=h+16|0;k=c[12]|0;if((k|0)==0){c[g>>2]=33224;c[g+4>>2]=8906;c[g+8>>2]=284;$a(8,g|0)|0;jb(1)}else{l=b+4|0;k=Ec(k,(c[l>>2]|0)+39-(c[b>>2]|0)|0)|0;$c(k,a,d);c[k>>2]=496;g=c[b>>2]|0;d=(c[l>>2]|0)-g|0;c[k+32>>2]=d;$t(k+36|0,g|0,d|0)|0;g=k+16|0;c[g>>2]=c[g>>2]&-1879048193|e<<28&1879048192;c[k+28>>2]=f;c[j>>2]=k+12;c[j+4>>2]=k+d+36;f=Sc(a,k,j)|0;i=h;return f|0}return 0}function bd(a){a=a|0;return c[a+32>>2]|0}function cd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;h=c[d+4>>2]|0;d=c[d>>2]|0;if((h|0)==(d|0)){n=0;i=f;return n|0}g=c[b+32>>2]|0;if((g|0)==0){n=0;i=f;return n|0}h=h-d|0;k=b+36|0;a:while(1){m=c[k>>2]|0;if((h|0)==(c[m+32>>2]|0)){n=d+h|0;l=m+36|0;j=d;while(1){if(!(j>>>0<n>>>0)){break a}if((a[j]|0)==(a[l]|0)){l=l+1|0;j=j+1|0}else{break}}}k=k+4|0;if((k|0)==(b+(g<<2)+36|0)){b=0;e=10;break}}if((e|0)==10){i=f;return b|0}n=m;i=f;return n|0}function dd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d;if((b|0)<0){f=0;i=d;return f|0}f=c[a+32>>2]|0;if((f|0)<=(b|0)){f=0;i=d;return f|0}if((f|0)<(b|0)){c[e>>2]=9008;c[e+4>>2]=8906;c[e+8>>2]=307;$a(8,e|0)|0;jb(1)}f=c[a+(b<<2)+36>>2]|0;i=d;return f|0}function ed(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;g=f;h=c[12]|0;if((h|0)==0){c[g>>2]=33224;c[g+4>>2]=8906;c[g+8>>2]=284;$a(8,g|0)|0;jb(1)}j=h+52|0;l=c[j>>2]|0;if((l+28|0)>>>0>(c[h+60>>2]|0)>>>0){m=h+48|0;c[m>>2]=(c[m>>2]|0)+1;c[(c[1320]|0)+16>>2]=0;Ia(33272)|0;m=0;i=f;return m|0}g=At(36)|0;if((g|0)==0){m=0;i=f;return m|0}m=g+0|0;k=m+36|0;do{a[m]=0;m=m+1|0}while((m|0)<(k|0));k=l+36|0;c[j>>2]=k;j=h+44|0;c[j>>2]=(c[j>>2]|0)+1;j=h+56|0;if(k>>>0>(c[j>>2]|0)>>>0){c[j>>2]=k}c[g>>2]=36;c[g+4>>2]=h;h=g+8|0;c[g+16>>2]=b;b=b+40|0;c[g+12>>2]=c[b>>2];c[b>>2]=h;c[g+20>>2]=0;b=g+24|0;j=c[b>>2]|0;m=g+28|0;a[m]=a[m]&-8;j=j&-2113929216;c[b>>2]=j|2097152;c[h>>2]=768;if((d|0)==-2147483648){d=0}else{d=(d|0)<0?0-d|0:d}c[g+32>>2]=d;g=j|e<<16&2031616;c[b>>2]=g|14680064;if((e|0)==4){c[b>>2]=g|81788928;m=h;i=f;return m|0}else if((e|0)==0){if((d|0)<=0){m=h;i=f;return m|0}c[b>>2]=g|10485760;m=h;i=f;return m|0}else{m=h;i=f;return m|0}return 0}function fd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+16|0;h=g;c[b>>2]=328;c[b+8>>2]=d;if((b|0)==0){c[h>>2]=280;c[h+4>>2]=143;c[h+8>>2]=268;$a(8,h|0)|0;jb(1)}j=d+40|0;c[b+4>>2]=c[j>>2];c[j>>2]=b;j=b+12|0;c[j>>2]=0;h=b+16|0;n=c[h>>2]|0;d=b+20|0;m=a[d]&-8;a[d]=m;n=n&-2113929216|2097152;c[h>>2]=n;c[b>>2]=7944;k=b+32|0;c[k>>2]=f;c[b+28>>2]=0;l=b+36|0;$t(l|0,e|0,f<<2|0)|0;c[b>>2]=840;if((f|0)==0){o=0;p=m;k=0;f=0;l=0;m=1;c[j>>2]=0;e=b+24|0;c[e>>2]=k;m=m&1;m=m<<21;n=n&-100663296;f=f&1;f=f<<24;l=l&1;l=l<<26;l=f|l;m=l|m;n=m|n;o=n|o;o=o|12582912;c[h>>2]=o;p=p&-8;a[d]=p;i=g;return}else{f=0;m=0;n=0;e=1}do{p=c[l>>2]|0;c[p+28>>2]=f;f=(dc[c[(c[p>>2]|0)+60>>2]&1023](p)|0)+f|0;p=c[p+16>>2]|0;e=e&(p&2097152|0)!=0;m=m|(p&16777216|0)!=0;n=n|(p&67108864|0)!=0;l=l+4|0;o=c[k>>2]|0}while((l|0)!=(b+(o<<2)+36|0));k=c[h>>2]|0;o=(o|0)>1?65536:p&2031616;p=a[d]|0;q=f;f=m;l=n;m=e;c[j>>2]=0;n=b+24|0;c[n>>2]=q;m=m&1;m=m<<21;n=k&-100663296;f=f&1;f=f<<24;l=l&1;l=l<<26;l=f|l;m=l|m;n=m|n;o=n|o;o=o|12582912;c[h>>2]=o;p=p&-8;a[d]=p;i=g;return}function gd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;j=b+12|0;c[j>>2]=(c[j>>2]|0)+1;j=e+16|0;k=b+25|0;a[k]=(c[j>>2]|0)>>>22&(d[k]|0);k=c[e+12>>2]|0;f=b+24|0;a[f]=d[f]|0|(c[j>>2]|0)>>>27&1;l=b+26|0;a[l]=(c[j>>2]|0)>>>21&(d[l]|0);if((k|0)==0){k=c[b+4>>2]|0;l=dc[c[(c[e>>2]|0)+60>>2]&1023](e)|0;k=c[k+28>>2]|0;k=(l+ -1+k|0)/(k|0)|0;if((k|0)>=2){if((k|0)<4){j=2}else{j=(k|0)<8?4:8}}else{j=1}}else{j=(c[j>>2]|0)>>>8&255}e=b+16|0;l=c[e>>2]|0;c[e>>2]=(l|0)>(j|0)?l:j;e=b+8|0;b=c[e>>2]|0;if((j|0)!=0?(h=(b|0)%(j|0)|0,(h|0)!=0):0){h=b+j-h|0}else{h=b}a[f]=d[f]|0|(h|0)!=(b|0);c[e>>2]=h+k;i=g;return h|0}function hd(b){b=b|0;var e=0,f=0,g=0,h=0,j=0;g=i;f=c[b+8>>2]|0;e=b+20|0;c[e>>2]=f;h=c[b+16>>2]|0;if((h|0)!=0?(j=(f|0)%(h|0)|0,(j|0)!=0):0){h=h+f-j|0}else{h=f}c[e>>2]=h;j=b+24|0;a[j]=d[j]|0|(h|0)!=(f|0);i=g;return}function id(b,e){b=b|0;e=e|0;var f=0;f=b+25|0;a[f]=(c[e+16>>2]|0)>>>22&(d[f]|0);b=b+12|0;e=c[b>>2]|0;c[b>>2]=e+1;return(e<<2)+4|0}function jd(a){a=a|0;c[a+20>>2]=(c[a+12>>2]<<2)+4;return}function kd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;j=f;g=b+25|0;a[g]=(c[e+16>>2]|0)>>>22&(d[g]|0);g=b+12|0;h=c[g>>2]|0;if((h|0)==0){c[b+20>>2]=c[e+12>>2];e=h+1|0;c[g>>2]=e;i=f;return 0}if((c[b+20>>2]|0)==(c[e+12>>2]|0)){e=h+1|0;c[g>>2]=e;i=f;return 0}else{c[j>>2]=904;c[j+4>>2]=143;c[j+8>>2]=960;$a(8,j|0)|0;jb(1)}return 0}function ld(a){a=a|0;return}function md(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=i;i=i+48|0;o=h;g=h+12|0;c[b>>2]=328;q=b+8|0;c[q>>2]=d;if((b|0)==0){c[o>>2]=280;c[o+4>>2]=143;c[o+8>>2]=268;$a(8,o|0)|0;jb(1)}d=d+40|0;c[b+4>>2]=c[d>>2];c[d>>2]=b;d=b+12|0;c[d>>2]=0;j=b+16|0;p=c[j>>2]|0;r=b+20|0;a[r]=a[r]&-8;c[j>>2]=p&-2113929216|2097152;c[b>>2]=7944;p=b+32|0;c[p>>2]=f;c[b+28>>2]=0;r=b+36|0;$t(r|0,e|0,f<<2|0)|0;c[b>>2]=952;c[g+4>>2]=c[q>>2];q=g+8|0;s=g+26|0;c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[q+12>>2]=0;a[q+16|0]=0;a[s]=1;a[g+25|0]=1;c[g>>2]=8056;if((f|0)!=0){e=0;f=0;do{s=c[r>>2]|0;t=gd(g,s)|0;if((c[s+28>>2]|0)!=(t|0)){n=6;break}m=c[s+16>>2]|0;e=e|(m&16777216|0)!=0;f=f|(m&67108864|0)!=0;r=r+4|0;k=c[p>>2]|0}while((r|0)!=(b+(k<<2)+36|0));if((n|0)==6){c[o>>2]=1016;c[o+4>>2]=143;c[o+8>>2]=998;$a(8,o|0)|0;jb(1)}b=(m&8388608|0)==0;n=m&2031616;p=c[q>>2]|0;m=g+16|0;q=c[m>>2]|0;o=g+20|0;c[o>>2]=p;if((q|0)!=0?(l=(p|0)%(q|0)|0,(l|0)!=0):0){l=q+p-l|0}else{l=p}}else{o=g+20|0;c[o>>2]=0;l=0;m=g+16|0;p=0;k=0;n=0;e=0;f=0;b=1}c[o>>2]=l;t=g+24|0;s=c[t>>2]|0;r=s|(l|0)!=(p|0);a[t]=r;t=c[j>>2]&-226492161|s<<14&851443712|c[m>>2]<<8&65280;c[d>>2]=l;c[j>>2]=r<<27|(f&1)<<26|(s<<5&333447168|(e&1)<<24|t)|((k|0)!=1|b?65536:n);i=h;return}function nd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;d=i;if((c[a+16>>2]&18874368|0)==2097152){bu(b|0,0,c[a+12>>2]|0)|0;i=d;return 0}e=a+32|0;if((c[e>>2]|0)==0){i=d;return 0}f=a+36|0;do{g=c[f>>2]|0;h=c[g+16>>2]|0;if((h&2097152|0)==0?(h&1342177280|0)==268435456|(h&1610612736|0)==536870912:0){bu(b+(c[g+28>>2]|0)|0,0,c[g+12>>2]|0)|0}else{$b[c[(c[g>>2]|0)+48>>2]&63](g,b+(c[g+28>>2]|0)|0,0)|0}f=f+4|0}while((f|0)!=(a+(c[e>>2]<<2)+36|0));i=d;return 0}function od(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;if((c[a+16>>2]&2097152|0)!=0){bu(b|0,-2,c[a+12>>2]|0)|0;i=d;return 0}e=a+32|0;g=c[e>>2]|0;if((g|0)==0){i=d;return 0}f=a+36|0;do{h=c[f>>2]|0;j=c[h+16>>2]|0;if(!((j&1342177280|0)==268435456|(j&1610612736|0)==536870912)){hc[c[(c[h>>2]|0)+56>>2]&63](h,b+(c[h+28>>2]|0)|0)|0;g=c[e>>2]|0}f=f+4|0}while((f|0)!=(a+(g<<2)+36|0));i=d;return 0}function pd(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;if((c[d+16>>2]&2097152|0)==0){h=d+32|0;if((c[h>>2]|0)==0){i=g;return 0}j=d+36|0;do{l=c[j>>2]|0;k=c[l+28>>2]|0;$b[c[(c[l>>2]|0)+52>>2]&63](l,e+k|0,f+k|0)|0;j=j+4|0}while((j|0)!=(d+(c[h>>2]<<2)+36|0));i=g;return 0}d=c[d+12>>2]|0;if(((e>>>0)%(d>>>0)|0|0)==0?((f>>>0)%(d>>>0)|0|0)==0:0){if((d|0)==1){a[f]=a[e]|0;i=g;return 0}else if((d|0)==8){j=e;k=c[j+4>>2]|0;l=f;c[l>>2]=c[j>>2];c[l+4>>2]=k;i=g;return 0}else if((d|0)==4){c[f>>2]=c[e>>2];i=g;return 0}else if((d|0)==2){b[f>>1]=b[e>>1]|0;i=g;return 0}else{$t(f|0,e|0,d|0)|0;i=g;return 0}}$t(f|0,e|0,d|0)|0;i=g;return 0}function qd(b,d){b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;if((d|0)==1){f=c[b+12>>2]|0;if((c[b+16>>2]&18874368|0)==2097152&(f|0)<128){c[b+28>>2]=632;d=632;i=e;return d|0}else{d=b+20|0;a[d]=a[d]|8;f=Ec(c[b+8>>2]|0,f)|0;d=b+28|0;c[d>>2]=f;$b[c[(c[b>>2]|0)+48>>2]&63](b,f,0)|0;d=c[d>>2]|0;i=e;return d|0}}else if((d|0)!=4){if((d&-2|0)==2){c[f>>2]=1048;c[f+4>>2]=143;c[f+8>>2]=1102;$a(8,f|0)|0;jb(1)}else{d=0;i=e;return d|0}}else{b=c[b+28>>2]|0;i=e;return((b|0)==632?0:b)|0}return 0}function rd(a){a=a|0;var b=0,d=0;b=i;c[a>>2]=952;d=c[a+28>>2]|0;if((d|0)==0|(d|0)==632){Gt(a);i=b;return}Hc(c[a+8>>2]|0,d);Gt(a);i=b;return}function sd(a){a=a|0;var b=0,d=0,e=0;b=i;c[a>>2]=952;e=a+28|0;d=c[e>>2]|0;if((d|0)==0|(d|0)==632){i=b;return}Hc(c[a+8>>2]|0,d);c[e>>2]=0;i=b;return}function td(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;h=f;g=c[12]|0;if((g|0)==0){c[h>>2]=33224;c[h+4>>2]=8906;c[h+8>>2]=284;$a(8,h|0)|0;jb(1)}k=e<<2;g=Ec(g,k+36|0)|0;if((g|0)==0){m=0;i=f;return m|0}c[g+8>>2]=b;j=b+40|0;c[g+4>>2]=c[j>>2];c[j>>2]=g;j=g+12|0;c[j>>2]=0;b=g+16|0;h=c[b>>2]|0;l=g+20|0;a[l]=a[l]&-8;h=h&-2113929216;c[b>>2]=h|2097152;c[g+32>>2]=e;c[g+28>>2]=0;l=g+36|0;$t(l|0,d|0,k|0)|0;c[g>>2]=1064;if((e|0)>0){k=c[l>>2]|0;d=c[k+16>>2]|0;l=d&65280;k=c[k+12>>2]|0;e=d&2031616;m=d&2097152;d=d&4194304}else{l=0;k=0;e=0;m=2097152;d=4194304}c[j>>2]=k;c[b>>2]=e|h|d|l|m;m=g;i=f;return m|0}function ud(a,b){a=a|0;b=b|0;var d=0;d=i;if((c[a+32>>2]|0)<=0){b=0;i=d;return b|0}a=c[a+36>>2]|0;b=hc[c[(c[a>>2]|0)+44>>2]&63](a,b)|0;i=d;return b|0}function vd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;if((c[a+32>>2]|0)<=0){d=0;i=e;return d|0}a=c[a+36>>2]|0;d=$b[c[(c[a>>2]|0)+48>>2]&63](a,b,d)|0;i=e;return d|0}function wd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;if((c[a+32>>2]|0)<=0){d=0;i=e;return d|0}a=c[a+36>>2]|0;d=$b[c[(c[a>>2]|0)+52>>2]&63](a,b,d)|0;i=e;return d|0}function xd(a,b){a=a|0;b=b|0;var d=0;d=i;if((c[a+32>>2]|0)<=0){b=0;i=d;return b|0}a=c[a+36>>2]|0;b=hc[c[(c[a>>2]|0)+56>>2]&63](a,b)|0;i=d;return b|0}function yd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+32|0;j=f;g=f+16|0;h=c[12]|0;if((h|0)==0){c[j>>2]=33224;c[j+4>>2]=8906;c[j+8>>2]=284;$a(8,j|0)|0;jb(1)}j=d<<2;h=Ec(h,j+32|0)|0;if((h|0)==0){h=0}else{$c(h,a,b);c[h>>2]=1136;c[h+12>>2]=4;b=h+16|0;k=d&255|c[b>>2]&-29360128|197632;c[b>>2]=k;c[b>>2]=k&-96271105|c[(c[h+24>>2]|0)+16>>2]&67108864;$t(h+32|0,e|0,j|0)|0}c[g>>2]=h+12;c[g+4>>2]=h+(d<<2)+32;k=Sc(a,h,g)|0;i=f;return k|0}function zd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+16|0;g=e;f=c[b>>2]|0;if((f|0)==0){f=(d|0)==0?a:d;d=c[12]|0;if((d|0)==0){c[g>>2]=33224;c[g+4>>2]=8906;c[g+8>>2]=284;$a(8,g|0)|0;jb(1)}g=f+16|0;d=Ec(d,(c[g>>2]<<3&2040)+16|0)|0;if((d|0)==0){c[b>>2]=0;j=1;i=e;return j|0}Id(d,f);c[b>>2]=d;if((c[g>>2]&16777216|0)==0){j=0;i=e;return j|0}h=c[(c[a>>2]|0)+52>>2]|0;j=hc[c[(c[f>>2]|0)+44>>2]&63](f,1)|0;j=$b[h&63](a,j,b)|0;i=e;return j|0}b=f+8|0;a=c[b>>2]|0;j=c[a+16>>2]&255;d=f+(j<<2)+16|0;if((j|0)==0){j=1}else{j=1;h=f+16|0;while(1){g=h+4|0;j=ba(c[h>>2]|0,j)|0;if(g>>>0<d>>>0){h=g}else{break}}}a=dc[c[(c[a>>2]|0)+36>>2]&1023](a)|0;if((c[(c[b>>2]|0)+16>>2]&255|0)!=1){j=1;i=e;return j|0}if((c[a>>2]|0)>-1|(j|0)==0){j=0;i=e;return j|0}if(!(Md(f,0,j,0,1)|0)){j=1;i=e;return j|0}c[f+16>>2]=0;j=0;i=e;return j|0}function Ad(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;a=i;i=i+16|0;e=a;h=c[b>>2]|0;d=c[d>>2]|0;if((h|0)==0&(d|0)==0){t=0;i=a;return t|0}b=c[h+12>>2]|0;f=d+12|0;j=c[f>>2]|0;do{if((j|0)!=(b|0)?(c[j+16>>2]&67108864|0)!=0:0){if((c[(c[d+8>>2]|0)+16>>2]&255|0)==0){hc[c[(c[j>>2]|0)+56>>2]&63](j,c[d>>2]|0)|0;c[f>>2]=b;Ld(d,c[b+12>>2]|0,0)|0;t=c[f>>2]|0;$b[c[(c[t>>2]|0)+48>>2]&63](t,c[d>>2]|0,0)|0;break}else{c[e>>2]=1048;c[e+4>>2]=143;c[e+8>>2]=1575;$a(8,e|0)|0;jb(1)}}}while(0);e=d+8|0;m=(c[e>>2]|0)+16|0;p=c[m>>2]|0;n=p&255;k=h+8|0;if((n|0)!=(c[(c[k>>2]|0)+16>>2]&255|0)){t=1;i=a;return t|0}j=h+16|0;l=h+(n<<2)+16|0;o=c[(c[f>>2]|0)+12>>2]|0;f=d+16|0;r=d+(n<<2)+16|0;if((n|0)==0){n=1}else{n=1;q=f;while(1){p=q+4|0;n=ba(c[q>>2]|0,n)|0;if(p>>>0<r>>>0){q=p}else{p=f;q=j;break}}while(1){s=r+4|0;c[r>>2]=o;t=c[q>>2]|0;do{if(!((t|0)==-2147483648)){if((t|0)>-1){r=t;o=ba(t,o)|0;break}else{r=0;o=ba(t,0-o|0)|0;break}}else{r=0;o=0}}while(0);c[p>>2]=r;q=q+4|0;if(q>>>0<l>>>0){p=p+4|0;r=s}else{break}}p=c[m>>2]|0}t=p&255;m=d+(t<<2)+16|0;if((t|0)==0){p=1}else{p=1;q=f;while(1){l=q+4|0;p=ba(c[q>>2]|0,p)|0;if(l>>>0<m>>>0){q=l}else{break}}}if(!(Md(d,o,n,p,1)|0)){t=1;i=a;return t|0}if((c[b+16>>2]&2097152|0)!=0){t=c[(c[k>>2]|0)+16>>2]&255;e=h+(t<<2)+16|0;if((t|0)==0){g=1}else{g=1;while(1){f=j+4|0;g=ba(c[j>>2]|0,g)|0;if(f>>>0<e>>>0){j=f}else{break}}}t=ba(c[b+12>>2]|0,g)|0;au(c[d>>2]|0,c[h>>2]|0,t|0)|0;t=0;i=a;return t|0}m=c[h>>2]|0;n=c[d>>2]|0;l=c[b+12>>2]|0;t=c[(c[k>>2]|0)+16>>2]&255;h=h+(t<<2)+16|0;if((t|0)!=0){k=1;while(1){o=j+4|0;j=ba(c[j>>2]|0,k)|0;if(o>>>0<h>>>0){k=j;j=o}else{break}}if((j|0)<=0){t=0;i=a;return t|0}}else{j=1}k=0;while(1){h=$b[c[(c[b>>2]|0)+52>>2]&63](b,m,n)|0;if((h|0)!=0){break}k=k+1|0;if((k|0)<(j|0)){n=n+l|0;m=m+l|0}else{d=0;g=35;break}}if((g|0)==35){i=a;return d|0}b=c[e>>2]|0;t=c[b+16>>2]&255;j=d+(t<<2)+16|0;if((t|0)==0){l=1}else{l=1;k=f;while(1){g=k+4|0;l=ba(c[k>>2]|0,l)|0;if(g>>>0<j>>>0){k=g}else{break}}}b=c[(dc[c[(c[b>>2]|0)+36>>2]&1023](b)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(b|0)>-1){t=h;i=a;return t|0}if((b|0)>0|(l|0)==0){t=h;i=a;return t|0}if(!(Md(d,0,l,0,1)|0)){t=h;i=a;return t|0}c[f>>2]=0;t=h;i=a;return t|0}function Bd(a,b){a=a|0;b=b|0;var d=0;a=i;d=c[b>>2]|0;if((d|0)==0){i=a;return 0}c[b>>2]=0;Cd(d);i=a;return 0}function Cd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+16|0;b=d;e=c[a+12>>2]|0;if((e|0)==0){c[b>>2]=1696;c[b+4>>2]=143;c[b+8>>2]=1497;$a(8,b|0)|0;jb(1)}j=c[(c[a+8>>2]|0)+16>>2]&255;f=a+(j<<2)+16|0;if((j|0)==0){j=1}else{j=1;h=a+16|0;while(1){g=h+4|0;j=ba(c[h>>2]|0,j)|0;if(g>>>0<f>>>0){h=g}else{break}}}g=c[a>>2]|0;f=c[e+12>>2]|0;j=ba(f,j)|0;if((c[e+16>>2]&2097152|0)==0){h=g+j|0;if((j|0)>0){do{hc[c[(c[e>>2]|0)+56>>2]&63](e,g)|0;g=g+f|0}while(g>>>0<h>>>0)}}else{bu(g|0,0,j|0)|0}Jd(a);e=c[12]|0;if((e|0)==0){c[b>>2]=33224;c[b+4>>2]=8906;c[b+8>>2]=284;$a(8,b|0)|0;jb(1)}else{Hc(e,a);i=d;return}}function Dd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;do{if((d|0)==4){d=b+28|0}else if((d|0)==1){d=b+28|0;if((c[d>>2]|0)==0){f=c[12]|0;c[12]=c[b+8>>2];g=b+20|0;a[g]=a[g]|8;$b[c[(c[b>>2]|0)+48>>2]&63](b,d,0)|0;c[12]=f;break}else{break}}else{d=0}}while(0);i=e;return d|0}function Ed(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;j=i;i=i+16|0;g=j;c[b>>2]=328;c[b+8>>2]=d;if((b|0)==0){c[g>>2]=280;c[g+4>>2]=143;c[g+8>>2]=268;$a(8,g|0)|0;jb(1)}k=d+40|0;c[b+4>>2]=c[k>>2];c[k>>2]=b;k=b+12|0;c[k>>2]=0;l=b+16|0;o=c[l>>2]|0;d=b+20|0;a[d]=a[d]&-8;o=o&-2113929216|2097152;c[l>>2]=o;c[b>>2]=7944;d=b+32|0;c[d>>2]=f;c[b+28>>2]=0;n=b+36|0;$t(n|0,e|0,f<<2|0)|0;c[b>>2]=1208;if((f|0)==0){r=o;o=4;p=0;q=1;c[k>>2]=o;q=q&1;q=q<<21;r=r&-75497217;r=r|131072;p=p&1;p=p<<26;q=p|q;r=q|r;r=r|4195328;c[l>>2]=r;i=j;return}else{f=4;e=0;p=1}while(1){q=c[n>>2]|0;if((c[q+28>>2]|0)!=(f|0)){h=5;break}o=q+16|0;m=(c[o>>2]|0)>>>28;r=m&7;do{if(!((r+ -1|0)>>>0<5)){if((r|0)==6){if((c[q+12>>2]|0)<5){m=p;q=4;break}Ia(33456)|0;q=0;h=12;break}else if((r|0)==0){Ia(33400)|0;m=p;q=0;break}else{c[g>>2]=r;$a(1304,g|0)|0;q=0;h=12;break}}else{q=4;h=12}}while(0);if((h|0)==12){h=0;if((m&6|0)==4){m=p&(c[o>>2]&2097152|0)!=0}else{m=p}}f=q+f|0;e=e|(c[o>>2]&67108864|0)!=0;n=n+4|0;if((n|0)==(b+(c[d>>2]<<2)+36|0)){break}else{p=m}}if((h|0)==5){c[g>>2]=1272;c[g+4>>2]=143;c[g+8>>2]=1354;$a(8,g|0)|0;jb(1)}r=c[l>>2]|0;o=f;p=e;q=m;c[k>>2]=o;q=q&1;q=q<<21;r=r&-75497217;r=r|131072;p=p&1;p=p<<26;q=p|q;r=q|r;r=r|4195328;c[l>>2]=r;i=j;return}function Fd(a,b){a=a|0;b=b|0;var d=0,e=0;e=i;i=i+16|0;d=e;if((b&-2|0)==2){c[d>>2]=1048;c[d+4>>2]=143;c[d+8>>2]=1412;$a(8,d|0)|0;jb(1)}else{i=e;return a+28|0}return 0}function Gd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((c[a+16>>2]&2097152|0)==0){f=c[a+24>>2]|0;$b[c[(c[f>>2]|0)+48>>2]&63](f,b,d)|0}f=c[a>>2]|0;d=c[f+52>>2]|0;f=hc[c[f+44>>2]&63](a,1)|0;f=$b[d&63](a,f,b)|0;i=e;return f|0}function Hd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;g=e;f=c[12]|0;if((f|0)==0){c[g>>2]=33224;c[g+4>>2]=8906;c[g+8>>2]=284;$a(8,g|0)|0;jb(1)}h=f+52|0;j=c[h>>2]|0;if((j+28|0)>>>0>(c[f+60>>2]|0)>>>0){l=f+48|0;c[l>>2]=(c[l>>2]|0)+1;c[(c[1320]|0)+16>>2]=0;Ia(33272)|0;l=0;i=e;return l|0}g=At(36)|0;if((g|0)==0){l=0;i=e;return l|0}l=g+0|0;k=l+36|0;do{a[l]=0;l=l+1|0}while((l|0)<(k|0));j=j+36|0;c[h>>2]=j;h=f+44|0;c[h>>2]=(c[h>>2]|0)+1;h=f+56|0;if(j>>>0>(c[h>>2]|0)>>>0){c[h>>2]=j}c[g>>2]=36;c[g+4>>2]=f;l=g+8|0;$c(l,b,d);c[l>>2]=1432;i=e;return l|0}function Id(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+16|0;g=d;f=a+8|0;c[f>>2]=b;e=a+12|0;c[e>>2]=hc[c[(c[b>>2]|0)+24>>2]&63](b,0)|0;if((c[a>>2]|0)!=0){c[g>>2]=1640;c[g+4>>2]=143;c[g+8>>2]=1489;$a(8,g|0)|0;jb(1)}if((c[a+4>>2]|0)!=0){c[g>>2]=1672;c[g+4>>2]=143;c[g+8>>2]=1490;$a(8,g|0)|0;jb(1)}g=c[b+16>>2]&255;k=dc[c[(c[b>>2]|0)+36>>2]&1023](b)|0;b=(c[f>>2]|0)+16|0;j=c[b>>2]|0;if((j&255|0)!=(g|0)){i=d;return}f=k+(g<<2)|0;h=c[(c[e>>2]|0)+12>>2]|0;e=a+16|0;l=a+(g<<2)+16|0;if((g|0)==0){g=1}else{g=1;m=e;while(1){j=m+4|0;g=ba(c[m>>2]|0,g)|0;if(j>>>0<l>>>0){m=j}else{j=e;break}}while(1){m=l+4|0;c[l>>2]=h;n=c[k>>2]|0;do{if(!((n|0)==-2147483648)){if((n|0)>-1){l=n;h=ba(n,h)|0;break}else{l=0;h=ba(n,0-h|0)|0;break}}else{l=0;h=0}}while(0);c[j>>2]=l;k=k+4|0;if(k>>>0<f>>>0){j=j+4|0;l=m}else{break}}j=c[b>>2]|0}n=j&255;f=a+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;while(1){b=e+4|0;j=ba(c[e>>2]|0,j)|0;if(b>>>0<f>>>0){e=b}else{break}}}Md(a,h,g,j,0)|0;i=d;return}function Jd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;f=b;d=c[a>>2]|0;e=a+4|0;g=(c[e>>2]|0)==0;if((d|0)==0){if(g){i=b;return}else{c[f>>2]=1672;c[f+4>>2]=143;c[f+8>>2]=1557;$a(8,f|0)|0;jb(1)}}if(g){c[f>>2]=1744;c[f+4>>2]=143;c[f+8>>2]=1552;$a(8,f|0)|0;jb(1)}g=c[12]|0;if((g|0)==0){c[f>>2]=33224;c[f+4>>2]=8906;c[f+8>>2]=284;$a(8,f|0)|0;jb(1)}Hc(g,d);c[a>>2]=0;c[e>>2]=0;i=b;return}function Kd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;f=d;if(!((b|0)>-1)){c[f>>2]=1728;c[f+4>>2]=143;c[f+8>>2]=1507;$a(8,f|0)|0;jb(1)}if((c[a>>2]|0)!=0){c[f>>2]=1640;c[f+4>>2]=143;c[f+8>>2]=1508;$a(8,f|0)|0;jb(1)}e=a+4|0;if((c[e>>2]|0)!=0){c[f>>2]=1672;c[f+4>>2]=143;c[f+8>>2]=1509;$a(8,f|0)|0;jb(1)}if((b|0)==0){c[e>>2]=0;c[a>>2]=0;g=1;i=d;return g|0}g=c[12]|0;if((g|0)==0){c[f>>2]=33224;c[f+4>>2]=8906;c[f+8>>2]=284;$a(8,f|0)|0;jb(1)}f=Ec(g,b)|0;c[a>>2]=f;if((f|0)==0){c[e>>2]=0;g=0;i=d;return g|0}else{c[e>>2]=f+b;g=1;i=d;return g|0}return 0}function Ld(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e;if(!((b|0)>-1)){c[f>>2]=1728;c[f+4>>2]=143;c[f+8>>2]=1526;$a(8,f|0)|0;jb(1)}g=c[a>>2]|0;if((g|0)==0){h=Kd(a,b)|0;i=e;return h|0}if((b|0)==0){Jd(a);h=1;i=e;return h|0}h=c[12]|0;if((h|0)==0){c[f>>2]=33224;c[f+4>>2]=8906;c[f+8>>2]=284;$a(8,f|0)|0;jb(1)}f=Gc(h,g,b,d)|0;if((f|0)==0){h=0;i=e;return h|0}c[a>>2]=f;c[a+4>>2]=f+b;h=1;i=e;return h|0}function Md(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;f=f?d:0;do{if((e|0)>=(d|0)){if((e|0)>(d|0)){b=Ld(a,b,ba(c[(c[a+12>>2]|0)+12>>2]|0,d)|0)|0;break}if((b|0)!=0?(c[a>>2]|0)==0:0){b=Ld(a,b,0)|0}else{b=1}}else{h=c[a+12>>2]|0;l=h+16|0;do{if((c[l>>2]&2097152|0)==0){k=Nd(a,e)|0;j=c[h+12>>2]|0;d=ba(j,d-e|0)|0;if((c[l>>2]&2097152|0)!=0){bu(k|0,0,d|0)|0;break}l=k+d|0;if((d|0)>0){do{hc[c[(c[h>>2]|0)+56>>2]&63](h,k)|0;k=k+j|0}while(k>>>0<l>>>0)}}}while(0);b=Ld(a,b,b)|0}}while(0);if(!(b&(f|0)<(e|0))){l=b;i=g;return l|0}b=c[a+12>>2]|0;h=Nd(a,f)|0;a=c[b+12>>2]|0;f=ba(a,e-f|0)|0;a:do{if((c[b+16>>2]&2097152|0)==0){e=h+f|0;if((f|0)>0){while(1){f=$b[c[(c[b>>2]|0)+48>>2]&63](b,h,0)|0;if((f|0)!=0){break a}h=h+a|0;if(!(h>>>0<e>>>0)){f=0;break}}}else{f=0}}else{bu(h|0,0,f|0)|0;f=0}}while(0);l=(f|0)==0;i=g;return l|0}function Nd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;e=i;i=i+16|0;d=e;if(!((b|0)>-1)){c[d>>2]=33136;c[d+4>>2]=8906;c[d+8>>2]=855;$a(8,d|0)|0;jb(1)}f=c[a+12>>2]|0;if((f|0)==0){c[d>>2]=33152;c[d+4>>2]=8906;c[d+8>>2]=856;$a(8,d|0)|0;jb(1)}b=(c[a>>2]|0)+(ba(c[f+12>>2]|0,b)|0)|0;if(b>>>0>(c[a+4>>2]|0)>>>0){c[d>>2]=33176;c[d+4>>2]=8906;c[d+8>>2]=858;$a(8,d|0)|0;jb(1)}else{i=e;return b|0}return 0}function Od(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;if((b|0)==-1){l=c[(c[a+8>>2]|0)+16>>2]&255;j=a+(l<<2)+16|0;if((l|0)==0){b=1}else{b=1;k=a+16|0;while(1){h=k+4|0;b=ba(c[k>>2]|0,b)|0;if(h>>>0<j>>>0){k=h}else{break}}}}if((d|0)<1){l=0;i=g;return l|0}l=c[(c[a+8>>2]|0)+16>>2]&255;j=a+(l<<2)+16|0;if((l|0)==0){l=1}else{l=1;k=a+16|0;while(1){h=k+4|0;l=ba(c[k>>2]|0,l)|0;if(h>>>0<j>>>0){k=h}else{break}}}h=b+d|0;if((h|0)>(l|0)){f=Pd(a,l,h-l|0,0)|0;if((f|0)!=0){l=f;i=g;return l|0}}else{if((h|0)<(l|0)&f){Qd(a,h,l-h|0)|0}}f=c[a+12>>2]|0;b=Nd(a,b)|0;a=c[f+12>>2]|0;h=ba(a,d)|0;if((c[f+16>>2]&2097152|0)!=0){au(b|0,e|0,h|0)|0;l=0;i=g;return l|0}d=e+h|0;if((h|0)<=0){l=0;i=g;return l|0}while(1){if(($b[c[(c[f>>2]|0)+52>>2]&63](f,e,b)|0)!=0){d=0;e=18;break}e=e+a|0;if(e>>>0<d>>>0){b=b+a|0}else{d=0;e=18;break}}if((e|0)==18){i=g;return d|0}return 0}function Pd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;if((b|0)==-1){o=c[(c[a+8>>2]|0)+16>>2]&255;h=a+(o<<2)+16|0;if((o|0)==0){b=1}else{b=1;j=a+16|0;while(1){g=j+4|0;b=ba(c[j>>2]|0,b)|0;if(g>>>0<h>>>0){j=g}else{break}}}}if((d|0)<1){o=0;i=f;return o|0}g=a+8|0;h=c[g>>2]|0;m=c[h+16>>2]&255;k=a+(m<<2)+16|0;m=(m|0)==0;if(!m){j=1;n=a+16|0;while(1){l=n+4|0;j=ba(c[n>>2]|0,j)|0;if(l>>>0<k>>>0){n=l}else{break}}l=j+d|0;if(m){n=1}else{n=1;o=a+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<k>>>0){o=m}else{break}}}}else{l=d+1|0;n=1;j=1}h=c[(dc[c[(c[h>>2]|0)+36>>2]&1023](h)|0)>>2]|0;if((c[(c[g>>2]|0)+16>>2]&255|0)!=1){o=1;i=f;return o|0}do{if((h|0)>-1){if((h|0)<(l|0)){o=1;i=f;return o|0}}else{if((h|0)!=-2147483648&(l|0)>(0-h|0)){o=1;i=f;return o|0}if((n|0)!=(l|0)){if(Md(a,ba(c[(c[a+12>>2]|0)+12>>2]|0,l)|0,n,l,1)|0){c[a+16>>2]=l;break}else{o=1;i=f;return o|0}}}}while(0);g=Nd(a,b)|0;if((j|0)==(b|0)){a=a+12|0}else{o=Nd(a,b+d|0)|0;a=a+12|0;au(o|0,g|0,ba(c[(c[a>>2]|0)+12>>2]|0,j-b|0)|0)|0}b=c[a>>2]|0;a:do{if((c[b+16>>2]&2097152|0)==0){bu(g|0,0,ba(c[b+12>>2]|0,d)|0)|0;h=c[a>>2]|0;b=c[h+12>>2]|0;k=ba(b,d)|0;if((c[h+16>>2]&2097152|0)!=0){bu(g|0,0,k|0)|0;break}j=g+k|0;if((k|0)>0){k=g;do{if(($b[c[(c[h>>2]|0)+48>>2]&63](h,k,0)|0)!=0){break a}k=k+b|0}while(k>>>0<j>>>0)}}}while(0);if((e|0)==0){o=0;i=f;return o|0}a=c[a>>2]|0;b=c[a+12>>2]|0;h=ba(b,d)|0;if((c[a+16>>2]&2097152|0)!=0){au(g|0,e|0,h|0)|0;o=0;i=f;return o|0}d=e+h|0;if((h|0)<=0){o=0;i=f;return o|0}while(1){if(($b[c[(c[a>>2]|0)+52>>2]&63](a,e,g)|0)!=0){d=0;e=35;break}e=e+b|0;if(e>>>0<d>>>0){g=g+b|0}else{d=0;e=35;break}}if((e|0)==35){i=f;return d|0}return 0}function Qd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;h=Nd(a,b)|0;k=d+b|0;j=Nd(a,k)|0;b=a+8|0;o=c[(c[b>>2]|0)+16>>2]&255;f=a+(o<<2)+16|0;if((o|0)==0){m=1}else{m=1;n=a+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<f>>>0){n=l}else{break}}}f=a+12|0;n=c[f>>2]|0;l=c[n+12>>2]|0;k=ba(l,m-k|0)|0;if((c[n+16>>2]&2097152|0)==0?(o=ba(l,d)|0,g=h+o|0,(o|0)>0):0){o=h;do{hc[c[(c[n>>2]|0)+56>>2]&63](n,o)|0;o=o+l|0}while(o>>>0<g>>>0)}au(h|0,j|0,k|0)|0;d=m-d|0;g=c[b>>2]|0;o=c[g+16>>2]&255;h=a+(o<<2)+16|0;if((o|0)==0){k=1}else{k=1;l=a+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}g=c[(dc[c[(c[g>>2]|0)+36>>2]&1023](g)|0)>>2]|0;if((c[(c[b>>2]|0)+16>>2]&255|0)!=1|(g|0)>-1){i=e;return 0}if((g|0)!=-2147483648&(d|0)>(0-g|0)|(k|0)==(d|0)){i=e;return 0}if(!(Md(a,ba(c[(c[f>>2]|0)+12>>2]|0,d)|0,k,d,1)|0)){i=e;return 0}c[a+16>>2]=d;i=e;return 0}function Rd(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+64|0;h=d+36|0;f=d+8|0;g=d;c[g>>2]=31976;c[g+4>>2]=31996;e=c[12]|0;c[12]=b;a[h+16|0]=0;c[h>>2]=1;c[h+4>>2]=0;c[h+8>>2]=0;c[h+12>>2]=0;c[f+24>>2]=h;c[f>>2]=b;c[f+4>>2]=32e3;c[f+8>>2]=32078;c[f+12>>2]=32e3;c[f+16>>2]=1;a[f+20|0]=0;f=Vd(f)|0;c[12]=b;Kc(b,g,f)|0;c[12]=e;Oe(b,32080,40,32112,2);Oe(b,32160,41,32192,2);Oe(b,32216,42,32248,2);Oe(b,32288,43,32312,2);Oe(b,32352,44,32376,2);Oe(b,32416,45,32448,2);Oe(b,32512,46,32520,2);Oe(b,32560,47,32576,2);Oe(b,32600,48,32576,2);Oe(b,32616,49,32576,2);Oe(b,32632,50,32648,2);Oe(b,32672,51,32648,2);Oe(b,32688,52,32648,2);Oe(b,32712,53,32648,2);Oe(b,32728,54,32648,2);Oe(b,32752,55,32768,2);Oe(b,32792,56,32768,2);Oe(b,32816,57,32832,2);Oe(b,32856,58,32576,2);Oe(b,32872,59,32576,2);Oe(b,32896,60,32920,2);Oe(b,32952,61,32976,2);Oe(b,33008,62,33024,2);Oe(b,33064,63,33080,2);Oe(b,33120,64,32976,2);i=d;return}function Sd(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;h=b+8|0;c[h>>2]=0;i=b+4|0;c[i>>2]=0;c[b+24>>2]=f;c[b>>2]=d;if((e|0)==0){c[i>>2]=0;c[h>>2]=0}else{c[i>>2]=c[e>>2];c[h>>2]=c[e+4>>2]}c[b+12>>2]=c[e>>2];c[b+16>>2]=g;a[b+20|0]=0;return}function Td(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;g=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(g>>>0<e>>>0){f=0}else{g=0;g=g+b|0;i=d;return g|0}do{f=((a[g]|0)==10)+f|0;g=g+1|0}while((g|0)!=(e|0));g=f+b|0;i=d;return g|0}function Ud(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;e=i;d=b+12|0;j=c[d>>2]|0;f=c[b+4>>2]|0;g=b+16|0;b=c[g>>2]|0;if(j>>>0<f>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(f|0))}else{h=0}c[g>>2]=h+b;c[d>>2]=f;i=e;return}function Vd(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+4048|0;l=e+40|0;m=e+8|0;f=e;d=c[12]|0;c[12]=c[b>>2];g=f+4|0;c[g>>2]=0;c[f>>2]=0;j=b+4|0;Wd(j,f)|0;g=c[g>>2]|0;k=c[f>>2]|0;a:do{if((g-k|0)<1){n=1832;o=k}else{n=k+1|0;p=1800;o=k;while(1){if(!(o>>>0<n>>>0)){break}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{n=1832;o=k;break a}}if(k>>>0<g>>>0){c[f>>2]=n}g=Qc(c[b>>2]|0,f)|0;if((g|0)==0){g=0}else{g=c[g>>2]|0}if((g|0)!=0){p=g;c[12]=d;i=e;return p|0}g=c[b+24>>2]|0;l=c[b+12>>2]|0;j=c[b+4>>2]|0;h=c[b+16>>2]|0;if(l>>>0<j>>>0){k=0;do{k=((a[l]|0)==10)+k|0;l=l+1|0}while((l|0)!=(j|0))}else{k=0}Xd(g,2,k+h|0,1808,f);p=c[(c[b>>2]|0)+36>>2]|0;c[12]=d;i=e;return p|0}}while(0);while(1){if(!(o>>>0<g>>>0)){h=15;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{o=1840;n=k;break}}if((h|0)==15){if((a[n]|0)==0){p=Yd(b)|0;c[12]=d;i=e;return p|0}else{o=1840;n=k}}while(1){if(!(n>>>0<g>>>0)){h=19;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{n=1848;o=k;break}}if((h|0)==19){if((a[o]|0)==0){p=Zd(b)|0;c[12]=d;i=e;return p|0}else{n=1848;o=k}}while(1){if(!(o>>>0<g>>>0)){h=23;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{n=1856;o=k;break}}if((h|0)==23){if((a[n]|0)==0){p=_d(b)|0;c[12]=d;i=e;return p|0}else{n=1856;o=k}}while(1){if(!(o>>>0<g>>>0)){h=27;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{n=1864;o=k;break}}if((h|0)==27){if((a[n]|0)==0){p=$d(b)|0;c[12]=d;i=e;return p|0}else{n=1864;o=k}}while(1){if(!(o>>>0<g>>>0)){h=31;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{o=1872;n=k;break}}if((h|0)==31){if((a[n]|0)==0){p=ae(b)|0;c[12]=d;i=e;return p|0}else{o=1872;n=k}}while(1){if(!(n>>>0<g>>>0)){h=35;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{o=1880;n=k;h=36;break}}if((h|0)==35?(a[o]|0)!=0:0){o=1880;n=k;h=36}do{if((h|0)==36){while(1){h=0;if(!(n>>>0<g>>>0)){h=38;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0;h=36}else{o=1888;n=k;break}}if((h|0)==38){if((a[o]|0)==0){break}else{o=1888;n=k}}while(1){if(!(n>>>0<g>>>0)){h=42;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{l=1896;m=k;break}}if((h|0)==42){if((a[o]|0)==0){c[m+4>>2]=c[b>>2];o=m+8|0;p=m+26|0;c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;c[o+12>>2]=0;a[o+16|0]=0;a[p]=1;a[m+25|0]=1;c[m>>2]=8248;ce(b,l,m);p=td(c[b>>2]|0,l,c[m+12>>2]|0)|0;c[12]=d;i=e;return p|0}else{l=1896;m=k}}while(1){if(!(m>>>0<g>>>0)){h=46;break}if((a[m]|0)==(a[l]|0)){l=l+1|0;m=m+1|0}else{j=408;break}}if((h|0)==46){if((a[l]|0)==0){if(!(Zc(j,40)|0)){p=c[(c[b>>2]|0)+36>>2]|0;c[12]=d;i=e;return p|0}f=Vd(b)|0;f=Hd(c[b>>2]|0,f)|0;if(Zc(j,41)|0){p=f;c[12]=d;i=e;return p|0}else{p=c[(c[b>>2]|0)+36>>2]|0;c[12]=d;i=e;return p|0}}else{j=408}}while(1){if(!(k>>>0<g>>>0)){h=54;break}if((a[k]|0)==(a[j]|0)){j=j+1|0;k=k+1|0}else{break}}if((h|0)==54?(a[j]|0)==0:0){p=Vd(b)|0;p=Hd(c[b>>2]|0,p)|0;c[12]=d;i=e;return p|0}g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}Xd(g,3,j+b|0,1904,f);p=0;c[12]=d;i=e;return p|0}}while(0);p=be(b)|0;c[12]=d;i=e;return p|0}function Wd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;j=c[b>>2]|0;f=c[b+4>>2]|0;a:do{if(j>>>0<f>>>0){while(1){h=a[j]|0;if(!((h&255)<127)){g=j;break a}b:do{if((a[31128+(h&255)|0]&16)==0){if(!(h<<24>>24==47)){g=j;break a}h=j+1|0;if(h>>>0<f>>>0){h=a[h]|0;if(h<<24>>24==47){j=j+2|0;c[b>>2]=j;if(!(j>>>0<f>>>0)){break}while(1){k=a[j]|0;if(k<<24>>24==10|k<<24>>24==13){break b}j=j+1|0;c[b>>2]=j;if(!(j>>>0<f>>>0)){break b}}}else if(!(h<<24>>24==42)){break}h=j+2|0;c[b>>2]=h;k=j+3|0;c:do{if(k>>>0<f>>>0){while(1){if((a[h]|0)==42){j=h+1|0;if((a[k]|0)==47){break c}else{h=j}}else{h=h+1|0}c[b>>2]=h;k=h+1|0;if(!(k>>>0<f>>>0)){g=13;break}}}else{g=13}}while(0);if((g|0)==13){g=0;j=h+1|0}if(j>>>0<f>>>0){j=h+2|0;c[b>>2]=j;break}else{c[b>>2]=j;break}}}else{j=j+1|0;c[b>>2]=j}}while(0);if(!(j>>>0<f>>>0)){g=j;break}}}else{g=j}}while(0);h=a[g]|0;do{if(g>>>0<f>>>0){if(h<<24>>24==64|h<<24>>24==34|h<<24>>24==39){if((le(b,d,3)|0)==0){break}else{d=1}i=e;return d|0}if((h&255)<127?!((a[31128+(h&255)|0]&2)==0):0){k=g+1|0;c[b>>2]=k;c[d>>2]=g;c[d+4>>2]=k;k=1;i=e;return k|0}else{j=g}while(1){if(!((h&255)<127)){break}if((a[31128+(h&255)|0]&1)==0){break}j=j+1|0;c[b>>2]=j;if(!(j>>>0<f>>>0)){break}h=a[j]|0}if(!(j>>>0>g>>>0)){k=1;i=e;return k|0}c[d>>2]=g;c[d+4>>2]=j;k=1;i=e;return k|0}}while(0);c[d>>2]=0;c[d+4>>2]=0;k=0;i=e;return k|0}function Xd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;h=i;i=i+224|0;j=h;g=h+24|0;switch(b|0){case 4:{b=a+8|0;c[b>>2]=(c[b>>2]|0)+1;b=3512;break};case 1:{b=3480;break};case 2:{b=a+4|0;c[b>>2]=(c[b>>2]|0)+1;b=3488;break};case 3:{b=a+8|0;c[b>>2]=(c[b>>2]|0)+1;b=3496;break};case 0:{b=3472;break};default:{b=3520}}if((c[a>>2]|0)==0){i=h;return}if((f|0)==0){c[j>>2]=d;c[j+4>>2]=b;c[j+8>>2]=e;e=wb(g|0,200,3560,j|0)|0}else{k=c[f>>2]|0;f=(c[f+4>>2]|0)-k|0;c[j>>2]=d;c[j+4>>2]=b;c[j+8>>2]=e;c[j+12>>2]=f;c[j+16>>2]=k;e=wb(g|0,200,3528,j|0)|0}a=c[a>>2]|0;d=a;if((d|0)==1){c[j>>2]=g;$a(3584,j|0)|0;i=h;return}else if((d|0)==0){i=h;return}else{k=c[(c[a+8>>2]|0)+16>>2]&255;j=a+(k<<2)+16|0;if((k|0)==0){f=1}else{f=1;b=a+16|0;while(1){d=b+4|0;f=ba(c[b>>2]|0,f)|0;if(d>>>0<j>>>0){b=d}else{break}}}Pd(a,f,e,g)|0;i=h;return}}function Yd(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+4048|0;d=e;f=e+4040|0;g=e+40|0;h=e+12|0;c[h+4>>2]=c[b>>2];k=h+8|0;j=h+26|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;a[k+16|0]=0;a[j]=1;a[h+25|0]=1;c[h>>2]=8056;ce(b,g,h);b=c[b>>2]|0;h=c[h+12>>2]|0;j=c[12]|0;if((j|0)==0){c[d>>2]=33224;c[d+4>>2]=8906;c[d+8>>2]=284;$a(8,d|0)|0;jb(1)}else{k=Ec(j,(h<<2)+36|0)|0;fd(k,b,g,h);j=k+(c[k+32>>2]<<2)+36|0;c[f>>2]=k+12;c[f+4>>2]=j;k=Sc(b,k,f)|0;i=e;return k|0}return 0}function Zd(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+4048|0;d=e;f=e+4040|0;g=e+40|0;h=e+12|0;c[h+4>>2]=c[b>>2];k=h+8|0;j=h+26|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;a[k+16|0]=0;a[j]=1;a[h+25|0]=1;c[h>>2]=8056;ce(b,g,h);b=c[b>>2]|0;h=c[h+12>>2]|0;j=c[12]|0;if((j|0)==0){c[d>>2]=33224;c[d+4>>2]=8906;c[d+8>>2]=284;$a(8,d|0)|0;jb(1)}else{k=Ec(j,(h<<2)+36|0)|0;md(k,b,g,h);j=k+(c[k+32>>2]<<2)+36|0;c[f>>2]=k+12;c[f+4>>2]=j;k=Sc(b,k,f)|0;i=e;return k|0}return 0}function _d(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+4048|0;d=e;f=e+4040|0;g=e+40|0;h=e+12|0;c[h+4>>2]=c[b>>2];k=h+8|0;j=h+26|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;a[k+16|0]=0;a[j]=1;a[h+25|0]=1;c[h>>2]=8176;ce(b,g,h);b=c[b>>2]|0;h=c[h+12>>2]|0;j=c[12]|0;if((j|0)==0){c[d>>2]=33224;c[d+4>>2]=8906;c[d+8>>2]=284;$a(8,d|0)|0;jb(1)}else{k=Ec(j,(h<<2)+36|0)|0;Ed(k,b,g,h);j=k+(c[k+32>>2]<<2)+36|0;c[f>>2]=k+12;c[f+4>>2]=j;k=Sc(b,k,f)|0;i=e;return k|0}return 0}function $d(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;h=i;i=i+32|0;f=h;e=h+16|0;d=h+8|0;j=e+4|0;c[j>>2]=0;c[e>>2]=0;c[d+4>>2]=0;c[d>>2]=0;g=b+4|0;if(!(Zc(g,40)|0)){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}if(!(Wd(g,e)|0)){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}k=c[j>>2]|0;j=2096;l=c[e>>2]|0;while(1){if(!(l>>>0<k>>>0)){k=8;break}if((a[l]|0)==(a[j]|0)){j=j+1|0;l=l+1|0}else{k=10;break}}if((k|0)==8){if((a[j]|0)==0){j=c[(c[b>>2]|0)+28>>2]<<2;l=f;c[l>>2]=j;c[l+4>>2]=((j|0)<0)<<31>>31}else{k=10}}if((k|0)==10?!(fe(e,f)|0):0){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}de(g);if(!(Wd(g,d)|0)){l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}if(Zc(g,41)|0){l=he(0,d)|0;l=ed(c[b>>2]|0,c[f>>2]|0,l)|0;i=h;return l|0}else{l=c[(c[b>>2]|0)+36>>2]|0;i=h;return l|0}return 0}function ae(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+80|0;d=e+72|0;o=e+8|0;g=e;h=d+4|0;c[h>>2]=0;c[d>>2]=0;j=b+4|0;if(!(Zc(j,40)|0)){p=c[(c[b>>2]|0)+36>>2]|0;i=e;return p|0}l=ee(b)|0;de(j);Wd(j,d)|0;m=0;while(1){f=c[h>>2]|0;n=1960;p=c[d>>2]|0;while(1){if(!(p>>>0<f>>>0)){k=7;break}if((a[p]|0)==(a[n]|0)){n=n+1|0;p=p+1|0}else{break}}if((k|0)==7?(k=0,(a[n]|0)==0):0){k=13;break}if(!(fe(d,g)|0)){break}c[o+(m<<2)>>2]=c[g>>2];de(j);Wd(j,d)|0;m=m+1|0}if((k|0)==13){p=yd(c[b>>2]|0,l,m,o)|0;i=e;return p|0}f=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;g=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}Xd(f,3,j+g|0,2072,d);p=c[(c[b>>2]|0)+36>>2]|0;i=e;return p|0}function be(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+16|0;h=d;e=b+4|0;if(!(Zc(e,40)|0)){j=c[(c[b>>2]|0)+36>>2]|0;i=d;return j|0}f=Vd(b)|0;g=c[b>>2]|0;j=c[12]|0;if((j|0)==0){c[h>>2]=33224;c[h+4>>2]=8906;c[h+8>>2]=284;$a(8,h|0)|0;jb(1)}h=Ec(j,(c[f+12>>2]|0)+28|0)|0;if((h|0)==0){h=0}else{$c(h,g,f);c[h>>2]=1360;j=h+16|0;c[j>>2]=c[j>>2]|16777216;j=h+20|0;a[j]=a[j]|8;$b[c[(c[f>>2]|0)+48>>2]&63](f,h+28|0,f)|0}de(e);j=hc[c[(c[h>>2]|0)+44>>2]&63](h,0)|0;ie(b,f,j,c[f+16>>2]&255);if(Zc(e,41)|0){j=h;i=d;return j|0}else{j=c[(c[b>>2]|0)+36>>2]|0;i=d;return j|0}return 0}function ce(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+16|0;g=f+8|0;j=f;h=g+4|0;c[h>>2]=0;c[g>>2]=0;k=j+4|0;c[k>>2]=0;c[j>>2]=0;m=b+4|0;Wd(m,g)|0;o=c[h>>2]|0;p=1936;n=c[g>>2]|0;while(1){if(!(n>>>0<o>>>0)){l=4;break}if((a[n]|0)==(a[p]|0)){p=p+1|0;n=n+1|0}else{break}}if((l|0)==4?(a[p]|0)==0:0){Wd(m,g)|0;n=e+12|0;a:while(1){p=c[g>>2]|0;o=c[h>>2]|0;r=1960;q=p;while(1){if(!(q>>>0<o>>>0)){l=12;break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0}else{q=1968;r=p;break}}if((l|0)==12){if((a[r]|0)==0){g=1960;l=56;break}else{q=1968;r=p}}while(1){if(!(r>>>0<o>>>0)){l=15;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{r=1976;q=p;l=16;break}}if((l|0)==15){l=0;if((a[q]|0)==0){o=0}else{r=1976;q=p;l=16}}do{if((l|0)==16){while(1){l=0;if(!(q>>>0<o>>>0)){l=18;break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0;l=16}else{q=1984;r=p;break}}if((l|0)==18){l=0;if((a[r]|0)==0){o=1;break}else{q=1984;r=p}}while(1){if(!(r>>>0<o>>>0)){l=21;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{q=1992;r=p;break}}if((l|0)==21){l=0;if((a[q]|0)==0){o=2;break}else{q=1992;r=p}}while(1){if(!(r>>>0<o>>>0)){l=24;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{q=2e3;r=p;break}}if((l|0)==24){l=0;if((a[q]|0)==0){o=3;break}else{q=2e3;r=p}}while(1){if(!(r>>>0<o>>>0)){l=27;break}if((a[r]|0)==(a[q]|0)){q=q+1|0;r=r+1|0}else{r=2008;q=p;break}}if((l|0)==27){l=0;if((a[q]|0)==0){o=4;break}else{r=2008;q=p}}while(1){if(!(q>>>0<o>>>0)){l=30;break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0}else{q=2016;break}}if((l|0)==30){if((a[r]|0)==0){o=5;break}else{q=2016}}while(1){if(!(p>>>0<o>>>0)){break}if((a[p]|0)==(a[q]|0)){q=q+1|0;p=p+1|0}else{l=34;break a}}if((a[q]|0)==0){o=5}else{l=34;break a}}}while(0);if(!(Zc(m,40)|0)){l=38;break}p=Vd(b)|0;if((p|0)==0){p=c[(c[b>>2]|0)+36>>2]|0}de(m);Wd(m,g)|0;s=c[g>>2]|0;r=c[h>>2]|0;q=1960;l=s;while(1){if(!(l>>>0<r>>>0)){l=46;break}if((a[l]|0)==(a[q]|0)){q=q+1|0;l=l+1|0}else{l=48;break}}if((l|0)==46){l=0;if((a[q]|0)==0){c[j>>2]=0;c[k>>2]=0}else{l=48}}if((l|0)==48){l=0;c[j>>2]=s;c[j+4>>2]=r;Wd(m,g)|0;r=c[h>>2]|0;s=1960;q=c[g>>2]|0;while(1){if(!(q>>>0<r>>>0)){break}if((a[q]|0)==(a[s]|0)){s=s+1|0;q=q+1|0}else{l=52;break a}}if((a[s]|0)!=0){l=52;break}}s=hc[c[c[e>>2]>>2]&63](e,p)|0;s=ad(c[b>>2]|0,j,p,o,s)|0;c[d+((c[n>>2]|0)+ -1<<2)>>2]=s;de(m);Wd(m,g)|0}if((l|0)==34){h=c[b+24>>2]|0;e=c[b+12>>2]|0;j=c[b+4>>2]|0;b=c[b+16>>2]|0;if(e>>>0<j>>>0){k=0;do{k=((a[e]|0)==10)+k|0;e=e+1|0}while((e|0)!=(j|0))}else{k=0}Xd(h,2,k+b|0,2024,g);i=f;return}else if((l|0)==38){g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}Xd(g,3,j+b|0,1944,0);i=f;return}else if((l|0)==52){g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}Xd(g,3,j+b|0,2056,0);i=f;return}else if((l|0)==56){while(1){l=0;if(!(p>>>0<o>>>0)){l=58;break}if((a[p]|0)==(a[g]|0)){g=g+1|0;p=p+1|0;l=56}else{break}}if((l|0)==58?(a[g]|0)==0:0){i=f;return}g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}Xd(g,3,j+b|0,2056,0);i=f;return}}g=c[b+24>>2]|0;k=c[b+12>>2]|0;h=c[b+4>>2]|0;b=c[b+16>>2]|0;if(k>>>0<h>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(h|0))}else{j=0}Xd(g,3,j+b|0,1944,0);i=f;return}function de(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;e=i;h=c[b>>2]|0;d=c[b+4>>2]|0;a:do{if(h>>>0<d>>>0){do{g=a[h]|0;if(!((g&255)<127)){break a}b:do{if((a[31128+(g&255)|0]&16)==0){if(!(g<<24>>24==47)){break a}g=h+1|0;if(g>>>0<d>>>0){g=a[g]|0;if(g<<24>>24==47){h=h+2|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break}while(1){j=a[h]|0;if(j<<24>>24==10|j<<24>>24==13){break b}h=h+1|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break b}}}else if(!(g<<24>>24==42)){break}g=h+2|0;c[b>>2]=g;j=h+3|0;c:do{if(j>>>0<d>>>0){while(1){if((a[g]|0)==42){h=g+1|0;if((a[j]|0)==47){break c}else{g=h}}else{g=g+1|0}c[b>>2]=g;h=g+1|0;if(h>>>0<d>>>0){j=h}else{f=13;break}}}else{f=13}}while(0);if((f|0)==13){f=0;h=g+1|0}if(h>>>0<d>>>0){h=g+2|0;c[b>>2]=h;break}else{c[b>>2]=h;break}}}else{h=h+1|0;c[b>>2]=h}}while(0)}while(h>>>0<d>>>0)}}while(0);if(!(h>>>0<d>>>0)){i=e;return}if((a[h]|0)!=44){i=e;return}c[b>>2]=h+1;i=e;return}function ee(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=b+4|0;j=c[e>>2]|0;f=c[b+8>>2]|0;a:do{if(j>>>0<f>>>0){do{h=a[j]|0;if(!((h&255)<127)){break a}b:do{if((a[31128+(h&255)|0]&16)==0){if(!(h<<24>>24==47)){break a}h=j+1|0;if(h>>>0<f>>>0){h=a[h]|0;if(h<<24>>24==47){j=j+2|0;c[e>>2]=j;if(!(j>>>0<f>>>0)){break}while(1){k=a[j]|0;if(k<<24>>24==10|k<<24>>24==13){break b}j=j+1|0;c[e>>2]=j;if(!(j>>>0<f>>>0)){break b}}}else if(!(h<<24>>24==42)){break}h=j+2|0;c[e>>2]=h;k=j+3|0;c:do{if(k>>>0<f>>>0){while(1){if((a[h]|0)==42){j=h+1|0;if((a[k]|0)==47){break c}else{h=j}}else{h=h+1|0}c[e>>2]=h;k=h+1|0;if(!(k>>>0<f>>>0)){g=13;break}}}else{g=13}}while(0);if((g|0)==13){g=0;j=h+1|0}if(j>>>0<f>>>0){j=h+2|0;c[e>>2]=j;break}else{c[e>>2]=j;break}}}else{j=j+1|0;c[e>>2]=j}}while(0)}while(j>>>0<f>>>0)}}while(0);d:do{if((f-j|0)>1){f=j+1|0;g=1968;while(1){if(!(j>>>0<f>>>0)){break d}if((a[j]|0)==(a[g]|0)){g=g+1|0;j=j+1|0}else{break}}k=Vd(b)|0;i=d;return k|0}}while(0);if(!(Zc(e,101)|0)){k=c[(c[b>>2]|0)+36>>2]|0;i=d;return k|0}if(!(Zc(e,40)|0)){k=c[(c[b>>2]|0)+36>>2]|0;i=d;return k|0}f=Vd(b)|0;if(Zc(e,41)|0){k=f;i=d;return k|0}k=c[(c[b>>2]|0)+36>>2]|0;i=d;return k|0}function fe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;n=c[b>>2]|0;f=c[b+4>>2]|0;a:do{if(n>>>0<f>>>0){do{h=a[n]|0;if(!((h&255)<127)){break a}b:do{if((a[31128+(h&255)|0]&16)==0){if(!(h<<24>>24==47)){break a}h=n+1|0;if(h>>>0<f>>>0){h=a[h]|0;if(h<<24>>24==47){n=n+2|0;c[b>>2]=n;if(!(n>>>0<f>>>0)){break}while(1){p=a[n]|0;if(p<<24>>24==10|p<<24>>24==13){break b}n=n+1|0;c[b>>2]=n;if(!(n>>>0<f>>>0)){break b}}}else if(!(h<<24>>24==42)){break}h=n+2|0;c[b>>2]=h;j=n+3|0;c:do{if(j>>>0<f>>>0){while(1){if((a[h]|0)==42){n=h+1|0;if((a[j]|0)==47){break c}}else{n=h+1|0}c[b>>2]=n;j=n+1|0;if(j>>>0<f>>>0){h=n}else{h=n;g=13;break}}}else{g=13}}while(0);if((g|0)==13){g=0;n=h+1|0}if(n>>>0<f>>>0){n=h+2|0;c[b>>2]=n;break}else{c[b>>2]=n;break}}}else{n=n+1|0;c[b>>2]=n}}while(0)}while(n>>>0<f>>>0)}}while(0);d:do{if(n>>>0<f>>>0){e:do{if((a[n]|0)!=42){k=1;j=0;h=0;g=0;o=1;l=0;m=1;while(1){while(1){p=a[n]|0;if(!((p+ -48<<24>>24&255)<10)){break}n=n+1|0;p=(p&255)+ -48|0;h=ju(h|0,g|0,10,0)|0;h=Yt(p|0,((p|0)<0)<<31>>31|0,h|0,F|0)|0;g=F;if(n>>>0<f>>>0){o=0;l=1;m=0}else{break e}}if(!o){break}o=p<<24>>24==45;if(!(p<<24>>24==43|p<<24>>24==45)){break}n=n+1|0;k=o?-1:k;j=o?-1:j;m=l<<24>>24==0;if(n>>>0<f>>>0){o=0}else{break}}if(m){b=0;break d}}else{h=-2147483648;g=-1;k=1;j=0;n=n+1|0}}while(0);c[b>>2]=n;b=1}else{k=1;j=0;h=0;g=0;b=0}}while(0);if((d|0)==0){i=e;return b|0}o=ju(k|0,j|0,h|0,g|0)|0;p=d;c[p>>2]=o;c[p+4>>2]=F;i=e;return b|0}function ge(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;f=i;h=c[b>>2]|0;d=c[b+4>>2]|0;if(!(h>>>0<d>>>0)){i=f;return}a:while(1){g=a[h]|0;if(!((g&255)<127)){e=22;break}b:do{if((a[31128+(g&255)|0]&16)==0){if(!(g<<24>>24==47)){e=22;break a}g=h+1|0;if(g>>>0<d>>>0){if((a[g]|0)==47){h=h+2|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break}while(1){j=a[h]|0;if(j<<24>>24==10|j<<24>>24==13){break b}h=h+1|0;c[b>>2]=h;if(!(h>>>0<d>>>0)){break b}}}if((a[g]|0)==42){g=h+2|0;c[b>>2]=g;h=h+3|0;c:do{if(h>>>0<d>>>0){j=h;while(1){if((a[g]|0)==42){h=g+1|0;if((a[j]|0)==47){break c}else{g=h}}else{g=g+1|0}c[b>>2]=g;h=g+1|0;if(h>>>0<d>>>0){j=h}else{e=14;break}}}else{e=14}}while(0);if((e|0)==14){e=0;h=g+1|0}if(h>>>0<d>>>0){h=g+2|0;c[b>>2]=h;break}else{c[b>>2]=h;break}}}}else{h=h+1|0;c[b>>2]=h}}while(0);if(!(h>>>0<d>>>0)){e=22;break}}if((e|0)==22){i=f;return}}function he(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;b=i;f=c[d>>2]|0;d=c[d+4>>2]|0;g=2112;h=f;while(1){if(!(h>>>0<d>>>0)){e=4;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2120;h=f;break}}if((e|0)==4){if((a[g]|0)==0){h=6;i=b;return h|0}else{g=2120;h=f}}while(1){if(!(h>>>0<d>>>0)){e=7;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2136;h=f;break}}if((e|0)==7){if((a[g]|0)==0){h=12;i=b;return h|0}else{g=2136;h=f}}while(1){if(!(h>>>0<d>>>0)){e=10;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2144;h=f;break}}if((e|0)==10){if((a[g]|0)==0){h=9;i=b;return h|0}else{g=2144;h=f}}while(1){if(!(h>>>0<d>>>0)){e=13;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2152;h=f;break}}if((e|0)==13){if((a[g]|0)==0){h=10;i=b;return h|0}else{g=2152;h=f}}while(1){if(!(h>>>0<d>>>0)){e=16;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2160;h=f;break}}if((e|0)==16){if((a[g]|0)==0){h=16;i=b;return h|0}else{g=2160;h=f}}while(1){if(!(h>>>0<d>>>0)){e=19;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2168;h=f;break}}if((e|0)==19){if((a[g]|0)==0){h=17;i=b;return h|0}else{g=2168;h=f}}while(1){if(!(h>>>0<d>>>0)){e=22;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2184;h=f;break}}if((e|0)==22){if((a[g]|0)==0){h=18;i=b;return h|0}else{g=2184;h=f}}while(1){if(!(h>>>0<d>>>0)){e=25;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2192;h=f;break}}if((e|0)==25){if((a[g]|0)==0){h=11;i=b;return h|0}else{g=2192;h=f}}while(1){if(!(h>>>0<d>>>0)){e=28;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2200;h=f;break}}if((e|0)==28){if((a[g]|0)==0){h=13;i=b;return h|0}else{g=2200;h=f}}while(1){if(!(h>>>0<d>>>0)){e=31;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{g=2208;h=f;break}}if((e|0)==31){if((a[g]|0)==0){h=7;i=b;return h|0}else{g=2208;h=f}}while(1){if(!(h>>>0<d>>>0)){e=34;break}if((a[h]|0)==(a[g]|0)){g=g+1|0;h=h+1|0}else{h=2216;g=f;break}}if((e|0)==34){if((a[g]|0)==0){h=14;i=b;return h|0}else{h=2216;g=f}}while(1){if(!(g>>>0<d>>>0)){e=37;break}if((a[g]|0)==(a[h]|0)){h=h+1|0;g=g+1|0}else{g=2224;break}}if((e|0)==37){if((a[h]|0)==0){h=4;i=b;return h|0}else{g=2224}}while(1){if(!(f>>>0<d>>>0)){break}if((a[f]|0)==(a[g]|0)){g=g+1|0;f=f+1|0}else{f=0;e=41;break}}if((e|0)==41){i=b;return f|0}h=(a[g]|0)==0?15:0;i=b;return h|0}function ie(d,e,f,j){d=d|0;e=e|0;f=f|0;j=j|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0.0;l=i;i=i+336|0;t=l;p=l+304|0;s=l+296|0;B=l+280|0;D=l+288|0;n=l+272|0;E=l+264|0;m=l+312|0;C=l+320|0;if((a[2384]|0)==0?(wa(2384)|0)!=0:0){c[594]=2392;c[2380>>2]=2409;Va(2384)}r=(e|0)==0;a:do{if(r){o=11}else{q=D+4|0;F=e;while(1){c[q>>2]=0;c[D>>2]=0;cc[c[(c[F>>2]|0)+28>>2]&63](F,D);I=c[594]|0;H=(c[2380>>2]|0)-I|0;G=c[D>>2]|0;if(((c[q>>2]|0)-G|0)==(H|0)){H=G+H|0;while(1){if(!(G>>>0<H>>>0)){break a}if((a[G]|0)==(a[I]|0)){I=I+1|0;G=G+1|0}else{break}}}F=dc[c[(c[F>>2]|0)+12>>2]&1023](F)|0;if((F|0)==0){o=11;break}}}}while(0);do{if((o|0)==11){D=c[2380>>2]|0;F=408;q=c[594]|0;while(1){if(!(q>>>0<D>>>0)){o=14;break}if((a[q]|0)==(a[F]|0)){F=F+1|0;q=q+1|0}else{break}}if((o|0)==14?(a[F]|0)==0:0){break}D=c[e+12>>2]|0;F=(c[e+16>>2]|0)>>>16&31;q=n+4|0;c[q>>2]=0;c[n>>2]=0;switch(F|0){case 3:{ke(d,e,f,j);i=l;return};case 10:case 9:{I=E;c[I>>2]=0;c[I+4>>2]=0;if(!(fe(d+4|0,E)|0)){f=c[d+24>>2]|0;n=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<e>>>0){m=0;do{m=((a[n]|0)==10)+m|0;n=n+1|0}while((n|0)!=(e|0))}else{m=0}Xd(f,2,m+d|0,2416,0);i=l;return}if((f|0)==0){i=l;return}m=E;e=c[m>>2]|0;m=c[m+4>>2]|0;do{if((F+ -9|0)>>>0<2){if((D|0)==8){I=f;c[I>>2]=e;c[I+4>>2]=m;i=l;return}else if((D|0)==4){c[f>>2]=e;i=l;return}else if((D|0)==2){b[f>>1]=e;i=l;return}else if((D|0)==1){a[f]=e;i=l;return}else{break}}}while(0);f=c[d+24>>2]|0;n=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<e>>>0){m=0;do{m=((a[n]|0)==10)+m|0;n=n+1|0}while((n|0)!=(e|0))}else{m=0}Xd(f,2,m+d|0,2456,0);i=l;return};case 6:{le(d+4|0,n,255)|0;e=c[n>>2]|0;m=c[q>>2]|0;n=2008;o=e;while(1){if(!(o>>>0<m>>>0)){o=35;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0}else{A=2488;w=e;o=36;break}}if((o|0)==35){if((a[n]|0)==0){x=1}else{A=2488;w=e;o=36}}do{if((o|0)==36){while(1){o=0;if(!(w>>>0<m>>>0)){o=38;break}if((a[w]|0)==(a[A]|0)){A=A+1|0;w=w+1|0}else{u=2496;v=e;break}}if((o|0)==38){if((a[A]|0)==0){x=1;break}else{u=2496;v=e}}while(1){if(!(v>>>0<m>>>0)){o=41;break}if((a[v]|0)==(a[u]|0)){u=u+1|0;v=v+1|0}else{y=1048;z=e;break}}if((o|0)==41){if((a[u]|0)==0){x=0;break}else{y=1048;z=e}}while(1){if(!(z>>>0<m>>>0)){o=44;break}if((a[z]|0)==(a[y]|0)){y=y+1|0;z=z+1|0}else{break}}if((o|0)==44?(a[y]|0)==0:0){x=0;break}f=c[d+24>>2]|0;n=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<e>>>0){m=0;do{m=((a[n]|0)==10)+m|0;n=n+1|0}while((n|0)!=(e|0))}else{m=0}Xd(f,2,m+d|0,2504,0);i=l;return}}while(0);if((f|0)==0){i=l;return}if((D|0)==1){a[f]=x;i=l;return}f=c[d+24>>2]|0;n=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<e>>>0){m=0;do{m=((a[n]|0)==10)+m|0;n=n+1|0}while((n|0)!=(e|0))}else{m=0}Xd(f,2,m+d|0,2536,0);i=l;return};case 12:{le(d+4|0,n,255)|0;e=c[n>>2]|0;m=(c[q>>2]|0)-e|0;m=(m|0)<255?m:255;I=t+256|0;c[I>>2]=t+m;$t(t|0,e|0,m|0)|0;a[c[I>>2]|0]=0;c[B>>2]=0;J=+St(t,B);I=c[B>>2]|0;m=(t|0)!=(I|0);c[n>>2]=e+(I-t);J=m?J:0.0;if(!m){f=c[d+24>>2]|0;n=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<e>>>0){m=0;do{m=((a[n]|0)==10)+m|0;n=n+1|0}while((n|0)!=(e|0))}else{m=0}Xd(f,2,m+d|0,2576,0);i=l;return}if((f|0)==0){i=l;return}if((D|0)==8){h[k>>3]=J;a[f]=a[k];a[f+1|0]=a[k+1|0];a[f+2|0]=a[k+2|0];a[f+3|0]=a[k+3|0];a[f+4|0]=a[k+4|0];a[f+5|0]=a[k+5|0];a[f+6|0]=a[k+6|0];a[f+7|0]=a[k+7|0];i=l;return}else if((D|0)==4){g[f>>2]=J;i=l;return}else{f=c[d+24>>2]|0;n=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<e>>>0){m=0;do{m=((a[n]|0)==10)+m|0;n=n+1|0}while((n|0)!=(e|0))}else{m=0}Xd(f,2,m+d|0,2608,0);i=l;return}};case 14:case 13:{le(d+4|0,n,255)|0;m=c[q>>2]|0;d=c[n>>2]|0;e=m-d|0;if((e|0)>2?(a[d]|0)==64:0){d=d+2|0;c[n>>2]=d;m=m+ -1|0;c[q>>2]=m}else{if((e|0)>1){d=d+1|0;c[n>>2]=d;m=m+ -1|0;c[q>>2]=m}}if((D|0)==1?(m-d|0)>0:0){a[f]=a[d]|0;i=l;return}$a(2640,t|0)|0;i=l;return};case 15:{if((a[2680]|0)==0?(wa(2680)|0)!=0:0){c[666]=2688;c[668]=2692;Va(2680)}if((a[2712]|0)==0?(wa(2712)|0)!=0:0){c[674]=2720;c[676]=2736;Va(2712)}b:do{if(r){o=87}else{t=s+4|0;u=e;while(1){c[t>>2]=0;c[s>>2]=0;cc[c[(c[u>>2]|0)+28>>2]&63](u,s);x=c[666]|0;v=(c[668]|0)-x|0;w=c[s>>2]|0;if(((c[t>>2]|0)-w|0)==(v|0)){v=w+v|0;while(1){if(!(w>>>0<v>>>0)){break b}if((a[w]|0)==(a[x]|0)){x=x+1|0;w=w+1|0}else{break}}}u=dc[c[(c[u>>2]|0)+12>>2]&1023](u)|0;if((u|0)==0){o=87;break}}}}while(0);do{if((o|0)==87){u=c[668]|0;t=408;s=c[666]|0;while(1){if(!(s>>>0<u>>>0)){o=90;break}if((a[s]|0)==(a[t]|0)){t=t+1|0;s=s+1|0}else{break}}if((o|0)==90?(a[t]|0)==0:0){break}c:do{if(r){o=100}else{o=p+4|0;r=e;while(1){c[o>>2]=0;c[p>>2]=0;cc[c[(c[r>>2]|0)+28>>2]&63](r,p);u=c[674]|0;t=(c[676]|0)-u|0;s=c[p>>2]|0;if(((c[o>>2]|0)-s|0)==(t|0)){t=s+t|0;while(1){if(!(s>>>0<t>>>0)){o=104;break c}if((a[s]|0)==(a[u]|0)){u=u+1|0;s=s+1|0}else{break}}}r=dc[c[(c[r>>2]|0)+12>>2]&1023](r)|0;if((r|0)==0){o=100;break}}}}while(0);d:do{if((o|0)==100){s=c[676]|0;r=408;p=c[674]|0;while(1){if(!(p>>>0<s>>>0)){break}if((a[p]|0)==(a[r]|0)){r=r+1|0;p=p+1|0}else{break d}}if((a[r]|0)==0){o=104}}}while(0);e:do{if((o|0)==104){Wd(d+4|0,n)|0;p=c[q>>2]|0;o=408;n=c[n>>2]|0;while(1){if(!(n>>>0<p>>>0)){break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{break e}}if((a[o]|0)==0){c[f>>2]=c[1320];i=l;return}}}while(0);c[m+4>>2]=0;c[m>>2]=0;cc[c[(c[e>>2]|0)+28>>2]&63](e,m);f=c[d+24>>2]|0;o=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(o>>>0<e>>>0){n=0;do{n=((a[o]|0)==10)+n|0;o=o+1|0}while((o|0)!=(e|0))}else{n=0}Xd(f,3,n+d|0,2744,m);i=l;return}}while(0);d=Vd(d)|0;if((f|0)==0){i=l;return}c[f>>2]=d;i=l;return};case 1:{p=C+4|0;c[p>>2]=0;c[C>>2]=0;m=d+4|0;le(m,C,255)|0;p=c[p>>2]|0;n=1936;q=c[C>>2]|0;while(1){if(!(q>>>0<p>>>0)){break}if((a[q]|0)==(a[n]|0)){n=n+1|0;q=q+1|0}else{o=126;break}}if((o|0)==126){i=l;return}if((a[n]|0)!=0){i=l;return}o=d+8|0;if(Zc(m,41)|0){i=l;return}n=(f|0)==0;r=0;while(1){if(((c[o>>2]|0)-(c[m>>2]|0)|0)<=0){o=126;break}if((r|0)>=(dc[c[(c[e>>2]|0)+16>>2]&1023](e)|0)){o=126;break}q=hc[c[(c[e>>2]|0)+24>>2]&63](e,r)|0;if(n){p=0}else{p=f+(dc[c[(c[q>>2]|0)+40>>2]&1023](q)|0)|0}ie(d,q,p,c[q+16>>2]&255);if(Zc(m,41)|0){o=126;break}else{r=r+1|0}}if((o|0)==126){i=l;return}break};case 0:case 8:{i=l;return};default:{f=c[d+24>>2]|0;n=c[d+12>>2]|0;e=c[d+4>>2]|0;d=c[d+16>>2]|0;if(n>>>0<e>>>0){m=0;do{m=((a[n]|0)==10)+m|0;n=n+1|0}while((n|0)!=(e|0))}else{m=0}Xd(f,3,m+d|0,2768,0);i=l;return}}}}while(0);me(d,e,f);i=l;return}function je(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;i=i+16|0;f=h+8|0;j=h;g=f+4|0;c[g>>2]=0;c[f>>2]=0;m=b+4|0;n=c[m+4>>2]|0;o=j;c[o>>2]=c[m>>2];c[o+4>>2]=n;if((d|0)>0){bu(e|0,0,d<<2|0)|0;b=0}else{b=0}do{Wd(j,f)|0;m=c[f>>2]|0;l=c[g>>2]|0;n=1936;k=m;while(1){if(!(k>>>0<l>>>0)){k=6;break}if((a[k]|0)==(a[n]|0)){n=n+1|0;k=k+1|0}else{n=1960;o=m;k=10;break}}if((k|0)==6){k=0;if((a[n]|0)==0){if((b|0)<(d|0)){o=e+(b<<2)|0;c[o>>2]=(c[o>>2]|0)+1}b=b+1|0}else{n=1960;o=m;k=10}}do{if((k|0)==10){while(1){k=0;if(!(o>>>0<l>>>0)){k=12;break}if((a[o]|0)==(a[n]|0)){n=n+1|0;o=o+1|0;k=10}else{o=1800;n=m;break}}if((k|0)==12){k=0;if((a[n]|0)==0){b=b+ -1|0;break}else{o=1800;n=m}}while(1){if(!(n>>>0<l>>>0)){k=16;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{n=2232;break}}if((k|0)==16){k=0;if((a[o]|0)==0){break}else{n=2232}}while(1){if(!(m>>>0<l>>>0)){k=19;break}if((a[m]|0)==(a[n]|0)){n=n+1|0;m=m+1|0}else{l=1;break}}if((k|0)==19){l=(a[n]|0)!=0}if(l&(b|0)<(d|0)){o=e+(b<<2)|0;c[o>>2]=(c[o>>2]|0)+1}}}while(0);de(j)}while((b|0)>-1);i=h;return}function ke(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+224|0;j=g;h=g+24|0;n=g+16|0;m=g+12|0;if((e|0)==0){c[j>>2]=2240;c[j+4>>2]=2271;c[j+8>>2]=396;$a(8,j|0)|0;jb(1)}d=hc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0;e=c[e>>2]|0;if((e|0)==0){c[j>>2]=2288;c[j+4>>2]=2271;c[j+8>>2]=399;$a(8,j|0)|0;jb(1)}if((f|0)<=0){if((f|0)!=0){i=g;return}ie(b,d,c[e>>2]|0,c[d+16>>2]&255);i=g;return}p=n+4|0;c[p>>2]=0;c[n>>2]=0;k=b+4|0;o=le(k,n,255)|0;if((f|0)==1?(o&3|0)!=0:0){h=c[p>>2]|0;j=c[n>>2]|0;b=h-j|0;if((b|0)>2?(a[j]|0)==64:0){j=j+2|0;c[n>>2]=j;h=h+ -1|0;c[p>>2]=h}else{if((b|0)>1){j=j+1|0;c[n>>2]=j;h=h+ -1|0;c[p>>2]=h}}b=h-j|0;if((o&2048|0)==0){h=e+8|0;k=c[h>>2]|0;r=c[k+16>>2]&255;f=e+(r<<2)+16|0;if((r|0)==0){m=1}else{m=1;n=e+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<f>>>0){n=l}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)!=-2147483648&(b|0)>(0-k|0)|(m|0)==(b|0)):0)?Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,b)|0,m,b,1)|0:0){c[e+16>>2]=b}if((c[d+12>>2]|0)!=1){i=g;return}d=c[d+16>>2]&2031616;if((d|0)==851968){$t(c[e>>2]|0,j|0,b|0)|0;i=g;return}else if((d|0)==917504){$t(c[e>>2]|0,j|0,b|0)|0;i=g;return}else{i=g;return}}if(j>>>0<h>>>0){k=j;b=0;do{l=k+1|0;if((a[k]|0)==92){a:do{if(l>>>0<h>>>0){f=k+2|0;k=a[l]|0;switch(k<<24>>24){case 85:case 117:case 120:case 92:case 34:case 39:case 116:case 114:case 110:{l=f;f=1;break a};default:{}}l=f;f=(k+ -48<<24>>24&255)<8|0}else{f=0}}while(0);k=l;b=f+b|0}else{k=l;b=b+1|0}}while(k>>>0<h>>>0)}else{b=0}k=e+8|0;l=c[k>>2]|0;r=c[l+16>>2]&255;f=e+(r<<2)+16|0;if((r|0)==0){o=1}else{o=1;n=e+16|0;while(1){m=n+4|0;o=ba(c[n>>2]|0,o)|0;if(m>>>0<f>>>0){n=m}else{break}}}l=c[(dc[c[(c[l>>2]|0)+36>>2]&1023](l)|0)>>2]|0;if((!((c[(c[k>>2]|0)+16>>2]&255|0)!=1|(l|0)>-1)?!((l|0)!=-2147483648&(b|0)>(0-l|0)|(o|0)==(b|0)):0)?Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,b)|0,o,b,1)|0:0){c[e+16>>2]=b}if((c[d+12>>2]|0)!=1){i=g;return}d=c[d+16>>2]&2031616;if((d|0)==851968){d=c[e>>2]|0;b:while(1){while(1){if(!(j>>>0<h>>>0)){break b}e=j+1|0;b=a[j]|0;if(!(b<<24>>24==92)){l=45;break}c:do{if(e>>>0<h>>>0){b=j+2|0;switch(a[e]|0){case 92:case 34:case 39:case 116:case 114:case 110:{break};default:{j=b;b=e;break c}}j=b}else{j=e;b=e}}while(0);if((b-e|0)==1){l=39;break}}do{if((l|0)==39){e=a[e]|0;b=e<<24>>24;if((b|0)==110){a[d]=10;break}else if((b|0)==114){a[d]=13;break}else if((b|0)==116){a[d]=9;break}else{a[d]=e;break}}else if((l|0)==45){a[d]=b;j=e}}while(0);d=d+1|0}i=g;return}else if((d|0)==917504){d=c[e>>2]|0;d:while(1){while(1){if(!(j>>>0<h>>>0)){break d}e=j+1|0;b=a[j]|0;if(!(b<<24>>24==92)){l=60;break}e:do{if(e>>>0<h>>>0){b=j+2|0;switch(a[e]|0){case 92:case 34:case 39:case 116:case 114:case 110:{break};default:{j=b;b=e;break e}}j=b}else{j=e;b=e}}while(0);if((b-e|0)==1){l=54;break}}do{if((l|0)==54){b=a[e]|0;e=b<<24>>24;if((e|0)==110){a[d]=10;break}else if((e|0)==114){a[d]=13;break}else if((e|0)==116){a[d]=9;break}else{a[d]=b;break}}else if((l|0)==60){a[d]=b;j=e}}while(0);d=d+1|0}i=g;return}else{i=g;return}}p=c[p>>2]|0;o=1936;n=c[n>>2]|0;while(1){if(!(n>>>0<p>>>0)){l=75;break}if((a[n]|0)==(a[o]|0)){o=o+1|0;n=n+1|0}else{break}}if((l|0)==75?(a[o]|0)==0:0){l=e+8|0;n=c[l>>2]|0;n=dc[c[(c[n>>2]|0)+36>>2]&1023](n)|0;if((n|0)==0){c[j>>2]=2304;c[j+4>>2]=2271;c[j+8>>2]=443;$a(8,j|0)|0;jb(1)}f=c[n+(f+ -1<<2)>>2]|0;c[m>>2]=0;je(b,1,m);do{if((f|0)==-2147483648){f=c[m>>2]|0;m=c[l>>2]|0;r=c[m+16>>2]&255;n=e+(r<<2)+16|0;if((r|0)==0){q=1}else{q=1;p=e+16|0;while(1){o=p+4|0;q=ba(c[p>>2]|0,q)|0;if(o>>>0<n>>>0){p=o}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((!((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1)?!((m|0)!=-2147483648&(f|0)>(0-m|0)|(q|0)==(f|0)):0)?Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,f)|0,q,f,1)|0:0){c[e+16>>2]=f}}else{if((f|0)>=0){m=c[l>>2]|0;r=c[m+16>>2]&255;o=e+(r<<2)+16|0;if((r|0)==0){q=1}else{q=1;p=e+16|0;while(1){n=p+4|0;q=ba(c[p>>2]|0,q)|0;if(n>>>0<o>>>0){p=n}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1){break}if((m|0)!=-2147483648&(f|0)>(0-m|0)|(q|0)==(f|0)){break}if(!(Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,f)|0,q,f,1)|0)){break}c[e+16>>2]=f;break}f=0-f|0;o=c[m>>2]|0;m=c[l>>2]|0;p=c[m+16>>2]&255;n=e+(p<<2)+16|0;p=(p|0)==0;if((o|0)>(f|0)){if(p){q=1}else{q=1;p=e+16|0;while(1){o=p+4|0;q=ba(c[p>>2]|0,q)|0;if(o>>>0<n>>>0){p=o}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1){break}if((m|0)!=-2147483648&(f|0)>(0-m|0)|(q|0)==(f|0)){break}if(!(Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,f)|0,q,f,1)|0)){break}c[e+16>>2]=f;break}else{if(p){r=1}else{r=1;q=e+16|0;while(1){p=q+4|0;r=ba(c[q>>2]|0,r)|0;if(p>>>0<n>>>0){q=p}else{break}}}m=c[(dc[c[(c[m>>2]|0)+36>>2]&1023](m)|0)>>2]|0;if((c[(c[l>>2]|0)+16>>2]&255|0)!=1|(m|0)>-1){break}if((m|0)!=-2147483648&(o|0)>(0-m|0)|(r|0)==(o|0)){break}if(!(Md(e,ba(c[(c[e+12>>2]|0)+12>>2]|0,o)|0,r,o,1)|0)){break}c[e+16>>2]=o;break}}}while(0);p=c[e>>2]|0;l=c[d+12>>2]|0;e=b+8|0;if(Zc(k,41)|0){i=g;return}m=d+16|0;o=0;n=0;while(1){if(((c[e>>2]|0)-(c[k>>2]|0)|0)<=0){break}r=(n|0)<(f|0)?p:0;o=(r|0)==0|o;ie(b,d,r,c[m>>2]&255);de(k);if(Zc(k,41)|0){break}else{n=n+1|0;p=p+l|0}}if(!o){i=g;return}d=c[b+24>>2]|0;l=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(l>>>0<e>>>0){k=0;do{k=((a[l]|0)==10)+k|0;l=l+1|0}while((l|0)!=(e|0))}else{k=0}if((c[d>>2]|0)==0){i=g;return}c[j>>2]=k+b;c[j+4>>2]=3480;c[j+8>>2]=2328;e=wb(h|0,200,3560,j|0)|0;d=c[d>>2]|0;b=d;if((b|0)==0){i=g;return}else if((b|0)==1){c[j>>2]=h;$a(3584,j|0)|0;i=g;return}else{r=c[(c[d+8>>2]|0)+16>>2]&255;b=d+(r<<2)+16|0;if((r|0)==0){k=1}else{k=1;l=d+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<b>>>0){l=j}else{break}}}Pd(d,k,e,h)|0;i=g;return}}d=c[b+24>>2]|0;k=c[b+12>>2]|0;e=c[b+4>>2]|0;h=c[b+16>>2]|0;if(k>>>0<e>>>0){j=0;do{j=((a[k]|0)==10)+j|0;k=k+1|0}while((k|0)!=(e|0))}else{j=0}Xd(d,3,j+h|0,1944,0);i=g;return}function le(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;h=c[b>>2]|0;g=c[b+4>>2]|0;a:do{if(h>>>0<g>>>0){do{k=a[h]|0;if(!((k&255)<127)){break a}b:do{if((a[31128+(k&255)|0]&16)==0){if(!(k<<24>>24==47)){break a}k=h+1|0;if(k>>>0<g>>>0){k=a[k]|0;if(k<<24>>24==47){h=h+2|0;c[b>>2]=h;if(!(h>>>0<g>>>0)){break}while(1){p=a[h]|0;if(p<<24>>24==10|p<<24>>24==13){break b}h=h+1|0;c[b>>2]=h;if(!(h>>>0<g>>>0)){break b}}}else if(!(k<<24>>24==42)){break}k=h+2|0;c[b>>2]=k;l=h+3|0;c:do{if(l>>>0<g>>>0){while(1){if((a[k]|0)==42){h=k+1|0;if((a[l]|0)==47){break c}}else{h=k+1|0}c[b>>2]=h;l=h+1|0;if(l>>>0<g>>>0){k=h}else{k=h;j=13;break}}}else{j=13}}while(0);if((j|0)==13){j=0;h=k+1|0}if(h>>>0<g>>>0){h=k+2|0;c[b>>2]=h;break}else{c[b>>2]=h;break}}}else{h=h+1|0;c[b>>2]=h}}while(0)}while(h>>>0<g>>>0)}}while(0);if(!(h>>>0<g>>>0)){p=0;i=f;return p|0}n=h+1|0;c[b>>2]=n;k=a[h]|0;j=n>>>0<g>>>0;if(j){l=a[n]|0}else{l=0}d:do{if((e|0)==0){e=0;j=87}else{e:do{if(k<<24>>24==64){if(l<<24>>24==39){if(!j){k=0;j=39;break}n=h+2|0;c[b>>2]=n;k=1;j=39;break}else if(!(l<<24>>24==34)){j=55;break}if(j){n=h+2|0;c[b>>2]=n;while(1){if(!(n>>>0<g>>>0)){e=0;j=36;break e}j=n+1|0;c[b>>2]=j;if((a[n]|0)==34){n=j;e=0;j=36;break}else{n=j}}}else{e=0;j=31}}else if(k<<24>>24==34){e=0;j=31}else if(k<<24>>24==39){k=0;j=39}else{e=k<<24>>24==42;if(e){e=e?128:0;j=87;break d}if(!(k<<24>>24==102|k<<24>>24==116)){if((k+ -40<<24>>24&255)<2){e=256;j=87;break d}j=k<<24>>24==44;if(j){e=j?1024:0;j=87;break d}else{j=55;break}}if(!j){e=512;j=87;break d}while(1){j=a[n]|0;if(!((j&255)<127)){e=512;j=88;break e}if((a[31128+(j&255)|0]&1)==0){e=512;j=88;break e}n=n+1|0;c[b>>2]=n;if(!(n>>>0<g>>>0)){e=512;j=88;break}}}}while(0);f:do{if((j|0)==31){while(1){while(1){if(!(n>>>0<g>>>0)){j=36;break f}j=n+1|0;c[b>>2]=j;k=a[n]|0;if(k<<24>>24==34){n=j;j=36;break f}else if(k<<24>>24==92){break}else{n=j}}if(!(j>>>0<g>>>0)){n=j;e=1;j=31;continue}n=n+2|0;c[b>>2]=n;e=1;j=31}}else if((j|0)==39){e=1;while(1){if(k){break}while(1){if(!(n>>>0<g>>>0)){j=88;break f}l=n+1|0;c[b>>2]=l;j=a[n]|0;if(j<<24>>24==92){break}else if(j<<24>>24==39){n=l;j=88;break f}else{n=l}}if(!(l>>>0<g>>>0)){n=l;e=2049;continue}n=n+2|0;c[b>>2]=n;e=2049}while(1){if(!(n>>>0<g>>>0)){j=88;break f}j=n+1|0;c[b>>2]=j;if((a[n]|0)==39){n=j;j=88;break}else{n=j}}}else if((j|0)==55){c[b>>2]=h;e=g-h|0;k=(e|0)<3;g:do{if(!k){m=h+3|0;l=3312;j=h;while(1){if(!(j>>>0<m>>>0)){j=63;break}if((a[j]|0)==(a[l]|0)){l=l+1|0;j=j+1|0}else{j=59;break}}h:do{if((j|0)==59){if(k){break g}n=h+3|0;l=3296;k=h;while(1){if(!(k>>>0<n>>>0)){break h}if((a[k]|0)==(a[l]|0)){l=l+1|0;k=k+1|0}else{break}}if((e|0)<4){break g}n=h+4|0;e=3304;k=h;while(1){if(!(k>>>0<n>>>0)){break}if((a[k]|0)==(a[e]|0)){e=e+1|0;k=k+1|0}else{break g}}c[b>>2]=n;e=48;j=87;break d}else if((j|0)==63){n=h+3|0}}while(0);c[b>>2]=n;e=32;j=88;break f}}while(0);if(h>>>0<g>>>0){n=h;k=0;m=0;o=0;l=0;e=0}else{b=d;e=0;break}i:while(1){p=a[n]|0;do{if(p<<24>>24!=46|k){if(p<<24>>24==45){if((n|0)!=(h|0)|l){j=88;break f}n=h;l=1;e=e|16;break}else if(p<<24>>24==101|p<<24>>24==69){j=77}if((j|0)==77?(j=0,!(o|m^1)):0){n=n+1|0;c[b>>2]=n;if(!(n>>>0<g>>>0)){d=0;j=91;break i}if((a[n]|0)==43){o=1;e=e|32;break}if((a[n]|0)!=45){d=0;j=91;break i}o=1;e=e|48;break}if(!((p+ -48<<24>>24&255)<10)?!(p<<24>>24==102|p<<24>>24==116|p<<24>>24==120):0){j=88;break f}m=1;e=e|40}else{k=1;e=e|32}}while(0);n=n+1|0;c[b>>2]=n;if(!(n>>>0<g>>>0)){j=88;break f}}if((j|0)==91){i=f;return d|0}}}while(0);if((j|0)==36){e=e?2050:2;j=88}if((j|0)==88){if(n>>>0>h>>>0){b=d;break}else{b=d}}c[b>>2]=0;c[d+4>>2]=0;p=e;i=f;return p|0}}while(0);if((j|0)==87){b=d}c[b>>2]=h;c[d+4>>2]=n;p=e;i=f;return p|0}function me(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+48|0;n=f+8|0;h=f;o=f+40|0;l=f+32|0;g=f+24|0;p=o+4|0;c[p>>2]=0;c[o>>2]=0;j=b+4|0;m=b+8|0;s=c[j>>2]|0;a:do{if(((c[m>>2]|0)-s|0)>=1){q=s+1|0;r=1800;while(1){if(!(s>>>0<q>>>0)){break}if((a[s]|0)==(a[r]|0)){r=r+1|0;s=s+1|0}else{break a}}Ia(33304)|0;t=Vd(b)|0;s=c[(c[d>>2]|0)+52>>2]|0;t=hc[c[(c[t>>2]|0)+44>>2]&63](t,1)|0;$b[s&63](d,t,e)|0}}while(0);Wd(j,o)|0;d=c[p>>2]|0;p=1936;o=c[o>>2]|0;while(1){if(!(o>>>0<d>>>0)){k=9;break}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{break}}if((k|0)==9?(a[p]|0)==0:0){o=Vd(b)|0;de(j);d=c[j>>2]|0;p=c[m>>2]|0;b:do{if(d>>>0<p>>>0){do{q=a[d]|0;if(!((q&255)<127)){break b}c:do{if((a[31128+(q&255)|0]&16)==0){if(!(q<<24>>24==47)){break b}q=d+1|0;if(q>>>0<p>>>0){q=a[q]|0;if(q<<24>>24==47){d=d+2|0;c[j>>2]=d;if(!(d>>>0<p>>>0)){break}while(1){t=a[d]|0;if(t<<24>>24==10|t<<24>>24==13){break c}d=d+1|0;c[j>>2]=d;if(!(d>>>0<p>>>0)){break c}}}else if(!(q<<24>>24==42)){break}q=d+2|0;c[j>>2]=q;r=d+3|0;d:do{if(r>>>0<p>>>0){while(1){if((a[q]|0)==42){d=q+1|0;if((a[r]|0)==47){break d}}else{d=q+1|0}c[j>>2]=d;r=d+1|0;if(r>>>0<p>>>0){q=d}else{q=d;k=25;break}}}else{k=25}}while(0);if((k|0)==25){k=0;d=q+1|0}if(d>>>0<p>>>0){d=q+2|0;c[j>>2]=d;break}else{c[j>>2]=d;break}}}else{d=d+1|0;c[j>>2]=d}}while(0)}while(d>>>0<p>>>0)}}while(0);p=p-d|0;e:do{if((p|0)<1){k=42}else{s=d+1|0;r=1840;q=d;while(1){if(!(q>>>0<s>>>0)){break}if((a[q]|0)==(a[r]|0)){r=r+1|0;q=q+1|0}else{k=42;break e}}if((p|0)>=5){q=d+5|0;p=2808;while(1){if(!(d>>>0<q>>>0)){k=42;break e}if((a[d]|0)==(a[p]|0)){p=p+1|0;d=d+1|0}else{break}}}l=Vd(b)|0;de(j)}}while(0);if((k|0)==42){c[l>>2]=2816;c[l+4>>2]=2834;l=Qc(c[b>>2]|0,l)|0;if((l|0)==0){p=0}else{p=c[l>>2]|0}l=o;o=p}if((o|0)==0){c[n>>2]=2840;c[n+4>>2]=2271;c[n+8>>2]=699;$a(8,n|0)|0;jb(1)}if((l|0)==0){c[n>>2]=2872;c[n+4>>2]=2271;c[n+8>>2]=700;$a(8,n|0)|0;jb(1)}p=c[j>>2]|0;m=c[m>>2]|0;f:do{if(p>>>0<m>>>0){do{n=a[p]|0;if(!((n&255)<127)){break f}g:do{if((a[31128+(n&255)|0]&16)==0){if(!(n<<24>>24==47)){break f}n=p+1|0;if(n>>>0<m>>>0){n=a[n]|0;if(n<<24>>24==47){p=p+2|0;c[j>>2]=p;if(!(p>>>0<m>>>0)){break}while(1){t=a[p]|0;if(t<<24>>24==10|t<<24>>24==13){break g}p=p+1|0;c[j>>2]=p;if(!(p>>>0<m>>>0)){break g}}}else if(!(n<<24>>24==42)){break}n=p+2|0;c[j>>2]=n;p=p+3|0;h:do{if(p>>>0<m>>>0){d=p;while(1){if((a[n]|0)==42){p=n+1|0;if((a[d]|0)==47){break h}else{n=p}}else{n=n+1|0}c[j>>2]=n;p=n+1|0;if(p>>>0<m>>>0){d=p}else{k=61;break}}}else{k=61}}while(0);if((k|0)==61){k=0;p=n+1|0}if(p>>>0<m>>>0){p=n+2|0;c[j>>2]=p;break}else{c[j>>2]=p;break}}}else{p=p+1|0;c[j>>2]=p}}while(0)}while(p>>>0<m>>>0)}}while(0);i:do{if((m-p|0)<5){k=74}else{m=p+5|0;n=2808;while(1){if(!(p>>>0<m>>>0)){break}if((a[p]|0)==(a[n]|0)){n=n+1|0;p=p+1|0}else{k=74;break i}}t=h;c[t>>2]=-2147483648;c[t+4>>2]=-1}}while(0);if((k|0)==74?!(fe(j,h)|0):0){g=c[b+24>>2]|0;j=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(j>>>0<e>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(e|0))}else{h=0}Xd(g,3,h+b|0,2896,0);i=f;return}de(j);d=b+12|0;s=c[d>>2]|0;n=b+4|0;p=c[n>>2]|0;m=b+16|0;q=c[m>>2]|0;if(s>>>0<p>>>0){r=0;do{r=((a[s]|0)==10)+r|0;s=s+1|0}while((s|0)!=(p|0))}else{r=0}s=r+q|0;r=b+24|0;q=0;do{ne(b,0);q=q+1|0;if((c[(c[r>>2]|0)+8>>2]|0)>0){k=90;break}de(j);t=c[j>>2]|0}while(!(Zc(j,41)|0));if((k|0)==90){i=f;return}j=c[h>>2]|0;h=c[h+4>>2]|0;if(!((j|0)==-2147483648&(h|0)==-1)?!((q|0)==(j|0)&(((q|0)<0)<<31>>31|0)==(h|0)):0){b=c[r>>2]|0;h=c[d>>2]|0;e=c[n>>2]|0;g=c[m>>2]|0;if(h>>>0<e>>>0){j=0;do{j=((a[h]|0)==10)+j|0;h=h+1|0}while((h|0)!=(e|0))}else{j=0}Xd(b,2,j+g|0,2920,0);i=f;return}e=c[c[e>>2]>>2]|0;c[g>>2]=p;c[g+4>>2]=t;oe(e,c[1320]|0,q,o,l,s,g)|0;if((a[b+20|0]|0)==0){i=f;return}pe(e,c[r>>2]|0);i=f;return}g=c[b+24>>2]|0;j=c[b+12>>2]|0;e=c[b+4>>2]|0;b=c[b+16>>2]|0;if(j>>>0<e>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(e|0))}else{h=0}Xd(g,3,h+b|0,1944,0);i=f;return}function ne(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;h=d+8|0;m=d;g=h+4|0;c[g>>2]=0;c[h>>2]=0;f=b+4|0;Wd(f,h)|0;k=c[g>>2]|0;j=2808;l=c[h>>2]|0;while(1){if(!(l>>>0<k>>>0)){e=4;break}if((a[l]|0)==(a[j]|0)){j=j+1|0;l=l+1|0}else{break}}if((e|0)==4?(a[j]|0)==0:0){if(!(Zc(f,40)|0)){e=c[b+24>>2]|0;h=c[b+12>>2]|0;f=c[b+4>>2]|0;b=c[b+16>>2]|0;if(h>>>0<f>>>0){g=0;do{g=((a[h]|0)==10)+g|0;h=h+1|0}while((h|0)!=(f|0))}else{g=0}Xd(e,3,g+b|0,1944,0);i=d;return}Wd(f,h)|0;if(!(fe(h,m)|0)){e=c[b+24>>2]|0;h=c[b+12>>2]|0;f=c[b+4>>2]|0;b=c[b+16>>2]|0;if(h>>>0<f>>>0){g=0;do{g=((a[h]|0)==10)+g|0;h=h+1|0}while((h|0)!=(f|0))}else{g=0}Xd(e,3,g+b|0,2984,0);i=d;return}de(f);b=0;a:while(1){b:while(1){Wd(f,h)|0;k=c[h>>2]|0;j=c[g>>2]|0;l=1936;m=k;while(1){if(!(m>>>0<j>>>0)){e=21;break}if((a[m]|0)==(a[l]|0)){l=l+1|0;m=m+1|0}else{break}}if((e|0)==21?(e=0,(a[l]|0)==0):0){b=1;continue a}c:do{if(b){l=1960;m=k;while(1){if(!(m>>>0<j>>>0)){break}if((a[m]|0)==(a[l]|0)){l=l+1|0;m=m+1|0}else{l=1960;break c}}if((a[l]|0)==0){b=0;continue a}else{l=1960}}else{l=1960}}while(0);while(1){if(!(k>>>0<j>>>0)){break}if((a[k]|0)==(a[l]|0)){l=l+1|0;k=k+1|0}else{continue b}}if((a[l]|0)==0){break a}}}i=d;return}e=c[b+24>>2]|0;h=c[b+12>>2]|0;f=c[b+4>>2]|0;b=c[b+16>>2]|0;if(h>>>0<f>>>0){g=0;do{g=((a[h]|0)==10)+g|0;h=h+1|0}while((h|0)!=(f|0))}else{g=0}Xd(e,3,g+b|0,2968,0);i=d;return}function oe(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0;j=i;i=i+16|0;l=j;if((c[a>>2]|0)!=0){c[l>>2]=5712;c[l+4>>2]=5759;c[l+8>>2]=25;$a(8,l|0)|0;jb(1)}k=a+12|0;if((c[(c[(c[k>>2]|0)+12>>2]|0)+12>>2]|0)!=40){c[l>>2]=5784;c[l+4>>2]=5759;c[l+8>>2]=26;$a(8,l|0)|0;jb(1)}c[a>>2]=b;b=c[a+4>>2]|0;if((c[(c[b+8>>2]|0)+16>>2]&255|0)!=0){c[l>>2]=1048;c[l+4>>2]=143;c[l+8>>2]=1575;$a(8,l|0)|0;jb(1)}o=b+12|0;n=c[o>>2]|0;hc[c[(c[n>>2]|0)+56>>2]&63](n,c[b>>2]|0)|0;c[o>>2]=e;Ld(b,c[e+12>>2]|0,0)|0;e=c[o>>2]|0;$b[c[(c[e>>2]|0)+48>>2]&63](e,c[b>>2]|0,0)|0;e=c[a+8>>2]|0;if((c[(c[e+8>>2]|0)+16>>2]&255|0)!=0){c[l>>2]=1048;c[l+4>>2]=143;c[l+8>>2]=1575;$a(8,l|0)|0;jb(1)}l=e+12|0;o=c[l>>2]|0;hc[c[(c[o>>2]|0)+56>>2]&63](o,c[e>>2]|0)|0;c[l>>2]=f;Ld(e,c[f+12>>2]|0,0)|0;l=c[l>>2]|0;$b[c[(c[l>>2]|0)+48>>2]&63](l,c[e>>2]|0,0)|0;l=c[k>>2]|0;f=l+8|0;e=c[f>>2]|0;o=c[e+16>>2]&255;b=l+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=l+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<b>>>0){o=m}else{break}}}e=c[(dc[c[(c[e>>2]|0)+36>>2]&1023](e)|0)>>2]|0;if((!((c[(c[f>>2]|0)+16>>2]&255|0)!=1|(e|0)>-1)?!((e|0)!=-2147483648&(d|0)>(0-e|0)|(n|0)==(d|0)):0)?Md(l,ba(c[(c[l+12>>2]|0)+12>>2]|0,d)|0,n,d,1)|0:0){c[l+16>>2]=d}c[a+16>>2]=g;n=c[h+4>>2]|0;o=a+20|0;c[o>>2]=c[h>>2];c[o+4>>2]=n;if((d|0)<=0){i=j;return 0}g=0;k=c[c[k>>2]>>2]|0;while(1){c[k+32>>2]=1;c[k+36>>2]=1;c[k+8>>2]=a;g=g+1|0;if((g|0)==(d|0)){break}else{k=k+40|0}}i=j;return 0}function pe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=i;i=i+96|0;e=j;h=j+88|0;s=j+68|0;o=j+40|0;f=j+12|0;m=b+20|0;l=c[m>>2]|0;m=c[m+4>>2]|0;q=b+12|0;r=c[q>>2]|0;t=c[r>>2]|0;g=c[r+4>>2]|0;if((t|0)==0){i=j;return}if((c[t>>2]|0)!=0){i=j;return}c[h>>2]=0;k=h+4|0;c[k>>2]=0;c[s+0>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;c[s+12>>2]=0;a[s+16|0]=0;v=c[c[b>>2]>>2]|0;n=b+16|0;u=c[n>>2]|0;c[o+24>>2]=s;c[o>>2]=v;c[o+4>>2]=l;c[o+8>>2]=m;c[o+12>>2]=l;c[o+16>>2]=u;a[o+20|0]=0;if(t>>>0<g>>>0){do{qe(o,t,h);t=t+40|0}while(t>>>0<g>>>0);if((c[k>>2]|0)==0){p=c[q>>2]|0}else{c[e>>2]=5912;c[e+4>>2]=5759;c[e+8>>2]=180;$a(8,e|0)|0;jb(1)}}else{p=r}o=c[p>>2]|0;c[k>>2]=Ec(c[c[c[o+8>>2]>>2]>>2]|0,c[h>>2]|0)|0;u=c[c[b>>2]>>2]|0;v=c[n>>2]|0;c[f+24>>2]=d;c[f>>2]=u;c[f+4>>2]=l;c[f+8>>2]=m;c[f+12>>2]=l;c[f+16>>2]=v;a[f+20|0]=0;if(o>>>0<g>>>0){do{qe(f,o,h);o=o+40|0}while(o>>>0<g>>>0)}if((c[h>>2]|0)==0){i=j;return}else{c[e>>2]=2952;c[e+4>>2]=2271;c[e+8>>2]=797;$a(8,e|0)|0;jb(1)}}function qe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;f=i;i=i+3392|0;x=f+32|0;t=f+16|0;o=f+8|0;n=f+64|0;l=f+80|0;q=f+24|0;k=f+72|0;D=f;A=f+56|0;r=f+48|0;h=b+24|0;z=c[h>>2]|0;c[l+3264>>2]=0;c[l+3260>>2]=0;g=l+3236|0;c[g>>2]=0;c[l+3240>>2]=0;c[l+3244>>2]=0;v=l+12|0;c[v>>2]=0;c[l+1216>>2]=0;w=l+2420|0;c[w>>2]=0;p=l+3304|0;c[p>>2]=0;y=l+3232|0;c[y>>2]=d;B=c[d+8>>2]|0;s=l+3228|0;c[s>>2]=B;u=l+4|0;c[u>>2]=z;z=l+8|0;c[z>>2]=e;a[l+3308|0]=0;C=c[B+4>>2]|0;c[l+3276>>2]=C;c[l+3272>>2]=c[C>>2];c[l+3268>>2]=c[C+12>>2];B=c[B+8>>2]|0;c[l+3288>>2]=B;c[l+3284>>2]=c[B>>2];c[l+3280>>2]=c[B+12>>2];c[l+2424>>2]=0;B=l+3300|0;c[B>>2]=-1;bu(l+2428|0,0,800)|0;bu(l+1220|0,0,1200)|0;C=q+4|0;c[C>>2]=0;c[q>>2]=0;e=k+4|0;c[e>>2]=0;c[k>>2]=0;E=b+4|0;Wd(E,q)|0;H=c[C>>2]|0;G=2808;F=c[q>>2]|0;while(1){if(!(F>>>0<H>>>0)){j=4;break}if((a[F]|0)==(a[G]|0)){G=G+1|0;F=F+1|0}else{break}}if((j|0)==4?(a[G]|0)==0:0){if(!(Zc(E,40)|0)){g=c[h>>2]|0;j=c[b+12>>2]|0;d=c[b+4>>2]|0;b=c[b+16>>2]|0;if(j>>>0<d>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(d|0))}else{h=0}Xd(g,3,h+b|0,1944,0);i=f;return}Wd(E,q)|0;if(!(fe(q,D)|0)){g=c[h>>2]|0;j=c[b+12>>2]|0;d=c[b+4>>2]|0;b=c[b+16>>2]|0;if(j>>>0<d>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(d|0))}else{h=0}Xd(g,3,h+b|0,2984,0);i=f;return}D=c[D>>2]|0;G=c[y>>2]|0;F=G+32|0;G=G+36|0;if((c[F>>2]|0)==(c[G>>2]|0)){c[G>>2]=D}c[F>>2]=D;c[g>>2]=d;de(E);Wd(E,k)|0;D=b+12|0;d=b+4|0;g=b+16|0;L=l+3296|0;F=l+3260|0;K=n+4|0;I=l+3252|0;J=l+3248|0;H=r+4|0;G=A+4|0;a:while(1){N=c[k>>2]|0;M=c[e>>2]|0;O=1960;P=N;while(1){if(!(P>>>0<M>>>0)){j=22;break}if((a[P]|0)==(a[O]|0)){O=O+1|0;P=P+1|0}else{O=3008;break}}if((j|0)==22){if((a[O]|0)==0){j=136;break}else{O=3008}}while(1){if(!(N>>>0<M>>>0)){j=25;break}if((a[N]|0)==(a[O]|0)){O=O+1|0;N=N+1|0}else{j=46;break}}do{if((j|0)==25){j=0;if((a[O]|0)==0){if(!(Zc(E,40)|0)){j=27;break a}c[G>>2]=0;c[A>>2]=0;if(!(Wd(E,A)|0)){j=31;break a}if(!(Zc(E,41)|0)){j=35;break a}if((c[(c[z>>2]|0)+4>>2]|0)!=0){if(!(fe(A,o)|0)){S=c[A>>2]|0;c[x>>2]=(c[G>>2]|0)-S;c[x+4>>2]=S;$a(6232,x|0)|0;break}S=o;M=c[S>>2]|0;S=c[S+4>>2]|0;if(!((S|0)<0|(S|0)==0&M>>>0<200)){c[x>>2]=M;$a(6192,x|0)|0;break}if((c[B>>2]|0)<0){c[l+(M<<2)+2428>>2]=1;c[B>>2]=M;break}else{c[x>>2]=M;$a(6144,x|0)|0;break}}}else{j=46}}}while(0);if((j|0)==46){j=0;if((re(l,k)|0)==0){M=c[h>>2]|0;Q=c[D>>2]|0;O=c[d>>2]|0;N=c[g>>2]|0;if(Q>>>0<O>>>0){P=0;do{P=((a[Q]|0)==10)+P|0;Q=Q+1|0}while((Q|0)!=(O|0))}else{P=0}Xd(M,2,P+N|0,3040,k)}if(!(Zc(E,40)|0)){j=51;break}Wd(E,q)|0;b:while(1){M=c[C>>2]|0;O=1960;N=c[q>>2]|0;while(1){if(!(N>>>0<M>>>0)){j=58;break}if((a[N]|0)==(a[O]|0)){O=O+1|0;N=N+1|0}else{break}}if((j|0)==58?(j=0,(a[O]|0)==0):0){break}c[l>>2]=0;N=c[L>>2]|0;c:do{if((N|0)==0){j=64}else{S=c[(c[N>>2]|0)+24>>2]|0;O=c[J>>2]|0;c[J>>2]=O+1;O=hc[S&63](N,O)|0;do{if((O|0)==0){if((c[p>>2]|0)!=0){O=c[I>>2]|0;R=q;N=c[R>>2]|0;R=c[R+4>>2]|0;S=F;c[S>>2]=N;c[S+4>>2]=R;if((O|0)==0){break c}else{break}}else{c[I>>2]=0;c[l>>2]=1;j=64;break c}}else{c[I>>2]=O;R=q;N=c[R>>2]|0;R=c[R+4>>2]|0;S=F;c[S>>2]=N;c[S+4>>2]=R}}while(0);c[H>>2]=0;c[r>>2]=0;cc[c[(c[O>>2]|0)+28>>2]&63](O,r);P=c[r>>2]|0;O=c[H>>2]|0;R=3064;Q=P;while(1){if(!(Q>>>0<O>>>0)){j=69;break}if((a[Q]|0)==(a[R]|0)){R=R+1|0;Q=Q+1|0}else{R=3120;Q=P;break}}if((j|0)==69){j=0;if((a[R]|0)==0){if((c[p>>2]|0)!=0){j=71;break a}S=c[v>>2]|0;c[v>>2]=S+1;S=l+(S<<2)+16|0;c[p>>2]=S;c[S>>2]=0;continue b}else{R=3120;Q=P}}while(1){if(!(Q>>>0<O>>>0)){j=75;break}if((a[Q]|0)==(a[R]|0)){R=R+1|0;Q=Q+1|0}else{Q=3136;R=P;break}}if((j|0)==75){j=0;if((a[R]|0)==0){se(l,q);break}else{Q=3136;R=P}}while(1){if(!(R>>>0<O>>>0)){j=79;break}if((a[R]|0)==(a[Q]|0)){Q=Q+1|0;R=R+1|0}else{Q=3144;R=P;break}}if((j|0)==79){j=0;if((a[Q]|0)==0){fe(q,t)|0;M=t;N=c[M>>2]|0;M=c[M+4>>2]|0;if((M|0)>=0){O=c[(c[s>>2]|0)+12>>2]|0;S=c[(c[O+8>>2]|0)+16>>2]&255;Q=O+(S<<2)+16|0;if((S|0)==0){P=0;R=1}else{R=1;S=O+16|0;while(1){P=S+4|0;R=ba(c[S>>2]|0,R)|0;if(P>>>0<Q>>>0){S=P}else{break}}P=((R|0)<0)<<31>>31}if((M|0)<(P|0)|(M|0)==(P|0)&N>>>0<R>>>0){c[l>>2]=10;S=Nd(O,N)|0;c[l+(c[v>>2]<<2)+416>>2]=0;M=c[v>>2]|0;c[v>>2]=M+1;c[l+(M<<2)+16>>2]=S;M=c[p>>2]|0;if((M|0)==0){break}c[M>>2]=(c[M>>2]|0)+1;break}}c[l>>2]=0;break}else{Q=3144;R=P}}while(1){if(!(R>>>0<O>>>0)){j=91;break}if((a[R]|0)==(a[Q]|0)){Q=Q+1|0;R=R+1|0}else{Q=3152;R=P;break}}if((j|0)==91){j=0;if((a[Q]|0)==0){te(l,q)|0;break}else{Q=3152;R=P}}while(1){if(!(R>>>0<O>>>0)){j=95;break}if((a[R]|0)==(a[Q]|0)){Q=Q+1|0;R=R+1|0}else{Q=3176;R=P;break}}if((j|0)==95){j=0;if((a[Q]|0)==0){ue(l,q);break}else{Q=3176;R=P}}while(1){if(!(R>>>0<O>>>0)){j=99;break}if((a[R]|0)==(a[Q]|0)){Q=Q+1|0;R=R+1|0}else{Q=3200;break}}if((j|0)==99){j=0;if((a[Q]|0)==0){ve(l,q,1);break}else{Q=3200}}while(1){if(!(P>>>0<O>>>0)){j=103;break}if((a[P]|0)==(a[Q]|0)){Q=Q+1|0;P=P+1|0}else{break}}if((j|0)==103?(j=0,(a[Q]|0)==0):0){c[l>>2]=12;c[l+(c[v>>2]<<2)+416>>2]=0;S=c[v>>2]|0;c[v>>2]=S+1;c[l+(S<<2)+16>>2]=N+1;N=c[p>>2]|0;if((N|0)!=0){c[N>>2]=(c[N>>2]|0)+1}c[l+(c[v>>2]<<2)+416>>2]=0;S=c[v>>2]|0;c[v>>2]=S+1;c[l+(S<<2)+16>>2]=M+ -1;M=c[p>>2]|0;if((M|0)==0){break}c[M>>2]=(c[M>>2]|0)+1;break}ve(l,q,0)}}while(0);if((j|0)==64){j=0;Q=q;R=c[Q+4>>2]|0;S=F;c[S>>2]=c[Q>>2];c[S+4>>2]=R}de(E);N=c[l>>2]|0;M=(N|0)<6;if(!(!M?(a[(c[h>>2]|0)+16|0]|0)==0:0)){j=111}d:do{if((j|0)==111){j=0;R=c[D>>2]|0;P=c[d>>2]|0;O=c[g>>2]|0;if(R>>>0<P>>>0){Q=0;do{Q=((a[R]|0)==10)+Q|0;R=R+1|0}while((R|0)!=(P|0))}else{Q=0}O=Q+O|0;switch(N|0){case 2:{N=6384;break};case 4:{N=6448;break};case 5:{N=6472;break};case 3:{c[K>>2]=0;c[n>>2]=0;S=c[I>>2]|0;cc[c[(c[S>>2]|0)+28>>2]&63](S,n);Xd(c[u>>2]|0,2,O,6408,n);break d};case 10:{N=6496;break};case 6:{N=6520;break};case 11:{N=6544;break};case 9:{N=6568;break};case 7:{N=6592;break};case 8:{N=6616;break};case 12:{N=6640;break};case 13:{N=6664;break};case 0:{N=(c[L>>2]|0)==0;if(N){break d}else{N=N?0:6336}break};case 1:{N=6360;break};default:{N=6688}}Xd(c[u>>2]|0,M?2:0,O,N,F)}}while(0);Wd(E,q)|0}we(l)|0}Wd(E,k)|0;O=c[e>>2]|0;M=3216;N=c[k>>2]|0;while(1){if(!(N>>>0<O>>>0)){break}if((a[N]|0)==(a[M]|0)){M=M+1|0;N=N+1|0}else{continue a}}if((a[M]|0)!=0){continue}Wd(E,k)|0}if((j|0)==27){b=c[h>>2]|0;h=c[D>>2]|0;d=c[d>>2]|0;g=c[g>>2]|0;if(h>>>0<d>>>0){j=0;do{j=((a[h]|0)==10)+j|0;h=h+1|0}while((h|0)!=(d|0))}else{j=0}Xd(b,3,j+g|0,1944,0);i=f;return}else if((j|0)==31){b=c[h>>2]|0;h=c[D>>2]|0;d=c[d>>2]|0;g=c[g>>2]|0;if(h>>>0<d>>>0){j=0;do{j=((a[h]|0)==10)+j|0;h=h+1|0}while((h|0)!=(d|0))}else{j=0}Xd(b,3,j+g|0,3016,0);i=f;return}else if((j|0)==35){b=c[h>>2]|0;h=c[D>>2]|0;d=c[d>>2]|0;g=c[g>>2]|0;if(h>>>0<d>>>0){j=0;do{j=((a[h]|0)==10)+j|0;h=h+1|0}while((h|0)!=(d|0))}else{j=0}Xd(b,3,j+g|0,2056,0);i=f;return}else if((j|0)==51){b=c[h>>2]|0;j=c[D>>2]|0;d=c[d>>2]|0;g=c[g>>2]|0;if(j>>>0<d>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(d|0))}else{h=0}Xd(b,3,h+g|0,1944,0);i=f;return}else if((j|0)==71){c[x>>2]=3080;c[x+4>>2]=2271;c[x+8>>2]=904;$a(8,x|0)|0;jb(1)}else if((j|0)==136){c[x>>2]=6936;c[x+4>>2]=6940;re(l,x)|0;we(l)|0;S=c[y>>2]|0;c[S+20>>2]=c[S>>2];if((c[(c[z>>2]|0)+4>>2]|0)!=0?(m=c[w>>2]|0,(m|0)>0):0){b=0;do{c[c[l+(b*12|0)+1228>>2]>>2]=c[c[l+(b*12|0)+1224>>2]>>2];b=b+1|0}while((b|0)!=(m|0))}b=c[e>>2]|0;l=1960;k=c[k>>2]|0;while(1){if(!(k>>>0<b>>>0)){j=142;break}if((a[k]|0)==(a[l]|0)){l=l+1|0;k=k+1|0}else{break}}if((j|0)==142?(a[l]|0)==0:0){i=f;return}b=c[h>>2]|0;h=c[D>>2]|0;d=c[d>>2]|0;g=c[g>>2]|0;if(h>>>0<d>>>0){j=0;do{j=((a[h]|0)==10)+j|0;h=h+1|0}while((h|0)!=(d|0))}else{j=0}Xd(b,3,j+g|0,2056,0);i=f;return}}g=c[h>>2]|0;j=c[b+12>>2]|0;d=c[b+4>>2]|0;b=c[b+16>>2]|0;if(j>>>0<d>>>0){h=0;do{h=((a[j]|0)==10)+h|0;j=j+1|0}while((j|0)!=(d|0))}else{h=0}Xd(g,3,h+b|0,2968,0);i=f;return}function re(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+16|0;k=h;if((a[6136]|0)==0?(wa(6136)|0)!=0:0){c[1532]=2392;c[6132>>2]=2409;Va(6136)}f=b+3296|0;c[f>>2]=0;c[b+3248>>2]=0;c[b+3252>>2]=0;c[b+12>>2]=0;c[b+1216>>2]=0;g=b+3308|0;a[g]=0;j=Qc(c[c[c[(c[b+3232>>2]|0)+8>>2]>>2]>>2]|0,d)|0;if((j|0)==0){p=c[f>>2]|0;i=h;return p|0}j=c[j>>2]|0;if((j|0)==0){p=c[f>>2]|0;i=h;return p|0}if((c[j+16>>2]&2031616|0)==983040){c[b+3292>>2]=j;c[f>>2]=hc[c[(c[j>>2]|0)+24>>2]&63](j,0)|0;p=c[f>>2]|0;i=h;return p|0}l=k+4|0;m=j;a:while(1){c[l>>2]=0;c[k>>2]=0;cc[c[(c[m>>2]|0)+28>>2]&63](m,k);p=c[1532]|0;o=(c[6132>>2]|0)-p|0;n=c[k>>2]|0;if(((c[l>>2]|0)-n|0)==(o|0)){o=n+o|0;while(1){if(!(n>>>0<o>>>0)){break a}if((a[n]|0)==(a[p]|0)){p=p+1|0;n=n+1|0}else{break}}}m=dc[c[(c[m>>2]|0)+12>>2]&1023](m)|0;if((m|0)==0){e=15;break}}if((e|0)==15){l=c[6132>>2]|0;k=408;m=c[1532]|0;while(1){if(!(m>>>0<l>>>0)){break}if((a[m]|0)==(a[k]|0)){k=k+1|0;m=m+1|0}else{e=20;break}}if((e|0)==20){p=c[f>>2]|0;i=h;return p|0}if((a[k]|0)!=0){p=c[f>>2]|0;i=h;return p|0}}a[g]=1;p=te(b,d)|0;c[b+3292>>2]=j;c[f>>2]=c[(c[p+4>>2]|0)+12>>2];p=c[f>>2]|0;i=h;return p|0}function se(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d;if(!(fe(b,e)|0)){c[a>>2]=0;i=d;return}g=e;b=c[g>>2]|0;g=c[g+4>>2]|0;if(!((g|0)<0|(g|0)==0&b>>>0<200)){i=d;return}g=a+(b<<2)+2428|0;f=(c[g>>2]|0)>>>0<2>>>0;c[a>>2]=11;if(!f){f=c[g>>2]|0;e=a+12|0;c[a+(c[e>>2]<<2)+416>>2]=0;g=c[e>>2]|0;c[e>>2]=g+1;c[a+(g<<2)+16>>2]=f;a=c[a+3304>>2]|0;if((a|0)==0){i=d;return}c[a>>2]=(c[a>>2]|0)+1;i=d;return}b=a+12|0;f=c[b>>2]|0;h=a+1216|0;e=c[h>>2]|0;c[h>>2]=e+1;c[a+(e<<2)+816>>2]=f;e=a+2420|0;f=c[e>>2]|0;if((f|0)>=100){Ia(33360)|0;i=d;return}c[e>>2]=f+1;e=a+(f*12|0)+1220|0;c[e>>2]=0;c[a+(f*12|0)+1224>>2]=g;c[a+(c[b>>2]<<2)+416>>2]=0;h=c[b>>2]|0;c[b>>2]=h+1;c[a+(h<<2)+16>>2]=e;a=c[a+3304>>2]|0;if((a|0)==0){i=d;return}c[a>>2]=(c[a>>2]|0)+1;i=d;return}function te(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+32|0;f=e;k=e+16|0;if((a[6296]|0)==0?(wa(6296)|0)!=0:0){c[1570]=6304;c[1572]=6330;Va(6296)}h=b+3228|0;d=Qc(c[c[c[h>>2]>>2]>>2]|0,d)|0;if((d|0)==0){p=0;i=e;return p|0}d=c[d>>2]|0;if((d|0)==0){p=0;i=e;return p|0}j=hc[c[(c[d>>2]|0)+44>>2]&63](d,1)|0;m=c[(c[j>>2]|0)+8>>2]|0;a:do{if((m|0)==0){k=14}else{l=k+4|0;while(1){c[l>>2]=0;c[k>>2]=0;cc[c[(c[m>>2]|0)+28>>2]&63](m,k);p=c[1570]|0;o=(c[1572]|0)-p|0;n=c[k>>2]|0;if(((c[l>>2]|0)-n|0)==(o|0)){o=n+o|0;while(1){if(!(n>>>0<o>>>0)){k=18;break a}if((a[n]|0)==(a[p]|0)){p=p+1|0;n=n+1|0}else{break}}}m=dc[c[(c[m>>2]|0)+12>>2]&1023](m)|0;if((m|0)==0){k=14;break}}}}while(0);b:do{if((k|0)==14){k=c[1572]|0;m=408;l=c[1570]|0;while(1){if(!(l>>>0<k>>>0)){break}if((a[l]|0)==(a[m]|0)){m=m+1|0;l=l+1|0}else{k=24;break b}}if((a[m]|0)==0){k=18}else{k=24}}}while(0);do{if((k|0)==18){if((c[(c[b+8>>2]|0)+4>>2]|0)!=0){j=c[12]|0;if((j|0)==0){c[f>>2]=33224;c[f+4>>2]=8906;c[f+8>>2]=284;$a(8,f|0)|0;jb(1)}p=c[c[c[h>>2]>>2]>>2]|0;h=Ec(j,(c[d+12>>2]|0)+28|0)|0;$c(h,p,d);c[h>>2]=1360;p=h+16|0;c[p>>2]=c[p>>2]|16777216;p=h+20|0;a[p]=a[p]|8;$b[c[(c[d>>2]|0)+48>>2]&63](d,h+28|0,d)|0;h=c[(hc[c[(c[h>>2]|0)+44>>2]&63](h,1)|0)>>2]|0;if((c[(c[h+8>>2]|0)+16>>2]&255|0)==0){g=h;break}else{c[f>>2]=33200;c[f+4>>2]=8906;c[f+8>>2]=862;$a(8,f|0)|0;jb(1)}}else{k=24}}}while(0);do{if((k|0)==24){h=c[j>>2]|0;if((c[(c[h+8>>2]|0)+16>>2]&255|0)==0){g=h;break}else{c[f>>2]=33200;c[f+4>>2]=8906;c[f+8>>2]=862;$a(8,f|0)|0;jb(1)}}}while(0);f=c[g>>2]|0;if((f|0)==0){p=f;i=e;return p|0}c[b>>2]=10;o=c[c[f+12>>2]>>2]|0;n=b+12|0;c[b+(c[n>>2]<<2)+416>>2]=0;p=c[n>>2]|0;c[n>>2]=p+1;c[b+(p<<2)+16>>2]=o;b=c[b+3304>>2]|0;if((b|0)==0){p=f;i=e;return p|0}c[b>>2]=(c[b>>2]|0)+1;p=f;i=e;return p|0}function ue(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d;b=Qc(c[c[c[a+3228>>2]>>2]>>2]|0,b)|0;if((b|0)==0){b=0}else{b=c[b>>2]|0}$b[c[(c[b>>2]|0)+48>>2]&63](b,e,0)|0;c[a>>2]=13;e=c[e>>2]|0;f=a+12|0;c[a+(c[f>>2]<<2)+416>>2]=0;b=c[f>>2]|0;c[f>>2]=b+1;c[a+(b<<2)+16>>2]=e;a=c[a+3304>>2]|0;if((a|0)==0){i=d;return}c[a>>2]=(c[a>>2]|0)+1;i=d;return}function ve(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+32|0;k=f+24|0;g=f+16|0;m=f+8|0;j=f;c[g>>2]=0;$e(b,d,g);d=b+3256|0;n=c[d>>2]|0;if((n|0)==0){i=f;return}o=m+4|0;c[o>>2]=0;c[m>>2]=0;l=j+4|0;c[l>>2]=0;c[j>>2]=0;cc[c[(c[n>>2]|0)+28>>2]&63](n,m);p=c[b+3252>>2]|0;cc[c[(c[p>>2]|0)+28>>2]&63](p,j);a:do{if(e){p=c[d>>2]|0;o=b+12|0;c[b+(c[o>>2]<<2)+416>>2]=0;h=c[o>>2]|0;c[o>>2]=h+1;c[b+(h<<2)+16>>2]=p;h=c[b+3304>>2]|0;if((h|0)!=0){c[h>>2]=(c[h>>2]|0)+1}}else{n=c[o>>2]|0;e=408;m=c[m>>2]|0;while(1){if(!(m>>>0<n>>>0)){h=8;break}if((a[m]|0)==(a[e]|0)){e=e+1|0;m=m+1|0}else{break}}if((h|0)==8?(a[e]|0)==0:0){break}e=c[d>>2]|0;if((e|0)!=0){m=k+4|0;do{c[m>>2]=0;c[k>>2]=0;cc[c[(c[e>>2]|0)+28>>2]&63](e,k);p=c[j>>2]|0;n=(c[l>>2]|0)-p|0;o=c[k>>2]|0;if(((c[m>>2]|0)-o|0)==(n|0)){n=o+n|0;while(1){if(!(o>>>0<n>>>0)){break a}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{break}}}e=dc[c[(c[e>>2]|0)+12>>2]&1023](e)|0}while((e|0)!=0)}k=c[l>>2]|0;l=408;j=c[j>>2]|0;while(1){if(!(j>>>0<k>>>0)){h=19;break}if((a[j]|0)==(a[l]|0)){l=l+1|0;j=j+1|0}else{break}}if((h|0)==19?(a[l]|0)==0:0){break}c[b>>2]=3}}while(0);o=c[g>>2]|0;n=b+12|0;c[b+(c[n>>2]<<2)+416>>2]=c[d>>2];p=c[n>>2]|0;c[n>>2]=p+1;c[b+(p<<2)+16>>2]=o;b=c[b+3304>>2]|0;if((b|0)==0){i=f;return}c[b>>2]=(c[b>>2]|0)+1;i=f;return}function we(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+16|0;e=d;f=d+12|0;g=c[b+3296>>2]|0;if((g|0)==0){k=0;i=d;return k|0}if((a[b+3308|0]|0)!=0){k=af(b)|0;i=d;return k|0}k=b+3292|0;if(((c[g+16>>2]&67108864|0)!=0?(j=c[k>>2]|0,(a[j+20|0]&7)==4):0)?($b[c[(c[j>>2]|0)+48>>2]&63](j,f,0)|0,h=c[f>>2]|0,(h|0)!=0):0){k=dc[h&1023](b)|0;i=d;return k|0}c[b+3304>>2]=0;f=b+3240|0;c[f>>2]=(c[f>>2]|0)+1;f=c[b+12>>2]|0;j=b+3244|0;c[j>>2]=f+1+(c[j>>2]|0);f=Ze(b,c[k>>2]|0,f,b+16|0)|0;if((c[(c[b+8>>2]|0)+4>>2]|0)==0){k=f;i=d;return k|0}g=b+3300|0;h=c[g>>2]|0;do{if((h|0)>-1){h=b+(h<<2)+2428|0;if((c[h>>2]|0)==1){c[h>>2]=f;c[g>>2]=-1;break}else{c[e>>2]=6824;c[e+4>>2]=5759;c[e+8>>2]=921;$a(8,e|0)|0;jb(1)}}}while(0);g=c[b+1216>>2]|0;if((g|0)<=0){k=f;i=d;return k|0}h=f+4|0;j=0;while(1){l=h+(j<<2)|0;k=c[l>>2]|0;c[l>>2]=0;k=k+8|0;if((c[k>>2]|0)!=0){b=16;break}c[k>>2]=h+(c[b+(j<<2)+816>>2]<<2);j=j+1|0;if((j|0)>=(g|0)){b=18;break}}if((b|0)==16){c[e>>2]=6888;c[e+4>>2]=5759;c[e+8>>2]=934;$a(8,e|0)|0;jb(1)}else if((b|0)==18){i=d;return f|0}return 0}function xe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=i;i=i+32|0;f=h;e=h+16|0;if((a[3240]|0)==0?(wa(3240)|0)!=0:0){c[806]=2392;c[808]=2409;Va(3240)}j=b+40|0;b=e+4|0;l=0;k=c[j>>2]|0;a:while(1){if((k|0)==(l|0)){g=22;break}else{m=k}do{b:do{if((c[m+16>>2]&16777216|0)!=0){c:do{if((m|0)==0){g=13}else{n=m;while(1){c[b>>2]=0;c[e>>2]=0;cc[c[(c[n>>2]|0)+28>>2]&63](n,e);q=c[806]|0;p=(c[808]|0)-q|0;o=c[e>>2]|0;if(((c[b>>2]|0)-o|0)==(p|0)){p=o+p|0;while(1){if(!(o>>>0<p>>>0)){break c}if((a[o]|0)==(a[q]|0)){q=q+1|0;o=o+1|0}else{break}}}n=dc[c[(c[n>>2]|0)+12>>2]&1023](n)|0;if((n|0)==0){g=13;break}}}}while(0);if((g|0)==13){g=0;n=c[808]|0;p=408;o=c[806]|0;while(1){if(!(o>>>0<n>>>0)){break}if((a[o]|0)==(a[p]|0)){p=p+1|0;o=o+1|0}else{break b}}if((a[p]|0)!=0){break}}n=c[(hc[c[(c[m>>2]|0)+44>>2]&63](m,1)|0)>>2]|0;if((c[(c[n+8>>2]|0)+16>>2]&255|0)!=0){g=18;break a}pe(c[n>>2]|0,d)}}while(0);m=c[m+4>>2]|0}while((m|0)!=(l|0));l=c[j>>2]|0;if((l|0)==(k|0)){g=22;break}else{q=k;k=l;l=q}}if((g|0)==18){c[f>>2]=33200;c[f+4>>2]=8906;c[f+8>>2]=862;$a(8,f|0)|0;jb(1)}else if((g|0)==22){i=h;return}}function ye(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;c[b>>2]=d;a[b+4|0]=e&1;c[b+8>>2]=f;return}function ze(f,g,h,j){f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0;k=i;i=i+112|0;m=k;l=k+12|0;do{if((g|0)==10){if((h|0)==2){h=b[j>>1]|0;j=h;h=((h|0)<0)<<31>>31;g=3256;break}else if((h|0)==1){h=a[j]|0;j=h;h=((h|0)<0)<<31>>31;g=3256;break}else if((h|0)==8){h=j;j=c[h>>2]|0;h=c[h+4>>2]|0;g=3256;break}else if((h|0)==4){h=c[j>>2]|0;j=h;h=((h|0)<0)<<31>>31;g=3256;break}else{j=0;h=0;g=3256;break}}else if((g|0)==9){if((h|0)==8){h=j;j=c[h>>2]|0;h=c[h+4>>2]|0;g=3264;break}else if((h|0)==4){j=c[j>>2]|0;h=0;g=3264;break}else if((h|0)==1){j=d[j]|0;h=0;g=3264;break}else if((h|0)==2){j=e[j>>1]|0;h=0;g=3264;break}else{j=0;h=0;g=3264;break}}else{j=0;h=0;g=3272}}while(0);c[m>>2]=c[f+8>>2];n=m+4|0;c[n>>2]=j;c[n+4>>2]=h;m=wb(l|0,100,g|0,m|0)|0;f=c[f>>2]|0;n=c[(c[f+8>>2]|0)+16>>2]&255;h=f+(n<<2)+16|0;if((n|0)==0){n=1;Pd(f,n,m,l)|0;i=k;return}j=1;n=f+16|0;while(1){g=n+4|0;j=ba(c[n>>2]|0,j)|0;if(g>>>0<h>>>0){n=g}else{break}}Pd(f,j,m,l)|0;i=k;return}function Ae(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+16|0;j=f+8|0;h=f;g=h+4|0;c[g>>2]=0;c[h>>2]=0;cc[c[(c[d>>2]|0)+28>>2]&63](d,h);l=c[g>>2]|0;m=2688;d=c[h>>2]|0;while(1){if(!(d>>>0<l>>>0)){k=4;break}if((a[d]|0)==(a[m]|0)){m=m+1|0;d=d+1|0}else{break}}if((k|0)==4?(a[m]|0)==0:0){e=c[e>>2]|0;if((e|0)!=0){c[j>>2]=31752;c[j+4>>2]=b;cc[c[(c[e>>2]|0)+8>>2]&63](e,j);i=f;return}b=c[b>>2]|0;n=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;h=b+16|0;while(1){g=h+4|0;j=ba(c[h>>2]|0,j)|0;if(g>>>0<e>>>0){h=g}else{break}}}Pd(b,j,4,3336)|0;i=f;return}k=c[b>>2]|0;a[j]=94;n=c[(c[k+8>>2]|0)+16>>2]&255;d=k+(n<<2)+16|0;if((n|0)==0){m=1}else{m=1;n=k+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<d>>>0){n=l}else{break}}}Pd(k,m,1,j)|0;j=c[b>>2]|0;h=c[h>>2]|0;g=(c[g>>2]|0)-h|0;n=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=j+16|0;while(1){d=m+4|0;l=ba(c[m>>2]|0,l)|0;if(d>>>0<k>>>0){m=d}else{break}}}Pd(j,l,g,h)|0;if((c[e>>2]|0)!=0){i=f;return}b=c[b>>2]|0;n=c[(c[b+8>>2]|0)+16>>2]&255;g=b+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;h=b+16|0;while(1){e=h+4|0;j=ba(c[h>>2]|0,j)|0;if(e>>>0<g>>>0){h=e}else{break}}}Pd(b,j,5,3328)|0;i=f;return}function Be(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+16|0;g=d;h=c[e+12>>2]|0;if((f|0)==1){if((((c[h+16>>2]|0)>>>16&31)+ -13|0)>>>0<2){f=b+4|0;if((a[f]|0)!=0){h=c[b>>2]|0;a[g]=39;n=c[(c[h+8>>2]|0)+16>>2]&255;j=h+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=h+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Pd(h,l,1,g)|0}h=c[b>>2]|0;n=c[(c[e+8>>2]|0)+16>>2]&255;l=e+(n<<2)+16|0;if((n|0)==0){j=1}else{j=1;m=e+16|0;while(1){k=m+4|0;j=ba(c[m>>2]|0,j)|0;if(k>>>0<l>>>0){m=k}else{break}}}e=c[e>>2]|0;n=c[(c[h+8>>2]|0)+16>>2]&255;l=h+(n<<2)+16|0;if((n|0)==0){m=1}else{m=1;n=h+16|0;while(1){k=n+4|0;m=ba(c[n>>2]|0,m)|0;if(k>>>0<l>>>0){n=k}else{break}}}Pd(h,m,j,e)|0;if((a[f]|0)==0){i=d;return}b=c[b>>2]|0;a[g]=39;n=c[(c[b+8>>2]|0)+16>>2]&255;f=b+(n<<2)+16|0;if((n|0)==0){h=1}else{h=1;j=b+16|0;while(1){e=j+4|0;h=ba(c[j>>2]|0,h)|0;if(e>>>0<f>>>0){j=e}else{break}}}Pd(b,h,1,g)|0;i=d;return}}else{if((f|0)<=0){if((f|0)!=0){i=d;return}if((c[(c[e+8>>2]|0)+16>>2]&255|0)!=0){c[g>>2]=33200;c[g+4>>2]=8906;c[g+8>>2]=862;$a(8,g|0)|0;jb(1)}De(b,h,c[e>>2]|0);i=d;return}}a[b+4|0]=1;if((h|0)==0){c[g>>2]=33152;c[g+4>>2]=8906;c[g+8>>2]=856;$a(8,g|0)|0;jb(1)}j=c[e>>2]|0;if(j>>>0>(c[e+4>>2]|0)>>>0){c[g>>2]=33176;c[g+4>>2]=8906;c[g+8>>2]=858;$a(8,g|0)|0;jb(1)}Ce(b,h,f,j,e+16|0,e+((c[(c[e+8>>2]|0)+16>>2]&255)<<2)+16|0);i=d;return}function Ce(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;k=i;i=i+16|0;j=k;l=e+ -1|0;e=c[h+(l<<2)>>2]|0;n=c[g+(l<<2)>>2]|0;m=c[b>>2]|0;a[j]=40;s=c[(c[m+8>>2]|0)+16>>2]&255;p=m+(s<<2)+16|0;if((s|0)==0){r=1}else{r=1;q=m+16|0;while(1){o=q+4|0;r=ba(c[q>>2]|0,r)|0;if(o>>>0<p>>>0){q=o}else{break}}}Pd(m,r,1,j)|0;if((n|0)>0){m=(l|0)==0;o=0;while(1){n=n+ -1|0;if(o){o=c[b>>2]|0;a[j]=32;s=c[(c[o+8>>2]|0)+16>>2]&255;q=o+(s<<2)+16|0;if((s|0)==0){s=1}else{s=1;r=o+16|0;while(1){p=r+4|0;s=ba(c[r>>2]|0,s)|0;if(p>>>0<q>>>0){r=p}else{break}}}Pd(o,s,1,j)|0}if(m){De(b,d,f)}else{Ce(b,d,l,f,g,h)}if((n|0)<=0){break}else{o=1;f=f+e|0}}}b=c[b>>2]|0;a[j]=41;s=c[(c[b+8>>2]|0)+16>>2]&255;h=b+(s<<2)+16|0;if((s|0)==0){s=1;Pd(b,s,1,j)|0;i=k;return}e=1;g=b+16|0;while(1){d=g+4|0;e=ba(c[g>>2]|0,e)|0;if(d>>>0<h>>>0){g=d}else{break}}Pd(b,e,1,j)|0;i=k;return}function De(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,j=0,l=0,m=0,n=0,o=0,p=0.0;f=i;i=i+208|0;j=f;m=f+108|0;l=f+8|0;o=c[d+16>>2]|0;n=o>>>16&31;switch(n|0){case 12:{l=c[d+12>>2]|0;if((l|0)==8){a[k]=a[e];a[k+1|0]=a[e+1|0];a[k+2|0]=a[e+2|0];a[k+3|0]=a[e+3|0];a[k+4|0]=a[e+4|0];a[k+5|0]=a[e+5|0];a[k+6|0]=a[e+6|0];a[k+7|0]=a[e+7|0];p=+h[k>>3]}else if((l|0)==4){p=+g[e>>2]}else{p=0.0}h[k>>3]=p;e=c[k>>2]|0;l=c[k+4>>2]&2147483647;do{if(!(l>>>0>2146435072|(l|0)==2146435072&e>>>0>0)){if((e|0)==0&(l|0)==2146435072){l=p<0.0;j=l?4:3;m=l?3304:3312;break}else{h[k>>3]=p;c[j>>2]=c[k>>2];c[j+4>>2]=c[k+4>>2];j=wb(m|0,100,3320,j|0)|0;break}}else{j=3;m=3296}}while(0);b=c[b>>2]|0;o=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;d=b+16|0;while(1){l=d+4|0;n=ba(c[d>>2]|0,n)|0;if(l>>>0<e>>>0){d=l}else{break}}}Pd(b,n,j,m)|0;i=f;return};case 10:case 9:{ze(b,n,c[d+12>>2]|0,e);i=f;return};case 1:{Ee(b,d,e);i=f;return};case 15:{Ae(b,d,e);i=f;return};case 3:{Be(b,0,c[e>>2]|0,o&255);i=f;return};case 4:{b=c[b>>2]|0;a[j]=42;o=c[(c[b+8>>2]|0)+16>>2]&255;l=b+(o<<2)+16|0;if((o|0)==0){e=1}else{e=1;n=b+16|0;while(1){m=n+4|0;e=ba(c[n>>2]|0,e)|0;if(m>>>0<l>>>0){n=m}else{break}}}Pd(b,e,1,j)|0;i=f;return};case 6:{b=c[b>>2]|0;a[j]=(a[e]|0)!=0?116:102;o=c[(c[b+8>>2]|0)+16>>2]&255;m=b+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;e=b+16|0;while(1){l=e+4|0;n=ba(c[e>>2]|0,n)|0;if(l>>>0<m>>>0){e=l}else{break}}}Pd(b,n,1,j)|0;i=f;return};default:{j=wb(l|0,100,3344,j|0)|0;b=c[b>>2]|0;o=c[(c[b+8>>2]|0)+16>>2]&255;m=b+(o<<2)+16|0;if((o|0)==0){d=1}else{d=1;n=b+16|0;while(1){e=n+4|0;d=ba(c[n>>2]|0,d)|0;if(e>>>0<m>>>0){n=e}else{break}}}Pd(b,d,j,l)|0;i=f;return}}}function Ee(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+16|0;g=f;h=dc[c[(c[d>>2]|0)+16>>2]&1023](d)|0;a[b+4|0]=1;j=c[b>>2]|0;a[g]=40;o=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(o<<2)+16|0;if((o|0)==0){m=1}else{m=1;n=j+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<k>>>0){n=l}else{break}}}Pd(j,m,1,g)|0;if((h|0)>0){j=0;while(1){if((j|0)>0){k=c[b>>2]|0;a[g]=32;o=c[(c[k+8>>2]|0)+16>>2]&255;m=k+(o<<2)+16|0;if((o|0)==0){o=1}else{o=1;n=k+16|0;while(1){l=n+4|0;o=ba(c[n>>2]|0,o)|0;if(l>>>0<m>>>0){n=l}else{break}}}Pd(k,o,1,g)|0}k=j+1|0;o=hc[c[(c[d>>2]|0)+24>>2]&63](d,j)|0;De(b,o,e+(dc[c[(c[o>>2]|0)+40>>2]&1023](o)|0)|0);if((k|0)==(h|0)){break}else{j=k}}}b=c[b>>2]|0;a[g]=41;o=c[(c[b+8>>2]|0)+16>>2]&255;d=b+(o<<2)+16|0;if((o|0)==0){o=1;Pd(b,o,1,g)|0;i=f;return}h=1;j=b+16|0;while(1){e=j+4|0;h=ba(c[j>>2]|0,h)|0;if(e>>>0<d>>>0){j=e}else{break}}Pd(b,h,1,g)|0;i=f;return}function Fe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+16|0;q=e+8|0;p=e;j=d+2|0;l=d+1|0;k=d+5|0;g=d+4|0;h=d+3|0;m=d+6|0;o=d+8|0;c[o>>2]=0;n=d+12|0;c[n>>2]=0;a[l+0|0]=0;a[l+1|0]=0;a[l+2|0]=0;a[l+3|0]=0;a[l+4|0]=0;a[l+5|0]=0;f=c[b>>2]|0;s=b+4|0;v=c[s>>2]|0;a:do{if(f>>>0<v>>>0){r=q+4|0;t=f;u=0;while(1){c[b>>2]=t+1;w=a[t]|0;if((jt(3368,w<<24>>24,19)|0)!=0){break}b:do{switch(w<<24>>24){case 35:{a[g]=1;break};case 32:{a[h]=1;break};case 43:{a[j]=1;break};case 46:{u=1;break};case 48:{a[k]=1;break};case 45:{a[l]=1;break};default:{if(u&w<<24>>24==42){a[m]=1;u=1;break b}if(!((w+ -48<<24>>24&255)<10)){g=0;break a}c[q>>2]=t;c[r>>2]=v;w=p;c[w>>2]=0;c[w+4>>2]=0;if(!(fe(q,p)|0)){g=0;break a}t=c[p>>2]|0;if(u){c[n>>2]=t;u=1;break b}else{c[o>>2]=t;u=0;break b}}}}while(0);t=c[b>>2]|0;v=c[s>>2]|0;if(!(t>>>0<v>>>0)){g=1;break a}}a[d+7|0]=w;g=1}else{g=1}}while(0);a[d]=g;w=c[b>>2]|0;c[d+16>>2]=f;c[d+20>>2]=w;i=e;return}



function Dr(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+16|0;d=e+12|0;g=e;f=b+12|0;j=c[c[f>>2]>>2]|0;h=j+8|0;k=c[h>>2]|0;o=c[k+16>>2]&255;l=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;o=j+16|0;while(1){m=o+4|0;n=ba(c[o>>2]|0,n)|0;if(m>>>0<l>>>0){o=m}else{break}}}k=c[(dc[c[(c[k>>2]|0)+36>>2]&1023](k)|0)>>2]|0;if((!((c[(c[h>>2]|0)+16>>2]&255|0)!=1|(k|0)>-1)?!((k|0)>0|(n|0)==0):0)?Md(j,0,n,0,1)|0:0){c[j+16>>2]=0}h=c[c[f>>2]>>2]|0;o=c[(c[h+8>>2]|0)+16>>2]&255;k=h+(o<<2)+16|0;if((o|0)==0){l=1}else{l=1;m=h+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Pd(h,l,3,31736)|0;c[g>>2]=c[c[f>>2]>>2];a[g+4|0]=0;c[g+8>>2]=0;De(g,c[b+4>>2]|0,c[b+8>>2]|0);f=c[c[f>>2]>>2]|0;a[d]=41;o=c[(c[f+8>>2]|0)+16>>2]&255;g=f+(o<<2)+16|0;if((o|0)==0){o=1;Pd(f,o,1,d)|0;o=b+16|0;i=e;return o|0}j=1;k=f+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}Pd(f,j,1,d)|0;o=b+16|0;i=e;return o|0}function Er(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;b=i;a=c[c[a+4>>2]>>2]|0;g=c[(c[a+8>>2]|0)+16>>2]&255;d=a+(g<<2)+16|0;if((g|0)==0){f=1}else{f=1;g=a+16|0;while(1){e=g+4|0;f=ba(c[g>>2]|0,f)|0;if(e>>>0<d>>>0){g=e}else{break}}}Pd(a,f,7,31968)|0;i=b;return}function Fr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+112|0;f=e;g=e+12|0;b=b+4|0;h=c[c[b>>2]>>2]|0;n=c[(c[h+8>>2]|0)+16>>2]&255;j=h+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=h+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Pd(h,l,3,31960)|0;n=dc[c[(c[d>>2]|0)+60>>2]&1023](d)|0;h=c[b>>2]|0;c[f>>2]=c[h+8>>2];j=f+4|0;c[j>>2]=n;c[j+4>>2]=((n|0)<0)<<31>>31;j=wb(g|0,100,3256,f|0)|0;h=c[h>>2]|0;n=c[(c[h+8>>2]|0)+16>>2]&255;k=h+(n<<2)+16|0;if((n|0)==0){n=1}else{n=1;m=h+16|0;while(1){l=m+4|0;n=ba(c[m>>2]|0,n)|0;if(l>>>0<k>>>0){m=l}else{break}}}Pd(h,n,j,g)|0;g=c[c[b>>2]>>2]|0;a[f]=32;n=c[(c[g+8>>2]|0)+16>>2]&255;h=g+(n<<2)+16|0;if((n|0)==0){k=1}else{k=1;l=g+16|0;while(1){j=l+4|0;k=ba(c[l>>2]|0,k)|0;if(j>>>0<h>>>0){l=j}else{break}}}Pd(g,k,1,f)|0;switch((c[d+16>>2]|0)>>>16&31|0){case 15:{d=2224;break};case 12:{d=2120;break};case 9:{d=2136;break};case 13:{d=2192;break};case 10:{d=2144;break};case 7:{d=2200;break};case 6:{d=2112;break};default:{d=3248}}g=c[c[b>>2]>>2]|0;h=Xt(d|0)|0;n=c[(c[g+8>>2]|0)+16>>2]&255;j=g+(n<<2)+16|0;if((n|0)==0){l=1}else{l=1;m=g+16|0;while(1){k=m+4|0;l=ba(c[m>>2]|0,l)|0;if(k>>>0<j>>>0){m=k}else{break}}}Pd(g,l,h,d)|0;b=c[c[b>>2]>>2]|0;a[f]=41;n=c[(c[b+8>>2]|0)+16>>2]&255;g=b+(n<<2)+16|0;if((n|0)==0){n=1;Pd(b,n,1,f)|0;i=e;return}h=1;j=b+16|0;while(1){d=j+4|0;h=ba(c[j>>2]|0,h)|0;if(d>>>0<g>>>0){j=d}else{break}}Pd(b,h,1,f)|0;i=e;return}function Gr(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,31952);i=c;return}function Hr(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,31944);i=c;return}function Ir(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,31936);i=c;return}function Jr(a,b){a=a|0;b=b|0;var c=0;c=i;Rr(a,b,31928);i=c;return}function Kr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+112|0;h=e;f=e+12|0;g=b+4|0;j=c[c[g>>2]>>2]|0;o=c[(c[j+8>>2]|0)+16>>2]&255;l=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;m=j+16|0;while(1){k=m+4|0;n=ba(c[m>>2]|0,n)|0;if(k>>>0<l>>>0){m=k}else{break}}}Pd(j,n,2,31920)|0;j=hc[c[(c[d>>2]|0)+24>>2]&63](d,0)|0;cc[c[(c[j>>2]|0)+8>>2]&63](j,b);b=dc[c[(c[d>>2]|0)+36>>2]&1023](d)|0;d=c[d+16>>2]&255;j=c[c[g>>2]>>2]|0;if((d|0)!=0){do{a[h]=32;o=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;m=j+16|0;while(1){l=m+4|0;n=ba(c[m>>2]|0,n)|0;if(l>>>0<k>>>0){m=l}else{break}}}Pd(j,n,1,h)|0;j=c[b>>2]|0;k=c[g>>2]|0;if((j|0)==-2147483648){j=c[k>>2]|0;a[h]=42;o=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(o<<2)+16|0;if((o|0)==0){n=1}else{n=1;m=j+16|0;while(1){l=m+4|0;n=ba(c[m>>2]|0,n)|0;if(l>>>0<k>>>0){m=l}else{break}}}Pd(j,n,1,h)|0}else{b=b+4|0;c[h>>2]=c[k+8>>2];o=h+4|0;c[o>>2]=j;c[o+4>>2]=((j|0)<0)<<31>>31;j=wb(f|0,100,3256,h|0)|0;k=c[k>>2]|0;o=c[(c[k+8>>2]|0)+16>>2]&255;m=k+(o<<2)+16|0;if((o|0)==0){o=1}else{o=1;n=k+16|0;while(1){l=n+4|0;o=ba(c[n>>2]|0,o)|0;if(l>>>0<m>>>0){n=l}else{break}}}Pd(k,o,j,f)|0}d=d+ -1|0;j=c[c[g>>2]>>2]|0}while((d|0)>0)}o=c[(c[j+8>>2]|0)+16>>2]&255;f=j+(o<<2)+16|0;if((o|0)==0){o=1;Pd(j,o,1,1960)|0;i=e;return}h=1;d=j+16|0;while(1){g=d+4|0;h=ba(c[d>>2]|0,h)|0;if(g>>>0<f>>>0){d=g}else{break}}Pd(j,h,1,1960)|0;i=e;return}function Lr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+16|0;f=e+8|0;h=e;g=b+4|0;switch((c[d+16>>2]|0)>>>28&7|0){case 3:{l=1992;break};case 2:{l=1984;break};case 5:{l=2008;break};case 1:{l=1976;break};case 4:{l=2e3;break};case 0:{l=1968;break};case 6:{l=2016;break};default:{l=3248}}j=c[c[g>>2]>>2]|0;k=Xt(l|0)|0;p=c[(c[j+8>>2]|0)+16>>2]&255;n=j+(p<<2)+16|0;if((p|0)==0){o=1}else{o=1;p=j+16|0;while(1){m=p+4|0;o=ba(c[p>>2]|0,o)|0;if(m>>>0<n>>>0){p=m}else{break}}}Pd(j,o,k,l)|0;j=c[c[g>>2]>>2]|0;a[f]=40;p=c[(c[j+8>>2]|0)+16>>2]&255;k=j+(p<<2)+16|0;if((p|0)==0){m=1}else{m=1;n=j+16|0;while(1){l=n+4|0;m=ba(c[n>>2]|0,m)|0;if(l>>>0<k>>>0){n=l}else{break}}}Pd(j,m,1,f)|0;p=dc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;cc[c[(c[p>>2]|0)+8>>2]&63](p,b);b=h+4|0;c[b>>2]=0;c[h>>2]=0;cc[c[(c[d>>2]|0)+32>>2]&63](d,h);if(((c[b>>2]|0)-(c[h>>2]|0)|0)>0){d=c[c[g>>2]>>2]|0;a[f]=32;p=c[(c[d+8>>2]|0)+16>>2]&255;k=d+(p<<2)+16|0;if((p|0)==0){l=1}else{l=1;m=d+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Pd(d,l,1,f)|0;d=c[c[g>>2]>>2]|0;h=c[h>>2]|0;b=(c[b>>2]|0)-h|0;p=c[(c[d+8>>2]|0)+16>>2]&255;k=d+(p<<2)+16|0;if((p|0)==0){m=1}else{m=1;l=d+16|0;while(1){j=l+4|0;m=ba(c[l>>2]|0,m)|0;if(j>>>0<k>>>0){l=j}else{break}}}Pd(d,m,b,h)|0}g=c[c[g>>2]>>2]|0;a[f]=41;p=c[(c[g+8>>2]|0)+16>>2]&255;h=g+(p<<2)+16|0;if((p|0)==0){p=1;Pd(g,p,1,f)|0;i=e;return}b=1;j=g+16|0;while(1){d=j+4|0;b=ba(c[j>>2]|0,b)|0;if(d>>>0<h>>>0){j=d}else{break}}Pd(g,b,1,f)|0;i=e;return}function Mr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+16|0;h=e+8|0;g=e;f=g+4|0;c[f>>2]=0;c[g>>2]=0;cc[c[(c[d>>2]|0)+28>>2]&63](d,g);if(((c[f>>2]|0)-(c[g>>2]|0)|0)<=0){i=e;return}b=b+4|0;d=c[c[b>>2]>>2]|0;a[h]=46;m=c[(c[d+8>>2]|0)+16>>2]&255;k=d+(m<<2)+16|0;if((m|0)==0){l=1}else{l=1;m=d+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Pd(d,l,1,h)|0;h=c[c[b>>2]>>2]|0;g=c[g>>2]|0;f=(c[f>>2]|0)-g|0;m=c[(c[h+8>>2]|0)+16>>2]&255;d=h+(m<<2)+16|0;if((m|0)==0){k=1}else{k=1;j=h+16|0;while(1){b=j+4|0;k=ba(c[j>>2]|0,k)|0;if(b>>>0<d>>>0){j=b}else{break}}}Pd(h,k,f,g)|0;i=e;return}function Nr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Pd(e,j,1,408)|0;b=dc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;cc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Pd(b,k,0,31912)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Pd(b,a,0,31912)|0;i=d;return}function Or(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Pd(e,j,3,31736)|0;b=dc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;cc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Pd(b,k,1,1960)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Pd(b,a,1,1960)|0;i=d;return}function Pr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Pd(e,j,4,31904)|0;b=dc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;cc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Pd(b,k,1,1960)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Pd(b,a,1,1960)|0;i=d;return}function Qr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;f=a+4|0;e=c[c[f>>2]>>2]|0;k=c[(c[e+8>>2]|0)+16>>2]&255;g=e+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=e+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}Pd(e,j,4,31896)|0;b=dc[c[(c[b>>2]|0)+12>>2]&1023](b)|0;cc[c[(c[b>>2]|0)+8>>2]&63](b,a);b=c[c[f>>2]>>2]|0;k=c[(c[b+8>>2]|0)+16>>2]&255;e=b+(k<<2)+16|0;if((k|0)==0){k=1;Pd(b,k,1,1960)|0;i=d;return}a=1;g=b+16|0;while(1){f=g+4|0;a=ba(c[g>>2]|0,a)|0;if(f>>>0<e>>>0){g=f}else{break}}Pd(b,a,1,1960)|0;i=d;return}function Rr(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=a+4|0;g=c[c[f>>2]>>2]|0;h=Xt(d|0)|0;m=c[(c[g+8>>2]|0)+16>>2]&255;j=g+(m<<2)+16|0;if((m|0)==0){m=1}else{m=1;l=g+16|0;while(1){k=l+4|0;m=ba(c[l>>2]|0,m)|0;if(k>>>0<j>>>0){l=k}else{break}}}Pd(g,m,h,d)|0;h=dc[c[(c[b>>2]|0)+16>>2]&1023](b)|0;if((h|0)>0){g=0;do{m=hc[c[(c[b>>2]|0)+24>>2]&63](b,g)|0;cc[c[(c[m>>2]|0)+8>>2]&63](m,a);g=g+1|0}while((g|0)!=(h|0))}b=c[c[f>>2]>>2]|0;m=c[(c[b+8>>2]|0)+16>>2]&255;a=b+(m<<2)+16|0;if((m|0)==0){m=1;Pd(b,m,1,1960)|0;i=e;return}g=1;h=b+16|0;while(1){f=h+4|0;g=ba(c[h>>2]|0,g)|0;if(f>>>0<a>>>0){h=f}else{break}}Pd(b,g,1,1960)|0;i=e;return}function Sr(a){a=a|0;var b=0,d=0,e=0,f=0;d=c[c[a+4>>2]>>2]|0;b=c[a+8>>2]|0;f=c[d+44>>2]|0;e=b;c[e>>2]=f;c[e+4>>2]=((f|0)<0)<<31>>31;e=b+8|0;c[e>>2]=c[d+52>>2];c[e+4>>2]=0;b=b+16|0;c[b>>2]=c[d+56>>2];c[b+4>>2]=0;return a+12|0}function Tr(a){a=a|0;c[c[a+4>>2]>>2]=c[c[1320]>>2];return a+8|0}function Ur(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;if((d|0)==0){c[c[a+8>>2]>>2]=0;d=a+12|0;i=b;return d|0}else{c[c[a+8>>2]>>2]=c[d>>2];d=a+12|0;i=b;return d|0}return 0}function Vr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;d=c[a+4>>2]|0;if((d|0)==0){d=c[1320]|0}e=c[d>>2]|0;d=c[c[a+8>>2]>>2]|0;if((e|0)!=0){Mc(e,d);k=a+12|0;i=b;return k|0}e=d+8|0;f=c[e>>2]|0;k=c[f+16>>2]&255;h=d+(k<<2)+16|0;if((k|0)==0){k=1}else{k=1;j=d+16|0;while(1){g=j+4|0;k=ba(c[j>>2]|0,k)|0;if(g>>>0<h>>>0){j=g}else{break}}}f=c[(dc[c[(c[f>>2]|0)+36>>2]&1023](f)|0)>>2]|0;if((c[(c[e>>2]|0)+16>>2]&255|0)!=1|(f|0)>-1){k=a+12|0;i=b;return k|0}if((f|0)>0|(k|0)==0){k=a+12|0;i=b;return k|0}if(!(Md(d,0,k,0,1)|0)){k=a+12|0;i=b;return k|0}c[d+16>>2]=0;k=a+12|0;i=b;return k|0}function Wr(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;d=b;e=c[a+4>>2]|0;if((e|0)==0){e=c[1320]|0}e=c[e>>2]|0;g=c[c[a+8>>2]>>2]|0;f=c[g+4>>2]|0;c[d>>2]=c[g>>2];c[d+4>>2]=f;if((e|0)==0){g=a+16|0;i=b;return g|0}Kc(e,d,c[c[a+12>>2]>>2]|0)|0;g=a+16|0;i=b;return g|0}function Xr(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+32|0;g=d;e=d+16|0;f=c[b+4>>2]|0;if((f|0)==0){f=c[1320]|0}f=c[f>>2]|0;k=c[c[b+8>>2]>>2]|0;l=c[k>>2]|0;k=c[k+4>>2]|0;c[e>>2]=l;c[e+4>>2]=k;h=c[c[b+12>>2]>>2]|0;j=c[b+16>>2]|0;if((j|0)==0){j=1}else{j=(a[j]|0)==0}if((k|0)==(l|0)){e=c[12]|0;if((e|0)==0){c[g>>2]=33224;c[g+4>>2]=8906;c[g+8>>2]=284;$a(8,g|0)|0;jb(1)}e=Ec(e,(c[h+12>>2]|0)+28|0)|0;if((e|0)==0){e=0}else{$c(e,f,h);c[e>>2]=1360;l=e+16|0;c[l>>2]=c[l>>2]|16777216;l=e+20|0;a[l]=a[l]|8;$b[c[(c[h>>2]|0)+48>>2]&63](h,e+28|0,h)|0}k=e;l=b+20|0;l=c[l>>2]|0;c[l>>2]=k;l=b+24|0;i=d;return l|0}k=Qc(f,e)|0;if((k|0)==0){k=0}else{k=c[k>>2]|0}if((k|0)!=0|j){l=b+20|0;l=c[l>>2]|0;c[l>>2]=k;l=b+24|0;i=d;return l|0}j=c[12]|0;if((j|0)==0){c[g>>2]=33224;c[g+4>>2]=8906;c[g+8>>2]=284;$a(8,g|0)|0;jb(1)}g=Ec(j,(c[h+12>>2]|0)+28|0)|0;if((g|0)==0){g=0}else{$c(g,f,h);c[g>>2]=1360;l=g+16|0;c[l>>2]=c[l>>2]|16777216;l=g+20|0;a[l]=a[l]|8;$b[c[(c[h>>2]|0)+48>>2]&63](h,g+28|0,h)|0}k=Kc(f,e,g)|0;l=b+20|0;l=c[l>>2]|0;c[l>>2]=k;l=b+24|0;i=d;return l|0}function Yr(a){a=a|0;c[c[a+12>>2]>>2]=c[a+4>>2];return a+16|0}function Zr(a){a=a|0;c[c[a+8>>2]>>2]=c[(c[c[a+4>>2]>>2]|0)+12>>2];return a+12|0}function _r(a){a=a|0;c[c[a+8>>2]>>2]=(c[(c[c[a+4>>2]>>2]|0)+16>>2]|0)>>>8&255;return a+12|0}function $r(a){a=a|0;c[c[a+8>>2]>>2]=(c[(c[c[a+4>>2]>>2]|0)+16>>2]|0)>>>16&31;return a+12|0}function as(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>21&1;return b+12|0}function bs(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]&2031616|0)==196608|0;return b+12|0}function cs(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>24&1;return b+12|0}function ds(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>27&1;return b+12|0}function es(b){b=b|0;a[c[b+8>>2]|0]=(c[(c[c[b+4>>2]>>2]|0)+16>>2]|0)>>>24&1;return b+12|0}function fs(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b;f=c[c[a+4>>2]>>2]|0;e=d+4|0;c[e>>2]=0;c[d>>2]=0;cc[c[(c[f>>2]|0)+28>>2]&63](f,d);d=c[d>>2]|0;Od(c[c[a+8>>2]>>2]|0,0,(c[e>>2]|0)-d|0,d,1)|0;i=b;return a+12|0}function gs(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b;f=c[c[a+4>>2]>>2]|0;e=d+4|0;c[e>>2]=0;c[d>>2]=0;cc[c[(c[f>>2]|0)+32>>2]&63](f,d);d=c[d>>2]|0;Od(c[c[a+8>>2]>>2]|0,0,(c[e>>2]|0)-d|0,d,1)|0;i=b;return a+12|0}function hs(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;d=dc[c[(c[d>>2]|0)+12>>2]&1023](d)|0;c[c[a+8>>2]>>2]=d;i=b;return a+12|0}function is(a){a=a|0;c[c[a+8>>2]>>2]=(c[(c[c[a+4>>2]>>2]|0)+16>>2]|0)>>>28&7;return a+12|0}function js(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;d=dc[c[(c[d>>2]|0)+16>>2]&1023](d)|0;c[c[a+8>>2]>>2]=d;i=b;return a+12|0}function ks(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;d=hc[c[(c[d>>2]|0)+24>>2]&63](d,c[c[a+8>>2]>>2]|0)|0;c[c[a+12>>2]>>2]=d;i=b;return a+16|0}function ls(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b;f=c[c[a+8>>2]>>2]|0;e=c[f+4>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=e;e=c[c[a+4>>2]>>2]|0;d=hc[c[(c[e>>2]|0)+20>>2]&63](e,d)|0;c[c[a+12>>2]>>2]=d;i=b;return a+16|0}function ms(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+16|0;j=f+8|0;g=f;d=c[c[b+4>>2]>>2]|0;o=c[b+8>>2]|0;h=g+4|0;c[h>>2]=0;c[g>>2]=0;cc[c[(c[o>>2]|0)+28>>2]&63](o,g);a:do{if((d|0)==0){e=8}else{k=j+4|0;l=d;while(1){c[k>>2]=0;c[j>>2]=0;cc[c[(c[l>>2]|0)+28>>2]&63](l,j);o=c[g>>2]|0;n=(c[h>>2]|0)-o|0;m=c[j>>2]|0;if(((c[k>>2]|0)-m|0)==(n|0)){n=m+n|0;while(1){if(!(m>>>0<n>>>0)){break a}if((a[m]|0)==(a[o]|0)){o=o+1|0;m=m+1|0}else{break}}}l=dc[c[(c[l>>2]|0)+12>>2]&1023](l)|0;if((l|0)==0){e=8;break}}}}while(0);if((e|0)==8){j=c[h>>2]|0;h=408;g=c[g>>2]|0;while(1){if(!(g>>>0<j>>>0)){break}if((a[g]|0)==(a[h]|0)){h=h+1|0;g=g+1|0}else{e=13;break}}if((e|0)==13){o=b+16|0;i=f;return o|0}if((a[h]|0)!=0){o=b+16|0;i=f;return o|0}}o=c[d>>2]|0;m=c[o+52>>2]|0;n=c[b+12>>2]|0;o=hc[c[o+44>>2]&63](d,1)|0;$b[m&63](d,n,o)|0;o=b+16|0;i=f;return o|0}function ns(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+16|0;j=f+8|0;g=f;d=c[c[b+4>>2]>>2]|0;o=c[b+8>>2]|0;h=g+4|0;c[h>>2]=0;c[g>>2]=0;cc[c[(c[o>>2]|0)+28>>2]&63](o,g);a:do{if((d|0)==0){e=8}else{k=j+4|0;l=d;while(1){c[k>>2]=0;c[j>>2]=0;cc[c[(c[l>>2]|0)+28>>2]&63](l,j);o=c[g>>2]|0;n=(c[h>>2]|0)-o|0;m=c[j>>2]|0;if(((c[k>>2]|0)-m|0)==(n|0)){n=m+n|0;while(1){if(!(m>>>0<n>>>0)){break a}if((a[m]|0)==(a[o]|0)){o=o+1|0;m=m+1|0}else{break}}}l=dc[c[(c[l>>2]|0)+12>>2]&1023](l)|0;if((l|0)==0){e=8;break}}}}while(0);if((e|0)==8){j=c[h>>2]|0;h=408;g=c[g>>2]|0;while(1){if(!(g>>>0<j>>>0)){break}if((a[g]|0)==(a[h]|0)){h=h+1|0;g=g+1|0}else{e=13;break}}if((e|0)==13){o=b+16|0;i=f;return o|0}if((a[h]|0)!=0){o=b+16|0;i=f;return o|0}}o=c[d>>2]|0;n=c[o+52>>2]|0;o=hc[c[o+44>>2]&63](d,1)|0;$b[n&63](d,o,c[b+12>>2]|0)|0;o=b+16|0;i=f;return o|0}function os(a){a=a|0;var b=0,d=0;b=i;d=c[c[a+4>>2]>>2]|0;d=hc[c[(c[d>>2]|0)+24>>2]&63](d,c[c[a+8>>2]>>2]|0)|0;c[c[a+12>>2]>>2]=d;i=b;return a+16|0}function ps(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;if((a|0)==0){d=Ac(0)|0;a=c[12]|0;c[12]=d;Re(d);Me(d);e=c[12]|0}else{e=Ac(c[a>>2]|0)|0;a=c[12]|0;c[12]=e;d=e}zc((e|0)!=0,33760,33808,284);e=Ec(c[12]|0,24)|0;if((e|0)==0){e=0}else{Te(e,d)}zc((c[12]|0)!=0,33760,33808,284);f=Ec(c[12]|0,32)|0;if((f|0)==0){f=0;c[12]=a;i=b;return f|0}g=f+16|0;c[g>>2]=0;c[g+4>>2]=0;c[f>>2]=d;c[f+4>>2]=e;c[f+8>>2]=0;c[12]=a;i=b;return f|0}function qs(b){b=b|0;var d=0,e=0,f=0,g=0;e=i;d=c[b>>2]|0;if((a[b+24|0]|0)!=0){Cc(d,33520,0)}f=b+8|0;g=c[f>>2]|0;if((g|0)!=0){Hc(c[b>>2]|0,g);c[f>>2]=0}Ic(d,1);Hc(d,c[b+4>>2]|0);Hc(d,b);Cc(d,33536,1);Bc(d);i=e;return 0}function rs(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;c[e+4>>2]=0;c[e>>2]=0;f=b+4|0;if(!(Zc(f,40)|0)){g=c[b+24>>2]|0;Xd(g,3,Td(b)|0,33552,0);i=d;return}Wd(f,e)|0;de(f);g=Vd(b)|0;if(!(Zc(f,41)|0)){g=c[b+24>>2]|0;Xd(g,3,Td(b)|0,33568,0);i=d;return}if((Kc(c[c[a+4>>2]>>2]|0,e,g)|0)!=0){i=d;return}g=c[b+24>>2]|0;Xd(g,3,Td(b)|0,33584,0);i=d;return}function ss(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d;c[e+4>>2]=0;c[e>>2]=0;f=b+4|0;if(!(Zc(f,40)|0)){a=c[b+24>>2]|0;Xd(a,3,Td(b)|0,33552,0);i=d;return}Wd(f,e)|0;if(!(Zc(f,41)|0)){a=c[b+24>>2]|0;Xd(a,3,Td(b)|0,33568,0);i=d;return}f=Rc(c[c[a+4>>2]>>2]|0,e)|0;if((f|0)==0){a=c[b+24>>2]|0;Xd(a,3,Td(b)|0,33608,e);i=d;return}else{Ye(f);i=d;return}}function ts(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+80|0;j=g;e=g+64|0;m=g+44|0;o=g+16|0;n=g+8|0;l=b+4|0;k=c[l>>2]|0;f=c[12]|0;c[12]=c[k>>2];h=c[1320]|0;c[1320]=k;c[j>>2]=33624;c[j+4>>2]=33630;k=Pc(c[k>>2]|0,j)|0;p=c[k+16>>2]|0;if((p&2031616|0)==196608){p=(p&2097152|0)==0}else{p=0}zc(p,33680,33720,182);c[e>>2]=0;if((k|0)==0){k=0}else{$b[c[(c[k>>2]|0)+48>>2]&63](k,e,0)|0;k=c[e>>2]|0}Le(m,k);Sd(o,c[c[l>>2]>>2]|0,d,m,1);c[n+4>>2]=0;c[n>>2]=0;r=o+4|0;s=o+8|0;d=m+4|0;k=m+8|0;p=b+16|0;q=m+16|0;a:while(1){if(((c[s>>2]|0)-(c[r>>2]|0)|0)<=0){b=20;break}if((c[k>>2]|0)!=(0-(c[d>>2]|0)|0)){b=20;break}Wd(r,n)|0;u=p;u=Yt(c[u>>2]|0,c[u+4>>2]|0,1,0)|0;t=p;c[t>>2]=u;c[t+4>>2]=F;do{if(Yc(n,33632)|0){rs(b,o)}else{if(Yc(n,33640)|0){a[q]=1;break}if(Yc(n,33648)|0){ss(b,o);break}if(!(Yc(n,33656)|0)){b=16;break a}Ic(c[b>>2]|0,0)}}while(0);ge(r);Ud(o)}do{if((b|0)==16){if(Yc(n,33664)|0){Ia(33856)|0;j=2;break}else{Ia(33848)|0;b=20;break}}}while(0);if((b|0)==20){xe(c[c[l>>2]>>2]|0,m);l=c[e>>2]|0;n=c[(c[l+8>>2]|0)+16>>2]&255;m=l+(n<<2)+16|0;n=(n|0)==0;if(!n){p=1;q=l+16|0;while(1){o=q+4|0;p=ba(c[q>>2]|0,p)|0;if(o>>>0<m>>>0){q=o}else{break}}if((p|0)>0){if(n){o=1;b=27}else{o=1;b=l+16|0;while(1){n=b+4|0;o=ba(c[b>>2]|0,o)|0;if(n>>>0<m>>>0){b=n}else{b=27;break}}}}}else{o=1;b=27}if((b|0)==27){u=c[l>>2]|0;c[j>>2]=o;c[j+4>>2]=u;$a(33672,j|0)|0}j=(c[k>>2]|0)==(0-(c[d>>2]|0)|0)?0:4}d=c[e>>2]|0;if((d|0)==0){c[1320]=h;c[12]=f;i=g;return j|0}u=c[d+8>>2]|0;hc[c[(c[u>>2]|0)+56>>2]&63](u,e)|0;c[1320]=h;c[12]=f;i=g;return j|0}function us(a){a=a|0;return}function vs(a){a=a|0;return}function ws(a){a=a|0;return}function xs(a){a=a|0;return}function ys(){var a=0,b=0.0;a=i;b=+bb();F=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;i=a;return~~b>>>0|0}function zs(a,b){a=a|0;b=b|0;var c=0;c=i;a=hu(a|0,b|0,1e3,0)|0;i=c;return a|0}function As(a){a=a|0;var b=0;b=i;Oe(a,33896,628,33912,2);Oe(a,33928,629,33912,2);Oe(a,33952,630,33976,2);Oe(a,33992,631,34016,2);Oe(a,34056,632,34080,2);Oe(a,34104,633,34080,2);Oe(a,34128,634,34152,2);Oe(a,34192,635,34208,2);Oe(a,34224,636,34248,2);Oe(a,34272,637,34296,2);Oe(a,34320,638,34248,2);Oe(a,34344,639,34296,2);i=b;return}function Bs(a){a=a|0;var b=0.0,d=0,e=0,f=0;d=i;b=+bb();f=+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;e=c[a+4>>2]|0;c[e>>2]=~~b>>>0;c[e+4>>2]=f;i=d;return a+8|0}function Cs(a){a=a|0;var b=0,d=0.0,e=0,f=0;b=i;d=+bb();f=ju(~~d>>>0|0,(+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0)|0,1e3,0)|0;e=c[a+4>>2]|0;c[e>>2]=f;c[e+4>>2]=F;i=b;return a+8|0}function Ds(a){a=a|0;var b=0.0,d=0;d=i;b=+bb();+Q(b)>=1.0?b>0.0?(ga(+P(b/4294967296.0),4294967295.0)|0)>>>0:~~+aa((b- +(~~b>>>0))/4294967296.0)>>>0:0;c[c[a+4>>2]>>2]=~~b>>>0;i=d;return a+8|0}function Es(a){a=a|0;var b=0,d=0.0,e=0,f=0.0,g=0,i=0;b=c[a+12>>2]|0;d=+h[c[a+4>>2]>>3];e=+Q(d)>=1.0?d>0.0?(ga(+P(d/4294967296.0),4294967295.0)|0)>>>0:~~+aa((d- +(~~d>>>0))/4294967296.0)>>>0:0;f=+h[c[a+8>>2]>>3];g=+Q(f)>=1.0?f>0.0?(ga(+P(f/4294967296.0),4294967295.0)|0)>>>0:~~+aa((f- +(~~f>>>0))/4294967296.0)>>>0:0;i=b;c[i>>2]=~~d>>>0;c[i+4>>2]=e;e=b+8|0;c[e>>2]=~~f>>>0;c[e+4>>2]=g;return a+16|0}function Fs(a){a=a|0;var b=0;b=c[a+4>>2]|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+(c[b+4>>2]|0);return a+12|0}function Gs(a){a=a|0;var b=0;b=(c[a+4>>2]|0)+8|0;h[c[a+8>>2]>>3]=+((c[b>>2]|0)>>>0)+4294967296.0*+((c[b+4>>2]|0)>>>0);return a+12|0}function Hs(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=c[a+12>>2]|0;h=c[a+4>>2]|0;g=c[h+4>>2]|0;d=c[a+8>>2]|0;e=c[d>>2]|0;d=c[d+4>>2]|0;f=b;c[f>>2]=c[h>>2];c[f+4>>2]=g;b=b+8|0;c[b>>2]=e;c[b+4>>2]=d;return a+16|0}function Is(a){a=a|0;var b=0,d=0,e=0.0,f=0,g=0,h=0.0,j=0;b=i;i=i+16|0;g=b;d=c[a+4>>2]|0;if((hb(g|0,0)|0)==-1){c[d+0>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;g=a+8|0;i=b;return g|0}else{e=+(c[g>>2]|0);f=+Q(e)>=1.0?e>0.0?(ga(+P(e/4294967296.0),4294967295.0)|0)>>>0:~~+aa((e- +(~~e>>>0))/4294967296.0)>>>0:0;h=+(c[g+4>>2]|0)/1.0e6;j=+Q(h)>=1.0?h>0.0?(ga(+P(h/4294967296.0),4294967295.0)|0)>>>0:~~+aa((h- +(~~h>>>0))/4294967296.0)>>>0:0;g=d;c[g>>2]=~~e>>>0;c[g+4>>2]=f;g=d+8|0;c[g>>2]=~~h>>>0;c[g+4>>2]=j;g=a+8|0;i=b;return g|0}return 0}function Js(a){a=a|0;var b=0,d=0,e=0;e=c[a+4>>2]|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function Ks(a){a=a|0;var b=0,d=0,e=0;e=(c[a+4>>2]|0)+8|0;d=c[e+4>>2]|0;b=c[a+8>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=d;return a+12|0}function Ls(a){a=a|0;return a+12|0}function Ms(a){a=a|0;return a+12|0}function Ns(a){a=a|0;var b=0;b=i;Ne(a,34408,34424)|0;Oe(a,34432,640,34448,2);Oe(a,34488,641,34448,2);Oe(a,34504,642,34520,2);i=b;return}function Os(a){a=a|0;var b=0;b=i;Ia(34536)|0;i=b;return a+16|0}function Ps(a){a=a|0;var b=0;b=i;Ia(34552)|0;i=b;return a+16|0}function Qs(a){a=a|0;var b=0;b=i;Ia(34568)|0;i=b;return a+8|0}function Rs(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+32|0;g=e+16|0;d=e+8|0;h=e;c[g>>2]=34576;c[g+4>>2]=34582;f=Pc(c[c[1320]>>2]|0,g)|0;j=c[f+16>>2]|0;if((j&2031616|0)==196608){j=(j&2097152|0)==0}else{j=0}zc(j,34616,34656,182);c[d>>2]=0;if((f|0)==0){j=0}else{$b[c[(c[f>>2]|0)+48>>2]&63](f,d,0)|0;j=c[d>>2]|0}f=b+4|0;m=c[f>>2]|0;k=c[b+12>>2]|0;c[h>>2]=c[b+8>>2];c[h+4>>2]=k;Ge(h,(m+ -2|0)/2|0,b+16|0,j);h=c[d>>2]|0;a[g]=10;m=c[(c[h+8>>2]|0)+16>>2]&255;k=h+(m<<2)+16|0;if((m|0)==0){l=1}else{l=1;m=h+16|0;while(1){j=m+4|0;l=ba(c[m>>2]|0,l)|0;if(j>>>0<k>>>0){m=j}else{break}}}Pd(h,l,1,g)|0;k=c[d>>2]|0;g=c[k>>2]|0;m=c[(c[k+8>>2]|0)+16>>2]&255;h=k+(m<<2)+16|0;if((m|0)==0){j=1}else{j=1;l=k+16|0;while(1){k=l+4|0;j=ba(c[l>>2]|0,j)|0;if(k>>>0<h>>>0){l=k}else{break}}}Ka(1,g|0,j|0)|0;b=b+8+(c[f>>2]<<2)|0;f=c[d>>2]|0;if((f|0)==0){i=e;return b|0}m=c[f+8>>2]|0;hc[c[(c[m>>2]|0)+56>>2]&63](m,d)|0;i=e;return b|0}function Ss(a){a=a|0;var b=0;b=i;Ne(a,34696,34712)|0;Qe(a,34720,0,34728);Qe(a,34744,1,34728);Qe(a,34752,2,34728);Oe(a,34760,643,34768,2);Oe(a,34800,644,34808,2);Oe(a,34872,645,34888,2);Oe(a,34984,646,35e3,2);Oe(a,35032,647,35048,2);Oe(a,35072,648,35e3,2);Oe(a,35088,649,35112,2);Oe(a,35160,650,35176,2);Oe(a,35232,651,35248,2);i=b;return}function Ts(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+32|0;e=d;b=d+20|0;h=d+8|0;c[e>>2]=34576;c[e+4>>2]=34582;f=Pc(c[c[1320]>>2]|0,e)|0;j=c[f+16>>2]|0;if((j&2031616|0)==196608){j=(j&2097152|0)==0}else{j=0}zc(j,34616,34656,182);c[b>>2]=0;if((f|0)!=0?($b[c[(c[f>>2]|0)+48>>2]&63](f,b,0)|0,g=c[b>>2]|0,(g|0)!=0):0){ye(h,g,0,0);De(h,c[a+4>>2]|0,c[a+8>>2]|0);f=c[b>>2]|0;k=c[(c[f+8>>2]|0)+16>>2]&255;g=f+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=f+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}k=c[f>>2]|0;c[e>>2]=j;c[e+4>>2]=k;$a(35304,e|0)|0;e=c[b>>2]|0;a=a+12|0;if((e|0)==0){k=a;i=d;return k|0}k=c[e+8>>2]|0;hc[c[(c[k>>2]|0)+56>>2]&63](k,b)|0;k=a;i=d;return k|0}k=a+12|0;i=d;return k|0}function Us(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+272|0;d=e;f=e+4|0;g=c[c[b+12>>2]>>2]|0;if((g|0)==2){h=1}else if((g|0)==0){h=2}else{h=0}g=c[c[b+8>>2]>>2]|0;if((g|0)==1){h=h|512}else if((g|0)==2){h=h|192}else if((g|0)==4){h=h|576}else if((g|0)==3){h=h|64}l=c[c[b+4>>2]>>2]|0;g=c[l>>2]|0;m=c[(c[l+8>>2]|0)+16>>2]&255;j=l+(m<<2)+16|0;if((m|0)==0){k=1}else{k=1;m=l+16|0;while(1){l=m+4|0;k=ba(c[m>>2]|0,k)|0;if(l>>>0<j>>>0){m=l}else{break}}}l=(k|0)<255?k:255;m=f+256|0;c[m>>2]=f+l;$t(f|0,g|0,l|0)|0;a[c[m>>2]|0]=0;c[d>>2]=511;m=tb(f|0,h|0,d|0)|0;c[c[b+16>>2]>>2]=m;i=e;return b+20|0}function Vs(a){a=a|0;var b=0,d=0;b=i;i=i+80|0;d=b;ya(c[c[a+4>>2]>>2]|0,d|0)|0;c[c[a+8>>2]>>2]=c[d+36>>2];i=b;return a+12|0}function Ws(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+272|0;f=e;h=c[c[b+4>>2]>>2]|0;d=c[h>>2]|0;k=c[(c[h+8>>2]|0)+16>>2]&255;g=h+(k<<2)+16|0;if((k|0)==0){j=1}else{j=1;k=h+16|0;while(1){h=k+4|0;j=ba(c[k>>2]|0,j)|0;if(h>>>0<g>>>0){k=h}else{break}}}j=(j|0)<255?j:255;k=f+256|0;c[k>>2]=f+j;$t(f|0,d|0,j|0)|0;a[c[k>>2]|0]=0;k=vb(f|0)|0;c[c[b+8>>2]>>2]=k;i=e;return b+12|0}function Xs(a){a=a|0;var b=0,d=0;b=i;d=Fa(c[c[a+4>>2]>>2]|0)|0;c[c[a+8>>2]>>2]=d;i=b;return a+12|0}function Ys(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;e=c[c[a+4>>2]>>2]|0;d=c[c[a+8>>2]>>2]|0;f=c[c[a+12>>2]>>2]|0;if((f|0)==2){f=1}else if((f|0)==1){f=2}else{f=0}f=mb(e|0,d|0,f|0)|0;c[c[a+16>>2]>>2]=f;i=b;return a+20|0}function Zs(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+80|0;g=d;e=c[c[a+4>>2]>>2]|0;b=c[c[a+8>>2]>>2]|0;f=c[c[a+12>>2]>>2]|0;if((f|0)==-1){ya(e|0,g|0)|0;f=(c[g+36>>2]|0)/(c[(c[b+12>>2]|0)+12>>2]|0)|0}if(!(Nc(b,f)|0)){j=a+20|0;i=d;return j|0}j=c[(c[b+8>>2]|0)+16>>2]&255;g=b+(j<<2)+16|0;if((j|0)==0){h=1}else{h=1;j=b+16|0;while(1){f=j+4|0;h=ba(c[j>>2]|0,h)|0;if(f>>>0<g>>>0){j=f}else{break}}}f=b+12|0;g=ba(c[(c[f>>2]|0)+12>>2]|0,h)|0;e=db(e|0,c[b>>2]|0,g|0)|0;if((e|0)<0){c[c[a+16>>2]>>2]=e;Oc(b,0)|0;j=a+20|0;i=d;return j|0}if((g|0)==(e|0)){j=a+20|0;i=d;return j|0}Oc(b,(e|0)/(c[(c[f>>2]|0)+12>>2]|0)|0)|0;j=a+20|0;i=d;return j|0}function _s(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;e=i;d=c[c[a+4>>2]>>2]|0;b=c[c[a+8>>2]>>2]|0;j=c[(c[b+8>>2]|0)+16>>2]&255;f=b+(j<<2)+16|0;if((j|0)==0){h=1}else{h=1;j=b+16|0;while(1){g=j+4|0;h=ba(c[j>>2]|0,h)|0;if(g>>>0<f>>>0){j=g}else{break}}}j=ba(c[(c[b+12>>2]|0)+12>>2]|0,h)|0;j=Ka(d|0,c[b>>2]|0,j|0)|0;c[c[a+12>>2]>>2]=j;i=e;return a+16|0}function $s(){return 65539}function at(a){a=a|0;var b=0;b=i;a=ps(a)|0;i=b;return a|0}function bt(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e;if((d|0)==-1){d=Xt(b|0)|0}c[f>>2]=b;c[f+4>>2]=b+d;ts(a,f)|0;i=e;return}function ct(a,b){a=a|0;b=b|0;var d=0;d=i;a=Ve(c[a+4>>2]|0,b)|0;i=d;return a|0}function dt(a){a=a|0;var b=0;b=i;if((a|0)!=0){qs(a)|0}i=b;return}function et(a){a=+a;var b=0,d=0,e=0,f=0,j=0,l=0;b=i;i=i+16|0;d=b+4|0;e=b;h[k>>3]=a;f=c[k>>2]|0;l=c[k+4>>2]|0;j=_t(f|0,l|0,52)|0;j=j&2047;if((j|0)==0){e=cu(f|0,l|0,12)|0;f=F;if((e|0)==0&(f|0)==0){g[d>>2]=u;l=-2147483648;i=b;return l|0}if((f|0)>-1|(f|0)==-1&e>>>0>4294967295){d=e;e=-1023}else{l=-1023;i=b;return l|0}do{e=e+ -1|0;d=cu(d|0,f|0,1)|0;f=F}while((f|0)>-1|(f|0)==-1&d>>>0>4294967295);i=b;return e|0}else if((j|0)==2047){g[e>>2]=u;l=(f|0)!=0|(l&1048575|0)!=0?-2147483648:2147483647;i=b;return l|0}else{l=j+ -1023|0;i=b;return l|0}return 0}function ft(a){a=+a;var b=0,d=0,e=0,f=0,h=0;b=i;i=i+16|0;d=b+4|0;e=b;f=(g[k>>2]=a,c[k>>2]|0);h=f>>>23&255;do{if((h|0)==0){e=f<<9;if((e|0)==0){g[d>>2]=u;d=-2147483648;break}if((e|0)>-1){d=-127;do{d=d+ -1|0;e=e<<1}while((e|0)>-1)}else{d=-127}}else if((h|0)==255){g[e>>2]=u;d=(f&8388607|0)!=0?-2147483648:2147483647}else{d=h+ -127|0}}while(0);i=b;return d|0}function gt(a){a=+a;var b=0,d=0;b=i;h[k>>3]=a;d=c[k+4>>2]&2146435072;if(!(d>>>0<2146435072|(d|0)==2146435072&0<0)){a=a*a;i=b;return+a}if(a==0.0){a=-1.0/(a*a);i=b;return+a}else{a=+(et(a)|0);i=b;return+a}return 0.0}function ht(a){a=+a;var b=0;b=i;do{if(((g[k>>2]=a,c[k>>2]|0)&2139095040)>>>0<2139095040){if(a==0.0){a=-1.0/(a*a);break}else{a=+(ft(a)|0);break}}else{a=a*a}}while(0);i=b;return+a}function it(a,b){a=+a;b=b|0;var d=0,e=0;d=i;if((b|0)>127){a=a*1.7014118346046923e+38;e=b+ -127|0;if((e|0)>127){b=b+ -254|0;b=(b|0)>127?127:b;a=a*1.7014118346046923e+38}else{b=e}}else{if((b|0)<-126){a=a*1.1754943508222875e-38;e=b+126|0;if((e|0)<-126){b=b+252|0;b=(b|0)<-126?-126:b;a=a*1.1754943508222875e-38}else{b=e}}}a=a*(c[k>>2]=(b<<23)+1065353216,+g[k>>2]);i=d;return+a}function jt(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=d&255;j=(e|0)==0;a:do{if((b&3|0)==0|j){h=e;e=5}else{h=d&255;while(1){if((a[b]|0)==h<<24>>24){h=e;e=6;break a}b=b+1|0;e=e+ -1|0;j=(e|0)==0;if((b&3|0)==0|j){h=e;e=5;break}}}}while(0);if((e|0)==5){if(j){h=0}else{e=6}}b:do{if((e|0)==6){d=d&255;if(!((a[b]|0)==d<<24>>24)){g=ba(g,16843009)|0;c:do{if(h>>>0>3){do{j=c[b>>2]^g;if(((j&-2139062144^-2139062144)&j+ -16843009|0)!=0){break c}b=b+4|0;h=h+ -4|0}while(h>>>0>3)}}while(0);if((h|0)==0){h=0}else{while(1){if((a[b]|0)==d<<24>>24){break b}b=b+1|0;h=h+ -1|0;if((h|0)==0){h=0;break}}}}}}while(0);i=f;return((h|0)!=0?b:0)|0}function kt(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;e=i;c=c&255;while(1){f=d+ -1|0;if((d|0)==0){d=0;b=4;break}d=b+f|0;if((a[d]|0)==c<<24>>24){b=4;break}else{d=f}}if((b|0)==4){i=e;return d|0}return 0}function lt(a,b){a=a|0;b=b|0;var c=0;c=i;b=kt(a,b,(Xt(a|0)|0)+1|0)|0;i=c;return b|0}function mt(a){a=a|0;return}function nt(a){a=a|0;return}function ot(a){a=a|0;return}function pt(a){a=a|0;return}function qt(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function rt(a){a=a|0;var b=0;b=i;Gt(a);i=b;return}function st(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+64|0;f=e;if((a|0)==(b|0)){h=1;i=e;return h|0}if((b|0)==0){h=0;i=e;return h|0}b=vt(b,35376,35432,0)|0;if((b|0)==0){h=0;i=e;return h|0}h=f+0|0;g=h+56|0;do{c[h>>2]=0;h=h+4|0}while((h|0)<(g|0));c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;ic[c[(c[b>>2]|0)+28>>2]&31](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){h=0;i=e;return h|0}c[d>>2]=c[f+16>>2];h=1;i=e;return h|0}function tt(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((c[d+8>>2]|0)!=(b|0)){i=g;return}b=d+16|0;h=c[b>>2]|0;if((h|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;i=g;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;i=g;return}e=d+24|0;if((c[e>>2]|0)!=2){i=g;return}c[e>>2]=f;i=g;return}function ut(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((b|0)!=(c[d+8>>2]|0)){h=c[b+8>>2]|0;ic[c[(c[h>>2]|0)+28>>2]&31](h,d,e,f);i=g;return}b=d+16|0;h=c[b>>2]|0;if((h|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;i=g;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;i=g;return}e=d+24|0;if((c[e>>2]|0)!=2){i=g;return}c[e>>2]=f;i=g;return}function vt(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=i;i=i+64|0;j=h;k=c[d>>2]|0;l=d+(c[k+ -8>>2]|0)|0;k=c[k+ -4>>2]|0;c[j>>2]=f;c[j+4>>2]=d;c[j+8>>2]=e;c[j+12>>2]=g;n=j+16|0;o=j+20|0;e=j+24|0;m=j+28|0;g=j+32|0;d=j+40|0;p=(k|0)==(f|0);q=n+0|0;f=q+36|0;do{c[q>>2]=0;q=q+4|0}while((q|0)<(f|0));b[n+36>>1]=0;a[n+38|0]=0;if(p){c[j+48>>2]=1;gc[c[(c[k>>2]|0)+20>>2]&31](k,j,l,l,1,0);q=(c[e>>2]|0)==1?l:0;i=h;return q|0}ac[c[(c[k>>2]|0)+24>>2]&31](k,j,l,1,0);j=c[j+36>>2]|0;if((j|0)==0){if((c[d>>2]|0)!=1){q=0;i=h;return q|0}if((c[m>>2]|0)!=1){q=0;i=h;return q|0}q=(c[g>>2]|0)==1?c[o>>2]|0:0;i=h;return q|0}else if((j|0)==1){if((c[e>>2]|0)!=1){if((c[d>>2]|0)!=0){q=0;i=h;return q|0}if((c[m>>2]|0)!=1){q=0;i=h;return q|0}if((c[g>>2]|0)!=1){q=0;i=h;return q|0}}q=c[n>>2]|0;i=h;return q|0}else{q=0;i=h;return q|0}return 0}function wt(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;if((b|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){i=h;return}j=d+28|0;if((c[j>>2]|0)==1){i=h;return}c[j>>2]=f;i=h;return}if((b|0)!=(c[d>>2]|0)){l=c[b+8>>2]|0;ac[c[(c[l>>2]|0)+24>>2]&31](l,d,e,f,g);i=h;return}if((c[d+16>>2]|0)!=(e|0)?(k=d+20|0,(c[k>>2]|0)!=(e|0)):0){c[d+32>>2]=f;f=d+44|0;if((c[f>>2]|0)==4){i=h;return}l=d+52|0;a[l]=0;m=d+53|0;a[m]=0;b=c[b+8>>2]|0;gc[c[(c[b>>2]|0)+20>>2]&31](b,d,e,e,1,g);if((a[m]|0)!=0){if((a[l]|0)==0){b=1;j=13}}else{b=0;j=13}do{if((j|0)==13){c[k>>2]=e;m=d+40|0;c[m>>2]=(c[m>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54|0]=1;if(b){break}}else{j=16}if((j|0)==16?b:0){break}c[f>>2]=4;i=h;return}}while(0);c[f>>2]=3;i=h;return}if((f|0)!=1){i=h;return}c[d+32>>2]=1;i=h;return}function xt(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;g=i;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){i=g;return}d=d+28|0;if((c[d>>2]|0)==1){i=g;return}c[d>>2]=f;i=g;return}if((c[d>>2]|0)!=(b|0)){i=g;return}if((c[d+16>>2]|0)!=(e|0)?(h=d+20|0,(c[h>>2]|0)!=(e|0)):0){c[d+32>>2]=f;c[h>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54|0]=1}c[d+44>>2]=4;i=g;return}if((f|0)!=1){i=g;return}c[d+32>>2]=1;i=g;return}function yt(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0;j=i;if((b|0)!=(c[d+8>>2]|0)){b=c[b+8>>2]|0;gc[c[(c[b>>2]|0)+20>>2]&31](b,d,e,f,g,h);i=j;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){i=j;return}a[d+52|0]=1;b=d+16|0;f=c[b>>2]|0;if((f|0)==0){c[b>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}if((f|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;a[d+54|0]=1;i=j;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g}else{g=b}if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}function zt(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;h=i;if((c[d+8>>2]|0)!=(b|0)){i=h;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){i=h;return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=h;return}a[d+54|0]=1;i=h;return}if((b|0)!=(e|0)){b=d+36|0;c[b>>2]=(c[b>>2]|0)+1;a[d+54|0]=1;i=h;return}e=d+24|0;f=c[e>>2]|0;if((f|0)==2){c[e>>2]=g}else{g=f}if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=h;return}a[d+54|0]=1;i=h;return}function At(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;b=i;do{if(a>>>0<245){if(a>>>0<11){a=16}else{a=a+11&-8}v=a>>>3;t=c[8896]|0;w=t>>>v;if((w&3|0)!=0){h=(w&1^1)+v|0;g=h<<1;e=35624+(g<<2)|0;g=35624+(g+2<<2)|0;j=c[g>>2]|0;d=j+8|0;f=c[d>>2]|0;do{if((e|0)!=(f|0)){if(f>>>0<(c[35600>>2]|0)>>>0){Cb()}k=f+12|0;if((c[k>>2]|0)==(j|0)){c[k>>2]=e;c[g>>2]=f;break}else{Cb()}}else{c[8896]=t&~(1<<h)}}while(0);H=h<<3;c[j+4>>2]=H|3;H=j+(H|4)|0;c[H>>2]=c[H>>2]|1;H=d;i=b;return H|0}if(a>>>0>(c[35592>>2]|0)>>>0){if((w|0)!=0){j=2<<v;j=w<<v&(j|0-j);j=(j&0-j)+ -1|0;d=j>>>12&16;j=j>>>d;h=j>>>5&8;j=j>>>h;g=j>>>2&4;j=j>>>g;f=j>>>1&2;j=j>>>f;e=j>>>1&1;e=(h|d|g|f|e)+(j>>>e)|0;j=e<<1;f=35624+(j<<2)|0;j=35624+(j+2<<2)|0;g=c[j>>2]|0;d=g+8|0;h=c[d>>2]|0;do{if((f|0)!=(h|0)){if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}k=h+12|0;if((c[k>>2]|0)==(g|0)){c[k>>2]=f;c[j>>2]=h;break}else{Cb()}}else{c[8896]=t&~(1<<e)}}while(0);h=e<<3;f=h-a|0;c[g+4>>2]=a|3;e=g+a|0;c[g+(a|4)>>2]=f|1;c[g+h>>2]=f;h=c[35592>>2]|0;if((h|0)!=0){g=c[35604>>2]|0;k=h>>>3;l=k<<1;h=35624+(l<<2)|0;j=c[8896]|0;k=1<<k;if((j&k|0)!=0){j=35624+(l+2<<2)|0;k=c[j>>2]|0;if(k>>>0<(c[35600>>2]|0)>>>0){Cb()}else{D=j;C=k}}else{c[8896]=j|k;D=35624+(l+2<<2)|0;C=h}c[D>>2]=g;c[C+12>>2]=g;c[g+8>>2]=C;c[g+12>>2]=h}c[35592>>2]=f;c[35604>>2]=e;H=d;i=b;return H|0}t=c[35588>>2]|0;if((t|0)!=0){d=(t&0-t)+ -1|0;G=d>>>12&16;d=d>>>G;F=d>>>5&8;d=d>>>F;H=d>>>2&4;d=d>>>H;h=d>>>1&2;d=d>>>h;e=d>>>1&1;e=c[35888+((F|G|H|h|e)+(d>>>e)<<2)>>2]|0;d=(c[e+4>>2]&-8)-a|0;h=e;while(1){g=c[h+16>>2]|0;if((g|0)==0){g=c[h+20>>2]|0;if((g|0)==0){break}}h=(c[g+4>>2]&-8)-a|0;f=h>>>0<d>>>0;d=f?h:d;h=g;e=f?g:e}h=c[35600>>2]|0;if(e>>>0<h>>>0){Cb()}f=e+a|0;if(!(e>>>0<f>>>0)){Cb()}g=c[e+24>>2]|0;j=c[e+12>>2]|0;do{if((j|0)==(e|0)){k=e+20|0;j=c[k>>2]|0;if((j|0)==0){k=e+16|0;j=c[k>>2]|0;if((j|0)==0){B=0;break}}while(1){m=j+20|0;l=c[m>>2]|0;if((l|0)!=0){j=l;k=m;continue}m=j+16|0;l=c[m>>2]|0;if((l|0)==0){break}else{j=l;k=m}}if(k>>>0<h>>>0){Cb()}else{c[k>>2]=0;B=j;break}}else{k=c[e+8>>2]|0;if(k>>>0<h>>>0){Cb()}h=k+12|0;if((c[h>>2]|0)!=(e|0)){Cb()}l=j+8|0;if((c[l>>2]|0)==(e|0)){c[h>>2]=j;c[l>>2]=k;B=j;break}else{Cb()}}}while(0);do{if((g|0)!=0){j=c[e+28>>2]|0;h=35888+(j<<2)|0;if((e|0)==(c[h>>2]|0)){c[h>>2]=B;if((B|0)==0){c[35588>>2]=c[35588>>2]&~(1<<j);break}}else{if(g>>>0<(c[35600>>2]|0)>>>0){Cb()}h=g+16|0;if((c[h>>2]|0)==(e|0)){c[h>>2]=B}else{c[g+20>>2]=B}if((B|0)==0){break}}if(B>>>0<(c[35600>>2]|0)>>>0){Cb()}c[B+24>>2]=g;g=c[e+16>>2]|0;do{if((g|0)!=0){if(g>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[B+16>>2]=g;c[g+24>>2]=B;break}}}while(0);g=c[e+20>>2]|0;if((g|0)!=0){if(g>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[B+20>>2]=g;c[g+24>>2]=B;break}}}}while(0);if(d>>>0<16){H=d+a|0;c[e+4>>2]=H|3;H=e+(H+4)|0;c[H>>2]=c[H>>2]|1}else{c[e+4>>2]=a|3;c[e+(a|4)>>2]=d|1;c[e+(d+a)>>2]=d;h=c[35592>>2]|0;if((h|0)!=0){g=c[35604>>2]|0;k=h>>>3;l=k<<1;h=35624+(l<<2)|0;j=c[8896]|0;k=1<<k;if((j&k|0)!=0){j=35624+(l+2<<2)|0;k=c[j>>2]|0;if(k>>>0<(c[35600>>2]|0)>>>0){Cb()}else{A=j;z=k}}else{c[8896]=j|k;A=35624+(l+2<<2)|0;z=h}c[A>>2]=g;c[z+12>>2]=g;c[g+8>>2]=z;c[g+12>>2]=h}c[35592>>2]=d;c[35604>>2]=f}H=e+8|0;i=b;return H|0}}}else{if(!(a>>>0>4294967231)){z=a+11|0;a=z&-8;B=c[35588>>2]|0;if((B|0)!=0){A=0-a|0;z=z>>>8;if((z|0)!=0){if(a>>>0>16777215){C=31}else{G=(z+1048320|0)>>>16&8;H=z<<G;F=(H+520192|0)>>>16&4;H=H<<F;C=(H+245760|0)>>>16&2;C=14-(F|G|C)+(H<<C>>>15)|0;C=a>>>(C+7|0)&1|C<<1}}else{C=0}F=c[35888+(C<<2)>>2]|0;a:do{if((F|0)==0){E=0;z=0}else{if((C|0)==31){z=0}else{z=25-(C>>>1)|0}E=0;D=a<<z;z=0;while(1){H=c[F+4>>2]&-8;G=H-a|0;if(G>>>0<A>>>0){if((H|0)==(a|0)){A=G;E=F;z=F;break a}else{A=G;z=F}}G=c[F+20>>2]|0;F=c[F+(D>>>31<<2)+16>>2]|0;E=(G|0)==0|(G|0)==(F|0)?E:G;if((F|0)==0){break}else{D=D<<1}}}}while(0);if((E|0)==0&(z|0)==0){H=2<<C;B=B&(H|0-H);if((B|0)==0){break}H=(B&0-B)+ -1|0;D=H>>>12&16;H=H>>>D;C=H>>>5&8;H=H>>>C;F=H>>>2&4;H=H>>>F;G=H>>>1&2;H=H>>>G;E=H>>>1&1;E=c[35888+((C|D|F|G|E)+(H>>>E)<<2)>>2]|0}if((E|0)!=0){while(1){C=(c[E+4>>2]&-8)-a|0;B=C>>>0<A>>>0;A=B?C:A;z=B?E:z;B=c[E+16>>2]|0;if((B|0)!=0){E=B;continue}E=c[E+20>>2]|0;if((E|0)==0){break}}}if((z|0)!=0?A>>>0<((c[35592>>2]|0)-a|0)>>>0:0){f=c[35600>>2]|0;if(z>>>0<f>>>0){Cb()}d=z+a|0;if(!(z>>>0<d>>>0)){Cb()}e=c[z+24>>2]|0;h=c[z+12>>2]|0;do{if((h|0)==(z|0)){h=z+20|0;g=c[h>>2]|0;if((g|0)==0){h=z+16|0;g=c[h>>2]|0;if((g|0)==0){x=0;break}}while(1){k=g+20|0;j=c[k>>2]|0;if((j|0)!=0){g=j;h=k;continue}j=g+16|0;k=c[j>>2]|0;if((k|0)==0){break}else{g=k;h=j}}if(h>>>0<f>>>0){Cb()}else{c[h>>2]=0;x=g;break}}else{g=c[z+8>>2]|0;if(g>>>0<f>>>0){Cb()}j=g+12|0;if((c[j>>2]|0)!=(z|0)){Cb()}f=h+8|0;if((c[f>>2]|0)==(z|0)){c[j>>2]=h;c[f>>2]=g;x=h;break}else{Cb()}}}while(0);do{if((e|0)!=0){f=c[z+28>>2]|0;g=35888+(f<<2)|0;if((z|0)==(c[g>>2]|0)){c[g>>2]=x;if((x|0)==0){c[35588>>2]=c[35588>>2]&~(1<<f);break}}else{if(e>>>0<(c[35600>>2]|0)>>>0){Cb()}f=e+16|0;if((c[f>>2]|0)==(z|0)){c[f>>2]=x}else{c[e+20>>2]=x}if((x|0)==0){break}}if(x>>>0<(c[35600>>2]|0)>>>0){Cb()}c[x+24>>2]=e;e=c[z+16>>2]|0;do{if((e|0)!=0){if(e>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[x+16>>2]=e;c[e+24>>2]=x;break}}}while(0);e=c[z+20>>2]|0;if((e|0)!=0){if(e>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[x+20>>2]=e;c[e+24>>2]=x;break}}}}while(0);b:do{if(!(A>>>0<16)){c[z+4>>2]=a|3;c[z+(a|4)>>2]=A|1;c[z+(A+a)>>2]=A;f=A>>>3;if(A>>>0<256){h=f<<1;e=35624+(h<<2)|0;g=c[8896]|0;f=1<<f;if((g&f|0)!=0){g=35624+(h+2<<2)|0;f=c[g>>2]|0;if(f>>>0<(c[35600>>2]|0)>>>0){Cb()}else{w=g;v=f}}else{c[8896]=g|f;w=35624+(h+2<<2)|0;v=e}c[w>>2]=d;c[v+12>>2]=d;c[z+(a+8)>>2]=v;c[z+(a+12)>>2]=e;break}e=A>>>8;if((e|0)!=0){if(A>>>0>16777215){e=31}else{G=(e+1048320|0)>>>16&8;H=e<<G;F=(H+520192|0)>>>16&4;H=H<<F;e=(H+245760|0)>>>16&2;e=14-(F|G|e)+(H<<e>>>15)|0;e=A>>>(e+7|0)&1|e<<1}}else{e=0}h=35888+(e<<2)|0;c[z+(a+28)>>2]=e;c[z+(a+20)>>2]=0;c[z+(a+16)>>2]=0;f=c[35588>>2]|0;g=1<<e;if((f&g|0)==0){c[35588>>2]=f|g;c[h>>2]=d;c[z+(a+24)>>2]=h;c[z+(a+12)>>2]=d;c[z+(a+8)>>2]=d;break}f=c[h>>2]|0;if((e|0)==31){e=0}else{e=25-(e>>>1)|0}c:do{if((c[f+4>>2]&-8|0)!=(A|0)){e=A<<e;while(1){h=f+(e>>>31<<2)+16|0;g=c[h>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(A|0)){t=g;break c}else{e=e<<1;f=g}}if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[h>>2]=d;c[z+(a+24)>>2]=f;c[z+(a+12)>>2]=d;c[z+(a+8)>>2]=d;break b}}else{t=f}}while(0);f=t+8|0;e=c[f>>2]|0;g=c[35600>>2]|0;if(t>>>0<g>>>0){Cb()}if(e>>>0<g>>>0){Cb()}else{c[e+12>>2]=d;c[f>>2]=d;c[z+(a+8)>>2]=e;c[z+(a+12)>>2]=t;c[z+(a+24)>>2]=0;break}}else{H=A+a|0;c[z+4>>2]=H|3;H=z+(H+4)|0;c[H>>2]=c[H>>2]|1}}while(0);H=z+8|0;i=b;return H|0}}}else{a=-1}}}while(0);t=c[35592>>2]|0;if(!(a>>>0>t>>>0)){e=t-a|0;d=c[35604>>2]|0;if(e>>>0>15){c[35604>>2]=d+a;c[35592>>2]=e;c[d+(a+4)>>2]=e|1;c[d+t>>2]=e;c[d+4>>2]=a|3}else{c[35592>>2]=0;c[35604>>2]=0;c[d+4>>2]=t|3;H=d+(t+4)|0;c[H>>2]=c[H>>2]|1}H=d+8|0;i=b;return H|0}t=c[35596>>2]|0;if(a>>>0<t>>>0){G=t-a|0;c[35596>>2]=G;H=c[35608>>2]|0;c[35608>>2]=H+a;c[H+(a+4)>>2]=G|1;c[H+4>>2]=a|3;H=H+8|0;i=b;return H|0}do{if((c[9014]|0)==0){t=Ea(30)|0;if((t+ -1&t|0)==0){c[36064>>2]=t;c[36060>>2]=t;c[36068>>2]=-1;c[36072>>2]=-1;c[36076>>2]=0;c[36028>>2]=0;c[9014]=(fb(0)|0)&-16^1431655768;break}else{Cb()}}}while(0);v=a+48|0;A=c[36064>>2]|0;w=a+47|0;x=A+w|0;A=0-A|0;t=x&A;if(!(t>>>0>a>>>0)){H=0;i=b;return H|0}z=c[36024>>2]|0;if((z|0)!=0?(G=c[36016>>2]|0,H=G+t|0,H>>>0<=G>>>0|H>>>0>z>>>0):0){H=0;i=b;return H|0}d:do{if((c[36028>>2]&4|0)==0){B=c[35608>>2]|0;e:do{if((B|0)!=0){z=36032|0;while(1){C=c[z>>2]|0;if(!(C>>>0>B>>>0)?(y=z+4|0,(C+(c[y>>2]|0)|0)>>>0>B>>>0):0){break}z=c[z+8>>2]|0;if((z|0)==0){o=182;break e}}if((z|0)!=0){A=x-(c[35596>>2]|0)&A;if(A>>>0<2147483647){o=qb(A|0)|0;B=(o|0)==((c[z>>2]|0)+(c[y>>2]|0)|0);x=o;z=A;y=B?o:-1;A=B?A:0;o=191}else{A=0}}else{o=182}}else{o=182}}while(0);do{if((o|0)==182){y=qb(0)|0;if((y|0)!=(-1|0)){z=y;x=c[36060>>2]|0;A=x+ -1|0;if((A&z|0)==0){A=t}else{A=t-z+(A+z&0-x)|0}z=c[36016>>2]|0;B=z+A|0;if(A>>>0>a>>>0&A>>>0<2147483647){x=c[36024>>2]|0;if((x|0)!=0?B>>>0<=z>>>0|B>>>0>x>>>0:0){A=0;break}x=qb(A|0)|0;o=(x|0)==(y|0);z=A;y=o?y:-1;A=o?A:0;o=191}else{A=0}}else{A=0}}}while(0);f:do{if((o|0)==191){o=0-z|0;if((y|0)!=(-1|0)){s=y;p=A;o=202;break d}do{if((x|0)!=(-1|0)&z>>>0<2147483647&z>>>0<v>>>0?(u=c[36064>>2]|0,u=w-z+u&0-u,u>>>0<2147483647):0){if((qb(u|0)|0)==(-1|0)){qb(o|0)|0;break f}else{z=u+z|0;break}}}while(0);if((x|0)!=(-1|0)){s=x;p=z;o=202;break d}}}while(0);c[36028>>2]=c[36028>>2]|4;o=199}else{A=0;o=199}}while(0);if((((o|0)==199?t>>>0<2147483647:0)?(s=qb(t|0)|0,r=qb(0)|0,(r|0)!=(-1|0)&(s|0)!=(-1|0)&s>>>0<r>>>0):0)?(q=r-s|0,p=q>>>0>(a+40|0)>>>0,p):0){p=p?q:A;o=202}if((o|0)==202){q=(c[36016>>2]|0)+p|0;c[36016>>2]=q;if(q>>>0>(c[36020>>2]|0)>>>0){c[36020>>2]=q}q=c[35608>>2]|0;g:do{if((q|0)!=0){w=36032|0;while(1){r=c[w>>2]|0;u=w+4|0;v=c[u>>2]|0;if((s|0)==(r+v|0)){o=214;break}t=c[w+8>>2]|0;if((t|0)==0){break}else{w=t}}if(((o|0)==214?(c[w+12>>2]&8|0)==0:0)?q>>>0>=r>>>0&q>>>0<s>>>0:0){c[u>>2]=v+p;d=(c[35596>>2]|0)+p|0;e=q+8|0;if((e&7|0)==0){e=0}else{e=0-e&7}H=d-e|0;c[35608>>2]=q+e;c[35596>>2]=H;c[q+(e+4)>>2]=H|1;c[q+(d+4)>>2]=40;c[35612>>2]=c[36072>>2];break}if(s>>>0<(c[35600>>2]|0)>>>0){c[35600>>2]=s}u=s+p|0;r=36032|0;while(1){if((c[r>>2]|0)==(u|0)){o=224;break}t=c[r+8>>2]|0;if((t|0)==0){break}else{r=t}}if((o|0)==224?(c[r+12>>2]&8|0)==0:0){c[r>>2]=s;h=r+4|0;c[h>>2]=(c[h>>2]|0)+p;h=s+8|0;if((h&7|0)==0){h=0}else{h=0-h&7}j=s+(p+8)|0;if((j&7|0)==0){o=0}else{o=0-j&7}q=s+(o+p)|0;k=h+a|0;j=s+k|0;m=q-(s+h)-a|0;c[s+(h+4)>>2]=a|3;h:do{if((q|0)!=(c[35608>>2]|0)){if((q|0)==(c[35604>>2]|0)){H=(c[35592>>2]|0)+m|0;c[35592>>2]=H;c[35604>>2]=j;c[s+(k+4)>>2]=H|1;c[s+(H+k)>>2]=H;break}a=p+4|0;t=c[s+(a+o)>>2]|0;if((t&3|0)==1){n=t&-8;r=t>>>3;do{if(!(t>>>0<256)){l=c[s+((o|24)+p)>>2]|0;u=c[s+(p+12+o)>>2]|0;do{if((u|0)==(q|0)){u=o|16;t=s+(a+u)|0;r=c[t>>2]|0;if((r|0)==0){t=s+(u+p)|0;r=c[t>>2]|0;if((r|0)==0){g=0;break}}while(1){v=r+20|0;u=c[v>>2]|0;if((u|0)!=0){r=u;t=v;continue}u=r+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{r=v;t=u}}if(t>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[t>>2]=0;g=r;break}}else{t=c[s+((o|8)+p)>>2]|0;if(t>>>0<(c[35600>>2]|0)>>>0){Cb()}r=t+12|0;if((c[r>>2]|0)!=(q|0)){Cb()}v=u+8|0;if((c[v>>2]|0)==(q|0)){c[r>>2]=u;c[v>>2]=t;g=u;break}else{Cb()}}}while(0);if((l|0)!=0){r=c[s+(p+28+o)>>2]|0;t=35888+(r<<2)|0;if((q|0)==(c[t>>2]|0)){c[t>>2]=g;if((g|0)==0){c[35588>>2]=c[35588>>2]&~(1<<r);break}}else{if(l>>>0<(c[35600>>2]|0)>>>0){Cb()}r=l+16|0;if((c[r>>2]|0)==(q|0)){c[r>>2]=g}else{c[l+20>>2]=g}if((g|0)==0){break}}if(g>>>0<(c[35600>>2]|0)>>>0){Cb()}c[g+24>>2]=l;q=o|16;l=c[s+(q+p)>>2]|0;do{if((l|0)!=0){if(l>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[g+16>>2]=l;c[l+24>>2]=g;break}}}while(0);l=c[s+(a+q)>>2]|0;if((l|0)!=0){if(l>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[g+20>>2]=l;c[l+24>>2]=g;break}}}}else{g=c[s+((o|8)+p)>>2]|0;a=c[s+(p+12+o)>>2]|0;t=35624+(r<<1<<2)|0;if((g|0)!=(t|0)){if(g>>>0<(c[35600>>2]|0)>>>0){Cb()}if((c[g+12>>2]|0)!=(q|0)){Cb()}}if((a|0)==(g|0)){c[8896]=c[8896]&~(1<<r);break}if((a|0)!=(t|0)){if(a>>>0<(c[35600>>2]|0)>>>0){Cb()}r=a+8|0;if((c[r>>2]|0)==(q|0)){l=r}else{Cb()}}else{l=a+8|0}c[g+12>>2]=a;c[l>>2]=g}}while(0);q=s+((n|o)+p)|0;m=n+m|0}g=q+4|0;c[g>>2]=c[g>>2]&-2;c[s+(k+4)>>2]=m|1;c[s+(m+k)>>2]=m;g=m>>>3;if(m>>>0<256){m=g<<1;d=35624+(m<<2)|0;l=c[8896]|0;g=1<<g;if((l&g|0)!=0){l=35624+(m+2<<2)|0;g=c[l>>2]|0;if(g>>>0<(c[35600>>2]|0)>>>0){Cb()}else{e=l;f=g}}else{c[8896]=l|g;e=35624+(m+2<<2)|0;f=d}c[e>>2]=j;c[f+12>>2]=j;c[s+(k+8)>>2]=f;c[s+(k+12)>>2]=d;break}e=m>>>8;if((e|0)!=0){if(m>>>0>16777215){e=31}else{G=(e+1048320|0)>>>16&8;H=e<<G;F=(H+520192|0)>>>16&4;H=H<<F;e=(H+245760|0)>>>16&2;e=14-(F|G|e)+(H<<e>>>15)|0;e=m>>>(e+7|0)&1|e<<1}}else{e=0}f=35888+(e<<2)|0;c[s+(k+28)>>2]=e;c[s+(k+20)>>2]=0;c[s+(k+16)>>2]=0;l=c[35588>>2]|0;g=1<<e;if((l&g|0)==0){c[35588>>2]=l|g;c[f>>2]=j;c[s+(k+24)>>2]=f;c[s+(k+12)>>2]=j;c[s+(k+8)>>2]=j;break}f=c[f>>2]|0;if((e|0)==31){e=0}else{e=25-(e>>>1)|0}i:do{if((c[f+4>>2]&-8|0)!=(m|0)){e=m<<e;while(1){g=f+(e>>>31<<2)+16|0;l=c[g>>2]|0;if((l|0)==0){break}if((c[l+4>>2]&-8|0)==(m|0)){d=l;break i}else{e=e<<1;f=l}}if(g>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[g>>2]=j;c[s+(k+24)>>2]=f;c[s+(k+12)>>2]=j;c[s+(k+8)>>2]=j;break h}}else{d=f}}while(0);f=d+8|0;e=c[f>>2]|0;g=c[35600>>2]|0;if(d>>>0<g>>>0){Cb()}if(e>>>0<g>>>0){Cb()}else{c[e+12>>2]=j;c[f>>2]=j;c[s+(k+8)>>2]=e;c[s+(k+12)>>2]=d;c[s+(k+24)>>2]=0;break}}else{H=(c[35596>>2]|0)+m|0;c[35596>>2]=H;c[35608>>2]=j;c[s+(k+4)>>2]=H|1}}while(0);H=s+(h|8)|0;i=b;return H|0}e=36032|0;while(1){d=c[e>>2]|0;if(!(d>>>0>q>>>0)?(n=c[e+4>>2]|0,m=d+n|0,m>>>0>q>>>0):0){break}e=c[e+8>>2]|0}e=d+(n+ -39)|0;if((e&7|0)==0){e=0}else{e=0-e&7}d=d+(n+ -47+e)|0;d=d>>>0<(q+16|0)>>>0?q:d;e=d+8|0;f=s+8|0;if((f&7|0)==0){f=0}else{f=0-f&7}H=p+ -40-f|0;c[35608>>2]=s+f;c[35596>>2]=H;c[s+(f+4)>>2]=H|1;c[s+(p+ -36)>>2]=40;c[35612>>2]=c[36072>>2];c[d+4>>2]=27;c[e+0>>2]=c[36032>>2];c[e+4>>2]=c[36036>>2];c[e+8>>2]=c[36040>>2];c[e+12>>2]=c[36044>>2];c[36032>>2]=s;c[36036>>2]=p;c[36044>>2]=0;c[36040>>2]=e;f=d+28|0;c[f>>2]=7;if((d+32|0)>>>0<m>>>0){while(1){e=f+4|0;c[e>>2]=7;if((f+8|0)>>>0<m>>>0){f=e}else{break}}}if((d|0)!=(q|0)){d=d-q|0;e=q+(d+4)|0;c[e>>2]=c[e>>2]&-2;c[q+4>>2]=d|1;c[q+d>>2]=d;e=d>>>3;if(d>>>0<256){f=e<<1;d=35624+(f<<2)|0;g=c[8896]|0;e=1<<e;if((g&e|0)!=0){f=35624+(f+2<<2)|0;e=c[f>>2]|0;if(e>>>0<(c[35600>>2]|0)>>>0){Cb()}else{j=f;k=e}}else{c[8896]=g|e;j=35624+(f+2<<2)|0;k=d}c[j>>2]=q;c[k+12>>2]=q;c[q+8>>2]=k;c[q+12>>2]=d;break}e=d>>>8;if((e|0)!=0){if(d>>>0>16777215){e=31}else{G=(e+1048320|0)>>>16&8;H=e<<G;F=(H+520192|0)>>>16&4;H=H<<F;e=(H+245760|0)>>>16&2;e=14-(F|G|e)+(H<<e>>>15)|0;e=d>>>(e+7|0)&1|e<<1}}else{e=0}j=35888+(e<<2)|0;c[q+28>>2]=e;c[q+20>>2]=0;c[q+16>>2]=0;f=c[35588>>2]|0;g=1<<e;if((f&g|0)==0){c[35588>>2]=f|g;c[j>>2]=q;c[q+24>>2]=j;c[q+12>>2]=q;c[q+8>>2]=q;break}f=c[j>>2]|0;if((e|0)==31){e=0}else{e=25-(e>>>1)|0}j:do{if((c[f+4>>2]&-8|0)!=(d|0)){e=d<<e;while(1){j=f+(e>>>31<<2)+16|0;g=c[j>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(d|0)){h=g;break j}else{e=e<<1;f=g}}if(j>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[j>>2]=q;c[q+24>>2]=f;c[q+12>>2]=q;c[q+8>>2]=q;break g}}else{h=f}}while(0);f=h+8|0;e=c[f>>2]|0;d=c[35600>>2]|0;if(h>>>0<d>>>0){Cb()}if(e>>>0<d>>>0){Cb()}else{c[e+12>>2]=q;c[f>>2]=q;c[q+8>>2]=e;c[q+12>>2]=h;c[q+24>>2]=0;break}}}else{H=c[35600>>2]|0;if((H|0)==0|s>>>0<H>>>0){c[35600>>2]=s}c[36032>>2]=s;c[36036>>2]=p;c[36044>>2]=0;c[35620>>2]=c[9014];c[35616>>2]=-1;d=0;do{H=d<<1;G=35624+(H<<2)|0;c[35624+(H+3<<2)>>2]=G;c[35624+(H+2<<2)>>2]=G;d=d+1|0}while((d|0)!=32);d=s+8|0;if((d&7|0)==0){d=0}else{d=0-d&7}H=p+ -40-d|0;c[35608>>2]=s+d;c[35596>>2]=H;c[s+(d+4)>>2]=H|1;c[s+(p+ -36)>>2]=40;c[35612>>2]=c[36072>>2]}}while(0);d=c[35596>>2]|0;if(d>>>0>a>>>0){G=d-a|0;c[35596>>2]=G;H=c[35608>>2]|0;c[35608>>2]=H+a;c[H+(a+4)>>2]=G|1;c[H+4>>2]=a|3;H=H+8|0;i=b;return H|0}}c[(Tb()|0)>>2]=12;H=0;i=b;return H|0}function Bt(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=i;if((a|0)==0){i=b;return}q=a+ -8|0;r=c[35600>>2]|0;if(q>>>0<r>>>0){Cb()}o=c[a+ -4>>2]|0;n=o&3;if((n|0)==1){Cb()}j=o&-8;h=a+(j+ -8)|0;do{if((o&1|0)==0){u=c[q>>2]|0;if((n|0)==0){i=b;return}q=-8-u|0;o=a+q|0;n=u+j|0;if(o>>>0<r>>>0){Cb()}if((o|0)==(c[35604>>2]|0)){d=a+(j+ -4)|0;if((c[d>>2]&3|0)!=3){d=o;m=n;break}c[35592>>2]=n;c[d>>2]=c[d>>2]&-2;c[a+(q+4)>>2]=n|1;c[h>>2]=n;i=b;return}t=u>>>3;if(u>>>0<256){d=c[a+(q+8)>>2]|0;m=c[a+(q+12)>>2]|0;p=35624+(t<<1<<2)|0;if((d|0)!=(p|0)){if(d>>>0<r>>>0){Cb()}if((c[d+12>>2]|0)!=(o|0)){Cb()}}if((m|0)==(d|0)){c[8896]=c[8896]&~(1<<t);d=o;m=n;break}if((m|0)!=(p|0)){if(m>>>0<r>>>0){Cb()}p=m+8|0;if((c[p>>2]|0)==(o|0)){s=p}else{Cb()}}else{s=m+8|0}c[d+12>>2]=m;c[s>>2]=d;d=o;m=n;break}s=c[a+(q+24)>>2]|0;t=c[a+(q+12)>>2]|0;do{if((t|0)==(o|0)){u=a+(q+20)|0;t=c[u>>2]|0;if((t|0)==0){u=a+(q+16)|0;t=c[u>>2]|0;if((t|0)==0){p=0;break}}while(1){w=t+20|0;v=c[w>>2]|0;if((v|0)!=0){t=v;u=w;continue}v=t+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{t=w;u=v}}if(u>>>0<r>>>0){Cb()}else{c[u>>2]=0;p=t;break}}else{u=c[a+(q+8)>>2]|0;if(u>>>0<r>>>0){Cb()}r=u+12|0;if((c[r>>2]|0)!=(o|0)){Cb()}v=t+8|0;if((c[v>>2]|0)==(o|0)){c[r>>2]=t;c[v>>2]=u;p=t;break}else{Cb()}}}while(0);if((s|0)!=0){t=c[a+(q+28)>>2]|0;r=35888+(t<<2)|0;if((o|0)==(c[r>>2]|0)){c[r>>2]=p;if((p|0)==0){c[35588>>2]=c[35588>>2]&~(1<<t);d=o;m=n;break}}else{if(s>>>0<(c[35600>>2]|0)>>>0){Cb()}r=s+16|0;if((c[r>>2]|0)==(o|0)){c[r>>2]=p}else{c[s+20>>2]=p}if((p|0)==0){d=o;m=n;break}}if(p>>>0<(c[35600>>2]|0)>>>0){Cb()}c[p+24>>2]=s;r=c[a+(q+16)>>2]|0;do{if((r|0)!=0){if(r>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[p+16>>2]=r;c[r+24>>2]=p;break}}}while(0);q=c[a+(q+20)>>2]|0;if((q|0)!=0){if(q>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[p+20>>2]=q;c[q+24>>2]=p;d=o;m=n;break}}else{d=o;m=n}}else{d=o;m=n}}else{d=q;m=j}}while(0);if(!(d>>>0<h>>>0)){Cb()}n=a+(j+ -4)|0;o=c[n>>2]|0;if((o&1|0)==0){Cb()}if((o&2|0)==0){if((h|0)==(c[35608>>2]|0)){w=(c[35596>>2]|0)+m|0;c[35596>>2]=w;c[35608>>2]=d;c[d+4>>2]=w|1;if((d|0)!=(c[35604>>2]|0)){i=b;return}c[35604>>2]=0;c[35592>>2]=0;i=b;return}if((h|0)==(c[35604>>2]|0)){w=(c[35592>>2]|0)+m|0;c[35592>>2]=w;c[35604>>2]=d;c[d+4>>2]=w|1;c[d+w>>2]=w;i=b;return}m=(o&-8)+m|0;n=o>>>3;do{if(!(o>>>0<256)){l=c[a+(j+16)>>2]|0;q=c[a+(j|4)>>2]|0;do{if((q|0)==(h|0)){o=a+(j+12)|0;n=c[o>>2]|0;if((n|0)==0){o=a+(j+8)|0;n=c[o>>2]|0;if((n|0)==0){k=0;break}}while(1){p=n+20|0;q=c[p>>2]|0;if((q|0)!=0){n=q;o=p;continue}p=n+16|0;q=c[p>>2]|0;if((q|0)==0){break}else{n=q;o=p}}if(o>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[o>>2]=0;k=n;break}}else{o=c[a+j>>2]|0;if(o>>>0<(c[35600>>2]|0)>>>0){Cb()}p=o+12|0;if((c[p>>2]|0)!=(h|0)){Cb()}n=q+8|0;if((c[n>>2]|0)==(h|0)){c[p>>2]=q;c[n>>2]=o;k=q;break}else{Cb()}}}while(0);if((l|0)!=0){n=c[a+(j+20)>>2]|0;o=35888+(n<<2)|0;if((h|0)==(c[o>>2]|0)){c[o>>2]=k;if((k|0)==0){c[35588>>2]=c[35588>>2]&~(1<<n);break}}else{if(l>>>0<(c[35600>>2]|0)>>>0){Cb()}n=l+16|0;if((c[n>>2]|0)==(h|0)){c[n>>2]=k}else{c[l+20>>2]=k}if((k|0)==0){break}}if(k>>>0<(c[35600>>2]|0)>>>0){Cb()}c[k+24>>2]=l;h=c[a+(j+8)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[k+16>>2]=h;c[h+24>>2]=k;break}}}while(0);h=c[a+(j+12)>>2]|0;if((h|0)!=0){if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[k+20>>2]=h;c[h+24>>2]=k;break}}}}else{k=c[a+j>>2]|0;a=c[a+(j|4)>>2]|0;j=35624+(n<<1<<2)|0;if((k|0)!=(j|0)){if(k>>>0<(c[35600>>2]|0)>>>0){Cb()}if((c[k+12>>2]|0)!=(h|0)){Cb()}}if((a|0)==(k|0)){c[8896]=c[8896]&~(1<<n);break}if((a|0)!=(j|0)){if(a>>>0<(c[35600>>2]|0)>>>0){Cb()}j=a+8|0;if((c[j>>2]|0)==(h|0)){l=j}else{Cb()}}else{l=a+8|0}c[k+12>>2]=a;c[l>>2]=k}}while(0);c[d+4>>2]=m|1;c[d+m>>2]=m;if((d|0)==(c[35604>>2]|0)){c[35592>>2]=m;i=b;return}}else{c[n>>2]=o&-2;c[d+4>>2]=m|1;c[d+m>>2]=m}h=m>>>3;if(m>>>0<256){a=h<<1;e=35624+(a<<2)|0;j=c[8896]|0;h=1<<h;if((j&h|0)!=0){h=35624+(a+2<<2)|0;a=c[h>>2]|0;if(a>>>0<(c[35600>>2]|0)>>>0){Cb()}else{f=h;g=a}}else{c[8896]=j|h;f=35624+(a+2<<2)|0;g=e}c[f>>2]=d;c[g+12>>2]=d;c[d+8>>2]=g;c[d+12>>2]=e;i=b;return}f=m>>>8;if((f|0)!=0){if(m>>>0>16777215){f=31}else{v=(f+1048320|0)>>>16&8;w=f<<v;u=(w+520192|0)>>>16&4;w=w<<u;f=(w+245760|0)>>>16&2;f=14-(u|v|f)+(w<<f>>>15)|0;f=m>>>(f+7|0)&1|f<<1}}else{f=0}g=35888+(f<<2)|0;c[d+28>>2]=f;c[d+20>>2]=0;c[d+16>>2]=0;a=c[35588>>2]|0;h=1<<f;a:do{if((a&h|0)!=0){g=c[g>>2]|0;if((f|0)==31){f=0}else{f=25-(f>>>1)|0}b:do{if((c[g+4>>2]&-8|0)!=(m|0)){f=m<<f;a=g;while(1){h=a+(f>>>31<<2)+16|0;g=c[h>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(m|0)){e=g;break b}else{f=f<<1;a=g}}if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[h>>2]=d;c[d+24>>2]=a;c[d+12>>2]=d;c[d+8>>2]=d;break a}}else{e=g}}while(0);g=e+8|0;f=c[g>>2]|0;h=c[35600>>2]|0;if(e>>>0<h>>>0){Cb()}if(f>>>0<h>>>0){Cb()}else{c[f+12>>2]=d;c[g>>2]=d;c[d+8>>2]=f;c[d+12>>2]=e;c[d+24>>2]=0;break}}else{c[35588>>2]=a|h;c[g>>2]=d;c[d+24>>2]=g;c[d+12>>2]=d;c[d+8>>2]=d}}while(0);w=(c[35616>>2]|0)+ -1|0;c[35616>>2]=w;if((w|0)==0){d=36040|0}else{i=b;return}while(1){d=c[d>>2]|0;if((d|0)==0){break}else{d=d+8|0}}c[35616>>2]=-1;i=b;return}function Ct(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;do{if((a|0)!=0){if(b>>>0>4294967231){c[(Tb()|0)>>2]=12;e=0;break}if(b>>>0<11){e=16}else{e=b+11&-8}e=Dt(a+ -8|0,e)|0;if((e|0)!=0){e=e+8|0;break}e=At(b)|0;if((e|0)==0){e=0}else{f=c[a+ -4>>2]|0;f=(f&-8)-((f&3|0)==0?8:4)|0;$t(e|0,a|0,(f>>>0<b>>>0?f:b)|0)|0;Bt(a)}}else{e=At(b)|0}}while(0);i=d;return e|0}function Dt(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;e=a+4|0;g=c[e>>2]|0;j=g&-8;f=a+j|0;l=c[35600>>2]|0;if(a>>>0<l>>>0){Cb()}n=g&3;if(!((n|0)!=1&a>>>0<f>>>0)){Cb()}h=a+(j|4)|0;o=c[h>>2]|0;if((o&1|0)==0){Cb()}if((n|0)==0){if(b>>>0<256){q=0;i=d;return q|0}if(!(j>>>0<(b+4|0)>>>0)?!((j-b|0)>>>0>c[36064>>2]<<1>>>0):0){q=a;i=d;return q|0}q=0;i=d;return q|0}if(!(j>>>0<b>>>0)){f=j-b|0;if(!(f>>>0>15)){q=a;i=d;return q|0}c[e>>2]=g&1|b|2;c[a+(b+4)>>2]=f|3;c[h>>2]=c[h>>2]|1;Et(a+b|0,f);q=a;i=d;return q|0}if((f|0)==(c[35608>>2]|0)){f=(c[35596>>2]|0)+j|0;if(!(f>>>0>b>>>0)){q=0;i=d;return q|0}q=f-b|0;c[e>>2]=g&1|b|2;c[a+(b+4)>>2]=q|1;c[35608>>2]=a+b;c[35596>>2]=q;q=a;i=d;return q|0}if((f|0)==(c[35604>>2]|0)){h=(c[35592>>2]|0)+j|0;if(h>>>0<b>>>0){q=0;i=d;return q|0}f=h-b|0;if(f>>>0>15){c[e>>2]=g&1|b|2;c[a+(b+4)>>2]=f|1;c[a+h>>2]=f;q=a+(h+4)|0;c[q>>2]=c[q>>2]&-2;b=a+b|0}else{c[e>>2]=g&1|h|2;b=a+(h+4)|0;c[b>>2]=c[b>>2]|1;b=0;f=0}c[35592>>2]=f;c[35604>>2]=b;q=a;i=d;return q|0}if((o&2|0)!=0){q=0;i=d;return q|0}h=(o&-8)+j|0;if(h>>>0<b>>>0){q=0;i=d;return q|0}g=h-b|0;n=o>>>3;do{if(!(o>>>0<256)){m=c[a+(j+24)>>2]|0;o=c[a+(j+12)>>2]|0;do{if((o|0)==(f|0)){o=a+(j+20)|0;n=c[o>>2]|0;if((n|0)==0){o=a+(j+16)|0;n=c[o>>2]|0;if((n|0)==0){k=0;break}}while(1){q=n+20|0;p=c[q>>2]|0;if((p|0)!=0){n=p;o=q;continue}q=n+16|0;p=c[q>>2]|0;if((p|0)==0){break}else{n=p;o=q}}if(o>>>0<l>>>0){Cb()}else{c[o>>2]=0;k=n;break}}else{n=c[a+(j+8)>>2]|0;if(n>>>0<l>>>0){Cb()}p=n+12|0;if((c[p>>2]|0)!=(f|0)){Cb()}l=o+8|0;if((c[l>>2]|0)==(f|0)){c[p>>2]=o;c[l>>2]=n;k=o;break}else{Cb()}}}while(0);if((m|0)!=0){l=c[a+(j+28)>>2]|0;n=35888+(l<<2)|0;if((f|0)==(c[n>>2]|0)){c[n>>2]=k;if((k|0)==0){c[35588>>2]=c[35588>>2]&~(1<<l);break}}else{if(m>>>0<(c[35600>>2]|0)>>>0){Cb()}l=m+16|0;if((c[l>>2]|0)==(f|0)){c[l>>2]=k}else{c[m+20>>2]=k}if((k|0)==0){break}}if(k>>>0<(c[35600>>2]|0)>>>0){Cb()}c[k+24>>2]=m;f=c[a+(j+16)>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[k+16>>2]=f;c[f+24>>2]=k;break}}}while(0);f=c[a+(j+20)>>2]|0;if((f|0)!=0){if(f>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[k+20>>2]=f;c[f+24>>2]=k;break}}}}else{k=c[a+(j+8)>>2]|0;j=c[a+(j+12)>>2]|0;o=35624+(n<<1<<2)|0;if((k|0)!=(o|0)){if(k>>>0<l>>>0){Cb()}if((c[k+12>>2]|0)!=(f|0)){Cb()}}if((j|0)==(k|0)){c[8896]=c[8896]&~(1<<n);break}if((j|0)!=(o|0)){if(j>>>0<l>>>0){Cb()}l=j+8|0;if((c[l>>2]|0)==(f|0)){m=l}else{Cb()}}else{m=j+8|0}c[k+12>>2]=j;c[m>>2]=k}}while(0);if(g>>>0<16){c[e>>2]=h|c[e>>2]&1|2;q=a+(h|4)|0;c[q>>2]=c[q>>2]|1;q=a;i=d;return q|0}else{c[e>>2]=c[e>>2]&1|b|2;c[a+(b+4)>>2]=g|3;q=a+(h|4)|0;c[q>>2]=c[q>>2]|1;Et(a+b|0,g);q=a;i=d;return q|0}return 0}function Et(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;h=a+b|0;l=c[a+4>>2]|0;do{if((l&1|0)==0){p=c[a>>2]|0;if((l&3|0)==0){i=d;return}l=a+(0-p)|0;m=p+b|0;q=c[35600>>2]|0;if(l>>>0<q>>>0){Cb()}if((l|0)==(c[35604>>2]|0)){e=a+(b+4)|0;if((c[e>>2]&3|0)!=3){e=l;n=m;break}c[35592>>2]=m;c[e>>2]=c[e>>2]&-2;c[a+(4-p)>>2]=m|1;c[h>>2]=m;i=d;return}s=p>>>3;if(p>>>0<256){e=c[a+(8-p)>>2]|0;n=c[a+(12-p)>>2]|0;o=35624+(s<<1<<2)|0;if((e|0)!=(o|0)){if(e>>>0<q>>>0){Cb()}if((c[e+12>>2]|0)!=(l|0)){Cb()}}if((n|0)==(e|0)){c[8896]=c[8896]&~(1<<s);e=l;n=m;break}if((n|0)!=(o|0)){if(n>>>0<q>>>0){Cb()}o=n+8|0;if((c[o>>2]|0)==(l|0)){r=o}else{Cb()}}else{r=n+8|0}c[e+12>>2]=n;c[r>>2]=e;e=l;n=m;break}r=c[a+(24-p)>>2]|0;t=c[a+(12-p)>>2]|0;do{if((t|0)==(l|0)){u=16-p|0;t=a+(u+4)|0;s=c[t>>2]|0;if((s|0)==0){t=a+u|0;s=c[t>>2]|0;if((s|0)==0){o=0;break}}while(1){u=s+20|0;v=c[u>>2]|0;if((v|0)!=0){s=v;t=u;continue}v=s+16|0;u=c[v>>2]|0;if((u|0)==0){break}else{s=u;t=v}}if(t>>>0<q>>>0){Cb()}else{c[t>>2]=0;o=s;break}}else{s=c[a+(8-p)>>2]|0;if(s>>>0<q>>>0){Cb()}u=s+12|0;if((c[u>>2]|0)!=(l|0)){Cb()}q=t+8|0;if((c[q>>2]|0)==(l|0)){c[u>>2]=t;c[q>>2]=s;o=t;break}else{Cb()}}}while(0);if((r|0)!=0){q=c[a+(28-p)>>2]|0;s=35888+(q<<2)|0;if((l|0)==(c[s>>2]|0)){c[s>>2]=o;if((o|0)==0){c[35588>>2]=c[35588>>2]&~(1<<q);e=l;n=m;break}}else{if(r>>>0<(c[35600>>2]|0)>>>0){Cb()}q=r+16|0;if((c[q>>2]|0)==(l|0)){c[q>>2]=o}else{c[r+20>>2]=o}if((o|0)==0){e=l;n=m;break}}if(o>>>0<(c[35600>>2]|0)>>>0){Cb()}c[o+24>>2]=r;p=16-p|0;q=c[a+p>>2]|0;do{if((q|0)!=0){if(q>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[o+16>>2]=q;c[q+24>>2]=o;break}}}while(0);p=c[a+(p+4)>>2]|0;if((p|0)!=0){if(p>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[o+20>>2]=p;c[p+24>>2]=o;e=l;n=m;break}}else{e=l;n=m}}else{e=l;n=m}}else{e=a;n=b}}while(0);l=c[35600>>2]|0;if(h>>>0<l>>>0){Cb()}m=a+(b+4)|0;o=c[m>>2]|0;if((o&2|0)==0){if((h|0)==(c[35608>>2]|0)){v=(c[35596>>2]|0)+n|0;c[35596>>2]=v;c[35608>>2]=e;c[e+4>>2]=v|1;if((e|0)!=(c[35604>>2]|0)){i=d;return}c[35604>>2]=0;c[35592>>2]=0;i=d;return}if((h|0)==(c[35604>>2]|0)){v=(c[35592>>2]|0)+n|0;c[35592>>2]=v;c[35604>>2]=e;c[e+4>>2]=v|1;c[e+v>>2]=v;i=d;return}n=(o&-8)+n|0;m=o>>>3;do{if(!(o>>>0<256)){k=c[a+(b+24)>>2]|0;m=c[a+(b+12)>>2]|0;do{if((m|0)==(h|0)){o=a+(b+20)|0;m=c[o>>2]|0;if((m|0)==0){o=a+(b+16)|0;m=c[o>>2]|0;if((m|0)==0){j=0;break}}while(1){q=m+20|0;p=c[q>>2]|0;if((p|0)!=0){m=p;o=q;continue}p=m+16|0;q=c[p>>2]|0;if((q|0)==0){break}else{m=q;o=p}}if(o>>>0<l>>>0){Cb()}else{c[o>>2]=0;j=m;break}}else{o=c[a+(b+8)>>2]|0;if(o>>>0<l>>>0){Cb()}l=o+12|0;if((c[l>>2]|0)!=(h|0)){Cb()}p=m+8|0;if((c[p>>2]|0)==(h|0)){c[l>>2]=m;c[p>>2]=o;j=m;break}else{Cb()}}}while(0);if((k|0)!=0){l=c[a+(b+28)>>2]|0;m=35888+(l<<2)|0;if((h|0)==(c[m>>2]|0)){c[m>>2]=j;if((j|0)==0){c[35588>>2]=c[35588>>2]&~(1<<l);break}}else{if(k>>>0<(c[35600>>2]|0)>>>0){Cb()}l=k+16|0;if((c[l>>2]|0)==(h|0)){c[l>>2]=j}else{c[k+20>>2]=j}if((j|0)==0){break}}if(j>>>0<(c[35600>>2]|0)>>>0){Cb()}c[j+24>>2]=k;h=c[a+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[j+16>>2]=h;c[h+24>>2]=j;break}}}while(0);h=c[a+(b+20)>>2]|0;if((h|0)!=0){if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}else{c[j+20>>2]=h;c[h+24>>2]=j;break}}}}else{j=c[a+(b+8)>>2]|0;a=c[a+(b+12)>>2]|0;b=35624+(m<<1<<2)|0;if((j|0)!=(b|0)){if(j>>>0<l>>>0){Cb()}if((c[j+12>>2]|0)!=(h|0)){Cb()}}if((a|0)==(j|0)){c[8896]=c[8896]&~(1<<m);break}if((a|0)!=(b|0)){if(a>>>0<l>>>0){Cb()}b=a+8|0;if((c[b>>2]|0)==(h|0)){k=b}else{Cb()}}else{k=a+8|0}c[j+12>>2]=a;c[k>>2]=j}}while(0);c[e+4>>2]=n|1;c[e+n>>2]=n;if((e|0)==(c[35604>>2]|0)){c[35592>>2]=n;i=d;return}}else{c[m>>2]=o&-2;c[e+4>>2]=n|1;c[e+n>>2]=n}a=n>>>3;if(n>>>0<256){b=a<<1;h=35624+(b<<2)|0;j=c[8896]|0;a=1<<a;if((j&a|0)!=0){b=35624+(b+2<<2)|0;a=c[b>>2]|0;if(a>>>0<(c[35600>>2]|0)>>>0){Cb()}else{g=b;f=a}}else{c[8896]=j|a;g=35624+(b+2<<2)|0;f=h}c[g>>2]=e;c[f+12>>2]=e;c[e+8>>2]=f;c[e+12>>2]=h;i=d;return}f=n>>>8;if((f|0)!=0){if(n>>>0>16777215){f=31}else{u=(f+1048320|0)>>>16&8;v=f<<u;t=(v+520192|0)>>>16&4;v=v<<t;f=(v+245760|0)>>>16&2;f=14-(t|u|f)+(v<<f>>>15)|0;f=n>>>(f+7|0)&1|f<<1}}else{f=0}a=35888+(f<<2)|0;c[e+28>>2]=f;c[e+20>>2]=0;c[e+16>>2]=0;h=c[35588>>2]|0;g=1<<f;if((h&g|0)==0){c[35588>>2]=h|g;c[a>>2]=e;c[e+24>>2]=a;c[e+12>>2]=e;c[e+8>>2]=e;i=d;return}g=c[a>>2]|0;if((f|0)==31){f=0}else{f=25-(f>>>1)|0}a:do{if((c[g+4>>2]&-8|0)!=(n|0)){f=n<<f;a=g;while(1){h=a+(f>>>31<<2)+16|0;g=c[h>>2]|0;if((g|0)==0){break}if((c[g+4>>2]&-8|0)==(n|0)){break a}else{f=f<<1;a=g}}if(h>>>0<(c[35600>>2]|0)>>>0){Cb()}c[h>>2]=e;c[e+24>>2]=a;c[e+12>>2]=e;c[e+8>>2]=e;i=d;return}}while(0);f=g+8|0;a=c[f>>2]|0;h=c[35600>>2]|0;if(g>>>0<h>>>0){Cb()}if(a>>>0<h>>>0){Cb()}c[a+12>>2]=e;c[f>>2]=e;c[e+8>>2]=a;c[e+12>>2]=g;c[e+24>>2]=0;i=d;return}function Ft(a){a=a|0;var b=0,d=0;b=i;a=(a|0)==0?1:a;while(1){d=At(a)|0;if((d|0)!=0){a=6;break}d=c[9020]|0;c[9020]=d+0;if((d|0)==0){a=5;break}ec[d&31]()}if((a|0)==5){d=ob(4)|0;c[d>>2]=36096;Wb(d|0,36144,74)}else if((a|0)==6){i=b;return d|0}return 0}function Gt(a){a=a|0;var b=0;b=i;if((a|0)!=0){Bt(a)}i=b;return}function Ht(a){a=a|0;var b=0;b=i;Ma(a|0);Gt(a);i=b;return}function It(a){a=a|0;var b=0;b=i;Ma(a|0);i=b;return}function Jt(a){a=a|0;return 36112}function Kt(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0.0,J=0,K=0.0,L=0.0,M=0.0,N=0.0;g=i;i=i+512|0;k=g;if((e|0)==2){e=53;h=-1074}else if((e|0)==0){e=24;h=-149}else if((e|0)==1){e=53;h=-1074}else{L=0.0;i=g;return+L}n=b+4|0;o=b+100|0;do{j=c[n>>2]|0;if(j>>>0<(c[o>>2]|0)>>>0){c[n>>2]=j+1;z=d[j]|0}else{z=Nt(b)|0}}while((Eb(z|0)|0)!=0);do{if((z|0)==43|(z|0)==45){j=1-(((z|0)==45)<<1)|0;m=c[n>>2]|0;if(m>>>0<(c[o>>2]|0)>>>0){c[n>>2]=m+1;z=d[m]|0;break}else{z=Nt(b)|0;break}}else{j=1}}while(0);m=0;do{if((z|32|0)!=(a[36160+m|0]|0)){break}do{if(m>>>0<7){p=c[n>>2]|0;if(p>>>0<(c[o>>2]|0)>>>0){c[n>>2]=p+1;z=d[p]|0;break}else{z=Nt(b)|0;break}}}while(0);m=m+1|0}while(m>>>0<8);do{if((m|0)==3){q=23}else if((m|0)!=8){p=(f|0)==0;if(!(m>>>0<4|p)){if((m|0)==8){break}else{q=23;break}}a:do{if((m|0)==0){m=0;do{if((z|32|0)!=(a[36176+m|0]|0)){break a}do{if(m>>>0<2){s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0;break}else{z=Nt(b)|0;break}}}while(0);m=m+1|0}while(m>>>0<3)}}while(0);if((m|0)==3){e=c[n>>2]|0;if(e>>>0<(c[o>>2]|0)>>>0){c[n>>2]=e+1;e=d[e]|0}else{e=Nt(b)|0}if((e|0)==40){e=1}else{if((c[o>>2]|0)==0){L=u;i=g;return+L}c[n>>2]=(c[n>>2]|0)+ -1;L=u;i=g;return+L}while(1){h=c[n>>2]|0;if(h>>>0<(c[o>>2]|0)>>>0){c[n>>2]=h+1;h=d[h]|0}else{h=Nt(b)|0}if(!((h+ -48|0)>>>0<10|(h+ -65|0)>>>0<26)?!((h+ -97|0)>>>0<26|(h|0)==95):0){break}e=e+1|0}if((h|0)==41){L=u;i=g;return+L}h=(c[o>>2]|0)==0;if(!h){c[n>>2]=(c[n>>2]|0)+ -1}if(p){c[(Tb()|0)>>2]=22;Mt(b,0);L=0.0;i=g;return+L}if((e|0)==0|h){L=u;i=g;return+L}while(1){e=e+ -1|0;c[n>>2]=(c[n>>2]|0)+ -1;if((e|0)==0){r=u;break}}i=g;return+r}else if((m|0)==0){do{if((z|0)==48){m=c[n>>2]|0;if(m>>>0<(c[o>>2]|0)>>>0){c[n>>2]=m+1;m=d[m]|0}else{m=Nt(b)|0}if((m|32|0)!=120){if((c[o>>2]|0)==0){z=48;break}c[n>>2]=(c[n>>2]|0)+ -1;z=48;break}k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0;y=0}else{A=Nt(b)|0;y=0}while(1){if((A|0)==46){q=70;break}else if((A|0)!=48){k=0;m=0;s=0;t=0;x=0;z=0;I=1.0;w=0;r=0.0;break}k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0;y=1;continue}else{A=Nt(b)|0;y=1;continue}}b:do{if((q|0)==70){k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0}else{A=Nt(b)|0}if((A|0)==48){s=-1;t=-1;while(1){k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;A=d[k]|0}else{A=Nt(b)|0}if((A|0)!=48){k=0;m=0;y=1;x=1;z=0;I=1.0;w=0;r=0.0;break b}J=Yt(s|0,t|0,-1,-1)|0;s=J;t=F}}else{k=0;m=0;s=0;t=0;x=1;z=0;I=1.0;w=0;r=0.0}}}while(0);c:while(1){B=A+ -48|0;do{if(!(B>>>0<10)){C=A|32;D=(A|0)==46;if(!((C+ -97|0)>>>0<6|D)){break c}if(D){if((x|0)==0){s=m;t=k;x=1;break}else{A=46;break c}}else{B=(A|0)>57?C+ -87|0:B;q=84;break}}else{q=84}}while(0);if((q|0)==84){q=0;do{if(!((k|0)<0|(k|0)==0&m>>>0<8)){if((k|0)<0|(k|0)==0&m>>>0<14){L=I*.0625;K=L;r=r+L*+(B|0);break}if((B|0)!=0&(z|0)==0){z=1;K=I;r=r+I*.5}else{K=I}}else{K=I;w=B+(w<<4)|0}}while(0);m=Yt(m|0,k|0,1,0)|0;k=F;y=1;I=K}A=c[n>>2]|0;if(A>>>0<(c[o>>2]|0)>>>0){c[n>>2]=A+1;A=d[A]|0;continue}else{A=Nt(b)|0;continue}}if((y|0)==0){e=(c[o>>2]|0)==0;if(!e){c[n>>2]=(c[n>>2]|0)+ -1}if(!p){if(!e?(l=c[n>>2]|0,c[n>>2]=l+ -1,(x|0)!=0):0){c[n>>2]=l+ -2}}else{Mt(b,0)}L=+(j|0)*0.0;i=g;return+L}q=(x|0)==0;l=q?m:s;q=q?k:t;if((k|0)<0|(k|0)==0&m>>>0<8){do{w=w<<4;m=Yt(m|0,k|0,1,0)|0;k=F}while((k|0)<0|(k|0)==0&m>>>0<8)}do{if((A|32|0)==112){m=Lt(b,f)|0;k=F;if((m|0)==0&(k|0)==-2147483648){if(p){Mt(b,0);L=0.0;i=g;return+L}else{if((c[o>>2]|0)==0){m=0;k=0;break}c[n>>2]=(c[n>>2]|0)+ -1;m=0;k=0;break}}}else{if((c[o>>2]|0)==0){m=0;k=0}else{c[n>>2]=(c[n>>2]|0)+ -1;m=0;k=0}}}while(0);l=cu(l|0,q|0,2)|0;l=Yt(l|0,F|0,-32,-1)|0;k=Yt(l|0,F|0,m|0,k|0)|0;l=F;if((w|0)==0){L=+(j|0)*0.0;i=g;return+L}if((l|0)>0|(l|0)==0&k>>>0>(0-h|0)>>>0){c[(Tb()|0)>>2]=34;L=+(j|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+L}J=h+ -106|0;H=((J|0)<0)<<31>>31;if((l|0)<(H|0)|(l|0)==(H|0)&k>>>0<J>>>0){c[(Tb()|0)>>2]=34;L=+(j|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+L}if((w|0)>-1){do{w=w<<1;if(!(r>=.5)){I=r}else{I=r+-1.0;w=w|1}r=r+I;k=Yt(k|0,l|0,-1,-1)|0;l=F}while((w|0)>-1)}h=Zt(32,0,h|0,((h|0)<0)<<31>>31|0)|0;h=Yt(k|0,l|0,h|0,F|0)|0;J=F;if(0>(J|0)|0==(J|0)&e>>>0>h>>>0){e=(h|0)<0?0:h}if((e|0)<53){I=+(j|0);K=+Ub(+(+Ot(1.0,84-e|0)),+I);if((e|0)<32&r!=0.0){J=w&1;w=(J^1)+w|0;r=(J|0)==0?0.0:r}}else{I=+(j|0);K=0.0}r=I*r+(K+I*+(w>>>0))-K;if(!(r!=0.0)){c[(Tb()|0)>>2]=34}L=+Pt(r,k);i=g;return+L}}while(0);m=h+e|0;l=0-m|0;A=0;while(1){if((z|0)==46){q=139;break}else if((z|0)!=48){D=0;B=0;y=0;break}s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0;A=1;continue}else{z=Nt(b)|0;A=1;continue}}d:do{if((q|0)==139){s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0}else{z=Nt(b)|0}if((z|0)==48){D=-1;B=-1;while(1){s=c[n>>2]|0;if(s>>>0<(c[o>>2]|0)>>>0){c[n>>2]=s+1;z=d[s]|0}else{z=Nt(b)|0}if((z|0)!=48){A=1;y=1;break d}J=Yt(D|0,B|0,-1,-1)|0;D=J;B=F}}else{D=0;B=0;y=1}}}while(0);c[k>>2]=0;G=z+ -48|0;H=(z|0)==46;e:do{if(G>>>0<10|H){s=k+496|0;E=0;C=0;x=0;w=0;t=0;while(1){do{if(H){if((y|0)==0){D=E;B=C;y=1}else{break e}}else{H=Yt(E|0,C|0,1,0)|0;C=F;J=(z|0)!=48;if((w|0)>=125){if(!J){E=H;break}c[s>>2]=c[s>>2]|1;E=H;break}A=k+(w<<2)|0;if((x|0)!=0){G=z+ -48+((c[A>>2]|0)*10|0)|0}c[A>>2]=G;x=x+1|0;z=(x|0)==9;E=H;A=1;x=z?0:x;w=(z&1)+w|0;t=J?H:t}}while(0);z=c[n>>2]|0;if(z>>>0<(c[o>>2]|0)>>>0){c[n>>2]=z+1;z=d[z]|0}else{z=Nt(b)|0}G=z+ -48|0;H=(z|0)==46;if(!(G>>>0<10|H)){q=162;break}}}else{E=0;C=0;x=0;w=0;t=0;q=162}}while(0);if((q|0)==162){q=(y|0)==0;D=q?E:D;B=q?C:B}q=(A|0)!=0;if(q?(z|32|0)==101:0){s=Lt(b,f)|0;f=F;do{if((s|0)==0&(f|0)==-2147483648){if(p){Mt(b,0);L=0.0;i=g;return+L}else{if((c[o>>2]|0)==0){s=0;f=0;break}c[n>>2]=(c[n>>2]|0)+ -1;s=0;f=0;break}}}while(0);D=Yt(s|0,f|0,D|0,B|0)|0;B=F}else{if((z|0)>-1?(c[o>>2]|0)!=0:0){c[n>>2]=(c[n>>2]|0)+ -1}}if(!q){c[(Tb()|0)>>2]=22;Mt(b,0);L=0.0;i=g;return+L}b=c[k>>2]|0;if((b|0)==0){L=+(j|0)*0.0;i=g;return+L}do{if((D|0)==(E|0)&(B|0)==(C|0)&((C|0)<0|(C|0)==0&E>>>0<10)){if(!(e>>>0>30)?(b>>>e|0)!=0:0){break}L=+(j|0)*+(b>>>0);i=g;return+L}}while(0);J=(h|0)/-2|0;H=((J|0)<0)<<31>>31;if((B|0)>(H|0)|(B|0)==(H|0)&D>>>0>J>>>0){c[(Tb()|0)>>2]=34;L=+(j|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+L}J=h+ -106|0;H=((J|0)<0)<<31>>31;if((B|0)<(H|0)|(B|0)==(H|0)&D>>>0<J>>>0){c[(Tb()|0)>>2]=34;L=+(j|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+L}if((x|0)!=0){if((x|0)<9){b=k+(w<<2)|0;n=c[b>>2]|0;do{n=n*10|0;x=x+1|0}while((x|0)!=9);c[b>>2]=n}w=w+1|0}do{if((t|0)<9?(t|0)<=(D|0)&(D|0)<18:0){if((D|0)==9){L=+(j|0)*+((c[k>>2]|0)>>>0);i=g;return+L}if((D|0)<9){L=+(j|0)*+((c[k>>2]|0)>>>0)/+(c[36192+(8-D<<2)>>2]|0);i=g;return+L}b=e+27+(ba(D,-3)|0)|0;n=c[k>>2]|0;if((b|0)<=30?(n>>>b|0)!=0:0){break}L=+(j|0)*+(n>>>0)*+(c[36192+(D+ -10<<2)>>2]|0);i=g;return+L}}while(0);b=(D|0)%9|0;if((b|0)==0){n=0;o=0;b=D}else{b=(D|0)>-1?b:b+9|0;f=c[36192+(8-b<<2)>>2]|0;if((w|0)!=0){o=1e9/(f|0)|0;n=0;s=0;q=0;while(1){H=k+(q<<2)|0;p=c[H>>2]|0;J=((p>>>0)/(f>>>0)|0)+s|0;c[H>>2]=J;s=ba((p>>>0)%(f>>>0)|0,o)|0;p=q+1|0;if((q|0)==(n|0)&(J|0)==0){n=p&127;D=D+ -9|0}if((p|0)==(w|0)){break}else{q=p}}if((s|0)!=0){c[k+(w<<2)>>2]=s;w=w+1|0}}else{n=0;w=0}o=0;b=9-b+D|0}f:while(1){f=k+(n<<2)|0;if((b|0)<18){do{q=0;f=w+127|0;while(1){f=f&127;p=k+(f<<2)|0;s=cu(c[p>>2]|0,0,29)|0;s=Yt(s|0,F|0,q|0,0)|0;q=F;if(q>>>0>0|(q|0)==0&s>>>0>1e9){J=ku(s|0,q|0,1e9,0)|0;s=lu(s|0,q|0,1e9,0)|0;q=J}else{q=0}c[p>>2]=s;p=(f|0)==(n|0);if(!((f|0)!=(w+127&127|0)|p)){w=(s|0)==0?f:w}if(p){break}else{f=f+ -1|0}}o=o+ -29|0}while((q|0)==0)}else{if((b|0)!=18){break}do{if(!((c[f>>2]|0)>>>0<9007199)){b=18;break f}q=0;p=w+127|0;while(1){p=p&127;s=k+(p<<2)|0;t=cu(c[s>>2]|0,0,29)|0;t=Yt(t|0,F|0,q|0,0)|0;q=F;if(q>>>0>0|(q|0)==0&t>>>0>1e9){J=ku(t|0,q|0,1e9,0)|0;t=lu(t|0,q|0,1e9,0)|0;q=J}else{q=0}c[s>>2]=t;s=(p|0)==(n|0);if(!((p|0)!=(w+127&127|0)|s)){w=(t|0)==0?p:w}if(s){break}else{p=p+ -1|0}}o=o+ -29|0}while((q|0)==0)}n=n+127&127;if((n|0)==(w|0)){J=w+127&127;w=k+((w+126&127)<<2)|0;c[w>>2]=c[w>>2]|c[k+(J<<2)>>2];w=J}c[k+(n<<2)>>2]=q;b=b+9|0}g:while(1){f=w+1&127;p=k+((w+127&127)<<2)|0;while(1){s=(b|0)==18;q=(b|0)>27?9:1;while(1){t=0;while(1){x=t+n&127;if((x|0)==(w|0)){t=2;break}z=c[k+(x<<2)>>2]|0;x=c[36184+(t<<2)>>2]|0;if(z>>>0<x>>>0){t=2;break}y=t+1|0;if(z>>>0>x>>>0){break}if((y|0)<2){t=y}else{t=y;break}}if((t|0)==2&s){break g}o=q+o|0;if((n|0)==(w|0)){n=w}else{break}}x=(1<<q)+ -1|0;y=1e9>>>q;s=n;t=0;do{H=k+(n<<2)|0;J=c[H>>2]|0;z=(J>>>q)+t|0;c[H>>2]=z;t=ba(J&x,y)|0;z=(n|0)==(s|0)&(z|0)==0;n=n+1&127;b=z?b+ -9|0:b;s=z?n:s}while((n|0)!=(w|0));if((t|0)==0){n=s;continue}if((f|0)!=(s|0)){break}c[p>>2]=c[p>>2]|1;n=s}c[k+(w<<2)>>2]=t;n=s;w=f}b=n&127;if((b|0)==(w|0)){c[k+(f+ -1<<2)>>2]=0;w=f}I=+((c[k+(b<<2)>>2]|0)>>>0);b=n+1&127;if((b|0)==(w|0)){w=w+1&127;c[k+(w+ -1<<2)>>2]=0}r=+(j|0);K=r*(I*1.0e9+ +((c[k+(b<<2)>>2]|0)>>>0));j=o+53|0;h=j-h|0;if((h|0)<(e|0)){e=(h|0)<0?0:h;b=1}else{b=0}if((e|0)<53){N=+Ub(+(+Ot(1.0,105-e|0)),+K);M=+lb(+K,+(+Ot(1.0,53-e|0)));I=N;L=M;K=N+(K-M)}else{I=0.0;L=0.0}f=n+2&127;if((f|0)!=(w|0)){k=c[k+(f<<2)>>2]|0;do{if(!(k>>>0<5e8)){if(k>>>0>5e8){L=r*.75+L;break}if((n+3&127|0)==(w|0)){L=r*.5+L;break}else{L=r*.75+L;break}}else{if((k|0)==0?(n+3&127|0)==(w|0):0){break}L=r*.25+L}}while(0);if((53-e|0)>1?!(+lb(+L,1.0)!=0.0):0){L=L+1.0}}r=K+L-I;do{if((j&2147483647|0)>(-2-m|0)){if(+Q(+r)>=9007199254740992.0){b=(b|0)!=0&(e|0)==(h|0)?0:b;o=o+1|0;r=r*.5}if((o+50|0)<=(l|0)?!((b|0)!=0&L!=0.0):0){break}c[(Tb()|0)>>2]=34}}while(0);N=+Pt(r,o);i=g;return+N}else{if((c[o>>2]|0)!=0){c[n>>2]=(c[n>>2]|0)+ -1}c[(Tb()|0)>>2]=22;Mt(b,0);N=0.0;i=g;return+N}}}while(0);if((q|0)==23){e=(c[o>>2]|0)==0;if(!e){c[n>>2]=(c[n>>2]|0)+ -1}if(!(m>>>0<4|(f|0)==0|e)){do{c[n>>2]=(c[n>>2]|0)+ -1;m=m+ -1|0}while(m>>>0>3)}}N=+(j|0)*v;i=g;return+N}function Lt(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=a+4|0;h=c[f>>2]|0;g=a+100|0;if(h>>>0<(c[g>>2]|0)>>>0){c[f>>2]=h+1;k=d[h]|0}else{k=Nt(a)|0}if((k|0)==43|(k|0)==45){h=(k|0)==45|0;j=c[f>>2]|0;if(j>>>0<(c[g>>2]|0)>>>0){c[f>>2]=j+1;k=d[j]|0}else{k=Nt(a)|0}if(!((k+ -48|0)>>>0<10|(b|0)==0)?(c[g>>2]|0)!=0:0){c[f>>2]=(c[f>>2]|0)+ -1}}else{h=0}if((k+ -48|0)>>>0>9){if((c[g>>2]|0)==0){j=-2147483648;k=0;F=j;i=e;return k|0}c[f>>2]=(c[f>>2]|0)+ -1;j=-2147483648;k=0;F=j;i=e;return k|0}else{b=0}while(1){b=k+ -48+b|0;j=c[f>>2]|0;if(j>>>0<(c[g>>2]|0)>>>0){c[f>>2]=j+1;k=d[j]|0}else{k=Nt(a)|0}if(!((k+ -48|0)>>>0<10&(b|0)<214748364)){break}b=b*10|0}j=((b|0)<0)<<31>>31;if((k+ -48|0)>>>0<10){do{j=ju(b|0,j|0,10,0)|0;b=F;k=Yt(k|0,((k|0)<0)<<31>>31|0,-48,-1)|0;b=Yt(k|0,F|0,j|0,b|0)|0;j=F;k=c[f>>2]|0;if(k>>>0<(c[g>>2]|0)>>>0){c[f>>2]=k+1;k=d[k]|0}else{k=Nt(a)|0}}while((k+ -48|0)>>>0<10&((j|0)<21474836|(j|0)==21474836&b>>>0<2061584302))}if((k+ -48|0)>>>0<10){do{k=c[f>>2]|0;if(k>>>0<(c[g>>2]|0)>>>0){c[f>>2]=k+1;k=d[k]|0}else{k=Nt(a)|0}}while((k+ -48|0)>>>0<10)}if((c[g>>2]|0)!=0){c[f>>2]=(c[f>>2]|0)+ -1}a=(h|0)!=0;f=Zt(0,0,b|0,j|0)|0;g=a?F:j;k=a?f:b;F=g;i=e;return k|0}function Mt(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a+104>>2]=b;f=c[a+8>>2]|0;e=c[a+4>>2]|0;g=f-e|0;c[a+108>>2]=g;if((b|0)!=0&(g|0)>(b|0)){c[a+100>>2]=e+b;i=d;return}else{c[a+100>>2]=f;i=d;return}}function Nt(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;f=i;k=b+104|0;j=c[k>>2]|0;if(!((j|0)!=0?(c[b+108>>2]|0)>=(j|0):0)){l=3}if((l|0)==3?(e=Rt(b)|0,(e|0)>=0):0){k=c[k>>2]|0;j=c[b+8>>2]|0;if((k|0)!=0?(g=c[b+4>>2]|0,h=k-(c[b+108>>2]|0)+ -1|0,(j-g|0)>(h|0)):0){c[b+100>>2]=g+h}else{c[b+100>>2]=j}g=c[b+4>>2]|0;if((j|0)!=0){l=b+108|0;c[l>>2]=j+1-g+(c[l>>2]|0)}b=g+ -1|0;if((d[b]|0|0)==(e|0)){l=e;i=f;return l|0}a[b]=e;l=e;i=f;return l|0}c[b+100>>2]=0;l=-1;i=f;return l|0}function Ot(a,b){a=+a;b=b|0;var d=0,e=0;d=i;if((b|0)>1023){a=a*8.98846567431158e+307;e=b+ -1023|0;if((e|0)>1023){b=b+ -2046|0;b=(b|0)>1023?1023:b;a=a*8.98846567431158e+307}else{b=e}}else{if((b|0)<-1022){a=a*2.2250738585072014e-308;e=b+1022|0;if((e|0)<-1022){b=b+2044|0;b=(b|0)<-1022?-1022:b;a=a*2.2250738585072014e-308}else{b=e}}}b=cu(b+1023|0,0,52)|0;e=F;c[k>>2]=b;c[k+4>>2]=e;a=a*+h[k>>3];i=d;return+a}function Pt(a,b){a=+a;b=b|0;var c=0;c=i;a=+Ot(a,b);i=c;return+a}function Qt(b){b=b|0;var d=0,e=0,f=0;e=i;f=b+74|0;d=a[f]|0;a[f]=d+255|d;f=b+20|0;d=b+44|0;if((c[f>>2]|0)>>>0>(c[d>>2]|0)>>>0){$b[c[b+36>>2]&63](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[f>>2]=0;f=c[b>>2]|0;if((f&20|0)==0){f=c[d>>2]|0;c[b+8>>2]=f;c[b+4>>2]=f;f=0;i=e;return f|0}if((f&4|0)==0){f=-1;i=e;return f|0}c[b>>2]=f|32;f=-1;i=e;return f|0}function Rt(a){a=a|0;var b=0,e=0;b=i;i=i+16|0;e=b;if((c[a+8>>2]|0)==0?(Qt(a)|0)!=0:0){a=-1}else{if(($b[c[a+32>>2]&63](a,e,1)|0)==1){a=d[e]|0}else{a=-1}}i=b;return a|0}function St(a,b){a=a|0;b=b|0;var d=0,e=0,f=0.0,g=0,h=0;d=i;i=i+112|0;e=d;h=e+0|0;g=h+112|0;do{c[h>>2]=0;h=h+4|0}while((h|0)<(g|0));g=e+4|0;c[g>>2]=a;h=e+8|0;c[h>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;Mt(e,0);f=+Kt(e,1,1);e=(c[g>>2]|0)-(c[h>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){i=d;return+f}if((e|0)!=0){a=a+e|0}c[b>>2]=a;i=d;return+f}function Tt(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=i;a:do{if((d|0)==0){b=0}else{while(1){g=a[b]|0;f=a[c]|0;if(!(g<<24>>24==f<<24>>24)){break}d=d+ -1|0;if((d|0)==0){b=0;break a}else{b=b+1|0;c=c+1|0}}b=(g&255)-(f&255)|0}}while(0);i=e;return b|0}function Ut(){c[9038]=p}function Vt(a){a=a|0;var b=0;b=(ba(c[a>>2]|0,31010991)|0)+1735287159&2147483647;c[a>>2]=b;return b|0}function Wt(){return Vt(o)|0}function Xt(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function Yt(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return(F=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function Zt(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=b-d-(c>>>0>a>>>0|0)>>>0;return(F=b,a-c>>>0|0)|0}function _t(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=0;return b>>>c-32|0}function $t(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return Ca(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function au(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{$t(b,c,d)|0}return b|0}function bu(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;i=b&3;h=d|d<<8|d<<16|d<<24;g=f&~3;if(i){i=b+4-i|0;while((b|0)<(i|0)){a[b]=d;b=b+1|0}}while((b|0)<(g|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function cu(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}F=a<<c-32;return 0}function du(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=(b|0)<0?-1:0;return b>>c-32|0}function eu(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function fu(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function gu(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;d=b&65535;c=ba(d,f)|0;e=a>>>16;d=(c>>>16)+(ba(d,e)|0)|0;b=b>>>16;a=ba(b,f)|0;return(F=(d>>>16)+(ba(b,e)|0)+(((d&65535)+a|0)>>>16)|0,d+a<<16|c&65535|0)|0}function hu(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;a=Zt(e^a,f^b,e,f)|0;b=F;e=g^e;f=h^f;g=Zt((mu(a,b,Zt(g^c,h^d,g,h)|0,F,0)|0)^e,F^f,e,f)|0;return g|0}function iu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;i=i+8|0;f=g|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;a=Zt(h^a,j^b,h,j)|0;b=F;mu(a,b,Zt(k^d,l^e,k,l)|0,F,f)|0;k=Zt(c[f>>2]^h,c[f+4>>2]^j,h,j)|0;j=F;i=g;return(F=j,k)|0}function ju(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;a=gu(e,f)|0;c=F;return(F=(ba(b,f)|0)+(ba(d,e)|0)+c|c&0,a|0|0)|0}function ku(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;a=mu(a,b,c,d,0)|0;return a|0}function lu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;g=i;i=i+8|0;f=g|0;mu(a,b,d,e,f)|0;i=g;return(F=c[f+4>>2]|0,c[f>>2]|0)|0}function mu(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=a;j=b;i=j;k=d;g=e;l=g;if((i|0)==0){d=(f|0)!=0;if((l|0)==0){if(d){c[f>>2]=(h>>>0)%(k>>>0);c[f+4>>2]=0}l=0;m=(h>>>0)/(k>>>0)>>>0;return(F=l,m)|0}else{if(!d){l=0;m=0;return(F=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;l=0;m=0;return(F=l,m)|0}}m=(l|0)==0;do{if((k|0)!=0){if(!m){k=(eu(l|0)|0)-(eu(i|0)|0)|0;if(k>>>0<=31){l=k+1|0;m=31-k|0;b=k-31>>31;j=l;a=h>>>(l>>>0)&b|i<<m;b=i>>>(l>>>0)&b;l=0;i=h<<m;break}if((f|0)==0){l=0;m=0;return(F=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;l=0;m=0;return(F=l,m)|0}l=k-1|0;if((l&k|0)!=0){m=(eu(k|0)|0)+33-(eu(i|0)|0)|0;p=64-m|0;k=32-m|0;n=k>>31;o=m-32|0;b=o>>31;j=m;a=k-1>>31&i>>>(o>>>0)|(i<<k|h>>>(m>>>0))&b;b=b&i>>>(m>>>0);l=h<<p&n;i=(i<<p|h>>>(o>>>0))&n|h<<k&m-33>>31;break}if((f|0)!=0){c[f>>2]=l&h;c[f+4>>2]=0}if((k|0)==1){o=j|b&0;p=a|0|0;return(F=o,p)|0}else{p=fu(k|0)|0;o=i>>>(p>>>0)|0;p=i<<32-p|h>>>(p>>>0)|0;return(F=o,p)|0}}else{if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(k>>>0);c[f+4>>2]=0}o=0;p=(i>>>0)/(k>>>0)>>>0;return(F=o,p)|0}if((h|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}o=0;p=(i>>>0)/(l>>>0)>>>0;return(F=o,p)|0}k=l-1|0;if((k&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=k&i|b&0}o=0;p=i>>>((fu(l|0)|0)>>>0);return(F=o,p)|0}k=(eu(l|0)|0)-(eu(i|0)|0)|0;if(k>>>0<=30){b=k+1|0;p=31-k|0;j=b;a=i<<p|h>>>(b>>>0);b=i>>>(b>>>0);l=0;i=h<<p;break}if((f|0)==0){o=0;p=0;return(F=o,p)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;o=0;p=0;return(F=o,p)|0}}while(0);if((j|0)==0){m=a;d=0;a=0}else{d=d|0|0;g=g|e&0;e=Yt(d,g,-1,-1)|0;h=F;k=b;m=a;a=0;while(1){b=l>>>31|i<<1;l=a|l<<1;i=m<<1|i>>>31|0;k=m>>>31|k<<1|0;Zt(e,h,i,k)|0;m=F;p=m>>31|((m|0)<0?-1:0)<<1;a=p&1;m=Zt(i,k,p&d,(((m|0)<0?-1:0)>>31|((m|0)<0?-1:0)<<1)&g)|0;k=F;j=j-1|0;if((j|0)==0){break}else{i=b}}i=b;b=k;d=0}g=0;if((f|0)!=0){c[f>>2]=m;c[f+4>>2]=b}o=(l|0)>>>31|(i|g)<<1|(g<<1|l>>>31)&0|d;p=(l<<1|0>>>31)&-2|a;return(F=o,p)|0}function nu(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return $b[a&63](b|0,c|0,d|0)|0}function ou(a,b,c){a=a|0;b=b|0;c=c|0;return ha(0,a|0,b|0,c|0)|0}function pu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(1,a|0,b|0,c|0)|0}function qu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(2,a|0,b|0,c|0)|0}function ru(a,b,c){a=a|0;b=b|0;c=c|0;return ha(3,a|0,b|0,c|0)|0}function su(a,b,c){a=a|0;b=b|0;c=c|0;return ha(4,a|0,b|0,c|0)|0}function tu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(5,a|0,b|0,c|0)|0}function uu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(6,a|0,b|0,c|0)|0}function vu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(7,a|0,b|0,c|0)|0}function wu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(8,a|0,b|0,c|0)|0}function xu(a,b,c){a=a|0;b=b|0;c=c|0;return ha(9,a|0,b|0,c|0)|0}function yu(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ac[a&31](b|0,c|0,d|0,e|0,f|0)}function zu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(0,a|0,b|0,c|0,d|0,e|0)}function Au(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(1,a|0,b|0,c|0,d|0,e|0)}function Bu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(2,a|0,b|0,c|0,d|0,e|0)}function Cu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(3,a|0,b|0,c|0,d|0,e|0)}function Du(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(4,a|0,b|0,c|0,d|0,e|0)}function Eu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(5,a|0,b|0,c|0,d|0,e|0)}function Fu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(6,a|0,b|0,c|0,d|0,e|0)}function Gu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(7,a|0,b|0,c|0,d|0,e|0)}function Hu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(8,a|0,b|0,c|0,d|0,e|0)}function Iu(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(9,a|0,b|0,c|0,d|0,e|0)}function Ju(a,b){a=a|0;b=b|0;bc[a&127](b|0)}function Ku(a){a=a|0;ha(0,a|0)}function Lu(a){a=a|0;ha(1,a|0)}function Mu(a){a=a|0;ha(2,a|0)}function Nu(a){a=a|0;ha(3,a|0)}function Ou(a){a=a|0;ha(4,a|0)}function Pu(a){a=a|0;ha(5,a|0)}function Qu(a){a=a|0;ha(6,a|0)}function Ru(a){a=a|0;ha(7,a|0)}function Su(a){a=a|0;ha(8,a|0)}function Tu(a){a=a|0;ha(9,a|0)}function Uu(a,b,c){a=a|0;b=b|0;c=c|0;cc[a&63](b|0,c|0)}function Vu(a,b){a=a|0;b=b|0;ha(0,a|0,b|0)}function Wu(a,b){a=a|0;b=b|0;ha(1,a|0,b|0)}function Xu(a,b){a=a|0;b=b|0;ha(2,a|0,b|0)}function Yu(a,b){a=a|0;b=b|0;ha(3,a|0,b|0)}function Zu(a,b){a=a|0;b=b|0;ha(4,a|0,b|0)}function _u(a,b){a=a|0;b=b|0;ha(5,a|0,b|0)}function $u(a,b){a=a|0;b=b|0;ha(6,a|0,b|0)}function av(a,b){a=a|0;b=b|0;ha(7,a|0,b|0)}function bv(a,b){a=a|0;b=b|0;ha(8,a|0,b|0)}function cv(a,b){a=a|0;b=b|0;ha(9,a|0,b|0)}function dv(a,b){a=a|0;b=b|0;return dc[a&1023](b|0)|0}function ev(a){a=a|0;return ha(0,a|0)|0}function fv(a){a=a|0;return ha(1,a|0)|0}function gv(a){a=a|0;return ha(2,a|0)|0}function hv(a){a=a|0;return ha(3,a|0)|0}function iv(a){a=a|0;return ha(4,a|0)|0}function jv(a){a=a|0;return ha(5,a|0)|0}function kv(a){a=a|0;return ha(6,a|0)|0}function lv(a){a=a|0;return ha(7,a|0)|0}function mv(a){a=a|0;return ha(8,a|0)|0}function nv(a){a=a|0;return ha(9,a|0)|0}function ov(a){a=a|0;ec[a&31]()}function pv(){ha(0)}function qv(){ha(1)}function rv(){ha(2)}function sv(){ha(3)}function tv(){ha(4)}function uv(){ha(5)}function vv(){ha(6)}function wv(){ha(7)}function xv(){ha(8)}function yv(){ha(9)}function zv(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return fc[a&31](b|0,c|0,d|0,e|0)|0}function Av(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(0,a|0,b|0,c|0,d|0)|0}function Bv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(1,a|0,b|0,c|0,d|0)|0}function Cv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(2,a|0,b|0,c|0,d|0)|0}function Dv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(3,a|0,b|0,c|0,d|0)|0}function Ev(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(4,a|0,b|0,c|0,d|0)|0}function Fv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(5,a|0,b|0,c|0,d|0)|0}function Gv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(6,a|0,b|0,c|0,d|0)|0}function Hv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(7,a|0,b|0,c|0,d|0)|0}function Iv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(8,a|0,b|0,c|0,d|0)|0}function Jv(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha(9,a|0,b|0,c|0,d|0)|0}function Kv(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;gc[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function Lv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(0,a|0,b|0,c|0,d|0,e|0,f|0)}function Mv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(1,a|0,b|0,c|0,d|0,e|0,f|0)}function Nv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(2,a|0,b|0,c|0,d|0,e|0,f|0)}function Ov(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(3,a|0,b|0,c|0,d|0,e|0,f|0)}function Pv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(4,a|0,b|0,c|0,d|0,e|0,f|0)}function Qv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(5,a|0,b|0,c|0,d|0,e|0,f|0)}function Rv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(6,a|0,b|0,c|0,d|0,e|0,f|0)}function Sv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(7,a|0,b|0,c|0,d|0,e|0,f|0)}function Tv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(8,a|0,b|0,c|0,d|0,e|0,f|0)}function Uv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(9,a|0,b|0,c|0,d|0,e|0,f|0)}function Vv(a,b,c){a=a|0;b=b|0;c=c|0;return hc[a&63](b|0,c|0)|0}function Wv(a,b){a=a|0;b=b|0;return ha(0,a|0,b|0)|0}function Xv(a,b){a=a|0;b=b|0;return ha(1,a|0,b|0)|0}function Yv(a,b){a=a|0;b=b|0;return ha(2,a|0,b|0)|0}function Zv(a,b){a=a|0;b=b|0;return ha(3,a|0,b|0)|0}function _v(a,b){a=a|0;b=b|0;return ha(4,a|0,b|0)|0}function $v(a,b){a=a|0;b=b|0;return ha(5,a|0,b|0)|0}function aw(a,b){a=a|0;b=b|0;return ha(6,a|0,b|0)|0}function bw(a,b){a=a|0;b=b|0;return ha(7,a|0,b|0)|0}function cw(a,b){a=a|0;b=b|0;return ha(8,a|0,b|0)|0}function dw(a,b){a=a|0;b=b|0;return ha(9,a|0,b|0)|0}function ew(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ic[a&31](b|0,c|0,d|0,e|0)}function fw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(0,a|0,b|0,c|0,d|0)}function gw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(1,a|0,b|0,c|0,d|0)}function hw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(2,a|0,b|0,c|0,d|0)}function iw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(3,a|0,b|0,c|0,d|0)}function jw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(4,a|0,b|0,c|0,d|0)}function kw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(5,a|0,b|0,c|0,d|0)}function lw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(6,a|0,b|0,c|0,d|0)}function mw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(7,a|0,b|0,c|0,d|0)}function nw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(8,a|0,b|0,c|0,d|0)}function ow(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(9,a|0,b|0,c|0,d|0)}function pw(a,b,c){a=a|0;b=b|0;c=c|0;ca(0);return 0}function qw(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ca(1)}function rw(a){a=a|0;ca(2)}function sw(a,b){a=a|0;b=b|0;ca(3)}function tw(a){a=a|0;ca(4);return 0}function uw(){ca(5)}function vw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ca(6);return 0}function ww(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ca(7)}function xw(a,b){a=a|0;b=b|0;ca(8);return 0}function yw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ca(9)}




// EMSCRIPTEN_END_FUNCS
var $b=[pw,pw,ou,pw,pu,pw,qu,pw,ru,pw,su,pw,tu,pw,uu,pw,vu,pw,wu,pw,xu,pw,Tc,Uc,hg,cg,zg,nd,pd,vd,wd,zd,Ad,Eg,Fg,Gd,Qg,Ug,Vg,jr,mr,st,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw,pw];var ac=[qw,qw,zu,qw,Au,qw,Bu,qw,Cu,qw,Du,qw,Eu,qw,Fu,qw,Gu,qw,Hu,qw,Iu,qw,xt,wt,qw,qw,qw,qw,qw,qw,qw,qw];var bc=[rw,rw,Ku,rw,Lu,rw,Mu,rw,Nu,rw,Ou,rw,Pu,rw,Qu,rw,Ru,rw,Su,rw,Tu,rw,sf,tf,eg,fg,ig,jg,ng,og,sg,tg,wg,xg,sd,rd,If,Jf,Lf,Mf,Bg,Cg,Vf,Wf,Hg,Ig,Ng,Og,Rg,Sg,Rd,He,Ke,Xe,bf,cf,df,ef,ff,hf,rf,Ff,Gf,hd,jd,ld,As,Ns,Ss,nt,qt,ot,pt,rt,It,Ht,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw,rw];var cc=[sw,sw,Vu,sw,Wu,sw,Xu,sw,Yu,sw,Zu,sw,_u,sw,$u,sw,av,sw,bv,sw,cv,sw,uf,zf,Af,ag,kg,lg,pg,qg,rg,ug,yg,Hf,Kf,Nf,Sf,Dg,Xf,Jg,Tg,Er,Fr,Gr,Hr,Ir,Jr,Kr,Lr,Mr,Nr,Or,Pr,Qr,sw,sw,sw,sw,sw,sw,sw,sw,sw,sw];var dc=[tw,tw,ev,tw,fv,tw,gv,tw,hv,tw,iv,tw,jv,tw,kv,tw,lv,tw,mv,tw,nv,tw,vf,wf,Bf,Cf,Ef,Yf,Zf,bg,Uf,mg,vg,bd,Ag,Of,Pf,Tf,Kg,Jt,Sr,Tr,Ur,Vr,Wr,Xr,Yr,Zr,_r,$r,as,bs,cs,ds,es,fs,gs,hs,is,js,ks,ls,ms,ns,os,zr,Ar,Br,Cr,Dr,xr,yr,Ue,nr,or,pr,qr,rr,sr,tr,ur,vr,wr,gr,Uq,Vq,Wq,Xq,Yq,Zq,_q,$q,ar,br,cr,dr,er,fr,qj,rj,sj,tj,uj,vj,wj,xj,yj,zj,Aj,Bj,Cj,Dj,Ej,Fj,Gj,Hj,Ij,Jj,Kj,Lj,Mj,Nj,Oj,Pj,Qj,Rj,Sj,Tj,Uj,Vj,Wj,Xj,Yj,Zj,_j,$j,ak,bk,ck,dk,ek,fk,gk,hk,ik,jk,kk,lk,mk,nk,ok,pk,qk,rk,sk,tk,uk,vk,wk,xk,yk,zk,Ak,Bk,Ck,Dk,Ek,Fk,Gk,Hk,Ik,Jk,Kk,Lk,Mk,Nk,Ok,Pk,Qk,Rk,Sk,Tk,Uk,Vk,Wk,Xk,Yk,Zk,_k,$k,al,bl,cl,dl,el,fl,gl,hl,il,jl,kl,ll,ml,nl,ol,pl,ql,rl,sl,tl,ul,vl,wl,xl,yl,zl,Al,Bl,Cl,Dl,El,Fl,Gl,Hl,Il,Jl,Kl,Ll,Ml,Nl,Ol,Pl,Ql,Rl,Sl,Tl,Ul,Vl,Wl,Xl,Yl,Zl,_l,$l,am,bm,cm,dm,em,fm,gm,hm,im,jm,km,lm,mm,nm,om,pm,qm,rm,sm,tm,um,vm,wm,xm,ym,zm,Am,Bm,Cm,Dm,Em,Fm,Gm,Hm,Im,Jm,Km,Lm,Mm,Nm,Om,Pm,Qm,Rm,Sm,Tm,Um,Vm,Wm,Xm,Ym,Zm,_m,$m,an,bn,cn,dn,en,fn,gn,hn,jn,kn,ln,mn,nn,on,pn,qn,rn,sn,tn,un,vn,wn,xn,yn,zn,An,Bn,Cn,Dn,En,Fn,Gn,Hn,In,Jn,Kn,Ln,Mn,Nn,On,Pn,Qn,Rn,Sn,Tn,Un,Vn,Wn,Xn,Yn,Zn,_n,$n,ao,bo,co,eo,fo,go,ho,io,jo,ko,lo,mo,no,oo,po,qo,ro,so,to,uo,vo,wo,xo,yo,zo,Ao,Bo,Co,Do,Eo,Fo,Go,Ho,Io,Jo,Ko,Lo,Mo,No,Oo,Po,Qo,Ro,So,To,Uo,Vo,Wo,Xo,Yo,Zo,_o,$o,ap,bp,cp,dp,ep,fp,gp,hp,ip,jp,kp,lp,mp,np,op,pp,qp,rp,sp,tp,up,vp,wp,xp,yp,zp,Ap,Bp,Cp,Dp,Ep,Fp,Gp,Hp,Ip,Jp,Kp,Lp,Mp,Np,Op,Pp,Qp,Rp,Sp,Tp,Up,Vp,Wp,Xp,Yp,Zp,_p,$p,aq,bq,cq,dq,eq,fq,gq,hq,iq,jq,kq,lq,mq,nq,oq,pq,qq,rq,sq,tq,uq,vq,wq,xq,yq,zq,Aq,Bq,Cq,Dq,Eq,Fq,Gq,Hq,Iq,Jq,Kq,Lq,Mq,Nq,Oq,Pq,Qq,Rq,Sq,Tq,zi,Ai,Bi,Ci,Di,Ei,Fi,Gi,Hi,Ii,Ji,Ki,Li,Mi,Ni,Oi,Pi,Qi,Ri,Si,Ti,Ui,Vi,Wi,Xi,Yi,Zi,_i,$i,aj,bj,cj,dj,ej,fj,gj,hj,ij,jj,kj,Jh,Kh,Lh,Mh,Nh,Oh,Ph,Qh,Rh,Sh,Th,Uh,Vh,Wh,Xh,Yh,Zh,_h,$h,ai,bi,ci,di,ei,fi,gi,hi,ii,ji,ki,li,mi,ni,oi,pi,qi,ri,si,ti,ui,Bh,Ch,Dh,Eh,Fh,gf,Gh,Hh,Ih,$g,ah,bh,jf,ch,dh,eh,fh,gh,hh,ih,jh,kh,mf,lf,nf,lh,pf,qf,of,mh,nh,oh,ph,qh,rh,sh,th,uh,vh,wh,xh,yh,zh,Ah,Bs,Cs,Ds,Es,Fs,Gs,Hs,Is,Js,Ks,Ls,Ms,Os,Ps,Qs,Ts,Rs,Us,Vs,Ws,Xs,Ys,Zs,_s,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw,tw];var ec=[uw,uw,pv,uw,qv,uw,rv,uw,sv,uw,tv,uw,uv,uw,vv,uw,wv,uw,xv,uw,yv,uw,uw,uw,uw,uw,uw,uw,uw,uw,uw,uw];var fc=[vw,vw,Av,vw,Bv,vw,Cv,vw,Dv,vw,Ev,vw,Fv,vw,Gv,vw,Hv,vw,Iv,vw,Jv,vw,hr,ir,kr,lr,vw,vw,vw,vw,vw,vw];var gc=[ww,ww,Lv,ww,Mv,ww,Nv,ww,Ov,ww,Pv,ww,Qv,ww,Rv,ww,Sv,ww,Tv,ww,Uv,ww,zt,yt,ww,ww,ww,ww,ww,ww,ww,ww];var hc=[xw,xw,Wv,xw,Xv,xw,Yv,xw,Zv,xw,_v,xw,$v,xw,aw,xw,bw,xw,cw,xw,dw,xw,xf,yf,Df,Vc,_f,$f,gg,dg,cd,dd,qd,od,ud,xd,Qf,Rf,Dd,Bd,Gg,Fd,Lg,Mg,Pg,Wg,gd,id,kd,xw,xw,xw,xw,xw,xw,xw,xw,xw,xw,xw,xw,xw,xw,xw];var ic=[yw,yw,fw,yw,gw,yw,hw,yw,iw,yw,jw,yw,kw,yw,lw,yw,mw,yw,nw,yw,ow,yw,tt,ut,yw,yw,yw,yw,yw,yw,yw,yw];return{_strlen:Xt,_free:Bt,_rand_r:Vt,_EggShell_ExecuteSlices:ct,_EggShell_Create:at,_i64Add:Yt,_memmove:au,_EggShell_REPL:bt,_realloc:Ct,_i64Subtract:Zt,_memset:bu,_malloc:At,_memcpy:$t,_Vireo_Version:$s,_EggShell_Delete:dt,_bitshift64Lshr:_t,_rand:Wt,_bitshift64Shl:cu,runPostSets:Ut,stackAlloc:jc,stackSave:kc,stackRestore:lc,setThrew:mc,setTempRet0:pc,setTempRet1:qc,setTempRet2:rc,setTempRet3:sc,setTempRet4:tc,setTempRet5:uc,setTempRet6:vc,setTempRet7:wc,setTempRet8:xc,setTempRet9:yc,dynCall_iiii:nu,dynCall_viiiii:yu,dynCall_vi:Ju,dynCall_vii:Uu,dynCall_ii:dv,dynCall_v:ov,dynCall_iiiii:zv,dynCall_viiiiii:Kv,dynCall_iii:Vv,dynCall_viiii:ew}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "jsCall": jsCall, "invoke_iiii": invoke_iiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iiiii": invoke_iiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_viiii": invoke_viiii, "_fabs": _fabs, "_exp": _exp, "_sqrtf": _sqrtf, "__ZSt9terminatev": __ZSt9terminatev, "___cxa_guard_acquire": ___cxa_guard_acquire, "__reallyNegative": __reallyNegative, "_fstat": _fstat, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_ceilf": _ceilf, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sinh": _sinh, "_sysconf": _sysconf, "_close": _close, "_tanf": _tanf, "_cos": _cos, "_puts": _puts, "___resumeException": ___resumeException, "_write": _write, "_expf": _expf, "__ZNSt9exceptionD2Ev": __ZNSt9exceptionD2Ev, "___cxa_does_inherit": ___cxa_does_inherit, "_send": _send, "_hypot": _hypot, "_log2": _log2, "_atan2": _atan2, "___cxa_is_number_type": ___cxa_is_number_type, "_atan2f": _atan2f, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "___cxa_guard_release": ___cxa_guard_release, "___setErrNo": ___setErrNo, "_llvm_pow_f32": _llvm_pow_f32, "_unlink": _unlink, "_srand": _srand, "_atanf": _atanf, "_printf": _printf, "_logf": _logf, "_emscripten_get_now": _emscripten_get_now, "_stat": _stat, "_read": _read, "_fwrite": _fwrite, "_time": _time, "_fprintf": _fprintf, "_gettimeofday": _gettimeofday, "_log10": _log10, "_exit": _exit, "_llvm_pow_f64": _llvm_pow_f64, "_fmod": _fmod, "_lseek": _lseek, "_rmdir": _rmdir, "___cxa_allocate_exception": ___cxa_allocate_exception, "_asin": _asin, "_sbrk": _sbrk, "_pwrite": _pwrite, "_cosf": _cosf, "_open": _open, "_fabsf": _fabsf, "_remove": _remove, "_snprintf": _snprintf, "_sinf": _sinf, "_floorf": _floorf, "_log": _log, "_recv": _recv, "_tan": _tan, "_abort": _abort, "_ceil": _ceil, "_isspace": _isspace, "_floor": _floor, "_sin": _sin, "_acosf": _acosf, "_acos": _acos, "_cosh": _cosh, "_fmax": _fmax, "_fflush": _fflush, "_asinf": _asinf, "_fileno": _fileno, "__exit": __exit, "_atan": _atan, "_fputs": _fputs, "_pread": _pread, "_mkport": _mkport, "___errno_location": ___errno_location, "_copysign": _copysign, "_fputc": _fputc, "___cxa_throw": ___cxa_throw, "__formatString": __formatString, "_rint": _rint, "_sqrt": _sqrt, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "___rand_seed": ___rand_seed, "NaN": NaN, "Infinity": Infinity, "__ZTISt9exception": __ZTISt9exception }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _rand_r = Module["_rand_r"] = asm["_rand_r"];
var _EggShell_ExecuteSlices = Module["_EggShell_ExecuteSlices"] = asm["_EggShell_ExecuteSlices"];
var _EggShell_Create = Module["_EggShell_Create"] = asm["_EggShell_Create"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _EggShell_REPL = Module["_EggShell_REPL"] = asm["_EggShell_REPL"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _Vireo_Version = Module["_Vireo_Version"] = asm["_Vireo_Version"];
var _EggShell_Delete = Module["_EggShell_Delete"] = asm["_EggShell_Delete"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _rand = Module["_rand"] = asm["_rand"];
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






