// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? (currObj[subNamespace] = nextValue) : currObj[subNamespace];
        }, root);
    };

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a named module.
        define(globalName, [], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        buildGlobalNamespace();
    }
}(this, 'NationalInstruments.Vireo.Core.assignTypeHelpers', function () {
    'use strict';

    var assignTypeHelpers = function (Module) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'TypeRef_Name',
            'TypeRef_ElementName'
        ]}], */
        Module.typeHelpers = {};

        var TypeRef_Name = Module.cwrap('TypeRef_Name', 'string', ['number']);
        var TypeRef_ElementName = Module.cwrap('TypeRef_ElementName', 'string', ['number']);

        // Private instance functions
        var validateVisitMethod = function (fn, fnName) {
            if (typeof fn !== 'function') {
                throw new Error('Visitor must have a method named `' + fnName + '`. Found: ' + fn);
            }
        };

        var dispatchVisitBoolean = function (typeVisitor, valueRef, data) {
            var visitFn = typeVisitor.visitBoolean;
            validateVisitMethod(visitFn, 'visitBoolean');
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitEnum = function (typeVisitor, valueRef, data) {
            var sizeOfEnum = Module.typeHelpers.topAQSize(valueRef.typeRef);
            var visitFn = undefined;
            var fnName = '';
            switch (sizeOfEnum) {
            case 1:
                visitFn = typeVisitor.visitEnum8;
                fnName = 'visitEnum8';
                break;
            case 2:
                visitFn = typeVisitor.visitEnum16;
                fnName = 'visitEnum16';
                break;
            case 4:
                visitFn = typeVisitor.visitEnum32;
                fnName = 'visitEnum32';
                break;
            default:
                throw new Error('Unexpected size for Enum. Found: ' + sizeOfEnum);
            }

            validateVisitMethod(visitFn, fnName);
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitInteger = function (typeVisitor, valueRef, data) {
            var typeRef = valueRef.typeRef;
            var isSignedInteger = Module.typeHelpers.isSigned(typeRef);
            var sizeOfInteger = Module.typeHelpers.topAQSize(typeRef);
            var visitFn = undefined;
            var fnName = '';
            if (isSignedInteger === true) {
                switch (sizeOfInteger) {
                case 1:
                    visitFn = typeVisitor.visitInt8;
                    fnName = 'visitInt8';
                    break;
                case 2:
                    visitFn = typeVisitor.visitInt16;
                    fnName = 'visitInt16';
                    break;
                case 4:
                    visitFn = typeVisitor.visitInt32;
                    fnName = 'visitInt32';
                    break;
                case 8:
                    visitFn = typeVisitor.visitInt64;
                    fnName = 'visitInt64';
                    break;
                default:
                    throw new Error('Unexpected size for Integer. Found: ' + sizeOfInteger);
                }
            } else {
                switch (sizeOfInteger) {
                case 1:
                    visitFn = typeVisitor.visitUInt8;
                    fnName = 'visitUInt8';
                    break;
                case 2:
                    visitFn = typeVisitor.visitUInt16;
                    fnName = 'visitUInt16';
                    break;
                case 4:
                    visitFn = typeVisitor.visitUInt32;
                    fnName = 'visitUInt32';
                    break;
                case 8:
                    visitFn = typeVisitor.visitUInt64;
                    fnName = 'visitUInt64';
                    break;
                default:
                    throw new Error('Unexpected size for Unsigned Integer. Found: ' + sizeOfInteger);
                }
            }

            validateVisitMethod(visitFn, fnName);
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitFloat = function (typeVisitor, valueRef, data) {
            var typeRef = valueRef.typeRef;
            var sizeOfFloat = Module.typeHelpers.topAQSize(typeRef);
            var visitFn;
            var fnName = '';
            switch (sizeOfFloat) {
            case 4:
                visitFn = typeVisitor.visitSingle;
                fnName = 'visitSingle';
                break;
            case 8:
                visitFn = typeVisitor.visitDouble;
                fnName = 'visitDouble';
                break;
            default:
                throw new Error('Unexpected size for a Float value. Found: ' + sizeOfFloat);
            }

            validateVisitMethod(visitFn, fnName);
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitString = function (typeVisitor, valueRef, data) {
            var visitFn = typeVisitor.visitString;
            validateVisitMethod(visitFn, 'visitString');
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitComplex = function (typeVisitor, valueRef, data) {
            var typeRef = valueRef.typeRef,
                sizeOfComplex = Module.typeHelpers.topAQSize(typeRef),
                visitFn,
                fnName;
            switch (sizeOfComplex) {
            case 8:
                visitFn = typeVisitor.visitComplexSingle;
                fnName = 'visitComplexSingle';
                break;
            case 16:
                visitFn = typeVisitor.visitComplexDouble;
                fnName = 'visitComplexDouble';
                break;
            default:
                throw new Error('Unexpected size for a Complex value. Found: ' + sizeOfComplex);
            }

            validateVisitMethod(visitFn, fnName);
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitAnalogWaveform = function (typeVisitor, valueRef, data) {
            var visitFn = typeVisitor.visitAnalogWaveform;
            validateVisitMethod(visitFn, 'visitAnalogWaveform');
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitTimestamp = function (typeVisitor, valueRef, data) {
            var visitFn = typeVisitor.visitTimestamp;
            validateVisitMethod(visitFn, 'visitTimestamp');
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitPath = function (typeVisitor, valueRef, data) {
            var visitFn = typeVisitor.visitPath;
            validateVisitMethod(visitFn, 'visitPath');
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitArray = function (typeVisitor, valueRef, data) {
            var visitFn = typeVisitor.visitArray;
            validateVisitMethod(visitFn, 'visitArray');
            return visitFn.call(typeVisitor, valueRef, data);
        };

        var dispatchVisitCluster = function (typeVisitor, valueRef, data) {
            var visitFn = typeVisitor.visitCluster;
            validateVisitMethod(visitFn, 'visitCluster');
            return visitFn.call(typeVisitor, valueRef, data);
        };

        // Exported functions
        Module.typeHelpers.topAQSize = function (typeRef) {
            return Module._TypeRef_TopAQSize(typeRef);
        };

        Module.typeHelpers.typeName = function (typeRef) {
            return TypeRef_Name(Module.eggShell.v_userShell, typeRef);
        };

        Module.typeHelpers.typeRank = function (typeRef) {
            return Module._TypeRef_Rank(typeRef);
        };

        Module.typeHelpers.elementName = function (typeRef) {
            return TypeRef_ElementName(Module.eggShell.v_userShell, typeRef);
        };

        Module.typeHelpers.subElementCount = function (typeRef) {
            return Module._TypeRef_SubElementCount(typeRef);
        };

        Module.typeHelpers.subElementByIndex = function (typeRef, index) {
            return Module._TypeRef_GetSubElementByIndex(typeRef, index);
        };

        Module.typeHelpers.isCluster = function (typeRef) {
            return Module._TypeRef_IsCluster(typeRef) !== 0;
        };

        Module.typeHelpers.isArray = function (typeRef) {
            return Module._TypeRef_IsArray(typeRef) !== 0;
        };

        Module.typeHelpers.isBoolean = function (typeRef) {
            return Module._TypeRef_IsBoolean(typeRef) !== 0;
        };

        Module.typeHelpers.isInteger = function (typeRef) {
            return Module._TypeRef_IsInteger(typeRef) !== 0;
        };

        Module.typeHelpers.isSigned = function (typeRef) {
            return Module._TypeRef_IsSigned(typeRef) !== 0;
        };

        Module.typeHelpers.isEnum = function (typeRef) {
            return Module._TypeRef_IsEnum(typeRef) !== 0;
        };

        Module.typeHelpers.isFloat = function (typeRef) {
            return Module._TypeRef_IsFloat(typeRef) !== 0;
        };

        Module.typeHelpers.isString = function (typeRef) {
            return Module._TypeRef_IsString(typeRef) !== 0;
        };

        Module.typeHelpers.isPath = function (typeRef) {
            return Module._TypeRef_IsPath(typeRef) !== 0;
        };

        Module.typeHelpers.isTimestamp = function (typeRef) {
            return Module._TypeRef_IsTimestamp(typeRef) !== 0;
        };

        Module.typeHelpers.isComplex = function (typeRef) {
            return Module._TypeRef_IsComplex(typeRef) !== 0;
        };

        Module.typeHelpers.isAnalogWaveform = function (typeRef) {
            return Module._TypeRef_IsAnalogWaveform(typeRef) !== 0;
        };

        var typeHandlers = [
            {
                typeChecker: Module.typeHelpers.isBoolean,
                dispatcher: dispatchVisitBoolean
            },
            {
                // Enum is wrapping an integer, so it needs to be evaluated first.
                typeChecker: Module.typeHelpers.isEnum,
                dispatcher: dispatchVisitEnum
            },
            {
                typeChecker: Module.typeHelpers.isInteger,
                dispatcher: dispatchVisitInteger
            },
            {
                typeChecker: Module.typeHelpers.isFloat,
                dispatcher: dispatchVisitFloat
            },
            {
                // String is an array of UTF-8 chars so it is evaluated before array.
                typeChecker: Module.typeHelpers.isString,
                dispatcher: dispatchVisitString
            },
            {
                typeChecker: Module.typeHelpers.isComplex,
                dispatcher: dispatchVisitComplex
            },
            {
                typeChecker: Module.typeHelpers.isAnalogWaveform,
                dispatcher: dispatchVisitAnalogWaveform
            },
            {
                typeChecker: Module.typeHelpers.isTimestamp,
                dispatcher: dispatchVisitTimestamp
            },
            {
                typeChecker: Module.typeHelpers.isPath,
                dispatcher: dispatchVisitPath
            },
            {
                typeChecker: Module.typeHelpers.isArray,
                dispatcher: dispatchVisitArray
            },
            {
                // Cluster is evaluated last because Complex, AnalogWaveform, Path and Timestamps
                // are internally also clusters.
                typeChecker: Module.typeHelpers.isCluster,
                dispatcher: dispatchVisitCluster
            }
        ];

        Module.typeHelpers.findTypeDispatcher = function (typeRef) {
            var i = 0,
                typeHandler;

            for (i = 0; i < typeHandlers.length; i += 1) {
                typeHandler = typeHandlers[i];
                if (typeHandler.typeChecker(typeRef) === true) {
                    return typeHandler.dispatcher;
                }
            }
            return undefined;
        };
    };

    return assignTypeHelpers;
}));
